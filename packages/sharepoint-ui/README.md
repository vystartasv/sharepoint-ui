# @spfx-fast/sharepoint-ui

Native React components and SharePoint-derived theme tokens for SPFx.

```sh
npm install @spfx-fast/sharepoint-ui
```

React `18.3.1` is a peer dependency supplied by the SPFx host.

```tsx
import { Button, Field, Input, SharePointThemeProvider } from "@spfx-fast/sharepoint-ui/react";
import "@spfx-fast/sharepoint-ui/styles.css";

function RequestForm() {
  return <SharePointThemeProvider>
    <Field id="title" label="Title" required>
      <Input name="title" required />
    </Field>
    <Button>Save</Button>
  </SharePointThemeProvider>;
}
```

The package provides presentation and interaction only. The host owns SharePoint requests, permissions, validation, and persistence. See the [component guide](https://vystartasv.github.io/sharepoint-ui/components/), [theme guide](https://vystartasv.github.io/sharepoint-ui/theming/), and [agent guide](https://vystartasv.github.io/sharepoint-ui/agents/).
