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
  Typography,
  Row,
  Col,
  Checkbox,
  List,
  Pagination,
  Empty,
  Skeleton,
  Tooltip,
} from '@douyinfe/semi-ui';
import {
  IconPlus,
  IconEdit,
  IconDelete,
  IconSafe,
  IconKey,
  IconUserGroup,
  IconSearch,
} from '@douyinfe/semi-icons';
import api from '../../lib/api';

const { Text, Title } = Typography;

interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  remark?: string;
  permissions?: string[];
  menus?: any[];
  user_count?: number;
  created_at?: string;
}

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

const pageSize = 10;

function RolesPage() {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const formApi = useRef<any>();

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await api.get('/system/roles');
      setRoles(data.roles || data || []);
    } catch (error) {
      Toast.error('获取角色列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText]);

  const handleAdd = () => {
    setEditingRole(null);
    formApi.current?.reset();
    formApi.current?.setValue('permissions', []);
    setIsModalOpen(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    formApi.current?.setValues({
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
      Toast.success('删除成功');
      fetchRoles();
    } catch (error) {
      Toast.error(typeof error === 'string' ? error : '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await formApi.current?.validate();
      const payload = { ...values, remark: values.description };
      delete payload.description;

      if (editingRole) {
        await api.put(`/system/roles/${editingRole.id}`, payload);
        Toast.success('更新成功');
      } else {
        await api.post('/system/roles', payload);
        Toast.success('创建成功');
      }
      setIsModalOpen(false);
      fetchRoles();
    } catch (error) {
      Toast.error(typeof error === 'string' ? error : '操作失败');
    }
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchText.toLowerCase()) ||
      role.code.toLowerCase().includes(searchText.toLowerCase())
  );

  const paginatedRoles = filteredRoles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title heading={3} style={{ margin: 0 }}>角色管理</Title>
          <Text type="tertiary">管理系统角色和权限配置</Text>
        </div>
        <Space>
          <Input prefix={<IconSearch />} placeholder="搜索角色..." value={searchText} onChange={setSearchText} showClear style={{ width: 240 }} />
          <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>创建角色</Button>
        </Space>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding: 24 }}><Skeleton.Paragraph rows={5} /></div>
      ) : (
        <List
          dataSource={paginatedRoles}
          style={{ minHeight: 400 }}
          emptyContent={<Empty description="暂无角色" />}
          renderItem={(role) => (
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
                {/* 图标 */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IconSafe style={{ fontSize: 20, color: '#fff' }} />
                </div>

                {/* 主信息 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text strong style={{ fontSize: 15 }}>{role.name}</Text>
                    <Tag size="small">{role.code}</Tag>
                  </div>
                  <Text type="tertiary" size="small" style={{ display: 'block', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {role.description || role.remark || '暂无描述'}
                  </Text>
                </div>

                {/* 标签 */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  <Tag size="small" color="blue" prefixIcon={<IconKey style={{ fontSize: 10 }} />}>
                    {role.permissions?.length || role.menus?.length || 0} 项权限
                  </Tag>
                  <Tag size="small" prefixIcon={<IconUserGroup style={{ fontSize: 10 }} />}>
                    {role.user_count || 0} 人
                  </Tag>
                </div>

                {/* 时间 */}
                <Text type="tertiary" size="small" style={{ width: 100, textAlign: 'right', flexShrink: 0 }}>
                  {role.created_at ? new Date(role.created_at).toLocaleDateString('zh-CN') : '-'}
                </Text>

                {/* 操作按钮 */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <Tooltip content="编辑">
                    <Button type="tertiary" icon={<IconEdit />} size="small" theme="borderless" onClick={() => handleEdit(role)} />
                  </Tooltip>
                  <Popconfirm
                    title="确定删除？"
                    content="此操作不可撤销"
                    onConfirm={() => handleDelete(role.id)}
                    disabled={role.code === 'super_admin'}
                  >
                    <Button
                      type="tertiary"
                      icon={<IconDelete />}
                      size="small"
                      theme="borderless"
                      style={{ color: role.code === 'super_admin' ? undefined : 'var(--semi-color-danger)' }}
                      disabled={role.code === 'super_admin'}
                    />
                  </Popconfirm>
                </div>
              </div>
            </List.Item>
          )}
        />
      )}

      {/* Pagination */}
      {filteredRoles.length > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <Pagination total={filteredRoles.length} pageSize={pageSize} currentPage={currentPage} onChange={setCurrentPage} />
        </div>
      )}

      {/* Create/Edit Sidebar */}
      <Sidebar.Container visible={isModalOpen} title={editingRole ? '编辑角色' : '新增角色'} onCancel={() => setIsModalOpen(false)} defaultSize={{ width: 480 }}>
        <div style={{ padding: '16px 0' }}>
          <Form getFormApi={(api) => { formApi.current = api; }} layout="vertical" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Input field="name" label="角色名称" rules={[{ required: true }]} placeholder="请输入角色名称" />
              </Col>
              <Col span={12}>
                <Form.Input field="code" label="角色代码" rules={[{ required: true }]} placeholder="如: role_admin" disabled={!!editingRole} />
              </Col>
            </Row>
            <Form.TextArea field="description" label="描述" placeholder="请输入角色描述" rows={2} />
            <Form.CheckboxGroup field="permissions" label="权限配置">
              <Row gutter={[8, 8]}>
                {permissionOptions.map((option) => (
                  <Col span={12} key={option.value}>
                    <Checkbox value={option.value}>{option.label}</Checkbox>
                  </Col>
                ))}
              </Row>
            </Form.CheckboxGroup>
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

export default RolesPage;
