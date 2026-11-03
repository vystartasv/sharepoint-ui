import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "provider-label-localization.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `
      import * as React from "react";
      import { createRoot } from "react-dom/client";
      import { Breadcrumb, ComboBox, ComboOption, DataGridSelectionCell, Dialog, Hamburger, MenuBar, SharePointUIProvider, SplitButton, SplitNavItem, TableResizeHandle, Toolbar, VirtualList, Virtualizer, DataGrid, TagPicker, TagPickerOption, RichTextEditor } from "${resolve("packages/sharepoint-ui/src/react.tsx")}";
      function App() {
        return <SharePointUIProvider lang="lt" strings={{ toolbarLabel: "Įrankių juosta", breadcrumbLabel: "Naršymo kelias", menuBarLabel: "Meniu juosta", splitButtonMenuLabel: "Daugiau parinkčių", navigationToggle: "Perjungti navigaciją", splitNavItemActionLabel: "Daugiau veiksmų", virtualizerLabel: "Elementai", dataGridSelectRow: "Pasirinkti eilutę", tableResizeHandle: "Keisti stulpelio dydį", dataGridLabel: "Duomenų tinklelis", dataGridFilterLabel: "Ieškoti eilučių", dataGridSelectAll: "Pasirinkti visas eilutes", dataGridRowLabel: "eilutė", dataGridResizeLabel: "Keisti stulpelio dydį", dataGridReorderLabel: "Perkelti stulpelį", dataGridEmptyLabel: "Nėra įrašų", selectedOptionsLabel: "Pasirinktos parinktys", dialogLabel: "Dialogas", richTextEditorLabel: "Raiškiojo teksto redaktorius" }}>
          <RichTextEditor data-testid="localized-rich-text" />
          <RichTextEditor data-testid="override-rich-text" editorLabel="Custom editor label" />
          <RichTextEditor data-testid="label-rich-text" label="Visible editor label" />
          <RichTextEditor data-testid="aria-rich-text" aria-label="Custom accessible editor" />
          <Dialog data-testid="localized-dialog" open modal={false} />
          <Dialog data-testid="override-dialog" open modal={false} dialogLabel="Custom confirmation" />
          <Dialog data-testid="title-dialog" open modal={false} title="Import details" />
          <Toolbar data-testid="localized-toolbar" />
          <Toolbar data-testid="override-toolbar" label="Custom toolbar" />
          <Toolbar data-testid="aria-toolbar" aria-label="Custom toolbar aria" />
          <Breadcrumb data-testid="localized-breadcrumb" />
          <Breadcrumb data-testid="override-breadcrumb" label="Custom breadcrumb" />
          <MenuBar data-testid="localized-menu-bar" />
          <MenuBar data-testid="override-menu-bar" label="Custom menu bar" />
          <MenuBar data-testid="aria-menu-bar" aria-label="Custom menu aria" />
          <SplitButton data-testid="localized-split-button" menuItems={<span>Action</span>}>Save</SplitButton>
          <SplitButton data-testid="override-split-button" menuLabel="Custom options" menuItems={<span>Action</span>}>Save</SplitButton>
          <Hamburger data-testid="localized-hamburger" />
          <Hamburger data-testid="override-hamburger" label="Custom navigation toggle" />
          <SplitNavItem data-testid="localized-split-nav" value="home">Home</SplitNavItem>
          <SplitNavItem data-testid="override-split-nav" value="other" actionLabel="Custom actions">Other</SplitNavItem>
          <VirtualList data-testid="localized-virtual-list" itemCount={1} renderItem={() => "row"} />
          <VirtualList data-testid="override-virtual-list" itemCount={1} label="Custom items" renderItem={() => "row"} />
          <Virtualizer data-testid="localized-virtualizer" numItems={1} itemSize={40} virtualizerLength={1}>{() => "row"}</Virtualizer>
          <DataGridSelectionCell data-testid="localized-selection-cell" />
          <DataGridSelectionCell data-testid="override-selection-cell" label="Custom row selection" />
          <TagPicker data-testid="localized-tag-picker" label="People" defaultSelectedValues={["ava"]}><TagPickerOption value="ava">Ava Lovelace</TagPickerOption></TagPicker>
          <TagPicker data-testid="override-tag-picker" label="People" selectedLabel="Custom selected options" defaultSelectedValues={["ava"]}><TagPickerOption value="ava">Ava Lovelace</TagPickerOption></TagPicker>
          <ComboBox data-testid="localized-combobox" label="People" multiselect defaultSelectedOptions={["ava"]}><ComboOption value="ava">Ava Lovelace</ComboOption></ComboBox>
          <ComboBox data-testid="override-combobox" label="People" multiselect selectedLabel="Custom selected options" defaultSelectedOptions={["ava"]}><ComboOption value="ava">Ava Lovelace</ComboOption></ComboBox>
          <TableResizeHandle data-testid="localized-resize-handle" /><DataGrid data-testid="localized-data-grid" filterable selectionMode="multiple" resizableColumns reorderableColumns columns={[{ id: "name", label: "Name" }]} items={[{ id: "one", name: "Ada" }]} getRowId={item => item.id} />
          <TableResizeHandle data-testid="override-resize-handle" label="Custom resize" />
        </SharePointUIProvider>;
      }
      createRoot(document.querySelector("#root")).render(<App />);
    `,
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});

const server = createServer((request, response) => new URL(request.url, "http://localhost").pathname === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><main id='root'></main><script src='/bundle.js'></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  for (const [testId, expected] of [
    ["localized-toolbar", "Įrankių juosta"],
    ["override-toolbar", "Custom toolbar"],
    ["aria-toolbar", "Custom toolbar aria"],
    ["localized-breadcrumb", "Naršymo kelias"],
    ["override-breadcrumb", "Custom breadcrumb"],
    ["localized-menu-bar", "Meniu juosta"],
    ["override-menu-bar", "Custom menu bar"],
    ["aria-menu-bar", "Custom menu aria"],
  ]) {
    const element = page.getByTestId(testId);
    const attribute = testId.includes("breadcrumb") ? "label" : testId.includes("menu-bar") ? "aria-label" : "label";
    assert.equal(await element.getAttribute(attribute), expected, `${testId} resolves provider or explicit label`);
  }
  assert.equal(await page.getByRole("button", { name: "Daugiau parinkčių" }).count(), 1, "SplitButton reads the provider menu label");
  assert.equal(await page.getByRole("button", { name: "Custom options" }).count(), 1, "SplitButton explicit menu label wins");
  assert.equal(await page.getByTestId("localized-hamburger").getAttribute("aria-label"), "Perjungti navigaciją");
  assert.equal(await page.getByTestId("override-hamburger").getAttribute("aria-label"), "Custom navigation toggle");
  assert.equal(await page.locator("[data-testid=localized-split-nav] > button").getAttribute("aria-label"), "Daugiau veiksmų");
  assert.equal(await page.locator("[data-testid=override-split-nav] > button").getAttribute("aria-label"), "Custom actions");
  assert.equal(await page.getByTestId("localized-virtual-list").getByRole("list").getAttribute("aria-label"), "Elementai");
  assert.equal(await page.getByTestId("override-virtual-list").getByRole("list").getAttribute("aria-label"), "Custom items");
  assert.equal(await page.getByTestId("localized-virtualizer").getByRole("list").getAttribute("aria-label"), "Elementai");
  assert.equal(await page.getByTestId("localized-selection-cell").locator("input").getAttribute("aria-label"), "Pasirinkti eilutę");
  assert.equal(await page.getByTestId("override-selection-cell").locator("input").getAttribute("aria-label"), "Custom row selection");
  assert.equal(await page.getByTestId("localized-resize-handle").getAttribute("label"), "Keisti stulpelio dydį");
  assert.equal(await page.getByTestId("override-resize-handle").getAttribute("label"), "Custom resize");
  assert.equal(await page.getByTestId("localized-tag-picker").evaluate(element => element.shadowRoot.querySelector(".selected").getAttribute("aria-label")), "Pasirinktos parinktys", "TagPicker selected options group uses provider localization");
  assert.equal(await page.getByTestId("override-tag-picker").evaluate(element => element.shadowRoot.querySelector(".selected").getAttribute("aria-label")), "Custom selected options", "TagPicker selectedLabel overrides provider strings");
  assert.equal(await page.getByTestId("localized-combobox").evaluate(element => element.shadowRoot.querySelector(".selected").getAttribute("aria-label")), "Pasirinktos parinktys", "ComboBox selected options group uses provider localization");
  assert.equal(await page.getByTestId("override-combobox").evaluate(element => element.shadowRoot.querySelector(".selected").getAttribute("aria-label")), "Custom selected options", "ComboBox selectedLabel overrides provider strings");
  assert.equal(await page.getByTestId("localized-rich-text").evaluate(element => element.shadowRoot.querySelector("[role=textbox]").getAttribute("aria-label")), "Raiškiojo teksto redaktorius", "RichTextEditor fallback textbox label uses provider localization");
  assert.equal(await page.getByTestId("override-rich-text").evaluate(element => element.shadowRoot.querySelector("[role=textbox]").getAttribute("aria-label")), "Custom editor label", "RichTextEditor editor-label overrides provider strings");
  assert.equal(await page.getByTestId("label-rich-text").evaluate(element => element.shadowRoot.querySelector("[role=textbox]").getAttribute("aria-label")), "Visible editor label", "RichTextEditor visible label names textbox");
  assert.equal(await page.getByTestId("aria-rich-text").evaluate(element => element.shadowRoot.querySelector("[role=textbox]").getAttribute("aria-label")), "Custom accessible editor", "RichTextEditor aria-label takes precedence");
  assert.equal(await page.getByTestId("localized-dialog").evaluate(element => element.shadowRoot.querySelector(".fallback-title").textContent), "Dialogas", "Dialog fallback heading uses provider localization");
  assert.equal(await page.getByTestId("override-dialog").evaluate(element => element.shadowRoot.querySelector(".fallback-title").textContent), "Custom confirmation", "Dialog dialogLabel overrides provider strings");
  assert.equal(await page.getByTestId("title-dialog").evaluate(element => element.shadowRoot.querySelector(".fallback-title").textContent), "Import details", "Dialog title prop takes precedence over its fallback label");
  const localizedGrid = page.getByTestId("localized-data-grid");
  assert.equal(await localizedGrid.getByRole("grid").getAttribute("aria-label"), "Duomenų tinklelis");
  assert.equal(await localizedGrid.getByRole("searchbox").getAttribute("aria-label"), "Ieškoti eilučių");
  assert.equal(await localizedGrid.getByRole("checkbox", { name: "Pasirinkti visas eilutes" }).count(), 1);
  assert.equal(await localizedGrid.getByRole("checkbox", { name: "Pasirinkti eilutę 1" }).count(), 1);
  assert.equal(await localizedGrid.getByRole("button", { name: "Perkelti stulpelį Name" }).count(), 1);
  assert.equal(await localizedGrid.getByRole("separator", { name: "Keisti stulpelio dydį Name" }).count(), 1);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", localizedDefaults: ["Toolbar", "Breadcrumb", "MenuBar", "SplitButton", "Hamburger", "SplitNavItem", "VirtualList", "Virtualizer", "DataGridSelectionCell", "TableResizeHandle", "TagPicker", "ComboBox", "Dialog", "RichTextEditor"], explicitLabelOverrides: true, ariaLabelOverrides: true, pageErrors: errors }));
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
