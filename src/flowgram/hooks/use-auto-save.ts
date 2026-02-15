/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { debounce } from 'lodash-es';

import { getWorkflowApi, SaveStatus } from '../services/workflow-api';
import { FlowDocumentJSON } from '../typings';

export interface AutoSaveOptions {
  /** 工作流 ID */
  workflowId?: string | null;
  /** 工作流名称 */
  workflowName?: string;
  /** 工作流描述 */
  workflowDescription?: string;
  /** 工作流图标 */
  workflowIcon?: string;
  /** 工作流标签 */
  workflowTags?: string[];
  /** 防抖延迟（毫秒），默认 2000 */
  delay?: number;
  /** 是否启用自动保存，默认 true */
  enabled?: boolean;
  /** 保存成功后的回调，参数为新创建的 workflowId（仅首次创建时） */
  onWorkflowCreated?: (workflowId: string) => void;
}

export interface AutoSaveReturn {
  /** 保存状态 */
  saveStatus: SaveStatus;
  /** 最后一次错误 */
  lastError: string | null;
  /** 手动保存 */
  manualSave: () => Promise<boolean>;
  /** 设置工作流 ID */
  setWorkflowId: (id: string | null) => void;
  /** 设置工作流名称 */
  setWorkflowName: (name: string) => void;
  /** 设置工作流描述 */
  setWorkflowDescription: (description: string) => void;
  /** 设置工作流图标 */
  setWorkflowIcon: (icon: string) => void;
  /** 最后保存时间 */
  lastSavedAt: Date | null;
}

interface MetadataRef {
  workflowId: string | null;
  workflowName: string;
  workflowDescription: string;
  workflowIcon: string;
  workflowTags: string[];
}

/**
 * 自动保存 Hook
 *
 * 用于在工作流数据变化时自动保存到后端
 */
export function useAutoSave(
  data: FlowDocumentJSON | null,
  options: AutoSaveOptions = {}
): AutoSaveReturn {
  const {
    workflowId: initialWorkflowId = null,
    workflowName: initialName = '未命名工作流',
    workflowDescription: initialDescription = '',
    workflowIcon: initialIcon = '',
    workflowTags = [],
    delay = 2000,
    enabled = true,
    onWorkflowCreated,
  } = options;

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // 使用 ref 保存最新的 metadata，避免闭包问题
  const metadataRef = useRef<MetadataRef>({
    workflowId: initialWorkflowId,
    workflowName: initialName,
    workflowDescription: initialDescription,
    workflowIcon: initialIcon,
    workflowTags,
  });

  // 使用 state 来触发 UI 更新
  const [, forceUpdate] = useState({});

  const apiRef = useRef(getWorkflowApi());
  const savingRef = useRef(false);

  // 更新 ref 并触发重新渲染的 setters
  const setWorkflowId = useCallback((id: string | null) => {
    metadataRef.current.workflowId = id;
    forceUpdate({});
  }, []);

  const setWorkflowName = useCallback((name: string) => {
    metadataRef.current.workflowName = name;
    forceUpdate({});
  }, []);

  const setWorkflowDescription = useCallback((description: string) => {
    metadataRef.current.workflowDescription = description;
    forceUpdate({});
  }, []);

  const setWorkflowIcon = useCallback((icon: string) => {
    metadataRef.current.workflowIcon = icon;
    forceUpdate({});
  }, []);

  /**
   * 执行保存操作 - 使用 ref 获取最新值
   */
  const performSave = useCallback(async (dataToSave: FlowDocumentJSON | null): Promise<boolean> => {
    if (savingRef.current || !dataToSave) {
      return false;
    }

    savingRef.current = true;
    setSaveStatus('saving');
    setLastError(null);

    // 从 ref 获取最新值
    const { workflowId, workflowName, workflowDescription, workflowIcon, workflowTags } = metadataRef.current;

    const api = apiRef.current;
    const result = await api.saveWorkflow(workflowId, dataToSave, {
      name: workflowName,
      description: workflowDescription,
      icon: workflowIcon,
      tags: workflowTags,
    });

    savingRef.current = false;

    if (result.success) {
      setSaveStatus('saved');
      setLastError(null);
      setLastSavedAt(new Date());

      // 如果是新创建的工作流，更新 ID
      if (!workflowId && result.data?.id) {
        metadataRef.current.workflowId = result.data.id;
        forceUpdate({});
        // 调用回调通知外部
        onWorkflowCreated?.(result.data.id);
      }

      // 1.5秒后重置为 idle
      setTimeout(() => {
        setSaveStatus('idle');
      }, 1500);

      return true;
    } else {
      setSaveStatus('error');
      setLastError(result.error || null);
      return false;
    }
  }, []); // 移除依赖，因为使用 ref 获取最新值

  /**
   * 防抖保存函数
   */
  const debouncedSaveRef = useRef(
    debounce((dataToSave: FlowDocumentJSON) => {
      if (enabled && dataToSave) {
        performSave(dataToSave);
      }
    }, delay)
  );

  /**
   * 手动保存
   */
  const manualSave = useCallback(async (): Promise<boolean> => {
    return await performSave(data);
  }, [data, performSave]);

  // 监听数据变化，触发自动保存
  useEffect(() => {
    if (enabled && data) {
      debouncedSaveRef.current(data);
    }

    return () => {
      debouncedSaveRef.current.cancel();
    };
  }, [data, enabled]);

  // 监听 API 状态变化
  useEffect(() => {
    const api = apiRef.current;
    const checkStatus = () => {
      setSaveStatus(api.getSaveStatus());
      setLastError(api.getLastError());
    };

    const interval = setInterval(checkStatus, 100);

    return () => clearInterval(interval);
  }, []);

  return {
    saveStatus,
    lastError,
    manualSave,
    setWorkflowId,
    setWorkflowName,
    setWorkflowDescription,
    setWorkflowIcon,
    lastSavedAt,
  };
}
