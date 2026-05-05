/**
 * Checkbox —— 基于 Radix Checkbox primitives，加 token 视觉。
 *
 *   <Checkbox defaultChecked>同意条款</Checkbox>
 *   <Checkbox checked={v} onCheckedChange={setV}>受控</Checkbox>
 *   <Checkbox isInvalid>红边</Checkbox>
 *   <Checkbox checked="indeterminate">半选</Checkbox>
 *   <Checkbox colorScheme="success">绿色</Checkbox>
 */

import * as RadixCheckbox from '@radix-ui/react-checkbox';
import { forwardRef, type ReactNode } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useFormControlContext } from '../FormControl/FormControl';

export type CheckboxSize = 'sm' | 'md' | 'lg';
export type CheckboxColorScheme = 'brand' | 'success' | 'info' | 'warning' | 'danger';

export interface CheckboxProps
  extends Omit<RadixCheckbox.CheckboxProps, 'asChild' | 'size' | 'children'> {
  size?: CheckboxSize;
  /** 激活态颜色，默认 brand */
  colorScheme?: CheckboxColorScheme;
  isInvalid?: boolean;
  /** label 文本 */
  children?: ReactNode;
}

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(props, ref) {
  const {
    size = 'md',
    colorScheme = 'brand',
    isInvalid: isInvalidProp = false,
    className,
    children,
    ...rest
  } = props;
  const fc = useFormControlContext();
  const isInvalid = isInvalidProp || fc?.isInvalid || false;

  return (
    <label
      className={cn(
        'ui-checkbox-root',
        `ui-checkbox-size-${size}`,
        `ui-checkbox-color-${colorScheme}`,
        isInvalid && 'ui-checkbox-error',
        className,
      )}
      data-disabled={rest.disabled || fc?.isDisabled || undefined}
    >
      <RadixCheckbox.Root
        ref={ref}
        className="ui-checkbox-control"
        disabled={rest.disabled ?? fc?.isDisabled}
        {...rest}
      >
        <RadixCheckbox.Indicator className="ui-checkbox-indicator">
          {/* indeterminate 时画 - 不画 ✓，比 mantine 那种半实心方块更直观 */}
          {rest.checked === 'indeterminate' ? (
            <Minus className="ui-checkbox-icon" aria-hidden="true" />
          ) : (
            <Check className="ui-checkbox-icon" aria-hidden="true" />
          )}
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {children && <span className="ui-checkbox-text">{children}</span>}
    </label>
  );
});
