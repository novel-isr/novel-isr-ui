/**
 * Toast (Message) —— 临时消息提示。
 *
 * 用法 1：声明式 + provider
 *   <ToastProvider position="top-right">
 *     <App />
 *   </ToastProvider>
 *
 *   const toast = useToast();
 *   toast({ status: 'success', title: '已保存' });
 *   toast.success('已保存');                              // 快捷
 *
 * 用法 2（更顺手）：全局 sonner 风格
 *   import { toast } from '@novel-isr/ui';
 *   toast.success('Saved');
 *   toast.error('Failed', { description: '...', duration: 0 });
 *
 * 自实现，不用 Radix Toast（Radix Toast 强制每条 toast 是一个独立 React 子树，
 * 配合命令式 API 反而复杂）。
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';

export type ToastStatus = 'info' | 'success' | 'warning' | 'danger';
export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center';

export interface ToastOptions {
  id?: string | number;
  status?: ToastStatus;
  title?: ReactNode;
  description?: ReactNode;
  /** 自动关闭毫秒，0 = 不自动关闭 */
  duration?: number;
}

interface ToastItem extends Required<Pick<ToastOptions, 'status' | 'duration'>> {
  id: string | number;
  title?: ReactNode;
  description?: ReactNode;
  state: 'open' | 'closing';
}

const ICONS: Record<ToastStatus, ReactNode> = {
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

// ─── 全局 store（让命令式 API 在没 Provider 也能跑 + Provider 模式共享） ─────

type Listener = (toasts: ToastItem[]) => void;

class ToastStore {
  private toasts: ToastItem[] = [];
  private listeners = new Set<Listener>();
  private idCounter = 0;

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.toasts);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn(this.toasts);
  }

  push(opts: ToastOptions): string | number {
    const id = opts.id ?? ++this.idCounter;
    const toast: ToastItem = {
      id,
      status: opts.status ?? 'info',
      title: opts.title,
      description: opts.description,
      duration: opts.duration ?? 4000,
      state: 'open',
    };
    this.toasts = [...this.toasts, toast];
    this.emit();

    if (toast.duration > 0) {
      setTimeout(() => this.dismiss(id), toast.duration);
    }
    return id;
  }

  dismiss(id: string | number): void {
    this.toasts = this.toasts.map(t => (t.id === id ? { ...t, state: 'closing' } : t));
    this.emit();
    // 等动画结束再真删
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
      this.emit();
    }, 200);
  }
}

const store = new ToastStore();

// ─── 命令式 API ───────────────────────────────────────────────────────────

interface ToastFn {
  (opts: ToastOptions): string | number;
  info: (title: ReactNode, opts?: ToastOptions) => string | number;
  success: (title: ReactNode, opts?: ToastOptions) => string | number;
  warning: (title: ReactNode, opts?: ToastOptions) => string | number;
  error: (title: ReactNode, opts?: ToastOptions) => string | number;
  dismiss: (id: string | number) => void;
}

function createToastFn(): ToastFn {
  const fn: ToastFn = ((opts: ToastOptions) => store.push(opts)) as ToastFn;
  fn.info = (title, opts) => store.push({ ...opts, title, status: 'info' });
  fn.success = (title, opts) => store.push({ ...opts, title, status: 'success' });
  fn.warning = (title, opts) => store.push({ ...opts, title, status: 'warning' });
  fn.error = (title, opts) => store.push({ ...opts, title, status: 'danger' });
  fn.dismiss = id => store.dismiss(id);
  return fn;
}

export const toast = createToastFn();

// ─── React hook（同等能力）─────────────────────────────────────────────────

export function useToast(): ToastFn {
  return toast;
}

// ─── Provider —— 渲染 viewport ────────────────────────────────────────────

interface ToastContextValue {
  position: ToastPosition;
}

const ToastContext = createContext<ToastContextValue>({ position: 'top-right' });

export interface ToastProviderProps {
  position?: ToastPosition;
  children: ReactNode;
}

export function ToastProvider({ position = 'top-right', children }: ToastProviderProps) {
  return (
    <ToastContext.Provider value={{ position }}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  );
}

function ToastViewport() {
  const { position } = useContext(ToastContext);
  const [items, setItems] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return store.subscribe(setItems);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="ui-toast-viewport" data-position={position} role="region" aria-label="通知">
      {items.map(item => (
        <ToastItemComponent key={item.id} item={item} />
      ))}
    </div>,
    document.body
  );
}

function ToastItemComponent({ item }: { item: ToastItem }) {
  return (
    <div
      className={cn('ui-toast', `ui-toast-status-${item.status}`)}
      data-state={item.state === 'closing' ? 'closing' : 'open'}
      role={item.status === 'danger' ? 'alert' : 'status'}
    >
      <span className="ui-toast-icon">{ICONS[item.status]}</span>
      <div className="ui-toast-content">
        {item.title && <div className="ui-toast-title">{item.title}</div>}
        {item.description && <div className="ui-toast-description">{item.description}</div>}
      </div>
      <button
        type="button"
        className="ui-toast-close"
        aria-label="关闭"
        onClick={() => store.dismiss(item.id)}
      >
        ×
      </button>
    </div>
  );
}

// 占位避免 unused import 报错
void useMemo;
void useCallback;
