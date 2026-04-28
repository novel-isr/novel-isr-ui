/**
 * Pagination —— 分页器。
 *
 *   <Pagination total={100} pageSize={10} page={page} onPageChange={setPage} />
 *
 * 显示策略（siblingCount = 1，可调）：
 *   总页数 ≤ 7：全列    [1][2][3][4][5][6][7]
 *   当前接近开头：       [1][2][3][4][...][N]
 *   当前在中间：         [1][...][p-1][p][p+1][...][N]
 *   当前接近末尾：       [1][...][N-3][N-2][N-1][N]
 */

import { forwardRef, useMemo, type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface PaginationProps extends HTMLAttributes<HTMLElement> {
  /** 总条数 */
  total: number;
  /** 每页条数 */
  pageSize: number;
  /** 当前页（1-based） */
  page: number;
  /** 页变更回调 */
  onPageChange: (page: number) => void;
  /** 当前页两侧各显示几个相邻页码（默认 1） */
  siblingCount?: number;
  /** 隐藏 prev/next 按钮 */
  hideEdges?: boolean;
}

function range(start: number, end: number): number[] {
  const out: number[] = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

type Item = number | 'ellipsis-left' | 'ellipsis-right';

function buildItems(totalPages: number, page: number, siblings: number): Item[] {
  // 总数小：全列
  const totalToShow = siblings * 2 + 5; // 1 + ... + (sib*2+1) + ... + N = sib*2+5
  if (totalPages <= totalToShow) return range(1, totalPages);

  const leftSibling = Math.max(page - siblings, 1);
  const rightSibling = Math.min(page + siblings, totalPages);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  const items: Item[] = [];

  if (!showLeftEllipsis && showRightEllipsis) {
    // 头部：[1..rightSibling+1][...][N]
    const leftRange = range(1, siblings * 2 + 3);
    items.push(...leftRange, 'ellipsis-right', totalPages);
  } else if (showLeftEllipsis && !showRightEllipsis) {
    // 尾部：[1][...][N-(sib*2+2)..N]
    items.push(1, 'ellipsis-left', ...range(totalPages - (siblings * 2 + 2), totalPages));
  } else if (showLeftEllipsis && showRightEllipsis) {
    // 中间：[1][...][p-sib..p+sib][...][N]
    items.push(
      1,
      'ellipsis-left',
      ...range(leftSibling, rightSibling),
      'ellipsis-right',
      totalPages
    );
  } else {
    items.push(...range(1, totalPages));
  }
  return items;
}

export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination(props, ref) {
  const {
    total,
    pageSize,
    page,
    onPageChange,
    siblingCount = 1,
    hideEdges = false,
    className,
    ...rest
  } = props;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = useMemo(
    () => buildItems(totalPages, page, siblingCount),
    [totalPages, page, siblingCount]
  );

  const go = (p: number) => {
    if (p >= 1 && p <= totalPages && p !== page) onPageChange(p);
  };

  return (
    <nav
      ref={ref}
      role="navigation"
      aria-label="分页"
      className={cn('ui-pagination', className)}
      {...rest}
    >
      {!hideEdges && (
        <button
          type="button"
          className="ui-pagination-item"
          aria-label="上一页"
          disabled={page <= 1}
          onClick={() => go(page - 1)}
        >
          ‹
        </button>
      )}

      {items.map((item, i) => {
        if (item === 'ellipsis-left' || item === 'ellipsis-right') {
          return (
            <span key={`${item}-${i}`} className="ui-pagination-ellipsis" aria-hidden="true">
              …
            </span>
          );
        }
        const isActive = item === page;
        return (
          <button
            key={item}
            type="button"
            className="ui-pagination-item"
            aria-current={isActive ? 'page' : undefined}
            data-active={isActive || undefined}
            onClick={() => go(item)}
          >
            {item}
          </button>
        );
      })}

      {!hideEdges && (
        <button
          type="button"
          className="ui-pagination-item"
          aria-label="下一页"
          disabled={page >= totalPages}
          onClick={() => go(page + 1)}
        >
          ›
        </button>
      )}
    </nav>
  );
});
