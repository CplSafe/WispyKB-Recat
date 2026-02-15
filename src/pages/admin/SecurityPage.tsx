import { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Banner,
} from '@douyinfe/semi-ui';
import { Toast } from '@douyinfe/semi-ui';
import api from '../../lib/api';

const { Title } = Typography;

function SecurityPage() {
  const formApi = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handlePasswordUpdate = async (values: any) => {
    setLoading(true);
    try {
      await api.post('/user/change-password', {
        old_password: values.currentPassword,
        new_password: values.newPassword,
      });
      Toast.success('密码修改成功');
      formApi.current?.reset();
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
        type="info"
        description="建议使用包含大小写字母、数字和特殊字符的复杂密码，长度至少8位，定期更换密码以保护账户安全。"
        style={{ marginBottom: 24 }}
      />

      <Card
        title="修改密码"
        bodyStyle={{ padding: '24px' }}
      >
        <Form
          onSubmit={handlePasswordUpdate}
          layout="vertical"
        >
          <Form.Input
            field="currentPassword"
            label="当前密码"
            rules={[{ required: true, message: '请输入当前密码' }]}
            mode="password"
          />

          <Form.Input
            field="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' },
            ]}
            mode="password"
          />

          <Form.Input
            field="confirmPassword"
            label="确认密码"
            rules={[
              { required: true, message: '请确认新密码' },
            ]}
            mode="password"
            initValue=""
          >
            {({ value, formApi }, ref) => (
              <Input
                mode="password"
                ref={ref}
                value={value}
                onChange={(v) => formApi.setValue('confirmPassword', v)}
                onBlur={(v) => {
                  const newPassword = formApi.getValue('newPassword');
                  if (v && v !== newPassword) {
                    formApi.setError('confirmPassword', '两次输入的密码不一致');
                  } else {
                    formApi.setError('confirmPassword', '');
                  }
                }}
                placeholder="请确认新密码"
              />
            )}
          </Form.Input>

          <Button
            type="primary"
            theme="solid"
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

export default SecurityPage;
