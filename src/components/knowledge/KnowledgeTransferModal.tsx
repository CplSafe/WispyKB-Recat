import { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Transfer,
  Button,
  Space,
  Typography,
  Upload,
  message,
  Input,
  Select,
  Spin,
  Tag,
  Progress,
  Divider,
  Tabs,
} from 'antd';
import {
  DatabaseOutlined,
  InboxOutlined,
  CloudUploadOutlined,
  FileTextOutlined,
  DeleteOutlined,
  PlusOutlined,
  AppstoreOutlined,
  GlobalOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import type { TransferProps } from 'antd/es/transfer';
import api from '../../lib/api';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  status: string;
  created_at: string;
}

interface Application {
  id: string;
  name: string;
  description?: string;
}

interface KnowledgeTransferModalProps {
  open: boolean;
  onCancel: () => void;
  mode: 'create' | 'upload';
  kbId?: string;
  kbName?: string;
  onSuccess?: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8888';

export default function KnowledgeTransferModal({
  open,
  onCancel,
  mode,
  kbId,
  kbName: propKbName,
  onSuccess,
}: KnowledgeTransferModalProps) {
  const [messageApi, contextHolder] = message.useMessage();

  // 表单状态
  const [formKbName, setFormKbName] = useState('');
  const [formKbDesc, setFormKbDesc] = useState('');
  const [selectedApps, setSelectedApps] = useState<string[]>([]);

  // 文档池状态
  const [poolDocuments, setPoolDocuments] = useState<Document[]>([]);
  const [poolLoading, setPoolLoading] = useState(false);

  // 当前知识库已有文档（上传模式）
  const [kbDocuments, setKbDocuments] = useState<Document[]>([]);
  const [kbDocsLoading, setKbDocsLoading] = useState(false);

  // 穿梭框状态
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 上传状态
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // 应用列表
  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

  // 同步状态
  const [syncTab, setSyncTab] = useState<'file' | 'web' | 'feishu'>('file');
  const [webUrl, setWebUrl] = useState('');
  const [syncingWeb, setSyncingWeb] = useState(false);
  const [feishuSpaceId, setFeishuSpaceId] = useState('');
  const [feishuNodeToken, setFeishuNodeToken] = useState('');
  const [syncingFeishu, setSyncingFeishu] = useState(false);
  const [feishuConfigured, setFeishuConfigured] = useState(false);

  // 获取文档池文档
  const fetchPoolDocuments = useCallback(async () => {
    setPoolLoading(true);
    try {
      const data = await api.get('/documents/pool');
      setPoolDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to fetch pool documents:', error);
    } finally {
      setPoolLoading(false);
    }
  }, []);

  // 获取当前知识库文档（上传模式）
  const fetchKbDocuments = useCallback(async () => {
    if (!kbId) return;
    setKbDocsLoading(true);
    try {
      const data = await api.get(`/knowledge-bases/${kbId}/documents`);
      setKbDocuments(data.documents || []);
      // 设置已分配的文档为 targetKeys
      setTargetKeys((data.documents || []).map((d: Document) => d.id));
    } catch (error) {
      console.error('Failed to fetch KB documents:', error);
    } finally {
      setKbDocsLoading(false);
    }
  }, [kbId]);

  // 获取应用列表
  const fetchApplications = useCallback(async () => {
    setAppsLoading(true);
    try {
      const data = await api.get('/applications');
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setAppsLoading(false);
    }
  }, []);

  // 获取飞书配置
  const fetchFeishuConfig = useCallback(async () => {
    try {
      const data = await api.get('/integrations/feishu/config');
      setFeishuConfigured(!!data.feishu_app_id);
    } catch (error) {
      console.error('Failed to fetch Feishu config:', error);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchPoolDocuments();
      fetchFeishuConfig();
      if (mode === 'upload') {
        fetchKbDocuments();
      } else {
        fetchApplications();
      }
    }
  }, [open, mode, fetchPoolDocuments, fetchKbDocuments, fetchApplications, fetchFeishuConfig]);

  // 上传文档到池
  const handleUploadToPool = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        }
      });

      await new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            resolve(xhr.response);
          } else {
            reject(new Error('Upload failed'));
          }
        });
        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.open('POST', `${API_URL}/api/v1/documents/pool/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      messageApi.success(`${file.name} 上传成功`);
      await fetchPoolDocuments();
    } catch (error) {
      messageApi.error(`${file.name} 上传失败`);
    } finally {
      setUploading(false);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[file.name];
        return newProgress;
      });
    }

    return false;
  };

  // 删除文档池文档
  const handleDelete = async (docId: string) => {
    try {
      await api.delete(`/documents/pool/${docId}`);
      messageApi.success('文档已删除');
      await fetchPoolDocuments();
    } catch (error) {
      messageApi.error('删除失败');
    }
  };

  // 网页同步（同步到文档池，稍后可分配）
  const handleWebSync = async () => {
    if (!webUrl.trim()) {
      messageApi.warning('请输入网页URL');
      return;
    }

    setSyncingWeb(true);
    try {
      // 如果是上传模式，直接同步到知识库；如果是创建模式，先同步到文档池
      if (mode === 'upload' && kbId) {
        const data = await api.post(`/knowledge-bases/${kbId}/sync/web`, { url: webUrl });
        messageApi.success(`网页同步成功，已抓取 ${data.word_count || 0} 个字符`);
        setWebUrl('');
        await fetchKbDocuments();
        await fetchPoolDocuments();
      } else {
        // 创建模式：先同步到临时知识库，然后移回文档池
        // 这里简化处理：直接提示用户在创建后使用网页同步
        messageApi.info('请先创建知识库，然后使用"管理文档"功能同步网页内容');
      }
    } catch (error) {
      messageApi.error(typeof error === 'string' ? error : '网页同步失败');
    } finally {
      setSyncingWeb(false);
    }
  };

  // 飞书知识库同步
  const handleFeishuSync = async () => {
    if (!feishuConfigured) {
      messageApi.warning('请先在系统设置中配置飞书 App ID 和 App Secret');
      return;
    }

    if (!feishuSpaceId.trim() && !feishuNodeToken.trim()) {
      messageApi.warning('请输入飞书知识库 ID 或文档 Token');
      return;
    }

    setSyncingFeishu(true);
    try {
      // 使用现有的飞书同步 API
      const data = await api.post('/integrations/feishu/sync', {
        space_id: feishuSpaceId || undefined,
        node_token: feishuNodeToken || undefined,
        kb_id: mode === 'upload' ? kbId : undefined,  // 上传模式直接同步到知识库
      });
      messageApi.success(`飞书同步成功，已同步 ${data.documents_count || 0} 个文档`);
      setFeishuSpaceId('');
      setFeishuNodeToken('');
      await fetchPoolDocuments();
      if (mode === 'upload') {
        await fetchKbDocuments();
      }
    } catch (error) {
      messageApi.error(typeof error === 'string' ? error : '飞书同步失败');
    } finally {
      setSyncingFeishu(false);
    }
  };

  // 穿梭框变更
  const handleTransferChange: TransferProps['onChange'] = (newTargetKeys) => {
    setTargetKeys(newTargetKeys as string[]);
  };

  // 提交创建或更新
  const handleSubmit = async () => {
    if (mode === 'create') {
      if (!formKbName.trim()) {
        messageApi.warning('请输入知识库名称');
        return;
      }

      setSubmitting(true);
      try {
        // 1. 创建知识库
        const kbData = await api.post('/knowledge-bases', {
          name: formKbName,
          description: formKbDesc,
        });
        const newKbId = kbData.id;

        // 2. 关联应用
        if (selectedApps.length > 0) {
          // 更新应用关联，需要先获取应用完整信息
          for (const appId of selectedApps) {
            const appData = await api.get(`/applications/${appId}`);
            // 合并现有的知识库ID和新的知识库ID
            const existingKbIds = appData.knowledge_base_ids || [];
            const updatedKbIds = [...new Set([...existingKbIds, newKbId])];

            await api.put(`/applications/${appId}`, {
              name: appData.name,
              description: appData.description || '',
              model: appData.model,
              knowledge_base_ids: updatedKbIds,
              is_public: appData.is_public ?? false,
              system_prompt: appData.system_prompt || '',
              welcome_message: appData.welcome_message || '',
              share_password: appData.share_password || '',
              temperature: appData.temperature ?? 0.7,
              max_tokens: appData.max_tokens ?? 2048,
            });
          }
        }

        // 3. 分配文档
        if (targetKeys.length > 0) {
          await api.post('/documents/assign', {
            doc_ids: targetKeys,
            kb_id: newKbId,
          });
        }

        messageApi.success('知识库创建成功');
        handleCancel();
        onSuccess?.();
      } catch (error) {
        messageApi.error(typeof error === 'string' ? error : '创建失败');
      } finally {
        setSubmitting(false);
      }
    } else {
      // 上传模式：分配/移除文档
      setSubmitting(true);
      try {
        // 计算需要分配和移除的文档
        const currentKbDocIds = kbDocuments.map(d => d.id);
        const toAssign = targetKeys.filter(id => !currentKbDocIds.includes(id));
        const toUnassign = currentKbDocIds.filter(id => !targetKeys.includes(id));

        // 分配新文档
        if (toAssign.length > 0) {
          await api.post('/documents/assign', {
            doc_ids: toAssign,
            kb_id: kbId,
          });
        }

        // 移除文档
        if (toUnassign.length > 0) {
          await api.post('/documents/unassign', {
            doc_ids: toUnassign,
          });
        }

        messageApi.success('文档更新成功');
        handleCancel();
        onSuccess?.();
      } catch (error) {
        messageApi.error(typeof error === 'string' ? error : '更新失败');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleCancel = () => {
    setFormKbName('');
    setFormKbDesc('');
    setSelectedApps([]);
    setTargetKeys([]);
    setWebUrl('');
    setFeishuSpaceId('');
    setFeishuNodeToken('');
    setSyncTab('file');
    onCancel();
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // 合并文档池和当前知识库文档
  const allDocuments = [...poolDocuments, ...kbDocuments];
  const dataSource = allDocuments.map((doc) => ({
    key: doc.id,
    title: doc.name,
    description: `${formatFileSize(doc.size)} • ${doc.type.toUpperCase()}`,
    ...doc,
  }));

  // 穿梭框渲染项
  const renderTransferItem = (item: any) => {
    const inPool = poolDocuments.some((d) => d.id === item.key);
    const inKb = kbDocuments.some((d) => d.id === item.key);

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          borderRadius: 6,
        }}
      >
        <Space size={8}>
          <FileTextOutlined style={{ color: '#64748B' }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {formatFileSize(item.size)} • {item.type.toUpperCase()}
            </Text>
          </div>
          {inKb && <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>已分配</Tag>}
        </Space>
        {inPool && (
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item.key);
            }}
            style={{ fontSize: 12 }}
          />
        )}
      </div>
    );
  };

  return (
    <>
      {contextHolder}
      <Modal
        title={null}
        open={open}
        onCancel={handleCancel}
        width={900}
        footer={null}
        styles={{ body: { padding: 0 } }}
        destroyOnHidden
      >
        <div style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', padding: '20px 24px' }}>
          <Space>
            <DatabaseOutlined style={{ fontSize: 24, color: '#fff' }} />
            <div>
              <Title level={4} style={{ margin: 0, color: '#fff' }}>
                {mode === 'create' ? '创建知识库' : `管理文档 - ${propKbName}`}
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                {mode === 'create' ? '上传文档并分配到新知识库，选择关联应用' : '从文档池选择文档分配到知识库'}
              </Text>
            </div>
          </Space>
        </div>

        <div style={{ padding: '24px' }}>
          <Space orientation="vertical" size={20} style={{ width: '100%' }}>
            {/* 创建模式：表单字段 */}
            {mode === 'create' && (
              <>
                <div>
                  <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                    <div>
                      <Text strong style={{ fontSize: 13 }}>
                        知识库名称 <span style={{ color: '#ef4444' }}>*</span>
                      </Text>
                      <Input
                        placeholder="例如：产品文档、技术资料"
                        value={formKbName}
                        onChange={(e) => setFormKbName(e.target.value)}
                        style={{ marginTop: 6, borderRadius: 6 }}
                      />
                    </div>

                    <div>
                      <Text strong style={{ fontSize: 13 }}>描述</Text>
                      <TextArea
                        placeholder="简要描述这个知识库的用途..."
                        rows={2}
                        value={formKbDesc}
                        onChange={(e) => setFormKbDesc(e.target.value)}
                        style={{ marginTop: 6, borderRadius: 6 }}
                      />
                    </div>

                    <div>
                      <Text strong style={{ fontSize: 13 }}>关联应用（可选）</Text>
                      <Select
                        mode="multiple"
                        placeholder="选择要关联的应用"
                        value={selectedApps}
                        onChange={setSelectedApps}
                        loading={appsLoading}
                        style={{ width: '100%', marginTop: 6 }}
                        options={applications.map((app) => ({
                          label: app.name,
                          value: app.id,
                        }))}
                      />
                    </div>
                  </Space>
                </div>

                <Divider style={{ margin: '12px 0' }} />
              </>
            )}

            {/* 文档导入区域 */}
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
                <CloudUploadOutlined /> 添加文档到文档池
              </Text>
              <Tabs
                activeKey={syncTab}
                onChange={(key) => setSyncTab(key as 'file' | 'web' | 'feishu')}
                size="small"
                items={[
                  {
                    key: 'file',
                    label: (
                      <span>
                        <CloudUploadOutlined /> 本地文件
                      </span>
                    ),
                    children: (
                      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                        <Dragger
                          multiple
                          accept=".txt,.md,.pdf,.docx,.html,.xlsx,.csv,.json,.xml"
                          beforeUpload={handleUploadToPool}
                          disabled={uploading}
                          showUploadList={false}
                          style={{
                            borderRadius: 8,
                            background: '#F8FAFC',
                            borderColor: '#E2E8F0',
                            padding: '16px',
                          }}
                        >
                          <div style={{ textAlign: 'center' }}>
                            <CloudUploadOutlined style={{ fontSize: 28, color: '#2563EB' }} />
                            <div style={{ marginTop: 8, fontSize: 13 }}>
                              点击或拖拽文件到此处上传
                            </div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              支持 TXT, MD, PDF, DOCX, HTML, XLSX, CSV, JSON, XML
                            </Text>
                          </div>
                        </Dragger>

                        {/* 上传进度 */}
                        {Object.keys(uploadProgress).length > 0 && (
                          <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                            {Object.entries(uploadProgress).map(([fileName, progress]) => (
                              <div key={fileName}>
                                <Text style={{ fontSize: 12 }}>{fileName}</Text>
                                <Progress percent={progress} size="small" strokeColor="#2563EB" />
                              </div>
                            ))}
                          </Space>
                        )}
                      </Space>
                    ),
                  },
                  {
                    key: 'web',
                    label: (
                      <span>
                        <GlobalOutlined /> 网页同步
                      </span>
                    ),
                    children: (
                      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                        <div>
                          <Text strong style={{ display: 'block', marginBottom: 6, fontSize: 12 }}>
                            网页链接
                          </Text>
                          <Input
                            placeholder="https://example.com/article"
                            value={webUrl}
                            onChange={(e) => setWebUrl(e.target.value)}
                            prefix={<LinkOutlined />}
                            disabled={syncingWeb}
                          />
                        </div>
                        <Button
                          type="primary"
                          onClick={handleWebSync}
                          loading={syncingWeb}
                          disabled={!webUrl.trim()}
                          icon={<GlobalOutlined />}
                          style={{ width: 'fit-content' }}
                        >
                          同步网页
                        </Button>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          支持抓取新闻、博客、文档等公开网页内容
                        </Text>
                      </Space>
                    ),
                  },
                  {
                    key: 'feishu',
                    label: (
                      <span>
                        <AppstoreOutlined /> 飞书知识库
                      </span>
                    ),
                    children: (
                      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                        {!feishuConfigured && (
                          <div style={{
                            padding: '8px 12px',
                            background: '#FEF3C7',
                            borderRadius: 6,
                            border: '1px solid #FDE68A',
                          }}>
                            <Text style={{ fontSize: 12, color: '#92400E' }}>
                              请先在系统设置中配置飞书 App ID 和 App Secret
                            </Text>
                          </div>
                        )}
                        <div>
                          <Text strong style={{ display: 'block', marginBottom: 6, fontSize: 12 }}>
                            知识库 ID
                          </Text>
                          <Input
                            placeholder="飞书知识库的 space_id"
                            value={feishuSpaceId}
                            onChange={(e) => setFeishuSpaceId(e.target.value)}
                            disabled={syncingFeishu}
                          />
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>或</Text>
                        <div>
                          <Text strong style={{ display: 'block', marginBottom: 6, fontSize: 12 }}>
                            文档 Token
                          </Text>
                          <Input
                            placeholder="飞书文档的 node_token"
                            value={feishuNodeToken}
                            onChange={(e) => setFeishuNodeToken(e.target.value)}
                            disabled={syncingFeishu}
                          />
                        </div>
                        <Button
                          type="primary"
                          onClick={handleFeishuSync}
                          loading={syncingFeishu}
                          disabled={!feishuConfigured || (!feishuSpaceId.trim() && !feishuNodeToken.trim())}
                          icon={<AppstoreOutlined />}
                          style={{ width: 'fit-content' }}
                        >
                          同步飞书文档
                        </Button>
                      </Space>
                    ),
                  },
                ]}
              />
            </div>

            {/* 穿梭框 */}
            {(poolLoading || kbDocsLoading) ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin />
              </div>
            ) : (
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
                  <InboxOutlined /> 分配文档到知识库
                </Text>
                <Transfer
                  dataSource={dataSource}
                  targetKeys={targetKeys}
                  onChange={handleTransferChange}
                  render={renderTransferItem}
                  titles={[
                    `文档池 (${poolDocuments.length})`,
                    mode === 'create'
                      ? `待分配 (${targetKeys.length})`
                      : `${propKbName} (${targetKeys.length})`
                  ]}
                  styles={{
                    list: {
                      width: '100%',
                      height: 280,
                    },
                  }}
                  style={{ width: '100%' }}
                  showSearch
                  filterOption={(inputValue, item) =>
                    item.name?.toLowerCase().includes(inputValue.toLowerCase()) ||
                    item.type?.toLowerCase().includes(inputValue.toLowerCase())
                  }
                />
              </div>
            )}

            {/* 统计信息 */}
            <div
              style={{
                padding: '12px',
                background: '#F1F5F9',
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <Space size={16}>
                <Text style={{ fontSize: 12 }}>
                  <Text strong>文档池:</Text> {poolDocuments.length} 个
                </Text>
                {mode === 'upload' && (
                  <Text style={{ fontSize: 12 }}>
                    <Text strong>知识库:</Text> {kbDocuments.length} 个
                  </Text>
                )}
                <Text style={{ fontSize: 12 }}>
                  <Text strong>已选择:</Text> {targetKeys.length} 个
                </Text>
              </Space>
              <Text style={{ fontSize: 12, color: '#64748B' }}>
                {mode === 'create' ? '创建后将自动分配选中的文档' : '点击保存后生效'}
              </Text>
            </div>

            {/* 操作按钮 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={handleCancel} disabled={submitting}>
                取消
              </Button>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={submitting}
                disabled={mode === 'create' ? !formKbName.trim() : false}
                icon={mode === 'create' ? <PlusOutlined /> : <DatabaseOutlined />}
                style={{ background: '#2563EB', borderColor: '#2563EB' }}
              >
                {mode === 'create' ? '创建知识库' : '保存更改'}
              </Button>
            </div>
          </Space>
        </div>
      </Modal>
    </>
  );
}
