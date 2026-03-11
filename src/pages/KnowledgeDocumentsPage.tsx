import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  Button,
  Space,
  Typography,
  Empty,
  Spin,
  Skeleton,
  Toast,
  List,
  Tag,
  Modal,
  Upload,
  Progress,
  Input,
  TextArea,
  Row,
  Col,
  Tooltip,
  Avatar,
  Banner,
} from "@douyinfe/semi-ui";
import {
  IconArrowLeft,
  IconUpload,
  IconDelete,
  IconFile,
  IconCloudUploadStroked,
  IconEdit,
  IconRefresh,
  IconTickCircle,
  IconHistory,
  IconClose,
} from "@douyinfe/semi-icons";
import api from "../lib/api";
import { useTaskProgress } from "../hooks";

const { Text, Title } = Typography;

interface Chunk {
  id: string;
  chunk_index: number;
  content: string;
  metadata?: string;
  created_at: string;
}

interface Document {
  id: string;
  name: string;
  description?: string;
  size: number;
  status: "processing" | "completed" | "failed";
  type: string;
  chunk_count?: number;
  created_at: string;
  created_by?: string;
  created_by_name?: string;
  created_by_avatar?: string;
  updated_by?: string;
  updated_by_name?: string;
  updated_by_avatar?: string;
  updated_at?: string;
}

interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  doc_count?: number;
  embedding_model?: string;
  created_at?: string;
}

function KnowledgeDocumentsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const kbId = (params?.id as string) || "";

  const [loading, setLoading] = useState(true);
  const [kb, setKb] = useState<KnowledgeBase | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);

  // Selected document and chunks
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [docChunks, setDocChunks] = useState<Chunk[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);

  // Upload modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );
  const [uploading, setUploading] = useState(false);

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // Chunk editing
  const [editingChunk, setEditingChunk] = useState<Chunk | null>(null);
  const [chunkContent, setChunkContent] = useState("");
  const [savingChunk, setSavingChunk] = useState(false);

  // Reindex confirm modal
  const [reindexModalOpen, setReindexModalOpen] = useState(false);
  const [reindexingDocId, setReindexingDocId] = useState<string | null>(null);
  const [reindexing, setReindexing] = useState(false);

  // Document history modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyDoc, setHistoryDoc] = useState<Document | null>(null);
  const [docHistory, setDocHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // SSE 任务进度追踪
  const {
    tasks: processingTasks,
    trackTask,
    removeTask,
    clearFinished,
    isAnyActive,
    activeTasks,
  } = useTaskProgress({
    onComplete: () => {
      fetchDocuments();
      fetchKnowledgeBase();
    },
    onFailed: (task) => {
      Toast.error(`文档处理失败: ${task.error || "未知错误"}`);
    },
  });

  const fetchKnowledgeBase = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/knowledge-bases/${kbId}`);
      setKb(data);
      setEditName(data.name || "");
      setEditDescription(data.description || "");
    } catch (error) {
      console.error("Failed to fetch knowledge base:", error);
      Toast.error("Failed to load knowledge base");
      navigate("/knowledge");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const data = await api.get(`/knowledge-bases/${kbId}/documents`);
      setDocuments(data.documents || []);
      // Auto-select first document if available
      if (data.documents && data.documents.length > 0 && !selectedDoc) {
        handleSelectDoc(data.documents[0]);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    }
  };

  useEffect(() => {
    if (kbId) {
      fetchKnowledgeBase();
      fetchDocuments();
    }
  }, [kbId]);

  const handleUpdateKB = async () => {
    if (!editName.trim()) {
      Toast.warning("请输入知识库名称");
      return;
    }

    setSaving(true);
    try {
      await api.put(`/knowledge-bases/${kbId}`, {
        name: editName,
        description: editDescription,
      });

      Toast.success("更新成功");
      setKb({ ...kb!, name: editName, description: editDescription });
      setIsEditModalOpen(false);
    } catch (error) {
      Toast.error(typeof error === "string" ? error : "更新失败");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async () => {
    if (uploadingFiles.length === 0) return;

    setUploading(true);
    const taskIds: string[] = [];
    try {
      for (const file of uploadingFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadProgress((prev) => ({ ...prev, [file.name]: progress }));
          }
        });

        const response: string = await new Promise((resolve, reject) => {
          xhr.addEventListener("load", () => {
            if (xhr.status === 200) {
              resolve(xhr.responseText);
            } else {
              reject(new Error("Upload failed"));
            }
          });
          xhr.addEventListener("error", () =>
            reject(new Error("Upload failed")),
          );

          const API_URL =
            import.meta.env.VITE_API_URL || "http://127.0.0.1:8888";
          const token =
            localStorage.getItem("access_token") ||
            sessionStorage.getItem("access_token");
          xhr.open(
            "POST",
            `${API_URL}/api/v1/knowledge-bases/${kbId}/documents/upload`,
          );
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          xhr.send(formData);
        });

        // 解析响应，获取 task_id 并启动 SSE 追踪
        try {
          const data = JSON.parse(response);
          if (data.task_id) {
            taskIds.push(data.task_id);
            trackTask(data.task_id);
          }
        } catch {
          // 解析失败不影响上传成功
        }
      }

      Toast.success(
        taskIds.length > 0
          ? `${uploadingFiles.length} 个文档已上传，正在后台处理...`
          : "文档上传成功",
      );
      setUploadingFiles([]);
      setUploadProgress({});
      setIsUploadModalOpen(false);
      fetchDocuments();
      fetchKnowledgeBase();
    } catch (error) {
      Toast.error("上传失败");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string, docName: string) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除文档 "${docName}" 吗？此操作不可恢复。`,
      okText: "删除",
      okButtonProps: { type: "danger" },
      cancelText: "取消",
      onOk: async () => {
        try {
          await api.delete(`/knowledge-bases/${kbId}/documents/${docId}`);

          Toast.success("文档已删除");
          if (selectedDoc?.id === docId) {
            setSelectedDoc(null);
            setDocChunks([]);
          }
          fetchDocuments();
          fetchKnowledgeBase();
        } catch (error) {
          Toast.error("删除失败");
        }
      },
    });
  };

  const handleSelectDoc = async (doc: Document) => {
    setSelectedDoc(doc);
    setLoadingChunks(true);

    try {
      const data = await api.get(
        `/knowledge-bases/${kbId}/documents/${doc.id}`,
      );
      setDocChunks(data.chunks || []);
    } catch (error) {
      console.error("Failed to fetch chunks:", error);
      Toast.error("Failed to load chunks");
    } finally {
      setLoadingChunks(false);
    }
  };

  const handleReindex = (docId: string) => {
    setReindexingDocId(docId);
    setReindexModalOpen(true);
  };

  const confirmReindex = async () => {
    if (!reindexingDocId) return;

    setReindexing(true);
    try {
      await api.post(
        `/knowledge-bases/${kbId}/documents/${reindexingDocId}/reindex`,
        {},
      );

      Toast.success("重建索引成功");
      if (selectedDoc) {
        handleSelectDoc(selectedDoc);
      }
    } catch (error) {
      Toast.error("重建索引失败");
    } finally {
      setReindexing(false);
      setReindexModalOpen(false);
      setReindexingDocId(null);
    }
  };

  const cancelReindex = () => {
    setReindexModalOpen(false);
    setReindexingDocId(null);
  };

  // Get document modification history
  const handleViewHistory = async (doc: Document) => {
    setHistoryDoc(doc);
    setHistoryModalOpen(true);
    setLoadingHistory(true);

    try {
      const data = await api.get(`/documents/${doc.id}/history`);
      setDocHistory(data.history || []);
    } catch (error) {
      console.error("Failed to fetch document history:", error);
      if (error === "Forbidden") {
        Toast.error("没有权限查看文档历史");
        setHistoryModalOpen(false);
      } else {
        Toast.error("加载历史失败");
        setHistoryModalOpen(false);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleEditChunk = (chunk: Chunk) => {
    setEditingChunk(chunk);
    setChunkContent(chunk.content);
  };

  const handleSaveChunk = async () => {
    if (!editingChunk) return;

    setSavingChunk(true);
    try {
      await api.put(
        `/knowledge-bases/${kbId}/documents/${selectedDoc?.id}/chunks/${editingChunk.id}`,
        {
          content: chunkContent,
        },
      );

      Toast.success("保存成功");
      setEditingChunk(null);
      if (selectedDoc) {
        handleSelectDoc(selectedDoc);
      }
    } catch (error) {
      Toast.error("保存失败");
    } finally {
      setSavingChunk(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Tag color="success" style={{ fontSize: 11 }}>
            已完成
          </Tag>
        );
      case "processing":
        return (
          <Tag color="processing" style={{ fontSize: 11 }}>
            处理中
          </Tag>
        );
      case "failed":
        return (
          <Tag color="error" style={{ fontSize: 11 }}>
            失败
          </Tag>
        );
      default:
        return <Tag style={{ fontSize: 11 }}>{status}</Tag>;
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Skeleton.Title style={{ width: 200 }} />
        <Skeleton.Paragraph rows={8} />
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Space size={16}>
            <Button
              icon={<IconArrowLeft />}
              onClick={() => navigate("/knowledge")}
            >
              返回
            </Button>
            <div>
              <Title heading={4} style={{ margin: 0 }}>
                {kb?.name}
              </Title>
              <Text type="tertiary" style={{ fontSize: 13 }}>
                {kb?.description || "No description"}
              </Text>
            </div>
          </Space>
          <Space>
            <Button
              icon={<IconEdit />}
              onClick={() => setIsEditModalOpen(true)}
            >
              编辑
            </Button>
            <Button
              type="primary"
              icon={<IconUpload />}
              onClick={() => setIsUploadModalOpen(true)}
            >
              上传文档
            </Button>
          </Space>
        </div>

        {/* SSE 任务进度面板 */}
        {Object.keys(processingTasks).length > 0 && (
          <Card
            size="small"
            style={{
              borderColor: isAnyActive
                ? "var(--semi-color-primary)"
                : "var(--semi-color-border)",
              background: "var(--semi-color-bg-1)",
            }}
            bodyStyle={{ padding: "12px 16px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: isAnyActive ? 8 : 0,
              }}
            >
              <Space>
                {isAnyActive && <Spin size="small" />}
                <Text strong style={{ fontSize: 13 }}>
                  {isAnyActive
                    ? `${activeTasks.length} 个文档正在处理中...`
                    : "文档处理完成"}
                </Text>
              </Space>
              {!isAnyActive && (
                <Button
                  type="tertiary"
                  size="small"
                  icon={<IconClose />}
                  onClick={clearFinished}
                >
                  清除
                </Button>
              )}
            </div>
            <Space vertical size={6} style={{ width: "100%" }}>
              {Object.values(processingTasks).map((task) => (
                <div
                  key={task.taskId}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <Progress
                    percent={task.progress}
                    size="small"
                    style={{ flex: 1 }}
                    stroke={
                      task.status === "failed"
                        ? "var(--semi-color-danger)"
                        : undefined
                    }
                  />
                  <Text
                    type="secondary"
                    style={{ fontSize: 11, whiteSpace: "nowrap", minWidth: 60 }}
                  >
                    {task.status === "completed"
                      ? "已完成"
                      : task.status === "failed"
                        ? "失败"
                        : task.status === "cancelled"
                          ? "已取消"
                          : task.message || `${task.progress}%`}
                  </Text>
                  {(task.status === "completed" ||
                    task.status === "failed" ||
                    task.status === "cancelled") && (
                    <Button
                      type="tertiary"
                      size="small"
                      icon={<IconClose />}
                      onClick={() => removeTask(task.taskId)}
                      style={{ padding: 2 }}
                    />
                  )}
                </div>
              ))}
            </Space>
          </Card>
        )}

        {/* Main Content - Left Doc List, Right Chunks */}
        <Row gutter={16} style={{ marginTop: 8 }}>
          {/* Left Panel - Document List */}
          <Col span={8}>
            <Card
              title={
                <Space>
                  <IconFile />
                  <Text>文档列表</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ({documents.length})
                  </Text>
                </Space>
              }
              style={{
                borderColor: "var(--semi-color-border)",
                height: "calc(100vh - 180px)",
                overflow: "hidden",
              }}
              bodyStyle={{
                padding: "12px",
                height: "calc(100% - 57px)",
                overflow: "auto",
              }}
            >
              {documents.length === 0 ? (
                <Empty description="暂无文档" style={{ padding: 40 }} />
              ) : (
                <Space vertical style={{ width: "100%" }} size={8}>
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => handleSelectDoc(doc)}
                      style={{
                        padding: "12px",
                        borderRadius: 8,
                        border:
                          selectedDoc?.id === doc.id
                            ? "1px solid var(--semi-color-primary)"
                            : "1px solid var(--semi-color-border)",
                        background:
                          selectedDoc?.id === doc.id
                            ? "var(--semi-color-primary-light-default)"
                            : "var(--semi-color-bg-1)",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <Space
                          vertical
                          size={4}
                          style={{ flex: 1, minWidth: 0 }}
                        >
                          <Text strong style={{ fontSize: 13 }} ellipsis>
                            {doc.name}
                          </Text>
                          <Space size={8} wrap>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {formatFileSize(doc.size)}
                            </Text>
                            {getStatusTag(doc.status)}
                            {doc.chunk_count !== undefined && (
                              <Tag style={{ fontSize: 10 }}>
                                {doc.chunk_count} chunks
                              </Tag>
                            )}
                          </Space>
                          {/* Uploader/Modifier Info */}
                          {(doc.created_by_name || doc.updated_by_name) && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginTop: 2,
                              }}
                            >
                              {doc.created_by_name && (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  <Avatar
                                    size={16}
                                    src={
                                      doc.created_by_avatar
                                        ? doc.created_by_avatar.startsWith(
                                            "http",
                                          )
                                          ? doc.created_by_avatar
                                          : `${window.location.origin}${doc.created_by_avatar}`
                                        : undefined
                                    }
                                    style={{
                                      backgroundColor:
                                        "var(--semi-color-primary)",
                                      fontSize: 8,
                                      flexShrink: 0,
                                    }}
                                  >
                                    {!doc.created_by_avatar &&
                                      doc.created_by_name
                                        ?.slice(0, 1)
                                        .toUpperCase()}
                                  </Avatar>
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: 10 }}
                                  >
                                    Uploaded by: {doc.created_by_name}
                                  </Text>
                                </div>
                              )}
                              {doc.updated_by_name &&
                                doc.updated_by_name !== doc.created_by_name && (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 4,
                                    }}
                                  >
                                    <Avatar
                                      size={16}
                                      src={
                                        doc.updated_by_avatar
                                          ? doc.updated_by_avatar.startsWith(
                                              "http",
                                            )
                                            ? doc.updated_by_avatar
                                            : `${window.location.origin}${doc.updated_by_avatar}`
                                          : undefined
                                      }
                                      style={{
                                        backgroundColor:
                                          "var(--semi-color-success)",
                                        fontSize: 8,
                                        flexShrink: 0,
                                      }}
                                    >
                                      {!doc.updated_by_avatar &&
                                        doc.updated_by_name
                                          ?.slice(0, 1)
                                          .toUpperCase()}
                                    </Avatar>
                                    <Text
                                      type="secondary"
                                      style={{ fontSize: 10 }}
                                    >
                                      Modified by: {doc.updated_by_name}
                                    </Text>
                                  </div>
                                )}
                            </div>
                          )}
                        </Space>
                        <Space size={4}>
                          <Tooltip title="重建索引">
                            <Button
                              type="tertiary"
                              size="small"
                              icon={<IconRefresh />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReindex(doc.id);
                              }}
                              style={{ padding: "4px" }}
                            />
                          </Tooltip>
                          <Tooltip title="查看历史">
                            <Button
                              type="tertiary"
                              size="small"
                              icon={<IconHistory />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewHistory(doc);
                              }}
                              style={{ padding: "4px" }}
                            />
                          </Tooltip>
                          <Tooltip title="删除">
                            <Button
                              type="tertiary"
                              danger
                              size="small"
                              icon={<IconDelete />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDocument(doc.id, doc.name);
                              }}
                              style={{ padding: "4px" }}
                            />
                          </Tooltip>
                        </Space>
                      </div>
                    </div>
                  ))}
                </Space>
              )}
            </Card>
          </Col>

          {/* Right Panel - Chunks Content */}
          <Col span={16}>
            <Card
              title={
                selectedDoc ? (
                  <Space>
                    <IconFile />
                    <Text>{selectedDoc.name}</Text>
                    <Tag color="blue">{docChunks.length} 个分块</Tag>
                  </Space>
                ) : (
                  <Space>
                    <IconFile />
                    <Text>分块内容</Text>
                  </Space>
                )
              }
              extra={
                selectedDoc && (
                  <Space>
                    <Tooltip title="重建索引">
                      <Button
                        size="small"
                        icon={<IconRefresh />}
                        onClick={() => handleReindex(selectedDoc.id)}
                      >
                        重建索引
                      </Button>
                    </Tooltip>
                  </Space>
                )
              }
              style={{
                borderColor: "var(--semi-color-border)",
                height: "calc(100vh - 180px)",
                overflow: "hidden",
              }}
              bodyStyle={{
                padding: "16px",
                height: "calc(100% - 57px)",
                overflow: "auto",
              }}
            >
              {!selectedDoc ? (
                <Empty
                  description="请从左侧选择文档查看分块内容"
                  style={{ padding: 60 }}
                />
              ) : loadingChunks ? (
                <div style={{ textAlign: "center", padding: 60 }}>
                  <Spin />
                </div>
              ) : docChunks.length === 0 ? (
                <Empty description="该文档暂无分块数据" />
              ) : (
                <Space vertical style={{ width: "100%" }} size={12}>
                  {docChunks.map((chunk) => (
                    <Card
                      key={chunk.id}
                      size="small"
                      style={{
                        border: "1px solid var(--semi-color-border)",
                        background: "var(--semi-color-bg-1)",
                      }}
                      bodyStyle={{ padding: "12px" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 12,
                        }}
                      >
                        <Space>
                          <Tag color="blue">#{chunk.chunk_index}</Tag>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {chunk.content.length} 个字符
                          </Text>
                        </Space>
                        {editingChunk?.id !== chunk.id ? (
                          <Button
                            type="tertiary"
                            size="small"
                            icon={<IconEdit />}
                            onClick={() => handleEditChunk(chunk)}
                          >
                            编辑
                          </Button>
                        ) : (
                          <Space size={8}>
                            <Button
                              type="primary"
                              size="small"
                              icon={<IconTickCircle />}
                              onClick={handleSaveChunk}
                              loading={savingChunk}
                            >
                              保存
                            </Button>
                            <Button
                              size="small"
                              onClick={() => {
                                setEditingChunk(null);
                                setChunkContent("");
                              }}
                            >
                              取消
                            </Button>
                          </Space>
                        )}
                      </div>
                      {editingChunk?.id === chunk.id ? (
                        <TextArea
                          value={chunkContent}
                          onChange={(value) => setChunkContent(value)}
                          rows={8}
                        />
                      ) : (
                        <div
                          style={{
                            padding: 12,
                            background: "var(--semi-color-bg-0)",
                            borderRadius: 6,
                            border: "1px solid var(--semi-color-border)",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            fontSize: 13,
                            lineHeight: 1.6,
                            maxHeight: 150,
                            overflow: "auto",
                          }}
                        >
                          {chunk.content}
                        </div>
                      )}
                    </Card>
                  ))}
                </Space>
              )}
            </Card>
          </Col>
        </Row>
      </div>

      {/* Edit Modal */}
      <Modal
        title="编辑知识库"
        visible={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        onOk={handleUpdateKB}
        okText="保存"
        cancelText="取消"
        okButtonProps={{ loading: saving }}
        bodyStyle={{ padding: "24px" }}
      >
        <Space vertical size={16} style={{ width: "100%" }}>
          <div>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              知识库名称
            </Text>
            <Input
              value={editName}
              onChange={(value) => setEditName(value)}
              placeholder="输入知识库名称"
            />
          </div>
          <div>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              描述
            </Text>
            <TextArea
              value={editDescription}
              onChange={(value) => setEditDescription(value)}
              placeholder="简要描述此知识库的用途..."
              rows={3}
            />
          </div>
        </Space>
      </Modal>

      {/* Upload Modal */}
      <Modal
        title="上传文档"
        visible={isUploadModalOpen}
        onCancel={() => !uploading && setIsUploadModalOpen(false)}
        footer={null}
        width={560}
        bodyStyle={{ padding: "24px" }}
      >
        <Space vertical size={20} style={{ width: "100%" }}>
          <Upload
            draggable
            multiple
            accept=".txt,.md,.pdf,.docx,.html,.xlsx,.csv"
            beforeUpload={({ file, fileList }) => {
              setUploadingFiles((prev) => [
                ...prev,
                ...fileList.map((f) => f.fileInstance as File),
              ]);
              return false;
            }}
            disabled={uploading}
            showUploadList={false}
            dragMainText="点击或拖拽文件到此区域上传"
            dragSubText="支持 TXT、MD、PDF、DOCX、HTML 等格式，单个文件最大 50MB"
          />

          {uploadingFiles.length > 0 && (
            <div>
              <Text strong style={{ display: "block", marginBottom: 12 }}>
                已选择 {uploadingFiles.length} 个文件
              </Text>
              <List
                dataSource={uploadingFiles}
                renderItem={(file, index) => (
                  <List.Item
                    style={{
                      padding: "12px 0",
                      borderBottom: "1px solid var(--semi-color-bg-2)",
                    }}
                    actions={
                      uploading
                        ? []
                        : [
                            <Button
                              type="tertiary"
                              danger
                              size="small"
                              icon={<IconDelete />}
                              onClick={() =>
                                setUploadingFiles(
                                  uploadingFiles.filter((_, i) => i !== index),
                                )
                              }
                            />,
                          ]
                    }
                  >
                    <List.Item.Meta
                      avatar={
                        <IconFile
                          style={{
                            fontSize: 16,
                            color: "var(--semi-color-text-3)",
                          }}
                        />
                      }
                      title={<Text style={{ fontSize: 13 }}>{file.name}</Text>}
                      description={
                        <Space vertical size={4} style={{ width: 200 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {formatFileSize(file.size)}
                          </Text>
                          {uploadProgress[file.name] !== undefined && (
                            <Progress
                              percent={uploadProgress[file.name]}
                              size="small"
                            />
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button
              onClick={() => setIsUploadModalOpen(false)}
              disabled={uploading}
            >
              取消
            </Button>
            <Button
              type="primary"
              onClick={handleUpload}
              loading={uploading}
              disabled={uploadingFiles.length === 0}
            >
              上传
            </Button>
          </div>
        </Space>
      </Modal>

      {/* Reindex Confirm Modal */}
      <Modal
        title="重建文档索引"
        visible={reindexModalOpen}
        onOk={confirmReindex}
        onCancel={cancelReindex}
        okText="确认"
        cancelText="取消"
        okButtonProps={{ loading: reindexing }}
        centered
      >
        <p>确定要重建该文档的索引吗？这将重新生成向量嵌入。</p>
      </Modal>

      {/* Document History Modal */}
      <Modal
        title={
          <Space>
            <IconHistory />
            <Text>文档历史 - {historyDoc?.name}</Text>
          </Space>
        }
        visible={historyModalOpen}
        onCancel={() => setHistoryModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setHistoryModalOpen(false)}>
            关闭
          </Button>,
        ]}
        width={800}
        centered
      >
        {loadingHistory ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin />
          </div>
        ) : docHistory.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Text type="secondary">暂无修改历史</Text>
          </div>
        ) : (
          <Space vertical size={12} style={{ width: "100%" }}>
            {docHistory.map((log) => (
              <Card
                key={log.id}
                size="small"
                style={{
                  background:
                    log.action === "delete"
                      ? "var(--semi-color-danger-light-default)"
                      : "var(--semi-color-bg-1)",
                }}
              >
                <Space vertical size={8} style={{ width: "100%" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Space>
                      <Tag
                        color={
                          log.action === "create"
                            ? "green"
                            : log.action === "update"
                              ? "blue"
                              : log.action === "delete"
                                ? "red"
                                : "default"
                        }
                      >
                        {log.action === "create"
                          ? "创建"
                          : log.action === "update"
                            ? "更新"
                            : log.action === "delete"
                              ? "删除"
                              : log.action}
                      </Tag>
                      <Tag color="default">
                        {log.entity_type === "chunk" ? "分块" : "文档"}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {log.username || "Unknown user"}
                      </Text>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {new Date(log.created_at).toLocaleString()}
                    </Text>
                  </div>
                  {log.changes && (
                    <div
                      style={{
                        padding: 12,
                        background: "var(--semi-color-bg-0)",
                        borderRadius: 6,
                        border: "1px solid var(--semi-color-border)",
                      }}
                    >
                      <Text
                        strong
                        style={{
                          fontSize: 12,
                          display: "block",
                          marginBottom: 8,
                        }}
                      >
                        变更内容：
                      </Text>
                      {Object.entries(log.changes).map(
                        ([key, value]: [string, any]) => (
                          <div key={key} style={{ marginBottom: 8 }}>
                            <Text type="tertiary" style={{ fontSize: 11 }}>
                              {key}:
                            </Text>
                            <div style={{ marginTop: 4 }}>
                              {value?.old !== undefined && (
                                <div style={{ marginBottom: 4 }}>
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: 11 }}
                                  >
                                    旧值：
                                  </Text>
                                  <div
                                    style={{
                                      padding: "6px 8px",
                                      background:
                                        "var(--semi-color-danger-light-default)",
                                      borderRadius: 4,
                                      marginTop: 4,
                                      fontSize: 12,
                                      wordBreak: "break-all",
                                    }}
                                  >
                                    {typeof value.old === "object"
                                      ? JSON.stringify(value.old)
                                      : typeof value.old === "string" &&
                                          value.old.length > 200
                                        ? value.old.substring(0, 200) + "..."
                                        : value.old || "-"}
                                  </div>
                                </div>
                              )}
                              {value?.new !== undefined && (
                                <div>
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: 11 }}
                                  >
                                    新值：
                                  </Text>
                                  <div
                                    style={{
                                      padding: "6px 8px",
                                      background:
                                        "var(--semi-color-success-light-default)",
                                      borderRadius: 4,
                                      marginTop: 4,
                                      fontSize: 12,
                                      wordBreak: "break-all",
                                    }}
                                  >
                                    {typeof value.new === "object"
                                      ? JSON.stringify(value.new)
                                      : typeof value.new === "string" &&
                                          value.new.length > 200
                                        ? value.new.substring(0, 200) + "..."
                                        : value.new || "-"}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </Space>
              </Card>
            ))}
          </Space>
        )}
      </Modal>
    </>
  );
}

export default KnowledgeDocumentsPage;
