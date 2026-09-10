/** @vitest-environment happy-dom */
import { act, createRef, type ComponentProps, type LiHTMLAttributes, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { compile } from 'sass';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import * as UI from '../../index';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let style: HTMLStyleElement | undefined;
let css: string | undefined;

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  style?.remove();
  style = undefined;
});

function requireList() {
  expect(UI).toHaveProperty('List');
  expect(UI).toHaveProperty('ListItem');
}

function mountStyled(children: ReactNode) {
  css ??= compile('src/styles/index.scss', { style: 'compressed' }).css;
  style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  act(() => root.render(children));
}

describe('List public contract', () => {
  it('exports List, ListItem and native typed props with required primary', () => {
    requireList();
    expectTypeOf<ComponentProps<typeof UI.List>>().toMatchTypeOf<UI.ListProps>();
    expectTypeOf<ComponentProps<typeof UI.ListItem>>().toMatchTypeOf<UI.ListItemProps>();
    expectTypeOf<UI.ListProps['density']>().toEqualTypeOf<'default' | 'compact' | undefined>();
    expectTypeOf<UI.ListItemProps['primary']>().toEqualTypeOf<ReactNode>();
    expectTypeOf<UI.ListItemProps['value']>().toEqualTypeOf<LiHTMLAttributes<HTMLLIElement>['value']>();
    // @ts-expect-error ListItem requires a primary slot.
    const missingPrimary: UI.ListItemProps = {};
    void missingPrimary;
  });

  it('server-renders an accessible ul with direct native li children and named slots', () => {
    requireList();
    container.innerHTML = renderToStaticMarkup(
      <UI.List aria-label="Recent changes">
        <UI.ListItem primary={<strong>Record title</strong>} secondary={<code>Metadata</code>}
          icon={<svg aria-label="Decorative marker" />} actions={<button type="button">Edit</button>} />
        <UI.ListItem primary="Second record" />
      </UI.List>,
    );
    const list = container.querySelector('ul')!;
    expect(list.getAttribute('role')).toBe('list');
    expect(list.getAttribute('aria-label')).toBe('Recent changes');
    expect(Array.from(list.children, child => child.tagName)).toEqual(['LI', 'LI']);
    expect(list.querySelector('.ui-list-item-primary strong')?.textContent).toBe('Record title');
    expect(list.querySelector('.ui-list-item-secondary code')?.textContent).toBe('Metadata');
    expect(list.querySelector('.ui-list-item-icon')?.getAttribute('aria-hidden')).toBe('true');
    expect(list.querySelector('.ui-list-item-actions button')?.textContent).toBe('Edit');
    expect(list.querySelector('li')?.getAttribute('role')).toBeNull();
    expect(list.querySelector('li')?.hasAttribute('tabindex')).toBe(false);
    expect(list.querySelector('[aria-selected], [aria-pressed]')).toBeNull();
  });

  it('renders zero in both text slots, omits absent slots, and escapes strings', () => {
    requireList();
    const unsafe = '<img src=x onerror=alert(1)>';
    container.innerHTML = renderToStaticMarkup(<UI.List>
      <UI.ListItem primary={0} secondary={0} />
      <UI.ListItem primary={unsafe} secondary={unsafe} />
      <UI.ListItem primary="Plain" />
    </UI.List>);
    const rows = container.querySelectorAll('li');
    expect(rows[0]?.querySelector('.ui-list-item-primary')?.textContent).toBe('0');
    expect(rows[0]?.querySelector('.ui-list-item-secondary')?.textContent).toBe('0');
    expect(rows[1]?.querySelector('.ui-list-item-primary')?.textContent).toBe(unsafe);
    expect(rows[1]?.querySelector('.ui-list-item-secondary')?.textContent).toBe(unsafe);
    expect(container.querySelector('img')).toBeNull();
    expect(rows[2]?.querySelector('.ui-list-item-secondary')).toBeNull();
    expect(container.querySelector('.ui-list-item-icon, .ui-list-item-actions')).toBeNull();
  });

  it('forwards native attributes, class names, styles, events and DOM refs', () => {
    requireList();
    const listRef = createRef<HTMLUListElement>();
    const itemRef = createRef<HTMLLIElement>();
    const listClick = vi.fn();
    const itemClick = vi.fn();
    act(() => root.render(<UI.List ref={listRef} id="records" className="consumer-list"
      title="Records" style={{ maxWidth: 320 }} onClick={listClick} data-source="consumer">
      <UI.ListItem ref={itemRef} primary="Record" value={7} className="consumer-item"
        aria-label="Named record" style={{ marginTop: 2 }} onClick={itemClick} />
    </UI.List>));
    const list = container.querySelector('ul')!;
    const item = list.querySelector('li')!;
    expect(listRef.current).toBe(list);
    expect(itemRef.current).toBe(item);
    expect(list.id).toBe('records');
    expect(list.title).toBe('Records');
    expect(list.dataset.source).toBe('consumer');
    expect(list.classList.contains('consumer-list')).toBe(true);
    expect(list.style.maxWidth).toBe('320px');
    expect(item.value).toBe(7);
    expect(item.classList.contains('consumer-item')).toBe(true);
    expect(item.getAttribute('aria-label')).toBe('Named record');
    expect(item.style.marginTop).toBe('2px');
    act(() => item.click());
    expect(itemClick).toHaveBeenCalledOnce();
    expect(listClick).toHaveBeenCalledOnce();
    act(() => root.render(null));
    expect(listRef.current).toBeNull();
    expect(itemRef.current).toBeNull();
  });

  it('does not reserve slots for conditional false, boolean or empty-string content', () => {
    requireList();
    container.innerHTML = renderToStaticMarkup(<UI.List>
      <UI.ListItem primary="One" secondary={false} icon={false} actions={false} />
      <UI.ListItem primary="Two" secondary={true} icon="" actions="" />
    </UI.List>);
    expect(container.querySelector('.ui-list-item-secondary, .ui-list-item-icon, .ui-list-item-actions')).toBeNull();
  });

  it('leaves commands and disabled behavior with supplied buttons', () => {
    requireList();
    const edit = vi.fn();
    const remove = vi.fn();
    act(() => root.render(<UI.List><UI.ListItem primary="Record" actions={<>
      <button type="button" onClick={edit}>Edit</button>
      <button type="button" disabled onClick={remove}>Delete</button>
    </>} /></UI.List>));
    act(() => container.querySelector('li')!.click());
    expect(edit).not.toHaveBeenCalled();
    const buttons = container.querySelectorAll('button');
    act(() => { buttons[0]!.click(); buttons[1]!.click(); });
    expect(edit).toHaveBeenCalledOnce();
    expect(remove).not.toHaveBeenCalled();
    expect(buttons[1]?.disabled).toBe(true);
  });

  it('preserves caller-owned action names and descriptions pointing into primary content', () => {
    requireList();
    act(() => root.render(<UI.List aria-label="Registered devices">
      {['first', 'second'].map(id => <UI.ListItem key={id}
        primary={<span id={`device-${id}`}>{id}</span>}
        actions={<UI.IconButton label="Delete device" aria-describedby={`device-${id}`}>
          <svg aria-hidden="true" />
        </UI.IconButton>} />)}
    </UI.List>));
    expect(container.querySelector('ul')?.getAttribute('aria-label')).toBe('Registered devices');
    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(2);
    for (const [index, id] of ['first', 'second'].entries()) {
      const button = buttons[index]!;
      expect(button.getAttribute('aria-label')).toBe('Delete device');
      expect(button.getAttribute('aria-describedby')).toBe(`device-${id}`);
      const description = document.getElementById(button.getAttribute('aria-describedby')!);
      expect(description?.textContent).toBe(id);
      expect(description?.closest('.ui-list-item-content')).not.toBeNull();
    }
  });

  it('defaults to regular density and dividers and consumes explicit overrides', () => {
    requireList();
    container.innerHTML = renderToStaticMarkup(<UI.List><UI.ListItem primary="One" /></UI.List>);
    expect(container.querySelector('ul')?.classList.contains('ui-list-density-default')).toBe(true);
    expect(container.querySelector('ul')?.classList.contains('ui-list-dividers')).toBe(true);
    container.innerHTML = renderToStaticMarkup(<UI.List density="compact" dividers={false}>
      <UI.ListItem primary="One" />
    </UI.List>);
    const list = container.querySelector('ul')!;
    expect(list.classList.contains('ui-list-density-compact')).toBe(true);
    expect(list.classList.contains('ui-list-density-default')).toBe(false);
    expect(list.classList.contains('ui-list-dividers')).toBe(false);
    expect(list.hasAttribute('density')).toBe(false);
    expect(list.hasAttribute('dividers')).toBe(false);
  });
});

describe('List distributed styles', () => {
  it('resets list markers and uses the existing operational typography tokens', () => {
    requireList();
    mountStyled(<UI.List><UI.ListItem primary="Title" secondary="Metadata" /></UI.List>);
    const list = getComputedStyle(container.querySelector('ul')!);
    const primary = getComputedStyle(container.querySelector('.ui-list-item-primary')!);
    const secondary = getComputedStyle(container.querySelector('.ui-list-item-secondary')!);
    expect(list.listStyle).toBe('none');
    expect(list.margin).toBe('0px');
    expect(list.padding).toBe('0px');
    expect(primary.fontSize).toBe('14px');
    expect(primary.fontWeight).toBe('500');
    expect(primary.lineHeight).toBe('1.5');
    expect(secondary.fontSize).toBe('13px');
    expect(secondary.lineHeight).toBe('1.5');
    expect(secondary.color).not.toBe(primary.color);
  });

  it('reduces vertical spacing in compact lists and only divides sibling rows', () => {
    requireList();
    mountStyled(<>
      <UI.List id="default"><UI.ListItem primary="One" /><UI.ListItem primary="Two" /></UI.List>
      <UI.List id="compact" density="compact" dividers={false}>
        <UI.ListItem primary="One" /><UI.ListItem primary="Two" />
      </UI.List>
    </>);
    const rows = container.querySelectorAll('li');
    expect(getComputedStyle(rows[0]!).paddingTop).toBe('12px');
    // happy-dom exposes logical padding without mapping it onto paddingTop.
    expect(getComputedStyle(rows[2]!).getPropertyValue('padding-block')).toBe('0.5rem');
    expect(getComputedStyle(rows[0]!).borderTopWidth).not.toBe('1px');
    expect(getComputedStyle(rows[1]!).borderTopWidth).toBe('1px');
    expect(getComputedStyle(rows[3]!).borderTopWidth).not.toBe('1px');
  });

  it('gives each density a stable minimum row height without limiting content growth', () => {
    requireList();
    mountStyled(<>
      <UI.List><UI.ListItem primary="One" /></UI.List>
      <UI.List density="compact"><UI.ListItem primary="Two" /></UI.List>
    </>);
    const rows = container.querySelectorAll('li');
    expect(getComputedStyle(rows[0]!).minHeight).toMatch(/^(56px|3\.5rem)$/);
    expect(getComputedStyle(rows[1]!).minHeight).toMatch(/^(40px|2\.5rem)$/);
    for (const row of rows) {
      expect(getComputedStyle(row).height).toMatch(/^(auto)?$/);
      expect(getComputedStyle(row).maxHeight).toMatch(/^(none)?$/);
    }
  });

  it('wraps long shared Button labels inside trailing actions without ellipsis', () => {
    requireList();
    const label = 'Delete this registered device and its stored credentials';
    mountStyled(<UI.List style={{ width: 320 }}><UI.ListItem primary="Device"
      actions={<UI.Button variant="outline" intent="secondary">{label}</UI.Button>} />
    </UI.List>);
    const buttonLabel = container.querySelector('.ui-list-item-actions .ui-button-label')!;
    expect(buttonLabel.textContent).toBe(label);
    const labelStyle = getComputedStyle(buttonLabel);
    expect(labelStyle.whiteSpace).toBe('normal');
    expect(labelStyle.overflowWrap).toBe('anywhere');
    expect(labelStyle.overflow).toBe('visible');
    expect(labelStyle.textOverflow).toBe('clip');
    expect(labelStyle.minWidth).toBe('0');
  });

  it('allows long metadata to wrap and reserves bounded trailing action space', () => {
    requireList();
    mountStyled(<UI.List style={{ width: 320 }}><UI.ListItem primary={'record'.repeat(50)}
      secondary={'metadata'.repeat(100)} icon={<svg />} actions={<>
        <button type="button">Edit</button><button type="button">Delete</button>
      </>} /></UI.List>);
    const row = getComputedStyle(container.querySelector('li')!);
    expect(row.display).toBe('flex');
    expect(row.minWidth).toBe('0');
    for (const selector of ['.ui-list-item-content', '.ui-list-item-primary', '.ui-list-item-secondary']) {
      const text = getComputedStyle(container.querySelector(selector)!);
      expect(text.minWidth).toBe('0');
      expect(text.overflowWrap).toBe('anywhere');
    }
    const actions = getComputedStyle(container.querySelector('.ui-list-item-actions')!);
    expect(actions.flexShrink).toBe('0');
    expect(actions.flexWrap).toBe('wrap');
    expect(actions.maxWidth).toBe('50%');
    expect(actions.justifyContent).toBe('flex-end');
    expect(actions.overflow).not.toBe('hidden');
    const button = getComputedStyle(container.querySelector('button')!);
    expect(button.maxWidth).toBe('100%');
    expect(button.whiteSpace).toBe('normal');
    expect(button.overflowWrap).toBe('anywhere');
  });
});
