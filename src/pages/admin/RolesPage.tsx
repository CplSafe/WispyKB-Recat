import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Input,
  Tag,
  Modal,
  Form,
  Select,
  Checkbox,
  message,
  Popconfirm,
  Typography,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyOutlined,
  KeyOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import api from '../../lib/api';

const { Text } = Typography;

interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  remark?: string;  // 后端返回的是 remark
  permissions?: string[];  // 后端返回的权限列表
  menus?: any[];  // 后端返回的菜单列表
  user_count?: number;  // 后端通过 COUNT 计算
  created_at?: string;
  sort?: number;
  status?: number;
}

// 权限列表
const permissionOptions = [
  { label: '用户管理', value: 'users.manage' },
  { label: '角色管理', value: 'roles.manage' },
  { label: '部门管理', value: 'departments.manage' },
  { label: '知识库管理', value: 'knowledge.manage' },
  { label: '应用管理', value: 'apps.manage' },
  { label: '系统配置', value: 'system.manage' },
  { label: '审计日志', value: 'audit.view' },
  { label: 'MCP 配置', value: 'mcp.manage' },
];

// 角色卡片组件
function RoleCard({
  role,
  onEdit,
  onDelete,
}: {
  role: Role;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card
      hoverable
      style={{
        background: '#FFFFFF',
        borderRadius: 12,
        borderColor: '#E2E8F0',
        height: '100%',
        transition: 'all 0.2s',
      }}
      styles={{ body: { padding: '20px' } }}
      onMouseEnter={(e: any) => {
        e.currentTarget.style.borderColor = '#2563EB';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.1)';
      }}
      onMouseLeave={(e: any) => {
        e.currentTarget.style.borderColor = '#E2E8F0';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Space>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SafetyOutlined style={{ fontSize: 20, color: 'white' }} />
            </div>
            <div>
              <Text strong style={{ fontSize: 15, color: '#1E293B', display: 'block' }}>
                {role.name}
              </Text>
              <Text style={{ fontSize: 12, color: '#64748B' }}>
                {role.code}
              </Text>
            </div>
          </Space>
          <Space size={4}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={onEdit}
              style={{ color: '#94A3B8' }}
            />
            <Popconfirm
              title="确认删除"
              description="确定要删除该角色吗？"
              onConfirm={onDelete}
              okText="确认"
              cancelText="取消"
              disabled={role.code === 'super_admin'}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={role.code === 'super_admin'}
                style={{ color: '#94A3B8' }}
              />
            </Popconfirm>
          </Space>
        </div>

        {/* Description */}
        {(role.description || role.remark) && (
          <Text style={{ fontSize: 12, color: '#64748B', display: 'block' }}>
            {role.description || role.remark}
          </Text>
        )}

        {/* Tags */}
        <Space size={8} wrap>
          <Tag
            icon={<KeyOutlined />}
            color="blue"
            style={{ fontSize: 11, margin: 0, padding: '2px 8px' }}
          >
            {(role.permissions?.length || role.menus?.length || 0)} 项权限
          </Tag>
          <Tag
            icon={<TeamOutlined />}
            style={{ fontSize: 11, margin: 0, padding: '2px 8px', background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#475569' }}
          >
            {role.user_count || 0} 人
          </Tag>
        </Space>

        {/* Info */}
        <Text style={{ fontSize: 12, color: '#64748B' }}>
          创建于 {new Date(role.created_at).toLocaleDateString('zh-CN')}
        </Text>

        {/* Action */}
        <Button
          type="primary"
          ghost
          size="small"
          icon={<EditOutlined />}
          onClick={onEdit}
          style={{
            width: '100%',
            borderRadius: 6,
            height: 28,
            fontSize: 12,
          }}
        >
          编辑角色
        </Button>
      </Space>
    </Card>
  );
}

// 新增角色卡片
function AddRoleCard({ onClick }: { onClick: () => void }) {
  return (
    <Card
      hoverable
      onClick={onClick}
      style={{
        background: '#F8FAFC',
        borderRadius: 12,
        border: '1px dashed #CBD5E1',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
        minHeight: 220,
      }}
      styles={{ body: { padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } }}
      onMouseEnter={(e: any) => {
        e.currentTarget.style.background = '#F1F5F9';
        e.currentTarget.style.borderColor = '#8B5CF6';
      }}
      onMouseLeave={(e: any) => {
        e.currentTarget.style.background = '#F8FAFC';
        e.currentTarget.style.borderColor = '#CBD5E1';
      }}
    >
      <Space orientation="vertical" size={12} align="center">
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: '#E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PlusOutlined style={{ fontSize: 20, color: '#64748B' }} />
        </div>
        <Text style={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>
          新增角色
        </Text>
      </Space>
    </Card>
  );
}

function RolesPage() {
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchText, setSearchText] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm();

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await api.get('/system/roles');
      setRoles(data.roles || data || []);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      messageApi.error('获取角色列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleAdd = () => {
    setEditingRole(null);
    form.resetFields();
    form.setFieldsValue({ permissions: [] });
    setIsModalOpen(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    form.setFieldsValue({
      name: role.name,
      code: role.code,
      description: role.description || role.remark,
      permissions: role.permissions || [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/system/roles/${id}`);
      messageApi.success('删除成功');
      fetchRoles();
    } catch (error) {
      messageApi.error(typeof error === 'string' ? error : '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // 将 description 映射为 remark（后端期望的字段名）
      const payload = {
        ...values,
        remark: values.description,
      };
      delete payload.description;

      if (editingRole) {
        await api.put(`/system/roles/${editingRole.id}`, payload);
        messageApi.success('更新成功');
      } else {
        await api.post('/system/roles', payload);
        messageApi.success('创建成功');
      }

      setIsModalOpen(false);
      fetchRoles();
    } catch (error) {
      messageApi.error(typeof error === 'string' ? error : '操作失败');
    }
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchText.toLowerCase()) ||
      role.code.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <>
      {contextHolder}
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography.Title level={3} style={{ margin: 0, color: '#1E293B', fontSize: 20, fontWeight: 600 }}>
              角色管理
            </Typography.Title>
            <Text style={{ color: '#64748B', fontSize: 13 }}>
              管理系统角色和权限配置
            </Text>
          </div>
          <Input
            placeholder="搜索角色名称或代码..."
            allowClear
            prefix={<KeyOutlined style={{ color: '#94A3B8' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300, borderRadius: 8 }}
          />
        </div>

        {/* Roles Grid */}
        <Row gutter={[16, 16]}>
          {/* Add Role Card */}
          <Col xs={24} sm={12} lg={8} xl={6}>
            <AddRoleCard onClick={handleAdd} />
          </Col>

          {/* Role Cards */}
          {filteredRoles.map((role) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={role.id}>
              <RoleCard
                role={role}
                onEdit={() => handleEdit(role)}
                onDelete={() => handleDelete(role.id)}
              />
            </Col>
          ))}
        </Row>

        {/* Modal */}
        <Modal
          title={editingRole ? '编辑角色' : '新增角色'}
          open={isModalOpen}
          onOk={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          okText="确认"
          cancelText="取消"
          width={600}
        >
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="角色名称"
                  rules={[{ required: true, message: '请输入角色名称' }]}
                >
                  <Input placeholder="请输入角色名称" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="code"
                  label="角色代码"
                  rules={[{ required: true, message: '请输入角色代码' }]}
                >
                  <Input placeholder="如: role_admin" disabled={!!editingRole} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="描述">
              <Input.TextArea placeholder="请输入角色描述" rows={2} />
            </Form.Item>

            <Form.Item name="permissions" label="权限配置">
              <Checkbox.Group style={{ width: '100%' }}>
                <Row gutter={[8, 8]}>
                  {permissionOptions.map((option) => (
                    <Col span={12} key={option.value}>
                      <Checkbox value={option.value}>{option.label}</Checkbox>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </>
  );
}

export default RolesPage;
