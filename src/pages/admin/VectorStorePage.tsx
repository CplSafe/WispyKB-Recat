import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Tag,
  Banner,
  Button,
  Spin,
  Progress,
  Empty,
  Toast,
} from '@douyinfe/semi-ui';
import {
  IconArchive,
  IconBolt,
  IconTickCircle,
  IconAlertCircle,
  IconRefresh,
  IconLineChartStroked,
  IconSetting,
  IconCodeStroked,
  IconInfoCircle,
} from '@douyinfe/semi-icons';
import api from '../../lib/api';

const { Text, Title, Paragraph } = Typography;

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
      Toast.error(error.detail || '加载向量存储信息失败');
    } finally {
      setLoading(false);
    }
  };

  const getStoreTypeTag = (type: string) => {
    const config: Record<string, { color: string; label: string }> = {
      milvus: { color: 'purple', label: 'Milvus' },
      pgvector: { color: 'blue', label: 'pgvector' },
    };
    const cfg = config[type] || { color: 'grey', label: type };
    return <Tag color={cfg.color}>{cfg.label}</Tag>;
  };

  const getStatusTag = (status: string) => {
    if (status === 'active') {
      return <Tag color="green"><IconTickCircle /> 运行中</Tag>;
    } else if (status === 'error') {
      return <Tag color="red"><IconAlertCircle /> 错误</Tag>;
    }
    return <Tag color="grey">{status}</Tag>;
  };

  const getStoreTypeDescription = (type: string) => {
    if (type === 'milvus') {
      return '分布式向量数据库，适合大规模数据（十亿级向量）';
    }
    return 'PostgreSQL 向量扩展，适合中小规模数据（百万级向量以内）';
  };

  const renderStatistic = (title: string, value: React.ReactNode, color?: string) => (
    <Card>
      <div style={{ textAlign: 'center' }}>
        <Text type="secondary" size="small">{title}</Text>
        <div style={{ marginTop: 8, color: color || 'var(--semi-color-text-0)' }}>
          <Title heading={4} style={{ margin: 0, color: 'inherit' }}>{value}</Title>
        </div>
      </div>
    </Card>
  );

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Title heading={3} style={{ margin: 0 }}>
          向量存储
        </Title>
        <Text type="tertiary">
          管理系统的向量存储，查看向量数据和性能统计
        </Text>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 说明 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <Banner
            type="info"
            description="管理系统的向量存储，查看向量数据和性能统计"
            icon={<IconArchive />}
            style={{ flex: 1 }}
          />
          <Button
            size="small"
            icon={<IconRefresh />}
            onClick={fetchStats}
            loading={loading}
          >
            刷新
          </Button>
        </div>

        {/* 统计卡片 */}
        <Row gutter={16}>
          <Col span={6}>
            {renderStatistic('存储类型', getStoreTypeTag(stats?.type || '-'))}
          </Col>
          <Col span={6}>
            {renderStatistic('运行状态', getStatusTag(stats?.status || '-'))}
          </Col>
          <Col span={6}>
            {renderStatistic('总向量数', stats?.total_vectors?.toLocaleString() || 0, 'var(--semi-color-primary)')}
          </Col>
          <Col span={6}>
            {renderStatistic('集合数量', stats?.collections?.length || 0, 'var(--semi-color-success)')}
          </Col>
        </Row>

        {/* 集合详情 */}
        <Card
          title={
            <Space>
              <IconLineChartStroked />
              <Text>数据集合详情</Text>
            </Space>
          }
          headerExtraContent={
            <Text type="secondary" size="small">
              {getStoreTypeDescription(stats?.type || '')}
            </Text>
          }
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin />
            </div>
          ) : stats?.error ? (
            <Banner
              type="danger"
              description={stats.error}
            />
          ) : stats?.collections && stats.collections.length > 0 ? (
            <Space vertical spacing={12} style={{ width: '100%' }}>
              {stats.collections.map((coll, index) => (
                <Card
                  key={index}
                  style={{ background: 'var(--semi-color-bg-1)' }}
                >
                  <Row gutter={16} align="middle">
                    <Col span={8}>
                      <Text strong>{coll.name}</Text>
                      {coll.doc_count !== undefined && (
                        <Text type="secondary" size="small" style={{ marginLeft: 8 }}>
                          ({coll.doc_count} 文档)
                        </Text>
                      )}
                    </Col>
                    <Col span={8}>
                      <Text type="secondary" size="small">
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
                        showInfo
                      />
                    </Col>
                  </Row>
                </Card>
              ))}
            </Space>
          ) : (
            <Empty
              title="暂无向量数据"
              description={
                <Text type="secondary" size="small">
                  上传文档到知识库后，向量将自动存储到此处
                </Text>
              }
              style={{ padding: '40px 0' }}
            />
          )}
        </Card>

        {/* Attu 管理入口 (仅 Milvus) */}
        {stats?.type === 'milvus' && (
          <Card
            title={
              <Space>
                <IconSetting />
                <Text>高级管理 (Attu)</Text>
              </Space>
            }
          >
            <Space vertical spacing={12} style={{ width: '100%' }}>
              <Text type="tertiary" style={{ margin: 0 }}>
                Attu 是 Milvus 的可视化管理工具，可以查看集合详情、执行向量搜索、监控性能等。
              </Text>
              <Button
                type="primary"
                target="_blank"
                href="http://localhost:8001"
                icon={<IconCodeStroked />}
                style={{ width: 'fit-content' }}
              >
                打开 Attu 管理界面
              </Button>
              <Banner
                type="info"
                description={
                  <Space vertical spacing={4}>
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
              <IconInfoCircle />
              <Text>向量存储说明</Text>
            </Space>
          }
        >
          <Space vertical spacing={8}>
            <Text type="tertiary" size="small" style={{ margin: 0 }}>
              • <Text code>Milvus</Text>: 开源向量数据库，支持十亿级向量，适合大规模生产环境
            </Text>
            <Text type="tertiary" size="small" style={{ margin: 0 }}>
              • <Text code>pgvector</Text>: PostgreSQL 向量扩展，适合中小规模，部署简单
            </Text>
          </Space>
        </Card>
      </div>
    </>
  );
}

export default VectorStorePage;
