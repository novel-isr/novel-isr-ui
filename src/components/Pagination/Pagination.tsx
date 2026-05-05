/**
 * Pagination —— 分页器。
 *
 * 完整：
 *   <Pagination total={300} pageSize={size} page={page}
 *               onPageChange={setPage} onPageSizeChange={setSize}
 *               pageSizeOptions={[20, 50, 100]} />
 *
 * 简单（移动端 / 嵌列表）：
 *   <Pagination simple total={N} pageSize={20} page={p} onPageChange={setP} />
 *
 * 显示策略（siblingCount=1, boundaryCount=1 为例）：
 *   总页数 ≤ 7：全列          [1][2][3][4][5][6][7]
 *   接近开头：                 [1][2][3][4][...][N]
 *   中间：                     [1][...][p-1][p][p+1][...][N]
 *   接近末尾：                 [1][...][N-3][N-2][N-1][N]
 *   boundaryCount=2 时首尾各保留 2 个页码（[1][2][...][p][...][N-1][N]）。
 */

import { forwardRef, useMemo, type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { Select, SelectItem } from '../Select/Select';

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
  /** 首尾保留的页码个数（默认 1，[1][...]/[...][N]）。设 2 → [1][2][...][N-1][N] */
  boundaryCount?: number;
  /** 隐藏 prev/next 按钮 */
  hideEdges?: boolean;
  /** 简单模式：只显示「‹ X / N ›」，不渲染页码列表，移动端友好 */
  simple?: boolean;
  /** 完全不渲染页码（仅 prev/next + 计数）。simple 的更克制版 */
  hideNumbers?: boolean;
  /** page-size 选择器，提供则启用；用 ui 库的 Select 渲染 */
  pageSizeOptions?: readonly number[];
  /** page-size 变更回调，与 pageSizeOptions 配套 */
  onPageSizeChange?: (size: number) => void;
  /** page-size 选择器右侧的显示文本（默认「条 / 页」） */
  pageSizeLabel?: string;
}

function range(start: number, end: number): number[] {
  const out: number[] = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

type Item = number | 'ellipsis-left' | 'ellipsis-right';

function buildItems(
  totalPages: number,
  page: number,
  siblings: number,
  boundary: number,
): Item[] {
  // 一行能放下的最少槽位：左边界 + 当前及左右相邻 + 右边界 + 两个 ellipsis 占位
  // 总页数没超过这个阈值时直接全列，没必要省略
  const totalSlots = boundary * 2 + siblings * 2 + 3;
  if (totalPages <= totalSlots) return range(1, totalPages);

  const leftSibling = Math.max(page - siblings, boundary + 1);
  const rightSibling = Math.min(page + siblings, totalPages - boundary);

  // 左 ellipsis 出现条件：sibling 离左边界超过 1 步（差 1 步时 sibling 直接吃掉）
  const showLeftEllipsis = leftSibling > boundary + 2;
  const showRightEllipsis = rightSibling < totalPages - boundary - 1;

  // 4 种形态：开头簇 / 中间 / 末尾簇 / 两端都省略
  if (!showLeftEllipsis && showRightEllipsis) {
    const leftCount = boundary + siblings * 2 + 2;
    return [
      ...range(1, leftCount),
      'ellipsis-right',
      ...range(totalPages - boundary + 1, totalPages),
    ];
  }
  if (showLeftEllipsis && !showRightEllipsis) {
    const rightCount = boundary + siblings * 2 + 2;
    return [
      ...range(1, boundary),
      'ellipsis-left',
      ...range(totalPages - rightCount + 1, totalPages),
    ];
  }
  return [
    ...range(1, boundary),
    'ellipsis-left',
    ...range(leftSibling, rightSibling),
    'ellipsis-right',
    ...range(totalPages - boundary + 1, totalPages),
  ];
}

export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination(
  props,
  ref,
) {
  const {
    total,
    pageSize,
    page,
    onPageChange,
    siblingCount = 1,
    boundaryCount = 1,
    hideEdges = false,
    simple = false,
    hideNumbers = false,
    pageSizeOptions,
    onPageSizeChange,
    pageSizeLabel = '条 / 页',
    className,
    ...rest
  } = props;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = useMemo(
    () => buildItems(totalPages, page, siblingCount, boundaryCount),
    [totalPages, page, siblingCount, boundaryCount],
  );

  const go = (p: number) => {
    if (p >= 1 && p <= totalPages && p !== page) onPageChange(p);
  };

  const showPageList = !simple && !hideNumbers;
  const showSimpleCounter = simple || hideNumbers;

  return (
    <nav
      ref={ref}
      role="navigation"
      aria-label="分页"
      className={cn('ui-pagination', simple && 'ui-pagination-simple', className)}
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

      {showSimpleCounter && (
        <span className="ui-pagination-counter" aria-live="polite">
          {page} / {totalPages}
        </span>
      )}

      {showPageList &&
        items.map((item, i) => {
          if (item === 'ellipsis-left' || item === 'ellipsis-right') {
            return (
              <span
                key={`${item}-${i}`}
                className="ui-pagination-ellipsis"
                aria-hidden="true"
              >
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

      {pageSizeOptions && pageSizeOptions.length > 0 && onPageSizeChange && (
        <div className="ui-pagination-page-size">
          <Select
            size="sm"
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
            aria-label="每页显示条数"
          >
            {pageSizeOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option} {pageSizeLabel}
              </SelectItem>
            ))}
          </Select>
        </div>
      )}
    </nav>
  );
});
