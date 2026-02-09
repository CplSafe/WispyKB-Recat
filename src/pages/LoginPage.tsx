import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Input,
  Typography,
  Space,
  message,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../store';
import api from '../lib/api';

const { Text, Title } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser, setToken } = useAppStore();
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLoginClick();
    }
  };

  const handleLoginClick = async () => {
    if (!username.trim()) {
      messageApi.warning('请输入用户名');
      return;
    }
    if (!password.trim()) {
      messageApi.warning('请输入密码');
      return;
    }
    // 直接登录
    await performLogin();
  };

  const performLogin = async () => {
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { username, password });

      const token = data.access_token || data.token;  // 兼容两种格式
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('token', token);
      storage.setItem('access_token', token);  // 同时存储 access_token
      storage.setItem('user', JSON.stringify(data.user));

      // 设置 cookie 供中间件使用
      const maxAge = remember ? 30 * 24 * 60 * 60 : undefined;  // 30天或会话期间
      document.cookie = `access_token=${token}; path=/; max-age=${maxAge || 'session'}`;
      document.cookie = `token=${token}; path=/; max-age=${maxAge || 'session'}`;

      setUser(data.user);
      setToken(token);
      messageApi.success('登录成功');
      navigate('/');
    } catch (error) {
      messageApi.error(typeof error === 'string' ? error : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          background: '#F8FAFC',
        }}
      >
        {/* 左侧图片区域 - 50% */}
        <style>{`
            @media (min-width: 768px) {
              .login-left-panel { display: flex !important; }
            }
          `}</style>
        <div
          className="login-left-panel"
          style={{
            flex: 1,
            display: 'none',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* 背景图片 */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: 'url("https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2070&auto=format&fit=crop")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          {/* 蓝紫色渐变遮罩 */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.85) 0%, rgba(49, 46, 129, 0.8) 50%, rgba(88, 28, 135, 0.85) 100%)',
            }}
          />

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 60,
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* 背景装饰图形 */}
            <svg
              width="100%"
              height="100%"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                opacity: 0.1,
                zIndex: 0,
              }}
              viewBox="0 0 800 600"
              preserveAspectRatio="xMidYMid slice"
            >
              {/* 左上角波浪 */}
              <path
                d="M0,100 Q200,50 400,100 T800,100 L800,0 L0,0 Z"
                fill="rgba(255,255,255,0.3)"
              />
              {/* 右下角波浪 */}
              <path
                d="M0,500 Q200,550 400,500 T800,500 L800,600 L0,600 Z"
                fill="rgba(255,255,255,0.2)"
              />
              {/* 中间圆形 */}
              <circle cx="400" cy="300" r="150" fill="rgba(255,255,255,0.05)" />
              <circle cx="400" cy="300" r="200" fill="rgba(255,255,255,0.03)" />
              {/* 装饰点 */}
              <circle cx="100" cy="150" r="8" fill="rgba(255,255,255,0.2)" />
              <circle cx="700" cy="100" r="12" fill="rgba(255,255,255,0.15)" />
              <circle cx="650" cy="450" r="6" fill="rgba(255,255,255,0.25)" />
              <circle cx="150" cy="480" r="10" fill="rgba(255,255,255,0.18)" />
            </svg>

            {/* 浮动粒子效果 */}
            <div
              style={{
                position: 'absolute',
                top: '15%',
                left: '10%',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'rgba(167, 139, 250, 0.4)',
                animation: 'float 6s ease-in-out infinite',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '25%',
                right: '15%',
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: 'rgba(96, 165, 250, 0.3)',
                animation: 'float 8s ease-in-out infinite 1s',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '30%',
                left: '20%',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'rgba(139, 92, 246, 0.3)',
                animation: 'float 7s ease-in-out infinite 2s',
              }}
            />

            {/* 产品名称 */}
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <Title level={2} style={{ margin: 0, color: '#fff', fontSize: 32, fontWeight: 600 }}>
                Wispy
              </Title>
              <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 16, marginTop: 8 }}>
                AI Knowledge Platform
              </Text>
            </div>

            {/* 特性列表 */}
            <Space orientation="vertical" size={16} style={{ marginTop: 48 }}>
              {[
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  ),
                  text: '支持多种文档格式',
                },
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  ),
                  text: '基于大语言模型的智能对话',
                },
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  ),
                  text: '精准的语义检索',
                },
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  ),
                  text: '多应用管理与分享',
                },
              ].map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontSize: 15,
                    fontWeight: 400,
                  }}
                >
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.12)',
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                    }}
                  >
                    {item.icon}
                  </span>
                  {item.text}
                </div>
              ))}
            </Space>
          </div>
        </div>

        {/* 右侧表单区域 - 50% */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
            background: '#fff',
          }}
        >
          <div style={{ width: '100%', maxWidth: 400 }}>
            {/* 移动端Logo */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 32,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <Title level={4} style={{ margin: 0, color: '#1E293B' }}>
                Wispy
              </Title>
            </div>

            {/* 欢迎文字 */}
            <div style={{ marginBottom: 32 }}>
              <Title level={3} style={{ margin: 0, color: '#1E293B', fontSize: 24 }}>
                欢迎回来
              </Title>
              <Text style={{ color: '#64748B', fontSize: 14 }}>
                请输入您的账号信息登录
              </Text>
            </div>

            {/* 表单 */}
            <Space orientation="vertical" size={20} style={{ width: '100%' }}>
              {/* 用户名 */}
              <div>
                <Text
                  strong
                  style={{ display: 'block', marginBottom: 8, color: '#374151', fontSize: 13 }}
                >
                  用户名
                </Text>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="请输入用户名"
                  size="large"
                  prefix={<UserOutlined style={{ color: '#9CA3AF' }} />}
                  style={{ borderRadius: 8 }}
                />
              </div>

              {/* 密码 */}
              <div>
                <Text
                  strong
                  style={{ display: 'block', marginBottom: 8, color: '#374151', fontSize: 13 }}
                >
                  密码
                </Text>
                <Input.Password
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="请输入密码"
                  size="large"
                  prefix={<LockOutlined style={{ color: '#9CA3AF' }} />}
                  style={{ borderRadius: 8 }}
                />
              </div>

              {/* 记住我 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={{ color: '#64748B', fontSize: 13 }}>记住我</Text>
                </label>
              </div>

              {/* 登录按钮 */}
              <Button
                type="primary"
                size="large"
                loading={loading}
                block
                onClick={handleLoginClick}
                style={{
                  height: 46,
                  borderRadius: 8,
                  fontSize: 15,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                }}
                icon={<ArrowRightOutlined />}
              >
                登录
              </Button>
            </Space>

            {/* 版权信息 */}
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                © 2025 Wispy. All rights reserved.
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* 动画样式 */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </>
  );
}
