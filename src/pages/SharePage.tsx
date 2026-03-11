import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useParams } from "react-router-dom";
import {
  Layout,
  Button,
  Toast,
  SideSheet,
  TextArea,
  Modal,
  Checkbox,
} from "@douyinfe/semi-ui";
import { AIChatDialogue, AIChatInput } from "@douyinfe/semi-ui";
import type { MessageContent } from "@douyinfe/semi-ui/lib/es/aiChatInput";
import { IconPlus, IconDelete, IconMenu } from "@douyinfe/semi-icons";
import { copyToClipboard } from "../lib/clipboard";
import styles from "./SharePage.module.css";

const { Sider, Header, Content } = Layout;

// ===== Types =====
type MessageStatus =
  | "queued"
  | "in_progress"
  | "incomplete"
  | "completed"
  | "failed"
  | "cancelled";

interface Message {
  id: string;
  role: "user" | "assistant";
  content?: string;
  created_at: string;
  status?: MessageStatus;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
  summary?: string;
  isContinuation?: boolean;
  parentConversationId?: string;
}

interface AppInfo {
  id: string;
  name: string;
  description: string;
  logo?: string;
  welcome_message?: string;
}

interface SystemConfig {
  site_name: string;
  site_title: string;
  logo?: string;
  favicon?: string;
  primary_color?: string;
  theme?: string;
}

// Extract plain text from AIChatInput's MessageContent.
// inputContents: Content[] where Content = { type: string, [key]: any }
// Text nodes have type === "text" and carry a `text` property.
function extractTextFromSendProps(props: MessageContent): string {
  if (!props) return "";
  const { inputContents } = props;
  if (Array.isArray(inputContents)) {
    return inputContents
      .filter((item) => item?.type === "text")
      .map((item) => (item?.text as string) ?? "")
      .join("")
      .trim();
  }
  return "";
}

// ===== Main Component =====
function SharePage() {
  const params = useParams();
  const shareId = (params?.id as string) || "";

  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showAgreementModal, setShowAgreementModal] = useState(true);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);

  // Feedback states
  const [feedbackDrawer, setFeedbackDrawer] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );

  const streamingContentRef = useRef<Record<string, string>>({});

  const API_URL = import.meta.env.VITE_API_URL || "";
  const MAX_MESSAGES_PER_CONVERSATION = 20;
  const MAX_CONTEXT_TOKENS = 4000;
  const CONTEXT_SUMMARY_PROMPT =
    "请简要总结上述对话的核心内容，包括用户提出的主要问题和获得的关键答案。";

  // ===== Check agreement on mount =====
  useEffect(() => {
    const agreed = localStorage.getItem("share_page_agreement_accepted");
    if (agreed === "true") {
      setHasAgreed(true);
      setShowAgreementModal(false);
    }
  }, []);

  // ===== Mobile detection =====
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ===== Current messages =====
  const currentMessages = useMemo(
    () =>
      currentConversationId
        ? conversations.find((c) => c.id === currentConversationId)?.messages ||
          []
        : [],
    [currentConversationId, conversations],
  );

  // ===== Convert to AIChatDialogue format =====
  const chatMessages = useMemo(() => {
    const msgs = currentMessages.map((msg) => {
      const base: Record<string, any> = {
        role: msg.role,
        id: msg.id,
        createAt: new Date(msg.created_at).getTime(),
        status: msg.status ?? "completed",
      };
      // Only omit content when in_progress AND no content yet (pure loading state)
      // Once streaming starts, content should be passed to show partial response
      if (msg.content) {
        base.content = msg.content;
      }
      return base;
    });

    // Always prepend welcome message when configured
    if (appInfo?.welcome_message) {
      return [
        {
          role: "assistant" as const,
          id: "welcome",
          content: appInfo.welcome_message,
          createAt: 0,
          status: "completed" as MessageStatus,
        },
        ...msgs,
      ];
    }
    return msgs;
  }, [currentMessages, appInfo?.welcome_message]);

  // ===== Role config =====
  const roleConfig = useMemo(
    () => ({
      user: { name: "我", avatar: "" },
      assistant: {
        name: appInfo?.name || "智能助手",
        avatar: systemConfig?.logo || "",
      },
    }),
    [appInfo?.name, systemConfig?.logo],
  );

  // ===== Hints =====
  // Always pass an array (never undefined) to avoid AIChatDialogue internal crash
  // when cacheHints prevState is undefined and hints prop changes
  const hints = useMemo(
    () =>
      currentMessages.length === 0
        ? ["你能做什么？", "帮我介绍一下你自己", "我该如何使用你？"]
        : [],
    [currentMessages.length],
  );

  // ===== Save to localStorage =====
  const saveConversations = useCallback(
    (convs: Conversation[]) => {
      try {
        localStorage.setItem(
          `share_conversations_${shareId}`,
          JSON.stringify(convs.slice(0, 20)),
        );
      } catch (e) {
        console.error("Failed to save conversations:", e);
      }
    },
    [shareId],
  );

  // ===== Load data =====
  useEffect(() => {
    const load = async () => {
      try {
        setIsInitialLoading(true);

        const configRes = await fetch(`${API_URL}/api/v1/system/config`);
        if (configRes.ok) setSystemConfig(await configRes.json());

        const isWorkflow = shareId.startsWith("workflow_");
        const workflowId = isWorkflow
          ? shareId.slice("workflow_".length)
          : null;
        const appApiUrl = isWorkflow
          ? `${API_URL}/api/v1/share/workflow/${workflowId}`
          : `${API_URL}/api/v1/share/${shareId}`;

        const appRes = await fetch(appApiUrl);
        if (!appRes.ok) throw new Error("分享链接无效或已过期");
        setAppInfo(await appRes.json());
      } catch (err: any) {
        setError(err.message || "加载失败");
      } finally {
        setIsInitialLoading(false);
      }
    };
    load();
  }, [shareId, API_URL]);

  // ===== Load conversations from localStorage =====
  useEffect(() => {
    if (!shareId) return;
    try {
      const stored = localStorage.getItem(`share_conversations_${shareId}`);
      if (stored) {
        const convs = JSON.parse(stored) as Conversation[];
        // Fix any in_progress messages left from interrupted streams
        const fixed = convs.map((c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.status === "in_progress" ||
            m.status === "queued" ||
            m.status === "incomplete"
              ? { ...m, status: "completed" as MessageStatus }
              : m,
          ),
        }));
        setConversations(fixed);
        if (fixed.length > 0) setCurrentConversationId(fixed[0].id);
      }
    } catch (e) {
      console.error("Failed to load conversations:", e);
    }
  }, [shareId]);

  // ===== Conversation management =====
  const createNewConversation = useCallback(() => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: "新对话",
      messages: [],
      created_at: new Date().toISOString(),
    };
    setConversations((prev) => {
      const updated = [newConv, ...prev];
      saveConversations(updated);
      return updated;
    });
    setCurrentConversationId(newConv.id);
    if (isMobile) setSidebarVisible(false);
  }, [saveConversations, isMobile]);

  const deleteConversation = useCallback(
    (convId: string) => {
      setConversations((prev) => {
        const updated = prev.filter((c) => c.id !== convId);
        saveConversations(updated);
        if (currentConversationId === convId) {
          setCurrentConversationId(updated.length > 0 ? updated[0].id : null);
        }
        return updated;
      });
    },
    [currentConversationId, saveConversations],
  );

  const switchConversation = useCallback(
    (convId: string) => {
      setCurrentConversationId(convId);
      if (isMobile) setSidebarVisible(false);
    },
    [isMobile],
  );

  const addMessageToConversation = useCallback(
    (convId: string, message: Message, skipSave = false) => {
      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c.id !== convId) return c;
          const newMessages = [...c.messages, message];
          const msgContent = message.content || "";
          const newTitle =
            c.messages.length === 0 && message.role === "user"
              ? msgContent.slice(0, 20) + (msgContent.length > 20 ? "..." : "")
              : c.title;
          return { ...c, messages: newMessages, title: newTitle };
        });
        if (!skipSave) saveConversations(updated);
        return updated;
      });
    },
    [saveConversations],
  );

  // ===== Context management =====
  const estimateTokens = useCallback((text: string) => {
    const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    return Math.ceil(chinese / 1.5 + (text.length - chinese) / 4);
  }, []);

  const calculateContextTokens = useCallback(
    (messages: Message[]) =>
      messages.reduce((sum, m) => sum + estimateTokens(m.content || ""), 0),
    [estimateTokens],
  );

  const shouldCreateNewConversation = useCallback(
    (conv: Conversation) =>
      conv.messages.length >= MAX_MESSAGES_PER_CONVERSATION ||
      calculateContextTokens(conv.messages) >= MAX_CONTEXT_TOKENS,
    [calculateContextTokens],
  );

  const generateConversationSummary = useCallback(
    async (messages: Message[]) => {
      try {
        const text = messages
          .slice(-10)
          .map(
            (m) => `${m.role === "user" ? "用户" : "助手"}: ${m.content || ""}`,
          )
          .join("\n");
        const res = await fetch(`${API_URL}/api/v1/share/${shareId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: CONTEXT_SUMMARY_PROMPT + "\n\n" + text,
            context: [],
            stream: false,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          return data.content || data.answer || "对话内容已总结";
        }
      } catch (e) {
        console.error(e);
      }
      return "用户进行了多轮对话";
    },
    [shareId, API_URL],
  );

  // ===== Feedback =====
  const submitFeedback = useCallback(() => {
    if (!selectedMessageId) return;
    fetch(`${API_URL}/api/v1/share/${shareId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message_id: selectedMessageId,
        feedback_type: "feedback",
        comment: feedbackComment,
      }),
    })
      .then(() => {
        Toast.success("感谢反馈");
        setFeedbackDrawer(false);
        setFeedbackComment("");
        setSelectedMessageId(null);
      })
      .catch(() => Toast.error("提交失败"));
  }, [shareId, selectedMessageId, feedbackComment, API_URL]);

  // ===== Send message =====
  const handleMessageSend = useCallback(
    async (content: string) => {
      if (!content?.trim() || isLoading) return;

      const currentConv = currentConversationId
        ? conversations.find((c) => c.id === currentConversationId)
        : null;

      let targetConvId = currentConversationId;
      let historyMessages = currentConv?.messages || [];
      let contextSummary = currentConv?.summary;

      // Check if need new conversation due to context length
      if (currentConv && shouldCreateNewConversation(currentConv)) {
        const summary = await generateConversationSummary(currentConv.messages);
        contextSummary = summary;
        const newConv: Conversation = {
          id: Date.now().toString(),
          title: currentConv.title + " (续)",
          messages: [],
          created_at: new Date().toISOString(),
          summary,
          isContinuation: true,
          parentConversationId: currentConv.id,
        };
        setConversations((prev) => {
          const updated = [newConv, ...prev];
          saveConversations(updated);
          return updated;
        });
        setCurrentConversationId(newConv.id);
        targetConvId = newConv.id;
        historyMessages = [];
      }

      setIsLoading(true);

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        created_at: new Date().toISOString(),
        status: "completed",
      };

      // Create conversation if none
      if (!targetConvId) {
        const newConv: Conversation = {
          id: Date.now().toString(),
          title: content.length > 20 ? content.slice(0, 20) + "..." : content,
          messages: [userMessage],
          created_at: new Date().toISOString(),
        };
        setConversations((prev) => {
          const updated = [newConv, ...prev];
          saveConversations(updated);
          return updated;
        });
        setCurrentConversationId(newConv.id);
        targetConvId = newConv.id;
      } else {
        addMessageToConversation(targetConvId, userMessage);
      }

      const assistantId = (Date.now() + 1).toString();
      let assistantContent = "";
      let hasContent = false;
      let buffer = "";
      let updateScheduled = false;
      streamingContentRef.current[assistantId] = "";

      // in_progress: no content — AIChatDialogue shows loading indicator
      const loadingMsg: Message = {
        id: assistantId,
        role: "assistant",
        status: "in_progress",
        created_at: new Date().toISOString(),
      };

      // Add loading message immediately so user sees the loading indicator
      // while waiting for the backend (embedding/retrieval can take time)
      addMessageToConversation(targetConvId!, loadingMsg, true);

      try {
        const isWorkflow = shareId.startsWith("workflow_");
        const workflowId = isWorkflow
          ? shareId.slice("workflow_".length)
          : null;
        const chatApiUrl = isWorkflow
          ? `${API_URL}/api/v1/share/workflow/${workflowId}/chat`
          : `${API_URL}/api/v1/share/${shareId}/chat`;

        // Build context
        let contextForApi: { role: string; content: string }[] = [];
        if (contextSummary) {
          contextForApi.push({
            role: "system",
            content: `【上下文摘要】${contextSummary}`,
          });
        }
        contextForApi = contextForApi.concat(
          historyMessages
            .slice(-6)
            .filter((m) => m.content)
            .map((m) => ({ role: m.role, content: m.content! })),
        );

        const response = await fetch(chatApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isWorkflow
              ? { message: content }
              : { message: content, context: contextForApi, new_topic: false },
          ),
        });

        if (!response.ok) throw new Error("发送失败");

        const scheduleUpdate = () => {
          if (updateScheduled) return;
          updateScheduled = true;
          requestAnimationFrame(() => {
            setConversations((prev) =>
              prev.map((c) => {
                if (c.id !== targetConvId) return c;
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          content:
                            streamingContentRef.current[assistantId] || "",
                          status: "in_progress" as const,
                        }
                      : m,
                  ),
                };
              }),
            );
            updateScheduled = false;
          });
        };

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";
              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const data = line.slice(6).trim();
                if (!data || data === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    assistantContent += parsed.content;
                    streamingContentRef.current[assistantId] = assistantContent;
                    hasContent = true;
                    scheduleUpdate();
                  }
                } catch (e) {
                  /* ignore parse errors */
                }
              }
            }
            // Handle remaining buffer
            if (buffer.trim()) {
              for (const line of buffer.split("\n")) {
                if (!line.startsWith("data: ")) continue;
                const data = line.slice(6).trim();
                if (!data || data === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    assistantContent += parsed.content;
                    streamingContentRef.current[assistantId] = assistantContent;
                    hasContent = true;
                  }
                } catch (e) {
                  /* ignore */
                }
              }
            }
            // Final update
            if (hasContent) {
              setConversations((prev) => {
                const updated = prev.map((c) => {
                  if (c.id !== targetConvId) return c;
                  return {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantId
                        ? {
                            ...m,
                            content: assistantContent,
                            status: "completed" as const,
                          }
                        : m,
                    ),
                  };
                });
                saveConversations(updated);
                return updated;
              });
            }
          } catch (readErr: any) {
            if (hasContent) {
              // Stream closed after receiving content — still need to finalize
              // the message status to 'completed' so action buttons appear
              setConversations((prev) => {
                const updated = prev.map((c) => {
                  if (c.id !== targetConvId) return c;
                  return {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantId
                        ? {
                            ...m,
                            content: assistantContent,
                            status: "completed" as const,
                          }
                        : m,
                    ),
                  };
                });
                saveConversations(updated);
                return updated;
              });
              return;
            }
            throw readErr;
          }
        }
      } catch (err: any) {
        if (!hasContent) {
          Toast.error(err.message || "发送失败");
          setConversations((prev) => {
            const updated = prev.map((c) => {
              if (c.id !== targetConvId) return c;
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        content: "发送失败，请重试",
                        status: "failed" as const,
                      }
                    : m,
                ),
              };
            });
            saveConversations(updated);
            return updated;
          });
        }
      } finally {
        delete streamingContentRef.current[assistantId];
        setIsLoading(false);
      }
    },
    [
      isLoading,
      currentConversationId,
      conversations,
      shareId,
      API_URL,
      addMessageToConversation,
      saveConversations,
      shouldCreateNewConversation,
      generateConversationSummary,
    ],
  );

  // ===== AIChatInput onMessageSend handler =====
  const handleAIChatInputSend = useCallback(
    (sendProps: MessageContent) => {
      const text = extractTextFromSendProps(sendProps);
      if (text) handleMessageSend(text);
    },
    [handleMessageSend],
  );

  // ===== Loading / Error states =====
  if (isInitialLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>!</div>
        <p>{error}</p>
      </div>
    );
  }

  // ===== Sidebar content =====
  const sidebarContent = (
    <div className={styles.sidebarContent}>
      <div className={styles.sidebarHeader}>
        {systemConfig?.logo ? (
          <img src={systemConfig.logo} alt="" className={styles.sidebarLogo} />
        ) : (
          <div className={styles.sidebarLogoPlaceholder}>
            {(appInfo?.name || "A")[0]}
          </div>
        )}
        <span className={styles.sidebarTitle}>
          {appInfo?.name || "智能助手"}
        </span>
      </div>

      <div className={styles.sidebarNewChat}>
        <Button
          block
          theme="solid"
          icon={<IconPlus />}
          onClick={createNewConversation}
        >
          新对话
        </Button>
      </div>

      <div className={styles.conversationsList}>
        {conversations.length === 0 ? (
          <div className={styles.emptyConversations}>
            <p>暂无对话记录</p>
            <p>点击上方按钮开始</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={`${styles.conversationItem} ${currentConversationId === conv.id ? styles.active : ""}`}
              onClick={() => switchConversation(conv.id)}
            >
              <div className={styles.conversationTitle}>{conv.title}</div>
              <div className={styles.conversationTime}>
                {new Date(conv.created_at).toLocaleDateString("zh-CN", {
                  month: "numeric",
                  day: "numeric",
                })}
              </div>
              <Button
                className={styles.deleteBtn}
                size="small"
                type="tertiary"
                icon={<IconDelete />}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      <Layout className={styles.container}>
        {/* PC 侧边栏 */}
        {!isMobile && (
          <Sider className={styles.sidebar}>{sidebarContent}</Sider>
        )}

        {/* 移动端侧边栏：用 SideSheet */}
        {isMobile && (
          <SideSheet
            title={null}
            visible={sidebarVisible}
            onCancel={() => setSidebarVisible(false)}
            placement="left"
            width={280}
            bodyStyle={{ padding: 0 }}
            headerStyle={{ display: "none" }}
          >
            {sidebarContent}
          </SideSheet>
        )}

        <Layout className={styles.main}>
          {/* Header */}
          <Header className={styles.header}>
            {isMobile && (
              <Button
                type="tertiary"
                icon={<IconMenu />}
                onClick={() => setSidebarVisible(true)}
              />
            )}
            <span className={styles.headerTitle}>
              {appInfo?.name || "智能助手"}
            </span>
            <Button
              type="tertiary"
              icon={<IconPlus />}
              onClick={createNewConversation}
            >
              {!isMobile && "新对话"}
            </Button>
          </Header>

          {/* Chat area */}
          <Content className={styles.chatContent}>
            <AIChatDialogue
              style={{ flex: 1, overflow: "hidden" }}
              chats={chatMessages as any}
              roleConfig={roleConfig}
              hints={hints}
              onHintClick={(hint) => handleMessageSend(hint)}
              align="leftRight"
              mode="bubble"
              markdownRenderProps={{
                // 启用 Markdown 渲染
                components: {
                  h3: ({ children }: any) => (
                    <h3
                      style={{
                        marginTop: "16px",
                        marginBottom: "8px",
                        fontSize: "16px",
                        fontWeight: 600,
                      }}
                    >
                      {children}
                    </h3>
                  ),
                  p: ({ children }: any) => (
                    <p style={{ marginBottom: "12px", lineHeight: "1.6" }}>
                      {children}
                    </p>
                  ),
                  ul: ({ children }: any) => (
                    <ul
                      style={{
                        marginLeft: "20px",
                        marginBottom: "12px",
                        lineHeight: "1.8",
                      }}
                    >
                      {children}
                    </ul>
                  ),
                  ol: ({ children }: any) => (
                    <ol
                      style={{
                        marginLeft: "20px",
                        marginBottom: "12px",
                        lineHeight: "1.8",
                      }}
                    >
                      {children}
                    </ol>
                  ),
                  strong: ({ children }: any) => (
                    <strong
                      style={{
                        fontWeight: 600,
                        color: "var(--semi-color-text-0)",
                      }}
                    >
                      {children}
                    </strong>
                  ),
                  hr: () => (
                    <hr
                      style={{
                        margin: "16px 0",
                        border: "none",
                        borderTop: "1px solid var(--semi-color-border)",
                      }}
                    />
                  ),
                },
              }}
              onMessageGoodFeedback={(msg: any) => {
                fetch(`${API_URL}/api/v1/share/${shareId}/feedback`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    message_id: msg.id,
                    feedback_type: "like",
                  }),
                }).catch(() => {});
                Toast.success("已点赞");
              }}
              onMessageBadFeedback={(msg: any) => {
                setSelectedMessageId(msg.id);
                setFeedbackDrawer(true);
              }}
              onMessageCopy={(msg: any) => {
                const text = typeof msg.content === "string" ? msg.content : "";
                copyToClipboard(text)
                  .then(() => Toast.success("已复制"))
                  .catch(() => Toast.error("复制失败"));
              }}
            />
            <AIChatInput
              generating={isLoading}
              onMessageSend={handleAIChatInputSend}
              onStopGenerate={() => setIsLoading(false)}
              placeholder={
                hasAgreed
                  ? "输入您的问题，按 Enter 发送..."
                  : "请先阅读并同意用户协议"
              }
              showUploadButton={false}
              showUploadFile={false}
              disabled={!hasAgreed}
            />
          </Content>

          {/* Copyright */}
          <div className={styles.copyright}>
            © {new Date().getFullYear()}{" "}
            {systemConfig?.site_name || appInfo?.name || "AI Knowledge Base"} ·
            Powered by AI
          </div>
        </Layout>

        {/* Feedback drawer */}
        <SideSheet
          title="详细反馈"
          visible={feedbackDrawer}
          onCancel={() => {
            setFeedbackDrawer(false);
            setFeedbackComment("");
          }}
          placement="bottom"
          height={300}
        >
          <div className={styles.feedbackContent}>
            <TextArea
              value={feedbackComment}
              onChange={(v) => setFeedbackComment(v)}
              placeholder="请描述您的问题或建议..."
              rows={4}
            />
            <div className={styles.feedbackActions}>
              <Button
                onClick={() => {
                  setFeedbackDrawer(false);
                  setFeedbackComment("");
                }}
              >
                取消
              </Button>
              <Button theme="solid" onClick={submitFeedback}>
                提交
              </Button>
            </div>
          </div>
        </SideSheet>
      </Layout>

      {/* User Agreement Modal - 移到 Layout 外部 */}
      <Modal
        title="用户协议"
        visible={showAgreementModal && !hasAgreed}
        zIndex={1000}
        onOk={() => {
          if (!agreementChecked) {
            Toast.warning("请先勾选同意用户协议");
            return;
          }
          setHasAgreed(true);
          setShowAgreementModal(false);
          localStorage.setItem("share_page_agreement_accepted", "true");
        }}
        onCancel={() => {
          Toast.warning("您需要同意用户协议才能使用服务");
        }}
        okText="确认"
        cancelText="取消"
        closable={false}
        maskClosable={false}
        width={isMobile ? "90vw" : 600}
        bodyStyle={{
          maxHeight: isMobile ? "70vh" : "60vh",
          overflow: "auto",
          padding: isMobile ? "12px" : "24px",
        }}
        style={{ maxWidth: isMobile ? "95vw" : "600px" }}
        getPopupContainer={() => document.body}
      >
        <div
          style={{ padding: isMobile ? "8px 0" : "16px 0", lineHeight: "1.8" }}
        >
          <h3
            style={{
              marginBottom: isMobile ? "12px" : "16px",
              fontSize: isMobile ? "15px" : "16px",
              fontWeight: 600,
            }}
          >
            欢迎使用本服务
          </h3>

          <p
            style={{
              marginBottom: "12px",
              fontSize: isMobile ? "13px" : "14px",
            }}
          >
            在使用本服务之前，请仔细阅读并理解以下用户协议：
          </p>

          <h4
            style={{
              marginTop: isMobile ? "12px" : "16px",
              marginBottom: "8px",
              fontWeight: 600,
              fontSize: isMobile ? "14px" : "15px",
            }}
          >
            1. 服务说明
          </h4>
          <p
            style={{
              marginBottom: "12px",
              fontSize: isMobile ? "13px" : "14px",
            }}
          >
            本服务基于人工智能技术为您提供智能问答服务。AI
            生成的内容仅供参考，不代表官方立场或保证准确性。
          </p>

          <h4
            style={{
              marginTop: isMobile ? "12px" : "16px",
              marginBottom: "8px",
              fontWeight: 600,
              fontSize: isMobile ? "14px" : "15px",
            }}
          >
            2. 用户责任
          </h4>
          <ul
            style={{
              marginLeft: isMobile ? "16px" : "20px",
              marginBottom: "12px",
              fontSize: isMobile ? "13px" : "14px",
            }}
          >
            <li style={{ marginBottom: "4px" }}>您应合法、正当地使用本服务</li>
            <li style={{ marginBottom: "4px" }}>
              不得利用本服务从事违法违规活动
            </li>
            <li style={{ marginBottom: "4px" }}>不得发布违反法律法规的内容</li>
            <li style={{ marginBottom: "4px" }}>
              不得干扰或破坏本服务的正常运行
            </li>
          </ul>

          <h4
            style={{
              marginTop: isMobile ? "12px" : "16px",
              marginBottom: "8px",
              fontWeight: 600,
              fontSize: isMobile ? "14px" : "15px",
            }}
          >
            3. 隐私保护
          </h4>
          <p
            style={{
              marginBottom: "12px",
              fontSize: isMobile ? "13px" : "14px",
            }}
          >
            我们重视您的隐私保护。您的对话内容将被用于服务优化，但不会泄露给第三方。
          </p>

          <h4
            style={{
              marginTop: isMobile ? "12px" : "16px",
              marginBottom: "8px",
              fontWeight: 600,
              fontSize: isMobile ? "14px" : "15px",
            }}
          >
            4. 免责声明
          </h4>
          <p
            style={{
              marginBottom: "12px",
              fontSize: isMobile ? "13px" : "14px",
            }}
          >
            AI
            生成的内容可能存在不准确、不完整或过时的情况。对于因使用本服务产生的任何直接或间接损失，我们不承担责任。
          </p>

          {/* 勾选框 */}
          <div
            style={{
              marginTop: "24px",
              padding: isMobile ? "12px" : "16px",
              background: "#f7f8fa",
              borderRadius: "8px",
              border: "1px solid #e8e9eb",
            }}
          >
            <Checkbox
              checked={agreementChecked}
              onChange={(e) => setAgreementChecked(e.target.checked)}
              style={{ fontSize: isMobile ? "14px" : "15px" }}
            >
              我已阅读并同意以上用户协议
            </Checkbox>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default SharePage;
