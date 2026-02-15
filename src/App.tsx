import { BrowserRouter, useLocation } from 'react-router-dom';
import AppRoutes from './routes';
import { useAppStore } from './store';
import { useEffect } from 'react';
import api from './lib/api';
import { LocaleProvider, Spin } from '@douyinfe/semi-ui';
import zh_CN from '@douyinfe/semi-ui/lib/es/locale/source/zh_CN';
import en_US from '@douyinfe/semi-ui/lib/es/locale/source/en_US';

const LOCALE_MAP = { zh_CN, en_US } as const;

// 需要被代理到后端的路径（不包括 /share，由 React Router 处理）
const PROXY_PATHS = ['/static', '/api', '/embed', '/health', '/ws', '/files'];

// 检查是否是需要代理的路径
function isProxyPath(pathname: string) {
  return PROXY_PATHS.some(path => pathname.startsWith(path));
}

// 路由内容组件
function AppContent() {
  const { setUser, setToken, setSystemConfig } = useAppStore();
  const location = useLocation();

  useEffect(() => {
    if (isProxyPath(location.pathname)) {
      window.location.href = window.location.href;
      return;
    }

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

  if (isProxyPath(location.pathname)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return <AppRoutes />;
}

function App() {
  const { locale } = useAppStore();
  const semiLocale = LOCALE_MAP[locale] || zh_CN;

  return (
    <LocaleProvider locale={semiLocale}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </LocaleProvider>
  );
}

export default App;
