/**
 * Radio + RadioGroup —— 基于 Radix RadioGroup primitives。
 *
 *   <RadioGroup value={lang} onValueChange={setLang}>
 *     <Radio value="zh">中文</Radio>
 *     <Radio value="en">English</Radio>
 *   </RadioGroup>
 *
 *   <RadioGroup direction="row" defaultValue="m">
 *     <Radio value="s">Small</Radio>
 *     <Radio value="m">Medium</Radio>
 *     <Radio value="l">Large</Radio>
 *   </RadioGroup>
 */

import * as RadixRadio from '@radix-ui/react-radio-group';
import {
  createContext,
  forwardRef,
  useContext,
  type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';
import { useFormControlContext } from '../FormControl/FormControl';

export type RadioSize = 'sm' | 'md' | 'lg';

interface RadioGroupContextValue {
  size: RadioSize;
}

const RadioGroupContext = createContext<RadioGroupContextValue>({ size: 'md' });

export interface RadioGroupProps extends Omit<RadixRadio.RadioGroupProps, 'asChild'> {
  size?: RadioSize;
  /** 排列方向（默认 column） */
  direction?: 'row' | 'column';
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup(
  props,
  ref
) {
  const { size = 'md', direction = 'column', className, children, ...rest } = props;
  return (
    <RadioGroupContext.Provider value={{ size }}>
      <RadixRadio.Root
        ref={ref}
        className={cn('ui-radio-group', className)}
        data-direction={direction}
        {...rest}
      >
        {children}
      </RadixRadio.Root>
    </RadioGroupContext.Provider>
  );
});

export interface RadioProps extends Omit<RadixRadio.RadioGroupItemProps, 'asChild' | 'children'> {
  /** 单独覆盖 size（一般跟 RadioGroup） */
  size?: RadioSize;
  children?: ReactNode;
}

export const Radio = forwardRef<HTMLButtonElement, RadioProps>(function Radio(props, ref) {
  const { size: sizeOverride, className, children, ...rest } = props;
  const { size: ctxSize } = useContext(RadioGroupContext);
  const size = sizeOverride ?? ctxSize;
  const fc = useFormControlContext();

  return (
    <label
      className={cn('ui-radio-root', `ui-radio-size-${size}`, className)}
      data-disabled={rest.disabled || fc?.isDisabled || undefined}
    >
      <RadixRadio.Item
        ref={ref}
        className="ui-radio-control"
        disabled={rest.disabled ?? fc?.isDisabled}
        {...rest}
      />
      {children && <span>{children}</span>}
    </label>
  );
});
