import { forwardRef, useId, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export const Page = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Page(
  { className, ...props }, ref,
) {
  return <div ref={ref} className={cn('ui-page', className)} {...props} />;
});

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export const PageHeader = forwardRef<HTMLElement, PageHeaderProps>(function PageHeader(
  { title, description, actions, className, ...props }, ref,
) {
  return (
    <header ref={ref} className={cn('ui-page-header', className)} {...props}>
      <div className="ui-page-heading">
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="ui-page-actions">{actions}</div>}
    </header>
  );
});

export interface PageSectionProps extends PageHeaderProps {
  icon?: ReactNode;
}

export const PageSection = forwardRef<HTMLElement, PageSectionProps>(function PageSection(
  { title, description, actions, icon, children, className, ...props }, ref,
) {
  const headingId = useId();
  return (
    <section ref={ref} aria-labelledby={headingId} className={cn('ui-page-section', className)} {...props}>
      <div className="ui-page-section-header">
        <div className="ui-page-heading">
          <h2 id={headingId}>{icon && <span aria-hidden="true">{icon}</span>}{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {actions && <div className="ui-page-actions">{actions}</div>}
      </div>
      {children}
    </section>
  );
});

export const Toolbar = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Toolbar(
  { className, ...props }, ref,
) {
  // This is a wrapping form/action group, not an ARIA toolbar requiring roving focus.
  return <div ref={ref} role="group" className={cn('ui-toolbar', className)} {...props} />;
});

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  description?: ReactNode;
}

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(function StatCard(
  { label, value, icon, description, className, ...props }, ref,
) {
  return (
    <div ref={ref} className={cn('ui-stat-card', className)} {...props}>
      {icon && <span className="ui-stat-icon" aria-hidden="true">{icon}</span>}
      <div className="ui-stat-content">
        <dl><dt>{label}</dt><dd>{value}</dd></dl>
        {description != null && <p className="ui-stat-description">{description}</p>}
      </div>
    </div>
  );
});
