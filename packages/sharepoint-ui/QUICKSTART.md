# Quick start

Import components from `@spfx-fast/sharepoint-ui/react`, the stylesheet once, and wrap the app in `SharePointThemeProvider`.

```tsx
import { Button, Card, Checkbox, Input, SharePointThemeProvider } from "@spfx-fast/sharepoint-ui/react";
import "@spfx-fast/sharepoint-ui/styles.css";

<SharePointThemeProvider>
  <Card><Input aria-label="Name" /><label><Checkbox /> Remember me</label><Button>Save</Button></Card>
</SharePointThemeProvider>
```
