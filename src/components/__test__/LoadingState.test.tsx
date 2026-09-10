/** @vitest-environment jsdom */
import { act, createRef } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { compile } from 'sass'
import * as UI from '../../index'

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

it('exports and renders the default visible label in one polite status region', () => {
  expect(UI).toHaveProperty('LoadingState')
  act(() => root.render(<UI.LoadingState />))
  const status = container.querySelector('[role="status"]')!
  expect(status.tagName).toBe('DIV')
  expect(status.getAttribute('aria-live')).toBe('polite')
  expect(status.getAttribute('aria-atomic')).toBe('true')
  expect(status.hasAttribute('aria-busy')).toBe(false)
  expect(status.classList.contains('ui-loading-state-size-default')).toBe(true)
  const label = status.querySelector<HTMLElement>('.ui-loading-state-label')!
  expect(label.textContent).toBe('Loading...')
  expect(label.hidden).toBe(false)
  expect(label.closest('[aria-hidden="true"]')).toBeNull()
  expect(container.querySelectorAll('[role="status"]')).toHaveLength(1)
  expect(container.querySelectorAll('[aria-live="polite"], [aria-live="assertive"]')).toHaveLength(1)
  const spinner = status.querySelector('.ui-spinner')!
  expect(spinner.getAttribute('role')).toBe('presentation')
  expect(spinner.getAttribute('aria-hidden')).toBe('true')
  expect(spinner.getAttribute('aria-live')).toBe('off')
  expect(spinner.textContent).toBe('')
})

it('updates the visible custom label without introducing another announcement source', () => {
  expect(UI).toHaveProperty('LoadingState')
  act(() => root.render(<UI.LoadingState label="Loading calendar..." />))
  const status = container.querySelector('[role="status"]')!
  expect(status.textContent).toBe('Loading calendar...')
  const longLabel = 'Loading' + 'calendar'.repeat(80)
  act(() => root.render(<UI.LoadingState label={longLabel} />))
  expect(container.querySelector('[role="status"]')).toBe(status)
  expect(status.textContent).toBe(longLabel)
  expect(container.querySelectorAll('[role="status"]')).toHaveLength(1)
  expect(container.querySelectorAll('[aria-live="polite"], [aria-live="assertive"]')).toHaveLength(1)
})

it('forwards the div ref, class, style, native attributes and event handlers', () => {
  expect(UI).toHaveProperty('LoadingState')
  const ref = createRef<HTMLDivElement>()
  const clicks: EventTarget[] = []
  act(() => root.render(<UI.LoadingState ref={ref} label="Loading records..."
    id="pending" title="Pending records" data-owner="records" tabIndex={-1}
    aria-describedby="loading-detail" className="consumer" style={{ minHeight: 200 }}
    onClick={event => clicks.push(event.currentTarget)} />))
  const status = ref.current!
  expect(status).toBeInstanceOf(HTMLDivElement)
  expect(status).toBe(container.querySelector('[role="status"]'))
  expect(status.classList.contains('ui-loading-state')).toBe(true)
  expect(status.classList.contains('consumer')).toBe(true)
  expect(status.style.minHeight).toBe('200px')
  expect(status.id).toBe('pending')
  expect(status.title).toBe('Pending records')
  expect(status.dataset.owner).toBe('records')
  expect(status.tabIndex).toBe(-1)
  expect(status.getAttribute('aria-describedby')).toBe('loading-detail')
  expect(status.hasAttribute('label')).toBe(false)
  act(() => status.click())
  expect(clicks).toEqual([status])
  act(() => root.render(null))
  expect(ref.current).toBeNull()
})

it.each([
  ['compact', '64px'],
  ['default', '160px'],
  ['lg', '240px'],
] as const)('renders size %s with the shipped minimum height %s', (size, minHeight) => {
  expect(UI).toHaveProperty('LoadingState')
  act(() => root.render(<UI.LoadingState size={size} />))
  const status = container.querySelector('[role="status"]')!
  expect(status.classList.contains(`ui-loading-state-size-${size}`)).toBe(true)
  expect(status.hasAttribute('size')).toBe(false)
  expect(css).toMatch(new RegExp(`\\.ui-loading-state-size-${size}\\s*\\{[^}]*min-height:\\s*${minHeight}\\s*;`))
})

it('ships bounded horizontal layout, muted typography and wrapping without a card surface', () => {
  const block = css.match(/\.ui-loading-state\s*\{([^}]*)\}/)?.[1]
  expect(block).toBeDefined()
  for (const declaration of [
    'box-sizing: border-box;', 'min-width: 0;', 'max-width: 100%;',
    'display: flex;', 'flex-direction: row;', 'align-items: center;', 'justify-content: center;',
    'gap: var(--ui-space-3);', 'padding: var(--ui-space-4);',
    'color: var(--ui-color-fg-muted);', 'font-size: var(--ui-font-size-md);',
    'font-family: var(--ui-font-family-sans);', 'line-height: var(--ui-line-height-base);',
  ]) expect(block).toContain(declaration)
  expect(block).not.toMatch(/(?:background|border|border-radius)\s*:/)
  const label = css.match(/\.ui-loading-state-label\s*\{([^}]*)\}/)?.[1]
  expect(label).toBeDefined()
  for (const declaration of [
    'min-width: 0;', 'max-width: 100%;', 'overflow-wrap: anywhere;', 'white-space: normal;',
  ]) expect(label).toContain(declaration)
})

it('disables animation only on its decorative Spinner under reduced motion', () => {
  expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{\s*\.ui-loading-state > \.ui-spinner\s*\{[^}]*animation:\s*none\s*;/)
})
