/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { nanoid } from 'nanoid';

import { WorkflowNodeType } from '../constants';
import { FlowNodeRegistry } from '../../typings';
import iconMCP from './icon-mcp.svg';
import { i18n } from '@flowgram/i18n';

let index = 0;

export const MCPServiceNodeRegistry: FlowNodeRegistry = {
  type: 'mcp-service',
  info: {
    icon: iconMCP,
    title: i18n.t('mcpService'),
    description: i18n.t('mcpServiceDesc'),
  },
  meta: {
    size: {
      width: 360,
      height: 400,
    },
  },
  onAdd() {
    return {
      id: `mcp_${nanoid(5)}`,
      type: 'mcp-service',
      data: {
        title: `${i18n.t('mcpService')}_${++index}`,
        // 使用 inputs/inputsValues 结构以支持表单系统
        inputsValues: {
          mcpServiceId: {
            type: 'constant',
            content: '',
          },
          method: {
            type: 'constant',
            content: '',
          },
          params: {
            type: 'json',
            content: '{}',
          },
          timeout: {
            type: 'constant',
            content: 30000,
          },
        },
        inputs: {
          type: 'object',
          required: ['mcpServiceId', 'method', 'params', 'timeout'],
          properties: {
            mcpServiceId: {
              type: 'string',
              title: i18n.t('mcpServiceSelect'),
              extra: {
                formComponent: 'mcp-service-select',
              },
            },
            method: {
              type: 'string',
              title: i18n.t('method'),
              extra: {
                formComponent: 'mcp-method-select',
              },
            },
            params: {
              type: 'string',
              title: i18n.t('inputParamsUseVar'),
              extra: {
                formComponent: 'code-editor',
              },
            },
            timeout: {
              type: 'number',
              title: i18n.t('timeout'),
              minimum: 1000,
              maximum: 300000,
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
