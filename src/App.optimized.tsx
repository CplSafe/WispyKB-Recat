import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastConfigProvider } from '@douyinfe/semi-ui';

// 导入新的 UI 组件
import { ErrorBoundary } from '@/components';

// 导入页面组件
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import KnowledgePage from './pages/KnowledgePage';
import KnowledgeDocumentsPage from './pages/KnowledgeDocumentsPage';
import SettingsPage from './pages/SettingsPage';
import SharePage from './pages/SharePage';
import AppsPage from './pages/AppsPage';

/**
 * 优化后的 App 组件
 *
 * 主要改进：
 * 1. 添加 ErrorBoundary 捕获组件错误
 * 2. 配置 Toast 全局属性
 * 3. 统一错误处理
 */
function App() {
  return (
    <ToastConfigProvider
      duration={3}
      position="top"
      motion={true}
    >
      <ErrorBoundary
        onError={(error, errorInfo) => {
          // 全局错误处理
          console.error('Global error caught:', error);
          console.error('Component stack:', errorInfo.componentStack);

          // TODO: 发送错误到日志服务
          // logErrorToService(error, errorInfo);
        }}
      >
        <BrowserRouter>
          <Routes>
            {/* 公开路由 */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/share/:token" element={<SharePage />} />

            {/* 受保护路由 */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
            <Route path="/knowledge/:id" element={<KnowledgeDocumentsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/apps" element={<AppsPage />} />

            {/* 404 页面 */}
            <Route
              path="*"
              element={
                <div style={{ padding: '24px', textAlign: 'center' }}>
                  <h2>404 - 页面不存在</h2>
                </div>
              }
            />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </ToastConfigProvider>
  );
}

export default App;
