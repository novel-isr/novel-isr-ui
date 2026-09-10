import { forwardRef, type AnchorHTMLAttributes } from 'react';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface TextLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  asChild?: boolean;
  variant?: 'default' | 'subtle' | 'action';
}

export const TextLink = forwardRef<HTMLAnchorElement, TextLinkProps>(function TextLink(
  { asChild = false, variant = 'default', className, children, ...props }, ref,
) {
  const Component = asChild ? Slot : 'a';
  return (
    <Component ref={ref} className={cn('ui-text-link', `ui-text-link-${variant}`, className)} {...props}>
      <Slottable>{children}</Slottable>
      {variant === 'subtle' && <ChevronRight aria-hidden="true" />}
    </Component>
  );
});
