import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Form,
  Space,
  Toast,
  Typography,
} from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form/interface';
import {
  IconUser,
  IconLock,
  IconArrowRight,
} from '@douyinfe/semi-icons';
import { useAppStore } from '../store';
import api from '../lib/api';

const { Title, Text } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser, setToken } = useAppStore();
  const formRef = useRef<FormApi>();

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { username: string; password: string; remember?: boolean }) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/login', {
        username: values.username,
        password: values.password,
      });

      const token = data.access_token || data.token;
      const storage = values.remember ? localStorage : sessionStorage;
      storage.setItem('token', token);
      storage.setItem('access_token', token);
      storage.setItem('user', JSON.stringify(data.user));

      const maxAge = values.remember ? 30 * 24 * 60 * 60 : undefined;
      document.cookie = `access_token=${token}; path=/; max-age=${maxAge || 'session'}`;
      document.cookie = `token=${token}; path=/; max-age=${maxAge || 'session'}`;

      setUser(data.user);
      setToken(token);
      Toast.success('登录成功');
      navigate('/');
    } catch (error) {
      Toast.error(typeof error === 'string' ? error : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <style>{`
          @media (min-width: 768px) {
            .login-left-panel { display: flex !important; }
          }
        `}</style>
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--semi-color-bg-1)',
      }}
    >
      {/* 左侧图片区域 - 50% */}
      <div
        className="login-left-panel"
        style={{
          flex: 1,
          display: 'none',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, var(--semi-color-primary) 0%, color-mix(in srgb, var(--semi-color-primary) 70%, #1e3a5f) 100%)',
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
            opacity: 0.15,
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
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <Title heading={2} style={{ margin: 0, color: '#fff', fontSize: 32, fontWeight: 600 }}>
              Wispy
            </Title>
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 16, marginTop: 8 }}>
              AI Knowledge Platform
            </Text>
          </div>

          {/* 特性列表 */}
          <Space vertical spacing={16} style={{ marginTop: 48 }}>
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
          background: 'var(--semi-color-bg-0)',
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
                background: 'var(--semi-color-primary)',
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
            <Title heading={4} style={{ margin: 0 }}>
              Wispy
            </Title>
          </div>

          {/* 欢迎文字 */}
          <div style={{ marginBottom: 32 }}>
            <Title heading={3} style={{ margin: 0 }}>
              欢迎回来
            </Title>
            <Text type="tertiary">
              请输入您的账号信息登录
            </Text>
          </div>

          {/* 表单 */}
          <Form
            getFormApi={(api) => { formRef.current = api; }}
            onSubmit={handleSubmit}
            labelPosition="top"
            labelWidth="100%"
            style={{ width: '100%' }}
          >
            <Form.Input
              field="username"
              label="用户名"
              placeholder="请输入用户名"
              size="large"
              prefix={<IconUser style={{ color: 'var(--semi-color-text-2)' }} />}
              rules={[{ required: true, message: '请输入用户名' }]}
            />

            <Form.Input
              field="password"
              label="密码"
              mode="password"
              placeholder="请输入密码"
              size="large"
              prefix={<IconLock style={{ color: 'var(--semi-color-text-2)' }} />}
              rules={[{ required: true, message: '请输入密码' }]}
            />

            <Form.Checkbox
              field="remember"
              noLabel
            >
              记住我
            </Form.Checkbox>

            <Button
              htmlType="submit"
              type="primary"
              theme="solid"
              size="large"
              loading={loading}
              block
              style={{
                height: 46,
                marginTop: 8,
              }}
              icon={<IconArrowRight />}
            >
              登录
            </Button>
          </Form>

          {/* 版权信息 */}
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Text type="quaternary" size="small">
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
