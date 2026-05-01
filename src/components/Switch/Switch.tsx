/**
 * Switch —— 开关 toggle，基于 Radix Switch primitives。
 *
 *   <Switch defaultChecked>启用</Switch>
 *   <Switch checked={dark} onCheckedChange={setDark}>深色模式</Switch>
 */

import * as RadixSwitch from '@radix-ui/react-switch';
import { forwardRef, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { useFormControlContext } from '../FormControl/FormControl';

export type SwitchSize = 'sm' | 'md' | 'lg';

export interface SwitchProps extends Omit<RadixSwitch.SwitchProps, 'asChild' | 'children'> {
  size?: SwitchSize;
  children?: ReactNode;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(props, ref) {
  const { size = 'md', className, children, ...rest } = props;
  const fc = useFormControlContext();
  const checked = rest.checked ?? rest.defaultChecked;

  return (
    <label
      className={cn('ui-switch-root', `ui-switch-size-${size}`, className)}
      data-disabled={rest.disabled || fc?.isDisabled || undefined}
      data-state={checked ? 'checked' : 'unchecked'}
    >
      <RadixSwitch.Root
        ref={ref}
        className="ui-switch-control"
        disabled={rest.disabled ?? fc?.isDisabled}
        {...rest}
      >
        <RadixSwitch.Thumb className="ui-switch-thumb" />
      </RadixSwitch.Root>
      {children && <span>{children}</span>}
    </label>
  );
});
