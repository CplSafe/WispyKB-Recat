/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useState } from 'react';
import { Select } from '@douyinfe/semi-ui';

import { getWorkflowApi } from '../../services/workflow-api';
import { i18n } from '@flowgram/i18n';

interface WorkflowAppOption {
  id: string;
  name: string;
  description?: string;
}

export const WorkflowAppSelect = ({
  value,
  onChange,
  readonly,
}: {
  value: any;
  onChange: (val: any) => void;
  readonly?: boolean;
}) => {
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    const loadWorkflowApps = async () => {
      try {
        const api = getWorkflowApi();
        const result = await api.getWorkflowApps();
        if (result.success && result.data) {
          setOptions(
            result.data.map((app: WorkflowAppOption) => ({
              label: app.name,
              value: app.id,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to load workflow apps:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkflowApps();
  }, []);

  // Extract the actual content value if value is an object with type/content
  const actualValue = value?.content !== undefined ? value.content : value;

  // Handle change to update in the FlowGram value format
  const handleChange = (newValue: string) => {
    if (typeof value === 'object' && value?.type !== undefined) {
      onChange({ ...value, content: newValue });
    } else {
      onChange(newValue);
    }
  };

  return (
    <Select
      placeholder={i18n.t('selectWorkflowApp')}
      loading={loading}
      disabled={readonly}
      value={actualValue}
      onChange={handleChange}
      optionList={options}
      filter
      style={{ width: '100%' }}
    />
  );
};
