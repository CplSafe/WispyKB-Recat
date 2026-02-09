import { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Alert,
} from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { message } from 'antd';
import api from '../../lib/api';

const { Title } = Typography;

function SecurityPage() {
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
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0, color: '#1E293B', fontSize: 20, fontWeight: 600 }}>
            安全设置
          </Title>
        </div>

        <Alert
          message="密码安全建议"
          description="建议使用包含大小写字母、数字和特殊字符的复杂密码，长度至少8位，定期更换密码以保护账户安全。"
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
                { min: 6, message: '密码至少6位' },
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
      </div>
    </>
  );
}

export default SecurityPage;
