/** @vitest-environment jsdom */
import { act, createRef } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { compile } from 'sass'
import * as UI from '../../index'

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

it('exports FormLayout and GridItem from the public entry', () => {
  expect(UI).toHaveProperty('FormLayout')
  expect(UI).toHaveProperty('GridItem')
})

it('forwards native form props and ref while consuming grid props', () => {
  expect(UI).toHaveProperty('FormLayout')
  const ref = createRef<HTMLFormElement>()
  act(() => root.render(<UI.FormLayout ref={ref} id="metadata" name="metadata"
    action="/save" method="post" encType="multipart/form-data" target="result"
    autoComplete="off" noValidate aria-label="Metadata" data-owner="editor"
    className="consumer" style={{ maxWidth: 720 }}
    columns={{ base: 1, sm: 2, lg: 3 }} gap={3} rowGap={2} columnGap="20px">
    <input name="title" />
  </UI.FormLayout>))
  const form = ref.current!
  expect(form).toBeInstanceOf(HTMLFormElement)
  expect(form).toBe(container.querySelector('form'))
  expect(form.id).toBe('metadata')
  expect(form.name).toBe('metadata')
  expect(form.getAttribute('action')).toBe('/save')
  expect(form.method).toBe('post')
  expect(form.enctype).toBe('multipart/form-data')
  expect(form.target).toBe('result')
  expect(form.getAttribute('autocomplete')).toBe('off')
  expect(form.noValidate).toBe(true)
  expect(form.getAttribute('aria-label')).toBe('Metadata')
  expect(form.dataset.owner).toBe('editor')
  expect(form.classList.contains('consumer')).toBe(true)
  expect(form.style.maxWidth).toBe('720px')
  const grid = form.querySelector<HTMLElement>('.ui-responsive-grid')!
  expect(['base', 'sm', 'md', 'lg'].map(key => grid.style.getPropertyValue(`--ui-grid-${key}`)))
    .toEqual(['1', '2', '2', '3'])
  expect(grid.style.getPropertyValue('--ui-grid-row-gap')).toBe('var(--ui-space-2)')
  expect(grid.style.getPropertyValue('--ui-grid-column-gap')).toBe('20px')
  expect(form.querySelector('input')?.form).toBe(form)
  expect(container.querySelector('[columns], [gap], [rowgap], [columngap]')).toBeNull()
  act(() => root.unmount())
  expect(ref.current).toBeNull()
  root = createRoot(container)
})

it('passes numeric columns and gap through to ResponsiveGrid', () => {
  expect(UI).toHaveProperty('FormLayout')
  act(() => root.render(<UI.FormLayout columns={2} gap={5} />))
  const grid = container.querySelector<HTMLElement>('.ui-responsive-grid')!
  expect(grid.style.getPropertyValue('--ui-grid-base')).toBe('2')
  expect(grid.style.getPropertyValue('--ui-grid-lg')).toBe('2')
  expect(grid.style.getPropertyValue('--ui-grid-row-gap')).toBe('var(--ui-space-5)')
  expect(grid.style.getPropertyValue('--ui-grid-column-gap')).toBe('var(--ui-space-5)')
})

it('leaves submit cancellation to the consumer, including when no handler is supplied', () => {
  expect(UI).toHaveProperty('FormLayout')
  const received: boolean[] = []
  act(() => root.render(<UI.FormLayout onSubmit={event => {
    received.push(event.defaultPrevented)
  }} />))
  let event = new Event('submit', { bubbles: true, cancelable: true })
  act(() => { expect(container.querySelector('form')!.dispatchEvent(event)).toBe(true) })
  expect(received).toEqual([false])
  expect(event.defaultPrevented).toBe(false)
  act(() => root.render(<UI.FormLayout />))
  event = new Event('submit', { bubbles: true, cancelable: true })
  act(() => { expect(container.querySelector('form')!.dispatchEvent(event)).toBe(true) })
  expect(event.defaultPrevented).toBe(false)
})

it('supports requestSubmit and external submit buttons with native FormData', () => {
  expect(UI).toHaveProperty('FormLayout')
  const ref = createRef<HTMLFormElement>()
  const submissions: { form: HTMLFormElement; submitter: HTMLElement | null; entries: [string, FormDataEntryValue][] }[] = []
  act(() => root.render(<>
    <UI.FormLayout ref={ref} id="editor" noValidate onSubmit={event => {
      expect(event.defaultPrevented).toBe(false)
      submissions.push({
        form: event.currentTarget,
        submitter: (event.nativeEvent as SubmitEvent).submitter,
        entries: Array.from(new FormData(event.currentTarget).entries()),
      })
      event.preventDefault()
    }}>
      <UI.Input name="title" defaultValue="Draft" />
      <input name="tag" defaultValue="one" />
      <input name="tag" defaultValue="two" />
      <input name="ignored" defaultValue="hidden" disabled />
      <input name="required" required />
    </UI.FormLayout>
    <input name="external" defaultValue="linked" form="editor" />
    <button type="submit" form="editor">Save</button>
  </>))
  const form = ref.current!
  const button = container.querySelector('button')!
  expect(button.form).toBe(form)
  act(() => form.requestSubmit(button))
  act(() => button.click())
  expect(submissions).toHaveLength(2)
  for (const submission of submissions) {
    expect(submission.form).toBe(form)
    expect(submission.submitter).toBe(button)
    expect(submission.entries).toEqual([
      ['title', 'Draft'], ['tag', 'one'], ['tag', 'two'], ['required', ''], ['external', 'linked'],
    ])
  }
})

it('retains native validation when noValidate is omitted', () => {
  expect(UI).toHaveProperty('FormLayout')
  let submissions = 0
  let invalid = 0
  act(() => root.render(<UI.FormLayout onInvalid={() => { invalid += 1 }} onSubmit={event => {
    submissions += 1
    event.preventDefault()
  }}><input required /><button type="submit">Save</button></UI.FormLayout>))
  act(() => container.querySelector('button')!.click())
  expect(submissions).toBe(0)
  expect(invalid).toBe(1)
})

it('allows native reset and lets the consumer cancel it', () => {
  expect(UI).toHaveProperty('FormLayout')
  const resets: HTMLFormElement[] = []
  let cancel = false
  act(() => root.render(<>
    <UI.FormLayout id="resettable" onReset={event => {
      expect(event.defaultPrevented).toBe(false)
      resets.push(event.currentTarget)
      if (cancel) event.preventDefault()
    }}><UI.Input name="title" defaultValue="Draft" /></UI.FormLayout>
    <button type="reset" form="resettable">Reset</button>
  </>))
  const form = container.querySelector('form')!
  const input = container.querySelector('input')!
  input.value = 'Edited'
  act(() => container.querySelector('button')!.click())
  expect(input.value).toBe('Draft')
  input.value = 'Kept'
  cancel = true
  act(() => form.reset())
  expect(input.value).toBe('Kept')
  expect(resets).toEqual([form, form])
})

it('makes full-width GridItem opt-in and forwards div attributes and refs', () => {
  expect(UI).toHaveProperty('GridItem')
  const ref = createRef<HTMLDivElement>()
  act(() => root.render(<UI.ResponsiveGrid columns={2}>
    <UI.GridItem ref={ref} id="regular" className="consumer" aria-label="Group"
      data-owner="editor" style={{ padding: 8 }}>Regular</UI.GridItem>
    <UI.GridItem fullWidth>Full row</UI.GridItem>
    <UI.GridItem fullWidth={false}>Regular again</UI.GridItem>
  </UI.ResponsiveGrid>))
  expect(ref.current?.tagName).toBe('DIV')
  expect(ref.current?.id).toBe('regular')
  expect(ref.current?.classList.contains('consumer')).toBe(true)
  expect(ref.current?.getAttribute('aria-label')).toBe('Group')
  expect(ref.current?.dataset.owner).toBe('editor')
  expect(ref.current?.style.padding).toBe('8px')
  const items = Array.from(container.querySelectorAll('.ui-grid-item'))
  expect(items.map(item => item.textContent)).toEqual(['Regular', 'Full row', 'Regular again'])
  expect(items.map(item => item.classList.contains('ui-grid-item-full-width'))).toEqual([false, true, false])
  expect(container.querySelector('[fullwidth], [aschild]')).toBeNull()
})

it('slots FormField without a wrapper while preserving labels, both refs and child handlers', () => {
  expect(UI).toHaveProperty('FormLayout')
  expect(UI).toHaveProperty('GridItem')
  const itemRef = createRef<HTMLDivElement>()
  const fieldRef = createRef<HTMLDivElement>()
  const clicks: string[] = []
  act(() => root.render(<UI.FormLayout>
    <UI.GridItem fullWidth asChild ref={itemRef} className="item" data-owner="layout"
      aria-label="Title group" style={{ padding: 8 }} onClick={event => {
        clicks.push(`item:${event.defaultPrevented}`)
      }}>
      <UI.FormField ref={fieldRef} label="Title" helperText="Public title" className="field"
        data-child="preserved" style={{ margin: 4 }} onClick={event => {
          clicks.push('child')
          event.preventDefault()
        }}>
        <UI.Input name="title" />
      </UI.FormField>
    </UI.GridItem>
  </UI.FormLayout>))
  const field = fieldRef.current!
  expect(itemRef.current).toBe(field)
  expect(field.parentElement?.className).toBe('ui-responsive-grid-layout')
  expect(field.classList.contains('ui-form-control')).toBe(true)
  expect(field.classList.contains('ui-grid-item-full-width')).toBe(true)
  expect(field.classList.contains('item')).toBe(true)
  expect(field.classList.contains('field')).toBe(true)
  expect(field.dataset.owner).toBe('layout')
  expect(field.dataset.child).toBe('preserved')
  expect(field.getAttribute('aria-label')).toBe('Title group')
  expect(field.style.padding).toBe('8px')
  expect(field.style.margin).toBe('4px')
  const input = field.querySelector('input')!
  expect(field.querySelector('label')?.control).toBe(input)
  expect(document.getElementById(input.getAttribute('aria-describedby')!)?.textContent).toBe('Public title')
  act(() => field.click())
  expect(clicks).toEqual(['child', 'item:true'])
  expect(container.querySelector('[fullwidth], [aschild]')).toBeNull()
  act(() => root.unmount())
  expect(itemRef.current).toBeNull()
  expect(fieldRef.current).toBeNull()
  root = createRoot(container)
})

it('ships explicit-grid full rows and shrink boundaries in the style entry', () => {
  const css = compile('src/styles/index.scss').css
  expect(css).toMatch(/\.ui-grid-item-full-width\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/)
  expect(css).toMatch(/\.ui-form-layout\s*\{[^}]*min-width:\s*0/)
  expect(css).toMatch(/\.ui-stack\s*\{[^}]*min-width:\s*0/)
})
