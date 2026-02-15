/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { useState, useEffect, useCallback } from 'react';

import { useRefresh, useClientContext, FlowNodeEntity } from '@flowgram.ai/free-layout-editor';
import { Tooltip, Divider, Button, Badge } from '@douyinfe/semi-ui';
import { IconPlay, IconWrench } from '@douyinfe/semi-icons';

import { useI18n } from '@flowgram/hooks';
import { AddNode } from '../add-node';
import { ZoomSelect } from '../tools/zoom-select';
import { MinimapSwitch } from '../tools/minimap-switch';
import { Minimap } from '../tools/minimap';
import { FitView } from '../tools/fit-view';
import { Comment } from '../tools/comment';
import { AutoLayout } from '../tools/auto-layout';
import { DownloadTool } from '../tools/download';
import { Interactive } from '../tools/interactive';
import { useProblemPanel, useTestRunFormPanel } from '../../plugins/panel-manager-plugin/hooks';
import { BottomBarContainer, LeftCard, RightCard } from './styles';

export interface BottomBarProps {
  showMinimap?: boolean;
  onToggleMinimap?: () => void;
}

// 问题按钮组件 - 使用扳手图标
const ProblemButton = () => {
  const i18n = useI18n();
  const { open } = useProblemPanel();
  return (
    <Tooltip content={i18n.t('problem')}>
      <Button
        type="tertiary"
        theme="borderless"
        icon={<IconWrench />}
        onClick={() => open()}
        style={{ padding: '0 8px' }}
      />
    </Tooltip>
  );
};

// 试运行按钮组件
const TestRunBtn = ({ disabled }: { disabled: boolean }) => {
  const i18n = useI18n();
  const [errorCount, setErrorCount] = useState(0);
  const clientContext = useClientContext();

  const updateValidateData = useCallback(() => {
    const allForms = clientContext.document.getAllNodes().map((node) => node.form);
    const count = allForms.filter((form) => form?.state.invalid).length;
    setErrorCount(count);
  }, [clientContext]);

  const { open: openPanel } = useTestRunFormPanel();

  const onTestRun = useCallback(async () => {
    const allForms = clientContext.document.getAllNodes().map((node) => node.form);
    await Promise.all(allForms.map(async (form) => form?.validate()));
    console.log('>>>>> save data: ', clientContext.document.toJSON());
    openPanel();
  }, [clientContext]);

  useEffect(() => {
    const listenSingleNodeValidate = (node: FlowNodeEntity) => {
      const { form } = node;
      if (form) {
        const formValidateDispose = form.onValidate(() => updateValidateData());
        node.onDispose(() => formValidateDispose.dispose());
      }
    };
    clientContext.document.getAllNodes().map((node) => listenSingleNodeValidate(node));
    const dispose = clientContext.document.onNodeCreate(({ node }) =>
      listenSingleNodeValidate(node)
    );
    return () => dispose.dispose();
  }, [clientContext, updateValidateData]);

  if (errorCount === 0) {
    return (
      <Button
        disabled={disabled}
        onClick={onTestRun}
        icon={<IconPlay size="small" />}
        style={{
          borderRadius: '8px',
          height: '32px',
          paddingLeft: '12px',
          paddingRight: '12px',
          backgroundColor: 'rgba(0, 178, 60, 1)',
          borderColor: 'transparent',
          color: '#fff',
        }}
      >
        {i18n.t('trialRun')}
      </Button>
    );
  }

  return (
    <Badge count={errorCount} position="rightTop" type="danger">
      <Button
        disabled={disabled}
        onClick={onTestRun}
        icon={<IconPlay size="small" />}
        style={{
          borderRadius: '8px',
          height: '32px',
          paddingLeft: '12px',
          paddingRight: '12px',
          backgroundColor: 'rgba(255, 115, 0, 1)',
          borderColor: 'transparent',
          color: '#fff',
        }}
      >
        {i18n.t('trialRun')}
      </Button>
    </Badge>
  );
};

export const BottomBar = ({ showMinimap = true, onToggleMinimap }: BottomBarProps) => {
  const { playground } = useClientContext();
  const i18n = useI18n();
  const [minimapVisible, setMinimapVisible] = useState(true);

  const refresh = useRefresh();

  useEffect(() => {
    const disposable = playground.config.onReadonlyOrDisabledChange(() => refresh());
    return () => disposable.dispose();
  }, [playground]);

  return (
    <BottomBarContainer>
      {/* 左侧卡片：交互工具 + 下载 + 添加节点 */}
      <LeftCard>
        <Interactive />
        <AutoLayout />
        <Divider layout="vertical" style={{ height: '16px' }} margin={4} />
        <ZoomSelect />
        <FitView />
        <MinimapSwitch minimapVisible={minimapVisible} setMinimapVisible={setMinimapVisible} />
        <Minimap visible={minimapVisible} />
        <Comment />
        <DownloadTool />
        <Divider layout="vertical" style={{ height: '16px' }} margin={4} />
        <AddNode disabled={playground.config.readonly} />
      </LeftCard>

      {/* 右侧卡片：问题 + 试运行 */}
      <RightCard>
        <ProblemButton />
        <Divider layout="vertical" style={{ height: '16px' }} margin={4} />
        <TestRunBtn disabled={playground.config.readonly} />
      </RightCard>
    </BottomBarContainer>
  );
};
