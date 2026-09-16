# Tabs

Use `variant="pills"` for flat, separated child-view tabs. `colorScheme` accepts
`brand` (default), `gray`, `success`, `warning`, or `danger`; semantic tokens follow
the active palette and light/dark theme. Existing `line`, `enclosed`, and `soft`
variants remain available.

```tsx
<Tabs value={language} onValueChange={setLanguage} variant="pills" colorScheme="brand" activationMode="manual">
  <TabList aria-label="Languages">
    <Tab value="en" colorScheme="brand">English</Tab>
    <Tab value="ja" colorScheme="success">Japanese</Tab>
  </TabList>
  <TabPanel value={language}>{editor}</TabPanel>
</Tabs>
```

Each `Tab` also accepts the same optional `colorScheme`, overriding the group
color. Explicitly colored tabs keep a semantic background and readable text while
inactive; selection adds a bottom marker (a side marker for vertical line tabs).
Hover underlines inactive labels and keyboard focus retains its focus ring.
The existing semantic tokens adapt to all palettes and light/dark themes.
Tabs without an explicit color retain the existing group styling. Disabled tabs
remain disabled and dimmed. Color is decorative, not a replacement for selection
or disabled semantics.

Applications should assign colors from a stable item identifier, never the list
index, so async insertion, reordering and fallback options retain their colors.
Locale identity and validation belong to the application; this component only
owns the generic visual styling. Consumers should use the published registry
package containing this API, without file dependencies or local package links.

Manual activation keeps keyboard focus separate from selection, allowing the
parent to confirm unsaved changes before accepting a new value. Render a real
`TabPanel` for the selected tab and give each `TabList` an accessible label.
The list reveals the selected tab after async option updates and viewport resizing
without scrolling the page or taking focus from the editor. Tab values must not
contain whitespace because Radix uses them in accessible ID references.

Textareas, including KeyValueEditor and JsonField fields, do not expose manual
resize handles. Set `rows` or layout dimensions; overflowing content scrolls.
The legacy Textarea `resize` prop remains accepted for source compatibility but
is ignored. Inline `style.resize` cannot re-enable dragging; other layout styles
such as height remain supported.
