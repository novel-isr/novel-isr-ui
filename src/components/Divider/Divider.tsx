/**
 * Divider —— 分隔线，水平 / 垂直 / 带文字 三种用法。
 *
 *   <Divider />
 *   <Divider orientation="vertical" />
 *   <Divider>OR</Divider>           // 中央带文字（仅 horizontal）
 */

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: DividerOrientation;
}

export const Divider = forwardRef<HTMLDivElement, DividerProps>(function Divider(props, ref) {
  const { orientation = 'horizontal', className, children, ...rest } = props;

  if (children && orientation === 'horizontal') {
    return (
      <div
        ref={ref}
        role="separator"
        className={cn('ui-divider-with-label', className)}
        {...rest}
      >
        {children}
      </div>
    );
  }

  return (
    <hr
      ref={ref as never}
      role="separator"
      aria-orientation={orientation}
      className={cn('ui-divider', `ui-divider-${orientation}`, className)}
      {...(rest as object)}
    />
  );
});
