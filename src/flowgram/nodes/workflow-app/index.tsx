/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { nanoid } from 'nanoid';

import { WorkflowNodeType } from '../constants';
import { FlowNodeRegistry } from '../../typings';
import iconWorkflowApp from './icon-workflow-app.svg';
import { i18n } from '@flowgram/i18n';

let index = 0;

export const WorkflowAppNodeRegistry: FlowNodeRegistry = {
  type: 'workflow-app',
  info: {
    icon: iconWorkflowApp,
    title: i18n.t('workflowApp'),
    description: i18n.t('workflowAppDesc'),
  },
  meta: {
    size: {
      width: 360,
      height: 380,
    },
  },
  onAdd() {
    return {
      id: `app_${nanoid(5)}`,
      type: 'workflow-app',
      data: {
        title: `${i18n.t('workflowApp')}_${++index}`,
        // 使用 inputs/inputsValues 结构以支持表单系统
        inputsValues: {
          workflowAppId: {
            type: 'constant',
            content: '',
          },
          inputs: {
            type: 'json',
            content: '{}',
          },
          timeout: {
            type: 'constant',
            content: 300000,
          },
        },
        inputs: {
          type: 'object',
          required: ['workflowAppId', 'inputs', 'timeout'],
          properties: {
            workflowAppId: {
              type: 'string',
              title: i18n.t('workflowAppSelect'),
              extra: {
                formComponent: 'workflow-app-select',
              },
            },
            inputs: {
              type: 'string',
              title: i18n.t('inputs'),
              extra: {
                formComponent: 'code-editor',
              },
            },
            timeout: {
              type: 'number',
              title: i18n.t('timeout'),
              minimum: 1000,
              maximum: 600000,
            },
          },
        },
        outputs: {
          type: 'object',
          properties: {
            result: { type: 'object' },
            error: { type: 'string' },
          },
        },
      },
    };
  },
};
