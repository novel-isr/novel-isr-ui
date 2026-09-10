import { forwardRef, type LiHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

const hasContent = (value: ReactNode) => value != null && typeof value !== 'boolean' && value !== '';

export interface ListItemProps extends Omit<LiHTMLAttributes<HTMLLIElement>, 'children'> {
  primary: ReactNode;
  secondary?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
}

export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(function ListItem(
  { primary, secondary, icon, actions, className, ...props }, ref,
) {
  return <li ref={ref} className={cn('ui-list-item', className)} {...props}>
    {hasContent(icon) && <div className="ui-list-item-icon" aria-hidden="true">{icon}</div>}
    <div className="ui-list-item-content">
      <div className="ui-list-item-primary">{primary}</div>
      {hasContent(secondary) && <div className="ui-list-item-secondary">{secondary}</div>}
    </div>
    {hasContent(actions) && <div className="ui-list-item-actions">{actions}</div>}
  </li>;
});
