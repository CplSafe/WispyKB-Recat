import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, Typography } from 'antd';
import { useState, useEffect } from 'react';
import {
  HomeOutlined,
  DatabaseOutlined,
  RobotOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  SafetyOutlined,
  KeyOutlined,
  UsergroupAddOutlined,
  SecurityScanOutlined,
  BuildOutlined,
  HistoryOutlined,
  ControlOutlined,
  ApiOutlined,
  CloudServerOutlined,
  LockOutlined,
  DatabaseOutlined as VectorOutlined,
  AppstoreOutlined,
  BranchesOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../../store';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

// 系统管理菜单项
const SYSTEM_ADMIN_ITEMS = [
  { key: '/admin/users', icon: <UsergroupAddOutlined />, label: '用户管理' },
  { key: '/admin/roles', icon: <SecurityScanOutlined />, label: '角色管理' },
  { key: '/admin/departments', icon: <BuildOutlined />, label: '部门管理' },
  { key: '/admin/audit', icon: <HistoryOutlined />, label: '审计日志' },
  { key: '/admin/system', icon: <ControlOutlined />, label: '系统配置' },
  { key: '/admin/mcp', icon: <AppstoreOutlined />, label: 'MCP 配置' },
  { key: '/admin/integrations', icon: <CloudServerOutlined />, label: '集成配置' },
  { key: '/admin/security', icon: <LockOutlined />, label: '安全设置' },
  { key: '/admin/api', icon: <ApiOutlined />, label: 'API 设置' },
  { key: '/admin/vector-store', icon: <VectorOutlined />, label: '向量存储' },
];

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    sidebarCollapsed,
    toggleSidebar,
    clear,
    systemConfig,
  } = useAppStore();

  // 菜单展开状态
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  // 工作流页面全屏显示
  const isWorkflowPage = location.pathname === '/workflow' || location.pathname.startsWith('/workflow');

  // 当路径变化时更新展开状态
  useEffect(() => {
    // 当进入系统管理子页面时自动展开菜单
    if (location.pathname.startsWith('/admin/')) {
      setOpenKeys(['system-admin']);
    } else {
      setOpenKeys([]);
    }
  }, [location.pathname]);

  // 获取当前选中的菜单key
  const getSelectedKey = () => {
    const path = location.pathname;
    // 精确匹配
    if (path === '/' || path === '/dashboard') return '/';
    if (path === '/knowledge') return '/knowledge';
    if (path === '/apps') return '/apps';
    if (path.startsWith('/apps/')) return '/apps';
    if (path === '/workflow') return '/workflow';
    if (path === '/settings') return '/settings';
    // 系统管理子菜单
    if (SYSTEM_ADMIN_ITEMS.some(item => path === item.key)) {
      return path;
    }
    return path;
  };

  // 主菜单项
  const mainMenuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '仪表盘',
    },
    {
      key: '/knowledge',
      icon: <DatabaseOutlined />,
      label: '知识库',
    },
    {
      key: '/apps',
      icon: <RobotOutlined />,
      label: 'AI 应用',
    },
    {
      key: '/workflow',
      icon: <BranchesOutlined />,
      label: '工作流编排',
    },
  ];

  // 系统管理菜单（仅超级管理员可见）
  const systemAdminMenuItem = user?.role === 'super_admin' ? [
    {
      key: 'system-admin',
      icon: <SettingOutlined />,
      label: '系统管理',
      children: SYSTEM_ADMIN_ITEMS,
    },
  ] : [];

  const allMenuItems = [...mainMenuItems, ...systemAdminMenuItem];

  // 用户下拉菜单
  const userDropdownItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/settings'),
    },
    {
      key: 'security',
      icon: <SafetyOutlined />,
      label: '安全设置',
      onClick: () => navigate('/settings'),
    },
    {
      key: 'api',
      icon: <KeyOutlined />,
      label: 'API 设置',
      onClick: () => navigate('/settings'),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        clear();
        localStorage.removeItem('access_token');
        sessionStorage.removeItem('access_token');
        navigate('/login');
      },
    },
  ];

  const userInitials = user?.username
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <Layout style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      {/* 左侧边栏 - 工作流页面隐藏 */}
      {!isWorkflowPage && (
        <div
          style={{
            width: sidebarCollapsed ? 80 : 240,
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            background: '#FFFFFF',
            borderRight: '1px solid #E2E8F0',
            boxShadow: '2px 0 8px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            transition: 'width 0.2s',
          }}
        >
        {/* Logo 区域 */}
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            padding: sidebarCollapsed ? 0 : '0 20px',
            borderBottom: '1px solid #E2E8F0',
            cursor: 'pointer',
            flexShrink: 0,
          }}
          onClick={() => navigate('/')}
        >
          {systemConfig?.logo ? (
            <img
              src={systemConfig.logo}
              alt="LOGO"
              style={{ height: 32, objectFit: 'contain', flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: `linear-gradient(135deg, ${systemConfig?.primaryColor || '#2563EB'} 0%, ${systemConfig?.primaryColor || '#2563EB'}dd 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <DatabaseOutlined style={{ color: 'white', fontSize: 16 }} />
            </div>
          )}
          {!sidebarCollapsed && (
            <Text strong style={{ marginLeft: 12, fontSize: 15, color: '#1E293B' }}>
              {systemConfig?.siteName || 'AI 知识库'}
            </Text>
          )}
        </div>

        {/* 可滚动的菜单区域 */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            openKeys={openKeys}
            onOpenChange={setOpenKeys}
            onClick={(e) => {
              const key = e.key as string;
              // 主菜单项和系统管理子菜单项都进行导航
              if (key.startsWith('/')) {
                navigate(key);
              }
            }}
            style={{
              borderRight: 0,
              background: 'transparent',
              padding: sidebarCollapsed ? '16px 0' : '16px',
            }}
            items={allMenuItems}
          />
        </div>

        {/* 用户区域 - 固定在底部 */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #E2E8F0',
            background: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          <Dropdown menu={{ items: userDropdownItems }} placement="topLeft" trigger={['click']}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F1F5F9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Avatar
                size={28}
                src={
                  user?.avatar
                    ? user.avatar.startsWith('http')
                      ? user.avatar
                      : `${window.location.origin}${user.avatar}`
                    : undefined
                }
                style={{ backgroundColor: '#2563EB', flexShrink: 0, fontSize: 12 }}
              >
                {!user?.avatar && userInitials}
              </Avatar>
              {!sidebarCollapsed && (
                <Text
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontSize: 13,
                    color: '#475569',
                    fontWeight: 500,
                  }}
                >
                  {user?.username || '未登录'}
                </Text>
              )}
            </div>
          </Dropdown>
        </div>
      </div>
      )}

      {/* 主内容区域 */}
      <Layout
        style={{
          marginLeft: isWorkflowPage ? 0 : (sidebarCollapsed ? 80 : 240),
          transition: 'margin-left 0.2s',
        }}
      >
        {/* 顶部 Header - 工作流页面隐藏 */}
        {!isWorkflowPage && (
          <Header
            style={{
              height: 56,
              padding: '0 20px',
              background: '#FFFFFF',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Button
              type="text"
              icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleSidebar}
              style={{ fontSize: 14, width: 36, height: 36, color: '#64748B' }}
            />
          </Header>
        )}

        {/* 内容区域 */}
        <Content
          style={{
            padding: isWorkflowPage ? 0 : '24px',
            background: isWorkflowPage ? '#fff' : '#F8FAFC',
            overflow: isWorkflowPage ? 'hidden' : 'auto',
            height: isWorkflowPage ? '100vh' : 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
