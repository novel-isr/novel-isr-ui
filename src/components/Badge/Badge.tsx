/**
 * Badge —— 小标签（数量 / 状态）。比 Tag 更紧凑。
 *
 *   <Badge>NEW</Badge>
 *   <Badge variant="solid" colorScheme="success">已发布</Badge>
 */

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export type BadgeVariant = 'subtle' | 'solid' | 'outline';
export type BadgeColorScheme = 'brand' | 'gray' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  colorScheme?: BadgeColorScheme;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(props, ref) {
  const { variant = 'subtle', colorScheme = 'brand', className, ...rest } = props;
  return (
    <span
      ref={ref}
      className={cn(
        'ui-badge',
        `ui-badge-variant-${variant}`,
        `ui-badge-color-${colorScheme}`,
        className
      )}
      {...rest}
    />
  );
});
