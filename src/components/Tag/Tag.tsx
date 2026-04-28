/**
 * Tag —— 较 Badge 更大的标签，可关闭。
 *
 *   <Tag>JavaScript</Tag>
 *   <Tag colorScheme="success" size="lg" onClose={...}>v2.0</Tag>
 */

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export type TagSize = 'sm' | 'md' | 'lg';
export type TagColorScheme = 'brand' | 'gray' | 'success' | 'warning' | 'danger';

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  size?: TagSize;
  colorScheme?: TagColorScheme;
  /** 显示关闭按钮，点击触发 */
  onClose?: () => void;
}

export const Tag = forwardRef<HTMLSpanElement, TagProps>(function Tag(props, ref) {
  const { size = 'md', colorScheme = 'gray', onClose, className, children, ...rest } = props;
  return (
    <span
      ref={ref}
      className={cn(
        'ui-tag',
        `ui-tag-size-${size}`,
        `ui-tag-color-${colorScheme}`,
        className
      )}
      {...rest}
    >
      {children}
      {onClose && (
        <button
          type="button"
          aria-label="remove"
          className="ui-tag-close"
          onClick={e => {
            e.stopPropagation();
            onClose();
          }}
        >
          ×
        </button>
      )}
    </span>
  );
});
