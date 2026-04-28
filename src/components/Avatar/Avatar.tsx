/**
 * Avatar —— 头像组件，img 加载失败 / 没传 src 时回退首字母。
 *
 *   <Avatar src="..." alt="alice" />
 *   <Avatar name="张三" size="lg" />              // 取首字 "张"
 *   <Avatar.Group max={3}><Avatar /><Avatar /><Avatar /><Avatar /></Avatar.Group>
 */

import { forwardRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type AvatarShape = 'circle' | 'square';

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  src?: string;
  alt?: string;
  /** 用于生成 fallback 首字母 */
  name?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  /** 自定义 fallback 内容（不传则用 name 首字母 / 默认 icon） */
  fallback?: ReactNode;
}

function initials(name?: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  // 中文：取第一个字
  if (/[一-龥]/.test(trimmed[0] || '')) return trimmed[0] || '';
  // 英文：first letter of first 2 words
  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(props, ref) {
  const {
    src,
    alt,
    name,
    size = 'md',
    shape = 'circle',
    fallback,
    className,
    children,
    ...rest
  } = props;
  const [errored, setErrored] = useState(false);

  const showImage = src && !errored;
  const fallbackContent = fallback ?? initials(name) ?? children;

  return (
    <span
      ref={ref}
      className={cn(
        'ui-avatar',
        `ui-avatar-size-${size}`,
        shape === 'square' && 'ui-avatar-shape-square',
        className
      )}
      {...rest}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt ?? name ?? ''}
          className="ui-avatar-img"
          onError={() => setErrored(true)}
        />
      ) : (
        <span aria-hidden={!fallbackContent}>{fallbackContent ?? '?'}</span>
      )}
    </span>
  );
});

// ─── Avatar.Group ─────────────────────────────────────────────────────────

export interface AvatarGroupProps extends HTMLAttributes<HTMLSpanElement> {
  /** 最多显示几个，超出 +N */
  max?: number;
}

export const AvatarGroup = forwardRef<HTMLSpanElement, AvatarGroupProps>(function AvatarGroup(
  props,
  ref
) {
  const { max, className, children, ...rest } = props;
  const arr = Array.isArray(children) ? children : [children];
  const filtered = arr.filter(Boolean);
  const visible = max != null ? filtered.slice(0, max) : filtered;
  const hidden = filtered.length - visible.length;

  return (
    <span ref={ref} className={cn('ui-avatar-group', className)} {...rest}>
      {visible}
      {hidden > 0 && <Avatar fallback={`+${hidden}`} />}
    </span>
  );
});
