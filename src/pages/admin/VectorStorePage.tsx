import { useState, useEffect } from 'react';
import {
  Card,
  Statistic, Row, Col,
  Typography,
  Space,
  Tag,
  Alert,
  Button,
  Spin,
  Progress,
  Empty,
  message,
} from 'antd';
import {
  DatabaseOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  BarChartOutlined,
  SettingOutlined,
  ApiOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import api from '../../lib/api';

const { Text, Paragraph } = Typography;

interface CollectionStat {
  name: string;
  id?: string;
  count: number;
  dimension?: number;
  doc_count?: number;
}

interface VectorStoreStats {
  type: string;
  status: string;
  total_vectors: number;
  collections: CollectionStat[];
  error?: string;
}

function VectorStorePage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [stats, setStats] = useState<VectorStoreStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.get('/vector-store/stats');
      setStats(data);
    } catch (error: any) {
      messageApi.error(error.detail || '加载向量存储信息失败');
    } finally {
      setLoading(false);
    }
  };

  const getStoreTypeTag = (type: string) => {
    const config: Record<string, { color: string; label: string }> = {
      milvus: { color: 'purple', label: 'Milvus' },
      pgvector: { color: 'blue', label: 'pgvector' },
    };
    const cfg = config[type] || { color: 'default', label: type };
    return <Tag color={cfg.color}>{cfg.label}</Tag>;
  };

  const getStatusTag = (status: string) => {
    if (status === 'active') {
      return <Tag color="success" icon={<CheckCircleOutlined />}>运行中</Tag>;
    } else if (status === 'error') {
      return <Tag color="error" icon={<CloseCircleOutlined />}>错误</Tag>;
    }
    return <Tag color="default">{status}</Tag>;
  };

  const getStoreTypeDescription = (type: string) => {
    if (type === 'milvus') {
      return '分布式向量数据库，适合大规模数据（十亿级向量）';
    }
    return 'PostgreSQL 向量扩展，适合中小规模数据（百万级向量以内）';
  };

  return (
    <>
      {contextHolder}
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: 24 }}>
          <Typography.Title level={3} style={{ margin: 0, color: '#1E293B', fontSize: 20, fontWeight: 600 }}>
            向量存储
          </Typography.Title>
          <Text style={{ color: '#64748B', fontSize: 13 }}>
            管理系统的向量存储，查看向量数据和性能统计
          </Text>
        </div>

        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          {/* 说明 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <Alert
              title={
                <Space orientation="vertical" size={4}>
                  <Text strong>向量存储管理</Text>
                  <Text type="secondary">
                    管理系统的向量存储，查看向量数据和性能统计
                  </Text>
                </Space>
              }
              type="info"
              showIcon
              icon={<DatabaseOutlined />}
              style={{ flex: 1 }}
            />
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={fetchStats}
              loading={loading}
            >
              刷新
            </Button>
          </div>

          {/* 统计卡片 */}
          <Row gutter={16}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="存储类型"
                  value={stats?.type || '-'}
                  styles={{ content: { fontSize: 16 } }}
                  formatter={(value) => getStoreTypeTag(value as string)}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="运行状态"
                  value={stats?.status || '-'}
                  styles={{ content: { fontSize: 16 } }}
                  formatter={(value) => getStatusTag(value as string)}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总向量数"
                  value={stats?.total_vectors || 0}
                  prefix={<ThunderboltOutlined />}
                  styles={{ content: { fontSize: 20, color: '#1890ff' } }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="集合数量"
                  value={stats?.collections?.length || 0}
                  prefix={<DatabaseOutlined />}
                  styles={{ content: { fontSize: 20, color: '#52c41a' } }}
                />
              </Card>
            </Col>
          </Row>

          {/* 集合详情 */}
          <Card
            title={
              <Space>
                <BarChartOutlined />
                <span>数据集合详情</span>
              </Space>
            }
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                {getStoreTypeDescription(stats?.type || '')}
              </Text>
            }
            style={{ borderRadius: 12 }}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin />
              </div>
            ) : stats?.error ? (
              <Alert
                type="error"
                message="加载失败"
                description={stats.error}
                showIcon
              />
            ) : stats?.collections && stats.collections.length > 0 ? (
              <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                {stats.collections.map((coll, index) => (
                  <Card
                    key={index}
                    size="small"
                    style={{ background: '#fafafa' }}
                  >
                    <Row gutter={16} align="middle">
                      <Col span={8}>
                        <Text strong style={{ fontSize: 14 }}>{coll.name}</Text>
                        {coll.doc_count !== undefined && (
                          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                            ({coll.doc_count} 文档)
                          </Text>
                        )}
                      </Col>
                      <Col span={8}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          向量数量:
                        </Text>
                        <Text strong style={{ marginLeft: 8 }}>
                          {coll.count.toLocaleString()}
                        </Text>
                      </Col>
                      <Col span={8}>
                        <Progress
                          percent={Math.round((coll.count / (stats.total_vectors || 1)) * 100)}
                          size="small"
                          status="active"
                          format={(percent) => `${percent}%`}
                        />
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Space>
            ) : (
              <Empty
                description="暂无向量数据"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: '40px 0' }}
              >
                <Text type="secondary" style={{ fontSize: 12 }}>
                  上传文档到知识库后，向量将自动存储到此处
                </Text>
              </Empty>
            )}
          </Card>

          {/* Attu 管理入口 (仅 Milvus) */}
          {stats?.type === 'milvus' && (
            <Card
              title={
                <Space>
                  <SettingOutlined />
                  <span>高级管理 (Attu)</span>
                </Space>
              }
              style={{ borderRadius: 12 }}
              styles={{ body: { padding: '24px' } }}
            >
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Paragraph style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                  Attu 是 Milvus 的可视化管理工具，可以查看集合详情、执行向量搜索、监控性能等。
                </Paragraph>
                <Button
                  type="primary"
                  target="_blank"
                  href="http://localhost:8001"
                  icon={<ApiOutlined />}
                  style={{ width: 'fit-content' }}
                >
                  打开 Attu 管理界面
                </Button>
                <Alert
                  type="info"
                  showIcon
                  message="访问信息"
                  description={
                    <Space direction="vertical" size={4}>
                      <Text>地址: http://localhost:8001</Text>
                      <Text>用户名: admin</Text>
                      <Text>密码: AttuAdmin123</Text>
                    </Space>
                  }
                  style={{ maxWidth: 400 }}
                />
              </Space>
            </Card>
          )}

          {/* 使用说明 */}
          <Card
            title={
              <Space>
                <InfoCircleOutlined />
                <span>向量存储说明</span>
              </Space>
            }
            size="small"
            style={{ borderRadius: 12 }}
          >
            <Space orientation="vertical" size={8}>
              <Paragraph style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                • <Text code>Milvus</Text>: 开源向量数据库，支持十亿级向量，适合大规模生产环境
              </Paragraph>
              <Paragraph style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                • <Text code>pgvector</Text>: PostgreSQL 向量扩展，适合中小规模，部署简单
              </Paragraph>
            </Space>
          </Card>
        </Space>
      </div>
    </>
  );
}

export default VectorStorePage;
