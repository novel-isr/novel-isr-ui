/**
 * Table —— 数据表格。两套 API：
 *
 * 1. 声明式（推荐 80% 场景）：传 columns + data
 *    <Table
 *      columns={[{ key: 'name', header: '名字' }, { key: 'age', header: '年龄' }]}
 *      data={users}
 *    />
 *
 * 2. compound（自定义复杂表头 / 合并单元格）：
 *    <TableRoot>
 *      <TableHead><TableRow><TableHeader>名字</TableHeader></TableRow></TableHead>
 *      <TableBody><TableRow><TableCell>Alice</TableCell></TableRow></TableBody>
 *    </TableRoot>
 */

import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  type TableHTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from 'react';
import { cn } from '../../utils/cn';
import { Skeleton } from '../Skeleton/Skeleton';

export type TableSize = 'sm' | 'md' | 'lg';
export type TableVariant = 'simple' | 'striped' | 'bordered';

// ─── compound parts ──────────────────────────────────────────────────────

export interface TableRootProps extends Omit<TableHTMLAttributes<HTMLTableElement>, 'size'> {
  size?: TableSize;
  variant?: TableVariant;
  hoverable?: boolean;
}

export const TableRoot = forwardRef<HTMLTableElement, TableRootProps>(function TableRoot(
  props,
  ref
) {
  const { size = 'md', variant = 'simple', hoverable = false, className, ...rest } = props;
  return (
    <div
      className={cn(
        'ui-table-wrapper',
        variant === 'bordered' && 'ui-table-variant-bordered'
      )}
    >
      <table
        ref={ref}
        className={cn(
          'ui-table',
          `ui-table-size-${size}`,
          `ui-table-variant-${variant}`,
          hoverable && 'ui-table-hoverable',
          className
        )}
        {...rest}
      />
    </div>
  );
});

export const TableHead = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  function TableHead(props, ref) {
    return <thead ref={ref} {...props} />;
  }
);

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  function TableBody(props, ref) {
    return <tbody ref={ref} {...props} />;
  }
);

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  function TableRow(props, ref) {
    return <tr ref={ref} {...props} />;
  }
);

export const TableHeader = forwardRef<
  HTMLTableCellElement,
  ThHTMLAttributes<HTMLTableCellElement>
>(function TableHeader(props, ref) {
  return <th ref={ref} {...props} />;
});

export const TableCell = forwardRef<
  HTMLTableCellElement,
  TdHTMLAttributes<HTMLTableCellElement>
>(function TableCell(props, ref) {
  return <td ref={ref} {...props} />;
});

// ─── 声明式 API ──────────────────────────────────────────────────────────

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  /** 渲染单元格；不传则取 row[key] */
  render?: (row: T, rowIndex: number) => ReactNode;
  /** 列宽 CSS 值 */
  width?: string | number;
  /** 单元格对齐 */
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> extends Omit<TableRootProps, 'children'> {
  columns: TableColumn<T>[];
  data: T[];
  /** 行 key 提取器 */
  rowKey?: (row: T, index: number) => string | number;
  /** 空数据时显示 */
  emptyText?: ReactNode;
  /** 加载中：渲染等量骨架行替代真实数据。需配合 loadingRows 控制行数 */
  loading?: boolean;
  /** loading=true 时渲染的骨架行数（默认 5） */
  loadingRows?: number;
}

export function Table<T>(props: TableProps<T>) {
  const {
    columns,
    data,
    rowKey,
    emptyText = '暂无数据',
    loading = false,
    loadingRows = 5,
    ...rootProps
  } = props;

  return (
    <TableRoot {...rootProps}>
      <TableHead>
        <TableRow>
          {columns.map(col => (
            <TableHeader
              key={col.key}
              style={{
                width: typeof col.width === 'number' ? `${col.width}px` : col.width,
                textAlign: col.align,
              }}
            >
              {col.header}
            </TableHeader>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {loading ? (
          Array.from({ length: loadingRows }).map((_, i) => (
            <TableRow key={`skeleton-${i}`} aria-hidden="true">
              {columns.map(col => (
                <TableCell key={col.key} style={{ textAlign: col.align }}>
                  <Skeleton variant="text" width="80%" height={16} />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="ui-table-empty">
              {emptyText}
            </TableCell>
          </TableRow>
        ) : (
          data.map((row, i) => (
            <TableRow key={rowKey ? rowKey(row, i) : i}>
              {columns.map(col => {
                const v = col.render
                  ? col.render(row, i)
                  : ((row as Record<string, unknown>)[col.key] as ReactNode);
                return (
                  <TableCell key={col.key} style={{ textAlign: col.align }}>
                    {v}
                  </TableCell>
                );
              })}
            </TableRow>
          ))
        )}
      </TableBody>
    </TableRoot>
  );
}
