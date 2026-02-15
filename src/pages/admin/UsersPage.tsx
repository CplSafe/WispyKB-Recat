import { useState, useEffect, useRef } from 'react';
import {
  Button,
  Space,
  Input,
  Tag,
  Sidebar,
  Form,
  Toast,
  Popconfirm,
  Avatar,
  Typography,
  List,
  Pagination,
  Empty,
  Skeleton,
  Row,
  Col,
  Tooltip,
} from '@douyinfe/semi-ui';
import {
  IconPlus,
  IconEdit,
  IconDelete,
  IconUser,
  IconMail,
  IconSearch,
  IconClock,
} from '@douyinfe/semi-icons';
import api from '../../lib/api';

const { Text, Title } = Typography;

interface User {
  id: string;
  username: string;
  email: string;
  roles?: string[];
  role?: string;
  department_id?: string;
  dept_id?: string;
  dept_name?: string;
  department_name?: string;
  status?: number;
  created_at: string;
  last_login?: string;
}

interface Department {
  id: string;
  name: string;
}

const roleMap: Record<string, { text: string; color: string }> = {
  super_admin: { text: '超级管理员', color: 'red' },
  admin: { text: '管理员', color: 'blue' },
  user: { text: '普通用户', color: 'green' },
};

const statusMap: Record<number, { text: string; color: string }> = {
  1: { text: '正常', color: 'green' },
  0: { text: '禁用', color: 'red' },
};

const getUserRole = (user: User): string => {
  if (user.role) return user.role;
  if (user.roles && user.roles.length > 0) {
    if (user.roles.includes('super_admin')) return 'super_admin';
    if (user.roles.includes('admin')) return 'admin';
    return user.roles[0];
  }
  return 'user';
};

const pageSize = 10;

function UsersPage() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const formApi = useRef<any>();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get('/system/users');
      setUsers(data.users || data || []);
    } catch (error) {
      Toast.error('获取用户列表失败');
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText]);

  const handleAdd = () => {
    setEditingUser(null);
    formApi.current?.reset();
    formApi.current?.setValues({ role: 'user', status: 'active' });
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    formApi.current?.setValues({
      username: user.username,
      email: user.email,
      role: getUserRole(user),
      department_id: user.department_id || user.dept_id,
      status: (user.status ?? 1) === 1 ? 'active' : 'inactive',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/system/users/${id}`);
      Toast.success('删除成功');
      fetchUsers();
    } catch (error) {
      Toast.error(typeof error === 'string' ? error : '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await formApi.current?.validate();
      const payload = { ...values, status: values.status === 'active' ? 1 : 0 };

      if (editingUser) {
        await api.put(`/system/users/${editingUser.id}`, payload);
        Toast.success('更新成功');
      } else {
        await api.post('/system/users', { ...payload, password: values.password || '123456' });
        Toast.success('创建成功');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      Toast.error(typeof error === 'string' ? error : '操作失败');
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title heading={3} style={{ margin: 0 }}>用户管理</Title>
          <Text type="tertiary">管理系统用户、角色和权限</Text>
        </div>
        <Space>
          <Input prefix={<IconSearch />} placeholder="搜索用户..." value={searchText} onChange={setSearchText} showClear style={{ width: 240 }} />
          <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>创建用户</Button>
        </Space>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding: 24 }}><Skeleton.Paragraph rows={5} /></div>
      ) : (
        <List
          dataSource={paginatedUsers}
          style={{ minHeight: 400 }}
          emptyContent={<Empty description="暂无用户" />}
          renderItem={(user) => {
            const userRole = getUserRole(user);
            const roleInfo = roleMap[userRole] || { text: userRole, color: 'grey' };
            const statusInfo = statusMap[user.status ?? 1] || { text: '未知', color: 'grey' };
            const deptName = user.department_name || user.dept_name || '';

            return (
              <List.Item
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--semi-color-border)',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--semi-color-fill-0)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 16 }}>
                  {/* 头像 */}
                  <Avatar size="default" style={{ backgroundColor: 'var(--semi-color-primary)', flexShrink: 0 }}>
                    <IconUser />
                  </Avatar>

                  {/* 主信息 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text strong style={{ fontSize: 15 }}>{user.username}</Text>
                      <Text type="tertiary" size="small" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IconMail style={{ fontSize: 12 }} />
                        {user.email}
                      </Text>
                    </div>
                    <Text type="tertiary" size="small" style={{ display: 'block', marginTop: 4 }}>
                      最后登录: {user.last_login ? new Date(user.last_login).toLocaleDateString('zh-CN') : '从未'}
                    </Text>
                  </div>

                  {/* 标签 */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <Tag size="small" color={roleInfo.color}>{roleInfo.text}</Tag>
                    {deptName && <Tag size="small">{deptName}</Tag>}
                    <Tag size="small" color={statusInfo.color}>{statusInfo.text}</Tag>
                  </div>

                  {/* 时间 */}
                  <Text type="tertiary" size="small" style={{ width: 100, textAlign: 'right', flexShrink: 0 }}>
                    {new Date(user.created_at).toLocaleDateString('zh-CN')}
                  </Text>

                  {/* 操作按钮 */}
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <Tooltip content="编辑">
                      <Button type="tertiary" icon={<IconEdit />} size="small" theme="borderless" onClick={() => handleEdit(user)} />
                    </Tooltip>
                    <Popconfirm title="确定删除？" content="此操作不可撤销" onConfirm={() => handleDelete(user.id)}>
                      <Button type="tertiary" icon={<IconDelete />} size="small" theme="borderless" style={{ color: 'var(--semi-color-danger)' }} />
                    </Popconfirm>
                  </div>
                </div>
              </List.Item>
            );
          }}
        />
      )}

      {/* Pagination */}
      {filteredUsers.length > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <Pagination total={filteredUsers.length} pageSize={pageSize} currentPage={currentPage} onChange={setCurrentPage} />
        </div>
      )}

      {/* Create/Edit Sidebar */}
      <Sidebar.Container visible={isModalOpen} title={editingUser ? '编辑用户' : '新增用户'} onCancel={() => setIsModalOpen(false)} defaultSize={{ width: 480 }}>
        <div style={{ padding: '16px 0' }}>
          <Form getFormApi={(api) => { formApi.current = api; }} layout="vertical" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Input field="username" label="用户名" rules={[{ required: true }]} placeholder="请输入用户名" prefix={<IconUser />} />
              </Col>
              <Col span={12}>
                <Form.Input field="email" label="邮箱" rules={[{ required: true }, { type: 'email' }]} placeholder="请输入邮箱" prefix={<IconMail />} />
              </Col>
            </Row>
            {!editingUser && (
              <Form.Input field="password" label="密码" mode="password" rules={[{ required: true }]} placeholder="请输入密码" />
            )}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Select field="role" label="角色" rules={[{ required: true }]} optionList={[
                  { label: '普通用户', value: 'user' },
                  { label: '管理员', value: 'admin' },
                  { label: '超级管理员', value: 'super_admin' },
                ]} />
              </Col>
              <Col span={12}>
                <Form.Select field="department_id" label="部门" placeholder="请选择部门" optionList={departments.map((d) => ({ label: d.name, value: d.id }))} filter />
              </Col>
            </Row>
            <Form.Select field="status" label="状态" rules={[{ required: true }]} optionList={[
              { label: '正常', value: 'active' },
              { label: '禁用', value: 'inactive' },
            ]} />
          </Form>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <Button onClick={() => setIsModalOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleSubmit}>确认</Button>
          </div>
        </div>
      </Sidebar.Container>
    </div>
  );
}

export default UsersPage;
