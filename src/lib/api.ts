import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8888';

// 创建一个自定义的 axios 实例类型，其方法返回 data 而不是 AxiosResponse
type UnwrappedAxiosInstance = Omit<AxiosInstance, 'get' | 'post' | 'put' | 'delete' | 'patch'> & {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => Promise<T>;
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<T>;
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<T>;
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => Promise<T>;
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<T>;
  request: <T = any>(config: AxiosRequestConfig) => Promise<T>;
};

const rawApi = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const api = rawApi as UnwrappedAxiosInstance;

// 标记是否正在处理登出，避免重复跳转
let isLoggingOut = false;

// Request interceptor
rawApi.interceptors.request.use(
  (config) => {
    // 登录接口不需要添加 Authorization 头
    const isLoginRequest = config.url === '/auth/login' || config.url?.includes('/auth/login');

    if (!isLoginRequest) {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
          : null;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - 自动返回 response.data
rawApi.interceptors.response.use(
  (response) => {
    // 成功响应时重置登出标志
    isLoggingOut = false;
    return response.data;
  },
  async (error) => {
    // 处理 401 未授权错误
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // 避免重复处理
      if (!isLoggingOut) {
        isLoggingOut = true;
        console.warn('401 Unauthorized, clearing token and redirecting to login');
        // 清除所有存储
        localStorage.removeItem('access_token');
        localStorage.removeItem('token');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('token');
        // 清除 zustand persist 存储
        localStorage.removeItem('app-storage');
        // 使用 replace 跳转到登录页
        window.location.replace('/login');
      }
      return new Promise(() => {});
    }

    // 处理其他错误，提取友好的错误消息
    const errorMessage = error.response?.data?.detail || error.message || '请求失败';
    return Promise.reject(errorMessage);
  }
);

export default api;
