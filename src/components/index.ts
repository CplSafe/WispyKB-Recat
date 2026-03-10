/**
 * 通用 UI 组件导出
 *
 * 使用示例:
 * ```tsx
 * import { PageLoading, ErrorDisplay, useFileUploader, ResponsiveContainer } from '@/components';
 * ```
 */

// 加载组件
export {
  PageLoading,
  FullScreenLoading,
  ButtonLoading,
  Skeleton,
} from "./PageLoading";
export { default as PageLoading } from "./PageLoading";

// 错误显示组件
export {
  ErrorDisplay,
  ErrorBoundary,
  parseHttpError,
  useErrorHandler,
} from "./ErrorDisplay";
export { default as ErrorDisplay } from "./ErrorDisplay";

// 通知组件
export {
  showToast,
  showNotification,
  notifySuccess,
  notifyError,
  notifyWarning,
  notifyInfo,
  notifySuccessImportant,
  notifyErrorImportant,
  withNotification,
  withBatchNotification,
  confirmDialog,
  showLoading,
} from "./Notification";
export { default as Notification } from "./Notification";

// 文件上传组件
export { useFileUploader, UploadFileList } from "./FileUploader";

// 响应式组件
export {
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveSpace,
  TouchButton,
  Visibility,
  ResponsiveText,
  ResponsiveCard,
} from "./Responsive";

// 性能优化组件
export {
  VirtualList,
  LazyImage,
  useDebounce,
  useThrottle,
  usePerformanceMonitor,
  SuspenseWrapper,
} from "./Performance";
