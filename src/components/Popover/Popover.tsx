/**
 * Popover —— 点击触发的浮层（可交互），基于 Radix Popover。
 *
 *   <Popover>
 *     <PopoverTrigger asChild><Button>过滤</Button></PopoverTrigger>
 *     <PopoverContent>
 *       <Checkbox>已读</Checkbox>
 *       <Checkbox>未读</Checkbox>
 *     </PopoverContent>
 *   </Popover>
 *
 * Tooltip vs Popover：
 *   - Tooltip: 文本提示，不可交互，hover 触发
 *   - Popover: 可交互内容，click 触发
 */

import * as RadixPopover from '@radix-ui/react-popover';
import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export const Popover = RadixPopover.Root;
export const PopoverTrigger = RadixPopover.Trigger;
export const PopoverAnchor = RadixPopover.Anchor;
export const PopoverClose = RadixPopover.Close;

export type PopoverSide = 'top' | 'right' | 'bottom' | 'left';
export type PopoverAlign = 'start' | 'center' | 'end';

export interface PopoverContentProps extends Omit<RadixPopover.PopoverContentProps, 'asChild'> {
  showArrow?: boolean;
}

export const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(
  function PopoverContent(props, ref) {
    const { className, children, showArrow = false, sideOffset = 6, ...rest } = props;
    return (
      <RadixPopover.Portal>
        <RadixPopover.Content
          ref={ref}
          sideOffset={sideOffset}
          className={cn('ui-popover-content', className)}
          {...rest}
        >
          {children}
          {showArrow && <RadixPopover.Arrow className="ui-popover-arrow" />}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    );
  }
);
