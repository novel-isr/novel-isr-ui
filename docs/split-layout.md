# Split Layout

Import `SplitLayout` and `SplitLayoutProps` from `@novel-isr/ui` and load
`@novel-isr/ui/styles.css` once.

```tsx
import { SplitLayout } from '@novel-isr/ui'

<SplitLayout aside={<section aria-label="Article properties">{properties}</section>}>
  <section aria-label="Article content">{fields}</section>
</SplitLayout>
```

`SplitLayoutProps` extends native `HTMLAttributes<HTMLDivElement>`. The forwarded
ref points to the outer div. Native attributes, events, `className` and `style`
apply to that div. Layout props are consumed rather than emitted as attributes.

| Prop | Default | Behavior |
| --- | --- | --- |
| `aside: ReactNode` | Required | Content after the main slot. `null`, `undefined` and `false` omit the slot and leave a single full-width main column. Numeric `0` remains valid content. |
| `asideWidth?: number` | `320` | Requested split-mode width in pixels. Must be finite and greater than zero; invalid values throw `RangeError`. Positive fractional values are supported. |
| `collapseBelow?: 'md' \| 'lg'` | `'md'` | Split at container widths of at least 768px (`md`) or 1200px (`lg`); stack below the chosen threshold. |
| `gap?: string \| number` | `6` | Numbers and numeric strings reference spacing tokens, such as `6` or `'6'` becoming `var(--ui-space-6)`. Other strings accept CSS values such as `'20px'` or `'var(--editor-gap)'`. |

Decimal token keys use hyphens: `0.5` and `'0.5'` both resolve to
`var(--ui-space-0-5)` (`0.125rem`). The shipped spacing keys are `0`, `0.5`, `1`,
`2`, `3`, `4`, `5`, `6`, `7`, `8`, `10`, `12`, `14`, `16`, `20` and `24`.
`1.5` and `2.5` (including numeric strings) normalize to `--ui-space-1-5` and
`--ui-space-2-5`, but these tokens are not shipped. Define those custom properties
when using those keys, or pass an explicit CSS length such as `'0.375rem'` or
`'0.625rem'`. Numeric values select tokens rather than literal pixel lengths.

An outer named inline-size container holds an inner grid. Breakpoints depend on
the available container width, not the viewport: a narrow panel still stacks on
a wide screen. Nested SplitLayouts each use their nearest container and their
own width, gap and breakpoint settings. No JavaScript measurement or runtime
dependency is needed. Browsers without container-query support keep the stacked
layout.

In split mode the aside track is `min(asideWidth, 50%)`; the main track receives
the remaining space after the gap. The default aside is exactly 320px wherever
the default split breakpoint is reached. In stacked mode both slots fill the
single column, regardless of `asideWidth`. Without an aside there is no empty
track or trailing gap.

Main content always precedes aside content in DOM and reading order. The layout
does not reorder focus, duplicate fields or remount main children when the aside
is toggled. Slot wrappers are neutral divs; supply semantic elements and labels
inside them as appropriate. Both slots can shrink below their min-content size;
consumers remain responsible for wrapping long content and scrolling intrinsically
wide editors, code blocks or tables within their slot.

## Verification

Run `pnpm test src/components/__test__/SplitLayout.test.tsx` and
`pnpm type-check`. The unit suite imports the component module directly and checks
native forwarding, source order, omitted aside values, width validation, spacing
tokens, nested defaults and preservation of main input state. Fractional gap
coverage resolves numeric and string `0.5` against Sass-compiled spacing tokens
and parses the resulting length as a CSS gap declaration in the DOM test runtime.

Browser verification belongs to the built-package integration: check 320, 767,
768 and 1200px containers, both collapse thresholds, the default 320px aside,
oversized aside widths, full-width stacked slots, omitted aside, nested narrow
containers, long content and keyboard tab order. Unit DOM tests do not establish
rendered geometry or container-query behavior.
