# List

`List` and `ListItem` provide quiet operational lists using native `ul` and `li`
elements. Import the package stylesheet once in the application entry:

```tsx
import '@novel-isr/ui/styles.css';
import { List, ListItem, IconButton } from '@novel-isr/ui';
import { Trash2 } from 'lucide-react';

<List aria-label="Registered devices">
  {devices.map(device => (
    <ListItem
      key={device.id}
      primary={<span id={`device-name-${device.id}`}>{device.name}</span>}
      secondary={device.lastUsedLabel}
      actions={
        <IconButton
          label="Delete device"
          aria-describedby={`device-name-${device.id}`}
          disabled={device.isDeleting}
          onClick={() => deleteDevice(device.id)}
        >
          <Trash2 size={16} />
        </IconButton>
      }
    />
  ))}
</List>
```

Use unique, DOM-safe IDs for the primary spans. Buttons keep their own accessible
names, descriptions, command callbacks, and disabled states. Supply `type="button"`
when using native command buttons inside a form.

## API

Both components and their `ListProps` / `ListItemProps` types are exported from
`@novel-isr/ui`.

| List prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `density` | `'default' \| 'compact'` | `'default'` | Minimum row height: 56px or 40px; vertical padding: 12px or 8px at the default root font size. |
| `dividers` | `boolean` | `true` | Token-colored separators between adjacent ListItem children. |
| `children` | `ReactNode` | - | List items; keep direct children valid for a native `ul`. |
| `ref` | `Ref<HTMLUListElement>` | - | Native list element. |
| Other props | `HTMLAttributes<HTMLUListElement>` | - | Native attributes, events, `aria-*`, `data-*`, styles, and class names. |

| ListItem prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `primary` | `ReactNode` | Required | Main content, 14px medium at the default root font size. |
| `secondary` | `ReactNode` | - | Supporting content, 13px muted. |
| `icon` | `ReactNode` | - | Optional decorative leading slot, hidden from assistive technology. |
| `actions` | `ReactNode` | - | Trailing controls, supplied and managed by the caller. |
| `ref` | `Ref<HTMLLIElement>` | - | Native list item element. |
| Other props | `Omit<LiHTMLAttributes<HTMLLIElement>, 'children'>` | - | Native item attributes and events; use named slots for content. |

## Semantics and Layout

The list defaults to `role="list"` to preserve Safari/VoiceOver list semantics
after removing list markers. Keep this role for ordinary lists. Rows retain native
list-item semantics and introduce no selection state, tab stop, or row command.
Native event handlers pass through without adding keyboard or selection behavior.
The components do not fetch, sort, redact, or otherwise transform supplied data.
Strings are rendered as escaped React text, and numeric `0` remains visible in
both text slots. Put links or buttons in content/actions when interaction is needed.
Optional slots omit null, undefined, booleans and empty strings without reserving
space, so conditional controls do not leave an empty action or icon column.
Keep focusable controls out of the decorative icon slot.

Typography, spacing, text colors, and separators consume existing `--ui-*` tokens
and follow the active palette. Rows have no card surface or shadow. Compact density
changes minimum height and vertical padding while preserving typography and control
sizes. Both densities grow vertically to accommodate long content and tall controls.

`.ui-list-item-content` wraps `.ui-list-item-primary` and
`.ui-list-item-secondary`. These elements allow shrinking and wrap long unbroken
text without truncation. `.ui-list-item-actions` stays at the trailing edge, is
bounded to 50% of the row's content width, and wraps multiple controls. Direct
action children are constrained to their slot and permit wrapping. Shared `Button`
labels also wrap without ellipsis within this slot. This keeps
ordinary commands visible alongside long metadata at 320px container widths.
Custom fixed-width descendants or controls with their own nonwrapping internals
must provide responsive styles; prefer icon buttons or short command labels.

```tsx
<List density="compact" dividers={false} aria-label="Queue totals">
  <ListItem primary="Pending" secondary={0} />
  <ListItem primary="Completed" secondary={24} />
</List>
```
