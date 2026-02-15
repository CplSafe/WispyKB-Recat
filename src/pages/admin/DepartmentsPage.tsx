import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Button,
  Space,
  Input,
  Tag,
  Modal,
  Form,
  Toast,
  Popconfirm,
  Typography,
  Table,
  Avatar,
  Empty,
  Row,
  Col,
  Divider,
  Tooltip,
} from '@douyinfe/semi-ui';
import {
  IconPlus,
  IconEdit,
  IconDelete,
  IconBranch,
  IconMember,
  IconUser,
  IconArrowDown,
  IconArrowRight,
  IconSearch,
  IconArchive,
  IconInfoCircle,
} from '@douyinfe/semi-icons';
import dayjs from 'dayjs';
import api from '../../lib/api';

const { Text, Title } = Typography;

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

// Tree Node Component
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
      <div
        onClick={onClick}
        className="dept-tree-node"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          paddingLeft: indentation,
          cursor: 'pointer',
          background: isSelected ? 'var(--semi-color-primary-light-default)' : 'transparent',
          borderRadius: 8,
          marginBottom: 2,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          borderLeft: isSelected ? '3px solid var(--semi-color-primary)' : '3px solid transparent',
          position: 'relative',
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
              background: isExpanded ? 'var(--semi-color-primary-light-default)' : 'transparent',
            }}
          >
            {isExpanded ? (
              <IconArrowDown style={{ fontSize: 11, color: 'var(--semi-color-primary)' }} />
            ) : (
              <IconArrowRight style={{ fontSize: 11, color: 'var(--semi-color-text-3)' }} />
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
          background: hasChildren ? 'var(--semi-color-warning-light-default)' : 'var(--semi-color-success-light-default)',
          transition: 'all 0.2s ease',
        }}>
          {hasChildren ? (
            <IconArchive style={{ color: 'var(--semi-color-warning)', fontSize: 14 }} />
          ) : (
            <IconBranch style={{ color: 'var(--semi-color-success)', fontSize: 14 }} />
          )}
        </div>

        {/* Department Name */}
        <Text
          strong={isSelected}
          style={{
            color: isSelected ? 'var(--semi-color-primary)' : 'var(--semi-color-text-0)',
            flex: 1,
            transition: 'color 0.2s ease',
          }}
        >
          {dept.name}
        </Text>

        {/* User Count Badge */}
        <Tooltip title={`${dept.user_count || 0} 名成员`}>
          <Tag
            size="small"
            style={{
              marginLeft: 8,
              background: isSelected ? 'var(--semi-color-primary-light-default)' : 'var(--semi-color-fill-0)',
              border: isSelected ? '1px solid var(--semi-color-primary-light-active)' : '1px solid transparent',
              color: isSelected ? 'var(--semi-color-primary)' : 'var(--semi-color-text-2)',
            }}
          >
            <IconMember style={{ fontSize: 10, marginRight: 3 }} />
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
            background: 'var(--semi-color-border)',
            borderRadius: 1,
          }}
        />
      )}
    </div>
  );
}

function DepartmentsPage() {

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
  const formApi = useRef<any>();

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
      Toast.error('获取部门列表失败');
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
      Toast.error('获取部门用户失败');
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
    formApi.current?.reset();
    setIsModalOpen(true);
  };

  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    formApi.current?.setValues({
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
      Toast.success('删除成功');

      if (selectedDeptId === id) {
        setSelectedDeptId(null);
        setSelectedDept(null);
        setUsers([]);
      }

      fetchDepartments();
    } catch (error) {
      Toast.error(typeof error === 'string' ? error : '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await formApi.current?.validate();

      const payload = {
        ...values,
        remark: values.description,
        sort: 0,
        status: 1,
      };
      delete payload.description;

      if (editingDept) {
        await api.put(`/system/departments/${editingDept.id}`, payload);
        Toast.success('更新成功');
      } else {
        await api.post('/system/departments', payload);
        Toast.success('创建成功');
      }

      setIsModalOpen(false);
      fetchDepartments();
    } catch (error) {
      Toast.error(typeof error === 'string' ? error : '操作失败');
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

  // User table columns
  const userColumns: any[] = [
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            size="default"
            src={record.avatar}
            alt={text}
            style={{ flexShrink: 0, background: 'var(--semi-color-primary)' }}
          >
            {!record.avatar && <IconUser />}
          </Avatar>
          <div>
            <Text>{text}</Text>
            {record.email && (
              <Text type="tertiary" size="small" style={{ display: 'block' }}>
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
        const roleConfig: Record<string, { color: string; label: string }> = {
          super_admin: { color: 'red', label: '超级管理员' },
          admin: { color: 'orange', label: '管理员' },
          member: { color: 'grey', label: '成员' },
        };
        const cfg = roleConfig[role || 'member'] || roleConfig.member;
        return (
          <Tag color={cfg.color} size="large">
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
        <Text type="tertiary">
          {date ? dayjs(date).format('YYYY-MM-DD') : '-'}
        </Text>
      ),
    },
  ];

  return (
    <div style={{
        minHeight: '100vh',
        background: 'var(--semi-color-bg-1)',
      }}>
        {/* Page Header */}
        <div style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <div>
            <Title heading={3} style={{ margin: 0 }}>
              部门管理
            </Title>
            <Text type="tertiary" style={{ marginTop: 4, display: 'block' }}>
              管理组织架构和部门成员
            </Text>
          </div>

          <Button
            type="primary"
            theme="solid"
            icon={<IconPlus />}
            onClick={handleAdd}
          >
            新增部门
          </Button>
        </div>

        <Row gutter={20}>
          {/* Left Sidebar: Department Tree */}
          <Col span={8}>
            <Card
              style={{ height: 'fit-content' }}
              title={
                <Space>
                  <IconArchive style={{ color: 'var(--semi-color-primary)', fontSize: 16 }} />
                  <Text strong>
                    组织架构
                  </Text>
                  <Tag size="small" color="blue">
                    {flattenDepts(departments).length} 个部门
                  </Tag>
                </Space>
              }
              loading={loading}
            >
              {/* Search Box */}
              <Input
                placeholder="搜索部门..."
                prefix={<IconSearch style={{ color: 'var(--semi-color-text-3)' }} />}
                value={searchText}
                onChange={(value) => setSearchText(value)}
                style={{ marginBottom: 12 }}
                showClear
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
                    style={{ padding: '40px 0' }}
                  />
                )}
              </div>
            </Card>
          </Col>

          {/* Right Content: Department Details & Users */}
          <Col span={16}>
            <Card
              style={{ minHeight: 500 }}
              title={
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    <IconMember style={{ color: 'var(--semi-color-primary)', fontSize: 16 }} />
                    <Text strong>
                      {selectedDept?.name || '部门成员'}
                    </Text>
                    {selectedDept && (
                      <Tag size="small" color="blue">
                        {users.length} 名成员
                      </Tag>
                    )}
                  </Space>

                  {selectedDept && (
                    <Space split={<Divider type="vertical" style={{ margin: '0 8px' }} />}>
                      <Button
                        type="tertiary"
                        size="small"
                        icon={<IconEdit />}
                        onClick={() => handleEdit(selectedDept)}
                      >
                        编辑
                      </Button>
                      <Popconfirm
                        title="确认删除"
                        content="确定要删除该部门吗？"
                        onConfirm={() => handleDelete(selectedDept.id)}
                        okText="确认"
                        cancelText="取消"
                        disabled={(selectedDept.user_count || 0) > 0}
                      >
                        <Button
                          type="danger"
                          size="small"
                          icon={<IconDelete />}
                          disabled={(selectedDept.user_count || 0) > 0}
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
                      background: 'var(--semi-color-primary-light-default)',
                      borderRadius: 'var(--semi-border-radius-medium)',
                      border: '1px solid var(--semi-color-primary-light-active)',
                    }}
                  >
                    <Row gutter={24}>
                      <Col span={12}>
                        <Space size={8}>
                          <IconInfoCircle style={{ color: 'var(--semi-color-primary)' }} />
                          <Text type="tertiary">
                            部门代码
                          </Text>
                          <Text code>
                            {selectedDept.code}
                          </Text>
                        </Space>
                      </Col>
                      <Col span={12}>
                        {selectedDept.description || selectedDept.remark ? (
                          <Space size={8}>
                            <Text type="tertiary">
                              描述
                            </Text>
                            <Text>
                              {selectedDept.description || selectedDept.remark}
                            </Text>
                          </Space>
                        ) : (
                          <Text type="tertiary">
                            暂无描述
                          </Text>
                        )}
                      </Col>
                    </Row>
                  </div>

                  {/* Users Table */}
                  <div
                    style={{
                      background: 'var(--semi-color-bg-0)',
                      borderRadius: 'var(--semi-border-radius-medium)',
                      border: '1px solid var(--semi-color-border)',
                      overflow: 'hidden',
                    }}
                  >
                    <Table
                      columns={userColumns}
                      dataSource={users}
                      rowKey="id"
                      pagination={false}
                      size="default"
                      empty={
                        <Empty
                          description="该部门暂无成员"
                          style={{ padding: '50px 0' }}
                        >
                          <Text type="tertiary">
                            可通过用户管理页面为部门添加成员
                          </Text>
                        </Empty>
                      }
                    />
                  </div>
                </>
              ) : (
                <Empty
                  description="请选择左侧部门查看成员"
                  style={{ padding: '100px 0' }}
                >
                  <Text type="tertiary">
                    点击部门树中的任意部门即可查看其成员信息
                  </Text>
                </Empty>
              )}
            </Card>
          </Col>
        </Row>

        {/* Add/Edit Modal */}
        <Modal
          title={editingDept ? '编辑部门' : '新增部门'}
          visible={isModalOpen}
          onOk={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          okText={editingDept ? '保存' : '创建'}
          cancelText="取消"
          width={520}
        >
          <Form getFormApi={(api) => { formApi.current = api; }} layout="vertical">
            <Form.Input
              field="name"
              label="部门名称"
              rules={[{ required: true, message: '请输入部门名称' }]}
              prefix={<IconBranch style={{ color: 'var(--semi-color-text-3)' }} />}
              placeholder="请输入部门名称"
            />

            <Form.Input
              field="code"
              label="部门代码"
              rules={[{ required: true, message: '请输入部门代码' }]}
              placeholder="如: dept_tech_a"
            />

            <Form.Select
              field="parent_id"
              label="上级部门"
              placeholder="请选择上级部门（留空则创建为顶级部门）"
              optionList={getParentOptions()}
              filter
              showClear
            />

            <Form.TextArea
              field="description"
              label="描述"
              placeholder="请输入部门描述"
              rows={3}
            />
          </Form>
        </Modal>
      </div>
    );
}

export default DepartmentsPage;
