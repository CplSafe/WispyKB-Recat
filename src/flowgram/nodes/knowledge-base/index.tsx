/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { nanoid } from 'nanoid';

import { WorkflowNodeType } from '../constants';
import { FlowNodeRegistry } from '../../typings';
import iconKnowledgeBase from './icon-knowledge-base.svg';
import { i18n } from '@flowgram/i18n';

let index = 0;

export const KnowledgeBaseNodeRegistry: FlowNodeRegistry = {
  type: 'knowledge-base',
  info: {
    icon: iconKnowledgeBase,
    title: i18n.t('knowledgeBase'),
    description: i18n.t('knowledgeBaseDesc'),
  },
  meta: {
    size: {
      width: 360,
      height: 360,
    },
  },
  onAdd() {
    return {
      id: `kb_${nanoid(5)}`,
      type: 'knowledge-base',
      data: {
        title: `${i18n.t('knowledgeBase')}_${++index}`,
        // 使用 inputs/inputsValues 结构以支持表单系统
        inputsValues: {
          knowledgeBaseId: {
            type: 'constant',
            content: '',
          },
          query: {
            type: 'template',
            content: '',
          },
          topK: {
            type: 'constant',
            content: 5,
          },
        },
        inputs: {
          type: 'object',
          required: ['knowledgeBaseId', 'query', 'topK'],
          properties: {
            knowledgeBaseId: {
              type: 'string',
              title: i18n.t('knowledgeBaseSelect'),
              extra: {
                formComponent: 'knowledge-base-select',
              },
            },
            query: {
              type: 'string',
              title: i18n.t('query'),
              extra: {
                formComponent: 'prompt-editor',
              },
            },
            topK: {
              type: 'number',
              title: i18n.t('topK'),
              minimum: 1,
              maximum: 20,
            },
          },
        },
        outputs: {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  content: { type: 'string' },
                  score: { type: 'number' },
                  metadata: { type: 'object' },
                },
              },
            },
          },
        },
      },
    };
  },
};
