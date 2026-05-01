/**
 * EmptyState —— 空态展示。
 *
 *   <EmptyState
 *     icon={<BookIcon />}
 *     title="还没有书评"
 *     description="第一个写下感受的读者会出现在书籍详情页"
 *     action={<Button>写书评</Button>}
 *   />
 *
 * 设计取舍：
 *   - title / description / action 都是可选 —— 极简调用场景：`<EmptyState title="暂无数据" />`
 *   - icon 不限制类型（ReactNode），业务可塞 SVG / lucide / 图片
 *   - 不内建 illustration —— 业务设计风格不一，放图丑过放 icon
 *   - size 控制内边距 + 字号；compact 适合 list item 内嵌，default 适合页面级
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export type EmptyStateSize = 'compact' | 'default' | 'lg';

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  /** 主 CTA 区。可放 Button / Link / 多按钮组 */
  action?: ReactNode;
  /** 次要操作 */
  secondaryAction?: ReactNode;
  size?: EmptyStateSize;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  props,
  ref
) {
  const {
    icon,
    title,
    description,
    action,
    secondaryAction,
    size = 'default',
    className,
    ...rest
  } = props;

  return (
    <div
      ref={ref}
      className={cn('ui-empty-state', `ui-empty-state-size-${size}`, className)}
      role='status'
      {...rest}
    >
      {icon && <div className='ui-empty-state-icon'>{icon}</div>}
      {title && <div className='ui-empty-state-title'>{title}</div>}
      {description && <div className='ui-empty-state-description'>{description}</div>}
      {(action || secondaryAction) && (
        <div className='ui-empty-state-actions'>
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
});
