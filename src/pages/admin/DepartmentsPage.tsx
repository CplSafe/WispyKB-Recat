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
  Typography,
  Table,
  Avatar,
  Empty,
  Row,
  Col,
  Divider,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
  TeamOutlined,
  UserOutlined,
  CaretDownFilled,
  CaretRightFilled,
  SearchOutlined,
  BankOutlined,
  UsergroupAddOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../lib/api';

const { Text } = Typography;

// Design System Colors (from UI/UX Pro Max)
const colors = {
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryDark: '#5B21B6',
  secondary: '#F97316',
  background: '#FAF5FF',
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  success: '#10B981',
  successBg: '#D1FAE5',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
};

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  remark?: string;
  parent_id?: string;
  parent_name?: string;
  user_count?: number;
  created_at?: string;
  children?: Department[];
  sort?: number;
  status?: number;
}

interface DepartmentUser {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  role?: string;
  department_name?: string;
  created_at?: string;
}

// Tree Node Component with Modern Design
function TreeNode({ dept, isSelected, level, hasChildren, isExpanded, onToggle, onClick }: {
  dept: Department;
  isSelected: boolean;
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onClick: () => void;
}) {
  const indentation = 12 + level * 20;

  return (
    <div style={{ position: 'relative' }}>
      {/* Node Container */}
      <div
        onClick={onClick}
        className="dept-tree-node"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          paddingLeft: indentation,
          cursor: 'pointer',
          background: isSelected ? `${colors.primary}15` : 'transparent',
          borderRadius: 8,
          marginBottom: 2,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          borderLeft: isSelected ? `3px solid ${colors.primary}` : '3px solid transparent',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.background = colors.borderLight;
            e.currentTarget.style.transform = 'translateX(2px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.transform = 'translateX(0)';
          }
        }}
      >
        {/* Expand/Collapse Toggle */}
        {hasChildren ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="expand-toggle"
            style={{
              width: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 6,
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: isExpanded ? `${colors.primary}15` : 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.primary + '25';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isExpanded ? `${colors.primary}15` : 'transparent';
            }}
          >
            {isExpanded ? (
              <CaretDownFilled style={{ fontSize: 11, color: colors.primary }} />
            ) : (
              <CaretRightFilled style={{ fontSize: 11, color: colors.textLight }} />
            )}
          </div>
        ) : (
          <span style={{ width: 26, display: 'inline-block' }} />
        )}

        {/* Department Icon */}
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
          background: hasChildren ? colors.warningBg : colors.successBg,
          transition: 'all 0.2s ease',
        }}>
          {hasChildren ? (
            <BankOutlined style={{ color: colors.warning, fontSize: 14 }} />
          ) : (
            <ApartmentOutlined style={{ color: colors.success, fontSize: 14 }} />
          )}
        </div>

        {/* Department Name */}
        <Text
          style={{
            fontSize: 14,
            color: isSelected ? colors.primaryDark : colors.text,
            fontWeight: isSelected ? 600 : 500,
            flex: 1,
            transition: 'color 0.2s ease',
          }}
        >
          {dept.name}
        </Text>

        {/* User Count Badge */}
        <Tooltip title={`${dept.user_count || 0} 名成员`}>
          <Tag
            style={{
              fontSize: 11,
              padding: '2px 8px',
              background: isSelected ? `${colors.primary}20` : colors.borderLight,
              border: isSelected ? `1px solid ${colors.primary}40` : '1px solid transparent',
              color: isSelected ? colors.primaryDark : colors.textSecondary,
              borderRadius: 12,
              marginLeft: 8,
              fontWeight: 500,
            }}
          >
            <UsergroupAddOutlined style={{ fontSize: 10, marginRight: 3 }} />
            {dept.user_count || 0}
          </Tag>
        </Tooltip>
      </div>

      {/* Connection Line for Children */}
      {hasChildren && isExpanded && (
        <div
          style={{
            position: 'absolute',
            left: indentation + 15,
            top: 40,
            bottom: 0,
            width: 2,
            background: `linear-gradient(to bottom, ${colors.border} 0%, ${colors.border}50 100%)`,
            borderRadius: 1,
          }}
        />
      )}
    </div>
  );
}

function DepartmentsPage() {
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  const [users, setUsers] = useState<DepartmentUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [form] = Form.useForm();

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const data = await api.get('/system/departments');
      const deptList = data.departments || data || [];
      setDepartments(deptList);

      // Auto-expand all nodes by default
      const allKeys = new Set(getAllDeptKeys(deptList));
      setExpandedKeys(allKeys);

      // Auto-select first department
      if (deptList.length > 0 && !selectedDeptId) {
        handleSelectDept(deptList[0].id, deptList[0]);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      messageApi.error('获取部门列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getAllDeptKeys = (depts: Department[]): string[] => {
    const keys: string[] = [];
    const collect = (items: Department[]) => {
      for (const item of items) {
        keys.push(item.id);
        if (item.children && item.children.length > 0) {
          collect(item.children);
        }
      }
    };
    collect(depts);
    return keys;
  };

  const fetchDeptUsers = async (deptId: string) => {
    setUsersLoading(true);
    try {
      const data = await api.get(`/system/departments/${deptId}/users`);
      setUsers(data.users || data || []);
    } catch (error) {
      console.error('Failed to fetch dept users:', error);
      messageApi.error('获取部门用户失败');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const toggleExpand = (deptId: string) => {
    const newKeys = new Set(expandedKeys);
    if (newKeys.has(deptId)) {
      newKeys.delete(deptId);
    } else {
      newKeys.add(deptId);
    }
    setExpandedKeys(newKeys);
  };

  // Filter departments by search text
  const filterDepartments = (depts: Department[]): Department[] => {
    if (!searchText) return depts;
    return depts
      .map(dept => ({
        ...dept,
        children: dept.children ? filterDepartments(dept.children) : [],
      }))
      .filter(dept =>
        dept.name.toLowerCase().includes(searchText.toLowerCase()) ||
        dept.code?.toLowerCase().includes(searchText.toLowerCase()) ||
        (dept.children && dept.children.length > 0)
      );
  };

  // Recursively render tree nodes
  const renderTreeNodes = (depts: Department[], level: number = 0): React.ReactNode => {
    const filtered = filterDepartments(depts);
    if (filtered.length === 0 && searchText) return null;

    return filtered.map((dept) => {
      const hasChildren = dept.children && dept.children.length > 0;
      const isSelected = dept.id === selectedDeptId;
      const isExpanded = expandedKeys.has(dept.id);

      return (
        <div key={dept.id} style={{ position: 'relative' }}>
          <TreeNode
            dept={dept}
            isSelected={isSelected}
            level={level}
            hasChildren={hasChildren}
            isExpanded={isExpanded}
            onToggle={() => toggleExpand(dept.id)}
            onClick={() => handleSelectDept(dept.id, dept)}
          />
          {hasChildren && isExpanded && (
            <div>
              {renderTreeNodes(dept.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const handleSelectDept = (deptId: string, dept: Department) => {
    setSelectedDeptId(deptId);
    setSelectedDept(dept);
    fetchDeptUsers(deptId);
  };

  const handleAdd = () => {
    setEditingDept(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    form.setFieldsValue({
      name: dept.name,
      code: dept.code,
      description: dept.description || dept.remark,
      parent_id: dept.parent_id,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/system/departments/${id}`);
      messageApi.success('删除成功');

      if (selectedDeptId === id) {
        setSelectedDeptId(null);
        setSelectedDept(null);
        setUsers([]);
      }

      fetchDepartments();
    } catch (error) {
      messageApi.error(typeof error === 'string' ? error : '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        ...values,
        remark: values.description,
        sort: 0,
        status: 1,
      };
      delete payload.description;

      if (editingDept) {
        await api.put(`/system/departments/${editingDept.id}`, payload);
        messageApi.success('更新成功');
      } else {
        await api.post('/system/departments', payload);
        messageApi.success('创建成功');
      }

      setIsModalOpen(false);
      fetchDepartments();
    } catch (error) {
      messageApi.error(typeof error === 'string' ? error : '操作失败');
    }
  };

  const flattenDepts = (depts: Department[]): Department[] => {
    const result: Department[] = [];
    const flatten = (items: Department[]) => {
      for (const item of items) {
        result.push(item);
        if (item.children && item.children.length > 0) {
          flatten(item.children);
        }
      }
    };
    flatten(depts);
    return result;
  };

  const getDeptPath = (dept: Department, allDepts: Department[]): string => {
    const path: string[] = [dept.name];
    let current = dept;
    while (current.parent_id) {
      const parent = allDepts.find(d => d.id === current.parent_id);
      if (parent) {
        path.unshift(parent.name);
        current = parent;
      } else {
        break;
      }
    }
    return path.join(' / ');
  };

  const getParentOptions = () => {
    const allDepts = flattenDepts(departments);
    return allDepts
      .filter((d) => editingDept ? d.id !== editingDept.id : true)
      .map((d) => ({
        label: getDeptPath(d, allDepts),
        value: d.id,
      }));
  };

  // User table columns with modern styling
  const userColumns: ColumnsType<DepartmentUser> = [
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            size={40}
            src={record.avatar}
            icon={<UserOutlined />}
            style={{
              flexShrink: 0,
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
            }}
          />
          <div>
            <div style={{ fontWeight: 500, fontSize: 14, color: colors.text }}>{text}</div>
            {record.email && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.email}
              </Text>
            )}
          </div>
        </div>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 140,
      render: (role) => {
        const roleConfig: Record<string, { color: string; label: string; bg: string }> = {
          super_admin: { color: '#DC2626', label: '超级管理员', bg: '#FEE2E2' },
          admin: { color: '#EA580C', label: '管理员', bg: '#FFEDD5' },
          member: { color: colors.textSecondary, label: '成员', bg: colors.borderLight },
        };
        const cfg = roleConfig[role || 'member'] || roleConfig.member;
        return (
          <Tag
            style={{
              color: cfg.color,
              background: cfg.bg,
              border: 'none',
              borderRadius: 6,
              padding: '4px 10px',
              fontWeight: 500,
            }}
          >
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: '加入时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (date) => (
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>
          {date ? dayjs(date).format('YYYY-MM-DD') : '-'}
        </Text>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <div style={{
        padding: '24px',
        minHeight: '100vh',
        background: colors.background,
      }}>
        {/* Page Header */}
        <div style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <div>
            <Typography.Title
              level={3}
              style={{
                margin: 0,
                color: colors.text,
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: '-0.5px',
              }}
            >
              部门管理
            </Typography.Title>
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4, display: 'block' }}>
              管理组织架构和部门成员
            </Text>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            style={{
              borderRadius: 10,
              height: 40,
              paddingLeft: 18,
              paddingRight: 18,
              fontWeight: 500,
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
              border: 'none',
              boxShadow: `0 4px 12px ${colors.primary}40`,
            }}
          >
            新增部门
          </Button>
        </div>

        <Row gutter={20}>
          {/* Left Sidebar: Department Tree */}
          <Col span={8}>
            <Card
              styles={{
                body: { padding: '16px' },
                header: { padding: '16px 20px', borderBottom: `1px solid ${colors.border}` }
              }}
              style={{
                borderRadius: 16,
                height: 'fit-content',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                border: `1px solid ${colors.border}`,
              }}
              title={
                <Space>
                  <BankOutlined style={{ color: colors.primary, fontSize: 16 }} />
                  <span style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>
                    组织架构
                  </span>
                  <Tag
                    style={{
                      marginLeft: 8,
                      background: `${colors.primary}15`,
                      color: colors.primaryDark,
                      border: 'none',
                      borderRadius: 12,
                      fontSize: 11,
                      padding: '2px 8px',
                    }}
                  >
                    {flattenDepts(departments).length} 个部门
                  </Tag>
                </Space>
              }
              loading={loading}
            >
              {/* Search Box */}
              <Input
                placeholder="搜索部门..."
                prefix={<SearchOutlined style={{ color: colors.textLight }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{
                  marginBottom: 12,
                  borderRadius: 10,
                  borderColor: colors.border,
                }}
                allowClear
              />

              {/* Tree Content */}
              <div
                style={{
                  maxHeight: 'calc(100vh - 320px)',
                  overflowY: 'auto',
                  padding: '4px 0',
                }}
              >
                {renderTreeNodes(departments)?.valueOf() ? (
                  <div>{renderTreeNodes(departments)}</div>
                ) : (
                  <Empty
                    description={searchText ? '未找到匹配的部门' : '暂无部门'}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    style={{ padding: '40px 0' }}
                  />
                )}
              </div>
            </Card>
          </Col>

          {/* Right Content: Department Details & Users */}
          <Col span={16}>
            <Card
              styles={{
                body: { padding: selectedDept ? '20px' : '24px' },
                header: { padding: '16px 24px', borderBottom: `1px solid ${colors.border}` }
              }}
              style={{
                borderRadius: 16,
                minHeight: 500,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                border: `1px solid ${colors.border}`,
              }}
              title={
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <TeamOutlined style={{ color: colors.primary, fontSize: 16 }} />
                    <span style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>
                      {selectedDept?.name || '部门成员'}
                    </span>
                    {selectedDept && (
                      <Tag
                        style={{
                          background: `${colors.primary}15`,
                          color: colors.primaryDark,
                          border: 'none',
                          borderRadius: 12,
                          fontSize: 12,
                          padding: '4px 10px',
                          fontWeight: 500,
                        }}
                      >
                        {users.length} 名成员
                      </Tag>
                    )}
                  </Space>

                  {selectedDept && (
                    <Space split={<Divider type="vertical" style={{ margin: '0 8px' }} />}>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(selectedDept)}
                        style={{
                          color: colors.text,
                          fontWeight: 500,
                        }}
                      >
                        编辑
                      </Button>
                      <Popconfirm
                        title="确认删除"
                        description="确定要删除该部门吗？"
                        onConfirm={() => handleDelete(selectedDept.id)}
                        okText="确认"
                        cancelText="取消"
                        disabled={(selectedDept.user_count || 0) > 0}
                      >
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          disabled={(selectedDept.user_count || 0) > 0}
                          style={{
                            color: colors.danger,
                            fontWeight: 500,
                          }}
                        >
                          删除
                        </Button>
                      </Popconfirm>
                    </Space>
                  )}
                </Space>
              }
              loading={usersLoading}
            >
              {selectedDept ? (
                <>
                  {/* Department Info Card */}
                  <div
                    style={{
                      marginBottom: 20,
                      padding: '18px 20px',
                      background: `linear-gradient(135deg, ${colors.primary}10 0%, ${colors.primaryLight}15 100%)`,
                      borderRadius: 12,
                      border: `1px solid ${colors.primary}30`,
                    }}
                  >
                    <Row gutter={24}>
                      <Col span={12}>
                        <Space size={8}>
                          <InfoCircleOutlined style={{ color: colors.primaryDark }} />
                          <Text type="secondary" style={{ fontSize: 13, color: colors.textSecondary }}>
                            部门代码
                          </Text>
                          <Text
                            code
                            style={{
                              background: colors.surface,
                              borderColor: `${colors.primary}40`,
                              color: colors.primaryDark,
                              fontSize: 13,
                              padding: '3px 10px',
                              borderRadius: 6,
                            }}
                          >
                            {selectedDept.code}
                          </Text>
                        </Space>
                      </Col>
                      <Col span={12}>
                        {selectedDept.description || selectedDept.remark ? (
                          <Space size={8}>
                            <Text type="secondary" style={{ fontSize: 13, color: colors.textSecondary }}>
                              描述
                            </Text>
                            <Text style={{ fontSize: 13, color: colors.text }}>
                              {selectedDept.description || selectedDept.remark}
                            </Text>
                          </Space>
                        ) : (
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            暂无描述
                          </Text>
                        )}
                      </Col>
                    </Row>
                  </div>

                  {/* Users Table */}
                  <div
                    style={{
                      background: colors.surface,
                      borderRadius: 12,
                      border: `1px solid ${colors.border}`,
                      overflow: 'hidden',
                    }}
                  >
                    <Table
                      columns={userColumns}
                      dataSource={users}
                      rowKey="id"
                      pagination={false}
                      size="middle"
                      styles={{
                        header: {
                          background: `${colors.borderLight}`,
                          borderBottom: `1px solid ${colors.border}`,
                        },
                        cell: { padding: '14px 16px' },
                      }}
                      locale={{
                        emptyText: (
                          <Empty
                            description="该部门暂无成员"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            style={{ padding: '50px 0' }}
                          >
                            <Text type="secondary" style={{ fontSize: 13 }}>
                              可通过用户管理页面为部门添加成员
                            </Text>
                          </Empty>
                        ),
                      }}
                    />
                  </div>
                </>
              ) : (
                <Empty
                  description="请选择左侧部门查看成员"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ padding: '100px 0' }}
                >
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    点击部门树中的任意部门即可查看其成员信息
                  </Text>
                </Empty>
              )}
            </Card>
          </Col>
        </Row>

        {/* Add/Edit Modal */}
        <Modal
          title={
            <Space>
              <span style={{
                fontSize: 17,
                fontWeight: 600,
                color: colors.text,
              }}>
                {editingDept ? '编辑部门' : '新增部门'}
              </span>
            </Space>
          }
          open={isModalOpen}
          onOk={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          okText="确认"
          cancelText="取消"
          width={520}
          styles={{
            body: { paddingTop: 20 },
            header: { borderBottom: `1px solid ${colors.border}` }
          }}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="name"
              label={
                <span style={{ fontWeight: 500, color: colors.text }}>
                  部门名称
                </span>
              }
              rules={[{ required: true, message: '请输入部门名称' }]}
            >
              <Input
                placeholder="请输入部门名称"
                prefix={<ApartmentOutlined style={{ color: colors.textLight }} />}
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="code"
              label={
                <span style={{ fontWeight: 500, color: colors.text }}>
                  部门代码
                </span>
              }
              rules={[{ required: true, message: '请输入部门代码' }]}
            >
              <Input
                placeholder="如: dept_tech_a"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="parent_id"
              label={
                <span style={{ fontWeight: 500, color: colors.text }}>
                  上级部门
                </span>
              }
            >
              <Form.NoStyle shouldUpdate>
                {() => (
                  <Select
                    placeholder="请选择上级部门（留空则创建为顶级部门）"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    options={getParentOptions()}
                    style={{ borderRadius: 8 }}
                  />
                )}
              </Form.NoStyle>
            </Form.Item>

            <Form.Item
              name="description"
              label={
                <span style={{ fontWeight: 500, color: colors.text }}>
                  描述
                </span>
              }
            >
              <Input.TextArea
                placeholder="请输入部门描述"
                rows={3}
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </>
  );
}

export default DepartmentsPage;
