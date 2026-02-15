import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  Toast,
  Switch,
  Select,
  Tag,
  Modal,
  Banner,
  Collapse,
  Empty,
} from '@douyinfe/semi-ui';
import {
  IconCloud,
  IconPlus,
  IconDelete,
  IconEyeOpened,
  IconCommentStroked,
  IconServerStroked,
  IconUserGroup,
  IconGlobe,
  IconSetting,
  IconTick,
} from '@douyinfe/semi-icons';
import api from '../../lib/api';

const { Title, Text, Paragraph } = Typography;

interface SSOConfig {
  provider: string;
  enabled: boolean;
  name: string;
  display_name?: string;
}

type SSOProviderType = 'feishu' | 'dingtalk' | 'wechat' | 'oidc';

function IntegrationsPage() {
  const [loading, setLoading] = useState(false);

  // SSO 配置状态
  const [ssoConfigs, setSsoConfigs] = useState<SSOConfig[]>([]);
  const [ssoFormVisible, setSsoFormVisible] = useState(false);
  const [ssoProvider, setSsoProvider] = useState<SSOProviderType>('feishu');
  const [oidcProviderName, setOidcProviderName] = useState('');
  const ssoFormApi = useRef<any>(null);

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
    try {
      const values = await ssoFormApi.current?.validate();
      setLoading(true);

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

      Toast.success('SSO 配置保存成功');
      setSsoFormVisible(false);
      ssoFormApi.current?.reset();
      setOidcProviderName('');
      loadSSOConfigs();
    } catch (error: any) {
      if (error) {
        Toast.error(typeof error === 'string' ? error : '保存失败');
      }
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

      Toast.success('已删除');
      loadSSOConfigs();
    } catch (error: any) {
      Toast.error(error || '删除失败');
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

      Toast.success(enabled ? '已启用' : '已禁用');
      loadSSOConfigs();
    } catch (error: any) {
      Toast.error(error || '操作失败');
    }
  };

  const handleGetSSOLoginUrl = async (provider: string) => {
    try {
      const data = await api.get(`/sso/login/${provider}?redirect_uri=${encodeURIComponent(window.location.origin)}/settings`);
      window.location.href = data.auth_url;
    } catch (error) {
      Toast.error('获取登录链接失败');
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
      Toast.warning('请输入飞书 App ID 和 App Secret');
      return;
    }

    setSaving(true);
    try {
      await api.post('/integrations/feishu/config', {
        app_id: feishuAppId,
        app_secret: feishuAppSecret,
      });

      Toast.success('飞书配置保存成功');
      setFeishuAppSecret('');
    } catch (error: any) {
      Toast.error(error || '保存失败');
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
          Toast.success('飞书配置已删除');
          setFeishuAppId('');
          setFeishuAppSecret('');
        } catch (error: any) {
          Toast.error(error || '删除失败');
        }
      },
    });
  };

  const getSSOIcon = (provider: string) => {
    const icons: Record<string, React.ReactNode> = {
      feishu: <IconUserGroup style={{ color: 'var(--semi-color-success)' }} />,
      dingtalk: <IconServerStroked style={{ color: 'var(--semi-color-primary)' }} />,
      wechat: <IconCommentStroked style={{ color: 'var(--semi-color-success)' }} />,
    };
    return icons[provider] || <IconGlobe />;
  };

  return (
    <>
      {}
      <div>
        <div style={{ marginBottom: 24 }}>
          <Title heading={3} style={{ margin: 0 }}>
            集成配置
          </Title>
          <Text type="tertiary">
            配置第三方服务集成，包括单点登录和飞书集成
          </Text>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* SSO 单点登录 */}
          <Card
            title={
              <Space>
                <IconCloud /> <Text>单点登录 (SSO)</Text>
              </Space>
            }
            extra={
              <Button type="primary" icon={<IconPlus />} onClick={() => setSsoFormVisible(true)}>
                添加 SSO
              </Button>
            }
            styles={{ body: { padding: '16px' } }}
          >
            <Paragraph type="secondary">
              配置单点登录，支持飞书、钉钉、企业微信，以及任何支持 OIDC 标准的身份提供商。
            </Paragraph>

            {ssoConfigs.length === 0 ? (
              <Empty
                description="暂无 SSO 配置"
                style={{ padding: '40px 0' }}
              />
            ) : (
              <Space vertical spacing={12} style={{ width: '100%' }}>
                {ssoConfigs.map((config) => (
                  <div
                    key={config.provider}
                    style={{
                      padding: '12px 16px',
                      border: '1px solid var(--semi-color-border)',
                      background: 'var(--semi-color-bg-0)',
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
                        checkedText="启用"
                        uncheckedText="禁用"
                      />
                      <Button
                        type="primary"
                        size="small"
                        icon={<IconEyeOpened />}
                        onClick={() => handleGetSSOLoginUrl(config.provider)}
                      >
                        测试登录
                      </Button>
                      <Button
                        type="danger"
                        size="small"
                        icon={<IconDelete />}
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
                <IconUserGroup /> <Text>飞书知识库配置</Text>
              </Space>
            }
            styles={{ body: { padding: '16px' } }}
          >
            <Space vertical spacing={16} style={{ width: '100%' }}>
              <Banner
                title="配置说明"
                description="配置飞书 App ID 和 App Secret 后，在知识库页面可以使用飞书知识库同步功能。"
                type="info"
                showIcon
              />

              <Form layout="vertical">
                <Form.Slot label="App ID">
                  <Input
                    placeholder="cli_xxxxxxxxxxxxx"
                    value={feishuAppId}
                    onChange={(value) => setFeishuAppId(value)}
                  />
                </Form.Slot>
                <Form.Slot label="App Secret">
                  <Input
                    mode="password"
                    placeholder="请输入 App Secret"
                    value={feishuAppSecret}
                    onChange={(value) => setFeishuAppSecret(value)}
                  />
                </Form.Slot>
              </Form>

              <Space>
                <Button
                  type="primary"
                  icon={<IconTick />}
                  onClick={handleSaveFeishuConfig}
                  loading={saving}
                >
                  保存配置
                </Button>
                <Button
                  type="danger"
                  icon={<IconDelete />}
                  onClick={handleDeleteFeishuConfig}
                >
                  删除配置
                </Button>
              </Space>

              <Paragraph type="secondary" style={{ margin: 0 }}>
                飞书开放平台地址：{' '}
                <a href="https://open.feishu.cn/" target="_blank" rel="noopener noreferrer">
                  https://open.feishu.cn/
                </a>
              </Paragraph>
            </Space>
          </Card>
        </div>

        {/* SSO 配置弹窗 */}
        <Modal
          title="配置单点登录"
          visible={ssoFormVisible}
          onOk={handleSaveSSO}
          onCancel={() => {
            setSsoFormVisible(false);
            ssoFormApi.current?.reset();
            setOidcProviderName('');
          }}
          okButtonProps={{ loading }}
          okText="保存"
          cancelText="取消"
          width={700}
        >
          <Form getFormApi={(api) => { ssoFormApi.current = api; }} layout="vertical">
            <Form.Slot label="登录方式">
              <Select
                value={ssoProvider}
                onChange={(v) => {
                  setSsoProvider(v as SSOProviderType);
                  if (v !== 'oidc') {
                    setOidcProviderName('');
                  }
                }}
                optionList={[
                  { label: '飞书', value: 'feishu' },
                  { label: '钉钉', value: 'dingtalk' },
                  { label: '企业微信', value: 'wechat' },
                  { label: '通用 OIDC / OAuth 2.0', value: 'oidc' },
                ]}
              />
            </Form.Slot>

            {ssoProvider !== 'oidc' ? (
              <>
                {ssoProvider === 'feishu' ? (
                  <>
                    <Form.Input
                      field="app_id"
                      label="App ID"
                      placeholder="cli_xxxxxxxxxxxxx"
                      rules={[{ required: true, message: '请输入 App ID' }]}
                    />
                    <Form.Input
                      field="app_secret"
                      label="App Secret"
                      mode="password"
                      placeholder="请输入 App Secret"
                      rules={[{ required: true, message: '请输入 App Secret' }]}
                    />
                  </>
                ) : ssoProvider === 'dingtalk' ? (
                  <>
                    <Form.Input
                      field="client_id"
                      label="Client ID"
                      placeholder="dingxxxxxxxxxxxx"
                      rules={[{ required: true, message: '请输入 Client ID' }]}
                    />
                    <Form.Input
                      field="client_secret"
                      label="Client Secret"
                      mode="password"
                      placeholder="请输入 Client Secret"
                      rules={[{ required: true, message: '请输入 Client Secret' }]}
                    />
                  </>
                ) : (
                  <>
                    <Form.Input
                      field="app_id"
                      label="企业 ID (Corp ID)"
                      placeholder="wwxxxxxxxxxxxx"
                      rules={[{ required: true, message: '请输入企业 ID' }]}
                    />
                    <Form.Input
                      field="app_secret"
                      label="Secret"
                      mode="password"
                      placeholder="请输入 Secret"
                      rules={[{ required: true, message: '请输入 Secret' }]}
                    />
                  </>
                )}
              </>
            ) : (
              <>
                <Banner
                  title="通用 OIDC 配置"
                  description="支持任何符合 OIDC/OAuth 2.0 标准的身份提供商，如政府统一认证平台、Keycloak、Authing、Okta 等。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                <Form.Input
                  field="custom_provider_name"
                  label="提供商标识"
                  placeholder="例如: gov, keycloak"
                  rules={[{ required: true, message: '请输入提供商标识' }]}
                  extraText="用于区分不同的 SSO 提供商"
                />

                <Form.Input
                  field="display_name"
                  label="显示名称"
                  placeholder="例如: 广东省政务云登录"
                  extraText="在登录按钮上显示的名称"
                />

                <Collapse defaultActiveKey={['basic']}>
                  <Collapse.Panel header={<Space><IconSetting /> 基础配置</Space>} itemKey="basic">
                    <Form.Input
                      field="client_id"
                      label="Client ID"
                      placeholder="应用客户端 ID"
                      rules={[{ required: true, message: '请输入 Client ID' }]}
                    />
                    <Form.Input
                      field="client_secret"
                      label="Client Secret"
                      mode="password"
                      placeholder="应用客户端密钥"
                      rules={[{ required: true, message: '请输入 Client Secret' }]}
                    />
                    <Form.Input
                      field="auth_url"
                      label="授权地址"
                      placeholder="https://xxx.com/authorize"
                      rules={[{ required: true, message: '请输入授权地址' }]}
                    />
                    <Form.Input
                      field="token_url"
                      label="Token 地址"
                      placeholder="https://xxx.com/token"
                      rules={[{ required: true, message: '请输入 Token 地址' }]}
                    />
                  </Collapse.Panel>
                </Collapse>
              </>
            )}

            <Form.Slot label="回调地址">
              <Input
                placeholder={window.location.origin + '/api/v1/sso/callback/{provider}'}
                value={`${window.location.origin}/api/v1/sso/callback/${ssoProvider === 'oidc' ? oidcProviderName || '{provider}' : ssoProvider}`}
                readonly
              />
            </Form.Slot>
          </Form>

          <Banner
            description="配置完成后，用户可以通过第三方账号直接登录系统"
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
