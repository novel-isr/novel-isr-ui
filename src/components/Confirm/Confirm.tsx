/**
 * ConfirmDialog —— 二次确认弹窗，替代 window.confirm()。
 *
 * 命令式（推荐，最简）：
 *   const confirmed = await confirm({ title: '删除', description: '...' });
 *   if (confirmed) { ... }
 *
 * 声明式（受控，多用于自定义内容）：
 *   <ConfirmDialog
 *     isOpen={open}
 *     onClose={() => setOpen(false)}
 *     onConfirm={handleDelete}
 *     title="确定要删除？"
 *     description="此操作不可撤销"
 *     intent="danger"
 *   />
 *
 * 设计取舍：
 *   - 复用 Modal 而非自实现 Dialog —— 行为/样式自然继承
 *   - intent=danger 时确认按钮红色，跟 Button intent prop 对齐
 *   - 命令式 API 渲染到 body 一个全局 portal slot，Provider 自动挂载
 *   - 不支持「输入特定文本才允许确认」高危模式（admin 场景没必要，超出后再加）
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
import { Modal, ModalBody, ModalFooter } from '../Modal/Modal';
import { Button } from '../Button/Button';

export type ConfirmIntent = 'primary' | 'danger' | 'warning';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: ReactNode;
  description?: ReactNode;
  /** 确认按钮文案，默认「确定」；danger intent 默认「删除」 */
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  /** 默认 primary；危险操作给 danger（红色按钮） */
  intent?: ConfirmIntent;
  /** 确认按钮 loading 态（外部控制，比如 onConfirm 是 async 时由父级管） */
  isConfirming?: boolean;
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  const {
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel,
    cancelLabel = '取消',
    intent = 'primary',
    isConfirming = false,
  } = props;

  const defaultConfirmLabel = intent === 'danger' ? '删除' : '确定';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={description} size="sm">
      <ModalBody>{/* description 已在头部，body 留空时 Modal 看起来还是有头有脚 */}</ModalBody>
      <ModalFooter>
        <Button variant="ghost" intent="neutral" onClick={onClose} disabled={isConfirming}>
          {cancelLabel}
        </Button>
        <Button
          intent={intent}
          onClick={onConfirm}
          isLoading={isConfirming}
        >
          {confirmLabel ?? defaultConfirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ─── Imperative API ─────────────────────────────────────────────────────

interface ConfirmRequest {
  id: number;
  options: Omit<ConfirmDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>;
  resolve: (value: boolean) => void;
}

interface ConfirmContextValue {
  request: (
    options: Omit<ConfirmDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>,
  ) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

/** Hook：业务侧用 const confirm = useConfirm(); await confirm({...}) */
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error(
      '[@novel-isr/ui] useConfirm() requires <ConfirmProvider> at the app root',
    );
  }
  return ctx.request;
}

/**
 * 全局命令式 confirm —— 不在 Provider 内调用时退化到 window.confirm（兜底，
 * 但开发环境会报警提示加 Provider）。
 */
export async function confirm(
  options: Omit<ConfirmDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>,
): Promise<boolean> {
  if (globalRequest) return globalRequest(options);
  if (
    typeof window !== 'undefined' &&
    typeof globalThis !== 'undefined' &&
    !(globalThis as { __PROD__?: boolean }).__PROD__
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      '[@novel-isr/ui] confirm() called outside <ConfirmProvider>. Falling back to window.confirm.',
    );
  }
  if (typeof window !== 'undefined') {
    const t = typeof options.title === 'string' ? options.title : '';
    const d = typeof options.description === 'string' ? options.description : '';
    return window.confirm([t, d].filter(Boolean).join('\n\n'));
  }
  return false;
}

/* 模块级单例 —— Provider 挂载时把 request 函数写进去，命令式 confirm 调用它。 */
let globalRequest:
  | ((opts: Omit<ConfirmDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>) => Promise<boolean>)
  | null = null;

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<ConfirmRequest[]>([]);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const idRef = useMemo(() => ({ current: 0 }), []);

  const request = useCallback<ConfirmContextValue['request']>(
    (options) =>
      new Promise<boolean>((resolve) => {
        const id = ++idRef.current;
        setRequests((prev) => [...prev, { id, options, resolve }]);
      }),
    [idRef],
  );

  useEffect(() => {
    globalRequest = request;
    return () => {
      globalRequest = null;
    };
  }, [request]);

  const top = requests[0];

  const close = (value: boolean) => {
    if (!top) return;
    top.resolve(value);
    setRequests((prev) => prev.slice(1));
    setConfirmingId(null);
  };

  const handleConfirm = async () => {
    if (!top) return;
    setConfirmingId(top.id);
    close(true);
  };

  return (
    <ConfirmContext.Provider value={{ request }}>
      {children}
      {top && (
        <ConfirmDialog
          {...top.options}
          isOpen
          onClose={() => close(false)}
          onConfirm={handleConfirm}
          isConfirming={confirmingId === top.id}
        />
      )}
    </ConfirmContext.Provider>
  );
}
