import { forwardRef } from 'react';
import { Button, type ButtonProps } from './Button';
import { Tooltip, TooltipProvider } from '../Tooltip/Tooltip';
import { cn } from '../../utils/cn';

export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'loadingText'> {
  label: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, className, variant = 'ghost', intent = 'neutral', children, ...props }, ref,
) {
  return (
    <TooltipProvider>
      <Tooltip label={label}>
        <Button ref={ref} variant={variant} intent={intent} {...props}
          aria-label={label} className={cn('ui-icon-button', className)}>
          <span aria-hidden="true">{children}</span>
        </Button>
      </Tooltip>
    </TooltipProvider>
  );
});
