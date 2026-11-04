# @spfx-fast/sharepoint-ui

Native React controls and SharePoint-aware theme tokens for SharePoint Framework (SPFx). Controls use native HTML and inherit the active SharePoint theme. The package leaves SharePoint data access to your web part.

## Requirements

- React `18.3.1`, supplied by the SPFx host.

## Install

```sh
npm install @spfx-fast/sharepoint-ui
```

## Quick start

Import the stylesheet once in your web part, then wrap the controls in `SharePointThemeProvider`:

```tsx
import { Button, Field, Input, SharePointThemeProvider } from "@spfx-fast/sharepoint-ui/react";
import "@spfx-fast/sharepoint-ui/styles.css";

function RequestForm() {
  return <SharePointThemeProvider>
    <form>
      <Field id="title" label="Title" required>
        <Input name="title" required />
      </Field>
      <Button type="submit">Save</Button>
    </form>
  </SharePointThemeProvider>;
}
```

## Package entry points

| Import | Use |
| --- | --- |
| `@spfx-fast/sharepoint-ui/react` | React components and theme provider |
| `@spfx-fast/sharepoint-ui/styles.css` | Component and theme styles; import once |
| `@spfx-fast/sharepoint-ui/components.json` | Machine-readable component inventory |

The package provides presentation and interaction. Your web part owns SharePoint requests, permissions, business validation, uploads, and persistence.

## Theme and components

Buttons, inputs, selects, and action controls share a 44px minimum height. Customize the shared sizing and spacing variables on `.spui-theme`; see the [theme guide](https://vystartasv.github.io/sharepoint-ui/theming/).

- [Component guide and interactive examples](https://vystartasv.github.io/sharepoint-ui/components/)
- [Agent interaction guide](https://vystartasv.github.io/sharepoint-ui/agents/)
- [Build and deployment](https://vystartasv.github.io/sharepoint-ui/deployment/)

## Example SPFx project

The repository includes a minimal [SPFx 1.24 example](https://github.com/vystartasv/sharepoint-ui/tree/main/examples/spfx124-webpart) and a [starter template](https://github.com/vystartasv/sharepoint-ui/tree/main/templates/sharepoint-ui-webpart).
