/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { IconTickCircle, IconAlertCircle } from '@douyinfe/semi-icons';

import { SaveStatus } from '../../services/workflow-api';
import { useI18n } from '@flowgram/hooks';
import { Tooltip, Spin } from '@douyinfe/semi-ui';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  error?: string | null;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({ status, error }) => {
  const i18n = useI18n();

  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <Spin size="small" />,
          text: i18n.t('saving') || '保存中...',
          color: 'var(--semi-color-primary)',
        };
      case 'saved':
        return {
          icon: <IconTickCircle size="small" />,
          text: i18n.t('saved') || '已保存',
          color: 'var(--semi-color-success)',
        };
      case 'error':
        return {
          icon: <IconAlertCircle size="small" />,
          text: error || (i18n.t('saveError') || '保存失败'),
          color: 'var(--semi-color-danger)',
        };
      default:
        return {
          icon: null,
          text: '',
          color: '',
        };
    }
  };

  const config = getStatusConfig();

  if (status === 'idle' || !config.text) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '12px',
        color: config.color,
        padding: '4px 8px',
        borderRadius: '4px',
        backgroundColor: 'var(--semi-color-fill-0)',
      }}
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
};
