import { forwardRef, type HTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../utils/cn';

export interface ProseProps extends HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export const Prose = forwardRef<HTMLDivElement, ProseProps>(function Prose({
  asChild = false, className, ...rest
}, ref) {
  const Component = asChild ? Slot : 'div';
  return <Component ref={ref} className={cn('ui-prose', className)} {...rest} />;
});
