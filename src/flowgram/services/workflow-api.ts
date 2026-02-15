/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import api from '../../lib/api';
import { FlowDocumentJSON } from '../typings';

/**
 * 工作流保存响应
 */
export interface SaveWorkflowResponse {
  success: boolean;
  data?: {
    id: string;
    name: string;
    icon?: string;
    description?: string;
    updatedAt: string;
  };
  error?: string;
}

/**
 * 工作流加载响应
 */
export interface LoadWorkflowResponse {
  success: boolean;
  data?: FlowDocumentJSON & {
    id?: string;
    name?: string;
    icon?: string;
    description?: string;
  };
  error?: string;
}

/**
 * 工作流版本
 */
export interface WorkflowVersion {
  id: string;
  version: string;
  createdAt: string;
  description?: string;
  isPublished: boolean;
}

/**
 * 保存状态
 */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * 工作流 API 服务
 */
export class WorkflowApiService {
  private saveStatus: SaveStatus = 'idle';
  private lastError: string | null = null;

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
      icon?: string;
      tags?: string[];
    }
  ): Promise<SaveWorkflowResponse> {
    this.setSaveStatus('saving');

    try {
      const payload = {
        ...metadata,
        definition: data,
      };

      let result: any;
      if (workflowId) {
        result = await api.put(`/workflows/${workflowId}`, payload);
      } else {
        result = await api.post('/workflows', payload);
      }

      this.setSaveStatus('saved');
      // 1.5秒后重置为 idle
      setTimeout(() => {
        if (this.saveStatus === 'saved') {
          this.setSaveStatus('idle');
        }
      }, 1500);

      return {
        success: true,
        data: result.data || result,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
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
      const result = await api.get(`/workflows/${workflowId}`);

      return {
        success: true,
        data: {
          ...result.data?.definition,
          id: result.data?.id,
          name: result.data?.name,
          icon: result.data?.icon,
          description: result.data?.description,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 发布工作流
   * @param workflowId 工作流 ID
   * @param description 发布描述
   */
  async publishWorkflow(
    workflowId: string,
    description?: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await api.post(`/workflows/${workflowId}/publish`, { description });
      return {
        success: true,
        data: result.data || result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 获取工作流版本历史
   * @param workflowId 工作流 ID
   */
  async getWorkflowVersions(workflowId: string): Promise<{ success: boolean; data?: WorkflowVersion[]; error?: string }> {
    try {
      const result = await api.get(`/workflows/${workflowId}/versions`);
      return {
        success: true,
        data: result.data || result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 上传工作流图标
   * @param workflowId 工作流 ID
   * @param file 图标文件
   */
  async uploadIcon(workflowId: string, file: File): Promise<{ success: boolean; data?: { icon: string }; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await api.post(`/workflows/${workflowId}/icon`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // 将相对 URL 转换为完整 URL
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8888';
      let iconUrl = result.data?.icon || result.icon;
      if (iconUrl && !iconUrl.startsWith('http')) {
        iconUrl = `${API_URL}${iconUrl}`;
      }

      return {
        success: true,
        data: { icon: iconUrl },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
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

      const queryString = queryParams.toString();
      const url = queryString ? `/workflows?${queryString}` : '/workflows';
      const result = await api.get(url);

      return {
        success: true,
        data: result.data || result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 获取知识库列表
   */
  async getKnowledgeBases(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const result = await api.get('/knowledge-bases');
      // 后端返回格式: {"knowledge_bases": [...]}
      const data = result.knowledge_bases || result.data || result;
      return {
        success: true,
        data: Array.isArray(data) ? data : [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 获取 MCP 服务列表
   */
  async getMcpServices(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const result = await api.get('/mcp-services');
      return {
        success: true,
        data: result.data || result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 获取工作流应用列表（标签为"工作流应用"的工作流）
   */
  async getWorkflowApps(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const result = await api.get('/workflows?tag=工作流应用');
      // 后端返回格式: {"workflows": [...]} 或直接是数组
      const data = result.workflows || result.data || result;
      return {
        success: true,
        data: Array.isArray(data) ? data : [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
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
