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
  /** 工作流标签 */
  workflowTags?: string[];
  /** 防抖延迟（毫秒），默认 2000 */
  delay?: number;
  /** 是否启用自动保存，默认 true */
  enabled?: boolean;
  /** API 基础 URL */
  apiBaseUrl?: string;
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
    workflowName = '未命名工作流',
    workflowDescription = '',
    workflowTags = [],
    delay = 2000,
    enabled = true,
    apiBaseUrl = '/api',
  } = options;

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastError, setLastError] = useState<string | null>(null);
  const [workflowId, setWorkflowId] = useState<string | null>(initialWorkflowId);

  const apiRef = useRef(getWorkflowApi(apiBaseUrl));
  const savingRef = useRef(false);

  /**
   * 执行保存操作
   */
  const performSave = useCallback(async (dataToSave: FlowDocumentJSON): Promise<boolean> => {
    if (savingRef.current) {
      return false;
    }

    savingRef.current = true;
    setSaveStatus('saving');
    setLastError(null);

    const api = apiRef.current;
    const result = await api.saveWorkflow(workflowId, dataToSave, {
      name: workflowName,
      description: workflowDescription,
      tags: workflowTags,
    });

    savingRef.current = false;

    if (result.success) {
      setSaveStatus('saved');
      setLastError(null);

      // 如果是新创建的工作流，更新 ID
      if (!workflowId && result.data?.id) {
        setWorkflowId(result.data.id);
      }

      return true;
    } else {
      setSaveStatus('error');
      setLastError(result.error || null);
      return false;
    }
  }, [workflowId, workflowName, workflowDescription, workflowTags]);

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
    if (data) {
      return await performSave(data);
    }
    return false;
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
  };
}
