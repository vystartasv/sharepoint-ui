# @spfx-fast/sharepoint-ui

Small themeable React components for SharePoint Framework. Uses native HTML and a compact semantic theme token set.

```sh
npm install @spfx-fast/sharepoint-ui
```

React 18.3.1 is a peer dependency supplied by the SharePoint Framework host.

## Usage

```tsx
import { Button, Card, Checkbox, Input, SharePointThemeProvider } from "@spfx-fast/sharepoint-ui/react";
import "@spfx-fast/sharepoint-ui/styles.css";

<SharePointThemeProvider>
  <Card>
    <Input aria-label="Search" placeholder="Search" />
    <label><Checkbox name="includeArchived" /> Include archived</label>
    <Button>Search</Button>
  </Card>
</SharePointThemeProvider>
```

The provider reads the SharePoint theme CSS variables from its host page. Override tokens with `theme` or ordinary CSS custom properties to customize the result.
