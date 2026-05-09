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
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type TableHTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from "react";
import { cn } from "../../utils/cn";
import { Skeleton } from "../Skeleton/Skeleton";

export type TableSize = "sm" | "md" | "lg";
export type TableVariant = "simple" | "striped" | "bordered";

/**
 * scroll 配置 —— 跟 antd / arco / mantine 一致：
 *
 *   x?: number | string   触发横向 scroll 的 table 最小宽度。给值后切换到
 *                         "scroll-x 模式"：table-layout: auto + min-width
 *                         = scroll.x，wrapper 已经是 overflow-x: auto，
 *                         容器比 scroll.x 窄时自然出滚动条。列按内容自然
 *                         展开（不再受 colgroup 强约束 / 不再 wrap）。
 *                         适合宽表 / 数据密集表。
 *   y?: number | string   table body 最大可见高度。开启后 wrapper 设 maxHeight
 *                         + overflow-y: auto；<thead> sticky，行滚头不滚。
 */
export interface TableScrollConfig {
  x?: number | string;
  y?: number | string;
}

// ─── compound parts ──────────────────────────────────────────────────────

export interface TableRootProps extends Omit<
  TableHTMLAttributes<HTMLTableElement>,
  "size"
> {
  size?: TableSize;
  variant?: TableVariant;
  hoverable?: boolean;
  scroll?: TableScrollConfig;
}

function resolveLength(v: number | string | undefined): string | undefined {
  if (v === undefined) return undefined;
  return typeof v === "number" ? `${v}px` : v;
}

export const TableRoot = forwardRef<HTMLTableElement, TableRootProps>(
  function TableRoot(props, ref) {
    const {
      size = "md",
      variant = "simple",
      hoverable = false,
      scroll,
      className,
      style,
      ...rest
    } = props;

    const scrollX = resolveLength(scroll?.x);
    const scrollY = resolveLength(scroll?.y);
    const wrapperStyle: CSSProperties = scrollY
      ? { maxHeight: scrollY, overflowY: "auto" }
      : {};
    const tableStyle: CSSProperties = {
      ...(scrollX ? { minWidth: scrollX } : {}),
      ...style,
    };

    return (
      <div
        className={cn(
          "ui-table-wrapper",
          variant === "bordered" && "ui-table-variant-bordered",
          scrollX && "ui-table-wrapper-scroll-x",
          scrollY && "ui-table-wrapper-scroll-y",
        )}
        style={wrapperStyle}
      >
        <table
          ref={ref}
          className={cn(
            "ui-table",
            `ui-table-size-${size}`,
            `ui-table-variant-${variant}`,
            hoverable && "ui-table-hoverable",
            scrollX && "ui-table-scroll-x",
            className,
          )}
          style={tableStyle}
          {...rest}
        />
      </div>
    );
  },
);

export const TableHead = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(function TableHead(props, ref) {
  return <thead ref={ref} {...props} />;
});

export const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(function TableBody(props, ref) {
  return <tbody ref={ref} {...props} />;
});

export const TableRow = forwardRef<
  HTMLTableRowElement,
  HTMLAttributes<HTMLTableRowElement>
>(function TableRow(props, ref) {
  return <tr ref={ref} {...props} />;
});

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
  /** 列宽 CSS 值。fixed 列必须传 width（左/右偏移要靠它累加）。 */
  width?: string | number;
  /** 单元格对齐 */
  align?: "left" | "center" | "right";
  /**
   * 单行截断 + ellipsis —— 跟 antd 同名 prop。开启后：
   *   white-space: nowrap; overflow: hidden; text-overflow: ellipsis
   * 适合长 URL / 用户备注 / 标题这类不重要换行的场景。
   * 完整内容请自己包 Tooltip（cell 内容是 ReactNode，库不能假设是 string）。
   */
  ellipsis?: boolean;
  /**
   * 列固定 —— 跟 antd column.fixed / arco fixedSide 一致：
   *   'left'  —— 表格横滚时列固定在左侧（操作列 / 行 ID 适用）
   *   'right' —— 固定在右侧（"操作"按钮列适用）
   *
   * 实现：position: sticky + 计算累加左/右偏移（来自 width prop）+ 阴影标记边界。
   * 必须配合 column.width，运行时按下标顺序累加偏移。多个左固定列只能集中
   * 在 columns 头部连续声明，多个右固定列在尾部连续 —— 中间穿插非 fixed 列
   * 的话偏移就乱套了（这是业界通用约束，antd / arco 都一样）。
   */
  fixed?: "left" | "right";
}

export interface TableProps<T> extends Omit<TableRootProps, "children"> {
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

/**
 * 计算 sticky 列的左右偏移 + 边界 key —— 纯函数 + 可单测。
 *
 * 跟 antd / arco 一样要求 fixed 列必须连续声明在 columns 头部 / 尾部，
 * 中间穿插非 fixed 列时累加偏移会失真（CSS sticky 是 viewport-aligned 的，
 * 间接列没有"占位"就跳号了）。运行时不强制校验，让消费方约束。
 */
export interface FixedColumnLayout {
  leftOffsets: Record<string, number>;
  rightOffsets: Record<string, number>;
  lastLeftFixedKey: string | undefined;
  firstRightFixedKey: string | undefined;
}

export function computeFixedColumnLayout<T>(
  columns: readonly TableColumn<T>[],
): FixedColumnLayout {
  const numericWidth = (w: string | number | undefined): number => {
    if (typeof w === "number") return w;
    if (typeof w === "string") {
      const n = parseFloat(w);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };
  const leftOffsets: Record<string, number> = {};
  const rightOffsets: Record<string, number> = {};
  let leftAcc = 0;
  for (const col of columns) {
    if (col.fixed === "left") {
      leftOffsets[col.key] = leftAcc;
      leftAcc += numericWidth(col.width);
    }
  }
  let rightAcc = 0;
  for (let i = columns.length - 1; i >= 0; i--) {
    const col = columns[i]!;
    if (col.fixed === "right") {
      rightOffsets[col.key] = rightAcc;
      rightAcc += numericWidth(col.width);
    }
  }
  let lastLeftFixedKey: string | undefined;
  for (const col of columns) {
    if (col.fixed === "left") lastLeftFixedKey = col.key;
    else if (lastLeftFixedKey !== undefined) break;
  }
  let firstRightFixedKey: string | undefined;
  for (let i = columns.length - 1; i >= 0; i--) {
    const col = columns[i]!;
    if (col.fixed === "right") firstRightFixedKey = col.key;
    else if (firstRightFixedKey !== undefined) break;
  }
  return { leftOffsets, rightOffsets, lastLeftFixedKey, firstRightFixedKey };
}

export function Table<T>(props: TableProps<T>) {
  const {
    columns,
    data,
    rowKey,
    emptyText = "暂无数据",
    loading = false,
    loadingRows = 5,
    ...rootProps
  } = props;

  // 列宽策略 —— 跟 antd / arco / mantine 一致：
  //
  //   col.width 同时写到 <th> 的 width 和 min-width 上。
  //
  // 在 table-layout: auto（默认）下：
  //   - width 是"首选宽度"：行有空间就用它
  //   - min-width 是"硬下限"：浏览器不能把列压到比这窄。
  //
  // 所有列 min-width 之和 > wrapper 宽时，table 自然超宽，
  // wrapper 的 overflow-x: auto 就出横向滚动条 —— 这是开箱即用的横滚，
  // 业务不需要 scroll={{ x }} 显式声明就能在窄屏幕里看到所有列。
  //
  // 不再用 <colgroup> —— colgroup 的 <col> 不可靠地支持 min-width，
  // 把约束写到每列的 <th> 上更跨浏览器稳定（th 的 width/min-width 在 CSS 表布局
  // 算法里直接进入 column min/max-content 计算）。

  const layout = computeFixedColumnLayout(columns);
  const { leftOffsets, rightOffsets, lastLeftFixedKey, firstRightFixedKey } =
    layout;

  const cellStyleFor = (col: TableColumn<T>) => {
    const style: React.CSSProperties = { textAlign: col.align };
    if (col.width !== undefined) {
      const w = typeof col.width === "number" ? `${col.width}px` : col.width;
      style.width = w;
      style.minWidth = w;
    }
    if (col.fixed === "left") {
      style.left = `${leftOffsets[col.key] ?? 0}px`;
    } else if (col.fixed === "right") {
      style.right = `${rightOffsets[col.key] ?? 0}px`;
    }
    return style;
  };

  const fixedDataAttrs = (col: TableColumn<T>) => ({
    "data-fixed": col.fixed,
    "data-fixed-edge":
      col.fixed === "left" && col.key === lastLeftFixedKey
        ? "left"
        : col.fixed === "right" && col.key === firstRightFixedKey
          ? "right"
          : undefined,
  });

  return (
    <TableRoot {...rootProps}>
      <TableHead>
        <TableRow>
          {columns.map((col) => (
            <TableHeader
              key={col.key}
              style={cellStyleFor(col)}
              data-ellipsis={col.ellipsis ? "true" : undefined}
              {...fixedDataAttrs(col)}
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
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  style={cellStyleFor(col)}
                  {...fixedDataAttrs(col)}
                >
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
              {columns.map((col) => {
                const v = col.render
                  ? col.render(row, i)
                  : ((row as Record<string, unknown>)[col.key] as ReactNode);
                return (
                  <TableCell
                    key={col.key}
                    style={cellStyleFor(col)}
                    data-ellipsis={col.ellipsis ? "true" : undefined}
                    {...fixedDataAttrs(col)}
                  >
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
