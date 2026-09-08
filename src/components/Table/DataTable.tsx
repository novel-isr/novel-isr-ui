import { RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Table, type TableProps } from './Table';
import { Pagination, type PaginationProps } from '../Pagination/Pagination';
import { EmptyState } from '../EmptyState/EmptyState';
import { Button } from '../Button/Button';

export interface DataTableProps<T> extends TableProps<T> {
  /** Rows are already paginated. Fetching/slicing belongs to the data owner. */
  pagination?: PaginationProps;
  error?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}

export function DataTable<T>({ pagination, error, onRetry, retryLabel = '重试', loading, ...props }: DataTableProps<T>) {
  return (
    <div className="ui-data-table" aria-busy={loading || undefined}>
      {error && !loading ? (
        <EmptyState title={error} role="alert" action={onRetry &&
          <Button variant="outline" intent="neutral" onClick={onRetry} leftIcon={<RefreshCw size={16} />}>{retryLabel}</Button>
        } />
      ) : (
        <>
          <Table {...props} loading={loading} />
          {pagination && <Pagination {...pagination} />}
        </>
      )}
    </div>
  );
}
