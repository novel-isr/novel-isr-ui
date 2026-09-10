# Form Layout

Import components and types from `@novel-isr/ui` and load
`@novel-isr/ui/styles.css` once.

```tsx
import { useRef, type FormEvent } from 'react'
import { Button, FormField, FormLayout, GridItem, Input } from '@novel-isr/ui'

function MetadataForm() {
  const formRef = useRef<HTMLFormElement>(null)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    // Validate and persist data in the application.
  }

  return <>
    <FormLayout ref={formRef} id="metadata" columns={{ base: 1, sm: 2 }}
      gap={4} onSubmit={submit}>
      <GridItem fullWidth asChild>
        <FormField label="Title">
          <Input name="title" defaultValue="Draft" required />
        </FormField>
      </GridItem>
      <FormField label="Language"><Input name="language" /></FormField>
      <FormField label="Category"><Input name="category" /></FormField>
    </FormLayout>
    <Button type="submit" form="metadata">Save</Button>
    <Button type="reset" form="metadata">Reset</Button>
  </>
}
```

`FormLayoutProps` extends native `FormHTMLAttributes<HTMLFormElement>` with
`columns?: GridColumns`, `gap`, `rowGap` and `columnGap`. The forwarded ref points
to the outer form. IDs, attributes, className, style and event handlers apply to
that form; layout props apply to the inner `ResponsiveGrid`.

`columns` defaults to one. A number sets all breakpoints; an object supports
`base`, `sm` (480px), `md` (768px) and `lg` (1200px). Missing values inherit the
previous count. Counts must be integers from 1 through 12. Breakpoints use the
grid's available container width, including inside nested layouts.

`gap` defaults to spacing token 4; `rowGap` and `columnGap` default to `gap`.
Numbers and numeric strings reference spacing tokens; other strings accept CSS
lengths such as `20px`. See [Responsive Data Layout](./responsive-data-layout.md).

`GridItemProps` accepts div HTML attributes, a forwarded div ref, `fullWidth` and
`asChild`. By default it renders a div occupying one grid cell. `fullWidth` uses
`grid-column: 1 / -1` to span the explicit columns, including a single-column
container. Numeric spans are not supported. GridItem works as a direct child of
either FormLayout or ResponsiveGrid and leaves source and tab order unchanged.

`asChild` requires one child element that forwards props and its ref, such as
FormField. Radix Slot puts layout classes on that element without adding a DOM
wrapper, merges classes and styles, composes refs, and preserves child handlers
and ARIA attributes. Child handlers run before item handlers. Label and helper
associations remain owned by FormField. Layout flags are not emitted as DOM
attributes. Stack, FormLayout and grid items allow shrinking below min-content.

FormLayout does not cancel submit or reset events. Native validation, FormData,
`requestSubmit()`, `reset()` and external controls using `form="metadata"` retain
their native behavior. Use `noValidate` only when the application owns validation.
Call `preventDefault()` in the application's handler when needed. Controlled
input reset state, validation, dirty-state guards, uploads and persistence remain
application responsibilities. Do not nest FormLayout inside another form.

## Verification

Run `pnpm test`, `pnpm type-check` and `pnpm build`. Unit coverage checks the
public exports, native form behavior, Slot composition and compiled style entry.
Browser verification is handled separately: check Enter submission, reset,
labels, source/tab order, full rows, narrow nested containers and long inputs in
both light and dark themes against the built package.
