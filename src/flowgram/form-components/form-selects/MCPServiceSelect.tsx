/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useState } from 'react';
import { Select } from '@douyinfe/semi-ui';

import { getWorkflowApi } from '../../services/workflow-api';
import { i18n } from '@flowgram/i18n';

interface MCPServiceOption {
  id: string;
  name: string;
  description?: string;
  methods?: string[];
}

export const MCPServiceSelect = ({
  value,
  onChange,
  readonly,
  onServiceChange,
}: {
  value: any;
  onChange: (val: any) => void;
  readonly?: boolean;
  onServiceChange?: (service: MCPServiceOption | null) => void;
}) => {
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    const loadMcpServices = async () => {
      try {
        const api = getWorkflowApi();
        const result = await api.getMcpServices();
        if (result.success && result.data) {
          setOptions(
            result.data.map((service: MCPServiceOption) => ({
              label: service.name,
              value: service.id,
              data: service,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to load MCP services:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMcpServices();
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

    // Find and notify the selected service data
    const selectedOption = (options as any).find((opt: any) => opt.value === newValue);
    if (onServiceChange && selectedOption) {
      onServiceChange(selectedOption.data);
    } else if (onServiceChange) {
      onServiceChange(null);
    }
  };

  return (
    <Select
      placeholder={i18n.t('selectMcpService')}
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
