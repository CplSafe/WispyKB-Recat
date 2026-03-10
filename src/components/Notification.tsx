import { Toast, Notification } from '@douyinfe/semi-ui';
import {
  IconCheckCircleStroked,
  IconCloseCircleStroked,
  IconAlertTriangle,
  IconInfoStroked
} from '@douyinfe/semi-icons';

/**
 * 全局通知工具
 *
 * 提供统一的消息通知接口，支持 Toast 和 Notification 两种形式
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationOptions {
  type?: NotificationType;
  title?: string;
  content: string;
  duration?: number;
  onClose?: () => void;
}

/**
 * 显示 Toast 提示（轻量级，自动关闭）
 */
export function showToast(options: NotificationOptions): void {
  const { type = 'info', content, duration = 3, onClose } = options;

  switch (type) {
    case 'success':
      Toast.success({
        content,
        duration,
        onClose,
        icon: <IconCheckCircleStroked size="large" />
      });
      break;

    case 'error':
      Toast.error({
        content,
        duration,
        onClose,
        icon: <IconCloseCircleStroked size="large" />
      });
      break;

    case 'warning':
      Toast.warning({
        content,
        duration,
        onClose,
        icon: <IconAlertTriangle size="large" />
      });
      break;

    case 'info':
    default:
      Toast.info({
        content,
        duration,
        onClose,
        icon: <IconInfoStroked size="large" />
      });
      break;
  }
}

/**
 * 显示 Notification 通知（重要信息，需要用户确认）
 */
export function showNotification(options: NotificationOptions): void {
  const { type = 'info', title, content, duration = 0, onClose } = options;

  // Notification 默认不自动关闭（duration = 0），除非明确指定
  const autoClose = duration > 0;

  switch (type) {
    case 'success':
      Notification.success({
        title: title || '操作成功',
        content,
        duration: autoClose ? duration * 1000 : 0,
        onClose
      });
      break;

    case 'error':
      Notification.error({
        title: title || '操作失败',
        content,
        duration: autoClose ? duration * 1000 : 0,
        onClose
      });
      break;

    case 'warning':
      Notification.warning({
        title: title || '警告',
        content,
        duration: autoClose ? duration * 1000 : 0,
        onClose
      });
      break;

    case 'info':
    default:
      Notification.info({
        title: title || '提示',
        content,
        duration: autoClose ? duration * 1000 : 0,
        onClose
      });
      break;
  }
}

/**
 * 快捷方法
 */

// 成功提示
export const notifySuccess = (content: string, duration?: number) => {
  showToast({ type: 'success', content, duration });
};

// 错误提示
export const notifyError = (content: string, duration?: number) => {
  showToast({ type: 'error', content, duration });
};

// 警告提示
export const notifyWarning = (content: string, duration?: number) => {
  showToast({ type: 'warning', content, duration });
};

// 信息提示
export const notifyInfo = (content: string, duration?: number) => {
  showToast({ type: 'info', content, duration });
};

// 成功通知（重要）
export const notifySuccessImportant = (
  content: string,
  title?: string,
  onClose?: () => void
) => {
  showNotification({ type: 'success', title, content, onClose });
};

// 错误通知（重要）
export const notifyErrorImportant = (
  content: string,
  title?: string,
  onClose?: () => void
) => {
  showNotification({ type: 'error', title, content, onClose });
};

/**
 * 异步操作通知包装器
 *
 * 自动显示加载状态，并根据结果显示成功或失败提示
 *
 * @example
 * ```tsx
 * const handleSave = async () => {
 *   await withNotification(
 *     async () => {
 *       await api.saveData(data);
 *     },
 *     {
 *       loading: '正在保存...',
 *       success: '保存成功',
 *       error: '保存失败'
 *     }
 *   );
 * };
 * ```
 */
export async function withNotification<T>(
  asyncFn: () => Promise<T>,
  options: {
    loading?: string;
    success?: string;
    error?: string;
    onSuccess?: (result: T) => void;
    onError?: (error: any) => void;
  }
): Promise<T> {
  const { loading, success, error, onSuccess, onError } = options;

  // 显示加载提示
  const toastId = Toast.info({ content: loading || '处理中...', duration: 0 });

  try {
    const result = await asyncFn();

    // 关闭加载提示
    Toast.close(toastId);

    // 显示成功提示
    if (success) {
      notifySuccess(success);
    }

    // 调用成功回调
    onSuccess?.(result);

    return result;
  } catch (err) {
    // 关闭加载提示
    Toast.close(toastId);

    // 显示错误提示
    const errorMessage = error || err?.message || '操作失败';
    notifyError(errorMessage);

    // 调用错误回调
    onError?.(err);

    throw err;
  }
}

/**
 * 批量操作通知
 *
 * @example
 * ```tsx
 * await withBatchNotification(
 *   items.map(item => api.updateItem(item)),
 *   {
 *     success: '成功更新 {count} 个项目',
 *     error: '部分更新失败: {failed} 个'
 *   }
 * );
 * ```
 */
export async function withBatchNotification(
  promises: Promise<any>[],
  options: {
    loading?: string;
    success?: string;
    error?: string;
  }
): Promise<void> {
  const { loading = '批量处理中...', success, error } = options;

  const toastId = Toast.info({ content: loading, duration: 0 });

  try {
    const results = await Promise.allSettled(promises);

    // 统计结果
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    Toast.close(toastId);

    if (failed === 0) {
      // 全部成功
      const message = success?.replace('{count}', String(succeeded)) || `成功完成 ${succeeded} 项操作`;
      notifySuccessImportant(message, '批量操作完成');
    } else if (succeeded === 0) {
      // 全部失败
      const message = error?.replace('{failed}', String(failed)) || `${failed} 项操作失败`;
      notifyErrorImportant(message, '批量操作失败');
    } else {
      // 部分成功
      const message = `完成 ${succeeded} 项，失败 ${failed} 项`;
      notifyWarning(message);
    }
  } catch (err) {
    Toast.close(toastId);
    notifyError('批量处理出错');
    throw err;
  }
}

/**
 * 确认对话框
 *
 * @example
 * ```tsx
 * const confirmed = await confirmDialog({
 *   title: '确认删除',
 *   content: '删除后无法恢复，确定要删除吗？',
 *   type: 'warning'
 * });
 *
 * if (confirmed) {
 *   // 执行删除操作
 * }
 * ```
 */
export async function confirmDialog(options: {
  title?: string;
  content: string;
  type?: 'warning' | 'danger';
  confirmText?: string;
  cancelText?: string;
}): Promise<boolean> {
  const { Modal } = await import('@douyinfe/semi-ui');

  return new Promise((resolve) => {
    Modal.confirm({
      title: options.title || '确认操作',
      content: options.content,
      okText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      okButtonProps: options.type === 'danger' ? { type: 'danger' } : undefined,
      onOk: () => resolve(true),
      onCancel: () => resolve(false)
    });
  });
}

/**
 * 加载通知（返回一个关闭函数）
 *
 * @example
 * ```tsx
 * const closeLoading = showLoading('正在上传...');
 * try {
 *   await uploadFile();
 * } finally {
 *   closeLoading();
 * }
 * ```
 */
export function showLoading(content: string = '加载中...'): () => void {
  const toastId = Toast.info({ content, duration: 0 });

  return () => Toast.close(toastId);
}

/**
 * 默认导出
 */
export default {
  toast: showToast,
  notification: showNotification,
  success: notifySuccess,
  error: notifyError,
  warning: notifyWarning,
  info: notifyInfo,
  withNotification,
  withBatchNotification,
  confirmDialog,
  showLoading
};
