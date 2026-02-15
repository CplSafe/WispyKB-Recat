/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { nanoid } from 'nanoid';

import { WorkflowNodeType } from '../constants';
import { FlowNodeRegistry } from '../../typings';
import iconLLM from '../../assets/icon-llm.jpg';
import { i18n } from '@flowgram/i18n';

let index = 0;
export const LLMNodeRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.LLM,
  info: {
    icon: iconLLM,
    title: i18n.t('llm'),
    description: i18n.t('llmDesc'),
  },
  meta: {
    size: {
      width: 360,
      height: 390,
    },
  },
  onAdd() {
    return {
      id: `llm_${nanoid(5)}`,
      type: 'llm',
      data: {
        title: `${i18n.t('llm')}_${++index}`,
        inputsValues: {
          modelName: {
            type: 'constant',
            content: 'deepseek-r1:8b',
          },
          apiKey: {
            type: 'constant',
            content: 'ollama',
          },
          apiHost: {
            type: 'constant',
            content: 'http://localhost:11434/v1',
          },
          temperature: {
            type: 'constant',
            content: 0.7,
          },
          systemPrompt: {
            type: 'template',
            content: '# 角色\n你是一个AI助手。\n',
          },
          prompt: {
            type: 'template',
            content: '',
          },
        },
        inputs: {
          type: 'object',
          required: ['modelName', 'apiKey', 'apiHost', 'temperature', 'prompt'],
          properties: {
            modelName: {
              type: 'string',
            },
            apiKey: {
              type: 'string',
            },
            apiHost: {
              type: 'string',
            },
            temperature: {
              type: 'number',
            },
            systemPrompt: {
              type: 'string',
              extra: {
                formComponent: 'prompt-editor',
              },
            },
            prompt: {
              type: 'string',
              extra: {
                formComponent: 'prompt-editor',
              },
            },
          },
        },
        outputs: {
          type: 'object',
          properties: {
            result: { type: 'string' },
          },
        },
      },
    };
  },
};
