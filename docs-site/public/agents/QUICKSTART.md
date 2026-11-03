# SharePoint UI quickstart

Install `@spfx-fast/sharepoint-ui`. Use the component page’s React export, properties, slots, and callback table as the source of truth.

## React in an SPFx web part

Wrap the web part view once. Pass the current page culture; the provider applies the locale and text direction. Keep SharePoint reads, writes, and business rules in the web part.

```tsx
import { Button, SharePointUIProvider, ViewCard } from "@spfx-fast/sharepoint-ui/react";

type Request = { id: number; title: string; status: string };

export function RequestList({
  requests,
  locale,
  openRequest,
}: {
  requests: Request[];
  locale: string;
  openRequest: (id: number) => void;
}) {
  return (
    <SharePointUIProvider lang={locale}>
      {requests.map(request => (
        <ViewCard key={request.id} kind="list-item" title={request.title} description={request.status}>
          <Button slot="actions" onClick={() => openRequest(request.id)}>Open</Button>
        </ViewCard>
      ))}
    </SharePointUIProvider>
  );
}
```

In the web part, pass `this.context.pageContext.cultureInfo.currentUICultureName` as `locale`. For a single control, import its React export from `/react`; import only what the view uses.

Set `brandColor` on the provider theme to derive a coordinated accent, focus, selection, surface, hover, and border palette. Explicit design tokens override the derived values; see the [theme guide](https://vystartasv.github.io/sharepoint-ui/guides/theming-and-direction/).

## The shared component pattern

- Every React adapter is a named export from `@spfx-fast/sharepoint-ui/react`. React imports register the element automatically; do not call `defineX()` in React.
- Put `SharePointUIProvider` once around the view. Theme, font, locale, direction, and provider strings flow to descendants.
- Compose components with children. Use a named slot or a component-specific prop only when its page documents one; the `Slots` table shows the exact names.
- When an API has controlled state, pass its state prop and update it in the documented callback. `defaultX` supplies initial state where supported. State names and callback arguments are component-specific; copy them from that component’s page rather than guessing.
- Styling and host attributes belong on the component host. Use inherited theme tokens, documented CSS custom properties or `::part` hooks; do not target shadow-DOM internals.
- Keep labels, accessible names, and app behavior in the host view. The component handles its documented interaction and reports changes; the web part handles SharePoint data and persistence.

Use composition like this:

```tsx
import { Avatar, Button, Persona, Tooltip } from "@spfx-fast/sharepoint-ui/react";

export function RequestActions({ openRequest, photoUrl }: { openRequest: () => void; photoUrl: string }) {
  return (
    <>
      <Tooltip content="Opens the request details">
        <Button onClick={openRequest}>Open request</Button>
      </Tooltip>
      <Persona
        name="Ada Lovelace"
        primaryText="Ada Lovelace"
        secondaryText="Engineering"
        avatar={<Avatar name="Ada Lovelace" image={photoUrl} decorative />}
      />
    </>
  );
}
```

`Tooltip` uses its children as the trigger and its `content` as the tooltip. `Persona` accepts identity text directly and an optional composed `Avatar`. Other components follow the same import, provider, children, and host-styling rules; use their own page for their specific props, slots, and callback signatures. For Tooltip controlled visibility, use `open` with `onOpenChange`; `visible` and `onVisibleChange` remain compatibility aliases.

## Another framework or plain HTML

Import only the component’s leaf factory, register it once, then use its documented custom-element tag:

```ts
import { defineButton } from "@spfx-fast/sharepoint-ui/elements/button";

defineButton();
```

```html
<spui-button appearance="primary">Open</spui-button>
```

## SPFx 1.24 Copilot UX components

For a Copilot surface that reads SharePoint data, updates the visible-state context, and saves through `SPHttpClient`, use the [complete tenant-connected example](https://github.com/vystartasv/sharepoint-ui/tree/main/examples/spfx124-copilot-ux). It is framework-free and imports only the custom elements it uses.

## Build from a component page

1. Copy the React export or custom-element tag and its property/slot table.
2. Use the matching component JSON slice linked from that page for exact types and callbacks.
3. Use the shared `agentContract` included in every component JSON slice, then follow that component’s exact state props, callbacks, and slots.
4. Keep app state and persistence in the host; connect documented callbacks to it.

The same pattern applies across components. Add `SharePointUIProvider` once at the view root for React; custom elements inherit theme and direction from their host context. Each component slice links to its module event inventory. `detailPropertiesComplete` tells whether the listed event detail keys are exhaustive. Events are module-scoped: when several tags share a module, check the event target before handling them. Use the [component conventions guide](https://vystartasv.github.io/sharepoint-ui/guides/component-patterns/) for human-readable composition examples and the component page plus its JSON slice for exact APIs.
