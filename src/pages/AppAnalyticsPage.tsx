import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Row,
  Col,
  Space,
  Typography,
  message,
  Spin,
  Table,
  Tag,
  DatePicker,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  BarChartOutlined,
  MessageOutlined,
  UserOutlined,
  LikeOutlined,
  DislikeOutlined,
  GlobalOutlined,
  RiseOutlined,
  FallOutlined,
  TrophyOutlined,
  FireOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../lib/api';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

interface ChatRecord {
  id: string;
  user_message: string;
  ai_response: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  feedback_type?: 'like' | 'dislike' | null;
  feedback_comment?: string;
}

interface AnalyticsData {
  conversations: {
    total: number;
    recent: number;
  };
  messages: {
    total: number;
    recent: number;
  };
  feedback: {
    total: number;
    likes: number;
    dislikes: number;
  };
  daily_stats: { date: string; count: number }[];
  chat_records?: ChatRecord[];
  ip_distribution?: { ip: string; count: number }[];
}

// Mini sparkline chart component
function MiniSparkline({ data, color, width = 80, height = 30 }: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (!data || data.length < 2) {
    return (
      <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>No data</Text>
      </div>
    );
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height * 0.7) - height * 0.15;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  // Calculate trend
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const isUp = secondAvg >= firstAvg;

  return (
    <div style={{ position: 'relative' }}>
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={areaPoints}
          fill={`url(#gradient-${color})`}
        />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span style={{
        position: 'absolute',
        right: -4,
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: 10,
        color: isUp ? '#10B981' : '#EF4444',
      }}>
        {isUp ? <RiseOutlined /> : <FallOutlined />}
      </span>
    </div>
  );
}

// Circular progress component
function CircularProgress({
  percent,
  size = 60,
  strokeWidth = 6,
  color = '#10B981',
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  );
}

// Progress bar component
function ProgressBar({ value, max, color, label }: {
  value: number;
  max: number;
  color: string;
  label: string;
}) {
  const percent = max > 0 ? (value / max) * 100 : 0;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 13, color: '#475569' }}>{label}</Text>
        <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: 500 }}>{value}</Text>
      </div>
      <div style={{
        height: 8,
        background: '#F1F5F9',
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${percent}%`,
          background: color,
          borderRadius: 4,
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}

// Mini bar chart
function MiniBarChart({ data, color, height = 100 }: {
  data: { label: string; value: number }[];
  color: string;
  height?: number;
}) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = Math.max(8, Math.min(24, 200 / data.length - 4));

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height }}>
      {data.map((item, index) => {
        const barHeight = maxValue > 0 ? (item.value / maxValue) * (height - 20) : 0;
        return (
          <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: barWidth,
              height: barHeight,
              background: color,
              borderRadius: 4,
              transition: 'height 0.3s ease',
            }} />
            <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>
              {item.label}
            </Text>
          </div>
        );
      })}
    </div>
  );
}

// Donut chart component
function DonutChart({ data, size = 120 }: {
  data: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - 20) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeWidth = 20;

  let currentOffset = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {data.map((item, index) => {
          const percent = total > 0 ? (item.value / total) * 100 : 0;
          const dashArray = (percent / 100) * circumference;
          const segment = (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashArray} ${circumference}`}
              strokeDashoffset={-currentOffset}
              style={{ transition: 'all 0.3s ease' }}
            />
          );
          currentOffset += dashArray;
          return segment;
        })}
      </svg>
      <div>
        <Text style={{ fontSize: 24, fontWeight: 600, color: '#1E293B' }}>{total}</Text>
        <br />
        <Text style={{ fontSize: 12, color: '#64748B' }}>Total</Text>
      </div>
    </div>
  );
}

// Stat card component
const StatCard = ({ title, value, icon, gradient, sparkline }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  sparkline?: number[];
}) => (
  <Card
    style={{
      borderRadius: 12,
      background: gradient,
      border: 'none',
      overflow: 'hidden',
      position: 'relative',
    }}
    styles={{ body: { padding: '20px' } }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Space orientation="vertical" size={4}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: 'rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {icon}
        </div>
        <Text style={{ color: '#fff', opacity: 0.9, fontSize: 13 }}>{title}</Text>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
          {value.toLocaleString()}
        </Text>
      </Space>
      {sparkline && sparkline.length > 1 && (
        <MiniSparkline data={sparkline} color="#fff" width={80} height={36} />
      )}
    </div>
  </Card>
);

function AppAnalyticsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const appId = (params?.id as string) || '';
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'days'),
    dayjs(),
  ]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [startDate, endDate] = dateRange;
      const analyticsData = await api.get(
        `/applications/${appId}/analytics?start_date=${startDate.format('YYYY-MM-DD')}&end_date=${endDate.format('YYYY-MM-DD')}`
      );
      setData(analyticsData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      messageApi.error(typeof error === 'string' ? error : 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, appId]);

  // Calculate daily trend data
  const dailyTrendData = data?.daily_stats?.map(d => d.count) || [];
  const totalLikes = data?.feedback?.likes || 0;
  const totalDislikes = data?.feedback?.dislikes || 0;
  const totalFeedback = totalLikes + totalDislikes;
  const satisfactionRate = totalFeedback > 0
    ? Math.round(totalLikes / totalFeedback * 100)
    : 0;

  // Prepare bar chart data (last 7 days)
  const barChartData = data?.daily_stats?.slice(-7).map(d => ({
    label: dayjs(d.date).format('MM/DD'),
    value: d.count,
  })) || [];

  // Prepare feedback data donut chart
  const feedbackData = [
    { label: 'Likes', value: totalLikes, color: '#10B981' },
    { label: 'Dislikes', value: totalDislikes, color: '#EF4444' },
  ];

  const chatColumns = [
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (text: string) => (
        <Text style={{ fontSize: 12 }}>
          {dayjs(text).format('YYYY-MM-DD HH:mm')}
        </Text>
      ),
    },
    {
      title: '用户消息',
      dataIndex: 'user_message',
      key: 'user_message',
      ellipsis: true,
      render: (text: string) => (
        <Text style={{ fontSize: 12 }} ellipsis={{ tooltip: text }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'AI 回复',
      dataIndex: 'ai_response',
      key: 'ai_response',
      ellipsis: true,
      render: (text: string) => (
        <Text style={{ fontSize: 12 }} ellipsis={{ tooltip: text }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'IP Address',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 120,
      render: (ip: string) => (
        <Space size={4}>
          <GlobalOutlined style={{ fontSize: 12, color: '#94A3B8' }} />
          <Text style={{ fontSize: 12 }}>{ip || '-'}</Text>
        </Space>
      ),
    },
    {
      title: '反馈',
      dataIndex: 'feedback_type',
      key: 'feedback_type',
      width: 80,
      render: (type: 'like' | 'dislike' | null) => {
        if (type === 'like') {
          return <LikeOutlined style={{ color: '#10B981' }} />;
        }
        if (type === 'dislike') {
          return <DislikeOutlined style={{ color: '#EF4444' }} />;
        }
        return <Text type="secondary">-</Text>;
      },
    },
  ];

  const ipColumns = [
    {
      title: 'IP Address',
      dataIndex: 'ip',
      key: 'ip',
      render: (ip: string) => (
        <Space size={4}>
          <GlobalOutlined style={{ fontSize: 12, color: '#94A3B8' }} />
          <Text code style={{ fontSize: 12 }}>{ip}</Text>
        </Space>
      ),
    },
    {
      title: '访问次数',
      dataIndex: 'count',
      key: 'count',
      render: (count: number) => (
        <Tag color="blue" style={{ fontSize: 12 }}>
          {count} 次
        </Tag>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
        <Space orientation="vertical" size={24} style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <Space size={16}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/apps')}
                style={{ borderRadius: 8 }}
              >
                返回
              </Button>
              <div>
                <Title level={3} style={{ margin: 0, color: '#1E293B', fontSize: 20, fontWeight: 600 }}>
                  应用分析
                </Title>
                <Text style={{ color: '#64748B', fontSize: 13 }}>
                  查看应用使用数据和交互记录
                </Text>
              </div>
            </Space>
            <Space>
              <RangePicker
                value={dateRange}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setDateRange([dates[0], dates[1]]);
                  }
                }}
                style={{ borderRadius: 8 }}
                allowClear={false}
              />
              <Button
                type="primary"
                icon={<BarChartOutlined />}
                onClick={fetchAnalytics}
                style={{ borderRadius: 8 }}
              >
                刷新
              </Button>
            </Space>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 80 }}>
              <Spin size="large" />
            </div>
          ) : data ? (
            <>
              {/* Statistics Cards */}
              <Row gutter={16}>
                <Col xs={24} sm={12} lg={6}>
                  <StatCard
                    title="总消息数"
                    value={data?.messages?.total || 0}
                    icon={<MessageOutlined style={{ fontSize: 20, color: '#fff' }} />}
                    gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    sparkline={dailyTrendData}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <StatCard
                    title="对话数"
                    value={data?.conversations?.total || 0}
                    icon={<UserOutlined style={{ fontSize: 20, color: '#fff' }} />}
                    gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <StatCard
                    title="点赞数"
                    value={totalLikes}
                    icon={<LikeOutlined style={{ fontSize: 20, color: '#fff' }} />}
                    gradient="linear-gradient(135deg, #10B981 0%, #059669 100%)"
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <StatCard
                    title="差评数"
                    value={totalDislikes}
                    icon={<DislikeOutlined style={{ fontSize: 20, color: '#fff' }} />}
                    gradient="linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
                  />
                </Col>
              </Row>

              {/* Charts Section */}
              <Row gutter={16}>
                {/* Daily message trend */}
                <Col xs={24} lg={16}>
                  <Card
                    title={
                      <Space size={8}>
                        <BarChartOutlined style={{ color: '#2563EB' }} />
                        <Text strong>每日消息趋势</Text>
                      </Space>
                    }
                    style={{ borderRadius: 12 }}
                    styles={{ body: { padding: '20px' } }}
                  >
                    {barChartData.length > 0 ? (
                      <MiniBarChart data={barChartData} color="#2563EB" height={140} />
                    ) : (
                      <Text type="secondary">暂无数据</Text>
                    )}
                  </Card>
                </Col>

                {/* Satisfaction rate */}
                <Col xs={24} lg={8}>
                  <Card
                    title={
                      <Space size={8}>
                        <TrophyOutlined style={{ color: '#F59E0B' }} />
                        <Text strong>满意度分析</Text>
                      </Space>
                    }
                    style={{ borderRadius: 12 }}
                    styles={{ body: { padding: '20px' } }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                      {totalFeedback > 0 ? (
                        <>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <CircularProgress
                                percent={satisfactionRate}
                                size={100}
                                strokeWidth={10}
                                color={satisfactionRate >= 70 ? '#10B981' : satisfactionRate >= 50 ? '#F59E0B' : '#EF4444'}
                              />
                              <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                textAlign: 'center',
                              }}>
                                <Text style={{ fontSize: 20, fontWeight: 700, color: '#1E293B' }}>
                                  {satisfactionRate}%
                                </Text>
                              </div>
                            </div>
                            <Text style={{ fontSize: 12, color: '#64748B', display: 'block', marginTop: 8 }}>
                              好评率
                            </Text>
                          </div>
                          <div style={{ width: 120 }}>
                            <ProgressBar
                              value={data.feedback.likes}
                              max={totalFeedback}
                              color="#10B981"
                              label="点赞"
                            />
                            <ProgressBar
                              value={data.feedback.dislikes}
                              max={totalFeedback}
                              color="#EF4444"
                              label="差评"
                            />
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', padding: 20 }}>
                          <FireOutlined style={{ fontSize: 40, color: '#E5E7EB' }} />
                          <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
                            暂无反馈数据
                          </Text>
                        </div>
                      )}
                    </div>
                  </Card>
                </Col>
              </Row>

              {/* Feedback distribution + IP source */}
              <Row gutter={16}>
                {/* Feedback donut chart */}
                <Col xs={24} lg={12}>
                  <Card
                    title={
                      <Space size={8}>
                        <LikeOutlined style={{ color: '#8B5CF6' }} />
                        <Text strong>反馈分布</Text>
                      </Space>
                    }
                    style={{ borderRadius: 12 }}
                    styles={{ body: { padding: '20px' } }}
                  >
                    {totalFeedback > 0 ? (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32 }}>
                        <DonutChart data={feedbackData} size={140} />
                        <Space orientation="vertical" size={8}>
                          <Space>
                            <div style={{ width: 12, height: 12, borderRadius: 2, background: '#10B981' }} />
                            <Text>点赞 ({data.feedback.likes})</Text>
                          </Space>
                          <Space>
                            <div style={{ width: 12, height: 12, borderRadius: 2, background: '#EF4444' }} />
                            <Text>差评 ({data.feedback.dislikes})</Text>
                          </Space>
                        </Space>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: 30 }}>
                        <Text type="secondary">No feedback data</Text>
                      </div>
                    )}
                  </Card>
                </Col>

                {/* Visit source Top */}
                <Col xs={24} lg={12}>
                  <Card
                    title={
                      <Space size={8}>
                        <GlobalOutlined style={{ color: '#06B6D4' }} />
                        <Text strong>前 5 访问来源</Text>
                      </Space>
                    }
                    style={{ borderRadius: 12 }}
                    styles={{ body: { padding: '20px' } }}
                  >
                    {data.ip_distribution && data.ip_distribution.length > 0 ? (
                      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                        {data.ip_distribution.slice(0, 5).map((item, index) => {
                          const maxCount = data.ip_distribution![0].count || 1;
                          const percent = (item.count / maxCount) * 100;
                          const colors = ['#2563EB', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'];
                          return (
                            <div key={item.ip}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Space size={6}>
                                  <span style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 4,
                                    background: colors[index],
                                    color: '#fff',
                                    fontSize: 11,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 600,
                                  }}>{index + 1}</span>
                                  <Text code style={{ fontSize: 12 }}>{item.ip}</Text>
                                </Space>
                                <Text style={{ fontSize: 13, fontWeight: 500 }}>{item.count} 次访问</Text>
                              </div>
                              <div style={{
                                height: 6,
                                background: '#F1F5F9',
                                borderRadius: 3,
                                overflow: 'hidden',
                              }}>
                                <div style={{
                                  height: '100%',
                                  width: `${percent}%`,
                                  background: colors[index],
                                  borderRadius: 3,
                                  transition: 'width 0.3s ease',
                                }} />
                              </div>
                            </div>
                          );
                        })}
                      </Space>
                    ) : (
                      <Text type="secondary">暂无数据</Text>
                    )}
                  </Card>
                </Col>
              </Row>

              <Divider style={{ margin: '8px 0' }} />

              {/* Chat Records Table */}
              {data.chat_records && data.chat_records.length > 0 && (
                <Card
                  title={
                    <Space size={8}>
                      <MessageOutlined />
                      <Text strong>交互记录</Text>
                    </Space>
                  }
                  style={{ borderRadius: 12 }}
                >
                  <Table
                    columns={chatColumns}
                    dataSource={data.chat_records}
                    rowKey="id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `共 ${total} 条记录`,
                    }}
                    scroll={{ x: 800 }}
                  />
                </Card>
              )}

              {/* IP Distribution Full List */}
              {data.ip_distribution && data.ip_distribution.length > 0 && (
                <Card
                  title={
                    <Space size={8}>
                      <GlobalOutlined />
                      <Text strong>IP 分布详情</Text>
                    </Space>
                  }
                  style={{ borderRadius: 12 }}
                >
                  <Table
                    columns={ipColumns}
                    dataSource={data.ip_distribution}
                    rowKey="ip"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `共 ${total} 个 IP`,
                    }}
                  />
                </Card>
              )}
            </>
          ) : (
            <Card style={{ borderRadius: 12, textAlign: 'center', padding: 40 }}>
              <Text type="secondary">暂无可用数据</Text>
            </Card>
          )}
        </Space>
      </div>
    </>
  );
}

export default AppAnalyticsPage;
