# SPFx web part starter

Create a React web part from this template with the SPFx CLI:

```sh
npx --yes @microsoft/spfx-cli@0.1.0-pre.4 create \
  --template sharepoint-ui-webpart \
  --template-url https://github.com/vystartasv/sharepoint-ui \
  --library-name contoso-workspace \
  --component-name Workspace \
  --component-description "Workspace form" \
  --solution-name contoso-workspace \
  --package-manager npm
```

The starter uses SPFx 1.24.1, React 18.3.1, and `@spfx-fast/sharepoint-ui`. Replace its local demo state with the SharePoint services your app needs.

The SPFx CLI is prerelease software; check its current Node.js requirements before running it.
