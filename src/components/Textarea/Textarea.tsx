/**
 * Textarea —— 多行文本输入。跟 Input 同 token 系统。
 *
 *   <Textarea placeholder="说点什么" />
 *   <Textarea variant="filled" size="lg" rows={6} />
 */

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { useFormControlProps } from '../FormControl/FormControl';

export type TextareaVariant = 'outline' | 'filled' | 'unstyled';
export type TextareaSize = 'sm' | 'md' | 'lg';
export type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both';

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size' | 'resize'> {
  variant?: TextareaVariant;
  size?: TextareaSize;
  isInvalid?: boolean;
  /** @deprecated Manual resizing is disabled. Set rows or layout dimensions instead. */
  resize?: TextareaResize;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  props,
  ref
) {
  const {
    variant = 'outline',
    size = 'md',
    isInvalid = false,
    resize: _resize,
    className,
    ...rest
  } = props;

  const fc = useFormControlProps(rest);

  return (
    <textarea
      ref={ref}
      className={cn(
        'ui-textarea',
        `ui-textarea-variant-${variant}`,
        `ui-textarea-size-${size}`,
        'ui-textarea-resize-none',
        (isInvalid || fc['aria-invalid']) && 'ui-textarea-error',
        className
      )}
      {...fc}
    />
  );
});
