import { useState, useEffect } from 'react';

/**
 * 响应式断点配置
 */
export const BREAKPOINTS = {
  xs: 0,      // < 576px  - 超小屏手机
  sm: 576,    // >= 576px - 小屏手机
  md: 768,    // >= 768px - 平板
  lg: 992,    // >= 992px - 桌面
  xl: 1200,   // >= 1200px - 大桌面
  xxl: 1600,  // >= 1600px - 超大桌面
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * 响应式 Hook
 *
 * 使用示例:
 * ```tsx
 * const { isMobile, isTablet, isDesktop, width } = useResponsive();
 *
 * return (
 *   <div style={{ padding: isMobile ? '12px' : '24px' }}>
 *     {isMobile && <MobileNavigation />}
 *     {isDesktop && <DesktopNavigation />}
 *   </div>
 * );
 * ```
 */
export function useResponsive() {
  const [windowSize, setWindowSize] = useState(() => {
    if (typeof window !== 'undefined') {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    }
    return { width: 1200, height: 800 }; // 默认值
  });

  useEffect(() => {
    // 仅在客户端运行
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // 添加事件监听
    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const width = windowSize.width;

  return {
    width,
    height: windowSize.height,

    // 常用断点判断
    isXS: width < BREAKPOINTS.sm,
    isSM: width >= BREAKPOINTS.sm && width < BREAKPOINTS.md,
    isMD: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isLG: width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl,
    isXL: width >= BREAKPOINTS.xl && width < BREAKPOINTS.xxl,
    isXXL: width >= BREAKPOINTS.xxl,

    // 设备类型判断
    isMobile: width < BREAKPOINTS.md,      // < 768px
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,  // 768px - 991px
    isDesktop: width >= BREAKPOINTS.lg,     // >= 992px

    // 响应式值生成器
    responsiveValue: <T, Default extends T>(
      values: Partial<Record<Breakpoint, T>>,
      defaultValue: Default
    ): T | Default => {
      // 从大到小查找第一个匹配的断点
      const sortedBreakpoints = (Object.keys(values) as Breakpoint[])
        .sort((a, b) => BREAKPOINTS[b] - BREAKPOINTS[a]);

      for (const bp of sortedBreakpoints) {
        if (width >= BREAKPOINTS[bp]) {
          return values[bp] as T;
        }
      }

      return defaultValue;
    },
  };
}

/**
 * 响应式样式生成器
 *
 * 使用示例:
 * ```tsx
 * const { responsiveStyle } = useResponsive();
 *
 * <div style={responsiveStyle({
 *   fontSize: { xs: '14px', md: '16px', lg: '18px' },
 *   padding: { xs: '12px', md: '24px' },
 *   display: { mobile: 'block', desktop: 'flex' } as any
 * })} />
 * ```
 */
export function useResponsiveStyles() {
  const { isMobile, isTablet, isDesktop, responsiveValue } = useResponsive();

  /**
   * 根据设备类型返回不同的值
   */
  const byDevice = <T>(values: {
    mobile?: T;
    tablet?: T;
    desktop?: T;
    defaultValue: T;
  }): T => {
    if (isMobile && values.mobile !== undefined) return values.mobile;
    if (isTablet && values.tablet !== undefined) return values.tablet;
    if (isDesktop && values.desktop !== undefined) return values.desktop;
    return values.defaultValue;
  };

  /**
   * 根据屏幕宽度返回不同的值
   */
  const byWidth = <T>(
    values: Partial<Record<Breakpoint | 'mobile' | 'tablet' | 'desktop', T>>,
    defaultValue: T
  ): T => {
    // 先处理设备类型的快捷方式
    const deviceMapped = {
      ...values,
      xs: values.xs ?? values.mobile,
      sm: values.sm ?? values.mobile,
      md: values.md ?? values.tablet,
      lg: values.lg ?? values.desktop,
      xl: values.xl ?? values.desktop,
      xxl: values.xxl ?? values.desktop,
    } as Partial<Record<Breakpoint, T>>;

    return responsiveValue(deviceMapped, defaultValue);
  };

  /**
   * 生成响应式样式对象
   */
  const responsiveStyle = <T extends string | number>(
    styleValues: Record<string, Partial<Record<Breakpoint | 'mobile' | 'tablet' | 'desktop', T>>>
  ): React.CSSProperties => {
    const style: React.CSSProperties = {};

    Object.entries(styleValues).forEach(([property, values]) => {
      if (typeof values === 'object' && values !== null) {
        const value = byWidth(values, '' as any);
        if (value) {
          (style as any)[property] = value;
        }
      } else {
        (style as any)[property] = values;
      }
    });

    return style;
  };

  return {
    isMobile,
    isTablet,
    isDesktop,
    byDevice,
    byWidth,
    responsiveStyle,
  };
}

/**
 * 媒体查询 Hook（CSS-in-JS）
 *
 * 使用示例:
 * ```tsx
 * const isSmallScreen = useMediaQuery('(max-width: 768px)');
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    // 现代浏览器
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
    // 旧版浏览器兼容
    else {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
}
