/**
 * Alert —— 信息提示横条。
 *
 *   <Alert status="success">已保存</Alert>
 *   <Alert status="danger" variant="solid" title="出错了">服务器返回 500</Alert>
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export type AlertStatus = 'info' | 'success' | 'warning' | 'danger';
export type AlertVariant = 'subtle' | 'solid' | 'outline';

const ICONS: Record<AlertStatus, ReactNode> = {
  info: <Info aria-hidden='true' />,
  success: <CheckCircle2 aria-hidden='true' />,
  warning: <AlertTriangle aria-hidden='true' />,
  danger: <XCircle aria-hidden='true' />,
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
