import * as Dropdown from '@radix-ui/react-dropdown-menu';
import * as Context from '@radix-ui/react-context-menu';
import { ChevronRight } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface MenuAction {
  key: string;
  label: ReactNode;
  textValue?: string;
  icon?: ReactNode;
  shortcut?: string;
  disabled?: boolean;
  children?: MenuEntry[];
}
export type MenuEntry = MenuAction
  | { type: 'separator'; key: string }
  | { type: 'group'; key: string; label: ReactNode; items: MenuEntry[] };

export interface MenuProps {
  children: ReactElement;
  items: MenuEntry[];
  onSelect?: (item: MenuAction) => void;
  size?: 'sm' | 'md';
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function MenuItems({ items, onSelect, context = false, size = 'md' }: {
  items: MenuEntry[];
  onSelect?: (item: MenuAction) => void;
  context?: boolean;
  size?: 'sm' | 'md';
}) {
  const P = context ? Context : Dropdown;
  return <>{items.map(item => {
    if ('type' in item) {
      if (item.type === 'separator') return <P.Separator key={item.key} className="ui-menu-separator" />;
      return <P.Group key={item.key}>
        <P.Label className="ui-menu-label">{item.label}</P.Label>
        <MenuItems items={item.items} onSelect={onSelect} context={context} size={size} />
      </P.Group>;
    }
    const content = <>
      {item.icon && <span className="ui-menu-icon" aria-hidden="true">{item.icon}</span>}
      <span className="ui-menu-text">{item.label}</span>
      {item.shortcut && <span className="ui-menu-shortcut">{item.shortcut}</span>}
    </>;
    if (item.children?.length) return <P.Sub key={item.key}>
      <P.SubTrigger className="ui-menu-item" disabled={item.disabled} textValue={item.textValue}>
        {content}<ChevronRight className="ui-menu-chevron" size={16} aria-hidden="true" />
      </P.SubTrigger>
      <P.Portal><P.SubContent className={cn('ui-menu-content', `ui-menu-size-${size}`)} collisionPadding={8} sideOffset={4}>
        <MenuItems items={item.children} onSelect={onSelect} context={context} size={size} />
      </P.SubContent></P.Portal>
    </P.Sub>;
    return <P.Item key={item.key} className="ui-menu-item" disabled={item.disabled}
      textValue={item.textValue} onSelect={() => onSelect?.(item)}>{content}</P.Item>;
  })}</>;
}

export function Menu({ children, items, onSelect, size = 'md', align = 'end', side = 'bottom', open, onOpenChange }: MenuProps) {
  return <Dropdown.Root open={open} onOpenChange={onOpenChange}>
    <Dropdown.Trigger asChild>{children}</Dropdown.Trigger>
    <Dropdown.Portal><Dropdown.Content className={cn('ui-menu-content', `ui-menu-size-${size}`)}
      align={align} side={side} sideOffset={6} collisionPadding={8}>
      <MenuItems items={items} onSelect={onSelect} size={size} />
    </Dropdown.Content></Dropdown.Portal>
  </Dropdown.Root>;
}

export type ContextMenuProps = Omit<MenuProps, 'open' | 'align' | 'side'>;

export function ContextMenu({ children, items, onSelect, size = 'md', onOpenChange }: ContextMenuProps) {
  return <Context.Root onOpenChange={onOpenChange}>
    <Context.Trigger asChild>{children}</Context.Trigger>
    <Context.Portal><Context.Content className={cn('ui-menu-content', `ui-menu-size-${size}`)} collisionPadding={8}>
      <MenuItems items={items} onSelect={onSelect} context size={size} />
    </Context.Content></Context.Portal>
  </Context.Root>;
}
