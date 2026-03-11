import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Input,
  Button,
  Space,
  Typography,
  Skeleton,
  Toast,
  Tag,
  Popconfirm,
  Avatar,
  Empty,
  List,
  Pagination,
  Tooltip,
  Spin,
  Progress,
} from "@douyinfe/semi-ui";
import {
  IconPlus,
  IconSearch,
  IconDelete,
  IconEyeOpened,
  IconUpload,
  IconEdit,
  IconFile,
} from "@douyinfe/semi-icons";
import KnowledgeTransferModal from "../components/knowledge/KnowledgeTransferModal";
import api from "../lib/api";

const { Text, Title } = Typography;

interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  doc_count?: number;
  processing_count?: number;
  embedding_model?: string;
  updated_at?: string;
  created_at?: string;
  owner_id?: string;
  owner_name?: string;
  owner_avatar?: string;
}

function KnowledgePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferMode, setTransferMode] = useState<"create" | "upload">(
    "create",
  );
  const [selectedKB, setSelectedKB] = useState<KnowledgeBase | null>(null);

  // 处理进度状态: kb_id -> { overall_progress, documents, processing_count }
  const [processingProgress, setProcessingProgress] = useState<Record<string, {
    overall_progress: number;
    processing_count: number;
    documents: Array<{
      doc_id: string;
      filename: string;
      progress: number;
      message: string;
    }>;
  }>>({});
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchKnowledgeBases = async () => {
    setLoading(true);
    try {
      const data = await api.get("/knowledge-bases");
      setKnowledgeBases(data.knowledge_bases || []);
    } catch (error) {
      console.error("Failed to fetch knowledge bases:", error);
    } finally {
      setLoading(false);
    }
  };

  // 获取单个知识库的处理进度
  const fetchKBProgress = useCallback(async (kbId: string) => {
    try {
      const data = await api.get(`/knowledge-bases/${kbId}/processing-progress`);
      if (data.processing_count > 0) {
        setProcessingProgress(prev => ({
          ...prev,
          [kbId]: data
        }));
      } else {
        // 没有处理中的文档，清除该 KB 的进度状态
        setProcessingProgress(prev => {
          const next = { ...prev };
          delete next[kbId];
          return next;
        });
      }
    } catch (error) {
      console.error(`Failed to fetch progress for KB ${kbId}:`, error);
    }
  }, []);

  // 轮询所有处理中的知识库进度
  const pollProcessingProgress = useCallback(async () => {
    const processingKBs = knowledgeBases.filter(kb => (kb.processing_count ?? 0) > 0);
    if (processingKBs.length === 0) return;

    // 并行获取所有处理中 KB 的进度
    await Promise.all(processingKBs.map(kb => fetchKBProgress(kb.id)));
  }, [knowledgeBases, fetchKBProgress]);

  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

  // 当知识库列表更新时，启动/停止轮询
  useEffect(() => {
    const hasProcessing = knowledgeBases.some(kb => (kb.processing_count ?? 0) > 0);

    if (hasProcessing && !pollingRef.current) {
      // 立即获取一次进度
      pollProcessingProgress();
      // 每3秒轮询一次
      pollingRef.current = setInterval(pollProcessingProgress, 3000);
    } else if (!hasProcessing && pollingRef.current) {
      // 没有处理中的 KB，停止轮询
      clearInterval(pollingRef.current);
      pollingRef.current = null;
      setProcessingProgress({});
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [knowledgeBases, pollProcessingProgress]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleOpenCreateModal = () => {
    setTransferMode("create");
    setSelectedKB(null);
    setTransferModalOpen(true);
  };

  const handleOpenUploadModal = (kb: KnowledgeBase) => {
    setTransferMode("upload");
    setSelectedKB(kb);
    setTransferModalOpen(true);
  };

  const handleDeleteKB = async (id: string) => {
    try {
      await api.delete(`/knowledge-bases/${id}`);
      setKnowledgeBases(knowledgeBases.filter((kb) => kb.id !== id));
      Toast.success("知识库已删除");
    } catch (error) {
      Toast.error("删除失败");
    }
  };

  const handleViewDocuments = (kb: KnowledgeBase) => {
    navigate(`/knowledge/${kb.id}/documents`);
  };

  const filteredKBs = knowledgeBases.filter(
    (kb) =>
      kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kb.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const paginatedData = filteredKBs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <Title heading={3} style={{ margin: 0 }}>
            知识库
          </Title>
          <Text type="tertiary">管理您的知识库和文档</Text>
        </div>
        <Button
          type="primary"
          icon={<IconPlus />}
          onClick={handleOpenCreateModal}
        >
          新建知识库
        </Button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <Input
          prefix={<IconSearch />}
          placeholder="搜索知识库..."
          value={searchQuery}
          onChange={setSearchQuery}
          showClear
          style={{ width: 300 }}
        />
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding: 24 }}>
          <Skeleton.Paragraph rows={5} />
        </div>
      ) : (
        <List
          dataSource={paginatedData}
          style={{ minHeight: 400 }}
          emptyContent={
            <Empty
              description={
                searchQuery ? "没有找到匹配的知识库" : "还没有创建任何知识库"
              }
            />
          }
          renderItem={(kb) => (
            <List.Item
              style={{
                padding: "16px 20px",
                cursor: "pointer",
                borderBottom: "1px solid var(--semi-color-border)",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  "var(--semi-color-fill-0)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
              onClick={() => handleViewDocuments(kb)}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  gap: 16,
                }}
              >
                {/* 图标 */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <IconUpload style={{ fontSize: 20, color: "#fff" }} />
                </div>

                {/* 主信息 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Text strong style={{ fontSize: 15 }}>
                      {kb.name}
                    </Text>
                  </div>
                  <Text
                    type="tertiary"
                    size="small"
                    style={{
                      display: "block",
                      marginTop: 4,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {kb.description || "暂无描述"}
                  </Text>
                </div>

                {/* 创建者 */}
                {kb.owner_name && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexShrink: 0,
                    }}
                  >
                    <Avatar
                      size="extra-small"
                      src={
                        kb.owner_avatar?.startsWith("http")
                          ? kb.owner_avatar
                          : undefined
                      }
                      style={{ backgroundColor: "var(--semi-color-primary)" }}
                    >
                      {!kb.owner_avatar &&
                        kb.owner_name?.slice(0, 1).toUpperCase()}
                    </Avatar>
                    <Text type="tertiary" size="small">
                      {kb.owner_name}
                    </Text>
                  </div>
                )}

                {/* 标签 */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <Tag size="small">{kb.embedding_model || "embedding"}</Tag>
                  <Tag
                    size="small"
                    color="blue"
                    prefixIcon={<IconFile style={{ fontSize: 10 }} />}
                  >
                    {kb.doc_count || 0} 文档
                  </Tag>
                  {(kb.processing_count ?? 0) > 0 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "2px 8px",
                        background: "var(--semi-color-warning-light-default)",
                        borderRadius: 4,
                      }}
                    >
                      <Spin size="small" />
                      <Progress
                        size="small"
                        percent={processingProgress[kb.id]?.overall_progress ?? 0}
                        style={{ width: 60 }}
                        stroke="var(--semi-color-warning)"
                        showInfo={false}
                      />
                      <Text size="small" style={{ minWidth: 36 }}>
                        {Math.round(processingProgress[kb.id]?.overall_progress ?? 0)}%
                      </Text>
                    </div>
                  )}
                </div>

                {/* 时间 */}
                <Text
                  type="tertiary"
                  size="small"
                  style={{ width: 100, textAlign: "right", flexShrink: 0 }}
                >
                  {new Date(kb.created_at || "").toLocaleDateString("zh-CN")}
                </Text>

                {/* 操作按钮 */}
                <div
                  style={{ display: "flex", gap: 4, flexShrink: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Tooltip content="管理文档">
                    <Button
                      type="tertiary"
                      icon={<IconEdit />}
                      size="small"
                      theme="borderless"
                      onClick={() => handleOpenUploadModal(kb)}
                    />
                  </Tooltip>
                  <Tooltip content="查看">
                    <Button
                      type="tertiary"
                      icon={<IconEyeOpened />}
                      size="small"
                      theme="borderless"
                      onClick={() => handleViewDocuments(kb)}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="确定删除？"
                    content="此操作不可撤销"
                    position="leftBottom"
                    onConfirm={() => handleDeleteKB(kb.id)}
                  >
                    <Button
                      type="tertiary"
                      icon={<IconDelete />}
                      size="small"
                      theme="borderless"
                      style={{ color: "var(--semi-color-danger)" }}
                    />
                  </Popconfirm>
                </div>
              </div>
            </List.Item>
          )}
        />
      )}

      {/* Pagination */}
      {filteredKBs.length > pageSize && (
        <div
          style={{ display: "flex", justifyContent: "center", marginTop: 24 }}
        >
          <Pagination
            total={filteredKBs.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onChange={setCurrentPage}
          />
        </div>
      )}

      <KnowledgeTransferModal
        visible={transferModalOpen}
        onCancel={() => setTransferModalOpen(false)}
        mode={transferMode}
        kbId={selectedKB?.id}
        kbName={selectedKB?.name}
        onSuccess={fetchKnowledgeBases}
      />
    </div>
  );
}

export default KnowledgePage;
