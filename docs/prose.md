# Prose

`Prose` provides unframed, theme-aware typography for semantic HTML. It does not
parse Markdown, sanitize HTML, change the document, or add heading IDs.

```tsx
<Prose><h1>Article title</h1><p>Article body</p></Prose>
<Prose asChild><EditorContent editor={editor} /></Prose>
```

Native div props, events and refs are forwarded. `asChild` uses Radix Slot, so an
existing editor host receives the class without an extra wrapper. Explicit author
inline colors, fonts, alignment and highlights remain authoritative. Sanitize
untrusted HTML before rendering it; Prose is only a presentation boundary.

Headings, paragraphs, lists, quotes, links, inline code, code blocks, images,
captions and tables share typography and palette tokens. Highlight.js classes use
readable semantic colors, including ordinary foreground for operators and punctuation.
No gradient, generated quote/language badge, shadow or image hover transform is added.

Code blocks scroll horizontally without reflowing source whitespace. Wide tables
keep native table display and intrinsic sizing: the enclosing document/engine must
provide a horizontal scroll region when the table cannot fit. In an editor, retain
engine-specific selection, resize, placeholder and task-node styles in its adapter.

The component has no padding or decorative surface. Use the existing layout/surface
components for the surrounding document or editing tool.

## Sass Adapter API

`@novel-isr/ui/prose.scss` is the typography style API for third-party controlled
DOM. It exports the same `prose` mixin used by the React component and emits no CSS
until included. Use a registry semver dependency on `@novel-isr/ui`.

```scss
@use '@novel-isr/ui/prose.scss' as typography;

.editor-host {
  @include typography.prose;
}
```

Also load `@novel-isr/ui/styles.css` in the application for the required `--ui-*`
tokens. The standalone Sass file imports no tokens or engine styles. The example
requires a Sass integration that resolves package exports (such as Vite).

Body font defaults and heading padding/borders are explicit, with low-specificity
semantic selectors and no `!important`. The adapter owns parent specificity and
stylesheet order when overriding an engine theme. Keep engine controls, line
numbers, selection, resize handles, placeholders and task nodes in that adapter;
the mixin does not implement those behaviors. Author inline formatting still wins.
