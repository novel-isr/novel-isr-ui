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
  placeholder?: string;
  emptyText?: ReactNode;
  shortcutLabel?: ReactNode;
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
    placeholder = '搜索命令、路径或关键字',
    emptyText = '没有匹配结果',
    shortcutLabel,
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
