# @spfx-fast/sharepoint-ui

Theme-aware UI components for SharePoint Framework 1.24. React 18.3.1+ is optional; custom elements work without React.

## Install

```sh
npm install @spfx-fast/sharepoint-ui
```

## React

```tsx
import { SharePointUIProvider, Button, TextField } from "@spfx-fast/sharepoint-ui/react";

export function Example() {
  return <SharePointUIProvider lang="en-GB">
    <TextField label="Work item" />
    <Button appearance="primary">Save</Button>
  </SharePointUIProvider>;
}
```

## Custom elements

```js
import { defineButton } from "@spfx-fast/sharepoint-ui/elements/button";
defineButton();
```

```html
<spui-button appearance="primary">Save</spui-button>
```

**Docs:** [component catalog](https://vystartasv.github.io/sharepoint-ui/) · **Agent quickstart:** [build from a component page](https://vystartasv.github.io/sharepoint-ui/agents/QUICKSTART.md) · **Agent references:** [instructions and API slices](https://vystartasv.github.io/sharepoint-ui/agents/)

The docs cover theming, RTL, accessibility, forms, rich-text persistence, and every component. See [AGENTS.md](./AGENTS.md) for agent guidance and [components.json](./components.json) for the API catalog.

For framework-independent theme helpers, import from `@spfx-fast/sharepoint-ui/theme`. Set `brandColor` in `SharePointUIDesignTheme` to derive coordinated accent, focus, selection, surface, hover, and border colors.

[MIT License](./LICENSE)
