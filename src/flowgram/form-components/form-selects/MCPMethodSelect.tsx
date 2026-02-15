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
  methods?: string[];
}

export const MCPMethodSelect = ({
  value,
  onChange,
  readonly,
  serviceId,
}: {
  value: any;
  onChange: (val: any) => void;
  readonly?: boolean;
  serviceId?: string;
}) => {
  const [loading, setLoading] = useState(false);
  const [methods, setMethods] = useState<string[]>([]);

  useEffect(() => {
    const loadMethods = async () => {
      if (!serviceId) {
        setMethods([]);
        return;
      }

      setLoading(true);
      try {
        const api = getWorkflowApi();
        const result = await api.getMcpServices();
        if (result.success && result.data) {
          const service = result.data.find(
            (s: MCPServiceOption) => s.id === serviceId
          );
          if (service?.methods) {
            setMethods(service.methods);
          } else {
            setMethods([]);
          }
        }
      } catch (error) {
        console.error('Failed to load MCP methods:', error);
        setMethods([]);
      } finally {
        setLoading(false);
      }
    };

    loadMethods();
  }, [serviceId]);

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

  const optionList = methods.map((method) => ({ label: method, value: method }));

  return (
    <Select
      placeholder={i18n.t('selectMethod')}
      loading={loading}
      disabled={readonly || !serviceId}
      value={actualValue}
      onChange={handleChange}
      optionList={optionList}
      filter
      style={{ width: '100%' }}
    />
  );
};
