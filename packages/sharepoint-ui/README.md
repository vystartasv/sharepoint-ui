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

Buttons, inputs, selects, and action controls share a 44px minimum height. Labels, disclosure rows, and component actions use the same target height. Text areas remain taller for multi-line content; checkbox, radio, and switch marks keep their natural shape. Customize `--spui-control-height`, `--spui-control-padding-inline`, and the `--spui-space-*` scale on `.spui-theme`.
