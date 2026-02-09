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
  message,
  Popconfirm,
  Avatar,
  Typography,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  MailOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import api from '../../lib/api';

const { Text } = Typography;

interface User {
  id: string;
  username: string;
  email: string;
  roles?: string[];  // 后端返回的角色代码数组
  role?: string;     // 兼容：从roles中提取的第一个角色
  department_id?: string;
  dept_id?: string;  // 后端返回的是 dept_id
  dept_name?: string;
  department_name?: string;
  status?: number;   // 后端返回的是数字: 0=禁用, 1=正常
  created_at: string;
  last_login?: string;
}

interface Department {
  id: string;
  name: string;
  code?: string;
  parent_id?: string;
  user_count?: number;
  description?: string;
}

const roleMap: Record<string, { text: string; color: string }> = {
  super_admin: { text: '超级管理员', color: 'red' },
  admin: { text: '管理员', color: 'blue' },
  user: { text: '普通用户', color: 'default' },
};

const statusMap: Record<number, { text: string; color: string }> = {
  1: { text: '正常', color: 'success' },
  0: { text: '禁用', color: 'error' },
};

// 辅助函数：从用户数据中获取角色
const getUserRole = (user: User): string => {
  if (user.role) return user.role;
  if (user.roles && user.roles.length > 0) {
    // 从roles数组中获取主要角色，优先级：super_admin > admin > user
    if (user.roles.includes('super_admin')) return 'super_admin';
    if (user.roles.includes('admin')) return 'admin';
    return user.roles[0];
  }
  return 'user';
};

// 辅助函数：获取状态
const getUserStatus = (user: User): number => {
  return user.status ?? 1;
};

// 辅助函数：获取部门ID
const getUserDeptId = (user: User): string | undefined => {
  return user.department_id || user.dept_id;
};

// 辅助函数：获取部门名称
const getUserDeptName = (user: User): string => {
  return user.department_name || user.dept_name || '未分配部门';
};

// 用户卡片组件
function UserCard({
  user,
  onEdit,
  onDelete,
}: {
  user: User;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const userRole = getUserRole(user);
  const userStatus = getUserStatus(user);
  const roleInfo = roleMap[userRole] || { text: userRole, color: 'default' };
  const statusInfo = statusMap[userStatus] || { text: '未知', color: 'default' };

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
            <Avatar size={48} icon={<UserOutlined />} style={{ backgroundColor: '#2563EB' }} />
            <div>
              <Text strong style={{ fontSize: 15, color: '#1E293B', display: 'block' }}>
                {user.username}
              </Text>
              <Text style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MailOutlined style={{ fontSize: 11 }} />
                {user.email}
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
              description="确定要删除该用户吗？"
              onConfirm={onDelete}
              okText="确认"
              cancelText="取消"
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                style={{ color: '#94A3B8' }}
              />
            </Popconfirm>
          </Space>
        </div>

        {/* Tags */}
        <Space size={8} wrap>
          <Tag style={{
            fontSize: 11,
            margin: 0,
            padding: '2px 8px',
            background: '#F1F5F9',
            border: '1px solid #E2E8F0',
            color: '#475569',
          }}>
            {getUserDeptName(user)}
          </Tag>
          <Tag color={roleInfo.color} style={{ fontSize: 11, margin: 0, padding: '2px 8px' }}>
            {roleInfo.text}
          </Tag>
          <Tag color={statusInfo.color} style={{ fontSize: 11, margin: 0, padding: '2px 8px' }}>
            {statusInfo.text}
          </Tag>
        </Space>

        {/* Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B' }}>
          <span>最后登录: {user.last_login ? new Date(user.last_login).toLocaleDateString('zh-CN') : '从未'}</span>
          <span>创建于 {new Date(user.created_at).toLocaleDateString('zh-CN')}</span>
        </div>

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
          编辑用户
        </Button>
      </Space>
    </Card>
  );
}

// 新增用户卡片
function AddUserCard({ onClick }: { onClick: () => void }) {
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
        e.currentTarget.style.borderColor = '#2563EB';
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
          新增用户
        </Text>
      </Space>
    </Card>
  );
}

function UsersPage() {
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchText, setSearchText] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get('/system/users');
      setUsers(data.users || data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      messageApi.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await api.get('/system/departments');
      setDepartments(data.departments || data || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ role: 'user', status: 'active' });
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      role: getUserRole(user),
      department_id: getUserDeptId(user),
      status: getUserStatus(user) === 1 ? 'active' : 'inactive',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/system/users/${id}`);
      messageApi.success('删除成功');
      fetchUsers();
    } catch (error) {
      messageApi.error(typeof error === 'string' ? error : '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // 转换状态：'active' -> 1, 'inactive' -> 0
      const payload = {
        ...values,
        status: values.status === 'active' ? 1 : 0,
      };

      if (editingUser) {
        await api.put(`/system/users/${editingUser.id}`, payload);
        messageApi.success('更新成功');
      } else {
        await api.post('/system/users', {
          ...payload,
          password: values.password || '123456',
        });
        messageApi.success('创建成功');
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      messageApi.error(typeof error === 'string' ? error : '操作失败');
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <>
      {contextHolder}
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography.Title level={3} style={{ margin: 0, color: '#1E293B', fontSize: 20, fontWeight: 600 }}>
              用户管理
            </Typography.Title>
            <Text style={{ color: '#64748B', fontSize: 13 }}>
              管理系统用户、角色和权限
            </Text>
          </div>
          <Input
            placeholder="搜索用户名或邮箱..."
            allowClear
            prefix={<TeamOutlined style={{ color: '#94A3B8' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300, borderRadius: 8 }}
          />
        </div>

        {/* Users Grid */}
        <Row gutter={[16, 16]}>
          {/* Add User Card */}
          <Col xs={24} sm={12} lg={8} xl={6}>
            <AddUserCard onClick={handleAdd} />
          </Col>

          {/* User Cards */}
          {filteredUsers.map((user) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={user.id}>
              <UserCard
                user={user}
                onEdit={() => handleEdit(user)}
                onDelete={() => handleDelete(user.id)}
              />
            </Col>
          ))}
        </Row>

        {/* Modal */}
        <Modal
          title={editingUser ? '编辑用户' : '新增用户'}
          open={isModalOpen}
          onOk={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          okText="确认"
          cancelText="取消"
          width={500}
        >
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="username"
                  label="用户名"
                  rules={[{ required: true, message: '请输入用户名' }]}
                >
                  <Input placeholder="请输入用户名" prefix={<UserOutlined />} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="邮箱"
                  rules={[
                    { required: true, message: '请输入邮箱' },
                    { type: 'email', message: '请输入有效的邮箱地址' },
                  ]}
                >
                  <Input placeholder="请输入邮箱" prefix={<MailOutlined />} />
                </Form.Item>
              </Col>
            </Row>

            {!editingUser && (
              <Form.Item
                name="password"
                label="密码"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password placeholder="请输入密码" />
              </Form.Item>
            )}

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="role" label="角色" rules={[{ required: true }]}>
                  <Select>
                    <Select.Option value="user">普通用户</Select.Option>
                    <Select.Option value="admin">管理员</Select.Option>
                    <Select.Option value="super_admin">超级管理员</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="department_id" label="部门">
                  <Select placeholder="请选择部门" allowClear>
                    {departments.map((dept) => (
                      <Select.Option key={dept.id} value={dept.id}>
                        {dept.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="status" label="状态" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="active">正常</Select.Option>
                <Select.Option value="inactive">禁用</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </>
  );
}

export default UsersPage;
