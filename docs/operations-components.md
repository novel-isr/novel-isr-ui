# Operations Components

Available from `@novel-isr/ui` starting with 0.1.12. Import `@novel-isr/ui/styles.css`
once. Use `ThemeProvider defaultTheme="system" defaultPalette="graphite"`.

```tsx
<Page>
  <PageHeader title="Accounts" actions={<Button onClick={refresh}>Refresh</Button>} />
  <Toolbar aria-label="Filters">
    <Input aria-label="Search accounts" value={search} onChange={onSearch} />
  </Toolbar>
  <DataTable
    columns={[{ key: 'name', header: 'Name' }]}
    data={response.rows}
    rowKey={row => row.id}
    loading={pending}
    error={error && 'Unable to load accounts'}
    onRetry={refresh}
    pagination={{ page, pageSize, total, onPageChange: setPage }}
  />
</Page>
```

- `PageHeader`: one h1, optional description and wrapping actions.
- `PageSection`: h2 and optional icon/description/actions; unframed with a divider.
- `Toolbar`: wrapping group for fields/actions, not an ARIA roving-focus toolbar.
- `StatCard`: label/value/icon for repeated summary metrics.
- `IconButton`: required `label`, inherited Button states, square size and tooltip.
- `DataTable`: composes Table/Pagination/EmptyState. Rows are already paginated;
  the library never slices, fetches, sorts, or authorizes application data.
- `Menu` / `ContextMenu`: trigger child must accept a ref and event props. Items
  support key/label/icon/disabled/children and group/separator entries. `onSelect`
  receives the action. Radix owns keyboard navigation, portals and focus management.

Keep API requests, authentication, router integration and business workflows in
the consuming application. Do not override internal `.ui-*` styles there.
Use semantic `--ui-*` tokens for application-specific layouts.

Radix dependencies are pinned as a tested compatible set. Upgrade them together:
mixed focus-scope/dismissable-layer versions break nested overlays. Regression
coverage includes opening a Menu inside Modal and dismissing only the menu.
