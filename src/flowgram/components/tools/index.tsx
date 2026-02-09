/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { useState, useEffect } from 'react';

import { useRefresh } from '@flowgram.ai/free-layout-editor';
import { useClientContext } from '@flowgram.ai/free-layout-editor';
import { Tooltip, IconButton, Divider, Button } from '@douyinfe/semi-ui';
import { IconUndo, IconRedo, IconSave } from '@douyinfe/semi-icons';

import { useI18n } from '@flowgram/hooks';
import { TestRunButton } from '../testrun/testrun-button';
import { AddNode } from '../add-node';
import { ZoomSelect } from './zoom-select';
import { SwitchLine } from './switch-line';
import { ToolContainer, ToolSection } from './styles';
import { Readonly } from './readonly';
import { MinimapSwitch } from './minimap-switch';
import { Minimap } from './minimap';
import { Interactive } from './interactive';
import { FitView } from './fit-view';
import { Comment } from './comment';
import { AutoLayout } from './auto-layout';
import { ProblemButton } from '../problem-panel';
import { DownloadTool } from './download';
import { LanguageSwitch } from './language-switch';
import { SaveStatusIndicator } from './save-status';

export const DemoTools = () => {
  const { history, playground } = useClientContext();
  const i18n = useI18n();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [minimapVisible, setMinimapVisible] = useState(true);

  useEffect(() => {
    const disposable = history.undoRedoService.onChange(() => {
      setCanUndo(history.canUndo());
      setCanRedo(history.canRedo());
    });
    return () => disposable.dispose();
  }, [history]);
  const refresh = useRefresh();

  useEffect(() => {
    const disposable = playground.config.onReadonlyOrDisabledChange(() => refresh());
    return () => disposable.dispose();
  }, [playground]);

  // 从 window 获取保存状态和手动保存函数（由 useAutoSave 注入）
  const saveStatus = (window as any).__flowgramSaveStatus || 'idle';
  const saveError = (window as any).__flowgramSaveError || null;
  const handleManualSave = (window as any).__flowgramManualSave;

  const onManualSave = async () => {
    if (handleManualSave) {
      await handleManualSave();
    }
  };

  return (
    <ToolContainer className="demo-free-layout-tools">
      <ToolSection>
        <Interactive />
        <AutoLayout />
        <SwitchLine />
        <ZoomSelect />
        <FitView />
        <MinimapSwitch minimapVisible={minimapVisible} setMinimapVisible={setMinimapVisible} />
        <Minimap visible={minimapVisible} />
        <Readonly />
        <Comment />
        <Tooltip content={i18n.t('undo')}>
          <IconButton
            type="tertiary"
            theme="borderless"
            icon={<IconUndo />}
            disabled={!canUndo || playground.config.readonly}
            onClick={() => history.undo()}
          />
        </Tooltip>
        <Tooltip content={i18n.t('redo')}>
          <IconButton
            type="tertiary"
            theme="borderless"
            icon={<IconRedo />}
            disabled={!canRedo || playground.config.readonly}
            onClick={() => history.redo()}
          />
        </Tooltip>
        <ProblemButton />
        <DownloadTool />
        <LanguageSwitch />
        <Divider layout="vertical" style={{ height: '16px' }} margin={3} />
        {/* 保存状态指示器 */}
        <SaveStatusIndicator status={saveStatus} error={saveError} />
        {/* 手动保存按钮 */}
        <Button
          icon={<IconSave />}
          size="small"
          type="tertiary"
          onClick={onManualSave}
          disabled={saveStatus === 'saving'}
        >
          {i18n.t('manualSave')}
        </Button>
        <Divider layout="vertical" style={{ height: '16px' }} margin={3} />
        <AddNode disabled={playground.config.readonly} />
        <Divider layout="vertical" style={{ height: '16px' }} margin={3} />
        <TestRunButton disabled={playground.config.readonly} />
      </ToolSection>
    </ToolContainer>
  );
};
