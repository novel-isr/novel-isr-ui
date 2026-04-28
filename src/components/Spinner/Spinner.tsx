/**
 * Spinner —— loading 旋转指示器。
 *
 *   <Spinner />
 *   <Spinner size="lg" colorScheme="gray" />
 *   <Spinner colorScheme="current" />            // 跟父元素 currentColor
 */

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerColorScheme = 'brand' | 'gray' | 'current';

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
  colorScheme?: SpinnerColorScheme;
  label?: string;
}

export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(props, ref) {
  const { size = 'md', colorScheme = 'brand', label = 'Loading…', className, ...rest } = props;
  return (
    <span
      ref={ref}
      role="status"
      aria-live="polite"
      className={cn(
        'ui-spinner',
        `ui-spinner-size-${size}`,
        `ui-spinner-color-${colorScheme}`,
        className
      )}
      {...rest}
    >
      <span className="ui-spinner-label">{label}</span>
    </span>
  );
});
