# LoadingState

Shared presentation for page, route and section loading. LoadingState composes
Spinner and a visible text label in a centered horizontal row. Consumers own
the loading condition, data fetching and label localization.

```tsx
import { LoadingState } from '@novel-isr/ui'
import '@novel-isr/ui/styles.css'

<LoadingState />
<LoadingState size="compact" label="Loading records..." />
<LoadingState size="lg" label="Loading calendar..." />
```

## API

`LoadingStateProps` extends `HTMLAttributes<HTMLDivElement>` without `children`. The component
forwards its div ref, native attributes, event handlers, `className` and `style`.
Use `label` for its content.

| Prop | Type | Default |
| --- | --- | --- |
| `label` | `string` | `'Loading...'` |
| `size` | `'compact' \| 'default' \| 'lg'` | `'default'` |

`LoadingStateSize` is also exported from the package entry.

| Size | Minimum height | Typical placement |
| --- | --- | --- |
| `compact` | 64px | Small section |
| `default` | 160px | Page or route content |
| `lg` | 240px | Calendar content |

All sizes use a 24px Spinner, muted foreground, medium sans-serif text,
base line height, `--ui-space-3` gap and `--ui-space-4` padding. Minimum
heights include padding. Content can grow taller when the label wraps.
The container and label can shrink; unbroken text wraps within the available
width. There is no card, background, border or viewport-height layout.
Consumer styles can override these layout defaults.

## Accessibility and motion

The outer div is the sole status region, with `role="status"`,
`aria-live="polite"` and `aria-atomic="true"`. Its visible label supplies the
announcement. The composed Spinner has `aria-hidden="true"`,
`role="presentation"`, `aria-live="off"` and an empty internal label, avoiding
a second status region or repeated loading text.

LoadingState does not set `aria-busy`: leaving a live region permanently busy
can defer its announcement. Consumers should track busy state on the relevant
content container and clear it when loading finishes. Avoid placing LoadingState
inside another status region. Native ARIA attributes pass through, so overriding
them can change these defaults. Screen-reader announcement timing remains
dependent on the browser and assistive technology.

Under `prefers-reduced-motion: reduce`, LoadingState disables animation only on
its own direct-child Spinner. The static indicator and visible label remain.
Standalone Spinner behavior and its API are unchanged.

## Adoption and verification

Page and route loading can use the default size. A calendar loader with an
existing 240px minimum height can use `size="lg"`. Replace the entire custom
loader wrapper so that old status roles and flex styling are not duplicated.
This change does not migrate Admin consumers.

Scoped unit command:

```sh
pnpm exec vitest run src/components/__test__/LoadingState.test.tsx
```

The tests render the real component through the public entry and cover default
and updated labels, status semantics, decorative Spinner, ref and DOM props,
size classes, and compiled Sass contracts from the shared style entry. Sass is
compiled in memory; tests do not build or write `dist`. Browser layout and
assistive-technology verification belong to the consuming integration checks.
