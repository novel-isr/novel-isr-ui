# Tabs

Use `variant="pills"` for flat, separated child-view tabs. `colorScheme` accepts
`brand` (default), `gray`, `success`, `warning`, or `danger`; semantic tokens follow
the active palette and light/dark theme. Existing `line`, `enclosed`, and `soft`
variants remain available.

```tsx
<Tabs value={language} onValueChange={setLanguage} variant="pills" colorScheme="brand" activationMode="manual">
  <TabList aria-label="Languages">
    <Tab value="en">English</Tab>
    <Tab value="ja">Japanese</Tab>
  </TabList>
  <TabPanel value={language}>{editor}</TabPanel>
</Tabs>
```

Manual activation keeps keyboard focus separate from selection, allowing the
parent to confirm unsaved changes before accepting a new value. Render a real
`TabPanel` for the selected tab and give each `TabList` an accessible label.
The list reveals the selected tab after async option updates and viewport resizing
without scrolling the page or taking focus from the editor. Tab values must not
contain whitespace because Radix uses them in accessible ID references.

Textareas, including KeyValueEditor and JsonField fields, do not expose manual
resize handles. Set `rows` or layout dimensions; overflowing content scrolls.
The legacy Textarea `resize` prop remains accepted for source compatibility but
is ignored.
