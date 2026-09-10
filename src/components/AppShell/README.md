# AppShell

Shared application chrome: permanent or compact desktop navigation, floating
navigation that overlays rather than reflows content, and modal mobile navigation.
Consumes the same theme tokens as Page, NavTree, Drawer and PageTabs.

```tsx
<AppShell
  brand="Publishing Admin"
  brandIcon={<LayoutDashboard />}
  navigationLabel="Workspace navigation"
  navigationKey={pathname}
  navigation={({ collapsed, closeNavigation, expandNavigation }) => (
    <NavTree
      sections={authorizedSections}
      collapsed={collapsed}
      activeId={activeRoute}
      onItemSelect={item => {
        if (collapsed && item.children?.length) expandNavigation();
      }}
      renderLink={(item, content, state) => (
        <Link to={item.href} className={state.className} onClick={closeNavigation}>
          {content}
        </Link>
      )}
    />
  )}
  headerActions={accountActions}
  pageNavigation={openPages}
>
  <Outlet />
</AppShell>
```

- `sidebarMode` / `onSidebarModeChange` provide controlled state;
  `defaultSidebarMode` provides uncontrolled initial state (`expanded` by default).
- Modes: `expanded`, `compact`, `floating`. Floating expands on pointer hover or
  keyboard focus, preserving the compact content offset.
- Navigation render state includes `isMobile`, `collapsed`, `closeNavigation`
  and `expandNavigation`. Navigation appears in only one active location.
- Change `navigationKey` when a route commits to dismiss mobile navigation.
  Selection can dismiss it immediately using `closeNavigation`.
- Translate all six control names through `labels`: `expand`, `collapse`,
  `enableFloating`, `disableFloating`, `openNavigation`, `closeNavigation`.
- Desktop dimensions default to 260px sidebar, 70px rail and 60px header minimum.
  At 768px or below navigation becomes a modal drawer. Long header actions wrap;
  navigation scrolls independently. Reduced-motion preference disables reflow
  transitions. Escape and closing restore focus to the current header trigger.
- Brand is not a page heading. Children belong to the single `main` landmark;
  header actions and page navigation are outside it.
- Routing, permission filtering, authentication and unsaved-change guards belong
  to the consumer, not AppShell.

Consumers install the published `@novel-isr/ui` registry version, including its
`styles.css` export. Do not alias this source directory or use file/link dependencies.
