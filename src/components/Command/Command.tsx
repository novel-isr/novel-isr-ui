import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';
import { Badge } from '../Badge/Badge';
import { Input } from '../Input/Input';
import { ModalContent, ModalHeader, ModalRoot } from '../Modal/Modal';

export interface CommandItem {
  id: string;
  title: string;
  description?: string;
  group?: string;
  keywords?: string;
  disabled?: boolean;
}

export interface CommandDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  onSelect: (item: CommandItem) => void;
  title?: ReactNode;
  /** a11y 描述，供屏幕阅读器说明这个命令面板的用途。 */
  description?: ReactNode;
  placeholder?: string;
  emptyText?: ReactNode;
  shortcutLabel?: ReactNode;
  /**
   * Global keyboard shortcut handled by the component itself.
   * Example: "mod+k" means Cmd+K on macOS and Ctrl+K elsewhere.
   */
  shortcut?: string | string[];
  maxResults?: number;
  className?: string;
}

export function CommandDialog(props: CommandDialogProps) {
  const {
    isOpen,
    onOpenChange,
    items,
    onSelect,
    title = '命令面板',
    description = '搜索并跳转到后台模块、配置页或操作入口。',
    placeholder = '搜索命令、路径或关键字',
    emptyText = '没有匹配结果',
    shortcutLabel,
    shortcut,
    maxResults = 12,
    className,
  } = props;
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const normalizedQuery = normalize(query);
    const filtered = normalizedQuery
      ? items.filter(item => normalize(commandSearchText(item)).includes(normalizedQuery))
      : items;
    return filtered.filter(item => !item.disabled).slice(0, maxResults);
  }, [items, maxResults, query]);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setActiveIndex(0);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!shortcut) return;
    const shortcuts = normalizeShortcuts(shortcut);
    if (shortcuts.length === 0) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!shortcuts.some(value => matchesShortcut(event, value))) return;
      event.preventDefault();
      event.stopPropagation();
      onOpenChange(true);
    };
    document.addEventListener('keydown', onKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [onOpenChange, shortcut]);

  const selectItem = (item: CommandItem) => {
    onSelect(item);
    onOpenChange(false);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(index => Math.min(index + 1, Math.max(results.length - 1, 0)));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(index => Math.max(index - 1, 0));
      return;
    }
    if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault();
      selectItem(results[activeIndex]);
    }
  };

  return (
    <ModalRoot open={isOpen} onOpenChange={onOpenChange}>
      <ModalContent
        className={cn('ui-command-dialog', className)}
        description={description}
        hideCloseButton
        size="lg"
      >
        <ModalHeader className="ui-command-header">
          <span>{title}</span>
          {shortcutLabel && <kbd>{shortcutLabel}</kbd>}
        </ModalHeader>
        <div className="ui-command-search">
          <Input
            ref={inputRef}
            size="md"
            prefix="⌕"
            suffix="Enter"
            value={query}
            placeholder={placeholder}
            role="combobox"
            aria-expanded={isOpen}
            aria-controls="ui-command-results"
            aria-activedescendant={results[activeIndex]?.id}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
          />
        </div>
        <div
          id="ui-command-results"
          className="ui-command-results"
          role="listbox"
          aria-label="命令结果"
        >
          {results.length === 0 ? (
            <div className="ui-command-empty">{emptyText}</div>
          ) : (
            results.map((item, index) => (
              <button
                id={item.id}
                key={item.id}
                className="ui-command-item"
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                data-active={index === activeIndex || undefined}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectItem(item)}
              >
                <span className="ui-command-item-copy">
                  <strong>{item.title}</strong>
                  {item.description && <small>{item.description}</small>}
                </span>
                {item.group && <Badge colorScheme="gray">{item.group}</Badge>}
              </button>
            ))
          )}
        </div>
      </ModalContent>
    </ModalRoot>
  );
}

function commandSearchText(item: CommandItem): string {
  return `${item.group ?? ''} ${item.title} ${item.description ?? ''} ${item.keywords ?? ''}`;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeShortcuts(shortcut: CommandDialogProps['shortcut']): string[] {
  const values = Array.isArray(shortcut) ? shortcut : [shortcut];
  return values.filter((value): value is string => typeof value === 'string' && value.trim() !== '');
}

export function matchesShortcut(
  event: Pick<
    globalThis.KeyboardEvent,
    'key' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'
  >,
  shortcut: unknown,
): boolean {
  if (typeof shortcut !== 'string') return false;
  const parts = shortcut
    .trim()
    .toLowerCase()
    .split('+')
    .map(part => part.trim())
    .filter(Boolean);
  const key = parts.at(-1);
  if (!key || String(event.key ?? '').toLowerCase() !== key) return false;
  const needsMod = parts.includes('mod');
  const needsCtrl = parts.includes('ctrl');
  const needsMeta = parts.includes('meta') || parts.includes('cmd');
  const needsShift = parts.includes('shift');
  const needsAlt = parts.includes('alt') || parts.includes('option');

  if (needsMod && !event.metaKey && !event.ctrlKey) return false;
  if (needsCtrl && !event.ctrlKey) return false;
  if (needsMeta && !event.metaKey) return false;
  if (needsShift && !event.shiftKey) return false;
  if (needsAlt && !event.altKey) return false;
  return true;
}
