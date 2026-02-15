import { Card, Input, Button, Typography, Space, Toast } from '@douyinfe/semi-ui';
import { IconCode, IconKey } from '@douyinfe/semi-icons';

const { Title, Text } = Typography;

function APIPage() {
  const handleRegenerateKey = () => {
    Toast.warning('此功能暂未实现');
  };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Title heading={3} style={{ margin: 0 }}>
          API 设置
        </Title>
        <Text type="tertiary">
          管理 API 密钥和访问权限
        </Text>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card
          title="API 密钥"
          bodyStyle={{ padding: '24px' }}
        >
          <Space vertical spacing={12} style={{ width: '100%' }}>
            <Text type="tertiary">
              用于调用 AI 知识库 API 的密钥。请妥善保管，不要泄露给他人。
            </Text>
            <Input
              mode="password"
              value="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              disabled
            />
            <Button
              type="tertiary"
              theme="borderless"
              icon={<IconKey />}
              onClick={handleRegenerateKey}
            >
              重新生成密钥
            </Button>
          </Space>
        </Card>

        <Card
          title="API 端点"
          bodyStyle={{ padding: '24px' }}
        >
          <Space vertical spacing={12} style={{ width: '100%' }}>
            <Text type="tertiary">
              基础 API 地址，用于调用各类 API 接口。
            </Text>
            <Input
              value={`${window.location.origin}/api/v1`}
              disabled
            />
          </Space>
        </Card>

        <Card
          title="API 文档"
          bodyStyle={{ padding: '24px' }}
        >
          <Space vertical spacing={12} style={{ width: '100%' }}>
            <Text type="tertiary">
              查看完整的 API 文档，了解所有可用的接口和用法。
            </Text>
            <Button
              type="primary"
              theme="solid"
              icon={<IconCode />}
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

export default APIPage;
