import { Alert, Button, Space, Typography, Collapse } from '@douyinfe/semi-ui';
import {
  IconAlertTriangle,
  IconRefresh,
  IconClose,
  IconHelp,
  IconBug
} from '@douyinfe/semi-icons';

const { Text, Paragraph } = Typography;

export interface ErrorInfo {
  message: string;
  code?: string;
  details?: string;
  stack?: string;
  timestamp?: string;
  type?: 'network' | 'auth' | 'permission' | 'validation' | 'server' | 'unknown';
  recoverable?: boolean; // 是否可恢复
}

interface ErrorDisplayProps {
  error: ErrorInfo | string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  style?: React.CSSProperties;
}

/**
 * 错误类型图标映射
 */
const getErrorIcon = (type?: string) => {
  switch (type) {
    case 'network':
      return <IconAlertTriangle style={{ color: 'var(--semi-color-warning)' }} />;
    case 'auth':
    case 'permission':
      return <IconClose style={{ color: 'var(--semi-color-danger)' }} />;
    case 'validation':
      return <IconHelp style={{ color: 'var(--semi-color-warning)' }} />;
    case 'server':
      return <IconBug style={{ color: 'var(--semi-color-danger)' }} />;
    default:
      return <IconAlertTriangle style={{ color: 'var(--semi-color-danger)' }} />;
  }
};

/**
 * 错误类型默认消息
 */
const getDefaultErrorTitle = (type?: string): string => {
  switch (type) {
    case 'network':
      return '网络连接失败';
    case 'auth':
      return '身份认证失败';
    case 'permission':
      return '权限不足';
    case 'validation':
      return '输入验证失败';
    case 'server':
      return '服务器错误';
    default:
      return '操作失败';
  }
};

/**
 * 获取错误恢复建议
 */
const getErrorRecovery = (error: ErrorInfo): string[] => {
  const suggestions: string[] = [];

  switch (error.type) {
    case 'network':
      suggestions.push('检查网络连接是否正常');
      suggestions.push('确认服务器地址是否正确');
      suggestions.push('尝试刷新页面重试');
      break;

    case 'auth':
      suggestions.push('登录已过期，请重新登录');
      suggestions.push('清除浏览器缓存后重试');
      break;

    case 'permission':
      suggestions.push('您没有执行此操作的权限');
      suggestions.push('请联系管理员获取相应权限');
      break;

    case 'validation':
      suggestions.push('检查输入内容是否完整');
      suggestions.push('确认输入格式是否正确');
      break;

    case 'server':
      suggestions.push('服务器暂时无法响应');
      suggestions.push('请稍后重试或联系技术支持');
      break;

    default:
      if (error.message) {
        suggestions.push('错误提示：' + error.message);
      }
      suggestions.push('如果问题持续，请联系技术支持');
  }

  return suggestions;
};

/**
 * 错误显示组件
 *
 * 使用示例:
 * ```tsx
 * <ErrorDisplay
 *   error={{
 *     message: '网络连接失败',
 *     type: 'network',
 *     recoverable: true
 *   }}
 *   onRetry={() => window.location.reload()}
 * />
 * ```
 */
export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  showDetails = false,
  style
}: ErrorDisplayProps) {
  // 兼容字符串类型的 error
  const errorInfo: ErrorInfo = typeof error === 'string'
    ? { message: error, type: 'unknown' }
    : error;

  const { message, type, details, stack, recoverable = true } = errorInfo;
  const title = getDefaultErrorTitle(type);
  const suggestions = getErrorRecovery(errorInfo);

  return (
    <div style={{ ...style }}>
      <Alert
        type="error"
        title={title}
        description={
          <Space vertical align="start" style={{ width: '100%' }}>
            {/* 错误消息 */}
            <Text>
              <strong>{getErrorIcon(type)} </strong>
              <Text type="tertiary">{message}</Text>
            </Text>

            {/* 恢复建议 */}
            {suggestions.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary" size="small">
                  💡 建议操作：
                </Text>
                <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>
                      <Text type="secondary" size="small">
                        {suggestion}
                      </Text>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 操作按钮 */}
            {recoverable && onRetry && (
              <div style={{ marginTop: '12px' }}>
                <Button
                  type="primary"
                  size="small"
                  icon={<IconRefresh />}
                  onClick={onRetry}
                >
                  重试
                </Button>
                {onDismiss && (
                  <Button
                    size="small"
                    style={{ marginLeft: '8px' }}
                    onClick={onDismiss}
                  >
                    关闭
                  </Button>
                )}
              </div>
            )}

            {/* 详细信息（默认折叠） */}
            {showDetails && (details || stack) && (
              <Collapse
                style={{ marginTop: '12px' }}
                defaultActiveKey={[]}
              >
                {details && (
                  <Collapse.Panel header="详细信息" itemKey="details">
                    <Paragraph
                      style={{
                        padding: '12px',
                        backgroundColor: 'var(--semi-color-fill-0)',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {details}
                      </pre>
                    </Paragraph>
                  </Collapse.Panel>
                )}
                {stack && (
                  <Collapse.Panel header="错误堆栈" itemKey="stack">
                    <Paragraph
                      style={{
                        padding: '12px',
                        backgroundColor: 'var(--semi-color-fill-0)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        maxHeight: '200px',
                        overflow: 'auto'
                      }}
                    >
                      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {stack}
                      </pre>
                    </Paragraph>
                  </Collapse.Panel>
                )}
              </Collapse>
            )}
          </Space>
        }
        closable={!!onDismiss}
        onClose={onDismiss}
      />
    </div>
  );
}

/**
 * 错误边界组件（捕获 React 组件错误）
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // 记录错误到控制台（生产环境应该发送到日志服务）
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // 使用自定义 fallback 或默认错误显示
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{ padding: '24px' }}>
          <ErrorDisplay
            error={{
              message: '页面渲染出错',
              type: 'unknown',
              details: this.state.error?.message,
              stack: this.state.errorInfo?.componentStack,
              recoverable: true
            }}
            onRetry={this.handleReset}
            showDetails={true}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HTTP 错误解析工具
 */
export function parseHttpError(error: any): ErrorInfo {
  // Axios 或 fetch 错误
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 401:
        return {
          message: '登录已过期，请重新登录',
          code: '401',
          type: 'auth',
          recoverable: true,
          details: data?.detail || data?.message
        };
      case 403:
        return {
          message: '权限不足，无法访问此资源',
          code: '403',
          type: 'permission',
          recoverable: false,
          details: data?.detail || data?.message
        };
      case 404:
        return {
          message: '请求的资源不存在',
          code: '404',
          type: 'unknown',
          recoverable: false,
          details: data?.detail || data?.message
        };
      case 422:
        return {
          message: '输入数据验证失败',
          code: '422',
          type: 'validation',
          recoverable: true,
          details: typeof data === 'string' ? data : JSON.stringify(data)
        };
      case 500:
      case 502:
      case 503:
        return {
          message: '服务器暂时无法响应',
          code: String(status),
          type: 'server',
          recoverable: true,
          details: data?.detail || data?.message || '请稍后重试'
        };
      default:
        return {
          message: data?.message || data?.detail || `HTTP ${status} 错误`,
          code: String(status),
          type: 'unknown',
          recoverable: true
        };
    }
  }

  // 网络错误
  if (error.message?.includes('Network Error') || error.message?.includes('fetch')) {
    return {
      message: '网络连接失败，请检查网络设置',
      type: 'network',
      recoverable: true
    };
  }

  // 超时错误
  if (error.message?.includes('timeout')) {
    return {
      message: '请求超时，请稍后重试',
      type: 'network',
      recoverable: true
    };
  }

  // 通用错误
  return {
    message: error.message || '未知错误',
    type: 'unknown',
    recoverable: true,
    details: error.stack
  };
}

/**
 * API 错误处理 Hook
 */
export function useErrorHandler() {
  const handleError = (error: any, context?: string) => {
    const errorInfo = parseHttpError(error);

    // 添加上下文信息
    if (context) {
      errorInfo.details = `[${context}] ${errorInfo.details || ''}`;
    }

    // 记录错误
    console.error('API Error:', errorInfo);

    return errorInfo;
  };

  return { handleError, parseHttpError };
}

export default ErrorDisplay;
