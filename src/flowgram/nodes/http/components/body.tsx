/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { Field } from '@flowgram.ai/free-layout-editor';
import {
  IFlowTemplateValue,
  JsonEditorWithVariables,
  PromptEditorWithVariables,
} from '@flowgram.ai/form-materials';
import { Select } from '@douyinfe/semi-ui';

import { useNodeRenderContext } from '../../../hooks';
import { FormItem } from '../../../form-components';
import { i18n } from '@flowgram/i18n';

const BODY_TYPE_OPTIONS = [
  {
    label: i18n.t('none'),
    value: 'none',
  },
  {
    label: i18n.t('json'),
    value: 'JSON',
  },
  {
    label: i18n.t('rawText'),
    value: 'raw-text',
  },
];

export function Body() {
  const { readonly } = useNodeRenderContext();

  const renderBodyEditor = (bodyType: string) => {
    switch (bodyType) {
      case 'JSON':
        return (
          <Field<IFlowTemplateValue> name="body.json">
            {({ field }) => (
              <JsonEditorWithVariables
                value={field.value?.content}
                readonly={readonly}
                activeLinePlaceholder="use var by '@'"
                onChange={(value) => {
                  field.onChange({ type: 'template', content: value });
                }}
              />
            )}
          </Field>
        );
      case 'raw-text':
        return (
          <Field<IFlowTemplateValue> name="body.rawText">
            {({ field }) => (
              <PromptEditorWithVariables
                disableMarkdownHighlight
                readonly={readonly}
                style={{ flexGrow: 1 }}
                placeholder={i18n.t('inputRawTextUseVar')}
                onChange={(value) => {
                  field.onChange(value!);
                }}
              />
            )}
          </Field>
        );
      default:
        return null;
    }
  };

  return (
    <Field<string> name="body.bodyType" defaultValue="JSON">
      {({ field }) => (
        <div style={{ marginTop: 5 }}>
          <FormItem name={i18n.t('body')} vertical type="object">
            <Select
              value={field.value}
              onChange={(value) => {
                field.onChange(value as string);
              }}
              style={{ width: '100%', marginBottom: 10 }}
              disabled={readonly}
              size="small"
              optionList={BODY_TYPE_OPTIONS}
            />
            {renderBodyEditor(field.value)}
          </FormItem>
        </div>
      )}
    </Field>
  );
}
