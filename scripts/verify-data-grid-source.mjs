import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "esbuild";
import { VariableSizeIndex } from "../packages/sharepoint-ui/dist/elements/virtual-list.js";

const fixedIndex = new VariableSizeIndex(10_000_000, 32);
assert.equal(fixedIndex.totalSize, 320_000_000, "fixed row sizes compute total scroll height without per-row index arrays");
assert.equal(fixedIndex.offset(9_876_543), 316_049_376);
assert.equal(fixedIndex.indexAt(316_049_376), 9_876_543);
const measuredIndex = new VariableSizeIndex(10, 32);
assert.equal(measuredIndex.set(5, 64), 32, "measured heights promote the fixed index to variable mode");
assert.equal(measuredIndex.offset(6), 224);

const dist = resolve("packages/sharepoint-ui/dist");
const reactBundle = await build({
  stdin: { contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{DataGrid}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";window.React=React;window.createRoot=createRoot;window.DataGrid=DataGrid;window.makeSource=makeSource;function makeSource(){const items=Array(50000).fill(undefined),listeners=new Set(),requests=[];return{items,requests,reads:0,selectionScopeKey:"query-1",failNext:false,get length(){return items.length},getItem(i){this.reads++;return items[i]},subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener)},notify(){for(const listener of listeners)listener()},async loadRange(start,end,signal){const request={start,end,aborted:false};requests.push(request);await new Promise((resolve,reject)=>{const timer=setTimeout(resolve,80);signal.addEventListener("abort",()=>{clearTimeout(timer);request.aborted=true;reject(new DOMException("Aborted","AbortError"))},{once:true})});if(signal.aborted)return;if(this.failNext){this.failNext=false;throw new Error("range load failed")};for(let i=start;i<end;i++)items[i]={id:i,name:"Loaded row "+i};this.notify()}}}window.reactSource=makeSource();window.reactErrors=[];window.reactSelectionChanges=[];createRoot(document.getElementById("react")).render(React.createElement(DataGrid,{selectionMode:"multiple",onDataSourceSelectionChange:(selection,items)=>window.reactSelectionChanges.push({selection,keys:items.map(item=>String(item.id))}),dataSource:window.reactSource,columns:[{id:"name",label:"Name",sortable:false}],getRowId:item=>item.id,height:180,rowHeight:32,overscan:2,onDataLoadError:error=>window.reactErrors.push(String(error))}));`, resolveDir: process.cwd(), sourcefile: "data-grid-source.tsx", loader: "tsx" },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); }
catch { const fallback = "/Users/vilius/.t3/projects/spfx-research/node_modules/playwright"; if (!existsSync(fallback)) throw new Error("Install Playwright locally or provide the workspace Playwright package."); ({ chromium } = require(fallback)); }
const server = createServer((request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  if (pathname === "/react.js") return response.writeHead(200, { "content-type": "text/javascript" }).end(reactBundle.outputFiles[0].contents);
  if (pathname === "/") return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><div id='react'></div><div id='native'></div><div id='group-react'></div><div id='group-native'></div><script src='/react.js'></script></body></html>");
  if (!/^\/elements\/(data-grid|data-grid-model|shared|virtual-list)\.js$/.test(pathname)) return response.writeHead(404).end();
  try { response.writeHead(200, { "content-type": "text/javascript", "cache-control": "no-store" }).end(readFileSync(resolve(dist, `.${pathname}`))); }
  catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 700, height: 500 } });
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(base);
  await page.evaluate(async url => {
    const { defineDataGrid } = await import(`${url}/elements/data-grid.js`); defineDataGrid();
    const grid = document.createElement("spui-data-grid"); grid.setAttribute("aria-label", "Native records"); grid.setAttribute("selection-mode","multiple"); grid.onDataSourceSelectionChange=(selection,items)=>window.nativeSelectionChanges.push({selection,keys:items.map(item=>String(item.id))}); window.nativeSelectionChanges=[]; grid.addEventListener("spui-selection-change",event=>window.nativeSelectionEvent=event.detail.selectionModel); grid.style.setProperty("--spui-data-grid-height", "180px"); grid.columns = [{ id: "name", label: "Name", sortable: false }]; grid.itemKey = item => item.id; window.nativeSource = window.makeSource(); grid.dataSource = window.nativeSource; window.nativeErrors = []; grid.addEventListener("spui-data-load-error", event => window.nativeErrors.push(String(event.detail.error))); document.getElementById("native").append(grid); window.nativeGrid = grid;
    function groupedSource(){let rows=[{kind:"group",key:"people",label:"People",count:2,expanded:false}];const listeners=new Set();return{get length(){return rows.length},getRow(index){return rows[index]},subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener)},notify(){for(const listener of listeners)listener()},loadRange(){},toggle(key,expanded){if(key!=="people")return;if(expanded)rows=[{kind:"group",key,label:"People",count:2,expanded:true},{kind:"item",item:{id:"ada",name:"Ada"}},{kind:"item",item:{id:"linus",name:"Linus"}}];else rows=[{kind:"group",key,label:"People",count:2,expanded:false}];this.notify()}}}
    window.groupNativeSource=groupedSource();window.nativeGroupToggles=[];const grouped=document.createElement("spui-data-grid");grouped.style.setProperty("--spui-data-grid-height","180px");grouped.columns=[{id:"name",label:"Name",sortable:false}];grouped.dataSource=window.groupNativeSource;grouped.onDataSourceGroupToggle=(key,expanded)=>{window.nativeGroupToggles.push({key,expanded});window.groupNativeSource.toggle(key,expanded)};grouped.addEventListener("spui-data-source-group-toggle",event=>window.nativeGroupEvent=event.detail);document.getElementById("group-native").append(grouped);window.nativeGroupedGrid=grouped;
    window.groupReactSource=groupedSource();window.reactGroupToggles=[];window.createRoot(document.getElementById("group-react")).render(window.React.createElement(window.DataGrid,{dataSource:window.groupReactSource,columns:[{id:"name",label:"Name",sortable:false}],getRowId:item=>item.id,height:180,onDataSourceGroupToggle:(key,expanded)=>{window.reactGroupToggles.push({key,expanded});window.groupReactSource.toggle(key,expanded)}}));
  }, base);
  const react = page.locator("#react [role=grid]");
  const native = page.locator("#native spui-data-grid");
  const nativeViewport = native.locator(".viewport");
  const reactGroup = page.locator("#group-react [role=grid]");
  const nativeGroup = page.locator("#group-native spui-data-grid");
  const groupButtonReact = reactGroup.locator(".spui-grid-group-button");
  const groupButtonNative = nativeGroup.locator(".group-cell button[data-group-toggle]");
  await page.waitForFunction(() => window.reactSource.requests.length > 0 && window.nativeSource.requests.length > 0);
  await react.evaluate(node => { node.scrollTop = 160000; node.dispatchEvent(new Event("scroll")); });
  await nativeViewport.evaluate(node => { node.scrollTop = 160000; node.dispatchEvent(new Event("scroll")); });
  await page.waitForFunction(() => window.reactSource.requests.some(request => request.aborted) && window.nativeSource.requests.some(request => request.aborted));
  await react.evaluate(node => { node.scrollTop = 0; node.dispatchEvent(new Event("scroll")); });
  await nativeViewport.evaluate(node => { node.scrollTop = 0; node.dispatchEvent(new Event("scroll")); });
  await page.waitForFunction(() => window.reactSource.items[0] && window.nativeSource.items[0]);
  await groupButtonReact.waitFor(); await groupButtonNative.waitFor();
  assert.equal(await groupButtonReact.getAttribute("aria-expanded"), "false");
  assert.equal(await groupButtonNative.getAttribute("aria-expanded"), "false");
  await groupButtonReact.focus(); await page.keyboard.press("Space");
  await groupButtonNative.focus(); await page.keyboard.press("Space");
  await page.waitForFunction(() => window.groupReactSource.length === 3 && window.groupNativeSource.length === 3);
  assert.equal(await reactGroup.getAttribute("aria-rowcount"), "4");
  assert.equal(await nativeGroup.locator(".viewport").getAttribute("aria-rowcount"), "4");
  assert.ok(await reactGroup.getByText("Ada").count());
  assert.ok(await nativeGroup.getByText("Ada").count());
  assert.deepEqual(await page.evaluate(() => ({ react: window.reactGroupToggles, native: window.nativeGroupToggles, event: window.nativeGroupEvent })), { react: [{ key: "people", expanded: true }], native: [{ key: "people", expanded: true }], event: { groupKey: "people", expanded: true } });
  await reactGroup.locator(".spui-grid-group-button").click(); await nativeGroup.locator(".group-cell button[data-group-toggle]").click();
  await page.waitForFunction(() => window.groupReactSource.length === 1 && window.groupNativeSource.length === 1);
  const groupedRows = { expandedCount: 2, collapseRestoredHeaderOnly: true, reactAndNativeCallbacks: true, accessibleExpandedState: true };
  const initial = await page.evaluate(() => ({
    react: { busy: document.querySelector("#react [role=grid]").getAttribute("aria-busy"), rows: document.querySelectorAll("#react [role=row][data-row-index]").length, total: document.querySelector("#react [role=grid]").getAttribute("aria-rowcount") },
    native: { busy: window.nativeGrid.shadowRoot.querySelector(".viewport").getAttribute("aria-busy"), rows: window.nativeGrid.shadowRoot.querySelectorAll(".data-row[data-row-index]").length, total: window.nativeGrid.shadowRoot.querySelector(".viewport").getAttribute("aria-rowcount") },
    ranges: { react: window.reactSource.requests.map(({start,end})=>({start,end})), native: window.nativeSource.requests.map(({start,end})=>({start,end})) }
  }));
  assert.equal(initial.react.total, "50001"); assert.equal(initial.native.total, "50001");
  assert.ok(initial.react.rows <= 20 && initial.native.rows <= 20, "large indexed source renders only a bounded viewport");
  assert.ok(initial.ranges.react.every(range => range.end - range.start <= 20));
  assert.ok(initial.ranges.native.every(range => range.end - range.start <= 20));

  const reactSelectAll = react.locator("[role=columnheader] input[type=checkbox]");
  const nativeSelectAll = native.locator("[data-select-all]");
  await reactSelectAll.click(); await nativeSelectAll.click();
  assert.deepEqual(await page.evaluate(() => ({ react: window.reactSelectionChanges.at(-1).selection, native: window.nativeSelectionChanges.at(-1).selection })), { react: { mode: "all", excludedKeys: [], scopeKey: "query-1" }, native: { mode: "all", excludedKeys: [], scopeKey: "query-1" } });
  assert.equal(await react.locator('.spui-grid-row[data-row-index="0"]').getAttribute("aria-selected"), "true");
  assert.equal(await native.locator('.data-row[data-row-index="0"]').getAttribute("aria-selected"), "true");
  await react.locator('.spui-grid-row[data-row-index="0"] input').click();
  await native.locator('.data-row[data-row-index="0"] input[data-row-select]').click();
  assert.deepEqual(await page.evaluate(() => ({ react: window.reactSelectionChanges.at(-1).selection, native: window.nativeSelectionChanges.at(-1).selection })), { react: { mode: "all", excludedKeys: ["0"], scopeKey: "query-1" }, native: { mode: "all", excludedKeys: ["0"], scopeKey: "query-1" } });
  assert.equal(await reactSelectAll.evaluate(node => node.indeterminate), true);
  assert.equal(await nativeSelectAll.evaluate(node => node.indeterminate), true);
  await reactSelectAll.click(); await nativeSelectAll.click();
  assert.deepEqual(await page.evaluate(() => ({ react: window.reactSelectionChanges.at(-1).selection, native: window.nativeSelectionChanges.at(-1).selection })), { react: { mode: "all", excludedKeys: [], scopeKey: "query-1" }, native: { mode: "all", excludedKeys: [], scopeKey: "query-1" } });
  await reactSelectAll.click(); await nativeSelectAll.click();
  assert.deepEqual(await page.evaluate(() => ({ react: window.reactSelectionChanges.at(-1).selection, native: window.nativeSelectionChanges.at(-1).selection })), { react: { mode: "explicit", keys: [] }, native: { mode: "explicit", keys: [] } });
  await page.evaluate(() => { window.reactSource.selectionScopeKey = "query-2"; window.nativeSource.selectionScopeKey = "query-2"; window.reactSource.notify(); window.nativeSource.notify(); });
  await reactSelectAll.click(); await nativeSelectAll.click();
  assert.deepEqual(await page.evaluate(() => ({ react: window.reactSelectionChanges.at(-1).selection, native: window.nativeSelectionChanges.at(-1).selection })), { react: { mode: "all", excludedKeys: [], scopeKey: "query-2" }, native: { mode: "all", excludedKeys: [], scopeKey: "query-2" } });
  await page.evaluate(() => { window.reactSource.selectionScopeKey = "query-3"; window.nativeSource.selectionScopeKey = "query-3"; window.reactSource.notify(); window.nativeSource.notify(); });
  await page.waitForFunction(() => document.querySelector('#react [data-row-index="0"]').getAttribute("aria-selected") === "false" && window.nativeGrid.shadowRoot.querySelector('.data-row[data-row-index="0"]').getAttribute("aria-selected") === "false");
  assert.equal(await reactSelectAll.isChecked(), false); assert.equal(await nativeSelectAll.isChecked(), false);
  await react.locator('.spui-grid-row[data-row-index="0"] input').click();
  await native.locator('.data-row[data-row-index="0"] input[data-row-select]').click();
  assert.deepEqual(await page.evaluate(() => ({ react: window.reactSelectionChanges.at(-1).selection, native: window.nativeSelectionChanges.at(-1).selection })), { react: { mode: "explicit", keys: ["0"] }, native: { mode: "explicit", keys: ["0"] } });
  const sourceSelection = { selectsAllMatchesWithoutLoading: true, rowExclusion: true, partialCheckboxState: true, clearSelection: true, queryScopeReset: true, reactAndNativeParity: true };

  await page.evaluate(() => { window.reactSource.failNext = true; window.nativeSource.failNext = true; });
  await react.evaluate(node => { node.scrollTop = 160000; node.dispatchEvent(new Event("scroll")); });
  await nativeViewport.evaluate(node => { node.scrollTop = 160000; node.dispatchEvent(new Event("scroll")); });
  await page.waitForFunction(() => window.reactErrors.length === 1 && window.nativeErrors.length === 1);
  assert.match(await page.evaluate(() => window.reactErrors[0]), /range load failed/);
  assert.match(await page.evaluate(() => window.nativeErrors[0]), /range load failed/);

  await page.evaluate(() => { window.reactSource.notify(); window.nativeSource.notify(); });
  await page.waitForFunction(() => window.reactSource.items[window.reactSource.requests.at(-1).start] && window.nativeSource.items[window.nativeSource.requests.at(-1).start]);
  await page.waitForFunction(() => document.querySelector("#react [role=grid]").getAttribute("aria-busy") !== "true" && window.nativeGrid.shadowRoot.querySelector(".viewport").getAttribute("aria-busy") === "false");
  await reactSelectAll.focus(); await page.keyboard.press("Control+End");
  await page.waitForFunction(() => document.activeElement?.closest('[data-row-index="49999"]') && window.reactSource.items[49999]);
  const reactBoundaryRow = await page.evaluate(() => document.activeElement?.closest("[data-row-index]")?.getAttribute("data-row-index"));
  await nativeSelectAll.focus(); await page.keyboard.press("Control+End");
  await page.waitForFunction(() => window.nativeGrid.shadowRoot.activeElement?.closest('[data-row-index="49999"]') && window.nativeSource.items[49999]);
  assert.equal(reactBoundaryRow, "49999", "React Ctrl+End loads and focuses the final indexed-source row");
  assert.equal(await native.evaluate(element => element.shadowRoot.activeElement?.closest("[data-row-index]")?.getAttribute("data-row-index")), "49999", "native Ctrl+End loads and focuses the final indexed-source row");
  assert.deepEqual(errors, []);
  const sourceReads = await page.evaluate(() => ({ react: window.reactSource.reads, native: window.nativeSource.reads }));
  assert.ok(sourceReads.react < 50000 && sourceReads.native < 50000, "source reads remain below one full dataset scan");
  console.log(JSON.stringify({ status: "passed", totalRows: 50000, initial, sourceReads, sourceSelection, boundaryNavigation: { reactAndNativeCtrlEndLoadsAndFocusesLastRow: true }, staleRangesCancelled: { react: true, native: true }, failuresReported: { react: 1, native: 1 }, subscriptionRetry: true, groupedRows, pageErrors: errors }, null, 2));
} finally { await browser?.close(); await new Promise(done => server.close(done)); }
