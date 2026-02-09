export interface MCPConfig {
  id: string;
  name: string;
  connection_type: 'http' | 'ws' | 'sse' | 'stdio';
  url?: string;
  command?: string;
  args?: string[];
  auth_token?: string;
  api_key?: string;
  is_active: boolean;
  tools_count?: number;
  created_at?: string;
}

export interface MCPConfigRequest {
  name: string;
  connection_type: 'http' | 'ws' | 'sse' | 'stdio';
  url?: string;
  command?: string;
  args?: string[] | string;
  auth_token?: string;
  api_key?: string;
}

export interface MCPTestRequest {
  connection_type: 'http' | 'ws' | 'sse' | 'stdio';
  url?: string;
  command?: string;
  args?: string[];
  auth_token?: string;
  api_key?: string;
}

export interface MCPTestResponse {
  success: boolean;
  message?: string;
  tools_count?: number;
  tools?: MCPTool[];
}

export interface MCPTool {
  name: string;
  description: string;
  input_schema?: any;
}
