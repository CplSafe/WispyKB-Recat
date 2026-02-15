/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { Button } from '@douyinfe/semi-ui';
import { IconPlus } from '@douyinfe/semi-icons';

import { useI18n } from '@flowgram/hooks';

import { useAddNode } from './use-add-node';

export const AddNode = (props: { disabled: boolean }) => {
  const i18n = useI18n();
  const addNode = useAddNode();
  return (
    <Button
      data-testid="demo.free-layout.add-node"
      icon={<IconPlus />}
      type="tertiary"
      style={{
        backgroundColor: 'rgba(167, 139, 250, 0.15)',
        borderRadius: '8px',
        color: '#7c3aed',
        border: 'none',
      }}
      disabled={props.disabled}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        addNode(rect);
      }}
    >
      {i18n.t('addNode')}
    </Button>
  );
};
