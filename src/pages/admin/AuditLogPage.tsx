import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Select,
  Typography,
  Row,
  Col,
  Tabs,
  Modal,
  Toast,
} from '@douyinfe/semi-ui';
import {
  IconHistory,
  IconUser,
  IconEyeOpened,
  IconRefresh,
  IconTickCircle,
  IconCrossCircleStroked,
  IconClock,
} from '@douyinfe/semi-icons';
import dayjs from 'dayjs';
import api from '../../lib/api';

const { Text, Title } = Typography;

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
  view: { text: '查看', color: 'grey' },
  login: { text: '登录', color: 'green' },
  logout: { text: '登出', color: 'grey' },
  upload: { text: '上传', color: 'blue' },
  download: { text: '下载', color: 'blue' },
};

function AuditLogPage() {
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
      Toast.error('获取审计日志失败');
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
      Toast.error('获取操作日志失败');
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
      Toast.error('获取登录日志失败');
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
  const auditColumns = [
    {
      title: '操作人',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (text: string) => (
        <Space>
          <IconUser style={{ color: 'var(--semi-color-primary)' }} />
          {text}
        </Space>
      ),
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (text: string) => {
        const info = actionMap[text] || { text, color: 'grey' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '实体类型',
      dataIndex: 'entity_type',
      key: 'entity_type',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 140,
      render: (text: string) => text || '-',
    },
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '详情',
      key: 'details',
      width: 80,
      render: (_: any, record: AuditLog) => (
        <Button
          type="tertiary"
          theme="borderless"
          size="small"
          icon={<IconEyeOpened />}
          onClick={() => showLogDetails(record)}
        >
          查看
        </Button>
      ),
    },
  ];

  // 操作日志表格列
  const operateColumns = [
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
      render: (text: string) => (
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
      render: (status: number) =>
        status === 0 ? (
          <Tag color="green">
            <IconTickCircle size="small" /> 成功
          </Tag>
        ) : (
          <Tag color="red">
            <IconCrossCircleStroked size="small" /> 失败
          </Tag>
        ),
    },
    {
      title: '耗时',
      dataIndex: 'execute_time',
      key: 'execute_time',
      width: 100,
      render: (time?: number) => (time ? `${time}ms` : '-'),
    },
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  // 登录日志表格列
  const loginColumns = [
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
      render: (status: number) =>
        status === 0 ? (
          <Tag color="green">
            <IconTickCircle size="small" /> 成功
          </Tag>
        ) : (
          <Tag color="red">
            <IconCrossCircleStroked size="small" /> 失败
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
      render: (text?: string) => text || '-',
    },
    {
      title: '登录时间',
      dataIndex: 'login_at',
      key: 'login_at',
      width: 180,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  const showLogDetails = (record: AuditLog) => {
    Modal.info({
      title: '日志详情',
      width: 600,
      content: (
        <div style={{ marginTop: 16 }}>
          <p><Text strong>操作人:</Text> {record.username}</p>
          <p><Text strong>操作类型:</Text> {record.action}</p>
          <p><Text strong>实体类型:</Text> {record.entity_type || '-'}</p>
          <p><Text strong>实体ID:</Text> {record.entity_id || '-'}</p>
          <p><Text strong>IP地址:</Text> {record.ip_address || '-'}</p>
          <p><Text strong>操作时间:</Text> {dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss')}</p>
          {record.changes && (
            <p>
              <Text strong>变更内容:</Text>
              <pre style={{ marginTop: 8, padding: 8, background: 'var(--semi-color-bg-2)' }}>
                {JSON.stringify(record.changes, null, 2)}
              </pre>
            </p>
          )}
        </div>
      ),
    });
  };

  const tabList = [
    {
      itemKey: 'audit',
      label: (
        <Text>
          <IconHistory />
          {' '}审计日志
        </Text>
      ),
    },
    {
      itemKey: 'operate',
      label: (
        <Text>
          <IconEyeOpened />
          {' '}操作日志
        </Text>
      ),
    },
    {
      itemKey: 'login',
      label: (
        <Text>
          <IconUser />
          {' '}登录日志
        </Text>
      ),
    },
  ];

  return (
    <>
      <Card
        title={
          <Space>
            <IconHistory />
            <Text>审计日志</Text>
          </Space>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key as string);
            if (key === 'audit') fetchAuditLogs(1);
            else if (key === 'operate') fetchOperateLogs(1);
            else if (key === 'login') fetchLoginLogs(1);
          }}
          tabList={tabList}
          contentStyle={{ padding: 0 }}
        >
          {activeTab === 'audit' && (
            <>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <Card
                    style={{ textAlign: 'center', background: 'var(--semi-color-bg-1)' }}
                    bodyStyle={{ padding: '16px' }}
                  >
                    <Text type="secondary" size="small" style={{ display: 'block', marginBottom: 8 }}>
                      今日操作
                    </Text>
                    <Space>
                      <IconClock style={{ color: 'var(--semi-color-success)' }} />
                      <Title heading={4} style={{ margin: 0, color: 'var(--semi-color-success)' }}>
                        {stats.today_count}
                      </Title>
                    </Space>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card
                    style={{ textAlign: 'center', background: 'var(--semi-color-bg-1)' }}
                    bodyStyle={{ padding: '16px' }}
                  >
                    <Text type="secondary" size="small" style={{ display: 'block', marginBottom: 8 }}>
                      本周操作
                    </Text>
                    <Space>
                      <IconHistory style={{ color: 'var(--semi-color-primary)' }} />
                      <Title heading={4} style={{ margin: 0, color: 'var(--semi-color-primary)' }}>
                        {stats.week_count}
                      </Title>
                    </Space>
                  </Card>
                </Col>
              </Row>

              <Space style={{ marginBottom: 16 }}>
                <Select
                  style={{ width: 150 }}
                  placeholder="操作类型"
                  filter
                  value={filters.action}
                  onChange={(value) => setFilters({ ...filters, action: value as string | undefined })}
                  optionList={[
                    { label: '创建', value: 'create' },
                    { label: '更新', value: 'update' },
                    { label: '删除', value: 'delete' },
                    { label: '查看', value: 'view' },
                    { label: '登录', value: 'login' },
                    { label: '登出', value: 'logout' },
                  ]}
                />
                <Button
                  icon={<IconRefresh />}
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
                  currentPage: auditPage,
                  pageSize: 20,
                  total: auditTotal,
                  onChange: (page) => fetchAuditLogs(page),
                }}
              />
            </>
          )}

          {activeTab === 'operate' && (
            <>
              <Button
                icon={<IconRefresh />}
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
                  currentPage: operatePage,
                  pageSize: 20,
                  total: operateTotal,
                  onChange: (page) => fetchOperateLogs(page),
                }}
              />
            </>
          )}

          {activeTab === 'login' && (
            <>
              <Button
                icon={<IconRefresh />}
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
                  currentPage: loginPage,
                  pageSize: 20,
                  total: loginTotal,
                  onChange: (page) => fetchLoginLogs(page),
                }}
              />
            </>
          )}
        </Tabs>
      </Card>
    </>
  );
}

export default AuditLogPage;
