# Layout Spacing

Load `@novel-isr/ui/styles.css` once. Box padding and margin props, Stack
(including HStack/VStack) `gap`, SplitLayout `gap`, and ResponsiveGrid/FormLayout
`gap`, `rowGap` and `columnGap` reference the shipped spacing tokens:

| Input | CSS reference | Default length |
| --- | --- | --- |
| `0` or `'0'` | `var(--ui-space-0)` | `0` |
| `0.5` or `'0.5'` | `var(--ui-space-0-5)` | `0.125rem` (2px at a 16px root font) |
| `4` or `'4'` | `var(--ui-space-4)` | `1rem` |

The shipped keys are `0`, `0.5`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `10`,
`12`, `14`, `16`, `20` and `24`. Numeric spacing selects tokens, not pixel
lengths. Box dimension props such as `w` continue to interpret numbers as pixels.

CSS strings such as `'2px'`, `'0.5rem'`, `'calc(1rem + 2px)'`,
`'var(--custom-gap)'` and Box's `'auto'` margin pass through. Numeric strings
must have digits before the decimal point: `'.5'` is still passed through and
does not select a token. Strings are not numerically canonicalized (`'04'` and
`'0.50'` keep their spelling). Unknown keys are not validated or given fallbacks;
negative and nonnumeric inputs retain their existing handling.

Only the shipped half-step mapping is corrected for Box, Stack and
ResponsiveGrid. Other decimal keys retain their previous behavior: `1.5` and
`'1.5'` still produce `var(--ui-space-1.5)` there, while SplitLayout retains
`var(--ui-space-1-5)`. Neither token is shipped. For shared custom fractional
spacing, define a valid custom property and pass an explicit reference such as
`'var(--custom-gap)'`. Custom integer references such as `99` still select
`var(--ui-space-99)` in every layout.

Token references remain dynamic: overriding `--ui-space-0-5` on an element or
ancestor changes half-step spacing. Inline `style` takes final precedence over
generated declarations. Box side props override axis props, which override
shorthands. Grid `rowGap` and `columnGap` each default to `gap`.

Undefined spacing adds no Box/Stack declaration; SplitLayout defaults to token
`6`, and ResponsiveGrid/FormLayout default both gap axes to token `4`. FormLayout
passes spacing to its inner ResponsiveGrid; its native `style` applies to the form.

## Verification

Run `pnpm test src/components/__test__/LayoutSpacing.test.tsx`, `pnpm type-check`
and `pnpm build`. The browser fixture uses the built package and installed Chrome
to assert actual computed lengths, including 2px for both half-step inputs at
desktop/mobile widths and inherited token overrides:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
  node tests/browser/layout-spacing.mjs
```

The fixture starts its own temporary local Vite server and closes it on exit.
Playwright is external test tooling; no package dependency changes are required.
