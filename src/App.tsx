import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter, useLocation } from 'react-router-dom';
import AppRoutes from './routes';
import { useAppStore } from './store';
import { useEffect } from 'react';
import api from './lib/api';
import './App.css';

// 需要被代理到后端的路径（不包括 /share，由 React Router 处理）
const PROXY_PATHS = ['/static', '/api', '/embed', '/health', '/ws', '/files'];

// 检查是否是需要代理的路径
function isProxyPath(pathname: string) {
  return PROXY_PATHS.some(path => pathname.startsWith(path));
}

// 检查是否是 workflow 页面（需要隔离，避免 Ant Design ConfigProvider 影响 Semi-UI）
function isWorkflowPage(pathname: string) {
  return pathname.startsWith('/workflow');
}

// 路由内容组件，根据路径决定是否使用 Ant Design ConfigProvider
function AppContent() {
  const { setUser, setToken, setSystemConfig } = useAppStore();
  const location = useLocation();
  const isWorkflow = isWorkflowPage(location.pathname);

  useEffect(() => {
    // 如果是代理路径，直接跳转到后端 URL
    if (isProxyPath(location.pathname)) {
      window.location.href = window.location.href;
      return;
    }

    // 加载系统配置
    const loadSystemConfig = async () => {
      try {
        const config = await api.get('/system/config');
        setSystemConfig({
          siteName: config.site_name || 'AI 知识库',
          siteTitle: config.site_title || 'AI Knowledge Base',
          logo: config.logo || '',
          favicon: config.favicon || '',
          primaryColor: config.primary_color || '#2563EB',
          theme: config.theme || 'light',
        });
      } catch (error) {
        console.error('Failed to load system config:', error);
      }
    };

    // 加载用户信息
    const loadUserInfo = async () => {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) return;

      try {
        const user = await api.get('/user/me');
        setUser(user);
        setToken(token);
      } catch (error) {
        console.error('Failed to load user info:', error);
      }
    };

    loadSystemConfig();
    loadUserInfo();
  }, [setSystemConfig, setUser, setToken, location.pathname]);

  // 如果是代理路径，显示加载中
  if (isProxyPath(location.pathname)) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#666'
      }}>
        正在加载...
      </div>
    );
  }

  // Workflow 页面不使用 Ant Design ConfigProvider，避免与 Semi-UI 冲突
  if (isWorkflow) {
    return <AppRoutes />;
  }

  // 其他页面使用 Ant Design ConfigProvider
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#2563EB',
          borderRadius: 8,
        },
      }}
    >
      <AppRoutes />
    </ConfigProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
