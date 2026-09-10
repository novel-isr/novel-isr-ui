# JsonField

Controlled strict-JSON text field. Uses the shared Textarea, IconButton, tooltip,
spacing and validation colors. No editor engine is required.

```tsx
<FormField label="Dictionary" helperText="Public translation dictionary" isDisabled={loading}>
  <JsonField value={text} onChange={setText} name="dictionary" rows={16} resize="vertical" />
</FormField>
```

- `value` and `onChange(value)` remain controlled. Native textarea attributes and
  events pass through; the ref targets the textarea. `className` targets the outer
  field for compatibility. Use `id` on the field, not the wrapper.
- Disabled, read-only and required states inherit from FormField. Disabled and
  read-only fields cannot format. Native form association/submission remains intact.
- Validation follows the latest value, including external reloads. While focused,
  syntax feedback is withheld so partially typed JSON does not show stale success
  or errors; blur validates the current value. Empty text is neutral, not valid JSON.
- Formatting is a non-submitting icon command accessible by Tab/Enter/Space and
  named by its tooltip. `formatLabel`, `validLabel`, `invalidLabel` are localizable.
  `hideToolbar` removes formatting controls, not associated syntax errors.
- `indent` defaults to 2, follows the 0-10 space range; 0 compacts whitespace.
  Formatting preserves numeric lexemes, string escapes, duplicate keys and key
  order. It never roundtrips values through JavaScript numbers. Already formatted
  text does not call `onChange` again.
- Comments and trailing commas are rejected, even though the formatting library
  supports JSONC. All JSON root types are accepted. Schema validation, permissions,
  async saves and dirty-state decisions belong to the consuming application.
- Error text is associated through `aria-describedby`. FormField business errors
  take precedence for `aria-invalid` while preserving syntax feedback. Text remains
  escaped React content; parsing/formatting never executes it.

Formatting uses Microsoft's [jsonc-parser text edits](https://github.com/microsoft/node-jsonc-parser).
