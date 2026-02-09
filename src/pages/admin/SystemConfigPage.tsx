import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  message,
  Upload,
  ColorPicker,
  Switch,
} from 'antd';
import {
  SettingOutlined,
  UploadOutlined,
  DeleteOutlined,
  BgColorsOutlined,
} from '@ant-design/icons';
import type { ColorPickerProps } from 'antd';
import api from '../../lib/api';

const { Title, Text } = Typography;

interface SystemConfig {
  site_name: string;
  site_title: string;
  logo?: string;
  favicon?: string;
  primary_color: string;
  theme?: string;
}

function SystemConfigPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SystemConfig | null>(null);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const data = await api.get('/system/config');
      setConfig(data);
      form.setFieldsValue({
        site_name: data.site_name || 'AI 知识库',
        site_title: data.site_title || 'AI Knowledge Base',
        logo: data.logo || '',
        favicon: data.favicon || '',
        primary_color: data.primary_color || '#2563EB',
        theme: data.theme === 'dark',
      });
    } catch (error) {
      console.error('Failed to fetch system config:', error);
      messageApi.error('获取系统配置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      await api.put('/system/config', {
        ...values,
        theme: values.theme ? 'dark' : 'light',
      });
      messageApi.success('保存成功');
      fetchConfig();

      // 更新页面标题
      if (values.site_title) {
        document.title = values.site_title;
      }

      // 更新 favicon
      if (values.favicon) {
        const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement || document.createElement('link');
        link.rel = 'icon';
        link.href = values.favicon;
        document.head.appendChild(link);
      }
    } catch (error) {
      messageApi.error(typeof error === 'string' ? error : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleColorChange: ColorPickerProps['onChange'] = (color) => {
    const hexColor = color?.toHexString();
    form.setFieldValue('primary_color', hexColor || '#2563EB');
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await api.post('/system/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.url;
    } catch (error) {
      throw new Error('上传失败');
    }
  };

  return (
    <>
      {contextHolder}
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0, color: '#1E293B', fontSize: 20, fontWeight: 600 }}>
            系统配置
          </Title>
          <Text style={{ color: '#64748B', fontSize: 13 }}>
            配置系统基本信息和外观
          </Text>
        </div>

        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          {/* 基本信息配置 */}
          <Card
            title={
              <Space>
                <SettingOutlined />
                <span>基本信息</span>
              </Space>
            }
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: '24px' } }}
            loading={loading}
          >
            <Form form={form} layout="vertical">
              <Form.Item
                label="网站名称"
                name="site_name"
                rules={[{ required: true, message: '请输入网站名称' }]}
              >
                <Input placeholder="AI 知识库" />
              </Form.Item>

              <Form.Item
                label="页面标题"
                name="site_title"
                tooltip="显示在浏览器标签页上的标题"
              >
                <Input placeholder="AI Knowledge Base" />
              </Form.Item>

              <Form.Item label="主题颜色" name="primary_color">
                <ColorPicker showText onChange={handleColorChange} />
              </Form.Item>

              <Form.Item
                label="深色模式"
                name="theme"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="深色"
                  unCheckedChildren="浅色"
                />
              </Form.Item>
            </Form>
          </Card>

          {/* 品牌标识 */}
          <Card
            title={
              <Space>
                <BgColorsOutlined />
                <span>品牌标识</span>
              </Space>
            }
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: '24px' } }}
          >
            <Form form={form} layout="vertical">
              <Form.Item name="logo" hidden>
                <Input />
              </Form.Item>
              <Form.Item name="favicon" hidden>
                <Input />
              </Form.Item>
            </Form>

            <Space orientation="vertical" size={16} style={{ width: '100%' }}>
              {/* LOGO */}
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Space>
                  <Text strong>LOGO</Text>
                  {config?.logo && (
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        form.setFieldValue('logo', '');
                        setConfig({ ...config, logo: '' });
                      }}
                    >
                      删除
                    </Button>
                  )}
                </Space>

                {config?.logo ? (
                  <img
                    src={config.logo}
                    alt="LOGO"
                    style={{
                      maxWidth: 120,
                      maxHeight: 60,
                      objectFit: 'contain',
                      borderRadius: 8,
                      border: '1px solid #E2E8F0',
                      padding: 8,
                      background: '#fff',
                    }}
                  />
                ) : (
                  <Upload
                    beforeUpload={async (file) => {
                      try {
                        messageApi.loading('正在上传...', 0);
                        const url = await uploadImage(file);
                        messageApi.destroy();
                        form.setFieldValue('logo', url);
                        setConfig({ ...config, logo: url });
                        messageApi.success('上传成功');
                      } catch (error) {
                        messageApi.destroy();
                        messageApi.error('上传失败');
                      }
                      return false;
                    }}
                    showUploadList={false}
                  >
                    <Button icon={<UploadOutlined />}>上传 LOGO</Button>
                  </Upload>
                )}
              </Space>

              {/* Favicon */}
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Space>
                  <Text strong>Favicon</Text>
                  {config?.favicon && (
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        form.setFieldValue('favicon', '');
                        setConfig({ ...config, favicon: '' });
                      }}
                    >
                      删除
                    </Button>
                  )}
                </Space>

                {config?.favicon ? (
                  <img
                    src={config.favicon}
                    alt="Favicon"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      border: '1px solid #E2E8F0',
                      padding: 4,
                      background: '#fff',
                    }}
                  />
                ) : (
                  <Upload
                    beforeUpload={async (file) => {
                      try {
                        messageApi.loading('正在上传...', 0);
                        const url = await uploadImage(file);
                        messageApi.destroy();
                        form.setFieldValue('favicon', url);
                        setConfig({ ...config, favicon: url });
                        messageApi.success('上传成功');
                      } catch (error) {
                        messageApi.destroy();
                        messageApi.error('上传失败');
                      }
                      return false;
                    }}
                    showUploadList={false}
                  >
                    <Button icon={<UploadOutlined />}>上传 Favicon</Button>
                  </Upload>
                )}
              </Space>
            </Space>
          </Card>

          {/* 操作按钮 */}
          <Card
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: '16px 24px' } }}
          >
            <Space>
              <Button
                type="primary"
                icon={<SettingOutlined />}
                onClick={handleSave}
                loading={saving}
              >
                保存配置
              </Button>
            </Space>
          </Card>
        </Space>
      </div>
    </>
  );
}

export default SystemConfigPage;
