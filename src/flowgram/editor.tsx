/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { DockedPanelLayer } from '@flowgram.ai/panel-manager-plugin';
import { EditorRenderer, FreeLayoutEditorProvider, useService, WorkflowDocument } from '@flowgram.ai/free-layout-editor';
import { ConfigProvider, Spin, Toast } from '@douyinfe/semi-ui';

import '@flowgram.ai/free-layout-editor/index.css';
import './styles/index.css';
import { nodeRegistries } from './nodes';
import { getEmptyInitialData } from './initial-data';
import { useEditorProps } from './hooks';
import { useAutoSave } from './hooks/use-auto-save';
import { getWorkflowApi, SaveStatus, WorkflowVersion } from './services/workflow-api';

/**
 * 全局工作流上下文 - 用于在组件间共享状态
 */
export interface WorkflowContext {
  workflowId: string | null;
  workflowName: string;
  workflowDescription: string;
  workflowIcon: string;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  lastError: string | null;
  versions: WorkflowVersion[];
  manualSave: () => Promise<boolean>;
  updateInfo: (name: string, description: string, icon?: string) => void;
  publish: (description?: string) => Promise<boolean>;
  loadVersions: () => Promise<void>;
}

// 全局工作流上下文
let workflowContextCallbacks: Set<(ctx: WorkflowContext) => void> = new Set();
let currentWorkflowContext: WorkflowContext = {
  workflowId: null,
  workflowName: '未命名工作流',
  workflowDescription: '',
  workflowIcon: '',
  saveStatus: 'idle',
  lastSavedAt: null,
  lastError: null,
  versions: [],
  manualSave: async () => false,
  updateInfo: () => {},
  publish: async () => false,
  loadVersions: async () => {},
};

export function subscribeWorkflowContext(callback: (ctx: WorkflowContext) => void): () => void {
  workflowContextCallbacks.add(callback);
  // 立即发送当前状态
  callback(currentWorkflowContext);
  return () => workflowContextCallbacks.delete(callback);
}

function notifyWorkflowContext() {
  workflowContextCallbacks.forEach(cb => cb(currentWorkflowContext));
}

/**
 * 编辑器内部组件 - 用于集成自动保存功能
 */
const EditorContent = () => {
  const documentService = useService(WorkflowDocument);
  const documentDataRef = useRef<ReturnType<typeof documentService.toJSON> | null>(null);
  const [, forceUpdate] = useState({});

  // 从 URL 路径参数获取工作流 ID（如 /workflow/xxx）
  const { id: workflowIdFromUrl } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 处理没有 ID 的情况：重定向到应用列表
  useEffect(() => {
    // 兼容旧的查询参数方式（?id=xxx），自动重定向到新路径
    const legacyId = searchParams.get('id');
    if (legacyId && !workflowIdFromUrl) {
      navigate(`/workflow/${legacyId}`, { replace: true });
      return;
    }

    // 如果没有 ID（直接访问 /workflow 或 /workflow/），重定向到应用列表
    if (!workflowIdFromUrl) {
      Toast.info('请从应用列表创建或选择工作流');
      navigate('/apps', { replace: true });
    }
  }, [searchParams, workflowIdFromUrl, navigate]);

  // 加载状态
  const [isLoading, setIsLoading] = useState(!!workflowIdFromUrl);
  const [initialData, setInitialData] = useState<any>(null);

  // 从 URL 加载工作流
  useEffect(() => {
    if (workflowIdFromUrl) {
      const loadWorkflow = async () => {
        setIsLoading(true);
        const api = getWorkflowApi();
        const result = await api.loadWorkflow(workflowIdFromUrl);
        if (result.success && result.data) {
          setInitialData(result.data);
          // 更新上下文
          currentWorkflowContext = {
            ...currentWorkflowContext,
            workflowId: workflowIdFromUrl,
            workflowName: (result.data as any).name || '未命名工作流',
            workflowDescription: (result.data as any).description || '',
            workflowIcon: (result.data as any).icon || '',
          };
          notifyWorkflowContext();
        } else {
          Toast.error(result.error || '加载工作流失败');
        }
        setIsLoading(false);
      };
      loadWorkflow();
    }
  }, [workflowIdFromUrl]);

  // 监听文档变化，获取最新数据
  useEffect(() => {
    const disposable = documentService.onContentChange(() => {
      documentDataRef.current = documentService.toJSON();
      forceUpdate({});
    });

    // 初始化数据
    documentDataRef.current = documentService.toJSON();

    return () => disposable.dispose();
  }, [documentService]);

  // 工作流创建后的回调 - 更新全局上下文和 URL
  const handleWorkflowCreated = useCallback((workflowId: string) => {
    console.log('[Editor] Workflow created:', workflowId);
    currentWorkflowContext = {
      ...currentWorkflowContext,
      workflowId,
    };
    notifyWorkflowContext();
    // 更新 window 上的引用
    (window as any).__flowgramWorkflowContext = currentWorkflowContext;
    // 更新 URL 为包含 ID 的路径（不刷新页面）
    if (!workflowIdFromUrl) {
      navigate(`/workflow/${workflowId}`, { replace: true });
    }
  }, [navigate, workflowIdFromUrl]);

  // 启用自动保存
  const {
    saveStatus,
    lastError,
    manualSave,
    setWorkflowId,
    setWorkflowName,
    setWorkflowDescription,
    setWorkflowIcon,
    lastSavedAt
  } = useAutoSave(documentDataRef.current, {
    enabled: true,
    delay: 2000,
    workflowId: workflowIdFromUrl,
    onWorkflowCreated: handleWorkflowCreated,
  });

  // 更新工作流信息
  const updateInfo = useCallback((name: string, description: string, icon?: string) => {
    setWorkflowName(name);
    setWorkflowDescription(description);
    if (icon !== undefined) {
      setWorkflowIcon(icon);
    }
    // 更新上下文
    currentWorkflowContext = {
      ...currentWorkflowContext,
      workflowName: name,
      workflowDescription: description,
      workflowIcon: icon ?? currentWorkflowContext.workflowIcon,
    };
    notifyWorkflowContext();
    // 触发保存
    manualSave();
  }, [setWorkflowName, setWorkflowDescription, setWorkflowIcon, manualSave]);

  // 发布工作流
  const publish = useCallback(async (description?: string): Promise<boolean> => {
    if (!currentWorkflowContext.workflowId) {
      // 先保存
      const saved = await manualSave();
      if (!saved) {
        Toast.error('保存失败，无法发布');
        return false;
      }
    }

    const api = getWorkflowApi();
    const result = await api.publishWorkflow(currentWorkflowContext.workflowId!, description);
    if (result.success) {
      Toast.success('发布成功');
      // 重新加载版本列表
      await loadVersions();
      return true;
    } else {
      Toast.error(result.error || '发布失败');
      return false;
    }
  }, [manualSave]);

  // 加载版本历史
  const loadVersions = useCallback(async () => {
    if (!currentWorkflowContext.workflowId) return;

    const api = getWorkflowApi();
    const result = await api.getWorkflowVersions(currentWorkflowContext.workflowId);
    if (result.success && result.data) {
      currentWorkflowContext = {
        ...currentWorkflowContext,
        versions: result.data,
      };
      notifyWorkflowContext();
    }
  }, []);

  // 监听 workflowId 变化
  useEffect(() => {
    if (workflowIdFromUrl) {
      setWorkflowId(workflowIdFromUrl);
    }
  }, [workflowIdFromUrl, setWorkflowId]);

  // 更新全局上下文
  useEffect(() => {
    currentWorkflowContext = {
      ...currentWorkflowContext,
      saveStatus,
      lastError,
      lastSavedAt,
      manualSave,
      updateInfo,
      publish,
      loadVersions,
    };
    notifyWorkflowContext();
  }, [saveStatus, lastError, lastSavedAt, manualSave, updateInfo, publish, loadVersions]);

  // 将保存状态和手动保存函数暴露到 window，供工具栏使用
  useEffect(() => {
    (window as any).__flowgramSaveStatus = saveStatus;
    (window as any).__flowgramSaveError = lastError;
    (window as any).__flowgramManualSave = manualSave;
    (window as any).__flowgramWorkflowContext = currentWorkflowContext;
  }, [saveStatus, lastError, manualSave]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="demo-container">
      <DockedPanelLayer>
        <EditorRenderer className="demo-editor" />
      </DockedPanelLayer>
    </div>
  );
};

export const Editor = () => {
  const editorProps = useEditorProps(getEmptyInitialData(), nodeRegistries);

  // Semi-UI ConfigProvider for workflow editor - use document.body to avoid positioning issues
  const getPopupContainer = () => document.body;

  return (
    <div className="doc-free-feature-overview workflow-page-wrapper">
      <ConfigProvider getPopupContainer={getPopupContainer}>
        <FreeLayoutEditorProvider {...editorProps}>
          <EditorContent />
        </FreeLayoutEditorProvider>
      </ConfigProvider>
    </div>
  );
};
