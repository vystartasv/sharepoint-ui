# SPFx template

This repository contains a small React SPFx 1.24 web part template built with native controls from `@spfx-fast/sharepoint-ui`. It demonstrates one labelled, required field and a visible save status. It contains no SharePoint data or business logic.

```sh
npx --yes @microsoft/spfx-cli@0.1.0-pre.3 create \
  --template sharepoint-ui-webpart \
  --template-url https://github.com/vystartasv/sharepoint-ui/tree/main \
  --library-name contoso-workspace \
  --component-name "Workspace" \
  --component-description "A simple SharePoint workspace form" \
  --solution-name contoso-workspace \
  --package-manager npm
```

The CLI and template API are still prerelease. The template pins SPFx package dependencies to 1.24.1.

The template creates a basic React web part with no data-service assumptions. Extend it with the SharePoint services and workflows your app requires.
