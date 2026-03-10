import { Spin, Typography } from '@douyinfe/semi-ui';
import { IconLoading } from '@douyinfe/semi-icons';

const { Text } = Typography;

interface PageLoadingProps {
  tip?: string;
  size?: 'small' | 'default' | 'large';
  spinning?: boolean;
  children?: React.ReactNode;
}

/**
 * 全局页面加载组件
 *
 * 使用示例:
 * ```tsx
 * // 1. 作为包裹器（条件显示加载状态）
 * <PageLoading spinning={loading} tip="加载中...">
 *   <YourContent />
 * </PageLoading>
 *
 * // 2. 作为独立组件（始终显示加载）
 * <PageLoading tip="正在初始化..." />
 * ```
 */
export function PageLoading({
  tip = '加载中...',
  size = 'large',
  spinning = true,
  children
}: PageLoadingProps) {
  if (!spinning && children) {
    return <>{children}</>;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        width: '100%'
      }}
    >
      <Spin
        spinning={spinning}
        size={size}
        indicator={<IconLoading spin style={{ fontSize: size === 'large' ? 48 : 32 }} />}
      >
        <div style={{ padding: '24px', minHeight: '200px' }}>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            {tip}
          </Text>
        </div>
      </Spin>
    </div>
  );
}

/**
 * 全屏加载遮罩（用于模态操作）
 */
interface FullScreenLoadingProps {
  visible: boolean;
  tip?: string;
}

export function FullScreenLoading({ visible, tip = '处理中...' }: FullScreenLoadingProps) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <Spin
        spinning={true}
        size="large"
        indicator={<IconLoading spin style={{ fontSize: 48, color: '#fff' }} />}
      />
      <Text style={{ color: '#fff', marginTop: '16px', fontSize: '16px' }}>
        {tip}
      </Text>
    </div>
  );
}

/**
 * 按钮加载状态包装器
 */
interface ButtonLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  disabled?: boolean;
}

export function ButtonLoading({ loading, children, disabled }: ButtonLoadingProps) {
  return (
    <>
      {loading && (
        <Spin
          size="small"
          style={{ marginRight: '8px' }}
          indicator={<IconLoading spin />}
        />
      )}
      {children}
    </>
  );
}

/**
 * 骨架屏组件
 */
interface SkeletonProps {
  rows?: number;
  loading?: boolean;
  children?: React.ReactNode;
}

export function Skeleton({
  rows = 5,
  loading = true,
  children
}: SkeletonProps) {
  if (!loading && children) {
    return <>{children}</>;
  }

  return (
    <div style={{ padding: '24px' }}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          style={{
            height: '20px',
            marginBottom: '12px',
            borderRadius: '4px',
            backgroundColor: 'var(--semi-color-fill-2)',
            width: index === rows - 1 ? '60%' : '100%'
          }}
        />
      ))}
    </div>
  );
}

export default PageLoading;
