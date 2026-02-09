/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { useCallback } from 'react';

import { useService, WorkflowLinesManager } from '@flowgram.ai/free-layout-editor';
import { IconButton, Tooltip } from '@douyinfe/semi-ui';

import { useI18n } from '@flowgram/hooks';

import { IconSwitchLine } from '../../assets/icon-switch-line';

export const SwitchLine = () => {
  const i18n = useI18n();
  const linesManager = useService(WorkflowLinesManager);
  const switchLine = useCallback(() => {
    linesManager.switchLineType();
  }, [linesManager]);

  return (
    <Tooltip content={i18n.t('switchLine')}>
      <IconButton type="tertiary" theme="borderless" onClick={switchLine} icon={IconSwitchLine} />
    </Tooltip>
  );
};
