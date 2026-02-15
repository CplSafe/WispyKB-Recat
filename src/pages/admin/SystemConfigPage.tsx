import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  Toast,
  Upload,
  Switch,
  Modal,
  Cropper,
} from '@douyinfe/semi-ui';
import {
  IconSetting,
  IconUpload,
  IconDelete,
  IconColorPalette,
} from '@douyinfe/semi-icons';
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
  const formApi = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SystemConfig | null>(null);

  const logoCropperRef = useRef<any>(null);
  const [logoCropperVisible, setLogoCropperVisible] = useState(false);
  const [logoCropperSrc, setLogoCropperSrc] = useState<string>('');

  const faviconCropperRef = useRef<any>(null);
  const [faviconCropperVisible, setFaviconCropperVisible] = useState(false);
  const [faviconCropperSrc, setFaviconCropperSrc] = useState<string>('');

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const data = await api.get('/system/config');
      setConfig(data);
      formApi.current?.setValues({
        site_name: data.site_name || 'AI 知识库',
        site_title: data.site_title || 'AI Knowledge Base',
        logo: data.logo || '',
        favicon: data.favicon || '',
        primary_color: data.primary_color || '#2563EB',
        theme: data.theme === 'dark',
      });
    } catch (error) {
      console.error('Failed to fetch system config:', error);
      Toast.error('获取系统配置失败');
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
      const values = await formApi.current?.validate();
      await api.put('/system/config', {
        ...values,
        theme: values.theme ? 'dark' : 'light',
      });
      Toast.success('保存成功');
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
      Toast.error(typeof error === 'string' ? error : '保存失败');
    } finally {
      setSaving(false);
    }
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

  const handleLogoFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoCropperSrc(e.target?.result as string);
      setLogoCropperVisible(true);
    };
    reader.readAsDataURL(file);
  };

  const handleFaviconFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setFaviconCropperSrc(e.target?.result as string);
      setFaviconCropperVisible(true);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoCrop = async () => {
    const cropper = logoCropperRef.current?.cropper;
    if (!cropper) return;

    cropper.getCroppedCanvas().toBlob(async (blob: Blob | null) => {
      if (!blob) return;
      try {
        Toast.info({ content: '正在上传...', duration: 0 });
        const croppedFile = new File([blob], 'cropped-logo.png', { type: 'image/png' });
        const url = await uploadImage(croppedFile);
        formApi.current?.setValues({ logo: url });
        setConfig({ ...config!, logo: url });
        Toast.success('上传成功');
      } catch {
        Toast.error('上传失败');
      } finally {
        setLogoCropperVisible(false);
      }
    });
  };

  const handleFaviconCrop = async () => {
    const cropper = faviconCropperRef.current?.cropper;
    if (!cropper) return;

    cropper.getCroppedCanvas().toBlob(async (blob: Blob | null) => {
      if (!blob) return;
      try {
        Toast.info({ content: '正在上传...', duration: 0 });
        const croppedFile = new File([blob], 'cropped-favicon.png', { type: 'image/png' });
        const url = await uploadImage(croppedFile);
        formApi.current?.setValues({ favicon: url });
        setConfig({ ...config!, favicon: url });
        Toast.success('上传成功');
      } catch {
        Toast.error('上传失败');
      } finally {
        setFaviconCropperVisible(false);
      }
    });
  };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Title heading={3} style={{ margin: 0 }}>
          系统配置
        </Title>
        <Text type="tertiary">
          配置系统基本信息和外观
        </Text>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 基本信息配置 */}
        <Card
          title={
            <Space>
              <IconSetting />
              <Text>基本信息</Text>
            </Space>
          }
          bodyStyle={{ padding: '24px' }}
          loading={loading}
        >
          <Form getFormApi={(api) => { formApi.current = api; }} layout="vertical">
            <Form.Input
              field="site_name"
              label="网站名称"
              rules={[{ required: true, message: '请输入网站名称' }]}
              placeholder="AI 知识库"
            />

            <Form.Input
              field="site_title"
              label="页面标题"
              extra="显示在浏览器标签页上的标题"
              placeholder="AI Knowledge Base"
            />

            <Form.Input
              field="primary_color"
              label="主题颜色"
              placeholder="#2563EB"
            />

            <Form.Switch
              field="theme"
              label="深色模式"
              checkedText="深色"
              uncheckedText="浅色"
            />
          </Form>
        </Card>

        {/* 品牌标识 */}
        <Card
          title={
            <Space>
              <IconColorPalette />
              <Text>品牌标识</Text>
            </Space>
          }
          bodyStyle={{ padding: '24px' }}
        >
          <Form getFormApi={(api) => { formApi.current = api; }} layout="vertical">
            <Form.Input field="logo" style={{ display: 'none' }} />
            <Form.Input field="favicon" style={{ display: 'none' }} />
          </Form>

          <Space vertical spacing={16} style={{ width: '100%' }}>
            {/* LOGO */}
            <Space vertical spacing={8} style={{ width: '100%' }}>
              <Space>
                <Text strong>LOGO</Text>
                {config?.logo && (
                  <Button
                    type="danger"
                    size="small"
                    icon={<IconDelete />}
                    onClick={() => {
                      formApi.current?.setValues({ logo: '' });
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
                    border: '1px solid var(--semi-color-border)',
                    padding: 8,
                    background: 'var(--semi-color-bg-0)',
                  }}
                />
              ) : (
                <Upload
                  action=""
                  customRequest={({ file }) => {
                    handleLogoFileSelect(file as File);
                  }}
                  showUploadList={false}
                  accept="image/*"
                >
                  <Button icon={<IconUpload />}>上传 LOGO</Button>
                </Upload>
              )}
            </Space>

            {/* Favicon */}
            <Space vertical spacing={8} style={{ width: '100%' }}>
              <Space>
                <Text strong>Favicon</Text>
                {config?.favicon && (
                  <Button
                    type="danger"
                    size="small"
                    icon={<IconDelete />}
                    onClick={() => {
                      formApi.current?.setValues({ favicon: '' });
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
                    border: '1px solid var(--semi-color-border)',
                    padding: 4,
                    background: 'var(--semi-color-bg-0)',
                  }}
                />
              ) : (
                <Upload
                  action=""
                  customRequest={({ file }) => {
                    handleFaviconFileSelect(file as File);
                  }}
                  showUploadList={false}
                  accept="image/*"
                >
                  <Button icon={<IconUpload />}>上传 Favicon</Button>
                </Upload>
              )}
            </Space>
          </Space>
        </Card>

        {/* 操作按钮 */}
        <Card
          bodyStyle={{ padding: '16px 24px' }}
        >
          <Space>
            <Button
              type="primary"
              icon={<IconSetting />}
              onClick={handleSave}
              loading={saving}
            >
              保存配置
            </Button>
          </Space>
        </Card>
      </div>

      <Modal
        title="裁剪 LOGO"
        visible={logoCropperVisible}
        onOk={handleLogoCrop}
        onCancel={() => setLogoCropperVisible(false)}
        width={520}
        okText="确认裁剪"
        cancelText="取消"
      >
        {logoCropperSrc && (
          <Cropper
            ref={logoCropperRef}
            src={logoCropperSrc}
            style={{ height: 400 }}
          />
        )}
      </Modal>

      <Modal
        title="裁剪 Favicon"
        visible={faviconCropperVisible}
        onOk={handleFaviconCrop}
        onCancel={() => setFaviconCropperVisible(false)}
        width={520}
        okText="确认裁剪"
        cancelText="取消"
      >
        {faviconCropperSrc && (
          <Cropper
            ref={faviconCropperRef}
            src={faviconCropperSrc}
            aspectRatio={1}
            style={{ height: 400 }}
          />
        )}
      </Modal>
    </>
  );
}

export default SystemConfigPage;
