/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { Field } from '@flowgram.ai/free-layout-editor';
import { InputNumber } from '@douyinfe/semi-ui';

import { useNodeRenderContext } from '../../../hooks';
import { FormItem } from '../../../form-components';
import { i18n } from '@flowgram/i18n';

export function Timeout() {
  const { readonly } = useNodeRenderContext();

  return (
    <div>
      <FormItem name={i18n.t('timeout')} required style={{ flex: 1 }} type="number">
        <Field<number> name="timeout.timeout" defaultValue={10000}>
          {({ field }) => (
            <InputNumber
              size="small"
              value={field.value}
              onChange={(value) => {
                field.onChange(value as number);
              }}
              disabled={readonly}
              style={{ width: '100%' }}
              min={0}
            />
          )}
        </Field>
      </FormItem>
      <FormItem name={i18n.t('retryTimes')} required type="number">
        <Field<number> name="timeout.retryTimes" defaultValue={1}>
          {({ field }) => (
            <InputNumber
              size="small"
              value={field.value}
              onChange={(value) => {
                field.onChange(value as number);
              }}
              disabled={readonly}
              style={{ width: '100%' }}
              min={0}
            />
          )}
        </Field>
      </FormItem>
    </div>
  );
}
