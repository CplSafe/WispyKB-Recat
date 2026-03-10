import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  Button,
  Space,
  Typography,
  Empty,
  Tag,
  Upload,
  Modal,
  Tooltip,
  Avatar,
} from '@douyinfe/semi-ui';
import {
  IconArrowLeft,
  IconUpload,
  IconDelete,
  IconFile,
  IconRefresh,
} from '@douyinfe/semi-icons';

// 导入新的 UI 组件
import {
  PageLoading,
  ErrorDisplay,
  useFileUploader,
  UploadFileList,
  withNotification,
  confirmDialog,
  useErrorHandler
} from '@/components';

import api from '@/lib/api';

const { Text, Title } = Typography;

interface Document {
  id: string;
  name: string;
  status: 'processing' | 'completed' | 'failed';
  size: number;
  created_at: string;
}

/**
 * 优化后的文档管理页面
 *
 * 主要改进：
 * 1. 使用 PageLoading 统一加载状态
 * 2. 使用 ErrorDisplay 显示错误
 * 3. 使用 FileUploader 增强上传体验
 * 4. 使用 withNotification 包装异步操作
 * 5. 使用 confirmDialog 替代原生确认
 */
function OptimizedKnowledgeDocumentsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const kbId = (params?.id as string) || '';

  // 状态管理
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [kbInfo, setKbInfo] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  // 上传相关
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const {
    uploadFiles,
    isUploading,
    startUpload,
    cancelUpload,
    retryUpload,
    clearUploadFiles
  } = useFileUploader();

  // 错误处理 Hook
  const { handleError } = useErrorHandler();

  /**
   * 获取知识库信息
   */
  const fetchKnowledgeBase = async () => {
    try {
      const data = await api.get(`/knowledge-bases/${kbId}`);
      setKbInfo(data);
    } catch (err) {
      const errorInfo = handleError(err, 'fetchKnowledgeBase');
      setError(errorInfo);
    }
  };

  /**
   * 获取文档列表
   */
  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      await withNotification(
        async () => {
          const data = await api.get(`/knowledge-bases/${kbId}/documents`);
          setDocuments(data.documents || []);
        },
        {
          loading: '正在加载文档列表...',
          success: null, // 不显示成功提示
          error: '加载文档列表失败'
        }
      );
    } catch (err) {
      const errorInfo = handleError(err, 'fetchDocuments');
      setError(errorInfo);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 初始化加载
   */
  useEffect(() => {
    fetchKnowledgeBase();
    fetchDocuments();
  }, [kbId]);

  /**
   * 处理文件选择
   */
  const handleFileSelect = (files: File[]) => {
    // 直接开始上传
    handleUpload(files);
  };

  /**
   * 上传文件
   */
  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;

    await withNotification(
      async () => {
        await startUpload(files, kbId);

        // 上传成功后的处理
        setIsUploadModalOpen(false);
        clearUploadFiles();

        // 刷新列表
        await Promise.all([
          fetchDocuments(),
          fetchKnowledgeBase()
        ]);
      },
      {
        loading: `正在上传 ${files.length} 个文档...`,
        success: (files.length > 1)
          ? `成功上传 ${files.length} 个文档`
          : '文档上传成功',
        error: '文档上传失败，请重试'
      }
    );
  };

  /**
   * 删除文档
   */
  const handleDeleteDocument = async (doc: Document) => {
    const confirmed = await confirmDialog({
      title: '确认删除',
      content: `确定要删除文档 "${doc.name}" 吗？此操作不可恢复。`,
      type: 'danger',
      confirmText: '删除',
      cancelText: '取消'
    });

    if (!confirmed) return;

    await withNotification(
      async () => {
        await api.delete(`/knowledge-bases/${kbId}/documents/${doc.id}`);

        // 刷新列表
        await Promise.all([
          fetchDocuments(),
          fetchKnowledgeBase()
        ]);
      },
      {
        loading: '正在删除文档...',
        success: '文档已删除',
        error: '删除文档失败'
      }
    );
  };

  /**
   * 刷新页面
   */
  const handleRefresh = async () => {
    await fetchDocuments();
    await fetchKnowledgeBase();
    notifyInfo('页面已刷新');
  };

  // 加载状态
  if (loading) {
    return <PageLoading tip="正在加载文档..." />;
  }

  // 错误状态
  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <ErrorDisplay
          error={error}
          onRetry={handleRefresh}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '24px' }}>
        <Space>
          <Button
            icon={<IconArrowLeft />}
            type="tertiary"
            onClick={() => navigate('/knowledge')}
          >
            返回
          </Button>
          <Title heading={4}>
            {kbInfo?.name || '知识库'}
          </Title>
          <Button
            icon={<IconRefresh />}
            type="tertiary"
            onClick={handleRefresh}
          >
            刷新
          </Button>
        </Space>
      </div>

      {/* 操作栏 */}
      <Card style={{ marginBottom: '16px' }}>
        <Space>
          <Button
            type="primary"
            icon={<IconUpload />}
            onClick={() => setIsUploadModalOpen(true)}
          >
            上传文档
          </Button>

          <Text type="secondary">
            共 {documents.length} 个文档
          </Text>
        </Space>
      </Card>

      {/* 文档列表 */}
      {documents.length === 0 ? (
        <Empty
          title="暂无文档"
          description="点击上方按钮上传文档"
        />
      ) : (
        <div>
          {documents.map((doc) => (
            <Card
              key={doc.id}
              style={{ marginBottom: '12px' }}
              bodyStyle={{ padding: '16px' }}
            >
              <Space
                style={{ width: '100%', justifyContent: 'space-between' }}
              >
                <Space>
                  <IconFile />
                  <div>
                    <Text strong>{doc.name}</Text>
                    <br />
                    <Text type="secondary" size="small">
                      {(doc.size / 1024).toFixed(2)} KB
                    </Text>
                  </div>
                  <Tag color={doc.status === 'completed' ? 'green' : 'blue'}>
                    {doc.status === 'completed' ? '已完成' : '处理中'}
                  </Tag>
                </Space>

                <Space>
                  <Button
                    type="tertiary"
                    danger
                    icon={<IconDelete />}
                    onClick={() => handleDeleteDocument(doc)}
                  >
                    删除
                  </Button>
                </Space>
              </Space>
            </Card>
          ))}
        </div>
      )}

      {/* 上传模态框 */}
      <Modal
        title="上传文档"
        visible={isUploadModalOpen}
        onCancel={() => !isUploading && setIsUploadModalOpen(false)}
        footer={null}
        width={600}
      >
        <Space vertical size={20} style={{ width: '100%' }}>
          <Upload
            draggable
            multiple
            accept=".txt,.md,.pdf,.docx,.html,.xlsx,.csv"
            beforeUpload={({ fileList }) => {
              const files = fileList.map(f => f.fileInstance as File);
              handleFileSelect(files);
              return false;
            }}
            disabled={isUploading}
            showUploadList={false}
            dragMainText="点击或拖拽文件到此区域上传"
            dragSubText="支持 TXT、MD、PDF、DOCX、HTML 等格式，单个文件最大 50MB"
          />

          {/* 上传进度列表 */}
          {uploadFiles.length > 0 && (
            <UploadFileList
              files={uploadFiles}
              isUploading={isUploading}
              onCancel={cancelUpload}
              onRetry={(fileName) => retryUpload(fileName, kbId)}
            />
          )}

          <div style={{ textAlign: 'right', marginTop: '16px' }}>
            <Button
              onClick={() => setIsUploadModalOpen(false)}
              disabled={isUploading}
            >
              关闭
            </Button>
          </div>
        </Space>
      </Modal>
    </div>
  );
}

export default OptimizedKnowledgeDocumentsPage;
