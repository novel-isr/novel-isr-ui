/**
 * Tooltip —— hover/focus 触发的提示。基于 Radix Tooltip。
 *
 *   <Tooltip label="保存到草稿">
 *     <IconButton aria-label="save"><SaveIcon /></IconButton>
 *   </Tooltip>
 *
 *   全局开启 hover delay 等：在 root 包 <TooltipProvider delayDuration={300}>。
 *   不包也能用，Radix 自动套了 Provider。
 */

import * as RadixTooltip from '@radix-ui/react-tooltip';
import { forwardRef, type ReactElement, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export const TooltipProvider = RadixTooltip.Provider;

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';
export type TooltipAlign = 'start' | 'center' | 'end';
export type TooltipTone = 'auto' | 'dark' | 'light' | 'default' | 'inverse';

export interface TooltipProps {
  /** 提示内容 */
  label: ReactNode;
  /** 包一层 trigger（必须能 forwardRef） */
  children: ReactElement;
  side?: TooltipSide;
  align?: TooltipAlign;
  /** 显示前等待 ms，默认 300 */
  delayDuration?: number;
  /** 渲染指向 trigger 的小三角 */
  showArrow?: boolean;
  /**
   * 视觉风格。
   * auto 跟随主题；dark 是黑底白字；light 是白底黑字。
   * default/inverse 是历史别名，分别等同 auto/dark。
   */
  tone?: TooltipTone;
  /** disabled 时不显示 */
  disabled?: boolean;
  /** 自定义 className（落到 content 上） */
  className?: string;
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(props, ref) {
  const {
    label,
    children,
    side = 'top',
    align = 'center',
    delayDuration = 300,
    showArrow = false,
    tone = 'auto',
    disabled = false,
    className,
  } = props;

  if (disabled) return children;
  const resolvedTone = tone === 'default' ? 'auto' : tone === 'inverse' ? 'dark' : tone;

  return (
    <RadixTooltip.Root delayDuration={delayDuration}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          ref={ref}
          side={side}
          align={align}
          sideOffset={6}
          className={cn(
            'ui-tooltip-content',
            `ui-tooltip-tone-${resolvedTone}`,
            className,
          )}
        >
          {label}
          {showArrow && <RadixTooltip.Arrow className="ui-tooltip-arrow" />}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
});
