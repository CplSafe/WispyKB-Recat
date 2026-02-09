import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  message,
  Switch,
  Tag,
  Modal,
  Select,
  Alert,
  Collapse,
  Empty,
} from 'antd';
import {
  CloudServerOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  WechatOutlined,
  DingtalkOutlined,
  TeamOutlined as FeishuOutlined,
  GlobalOutlined,
  ApiOutlined,
  SettingFilled,
  SaveOutlined,
} from '@ant-design/icons';
import api from '../../lib/api';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface SSOConfig {
  provider: string;
  enabled: boolean;
  name: string;
  display_name?: string;
}

type SSOProviderType = 'feishu' | 'dingtalk' | 'wechat' | 'oidc';

function IntegrationsPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);

  // SSO 配置状态
  const [ssoConfigs, setSsoConfigs] = useState<SSOConfig[]>([]);
  const [ssoFormVisible, setSsoFormVisible] = useState(false);
  const [ssoProvider, setSsoProvider] = useState<SSOProviderType>('feishu');
  const [oidcProviderName, setOidcProviderName] = useState('');
  const [ssoForm] = Form.useForm();

  // 飞书配置状态
  const [feishuAppId, setFeishuAppId] = useState('');
  const [feishuAppSecret, setFeishuAppSecret] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSSOConfigs();
    loadFeishuConfig();
  }, []);

  const loadSSOConfigs = async () => {
    try {
      const data = await api.get('/sso/config');
      setSsoConfigs(data.providers || []);
    } catch (error) {
      console.error('Failed to load SSO configs:', error);
    }
  };

  const handleSaveSSO = async () => {
    const values = await ssoForm.validateFields();
    setLoading(true);
    try {
      let provider = ssoProvider;

      if (ssoProvider === 'oidc' && values.custom_provider_name) {
        provider = values.custom_provider_name;
      }

      await api.post('/sso/config', {
        provider,
        enabled: true,
        display_name: values.display_name,
        app_id: values.app_id,
        app_secret: values.app_secret,
        client_id: values.client_id,
        client_secret: values.client_secret,
        auth_url: values.auth_url,
        token_url: values.token_url,
        userinfo_url: values.userinfo_url,
        scope: values.scope,
        issuer: values.issuer,
        response_type: values.response_type,
        redirect_uri: values.redirect_uri || `${window.location.origin}/api/v1/sso/callback/${provider}`,
      });

      messageApi.success('SSO 配置保存成功');
      setSsoFormVisible(false);
      ssoForm.resetFields();
      setOidcProviderName('');
      loadSSOConfigs();
    } catch (error: any) {
      messageApi.error(error || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSSO = async (provider: string) => {
    setLoading(true);
    try {
      await api.post('/sso/config', {
        provider,
        enabled: false,
      });

      messageApi.success('已删除');
      loadSSOConfigs();
    } catch (error: any) {
      messageApi.error(error || '删除失败');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSSO = async (provider: string, enabled: boolean) => {
    try {
      await api.post('/sso/config', {
        provider,
        enabled,
      });

      messageApi.success(enabled ? '已启用' : '已禁用');
      loadSSOConfigs();
    } catch (error: any) {
      messageApi.error(error || '操作失败');
    }
  };

  const handleGetSSOLoginUrl = async (provider: string) => {
    try {
      const data = await api.get(`/sso/login/${provider}?redirect_uri=${encodeURIComponent(window.location.origin)}/settings`);
      window.location.href = data.auth_url;
    } catch (error) {
      messageApi.error('获取登录链接失败');
    }
  };

  const loadFeishuConfig = async () => {
    try {
      const data = await api.get('/integrations/feishu/config');
      setFeishuAppId(data.feishu_app_id || '');
    } catch (error) {
      console.error('Failed to load Feishu config:', error);
    }
  };

  const handleSaveFeishuConfig = async () => {
    if (!feishuAppId || !feishuAppSecret) {
      messageApi.warning('请输入飞书 App ID 和 App Secret');
      return;
    }

    setSaving(true);
    try {
      await api.post('/integrations/feishu/config', {
        app_id: feishuAppId,
        app_secret: feishuAppSecret,
      });

      messageApi.success('飞书配置保存成功');
      setFeishuAppSecret('');
    } catch (error: any) {
      messageApi.error(error || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFeishuConfig = async () => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除飞书配置吗？',
      onOk: async () => {
        try {
          await api.delete('/integrations/feishu/config');
          messageApi.success('飞书配置已删除');
          setFeishuAppId('');
          setFeishuAppSecret('');
        } catch (error: any) {
          messageApi.error(error || '删除失败');
        }
      },
    });
  };

  const getSSOIcon = (provider: string) => {
    const icons: Record<string, React.ReactNode> = {
      feishu: <FeishuOutlined style={{ color: '#00D6B9' }} />,
      dingtalk: <DingtalkOutlined style={{ color: '#0089FF' }} />,
      wechat: <WechatOutlined style={{ color: '#07C160' }} />,
    };
    return icons[provider] || <GlobalOutlined />;
  };

  return (
    <>
      {contextHolder}
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: 24 }}>
          <Typography.Title level={3} style={{ margin: 0, color: '#1E293B', fontSize: 20, fontWeight: 600 }}>
            集成配置
          </Typography.Title>
          <Text style={{ color: '#64748B', fontSize: 13 }}>
            配置第三方服务集成，包括单点登录和飞书集成
          </Text>
        </div>

        <Space orientation="vertical" size={24} style={{ width: '100%' }}>
          {/* SSO 单点登录 */}
          <Card
            title={
              <Space>
                <CloudServerOutlined /> <span>单点登录 (SSO)</span>
              </Space>
            }
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setSsoFormVisible(true)}>
                添加 SSO
              </Button>
            }
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: '16px' } }}
          >
            <Paragraph type="secondary">
              配置单点登录，支持飞书、钉钉、企业微信，以及任何支持 OIDC 标准的身份提供商。
            </Paragraph>

            {ssoConfigs.length === 0 ? (
              <Empty
                description="暂无 SSO 配置"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: '40px 0' }}
              />
            ) : (
              <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                {ssoConfigs.map((config) => (
                  <div
                    key={config.provider}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 8,
                      border: '1px solid #E2E8F0',
                      background: '#fff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Space>
                      {getSSOIcon(config.provider)}
                      <Text strong>{config.display_name || config.name}</Text>
                      <Tag color={config.enabled ? 'success' : 'default'}>
                        {config.enabled ? '已启用' : '已禁用'}
                      </Tag>
                    </Space>
                    <Space>
                      <Switch
                        checked={config.enabled}
                        onChange={(checked) => handleToggleSSO(config.provider, checked)}
                        checkedChildren="启用"
                        unCheckedChildren="禁用"
                      />
                      <Button
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handleGetSSOLoginUrl(config.provider)}
                      >
                        测试登录
                      </Button>
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteSSO(config.provider)}
                      >
                        删除
                      </Button>
                    </Space>
                  </div>
                ))}
              </Space>
            )}
          </Card>

          {/* 飞书集成 */}
          <Card
            title={
              <Space>
                <FeishuOutlined /> <span>飞书知识库配置</span>
              </Space>
            }
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: '16px' } }}
          >
            <Space orientation="vertical" size={16} style={{ width: '100%' }}>
              <Alert
                title="配置说明"
                description="配置飞书 App ID 和 App Secret 后，在知识库页面可以使用飞书知识库同步功能。"
                type="info"
                showIcon
              />

              <Form layout="vertical">
                <Form.Item label="App ID">
                  <Input
                    placeholder="cli_xxxxxxxxxxxxx"
                    value={feishuAppId}
                    onChange={(e) => setFeishuAppId(e.target.value)}
                  />
                </Form.Item>
                <Form.Item label="App Secret">
                  <Input.Password
                    placeholder="请输入 App Secret"
                    value={feishuAppSecret}
                    onChange={(e) => setFeishuAppSecret(e.target.value)}
                  />
                </Form.Item>
              </Form>

              <Space>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSaveFeishuConfig}
                  loading={saving}
                >
                  保存配置
                </Button>
                <Button
                  icon={<DeleteOutlined />}
                  onClick={handleDeleteFeishuConfig}
                  danger
                >
                  删除配置
                </Button>
              </Space>

              <Paragraph type="secondary" style={{ fontSize: 12, margin: 0 }}>
                飞书开放平台地址：{' '}
                <a href="https://open.feishu.cn/" target="_blank" rel="noopener noreferrer">
                  https://open.feishu.cn/
                </a>
              </Paragraph>
            </Space>
          </Card>
        </Space>

        {/* 添加 SSO 配置弹窗 */}
        <Modal
          title="配置单点登录"
          open={ssoFormVisible}
          onOk={handleSaveSSO}
          onCancel={() => {
            setSsoFormVisible(false);
            ssoForm.resetFields();
            setOidcProviderName('');
          }}
          confirmLoading={loading}
          okText="保存"
          cancelText="取消"
          width={700}
        >
          <Form form={ssoForm} layout="vertical">
            <Form.Item
              label="登录方式"
              name="provider_type"
              initialValue="feishu"
            >
              <Select
                value={ssoProvider}
                onChange={(v) => {
                  setSsoProvider(v);
                  if (v !== 'oidc') {
                    setOidcProviderName('');
                  }
                }}
                options={[
                  { label: '飞书', value: 'feishu' },
                  { label: '钉钉', value: 'dingtalk' },
                  { label: '企业微信', value: 'wechat' },
                  { label: '通用 OIDC / OAuth 2.0', value: 'oidc' },
                ]}
              />
            </Form.Item>

            {ssoProvider !== 'oidc' ? (
              <>
                {ssoProvider === 'feishu' ? (
                  <>
                    <Form.Item
                      label="App ID"
                      name="app_id"
                      rules={[{ required: true, message: '请输入 App ID' }]}
                    >
                      <Input placeholder="cli_xxxxxxxxxxxxx" />
                    </Form.Item>
                    <Form.Item
                      label="App Secret"
                      name="app_secret"
                      rules={[{ required: true, message: '请输入 App Secret' }]}
                    >
                      <Input.Password placeholder="请输入 App Secret" />
                    </Form.Item>
                  </>
                ) : ssoProvider === 'dingtalk' ? (
                  <>
                    <Form.Item
                      label="Client ID"
                      name="client_id"
                      rules={[{ required: true, message: '请输入 Client ID' }]}
                    >
                      <Input placeholder="dingxxxxxxxxxxxx" />
                    </Form.Item>
                    <Form.Item
                      label="Client Secret"
                      name="client_secret"
                      rules={[{ required: true, message: '请输入 Client Secret' }]}
                    >
                      <Input.Password placeholder="请输入 Client Secret" />
                    </Form.Item>
                  </>
                ) : (
                  <>
                    <Form.Item
                      label="企业 ID (Corp ID)"
                      name="app_id"
                      rules={[{ required: true, message: '请输入企业 ID' }]}
                    >
                      <Input placeholder="wwxxxxxxxxxxxx" />
                    </Form.Item>
                    <Form.Item
                      label="Secret"
                      name="app_secret"
                      rules={[{ required: true, message: '请输入 Secret' }]}
                    >
                      <Input.Password placeholder="请输入 Secret" />
                    </Form.Item>
                  </>
                )}
              </>
            ) : (
              <>
                <Alert
                  title="通用 OIDC 配置"
                  description="支持任何符合 OIDC/OAuth 2.0 标准的身份提供商，如政府统一认证平台、Keycloak、Authing、Okta 等。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                <Form.Item
                  label="提供商标识"
                  name="custom_provider_name"
                  rules={[{ required: true, message: '请输入提供商标识' }]}
                  tooltip="用于区分不同的 SSO 提供商"
                >
                  <Input
                    placeholder="例如: gov, keycloak"
                    value={oidcProviderName}
                    onChange={(e) => setOidcProviderName(e.target.value)}
                  />
                </Form.Item>

                <Form.Item
                  label="显示名称"
                  name="display_name"
                  tooltip="在登录按钮上显示的名称"
                >
                  <Input placeholder="例如: 广东省政务云登录" />
                </Form.Item>

                <Collapse
                  defaultActiveKey={['basic']}
                  items={[
                    {
                      key: 'basic',
                      label: (
                        <Space>
                          <SettingFilled /> 基础配置
                        </Space>
                      ),
                      children: (
                        <>
                          <Form.Item
                            label="Client ID"
                            name="client_id"
                            rules={[{ required: true, message: '请输入 Client ID' }]}
                          >
                            <Input placeholder="应用客户端 ID" />
                          </Form.Item>
                          <Form.Item
                            label="Client Secret"
                            name="client_secret"
                            rules={[{ required: true, message: '请输入 Client Secret' }]}
                          >
                            <Input.Password placeholder="应用客户端密钥" />
                          </Form.Item>
                          <Form.Item
                            label="授权地址"
                            name="auth_url"
                            rules={[{ required: true, message: '请输入授权地址' }]}
                          >
                            <Input placeholder="https://xxx.com/authorize" />
                          </Form.Item>
                          <Form.Item
                            label="Token 地址"
                            name="token_url"
                            rules={[{ required: true, message: '请输入 Token 地址' }]}
                          >
                            <Input placeholder="https://xxx.com/token" />
                          </Form.Item>
                        </>
                      ),
                    },
                  ]}
                />
              </>
            )}

            <Form.Item label="回调地址" name="redirect_uri">
              <Input
                placeholder={window.location.origin + '/api/v1/sso/callback/{provider}'}
                value={`${window.location.origin}/api/v1/sso/callback/${ssoProvider === 'oidc' ? oidcProviderName || '{provider}' : ssoProvider}`}
                readOnly
              />
            </Form.Item>
          </Form>

          <Alert
            message="配置完成后，用户可以通过第三方账号直接登录系统"
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Modal>
      </div>
    </>
  );
}

export default IntegrationsPage;
