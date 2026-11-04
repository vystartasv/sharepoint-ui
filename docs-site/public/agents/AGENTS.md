# SharePoint UI: agent interaction contract

The library wraps native HTML. The accessibility tree and browser-native form behavior are the stable interface.

## Locator order

1. Role plus accessible name: `getByRole("button", { name: "Save" })`.
2. Associated visible label: `getByLabel("Work item title")`.
3. Stable `data-agent-id` for duplicate names: `locator('[data-agent-id="save-work-item"]')`.

Avoid CSS classes, DOM position, and coordinates when a semantic locator is available.

## Interact and verify

- Buttons: use a clear verb and click; verify the resulting `status` or `alert`.
- Text inputs: fill the associated textbox; check `required` and validation messages.
- Selects: select the option by its visible value.
- Checkboxes: check/uncheck; switches represent immediate on/off preferences.
- Radios: choose one named option in a labelled group.
- Links: inspect the link name and destination before navigating.
- Dialogs and popovers: open by their named trigger; close with the named button or Escape; verify focus returns.

```ts
await page.getByRole("textbox", { name: "Work item title" }).fill("Update the team site");
await page.getByRole("combobox", { name: "Status" }).selectOption("In progress");
await page.getByRole("checkbox", { name: "Notify the owner" }).check();
await page.getByRole("button", { name: "Save work item" }).click();
await expect(page.getByRole("status")).toContainText("Saved");
```

Every state-changing action should be followed by checking the visible value or live status. Do not treat a successful click as proof the task completed.

## Choose the element

Read `/components/` or the published `@spfx-fast/sharepoint-ui/components.json` before coding. Choose by user task: `Field` + `Input` for a labelled value, `Select` for one fixed choice, `RadioGroup` for one-of-many, `TagPicker` for multiple values, `DataGrid` for sortable/selectable rows, and `VirtualList` for large fixed-height collections. Use `PersonPicker` and `LookupPicker` with results loaded by the host.

The package does not read, write, or upload SharePoint data. Use the host web part's existing SPFx service and verify the visible saved value afterward.

The package adds no automation API. Components accept native `aria-*`, `data-*`, and event props, so agents can use the same selectors and actions as users.
