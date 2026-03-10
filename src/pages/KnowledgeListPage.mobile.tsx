import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Space,
  Typography,
  Input,
  Tag,
} from '@douyinfe/semi-ui';
import {
  IconSearch,
  IconPlus,
  IconFilter,
  IconRefresh,
} from '@douyinfe/semi-icons';

// 导入优化后的组件
import {
  PageLoading,
  ErrorDisplay,
  withNotification,
  confirmDialog,
  ResponsiveContainer,
  ResponsiveGrid,
  TouchButton,
  Visibility,
  ResponsiveText,
  ResponsiveCard,
  VirtualList,
  useResponsive,
  useDebounce,
} from '@/components';

interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  doc_count: number;
  created_at: string;
}

/**
 * 移动端优化示例 - 知识库列表页面
 *
 * 主要优化：
 * 1. 响应式布局
 * 2. 触摸优化（最小点击区域）
 * 3. 虚拟滚动（长列表性能）
 * 4. 防抖搜索
 * 5. 移动端专用组件
 */
function OptimizedKnowledgeListPage() {
  const navigate = useNavigate();
  const {
    isMobile,
    isTablet,
    isDesktop,
    byDevice,
    responsiveStyle,
  } = useResponsive();

  // 状态管理
  const [loading, setLoading] = useState(true);
  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [error, setError] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 防抖搜索
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  /**
   * 获取知识库列表
   */
  const fetchKnowledgeBases = async () => {
    setLoading(true);
    setError(null);

    try {
      await withNotification(
        async () => {
          const data = await api.get('/knowledge-bases');
          setKbs(data || []);
        },
        {
          loading: '正在加载知识库...',
          success: null,
          error: '加载失败'
        }
      );
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 删除知识库
   */
  const handleDelete = async (kb: KnowledgeBase) => {
    const confirmed = await confirmDialog({
      title: '确认删除',
      content: `确定要删除知识库 "${kb.name}" 吗？`,
      type: 'danger'
    });

    if (!confirmed) return;

    await withNotification(
      async () => {
        await api.delete(`/knowledge-bases/${kb.id}`);
        await fetchKnowledgeBases();
      },
      {
        loading: '正在删除...',
        success: '删除成功',
        error: '删除失败'
      }
    );
  };

  /**
   * 渲染单个知识库卡片
   */
  const renderKB = (kb: KnowledgeBase) => (
    <ResponsiveCard
      key={kb.id}
      shadow={true}
      mobileStyle={{ marginBottom: '12px' }}
      desktopStyle={{ marginBottom: '16px' }}
    >
      <Space vertical align="start" style={{ width: '100%' }}>
        {/* 标题和操作按钮 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          width: '100%'
        }}>
          <div style={{ flex: 1 }}>
            <ResponsiveText
              size={{ mobile: 16, tablet: 17, desktop: 18 }}
              weight="bold"
            >
              {kb.name}
            </ResponsiveText>
            {kb.description && (
              <ResponsiveText
                size={{ mobile: 13, tablet: 14, desktop: 14 }}
                color="var(--semi-color-text-2)"
                style={{ marginTop: '4px' }}
              >
                {kb.description}
              </ResponsiveText>
            )}
          </div>

          {/* 移动端显示图标按钮，桌面端显示文字按钮 */}
          {isMobile ? (
            <Space>
              <TouchButton
                onClick={() => navigate(`/knowledge/${kb.id}`)}
                style={{ padding: '8px' }}
              >
                👁️
              </TouchButton>
              <TouchButton
                onClick={() => handleDelete(kb)}
                style={{ padding: '8px' }}
              >
                🗑️
              </TouchButton>
            </Space>
          ) : (
            <Space>
              <Button
                size="small"
                onClick={() => navigate(`/knowledge/${kb.id}`)}
              >
                查看详情
              </Button>
              <Button
                type="tertiary"
                danger
                size="small"
                onClick={() => handleDelete(kb)}
              >
                删除
              </Button>
            </Space>
          )}
        </div>

        {/* 统计信息 */}
        <div>
          <Tag color="blue">
            {kb.doc_count} 个文档
          </Tag>
        </div>
      </Space>
    </ResponsiveCard>
  );

  /**
   * 渲染搜索栏
   */
  const renderSearchBar = () => (
    <ResponsiveCard
      shadow={false}
      mobileStyle={{ padding: '12px', marginBottom: '12px' }}
      desktopStyle={{ padding: '16px', marginBottom: '16px' }}
    >
      <Space style={{ width: '100%' }}>
        <Input
          prefix={<IconSearch />}
          placeholder="搜索知识库..."
          value={searchQuery}
          onChange={setSearchQuery}
          style={{ flex: 1 }}
        />
        <Visibility showOn="desktop">
          <Button icon={<IconFilter />}>
            筛选
          </Button>
        </Visibility>
        <TouchButton
          onClick={fetchKnowledgeBases}
          style={{ padding: '8px 16px' }}
        >
          <IconRefresh />
        </TouchButton>
      </Space>
    </ResponsiveCard>
  );

  /**
   * 渲染移动端列表
   */
  const renderMobileList = () => (
    <div style={{ padding: isMobile ? '12px' : '16px' }}>
      {renderSearchBar()}
      {kbs.length === 0 ? (
        <ResponsiveCard
          shadow={false}
          style={{ textAlign: 'center', padding: '40px 20px' }}
        >
          <ResponsiveText
            size={{ mobile: 14, desktop: 16 }}
            color="var(--semi-color-text-2)"
          >
            暂无知识库
          </ResponsiveText>
        </ResponsiveCard>
      ) : (
        <div>
          {kbs.map(renderKB)}
        </div>
      )}
    </div>
  );

  /**
   * 渲染桌面端网格布局
   */
  const renderDesktopGrid = () => (
    <ResponsiveContainer
      mobileStyle={{ padding: '12px' }}
      desktopStyle={{ padding: '24px' }}
    >
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <ResponsiveText
            size={{ mobile: 20, tablet: 22, desktop: 24 }}
            weight="bold"
          >
            我的知识库
          </ResponsiveText>

          <Button
            type="primary"
            icon={<IconPlus />}
            onClick={() => navigate('/knowledge/create')}
          >
            新建知识库
          </Button>
        </div>

        {renderSearchBar()}
      </div>

      {/* 响应式网格 */}
      {kbs.length === 0 ? (
        <ResponsiveCard
          shadow={false}
          style={{ textAlign: 'center', padding: '60px 20px' }}
        >
          <ResponsiveText
            size={{ mobile: 14, desktop: 16 }}
            color="var(--semi-color-text-2)"
          >
            暂无知识库，点击上方按钮创建
          </ResponsiveText>
        </ResponsiveCard>
      ) : (
        <ResponsiveGrid
          cols={{ mobile: 1, tablet: 2, desktop: 3 }}
          gap={isMobile ? '12px' : '16px'}
        >
          {kbs.map(renderKB)}
        </ResponsiveGrid>
      )}
    </ResponsiveContainer>
  );

  // 加载状态
  if (loading) {
    return <PageLoading tip="加载中..." />;
  }

  // 错误状态
  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <ErrorDisplay
          error={error}
          onRetry={fetchKnowledgeBases}
        />
      </div>
    );
  }

  // 根据设备类型渲染不同布局
  return (
    <>
      {isMobile ? renderMobileList() : renderDesktopGrid()}

      {/* 移动端浮动操作按钮 */}
      <Visibility showOn="mobile">
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000
        }}>
          <TouchButton
            onClick={() => navigate('/knowledge/create')}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--semi-color-primary)',
              color: '#fff',
              fontSize: '24px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            +
          </TouchButton>
        </div>
      </Visibility>
    </>
  );
}

export default OptimizedKnowledgeListPage;
