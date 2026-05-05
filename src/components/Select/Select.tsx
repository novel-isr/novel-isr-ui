/**
 * Select —— 单选下拉，基于 Radix Select primitives。
 *
 *   <Select value={lang} onValueChange={setLang} placeholder="选语言">
 *     <SelectItem value="zh">中文</SelectItem>
 *     <SelectItem value="en">English</SelectItem>
 *     <SelectSeparator />
 *     <SelectGroup>
 *       <SelectLabel>实验性</SelectLabel>
 *       <SelectItem value="ja">日本語</SelectItem>
 *     </SelectGroup>
 *   </Select>
 *
 * 完整键盘导航 + ARIA combobox / listbox + 焦点管理由 Radix 提供，自家做视觉。
 */

import * as RadixSelect from '@radix-ui/react-select';
import { forwardRef, type ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useFormControlContext } from '../FormControl/FormControl';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectProps extends Omit<RadixSelect.SelectProps, 'children'> {
  /** 触发按钮的 placeholder（未选时显示） */
  placeholder?: string;
  size?: SelectSize;
  isInvalid?: boolean;
  /** trigger 的 aria-label（无可见 label 时必填） */
  'aria-label'?: string;
  className?: string;
  /** SelectItem / SelectGroup / SelectSeparator 等 */
  children: ReactNode;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(props, ref) {
  const {
    placeholder,
    size = 'md',
    isInvalid: isInvalidProp = false,
    className,
    children,
    'aria-label': ariaLabel,
    ...rootProps
  } = props;

  const fc = useFormControlContext();
  const isInvalid = isInvalidProp || fc?.isInvalid || false;

  return (
    <RadixSelect.Root disabled={fc?.isDisabled} {...rootProps}>
      <RadixSelect.Trigger
        ref={ref}
        id={fc?.id}
        aria-label={ariaLabel}
        aria-invalid={isInvalid || undefined}
        className={cn(
          'ui-select-trigger',
          `ui-select-size-${size}`,
          isInvalid && 'ui-select-error',
          className
        )}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon className="ui-select-icon">
          <ChevronDown size={16} strokeWidth={2} aria-hidden='true' />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content className="ui-select-content" position="popper" sideOffset={4}>
          <RadixSelect.ScrollUpButton className="ui-select-scroll-button">
            ▲
          </RadixSelect.ScrollUpButton>
          <RadixSelect.Viewport className="ui-select-viewport">{children}</RadixSelect.Viewport>
          <RadixSelect.ScrollDownButton className="ui-select-scroll-button">
            ▼
          </RadixSelect.ScrollDownButton>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
});

// ─── SelectItem ───────────────────────────────────────────────────────────

export interface SelectItemProps extends Omit<RadixSelect.SelectItemProps, 'children'> {
  children: ReactNode;
}

export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(function SelectItem(
  props,
  ref
) {
  const { children, className, ...rest } = props;
  return (
    <RadixSelect.Item ref={ref} className={cn('ui-select-item', className)} {...rest}>
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
      <RadixSelect.ItemIndicator className="ui-select-item-indicator">
        <Check size={14} strokeWidth={3} aria-hidden='true' />
      </RadixSelect.ItemIndicator>
    </RadixSelect.Item>
  );
});

export const SelectGroup = RadixSelect.Group;

export interface SelectLabelProps extends RadixSelect.SelectLabelProps {}
export const SelectLabel = forwardRef<HTMLDivElement, SelectLabelProps>(function SelectLabel(
  props,
  ref
) {
  const { className, ...rest } = props;
  return <RadixSelect.Label ref={ref} className={cn('ui-select-label', className)} {...rest} />;
});

export interface SelectSeparatorProps extends RadixSelect.SelectSeparatorProps {}
export const SelectSeparator = forwardRef<HTMLDivElement, SelectSeparatorProps>(
  function SelectSeparator(props, ref) {
    const { className, ...rest } = props;
    return (
      <RadixSelect.Separator ref={ref} className={cn('ui-select-separator', className)} {...rest} />
    );
  }
);
