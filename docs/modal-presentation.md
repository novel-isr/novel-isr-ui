# Modal presentation

Modal owns the shared layout for confirmation text and scrollable forms.
Consumers supply business copy, pending state and action handlers.

- Plain titles, descriptions and body text wrap long identifiers. Nested `pre`
  content retains its own whitespace and horizontal scrolling.
- A rendered close button reserves title clearance; hiding it removes that space.
- Footer actions wrap within the available width, including long Button labels.
- Direct form and fieldset wrappers follow the description and preserve body
  scrolling with the footer outside that scroll area.
- Oversized titles, descriptions and footers have viewport-bounded scrolling so
  they cannot consume the entire dialog on a short mobile screen.

The simple controlled Modal restores focus to its opening element when that
element still exists. The compound API continues to delegate focus management
and custom autofocus handlers to Radix.

## Verification

```sh
pnpm test
pnpm type-check
pnpm build
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node tests/browser/modal-presentation.mjs
```

The browser fixture uses the built package and shared theme. It covers modal
geometry, long text, code scrolling, form reading order and submission, focus
trapping and restoration, plus LoadingState sizes and reduced motion. It checks
light/dark themes at desktop, mobile and short mobile viewports. All traffic is
restricted to its local fixture server; no application API is called.
