# Page Tabs

PageTabs presents open application routes, not in-page ARIA tab panels. The
application owns navigation, permissions, pinning, closing and unsaved changes.

- PageTab owns the complete hover/selected surface, including the area around
  its separate action. Selection retains the bottom indicator during hover.
- Route labels do not inherit the generic Button pressed-scale animation.
- Each enabled label uses the shared Tooltip for pointer hover and keyboard
  focus, positioned below the label and rendered outside the scrolling viewport.
  Escape dismisses the tooltip. There is no duplicate native title attribute.
- Long titles retain ellipsis in the fixed-width item; the tooltip wraps the
  full title, including unbroken words, within the viewport.
- Disabled route labels do not activate or display a tooltip. The separate
  action retains its own enabled/disabled contract and IconButton tooltip.
- PageTab forwards its ref and context-menu events to the item wrapper. Its
  action is a sibling of the label button, never a nested interactive control.

Use `tests/browser/page-tabs-presentation.mjs` against a built package to check
light/dark hover states, pressed geometry, tooltips, long labels, disabled items
and action isolation at 320/390/1280px. `PLAYWRIGHT_MODULE` can point to an
existing Playwright module; it is not a runtime UI dependency.
