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
  Toast,
  Banner,
  Tabs,
  Modal,
  Cropper,
} from '@douyinfe/semi-ui';
import {
  IconUser,
  IconUpload,
  IconCodeStroked,
  IconKey,
  IconLock,
} from '@douyinfe/semi-icons';
import { useAppStore } from '../store';
import api from '../lib/api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

function ProfileTab({ user, setUser }: { user: any; setUser: (user: any) => void }) {
  const profileFormApi = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const cropperRef = useRef<any>(null);
  const [cropperVisible, setCropperVisible] = useState(false);
  const [cropperSrc, setCropperSrc] = useState<string>('');

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
      Toast.success('个人资料更新成功');
    } catch (error) {
      Toast.error(typeof error === 'string' ? error : '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropperSrc(e.target?.result as string);
      setCropperVisible(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCrop = async () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    cropper.getCroppedCanvas().toBlob(async (blob: Blob | null) => {
      if (!blob) return;
      try {
        const loadingMsg = Toast.info({ content: '正在上传头像...', duration: 0 });

        const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8888';
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

        const formData = new FormData();
        formData.append('file', new File([blob], 'cropped-avatar.png', { type: 'image/png' }));

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

        Toast.close(loadingMsg);
        profileFormApi.current?.setValue('avatar', data.url);
        if (user) {
          setUser({ ...user, avatar: data.url });
        }
        Toast.success('头像上传成功');
      } catch {
        Toast.error('头像上传失败');
      } finally {
        setCropperVisible(false);
      }
    });
  };

  const userInitials = user?.username?.charAt(0)?.toUpperCase() || 'U';

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Title heading={3} style={{ margin: 0 }}>
          个人资料
        </Title>
      </div>

      <Card
        title="基本信息"
        styles={{ body: { padding: '24px' } }}
      >
        <Form
          getFormApi={(api) => { profileFormApi.current = api; }}
          layout="vertical"
          initValues={{
            username: user?.username,
            email: user?.email,
            avatar: user?.avatar,
          }}
          onSubmit={handleProfileUpdate}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Slot label="头像">
                <Space align="center" spacing={16}>
                  {user?.avatar ? (
                    <img
                      src={user.avatar.startsWith('http') ? user.avatar : `${window.location.origin}${user.avatar}`}
                      alt="头像"
                      style={{
                        width: 64,
                        height: 64,
                        objectFit: 'cover',
                        border: '1px solid var(--semi-color-border)',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 64,
                      height: 64,
                      background: 'var(--semi-color-bg-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Text type="quaternary" size="large">{userInitials}</Text>
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
                      icon={<IconUpload />}
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      更换头像
                    </Button>
                  </div>
                </Space>
              </Form.Slot>
            </Col>
            <Col span={12}>
              <Form.Slot label="角色">
                <Input value={user?.role} disabled />
              </Form.Slot>
            </Col>
            <Col span={24}>
              <Form.Input
                field="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              />
            </Col>
            <Col span={24}>
              <Form.Input
                field="email"
                label="邮箱"
                rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
              />
            </Col>
          </Row>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
          >
            保存更改
          </Button>
        </Form>
      </Card>

      <Modal
        title="裁剪头像"
        visible={cropperVisible}
        onOk={handleCrop}
        onCancel={() => setCropperVisible(false)}
        width={520}
        okText="确认裁剪"
        cancelText="取消"
      >
        {cropperSrc && (
          <Cropper
            ref={cropperRef}
            src={cropperSrc}
            aspectRatio={1}
            style={{ height: 400 }}
          />
        )}
      </Modal>
    </>
  );
}

function APITab() {

  const handleRegenerateKey = () => {
    Toast.warning('此功能尚未实现');
  };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Title heading={3} style={{ margin: 0 }}>
          API 设置
        </Title>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card
          title="API 密钥"
          styles={{ body: { padding: '24px' } }}
        >
          <Space vertical spacing={12} style={{ width: '100%' }}>
            <Text type="tertiary">
              用于调用 AI 知识库 API 的密钥。请妥善保管，不要与他人分享。
            </Text>
            <Input
              mode="password"
              value="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              disabled
            />
            <Button
              type="primary"
              theme="light"
              icon={<IconKey />}
              onClick={handleRegenerateKey}
            >
              重新生成密钥
            </Button>
          </Space>
        </Card>

        <Card
          title="API 端点"
          styles={{ body: { padding: '24px' } }}
        >
          <Space vertical spacing={12} style={{ width: '100%' }}>
            <Text type="tertiary">
              调用各种 API 端点的基础 API URL。
            </Text>
            <Input
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/v1`}
              disabled
            />
          </Space>
        </Card>

        <Card
          title="API 文档"
          styles={{ body: { padding: '24px' } }}
        >
          <Space vertical spacing={12} style={{ width: '100%' }}>
            <Text type="tertiary">
              查看完整的 API 文档，了解所有可用的接口和使用方法。
            </Text>
            <Button
              type="primary"
              icon={<IconCodeStroked />}
              onClick={() => window.open('/docs', '_blank')}
            >
              查看完整 API 文档
            </Button>
          </Space>
        </Card>
      </div>
    </>
  );
}

function SecurityTab() {
  const passwordFormApi = useRef<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePasswordUpdate = async (values: any) => {
    setLoading(true);
    try {
      await api.post('/user/change-password', {
        old_password: values.currentPassword,
        new_password: values.newPassword,
      });
      Toast.success('密码修改成功');
      passwordFormApi.current?.reset();
    } catch (error) {
      Toast.error(typeof error === 'string' ? error : '修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Title heading={3} style={{ margin: 0 }}>
          安全设置
        </Title>
      </div>

      <Banner
        description="密码安全提示：建议使用包含大小写字母、数字和特殊字符的复杂密码，长度至少为 8 位。请定期修改密码以保护账户安全。"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card
        title="修改密码"
        styles={{ body: { padding: '24px' } }}
      >
        <Form
          getFormApi={(api) => { passwordFormApi.current = api; }}
          layout="vertical"
          onSubmit={handlePasswordUpdate}
        >
          <Form.Input
            field="currentPassword"
            label="当前密码"
            mode="password"
            rules={[{ required: true, message: '请输入当前密码' }]}
          />

          <Form.Input
            field="newPassword"
            label="新密码"
            mode="password"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度至少为 6 位' },
            ]}
          />

          <Form.Input
            field="confirmPassword"
            label="确认密码"
            mode="password"
            rules={[
              { required: true, message: '请确认新密码' },
              {
                validator: (_rule: any, value: string) => {
                  const newPassword = passwordFormApi.current?.getValue('newPassword');
                  if (!value || newPassword === value) {
                    return true;
                  }
                  return false;
                },
                message: '两次输入的密码不一致',
              },
            ]}
          />

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
          >
            更新密码
          </Button>
        </Form>
      </Card>
    </>
  );
}

function SettingsPage() {
  const { user, setUser } = useAppStore();

  return (
    <>
      <Tabs defaultActiveKey="profile" size="large">
        <TabPane tab={<span><IconUser /> 个人资料</span>} itemKey="profile">
          <ProfileTab user={user} setUser={setUser} />
        </TabPane>
        <TabPane tab={<span><IconCodeStroked /> API</span>} itemKey="api">
          <APITab />
        </TabPane>
        <TabPane tab={<span><IconLock /> 安全设置</span>} itemKey="security">
          <SecurityTab />
        </TabPane>
      </Tabs>
    </>
  );
}

export default SettingsPage;
