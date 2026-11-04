# Quick start

Import components from `@spfx-fast/sharepoint-ui/react`, the stylesheet once, and wrap the app in `SharePointThemeProvider`.

```tsx
import { Button, Card, Checkbox, Field, Input, SharePointThemeProvider } from "@spfx-fast/sharepoint-ui/react";
import "@spfx-fast/sharepoint-ui/styles.css";

<SharePointThemeProvider>
  <Card>
    <Field id="person-name" label="Name" required><Input name="name" required /></Field>
    <label><Checkbox name="remember" /> Remember me</label>
    <Button>Save</Button>
  </Card>
</SharePointThemeProvider>
```

Use role and accessible name locators such as `getByRole("textbox", { name: "Name" })`. Add `data-agent-id` when the page has duplicate names.
