# Toolbar

Toolbar groups related controls using a wrapping flex row. It is exported from
`@novel-isr/ui`; include `@novel-isr/ui/styles.css` once in the application.

```tsx
import { Button, Card, Divider, Toolbar } from '@novel-isr/ui'

<Toolbar aria-label="Actions">
  <Button>Save</Button>
  <Button variant="outline">Cancel</Button>
</Toolbar>

<Toolbar density="compact" asChild aria-label="Actions">
  <Card padding="none" variant="elevated">
    <Button size="sm">Save</Button>
    <Divider orientation="vertical" />
    <Button size="sm" variant="ghost">Cancel</Button>
  </Card>
</Toolbar>
```

## Props

`ToolbarProps` extends `HTMLAttributes<HTMLDivElement>` and forwards the ref,
native attributes, event handlers, `className` and `style`.

| Prop | Type | Default |
| --- | --- | --- |
| `density` | `'default' \| 'compact'` | `'default'` |
| `wrap` | `boolean` | `true` |
| `asChild` | `boolean` | `false` |

Default density keeps the existing `--ui-space-3` gap and input/select sizing.
Compact density uses `--ui-space-1`. Only direct-child vertical Dividers in a
compact Toolbar receive `--ui-space-5` height, centered cross-axis alignment and
`flex: 0 0 auto`. Nested, horizontal and standalone Dividers retain their styles.
`wrap={false}` disables wrapping independently of density.

## Composition and accessibility

By default Toolbar renders a `div` with `role="group"`. With `asChild`, it uses
Radix Slot to apply its props to one child element without adding a wrapper.
A custom child must forward its props and ref to its root; Card already does.

Slot merges classes, styles, refs and event handlers. Child attributes, including
an explicit `role` or accessible label, take precedence over Toolbar attributes.
Child styles win on conflicting properties. Child event handlers run before
Toolbar handlers; a Toolbar handler can inspect `event.defaultPrevented` when
the child cancels an event.

Toolbar supplies layout and grouping only. It does not add arrow-key navigation,
roving focus, or editor commands. Setting `role="toolbar"` does not add those
behaviors; consumers that choose that role own its keyboard interaction.

## Verification

```sh
pnpm exec vitest run src/components/__test__/Toolbar.test.tsx
```

The scoped tests render real React components from the public entry and verify
default/compact density, wrapping, native props, refs, event composition and
single-element Card composition. Sass contracts are compiled from the shared
style entry in memory, including unchanged default Toolbar and standalone
Divider rules. No `dist` files are written.
