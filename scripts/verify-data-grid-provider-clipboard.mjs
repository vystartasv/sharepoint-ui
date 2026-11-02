import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = resolve("packages/sharepoint-ui/dist");
const reactBundle = await build({
  stdin: {
    sourcefile: "provider-clipboard.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{DataGrid}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineDataGrid}from"${resolve("packages/sharepoint-ui/src/elements/data-grid.ts")}";function makeSource(){const cache=new Map(),listeners=new Set(),ranges=[];return{cache,listeners,ranges,length:20,getItem(index){return cache.get(index)},subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener)},notify(){for(const listener of listeners)listener()},async loadRange(start,end,signal){ranges.push([start,end]);if(this.deferRange)await new Promise(resolve=>{this.finishRange=resolve});if(signal.aborted)return;for(let index=start;index<end;index++)cache.set(index,{id:String(index),name:"Row "+index});this.notify()},copySelection(selection,columns,signal){if(signal.aborted)throw Error("aborted");return "all matching\\t"+columns.map(column=>column.label).join("\\t")+"\\r\\nremote row\\tremote value"}}}window.mount=()=>{defineDataGrid();window.clipboardWrites=[];Object.defineProperty(navigator,"clipboard",{configurable:true,value:{write:async items=>{window.clipboardWrites.push(await(await items[0].getType("text/plain")).text())}}});window.nativeSource=makeSource();const native=document.createElement("spui-data-grid");native.setAttribute("selection-mode","multiple");native.columns=[{id:"id",label:"ID"},{id:"name",label:"Name",editable:true}];native.itemKey=item=>item.id;native.selectionModel={mode:"all",excludedKeys:[]};native.onCellsEdit=async edits=>{window.nativeEdits=edits};native.dataSource=window.nativeSource;document.querySelector("#native").append(native);function App(){return React.createElement(DataGrid,{"data-testid":"react-grid",dataSource:window.reactSource=makeSource(),columns:[{id:"id",label:"ID"},{id:"name",label:"Name",editable:true}],getRowId:item=>item.id,selectionMode:"multiple",defaultSelectionModel:{mode:"all",excludedKeys:[]},height:240,onCellsEdit:async edits=>{window.reactEdits=edits}})}createRoot(document.querySelector("#react")).render(React.createElement(App))};`,
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
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
  page.setDefaultTimeout(5000);
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.addScriptTag({ url: `http://127.0.0.1:${server.address().port}/bundle.js` });
  await page.evaluate(() => window.mount());
  const adapters = {};
  for (const adapter of ["react", "native"]) {
    const host = adapter === "react" ? page.getByTestId("react-grid") : page.locator("spui-data-grid");
    const cellSelector = adapter === "react" ? '[data-row-index="0"][data-column-index="1"]' : '.data-row[data-row-index="0"] [data-col-index="1"]';
    await page.waitForFunction(name => window[name + "Source"].cache.has(0), adapter);
    await host.evaluate((node, native) => {
      const root = native ? node.shadowRoot : node;
      root.querySelector(native ? ".data-row[data-row-index='1']" : "[data-row-index='1']");
    }, adapter === "native");
    const cell = host.locator(cellSelector);
    await cell.focus();
    await cell.evaluate(node => node.dispatchEvent(new KeyboardEvent("keydown", { key: "c", ctrlKey: true, bubbles: true, composed: true, cancelable: true })));
    await page.waitForFunction(() => window.clipboardWrites.length > 0);
    const copied = await page.evaluate(() => window.clipboardWrites.at(-1));
    assert.equal(copied, "all matching\tID\tName\r\nremote row\tremote value", `${adapter}: async all-matching copy reaches system clipboard`);
    await host.evaluate(node => node.addEventListener("spui-clipboard-error", event => { window.clipboardErrors ??= []; window.clipboardErrors.push(event.detail.message); }));
    const writesBeforeStale = await page.evaluate(() => window.clipboardWrites.length);
    const errorsBeforeStale = await page.evaluate(() => window.clipboardErrors?.length ?? 0);
    await host.evaluate(node => node.addEventListener("spui-cells-edit-error", event => { window.pasteErrors ??= []; window.pasteErrors.push(event.detail.message); }));
    await page.evaluate(name => {
      const source = window[name + "Source"];
      source.selectionScopeKey = "query-before";
      source.copySelection = () => new Promise(resolve => { source.finishCopy = () => resolve("stale query data"); });
    }, adapter);
    await cell.evaluate(node => node.dispatchEvent(new KeyboardEvent("keydown", { key: "c", ctrlKey: true, bubbles: true, composed: true, cancelable: true })));
    await page.waitForFunction(name => typeof window[name + "Source"].finishCopy === "function", adapter);
    await page.evaluate(name => { const source = window[name + "Source"]; source.selectionScopeKey = "query-after"; source.notify(); source.finishCopy(); }, adapter);
    await page.waitForFunction(count => (window.clipboardErrors?.length ?? 0) > count, errorsBeforeStale);
    assert.equal(await page.evaluate(() => window.clipboardWrites.length), writesBeforeStale, `${adapter}: changed query does not write stale clipboard content`);

    await page.evaluate(name => { window[name + "Source"].cache.delete(1); }, adapter);
    const prevented = await cell.evaluate((node, native) => {
      const data = new DataTransfer(); data.setData("text/plain", "edited row zero\nedited row one");
      const event = new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: data });
      node.dispatchEvent(event); return event.defaultPrevented;
    }, adapter === "native");
    assert.equal(prevented, true, `${adapter}: intercept paste before loading missing destination data`);
    await page.waitForFunction(name => Boolean(window[name + "Edits"]?.length), adapter);
    const state = await page.evaluate(name => ({ edits: window[name + "Edits"].map(({ rowId, columnId, value }) => ({ rowId, columnId, value })), ranges: window[name + "Source"].ranges }), adapter);
    assert.deepEqual(state.edits, [{ rowId: "0", columnId: "name", value: "edited row zero" }, { rowId: "1", columnId: "name", value: "edited row one" }]);
    assert.ok(state.ranges.some(([start, end]) => start === 0 && end === 2), `${adapter}: paste loads the missing destination range`);
    const committedBeforeQueryChange = state.edits.length;
    const secondCellSelector = adapter === "react" ? '[data-row-index="1"][data-column-index="1"]' : '.data-row[data-row-index="1"] [data-col-index="1"]';
    const secondCell = host.locator(secondCellSelector);
    await page.evaluate(name => { const source = window[name + "Source"]; source.cache.delete(2); source.deferRange = true; }, adapter);
    const errorsBeforePaste = await page.evaluate(() => window.pasteErrors?.length ?? 0);
    await secondCell.evaluate(node => {
      const data = new DataTransfer(); data.setData("text/plain", "stale row two\nstale row three");
      node.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: data }));
    });
    await page.waitForFunction(name => typeof window[name + "Source"].finishRange === "function", adapter);
    await page.evaluate(name => { const source = window[name + "Source"]; source.selectionScopeKey = "query-during-paste"; source.notify(); source.finishRange(); }, adapter);
    await page.waitForFunction(count => (window.pasteErrors?.length ?? 0) > count, errorsBeforePaste);
    assert.equal(await page.evaluate(name => window[name + "Edits"].length, adapter), committedBeforeQueryChange, `${adapter}: changed query blocks stale paste commit`);
    adapters[adapter] = { asyncSelectionCopy: true, unloadedRangePaste: true, loadedOnlyDestinationRows: true };
  }
  assert.deepEqual(pageErrors, []);
  console.log(JSON.stringify({ browser: "Chromium headless", adapters, pageErrors }));
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
