/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { Field } from '@flowgram.ai/free-layout-editor';
import { DynamicValueInput, PromptEditorWithVariables } from '@flowgram.ai/form-materials';

import { FormItem } from '../form-item';
import { Feedback } from '../feedback';
import { JsonSchema } from '../../typings';
import { useNodeRenderContext } from '../../hooks';
import {
  KnowledgeBaseSelect,
  MCPServiceSelect,
  MCPMethodSelect,
  WorkflowAppSelect,
} from '../form-selects';
import { useState, useCallback } from 'react';

interface MCPServiceOption {
  id: string;
  name: string;
  methods?: string[];
}

export function FormInputs() {
  const { readonly } = useNodeRenderContext();
  const [selectedMcpService, setSelectedMcpService] = useState<MCPServiceOption | null>(null);

  const handleMcpServiceChange = useCallback((service: MCPServiceOption | null) => {
    setSelectedMcpService(service);
  }, []);

  return (
    <Field<JsonSchema> name="inputs">
      {({ field: inputsField }) => {
        const required = inputsField.value?.required || [];
        const properties = inputsField.value?.properties;
        if (!properties) {
          return <></>;
        }
        const content = Object.keys(properties).map((key) => {
          const property = properties[key];

          const formComponent = property.extra?.formComponent;

          const vertical = ['prompt-editor', 'code-editor'].includes(formComponent || '');

          return (
            <Field key={key} name={`inputsValues.${key}`} defaultValue={property.default}>
              {({ field, fieldState }) => (
                <FormItem
                  name={key}
                  vertical={vertical}
                  type={property.type as string}
                  required={required.includes(key)}
                  title={property.title as string}
                >
                  {formComponent === 'prompt-editor' && (
                    <PromptEditorWithVariables
                      value={field.value}
                      onChange={field.onChange}
                      readonly={readonly}
                      hasError={Object.keys(fieldState?.errors || {}).length > 0}
                    />
                  )}
                  {formComponent === 'knowledge-base-select' && (
                    <KnowledgeBaseSelect
                      value={field.value}
                      onChange={field.onChange}
                      readonly={readonly}
                    />
                  )}
                  {formComponent === 'mcp-service-select' && (
                    <MCPServiceSelect
                      value={field.value}
                      onChange={field.onChange}
                      readonly={readonly}
                      onServiceChange={handleMcpServiceChange}
                    />
                  )}
                  {formComponent === 'mcp-method-select' && (
                    <MCPMethodSelect
                      value={field.value}
                      onChange={field.onChange}
                      readonly={readonly}
                      serviceId={selectedMcpService?.id}
                    />
                  )}
                  {formComponent === 'workflow-app-select' && (
                    <WorkflowAppSelect
                      value={field.value}
                      onChange={field.onChange}
                      readonly={readonly}
                    />
                  )}
                  {!formComponent && (
                    <DynamicValueInput
                      value={field.value}
                      onChange={field.onChange}
                      readonly={readonly}
                      hasError={Object.keys(fieldState?.errors || {}).length > 0}
                      schema={property}
                    />
                  )}
                  <Feedback errors={fieldState?.errors} warnings={fieldState?.warnings} />
                </FormItem>
              )}
            </Field>
          );
        });
        return <>{content}</>;
      }}
    </Field>
  );
}
