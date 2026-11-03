import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "table-check.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `
      import * as React from "react";
      import { createRoot } from "react-dom/client";
      import { SharePointUIProvider, Table, TableHeader, TableBody, TableRow, TableHeaderCell, TableCell, TableCellLayout, TableCellActions, TableResizeHandle, TableSelectionCell, Button, createTableColumn } from "${resolve("packages/sharepoint-ui/src/react.tsx")}";
      import { defineTable } from "${resolve("packages/sharepoint-ui/src/elements/table.ts")}";
      window.mount = () => {
        window.tableScrollEvents = [];
        window.testColumn = createTableColumn({ columnId: "request", compare: (left, right) => left.localeCompare(right), renderHeaderCell: () => "Request", renderCell: item => item });
        defineTable();
        const native = document.createElement("spui-table"); native.setAttribute("aria-label", "Native requests"); native.setAttribute("dir", "rtl"); native.setAttribute("size", "small");
        const head = document.createElement("spui-table-header"), headRow = document.createElement("spui-table-row");
        const headCell = document.createElement("spui-table-header-cell"); headCell.textContent = "Owner"; headCell.setAttribute("sortable", ""); headCell.setAttribute("column-id", "owner");
        const nativeSortIcon = document.createElement("span"); nativeSortIcon.slot = "sort-icon"; nativeSortIcon.dataset.testid = "native-sort-icon"; nativeSortIcon.textContent = "↕"; headCell.append(nativeSortIcon); const resize = document.createElement("spui-table-resize-handle"); resize.slot = "aside"; resize.setAttribute("value", "120"); resize.setAttribute("min", "80"); resize.setAttribute("max", "160"); resize.setAttribute("label", "Resize owner column"); headCell.append(resize); headRow.append(headCell); head.append(headRow);
        const body = document.createElement("spui-table-body"), row = document.createElement("spui-table-row"); row.setAttribute("appearance", "none");
        const selection = document.createElement("spui-table-selection-cell"); selection.setAttribute("aria-label", "Select native request"); const nativeIndicator = document.createElement("span"); nativeIndicator.slot = "checkbox-indicator"; nativeIndicator.dataset.testid = "native-selection-indicator"; nativeIndicator.textContent = "✓"; selection.append(nativeIndicator);
        const cell = document.createElement("spui-table-cell"), layout = document.createElement("spui-table-cell-layout"); for (const [slot, text] of [["media", "👤"], ["main", "Native owner"], ["description", "Account owner"]]) { const content = document.createElement("span"); content.slot = slot; content.dataset.testid = "native-cell-" + slot; content.textContent = text; layout.append(content); } cell.append(layout); row.append(selection, cell); body.append(row); native.append(head, body); document.querySelector("#native").append(native);
        function App() {
          const [selected, setSelected] = React.useState(false); const [sort, setSort] = React.useState(undefined); const [resizeValue, setResizeValue] = React.useState(120);
          return <SharePointUIProvider appearance="ios" lang="ar" dir="rtl"><Table data-testid="react-table" aria-label="Requests" size="medium" appearance="dividers" onScrollCapture={event => window.tableScrollEvents.push(["capture", event.currentTarget.className, event.target.className, event.detail, event.view === window])} onScroll={event => window.tableScrollEvents.push(["bubble", event.currentTarget.className, event.target.className, event.detail, event.view === window])}>
            <TableHeader><TableRow><TableSelectionCell aria-label="Select all requests" checked={selected} onSelectionChange={setSelected} /><TableHeaderCell sortable columnId="owner" button={{className:"custom-owner-trigger","aria-label":"Sort owner"}} sortDirection={sort} sortIcon={<span data-testid="table-sort-icon">↑</span>} onSort={direction => { window.lastSortDirection = direction; setSort(direction); }}>Owner<TableResizeHandle value={resizeValue} min={80} max={160} label="Resize owner column" onResize={(_delta, value) => setResizeValue(value)} /></TableHeaderCell><TableHeaderCell>Request</TableHeaderCell></TableRow></TableHeader>
            <TableBody><TableRow selected={selected}><TableSelectionCell aria-label="Select request" checked={selected} checkboxIndicator={<span data-testid="react-selection-indicator">✓</span>} onSelectionChange={setSelected} /><TableCell><TableCellLayout appearance="primary" truncate media={{className:"custom-cell-media","data-testid":"cell-media",children:"👤"}} main={<span data-testid="cell-main" className="custom-cell-main">Vilius <TableCellActions visible><Button size="small">Open</Button></TableCellActions></span>} description={{className:"custom-cell-description","data-testid":"cell-description",children:"Account owner"}} /></TableCell><TableCell>Quarterly access review</TableCell></TableRow></TableBody>
          </Table><Table data-testid="flex-table" noNativeElements aria-label="Flex requests"><TableHeader><TableRow><TableHeaderCell sortable button={<button data-testid="custom-header-trigger" className="custom-title-trigger"/>} onSort={direction => {window.flexSort=direction}}>Title</TableHeaderCell></TableRow></TableHeader><TableBody><TableRow><TableCell>Flex content</TableCell></TableRow></TableBody></Table><div data-testid="default-main-layout"><TableCellLayout>Default main content</TableCellLayout></div></SharePointUIProvider>;
        }
        createRoot(document.querySelector("#react")).render(<App />);
      };
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

const server = createServer((request, response) => {
  if (new URL(request.url, "http://localhost").pathname === "/bundle.js") return response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents);
  return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><meta name=viewport content='width=device-width,initial-scale=1'><style>body{font:14px system-ui;background:#e8e8e8;padding:16px}#react,#native{background:#fff;padding:16px;margin-block:12px;max-width:720px}#react{overflow:auto}</style><div id=react></div><div id=native></div><script src=/bundle.js></script>");
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 800, height: 700 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.evaluate(() => window.mount());

  const table = page.getByTestId("react-table");
  const flexTable = page.getByTestId("flex-table");
  await table.evaluate(host => host.shadowRoot.querySelector(".viewport").dispatchEvent(new UIEvent("scroll", { bubbles: false, view: window, detail: 9 })));
  assert.deepEqual(await page.evaluate(() => window.tableScrollEvents), [
    ["capture", "viewport", "viewport", 9, true],
    ["bubble", "viewport", "viewport", 9, true],
  ], "React scroll handlers receive native non-bubbling shadow-root UIEvents in capture/bubble order");
  for (const slot of ["media", "main", "description"]) assert.ok(await page.getByTestId(`native-cell-${slot}`).isVisible(), `native TableCellLayout ${slot} slot renders`);
  assert.ok(await page.getByTestId("cell-media").isVisible(), "TableCellLayout media slot renders");
  assert.ok(await page.getByTestId("cell-main").isVisible(), "TableCellLayout main slot renders");
  assert.ok(await page.getByTestId("cell-description").isVisible(), "TableCellLayout description slot renders");
  assert.equal(await page.getByTestId("cell-media").getAttribute("class"), "custom-cell-media", "media slot props reach the rendered slot element");
  assert.equal(await page.getByTestId("cell-main").getAttribute("class"), "custom-cell-main", "custom main elements retain their attributes");
  assert.equal(await page.getByTestId("cell-description").getAttribute("class"), "custom-cell-description", "description slot props reach the rendered slot element");
  assert.equal(await page.getByTestId("default-main-layout").locator('[slot="main"]').textContent(), "Default main content", "children are composed through the main slot by default");
  assert.deepEqual(await page.evaluate(() => ({ columnId: window.testColumn.columnId, header: window.testColumn.renderHeaderCell(), cell: window.testColumn.renderCell("SR-2048"), compare: window.testColumn.compare("SR-2046", "SR-2048") })), { columnId: "request", header: "Request", cell: "SR-2048", compare: -1 });
  const native = page.getByRole("table", { name: "Native requests" });
  assert.equal(await table.getAttribute("role"), "table");
  assert.equal(await table.getByRole("rowgroup").count(), 2);
  assert.equal(await table.getByRole("row").count(), 2);
  assert.equal(await table.getByRole("columnheader").count(), 2);
  assert.equal(await table.getByRole("cell").count(), 4);
  assert.equal(await flexTable.getAttribute("role"), "table");
  assert.equal(await flexTable.getByRole("rowgroup").count(), 2, "noNativeElements preserves explicit rowgroup semantics");
  assert.equal(await flexTable.getByRole("row").count(), 2);
  assert.equal(await flexTable.getByRole("columnheader").count(), 1);
  assert.equal(await flexTable.getByRole("button", { name: "Title" }).getAttribute("class"), "custom-title-trigger", "button slot elements wrap projected heading content");
  assert.equal(await flexTable.getByRole("cell").count(), 1);
  assert.equal(await flexTable.locator(".viewport > .table").evaluate(node => getComputedStyle(node).display), "flex", "noNativeElements switches the table layout to flex");
  assert.equal(await flexTable.locator("spui-table-row").first().evaluate(node => getComputedStyle(node).display), "flex", "composed rows use the non-native flex layout");
  await flexTable.getByTestId("custom-header-trigger").click();
  assert.equal(await page.evaluate(() => window.flexSort), "ascending", "custom button slot keeps the sort interaction");
  assert.equal(await native.getByRole("row").count(), 2);
  assert.equal(await page.getByTestId("native-selection-indicator").getAttribute("data-checked"), "false");
  await native.getByRole("checkbox", { name: "Select native request" }).check();
  assert.equal(await page.getByTestId("native-selection-indicator").getAttribute("data-checked"), "true", "native custom indicator tracks the internal checkbox state");
  assert.equal(await native.getByRole("columnheader", { name: "Owner" }).getAttribute("aria-sort"), null);
  assert.equal(await native.getByRole("row").nth(1).evaluate(row => getComputedStyle(row).backgroundColor), "rgba(0, 0, 0, 0)", "appearance=none leaves the row surface transparent");

  const sortable = table.getByRole("columnheader", { name: "Owner" });
  assert.equal(await sortable.getByRole("button", { name: "Sort owner" }).getAttribute("class"), "custom-owner-trigger", "button slot props customize the built-in trigger");
  assert.ok(await page.getByTestId("table-sort-icon").isVisible(), "React sortIcon slot renders in the active sort control");
  assert.ok(await page.getByTestId("native-sort-icon").isVisible(), "native sortIcon slot renders in the active sort control");
  assert.equal(await sortable.getByTestId("table-sort-icon").isVisible(), true, "custom sort icon remains visible inside the custom button slot");
  await sortable.getByRole("button", { name: "Owner" }).click();
  await page.waitForFunction(() => window.lastSortDirection === "ascending");
  await page.waitForFunction(() => document.querySelector("[data-testid=react-table] spui-table-header-cell")?.getAttribute("sort-direction") === "ascending");
  assert.equal(await sortable.getAttribute("aria-sort"), "ascending", "sort callback updates controlled state");
  await sortable.evaluate(node => { node.setAttribute("sort-direction", "ascending"); });
  assert.equal(await sortable.getAttribute("aria-sort"), "ascending");
  await sortable.getByRole("button", { name: "Owner" }).click();
  await page.waitForFunction(() => document.querySelector("[data-testid=react-table] spui-table-header-cell")?.getAttribute("sort-direction") === "descending");
  assert.equal(await sortable.getAttribute("aria-sort"), "descending");

  const selection = table.getByRole("checkbox", { name: "Select request" });
  assert.equal(await page.getByTestId("react-selection-indicator").getAttribute("data-checked"), "false");
  await selection.check();
  assert.equal(await page.getByTestId("react-selection-indicator").getAttribute("data-checked"), "true", "custom indicator tracks controlled selection state");
  await page.waitForFunction(() => document.querySelectorAll("[data-testid=react-table] spui-table-row[selected]").length === 1);
  assert.equal(await page.getByRole("row").filter({ has: page.getByText("Quarterly access review") }).getAttribute("selected"), "true");
  assert.equal(await table.getByRole("checkbox", { name: "Select all requests" }).isChecked(), true);
  assert.equal(await table.getByRole("button", { name: "Open" }).count(), 1);

  const resize = table.getByRole("separator", { name: "Resize owner column" });
  assert.equal(await resize.getAttribute("aria-valuenow"), "120");
  await resize.focus(); await page.keyboard.press("ArrowRight");
  assert.equal(await resize.getAttribute("aria-valuenow"), "112", "RTL right arrow decrements the controlled width");
  assert.equal(await resize.getAttribute("aria-valuemin"), "80");
  const resizeBounds = await resize.boundingBox();
  assert.ok(resizeBounds);
  assert.ok(resizeBounds.width > 0 && resizeBounds.height > 0, "resize grip has a usable pointer hit area");
  await page.mouse.move(resizeBounds.x + resizeBounds.width / 2, resizeBounds.y + resizeBounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(resizeBounds.x + resizeBounds.width / 2 - 10, resizeBounds.y + resizeBounds.height / 2);
  await page.mouse.up();
  const pointerResult = await resize.getAttribute("aria-valuenow");
  assert.equal(pointerResult, "122", "RTL pointer drag grows the column toward the logical end");
  const nativeResize = native.getByRole("separator", { name: "Resize owner column" });
  await nativeResize.focus(); await page.keyboard.press("ArrowLeft");
  assert.equal(await nativeResize.getAttribute("aria-valuenow"), "128");

  await page.setViewportSize({ width: 390, height: 844 });
  const widths = await page.evaluate(() => { const container = document.querySelector("#react"), table = document.querySelector("[data-testid=react-table]"); const style = getComputedStyle(container); return { viewport: document.documentElement.clientWidth, reactTable: table.getBoundingClientRect().width, containerContent: container.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight), overflow: document.documentElement.scrollWidth }; });
  assert.ok(Math.abs(widths.reactTable - widths.containerContent) < 1, "table fills its available narrow viewport");
  assert.equal(widths.overflow, widths.viewport, "narrow table container prevents page-level horizontal overflow");
  await page.screenshot({ path: resolve("test-results/table-components.png"), fullPage: true });
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ browser: "Chromium headless", adapters: ["React", "custom elements"], roles: { table: true, rowgroup: true, row: true, columnheader: true, cell: true }, scrolling: "React UIEvent target/currentTarget with capture order", sorting: "controlled aria-sort and sort event", selection: "native checkbox and selected row", resize: "pointer drag and keyboard separator with RTL direction", responsiveViewport: widths, pageErrors: errors }));
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
