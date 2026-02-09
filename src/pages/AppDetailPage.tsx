import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Input,
  Card,
  Space,
  Typography,
  message,
  Tag,
  Switch,
  Row,
  Col,
  Spin,
  Divider,
  Empty,
  Modal,
  InputNumber,
} from 'antd';
import {
  ArrowLeftOutlined,
  RobotOutlined,
  SaveOutlined,
  DatabaseOutlined,
  MessageOutlined,
  ThunderboltOutlined,
  LockOutlined,
  GlobalOutlined,
  CodeOutlined,
  ApiOutlined,
  ToolOutlined,
  CopyOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import api from '../lib/api';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
}

interface MCPConfig {
  id: string;
  name: string;
  connection_type: 'stdio' | 'sse';
  url?: string;
  command?: string;
  args?: string[];
  tools_count?: number;
}

interface Application {
  id: string;
  name: string;
  description?: string;
  model: string;
  knowledge_base_ids: string[];
  mcp_config_ids?: string[];
  is_public: boolean;
  system_prompt?: string;
  welcome_message?: string;
  share_id?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
  embedding_model?: string;
  embedding_dimension?: number;
  similarity_threshold?: number;
}

function AppDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const appId = params.id as string;

  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [app, setApp] = useState<Application | null>(null);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [mcpConfigs, setMcpConfigs] = useState<MCPConfig[]>([]);
  const [embedModalVisible, setEmbedModalVisible] = useState(false);
  const [origin, setOrigin] = useState('');

  // Form state
  const [appName, setAppName] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedKBs, setSelectedKBs] = useState<string[]>([]);
  const [selectedMcpIds, setSelectedMcpIds] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');

  // LLM & RAG Parameters
  const [temperature, setTemperature] = useState(0.1);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [topP, setTopP] = useState(0.9);
  const [topK, setTopK] = useState(5);
  const [embeddingModel, setEmbeddingModel] = useState('nomic-embed-text');
  const [embeddingDimension, setEmbeddingDimension] = useState(768);
  // 相似度阈值
  const [similarityThreshold, setSimilarityThreshold] = useState(0.5);

  const availableModels = [
    'deepseek-r1:8b',
    'deepseek-r1:32b',
    'llama3.2',
    'llama3.1:8b',
    'qwen2.5:7b',
    'gemma2:9b',
  ];

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    fetchApplication();
    fetchKnowledgeBases();
    fetchMcpConfigs();
  }, [appId]);

  const fetchApplication = async () => {
    setLoading(true);
    try {
      const data = await api.get('/applications');
      const applications = data.applications || [];
      const foundApp = applications.find((a: Application) => a.id === appId);

      if (foundApp) {
        setApp(foundApp);
        setAppName(foundApp.name || '');
        setAppDescription(foundApp.description || '');
        setSelectedModel(foundApp.model || 'deepseek-r1:8b');
        setSelectedKBs(foundApp.knowledge_base_ids || []);
        setSelectedMcpIds(foundApp.mcp_config_ids || []);
        setIsPublic(foundApp.is_public || false);
        setSystemPrompt(foundApp.system_prompt || '');
        setWelcomeMessage(foundApp.welcome_message || '');
        // LLM & RAG 参数
        setTemperature(foundApp.temperature ?? 0.1);
        setMaxTokens(foundApp.max_tokens ?? 2048);
        setTopP(foundApp.top_p ?? 0.9);
        setTopK(foundApp.top_k ?? 5);
        setEmbeddingModel(foundApp.embedding_model ?? 'nomic-embed-text');
        setEmbeddingDimension(foundApp.embedding_dimension ?? 768);
        // 相似度阈值
        setSimilarityThreshold(foundApp.similarity_threshold ?? 0.5);
      } else {
        messageApi.error('应用不存在');
        navigate('/apps');
      }
    } catch (error) {
      console.error('Failed to fetch application:', error);
      messageApi.error('加载失败');
      navigate('/apps');
    } finally {
      setLoading(false);
    }
  };

  const fetchKnowledgeBases = async () => {
    try {
      const data = await api.get('/knowledge-bases');
      setKnowledgeBases(data.knowledge_bases || []);
    } catch (error) {
      console.error('Failed to fetch knowledge bases:', error);
    }
  };

  const fetchMcpConfigs = async () => {
    try {
      const data = await api.get('/mcp/configs');
      setMcpConfigs(data.configs || []);
    } catch (error) {
      console.error('Failed to fetch MCP configs:', error);
    }
  };

  const handleSave = async () => {
    if (!appName.trim()) {
      messageApi.warning('请输入应用名称');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/applications/${appId}`, {
        name: appName,
        description: appDescription,
        model: selectedModel,
        knowledge_base_ids: selectedKBs,
        mcp_config_ids: selectedMcpIds.length > 0 ? selectedMcpIds : null,
        is_public: isPublic,
        system_prompt: systemPrompt,
        welcome_message: welcomeMessage,
        // LLM 参数
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        // RAG 参数
        top_k: topK,
        similarity_threshold: similarityThreshold,
        // Embedding 参数
        embedding_model: embeddingModel,
        embedding_dimension: embeddingDimension,
      });

      messageApi.success('保存成功');
      setApp({
        ...app!,
        name: appName,
        description: appDescription,
        mcp_config_ids: selectedMcpIds,
      });
    } catch (error) {
      messageApi.error(typeof error === 'string' ? error : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async (text: string, successMessage: string = '已复制到剪贴板') => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        messageApi.success(successMessage);
      } catch (err) {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          messageApi.success(successMessage);
        } else {
          throw new Error('复制不可用');
        }
      } finally {
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('Copy failed:', error);
      messageApi.error('复制失败，请手动复制');
    }
  };

  const handleShare = () => {
    if (app?.share_id && origin) {
      const shareUrl = `${origin}/share/${app.share_id}`;
      copyToClipboard(shareUrl, '分享链接已复制到剪贴板');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#64748B' }}>加载中...</div>
      </div>
    );
  }

  return (
    <>
      {contextHolder}
      <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
        <Space orientation="vertical" size={24} style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space size={16}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/apps')}
                style={{ borderRadius: 8 }}
              >
                返回
              </Button>
              <div>
                <Title level={4} style={{ margin: 0, color: '#1E293B', fontSize: 18 }}>
                  编辑应用
                </Title>
                <Text style={{ color: '#64748B', fontSize: 13 }}>
                  配置应用的参数和知识库
                </Text>
              </div>
            </Space>
            <Space>
              <Button
                icon={<CodeOutlined />}
                onClick={() => setEmbedModalVisible(true)}
                style={{ borderRadius: 8 }}
              >
                嵌入代码
              </Button>
              <Button
                icon={isPublic ? <GlobalOutlined /> : <LockOutlined />}
                onClick={handleShare}
                style={{ borderRadius: 8 }}
              >
                {isPublic ? '复制分享链接' : '设为公开后可分享'}
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saving}
                style={{ borderRadius: 8 }}
              >
                保存
              </Button>
            </Space>
          </div>

          <Row gutter={24}>
            {/* Left Panel - Settings */}
            <Col span={16}>
              <Space orientation="vertical" size={16} style={{ width: '100%' }}>
                {/* Basic Info */}
                <Card
                  title={
                    <Space>
                      <RobotOutlined />
                      <Text>基本信息</Text>
                    </Space>
                  }
                  styles={{ body: { padding: '20px' } }}
                >
                  <Space orientation="vertical" size={16} style={{ width: '100%' }}>
                    <div>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>应用名称</Text>
                      <Input
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        placeholder="例如：客服助手"
                        style={{ borderRadius: 8 }}
                      />
                    </div>
                    <div>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>应用描述</Text>
                      <TextArea
                        value={appDescription}
                        onChange={(e) => setAppDescription(e.target.value)}
                        placeholder="描述这个应用的用途..."
                        rows={3}
                        style={{ borderRadius: 8 }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <Text strong>公开应用</Text>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                          开启后可以通过链接访问
                        </div>
                      </div>
                      <Switch checked={isPublic} onChange={setIsPublic} />
                    </div>
                  </Space>
                </Card>

                {/* Model Settings */}
                <Card
                  title={
                    <Space>
                      <MessageOutlined />
                      <Text>模型设置</Text>
                    </Space>
                  }
                  styles={{ body: { padding: '20px' } }}
                >
                  <Space orientation="vertical" size={16} style={{ width: '100%' }}>
                    <div>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>选择模型</Text>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: '1px solid #E2E8F0',
                          fontSize: 14,
                        }}
                      >
                        {availableModels.map(model => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>系统提示词</Text>
                      <TextArea
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        placeholder="设置 AI 助手的角色和行为..."
                        rows={4}
                        style={{ borderRadius: 8 }}
                      />
                    </div>
                    <div>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>欢迎语</Text>
                      <TextArea
                        value={welcomeMessage}
                        onChange={(e) => setWelcomeMessage(e.target.value)}
                        placeholder="用户打开对话时显示的欢迎消息..."
                        rows={2}
                        style={{ borderRadius: 8 }}
                      />
                    </div>

                    {/* Advanced Parameters */}
                    <Divider orientation="left">高级参数</Divider>

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
                            <Text type="secondary" style={{ fontSize: 11 }}>最大 Token</Text>
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
                      <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Input
                              type="number"
                              min={1}
                              max={20}
                              value={topK}
                              onChange={(e) => setTopK(parseInt(e.target.value) || 5)}
                              addonBefore="检索数量 (Top K)"
                            />
                          </Col>
                          <Col span={12}>
                            <div>
                              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                                相似度阈值
                              </Text>
                              <InputNumber
                                min={0}
                                max={1}
                                step={0.05}
                                value={similarityThreshold}
                                onChange={(val) => setSimilarityThreshold(val ?? 0.5)}
                                style={{ width: '100%' }}
                              />
                            </div>
                          </Col>
                        </Row>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          💡 系统将自动使用语义搜索、全文搜索、混合搜索等多种方式检索，合并最优结果
                        </Text>
                      </Space>
                    </div>

                    {/* Embedding Parameters */}
                    <div>
                      <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                        Embedding 向量参数
                      </Text>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Input
                            value={embeddingModel}
                            onChange={(e) => setEmbeddingModel(e.target.value)}
                            addonBefore="Embedding 模型"
                          />
                        </Col>
                        <Col span={12}>
                          <Input
                            type="number"
                            value={embeddingDimension}
                            onChange={(e) => setEmbeddingDimension(parseInt(e.target.value) || 768)}
                            addonBefore="向量维度"
                            suffix="维"
                          />
                        </Col>
                      </Row>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        💡 常见维度: nomic-embed-text=768, bge-large-zh=1024, m3e-large=1024
                      </Text>
                    </div>
                  </Space>
                </Card>

                {/* Knowledge Base */}
                <Card
                  title={
                    <Space>
                      <DatabaseOutlined />
                      <Text>关联知识库</Text>
                    </Space>
                  }
                  styles={{ body: { padding: '20px' } }}
                >
                  {knowledgeBases.length === 0 ? (
                    <Empty description="暂无知识库" />
                  ) : (
                    <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                      {knowledgeBases.map(kb => (
                        <div
                          key={kb.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px',
                            borderRadius: 8,
                            border: '1px solid #E2E8F0',
                            background: selectedKBs.includes(kb.id) ? '#F0F9FF' : '#FAFAFA',
                          }}
                        >
                          <Space>
                            <DatabaseOutlined style={{ color: '#7C3AED' }} />
                            <div>
                              <Text strong style={{ color: '#1E293B' }}>{kb.name}</Text>
                              {kb.description && (
                                <div style={{ fontSize: 12, color: '#64748B' }}>{kb.description}</div>
                              )}
                            </div>
                          </Space>
                          <Switch
                            checked={selectedKBs.includes(kb.id)}
                            onChange={(checked) => {
                              if (checked) {
                                setSelectedKBs([...selectedKBs, kb.id]);
                              } else {
                                setSelectedKBs(selectedKBs.filter(id => id !== kb.id));
                              }
                            }}
                          />
                        </div>
                      ))}
                    </Space>
                  )}
                </Card>

                {/* MCP Tools Configuration */}
                <Card
                  title={
                    <Space>
                      <ApiOutlined />
                      <Text>MCP 工具</Text>
                      {selectedMcpIds.length > 0 && <Tag color="purple">{selectedMcpIds.length}</Tag>}
                    </Space>
                  }
                  styles={{ body: { padding: '20px' } }}
                >
                  {mcpConfigs.length === 0 ? (
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
                        前往设置 MCP
                      </Button>
                    </Empty>
                  ) : (
                    <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        选择 MCP 服务器，让 AI 助手可以使用外部工具
                      </Text>
                      {mcpConfigs.map(mcp => (
                        <div
                          key={mcp.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px',
                            borderRadius: 8,
                            border: '1px solid #E2E8F0',
                            background: selectedMcpIds.includes(mcp.id) ? '#F5F3FF' : '#FAFAFA',
                          }}
                        >
                          <Space>
                            <ToolOutlined style={{ color: '#7C3AED' }} />
                            <div>
                              <Text strong style={{ color: '#1E293B' }}>{mcp.name}</Text>
                              <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Tag
                                  color={mcp.connection_type === 'stdio' ? 'green' : 'blue'}
                                  style={{ margin: 0, fontSize: 10 }}
                                >
                                  {mcp.connection_type.toUpperCase()}
                                </Tag>
                                {mcp.url && (
                                  <Text style={{ fontSize: 11 }} ellipsis={{ tooltip: mcp.url }}>
                                    {mcp.url}
                                  </Text>
                                )}
                                {mcp.command && (
                                  <Text style={{ fontSize: 11 }} ellipsis={{ tooltip: `${mcp.command} ${mcp.args?.join(' ') || ''}` }}>
                                    {mcp.command} {mcp.args?.[0] || ''}
                                  </Text>
                                )}
                                {mcp.tools_count !== undefined && (
                                  <Text style={{ fontSize: 11 }}>
                                    {mcp.tools_count} 个工具
                                  </Text>
                                )}
                              </div>
                            </div>
                          </Space>
                          <Switch
                            checked={selectedMcpIds.includes(mcp.id)}
                            onChange={(checked) => {
                              if (checked) {
                                setSelectedMcpIds([...selectedMcpIds, mcp.id]);
                              } else {
                                setSelectedMcpIds(selectedMcpIds.filter(id => id !== mcp.id));
                              }
                            }}
                          />
                        </div>
                      ))}
                    </Space>
                  )}
                </Card>
              </Space>
            </Col>

            {/* Right Panel - Preview */}
            <Col span={8}>
              <Card
                title={
                  <Space>
                    <ThunderboltOutlined />
                    <Text>预览</Text>
                  </Space>
                }
                styles={{ body: { padding: '20px' } }}
              >
                <Space orientation="vertical" size={16} style={{ width: '100%' }}>
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                      textAlign: 'center',
                    }}
                  >
                    <RobotOutlined style={{ fontSize: 32, color: 'white' }} />
                    <Title level={5} style={{ margin: '8px 0 4px', color: 'white' }}>
                      {appName || '未命名应用'}
                    </Title>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                      {appDescription || '暂无描述'}
                    </Text>
                  </div>

                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>当前配置</Text>
                    <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#64748B' }}>模型</Text>
                        <Tag color="blue">{selectedModel}</Tag>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#64748B' }}>知识库</Text>
                        <Text>{selectedKBs.length} 个</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#64748B' }}>MCP 工具</Text>
                        <Text>{selectedMcpIds.length > 0 ? `${selectedMcpIds.length} 个` : '-'}</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#64748B' }}>访问权限</Text>
                        <Tag color={isPublic ? 'green' : 'default'}>
                          {isPublic ? '公开' : '私有'}
                        </Tag>
                      </div>
                    </Space>
                  </div>

                  {app?.share_id && (
                    <>
                      <Divider style={{ margin: '12px 0' }} />
                      <div>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>分享链接</Text>
                        <Text
                          copyable
                          style={{
                            fontSize: 12,
                            color: '#2563EB',
                            wordBreak: 'break-all',
                          }}
                        >
                          {origin ? `${origin}/share/${app.share_id}` : '加载中...'}
                        </Text>
                      </div>
                    </>
                  )}
                </Space>
              </Card>
            </Col>
          </Row>
        </Space>

        {/* Embed Code Modal */}
        <Modal
          title="嵌入第三方"
          open={embedModalVisible}
          onCancel={() => setEmbedModalVisible(false)}
          footer={null}
          width={960}
          styles={{ body: { padding: '20px' } }}
          closeIcon={<CloseOutlined style={{ fontSize: 16, color: '#6B7280' }} />}
        >
          <Row gutter={16}>
            {/* 全屏模式 */}
            <Col span={8}>
              <div
                style={{
                  background: '#F8F9FA',
                  border: '1px solid #E0E0E0',
                  borderRadius: 8,
                  padding: 16,
                  height: '100%',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 12 }}>
                  全屏模式
                </div>

                <div
                  style={{
                    background: '#F0F2F5',
                    borderRadius: 6,
                    padding: 12,
                    marginBottom: 12,
                    height: 100,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#6366F1' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#8B5CF6' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#A78BFA' }} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ height: 8, background: '#E0E0E0', borderRadius: 2, width: '60%' }} />
                    <div style={{ height: 8, background: '#E0E0E0', borderRadius: 2, width: '40%' }} />
                    <div style={{ flex: 1, background: '#E8E8E8', borderRadius: 4, marginTop: 4 }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: '#1A1A1A' }}>复制以下代码进行嵌入</span>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => {
                        const shareId = app?.share_id || 'APP_ID';
                        const code = `<div id="ai-chat-${shareId}"></div>
<script src="${origin}/embed/${shareId}.js" data-mode="fullscreen" async></script>`;
                        copyToClipboard(code, '代码已复制到剪贴板');
                      }}
                      style={{ fontSize: 12, height: 24, padding: '0 8px' }}
                    >
                      复制
                    </Button>
                  </div>
                  <div
                    style={{
                      background: '#F8F9FA',
                      border: '1px solid #E0E0E0',
                      borderRadius: 6,
                      padding: 12,
                      fontSize: 11,
                      fontFamily: 'Consolas, Monaco, monospace',
                      color: '#1A1A1A',
                      maxHeight: 80,
                      overflow: 'auto',
                      lineHeight: '18px',
                    }}
                  >
                    {origin ? `<div id="ai-chat-${app?.share_id || 'APP_ID'}"></div>
<script src="${origin}/embed/${app?.share_id || 'APP_ID'}.js" data-mode="fullscreen" async></script>` : ''}
                  </div>
                </div>
              </div>
            </Col>

            {/* 移动端模式 */}
            <Col span={8}>
              <div
                style={{
                  background: '#F8F9FA',
                  border: '1px solid #E0E0E0',
                  borderRadius: 8,
                  padding: 16,
                  height: '100%',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 12 }}>
                  移动端模式
                </div>

                <div
                  style={{
                    background: '#F0F2F5',
                    borderRadius: 6,
                    padding: 12,
                    marginBottom: 12,
                    height: 100,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 50,
                      height: 80,
                      background: '#FFFFFF',
                      borderRadius: 8,
                      border: '2px solid #6366F1',
                      padding: 6,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div
                      style={{
                        height: 6,
                        background: '#6366F1',
                        borderRadius: 2,
                        marginBottom: 4,
                      }}
                    />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ height: 6, background: '#E0E0E0', borderRadius: 2, alignSelf: 'flex-start', width: '70%' }} />
                      <div style={{ height: 6, background: '#6366F1', borderRadius: 2, alignSelf: 'flex-end', width: '60%' }} />
                      <div style={{ height: 6, background: '#E0E0E0', borderRadius: 2, alignSelf: 'flex-start', width: '50%' }} />
                    </div>
                    <div style={{ height: 8, background: '#E8E8E8', borderRadius: 2, marginTop: 4 }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: '#1A1A1A' }}>复制以下代码进行嵌入</span>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => {
                        const shareId = app?.share_id || 'APP_ID';
                        const code = `<div id="ai-chat-${shareId}"></div>
<script src="${origin}/embed/${shareId}.js" data-mode="mobile" async></script>`;
                        copyToClipboard(code, '代码已复制到剪贴板');
                      }}
                      style={{ fontSize: 12, height: 24, padding: '0 8px' }}
                    >
                      复制
                    </Button>
                  </div>
                  <div
                    style={{
                      background: '#F8F9FA',
                      border: '1px solid #E0E0E0',
                      borderRadius: 6,
                      padding: 12,
                      fontSize: 11,
                      fontFamily: 'Consolas, Monaco, monospace',
                      color: '#1A1A1A',
                      maxHeight: 80,
                      overflow: 'auto',
                      lineHeight: '18px',
                    }}
                  >
                    {origin ? `<div id="ai-chat-${app?.share_id || 'APP_ID'}"></div>
<script src="${origin}/embed/${app?.share_id || 'APP_ID'}.js" data-mode="mobile" async></script>` : ''}
                  </div>
                </div>
              </div>
            </Col>

            {/* 浮窗模式 */}
            <Col span={8}>
              <div
                style={{
                  background: '#F8F9FA',
                  border: '1px solid #E0E0E0',
                  borderRadius: 8,
                  padding: 16,
                  height: '100%',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 12 }}>
                  浮窗模式
                </div>

                <div
                  style={{
                    background: '#F0F2F5',
                    borderRadius: 6,
                    padding: 12,
                    marginBottom: 12,
                    height: 100,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'flex-end',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: 60,
                      height: 70,
                      background: '#FFFFFF',
                      borderRadius: 8,
                      border: '1px solid #E0E0E0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      padding: 8,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div
                      style={{
                        height: 6,
                        background: '#6366F1',
                        borderRadius: 2,
                        marginBottom: 6,
                      }}
                    />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ height: 6, background: '#E0E0E0', borderRadius: 2, width: '70%' }} />
                      <div style={{ height: 6, background: '#6366F1', borderRadius: 2, width: '50%', alignSelf: 'flex-end' }} />
                      <div style={{ height: 6, background: '#E0E0E0', borderRadius: 2, width: '60%' }} />
                    </div>
                    <div style={{ height: 8, background: '#E8E8E8', borderRadius: 2, marginTop: 'auto' }} />
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      right: 8,
                      bottom: 8,
                      width: 20,
                      height: 20,
                      background: '#6366F1',
                      borderRadius: '50%',
                      border: '2px solid #FFFFFF',
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: '#1A1A1A' }}>复制以下代码进行嵌入</span>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => {
                        const shareId = app?.share_id || 'APP_ID';
                        const code = `<script src="${origin}/embed/${shareId}.js" async></script>`;
                        copyToClipboard(code, '代码已复制到剪贴板');
                      }}
                      style={{ fontSize: 12, height: 24, padding: '0 8px' }}
                    >
                      复制
                    </Button>
                  </div>
                  <div
                    style={{
                      background: '#F8F9FA',
                      border: '1px solid #E0E0E0',
                      borderRadius: 6,
                      padding: 12,
                      fontSize: 11,
                      fontFamily: 'Consolas, Monaco, monospace',
                      color: '#1A1A1A',
                      maxHeight: 80,
                      overflow: 'auto',
                      lineHeight: '18px',
                    }}
                  >
                    {origin ? `<script src="${origin}/embed/${app?.share_id || 'APP_ID'}.js" async></script>` : ''}
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Modal>
      </div>
    </>
  );
}

export default AppDetailPage;
