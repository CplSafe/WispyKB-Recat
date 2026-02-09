/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useRef } from 'react';
import { DockedPanelLayer } from '@flowgram.ai/panel-manager-plugin';
import { EditorRenderer, FreeLayoutEditorProvider, useClientContext } from '@flowgram.ai/free-layout-editor';
import { ConfigProvider } from '@douyinfe/semi-ui';

import '@flowgram.ai/free-layout-editor/index.css';
import './styles/index.css';
import { nodeRegistries } from './nodes';
import { getInitialData } from './initial-data';
import { useEditorProps } from './hooks';
import { useAutoSave } from './hooks/use-auto-save';

/**
 * 编辑器内部组件 - 用于集成自动保存功能
 */
const EditorContent = () => {
  const { document } = useClientContext();
  const documentDataRef = useRef<ReturnType<typeof document.toJSON> | null>(null);

  // 监听文档变化，获取最新数据
  useEffect(() => {
    const disposable = document.onChange(() => {
      documentDataRef.current = document.toJSON();
    });

    // 初始化数据
    documentDataRef.current = document.toJSON();

    return () => disposable.dispose();
  }, [document]);

  // 启用自动保存（默认禁用，等后端 API 准备好后启用）
  const { saveStatus, lastError, manualSave } = useAutoSave(documentDataRef.current, {
    enabled: false, // 暂时禁用，等后端 API 准备好后改为 true
    delay: 2000,
    apiBaseUrl: '/api',
  });

  // 将保存状态和手动保存函数暴露到 window，供工具栏使用
  useEffect(() => {
    (window as any).__flowgramSaveStatus = saveStatus;
    (window as any).__flowgramSaveError = lastError;
    (window as any).__flowgramManualSave = manualSave;
  }, [saveStatus, lastError, manualSave]);

  return (
    <div className="demo-container">
      <DockedPanelLayer>
        <EditorRenderer className="demo-editor" />
      </DockedPanelLayer>
    </div>
  );
};

export const Editor = () => {
  const editorProps = useEditorProps(getInitialData(), nodeRegistries);

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
