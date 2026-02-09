/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { FlowNodeRegistry } from '../../typings';
import iconEnd from '../../assets/icon-end.jpg';
import { formMeta } from './form-meta';
import { WorkflowNodeType } from '../constants';
import { i18n } from '@flowgram/i18n';

export const EndNodeRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.End,
  meta: {
    deleteDisable: true,
    copyDisable: true,
    nodePanelVisible: false,
    defaultPorts: [{ type: 'input' }],
    size: {
      width: 360,
      height: 211,
    },
  },
  info: {
    icon: iconEnd,
    title: i18n.t('end'),
    description: i18n.t('endDesc'),
  },
  /**
   * Render node via formMeta
   */
  formMeta,
  /**
   * End Node cannot be added
   */
  canAdd() {
    return false;
  },
};
