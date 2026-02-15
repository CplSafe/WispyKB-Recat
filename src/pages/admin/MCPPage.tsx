import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  Toast,
  Select,
  Tag,
  Divider,
  Banner,
  List,
  Modal,
  Switch,
  Empty,
  Skeleton,
  Tooltip,
  Sidebar,
} from '@douyinfe/semi-ui';
import {
  IconPlus,
  IconDelete,
  IconWrench,
  IconTickCircle,
  IconCrossCircleStroked,
  IconServer,
  IconCode,
  IconSync,
  IconSetting,
} from '@douyinfe/semi-icons';
import type { MCPConfig, MCPConfigRequest } from '../../types/mcp';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form/interface';
import api from '../../lib/api';

const { Title, Text, Paragraph } = Typography;

interface MCPToolDisplay {
  name: string;
  description: string;
}

function MCPPage() {
  const formApi = useRef<FormApi>();

  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<MCPConfig[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [testing, setTesting] = useState(false);
  const [selectedConfigTools, setSelectedConfigTools] = useState<MCPToolDisplay[]>([]);
  const [toolsModalVisible, setToolsModalVisible] = useState(false);
  const [connectionType, setConnectionType] = useState<'http' | 'ws' | 'sse' | 'stdio'>('http');

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const data = await api.get('/mcp/configs');
      setConfigs(data.configs || []);
    } catch (error: any) {
      Toast.error(error.detail || '加载 MCP 配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: MCPConfigRequest) => {
    const processedValues = {
      ...values,
      args: values.args
        ? typeof values.args === 'string'
          ? (values.args as string).split('\n').filter((arg: string) => arg.trim())
          : values.args
        : undefined,
    };

    setCreating(true);
    try {
      await api.post('/mcp/configs', processedValues);
      Toast.success('MCP 配置创建成功');
      setCreateModalVisible(false);
      formApi.current?.reset();
      fetchConfigs();
    } catch (error: any) {
      Toast.error(error.detail || '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (configId: string, configName: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 MCP 配置 "${configName}" 吗？`,
      okText: '删除',
      onOk: async () => {
        try {
          await api.delete(`/mcp/configs/${configId}`);
          Toast.success('删除成功');
          fetchConfigs();
        } catch (error: any) {
          Toast.error(error.detail || '删除失败');
        }
      },
    });
  };

  const handleTest = async () => {
    const values = await formApi.current?.validate();

    const processedValues = {
      ...values,
      args: values.args
        ? typeof values.args === 'string'
          ? values.args.split('\n').filter((arg: string) => arg.trim())
          : values.args
        : undefined,
    };

    setTesting(true);
    try {
      const result = await api.post('/mcp/test', processedValues);
      if (result.success) {
        Toast.success(`连接成功！发现 ${result.tools_count || 0} 个工具`);
      } else {
        Toast.error(result.message || '连接失败');
      }
    } catch (error: any) {
      Toast.error(error.detail || '测试连接失败');
    } finally {
      setTesting(false);
    }
  };

  const viewConfigTools = async (configId: string) => {
    try {
      const result = await api.get(`/mcp/configs/${configId}/tools`);
      setSelectedConfigTools(result.tools || []);
      setToolsModalVisible(true);
    } catch (error: any) {
      Toast.error(error.detail || '获取工具列表失败');
    }
  };

  const toggleConfigActive = async (configId: string, isActive: boolean) => {
    try {
      await api.put(`/mcp/configs/${configId}`, { is_active: isActive });
      Toast.success(isActive ? '已启用' : '已禁用');
      fetchConfigs();
    } catch (error: any) {
      Toast.error(error.detail || '操作失败');
    }
  };

  const getConnectionTypeTag = (type: string) => {
    const colors: Record<string, string> = {
      http: 'blue',
      ws: 'cyan',
      sse: 'green',
      stdio: 'purple',
    };
    const labels: Record<string, string> = {
      http: 'HTTP',
      ws: 'WebSocket',
      sse: 'SSE',
      stdio: 'Local',
    };
    return (
      <Tag color={colors[type] || 'grey'} style={{ margin: 0 }}>
        {labels[type] || type.toUpperCase()}
      </Tag>
    );
  };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Title heading={3} style={{ margin: 0 }}>
          MCP 配置
        </Title>
        <Text type="tertiary">
          配置外部 MCP 服务器，让 AI 助手能够使用更多工具和能力
        </Text>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Banner
          type="info"
          description={
            <Space vertical spacing={4}>
              <Text strong>MCP (Model Context Protocol) 工具配置</Text>
              <Text type="secondary">
                配置外部 MCP 服务器，让 AI 助手能够使用更多工具和能力
              </Text>
            </Space>
          }
          extra={
            <Button
              type="primary"
              theme="solid"
              icon={<IconPlus />}
              onClick={() => setCreateModalVisible(true)}
            >
              添加 MCP 配置
            </Button>
          }
        />

        <Card
          title={
            <Space>
              <IconSetting />
              <Text>已配置的 MCP 服务器</Text>
              <Tag color="purple">{configs.length}</Tag>
            </Space>
          }
        >
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Skeleton.Title style={{ width: 200 }} />
              <Skeleton.Paragraph rows={5} />
            </div>
          ) : configs.length === 0 ? (
            <Empty
              title="暂无 MCP 配置"
              style={{ padding: '40px 0' }}
            >
              <Button
                type="primary"
                theme="solid"
                icon={<IconPlus />}
                onClick={() => setCreateModalVisible(true)}
              >
                添加第一个 MCP 配置
              </Button>
            </Empty>
          ) : (
            <List
              dataSource={configs}
              renderItem={(config) => (
                <div
                  key={config.id}
                  style={{
                    padding: 16,
                    border: '1px solid var(--semi-color-border)',
                    marginBottom: 12,
                    background: 'var(--semi-color-bg-1)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          background: config.connection_type === 'stdio' ? 'var(--semi-color-primary-light-default)' : 'var(--semi-color-info-light-default)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        {config.connection_type === 'stdio' ? (
                          <IconCode style={{ color: 'var(--semi-color-primary)', fontSize: 18 }} />
                        ) : (
                          <IconServer style={{ color: 'var(--semi-color-info)', fontSize: 18 }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <Space>
                          <Text strong>{config.name}</Text>
                          {getConnectionTypeTag(config.connection_type)}
                          {config.is_active ? (
                            <Tag color="green">
                              <IconTickCircle size="small" /> 活跃
                            </Tag>
                          ) : (
                            <Tag color="grey">
                              <IconCrossCircleStroked size="small" /> 未激活
                            </Tag>
                          )}
                        </Space>
                        <Space vertical spacing={4} style={{ marginTop: 4 }}>
                          {config.url && (
                            <Text type="secondary" size="small">
                              URL: {config.url}
                            </Text>
                          )}
                          {config.command && (
                            <Text type="secondary" size="small">
                              命令: {config.command} {config.args?.join(' ') || ''}
                            </Text>
                          )}
                          {config.tools_count !== undefined && (
                            <Text type="secondary" size="small">
                              提供 {config.tools_count} 个工具
                            </Text>
                          )}
                        </Space>
                      </div>
                    </div>
                    <Space>
                      <Switch
                        checked={config.is_active}
                        onChange={(checked) => toggleConfigActive(config.id, checked as boolean)}
                        checkedText="启用"
                        uncheckedText="禁用"
                      />
                      <Button
                        size="small"
                        icon={<IconWrench />}
                        onClick={() => viewConfigTools(config.id)}
                      >
                        工具 ({config.tools_count || 0})
                      </Button>
                      <Button
                        size="small"
                        type="danger"
                        theme="light"
                        icon={<IconDelete />}
                        onClick={() => handleDelete(config.id, config.name)}
                      >
                        删除
                      </Button>
                    </Space>
                  </div>
                </div>
              )}
            />
          )}
        </Card>

        <Card
          title={
            <Space>
              <IconSync />
              <Text>使用说明</Text>
            </Space>
          }
        >
          <Paragraph type="secondary" style={{ marginBottom: 8 }}>
            配置完成后，在创建或编辑应用时可以选择使用的 MCP 服务器。AI 助手将根据对话内容自动调用 MCP 提供的工具。
          </Paragraph>
          <Space vertical spacing={8}>
            <Text type="secondary">
              支持远程 MCP 服务器 (HTTP/HTTPS/WebSocket/SSE)
            </Text>
            <Text type="secondary">
              支持本地 MCP 服务器 (stdio)
            </Text>
            <Text type="secondary">
              支持多个 MCP 配置同时激活
            </Text>
          </Space>
        </Card>
      </div>

      {/* 创建 MCP 配置侧边栏 */}
      <Sidebar.Container
        visible={createModalVisible}
        title="添加 MCP 配置"
        onCancel={() => {
          setCreateModalVisible(false);
          formApi.current?.reset();
        }}
        defaultSize={{ width: 560 }}
      >
        <div style={{ padding: '16px 0' }}>
          <Form
            getFormApi={(api) => { formApi.current = api; }}
            layout="vertical"
            onSubmit={handleCreate}
            initValues={{
              connection_type: 'http',
            }}
          >
            <Text strong style={{ display: 'block', marginBottom: 12 }}>基本信息</Text>

            <Form.Input
              field="name"
              label="配置名称"
              rules={[{ required: true }]}
              placeholder="例如: OpenAI MCP Server"
            />

            <Form.Select
              field="connection_type"
              label="连接类型"
              rules={[{ required: true }]}
              onChange={(value) => setConnectionType(value as 'http' | 'ws' | 'sse' | 'stdio')}
              optionList={[
                { label: 'HTTP/HTTPS', value: 'http' },
                { label: 'WebSocket', value: 'ws' },
                { label: 'Server-Sent Events', value: 'sse' },
                { label: '本地进程 (stdio)', value: 'stdio' },
              ]}
            />

            {connectionType !== 'stdio' && (
              <Form.Input
                field="url"
                label="服务器 URL"
                rules={[{ required: true }]}
                placeholder="https://example.com/mcp"
                extra="MCP 服务器的完整 URL 地址"
              />
            )}

            {connectionType === 'stdio' && (
              <>
                <Form.Input
                  field="command"
                  label="命令"
                  rules={[{ required: true }]}
                  placeholder="npx"
                  extra="启动 MCP 服务器的命令，如 npx, python, node 等"
                />
                <Form.TextArea
                  field="args"
                  label="命令参数"
                  placeholder={"-y\n@modelcontextprotocol/server-filesystem\n/path/to/directory"}
                  rows={3}
                  extra="命令的参数列表，每行一个参数"
                />
              </>
            )}

            <Divider margin="12px">认证配置（可选）</Divider>

            <Form.Input
              field="auth_token"
              label="Bearer Token"
              mode="password"
              placeholder="eyJhbGciOiJIUzI1NiIs..."
              extra="用于 Bearer 认证的令牌"
            />

            <Form.Input
              field="api_key"
              label="API Key"
              mode="password"
              placeholder="sk-..."
              extra="用于 API Key 认证"
            />
          </Form>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <Button onClick={() => setCreateModalVisible(false)}>
              取消
            </Button>
            <Button onClick={handleTest} loading={testing}>
              测试连接
            </Button>
            <Button type="primary" theme="solid" onClick={() => formApi.current?.submit()} loading={creating}>
              创建配置
            </Button>
          </div>
        </div>
      </Sidebar.Container>

      {/* 工具列表侧边栏 */}
      <Sidebar.Container
        visible={toolsModalVisible}
        title="可用工具列表"
        onCancel={() => setToolsModalVisible(false)}
        defaultSize={{ width: 480 }}
      >
        <div style={{ padding: '16px 0' }}>
          <List
            dataSource={selectedConfigTools}
            renderItem={(tool) => (
              <div style={{ padding: '12px 0', borderBottom: '1px solid var(--semi-color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'var(--semi-color-primary-light-default)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <IconWrench style={{ color: 'var(--semi-color-primary)' }} />
                  </div>
                  <div>
                    <Text strong>{tool.name}</Text>
                    <br />
                    <Text type="secondary" size="small">{tool.description}</Text>
                  </div>
                </div>
              </div>
            )}
            emptyContent={<Empty title="暂无工具" />}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button type="primary" onClick={() => setToolsModalVisible(false)}>关闭</Button>
          </div>
        </div>
      </Sidebar.Container>
    </>
  );
}

export default MCPPage;
