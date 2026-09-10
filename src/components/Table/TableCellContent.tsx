import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface TableCellContentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  primary: ReactNode;
  secondary?: ReactNode;
  monospace?: boolean;
  maxWidth?: string | number;
}

export const TableCellContent = forwardRef<HTMLDivElement, TableCellContentProps>(function TableCellContent({
  primary, secondary, monospace = false, maxWidth = 360, className, style, ...rest
}, ref) {
  const Primary = monospace ? 'code' : 'div';
  return <div ref={ref} className={cn('ui-table-cell-content', className)}
    data-secondary={secondary != null || undefined} style={{ maxWidth, ...style }} {...rest}>
    <Primary className="ui-table-cell-primary">{primary}</Primary>
    {secondary != null && <div className="ui-table-cell-secondary">{secondary}</div>}
  </div>;
});
