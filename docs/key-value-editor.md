# Key Value Editor

`KeyValueEditor` edits an ordered, controlled list of string pairs. It renders a
`div`, so it can live inside `FormLayout` or an existing form. Add/remove actions
use the library's `Button` and `IconButton` with `type="button"`.

```tsx
import { useState } from 'react';
import { FormLayout, KeyValueEditor, type KeyValueEntry } from '@novel-isr/ui';

export function DictionaryFields() {
  const [entries, setEntries] = useState<KeyValueEntry[]>([
    { id: 'greeting', key: 'greeting', value: 'Hello\nworld' },
  ]);
  return <FormLayout>
    <KeyValueEditor
      entries={entries}
      onChange={setEntries}
      keyLabel="Translation key"
      valueLabel="Translation"
      addLabel="Add translation"
      removeLabel="Remove translation"
    />
  </FormLayout>;
}
```

## API

```ts
interface KeyValueEntry {
  id: string;
  key: string;
  value: string;
}

interface KeyValueEntryErrors {
  key?: string;
  value?: string;
}

interface KeyValueEditorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> {
  entries: KeyValueEntry[];
  onChange: (entries: KeyValueEntry[]) => void;
  disabled?: boolean;
  keyLabel?: string;     // "Key"
  valueLabel?: string;   // "Value"
  addLabel?: string;     // "Add entry"
  removeLabel?: string;  // "Remove entry"
  errors?: Record<string, KeyValueEntryErrors>;
}
```

The component and all three types are exported from `@novel-isr/ui`.

- The parent must pass each emitted array back as `entries`. Edits do not mutate
  supplied entries. Duplicate and empty keys are preserved; validation,
  serialization, persistence and translations belong to the consumer.
- Supply unique, stable IDs for initial entries, independent of editable keys.
  New blank rows receive IDs from React `useId` plus a monotonic counter, checked
  against the current entries. Preserve these IDs when accepting changes.
- Values use `Textarea rows={2}`. Keys use `Textarea rows={1}` to preserve legacy
  multiline keys. Both allow vertical resizing. LF newlines, whitespace and empty
  strings are retained during edits; native textareas normalize CRLF/CR to LF.
- Field labels have a visually hidden, one-based row number: `Key 1`, `Value 1`.
  Remove controls use `${removeLabel} ${index + 1}` for their accessible names
  and shared tooltips. Label props support consumer-provided localized strings.
- `disabled` disables both fields and all add/remove controls. Empty lists and
  removing the final row are supported.
- Errors are keyed by entry ID, for example
  `errors={{ greeting: { key: 'Duplicate key', value: 'Translation required' } }}`.
  Each field uses `isInvalid={Boolean(error)}` and the shared `FormField` error
  association. Errors follow entries when they are reordered.
- Fields are side by side in wide containers and stacked when the editor is
  400px wide or less, including narrow columns on desktop. Labels and errors wrap.

## Verification

Unit coverage is in `src/components/__test__/KeyValueEditor.test.tsx`.
After `pnpm build`, run `node tests/browser/key-value-editor.mjs` for rendered
layout, multiline edits, form integration and light/dark checks. The browser
test waits for theme/focus transitions before checking computed field colors
against theme tokens and capturing normal/focused-error screenshots. It also
compares Input and covers filled, disabled and unstyled Textarea states. Set
`PLAYWRIGHT_MODULE` to an existing Playwright module when needed.
