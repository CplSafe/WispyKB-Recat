/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { nanoid } from 'nanoid';

import { WorkflowNodeType } from '../constants';
import { FlowNodeRegistry } from '../../typings';
import iconCode from '../../assets/icon-script.png';
import { formMeta } from './form-meta';
import { i18n } from '@flowgram/i18n';

let index = 0;

const defaultCode = `// 您可以使用 'params' 获取节点的输入变量，使用 'ret' 输出结果。
// 'params' 已正确注入到环境中。
// 以下是从节点输入中获取名为 'input' 的参数值的示例：
// const input = params.input;
// 以下是输出包含多种数据类型的 'ret' 对象的示例：
// const ret = { "name": '小明', "hobbies": ["阅读", "旅行"] };

async function main({ params }) {
  // 构建输出对象
  const ret = {
    key0: params.input + params.input, // 将输入参数 'input' 连接两次
    key1: ["hello", "world"], // 输出数组
    key2: { // 输出对象
      key21: "hi"
    },
  };

  return ret;
}`;

export const CodeNodeRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.Code,
  info: {
    icon: iconCode,
    title: i18n.t('code'),
    description: i18n.t('codeDesc'),
  },
  meta: {
    size: {
      width: 360,
      height: 390,
    },
  },
  onAdd() {
    return {
      id: `code_${nanoid(5)}`,
      type: 'code',
      data: {
        title: `${i18n.t('code')}_${++index}`,
        inputsValues: {
          input: { type: 'constant', content: '' },
        },
        script: {
          language: 'javascript',
          content: defaultCode,
        },
        outputs: {
          type: 'object',
          properties: {
            key0: {
              type: 'string',
            },
            key1: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            key2: {
              type: 'object',
              properties: {
                key21: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    };
  },
  formMeta: formMeta,
};
