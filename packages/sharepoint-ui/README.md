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

## SharePoint list workflows

Use `FilterBar` with `ListView` for labelled search and filters, empty/loading states, and paging. Add `ViewSwitcher` when users can choose between list and card layouts. These components keep query and paging state in the host app.

Use `FileDropzone` to collect selected or dropped files and `AttachmentList` to show upload status and remove actions. Upload files through the host's SPFx service; validate files on the host before saving.

Each control exposes native roles and visible labels. For browser agents, locate controls by role and accessible name first, then use `data-agent-id` only when names are duplicated. See the [agent interaction guide](https://vystartasv.github.io/sharepoint-ui/agents/) for locator and verification examples.
