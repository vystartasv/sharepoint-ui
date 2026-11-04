# SharePoint UI agent contract

Use native roles and accessible names. Scope locators to a named form, dialog, or region when controls repeat. Use `data-agent-id` only when accessible names still cannot distinguish the target; the host app supplies the attribute because the library does not generate IDs. Verify a visible value or status after every state-changing action.

```ts
await page.getByRole("textbox", { name: "Work item title" }).fill("Update the team site");
await page.getByRole("button", { name: "Save work item" }).click();
await expect(page.getByRole("status")).toContainText("Saved");
```

The example below describes a host application's work item form. These labels and save action are not built into the library. Choose controls by task:

- Labelled value: `Field` with `Input` or `TextArea`.
- One choice: `Select` or `RadioGroup`; independent toggle: `Checkbox`.
- Search and results: `FilterBar` with `ListView`; add `ViewSwitcher` for alternate layouts.
- File selection and status: `FileDropzone` with `AttachmentList`.
- People and lookups: `PersonPicker` or `LookupPicker` with options loaded by the host.

Read `/components/` or `@spfx-fast/sharepoint-ui/components.json` for the current inventory. Each component page includes a live example and source link. Components render UI and report events; they do not fetch or persist SharePoint data. Use the host service for reads, writes, permissions, and uploads.

Buttons, single-line inputs, and selects share a 44px minimum height. Text areas stay taller; use the theme guide's CSS variables to customize sizing.
