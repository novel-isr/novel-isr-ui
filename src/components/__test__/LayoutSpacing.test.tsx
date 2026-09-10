/** @vitest-environment jsdom */
import { act, type CSSProperties } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Box, type BoxProps } from '../Box/Box'
import { Stack, HStack, VStack } from '../Stack/Stack'
import { SplitLayout } from '../SplitLayout/SplitLayout'
import { ResponsiveGrid } from '../ResponsiveGrid/ResponsiveGrid'
import { FormLayout } from '../FormLayout/FormLayout'

type Space = string | number | undefined
const layouts = [
  { name: 'Box', render: (gap: Space) => <Box p={gap} m={gap} />, selector: 'div', properties: ['padding', 'margin'], defaultValue: '' },
  { name: 'Stack', render: (gap: Space) => <Stack gap={gap} />, selector: '.ui-stack', properties: ['gap'], defaultValue: '' },
  { name: 'HStack', render: (gap: Space) => <HStack gap={gap} />, selector: '.ui-stack', properties: ['gap'], defaultValue: '' },
  { name: 'VStack', render: (gap: Space) => <VStack gap={gap} />, selector: '.ui-stack', properties: ['gap'], defaultValue: '' },
  { name: 'SplitLayout', render: (gap: Space) => <SplitLayout aside="Aside" gap={gap}>Main</SplitLayout>, selector: '.ui-split-layout', properties: ['--ui-split-layout-gap'], defaultValue: 'var(--ui-space-6)' },
  { name: 'ResponsiveGrid', render: (gap: Space) => <ResponsiveGrid gap={gap} />, selector: '.ui-responsive-grid', properties: ['--ui-grid-row-gap', '--ui-grid-column-gap'], defaultValue: 'var(--ui-space-4)' },
  { name: 'FormLayout', render: (gap: Space) => <FormLayout gap={gap} />, selector: '.ui-responsive-grid', properties: ['--ui-grid-row-gap', '--ui-grid-column-gap'], defaultValue: 'var(--ui-space-4)' },
]

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

describe.each(layouts)('$name spacing', layout => {
  it.each([0.5, '0.5'])('maps %j to the shipped half-step token', gap => {
    act(() => root.render(layout.render(gap)))
    const element = container.querySelector<HTMLElement>(layout.selector)!
    for (const property of layout.properties) {
      expect(element.style.getPropertyValue(property)).toBe('var(--ui-space-0-5)')
    }
  })

  it.each([0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 20, 24])('preserves shipped integer token %s and its numeric string', token => {
    for (const gap of [token, String(token)]) {
      act(() => root.render(layout.render(gap)))
      const element = container.querySelector<HTMLElement>(layout.selector)!
      for (const property of layout.properties) {
        expect(element.style.getPropertyValue(property)).toBe(`var(--ui-space-${token})`)
      }
    }
  })

  it.each(['2px', '0.5rem', '2em', '5%', 'calc(1rem + 2px)', 'var(--custom-gap)'])('passes CSS value %s through', gap => {
    const markup = renderToStaticMarkup(layout.render(gap))
    for (const property of layout.properties) {
      expect(markup).toContain(`${property}:${gap}`)
    }
  })

  it('restores existing defaults when spacing becomes undefined', () => {
    act(() => root.render(layout.render(0.5)))
    act(() => root.render(layout.render(undefined)))
    const element = container.querySelector<HTMLElement>(layout.selector)!
    for (const property of layout.properties) {
      expect(element.style.getPropertyValue(property)).toBe(layout.defaultValue)
    }
  })

  // Inspect SSR output because the CSS parser can discard unsupported declarations.
  it.each([
    [99, 'var(--ui-space-99)', 'var(--ui-space-99)'],
    ['99', 'var(--ui-space-99)', 'var(--ui-space-99)'],
    [1.5, 'var(--ui-space-1.5)', 'var(--ui-space-1-5)'],
    ['1.5', 'var(--ui-space-1.5)', 'var(--ui-space-1-5)'],
    [2.5, 'var(--ui-space-2.5)', 'var(--ui-space-2-5)'],
    ['2.5', 'var(--ui-space-2.5)', 'var(--ui-space-2-5)'],
    [-1, 'var(--ui-space--1)', 'var(--ui-space--1)'],
    [-0.5, 'var(--ui-space--0.5)', 'var(--ui-space--0-5)'],
    ['-0.5', '-0.5', '-0.5'],
    ['.5', '.5', '.5'],
    ['0.50', 'var(--ui-space-0.50)', 'var(--ui-space-0-50)'],
    ['04', 'var(--ui-space-04)', 'var(--ui-space-04)'],
    [' 0.5 ', '0.5', '0.5'],
    ['1e2', '1e2', '1e2'],
    ['auto', 'auto', 'auto'],
    ['unknown', 'unknown', 'unknown'],
    [NaN, 'var(--ui-space-NaN)', 'var(--ui-space-NaN)'],
    [Infinity, 'var(--ui-space-Infinity)', 'var(--ui-space-Infinity)'],
  ] as const)('preserves existing handling of %j', (gap, expected, splitExpected) => {
    const markup = renderToStaticMarkup(layout.render(gap))
    for (const property of layout.properties) {
      expect(markup).toContain(`${property}:${layout.name === 'SplitLayout' ? splitExpected : expected}`)
    }
  })

  it('keeps empty strings empty', () => {
    const markup = renderToStaticMarkup(layout.render(''))
    for (const property of layout.properties) {
      expect(markup).not.toContain(`${property}:`)
    }
  })
})

it.each([
  ['p', ['padding']], ['px', ['padding-left', 'padding-right']], ['py', ['padding-top', 'padding-bottom']],
  ['pt', ['padding-top']], ['pr', ['padding-right']], ['pb', ['padding-bottom']], ['pl', ['padding-left']],
  ['m', ['margin']], ['mx', ['margin-left', 'margin-right']], ['my', ['margin-top', 'margin-bottom']],
  ['mt', ['margin-top']], ['mr', ['margin-right']], ['mb', ['margin-bottom']], ['ml', ['margin-left']],
] as const)('resolves the half-step token for Box %s', (prop, properties) => {
  for (const value of [0.5, '0.5']) {
    const props: BoxProps = { [prop]: value }
    act(() => root.render(<Box {...props} />))
    for (const property of properties) {
      expect((container.firstElementChild as HTMLElement).style.getPropertyValue(property)).toBe('var(--ui-space-0-5)')
    }
  }
})

it('preserves Box axis/side priority, numeric dimensions and final style overrides', () => {
  const markup = renderToStaticMarkup(<Box p={4} px={2} pl={0.5} m={4} my={2} mt="0.5" w={0.5}
    style={{ paddingRight: '9px', marginBottom: '7px' }} />)
  expect(markup).toContain('padding:var(--ui-space-4);padding-left:var(--ui-space-0-5);padding-right:9px')
  expect(markup).toContain('margin:var(--ui-space-4);margin-top:var(--ui-space-0-5);margin-bottom:7px')
  expect(markup).toContain('width:0.5px')
})

it.each([Stack, HStack, VStack])('preserves Stack style overrides', Component => {
  act(() => root.render(<Component gap={0.5} style={{ gap: '9px' }} />))
  expect((container.firstElementChild as HTMLElement).style.gap).toBe('9px')
})

it.each([ResponsiveGrid, FormLayout])('preserves independent grid row and column gaps', Component => {
  act(() => root.render(<Component gap={4} rowGap={0.5} columnGap="0.5" />))
  const element = container.querySelector<HTMLElement>('.ui-responsive-grid')!
  expect(element.style.getPropertyValue('--ui-grid-row-gap')).toBe('var(--ui-space-0-5)')
  expect(element.style.getPropertyValue('--ui-grid-column-gap')).toBe('var(--ui-space-0-5)')
  act(() => root.render(<Component gap={0.5} rowGap={0} columnGap="calc(1rem + 2px)" />))
  expect(element.style.getPropertyValue('--ui-grid-row-gap')).toBe('var(--ui-space-0)')
  expect(element.style.getPropertyValue('--ui-grid-column-gap')).toBe('calc(1rem + 2px)')
})

it('preserves grid and split layout variable overrides', () => {
  act(() => root.render(<>
    <ResponsiveGrid gap={0.5} style={{ '--ui-grid-row-gap': '9px', '--ui-grid-column-gap': '7px' } as CSSProperties} />
    <SplitLayout aside="Aside" gap={0.5} style={{ '--ui-split-layout-gap': '11px' } as CSSProperties} />
  </>))
  const grid = container.querySelector<HTMLElement>('.ui-responsive-grid')!
  expect(grid.style.getPropertyValue('--ui-grid-row-gap')).toBe('9px')
  expect(grid.style.getPropertyValue('--ui-grid-column-gap')).toBe('7px')
  expect(container.querySelector<HTMLElement>('.ui-split-layout')!.style.getPropertyValue('--ui-split-layout-gap')).toBe('11px')
})

it('keeps spacing references dynamic for consumer token overrides', () => {
  const style = { '--ui-space-0-5': '7px', '--ui-space-4': '19px', '--ui-space-99': '23px' } as CSSProperties
  act(() => root.render(<Box p={0.5} m={4} style={style}>
    <Stack gap="0.5" /><ResponsiveGrid gap={99} /><SplitLayout aside="Aside" gap="4" />
  </Box>))
  const box = container.firstElementChild as HTMLElement
  expect(box.style.getPropertyValue('--ui-space-0-5')).toBe('7px')
  expect(box.style.getPropertyValue('--ui-space-4')).toBe('19px')
  expect(box.style.getPropertyValue('--ui-space-99')).toBe('23px')
  expect(box.style.padding).toBe('var(--ui-space-0-5)')
  expect(box.style.margin).toBe('var(--ui-space-4)')
  expect(container.querySelector<HTMLElement>('.ui-stack')!.style.gap).toBe('var(--ui-space-0-5)')
  expect(container.querySelector<HTMLElement>('.ui-responsive-grid')!.style.getPropertyValue('--ui-grid-row-gap')).toBe('var(--ui-space-99)')
  expect(container.querySelector<HTMLElement>('.ui-split-layout')!.style.getPropertyValue('--ui-split-layout-gap')).toBe('var(--ui-space-4)')
})
