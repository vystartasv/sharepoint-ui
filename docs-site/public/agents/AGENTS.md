# SharePoint UI agent contract

Use native roles and accessible names. Use `data-agent-id` only to disambiguate repeated names. Verify a visible value or status after every state-changing action.

```ts
await page.getByRole("textbox", { name: "Work item title" }).fill("Update the team site");
await page.getByRole("button", { name: "Save work item" }).click();
await expect(page.getByRole("status")).toContainText("Saved");
```

Choose controls by task:

- Labelled value: `Field` with `Input` or `TextArea`.
- One choice: `Select` or `RadioGroup`; independent toggle: `Checkbox`.
- Search and results: `FilterBar` with `ListView`; add `ViewSwitcher` for alternate layouts.
- File selection and status: `FileDropzone` with `AttachmentList`.
- People and lookups: `PersonPicker` or `LookupPicker` with options loaded by the host.

Read `/components/` or `@spfx-fast/sharepoint-ui/components.json` for the current inventory. Each component page includes a live example and source link. The package does not access SharePoint. Use the host service for reads, writes, permissions, and uploads.

Buttons, single-line inputs, and selects share a 40px minimum height. Text areas stay taller; use the theme guide's CSS variables to customize sizing.
