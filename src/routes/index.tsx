import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from '../store';
import LoginPage from '../pages/LoginPage';
import MainLayout from '../components/layout/MainLayout';
import DashboardPage from '../pages/DashboardPage';
import KnowledgePage from '../pages/KnowledgePage';
import AppsPage from '../pages/AppsPage';
import SettingsPage from '../pages/SettingsPage';
import KnowledgeDocumentsPage from '../pages/KnowledgeDocumentsPage';
import AppDetailPage from '../pages/AppDetailPage';
import AppAnalyticsPage from '../pages/AppAnalyticsPage';
import NewAppPage from '../pages/NewAppPage';
import { Editor } from '../flowgram/editor';
import SharePage from '../pages/SharePage';
import UsersPage from '../pages/admin/UsersPage';
import RolesPage from '../pages/admin/RolesPage';
import DepartmentsPage from '../pages/admin/DepartmentsPage';
import AuditLogPage from '../pages/admin/AuditLogPage';
import SystemConfigPage from '../pages/admin/SystemConfigPage';
import MCPPage from '../pages/admin/MCPPage';
import IntegrationsPage from '../pages/admin/IntegrationsPage';
import SecurityPage from '../pages/admin/SecurityPage';
import APIPage from '../pages/admin/APIPage';
import VectorStorePage from '../pages/admin/VectorStorePage';

// Token 验证函数（提取出来避免重复）
const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp;
    if (exp) {
      // 检查是否过期
      return exp >= Date.now() / 1000;
    }
    return true;
  } catch {
    return false;
  }
};

// 保护路由组件
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAppStore((state) => state.token);

  if (!token || !isTokenValid(token)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// 公共路由（不需要认证）
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAppStore((state) => state.token);

  // 如果有有效的 token，重定向到首页
  if (token && isTokenValid(token)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* 登录页面 */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* 分享页面 - 公开访问，不需要登录 */}
      <Route path="/share/:id" element={<SharePage />} />

      {/* 工作流页面 - 独立路由，不受 MainLayout 影响 */}
      <Route
        path="/workflow"
        element={
          <ProtectedRoute>
            <Editor />
          </ProtectedRoute>
        }
      />

      {/* 主应用路由 */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="knowledge" element={<KnowledgePage />} />
        <Route path="apps" element={<AppsPage />} />
        <Route path="apps/new" element={<NewAppPage />} />
        <Route path="apps/:id" element={<AppDetailPage />} />
        <Route path="apps/:id/analytics" element={<AppAnalyticsPage />} />
        <Route path="knowledge/:id/documents" element={<KnowledgeDocumentsPage />} />
        <Route path="settings/*" element={<SettingsPage />} />

        {/* Admin Routes */}
        <Route path="admin/users" element={<UsersPage />} />
        <Route path="admin/roles" element={<RolesPage />} />
        <Route path="admin/departments" element={<DepartmentsPage />} />
        <Route path="admin/audit" element={<AuditLogPage />} />
        <Route path="admin/system" element={<SystemConfigPage />} />
        <Route path="admin/mcp" element={<MCPPage />} />
        <Route path="admin/integrations" element={<IntegrationsPage />} />
        <Route path="admin/security" element={<SecurityPage />} />
        <Route path="admin/api" element={<APIPage />} />
        <Route path="admin/vector-store" element={<VectorStorePage />} />
      </Route>

      {/* 404 重定向 - 只在开发模式下，其他路径让代理处理 */}
      {import.meta.env.DEV ? (
        <Route path="*" element={<Navigate to="/" replace />} />
      ) : (
        <Route path="*" element={<Navigate to="/" replace />} />
      )}
    </Routes>
  );
}

export default AppRoutes;
