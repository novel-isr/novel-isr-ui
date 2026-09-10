/** @vitest-environment jsdom */
import { act, createRef } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { compile } from 'sass'
import { Card, Divider, Toolbar } from '../../index'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const css = compile('src/styles/index.scss').css
let container: HTMLDivElement
let root: ReturnType<typeof createRoot>

beforeEach(() => {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

it('keeps the default div group and its children without adding keyboard navigation', () => {
  act(() => root.render(<Toolbar><button>First</button><button>Second</button></Toolbar>))
  const toolbar = container.firstElementChild!
  expect(toolbar.tagName).toBe('DIV')
  expect(toolbar.getAttribute('role')).toBe('group')
  expect(toolbar.className).toBe('ui-toolbar')
  expect(toolbar.hasAttribute('tabindex')).toBe(false)
  const first = toolbar.querySelector('button')!
  expect(Array.from(toolbar.querySelectorAll('button'), button => button.tabIndex)).toEqual([0, 0])
  act(() => {
    first.focus()
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
  })
  expect(document.activeElement).toBe(first)
})

it.each([
  ['default', true, ['ui-toolbar']],
  ['default', false, ['ui-toolbar', 'ui-toolbar-nowrap']],
  ['compact', true, ['ui-toolbar', 'ui-toolbar-compact']],
  ['compact', false, ['ui-toolbar', 'ui-toolbar-compact', 'ui-toolbar-nowrap']],
] as const)('supports density=%s and wrap=%s without leaking control props', (density, wrap, classes) => {
  act(() => root.render(<Toolbar density={density} wrap={wrap} asChild={false}><span>Actions</span></Toolbar>))
  const toolbar = container.firstElementChild!
  expect(Array.from(toolbar.classList).sort()).toEqual([...classes].sort())
  expect(toolbar.textContent).toBe('Actions')
  expect(container.querySelector('[density], [wrap], [aschild]')).toBeNull()
})

it('forwards native attributes, role, class, style, events and the div ref', () => {
  const ref = createRef<HTMLDivElement>()
  const clicks: EventTarget[] = []
  act(() => root.render(<Toolbar ref={ref} id="actions" role="toolbar" aria-label="Formatting"
    data-owner="editor" title="Actions" className="consumer" style={{ gap: 10, maxWidth: 480 }}
    onClick={event => clicks.push(event.currentTarget)}><button>Action</button></Toolbar>))
  const toolbar = ref.current!
  expect(toolbar).toBeInstanceOf(HTMLDivElement)
  expect(toolbar).toBe(container.firstElementChild)
  expect(toolbar.id).toBe('actions')
  expect(toolbar.getAttribute('role')).toBe('toolbar')
  expect(toolbar.getAttribute('aria-label')).toBe('Formatting')
  expect(toolbar.dataset.owner).toBe('editor')
  expect(toolbar.title).toBe('Actions')
  expect(toolbar.classList.contains('consumer')).toBe(true)
  expect(toolbar.style.gap).toBe('10px')
  expect(toolbar.style.maxWidth).toBe('480px')
  act(() => toolbar.querySelector('button')!.click())
  expect(clicks).toEqual([toolbar])
  act(() => root.render(null))
  expect(ref.current).toBeNull()
})

it('slots an elevated Card into one element and preserves child props, both refs and handlers', () => {
  const toolbarRef = createRef<HTMLDivElement>()
  const cardRef = createRef<HTMLElement>()
  const clicks: string[] = []
  act(() => root.render(<Toolbar density="compact" wrap={false} asChild ref={toolbarRef}
    id="parent-id" role="group" aria-label="Parent label" className="parent-class" data-parent="kept"
    style={{ margin: 8, padding: 12 }} onClick={event => {
      expect(event.currentTarget).toBe(toolbarRef.current)
      clicks.push(`parent:${event.defaultPrevented}`)
    }}>
    <Card padding="none" variant="elevated" ref={cardRef} id="card-id" role="toolbar"
      aria-label="Formatting" className="child-class" data-child="kept" style={{ padding: 4 }}
      onClick={event => { clicks.push('child'); event.preventDefault() }}>
      <button>Bold</button><Divider orientation="vertical" />
    </Card>
  </Toolbar>))
  const card = cardRef.current!
  expect(container.childElementCount).toBe(1)
  expect(card).toBe(container.firstElementChild)
  expect(toolbarRef.current).toBe(card)
  expect(card.children).toHaveLength(2)
  expect(card.querySelector('.ui-card, .ui-toolbar')).toBeNull()
  for (const name of ['ui-toolbar', 'ui-toolbar-compact', 'ui-toolbar-nowrap', 'ui-card',
    'ui-card-padding-none', 'ui-card-variant-elevated', 'parent-class', 'child-class']) {
    expect(card.classList.contains(name)).toBe(true)
  }
  expect(card.id).toBe('card-id')
  expect(card.getAttribute('role')).toBe('toolbar')
  expect(card.getAttribute('aria-label')).toBe('Formatting')
  expect(card.dataset.parent).toBe('kept')
  expect(card.dataset.child).toBe('kept')
  expect(card.style.margin).toBe('8px')
  expect(card.style.padding).toBe('4px')
  expect(container.querySelector('[density], [wrap], [aschild], [padding], [variant]')).toBeNull()
  act(() => card.querySelector('button')!.click())
  expect(clicks).toEqual(['child', 'parent:true'])
  act(() => root.render(null))
  expect(toolbarRef.current).toBeNull()
  expect(cardRef.current).toBeNull()
})

it('supplies the default group role to a slotted Card without an explicit role', () => {
  act(() => root.render(<Toolbar asChild><Card padding="none" variant="elevated">Actions</Card></Toolbar>))
  const card = container.firstElementChild!
  expect(card.classList.contains('ui-card')).toBe(true)
  expect(card.classList.contains('ui-toolbar')).toBe(true)
  expect(card.getAttribute('role')).toBe('group')
  expect(card.textContent).toBe('Actions')
  expect(container.childElementCount).toBe(1)
})

it('ships compact gap and direct-child vertical divider sizing through the shared stylesheet', () => {
  const compact = css.match(/\.ui-toolbar-compact\s*\{([^}]*)\}/)?.[1]
  expect(compact).toContain('gap: var(--ui-space-1);')
  const divider = css.match(/\.ui-toolbar-compact > \.ui-divider-vertical\s*\{([^}]*)\}/)?.[1]
  expect(divider).toContain('height: var(--ui-space-5);')
  expect(divider).toContain('align-self: center;')
  expect(divider).toContain('flex: 0 0 auto;')
  expect(css.match(/\.ui-toolbar-compact \.ui-divider-vertical\s*\{/)).toBeNull()
})

it('retains the default toolbar, nowrap, input/select sizing and standalone divider contracts', () => {
  const toolbar = css.match(/\.ui-toolbar\s*\{([^}]*)\}/)?.[1]
  for (const value of ['display: flex;', 'align-items: center;', 'flex-wrap: wrap;',
    'gap: var(--ui-space-3);', 'min-width: 0;', 'max-width: 100%;']) expect(toolbar).toContain(value)
  expect(css.match(/\.ui-toolbar-nowrap\s*\{([^}]*)\}/)?.[1]).toContain('flex-wrap: nowrap;')
  expect(css.match(/\.ui-toolbar > \.ui-input-root\s*\{([^}]*)\}/)?.[1]).toContain('flex: 1 1 16rem;')
  expect(css.match(/\.ui-toolbar > \.ui-select-trigger\s*\{([^}]*)\}/)?.[1]).toContain('flex: 0 1 12rem;')
  expect(css.match(/\.ui-toolbar-nowrap > \.ui-select-trigger\s*\{([^}]*)\}/)?.[1]).toContain('width: 12rem;')
  const divider = css.match(/\.ui-divider-vertical\s*\{([^}]*)\}/)?.[1]
  expect(divider).toContain('height: 100%;')
  expect(divider).toContain('align-self: stretch;')
})
