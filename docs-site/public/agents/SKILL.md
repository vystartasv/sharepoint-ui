---
name: sharepoint-ui
description: Build or change accessible, theme-aware SharePoint Framework interfaces with @spfx-fast/sharepoint-ui. Use when an SPFx web part needs reusable controls, SharePoint-style cards, tokens, RTL, custom elements, or rich text saved through SharePoint.
---

# SharePoint UI component skill

Use the package manifest at [`components.json`](https://vystartasv.github.io/sharepoint-ui/agents/components.json) to find exact React names, custom-element tags, and leaf entry points. The source repository checks it with `npm run catalog:check --workspace @spfx-fast/sharepoint-ui`. Use the package's TypeScript declarations as the final API authority. Do not infer that an unlisted Fluent v9 component exists; the library is still growing toward parity.

For a fast composition guide, read [choosing components](references/choosing-components.md). For theme, locale, RTL, forms, and persistence rules, read [SharePoint patterns](references/sharepoint-patterns.md).

Prefer leaf imports. Keep SharePoint permissions, data fetching, and writes in an SPFx service. Controls emit state; they do not save records implicitly. Validate keyboard use, theme contrast on the target surface, and RTL when relevant.
