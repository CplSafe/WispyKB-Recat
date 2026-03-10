import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

/**
 * 虚拟滚动列表组件
 *
 * 用于优化长列表性能，只渲染可见区域的项
 *
 * 使用示例:
 * ```tsx
 * <VirtualList
 *   data={items}
 *   itemHeight={80}
 *   height={600}
 *   renderItem={(item) => <ListItem data={item} />}
 * />
 * ```
 */
interface VirtualListProps<T> {
  data: T[];
  itemHeight: number; // 单项高度（像素）
  height: number; // 列表容器高度（像素）
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number; // 预渲染的额外项目数（默认 3）
  className?: string;
  style?: React.CSSProperties;
}

export function VirtualList<T>({
  data,
  itemHeight,
  height,
  renderItem,
  overscan = 3,
  className,
  style,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 计算可见范围
  const { visibleData, startIndex, endIndex, totalHeight } = useMemo(() => {
    const totalHeight = data.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      data.length,
      Math.ceil((scrollTop + height) / itemHeight) + overscan
    );

    const visibleData = data.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
    }));

    return { visibleData, startIndex, endIndex, totalHeight };
  }, [data, itemHeight, height, scrollTop, overscan]);

  // 滚动处理
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        height,
        overflow: 'auto',
        position: 'relative',
        ...style,
      }}
      onScroll={handleScroll}
    >
      {/* 占位容器（撑开滚动条） */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* 可见项 */}
        {visibleData.map(({ item, index }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 图片懒加载组件
 *
 * 只有当图片进入视口时才加载
 */
interface LazyImageProps {
  src: string;
  alt?: string;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({
  src,
  alt,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PC9zdmc+',
  className,
  style,
  loading = 'lazy',
  onLoad,
  onError,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && imgRef.current) {
            // 开始加载图片
            if (imgRef.current.dataset.src) {
              imgRef.current.src = imgRef.current.dataset.src;
              observer.disconnect();
            }
          }
        });
      },
      { rootMargin: '50px' } // 提前 50px 开始加载
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  return (
    <img
      ref={imgRef}
      data-src={src}
      src={isLoaded ? src : placeholder}
      alt={alt}
      className={className}
      style={{
        opacity: isLoaded ? 1 : 0.5,
        transition: 'opacity 0.3s',
        ...style,
      }}
      loading={loading}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}

/**
 * 防抖 Hook
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 节流 Hook
 */
export function useThrottle<T>(value: T, limit: number = 300): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => clearTimeout(handler);
  }, [value, limit]);

  return throttledValue;
}

/**
 * 性能监控 Hook
 * 用于测量组件渲染性能
 */
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef<number>(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const renderTime = now - lastRenderTime.current;

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[Performance] ${componentName} render #${renderCount.current} took ${renderTime}ms`
      );
    }

    lastRenderTime.current = now;

    // 警告：渲染时间过长
    if (renderTime > 16) { // 超过一帧（16ms）
      console.warn(
        `[Performance] ${componentName} slow render detected: ${renderTime}ms`
      );
    }
  });
}

/**
 * 代码分割辅助组件
 * 延迟加载重型组件
 */
interface SuspenseWrapperProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function SuspenseWrapper({
  fallback = <div>Loading...</div>,
  children,
}: SuspenseWrapperProps) {
  return (
    <React.Suspense fallback={fallback}>
      {children}
    </React.Suspense>
  );
}
