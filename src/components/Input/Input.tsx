/**
 * Input —— 文本输入框，支持 prefix / suffix 插槽。
 * 在 <FormControl> 内时自动接 a11y（id / aria-invalid / aria-describedby / disabled）。
 */

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { useFormControlProps } from '../FormControl/FormControl';

export type InputVariant = 'outline' | 'filled' | 'unstyled';
export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  variant?: InputVariant;
  size?: InputSize;
  isInvalid?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
  const {
    variant = 'outline',
    size = 'md',
    isInvalid: isInvalidProp = false,
    prefix,
    suffix,
    className,
    ...rest
  } = props;

  const fc = useFormControlProps(rest);
  const isInvalid = isInvalidProp || !!fc['aria-invalid'];
  const isDisabled = !!fc.disabled;

  return (
    <div
      className={cn(
        'ui-input-root',
        `ui-input-variant-${variant}`,
        `ui-input-size-${size}`,
        isInvalid && 'ui-input-error',
        isDisabled && 'ui-input-disabled',
        className
      )}
      data-invalid={isInvalid || undefined}
      data-disabled={isDisabled || undefined}
    >
      {prefix && <span className="ui-input-addon ui-input-addon-start">{prefix}</span>}
      <input ref={ref} className="ui-input-field" {...fc} />
      {suffix && <span className="ui-input-addon ui-input-addon-end">{suffix}</span>}
    </div>
  );
});
