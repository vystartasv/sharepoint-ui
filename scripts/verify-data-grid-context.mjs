import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import ts from "typescript";

const typeFixturePath = resolve("packages/sharepoint-ui/src/.data-grid-context-type.tsx");
const typeFixture = `
  import type { DataGridContextValue, TableFeaturesState } from "./react.js";
  type Item = { id: string; name: string };
  type Assert<T extends true> = T;
  type ContextExtendsTableFeatures = Assert<DataGridContextValue<Item> extends TableFeaturesState<Item> ? true : false>;
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
assert.deepEqual(typeErrors, [], "DataGridContextValue implements Fluent TableFeaturesState for consumer types");

const bundle = await build({
  stdin: {
    contents: `import * as React from "react"; import {createRoot} from "react-dom/client"; import {DataGrid,createTableColumn,useDataGridContext_unstable} from "${resolve("packages/sharepoint-ui/src/react.tsx")}"; const columns=[createTableColumn({columnId:"name",renderHeaderCell:()=>"Name",renderCell:item=>item.name})]; function Probe(){const count=useDataGridContext_unstable(context=>context?.items.length??-1);const renders=React.useRef(0);renders.current++;return <output data-testid="context-probe">{count}:{renders.current}</output>} const MemoProbe=React.memo(Probe); function OutsideProbe(){const value=useDataGridContext_unstable(context=>context.items.length+":"+context.focusMode+":"+context.subtleSelection+":"+context.getRows().length+":"+context.selectableRows);return <output data-testid="outside-probe">{value}</output>} function CompatibilityProbe(){const value=useDataGridContext_unstable(context=>[context.getRows().length,context.selection.selectedRows.size,context.selectableRows,context.columnSizing_unstable.getColumnWidths()[0]?.width??0,context.sort.getSortDirection("name")??"none",Boolean(context.tableRef.current),Boolean(context.compositeRowTabsterAttribute["data-tabster"])].join(":"));return <output data-testid="compatibility-probe">{value}</output>} function GridActions(){const selection=useDataGridContext_unstable(context=>context.selection);const sizing=useDataGridContext_unstable(context=>context.columnSizing_unstable);const sort=useDataGridContext_unstable(context=>context.sort);return <><button onClick={event=>selection.selectRow(event,"a")}>Select first</button><button onClick={()=>sizing.setColumnWidth("name",240)}>Set width</button><button onClick={event=>sort.setColumnSort(event,"name","ascending")}>Sort by name</button></>} function App(){const [items,setItems]=React.useState([{id:"a",name:"Alpha"}]);const [focusMode,setFocusMode]=React.useState("composite");const [sourceMode,setSourceMode]=React.useState(false);const source=React.useMemo(()=>({length:items.length,getItem:index=>items[index],loadRange:()=>{}}),[items]);return <><OutsideProbe/><button onClick={()=>setItems(current=>[...current,{id:"b",name:"Beta"}])}>Add row</button><button onClick={()=>setFocusMode(current=>current==="composite"?"cell":"composite")}>Change grid mode</button><button onClick={()=>setSourceMode(true)}>Use indexed source</button><DataGrid items={sourceMode?undefined:items} dataSource={sourceMode?source:undefined} columns={columns} getRowId={item=>item.id} focusMode={focusMode} selectionMode="multiselect"><MemoProbe/><CompatibilityProbe/><GridActions/></DataGrid></>} createRoot(document.getElementById("root")).render(<App/>);`,
    resolveDir: process.cwd(), sourcefile: "data-grid-context.tsx", loader: "tsx",
  },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});

const server = createServer((request, response) => {
  const path = new URL(request.url, "http://localhost").pathname;
  if (path === "/") return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><div id='root'></div></body></html>");
  if (path === "/bundle.js") return response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents);
  response.writeHead(404).end();
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
let browser;
try {
  const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.addScriptTag({ url: `http://127.0.0.1:${server.address().port}/bundle.js` });
  assert.equal(await page.getByTestId("context-probe").textContent(), "1:1");
  assert.equal(await page.getByTestId("outside-probe").textContent(), "0:none:false:0:false", "outside a provider, the selector receives Fluent-compatible defaults");
  assert.equal(await page.getByTestId("compatibility-probe").textContent(), "1:0:true:150:none:true:true", "context projects row, selection, sizing, sort, ref, and row-navigation state");
  await page.getByRole("button", { name: "Change grid mode" }).click();
  assert.equal(await page.getByTestId("context-probe").textContent(), "1:1", "unchanged selector values do not trigger context-driven rerenders");
  await page.getByRole("button", { name: "Add row" }).click();
  assert.equal(await page.getByTestId("context-probe").textContent(), "2:2", "selectors observe updated composed grid context");
  await page.getByRole("button", { name: "Select first" }).click();
  assert.equal((await page.getByTestId("compatibility-probe").textContent())?.split(":")[1], "1", "Fluent-shaped row selection updates the grid selection");
  await page.getByRole("button", { name: "Set width" }).click();
  assert.equal((await page.getByTestId("compatibility-probe").textContent())?.split(":")[3], "240", "Fluent-shaped sizing updates the grid width");
  await page.getByRole("button", { name: "Sort by name" }).click();
  assert.equal((await page.getByTestId("compatibility-probe").textContent())?.split(":")[4], "ascending", "Fluent-shaped sort state updates the grid");
  await page.getByRole("button", { name: "Use indexed source" }).click();
  assert.equal((await page.getByTestId("compatibility-probe").textContent())?.split(":")[0], "2", "table row helpers expose loaded rows from indexed sources");
  await page.getByRole("button", { name: "Select first" }).click();
  assert.equal((await page.getByTestId("compatibility-probe").textContent())?.split(":")[1], "1", "Fluent-shaped selection works with loaded indexed rows");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", composedContext: true, contextUpdates: true, unchangedSelectionsSkipRenders: true, outsideProvider: true, pageErrors: errors }, null, 2));
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
