import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Input,
  Select,
  Card,
  Modal,
  Form,
  Radio,
  Space,
  message,
  Tag,
  Tooltip,
  Empty,
  Spin,
  Row,
  Col,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  RobotOutlined,
  PlusOutlined,
  DeleteOutlined,
  GlobalOutlined,
  LockOutlined,
  SendOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  StarOutlined,
  ThunderboltOutlined,
  MessageOutlined,
  FileTextOutlined,
  SettingOutlined,
  LinkOutlined,
  BranchesOutlined,
  ApiOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import api from '../lib/api';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface OnlineModelConfig {
  id: string;
  provider: 'openai' | 'anthropic' | 'azure' | 'google' | 'deepseek' | 'qwen' | 'custom';
  name: string;
  baseUrl?: string;
  apiKey: string;
  model: string;
}

interface MCPConfig {
  id: string;
  name: string;
  connection_type: 'stdio' | 'sse' | 'http';
  url?: string;
  command?: string;
  args?: string[];
  tools_count?: number;
}

interface SuggestedQuestion {
  text: string;
}

function NewAppPage() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  // Basic info
  const [appName, setAppName] = useState('');
  const [appDesc, setAppDesc] = useState('');
  const [appIcon, setAppIcon] = useState('robot');

  // Knowledge bases
  const [knowledgeBases, setKnowledgeBases] = useState<any[]>([]);
  const [selectedKBIds, setSelectedKBIds] = useState<string[]>([]);
  const [loadingKB, setLoadingKB] = useState(false);

  // MCP configurations
  const [mcpConfigs, setMcpConfigs] = useState<MCPConfig[]>([]);
  const [selectedMcpIds, setSelectedMcpIds] = useState<string[]>([]);
  const [loadingMcp, setLoadingMcp] = useState(false);

  // Model selection
  const [modelType, setModelType] = useState<'ollama' | 'online'>('ollama');
  const [onlineModels, setOnlineModels] = useState<OnlineModelConfig[]>([]);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('deepseek-r1:8b');

  // Modals
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isOnlineModelModalOpen, setIsOnlineModelModalOpen] = useState(false);
  const [publishAccessMode, setPublishAccessMode] = useState<'public' | 'private'>('public');
  const [publishPassword, setPublishPassword] = useState('');
  const [onlineModelForm] = Form.useForm();

  // Welcome & Prompt
  const [welcomeMessage, setWelcomeMessage] = useState('你好，我是AI助手，请问有什么可以帮你的？');
  const [systemPrompt, setSystemPrompt] = useState('你是一个专业的AI客服助手。请基于知识库内容准确回答问题。');
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([
    { text: '这个产品有什么功能？' },
    { text: '如何使用API？' },
    { text: '价格是多少？' },
  ]);

  // LLM & RAG Parameters
  const [temperature, setTemperature] = useState(0.1);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [topP, setTopP] = useState(0.9);
  const [topK, setTopK] = useState(5);
  const [embeddingModel, setEmbeddingModel] = useState('nomic-embed-text');
  const [embeddingDimension, setEmbeddingDimension] = useState(768);

  // Preview
  const [previewMessages, setPreviewMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // Loading states
  const [publishing, setPublishing] = useState(false);

  // App type selection
  const [appType, setAppType] = useState<'chat' | 'workflow'>('chat');

  // Icons mapping
  const icons: Record<string, React.ElementType> = {
    robot: RobotOutlined,
    message: MessageOutlined,
    file: FileTextOutlined,
    tool: SettingOutlined,
    link: LinkOutlined,
    star: StarOutlined,
    thunder: ThunderboltOutlined,
  };

  const CurrentIcon = icons[appIcon] || RobotOutlined;

  useEffect(() => {
    fetchKnowledgeBases();
    fetchMcpConfigs();
    // Set default model list to avoid cross-origin Ollama requests
    setOllamaModels(['deepseek-r1:8b', 'llama3.2:3b', 'qwen2.5:7b']);
  }, []);

  const fetchKnowledgeBases = async () => {
    setLoadingKB(true);
    try {
      const data = await api.get('/knowledge-bases');
      setKnowledgeBases(data.knowledge_bases || []);
    } catch (error) {
      console.error('Failed to fetch knowledge bases:', error);
    } finally {
      setLoadingKB(false);
    }
  };

  const fetchMcpConfigs = async () => {
    setLoadingMcp(true);
    try {
      const data = await api.get('/mcp/configs');
      setMcpConfigs(data.configs || []);
    } catch (error) {
      console.error('Failed to fetch MCP configs:', error);
    } finally {
      setLoadingMcp(false);
    }
  };

  const handleSendPreview = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setPreviewMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setPreviewLoading(true);

    try {
      const data = await api.post('/chat', {
        query: userMessage,
        knowledge_base_ids: selectedKBIds.length > 0 ? selectedKBIds : undefined,
        model: selectedModel || 'deepseek-r1:8b',
      });

      setPreviewMessages(prev => [...prev, { role: 'assistant', content: data.answer || 'Sorry, I cannot answer this question.' }]);
    } catch (error) {
      setPreviewMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, service is temporarily unavailable.' }]);
    } finally {
      setPreviewLoading(false);
    }
  };

  const validateForm = () => {
    if (!appName.trim()) {
      messageApi.warning('请输入应用名称');
      return false;
    }
    if (!selectedModel) {
      messageApi.warning('请选择AI模型');
      return false;
    }
    return true;
  };

  const handlePublish = async () => {
    if (!validateForm()) return;
    setIsPublishModalOpen(true);
  };

  const confirmPublish = async () => {
    setPublishing(true);
    try {
      const app = await api.post('/applications', {
        name: appName,
        description: appDesc,
        model: selectedModel,
        knowledge_base_ids: selectedKBIds,
        mcp_config_ids: selectedMcpIds.length > 0 ? selectedMcpIds : undefined,
        welcome_message: welcomeMessage,
        system_prompt: systemPrompt,
        is_public: publishAccessMode === 'public',
        share_password: publishAccessMode === 'public' && publishPassword ? publishPassword : undefined,
        // LLM 参数
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        // RAG 参数
        top_k: topK,
        // Embedding 参数
        embedding_model: embeddingModel,
        embedding_dimension: embeddingDimension,
      });

      messageApi.success('应用发布成功');
      if (publishAccessMode === 'public') {
        const shareLink = `${window.location.origin}/share/${app.id}`;
        navigator.clipboard.writeText(shareLink);
        messageApi.success('分享链接已复制');
      }
      navigate('/apps');
    } catch (error) {
      messageApi.error(typeof error === 'string' ? error : '发布失败');
    } finally {
      setPublishing(false);
      setIsPublishModalOpen(false);
    }
  };

  const iconOptionStyle = (selected: boolean): React.CSSProperties => ({
    width: 32,
    height: 32,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    background: selected ? '#1890ff' : '#f5f5f5',
    color: selected ? 'white' : '#8c8c8c',
    transition: 'all 0.2s',
  });

  const messageBubbleStyle = (isUser: boolean): React.CSSProperties => ({
    maxWidth: '85%',
    padding: '8px 12px',
    borderRadius: 8,
    background: isUser ? '#1890ff' : 'white',
    color: isUser ? 'white' : '#262626',
    alignSelf: isUser ? 'flex-end' : 'flex-start',
    fontSize: 13,
    lineHeight: 1.4,
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  });

  return (
    <>
      {contextHolder}
      <div style={{ minHeight: 'calc(100vh - 64px)', background: '#f5f5f5' }}>
        <div style={{
          background: 'white',
          borderBottom: '1px solid #e8e8e8',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Space size="large">
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/apps')} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#1890ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CurrentIcon style={{ color: 'white', fontSize: 18 }} />
              </div>
              <Title level={5} style={{ margin: 0 }}>创建 AI 应用</Title>
            </div>
          </Space>

          {/* App Type Selector */}
          <Space>
            <Radio.Group
              value={appType}
              onChange={(e) => {
                const newType = e.target.value as 'chat' | 'workflow';
                if (newType === 'workflow' && newType !== appType) {
                  // Navigate to workflow creation
                  navigate('/apps/new/workflow');
                } else if (newType === 'chat' && newType !== appType) {
                  setAppType(newType);
                }
              }}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="chat">
                <RobotOutlined /> 对话
              </Radio.Button>
              <Radio.Button value="workflow">
                <BranchesOutlined /> 工作流
              </Radio.Button>
            </Radio.Group>
          </Space>

          <Space>
            <Button onClick={() => navigate('/apps')}>取消</Button>
            <Button type="primary" icon={<GlobalOutlined />} onClick={handlePublish}>
              发布
            </Button>
          </Space>
        </div>

        <Row gutter={0} style={{ marginTop: 24 }}>
          <Col span={12} style={{ padding: 24, borderRight: '1px solid #e8e8e8', background: 'white' }}>
            <Space orientation="vertical" size="large" style={{ width: '100%' }}>
              {/* Basic Info */}
              <Card title="基本信息" size="small">
                <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>图标</Text>
                    <Space size={8}>
                      {(Object.keys(icons) as string[]).map((key) => {
                        const IconComp = icons[key];
                        return (
                          <Tooltip key={key} title={key}>
                            <div
                              style={iconOptionStyle(appIcon === key)}
                              onClick={() => setAppIcon(key)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = appIcon === key ? '#40a9ff' : '#e6e6e6';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = appIcon === key ? '#1890ff' : '#f5f5f5';
                              }}
                            >
                              <IconComp style={{ fontSize: 14 }} />
                            </div>
                          </Tooltip>
                        );
                      })}
                    </Space>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>应用名称</Text>
                    <Input
                      placeholder="例如：客服助手"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>描述</Text>
                    <Input
                      placeholder="简要描述..."
                      value={appDesc}
                      onChange={(e) => setAppDesc(e.target.value)}
                    />
                  </div>
                </Space>
              </Card>

              {/* Knowledge Base */}
              <Card
                title={
                  <Space>
                    <DatabaseOutlined />
                    <span>知识库</span>
                    {selectedKBIds.length > 0 && <Tag color="blue">{selectedKBIds.length}</Tag>}
                  </Space>
                }
                size="small"
              >
                {loadingKB ? (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <Spin />
                  </div>
                ) : knowledgeBases.length === 0 ? (
                  <Empty description="暂无可用知识库" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <Select
                    mode="multiple"
                    placeholder="选择知识库"
                    value={selectedKBIds}
                    onChange={setSelectedKBIds}
                    options={knowledgeBases.map(kb => ({
                      label: `${kb.name} (${kb.doc_count || 0} 文档)`,
                      value: kb.id,
                    }))}
                    style={{ width: '100%' }}
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  />
                )}
              </Card>

              {/* AI Model */}
              <Card
                title={
                  <Space>
                    <RobotOutlined />
                    <span>AI 模型</span>
                    {selectedModel && <Tag color="green">{selectedModel}</Tag>}
                  </Space>
                }
                size="small"
              >
                <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                  <Radio.Group value={modelType} onChange={(e) => setModelType(e.target.value)}>
                    <Radio.Button value="ollama"><CloudServerOutlined /> Ollama</Radio.Button>
                    <Radio.Button value="online"><GlobalOutlined /> 在线模型</Radio.Button>
                  </Radio.Group>

                  {modelType === 'ollama' ? (
                    ollamaModels.length > 0 ? (
                      <Select
                        placeholder="选择模型"
                        value={selectedModel}
                        onChange={setSelectedModel}
                        options={ollamaModels.map(m => ({ label: m, value: m }))}
                        showSearch
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        style={{ width: '100%' }}
                      />
                    ) : (
                      <Empty description="未找到 Ollama 模型" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    )
                  ) : (
                    <Space orientation="vertical" style={{ width: '100%' }}>
                      <Button onClick={() => setIsOnlineModelModalOpen(true)} block>
                        <PlusOutlined /> 添加在线模型
                      </Button>
                      {onlineModels.map((model) => (
                        <Card
                          key={model.id}
                          size="small"
                          hoverable
                          onClick={() => setSelectedModel(model.id)}
                          style={{ borderColor: selectedModel === model.id ? '#1890ff' : undefined }}
                        >
                          <Space>
                            <GlobalOutlined />
                            <Text>{model.name}</Text>
                            {selectedModel === model.id && <CheckCircleOutlined style={{ color: '#1890ff' }} />}
                          </Space>
                        </Card>
                      ))}
                    </Space>
                  )}
                </Space>
              </Card>

              {/* MCP Tools Configuration */}
              <Card
                title={
                  <Space>
                    <ApiOutlined />
                    <span>MCP 工具</span>
                    {selectedMcpIds.length > 0 && <Tag color="purple">{selectedMcpIds.length}</Tag>}
                  </Space>
                }
                size="small"
              >
                {loadingMcp ? (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <Spin />
                  </div>
                ) : mcpConfigs.length === 0 ? (
                  <Empty
                    description="暂无 MCP 配置"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    style={{ padding: '20px 0' }}
                  >
                    <Button
                      type="link"
                      onClick={() => navigate('/settings')}
                      style={{ padding: 0 }}
                    >
                      前往 MCP 设置
                    </Button>
                  </Empty>
                ) : (
                  <Space orientation="vertical" size="small" style={{ width: '100%' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      选择 MCP 服务器以启用 AI 助手的外部工具
                    </Text>
                    <Select
                      mode="multiple"
                      placeholder="选择 MCP 服务器"
                      value={selectedMcpIds}
                      onChange={setSelectedMcpIds}
                      options={mcpConfigs.map(mcp => ({
                        label: (
                          <Space>
                            <ToolOutlined style={{ color: '#7C3AED' }} />
                            <span>{mcp.name}</span>
                            <Tag style={{ margin: 0 }} color={mcp.connection_type === 'stdio' ? 'green' : 'blue'}>
                              {mcp.connection_type.toUpperCase()}
                            </Tag>
                            {mcp.tools_count !== undefined && (
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                {mcp.tools_count} 个工具
                              </Text>
                            )}
                          </Space>
                        ),
                        value: mcp.id,
                      }))}
                      style={{ width: '100%' }}
                      filterOption={(input, option) =>
                        (option?.label as any)?.props?.children?.[1]?.toLowerCase()?.includes(input.toLowerCase())
                      }
                      optionLabelProp="children"
                    />
                  </Space>
                )}
              </Card>

              {/* Prompt Settings */}
              <Card title="对话设置" size="small">
                <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>欢迎语</Text>
                    <TextArea
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      placeholder="设置欢迎消息..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>系统提示词</Text>
                    <TextArea
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      placeholder="定义 AI 助手角色..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>建议问题</Text>
                      {suggestedQuestions.length < 3 && (
                        <Button size="small" type="dashed" onClick={() => setSuggestedQuestions([...suggestedQuestions, { text: '' }])}>
                          <PlusOutlined /> 添加
                        </Button>
                      )}
                    </div>
                    <Space orientation="vertical" style={{ width: '100%' }}>
                      {suggestedQuestions.map((q, i) => (
                        <Input
                          key={i}
                          value={q.text}
                          onChange={(e) => {
                            const newQuestions = [...suggestedQuestions];
                            newQuestions[i].text = e.target.value;
                            setSuggestedQuestions(newQuestions);
                          }}
                          placeholder={`Question ${i + 1}`}
                          suffix={
                            <DeleteOutlined
                              style={{ color: '#ff4d4f', cursor: 'pointer' }}
                              onClick={() => setSuggestedQuestions(suggestedQuestions.filter((_, idx) => idx !== i))}
                            />
                          }
                        />
                      ))}
                    </Space>
                  </div>
                </Space>
              </Card>

              {/* Advanced Parameters */}
              <Card
                title={
                  <Space>
                    <SettingOutlined />
                    <span>高级参数</span>
                  </Space>
                }
                size="small"
              >
                <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                  {/* LLM Parameters */}
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                      LLM 参数
                    </Text>
                    <Row gutter={16}>
                      <Col span={8}>
                        <div style={{ marginBottom: 8 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>温度 (Temperature)</Text>
                          <Input
                            type="number"
                            step={0.1}
                            min={0}
                            max={1}
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value) || 0.1)}
                            suffix="0-1"
                          />
                        </div>
                      </Col>
                      <Col span={8}>
                        <div style={{ marginBottom: 8 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>最大 Token (Max Tokens)</Text>
                          <Input
                            type="number"
                            min={256}
                            max={8192}
                            value={maxTokens}
                            onChange={(e) => setMaxTokens(parseInt(e.target.value) || 2048)}
                          />
                        </div>
                      </Col>
                      <Col span={8}>
                        <div style={{ marginBottom: 8 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>Top P</Text>
                          <Input
                            type="number"
                            step={0.1}
                            min={0}
                            max={1}
                            value={topP}
                            onChange={(e) => setTopP(parseFloat(e.target.value) || 0.9)}
                            suffix="0-1"
                          />
                        </div>
                      </Col>
                    </Row>
                  </div>

                  {/* RAG Parameters */}
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                      RAG 检索参数
                    </Text>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>检索数量 (Top K)</Text>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={topK}
                        onChange={(e) => setTopK(parseInt(e.target.value) || 5)}
                      />
                    </div>
                  </div>

                  {/* Embedding Parameters */}
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                      Embedding 向量参数
                    </Text>
                    <Row gutter={16}>
                      <Col span={12}>
                        <div style={{ marginBottom: 8 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>Embedding 模型</Text>
                          <Select
                            value={embeddingModel}
                            onChange={setEmbeddingModel}
                            style={{ width: '100%' }}
                            options={[
                              { label: 'nomic-embed-text (768维)', value: 'nomic-embed-text' },
                              { label: 'bge-base-zh-v1.5 (768维)', value: 'bge-base-zh-v1.5' },
                              { label: 'bge-large-zh-v1.5 (1024维)', value: 'bge-large-zh-v1.5' },
                              { label: 'm3e-large (1024维)', value: 'm3e-large' },
                            ]}
                          />
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ marginBottom: 8 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>向量维度</Text>
                          <Input
                            type="number"
                            value={embeddingDimension}
                            onChange={(e) => setEmbeddingDimension(parseInt(e.target.value) || 768)}
                            suffix="维"
                          />
                        </div>
                      </Col>
                    </Row>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      💡 维度越高语义理解能力越强，但存储和计算开销也越大
                    </Text>
                  </div>
                </Space>
              </Card>
            </Space>
          </Col>

          <Col span={12} style={{ padding: 24, background: '#fafafa' }}>
            <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
              <Text type="secondary">实时预览</Text>

              <Card style={{ maxWidth: 360, margin: '0 auto', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{
                  background: '#1890ff',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}>
                  <CurrentIcon style={{ color: 'white', fontSize: 16 }} />
                  <Text style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>{appName || 'AI 助手'}</Text>
                </div>

                <div style={{ height: 320, overflowY: 'auto', padding: 12, background: '#f5f5f5' }}>
                  {previewMessages.length === 0 ? (
                    <>
                      <div style={{
                        background: 'white',
                        borderRadius: 8,
                        padding: 12,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      }}>
                        <Space orientation="vertical" size="small" style={{ width: '100%' }}>
                          <Space>
                            <div style={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              background: '#1890ff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <CurrentIcon style={{ color: 'white', fontSize: 12 }} />
                            </div>
                            <Text strong>{appName || 'AI 助手'}</Text>
                          </Space>
                          <Text style={{ fontSize: 13, color: '#595959' }}>{welcomeMessage}</Text>
                          {suggestedQuestions.filter(q => q.text.trim()).length > 0 && (
                            <Space orientation="vertical" size="small" style={{ width: '100%' }}>
                              {suggestedQuestions.filter(q => q.text.trim()).map((q, i) => (
                                <Button
                                  key={i}
                                  size="small"
                                  type="dashed"
                                  onClick={() => setInputMessage(q.text)}
                                  style={{ textAlign: 'left', height: 'auto', padding: '4px 8px' }}
                                >
                                  {q.text}
                                </Button>
                              ))}
                            </Space>
                          )}
                        </Space>
                      </div>
                      <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>开始对话测试配置</Text>
                    </>
                  ) : (
                    <>
                      {previewMessages.map((msg, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                          <div style={messageBubbleStyle(msg.role === 'user')}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  {previewLoading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <div style={messageBubbleStyle(false)}>
                        <Space size="small">
                          <Spin size="small" />
                          <Text type="secondary">思考中...</Text>
                        </Space>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ padding: '8px 12px', borderTop: '1px solid #e8e8e8', background: 'white', display: 'flex', gap: 8 }}>
                  <Input
                    placeholder="输入消息..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onPressEnter={handleSendPreview}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendPreview}
                    disabled={!inputMessage.trim() || previewLoading}
                  />
                </div>
              </Card>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Online Model Modal */}
      <Modal
        title="添加在线模型"
        open={isOnlineModelModalOpen}
        onCancel={() => setIsOnlineModelModalOpen(false)}
        onOk={() => {
          onlineModelForm.validateFields().then((values) => {
            setOnlineModels([...onlineModels, { ...values, id: Date.now().toString() }]);
            onlineModelForm.resetFields();
            setIsOnlineModelModalOpen(false);
            messageApi.success('模型添加成功');
          });
        }}
        okText="添加"
        cancelText="取消"
      >
        <Form form={onlineModelForm} layout="vertical">
          <Form.Item name="name" label="配置名称" rules={[{ required: true, message: '请输入配置名称' }]}>
            <Input placeholder="例如：GPT-4" />
          </Form.Item>
          <Form.Item name="apiKey" label="API 密钥" rules={[{ required: true, message: '请输入 API 密钥' }]}>
            <Input.Password placeholder="sk-..." />
          </Form.Item>
          <Form.Item name="model" label="模型名称" initialValue="gpt-4o" rules={[{ required: true }]}>
            <Input placeholder="gpt-4o" />
          </Form.Item>
          <Form.Item name="baseUrl" label="API 地址" initialValue="https://api.openai.com/v1">
            <Input placeholder="https://api.openai.com/v1" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Publish Modal */}
      <Modal
        title="发布应用"
        open={isPublishModalOpen}
        onCancel={() => setIsPublishModalOpen(false)}
        footer={null}
      >
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong style={{ marginBottom: 16, display: 'block' }}>选择访问模式</Text>
            <Radio.Group value={publishAccessMode} onChange={(e) => setPublishAccessMode(e.target.value)} style={{ width: '100%' }}>
              <Radio.Button value="public" style={{ width: '100%', marginBottom: 8, height: 'auto', padding: 16 }}>
                <Space orientation="vertical" size={4}>
                  <Space><GlobalOutlined /> <Text>公开访问</Text></Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>任何人都可以访问</Text>
                </Space>
              </Radio.Button>
              <Radio.Button value="private" style={{ width: '100%', height: 'auto', padding: 16 }}>
                <Space orientation="vertical" size={4}>
                  <Space><LockOutlined /> <Text>私有</Text></Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>仅自己可见</Text>
                </Space>
              </Radio.Button>
            </Radio.Group>
          </div>

          {publishAccessMode === 'public' && (
            <div>
              <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>访问密码（可选）</Text>
              <Input.Password
                placeholder="留空表示无密码"
                value={publishPassword}
                onChange={(e) => setPublishPassword(e.target.value)}
              />
            </div>
          )}

          <div style={{ background: '#e6f7ff', padding: 12, borderRadius: 8 }}>
            <Space>
              <InfoCircleOutlined style={{ color: '#1890ff' }} />
              <Text style={{ fontSize: 12, color: '#595959' }}>
                {publishAccessMode === 'public'
                  ? '发布后将生成分享链接，可以分享给任何人'
                  : '发布后只有您可以在应用列表中查看和使用'}
              </Text>
            </Space>
          </div>

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => setIsPublishModalOpen(false)}>取消</Button>
            <Button type="primary" onClick={confirmPublish} loading={publishing}>
              确认发布
            </Button>
          </Space>
        </Space>
      </Modal>
    </>
  );
}

export default NewAppPage;
