import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
import ts from "typescript";

const typeFixturePath = resolve("packages/sharepoint-ui/src/.table-hooks-type-contract.tsx");
const typeFixture = `
  import * as React from "react";
  import { ColumnIdContextProvider, TableContextProvider, TableHeaderContextProvider, TableRowIdContextProvider, createTableColumn, useColumnIdContext, useIsInTableHeader, useTableColumnSizing_unstable, useTableContext, useTableFeatures, useTableRowIdContext, useTableSelection, useTableSort, type TableContextValue, type TableFeaturePlugin, type TableFeaturesState, type TableRowId } from "./react.js";
  type Item = { id: string; name: string };
  const items: Item[] = [];
  const columns = [createTableColumn<Item>({ columnId: "name", compare: (a, b) => a.name.localeCompare(b.name), renderCell: item => item.name })];
  const plugins: TableFeaturePlugin[] = [useTableSelection({ selectionMode: "multiselect" }), useTableSort(), useTableColumnSizing_unstable()];
  const genericPlugin: TableFeaturePlugin = <TRow,>(state: TableFeaturesState<TRow>) => state;
  const table = useTableFeatures({ items, columns }, [...plugins, genericPlugin]);
  table.items.push({ id: "new", name: "New" });
  table.columns.push(createTableColumn<Item>({ columnId: "id", renderCell: item => item.id }));
  // @ts-expect-error Fluent requires a concrete column id.
  table.sort.setColumnSort({} as React.SyntheticEvent, undefined, "ascending");
  // @ts-expect-error Fluent requires a concrete column id.
  table.sort.toggleColumnSort({} as React.SyntheticEvent, undefined);
  const context: TableContextValue = useTableContext();
  const rowId: TableRowId = useTableRowIdContext();
  const columnId = useColumnIdContext();
  const inHeader: boolean = useIsInTableHeader();
  const providers = React.createElement(TableContextProvider, { value: context }, React.createElement(TableHeaderContextProvider, { value: "" }, React.createElement(TableRowIdContextProvider, { value: rowId }, React.createElement(ColumnIdContextProvider, { value: columnId }, String(inHeader)))));
`;
const configPath = resolve("packages/sharepoint-ui/tsconfig.json");
const configRead = ts.readConfigFile(configPath, ts.sys.readFile);
assert.equal(configRead.error, undefined, "library tsconfig is readable");
const parsedConfig = ts.parseJsonConfigFileContent(configRead.config, ts.sys, resolve("packages/sharepoint-ui"));
const typeOptions = { ...parsedConfig.options, noEmit: true, rootDir: undefined };
const host = ts.createCompilerHost(typeOptions);
const originalFileExists = host.fileExists.bind(host);
const originalReadFile = host.readFile.bind(host);
const originalGetSourceFile = host.getSourceFile.bind(host);
host.fileExists = file => resolve(file) === typeFixturePath || originalFileExists(file);
host.readFile = file => resolve(file) === typeFixturePath ? typeFixture : originalReadFile(file);
host.getSourceFile = (file, languageVersion, onError, shouldCreateNewSourceFile) => resolve(file) === typeFixturePath
  ? ts.createSourceFile(file, typeFixture, languageVersion, true, ts.ScriptKind.TSX)
  : originalGetSourceFile(file, languageVersion, onError, shouldCreateNewSourceFile);
const typeProgram = ts.createProgram([typeFixturePath], typeOptions, host);
const typeErrors = ts.getPreEmitDiagnostics(typeProgram).map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
assert.deepEqual(typeErrors, [], "Fluent-generic TableFeaturePlugin arrays type-check for consumers");

const bundle = await build({
  stdin: {
    sourcefile: "table-hooks-check.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `
      import * as React from "react";
      import { createRoot } from "react-dom/client";
      import { ColumnIdContextProvider, createTableColumn, SharePointUIProvider, Table, TableContextProvider, TableHeader, TableHeaderCell, TableRowIdContextProvider, TableSelectionCell, useColumnIdContext, useIsInTableHeader, useTableColumnSizing_unstable, useTableCompositeNavigation, useTableContext, useTableFeatures, useTableRowIdContext, useTableSelection, useTableSort } from "${resolve("packages/sharepoint-ui/src/react.tsx")}";
      const items = [{ id: "a", name: "Alpha" }, { id: "b", name: "Beta" }, { id: "c", name: "Gamma" }];
      const columns = [createTableColumn({ columnId: "name", compare: (a, b) => a.name.localeCompare(b.name), renderCell: item => item.name })];
      window.mount = () => {
        function App() {
          const plugins = React.useMemo(() => [
            useTableSelection({ selectionMode: "multiselect", defaultSelectedItems: ["b"], onSelectionChange: (_event, data) => { window.selectionChange = [...data.selectedItems]; } }),
            useTableSort({ defaultSortState: { sortColumn: "name", sortDirection: "ascending" }, onSortChange: (_event, data) => { window.sortChange = data; } }),
          ], []);
          const table = useTableFeatures({ items, columns, getRowId: item => item.id }, plugins);
          const rows = table.sort.sort(table.getRows());
          return <><output data-testid="sort-state">{table.sort.sortDirection}:{String(table.sort.getSortDirection("name"))}</output>
            <output data-testid="selection-state">{table.selection.selectedRows.size}:{String(table.selection.someRowsSelected)}:{String(table.selection.allRowsSelected)}</output>
            <button data-testid="toggle-sort" onClick={event => table.sort.toggleColumnSort(event, "name")}>Toggle sort</button>
            <button data-testid="toggle-row" onClick={event => table.selection.toggleRow(event, "a")}>Toggle Alpha</button>
            <button data-testid="toggle-all" onClick={event => table.selection.toggleAllRows(event)}>Toggle all</button>
            <button data-testid="clear" onClick={event => table.selection.clearRows(event)}>Clear</button>
            <ol data-testid="rows">{rows.map(row => <li key={row.rowId}>{row.rowId}:{row.item.name}</li>)}</ol>
            <output data-testid="enhanced">{table.getRows(row => ({ ...row, label: row.item.name.toUpperCase() })).map(row => row.label).join(",")}</output>
          </>;
        }
        function ControlledApp() {
          const [selected, setSelected] = React.useState(new Set(["a"]));
          const [sortState, setSortState] = React.useState({ sortColumn: "name", sortDirection: "ascending" });
          const table = useTableFeatures({ items, columns, getRowId: item => item.id }, [
            useTableSelection({ selectionMode: "single", selectedItems: selected, onSelectionChange: (_event, data) => { window.controlledSelectionChange = [...data.selectedItems]; setSelected(data.selectedItems); } }),
            useTableSort({ sortState, onSortChange: (_event, next) => { window.controlledSortChange = next; setSortState(next); } }),
          ]);
          return <><output data-testid="controlled-state">{table.selection.selectedRows.size}:{String(table.selection.allRowsSelected)}:{table.sort.sortDirection}</output>
            <button data-testid="select-b" onClick={event => table.selection.selectRow(event, "b")}>Select Beta</button>
            <button data-testid="toggle-b" onClick={event => table.selection.toggleRow(event, "b")}>Toggle Beta</button>
            <button data-testid="controlled-sort" onClick={event => table.sort.toggleColumnSort(event, "name")}>Sort</button></>;
        }
        function SizingContent() {
          const table = useTableFeatures({ items, columns }, [useTableColumnSizing_unstable({ autoFitColumns: false, columnSizingOptions: { name: { minWidth: 80, idealWidth: 120, defaultWidth: 120, padding: 0 } }, onColumnResize: (event, data) => { window.columnResize = { type: event?.type, ...data }; } })]);
          const header = table.columnSizing_unstable.getTableHeaderCellProps("name");
          return <div ref={table.tableRef} data-testid="sizing-table" style={{ width: 0 }}><TableHeaderCell data-testid="sized-header" style={header.style} aside={header.aside}>Name</TableHeaderCell><output data-testid="column-width">{table.columnSizing_unstable.getColumnWidths()[0]?.width}</output></div>;
        }
        function SizingApp() { return <SharePointUIProvider strings={{ tableResizeColumn: "تغيير حجم عمود {column}" }}><SizingContent /></SharePointUIProvider>; }
        function AutoFitApp() {
          const fitColumns = React.useMemo(() => [...columns, createTableColumn({ columnId: "owner" })], []);
          const table = useTableFeatures({ items, columns: fitColumns }, [useTableColumnSizing_unstable({ columnSizingOptions: { name: { minWidth: 80, idealWidth: 150, padding: 0 }, owner: { minWidth: 100, idealWidth: 150, padding: 0 } } })]);
          return <div ref={table.tableRef} data-testid="fit-container" style={{ width: 180 }}><output data-testid="fit-widths">{table.columnSizing_unstable.getColumnWidths().map(column => column.width).join(",")}</output></div>;
        }
        function HookSelectionApp() {
          const table = useTableFeatures({ items, columns, getRowId: item => item.id }, [useTableSelection({ selectionMode: "multiselect" })]);
          return <><output data-testid="hook-selection-count">{table.selection.selectedRows.size}</output><TableSelectionCell aria-label="Select Alpha" checked={table.selection.isRowSelected("a")} onClick={event => table.selection.toggleRow(event, "a")} /></>;
        }
        function StaleSelectionApp() {
          const [visibleItems, setVisibleItems] = React.useState(items);
          const plugins = React.useMemo(() => [useTableSelection({ selectionMode: "multiselect", defaultSelectedItems: ["b"] })], []);
          const table = useTableFeatures({ items: visibleItems, columns, getRowId: item => item.id }, plugins);
          return <><output data-testid="stale-selection">{[...table.selection.selectedRows].sort().join(",")}</output>
            <button data-testid="remove-selected-row" onClick={() => setVisibleItems(current => current.filter(item => item.id !== "b"))}>Remove selected row</button>
            <button data-testid="select-all-visible" onClick={event => table.selection.toggleAllRows(event)}>Select all visible</button></>;
        }
        function CompositeNavigationApp() {
          const navigation = useTableCompositeNavigation();
          return <div data-testid="composite-grid" role="grid" {...navigation.tableTabsterAttribute} onKeyDown={navigation.onTableKeyDown}>
            <div role="row" tabIndex={0} {...navigation.tableRowTabsterAttribute} data-testid="composite-row"><div role="gridcell"><button data-testid="cell-a1">A1</button></div><div role="gridcell"><button data-testid="cell-a2">A2</button></div></div>
            <div role="row" {...navigation.tableRowTabsterAttribute}><div role="gridcell"><button data-testid="cell-b1">B1</button></div><div role="gridcell"><button data-testid="cell-b2">B2</button></div></div>
          </div>;
        }
        function RTLCompositeNavigationApp() {
          const navigation = useTableCompositeNavigation();
          return <div dir="rtl" data-testid="rtl-composite-grid" role="grid" {...navigation.tableTabsterAttribute} onKeyDown={navigation.onTableKeyDown}>
            <div role="row" tabIndex={0} {...navigation.tableRowTabsterAttribute} data-testid="rtl-composite-row"><div role="gridcell"><button data-testid="rtl-cell-a1">A1</button></div><div role="gridcell"><button data-testid="rtl-cell-a2">A2</button></div></div>
          </div>;
        }
        function ContextProbe({ testid }) {
          const tableContext = useTableContext();
          const rowId = useTableRowIdContext();
          const columnId = useColumnIdContext();
          return <output data-testid={testid}>{tableContext.size}|{String(tableContext.noNativeElements)}|{String(tableContext.sortable)}|{String(useIsInTableHeader())}|{rowId}|{columnId}</output>;
        }
        function ContextsApp() {
          return <Table size="small" noNativeElements sortable><TableHeader><ContextProbe testid="table-header-context" /></TableHeader>
            <TableRowIdContextProvider value="row-a"><ColumnIdContextProvider value="name"><ContextProbe testid="table-cell-context" /></ColumnIdContextProvider></TableRowIdContextProvider>
          </Table>;
        }
        createRoot(document.getElementById("root")).render(<App />);
        createRoot(document.getElementById("controlled")).render(<ControlledApp />);
        createRoot(document.getElementById("sizing")).render(<SizingApp />);
        createRoot(document.getElementById("fit")).render(<AutoFitApp />);
        createRoot(document.getElementById("hook-selection")).render(<HookSelectionApp />);
        createRoot(document.getElementById("stale-selection")).render(<StaleSelectionApp />);
        createRoot(document.getElementById("composite-navigation")).render(<CompositeNavigationApp />);
        createRoot(document.getElementById("rtl-navigation")).render(<RTLCompositeNavigationApp />);
        createRoot(document.getElementById("contexts")).render(<ContextsApp />);
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
  return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><div id='root'></div><div id='controlled'></div><div id='sizing'></div><div id='fit'></div><div id='hook-selection'></div><div id='stale-selection'></div><div id='composite-navigation'></div><div id='rtl-navigation'></div><div id='contexts'></div><script src='/bundle.js'></script>");
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.evaluate(() => window.mount());
  const text = testId => page.getByTestId(testId).textContent();
  assert.equal(await text("table-header-context"), "small|true|true|true||", "Table and TableHeader provide Fluent table/header context values to descendants");
  assert.equal(await text("table-cell-context"), "small|true|true|false|row-a|name", "row and column context providers expose their values without changing table context");
  assert.equal(await text("sort-state"), "ascending:ascending");
  assert.deepEqual(await page.getByTestId("rows").locator("li").allTextContents(), ["a:Alpha", "b:Beta", "c:Gamma"]);
  assert.equal(await text("selection-state"), "1:true:false");
  assert.equal(await text("enhanced"), "ALPHA,BETA,GAMMA");
  await page.getByTestId("toggle-sort").click();
  assert.equal(await text("sort-state"), "descending:descending");
  assert.deepEqual(await page.getByTestId("rows").locator("li").allTextContents(), ["c:Gamma", "b:Beta", "a:Alpha"]);
  assert.deepEqual(await page.evaluate(() => window.sortChange), { sortColumn: "name", sortDirection: "descending" });
  await page.getByTestId("toggle-row").click();
  assert.equal(await text("selection-state"), "2:true:false");
  assert.deepEqual((await page.evaluate(() => window.selectionChange)).sort(), ["a", "b"]);
  await page.getByTestId("toggle-all").click();
  assert.equal(await text("selection-state"), "3:true:true");
  await page.getByTestId("toggle-all").click();
  assert.equal(await text("selection-state"), "0:false:false");
  await page.getByTestId("toggle-row").click();
  await page.getByTestId("clear").click();
  assert.equal(await text("selection-state"), "0:false:false");
  assert.equal(await text("controlled-state"), "1:true:ascending", "controlled single-select and sort defaults are reflected");
  await page.getByTestId("select-b").click();
  assert.equal(await text("controlled-state"), "1:true:ascending");
  assert.deepEqual(await page.evaluate(() => window.controlledSelectionChange), ["b"]);
  await page.getByTestId("toggle-b").click();
  assert.equal(await text("controlled-state"), "1:true:ascending", "single-select toggle keeps the row selected, matching Fluent behavior");
  await page.getByTestId("controlled-sort").click();
  assert.equal(await text("controlled-state"), "1:true:descending");
  assert.deepEqual(await page.evaluate(() => window.controlledSortChange), { sortColumn: "name", sortDirection: "descending" });
  await page.getByRole("checkbox", { name: "Select Alpha" }).click();
  assert.equal(await text("hook-selection-count"), "1", "custom TableSelectionCell composes with the selection plugin");
  assert.equal(await text("stale-selection"), "b", "initial selection may contain ids outside the visible rows");
  await page.getByTestId("remove-selected-row").click();
  await page.getByTestId("select-all-visible").click();
  assert.equal(await text("stale-selection"), "a,b,c", "selecting all visible rows preserves selected ids for rows that left the current data set, matching Fluent");
  const compositeGrid = page.getByTestId("composite-grid");
  const gridAttribute = JSON.parse(await compositeGrid.getAttribute("data-tabster"));
  const rowAttribute = JSON.parse(await page.getByTestId("composite-row").getAttribute("data-tabster"));
  assert.deepEqual(gridAttribute.mover, { cyclic: false, direction: 3, memorizeCurrent: true }, "table root exposes Fluent grid mover configuration");
  assert.deepEqual(rowAttribute, { mover: { cyclic: false, direction: 2, memorizeCurrent: true }, groupper: { tabbability: 2 }, focusable: {} }, "table row combines horizontal mover and trapped groupper configuration");
  await page.getByTestId("composite-row").focus();
  await page.getByTestId("composite-row").press("ArrowRight");
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("data-testid")), "cell-a1", "ArrowRight enters a row at its first focusable cell");
  await page.evaluate(() => { const cell = document.querySelector('[data-testid="cell-a1"]'); window.compositeNavigationEvents = []; cell.addEventListener("tabster:groupper:movefocus", event => window.compositeNavigationEvents.push([event.type, event.detail.action])); cell.addEventListener("tabster:mover:movefocus", event => window.compositeNavigationEvents.push([event.type, event.detail.key])); });
  await page.getByTestId("cell-a1").press("ArrowLeft");
  await page.getByTestId("cell-a1").press("ArrowDown");
  assert.deepEqual(await page.evaluate(() => window.compositeNavigationEvents), [["tabster:groupper:movefocus", 2], ["tabster:groupper:movefocus", 2], ["tabster:mover:movefocus", 2]], "cell arrows emit Fluent Tabster focus handoff events");
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("data-testid")), "cell-b1", "ArrowDown moves to the matching cell without requiring Tabster runtime");
  await page.getByTestId("cell-b1").press("ArrowRight");
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("data-testid")), "cell-b2", "ArrowRight moves across cells without requiring Tabster runtime");
  await page.getByTestId("cell-b2").press("ArrowUp");
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("data-testid")), "cell-a2", "ArrowUp moves to the matching cell without requiring Tabster runtime");
  await page.getByTestId("rtl-composite-row").focus();
  await page.getByTestId("rtl-composite-row").press("ArrowRight");
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("data-testid")), "rtl-cell-a1", "RTL row entry preserves Fluent's ArrowRight behavior");
  await page.getByTestId("rtl-cell-a1").press("ArrowLeft");
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("data-testid")), "rtl-cell-a2", "RTL ArrowLeft advances through the grid in logical order");
  await page.getByTestId("rtl-cell-a2").press("ArrowRight");
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("data-testid")), "rtl-cell-a1", "RTL ArrowRight moves to the previous cell in logical order");
  assert.equal(await text("column-width"), "120", "configured ideal/default width initializes the column");
  const resizeHandle = page.locator("spui-table-resize-handle [role=separator]");
  await resizeHandle.waitFor();
  assert.equal(await page.locator("spui-table-resize-handle").getAttribute("label"), "تغيير حجم عمود name", "resize handle uses the localized provider string");
  await resizeHandle.focus();
  await resizeHandle.press("ArrowRight");
  try { await page.waitForFunction(() => document.querySelector("[data-testid=column-width]")?.textContent === "128", null, { timeout: 3000 }); }
  catch (error) { console.log("keyboard-resize-debug", await page.getByTestId("column-width").textContent(), await page.locator("spui-table-resize-handle").getAttribute("value")); throw error; }
  assert.equal(await text("column-width"), "128", "keyboard resize updates column width");
  assert.deepEqual(await page.evaluate(() => window.columnResize), { type: "keydown", columnId: "name", width: 128 });
  assert.equal(await page.getByTestId("sized-header").evaluate(element => getComputedStyle(element).width), "128px", "header receives fixed width styles");
  try { await page.waitForFunction(() => document.querySelector("[data-testid=fit-widths]")?.textContent === "80,100", null, { timeout: 3000 }); }
  catch (error) { console.log("auto-fit-debug", await page.getByTestId("fit-widths").textContent(), await page.getByTestId("fit-container").evaluate(element => ({ width: element.clientWidth, rect: element.getBoundingClientRect().width }))); throw error; }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", pluginTypeContracts: true, reactTableContexts: true, selection: true, staleSelectionPreservedOnSelectAll: true, tableSelectionCellComposition: true, controlledSelectionAndSorting: true, singleSelectAndMultiSelect: true, singleColumnSorting: true, rowEnhancement: true, columnSizing: true, autoFitAndMinimumWidths: true, localizedResizeLabel: true, keyboardResize: true, compositeNavigationAttributes: true, compositeNavigationFocusHandoff: true, compositeNavigationNativeFallback: true, compositeNavigationRTL: true, pluginComposition: true, pageErrors: errors }));
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
