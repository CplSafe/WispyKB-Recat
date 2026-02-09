import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  message,
  Select,
  Tag,
  Divider,
  Alert,
  List,
  Modal,
  Switch,
  Empty,
  Spin,
  Tooltip,
} from 'antd';
import {
  ApiOutlined,
  PlusOutlined,
  DeleteOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloudServerOutlined,
  CodeOutlined,
  SyncOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { MCPConfig, MCPConfigRequest } from '../../types/mcp';
import api from '../../lib/api';

const { Text, Paragraph, Title } = Typography;
const { TextArea } = Input;

interface MCPToolDisplay {
  name: string;
  description: string;
}

function MCPPage() {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

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
      messageApi.error(error.detail || '加载 MCP 配置失败');
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
      messageApi.success('MCP 配置创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      fetchConfigs();
    } catch (error: any) {
      messageApi.error(error.detail || '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (configId: string, configName: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 MCP 配置 "${configName}" 吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.delete(`/mcp/configs/${configId}`);
          messageApi.success('删除成功');
          fetchConfigs();
        } catch (error: any) {
          messageApi.error(error.detail || '删除失败');
        }
      },
    });
  };

  const handleTest = async () => {
    const values = await form.validateFields();

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
        messageApi.success(`连接成功！发现 ${result.tools_count || 0} 个工具`);
      } else {
        messageApi.error(result.message || '连接失败');
      }
    } catch (error: any) {
      messageApi.error(error.detail || '测试连接失败');
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
      messageApi.error(error.detail || '获取工具列表失败');
    }
  };

  const toggleConfigActive = async (configId: string, isActive: boolean) => {
    try {
      await api.put(`/mcp/configs/${configId}`, { is_active: isActive });
      messageApi.success(isActive ? '已启用' : '已禁用');
      fetchConfigs();
    } catch (error: any) {
      messageApi.error(error.detail || '操作失败');
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
      <Tag color={colors[type] || 'default'} style={{ margin: 0 }}>
        {labels[type] || type.toUpperCase()}
      </Tag>
    );
  };

  return (
    <>
      {contextHolder}
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0, color: '#1E293B', fontSize: 20, fontWeight: 600 }}>
            MCP 配置
          </Title>
          <Text style={{ color: '#64748B', fontSize: 13 }}>
            配置外部 MCP 服务器，让 AI 助手能够使用更多工具和能力
          </Text>
        </div>

        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            message={
              <Space direction="vertical" size={4}>
                <Text strong>MCP (Model Context Protocol) 工具配置</Text>
                <Text type="secondary">
                  配置外部 MCP 服务器，让 AI 助手能够使用更多工具和能力
                </Text>
              </Space>
            }
            type="info"
            showIcon
            icon={<ApiOutlined />}
            action={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
                style={{ borderRadius: 8 }}
              >
                添加 MCP 配置
              </Button>
            }
          />

          <Card
            title={
              <Space>
                <SettingOutlined />
                <span>已配置的 MCP 服务器</span>
                <Tag color="purple">{configs.length}</Tag>
              </Space>
            }
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: '16px' } }}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin />
              </div>
            ) : configs.length === 0 ? (
              <Empty
                description="暂无 MCP 配置"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: '40px 0' }}
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateModalVisible(true)}
                >
                  添加第一个 MCP 配置
                </Button>
              </Empty>
            ) : (
              <List
                dataSource={configs}
                renderItem={(config) => (
                  <List.Item
                    key={config.id}
                    style={{
                      padding: '16px',
                      borderRadius: 8,
                      border: '1px solid #E2E8F0',
                      marginBottom: 12,
                      background: '#FAFAFA',
                    }}
                    actions={[
                      <Switch
                        key="active"
                        checked={config.is_active}
                        onChange={(checked) => toggleConfigActive(config.id, checked)}
                        checkedChildren="启用"
                        unCheckedChildren="禁用"
                      />,
                      <Button
                        key="tools"
                        size="small"
                        icon={<ToolOutlined />}
                        onClick={() => viewConfigTools(config.id)}
                      >
                        工具 ({config.tools_count || 0})
                      </Button>,
                      <Button
                        key="delete"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(config.id, config.name)}
                      >
                        删除
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            background: config.connection_type === 'stdio' ? '#F3E8FF' : '#E0F2FE',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {config.connection_type === 'stdio' ? (
                            <CodeOutlined style={{ color: '#7C3AED', fontSize: 18 }} />
                          ) : (
                            <CloudServerOutlined style={{ color: '#0284C7', fontSize: 18 }} />
                          )}
                        </div>
                      }
                      title={
                        <Space>
                          <Text strong>{config.name}</Text>
                          {getConnectionTypeTag(config.connection_type)}
                          {config.is_active ? (
                            <Tag color="success" icon={<CheckCircleOutlined />}>活跃</Tag>
                          ) : (
                            <Tag color="default" icon={<CloseCircleOutlined />}>未激活</Tag>
                          )}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={4}>
                          {config.url && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              URL: {config.url}
                            </Text>
                          )}
                          {config.command && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              命令: {config.command} {config.args?.join(' ') || ''}
                            </Text>
                          )}
                          {config.tools_count !== undefined && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              提供 {config.tools_count} 个工具
                            </Text>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Card
            title={
              <Space>
                <SyncOutlined />
                <span>使用说明</span>
              </Space>
            }
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: '16px' } }}
          >
            <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
              配置完成后，在创建或编辑应用时可以选择使用的 MCP 服务器。AI 助手将根据对话内容自动调用 MCP 提供的工具。
            </Paragraph>
            <Space direction="vertical" size={8}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                • 支持远程 MCP 服务器 (HTTP/HTTPS/WebSocket/SSE)
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                • 支持本地 MCP 服务器 (stdio)
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                • 支持多个 MCP 配置同时激活
              </Text>
            </Space>
          </Card>
        </Space>

        <Modal
          title={
            <Space>
              <PlusOutlined />
              添加 MCP 配置
            </Space>
          }
          open={createModalVisible}
          onCancel={() => {
            setCreateModalVisible(false);
            form.resetFields();
          }}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreate}
            initialValues={{
              connection_type: 'http',
            }}
          >
            <Form.Item
              label="配置名称"
              name="name"
              rules={[{ required: true, message: '请输入配置名称' }]}
            >
              <Input placeholder="例如: OpenAI MCP Server" />
            </Form.Item>

            <Form.Item
              label="连接类型"
              name="connection_type"
              rules={[{ required: true }]}
            >
              <Select
                onChange={(value) => setConnectionType(value)}
                options={[
                  { label: 'HTTP/HTTPS', value: 'http' },
                  { label: 'WebSocket', value: 'ws' },
                  { label: 'Server-Sent Events', value: 'sse' },
                  { label: '本地进程 (stdio)', value: 'stdio' },
                ]}
              />
            </Form.Item>

            {connectionType !== 'stdio' && (
              <Form.Item
                label="服务器 URL"
                name="url"
                rules={[{ required: true, message: '请输入服务器 URL' }]}
                tooltip="MCP 服务器的完整 URL 地址"
              >
                <Input placeholder="https://example.com/mcp" />
              </Form.Item>
            )}

            {connectionType === 'stdio' && (
              <>
                <Form.Item
                  label="命令"
                  name="command"
                  rules={[{ required: true, message: '请输入命令' }]}
                  tooltip="启动 MCP 服务器的命令，如 npx, python, node 等"
                >
                  <Input placeholder="npx" />
                </Form.Item>
                <Form.Item
                  label="命令参数"
                  name="args"
                  tooltip="命令的参数列表，每行一个参数"
                >
                  <TextArea
                    rows={3}
                    placeholder="-y&#10;@modelcontextprotocol/server-filesystem&#10;/path/to/directory"
                  />
                </Form.Item>
              </>
            )}

            <Divider orientation="left" style={{ fontSize: 12, margin: '16px 0' }}>
              认证配置（可选）
            </Divider>

            <Form.Item
              label="Bearer Token"
              name="auth_token"
              tooltip="用于 Bearer 认证的令牌"
            >
              <Input.Password placeholder="eyJhbGciOiJIUzI1NiIs..." />
            </Form.Item>

            <Form.Item
              label="API Key"
              name="api_key"
              tooltip="用于 API Key 认证"
            >
              <Input.Password placeholder="sk-..." />
            </Form.Item>

            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setCreateModalVisible(false)}>
                  取消
                </Button>
                <Button onClick={handleTest} loading={testing}>
                  测试连接
                </Button>
                <Button type="primary" htmlType="submit" loading={creating}>
                  创建配置
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={
            <Space>
              <ToolOutlined />
              可用工具列表
            </Space>
          }
          open={toolsModalVisible}
          onCancel={() => setToolsModalVisible(false)}
          footer={
            <Button type="primary" onClick={() => setToolsModalVisible(false)}>
              关闭
            </Button>
          }
          width={600}
        >
          <List
            dataSource={selectedConfigTools}
            renderItem={(tool) => (
              <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                <List.Item.Meta
                  avatar={
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: '#F3E8FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ToolOutlined style={{ color: '#7C3AED' }} />
                    </div>
                  }
                  title={<Text strong style={{ fontSize: 13 }}>{tool.name}</Text>}
                  description={<Text type="secondary" style={{ fontSize: 12 }}>{tool.description}</Text>}
                />
              </List.Item>
            )}
            locale={{ emptyText: <Empty description="暂无工具" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
          />
        </Modal>
      </div>
    </>
  );
}

export default MCPPage;
