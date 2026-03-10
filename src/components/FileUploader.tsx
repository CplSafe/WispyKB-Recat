import { useState, useCallback } from 'react';
import { Progress, Button, Tag, Toast, Space, Typography } from '@douyinfe/semi-ui';
import { IconClose, IconRefresh, IconTickCircle, IconAlertTriangle } from '@douyinfe/semi-icons';

const { Text } = Typography;

interface UploadFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  speed?: string; // 上传速度
  remaining?: string; // 剩余时间
  loaded?: number; // 已上传字节数
  total?: number; // 总字节数
  abortController?: AbortController;
}

interface FileUploaderProps {
  files: File[];
  onUploadComplete?: () => void;
  onError?: (error: string) => void;
}

export function useFileUploader() {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // 格式化文件大小
  const formatSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }, []);

  // 格式化时间
  const formatTime = useCallback((seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}秒`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}分钟`;
    return `${Math.round(seconds / 3600)}小时`;
  }, []);

  // 计算上传速度和剩余时间
  const calculateSpeed = useCallback((
    loaded: number,
    total: number,
    startTime: number,
    currentTime: number
  ): { speed: string; remaining: string } => {
    const elapsed = (currentTime - startTime) / 1000; // 秒
    if (elapsed <= 0) return { speed: '-', remaining: '-' };

    const speed = loaded / elapsed; // 字节/秒
    const remaining = (total - loaded) / speed; // 剩余秒数

    return {
      speed: formatSize(speed) + '/s',
      remaining: formatTime(remaining)
    };
  }, [formatSize, formatTime]);

  // 上传单个文件
  const uploadSingleFile = useCallback(async (
    uploadFile: UploadFile,
    apiUrl: string,
    token: string,
    kbId: string
  ): Promise<void> => {
    const { file, abortController } = uploadFile;

    const formData = new FormData();
    formData.append('file', file);

    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // 监听上传进度
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          const { speed, remaining } = calculateSpeed(
            e.loaded,
            e.total,
            startTime,
            Date.now()
          );

          setUploadFiles(prev => prev.map(f =>
            f.file.name === file.name
              ? {
                  ...f,
                  progress,
                  loaded: e.loaded,
                  total: e.total,
                  speed,
                  remaining
                }
              : f
          ));
        }
      });

      // 监听完成事件
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          setUploadFiles(prev => prev.map(f =>
            f.file.name === file.name
              ? { ...f, status: 'success', progress: 100 }
              : f
          ));
          resolve();
        } else {
          const error = xhr.responseText || '上传失败';
          setUploadFiles(prev => prev.map(f =>
            f.file.name === file.name
              ? { ...f, status: 'error', error }
              : f
          ));
          reject(new Error(error));
        }
      });

      // 监听错误事件
      xhr.addEventListener('error', () => {
        const error = '网络错误，上传失败';
        setUploadFiles(prev => prev.map(f =>
          f.file.name === file.name
            ? { ...f, status: 'error', error }
            : f
        ));
        reject(new Error(error));
      });

      // 监听取消事件
      xhr.addEventListener('abort', () => {
        setUploadFiles(prev => prev.map(f =>
          f.file.name === file.name
            ? { ...f, status: 'pending', progress: 0 }
            : f
        ));
        reject(new Error('上传已取消'));
      });

      // 设置取消信号
      if (abortController) {
        abortController.signal.addEventListener('abort', () => {
          xhr.abort();
        });
      }

      xhr.open('POST', `${apiUrl}/api/v1/knowledge-bases/${kbId}/documents/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  }, [calculateSpeed]);

  // 开始上传
  const startUpload = useCallback(async (files: File[], kbId: string) => {
    if (files.length === 0) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8888';
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

    // 初始化上传文件列表
    const initialUploadFiles: UploadFile[] = files.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
      abortController: new AbortController()
    }));

    setUploadFiles(initialUploadFiles);
    setIsUploading(true);

    // 逐个上传
    for (let i = 0; i < initialUploadFiles.length; i++) {
      const uploadFile = initialUploadFiles[i];

      // 更新状态为上传中
      setUploadFiles(prev => prev.map((f, idx) =>
        idx === i ? { ...f, status: 'uploading' as const } : f
      ));

      try {
        await uploadSingleFile(uploadFile, API_URL, token, kbId);
      } catch (error) {
        // 继续上传下一个文件
        console.error(`Upload failed for ${uploadFile.file.name}:`, error);
      }
    }

    setIsUploading(false);

    // 检查是否全部成功
    const successCount = uploadFiles.filter(f => f.status === 'success').length;
    const errorCount = uploadFiles.filter(f => f.status === 'error').length;

    if (errorCount === 0) {
      Toast.success(`成功上传 ${successCount} 个文件`);
    } else if (successCount > 0) {
      Toast.warning(`${successCount} 个文件上传成功，${errorCount} 个文件失败`);
    } else {
      Toast.error('所有文件上传失败');
    }
  }, [uploadSingleFile, uploadFiles]);

  // 取消单个文件上传
  const cancelUpload = useCallback((fileName: string) => {
    setUploadFiles(prev => {
      const file = prev.find(f => f.file.name === fileName);
      if (file?.abortController) {
        file.abortController.abort();
      }
      return prev.map(f =>
        f.file.name === fileName
          ? { ...f, status: 'pending' as const, progress: 0 }
          : f
      );
    });
  }, []);

  // 重试上传
  const retryUpload = useCallback(async (fileName: string, kbId: string) => {
    const file = uploadFiles.find(f => f.file.name === fileName);
    if (!file) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8888';
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

    setUploadFiles(prev => prev.map(f =>
      f.file.name === fileName
        ? { ...f, status: 'uploading' as const, progress: 0, error: undefined }
        : f
    ));

    try {
      await uploadSingleFile(file, API_URL, token, kbId);
      Toast.success(`${fileName} 上传成功`);
    } catch (error) {
      Toast.error(`${fileName} 上传失败`);
    }
  }, [uploadFiles, uploadSingleFile]);

  // 清空列表
  const clearUploadFiles = useCallback(() => {
    setUploadFiles([]);
  }, []);

  return {
    uploadFiles,
    isUploading,
    startUpload,
    cancelUpload,
    retryUpload,
    clearUploadFiles,
    formatSize,
    formatTime
  };
}

// 上传文件列表组件
export function UploadFileList({
  files,
  isUploading,
  onCancel,
  onRetry
}: {
  files: UploadFile[];
  isUploading: boolean;
  onCancel?: (fileName: string) => void;
  onRetry?: (fileName: string) => void;
}) {
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusTag = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return <Tag color="light-blue">等待中</Tag>;
      case 'uploading':
        return <Tag color="cyan">上传中</Tag>;
      case 'success':
        return <Tag color="green">成功</Tag>;
      case 'error':
        return <Tag color="red">失败</Tag>;
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {files.map((uploadFile, index) => (
        <div
          key={index}
          style={{
            padding: '12px',
            marginBottom: '8px',
            borderRadius: '8px',
            backgroundColor: 'var(--semi-color-fill-0)',
            border: '1px solid var(--semi-color-border)'
          }}
        >
          <Space vertical align="start" style={{ width: '100%' }}>
            {/* 文件名和状态 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Space>
                <Text strong>{uploadFile.file.name}</Text>
                <Text size="small" type="secondary">
                  ({formatSize(uploadFile.file.size)})
                </Text>
                {getStatusTag(uploadFile.status)}
              </Space>

              {/* 操作按钮 */}
              {uploadFile.status === 'uploading' && onCancel && (
                <Button
                  size="small"
                  type="tertiary"
                  icon={<IconClose />}
                  onClick={() => onCancel(uploadFile.file.name)}
                >
                  取消
                </Button>
              )}

              {uploadFile.status === 'error' && onRetry && (
                <Button
                  size="small"
                  type="primary"
                  icon={<IconRefresh />}
                  onClick={() => onRetry(uploadFile.file.name)}
                >
                  重试
                </Button>
              )}

              {uploadFile.status === 'success' && (
                <Button
                  size="small"
                  type="tertiary"
                  icon={<IconTickCircle />}
                  disabled
                >
                  已完成
                </Button>
              )}
            </div>

            {/* 进度条 */}
            {uploadFile.status !== 'pending' && (
              <Progress
                percent={uploadFile.progress}
                showInfo={true}
                size="small"
                stroke={
                  uploadFile.status === 'error' ? 'var(--semi-color-danger)' : undefined
                }
              />
            )}

            {/* 错误信息 */}
            {uploadFile.status === 'error' && uploadFile.error && (
              <Text type="danger" size="small">
                <IconAlertTriangle /> {uploadFile.error}
              </Text>
            )}

            {/* 上传速度和剩余时间 */}
            {uploadFile.status === 'uploading' && (
              <Space>
                <Text size="small" type="secondary">
                  速度: {uploadFile.speed || '-'}
                </Text>
                <Text size="small" type="secondary">
                  剩余: {uploadFile.remaining || '-'}
                </Text>
              </Space>
            )}
          </Space>
        </div>
      ))}
    </div>
  );
}
