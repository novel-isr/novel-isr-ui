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
// theme-utils（cookie 名 / 类型 / 纯函数）走独立 sub-entry：@novel-isr/ui/theme-utils
// 不放主入口的原因：主入口被 'use client' banner 染色，server component import 主入口的
// 纯函数会被当成 client reference，运行时报 "client reference called on server"。
// 业界标准做法（Radix UI / Vercel SDK）：server-safe utility 单独 sub-entry，no banner。
export * from './components/ThemeToggle';
export * from './components/PaletteToggle';

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
