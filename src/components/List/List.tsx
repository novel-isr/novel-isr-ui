import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface ListProps extends HTMLAttributes<HTMLUListElement> {
  density?: 'default' | 'compact';
  dividers?: boolean;
}

export const List = forwardRef<HTMLUListElement, ListProps>(function List(
  { density = 'default', dividers = true, role = 'list', className, ...props }, ref,
) {
  return <ul ref={ref} role={role}
    className={cn('ui-list', `ui-list-density-${density}`, dividers && 'ui-list-dividers', className)}
    {...props} />;
});
