import { useState, useRef } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Row,
  Col,
  Space,
  message,
  Alert,
  Tabs,
} from 'antd';
import {
  UserOutlined,
  UploadOutlined,
  ApiOutlined,
  KeyOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../store';
import api from '../lib/api';

const { Title, Text } = Typography;

function ProfileTab({ user, setUser }: { user: any; setUser: (user: any) => void }) {
  const [messageApi, contextHolder] = message.useMessage();
  const [profileForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleProfileUpdate = async (values: any) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', values.username);
      if (values.email) formData.append('email', values.email);
      if (values.avatar) formData.append('avatar', values.avatar);

      const data = await api.put('/user/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(data);
      messageApi.success('个人资料更新成功');
    } catch (error) {
      messageApi.error(typeof error === 'string' ? error : '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      const loadingMsg = messageApi.loading('正在上传头像...', 0);

      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8888';
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/api/v1/user/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      messageApi.destroy(loadingMsg as any);
      profileForm.setFieldValue('avatar', data.url);
      if (user) {
        setUser({ ...user, avatar: data.url });
      }
      messageApi.success('头像上传成功');
      return false;
    } catch (error) {
      messageApi.destroy();
      messageApi.error('头像上传失败');
      return false;
    }
  };

  const userInitials = user?.username?.charAt(0)?.toUpperCase() || 'U';

  return (
    <>
      {contextHolder}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: '#1E293B', fontSize: 20, fontWeight: 600 }}>
          个人资料
        </Title>
      </div>

      <Card
        title="基本信息"
        style={{
          background: '#FFFFFF',
          borderRadius: 12,
          borderColor: '#E2E8F0',
        }}
        styles={{ body: { padding: '24px' } }}
      >
        <Form
          form={profileForm}
          layout="vertical"
          initialValues={{
            username: user?.username,
            email: user?.email,
            avatar: user?.avatar,
          }}
          onFinish={handleProfileUpdate}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="头像">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {user?.avatar ? (
                    <img
                      src={user.avatar.startsWith('http') ? user.avatar : `${window.location.origin}${user.avatar}`}
                      alt="头像"
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 8,
                        objectFit: 'cover',
                        border: '1px solid #E2E8F0',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 64,
                      height: 64,
                      borderRadius: 8,
                      background: '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                      color: '#94A3B8',
                    }}>
                      {userInitials}
                    </div>
                  )}
                  <div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleAvatarUpload(file);
                        }
                      }}
                    />
                    <Button
                      icon={<UploadOutlined />}
                      onClick={() => avatarInputRef.current?.click()}
                      style={{ borderRadius: 6 }}
                    >
                      更换头像
                    </Button>
                  </div>
                </div>
                <Form.Item name="avatar" hidden>
                  <Input />
                </Form.Item>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="角色">
                <Input value={user?.role} disabled style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="用户名"
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="邮箱"
                name="email"
                rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
              >
                <Input style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ borderRadius: 8 }}
            >
              保存更改
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}

function APITab() {
  const [messageApi, contextHolder] = message.useMessage();

  const handleRegenerateKey = () => {
    messageApi.warning('此功能尚未实现');
  };

  return (
    <>
      {contextHolder}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: '#1E293B', fontSize: 20, fontWeight: 600 }}>
          API 设置
        </Title>
      </div>

      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Card
          title="API 密钥"
          style={{
            background: '#FFFFFF',
            borderRadius: 12,
            borderColor: '#E2E8F0',
          }}
          styles={{ body: { padding: '24px' } }}
        >
          <Space orientation="vertical" size={12} style={{ width: '100%' }}>
            <Text style={{ color: '#64748B', fontSize: 13 }}>
              用于调用 AI 知识库 API 的密钥。请妥善保管，不要与他人分享。
            </Text>
            <Input.Password
              value="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              disabled
              style={{ borderRadius: 8 }}
            />
            <Button
              type="primary"
              ghost
              icon={<KeyOutlined />}
              onClick={handleRegenerateKey}
              style={{ borderRadius: 8 }}
            >
              重新生成密钥
            </Button>
          </Space>
        </Card>

        <Card
          title="API 端点"
          style={{
            background: '#FFFFFF',
            borderRadius: 12,
            borderColor: '#E2E8F0',
          }}
          styles={{ body: { padding: '24px' } }}
        >
          <Space orientation="vertical" size={12} style={{ width: '100%' }}>
            <Text style={{ color: '#64748B', fontSize: 13 }}>
              调用各种 API 端点的基础 API URL。
            </Text>
            <Input
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/v1`}
              disabled
              style={{ borderRadius: 8 }}
            />
          </Space>
        </Card>

        <Card
          title="API 文档"
          style={{
            background: '#FFFFFF',
            borderRadius: 12,
            borderColor: '#E2E8F0',
          }}
          styles={{ body: { padding: '24px' } }}
        >
          <Space orientation="vertical" size={12} style={{ width: '100%' }}>
            <Text style={{ color: '#64748B', fontSize: 13 }}>
              查看完整的 API 文档，了解所有可用的接口和使用方法。
            </Text>
            <Button
              type="primary"
              icon={<ApiOutlined />}
              onClick={() => window.open('/docs', '_blank')}
              style={{
                borderRadius: 8,
                height: 38,
                fontSize: 14,
              }}
            >
              查看完整 API 文档
            </Button>
          </Space>
        </Card>
      </Space>
    </>
  );
}

function SecurityTab() {
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handlePasswordUpdate = async (values: any) => {
    setLoading(true);
    try {
      await api.post('/user/change-password', {
        old_password: values.currentPassword,
        new_password: values.newPassword,
      });
      messageApi.success('密码修改成功');
      passwordForm.resetFields();
    } catch (error) {
      messageApi.error(typeof error === 'string' ? error : '修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: '#1E293B', fontSize: 20, fontWeight: 600 }}>
          安全设置
        </Title>
      </div>

      <Alert
        message="密码安全提示"
        description="建议使用包含大小写字母、数字和特殊字符的复杂密码，长度至少为 8 位。请定期修改密码以保护账户安全。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card
        title="修改密码"
        style={{
          background: '#FFFFFF',
          borderRadius: 12,
          borderColor: '#E2E8F0',
        }}
        styles={{ body: { padding: '24px' } }}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordUpdate}
        >
          <Form.Item
            label="当前密码"
            name="currentPassword"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度至少为 6 位' },
            ]}
          >
            <Input.Password style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item
            label="确认密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                borderRadius: 8,
                height: 38,
                fontSize: 14,
              }}
            >
              更新密码
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}

function SettingsPage() {
  const { user, setUser } = useAppStore();

  const tabItems = [
    {
      key: 'profile',
      label: (
        <span>
          <UserOutlined />
          个人资料
        </span>
      ),
      children: <ProfileTab user={user} setUser={setUser} />,
    },
    {
      key: 'api',
      label: (
        <span>
          <ApiOutlined />
          API
        </span>
      ),
      children: <APITab />,
    },
    {
      key: 'security',
      label: (
        <span>
          <LockOutlined />
          安全设置
        </span>
      ),
      children: <SecurityTab />,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Tabs
        defaultActiveKey="profile"
        items={tabItems}
        size="large"
      />
    </div>
  );
}

export default SettingsPage;
