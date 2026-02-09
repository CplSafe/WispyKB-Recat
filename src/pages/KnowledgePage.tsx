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
  Tag,
  Tooltip,
  Modal,
  Avatar,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import KnowledgeTransferModal from '../components/knowledge/KnowledgeTransferModal';

const { Search } = Input;
const { Text, Title } = Typography;

interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  doc_count?: number;
  embedding_model?: string;
  updated_at?: string;
  created_at?: string;
  owner_id?: string;
  owner_name?: string;
  owner_avatar?: string;
}

// Knowledge Base Card Component
function KnowledgeBaseCard({
  kb,
  onView,
  onUpload,
  onDelete,
}: {
  kb: KnowledgeBase;
  onView: () => void;
  onUpload: () => void;
  onDelete: () => void;
}) {
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
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UploadOutlined style={{ fontSize: 18, color: 'white' }} />
          </div>
          <Tooltip title="删除">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={onDelete}
              style={{ color: '#94A3B8' }}
            />
          </Tooltip>
        </div>

        {/* Content */}
        <div>
          <Title level={5} style={{ margin: 0, color: '#1E293B', fontSize: 15 }}>
            {kb.name}
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
            {kb.description || '暂无描述'}
          </Text>
        </div>

        {/* Creator Info */}
        {kb.owner_name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Avatar
              size={20}
              src={kb.owner_avatar ? (kb.owner_avatar.startsWith('http') ? kb.owner_avatar : `${window.location.origin}${kb.owner_avatar}`) : undefined}
              style={{
                backgroundColor: '#2563EB',
                fontSize: 10,
                flexShrink: 0,
              }}
            >
              {!kb.owner_avatar && kb.owner_name?.slice(0, 1).toUpperCase()}
            </Avatar>
            <Text style={{ color: '#64748B', fontSize: 11 }}>
              由 <span style={{ color: '#475569', fontWeight: 500 }}>{kb.owner_name}</span> 创建
            </Text>
          </div>
        )}

        {/* Tags */}
        <Space size={8}>
          <Tag style={{
            fontSize: 11,
            margin: 0,
            padding: '2px 8px',
            background: '#F1F5F9',
            border: '1px solid #E2E8F0',
            color: '#475569',
          }}>
            {kb.embedding_model || 'nomic-embed-text'}
          </Tag>
          <Tag
            icon={<UploadOutlined />}
            style={{
              fontSize: 11,
              margin: 0,
              padding: '2px 8px',
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              color: '#2563EB',
            }}
          >
            {kb.doc_count || 0} 文档
          </Tag>
        </Space>

        {/* Actions */}
        <Space size={8} style={{ width: '100%' }}>
          <Button
            icon={<UploadOutlined />}
            onClick={onUpload}
            style={{
              flex: 1,
              borderRadius: 6,
              height: 28,
              fontSize: 12,
            }}
            size="small"
          >
            管理文档
          </Button>
          <Button
            icon={<EyeOutlined />}
            onClick={onView}
            style={{
              flex: 1,
              borderRadius: 6,
              height: 28,
              fontSize: 12,
            }}
            size="small"
          >
            查看
          </Button>
        </Space>
      </Space>
    </Card>
  );
}

// 新增知识库卡片
function AddKnowledgeBaseCard({ onClick }: { onClick: () => void }) {
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
        e.currentTarget.style.borderColor = '#2563EB';
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
          新建知识库
        </Text>
      </Space>
    </Card>
  );
}

function KnowledgePage() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);

  // 穿梭框弹窗状态
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferMode, setTransferMode] = useState<'create' | 'upload'>('create');
  const [selectedKB, setSelectedKB] = useState<KnowledgeBase | null>(null);

  // Delete confirm modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingKBId, setDeletingKBId] = useState<string | null>(null);

  const fetchKnowledgeBases = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const response = await fetch(`/api/v1/knowledge-bases`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const kbs = (data.knowledge_bases || []).map((kb: any) => ({
          ...kb,
          doc_count: kb.doc_count || 0,
        }));
        setKnowledgeBases(kbs);
      }
    } catch (error) {
      console.error('Failed to fetch knowledge bases:', error);
      setKnowledgeBases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

  // 打开创建知识库穿梭框
  const handleOpenCreateModal = () => {
    setTransferMode('create');
    setSelectedKB(null);
    setTransferModalOpen(true);
  };

  // 打开管理文档穿梭框
  const handleOpenUploadModal = (kb: KnowledgeBase) => {
    setTransferMode('upload');
    setSelectedKB(kb);
    setTransferModalOpen(true);
  };

  const handleDeleteKB = async (id: string) => {
    setDeletingKBId(id);
    setDeleteModalOpen(true);
  };

  const confirmDeleteKB = async () => {
    if (!deletingKBId) return;

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const response = await fetch(`/api/v1/knowledge-bases/${deletingKBId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setKnowledgeBases(knowledgeBases.filter(kb => kb.id !== deletingKBId));
        messageApi.success('知识库已删除');
      } else {
        messageApi.error('删除失败');
      }
    } catch (error) {
      messageApi.error('删除失败');
    } finally {
      setDeleteModalOpen(false);
      setDeletingKBId(null);
    }
  };

  const cancelDeleteKB = () => {
    setDeleteModalOpen(false);
    setDeletingKBId(null);
  };

  // 跳转到文档详情页面
  const handleViewDocuments = (kb: KnowledgeBase) => {
    navigate(`/knowledge/${kb.id}/documents`);
  };

  const filteredKBs = knowledgeBases.filter(kb =>
    kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kb.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {contextHolder}
      <Space orientation="vertical" size={24} style={{ width: '100%' }}>
        {/* Header */}
        <div>
          <Title level={3} style={{ margin: 0, color: '#1E293B', fontSize: 20, fontWeight: 600 }}>
            知识库
          </Title>
          <Text style={{ color: '#64748B', fontSize: 13 }}>
            管理您的知识库和文档，支持向量检索和 AI 对话
          </Text>
        </div>

        {/* Search */}
        <Search
          placeholder="搜索知识库..."
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
            {/* Knowledge Base Grid */}
            {filteredKBs.length > 0 || true ? (
              <Row gutter={[16, 16]}>
                {/* Add Knowledge Base Card */}
                <Col xs={24} sm={12} lg={8} xl={6}>
                  <AddKnowledgeBaseCard onClick={handleOpenCreateModal} />
                </Col>

                {/* Knowledge Base Cards */}
                {filteredKBs.map((kb) => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={kb.id}>
                    <KnowledgeBaseCard
                      kb={kb}
                      onView={() => handleViewDocuments(kb)}
                      onUpload={() => handleOpenUploadModal(kb)}
                      onDelete={() => handleDeleteKB(kb.id)}
                    />
                  </Col>
                ))}
              </Row>
            ) : null}
          </>
        )}
      </Space>

      {/* 穿梭框弹窗 */}
      <KnowledgeTransferModal
        open={transferModalOpen}
        onCancel={() => setTransferModalOpen(false)}
        mode={transferMode}
        kbId={selectedKB?.id}
        kbName={selectedKB?.name}
        onSuccess={fetchKnowledgeBases}
      />

      {/* Delete Confirm Modal */}
      <Modal
        title="确认删除"
        open={deleteModalOpen}
        onOk={confirmDeleteKB}
        onCancel={cancelDeleteKB}
        okText="删除"
        okType="danger"
        cancelText="取消"
        centered
      >
        <p>确定要删除这个知识库吗？此操作不可恢复。</p>
      </Modal>
    </>
  );
}

export default KnowledgePage;
