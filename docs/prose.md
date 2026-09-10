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
