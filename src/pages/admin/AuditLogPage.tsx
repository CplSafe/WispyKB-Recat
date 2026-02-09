import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Select,
  DatePicker,
  Typography,
  Row,
  Col,
  Statistic,
  Tabs,
  Modal,
  message,
} from 'antd';
import {
  HistoryOutlined,
  UserOutlined,
  EyeOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '../../lib/api';

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface AuditLog {
  id: string;
  entity_type?: string;
  entity_id?: string;
  action: string;
  user_id: string;
  username: string;
  changes?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

interface OperateLog {
  id: string;
  user_id?: string;
  username?: string;
  module?: string;
  operation?: string;
  request_method?: string;
  request_url?: string;
  request_ip?: string;
  user_agent?: string;
  status?: number;
  error_msg?: string;
  execute_time?: number;
  created_at: string;
}

interface LoginLog {
  id: string;
  username?: string;
  status?: number;
  ip_address?: string;
  user_agent?: string;
  error_msg?: string;
  login_at: string;
}

const actionMap: Record<string, { text: string; color: string }> = {
  create: { text: '创建', color: 'green' },
  update: { text: '更新', color: 'blue' },
  delete: { text: '删除', color: 'red' },
  view: { text: '查看', color: 'default' },
  login: { text: '登录', color: 'green' },
  logout: { text: '登出', color: 'default' },
  upload: { text: '上传', color: 'blue' },
  download: { text: '下载', color: 'blue' },
};

function AuditLogPage() {
  const [messageApi, contextHolder] = message.useMessage();

  const [activeTab, setActiveTab] = useState('audit');

  // 审计日志
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);

  // 操作日志
  const [operateLogs, setOperateLogs] = useState<OperateLog[]>([]);
  const [operateLoading, setOperateLoading] = useState(false);
  const [operateTotal, setOperateTotal] = useState(0);
  const [operatePage, setOperatePage] = useState(1);

  // 登录日志
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginTotal, setLoginTotal] = useState(0);
  const [loginPage, setLoginPage] = useState(1);

  // 统计数据
  const [stats, setStats] = useState({
    today_count: 0,
    week_count: 0,
  });

  // 筛选条件
  const [filters, setFilters] = useState({
    action: undefined as string | undefined,
    user_id: undefined as string | undefined,
  });

  const fetchAuditLogs = async (page = 1) => {
    setAuditLoading(true);
    try {
      const params: any = { page, page_size: 20 };
      if (filters.action) params.action = filters.action;
      if (filters.user_id) params.user_id = filters.user_id;

      const data = await api.get('/system/audit', { params });
      setAuditLogs(data.logs || []);
      setAuditTotal(data.total || 0);
      setAuditPage(page);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      messageApi.error('获取审计日志失败');
    } finally {
      setAuditLoading(false);
    }
  };

  const fetchOperateLogs = async (page = 1) => {
    setOperateLoading(true);
    try {
      const data = await api.get('/system/audit/operate-logs', {
        params: { page, page_size: 20 },
      });
      setOperateLogs(data.logs || []);
      setOperateTotal(data.total || 0);
      setOperatePage(page);
    } catch (error) {
      console.error('Failed to fetch operate logs:', error);
      messageApi.error('获取操作日志失败');
    } finally {
      setOperateLoading(false);
    }
  };

  const fetchLoginLogs = async (page = 1) => {
    setLoginLoading(true);
    try {
      const data = await api.get('/system/audit/login-logs', {
        params: { page, page_size: 20 },
      });
      setLoginLogs(data.logs || []);
      setLoginTotal(data.total || 0);
      setLoginPage(page);
    } catch (error) {
      console.error('Failed to fetch login logs:', error);
      messageApi.error('获取登录日志失败');
    } finally {
      setLoginLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.get('/system/audit/stats');
      setStats({
        today_count: data.today_count || 0,
        week_count: data.week_count || 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchAuditLogs(1);
    fetchStats();
  }, [filters]);

  // 审计日志表格列
  const auditColumns: ColumnsType<AuditLog> = [
    {
      title: '操作人',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (text) => (
        <Space>
          <UserOutlined style={{ color: '#1890ff' }} />
          {text}
        </Space>
      ),
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (text) => {
        const info = actionMap[text] || { text, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '实体类型',
      dataIndex: 'entity_type',
      key: 'entity_type',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 140,
      render: (text) => text || '-',
    },
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '详情',
      key: 'details',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => showLogDetails(record)}
        >
          查看
        </Button>
      ),
    },
  ];

  // 操作日志表格列
  const operateColumns: ColumnsType<OperateLog> = [
    {
      title: '操作人',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 100,
    },
    {
      title: '操作',
      dataIndex: 'operation',
      key: 'operation',
      width: 150,
    },
    {
      title: '请求方法',
      dataIndex: 'request_method',
      key: 'request_method',
      width: 80,
      render: (text) => (
        <Tag color={text === 'GET' ? 'green' : text === 'POST' ? 'blue' : 'orange'}>
          {text}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) =>
        status === 0 ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            成功
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="error">
            失败
          </Tag>
        ),
    },
    {
      title: '耗时',
      dataIndex: 'execute_time',
      key: 'execute_time',
      width: 100,
      render: (time) => (time ? `${time}ms` : '-'),
    },
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  // 登录日志表格列
  const loginColumns: ColumnsType<LoginLog> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 150,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) =>
        status === 0 ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            成功
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="error">
            失败
          </Tag>
        ),
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 150,
    },
    {
      title: '错误信息',
      dataIndex: 'error_msg',
      key: 'error_msg',
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: '登录时间',
      dataIndex: 'login_at',
      key: 'login_at',
      width: 180,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  const showLogDetails = (record: AuditLog) => {
    Modal.info({
      title: '日志详情',
      width: 600,
      content: (
        <div style={{ marginTop: 16 }}>
          <p><strong>操作人:</strong> {record.username}</p>
          <p><strong>操作类型:</strong> {record.action}</p>
          <p><strong>实体类型:</strong> {record.entity_type || '-'}</p>
          <p><strong>实体ID:</strong> {record.entity_id || '-'}</p>
          <p><strong>IP地址:</strong> {record.ip_address || '-'}</p>
          <p><strong>操作时间:</strong> {dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss')}</p>
          {record.changes && (
            <p>
              <strong>变更内容:</strong>
              <pre style={{ marginTop: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                {JSON.stringify(record.changes, null, 2)}
              </pre>
            </p>
          )}
        </div>
      ),
    });
  };

  const tabItems = [
    {
      key: 'audit',
      label: (
        <span>
          <HistoryOutlined />
          审计日志
        </span>
      ),
      children: (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Statistic
                title="今日操作"
                value={stats.today_count}
                prefix={<ClockCircleOutlined />}
                styles={{ content: { color: '#3f8600' } }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="本周操作"
                value={stats.week_count}
                prefix={<HistoryOutlined />}
                styles={{ content: { color: '#1890ff' } }}
              />
            </Col>
          </Row>

          <Space style={{ marginBottom: 16 }}>
            <Select
              style={{ width: 150 }}
              placeholder="操作类型"
              allowClear
              value={filters.action}
              onChange={(value) => setFilters({ ...filters, action: value })}
            >
              <Select.Option value="create">创建</Select.Option>
              <Select.Option value="update">更新</Select.Option>
              <Select.Option value="delete">删除</Select.Option>
              <Select.Option value="view">查看</Select.Option>
              <Select.Option value="login">登录</Select.Option>
              <Select.Option value="logout">登出</Select.Option>
            </Select>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchAuditLogs(1)}
            >
              刷新
            </Button>
          </Space>

          <Table
            columns={auditColumns}
            dataSource={auditLogs}
            rowKey="id"
            loading={auditLoading}
            pagination={{
              current: auditPage,
              pageSize: 20,
              total: auditTotal,
              onChange: (page) => fetchAuditLogs(page),
            }}
          />
        </>
      ),
    },
    {
      key: 'operate',
      label: (
        <span>
          <EyeOutlined />
          操作日志
        </span>
      ),
      children: (
        <>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchOperateLogs(1)}
            style={{ marginBottom: 16 }}
          >
            刷新
          </Button>
          <Table
            columns={operateColumns}
            dataSource={operateLogs}
            rowKey="id"
            loading={operateLoading}
            pagination={{
              current: operatePage,
              pageSize: 20,
              total: operateTotal,
              onChange: (page) => fetchOperateLogs(page),
            }}
          />
        </>
      ),
    },
    {
      key: 'login',
      label: (
        <span>
          <UserOutlined />
          登录日志
        </span>
      ),
      children: (
        <>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchLoginLogs(1)}
            style={{ marginBottom: 16 }}
          >
            刷新
          </Button>
          <Table
            columns={loginColumns}
            dataSource={loginLogs}
            rowKey="id"
            loading={loginLoading}
            pagination={{
              current: loginPage,
              pageSize: 20,
              total: loginTotal,
              onChange: (page) => fetchLoginLogs(page),
            }}
          />
        </>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <div style={{ padding: '24px' }}>
        <Card
          title={
            <Space>
              <HistoryOutlined />
              <span>审计日志</span>
            </Space>
          }
          style={{ borderRadius: 12 }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key);
              if (key === 'audit') fetchAuditLogs(1);
              else if (key === 'operate') fetchOperateLogs(1);
              else if (key === 'login') fetchLoginLogs(1);
            }}
            items={tabItems}
          />
        </Card>
      </div>
    </>
  );
}

export default AuditLogPage;
