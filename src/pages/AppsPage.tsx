import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Input,
  Button,
  Space,
  Typography,
  Spin,
  message,
  Modal,
  Tag,
  Dropdown,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  RobotOutlined,
  DeleteOutlined,
  EditOutlined,
  ShareAltOutlined,
  EyeOutlined,
  MessageOutlined,
  MoreOutlined,
  LockOutlined,
  CodeOutlined,
  CopyOutlined,
  LikeOutlined,
  DislikeOutlined,
  BarChartOutlined,
  RiseOutlined,
  CloseOutlined,
} from '@ant-design/icons';

const { Search } = Input;
const { Text, Title } = Typography;

interface Application {
  id: string;
  name: string;
  description?: string;
  model?: string;
  model_provider?: string;
  model_name?: string; // 兼容字段
  is_public: boolean;
  share_id?: string;
  created_at: string;
  conversation_count?: number;
  message_count?: number;
  like_count?: number;
  dislike_count?: number;
  feedback_count?: number;
}

// Application Card Component
function ApplicationCard({
  app,
  onEdit,
  onDelete,
  onShare,
  onView,
  onEmbed,
  onAnalytics,
}: {
  app: Application;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
  onView: () => void;
  onEmbed: () => void;
  onAnalytics: () => void;
}) {
  const handleMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'view':
        onView();
        break;
      case 'edit':
        onEdit();
        break;
      case 'share':
        onShare();
        break;
      case 'embed':
        onEmbed();
        break;
      case 'analytics':
        onAnalytics();
        break;
      case 'delete':
        onDelete();
        break;
    }
  };

  const menuItems = [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: '查看',
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: '编辑',
    },
    {
      key: 'share',
      icon: <ShareAltOutlined />,
      label: '分享',
    },
    {
      key: 'embed',
      icon: <CodeOutlined />,
      label: '嵌入代码',
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: '数据报表',
    },
    { type: 'divider' as const },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      danger: true,
    },
  ];

  return (
    <Card
      hoverable
      style={{
        background: '#FFFFFF',
        borderRadius: 12,
        borderColor: '#E2E8F0',
        height: '100%',
        transition: 'all 0.2s',
      }}
      styles={{ body: { padding: '20px' } }}
      onMouseEnter={(e: any) => {
        e.currentTarget.style.borderColor = '#2563EB';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.1)';
      }}
      onMouseLeave={(e: any) => {
        e.currentTarget.style.borderColor = '#E2E8F0';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RobotOutlined style={{ fontSize: 18, color: 'white' }} />
          </div>
          <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} trigger={['click']} placement="bottomRight">
            <Button
              type="text"
              icon={<MoreOutlined />}
              style={{ color: '#94A3B8' }}
            />
          </Dropdown>
        </div>

        {/* Content */}
        <div>
          <Title level={5} style={{ margin: 0, color: '#1E293B', fontSize: 15 }}>
            {app.name}
          </Title>
          <Text
            style={{
              color: '#64748B',
              fontSize: 12,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              marginTop: 4,
            }}
          >
            {app.description || '暂无描述'}
          </Text>
        </div>

        {/* Tags */}
        <Space size={8} wrap>
          <Tag style={{
            fontSize: 11,
            margin: 0,
            padding: '2px 8px',
            background: '#F1F5F9',
            border: '1px solid #E2E8F0',
            color: '#475569',
          }}>
            {app.model_name || 'GPT-3.5'}
          </Tag>
          <Tag
            icon={app.is_public ? <ShareAltOutlined /> : <LockOutlined />}
            style={{
              fontSize: 11,
              margin: 0,
              padding: '2px 8px',
              background: app.is_public ? '#ECFDF5' : '#F1F5F9',
              border: app.is_public ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
              color: app.is_public ? '#059669' : '#64748B',
            }}
          >
            {app.is_public ? '公开' : '私有'}
          </Tag>
        </Space>

        {/* Stats */}
        <Row gutter={12}>
          <Col span={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MessageOutlined style={{ color: '#6366F1', fontSize: 12 }} />
              <Text style={{ fontSize: 12, color: '#64748B' }}>
                <Text strong style={{ color: '#1E293B' }}>{app.conversation_count || 0}</Text> 对话
              </Text>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RiseOutlined style={{ color: '#2563EB', fontSize: 12 }} />
              <Text style={{ fontSize: 12, color: '#64748B' }}>
                <Text strong style={{ color: '#1E293B' }}>{app.message_count || 0}</Text> 消息
              </Text>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <LikeOutlined style={{ color: '#10B981', fontSize: 12 }} />
              <Text style={{ fontSize: 12, color: '#64748B' }}>
                <Text strong style={{ color: '#1E293B' }}>{app.like_count || 0}</Text> 点赞
              </Text>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <DislikeOutlined style={{ color: '#EF4444', fontSize: 12 }} />
              <Text style={{ fontSize: 12, color: '#64748B' }}>
                <Text strong style={{ color: '#1E293B' }}>{app.dislike_count || 0}</Text> 差评
              </Text>
            </div>
          </Col>
        </Row>

        {/* Created At */}
        <Text style={{ fontSize: 11, color: '#94A3B8' }}>
          创建于 {new Date(app.created_at).toLocaleDateString()}
        </Text>

        {/* Action Buttons */}
        <Space size={8} style={{ width: '100%' }}>
          <Button
            size="small"
            icon={<CodeOutlined />}
            onClick={onEmbed}
            style={{
              flex: 1,
              borderRadius: 6,
              fontSize: 12,
              height: 28,
            }}
          >
            嵌入
          </Button>
          <Button
            size="small"
            icon={<BarChartOutlined />}
            onClick={onAnalytics}
            style={{
              flex: 1,
              borderRadius: 6,
              fontSize: 12,
              height: 28,
            }}
          >
            数据报表
          </Button>
          <Button
            size="small"
            icon={<ShareAltOutlined />}
            onClick={onShare}
            style={{
              flex: 1,
              borderRadius: 6,
              fontSize: 12,
              height: 28,
            }}
          >
            分享
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<EditOutlined />}
            onClick={onEdit}
            style={{
              flex: 1,
              borderRadius: 6,
              fontSize: 12,
              height: 28,
            }}
          >
            编辑
          </Button>
        </Space>
      </Space>
    </Card>
  );
}

// 新增应用卡片
function AddApplicationCard({ onClick }: { onClick: () => void }) {
  return (
    <Card
      hoverable
      onClick={onClick}
      style={{
        background: '#F8FAFC',
        borderRadius: 12,
        border: '1px dashed #CBD5E1',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
        minHeight: 220,
      }}
      styles={{ body: { padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } }}
      onMouseEnter={(e: any) => {
        e.currentTarget.style.background = '#F1F5F9';
        e.currentTarget.style.borderColor = '#059669';
      }}
      onMouseLeave={(e: any) => {
        e.currentTarget.style.background = '#F8FAFC';
        e.currentTarget.style.borderColor = '#CBD5E1';
      }}
    >
      <Space orientation="vertical" size={12} align="center">
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PlusOutlined style={{ fontSize: 20, color: '#64748B' }} />
        </div>
        <Text style={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>
          新建应用
        </Text>
      </Space>
    </Card>
  );
}

function AppsPage() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [embedModalVisible, setEmbedModalVisible] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [origin, setOrigin] = useState('');

  // Delete confirm modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingApp, setDeletingApp] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const response = await fetch(`/api/v1/applications`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        // 映射后端返回的字段到前端需要的格式
        const apps = (data.applications || []).map((app: any) => ({
          ...app,
          model_name: app.model || app.model_name || 'GPT-3.5',
          conversation_count: app.conversation_count || 0,
          message_count: app.message_count || 0,
          like_count: app.like_count || 0,
          dislike_count: app.dislike_count || 0,
          feedback_count: app.feedback_count || 0,
        }));
        setApplications(apps);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleDeleteApp = async (appId: string, appName: string) => {
    setDeletingApp({ id: appId, name: appName });
    setDeleteModalOpen(true);
  };

  const confirmDeleteApp = async () => {
    if (!deletingApp) return;

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const response = await fetch(`/api/v1/applications/${deletingApp.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setApplications(applications.filter(app => app.id !== deletingApp.id));
        messageApi.success('应用已删除');
      } else {
        messageApi.error('删除失败');
      }
    } catch (error) {
      messageApi.error('删除失败');
    } finally {
      setDeleteModalOpen(false);
      setDeletingApp(null);
    }
  };

  const cancelDeleteApp = () => {
    setDeleteModalOpen(false);
    setDeletingApp(null);
  };

  // 通用复制函数，支持各种环境
  const copyToClipboard = async (text: string, successMessage: string = '已复制到剪贴板') => {
    try {
      // 优先使用传统方法，兼容性更好
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
        // 如果传统方法失败，尝试使用 Clipboard API
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

  const handleShareApp = async (app: Application) => {
    const shareUrl = `${origin}/share/${app.share_id || app.id}`;
    await copyToClipboard(shareUrl, '分享链接已复制到剪贴板');
  };

  const handleEmbedCode = (app: Application) => {
    setSelectedApp(app);
    setEmbedModalVisible(true);
  };

  const handleAnalytics = (app: Application) => {
    navigate(`/apps/${app.id}/analytics`);
  };

  const filteredApps = applications.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {contextHolder}
      <Space orientation="vertical" size={24} style={{ width: '100%' }}>
          {/* Header */}
          <div>
            <Title level={3} style={{ margin: 0, color: '#1E293B', fontSize: 20, fontWeight: 600 }}>
              AI 应用
            </Title>
            <Text style={{ color: '#64748B', fontSize: 13 }}>
              管理您的 AI 应用，配置对话助手和知识库
            </Text>
          </div>

          {/* Search */}
          <Search
            placeholder="搜索应用..."
            allowClear
            style={{
              maxWidth: 400,
              borderRadius: 8,
              background: '#FFFFFF',
            }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
          />

          {/* Loading State */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 80 }}>
              <Spin size="large" />
            </div>
          ) : (
            <>
              {/* Applications Grid */}
              <Row gutter={[16, 16]}>
                {/* Add Application Card */}
                <Col xs={24} sm={12} lg={8} xl={6}>
                  <AddApplicationCard onClick={() => navigate('/apps/new')} />
                </Col>

                {/* Application Cards */}
                {filteredApps.map((app) => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={app.id}>
                    <ApplicationCard
                      app={app}
                      onEdit={() => navigate(`/apps/${app.id}`)}
                      onDelete={() => handleDeleteApp(app.id, app.name)}
                      onShare={() => handleShareApp(app)}
                      onView={() => navigate(`/apps/${app.id}`)}
                      onEmbed={() => handleEmbedCode(app)}
                      onAnalytics={() => handleAnalytics(app)}
                    />
                  </Col>
                ))}
              </Row>
            </>
          )}
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
                {/* 标题 */}
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 12 }}>
                  全屏模式
                </div>

                {/* 预览图 - 桌面浏览器窗口 */}
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
                  {/* 窗口顶部栏 */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 6,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#6366F1' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#8B5CF6' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#A78BFA' }} />
                  </div>
                  {/* 内容区模拟 */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ height: 8, background: '#E0E0E0', borderRadius: 2, width: '60%' }} />
                    <div style={{ height: 8, background: '#E0E0E0', borderRadius: 2, width: '40%' }} />
                    <div style={{ flex: 1, background: '#E8E8E8', borderRadius: 4, marginTop: 4 }} />
                  </div>
                </div>

                {/* 代码框 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: '#1A1A1A' }}>复制以下代码进行嵌入</span>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => {
                        const shareId = selectedApp?.share_id || 'APP_ID';
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
                    {origin ? `<div id="ai-chat-${selectedApp?.share_id || 'APP_ID'}"></div>
<script src="${origin}/embed/${selectedApp?.share_id || 'APP_ID'}.js" data-mode="fullscreen" async></script>` : ''}
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
                {/* 标题 */}
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 12 }}>
                  移动端模式
                </div>

                {/* 预览图 - 手机屏幕 */}
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
                  {/* 手机模拟 */}
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
                    {/* 顶部状态栏模拟 */}
                    <div
                      style={{
                        height: 6,
                        background: '#6366F1',
                        borderRadius: 2,
                        marginBottom: 4,
                      }}
                    />
                    {/* 聊天内容区 */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ height: 6, background: '#E0E0E0', borderRadius: 2, alignSelf: 'flex-start', width: '70%' }} />
                      <div style={{ height: 6, background: '#6366F1', borderRadius: 2, alignSelf: 'flex-end', width: '60%' }} />
                      <div style={{ height: 6, background: '#E0E0E0', borderRadius: 2, alignSelf: 'flex-start', width: '50%' }} />
                    </div>
                    {/* 输入框 */}
                    <div style={{ height: 8, background: '#E8E8E8', borderRadius: 2, marginTop: 4 }} />
                  </div>
                </div>

                {/* 代码框 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: '#1A1A1A' }}>复制以下代码进行嵌入</span>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => {
                        const shareId = selectedApp?.share_id || 'APP_ID';
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
                    {origin ? `<div id="ai-chat-${selectedApp?.share_id || 'APP_ID'}"></div>
<script src="${origin}/embed/${selectedApp?.share_id || 'APP_ID'}.js" data-mode="mobile" async></script>` : ''}
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
                {/* 标题 */}
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 12 }}>
                  浮窗模式
                </div>

                {/* 预览图 - 浮窗 */}
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
                  {/* 浮窗模拟 */}
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
                    {/* 顶部栏 */}
                    <div
                      style={{
                        height: 6,
                        background: '#6366F1',
                        borderRadius: 2,
                        marginBottom: 6,
                      }}
                    />
                    {/* 内容区 */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ height: 6, background: '#E0E0E0', borderRadius: 2, width: '70%' }} />
                      <div style={{ height: 6, background: '#6366F1', borderRadius: 2, width: '50%', alignSelf: 'flex-end' }} />
                      <div style={{ height: 6, background: '#E0E0E0', borderRadius: 2, width: '60%' }} />
                    </div>
                    {/* 输入框 */}
                    <div style={{ height: 8, background: '#E8E8E8', borderRadius: 2, marginTop: 'auto' }} />
                  </div>
                  {/* 悬浮球 */}
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

                {/* 代码框 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: '#1A1A1A' }}>复制以下代码进行嵌入</span>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => {
                        const shareId = selectedApp?.share_id || 'APP_ID';
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
                    {origin ? `<script src="${origin}/embed/${selectedApp?.share_id || 'APP_ID'}.js" async></script>` : ''}
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Modal>

        {/* Delete Confirm Modal */}
        <Modal
          title="确认删除"
          open={deleteModalOpen}
          onOk={confirmDeleteApp}
          onCancel={cancelDeleteApp}
          okText="删除"
          okType="danger"
          cancelText="取消"
          centered
        >
          <p>确定要删除应用 <strong>"{deletingApp?.name}"</strong> 吗？此操作不可恢复。</p>
        </Modal>
    </>
  );
}

export default AppsPage;
