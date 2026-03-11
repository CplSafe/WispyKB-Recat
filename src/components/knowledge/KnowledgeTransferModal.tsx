import { useState, useEffect, useCallback } from "react";
import {
  Transfer,
  Button,
  Space,
  Typography,
  Upload,
  Toast,
  Input,
  TextArea,
  Select,
  Spin,
  Tag,
  Progress,
  Tabs,
  Banner,
  Sidebar,
  Form,
} from "@douyinfe/semi-ui";
import {
  IconCloud,
  IconFile,
  IconDelete,
  IconPlus,
  IconServer,
  IconGlobe,
  IconLink,
  IconArchive,
} from "@douyinfe/semi-icons";
import api from "../../lib/api";

const { Text, Title } = Typography;

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
  visible: boolean;
  onCancel: () => void;
  mode: "create" | "upload";
  kbId?: string;
  kbName?: string;
  onSuccess?: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8888";

export default function KnowledgeTransferModal({
  visible,
  onCancel,
  mode,
  kbId,
  kbName: propKbName,
  onSuccess,
}: KnowledgeTransferModalProps) {
  // 表单状态
  const [formKbName, setFormKbName] = useState("");
  const [formKbDesc, setFormKbDesc] = useState("");
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
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );

  // 应用列表
  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

  // 同步状态
  const [syncTab, setSyncTab] = useState<"file" | "web" | "feishu">("file");
  const [webUrl, setWebUrl] = useState("");
  const [syncingWeb, setSyncingWeb] = useState(false);
  const [feishuSpaceId, setFeishuSpaceId] = useState("");
  const [feishuNodeToken, setFeishuNodeToken] = useState("");
  const [syncingFeishu, setSyncingFeishu] = useState(false);
  const [feishuConfigured, setFeishuConfigured] = useState(false);

  // 获取文档池文档
  const fetchPoolDocuments = useCallback(async () => {
    setPoolLoading(true);
    try {
      const data = await api.get("/documents/pool");
      setPoolDocuments(data.documents || []);
    } catch (error) {
      console.error("Failed to fetch pool documents:", error);
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
      setTargetKeys((data.documents || []).map((d: Document) => d.id));
    } catch (error) {
      console.error("Failed to fetch KB documents:", error);
    } finally {
      setKbDocsLoading(false);
    }
  }, [kbId]);

  // 获取应用列表
  const fetchApplications = useCallback(async () => {
    setAppsLoading(true);
    try {
      const data = await api.get("/applications");
      setApplications(data.applications || []);
    } catch (error) {
      console.error("Failed to fetch applications:", error);
    } finally {
      setAppsLoading(false);
    }
  }, []);

  // 获取飞书配置
  const fetchFeishuConfig = useCallback(async () => {
    try {
      const data = await api.get("/integrations/feishu/config");
      setFeishuConfigured(!!data.feishu_app_id);
    } catch (error) {
      console.error("Failed to fetch Feishu config:", error);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      fetchPoolDocuments();
      fetchFeishuConfig();
      if (mode === "upload") {
        fetchKbDocuments();
      } else {
        fetchApplications();
      }
    }
  }, [
    visible,
    mode,
    fetchPoolDocuments,
    fetchKbDocuments,
    fetchApplications,
    fetchFeishuConfig,
  ]);

  // 上传文档到池
  const handleUploadToPool = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress((prev) => ({ ...prev, [file.name]: progress }));
        }
      });

      await new Promise((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            resolve(xhr.response);
          } else {
            reject(new Error("Upload failed"));
          }
        });
        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.open("POST", `${API_URL}/api/v1/documents/pool/upload`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.send(formData);
      });

      Toast.success(`${file.name} 上传成功`);
      await fetchPoolDocuments();
    } catch (error) {
      Toast.error(`${file.name} 上传失败`);
    } finally {
      setUploading(false);
      setUploadProgress((prev) => {
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
      Toast.success("文档已删除");
      await fetchPoolDocuments();
    } catch (error) {
      Toast.error("删除失败");
    }
  };

  // 网页同步
  const handleWebSync = async () => {
    if (!webUrl.trim()) {
      Toast.warning("请输入网页URL");
      return;
    }

    setSyncingWeb(true);
    try {
      if (mode === "upload" && kbId) {
        const data = await api.post(`/knowledge-bases/${kbId}/sync/web`, {
          url: webUrl,
        });
        Toast.success(`网页同步成功，已抓取 ${data.word_count || 0} 个字符`);
        setWebUrl("");
        await fetchKbDocuments();
        await fetchPoolDocuments();
      } else {
        Toast.info('请先创建知识库，然后使用"管理文档"功能同步网页内容');
      }
    } catch (error) {
      Toast.error(typeof error === "string" ? error : "网页同步失败");
    } finally {
      setSyncingWeb(false);
    }
  };

  // 飞书知识库同步
  const handleFeishuSync = async () => {
    if (!feishuConfigured) {
      Toast.warning("请先在系统设置中配置飞书 App ID 和 App Secret");
      return;
    }

    if (!feishuSpaceId.trim() && !feishuNodeToken.trim()) {
      Toast.warning("请输入飞书知识库 ID 或文档 Token");
      return;
    }

    setSyncingFeishu(true);
    try {
      const data = await api.post("/integrations/feishu/sync", {
        space_id: feishuSpaceId || undefined,
        node_token: feishuNodeToken || undefined,
        kb_id: mode === "upload" ? kbId : undefined,
      });
      Toast.success(`飞书同步成功，已同步 ${data.documents_count || 0} 个文档`);
      setFeishuSpaceId("");
      setFeishuNodeToken("");
      await fetchPoolDocuments();
      if (mode === "upload") {
        await fetchKbDocuments();
      }
    } catch (error) {
      Toast.error(typeof error === "string" ? error : "飞书同步失败");
    } finally {
      setSyncingFeishu(false);
    }
  };

  // 提交创建或更新
  const handleSubmit = async () => {
    if (mode === "create") {
      if (!formKbName.trim()) {
        Toast.warning("请输入知识库名称");
        return;
      }

      setSubmitting(true);
      try {
        const kbData = await api.post("/knowledge-bases", {
          name: formKbName,
          description: formKbDesc,
        });
        const newKbId = kbData.id;

        if (selectedApps.length > 0) {
          for (const appId of selectedApps) {
            const appData = await api.get(`/applications/${appId}`);
            const existingKbIds = appData.knowledge_base_ids || [];
            const updatedKbIds = [...new Set([...existingKbIds, newKbId])];

            await api.put(`/applications/${appId}`, {
              name: appData.name,
              description: appData.description || "",
              model: appData.model,
              knowledge_base_ids: updatedKbIds,
              is_public: appData.is_public ?? false,
              system_prompt: appData.system_prompt || "",
              welcome_message: appData.welcome_message || "",
              share_password: appData.share_password || "",
              temperature: appData.temperature ?? 0.7,
              max_tokens: appData.max_tokens ?? 2048,
            });
          }
        }

        if (targetKeys.length > 0) {
          await api.post("/documents/assign", {
            doc_ids: targetKeys,
            kb_id: newKbId,
          });
        }

        Toast.success("知识库创建成功");
        handleCancel();
        onSuccess?.();
      } catch (error) {
        Toast.error(typeof error === "string" ? error : "创建失败");
      } finally {
        setSubmitting(false);
      }
    } else {
      setSubmitting(true);
      try {
        const currentKbDocIds = kbDocuments.map((d) => d.id);
        const toAssign = targetKeys.filter(
          (id) => !currentKbDocIds.includes(id),
        );
        const toUnassign = currentKbDocIds.filter(
          (id) => !targetKeys.includes(id),
        );

        if (toAssign.length > 0) {
          await api.post("/documents/assign", {
            doc_ids: toAssign,
            kb_id: kbId,
          });
        }

        if (toUnassign.length > 0) {
          await api.post("/documents/unassign", {
            doc_ids: toUnassign,
          });
        }

        Toast.success("文档更新成功");
        handleCancel();
        onSuccess?.();
      } catch (error) {
        Toast.error(typeof error === "string" ? error : "更新失败");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleCancel = () => {
    setFormKbName("");
    setFormKbDesc("");
    setSelectedApps([]);
    setTargetKeys([]);
    setWebUrl("");
    setFeishuSpaceId("");
    setFeishuNodeToken("");
    setSyncTab("file");
    onCancel();
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // 合并文档池和当前知识库文档
  const allDocuments = [...poolDocuments, ...kbDocuments];
  const dataSource = allDocuments.map((doc) => ({
    key: doc.id,
    label: doc.name,
    value: doc.id,
    ...doc,
  }));

  // 穿梭框渲染项
  const renderTransferItem = (item: any) => {
    const inPool = poolDocuments.some((d) => d.id === item.key);
    const inKb = kbDocuments.some((d) => d.id === item.key);

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 12px",
        }}
      >
        <Space spacing={8}>
          <IconFile style={{ color: "var(--semi-color-text-2)" }} />
          <div>
            <Text>{item.name}</Text>
            <Text type="tertiary" size="small" style={{ display: "block" }}>
              {formatFileSize(item.size)} &bull; {item.type.toUpperCase()}
            </Text>
          </div>
          {inKb && (
            <Tag color="blue" size="small">
              已分配
            </Tag>
          )}
        </Space>
        {inPool && (
          <Button
            type="tertiary"
            theme="borderless"
            size="small"
            icon={<IconDelete />}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item.key);
            }}
          />
        )}
      </div>
    );
  };

  const tabList = [
    {
      itemKey: "file",
      tab: (
        <span>
          <IconCloud /> 本地文件
        </span>
      ),
    },
    {
      itemKey: "web",
      tab: (
        <span>
          <IconGlobe /> 网页同步
        </span>
      ),
    },
    {
      itemKey: "feishu",
      tab: (
        <span>
          <IconServer /> 飞书知识库
        </span>
      ),
    },
  ];

  return (
    <Sidebar.Container
      visible={visible}
      title={mode === "create" ? "新建知识库" : `管理文档 - ${propKbName}`}
      onCancel={handleCancel}
      defaultSize={{ width: 560 }}
    >
      <div style={{ padding: "20px 0", overflowY: "auto", height: "100%" }}>
        <Space vertical spacing={24} style={{ width: "100%" }}>
          {/* 创建模式：表单字段 */}
          {mode === "create" && (
            <Form layout="vertical" style={{ width: "100%" }}>
              <Form.Input
                field="name"
                label="知识库名称"
                required
                placeholder="例如：产品文档、技术资料"
                value={formKbName}
                onChange={(value) => setFormKbName(value)}
                style={{ marginBottom: 16 }}
              />
              <Form.TextArea
                field="description"
                label="描述"
                placeholder="简要描述这个知识库的用途..."
                rows={2}
                value={formKbDesc}
                onChange={(value) => setFormKbDesc(value as string)}
                style={{ marginBottom: 16 }}
              />
              <Form.Select
                field="apps"
                label="关联应用"
                placeholder="选择要关联的应用（可选）"
                multiple
                value={selectedApps}
                onChange={(value) => setSelectedApps(value as string[])}
                optionList={applications.map((app) => ({
                  label: app.name,
                  value: app.id,
                }))}
                filter
                loading={appsLoading}
                style={{ marginBottom: 0 }}
              />
            </Form>
          )}

          {/* 文档导入区域 */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 12,
                gap: 8,
              }}
            >
              <IconCloud style={{ color: "var(--semi-color-text-2)" }} />
              <Text strong>添加文档</Text>
            </div>
            <Tabs
              activeKey={syncTab}
              onChange={(key) => setSyncTab(key as "file" | "web" | "feishu")}
              tabList={tabList}
              size="small"
            >
              {syncTab === "file" && (
                <div style={{ paddingTop: 12 }}>
                  <Upload
                    draggable
                    multiple
                    accept=".txt,.md,.pdf,.docx,.html,.xlsx,.csv,.json,.xml"
                    beforeUpload={({ file }) => {
                      handleUploadToPool(file.fileInstance as File);
                      return false;
                    }}
                    disabled={uploading}
                    showUploadList={false}
                    dragMainText="点击或拖拽文件到此处上传"
                    dragSubText="支持 TXT, MD, PDF, DOCX, HTML, XLSX, CSV, JSON, XML"
                    style={{
                      padding: "20px",
                      background: "var(--semi-color-bg-1)",
                      borderColor: "var(--semi-color-border)",
                      borderRadius: 8,
                    }}
                  />

                  {/* 上传进度 */}
                  {Object.keys(uploadProgress).length > 0 && (
                    <Space
                      vertical
                      spacing={8}
                      style={{ width: "100%", marginTop: 12 }}
                    >
                      {Object.entries(uploadProgress).map(
                        ([fileName, progress]) => (
                          <div key={fileName}>
                            <Text size="small">{fileName}</Text>
                            <Progress
                              percent={progress}
                              size="small"
                              style={{ marginTop: 4 }}
                            />
                          </div>
                        ),
                      )}
                    </Space>
                  )}
                </div>
              )}

              {syncTab === "web" && (
                <div style={{ paddingTop: 12 }}>
                  <Space vertical spacing={12} style={{ width: "100%" }}>
                    <Input
                      placeholder="https://example.com/article"
                      value={webUrl}
                      onChange={(value) => setWebUrl(value)}
                      prefix={<IconLink />}
                      disabled={syncingWeb}
                    />
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <Button
                        type="primary"
                        theme="solid"
                        onClick={handleWebSync}
                        loading={syncingWeb}
                        disabled={!webUrl.trim()}
                        icon={<IconGlobe />}
                      >
                        同步网页
                      </Button>
                      <Text type="tertiary" size="small">
                        抓取公开网页内容
                      </Text>
                    </div>
                  </Space>
                </div>
              )}

              {syncTab === "feishu" && (
                <div style={{ paddingTop: 12 }}>
                  <Space vertical spacing={12} style={{ width: "100%" }}>
                    {!feishuConfigured && (
                      <Banner
                        type="warning"
                        description="请先在系统设置中配置飞书 App ID 和 App Secret"
                      />
                    )}
                    <Input
                      placeholder="飞书知识库 ID (space_id)"
                      value={feishuSpaceId}
                      onChange={(value) => setFeishuSpaceId(value)}
                      disabled={syncingFeishu}
                    />
                    <Input
                      placeholder="飞书文档 Token (node_token)"
                      value={feishuNodeToken}
                      onChange={(value) => setFeishuNodeToken(value)}
                      disabled={syncingFeishu}
                    />
                    <Button
                      type="primary"
                      theme="solid"
                      onClick={handleFeishuSync}
                      loading={syncingFeishu}
                      disabled={
                        !feishuConfigured ||
                        (!feishuSpaceId.trim() && !feishuNodeToken.trim())
                      }
                      icon={<IconServer />}
                    >
                      同步飞书文档
                    </Button>
                  </Space>
                </div>
              )}
            </Tabs>
          </div>

          {/* 穿梭框 */}
          {poolLoading || kbDocsLoading ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <Spin size="large" />
            </div>
          ) : (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 12,
                  gap: 8,
                }}
              >
                <IconArchive style={{ color: "var(--semi-color-text-2)" }} />
                <Text strong>分配文档</Text>
                <Text type="tertiary" size="small">
                  （已选 {targetKeys.length} 个）
                </Text>
              </div>
              <Transfer
                dataSource={dataSource}
                targetKeys={targetKeys}
                onChange={setTargetKeys}
                render={renderTransferItem}
                titles={[
                  `文档池 (${poolDocuments.length})`,
                  mode === "create"
                    ? `待分配 (${targetKeys.length})`
                    : `${propKbName} (${targetKeys.length})`,
                ]}
                style={{ width: "100%", height: 240 }}
                filterable
                filter={(inputValue, item) =>
                  item.name?.toLowerCase().includes(inputValue.toLowerCase()) ||
                  item.type?.toLowerCase().includes(inputValue.toLowerCase())
                }
              />
            </div>
          )}

          {/* 统计信息 */}
          <div
            style={{
              padding: "12px 16px",
              background: "var(--semi-color-bg-1)",
              borderRadius: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Space spacing={20}>
              <Text size="small" type="tertiary">
                文档池 <Text strong>{poolDocuments.length}</Text> 个
              </Text>
              {mode === "upload" && (
                <Text size="small" type="tertiary">
                  知识库 <Text strong>{kbDocuments.length}</Text> 个
                </Text>
              )}
              <Text size="small" type="tertiary">
                已选 <Text strong>{targetKeys.length}</Text> 个
              </Text>
            </Space>
          </div>

          {/* 操作按钮 */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              paddingTop: 8,
            }}
          >
            <Button size="large" onClick={handleCancel} disabled={submitting}>
              取消
            </Button>
            <Button
              size="large"
              type="primary"
              theme="solid"
              onClick={handleSubmit}
              loading={submitting}
              disabled={mode === "create" ? !formKbName.trim() : false}
              icon={mode === "create" ? <IconPlus /> : <IconArchive />}
            >
              {mode === "create" ? "创建知识库" : "保存更改"}
            </Button>
          </div>
        </Space>
      </div>
    </Sidebar.Container>
  );
}
