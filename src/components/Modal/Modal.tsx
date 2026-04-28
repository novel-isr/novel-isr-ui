/**
 * Modal —— 模态对话框，基于 Radix Dialog primitives。
 * focus trap / ESC / 点遮罩关闭 / a11y 全自动。
 *
 *   <Modal isOpen={isOpen} onClose={onClose} title="确认删除">
 *     <ModalBody>这条记录会被永久删除。</ModalBody>
 *     <ModalFooter>
 *       <Button variant="ghost" onClick={onClose}>取消</Button>
 *       <Button colorScheme="danger" onClick={confirm}>删除</Button>
 *     </ModalFooter>
 *   </Modal>
 *
 * 复杂自定义用 compound API：
 *   <ModalRoot open={...} onOpenChange={...}>
 *     <ModalTrigger asChild><Button>open</Button></ModalTrigger>
 *     <ModalContent>
 *       <ModalHeader>...</ModalHeader>
 *       <ModalBody>...</ModalBody>
 *       <ModalFooter>...</ModalFooter>
 *     </ModalContent>
 *   </ModalRoot>
 */

import * as RadixDialog from '@radix-ui/react-dialog';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

// ─── Compound parts ───────────────────────────────────────────────────────

export const ModalRoot = RadixDialog.Root;
export const ModalTrigger = RadixDialog.Trigger;
export const ModalClose = RadixDialog.Close;

export interface ModalContentProps extends Omit<RadixDialog.DialogContentProps, 'asChild'> {
  size?: ModalSize;
  /** 不渲染右上角 × 关闭按钮 */
  hideCloseButton?: boolean;
}

export const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(function ModalContent(
  props,
  ref
) {
  const { size = 'md', hideCloseButton = false, className, children, ...rest } = props;
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="ui-modal-overlay" />
      <RadixDialog.Content
        ref={ref}
        className={cn('ui-modal-content', `ui-modal-size-${size}`, className)}
        {...rest}
      >
        {children}
        {!hideCloseButton && (
          <RadixDialog.Close className="ui-modal-close" aria-label="关闭">
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

export interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {}
export const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(function ModalHeader(
  props,
  ref
) {
  const { className, children, ...rest } = props;
  return (
    <RadixDialog.Title asChild>
      <div ref={ref} className={cn('ui-modal-header', className)} {...rest}>
        {children}
      </div>
    </RadixDialog.Title>
  );
});

export interface ModalBodyProps extends HTMLAttributes<HTMLDivElement> {}
export const ModalBody = forwardRef<HTMLDivElement, ModalBodyProps>(function ModalBody(
  props,
  ref
) {
  const { className, ...rest } = props;
  return <div ref={ref} className={cn('ui-modal-body', className)} {...rest} />;
});

export interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {}
export const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(function ModalFooter(
  props,
  ref
) {
  const { className, ...rest } = props;
  return <div ref={ref} className={cn('ui-modal-footer', className)} {...rest} />;
});

// ─── 简易 API（推荐：覆盖 80% 场景）────────────────────────────────────────

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  size?: ModalSize;
  hideCloseButton?: boolean;
  children: ReactNode;
}

export function Modal(props: ModalProps) {
  const { isOpen, onClose, title, size, hideCloseButton, children } = props;
  return (
    <ModalRoot open={isOpen} onOpenChange={open => !open && onClose()}>
      <ModalContent size={size} hideCloseButton={hideCloseButton}>
        {title && <ModalHeader>{title}</ModalHeader>}
        {children}
      </ModalContent>
    </ModalRoot>
  );
}
