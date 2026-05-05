/**
 * @novel-isr/ui — 完整组件库
 *
 *   import '@novel-isr/ui/styles.css';                       // 一次性
 *   import { ThemeProvider, Button, toast, ... } from '@novel-isr/ui';
 *
 *   <ThemeProvider defaultTheme="system">
 *     <ToastProvider><App /></ToastProvider>
 *   </ThemeProvider>
 */

// ─── Provider / hooks ─────────────────────────────────────────────────
export { ThemeProvider, useTheme } from './components/ThemeProvider';
export type { Theme, ResolvedTheme } from './components/ThemeProvider';
export * from './components/ThemeToggle';

export { useDisclosure } from './hooks/useDisclosure';
export type { UseDisclosureProps, UseDisclosureReturn } from './hooks/useDisclosure';

// ─── 基础 ─────────────────────────────────────────────────────────────
export * from './components/Button';
export * from './components/Spinner';
export * from './components/Box';
export * from './components/Stack';
export * from './components/Divider';
export * from './components/Card';
export * from './components/Skeleton';
export * from './components/EmptyState';

// ─── 表单 ─────────────────────────────────────────────────────────────
export * from './components/FormControl';
export * from './components/Input';
export * from './components/NumberInput';
export * from './components/Textarea';
export * from './components/JsonField';
export * from './components/Checkbox';
export * from './components/Radio';
export * from './components/Switch';
export * from './components/Select';

// ─── 反馈 ─────────────────────────────────────────────────────────────
export * from './components/Alert';
export * from './components/Modal';
export * from './components/Confirm';
export * from './components/Drawer';
export * from './components/Command';
export * from './components/Tooltip';
export * from './components/Popover';
export * from './components/Toast';

// ─── 数据展示 ─────────────────────────────────────────────────────────
export * from './components/Avatar';
export * from './components/Badge';
export * from './components/Tag';
export * from './components/Table';
export * from './components/Rating';

// ─── 导航 ─────────────────────────────────────────────────────────────
export * from './components/NavTree';
export * from './components/Tabs';
export * from './components/Pagination';

// ─── utils ────────────────────────────────────────────────────────────
export { cn } from './utils/cn';
