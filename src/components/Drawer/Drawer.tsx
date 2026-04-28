/**
 * Drawer —— 侧边滑出面板。基于 Radix Dialog primitives。
 *
 *   <Drawer isOpen={...} onClose={...} side="right" title="筛选">
 *     <DrawerBody>...</DrawerBody>
 *     <DrawerFooter><Button>应用</Button></DrawerFooter>
 *   </Drawer>
 */

import * as RadixDialog from '@radix-ui/react-dialog';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export type DrawerSide = 'left' | 'right' | 'top' | 'bottom';
export type DrawerSize = 'sm' | 'md' | 'lg' | 'full';

export const DrawerRoot = RadixDialog.Root;
export const DrawerTrigger = RadixDialog.Trigger;
export const DrawerClose = RadixDialog.Close;

export interface DrawerContentProps extends Omit<RadixDialog.DialogContentProps, 'asChild'> {
  side?: DrawerSide;
  size?: DrawerSize;
  hideCloseButton?: boolean;
}

export const DrawerContent = forwardRef<HTMLDivElement, DrawerContentProps>(function DrawerContent(
  props,
  ref
) {
  const { side = 'right', size = 'md', hideCloseButton = false, className, children, ...rest } =
    props;
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="ui-drawer-overlay" />
      <RadixDialog.Content
        ref={ref}
        className={cn(
          'ui-drawer-content',
          `ui-drawer-side-${side}`,
          `ui-drawer-size-${size}`,
          className
        )}
        {...rest}
      >
        {children}
        {!hideCloseButton && (
          <RadixDialog.Close className="ui-drawer-close" aria-label="关闭">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </RadixDialog.Close>
        )}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
});

export const DrawerHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function DrawerHeader(props, ref) {
    const { className, children, ...rest } = props;
    return (
      <RadixDialog.Title asChild>
        <div ref={ref} className={cn('ui-drawer-header', className)} {...rest}>
          {children}
        </div>
      </RadixDialog.Title>
    );
  }
);

export const DrawerBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function DrawerBody(props, ref) {
    const { className, ...rest } = props;
    return <div ref={ref} className={cn('ui-drawer-body', className)} {...rest} />;
  }
);

export const DrawerFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function DrawerFooter(props, ref) {
    const { className, ...rest } = props;
    return <div ref={ref} className={cn('ui-drawer-footer', className)} {...rest} />;
  }
);

// ─── 简易 API ─────────────────────────────────────────────────────────────

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  side?: DrawerSide;
  size?: DrawerSize;
  title?: ReactNode;
  hideCloseButton?: boolean;
  children: ReactNode;
}

export function Drawer(props: DrawerProps) {
  const { isOpen, onClose, side, size, title, hideCloseButton, children } = props;
  return (
    <DrawerRoot open={isOpen} onOpenChange={open => !open && onClose()}>
      <DrawerContent side={side} size={size} hideCloseButton={hideCloseButton}>
        {title && <DrawerHeader>{title}</DrawerHeader>}
        {children}
      </DrawerContent>
    </DrawerRoot>
  );
}
