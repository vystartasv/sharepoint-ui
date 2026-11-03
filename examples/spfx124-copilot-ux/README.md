# SharePoint UI in Microsoft 365 Copilot

A no-React SPFx 1.24.1 Copilot UX component that reads the signed-in user's SharePoint list, renders reviews with SharePoint UI custom elements, saves approvals through SPFx `SPHttpClient`, and sends the visible state to Copilot's model context bridge.

This shows the library's specific strength: one small, framework-free component joins SharePoint data, tenant theme tokens, RTL locale, and an interactive Copilot surface. It uses leaf imports so unrelated library components are not registered or bundled.

## List setup

Create a SharePoint list with:

- `Title` (the default text field)
- `Status` (single line of text; use `Pending` and `Approved`)

Copy the list ID from **List settings**. The declarative agent passes that ID to the component. The component reads only the 25 most recently modified items, filters them locally, and saves an approval by updating `Status`. SharePoint permissions remain the authorization boundary; users need edit permission to approve.

## Build and run

Use Node.js 22.14+, 24.x, or 26.x and an SPFx 1.24.1 development tenant with Microsoft 365 Copilot:

```sh
npm install
npm run build
npm start
```

The build emits `sharepoint/solution/spfx-fast-access-review.sppkg`. Deploy it to the tenant App Catalog, enable the app for the tenant, and follow Microsoft's [SPFx Copilot component deployment guide](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/copilot/get-started/build-your-first-copilot-app) to register the declarative agent. The component requires a licensed Microsoft 365 Copilot user. `npm start` serves the local SPFx component; Copilot host functionality is available only in the real tenant host.

Before `npm start`, replace `{tenantDomain}` in `config/serve.json` with your SharePoint tenant host so SPFx opens the tenant's Copilot Workbench.

The Copilot agent asks for the target list ID when it is not already known. Approval is written only after a user selects **Approve**; the component reports success only after SharePoint accepts the update.

## What this demonstrates

- SPFx 1.24.1 Copilot UX component with inline/fullscreen host modes
- React-free direct custom-element composition (`ViewCard`, `Tag`, `Button`, `SearchBox`)
- SharePoint `ThemeProvider` and Fluent theme tokens applied to the library elements
- SPFx culture-driven LTR/RTL layout
- Authenticated SharePoint list reads and updates through `SPHttpClient`
- `copilotBridge.updateModelContextAsync` kept in sync with visible items and saved status
- Leaf imports that keep registration and bundle work scoped to the components used

The docs page also has a license-free interactive preview with illustrative records. It is separate from this tenant-connected project.
