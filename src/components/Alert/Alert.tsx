/**
 * Alert —— 信息提示横条。
 *
 *   <Alert status="success">已保存</Alert>
 *   <Alert status="danger" variant="solid" title="出错了">服务器返回 500</Alert>
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export type AlertStatus = 'info' | 'success' | 'warning' | 'danger';
export type AlertVariant = 'subtle' | 'solid' | 'outline';

const ICONS: Record<AlertStatus, ReactNode> = {
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 2 L22 20 H2 Z" />
      <line x1="12" y1="9" x2="12" y2="14" />
      <line x1="12" y1="17.5" x2="12.01" y2="17.5" />
    </svg>
  ),
  danger: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
};

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  status?: AlertStatus;
  variant?: AlertVariant;
  /** 加粗标题（在 description 上方） */
  title?: ReactNode;
  /** 显式覆盖图标（不传用 status 默认） */
  icon?: ReactNode;
  /** 不显示图标 */
  hideIcon?: boolean;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  const {
    status = 'info',
    variant = 'subtle',
    title,
    icon,
    hideIcon = false,
    className,
    children,
    ...rest
  } = props;

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'ui-alert',
        `ui-alert-status-${status}`,
        `ui-alert-variant-${variant}`,
        className
      )}
      {...rest}
    >
      {!hideIcon && <span className="ui-alert-icon">{icon ?? ICONS[status]}</span>}
      <div className="ui-alert-content">
        {title && <div className="ui-alert-title">{title}</div>}
        {children && <div className="ui-alert-description">{children}</div>}
      </div>
    </div>
  );
});
