import React, { useState, useEffect, useRef, useCallback, Component, useMemo } from 'react';
import { useParams } from 'react-router-dom';
// Semi-UI 组件
import { Button, Toast, SideSheet, Space, Modal, Input, Image, AIChatInput, AIChatDialogue } from '@douyinfe/semi-ui';
// Semi-UI 图标
import {
  IconSend,
  IconCopy,
  IconLikeThumb,
  IconDislikeThumb,
  IconClose,
  IconPlus,
  IconComment,
  IconDelete,
  IconMicrophone,
  IconMicrophoneOff,
  IconMenu,
  IconArrowLeft,
  IconArrowRight,
  IconExpand,
  IconShrink,
  IconRefresh,
} from '@douyinfe/semi-icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './SharePage.module.css';

const { TextArea } = Input;

// 错误边界组件
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Markdown渲染错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className={styles.paragraph}>内容渲染出错，请刷新重试</div>;
    }
    return this.props.children;
  }
}

// 纯文本 Markdown 渲染组件 - 图片链接直接渲染为图片
const MarkdownTextOnly: React.FC<{ content: string }> = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className={styles.paragraph}>{children}</p>,
        ul: ({ children }) => <ul className={styles.list}>{children}</ul>,
        ol: ({ children }) => <ol className={styles.list}>{children}</ol>,
        li: ({ children }) => <li className={styles.listItem}>{children}</li>,
        code: ({ inline, children }: any) =>
          inline ? (
            <code className={styles.inlineCode}>{children}</code>
          ) : (
            <code className={styles.codeBlock}>{children}</code>
          ),
        pre: ({ children }) => <pre className={styles.preBlock}>{children}</pre>,
        // 图片链接直接渲染为图片
        a: ({ href, children }: any) => {
          const text = children?.toString() || '';
          // 如果是图片链接，直接渲染图片
          if (href && (text.includes('查看') || text.includes('流程图') || text.includes('图片'))) {
            return (
              <img
                src={href}
                alt={text}
                className={styles.inlineImage}
                loading="lazy"
                onClick={() => {
                  Modal.info({
                    title: '图片预览',
                    width: '90vw',
                    content: (
                      <img
                        src={href}
                        alt="预览"
                        style={{
                          width: '100%',
                          height: 'auto',
                          maxHeight: '70vh',
                          objectFit: 'contain'
                        }}
                      />
                    ),
                  });
                }}
              />
            );
          }
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" className={styles.externalLink}>
              {children}
            </a>
          );
        },
        // Markdown 图片也渲染
        img: ({ src, alt }: any) => (
          <img
            src={src}
            alt={alt || '图片'}
            className={styles.inlineImage}
            loading="lazy"
          />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

// 图片链接组件 - 直接渲染图片
const ImageLinks: React.FC<{ content: string }> = ({ content }) => {
  // 提取所有图片链接
  const imageLinks: { url: string; text: string }[] = [];
  const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  const regex = new RegExp(linkRegex.source, linkRegex.flags);
  while ((match = regex.exec(content)) !== null) {
    const text = match[1];
    const url = match[2];
    if (text.includes('查看') || text.includes('流程图') || text.includes('图片')) {
      imageLinks.push({ url, text });
    }
  }

  // 调试日志
  console.log('[ImageLinks] Processing content:', content.substring(0, 100) + '...');
  console.log('[ImageLinks] Found image links:', imageLinks.length);
  imageLinks.forEach((link, idx) => {
    console.log(`[ImageLinks]   Link ${idx + 1}:`, link.text, link.url);
  });

  if (imageLinks.length === 0) {
    console.log('[ImageLinks] No image links found, returning null');
    return null;
  }

  // 点击打开预览
  const handleImageClick = (url: string) => {
    Modal.info({
      title: '图片预览',
      width: '90vw',
      content: (
        <img
          src={url}
          alt="预览"
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '70vh',
            objectFit: 'contain'
          }}
        />
      ),
    });
  };

  console.log('[ImageLinks] Rendering', imageLinks.length, 'images');

  // 去重：使用 Set 来避免重复的 URL
  const uniqueLinks = Array.from(
    new Map(imageLinks.map(item => [item.url, item])).values()
  );
  console.log('[ImageLinks] After deduplication:', uniqueLinks.length, 'unique images');

  return (
    <div className={styles.imageLinksContainer}>
      <div className={styles.imageLinksTitle}>相关流程图/图片 ({uniqueLinks.length})</div>
      {uniqueLinks.map((item, index) => {
        const imgKey = `img-${index}-${item.url.split('/').pop()}`;
        console.log('[ImageLinks] Creating img element for:', item.url, 'key:', imgKey);
        return (
          <img
            key={imgKey}
            src={item.url}
            alt={item.text || `流程图 ${index + 1}`}
            onClick={() => {
              console.log('[ImageLinks] Image clicked:', item.url);
              handleImageClick(item.url);
            }}
            className={styles.inlineImage}
            loading="lazy"
            onLoad={(e) => {
              console.log('[ImageLinks] Image loaded:', item.url);
              const target = e.currentTarget;
              console.log('[ImageLinks] Image dimensions:', target.naturalWidth, 'x', target.naturalHeight);
              console.log('[ImageLinks] Image display:', target.style.display);
              console.log('[ImageLinks] Image visibility:', getComputedStyle(target).visibility);
            }}
            onError={(e) => {
              console.error('[ImageLinks] Image failed to load:', item.url);
              console.error('[ImageLinks] Error event:', e);
            }}
          />
        );
      })}
    </div>
  );
};

// 图片画廊组件 - 渲染图片（用于模态框预览）
const ImageGallery: React.FC<{ content: string; onImageClick: (url: string, content: string) => void }> = ({ content, onImageClick }) => {
  const imageLinks = React.useMemo(() => {
    const links: string[] = [];
    const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const text = match[1];
      const url = match[2];
      if (text.includes('查看') || text.includes('流程图') || text.includes('图片')) {
        links.push(url);
      }
    }
    return Array.from(new Set(links));
  }, [content]);

  if (imageLinks.length === 0) return null;

  return (
    <div className={styles.imageGallery}>
      <div className={styles.imageGalleryTitle}>相关流程图/图片 ({imageLinks.length})</div>
      <div className={styles.imageGalleryGrid}>
        {imageLinks.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className={styles.imageGalleryItem}
            onClick={() => onImageClick(url, content)}
          >
            <img
              src={url}
              alt={`流程图 ${index + 1}`}
              className={styles.imageGalleryThumb}
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className={styles.imageGalleryItemOverlay}>
              <span>点击放大</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
  // 新增：对话摘要，用于上下文压缩
  summary?: string;
  // 新增：是否为续接对话
  isContinuation?: boolean;
  // 新增：父对话ID（用于追溯历史）
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

function SharePage() {
  const params = useParams();
  const shareId = (params?.id as string) || '';

  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 移动端默认收起侧边栏，PC端默认展开（使用CSS媒体查询避免闪烁）
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(true);

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarCollapsed(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Voice states
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // Feedback states
  const [feedbackDrawer, setFeedbackDrawer] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [userFeedbacks, setUserFeedbacks] = useState<Record<string, 'like' | 'dislike'>>({});

  // Image preview states
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImageList, setCurrentImageList] = useState<string[]>([]);
  const [imageScale, setImageScale] = useState(1);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);
  const aiChatInputRef = useRef<any>(null);
  const dialogueRef = useRef<any>(null);
  // 流式消息内容缓存，避免频繁更新 state
  const streamingContentRef = useRef<Record<string, string>>({});

  const API_URL = import.meta.env.VITE_API_URL || '';

  // 对话上下文配置
  const MAX_MESSAGES_PER_CONVERSATION = 20;  // 单个对话最大消息数
  const MAX_CONTEXT_TOKENS = 4000;  // 最大上下文 token 数（估算）
  const CONTEXT_SUMMARY_PROMPT = '请简要总结上述对话的核心内容，包括用户提出的主要问题和获得的关键答案。';

  // Get current messages
  const currentMessages = currentConversationId
    ? conversations.find(c => c.id === currentConversationId)?.messages || []
    : [];

  // Check if should show welcome message: always show when appInfo has welcome_message
  const showWelcomeMessage = !!appInfo?.welcome_message;

  // AIChatDialogue 角色配置
  const roleConfig = useMemo(() => ({
    user: {
      name: '我',
      avatar: '',
    },
    assistant: {
      name: appInfo?.name || '智能助手',
      avatar: systemConfig?.logo || '',
    },
  }), [appInfo?.name, systemConfig?.logo]);

  // 将当前消息转换为 AIChatDialogue 格式
  const dialogueChats = useMemo(() => {
    return currentMessages.map(msg => {
      // 处理流式输出中的消息
      const streamingContent = streamingContentRef.current[msg.id];
      const content = streamingContent !== undefined ? streamingContent : msg.content;

      // AIChatDialogue Message 格式
      return {
        id: msg.id,
        role: msg.role, // 'user' | 'assistant'
        content: content, // 文本内容
        status: msg.role === 'assistant' && streamingContent !== undefined ? 'streaming' : 'completed',
        created_at: msg.created_at,
      };
    });
  }, [currentMessages]);

  // Scroll to bottom when messages change (但初次加载不滚动)
  useEffect(() => {
    if (currentMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMessages]);

  // Load conversations from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`share_conversations_${shareId}`);
    const currentConvId = localStorage.getItem(`share_current_conversation_${shareId}`);
    console.log('[SharePage] Loading from localStorage:', { shareId, hasStored: !!stored, currentConvId });
    if (stored) {
      try {
        const parsed: Conversation[] = JSON.parse(stored);
        console.log('[SharePage] Loaded conversations:', parsed.length, 'conversations');
        parsed.forEach(c => {
          console.log(`[SharePage] - Conv ${c.id}:`, c.title, `${c.messages.length} messages`);
          c.messages.forEach((m, i) => {
            const preview = m.content.length > 50 ? m.content.slice(0, 50) + '...' : m.content;
            console.log(`[SharePage]   Message ${i}:`, m.role, preview);
          });
        });
        setConversations(parsed);
        // 刷新后恢复当前对话（如果存在）
        if (currentConvId && parsed.find(c => c.id === currentConvId)) {
          console.log('[SharePage] Restoring current conversation:', currentConvId);
          setCurrentConversationId(currentConvId);
        }
      } catch (e) {
        console.error('Failed to load conversations:', e);
      }
    }
  }, [shareId]);

  // 保存当前对话ID到 localStorage
  useEffect(() => {
    if (currentConversationId) {
      localStorage.setItem(`share_current_conversation_${shareId}`, currentConversationId);
    } else {
      localStorage.removeItem(`share_current_conversation_${shareId}`);
    }
  }, [currentConversationId, shareId]);

  // Save conversations to localStorage
  const saveConversations = useCallback((updated: Conversation[]) => {
    localStorage.setItem(`share_conversations_${shareId}`, JSON.stringify(updated));
    // 调试：打印保存的数据
    console.log('[SharePage] Saved conversations:', updated.length, 'conversations');
    updated.forEach(c => {
      console.log(`[SharePage] - Conv ${c.id}:`, c.title, `${c.messages.length} messages`);
      c.messages.forEach((m, i) => {
        const preview = m.content.length > 50 ? m.content.slice(0, 50) + '...' : m.content;
        console.log(`[SharePage]   Message ${i}:`, m.role, preview);
      });
    });
  }, [shareId]);

  // Load application info
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsInitialLoading(true);

        // Load system config
        const configRes = await fetch(`${API_URL}/api/v1/system/config`);
        if (configRes.ok) {
          const configData = await configRes.json();
          setSystemConfig(configData);
        }

        // Load app info
        const appRes = await fetch(`${API_URL}/api/v1/share/${shareId}`);
        if (!appRes.ok) {
          throw new Error('分享链接无效或已过期');
        }
        const appData = await appRes.json();
        setAppInfo(appData);
      } catch (err: any) {
        setError(err.message || '加载失败');
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadData();
  }, [shareId]);

  // Create new conversation
  const createNewConversation = useCallback(() => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: '新对话',
      messages: [],
      created_at: new Date().toISOString(),
    };
    const updated = [newConv, ...conversations];
    setConversations(updated);
    setCurrentConversationId(newConv.id);
    saveConversations(updated);
  }, [conversations, saveConversations]);

  // Delete conversation
  const deleteConversation = useCallback((convId: string) => {
    const updated = conversations.filter(c => c.id !== convId);
    setConversations(updated);
    if (currentConversationId === convId) {
      setCurrentConversationId(updated.length > 0 ? updated[0].id : null);
    }
    saveConversations(updated);
  }, [conversations, currentConversationId, saveConversations]);

  // Switch conversation
  const switchConversation = useCallback((convId: string) => {
    setCurrentConversationId(convId);
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  // Add message to current conversation - 使用函数式更新避免闭包问题
  // skipSave: 是否跳过保存到 localStorage（用于流式消息，避免保存空内容）
  const addMessageToConversation = useCallback((convId: string, message: Message, skipSave: boolean = false) => {
    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id === convId) {
          const newMessages = [...c.messages, message];
          // Update title if this is the first user message
          const newTitle = c.messages.length === 0 && message.role === 'user'
            ? message.content.slice(0, 20) + (message.content.length > 20 ? '...' : '')
            : c.title;
          return { ...c, messages: newMessages, title: newTitle };
        }
        return c;
      });
      // 只有在非跳过模式下才保存到 localStorage
      if (!skipSave) {
        saveConversations(updated);
      }
      return updated;
    });
  }, [saveConversations]);

  // Voice recording functions
  const startRecording = useCallback(async () => {
    // 检查浏览器是否支持
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      Toast.error('您的浏览器不支持语音输入，请使用 Chrome 或 Safari');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        await transcribeAudio();
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        Toast.error('请允许麦克风权限以使用语音输入');
      } else if (err.name === 'NotReadableError') {
        Toast.error('麦克风被其他应用占用，请稍后再试');
      } else {
        Toast.error('无法访问麦克风');
      }
      console.error(err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  }, [mediaRecorder]);

  const transcribeAudio = async () => {
    // For now, use Web Speech API for transcription
    // In production, you would send the audio to your backend for ASR
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'zh-CN';
      recognition.continuous = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
      };

      recognition.onerror = () => {
        Toast.warning('语音识别失败，请重试');
      };

      recognition.start();
    } else {
      Toast.warning('您的浏览器不支持语音识别');
    }
  };

  // Text-to-Speech
  const speakText = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      if (isPlaying) {
        speechSynthesis.cancel();
        setIsPlaying(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 1;
      utterance.pitch = 1;

      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      speechSynthesis.speak(utterance);
      setIsPlaying(true);
    } else {
      Toast.warning('您的浏览器不支持语音播放');
    }
  }, [isPlaying]);

  // Copy message content
  const handleCopy = useCallback((content: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const textArea = document.createElement('textarea');
    textArea.value = content;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      Toast.success('已复制');
    } catch (err) {
      Toast.error('复制失败');
    }

    document.body.removeChild(textArea);
  }, []);

  // Handle like/dislike
  const handleFeedback = useCallback((messageId: string, feedbackType: 'like' | 'dislike', e: React.MouseEvent) => {
    e.stopPropagation();
    const currentType = userFeedbacks[messageId];

    // If clicking the same type, remove it
    if (currentType === feedbackType) {
      const updated = { ...userFeedbacks };
      delete updated[messageId];
      setUserFeedbacks(updated);

      fetch(`${API_URL}/api/v1/share/${shareId}/feedback`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: messageId })
      }).catch(() => {});
      return;
    }

    // Update feedback
    setUserFeedbacks({ ...userFeedbacks, [messageId]: feedbackType });

    fetch(`${API_URL}/api/v1/share/${shareId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message_id: messageId,
        feedback_type: feedbackType
      })
    }).catch(() => {});

    Toast.success(feedbackType === 'like' ? '已点赞' : '已反馈');
  }, [shareId, userFeedbacks]);

  // Open feedback drawer
  const openFeedbackDrawer = useCallback((messageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMessageId(messageId);
    setFeedbackDrawer(true);
  }, []);

  // Submit detailed feedback
  const submitFeedback = useCallback(() => {
    if (!selectedMessageId) return;

    fetch(`${API_URL}/api/v1/share/${shareId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message_id: selectedMessageId,
        feedback_type: 'feedback',
        comment: feedbackComment
      })
    }).then(() => {
      Toast.success('感谢反馈');
      setFeedbackDrawer(false);
      setFeedbackComment('');
      setSelectedMessageId(null);
    }).catch(() => {
      Toast.error('提交失败');
    });
  }, [shareId, selectedMessageId, feedbackComment]);

  // Extract image URLs from message content
  const extractImagesFromContent = useCallback((content: string): string[] => {
    const images: string[] = [];
    // 匹配 [查看流程图](url) 格式
    const linkRegex = /\[查看[^\]]*\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      if (match[1]) images.push(match[1]);
    }
    // 匹配 Markdown 图片格式 ![alt](url)
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    while ((match = imgRegex.exec(content)) !== null) {
      if (match[2]) images.push(match[2]);
    }
    return images;
  }, []);

  // Open image preview
  const openImagePreview = useCallback((imageUrl: string, content: string) => {
    const images = extractImagesFromContent(content);
    if (images.length > 0) {
      setCurrentImageList(images);
      setCurrentImageIndex(images.indexOf(imageUrl));
      setImageScale(1);
      setImagePreviewOpen(true);
    }
  }, [extractImagesFromContent]);

  // Image navigation
  const goToPrevImage = useCallback(() => {
    setCurrentImageIndex(prev => prev > 0 ? prev - 1 : currentImageList.length - 1);
    setImageScale(1);
  }, [currentImageList.length]);

  const goToNextImage = useCallback(() => {
    setCurrentImageIndex(prev => prev < currentImageList.length - 1 ? prev + 1 : 0);
    setImageScale(1);
  }, [currentImageList.length]);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setImageScale(prev => Math.min(prev + 0.25, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setImageScale(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setImageScale(1);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!imagePreviewOpen) return;
      if (e.key === 'ArrowLeft') goToPrevImage();
      if (e.key === 'ArrowRight') goToNextImage();
      if (e.key === 'Escape') setImagePreviewOpen(false);
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-' || e.key === '_') zoomOut();
      if (e.key === '0') resetZoom();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imagePreviewOpen, goToPrevImage, goToNextImage, zoomIn, zoomOut, resetZoom]);

  // 估算文本的 token 数量（粗略估算：中文约 1.5 字符/token，英文约 4 字符/token）
  const estimateTokens = useCallback((text: string): number => {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars / 1.5 + otherChars / 4);
  }, []);

  // 计算消息列表的总 token 数
  const calculateContextTokens = useCallback((messages: Message[]): number => {
    let total = 0;
    for (const msg of messages) {
      total += estimateTokens(msg.content);
    }
    return total;
  }, [estimateTokens]);

  // 生成对话摘要（调用后端 API）
  const generateConversationSummary = useCallback(async (messages: Message[]): Promise<string> => {
    try {
      // 只取最近的对话内容进行摘要
      const recentMessages = messages.slice(-10);
      const conversationText = recentMessages
        .map(m => `${m.role === 'user' ? '用户' : '助手'}: ${m.content}`)
        .join('\n');

      const response = await fetch(`${API_URL}/api/v1/share/${shareId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: CONTEXT_SUMMARY_PROMPT + '\n\n对话内容：\n' + conversationText,
          context: [],  // 摘要不需要历史上下文
          stream: false  // 摘要不需要流式输出
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.content || data.answer || '对话内容已总结';
      }
    } catch (e) {
      console.error('Failed to generate summary:', e);
    }
    return '用户进行了多轮对话';
  }, [shareId, API_URL]);

  // 检查是否需要新建对话（上下文过长）
  const shouldCreateNewConversation = useCallback((currentConv: Conversation): boolean => {
    const messageCount = currentConv.messages.length;
    const estimatedTokens = calculateContextTokens(currentConv.messages);

    // 达到消息数量限制或 token 限制时，建议新建对话
    return messageCount >= MAX_MESSAGES_PER_CONVERSATION || estimatedTokens >= MAX_CONTEXT_TOKENS;
  }, [calculateContextTokens]);

  // 创建续接对话（携带压缩的上下文）
  const createContinuationConversation = useCallback(async (parentConv: Conversation, summary: string): Promise<Conversation> => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: parentConv.title + ' (续)',
      messages: [],
      created_at: new Date().toISOString(),
      summary: summary,
      isContinuation: true,
      parentConversationId: parentConv.id,
    };

    // 更新父对话的摘要
    setConversations(prev => {
      return prev.map(c => {
        if (c.id === parentConv.id) {
          return { ...c, summary };
        }
        return c;
      });
    });

    return newConv;
  }, []);

  // Send message
  const handleSend = useCallback(async (voiceInput?: string) => {
    const content = (voiceInput || inputValue).trim();
    if (!content || isLoading) return;

    // Get current conversation messages for history
    const currentConv = currentConversationId
      ? conversations.find(c => c.id === currentConversationId)
      : null;

    let targetConvId = currentConversationId;
    let historyMessages = currentConv?.messages || [];
    let contextSummary = currentConv?.summary;

    // 检查是否需要新建对话（上下文过长）
    let shouldCreateNew = false;
    if (currentConv && shouldCreateNewConversation(currentConv)) {
      shouldCreateNew = true;
      // 生成当前对话的摘要
      const summary = await generateConversationSummary(currentConv.messages);
      contextSummary = summary;

      // 创建续接对话
      const newConv = await createContinuationConversation(currentConv, summary);
      setConversations(prev => {
        const updated = [newConv, ...prev];
        saveConversations(updated);
        return updated;
      });
      setCurrentConversationId(newConv.id);
      targetConvId = newConv.id;
      historyMessages = [];  // 新对话不包含历史消息，只携带摘要
    }

    setInputValue('');
    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      created_at: new Date().toISOString()
    };

    // If no conversation, create it and add message in one update
    if (!targetConvId) {
      const newConv: Conversation = {
        id: Date.now().toString(),
        title: content.length > 20 ? content.slice(0, 20) + '...' : content,
        messages: [userMessage],
        created_at: new Date().toISOString(),
      };
      setConversations(prev => {
        const updated = [newConv, ...prev];
        saveConversations(updated);
        return updated;
      });
      setCurrentConversationId(newConv.id);
      targetConvId = newConv.id;
    } else {
      addMessageToConversation(targetConvId, userMessage);
    }

    let assistantContent = '';  // 移到外层，以便 catch 块可以访问
    let assistantId = (Date.now() + 1).toString();
    let hasReceivedContent = false;  // 标记是否收到内容
    let buffer = '';  // 用于处理跨 chunk 的不完整行
    let updateScheduled = false;  // 节流标记

    // 初始化流式内容缓存
    streamingContentRef.current[assistantId] = '';

    try {
      // 构建上下文：如果有摘要，先添加摘要，再添加最近的几条消息
      let contextForApi: { role: string; content: string }[] = [];

      if (contextSummary) {
        // 如果有上下文摘要，先添加摘要作为系统提示
        contextForApi.push({
          role: 'system',
          content: `【上下文摘要】${contextSummary}\n请基于以上历史对话的摘要来回答用户的新问题。`
        });
      }

      // 添加最近的几条消息（不超过6条，即3轮对话）
      const recentMessages = historyMessages.slice(-6);
      contextForApi = contextForApi.concat(
        recentMessages.map(m => ({ role: m.role, content: m.content }))
      );

      const response = await fetch(`${API_URL}/api/v1/share/${shareId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          context: contextForApi,
          // 如果是续接对话，告诉后端这是新话题
          new_topic: shouldCreateNew
        })
      });

      if (!response.ok) {
        throw new Error('发送失败');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      // Add empty assistant message that will be updated with streaming content
      const emptyAssistantMsg: Message = {
        id: assistantId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString()
      };
      // 跳过保存，避免将空内容保存到 localStorage
      addMessageToConversation(targetConvId!, emptyAssistantMsg, true);

      // 节流更新函数：使用 requestAnimationFrame 避免过于频繁的渲染
      // 注意：流式输出过程中不保存 localStorage，只在结束后保存
      const scheduleUpdate = () => {
        if (updateScheduled) return;
        updateScheduled = true;
        requestAnimationFrame(() => {
          setConversations(prev => {
            const updated = prev.map(c => {
              if (c.id === targetConvId) {
                return {
                  ...c,
                  messages: c.messages.map(msg =>
                    msg.id === assistantId
                      ? { ...msg, content: streamingContentRef.current[assistantId] || '' }
                      : msg
                  )
                };
              }
              return c;
            });
            // 流式输出过程中不保存 localStorage，避免频繁写入导致性能问题
            return updated;
          });
          updateScheduled = false;
        });
      };

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // 按行分割，但保留最后一个可能不完整的行
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (!data || data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    const newContent = parsed.content;
                    console.log('[Stream] Received chunk:', newContent.length, 'chars, preview:', newContent.substring(0, 50));
                    assistantContent += newContent;
                    streamingContentRef.current[assistantId] = assistantContent;
                    console.log('[Stream] Total content length:', assistantContent.length);
                    hasReceivedContent = true;
                    scheduleUpdate();  // 节流更新
                  }
                } catch (e) {
                  console.error('Parse error:', e, 'data:', data);
                }
              }
            }
          }

          // 处理剩余的 buffer
          if (buffer.trim()) {
            const lines = buffer.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (!data || data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    assistantContent += parsed.content;
                    streamingContentRef.current[assistantId] = assistantContent;
                    hasReceivedContent = true;
                  }
                } catch (e) {
                  console.error('Parse error:', e);
                }
              }
            }
          }

          // 最后确保更新一次完整内容并保存到 localStorage
          if (hasReceivedContent) {
            setConversations(prev => {
              const updated = prev.map(c => {
                if (c.id === targetConvId) {
                  return {
                    ...c,
                    messages: c.messages.map(msg =>
                      msg.id === assistantId ? { ...msg, content: assistantContent } : msg
                    )
                  };
                }
                return c;
              });
              saveConversations(updated);
              return updated;
            });
          }
        } catch (readErr: any) {
          // 流式读取时的网络错误
          if (hasReceivedContent) {
            console.log('Stream ended with content, connection closed by server');
            return;
          }
          throw readErr;
        }
      }
    } catch (err: any) {
      // 只在没有收到任何内容时才处理错误
      if (!hasReceivedContent) {
        console.error('Send error:', err);
        Toast.error(err.message || '发送失败');
        setConversations(prev => {
          const updated = prev.map(c => {
            if (c.id === targetConvId) {
              return { ...c, messages: c.messages.slice(0, -2) };
            }
            return c;
          });
          saveConversations(updated);
          return updated;
        });
      }
    } finally {
      // 清理流式缓存
      delete streamingContentRef.current[assistantId];
      setIsLoading(false);
      // 清空 AIChatInput 输入框
      if (aiChatInputRef.current) {
        aiChatInputRef.current.setContent('');
      }
    }
  }, [
    inputValue,
    isLoading,
    currentConversationId,
    conversations,
    shareId,
    addMessageToConversation,
    saveConversations,
    shouldCreateNewConversation,
    generateConversationSummary,
    createContinuationConversation,
  ]);

  // Initial loading
  if (isInitialLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>!</div>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Mobile Header */}
      <header className={styles.mobileHeader}>
        <Button
          type="tertiary"
          icon={<IconMenu />}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={styles.menuBtn}
        />
        <h1 className={styles.headerTitle}>{appInfo?.name || '智能助手'}</h1>
        <Button
          type="tertiary"
          icon={<IconPlus />}
          onClick={createNewConversation}
          className={styles.newChatBtn}
        >
          <span className={styles.newChatText}>新对话</span>
        </Button>
      </header>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : styles.expanded}`}>
        {/* Sidebar Header */}
        <div className={styles.sidebarHeader}>
          {systemConfig?.logo ? (
            <img src={systemConfig.logo} alt="" className={styles.sidebarLogo} />
          ) : (
            <div className={styles.sidebarLogoPlaceholder}>{(appInfo?.name || 'AI')[0]}</div>
          )}
          <span className={styles.sidebarTitle}>{appInfo?.name || '智能助手'}</span>
          {/* 移动端关闭按钮 */}
          <Button
            type="tertiary"
            icon={<IconClose />}
            onClick={() => setSidebarCollapsed(true)}
            className={styles.sidebarCloseBtn}
          />
        </div>

        {/* New Conversation Button */}
        <div className={styles.sidebarNewChat}>
          <Button
            type="primary"
            icon={<IconPlus />}
            onClick={createNewConversation}
            block
          >
            新对话
          </Button>
        </div>

        {/* Conversations List */}
        <div className={styles.conversationsList}>
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`${styles.conversationItem} ${currentConversationId === conv.id ? styles.active : ''}`}
              onClick={() => switchConversation(conv.id)}
            >
              <div className={styles.conversationTitle}>{conv.title}</div>
              <div className={styles.conversationTime}>
                {new Date(conv.created_at).toLocaleDateString()}
              </div>
              <Button
                type="tertiary"
                size="small"
                icon={<IconDelete />}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className={styles.deleteBtn}
              />
            </div>
          ))}
          {conversations.length === 0 && (
            <div className={styles.emptyConversations}>
              <p>暂无对话记录</p>
              <p>点击"新对话"开始聊天</p>
            </div>
          )}
        </div>

      </aside>

      {/* Mobile Sidebar Overlay - 只在移动端且侧边栏展开时显示，点击右侧收起侧边栏 */}
      {!sidebarCollapsed && isMobile && (
        <div
          className={styles.sidebarOverlay}
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Main Chat Area */}
      <main className={styles.main}>
        {/* PC Header */}
        <header className={styles.pcHeader}>
          {systemConfig?.logo ? (
            <img src={systemConfig.logo} alt="" className={styles.headerLogo} />
          ) : (
            <div className={styles.headerLogoPlaceholder}>{(appInfo?.name || 'AI')[0]}</div>
          )}
          <h1 className={styles.headerTitle}>{appInfo?.name || '智能助手'}</h1>
        </header>

        {/* Messages */}
        <div className={styles.messagesContainer} ref={messagesContainerRef}>
          {/* Welcome message - always show at the top */}
          {showWelcomeMessage && (
            <div className={`${styles.message} ${styles.assistantMessage}`}>
              {systemConfig?.logo && (
                <img src={systemConfig.logo} alt="" className={styles.messageAvatar} />
              )}
              <div className={styles.bubble}>
                <div className={styles.paragraph}>{appInfo.welcome_message}</div>
              </div>
            </div>
          )}

          {/* AIChatDialogue 对话展示 */}
          <AIChatDialogue
            ref={dialogueRef}
            chats={dialogueChats}
            roleConfig={roleConfig}
            mode="bubble"
            align="leftRight"
            className={styles.aiDialogue}
            // 消息复制
            onMessageCopy={(message) => {
              const content = typeof message.content === 'string' ? message.content : '';
              handleCopy(content, { stopPropagation: () => {} } as any);
            }}
            // 点赞
            onMessageGoodFeedback={(message) => {
              handleFeedback(message.id, 'like', { stopPropagation: () => {} } as any);
            }}
            // 点踩
            onMessageBadFeedback={(message) => {
              handleFeedback(message.id, 'dislike', { stopPropagation: () => {} } as any);
            }}
            // Markdown 渲染配置
            markdownRenderProps={{
              // 自定义 Markdown 渲染以支持图片预览等功能
              components: {
                a: ({ href, children }: any) => {
                  const text = children?.toString() || '';
                  // 如果是图片链接，显示为可点击的图片
                  if (href && (text.includes('查看') || text.includes('流程图') || text.includes('图片'))) {
                    return (
                      <img
                        src={href}
                        alt={text}
                        className={styles.inlineImage}
                        loading="lazy"
                        onClick={() => {
                          const images = extractImagesFromContent(typeof href === 'string' ? href : '');
                          if (images.length > 0) {
                            setCurrentImageList(images);
                            setCurrentImageIndex(0);
                            setImageScale(1);
                            setImagePreviewOpen(true);
                          }
                        }}
                      />
                    );
                  }
                  return (
                    <a href={href} target="_blank" rel="noopener noreferrer" className={styles.externalLink}>
                      {children}
                    </a>
                  );
                },
                img: ({ src, alt }: any) => (
                  <img
                    src={src}
                    alt={alt || '图片'}
                    className={styles.inlineImage}
                    loading="lazy"
                  />
                ),
              }
            }}
            // 自定义操作按钮渲染 - 添加朗读和反馈按钮
            dialogueRenderConfig={{
              renderDialogueAction: (props) => {
                const { defaultActions, message } = props as any;
                const msg = message as any;
                const content = typeof msg?.content === 'string' ? msg.content : '';

                return (
                  <div className={styles.messageActions}>
                    <Space size={2}>
                      {/* 复制按钮 (使用默认) */}
                      {defaultActions}
                      {/* 朗读按钮 */}
                      {msg?.role === 'assistant' && content && (
                        <Button
                          type="tertiary"
                          size="small"
                          icon={<IconMicrophone />}
                          onClick={() => speakText(content)}
                          className={styles.actionBtn}
                          title="朗读"
                        />
                      )}
                      {/* 反馈按钮 */}
                      {msg?.role === 'assistant' && content && (
                        <Button
                          type="tertiary"
                          size="small"
                          icon={<IconComment />}
                          onClick={(e) => openFeedbackDrawer(msg.id, e)}
                          className={styles.actionBtn}
                          title="反馈"
                        />
                      )}
                    </Space>
                  </div>
                );
              }
            }}
          />
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className={styles.inputContainer}>
          <AIChatInput
            ref={aiChatInputRef}
            placeholder="输入您的问题..."
            onContentChange={(content) => {
              // content 是数组，提取文本内容
              const text = content?.find((item: any) => item.type === 'text')?.text || '';
              setInputValue(text);
            }}
            onMessageSend={async (content) => {
              // 从 AIChatInput 的 content 中提取文本
              const text = content?.find((item: any) => item.type === 'text')?.text || '';
              if (text.trim()) {
                await handleSend(text);
              }
            }}
            disabled={isLoading}
            generating={isLoading}
            onStopGenerate={() => {
              // 停止生成的逻辑
              setIsLoading(false);
            }}
            renderActionArea={(props: any) => {
              // 添加语音输入按钮到操作区域
              return (
                <div className={props.className}>
                  <div style={{ display: 'flex', alignItems: 'center' }} key="voice">
                    <Button
                      type="tertiary"
                      icon={isRecording ? <IconMicrophoneOff /> : <IconMicrophone />}
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`${styles.voiceBtn} ${isRecording ? styles.recording : ''}`}
                      title={isRecording ? '停止录音' : '语音输入'}
                      style={{ borderRadius: '50%' }}
                    />
                  </div>
                  {props.menuItem}
                </div>
              );
            }}
            style={{ width: '100%' }}
            className={styles.aiInput}
          />
        </div>
      </main>

      {/* Feedback SideSheet */}
      <SideSheet
        title="意见反馈"
        placement="bottom"
        visible={feedbackDrawer}
        onCancel={() => setFeedbackDrawer(false)}
        size="large"
        styles={{
          body: { padding: '16px' }
        }}
        closeIcon={<IconClose />}
      >
        <div className={styles.feedbackContent}>
          <TextArea
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
            placeholder="请输入您的反馈意见..."
            autoSize={{ minRows: 4, maxRows: 6 }}
            className={styles.feedbackInput}
          />
          <div className={styles.feedbackActions}>
            <Button onClick={() => setFeedbackDrawer(false)}>
              取消
            </Button>
            <Button type="primary" onClick={submitFeedback}>
              提交
            </Button>
          </div>
        </div>
      </SideSheet>

      {/* Image Preview Modal */}
      <Modal
        open={imagePreviewOpen}
        onCancel={() => setImagePreviewOpen(false)}
        footer={null}
        width="90vw"
        style={{ top: 20 }}
        closeIcon={<IconClose style={{ color: '#fff', fontSize: 24 }} />}
        className={styles.imagePreviewModal}
        title={
          <div className={styles.imagePreviewHeader}>
            <span>{currentImageIndex + 1} / {currentImageList.length}</span>
          </div>
        }
      >
        <div className={styles.imagePreviewContent}>
          {/* Toolbar */}
          <div className={styles.imageToolbar}>
            <Space size="middle">
              <Button
                icon={<IconShrink />}
                onClick={zoomOut}
                disabled={imageScale <= 0.5}
                title="缩小 (-)"
              />
              <span className={styles.zoomLevel}>{Math.round(imageScale * 100)}%</span>
              <Button
                icon={<IconExpand />}
                onClick={zoomIn}
                disabled={imageScale >= 3}
                title="放大 (+)"
              />
              <Button
                onClick={resetZoom}
                disabled={imageScale === 1}
              >
                重置
              </Button>
            </Space>
            <Space size="middle">
              <Button
                icon={<IconArrowLeft />}
                onClick={goToPrevImage}
                disabled={currentImageList.length <= 1}
                title="上一张 (←)"
              >
                上一张
              </Button>
              <Button
                onClick={goToNextImage}
                disabled={currentImageList.length <= 1}
                title="下一张 (→)"
              >
                下一张
                <IconArrowRight />
              </Button>
            </Space>
          </div>

          {/* Image */}
          <div className={styles.imagePreviewWrapper}>
            <img
              src={currentImageList[currentImageIndex]}
              alt={`Preview ${currentImageIndex + 1}`}
              className={styles.previewImage}
              style={{ transform: `scale(${imageScale})` }}
              onClick={resetZoom}
            />
          </div>

          {/* Thumbnails */}
          {currentImageList.length > 1 && (
            <div className={styles.imageThumbnails}>
              {currentImageList.map((img, idx) => (
                <div
                  key={idx}
                  className={`${styles.thumbnail} ${idx === currentImageIndex ? styles.thumbnailActive : ''}`}
                  onClick={() => {
                    setCurrentImageIndex(idx);
                    setImageScale(1);
                  }}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default SharePage;
