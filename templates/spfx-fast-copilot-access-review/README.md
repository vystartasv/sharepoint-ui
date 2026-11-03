# <%= componentName %> for SharePoint and Copilot

Framework-free SPFx 1.24.1 Copilot UX component using SharePoint UI. It reads the signed-in user's latest access-review items, supports local filtering and RTL, applies SharePoint theme tokens, saves user-approved changes with `SPHttpClient`, and keeps Copilot informed of the visible state.

## List fields

Create a SharePoint list with the default `Title` field and a single-line text `Status` field. Use `Pending` and `Approved` values. Pass the list ID when the agent asks for it. Users need edit access to approve.

## Run

```sh
npm install
npm run build
npm start
```

Set `{tenantDomain}` in `config/serve.json` before running the local Copilot Workbench. Deploy the resulting `.sppkg` to the tenant App Catalog and follow Microsoft's [Copilot UX deployment guide](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/copilot/get-started/build-your-first-copilot-app).

The example uses direct imports of Button, SearchBox, Tag, and ViewCard; React is not required. Approval is reported as saved only after SharePoint confirms the update.
