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
          <Button slot="action" onClick={() => openRequest(request.id)}>Open</Button>
        </ViewCard>
      ))}
    </SharePointUIProvider>
  );
}
```

In the web part, pass `this.context.pageContext.cultureInfo.currentUICultureName` as `locale`. For a single control, import its React export from `/react`; import only what the view uses.

## Another framework or plain HTML

Import only the component’s leaf factory, register it once, then use its documented custom-element tag and events:

```ts
import { defineButton } from "@spfx-fast/sharepoint-ui/elements/button";

defineButton();
```

```html
<spui-button appearance="primary">Open</spui-button>
```

## Build from a component page

1. Copy the React export or custom-element tag and its property/slot table.
2. Use the matching component JSON slice linked from that page for exact types and callbacks.
3. Keep app state and persistence in the host; connect documented callbacks to it.

The same pattern applies across components. Add `SharePointUIProvider` once at the view root for React; custom elements inherit theme and direction from their host context. Use the human component page for a rendered example and this package’s `components.json` for machine-readable API data.
