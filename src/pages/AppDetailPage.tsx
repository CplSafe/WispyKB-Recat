import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Space,
  Typography,
  Toast,
  Tag,
  Switch,
  Row,
  Col,
  Spin,
  Divider,
  Empty,
  Modal,
  Form,
  Tabs,
  TabPane,
} from '@douyinfe/semi-ui';
import {
  IconArrowLeft,
  IconServerStroked,
  IconSave,
  IconArchive,
  IconBolt,
  IconLock,
  IconGlobe,
  IconCode,
  IconLink,
  IconHelm,
} from '@douyinfe/semi-icons';
import api from '../lib/api';

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

const { Text, Title, Paragraph } = Typography;

function AppDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const appId = params.id as string;

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
        Toast.error('应用不存在');
        navigate('/apps');
      }
    } catch (error) {
      console.error('Failed to fetch application:', error);
      Toast.error('加载失败');
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
      Toast.warning('请输入应用名称');
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

      Toast.success('保存成功');
      setApp({
        ...app!,
        name: appName,
        description: appDescription,
        mcp_config_ids: selectedMcpIds,
      });
    } catch (error) {
      Toast.error(typeof error === 'string' ? error : '保存失败');
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
        Toast.success(successMessage);
      } catch (err) {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          Toast.success(successMessage);
        } else {
          throw new Error('复制不可用');
        }
      } finally {
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('Copy failed:', error);
      Toast.error('复制失败，请手动复制');
    }
  };

  const handleShare = () => {
    if (app?.share_id && origin) {
      const shareUrl = `${origin}/share/${app.share_id}`;
      copyToClipboard(shareUrl, '分享链接已复制到剪贴板');
    }
  };

  const getFullscreenEmbedCode = () => {
    return `<iframe src="${origin}/share/${app?.share_id || appId}" style="width:100%;height:100vh;border:none;" allow="microphone"></iframe>`;
  };

  const getFloatingEmbedCode = () => {
    return `<script>
(function(){
  var btn=document.createElement('div');
  btn.innerHTML='💬';
  btn.style.cssText='position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:50%;background:var(--semi-color-primary,#6366f1);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:24px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:9999;';
  var frame=document.createElement('iframe');
  frame.src='${origin}/share/${app?.share_id || appId}';
  frame.style.cssText='position:fixed;bottom:90px;right:20px;width:400px;height:600px;border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.15);z-index:9998;display:none;';
  frame.allow='microphone';
  btn.onclick=function(){frame.style.display=frame.style.display==='none'?'block':'none';};
  document.body.appendChild(frame);
  document.body.appendChild(btn);
})();
</script>`;
  };

  const getInlineEmbedCode = () => {
    return `<iframe src="${origin}/share/${app?.share_id || appId}" style="width:100%;height:600px;border:none;border-radius:12px;" allow="microphone"></iframe>`;
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="tertiary">加载中...</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Space>
          <Button icon={<IconArrowLeft />} onClick={() => navigate('/apps')}>
            返回
          </Button>
          <div>
            <Title heading={4} style={{ margin: 0 }}>编辑应用</Title>
            <Text type="tertiary" size="small">配置应用的参数和知识库</Text>
          </div>
        </Space>
        <Space>
          <Button icon={<IconCode />} onClick={() => setEmbedModalVisible(true)}>
            嵌入代码
          </Button>
          <Button
            icon={isPublic ? <IconGlobe /> : <IconLock />}
            onClick={handleShare}
          >
            {isPublic ? '复制分享链接' : '设为公开后可分享'}
          </Button>
          <Button type="primary" icon={<IconSave />} onClick={handleSave} loading={saving}>
            保存
          </Button>
        </Space>
      </div>

      <Row gutter={24}>
        {/* Left Panel - Tabs */}
        <Col span={16}>
          <Tabs type="line" defaultActiveKey="basic">
            {/* 基本信息 Tab */}
            <TabPane tab="基本信息" itemKey="basic">
              <Card style={{ marginTop: 16 }}>
                <Form labelPosition="top">
                  <Form.Input
                    field="name"
                    label="应用名称"
                    placeholder="例如：客服助手"
                    initValue={appName}
                    onChange={(v) => setAppName(v)}
                  />
                  <Form.TextArea
                    field="description"
                    label="应用描述"
                    placeholder="描述这个应用的用途..."
                    rows={3}
                    initValue={appDescription}
                    onChange={(v) => setAppDescription(v)}
                  />
                  <Divider style={{ margin: '16px 0' }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <Text strong>公开应用</Text>
                      <div style={{ marginTop: 4 }}>
                        <Text type="tertiary" size="small">开启后可以通过链接访问</Text>
                      </div>
                    </div>
                    <Switch checked={isPublic} onChange={setIsPublic} />
                  </div>
                </Form>
              </Card>
            </TabPane>

            {/* 模型配置 Tab */}
            <TabPane tab="模型配置" itemKey="model">
              <Card style={{ marginTop: 16 }}>
                <Form labelPosition="top">
                  <Form.Select
                    field="model"
                    label="选择模型"
                    initValue={selectedModel}
                    onChange={(v) => setSelectedModel(v as string)}
                    style={{ width: '100%' }}
                    optionList={availableModels.map(m => ({ value: m, label: m }))}
                  />
                  <Form.TextArea
                    field="system_prompt"
                    label="系统提示词"
                    placeholder="设置 AI 助手的角色和行为..."
                    rows={4}
                    initValue={systemPrompt}
                    onChange={(v) => setSystemPrompt(v)}
                  />
                  <Form.TextArea
                    field="welcome_message"
                    label="欢迎语"
                    placeholder="用户打开对话时显示的欢迎消息..."
                    rows={2}
                    initValue={welcomeMessage}
                    onChange={(v) => setWelcomeMessage(v)}
                  />

                  <Divider orientation="left">LLM 参数</Divider>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.InputNumber
                        field="temperature"
                        label="温度 (Temperature)"
                        initValue={temperature}
                        min={0}
                        max={1}
                        step={0.1}
                        onChange={(v) => setTemperature(v ?? 0.1)}
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Form.InputNumber
                        field="max_tokens"
                        label="最大 Token"
                        initValue={maxTokens}
                        min={256}
                        max={8192}
                        onChange={(v) => setMaxTokens(v ?? 2048)}
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Form.InputNumber
                        field="top_p"
                        label="Top P"
                        initValue={topP}
                        min={0}
                        max={1}
                        step={0.1}
                        onChange={(v) => setTopP(v ?? 0.9)}
                        style={{ width: '100%' }}
                      />
                    </Col>
                  </Row>

                  <Divider orientation="left">RAG 检索参数</Divider>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.InputNumber
                        field="top_k"
                        label="检索数量 (Top K)"
                        initValue={topK}
                        min={1}
                        max={20}
                        onChange={(v) => setTopK(v ?? 5)}
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Form.InputNumber
                        field="similarity_threshold"
                        label="相似度阈值"
                        initValue={similarityThreshold}
                        min={0}
                        max={1}
                        step={0.05}
                        onChange={(v) => setSimilarityThreshold(v ?? 0.5)}
                        style={{ width: '100%' }}
                      />
                    </Col>
                  </Row>
                  <Text type="tertiary" size="small">
                    系统将自动使用语义搜索、全文搜索、混合搜索等多种方式检索，合并最优结果
                  </Text>

                  <Divider orientation="left">Embedding 向量参数</Divider>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Input
                        field="embedding_model"
                        label="Embedding 模型"
                        initValue={embeddingModel}
                        onChange={(v) => setEmbeddingModel(v)}
                      />
                    </Col>
                    <Col span={12}>
                      <Form.InputNumber
                        field="embedding_dimension"
                        label="向量维度"
                        initValue={embeddingDimension}
                        onChange={(v) => setEmbeddingDimension(v ?? 768)}
                        style={{ width: '100%' }}
                      />
                    </Col>
                  </Row>
                  <Text type="tertiary" size="small">
                    常见维度: nomic-embed-text=768, bge-large-zh=1024, m3e-large=1024
                  </Text>
                </Form>
              </Card>
            </TabPane>

            {/* 知识库 Tab */}
            <TabPane tab="知识库" itemKey="knowledge">
              <Card style={{ marginTop: 16 }}>
                {knowledgeBases.length === 0 ? (
                  <Empty description="暂无知识库" />
                ) : (
                  <Space vertical style={{ width: '100%' }} spacing={12}>
                    {knowledgeBases.map(kb => (
                      <div
                        key={kb.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 12,
                          border: '1px solid var(--semi-color-border)',
                          borderRadius: 'var(--semi-border-radius-small)',
                          background: selectedKBs.includes(kb.id)
                            ? 'var(--semi-color-primary-light-default)'
                            : 'var(--semi-color-bg-1)',
                        }}
                      >
                        <Space>
                          <IconArchive style={{ color: 'var(--semi-color-primary)' }} />
                          <div>
                            <Text strong>{kb.name}</Text>
                            {kb.description && (
                              <div><Text type="tertiary" size="small">{kb.description}</Text></div>
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

              {/* MCP Tools */}
              <Card
                style={{ marginTop: 16 }}
                title={
                  <Space>
                    <IconLink />
                    <Text>MCP 工具</Text>
                    {selectedMcpIds.length > 0 && <Tag color="purple">{selectedMcpIds.length}</Tag>}
                  </Space>
                }
              >
                {mcpConfigs.length === 0 ? (
                  <Empty description="暂无 MCP 配置">
                    <Button type="tertiary" onClick={() => navigate('/settings')}>
                      前往设置 MCP
                    </Button>
                  </Empty>
                ) : (
                  <Space vertical style={{ width: '100%' }} spacing={12}>
                    <Text type="tertiary" size="small">
                      选择 MCP 服务器，让 AI 助手可以使用外部工具
                    </Text>
                    {mcpConfigs.map(mcp => (
                      <div
                        key={mcp.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 12,
                          border: '1px solid var(--semi-color-border)',
                          borderRadius: 'var(--semi-border-radius-small)',
                          background: selectedMcpIds.includes(mcp.id)
                            ? 'var(--semi-color-primary-light-default)'
                            : 'var(--semi-color-bg-1)',
                        }}
                      >
                        <Space>
                          <IconHelm style={{ color: 'var(--semi-color-primary)' }} />
                          <div>
                            <Text strong>{mcp.name}</Text>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Tag
                                color={mcp.connection_type === 'stdio' ? 'green' : 'blue'}
                                size="small"
                              >
                                {mcp.connection_type.toUpperCase()}
                              </Tag>
                              {mcp.url && (
                                <Text
                                  type="tertiary"
                                  size="small"
                                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}
                                  title={mcp.url}
                                >
                                  {mcp.url}
                                </Text>
                              )}
                              {mcp.command && (
                                <Text
                                  type="tertiary"
                                  size="small"
                                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}
                                  title={`${mcp.command} ${mcp.args?.join(' ') || ''}`}
                                >
                                  {mcp.command} {mcp.args?.[0] || ''}
                                </Text>
                              )}
                              {mcp.tools_count !== undefined && (
                                <Text type="tertiary" size="small">{mcp.tools_count} 个工具</Text>
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
            </TabPane>

            {/* 嵌入代码 Tab */}
            <TabPane tab="嵌入代码" itemKey="embed">
              <Space vertical style={{ width: '100%', marginTop: 16 }} spacing={16}>
                <Card title="全屏模式">
                  <Paragraph
                    copyable
                    style={{
                      fontFamily: 'Consolas, Monaco, monospace',
                      fontSize: 13,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      padding: 16,
                      background: 'var(--semi-color-fill-0)',
                      borderRadius: 'var(--semi-border-radius-medium)',
                    }}
                  >
                    {getFullscreenEmbedCode()}
                  </Paragraph>
                </Card>
                <Card title="浮窗模式">
                  <Paragraph
                    copyable
                    style={{
                      fontFamily: 'Consolas, Monaco, monospace',
                      fontSize: 13,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      padding: 16,
                      background: 'var(--semi-color-fill-0)',
                      borderRadius: 'var(--semi-border-radius-medium)',
                    }}
                  >
                    {getFloatingEmbedCode()}
                  </Paragraph>
                </Card>
                <Card title="内嵌模式">
                  <Paragraph
                    copyable
                    style={{
                      fontFamily: 'Consolas, Monaco, monospace',
                      fontSize: 13,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      padding: 16,
                      background: 'var(--semi-color-fill-0)',
                      borderRadius: 'var(--semi-border-radius-medium)',
                    }}
                  >
                    {getInlineEmbedCode()}
                  </Paragraph>
                </Card>
                {app?.share_id && (
                  <Card title="直接链接">
                    <Paragraph
                      copyable
                      style={{
                        padding: 16,
                        background: 'var(--semi-color-fill-0)',
                        borderRadius: 'var(--semi-border-radius-medium)',
                        wordBreak: 'break-all',
                      }}
                    >
                      {origin}/share/{app.share_id}
                    </Paragraph>
                  </Card>
                )}
              </Space>
            </TabPane>
          </Tabs>
        </Col>

        {/* Right Panel - Preview */}
        <Col span={8}>
          <Card
            title={
              <Space>
                <IconBolt />
                <Text>预览</Text>
              </Space>
            }
          >
            <Space vertical style={{ width: '100%' }} spacing={16}>
              <div
                style={{
                  padding: 16,
                  borderRadius: 'var(--semi-border-radius-medium)',
                  background: 'var(--semi-color-primary)',
                  textAlign: 'center',
                }}
              >
                <IconServerStroked style={{ fontSize: 32, color: 'var(--semi-color-bg-0)' }} />
                <Title heading={5} style={{ margin: '8px 0 4px', color: 'var(--semi-color-bg-0)' }}>
                  {appName || '未命名应用'}
                </Title>
                <Text size="small" style={{ color: 'var(--semi-color-bg-0)', opacity: 0.8 }}>
                  {appDescription || '暂无描述'}
                </Text>
              </div>

              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>当前配置</Text>
                <Space vertical style={{ width: '100%' }} spacing={8}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="tertiary">模型</Text>
                    <Tag color="blue">{selectedModel}</Tag>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="tertiary">知识库</Text>
                    <Text>{selectedKBs.length} 个</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="tertiary">MCP 工具</Text>
                    <Text>{selectedMcpIds.length > 0 ? `${selectedMcpIds.length} 个` : '-'}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="tertiary">访问权限</Text>
                    <Tag color={isPublic ? 'green' : 'default'}>
                      {isPublic ? '公开' : '私有'}
                    </Tag>
                  </div>
                </Space>
              </div>

              {app?.share_id && (
                <>
                  <Divider style={{ margin: '4px 0' }} />
                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>分享链接</Text>
                    <Paragraph
                      copyable={{ content: origin ? `${origin}/share/${app.share_id}` : '' }}
                      size="small"
                      style={{ wordBreak: 'break-all' }}
                    >
                      {origin ? `${origin}/share/${app.share_id}` : '加载中...'}
                    </Paragraph>
                  </div>
                </>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Embed Code Modal */}
      <Modal
        title="嵌入第三方"
        visible={embedModalVisible}
        onCancel={() => setEmbedModalVisible(false)}
        footer={null}
        width={700}
      >
        <Tabs type="line">
          <TabPane tab="全屏模式" itemKey="fullscreen">
            <div style={{ marginTop: 12 }}>
              <Paragraph
                copyable
                style={{
                  fontFamily: 'Consolas, Monaco, monospace',
                  fontSize: 13,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  padding: 16,
                  background: 'var(--semi-color-fill-0)',
                  borderRadius: 'var(--semi-border-radius-medium)',
                }}
              >
                {getFullscreenEmbedCode()}
              </Paragraph>
            </div>
          </TabPane>
          <TabPane tab="浮窗模式" itemKey="floating">
            <div style={{ marginTop: 12 }}>
              <Paragraph
                copyable
                style={{
                  fontFamily: 'Consolas, Monaco, monospace',
                  fontSize: 13,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  padding: 16,
                  background: 'var(--semi-color-fill-0)',
                  borderRadius: 'var(--semi-border-radius-medium)',
                }}
              >
                {getFloatingEmbedCode()}
              </Paragraph>
            </div>
          </TabPane>
          <TabPane tab="内嵌模式" itemKey="inline">
            <div style={{ marginTop: 12 }}>
              <Paragraph
                copyable
                style={{
                  fontFamily: 'Consolas, Monaco, monospace',
                  fontSize: 13,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  padding: 16,
                  background: 'var(--semi-color-fill-0)',
                  borderRadius: 'var(--semi-border-radius-medium)',
                }}
              >
                {getInlineEmbedCode()}
              </Paragraph>
            </div>
          </TabPane>
        </Tabs>
      </Modal>
    </div>
  );
}

export default AppDetailPage;
