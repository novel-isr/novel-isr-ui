/**
 * Skeleton —— 加载占位骨架。
 *
 * 基础块：
 *   <Skeleton width={120} height={16} />          // 文本一行
 *   <Skeleton variant="circle" size={40} />        // 头像
 *   <Skeleton variant="rect" height={180} />       // 封面 / 大块
 *
 * 文本块（多行，最后一行自动 70% 宽度）：
 *   <SkeletonText lines={3} />
 *
 * 预设：列表项、卡片、详情页 hero —— 业务侧组合 SkeletonText / Skeleton 自己拼，
 * 不放预设组件以免 8 个不同列表都得改库。
 *
 * 设计取舍：
 *   - 不用 keyframes 旋转 / spinner —— Spinner 已经有
 *   - 用渐变 background-position 动画做 shimmer，CSS 三行解决，无 JS
 *   - prefers-reduced-motion 自动停 shimmer，遵循 a11y
 */
import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export type SkeletonVariant = 'text' | 'rect' | 'circle';

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: SkeletonVariant;
  /** 宽度；数字按 px，字符串按原样（'100%' / '12rem'） */
  width?: number | string;
  /** 高度；text 默认 1em，rect 必传，circle 等于 size */
  height?: number | string;
  /** 圆形/正方形的边长，仅 variant=circle 时使用；优先级高于 width/height */
  size?: number | string;
  /** 关闭 shimmer 动画（嵌套大量 Skeleton 时降帧用） */
  noAnimation?: boolean;
}

function toCss(v: number | string | undefined): string | undefined {
  if (v === undefined) return undefined;
  return typeof v === 'number' ? `${v}px` : v;
}

export const Skeleton = forwardRef<HTMLSpanElement, SkeletonProps>(function Skeleton(props, ref) {
  const {
    variant = 'text',
    width,
    height,
    size,
    noAnimation = false,
    className,
    style,
    ...rest
  } = props;

  const sized: CSSProperties = {
    ...style,
  };
  if (variant === 'circle') {
    const dim = toCss(size ?? width ?? 32);
    sized.width = dim;
    sized.height = dim;
  } else {
    if (width !== undefined) sized.width = toCss(width);
    if (height !== undefined) sized.height = toCss(height);
  }

  return (
    <span
      ref={ref}
      className={cn(
        'ui-skeleton',
        `ui-skeleton-variant-${variant}`,
        noAnimation && 'ui-skeleton-static',
        className
      )}
      style={sized}
      aria-hidden='true'
      {...rest}
    />
  );
});

export interface SkeletonTextProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** 行数；默认 3 */
  lines?: number;
  /** 单行高度；默认 1em */
  lineHeight?: number | string;
  /** 行间距；默认 var(--ui-space-2) */
  gap?: number | string;
  /** 最后一行是否收缩到 70% 宽（更接近真实文本） */
  shrinkLast?: boolean;
  noAnimation?: boolean;
}

export const SkeletonText = forwardRef<HTMLDivElement, SkeletonTextProps>(function SkeletonText(
  props,
  ref
) {
  const {
    lines = 3,
    lineHeight = '1em',
    gap = 'var(--ui-space-2)',
    shrinkLast = true,
    noAnimation = false,
    className,
    style,
    ...rest
  } = props;
  const lineEls = Array.from({ length: lines });
  return (
    <div
      ref={ref}
      className={cn('ui-skeleton-text', className)}
      style={{ gap: typeof gap === 'number' ? `${gap}px` : gap, ...style }}
      aria-hidden='true'
      {...rest}
    >
      {lineEls.map((_, i) => (
        <Skeleton
          key={i}
          variant='text'
          height={lineHeight}
          width={shrinkLast && i === lines - 1 ? '70%' : '100%'}
          noAnimation={noAnimation}
        />
      ))}
    </div>
  );
});
