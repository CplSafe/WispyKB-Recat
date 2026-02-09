/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { FC, useState } from 'react';

import { Field } from '@flowgram.ai/free-layout-editor';
import { Input } from '@douyinfe/semi-ui';

import { useI18n } from '@flowgram/hooks';
import { GroupField } from '../constant';

export const GroupTitle: FC = () => {
  const [inputting, setInputting] = useState(false);
  const i18n = useI18n();
  return (
    <Field<string> name={GroupField.Title}>
      {({ field }) =>
        inputting ? (
          <Input
            autoFocus
            className="workflow-group-title-input"
            size="small"
            value={field.value}
            onChange={field.onChange}
            onMouseDown={(e) => e.stopPropagation()}
            onBlur={() => setInputting(false)}
            draggable={false}
            onEnterPress={() => setInputting(false)}
          />
        ) : (
          <p className="workflow-group-title" onDoubleClick={() => setInputting(true)}>
            {field.value ?? i18n.t('group')}
          </p>
        )
      }
    </Field>
  );
};
