# Quick start

Import components from `@spfx-fast/sharepoint-ui/react`, the stylesheet once, and wrap the app in `SharePointThemeProvider`.

```tsx
import { Button, Card, Input, SharePointThemeProvider } from "@spfx-fast/sharepoint-ui/react";
import "@spfx-fast/sharepoint-ui/styles.css";

<SharePointThemeProvider>
  <Card><Input aria-label="Name" /><Button>Save</Button></Card>
</SharePointThemeProvider>
```
