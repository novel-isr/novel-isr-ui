import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface DescriptionListItem {
  key: string;
  label: ReactNode;
  value: ReactNode;
}

export interface DescriptionListProps extends HTMLAttributes<HTMLDListElement> {
  items: DescriptionListItem[];
}

export const DescriptionList = forwardRef<HTMLDListElement, DescriptionListProps>(function DescriptionList(
  { items, className, ...props }, ref,
) {
  return (
    <dl ref={ref} className={cn('ui-description-list', className)} {...props}>
      {items.map(item => <div className="ui-description-row" key={item.key}>
        <dt>{item.label}</dt><dd>{item.value}</dd>
      </div>)}
    </dl>
  );
});
