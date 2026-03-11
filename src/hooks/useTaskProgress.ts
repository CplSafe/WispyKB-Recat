import { useState, useEffect, useCallback, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8888';

export interface TaskProgress {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  message: string;
  result?: Record<string, unknown>;
  error?: string;
}

interface UseTaskProgressOptions {
  /** SSE 连接失败后自动重试次数，默认 3 */
  maxRetries?: number;
  /** 任务完成/失败后的回调 */
  onComplete?: (task: TaskProgress) => void;
  onFailed?: (task: TaskProgress) => void;
  onProgress?: (task: TaskProgress) => void;
}

/**
 * SSE 实时任务进度追踪 Hook
 *
 * 用法:
 * ```tsx
 * const { tasks, trackTask, removeTask, isAnyActive } = useTaskProgress({
 *   onComplete: (t) => Toast.success(`${t.taskId} 完成`),
 * });
 * ```
 */
export function useTaskProgress(options: UseTaskProgressOptions = {}) {
  const { maxRetries = 3, onComplete, onFailed, onProgress } = options;

  const [tasks, setTasks] = useState<Record<string, TaskProgress>>({});
  const eventSourcesRef = useRef<Record<string, EventSource>>({});
  const retriesRef = useRef<Record<string, number>>({});
  // 存回调引用，避免 effect 重跑
  const callbacksRef = useRef({ onComplete, onFailed, onProgress });
  callbacksRef.current = { onComplete, onFailed, onProgress };

  const updateTask = useCallback((taskId: string, update: Partial<TaskProgress>) => {
    setTasks(prev => {
      const existing = prev[taskId];
      if (!existing) return prev;
      return { ...prev, [taskId]: { ...existing, ...update } };
    });
  }, []);

  const closeStream = useCallback((taskId: string) => {
    const es = eventSourcesRef.current[taskId];
    if (es) {
      es.close();
      delete eventSourcesRef.current[taskId];
    }
  }, []);

  /** 开始追踪一个任务 */
  const trackTask = useCallback((taskId: string) => {
    // 已在追踪则忽略
    if (eventSourcesRef.current[taskId]) return;

    // 初始化任务状态
    setTasks(prev => ({
      ...prev,
      [taskId]: {
        taskId,
        status: 'pending',
        progress: 0,
        message: '等待处理...',
      },
    }));
    retriesRef.current[taskId] = 0;

    const connect = () => {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      // EventSource 不支持自定义 header，通过 query param 传 token
      const url = `${API_URL}/api/v1/tasks/${taskId}/stream?token=${encodeURIComponent(token || '')}`;
      const es = new EventSource(url);
      eventSourcesRef.current[taskId] = es;

      es.addEventListener('progress', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          const taskUpdate: Partial<TaskProgress> = {
            status: data.status || 'processing',
            progress: data.progress ?? 0,
            message: data.message || '',
            result: data.result,
            error: data.error,
          };
          updateTask(taskId, taskUpdate);
          callbacksRef.current.onProgress?.({
            taskId,
            status: data.status || 'processing',
            progress: data.progress ?? 0,
            message: data.message || '',
            result: data.result,
            error: data.error,
          });
        } catch {
          // ignore parse errors
        }
      });

      es.addEventListener('completed', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          const completed: TaskProgress = {
            taskId,
            status: 'completed',
            progress: 100,
            message: data.message || '处理完成',
            result: data.result,
          };
          updateTask(taskId, completed);
          callbacksRef.current.onComplete?.(completed);
        } catch {
          updateTask(taskId, { status: 'completed', progress: 100, message: '处理完成' });
        }
        closeStream(taskId);
      });

      es.addEventListener('failed', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          const failed: TaskProgress = {
            taskId,
            status: 'failed',
            progress: data.progress ?? 0,
            message: data.message || '处理失败',
            error: data.error,
          };
          updateTask(taskId, failed);
          callbacksRef.current.onFailed?.(failed);
        } catch {
          updateTask(taskId, { status: 'failed', message: '处理失败' });
        }
        closeStream(taskId);
      });

      es.addEventListener('cancelled', () => {
        updateTask(taskId, { status: 'cancelled', message: '已取消' });
        closeStream(taskId);
      });

      es.addEventListener('error', (_e: MessageEvent) => {
        updateTask(taskId, { status: 'failed', message: '任务不存在' });
        closeStream(taskId);
      });

      es.onerror = () => {
        closeStream(taskId);
        const retries = retriesRef.current[taskId] ?? 0;
        if (retries < maxRetries) {
          retriesRef.current[taskId] = retries + 1;
          // 指数退避重连
          setTimeout(connect, Math.min(1000 * 2 ** retries, 8000));
        } else {
          updateTask(taskId, { status: 'failed', message: '连接已断开' });
        }
      };
    };

    connect();
  }, [maxRetries, updateTask, closeStream]);

  /** 从列表中移除已完成的任务 */
  const removeTask = useCallback((taskId: string) => {
    closeStream(taskId);
    setTasks(prev => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
    delete retriesRef.current[taskId];
  }, [closeStream]);

  /** 清除所有已完成/失败任务 */
  const clearFinished = useCallback(() => {
    setTasks(prev => {
      const next: Record<string, TaskProgress> = {};
      for (const [id, t] of Object.entries(prev)) {
        if (t.status === 'pending' || t.status === 'processing') {
          next[id] = t;
        } else {
          closeStream(id);
          delete retriesRef.current[id];
        }
      }
      return next;
    });
  }, [closeStream]);

  /** 是否有正在进行的任务 */
  const isAnyActive = Object.values(tasks).some(
    t => t.status === 'pending' || t.status === 'processing'
  );

  /** 活跃任务列表 */
  const activeTasks = Object.values(tasks).filter(
    t => t.status === 'pending' || t.status === 'processing'
  );

  /** 总体进度 (0-100) */
  const overallProgress = (() => {
    const all = Object.values(tasks);
    if (all.length === 0) return 0;
    return Math.round(all.reduce((sum, t) => sum + t.progress, 0) / all.length);
  })();

  // 组件卸载时关闭所有 SSE 连接
  useEffect(() => {
    return () => {
      for (const taskId of Object.keys(eventSourcesRef.current)) {
        const es = eventSourcesRef.current[taskId];
        es?.close();
      }
      eventSourcesRef.current = {};
    };
  }, []);

  return {
    tasks,
    trackTask,
    removeTask,
    clearFinished,
    isAnyActive,
    activeTasks,
    overallProgress,
  };
}
