# SharePoint UI

A compact React 18.3.1 component library for SharePoint Framework. It provides 59 native HTML components, SharePoint-derived semantic theme tokens, and controlled composites for common list and file workflows. React is a peer supplied by the SPFx host.

```sh
npm install @spfx-fast/sharepoint-ui
```

```tsx
import { Button, Field, Input, SharePointThemeProvider } from "@spfx-fast/sharepoint-ui/react";
import "@spfx-fast/sharepoint-ui/styles.css";

<SharePointThemeProvider>
  <Field id="request-title" label="Request title" required>
    <Input name="title" required />
  </Field>
  <Button>Save request</Button>
</SharePointThemeProvider>
```

The [component guide](https://vystartasv.github.io/sharepoint-ui/components/) has the full inventory and interactive samples. The [agent guide](https://vystartasv.github.io/sharepoint-ui/agents/) documents role and label locators, state verification, and workflow selection. The published `components.json` is the machine-readable component catalog.

```sh
npm install
npm ci
npm run build:library
npm run build:spfx
npm run build:docs
npm run measure:components
```

The `v*` tag workflow builds and publishes the package to npm. GitHub Pages deploys the docs site from `main`.
