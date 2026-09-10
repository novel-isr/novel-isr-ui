/** @vitest-environment jsdom */
import { act, createRef } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { compile } from 'sass'
import { SplitLayout } from '../SplitLayout/SplitLayout'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
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

it('forwards native div attributes, styles, events and ref without leaking layout props', () => {
  const ref = createRef<HTMLDivElement>()
  const clicks: HTMLDivElement[] = []
  act(() => root.render(
    <SplitLayout ref={ref} id="editor" role="group" aria-label="Article editor"
      data-owner="article" title="Editor" tabIndex={-1} className="consumer"
      style={{ maxWidth: 960, padding: 8 }} aside={<button>Properties</button>}
      asideWidth={280} collapseBelow="lg" gap="20px"
      onClick={event => { clicks.push(event.currentTarget); event.preventDefault() }}>
      <button>Edit</button>
    </SplitLayout>,
  ))
  const layout = ref.current!
  expect(layout).toBeInstanceOf(HTMLDivElement)
  expect(layout).toBe(container.firstElementChild)
  expect(layout.id).toBe('editor')
  expect(layout.getAttribute('role')).toBe('group')
  expect(layout.getAttribute('aria-label')).toBe('Article editor')
  expect(layout.dataset.owner).toBe('article')
  expect(layout.title).toBe('Editor')
  expect(layout.tabIndex).toBe(-1)
  expect(layout.classList.contains('ui-split-layout')).toBe(true)
  expect(layout.classList.contains('consumer')).toBe(true)
  expect(layout.style.maxWidth).toBe('960px')
  expect(layout.style.padding).toBe('8px')
  expect(layout.style.getPropertyValue('--ui-split-layout-aside-width')).toBe('280px')
  expect(layout.style.getPropertyValue('--ui-split-layout-gap')).toBe('20px')
  expect(layout.firstElementChild?.classList.contains('ui-split-layout-grid--lg')).toBe(true)
  expect(container.querySelector('[aside], [asidewidth], [collapsebelow], [gap]')).toBeNull()
  const event = new MouseEvent('click', { bubbles: true, cancelable: true })
  act(() => { layout.querySelector('button')!.dispatchEvent(event) })
  expect(clicks).toEqual([layout])
  expect(event.defaultPrevented).toBe(true)
  act(() => root.render(null))
  expect(ref.current).toBeNull()
})

it('renders main before aside once and defaults to a 320px aside, md collapse and gap token 6', () => {
  act(() => root.render(
    <SplitLayout aside={<button>Properties</button>}><input aria-label="Title" /></SplitLayout>,
  ))
  const layout = container.firstElementChild as HTMLElement
  const grid = layout.firstElementChild!
  expect(grid.classList.contains('ui-split-layout-grid')).toBe(true)
  expect(grid.classList.contains('ui-split-layout-grid--md')).toBe(true)
  expect(grid.classList.contains('ui-split-layout-grid--has-aside')).toBe(true)
  expect(Array.from(grid.children, child => child.className))
    .toEqual(['ui-split-layout-main', 'ui-split-layout-aside'])
  expect(Array.from(layout.querySelectorAll('input, button'), node => node.tagName))
    .toEqual(['INPUT', 'BUTTON'])
  expect(layout.style.getPropertyValue('--ui-split-layout-aside-width')).toBe('320px')
  expect(layout.style.getPropertyValue('--ui-split-layout-gap')).toBe('var(--ui-space-6)')
})

it.each([null, undefined, false])('omits the aside and split columns when aside is %s', aside => {
  act(() => root.render(<SplitLayout aside={aside}>Main</SplitLayout>))
  const grid = container.querySelector('.ui-split-layout-grid')!
  expect(grid.children).toHaveLength(1)
  expect(grid.firstElementChild?.textContent).toBe('Main')
  expect(grid.classList.contains('ui-split-layout-grid--has-aside')).toBe(false)
  expect(container.querySelector('.ui-split-layout-aside')).toBeNull()
})

it('preserves zero as valid aside content', () => {
  act(() => root.render(<SplitLayout aside={0}>Main</SplitLayout>))
  expect(container.querySelector('.ui-split-layout-aside')?.textContent).toBe('0')
  expect(container.querySelector('.ui-split-layout-grid--has-aside')).not.toBeNull()
})

it.each([0, -1, NaN, Infinity, -Infinity])('rejects invalid asideWidth %s', asideWidth => {
  expect(() => renderToStaticMarkup(
    <SplitLayout aside="Properties" asideWidth={asideWidth}>Main</SplitLayout>,
  )).toThrow(RangeError)
})

it.each([0.5, 280, 10000])('accepts finite positive asideWidth %s for CSS sizing', asideWidth => {
  act(() => root.render(<SplitLayout aside="Properties" asideWidth={asideWidth}>Main</SplitLayout>))
  expect((container.firstElementChild as HTMLElement).style.getPropertyValue('--ui-split-layout-aside-width'))
    .toBe(`${asideWidth}px`)
})

it.each([
  [0, 'var(--ui-space-0)'],
  [4, 'var(--ui-space-4)'],
  ['2', 'var(--ui-space-2)'],
  [1.5, 'var(--ui-space-1-5)'],
  ['1.5', 'var(--ui-space-1-5)'],
  [2.5, 'var(--ui-space-2-5)'],
  ['2.5', 'var(--ui-space-2-5)'],
  ['24px', '24px'],
  ['var(--custom-gap)', 'var(--custom-gap)'],
] as const)('resolves gap %s using the existing spacing convention', (gap, expected) => {
  act(() => root.render(<SplitLayout aside="Properties" gap={gap}>Main</SplitLayout>))
  expect((container.firstElementChild as HTMLElement).style.getPropertyValue('--ui-split-layout-gap'))
    .toBe(expected)
})

it.each([0.5, '0.5'])('resolves fractional gap %s to a usable length from compiled spacing tokens', gap => {
  const tokens = document.createElement('style')
  tokens.textContent = compile('src/styles/tokens.scss').css
  document.head.append(tokens)
  try {
    act(() => root.render(<SplitLayout aside="Properties" gap={gap}>Main</SplitLayout>))
    const reference = (container.firstElementChild as HTMLElement).style.getPropertyValue('--ui-split-layout-gap')
    const variable = /^var\((.+)\)$/.exec(reference)?.[1]
    expect(variable).toBeDefined()
    const length = getComputedStyle(document.documentElement).getPropertyValue(variable!).trim()
    expect(length).toBe('0.125rem')
    expect(variable).toMatch(/^--[a-z0-9-]+$/)
    const declaration = document.createElement('div').style
    declaration.setProperty('gap', length)
    expect(declaration.getPropertyValue('gap')).toBe('0.125rem')
  } finally {
    tokens.remove()
  }
})

it('resets nested layout defaults independently of the outer width, gap and breakpoint', () => {
  act(() => root.render(
    <SplitLayout id="outer" aside="Outer properties" asideWidth={480} gap={2} collapseBelow="lg">
      <SplitLayout id="inner" aside="Inner properties">Inner main</SplitLayout>
    </SplitLayout>,
  ))
  const outer = container.querySelector<HTMLElement>('#outer')!
  const inner = container.querySelector<HTMLElement>('#inner')!
  expect(inner.closest('.ui-split-layout-main')?.parentElement).toBe(outer.firstElementChild)
  expect(inner.style.getPropertyValue('--ui-split-layout-aside-width')).toBe('320px')
  expect(inner.style.getPropertyValue('--ui-split-layout-gap')).toBe('var(--ui-space-6)')
  expect(inner.firstElementChild?.classList.contains('ui-split-layout-grid--md')).toBe(true)
  expect(inner.firstElementChild?.classList.contains('ui-split-layout-grid--lg')).toBe(false)
  expect(outer.firstElementChild?.classList.contains('ui-split-layout-grid--lg')).toBe(true)
})

it('preserves main input state when the aside is removed, restored or reconfigured', () => {
  act(() => root.render(
    <SplitLayout aside={<input aria-label="Property" />}><input defaultValue="Draft" /></SplitLayout>,
  ))
  const main = container.querySelector('input')!
  main.value = 'Unsaved title'
  for (const aside of [null, <input key="property" aria-label="Property" />]) {
    act(() => root.render(
      <SplitLayout aside={aside} asideWidth={400} collapseBelow="lg" gap={3}>
        <input defaultValue="Draft" />
      </SplitLayout>,
    ))
    expect(container.querySelector('input')).toBe(main)
    expect(main.value).toBe('Unsaved title')
  }
})
