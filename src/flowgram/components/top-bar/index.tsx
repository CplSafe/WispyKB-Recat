/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Input, Toast, Typography, Upload, Popover, Tooltip, Spin, List, Tag, SideSheet, Divider } from '@douyinfe/semi-ui';
import {
  IconArrowLeft,
  IconEdit2,
  IconImage,
  IconClock,
  IconHistory,
  IconMore,
  IconCopy,
  IconDownload,
} from '@douyinfe/semi-icons';

import { useI18n } from '@flowgram/hooks';
import { TopBarContainer, TopBarLeft, TopBarRight, SaveStatus, MoreMenuContent } from './styles';
import { subscribeWorkflowContext, WorkflowContext } from '../../editor';
import { getWorkflowApi, WorkflowVersion } from '../../services/workflow-api';

const { Text } = Typography;

export const TopBar = () => {
  const navigate = useNavigate();
  const i18n = useI18n();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [moreVisible, setMoreVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [, forceUpdate] = useState({});

  // 工作流上下文
  const [context, setContext] = useState<WorkflowContext>({
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
  });

  // 编辑表单状态
  const [tempName, setTempName] = useState('');
  const [tempDesc, setTempDesc] = useState('');
  const [tempIcon, setTempIcon] = useState('');

  // 订阅工作流上下文
  useEffect(() => {
    const unsubscribe = subscribeWorkflowContext((ctx) => {
      setContext(ctx);
    });
    return unsubscribe;
  }, []);

  // 同步 i18n 变化
  useEffect(() => {
    const unsubscribe = i18n.onChange(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, []);

  // 同步上下文到表单
  useEffect(() => {
    setTempName(context.workflowName || '');
    setTempDesc(context.workflowDescription || '');
    setTempIcon(context.workflowIcon || '');
  }, [context.workflowName, context.workflowDescription, context.workflowIcon]);

  const handleBack = () => {
    navigate('/apps');
  };

  const handlePublish = useCallback(async () => {
    setPublishing(true);
    await context.publish();
    setPublishing(false);
    // Toast 在 publish 函数内部已经显示，这里不再重复
  }, [context]);

  const handleOpenEditModal = () => {
    setTempName(context.workflowName || '');
    setTempDesc(context.workflowDescription || '');
    setTempIcon(context.workflowIcon || '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!tempName.trim()) {
      Toast.warning(i18n.t('nameRequired') || '请输入名称');
      return;
    }
    context.updateInfo(tempName.trim(), tempDesc.trim(), tempIcon);
    setEditModalVisible(false);
    Toast.success(i18n.t('updateSuccess') || '更新成功');
  };

  const handleIconUpload = async (info: any) => {
    const file = info.file?.originFileObj;
    if (!file) return;

    // 先预览图片
    const previewUrl = URL.createObjectURL(file);
    setTempIcon(previewUrl);

    // 如果还没有 workflowId，先保存工作流
    let workflowId = context.workflowId;

    if (!workflowId) {
      console.log('[IconUpload] No workflowId, saving workflow first...');
      const saved = await context.manualSave();
      console.log('[IconUpload] Save result:', saved);

      if (!saved) {
        Toast.error('保存工作流失败，无法上传图标');
        return;
      }

      // 等待一下让状态同步
      await new Promise(resolve => setTimeout(resolve, 500));

      // 从 window 获取最新的 workflowId
      const latestContext = (window as any).__flowgramWorkflowContext;
      workflowId = latestContext?.workflowId;
      console.log('[IconUpload] Got workflowId from window:', workflowId);

      if (!workflowId) {
        Toast.error('无法获取工作流 ID，请稍后重试');
        return;
      }
    }

    console.log('[IconUpload] Uploading icon for workflow:', workflowId);

    // 上传到服务器
    const api = getWorkflowApi();
    const result = await api.uploadIcon(workflowId, file);
    console.log('[IconUpload] Upload result:', result);

    if (result.success && result.data?.icon) {
      setTempIcon(result.data.icon);
      // 更新上下文中的图标
      context.updateInfo(tempName, tempDesc, result.data.icon);
      Toast.success('图标上传成功');
    } else {
      Toast.error(result.error || '上传失败');
    }
  };

  const handleShowHistory = useCallback(async () => {
    await context.loadVersions();
    setHistoryVisible(true);
  }, [context]);

  const handleExport = useCallback(() => {
    const data = (window as any).__flowgramWorkflowContext;
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${context.workflowName || 'workflow'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      Toast.success(i18n.t('exportSuccess') || '导出成功');
    }
  }, [context.workflowName, i18n]);

  const handleCopy = useCallback(() => {
    // TODO: 实现创建副本功能
    Toast.info(i18n.t('copyComingSoon') || '创建副本功能即将推出');
  }, [i18n]);

  const formatSaveTime = () => {
    if (!context.lastSavedAt) return '';
    const now = new Date();
    const diff = now.getTime() - context.lastSavedAt.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 60) {
      return i18n.t('justNow') || '刚刚保存';
    } else if (minutes < 60) {
      return `${minutes} ${i18n.t('minutesAgo') || '分钟前保存'}`;
    } else {
      return context.lastSavedAt.toLocaleTimeString();
    }
  };

  const getSaveStatusText = () => {
    switch (context.saveStatus) {
      case 'saving':
        return i18n.t('saving') || '保存中...';
      case 'saved':
        return formatSaveTime();
      case 'error':
        return i18n.t('saveFailed') || '保存失败';
      default:
        return '';
    }
  };

  const moreMenuItems = [
    {
      name: i18n.t('export') || '导出',
      icon: <IconDownload />,
      onClick: handleExport,
    },
    {
      name: i18n.t('createCopy') || '创建副本',
      icon: <IconCopy />,
      onClick: handleCopy,
    },
  ];

  return (
    <>
      <TopBarContainer>
        <TopBarLeft>
          {/* 返回箭头 */}
          <Button
            icon={<IconArrowLeft />}
            type="tertiary"
            theme="borderless"
            size="small"
            onClick={handleBack}
            style={{ padding: '0 8px' }}
          />

          {/* 图标 */}
          <div className="workflow-icon">
            {context.workflowIcon ? (
              <img src={context.workflowIcon} alt="" />
            ) : (
              <IconImage style={{ color: 'var(--semi-color-text-3)', fontSize: 20 }} />
            )}
          </div>

          {/* 名称和保存状态 */}
          <div className="workflow-info">
            <div className="workflow-title-row">
              <Text strong className="workflow-name">
                {context.workflowName || i18n.t('untitledWorkflow') || '未命名工作流'}
              </Text>
              <Button
                icon={<IconEdit2 />}
                type="tertiary"
                theme="borderless"
                size="small"
                onClick={handleOpenEditModal}
                style={{ padding: '0 4px', minWidth: 24, color: 'var(--semi-color-text-3)' }}
              />
            </div>
            <div className="workflow-save-status">
              <IconClock style={{ fontSize: 12, color: 'var(--semi-color-text-3)' }} />
              <Text type="tertiary" size="small">
                {context.saveStatus === 'saving'
                  ? (i18n.t('saving') || '保存中...')
                  : (i18n.t('autoSaved') || '已自动保存') + (context.lastSavedAt ? ` ${formatSaveTime()}` : '')
                }
              </Text>
            </div>
          </div>
        </TopBarLeft>

        <TopBarRight>
          {/* 历史按钮 */}
          <Tooltip content={i18n.t('history') || '历史版本'} position="bottom">
            <Button
              icon={<IconHistory />}
              type="tertiary"
              theme="borderless"
              size="small"
              onClick={handleShowHistory}
              style={{ width: 32, height: 32, padding: 0 }}
            />
          </Tooltip>

          {/* 发布按钮 */}
          <Button
            type="primary"
            size="small"
            loading={publishing}
            onClick={handlePublish}
            style={{
              borderRadius: '8px',
              height: '32px',
              paddingLeft: '16px',
              paddingRight: '16px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
              border: 'none',
              color: '#fff',
              fontWeight: 500,
            }}
          >
            {i18n.t('publish')}
          </Button>

          {/* 更多菜单 - 放在发布按钮右侧 */}
          <Popover
            visible={moreVisible}
            onVisibleChange={setMoreVisible}
            position="bottomRight"
            showArrow
            content={
              <MoreMenuContent>
                {moreMenuItems.map((item, index) => (
                  <div
                    key={index}
                    className="more-menu-item"
                    onClick={() => {
                      item.onClick?.();
                      setMoreVisible(false);
                    }}
                  >
                    <span className="menu-icon">{item.icon}</span>
                    <span className="menu-name">{item.name}</span>
                  </div>
                ))}
              </MoreMenuContent>
            }
          >
            <Button
              icon={<IconMore />}
              type="tertiary"
              theme="borderless"
              size="small"
              style={{ width: 32, height: 32, padding: 0 }}
            />
          </Popover>
        </TopBarRight>
      </TopBarContainer>

      {/* 编辑弹窗 */}
      <Modal
        title={i18n.t('editWorkflowInfo') || '编辑工作流信息'}
        visible={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => setEditModalVisible(false)}
        okText={i18n.t('save') || '保存'}
        cancelText={i18n.t('cancel') || '取消'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 图标上传 */}
          <div>
            <Text type="secondary" size="small" style={{ marginBottom: 8, display: 'block' }}>
              {i18n.t('icon') || '图标'}
            </Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  background: 'var(--semi-color-bg-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {tempIcon ? (
                  <img src={tempIcon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <IconImage style={{ color: 'var(--semi-color-text-3)', fontSize: 24 }} />
                )}
              </div>
              <Upload
                showUploadList={false}
                accept="image/*"
                action=""
                customRequest={(options) => {
                  // Semi UI customRequest: 原始 File 对象在 fileInstance 属性中
                  const rawFile = (options as any).fileInstance as File;
                  console.log('[Upload] File selected:', rawFile, 'isFile:', rawFile instanceof File);
                  if (rawFile && rawFile instanceof File) {
                    handleIconUpload({ file: { originFileObj: rawFile } });
                  }
                }}
              >
                <Button size="small" type="tertiary">
                  {i18n.t('uploadIcon') || '上传图标'}
                </Button>
              </Upload>
            </div>
          </div>

          {/* 名称 */}
          <div>
            <Text type="secondary" size="small" style={{ marginBottom: 8, display: 'block' }}>
              {i18n.t('name') || '名称'} *
            </Text>
            <Input
              value={tempName}
              onChange={setTempName}
              placeholder={i18n.t('enterName') || '请输入名称'}
            />
          </div>

          {/* 描述 */}
          <div>
            <Text type="secondary" size="small" style={{ marginBottom: 8, display: 'block' }}>
              {i18n.t('description') || '描述'}
            </Text>
            <Input
              value={tempDesc}
              onChange={setTempDesc}
              placeholder={i18n.t('enterDescription') || '请输入描述'}
            />
          </div>
        </div>
      </Modal>

      {/* 历史版本抽屉 */}
      <SideSheet
        title={i18n.t('versionHistory') || '历史版本'}
        visible={historyVisible}
        onCancel={() => setHistoryVisible(false)}
        width={400}
      >
        {context.versions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--semi-color-text-2)' }}>
            {i18n.t('noVersions') || '暂无历史版本'}
          </div>
        ) : (
          <List
            dataSource={context.versions}
            renderItem={(version: WorkflowVersion) => (
              <List.Item
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  // TODO: 实现版本恢复
                  Toast.info(i18n.t('versionRestoreComingSoon') || '版本恢复功能即将推出');
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div>
                    <Text strong>{version.version}</Text>
                    {version.description && (
                      <Text type="tertiary" size="small" style={{ marginLeft: 8 }}>
                        {version.description}
                      </Text>
                    )}
                    <div>
                      <Text type="tertiary" size="small">
                        {new Date(version.createdAt).toLocaleString()}
                      </Text>
                    </div>
                  </div>
                  {version.isPublished && (
                    <Tag color="green" size="small">
                      {i18n.t('published') || '已发布'}
                    </Tag>
                  )}
                </div>
              </List.Item>
            )}
          />
        )}
      </SideSheet>
    </>
  );
};
