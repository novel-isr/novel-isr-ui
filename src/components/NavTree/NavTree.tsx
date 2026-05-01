import {
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';

export interface NavTreeItem {
  id: string;
  label: string;
  description?: string;
  href?: string;
  icon?: ReactNode;
  disabled?: boolean;
  children?: NavTreeItem[];
}

export interface NavTreeSection {
  id: string;
  title?: string;
  items: NavTreeItem[];
}

export interface NavTreeItemState {
  active: boolean;
  ancestorActive: boolean;
  expanded: boolean;
  depth: number;
  collapsed: boolean;
  hasChildren: boolean;
  disabled: boolean;
  className: string;
}

export interface NavTreeProps {
  sections: NavTreeSection[];
  activeId?: string;
  collapsed?: boolean;
  defaultExpandedIds?: string[];
  expandedIds?: string[];
  onExpandedChange?: (expandedIds: string[]) => void;
  onItemSelect?: (item: NavTreeItem) => void;
  renderLink?: (
    item: NavTreeItem,
    content: ReactNode,
    state: NavTreeItemState,
  ) => ReactNode;
  className?: string;
  'aria-label'?: string;
}

export function NavTree(props: NavTreeProps) {
  const {
    sections,
    activeId,
    collapsed = false,
    defaultExpandedIds,
    expandedIds,
    onExpandedChange,
    onItemSelect,
    renderLink,
    className,
  } = props;
  const [uncontrolledExpandedIds, setUncontrolledExpandedIds] = useState(
    () => new Set(defaultExpandedIds ?? []),
  );

  const activeAncestorIds = useMemo(() => {
    const ids = new Set<string>();
    for (const section of sections) {
      collectActiveAncestors(section.items, activeId, ids);
    }
    return ids;
  }, [activeId, sections]);

  const expandedSet = useMemo(
    () => new Set(expandedIds ?? Array.from(uncontrolledExpandedIds)),
    [expandedIds, uncontrolledExpandedIds],
  );

  const setExpanded = (next: Set<string>) => {
    if (expandedIds === undefined) setUncontrolledExpandedIds(next);
    onExpandedChange?.(Array.from(next));
  };

  const toggleItem = (item: NavTreeItem) => {
    const next = new Set(expandedSet);
    if (next.has(item.id)) {
      next.delete(item.id);
    } else {
      next.add(item.id);
    }
    setExpanded(next);
  };

  return (
    <nav
      className={cn('ui-nav-tree', collapsed && 'ui-nav-tree-collapsed', className)}
      aria-label={props['aria-label'] ?? 'Navigation'}
      data-collapsed={collapsed || undefined}
    >
      {sections.map((section, sectionIndex) => (
        <section className="ui-nav-tree-section" key={section.id}>
          {section.title && (
            <h2 className="ui-nav-tree-section-title">{section.title}</h2>
          )}
          <div className="ui-nav-tree-list">
            {section.items.map(item =>
              renderItem({
                item,
                activeId,
                activeAncestorIds,
                collapsed,
                depth: 0,
                expandedSet,
                onItemSelect,
                renderLink,
                sectionIndex,
                toggleItem,
              }),
            )}
          </div>
        </section>
      ))}
    </nav>
  );
}

interface RenderItemOptions {
  item: NavTreeItem;
  activeId?: string;
  activeAncestorIds: Set<string>;
  collapsed: boolean;
  depth: number;
  expandedSet: Set<string>;
  sectionIndex: number;
  onItemSelect?: (item: NavTreeItem) => void;
  renderLink?: NavTreeProps['renderLink'];
  toggleItem: (item: NavTreeItem) => void;
}

function renderItem(options: RenderItemOptions): ReactNode {
  const {
    item,
    activeId,
    activeAncestorIds,
    collapsed,
    depth,
    expandedSet,
    onItemSelect,
    renderLink,
    toggleItem,
  } = options;
  const hasChildren = Boolean(item.children?.length);
  const active = item.id === activeId;
  const ancestorActive = activeAncestorIds.has(item.id);
  const expanded = hasChildren && (expandedSet.has(item.id) || ancestorActive);
  const className = cn(
    'ui-nav-tree-item',
    hasChildren ? 'ui-nav-tree-trigger' : 'ui-nav-tree-link',
    `ui-nav-tree-depth-${depth}`,
    active && 'ui-nav-tree-item-active',
    item.disabled && 'ui-nav-tree-item-disabled',
  );
  const state: NavTreeItemState = {
    active,
    ancestorActive,
    expanded,
    depth,
    collapsed,
    hasChildren,
    disabled: Boolean(item.disabled),
    className,
  };
  const title = item.description ? `${item.label} / ${item.description}` : item.label;
  const content = (
    <>
      <span className="ui-nav-tree-icon" aria-hidden="true">
        {item.icon}
      </span>
      <span className="ui-nav-tree-copy">
        <span className="ui-nav-tree-label">{item.label}</span>
        {item.description && (
          <small className="ui-nav-tree-description">{item.description}</small>
        )}
      </span>
      {hasChildren && !collapsed && (
        <span className="ui-nav-tree-chevron" aria-hidden="true">
          ▾
        </span>
      )}
    </>
  );

  if (hasChildren) {
    return (
      <div className="ui-nav-tree-branch" key={item.id}>
        <button
          className={className}
          type="button"
          title={title}
          aria-expanded={expanded}
          data-active={active || undefined}
          data-ancestor-active={ancestorActive || undefined}
          data-expanded={expanded || undefined}
          disabled={item.disabled}
          onClick={() => toggleItem(item)}
        >
          {content}
        </button>
        {expanded && !collapsed && (
          <div className="ui-nav-tree-children">
            {item.children?.map(child =>
              renderItem({
                ...options,
                item: child,
                depth: depth + 1,
              }),
            )}
          </div>
        )}
      </div>
    );
  }

  if (renderLink) {
    return renderLink(item, content, state);
  }

  return (
    <a
      className={className}
      href={item.href}
      key={item.id}
      title={title}
      aria-current={active ? 'page' : undefined}
      data-active={active || undefined}
      data-disabled={item.disabled || undefined}
      onClick={() => onItemSelect?.(item)}
    >
      {content}
    </a>
  );
}

function collectActiveAncestors(
  items: NavTreeItem[],
  activeId: string | undefined,
  ids: Set<string>,
): boolean {
  for (const item of items) {
    if (item.id === activeId) return true;
    if (item.children && collectActiveAncestors(item.children, activeId, ids)) {
      ids.add(item.id);
      return true;
    }
  }
  return false;
}
