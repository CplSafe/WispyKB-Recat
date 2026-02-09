import { Card, Form, Input, Button, Typography, Space, message } from 'antd';
import { ApiOutlined, KeyOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

function APIPage() {
  const [messageApi, contextHolder] = message.useMessage();

  const handleRegenerateKey = () => {
    messageApi.warning('此功能暂未实现');
  };

  return (
    <>
      {contextHolder}
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0, color: '#1E293B', fontSize: 20, fontWeight: 600 }}>
            API 设置
          </Title>
          <Text style={{ color: '#64748B', fontSize: 13 }}>
            管理 API 密钥和访问权限
          </Text>
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
                用于调用 AI 知识库 API 的密钥。请妥善保管，不要泄露给他人。
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
                基础 API 地址，用于调用各类 API 接口。
              </Text>
              <Input
                value={`${window.location.origin}/api/v1`}
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
                查看完整的 API 文档，了解所有可用的接口和用法。
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
      </div>
    </>
  );
}

export default APIPage;
