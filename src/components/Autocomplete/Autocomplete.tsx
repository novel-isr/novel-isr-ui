/**
 * Autocomplete —— 输入 + 下拉建议组件（参考 MUI Autocomplete / Headless UI Combobox）。
 *
 * 用法：
 *   const [q, setQ] = useState('');
 *   <Autocomplete
 *     value={q}
 *     onValueChange={setQ}
 *     options={[{ id: '1', label: '诡秘之主', hint: '爱潜水的乌贼' }]}
 *     onSelect={(opt) => navigate(`/books/${opt.id}`)}
 *     onSubmit={(text) => navigate(`/search?q=${text}`)}
 *     placeholder="搜书名 / 作者 / tag"
 *   />
 *
 * 行为：
 *   - 聚焦：打开下拉，无输入时显示传入的 options（业务侧可传"最近 / 最热"）
 *   - 输入：按 label / hint 子串过滤（不区分大小写）
 *   - ↑/↓：高亮下移/上移（循环）
 *   - Enter：在高亮项 → onSelect；无高亮 → onSubmit(value)
 *   - Esc / 失焦：关闭下拉
 *   - 鼠标点击选项 → onSelect
 *
 * 不内置异步加载状态（loading 由业务方传 + options 跟着空）—— 跟 Headless 思路一致，
 * 不假设数据来源。
 */
'use client';

import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';

export interface AutocompleteOption {
  /** 选项稳定 id —— 业务侧可用于跳转目标（如 bookId） */
  id: string;
  /** 主文案 */
  label: string;
  /** 副文案（如作者 / 描述） */
  hint?: string;
  /** 分组标签：相邻同 group 的项渲染在一起，组首插入分组标题 */
  group?: string;
}

export type AutocompleteSize = 'sm' | 'md' | 'lg';

export interface AutocompleteProps {
  /** 受控输入值 */
  value: string;
  /** 输入变化 */
  onValueChange: (value: string) => void;
  /** 完整选项集；组件内部按 value 过滤 */
  options: AutocompleteOption[];
  /** 选中某项时调用（点击 / 高亮 + Enter） */
  onSelect?: (option: AutocompleteOption) => void;
  /** 直接 Enter（无高亮项 / 选项为空）→ 提交搜索 */
  onSubmit?: (value: string) => void;
  placeholder?: string;
  size?: AutocompleteSize;
  /** 输入前缀图标 */
  prefix?: ReactNode;
  /** loading 时显示在底部 */
  loading?: boolean;
  /** 选项为空时显示的文案 */
  emptyText?: string;
  /** 透传给 input 的 aria-label —— 没有外层 FormControl 时必填 */
  'aria-label'?: string;
  /** 自定义类名挂在外层 root */
  className?: string;
  /** 关闭下拉的额外副作用 hook（业务侧可关 popover / 清埋点等） */
  onOpenChange?: (open: boolean) => void;
  /** name 透传给 input —— 表单提交场景 */
  name?: string;
  /** 禁用 */
  disabled?: boolean;
}

const SIZE_CLASS: Record<AutocompleteSize, string> = {
  sm: 'ui-input-size-sm',
  md: 'ui-input-size-md',
  lg: 'ui-input-size-lg',
};

function filterOptions(options: AutocompleteOption[], q: string): AutocompleteOption[] {
  const trimmed = q.trim().toLowerCase();
  if (!trimmed) return options;
  return options.filter((opt) => {
    if (opt.label.toLowerCase().includes(trimmed)) return true;
    if (opt.hint && opt.hint.toLowerCase().includes(trimmed)) return true;
    return false;
  });
}

export const Autocomplete = forwardRef<HTMLInputElement, AutocompleteProps>(
  function Autocomplete(props, ref) {
    const {
      value,
      onValueChange,
      options,
      onSelect,
      onSubmit,
      placeholder,
      size = 'md',
      prefix,
      loading = false,
      emptyText = '无匹配项',
      'aria-label': ariaLabel,
      className,
      onOpenChange,
      name,
      disabled = false,
    } = props;

    const [open, setOpen] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const listId = useId();

    const filtered = useMemo(() => filterOptions(options, value), [options, value]);

    const setOpenSafely = (next: boolean) => {
      setOpen(next);
      onOpenChange?.(next);
    };

    // 选项变了 → 重置高亮到 0
    useEffect(() => {
      setHighlight(0);
    }, [filtered.length, value]);

    // 失焦判定：document click 不在 rootRef 内 → 关闭
    useEffect(() => {
      if (!open) return;
      const onDocClick = (e: MouseEvent) => {
        if (!rootRef.current) return;
        if (!rootRef.current.contains(e.target as Node)) setOpenSafely(false);
      };
      document.addEventListener('mousedown', onDocClick);
      return () => document.removeEventListener('mousedown', onDocClick);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const selectAt = (index: number) => {
      const opt = filtered[index];
      if (!opt) return;
      onSelect?.(opt);
      setOpenSafely(false);
    };

    const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!open) setOpenSafely(true);
        if (filtered.length > 0) setHighlight((h) => (h + 1) % filtered.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!open) setOpenSafely(true);
        if (filtered.length > 0) setHighlight((h) => (h - 1 + filtered.length) % filtered.length);
        return;
      }
      if (e.key === 'Enter') {
        if (open && filtered.length > 0) {
          e.preventDefault();
          selectAt(highlight);
          return;
        }
        // 无下拉项 → 触发 submit（搜索文本）
        if (onSubmit && value.trim()) {
          e.preventDefault();
          onSubmit(value.trim());
          setOpenSafely(false);
        }
        return;
      }
      if (e.key === 'Escape') {
        if (open) {
          e.preventDefault();
          setOpenSafely(false);
        }
        return;
      }
    };

    return (
      <div
        ref={rootRef}
        className={cn('ui-autocomplete-root', className)}
        data-open={open || undefined}
      >
        <div
          className={cn('ui-input-root', 'ui-input-variant-outline', SIZE_CLASS[size])}
          data-disabled={disabled || undefined}
        >
          {prefix && <span className="ui-input-addon ui-input-addon-start">{prefix}</span>}
          <input
            ref={ref}
            className="ui-input-field"
            type="search"
            role="combobox"
            aria-label={ariaLabel}
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              open && filtered[highlight] ? `${listId}-${filtered[highlight].id}` : undefined
            }
            autoComplete="off"
            spellCheck={false}
            placeholder={placeholder}
            value={value}
            disabled={disabled}
            name={name}
            onChange={(e) => {
              onValueChange(e.target.value);
              if (!open) setOpenSafely(true);
            }}
            onFocus={() => setOpenSafely(true)}
            onKeyDown={handleKey}
          />
        </div>

        {open && (
          <ul
            id={listId}
            role="listbox"
            className="ui-autocomplete-list"
          >
            {filtered.length === 0 && !loading && (
              <li className="ui-autocomplete-empty" role="presentation">
                {emptyText}
              </li>
            )}
            {filtered.map((opt, index) => {
              const prev = index > 0 ? filtered[index - 1] : undefined;
              const showGroup = !!opt.group && opt.group !== prev?.group;
              return (
                <Option
                  key={opt.id}
                  id={`${listId}-${opt.id}`}
                  option={opt}
                  active={index === highlight}
                  showGroupHeader={showGroup}
                  onMouseDown={(e) => {
                    // mousedown 早于 input blur → 阻止 input 失焦关闭再开
                    e.preventDefault();
                    selectAt(index);
                  }}
                  onMouseEnter={() => setHighlight(index)}
                />
              );
            })}
            {loading && <li className="ui-autocomplete-loading">加载中…</li>}
          </ul>
        )}
      </div>
    );
  }
);

interface OptionProps {
  id: string;
  option: AutocompleteOption;
  active: boolean;
  showGroupHeader: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
}

function Option({ id, option, active, showGroupHeader, onMouseDown, onMouseEnter }: OptionProps) {
  return (
    <>
      {showGroupHeader && option.group && (
        <li className="ui-autocomplete-group" role="presentation">
          {option.group}
        </li>
      )}
      <li
        id={id}
        role="option"
        aria-selected={active}
        className="ui-autocomplete-item"
        data-active={active || undefined}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
      >
        <span className="ui-autocomplete-item-label">{option.label}</span>
        {option.hint && <span className="ui-autocomplete-item-hint">{option.hint}</span>}
      </li>
    </>
  );
}
