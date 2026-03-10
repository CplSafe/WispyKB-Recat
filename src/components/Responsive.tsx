import React, { ReactNode } from 'react';
import { useResponsive } from '@/hooks/useResponsive';

/**
 * 移动端优化的容器组件
 *
 * 自动根据屏幕尺寸调整布局和样式
 */

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  mobileStyle?: React.CSSProperties;
  tabletStyle?: React.CSSProperties;
  desktopStyle?: React.CSSProperties;
}

/**
 * 响应式容器
 *
 * 使用示例:
 * ```tsx
 * <ResponsiveContainer
 *   mobileStyle={{ padding: '12px' }}
 *   desktopStyle={{ padding: '24px' }}
 * >
 *   <YourContent />
 * </ResponsiveContainer>
 * ```
 */
export function ResponsiveContainer({
  children,
  className,
  style,
  mobileStyle,
  tabletStyle,
  desktopStyle,
}: ResponsiveContainerProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const responsiveStyles: React.CSSProperties = {
    ...style,
    ...(isMobile && mobileStyle),
    ...(isTablet && tabletStyle),
    ...(isDesktop && desktopStyle),
  };

  return (
    <div className={className} style={responsiveStyles}>
      {children}
    </div>
  );
}

/**
 * 响应式网格
 */
interface ResponsiveGridProps {
  children: ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function ResponsiveGrid({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = '16px',
  className,
  style,
}: ResponsiveGridProps) {
  const { byDevice } = useResponsive();

  const columnCount = byDevice({
    mobile: cols.mobile || 1,
    tablet: cols.tablet || 2,
    desktop: cols.desktop || 3,
    defaultValue: 3,
  });

  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * 响应式间距
 */
interface ResponsiveSpaceProps {
  children: ReactNode;
  size?: {
    mobile?: string | number;
    tablet?: string | number;
    desktop?: string | number;
  };
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

export function ResponsiveSpace({
  children,
  size = { mobile: '8px', tablet: '12px', desktop: '16px' },
  direction = 'vertical',
  className,
}: ResponsiveSpaceProps) {
  const { byDevice } = useResponsive();

  const spaceSize = byDevice({
    mobile: size.mobile || '8px',
    tablet: size.tablet || '12px',
    desktop: size.desktop || '16px',
    defaultValue: '16px',
  });

  const isVertical = direction === 'vertical';

  const childrenArray = React.Children.toArray(children);

  return (
    <div className={className}>
      {childrenArray.map((child, index) => (
        <div
          key={index}
          style={{
            display: isVertical ? 'block' : 'inline-block',
            marginBottom: isVertical && index < childrenArray.length - 1 ? spaceSize : undefined,
            marginRight: !isVertical && index < childrenArray.length - 1 ? spaceSize : undefined,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

/**
 * 触摸优化按钮容器
 * 确保按钮有足够大的点击区域（44x44px 最小推荐）
 */
interface TouchButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export function TouchButton({
  children,
  onClick,
  className,
  style,
  disabled,
}: TouchButtonProps) {
  const { isMobile } = useResponsive();

  return (
    <div
      className={className}
      onClick={disabled ? undefined : onClick}
      style={{
        // 移动端最小触摸区域 44x44px
        minHeight: isMobile ? '44px' : '32px',
        minWidth: isMobile ? '44px' : 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        userSelect: 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * 隐藏/显示组件（响应式）
 */
interface VisibilityProps {
  children: ReactNode;
  hideOn?: 'mobile' | 'tablet' | 'desktop' | 'small' | 'large';
  showOn?: 'mobile' | 'tablet' | 'desktop' | 'small' | 'large';
}

export function Visibility({ children, hideOn, showOn }: VisibilityProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  let shouldShow = true;

  if (hideOn) {
    switch (hideOn) {
      case 'mobile':
        shouldShow = !isMobile;
        break;
      case 'tablet':
        shouldShow = !isTablet;
        break;
      case 'desktop':
        shouldShow = !isDesktop;
        break;
      case 'small':
        shouldShow = !isMobile;
        break;
      case 'large':
        shouldShow = isMobile;
        break;
    }
  }

  if (showOn) {
    switch (showOn) {
      case 'mobile':
        shouldShow = isMobile;
        break;
      case 'tablet':
        shouldShow = isTablet;
        break;
      case 'desktop':
        shouldShow = isDesktop;
        break;
      case 'small':
        shouldShow = isMobile;
        break;
      case 'large':
        shouldShow = !isMobile;
        break;
    }
  }

  return shouldShow ? <>{children}</> : null;
}

/**
 * 移动端优化的文本
 * 自动调整字体大小
 */
interface ResponsiveTextProps {
  children: ReactNode;
  size?: {
    mobile?: string | number;
    tablet?: string | number;
    desktop?: string | number;
  };
  weight?: 'normal' | 'medium' | 'bold';
  color?: string;
  className?: string;
}

export function ResponsiveText({
  children,
  size = { mobile: 14, tablet: 15, desktop: 16 },
  weight,
  color,
  className,
}: ResponsiveTextProps) {
  const { byDevice } = useResponsive();

  const fontSize = byDevice({
    mobile: size.mobile || 14,
    tablet: size.tablet || 15,
    desktop: size.desktop || 16,
    defaultValue: 16,
  });

  return (
    <span
      className={className}
      style={{
        fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
        fontWeight: weight === 'medium' ? 500 : weight === 'bold' ? 600 : 'normal',
        color,
      }}
    >
      {children}
    </span>
  );
}

/**
 * 移动端优化的卡片
 */
interface ResponsiveCardProps {
  children: ReactNode;
  title?: ReactNode;
  extra?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  mobileStyle?: React.CSSProperties;
  desktopStyle?: React.CSSProperties;
  shadow?: boolean;
}

export function ResponsiveCard({
  children,
  title,
  extra,
  className,
  style,
  mobileStyle,
  desktopStyle,
  shadow = true,
}: ResponsiveCardProps) {
  const { isMobile } = useResponsive();

  return (
    <div
      className={className}
      style={{
        backgroundColor: 'var(--semi-color-bg-0)',
        borderRadius: '8px',
        boxShadow: shadow ? '0 2px 8px rgba(0, 0, 0, 0.08)' : undefined,
        padding: isMobile ? '12px' : '16px',
        ...style,
        ...(isMobile ? mobileStyle : desktopStyle),
      }}
    >
      {(title || extra) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          {title && (
            <div style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600 }}>
              {title}
            </div>
          )}
          {extra && <div>{extra}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
