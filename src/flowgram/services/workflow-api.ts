/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { FlowDocumentJSON } from '../typings';

/**
 * 工作流保存响应
 */
export interface SaveWorkflowResponse {
  success: boolean;
  data?: {
    id: string;
    name: string;
    updatedAt: string;
  };
  error?: string;
}

/**
 * 工作流加载响应
 */
export interface LoadWorkflowResponse {
  success: boolean;
  data?: FlowDocumentJSON;
  error?: string;
}

/**
 * 保存状态
 */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * 工作流 API 服务
 */
export class WorkflowApiService {
  private baseURL: string;
  private saveStatus: SaveStatus = 'idle';
  private lastError: string | null = null;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
  }

  /**
   * 获取当前保存状态
   */
  getSaveStatus(): SaveStatus {
    return this.saveStatus;
  }

  /**
   * 获取最后一次错误
   */
  getLastError(): string | null {
    return this.lastError;
  }

  /**
   * 设置保存状态
   */
  private setSaveStatus(status: SaveStatus, error?: string): void {
    this.saveStatus = status;
    this.lastError = error || null;
  }

  /**
   * 保存工作流
   * @param workflowId 工作流 ID，如果为空则创建新的
   * @param data 工作流数据
   * @param metadata 元数据（名称、描述等）
   */
  async saveWorkflow(
    workflowId: string | null,
    data: FlowDocumentJSON,
    metadata?: {
      name?: string;
      description?: string;
      tags?: string[];
    }
  ): Promise<SaveWorkflowResponse> {
    this.setSaveStatus('saving');

    try {
      const url = workflowId
        ? `${this.baseURL}/workflows/${workflowId}`
        : `${this.baseURL}/workflows`;

      const response = await fetch(url, {
        method: workflowId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...metadata,
          definition: data,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        this.setSaveStatus('saved');
        // 1.5秒后重置为 idle
        setTimeout(() => {
          if (this.saveStatus === 'saved') {
            this.setSaveStatus('idle');
          }
        }, 1500);

        return {
          success: true,
          data: result.data,
        };
      } else {
        const errorMsg = result.error || result.message || '保存失败';
        this.setSaveStatus('error', errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '网络错误，保存失败';
      this.setSaveStatus('error', errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * 加载工作流
   * @param workflowId 工作流 ID
   */
  async loadWorkflow(workflowId: string): Promise<LoadWorkflowResponse> {
    try {
      const response = await fetch(`${this.baseURL}/workflows/${workflowId}`);
      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          data: result.data.definition,
        };
      } else {
        return {
          success: false,
          error: result.error || result.message || '加载失败',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误，加载失败',
      };
    }
  }

  /**
   * 获取工作流列表
   */
  async getWorkflows(params?: {
    tags?: string[];
    page?: number;
    pageSize?: number;
  }): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.tags?.length) {
        queryParams.append('tags', params.tags.join(','));
      }
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.pageSize) {
        queryParams.append('pageSize', params.pageSize.toString());
      }

      const response = await fetch(`${this.baseURL}/workflows?${queryParams}`);
      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: result.data || result,
        };
      } else {
        return {
          success: false,
          error: result.error || result.message || '获取列表失败',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误',
      };
    }
  }

  /**
   * 获取知识库列表
   */
  async getKnowledgeBases(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/knowledge-bases`);
      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: result.data || result,
        };
      } else {
        return {
          success: false,
          error: result.error || result.message || '获取知识库列表失败',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误',
      };
    }
  }

  /**
   * 获取 MCP 服务列表
   */
  async getMcpServices(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/mcp-services`);
      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: result.data || result,
        };
      } else {
        return {
          success: false,
          error: result.error || result.message || '获取 MCP 服务列表失败',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误',
      };
    }
  }
}

// 创建单例实例
let workflowApiInstance: WorkflowApiService | null = null;

export const getWorkflowApi = (baseURL?: string): WorkflowApiService => {
  if (!workflowApiInstance) {
    workflowApiInstance = new WorkflowApiService(baseURL);
  }
  return workflowApiInstance;
};
