# SharePoint patterns

## Theme and layout

Wrap a React surface in `SharePointUIProvider` and pass the SharePoint `ThemeProvider` values through `applySharePointTheme()` at the web-part boundary. Set the provider `lang`; it derives `dir` from the BCP 47 language tag. Set `dir` explicitly only to override that direction. Use tokens and CSS parts to customize; avoid copying a component's internal markup. Glass derives its values from the selected SharePoint/base appearance.

## Forms and events

Give every field a visible label. Use controlled values when the surrounding form owns state and wire the component's `onValueChange`/`onCheckedChange` callback. Native form behavior is used where possible; custom elements use `ElementInternals` where supported. Verify browser form reset and disabled behavior for the exact field before depending on it.

## SharePoint persistence

Use SPFx `SPHttpClient` or the project's existing data service for SharePoint requests. Show loading, success, and error states. Read important writes back and compare the saved result. `RichTextEditor` returns allowlist-normalized HTML; never render arbitrary saved HTML with unsanitized `innerHTML`.

## Agent handoff

State which controls were selected and why, list data fields and write locations, theme/locale assumptions, and the keyboard or tenant checks performed. Treat browser timing, host heap, and page long tasks as host-inclusive unless measured in isolation.
