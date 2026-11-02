import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "esbuild";
import { formatDataGridClipboard, parseDataGridClipboard, parseDataGridClipboardValue } from "../packages/sharepoint-ui/dist/elements/data-grid-model.js";

assert.deepEqual(parseDataGridClipboard('"tab\tvalue"\t"line 1\nline 2"\t"say ""hi"""\r\n2\t3\t'), [["tab\tvalue", "line 1\nline 2", 'say "hi"'], ["2", "3", ""]]);
assert.equal(formatDataGridClipboard([["a\tb", 'say "hi"'], [3, null]]), '"a\tb"\t"say ""hi"""\r\n3\t');
assert.equal(parseDataGridClipboardValue("  ", "number"), null);
assert.throws(() => parseDataGridClipboardValue("not a number", "number"), /valid number/);
assert.throws(() => parseDataGridClipboard('"unfinished'), /unfinished quoted/);
assert.throws(() => parseDataGridClipboard("x".repeat(1_000_001)), /1,000,000 characters/);

const root = resolve("packages/sharepoint-ui/dist");
const reactBundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{DataGrid,SharePointUIProvider}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineDataGrid}from"${resolve("packages/sharepoint-ui/src/elements/data-grid.ts")}";const initial=[{id:"a",title:"Alpha",count:1},{id:"b",title:"Beta",count:2},{id:"c",title:"Gamma",count:3}];window.mount=()=>{defineDataGrid();const native=document.createElement("spui-data-grid");native.setAttribute("label","Native clipboard grid");native.setAttribute("selection-mode","multiple");native.columns=[{id:"id",label:"ID"},{id:"title",label:"Title",editable:true},{id:"count",label:"Count",editable:true,editType:"number"}];native.items=initial;native.itemKey=item=>item.id;native.selectedKeys=["a","b"];window.nativeCellsEdit=[];native.onCellsEdit=async edits=>{if(edits.some(edit=>edit.value==="reject"))throw Error("Bulk save rejected.");window.nativeCellsEdit.push(...edits);};native.addEventListener("spui-cells-edit-error",event=>window.nativeError=event.detail.message);document.querySelector("#native").append(native);function App(){const[items,setItems]=React.useState(initial);const[calls,setCalls]=React.useState([]);return React.createElement(SharePointUIProvider,{strings:{dataGridPasteOne:"Įklijuotas {count} langelis.",dataGridPasteMany:"Įklijuoti {count} langeliai.",dataGridPasteFailed:"Įklijuoti nepavyko: {message}"}},React.createElement(DataGrid,{"data-testid":"react-grid","aria-label":"React clipboard grid",items,columns:native.columns,getRowId:item=>item.id,selectionMode:"multiple",defaultSelectedKeys:["a","b"],height:280,onCellsEdit:async edits=>{if(edits.some(edit=>edit.value==="reject"))throw Error("Bulk save rejected.");setCalls(values=>[...values,...edits]);setItems(current=>current.map(item=>{const updates=edits.filter(edit=>edit.rowId===item.id);return updates.reduce((next,edit)=>({...next,[edit.columnId]:edit.value}),item);}));}}));}createRoot(document.querySelector("#react")).render(React.createElement(App));};`,
    resolveDir: process.cwd(), sourcefile: "data-grid-clipboard.tsx", loader: "tsx",
  },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});
const server = createServer((request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  if (pathname === "/") return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><div id='native'></div><div id='react'></div></body></html>");
  if (pathname === "/bundle.js") return response.writeHead(200, { "content-type": "text/javascript" }).end(reactBundle.outputFiles[0].contents);
  if (!/^\/elements\/(data-grid|data-grid-model|shared|virtual-list)\.js$/.test(pathname)) return response.writeHead(404).end();
  try { response.writeHead(200, { "content-type": "text/javascript", "cache-control": "no-store" }).end(readFileSync(resolve(root, `.${pathname}`))); }
  catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1000, height: 720 } });
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.addScriptTag({ url: `http://127.0.0.1:${server.address().port}/bundle.js` });
  await page.evaluate(() => window.mount());
  const exercise = async (adapter) => {
    const host = adapter === "react" ? page.getByTestId("react-grid") : page.locator("spui-data-grid");
    const selector = adapter === "react" ? '[data-row-index="0"][data-column-index="1"]' : '.data-row[data-row-index="0"] [data-col-index="1"]';
    const doCopy = await host.evaluate((node, native) => {
      const root = native ? node.shadowRoot : node;
      const cell = root.querySelector(native ? '.data-row[data-row-index="0"] [data-col-index="1"]' : '[data-row-index="0"][data-column-index="1"]');
      const data = new DataTransfer(); const event = new ClipboardEvent("copy", { bubbles: true, cancelable: true, clipboardData: data });
      cell.dispatchEvent(event); return { text: data.getData("text/plain"), prevented: event.defaultPrevented };
    }, adapter === "native");
    assert.equal(doCopy.prevented, true, `${adapter}: intercept the copy gesture`);
    assert.equal(doCopy.text, "a\tAlpha\t1\r\nb\tBeta\t2", `${adapter}: copy selected rows as TSV`);
    const doPaste = (value, start = selector) => host.evaluate((node, args) => {
      const root = args.native ? node.shadowRoot : node;
      const cell = root.querySelector(args.selector); const data = new DataTransfer(); data.setData("text/plain", args.value);
      const event = new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: data }); cell.dispatchEvent(event); return event.defaultPrevented;
    }, { native: adapter === "native", selector: start, value });
    assert.equal(await doPaste('"Alpha\tNew"\t5\r\nBeta revised\t6'), true);
    await page.waitForFunction(({ native }) => {
      const host = native ? document.querySelector("spui-data-grid") : document.querySelector('[data-testid="react-grid"]');
      const root = native ? host.shadowRoot : host;
      const firstTitle = native ? root.querySelector('.data-row[data-row-index="0"] [data-col-index="1"]') : root.querySelector('[data-row-index="0"][data-column-index="1"]');
      const secondCount = native ? root.querySelector('.data-row[data-row-index="1"] [data-col-index="2"]') : root.querySelector('[data-row-index="1"][data-column-index="2"]');
      return firstTitle?.textContent === "Alpha\tNew" && secondCount?.textContent === "6";
    }, { native: adapter === "native" });
    if (adapter === "react") await page.waitForFunction(() => document.querySelector("[data-testid=react-grid] .spui-grid-reorder-status")?.textContent === "Įklijuoti 4 langeliai.");
    const failPrevented = await doPaste("reject\t9");
    assert.equal(failPrevented, true);
    await page.waitForFunction(native => native ? window.nativeError === "Bulk save rejected." : document.querySelector('[data-testid="react-grid"] .spui-grid-reorder-status')?.textContent === "Įklijuoti nepavyko: Bulk save rejected.", adapter === "native");
    const afterFailure = await host.evaluate((node, native) => {
      const root = native ? node.shadowRoot : node;
      const title = native ? root.querySelector('.data-row[data-row-index="0"] [data-col-index="1"]') : root.querySelector('[data-row-index="0"][data-column-index="1"]');
      const count = native ? root.querySelector('.data-row[data-row-index="0"] [data-col-index="2"]') : root.querySelector('[data-row-index="0"][data-column-index="2"]');
      return [title?.textContent, count?.textContent];
    }, adapter === "native");
    assert.deepEqual(afterFailure, ["Alpha\tNew", "5"], `${adapter}: rejected batch must not change local cell values`);
    const badTarget = await doPaste("x", adapter === "react" ? '[data-row-index="0"][data-column-index="0"]' : '.data-row[data-row-index="0"] [data-col-index="0"]');
    assert.equal(badTarget, true);
    return { selectedRowsCopied: true, quotedTabPasted: true, numericPaste: true, rejectedBatchAtomic: true, readOnlyColumnRejected: true };
  };
  const react = await exercise("react");
  const native = await exercise("native");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ browser: "Chromium headless", adapters: { react, native }, parser: "quoted TSV / CRLF / escaped quote", assertions: "passed", pageErrors: errors }));
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
