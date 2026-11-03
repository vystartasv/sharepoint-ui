# SPFx CLI template

This repository contains a custom template for a framework-free SPFx 1.24 Copilot UX component built with `@spfx-fast/sharepoint-ui`.

```sh
npx --yes @microsoft/spfx-cli@0.1.0-pre.3 create \
  --template spfx-fast-copilot-access-review \
  --template-url https://github.com/vystartasv/sharepoint-ui/tree/main \
  --library-name spfx-fast-access-review \
  --component-name "Access review" \
  --component-alias AccessReviewCopilotComponent \
  --component-description "Read and approve SharePoint access-review items inside Copilot" \
  --solution-name spfx-fast-access-review \
  --package-manager npm
```

The CLI and template API are still prerelease. The built-in template metadata schema currently has no `copilotComponent` category, so this template is listed under `webpart`; it creates a Copilot UX component and declarative agent, not a SharePoint page web part. The template pins SPFx package dependencies to 1.24.1.

The `template.json` metadata pins the generated solution to SPFx 1.24.1, so no `--spfx-version` flag is needed. `--template-url` selects this repository as the source and avoids an unrelated lookup against the CLI's default Microsoft template branch. For offline/local use from a repository checkout, replace `--template-url` with `--local-source ./templates`. The template contents are generated from the buildable sample by `npm run sync:spfx-cli-template`; edit the sample first, then regenerate the CLI template.
