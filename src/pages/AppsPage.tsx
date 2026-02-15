import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Space,
  Button,
  Form,
  Toast,
  Skeleton,
  Empty,
  Tag,
  Dropdown,
  Popconfirm,
  Input,
  List,
  Pagination,
  Row,
  Col,
  Tabs,
  TabPane,
  Sidebar,
  Avatar,
  Tooltip,
  Spin,
} from '@douyinfe/semi-ui';
import {
  IconPlus,
  IconMore,
  IconDelete,
  IconEdit,
  IconPlay,
  IconCode,
  IconSearch,
  IconBranch,
  IconComment,
  IconClock,
  IconArchive,
  IconLink,
  IconShare,
} from '@douyinfe/semi-icons';
import api from '../lib/api';
import { getEmptyInitialData } from '../flowgram/initial-data';

const { Title, Text, Paragraph } = Typography;

interface App {
  id: string;
  name: string;
  description: string | null;
  icon?: string;
  type: 'chatflow' | 'workflow';
  system_prompt?: string | null;
  model_name?: string;
  temperature?: number;
  max_tokens?: number;
  knowledge_base_ids?: string[];
  is_published?: boolean;
  share_id?: string;
  created_at: string;
  updated_at: string;
}

interface KnowledgeBase {
  id: string;
  name: string;
}

function AppsPage() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<App[]>([]);
  const [workflows, setWorkflows] = useState<App[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingWorkflow, setCreatingWorkflow] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<string>('all');
  const pageSize = 10;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    system_prompt: '',
    model_name: 'deepseek-chat',
    temperature: 0.7,
    max_tokens: 2000,
    knowledge_base_ids: [] as string[],
  });

  // 创建新的工作流
  const handleCreateWorkflow = async () => {
    setCreatingWorkflow(true);
    try {
      const emptyData = getEmptyInitialData();
      const result = await api.post('/workflows', {
        name: '未命名工作流',
        description: '',
        definition: emptyData,
      });
      const workflowId = result.data?.id || result.id;
      if (workflowId) {
        navigate(`/workflow/${workflowId}`);
      } else {
        Toast.error('创建工作流失败');
      }
    } catch (error) {
      Toast.error('创建工作流失败');
    } finally {
      setCreatingWorkflow(false);
    }
  };

  const fetchApps = useCallback(async () => {
    try {
      const data = await api.get('/applications');
      const appList = Array.isArray(data) ? data : (data?.applications || data?.items || data?.data || []);
      setApps(appList.map((app: any) => ({ ...app, type: 'chatflow' as const })));
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    }
  }, []);

  const fetchWorkflows = useCallback(async () => {
    try {
      const data = await api.get('/workflows');
      const workflowList = Array.isArray(data) ? data : (data?.workflows || data?.items || data?.data || []);
      setWorkflows(workflowList.map((wf: any) => ({ ...wf, type: 'workflow' as const })));
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    }
  }, []);

  const fetchKnowledgeBases = useCallback(async () => {
    try {
      const data = await api.get('/knowledge-bases');
      setKnowledgeBases(Array.isArray(data) ? data : (data?.knowledge_bases || []));
    } catch (error) {
      console.error('Failed to fetch knowledge bases:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchApps(), fetchWorkflows(), fetchKnowledgeBases()]);
      setLoading(false);
    };
    loadData();
  }, [fetchApps, fetchWorkflows, fetchKnowledgeBases]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  const handleCreateChatflow = async () => {
    if (!formData.name.trim()) {
      Toast.warning('请输入应用名称');
      return;
    }
    try {
      await api.post('/applications', formData);
      Toast.success('应用创建成功');
      setShowCreateModal(false);
      resetForm();
      fetchApps();
    } catch (error) {
      Toast.error('创建应用失败');
    }
  };

  const handleUpdateChatflow = async () => {
    if (!editingApp || !formData.name.trim()) return;
    try {
      await api.put(`/applications/${editingApp.id}`, formData);
      Toast.success('应用更新成功');
      setEditingApp(null);
      setShowCreateModal(false);
      resetForm();
      fetchApps();
    } catch (error) {
      Toast.error('更新应用失败');
    }
  };

  const handleDelete = async (app: App) => {
    try {
      if (app.type === 'workflow') {
        await api.delete(`/workflows/${app.id}`);
      } else {
        await api.delete(`/applications/${app.id}`);
      }
      Toast.success('删除成功');
      fetchApps();
      fetchWorkflows();
    } catch (error) {
      Toast.error('删除失败');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      system_prompt: '',
      model_name: 'deepseek-chat',
      temperature: 0.7,
      max_tokens: 2000,
      knowledge_base_ids: [],
    });
  };

  const openEditModal = (app: App) => {
    if (app.type === 'workflow') {
      navigate(`/workflow/${app.id}`);
      return;
    }
    setEditingApp(app);
    setFormData({
      name: app.name,
      description: app.description || '',
      system_prompt: app.system_prompt || '',
      model_name: app.model_name || 'deepseek-chat',
      temperature: app.temperature || 0.7,
      max_tokens: app.max_tokens || 2000,
      knowledge_base_ids: app.knowledge_base_ids || [],
    });
    setShowCreateModal(true);
  };

  const handleCopyShareLink = (app: App, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareId = app.share_id || app.id;
    const link = `${window.location.origin}/share/${shareId}`;
    navigator.clipboard.writeText(link).then(() => {
      Toast.success('分享链接已复制');
    }).catch(() => {
      Toast.error('复制失败');
    });
  };

  const getEmbedCode = (app: App) => {
    const baseUrl = window.location.origin;
    const shareId = app.share_id || app.id;
    return `<iframe src="${baseUrl}/share/${shareId}" width="400" height="600" frameborder="0" style="border:none;border-radius:12px;"></iframe>`;
  };

  // 合并和过滤列表
  const allApps = [...apps, ...workflows];
  const filteredApps = allApps.filter(app => {
    if (activeTab !== 'all' && app.type !== activeTab) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return app.name.toLowerCase().includes(query) ||
        (app.description && app.description.toLowerCase().includes(query));
    }
    return true;
  });

  const paginatedApps = filteredApps.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const chatflowCount = apps.length;
  const workflowCount = workflows.length;

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton.Title style={{ width: 200, marginBottom: 24 }} />
        <Skeleton.Paragraph rows={5} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title heading={3} style={{ margin: 0 }}>应用管理</Title>
          <Text type="tertiary">创建和管理您的 AI 应用</Text>
        </div>
        <Space>
          <Button icon={<IconComment />} onClick={() => { resetForm(); setEditingApp(null); setShowCreateModal(true); }}>
            创建 Chatflow
          </Button>
          <Button type="primary" icon={creatingWorkflow ? <Spin size="small" /> : <IconBranch />} onClick={handleCreateWorkflow} disabled={creatingWorkflow}>
            {creatingWorkflow ? '创建中...' : '创建 Workflow'}
          </Button>
        </Space>
      </div>

      {/* Tabs & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Tabs type="button" activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={`全部 (${allApps.length})`} itemKey="all" />
          <TabPane tab={`Chatflow (${chatflowCount})`} itemKey="chatflow" />
          <TabPane tab={`Workflow (${workflowCount})`} itemKey="workflow" />
        </Tabs>
        <Input prefix={<IconSearch />} placeholder="搜索应用..." value={searchQuery} onChange={setSearchQuery} showClear style={{ width: 240 }} />
      </div>

      {/* List */}
      <List
        dataSource={paginatedApps}
        style={{ minHeight: 400 }}
        emptyContent={
          <Empty description={searchQuery ? '没有找到匹配的应用' : '还没有创建任何应用'} />
        }
        renderItem={(app) => (
          <List.Item
            className="app-list-item"
            style={{
              padding: '16px 20px',
              cursor: 'pointer',
              borderBottom: '1px solid var(--semi-color-border)',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--semi-color-fill-0)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            onClick={() => {
              if (app.type === 'workflow') {
                navigate(`/workflow/${app.id}`);
              } else {
                navigate(`/apps/${app.id}/chat`);
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 16 }}>
              {/* 图标 */}
              {app.icon ? (
                <Avatar shape="square" size="default" src={app.icon} style={{ borderRadius: 8 }} />
              ) : (
                <Avatar
                  shape="square"
                  size="default"
                  style={{
                    background: app.type === 'workflow' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    borderRadius: 8,
                  }}
                >
                  {app.type === 'workflow' ? <IconBranch style={{ color: '#fff' }} /> : <IconComment style={{ color: '#fff' }} />}
                </Avatar>
              )}

              {/* 主信息 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text strong style={{ fontSize: 15 }}>{app.name}</Text>
                  <Tag size="small" color={app.type === 'workflow' ? 'green' : 'blue'}>
                    {app.type === 'workflow' ? 'Workflow' : 'Chatflow'}
                  </Tag>
                  {app.type === 'workflow' && app.is_published && (
                    <Tag size="small" color="light-green">已发布</Tag>
                  )}
                </div>
                <Text type="tertiary" size="small" style={{ display: 'block', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {app.description || '暂无描述'}
                </Text>
              </div>

              {/* 标签信息 */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                {app.type === 'chatflow' && (
                  <>
                    {app.model_name && <Tag size="small">{app.model_name}</Tag>}
                    {app.knowledge_base_ids && app.knowledge_base_ids.length > 0 && (
                      <Tooltip content={`关联 ${app.knowledge_base_ids.length} 个知识库`}>
                        <Tag size="small" prefixIcon={<IconArchive style={{ fontSize: 10 }} />}>
                          {app.knowledge_base_ids.length}
                        </Tag>
                      </Tooltip>
                    )}
                  </>
                )}
              </div>

              {/* 时间 */}
              <Text type="tertiary" size="small" style={{ width: 100, textAlign: 'right', flexShrink: 0 }}>
                {new Date(app.created_at).toLocaleDateString('zh-CN')}
              </Text>

              {/* 操作按钮 */}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                {app.type === 'chatflow' && (
                  <Tooltip content="开始对话">
                    <Button type="tertiary" icon={<IconPlay />} size="small" theme="borderless" onClick={() => navigate(`/apps/${app.id}/chat`)} />
                  </Tooltip>
                )}
                <Tooltip content="编辑">
                  <Button type="tertiary" icon={<IconEdit />} size="small" theme="borderless" onClick={() => openEditModal(app)} />
                </Tooltip>
                <Tooltip content="分享">
                  <Button type="tertiary" icon={<IconShare />} size="small" theme="borderless" onClick={(e) => handleCopyShareLink(app, e)} />
                </Tooltip>
                <Tooltip content="嵌入代码">
                  <Button type="tertiary" icon={<IconCode />} size="small" theme="borderless" onClick={() => { setSelectedApp(app); setShowEmbedModal(true); }} />
                </Tooltip>
                <Popconfirm title="确定删除？" content="此操作不可撤销" onConfirm={() => handleDelete(app)}>
                  <Button type="tertiary" icon={<IconDelete />} size="small" theme="borderless" style={{ color: 'var(--semi-color-danger)' }} />
                </Popconfirm>
              </div>
            </div>
          </List.Item>
        )}
      />

      {/* Pagination */}
      {filteredApps.length > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <Pagination total={filteredApps.length} pageSize={pageSize} currentPage={currentPage} onChange={setCurrentPage} />
        </div>
      )}

      {/* Create/Edit Chatflow Sidebar */}
      <Sidebar.Container visible={showCreateModal} title={editingApp ? '编辑 Chatflow' : '创建 Chatflow'} onCancel={() => { setShowCreateModal(false); setEditingApp(null); resetForm(); }} defaultSize={{ width: 480 }}>
        <div style={{ padding: '16px 0' }}>
          <Form labelPosition="top" initValues={formData} onValueChange={(values) => setFormData({ ...formData, ...values })}>
            <Form.Input field="name" label="应用名称" placeholder="输入应用名称" rules={[{ required: true, message: '请输入应用名称' }]} />
            <Form.TextArea field="description" label="描述" placeholder="输入应用描述" rows={2} />
            <Form.TextArea field="system_prompt" label="系统提示词" placeholder="定义 AI 的行为和角色" rows={4} />
            <Row gutter={16}>
              <Col span={12}>
                <Form.Select field="model_name" label="模型" style={{ width: '100%' }} optionList={[{ value: 'deepseek-chat', label: 'DeepSeek Chat' }, { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner' }]} />
              </Col>
              <Col span={12}>
                <Form.InputNumber field="temperature" label={`温度 (${formData.temperature})`} min={0} max={1} step={0.1} style={{ width: '100%' }} />
              </Col>
            </Row>
            <Form.Select field="knowledge_base_ids" label="关联知识库" multiple style={{ width: '100%' }} placeholder="选择知识库" optionList={knowledgeBases.map(kb => ({ value: kb.id, label: kb.name }))} />
          </Form>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <Button onClick={() => { setShowCreateModal(false); setEditingApp(null); resetForm(); }}>取消</Button>
            <Button type="primary" onClick={editingApp ? handleUpdateChatflow : handleCreateChatflow}>{editingApp ? '保存' : '创建'}</Button>
          </div>
        </div>
      </Sidebar.Container>

      {/* Embed Code Sidebar */}
      <Sidebar.Container visible={showEmbedModal} title="嵌入代码" onCancel={() => { setShowEmbedModal(false); setSelectedApp(null); }} defaultSize={{ width: 480 }}>
        <div style={{ padding: '16px 0' }}>
          {selectedApp && (
            <Tabs type="line">
              <TabPane tab="iframe" itemKey="iframe">
                <Paragraph copyable style={{ fontFamily: 'monospace', fontSize: 12, padding: 12, background: 'var(--semi-color-fill-0)', borderRadius: 8, marginTop: 12 }}>
                  {getEmbedCode(selectedApp)}
                </Paragraph>
              </TabPane>
              <TabPane tab="链接" itemKey="link">
                <Paragraph copyable style={{ padding: 12, background: 'var(--semi-color-fill-0)', borderRadius: 8, marginTop: 12, wordBreak: 'break-all' }}>
                  {window.location.origin}/share/{selectedApp.share_id || selectedApp.id}
                </Paragraph>
              </TabPane>
            </Tabs>
          )}
        </div>
      </Sidebar.Container>
    </div>
  );
}

export default AppsPage;
