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
  // 用户「主动折叠」的分支。补这一格状态是因为：当 activeId 落在某个分支
  // 子节点上时，ancestorActive 会强制展开（这是初次进入该路由的合理默认）。
  // 但如果用户随后**点击折叠**这个分支，必须有地方记下这个意图，
  // 否则下一次重渲会被 ancestorActive 自动撤销，看起来像「按钮失灵」。
  // 行业惯例（VS Code / Storybook / Linear 等）都是这种 tri-state 处理。
  const [explicitlyCollapsed, setExplicitlyCollapsed] = useState<Set<string>>(
    () => new Set(),
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

  const isItemExpanded = (id: string, hasAncestorActive: boolean): boolean => {
    if (explicitlyCollapsed.has(id)) return false;
    if (expandedSet.has(id)) return true;
    return hasAncestorActive;
  };

  const toggleItem = (item: NavTreeItem) => {
    const ancestor = activeAncestorIds.has(item.id);
    const currentlyExpanded = isItemExpanded(item.id, ancestor);
    const nextExpanded = new Set(expandedSet);
    const nextCollapsed = new Set(explicitlyCollapsed);
    if (currentlyExpanded) {
      // 折叠：从「明确展开」拿掉，写入「明确折叠」（覆盖 ancestor 自动展开）
      nextExpanded.delete(item.id);
      nextCollapsed.add(item.id);
    } else {
      // 展开：从「明确折叠」拿掉，写入「明确展开」
      nextExpanded.add(item.id);
      nextCollapsed.delete(item.id);
    }
    setExpanded(nextExpanded);
    setExplicitlyCollapsed(nextCollapsed);
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
                explicitlyCollapsed,
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
  /** 用户主动折叠的分支 id 集合；优先级高于 ancestor-active 自动展开 */
  explicitlyCollapsed: Set<string>;
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
    explicitlyCollapsed,
    onItemSelect,
    renderLink,
    toggleItem,
  } = options;
  const hasChildren = Boolean(item.children?.length);
  const active = item.id === activeId;
  const ancestorActive = activeAncestorIds.has(item.id);
  // 折叠优先级最高 —— 用户主动折叠会盖过 ancestor-active 的隐式展开。
  const expanded =
    hasChildren &&
    !explicitlyCollapsed.has(item.id) &&
    (expandedSet.has(item.id) || ancestorActive);
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
          {/* 单线条 chevron-down；rotate -90 折叠 / 0 展开 —— 与 VS Code、Linear、Notion 一致 */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
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
