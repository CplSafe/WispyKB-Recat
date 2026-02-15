import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Nav, Avatar, Dropdown, Typography, Button } from '@douyinfe/semi-ui';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  IconHome,
  IconArchive,
  IconServerStroked,
  IconSetting,
  IconExit,
  IconUser,
  IconSafe,
  IconKey,
  IconShield,
  IconHelm,
  IconClock,
  IconServer,
  IconCode,
  IconCloud,
  IconLock,

  IconLanguage,
} from '@douyinfe/semi-icons';
import { useAppStore } from '../../store';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    sidebarCollapsed,
    toggleSidebar,
    clear,
    systemConfig,
    locale,
    setLocale,
  } = useAppStore();

  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(['/']);

  const isWorkflowPage = location.pathname.startsWith('/workflow');

  // Sync selectedKeys and openKeys from route
  useEffect(() => {
    const path = location.pathname;
    let key = path;
    if (path === '/' || path === '/dashboard') key = '/';
    else if (path.startsWith('/apps')) key = '/apps';
    else if (path === '/knowledge' || path.startsWith('/knowledge/')) key = '/knowledge';
    else if (path === '/settings') key = '/settings';

    setSelectedKeys([key]);

    if (path.startsWith('/admin/')) {
      setOpenKeys(['system-admin']);
    } else {
      setOpenKeys([]);
    }
  }, [location.pathname]);

  // Memoize items to prevent Nav re-render issues
  // Sub-items use plain strings (no icons) so Semi Nav auto-indents them
  const items = useMemo(() => {
    const mainItems: any[] = [
      { itemKey: '/', icon: <IconHome />, text: '仪表盘' },
      { itemKey: '/knowledge', icon: <IconArchive />, text: '知识库' },
      { itemKey: '/apps', icon: <IconServerStroked />, text: 'AI 应用' },
    ];

    if (user?.role === 'super_admin') {
      mainItems.push({
        itemKey: 'system-admin',
        icon: <IconSetting />,
        text: '系统管理',
        items: [
          { itemKey: '/admin/users', icon: <IconUser />, text: '用户管理' },
          { itemKey: '/admin/roles', icon: <IconShield />, text: '角色管理' },
          { itemKey: '/admin/departments', icon: <IconHelm />, text: '部门管理' },
          { itemKey: '/admin/audit', icon: <IconClock />, text: '审计日志' },
          { itemKey: '/admin/system', icon: <IconServer />, text: '系统配置' },
          { itemKey: '/admin/mcp', icon: <IconArchive />, text: 'MCP 配置' },
          { itemKey: '/admin/integrations', icon: <IconCloud />, text: '集成配置' },
          { itemKey: '/admin/security', icon: <IconLock />, text: '安全设置' },
          { itemKey: '/admin/api', icon: <IconCode />, text: 'API 设置' },
          { itemKey: '/admin/vector-store', icon: <IconArchive />, text: '向量存储' },
        ],
      });
    }

    return mainItems;
  }, [user?.role]);

  const userInitials = user?.username
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  function getAvatarSrc(): string | undefined {
    if (!user?.avatar) return undefined;
    if (user.avatar.startsWith('http')) return user.avatar;
    return `${window.location.origin}${user.avatar}`;
  }

  const onCollapseChange = useCallback((isCollapsed: boolean) => {
    if (isCollapsed !== sidebarCollapsed) {
      toggleSidebar();
    }
  }, [sidebarCollapsed, toggleSidebar]);

  const onSelect = useCallback((data: any) => {
    const key = String(data.itemKey);
    setSelectedKeys([key]);
    if (key.startsWith('/')) {
      navigate(key);
    }
  }, [navigate]);

  const onOpenChange = useCallback((data: any) => {
    setOpenKeys([...data.openKeys]);
  }, []);

  const handleLogout = useCallback(() => {
    clear();
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('access_token');
    navigate('/login');
  }, [clear, navigate]);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'zh_CN' ? 'en_US' : 'zh_CN');
  }, [locale, setLocale]);

  if (isWorkflowPage) {
    return (
      <Layout style={{ height: '100vh' }}>
        <Content style={{ overflow: 'hidden', height: '100vh' }}>
          <Outlet />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider style={{ height: '100vh' }}>
        <Nav
          isCollapsed={sidebarCollapsed}
          openKeys={openKeys}
          selectedKeys={selectedKeys}
          style={{ height: '100%' }}
          limitIndent={false}
          items={items}
          header={{
            logo: systemConfig?.logo
              ? <img src={systemConfig.logo} alt="LOGO" style={{ height: 36, fontSize: 36 }} />
              : (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--semi-color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconArchive style={{ color: '#fff', fontSize: 16 }} />
                </div>
              ),
            text: systemConfig?.siteName || 'AI 知识库',
          }}
          footer={{
            collapseButton: true,
          }}
          onCollapseChange={onCollapseChange}
          onOpenChange={onOpenChange}
          onSelect={onSelect}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            height: 52,
            padding: '0 20px',
            background: 'var(--semi-color-bg-0)',
            borderBottom: '1px solid var(--semi-color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          {/* 中英文切换 */}
          <Button
            type="tertiary"
            theme="borderless"
            icon={<IconLanguage />}
            onClick={toggleLocale}
            style={{ fontSize: 13 }}
          >
            {locale === 'zh_CN' ? 'EN' : '中'}
          </Button>

          {/* 用户头像下拉 */}
          <Dropdown
            trigger="click"
            position="bottomRight"
            render={
              <Dropdown.Menu>
                <Dropdown.Item icon={<IconUser />} onClick={() => navigate('/settings')}>
                  个人资料
                </Dropdown.Item>
                <Dropdown.Item icon={<IconSafe />} onClick={() => navigate('/settings')}>
                  安全设置
                </Dropdown.Item>
                <Dropdown.Item icon={<IconKey />} onClick={() => navigate('/settings')}>
                  API 设置
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item
                  icon={<IconExit />}
                  type="danger"
                  onClick={handleLogout}
                >
                  退出登录
                </Dropdown.Item>
              </Dropdown.Menu>
            }
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 8px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              <Avatar
                size="small"
                src={getAvatarSrc()}
                color="blue"
              >
                {!user?.avatar && userInitials}
              </Avatar>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {user?.username || '未登录'}
              </Text>
            </div>
          </Dropdown>
        </Header>

        <Content
          style={{
            padding: 24,
            overflow: 'auto',
            overflowX: 'hidden',
            height: 'calc(100vh - 52px)',
            background: 'var(--semi-color-bg-1)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
