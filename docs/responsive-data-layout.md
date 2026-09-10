# Responsive Data Layout

Import components from `@novel-isr/ui` and load `@novel-isr/ui/styles.css` once.

```tsx
<Page maxWidth={1440}>
  <ResponsiveGrid as="section" aria-label="Metrics"
    columns={{ base: 1, sm: 2, md: 3, lg: 6 }} gap={4}>
    {metrics.map(metric => <StatCard key={metric.id} {...metric} />)}
  </ResponsiveGrid>
</Page>
```

`ResponsiveGrid` responds to its own available width, not the viewport. `sm`,
`md` and `lg` start at 480, 768 and 1200 CSS pixels. Missing values inherit the
previous breakpoint, starting at one column. A numeric `columns` sets every
breakpoint. Column counts must be integers from 1 through 12. Nested grids have
independent counts. Children keep DOM order and can shrink below min-content.

Numeric `gap`, `rowGap` and `columnGap` values reference spacing tokens, as with
Stack. Strings can be literal lengths such as `20px`. The outer element is the
query container and the inner element owns grid layout; use `as` for div, section
or nav semantics, not list/table elements requiring constrained direct children.
It is not an ARIA data grid and does not implement keyboard selection.

```tsx
<TableCellContent primary={record.title} secondary={record.description} />
<TableCellContent primary={record.url} monospace maxWidth={300} />
<CodeBlock aria-label="Record JSON">{JSON.stringify(record, null, 2)}</CodeBlock>
```

`TableCellContent` is content inside a real table cell, not a replacement for td.
It wraps long text and defaults to a 360px maximum width. Primary and secondary
values can be React nodes, including links and zero. Secondary values use muted
theme text; `monospace` changes primary markup to code.

`CodeBlock` accepts plain text without interpreting HTML or reformatting it.
The required accessible name labels its focusable scroll region. It wraps by
default and limits height to 24rem. Set `wrap={false}` for horizontal scrolling
and `maxHeight` for a different limit. This is not an editable code editor.

All components accept HTML attributes, className, style and forwarded refs.
`Page maxWidth` accepts a pixel number or CSS length. Routes, permissions, data
queries and formatting remain consumer responsibilities.

Use `Toolbar wrap={false}` for atomic action groups such as a filter and refresh
button. It bounds the group to the available width and lets selects shrink while
retaining the action. The default Toolbar still wraps. Select's closed value
uses ellipsis without removing accessible text; open options wrap inside a menu
bounded by the available viewport, so long API-provided identifiers remain
inspectable without pushing adjacent actions off screen.

## Verification

Run `pnpm test`, `pnpm type-check` and `pnpm build`. Browser checks exercise the
built package, both themes, fixed-viewport container resizing, nested grids,
bordered table scrolling, sticky headers/columns and keyboard code scrolling:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
  node tests/browser/responsive-data-layout.mjs
```

The runner uses installed Chrome. Playwright is test tooling, not a runtime
dependency. Screenshots are written to `/tmp/ui-data-layout` by default.
