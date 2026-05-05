/**
 * Checkbox —— 基于 Radix Checkbox primitives，加 token 视觉。
 *
 *   <Checkbox defaultChecked>同意条款</Checkbox>
 *   <Checkbox checked={v} onCheckedChange={setV}>受控</Checkbox>
 *   <Checkbox isInvalid>红边</Checkbox>
 *   <Checkbox indeterminate>半选</Checkbox>
 */

import * as RadixCheckbox from '@radix-ui/react-checkbox';
import { forwardRef, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useFormControlContext } from '../FormControl/FormControl';

export type CheckboxSize = 'sm' | 'md' | 'lg';

export interface CheckboxProps
  extends Omit<RadixCheckbox.CheckboxProps, 'asChild' | 'size' | 'children'> {
  size?: CheckboxSize;
  isInvalid?: boolean;
  /** label 文本 */
  children?: ReactNode;
}

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(props, ref) {
  const { size = 'md', isInvalid: isInvalidProp = false, className, children, ...rest } = props;
  const fc = useFormControlContext();
  const isInvalid = isInvalidProp || fc?.isInvalid || false;

  return (
    <label
      className={cn(
        'ui-checkbox-root',
        `ui-checkbox-size-${size}`,
        isInvalid && 'ui-checkbox-error',
        className
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
          <Check className='ui-checkbox-icon' aria-hidden='true' />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {children && <span>{children}</span>}
    </label>
  );
});
