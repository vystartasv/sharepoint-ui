import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    contents: `import * as React from "react"; import {createRoot} from "react-dom/client"; import {DataGrid,DataGridBody,DataGridCell,DataGridHeader,DataGridHeaderCell,DataGridRow,DataGridSelectionCell,createTableColumn} from "${resolve("packages/sharepoint-ui/src/react.tsx")}"; const cache=new Map(),listeners=new Set(); const source={length:2001,selectableCount:2000,selectionScopeKey:"query-a",getItem(index){const row=cache.get(index);return row?.kind==="item"?row.item:undefined},getRow(index){return cache.get(index)},subscribe(listener){listeners.add(listener);return()=>{listeners.delete(listener)}},async loadRange(start,end,signal){window.requests.push({start,end});await new Promise(resolve=>setTimeout(resolve,120));if(signal.aborted){window.aborts++;window.outcomes.push({start,aborted:true});return}if(window.failNext&&start>=400&&start<600){window.failNext=false;window.outcomes.push({start,failed:true});throw Error("Range request failed")}window.outcomes.push({start,loaded:true});for(let index=start;index<end;index++)cache.set(index,index===1999?{kind:"group",key:"work",label:"Work items",count:100,expanded:false}:{kind:"item",rowId:"record-"+index,item:{id:"record-"+index,name:"Record "+index}});listeners.forEach(listener=>listener())}}; window.dataCache=cache; const columns=[createTableColumn({columnId:"name",renderHeaderCell:()=>"Name",renderCell:item=>item.name})]; window.requests=[];window.outcomes=[];window.aborts=0;window.ranges=[];window.loadErrors=[];window.groupToggles=[];window.failNext=false;window.notifySource=()=>listeners.forEach(listener=>listener());window.changeScope=()=>{source.selectionScopeKey="query-b";listeners.forEach(listener=>listener())}; window.mountAsync=()=>{function App(){return <DataGrid data-testid="async-composed-grid" aria-label="Async composed records" selectionMode="multiselect" dataSource={source} columns={columns} getRowId={item=>item.id} rowHeight={32} overscan={2} onRenderedRange={range=>{window.ranges.push(range)}} onDataLoadError={(error,range)=>window.loadErrors.push({message:error.message,...range})} onDataSourceGroupToggle={(key,expanded)=>window.groupToggles.push({key,expanded})} onDataSourceSelectionChange={(selection,items)=>{window.selectionModel=selection;window.selectedLoaded=items.length}} loadingLabel="Loading records" style={{height:180}}><DataGridHeader><DataGridRow><DataGridSelectionCell label="Select all records"/><DataGridHeaderCell sortable={false}>Name</DataGridHeaderCell></DataGridRow></DataGridHeader><DataGridBody>{({item,rowId,index})=><DataGridRow key={rowId} item={item} rowId={rowId} rowIndex={index+1}><DataGridSelectionCell label={"Select "+item.name}/><DataGridCell columnId="name">{item.name}</DataGridCell></DataGridRow>}</DataGridBody></DataGrid>} createRoot(document.getElementById("root")).render(<App/>)};`,
    resolveDir: process.cwd(), sourcefile: "data-grid-composition-async.tsx", loader: "tsx",
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
  const page = await browser.newPage({ viewport: { width: 900, height: 500 } });
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.addScriptTag({ url: `http://127.0.0.1:${server.address().port}/bundle.js` });
  await page.evaluate(() => window.mountAsync());
  const grid = page.getByTestId("async-composed-grid");
  const gridHtml = await page.locator("body").innerHTML();
  assert.ok(await grid.count(), `composed grid should mount: ${gridHtml.slice(0, 1600)}; pageErrors=${errors.join(" | ")}`);
  assert.equal(await grid.getAttribute("role"), "grid");
  assert.equal(await grid.getAttribute("aria-label"), "Async composed records");
  await page.waitForFunction(() => window.requests.length > 0);
  await page.waitForFunction(() => document.querySelector('[data-testid="async-composed-grid"]')?.getAttribute("aria-busy") === "true");
  assert.equal(await grid.getAttribute("aria-rowcount"), "2002", "row count includes header and indexed source rows");
  await grid.evaluate(element => { element.scrollTop = element.scrollHeight; element.dispatchEvent(new Event("scroll")); });
  await grid.getByRole("button", { name: "Expand group Work items" }).waitFor({ state: "visible", timeout: 10000 });
  await page.getByText("Record 2000", { exact: true }).waitFor({ state: "visible", timeout: 10000 });
  await page.waitForFunction(() => document.querySelector('[data-testid="async-composed-grid"]')?.getAttribute("aria-busy") !== "true");
  assert.ok(await page.evaluate(() => window.aborts) > 0, "scrolling to a new range aborts the stale request");
  assert.ok(await page.evaluate(() => window.requests.at(-1).start > 1900), "scroll position requests only the visible tail range");
  const tailMountedRows = await grid.getByRole("row").count();
  assert.ok(tailMountedRows <= 20, "only a viewport-sized set of source rows is mounted");
  const selectAll = grid.getByRole("checkbox", { name: "Select all records" });
  await selectAll.check();
  assert.deepEqual(await page.evaluate(() => window.selectionModel), { mode: "all", excludedKeys: [], scopeKey: "query-a" }, "select-all uses a compact query-scoped model");
  const tailSelection = grid.getByRole("checkbox", { name: "Select Record 2000" });
  assert.equal(await tailSelection.isChecked(), true, "all matching rows are checked by key");
  await tailSelection.uncheck();
  assert.deepEqual(await page.evaluate(() => window.selectionModel), { mode: "all", excludedKeys: ["record-2000"], scopeKey: "query-a" }, "row deselection adds an exclusion without enumerating the source");
  await page.evaluate(() => window.changeScope());
  assert.equal(await tailSelection.isChecked(), false, "all-matching selection stops applying after the query scope changes");
  await grid.getByRole("button", { name: "Expand group Work items" }).click();
  assert.deepEqual(await page.evaluate(() => window.groupToggles), [{ key: "work", expanded: true }], "provider group rows expose their state and emit toggle requests");
  await page.evaluate(() => { window.failNext = true; window.loadEventCount = 0; const element = document.querySelector('[data-testid="async-composed-grid"]'); element.addEventListener("spui-data-load-error", () => window.loadEventCount++); element.scrollTop = 500 * 32; element.dispatchEvent(new Event("scroll")); });
  await page.waitForFunction(() => window.requests.some(request => request.start >= 400 && request.start < 600), null, { timeout: 5000 }).catch(() => {});
  const requestRanges = await page.evaluate(() => window.requests);
  assert.ok(requestRanges.some(request => request.start >= 400 && request.start < 600), `middle range requested; requests=${JSON.stringify(requestRanges)}`);
  await page.waitForFunction(() => window.loadErrors.length > 0 || window.outcomes.some(outcome => outcome.failed), null, { timeout: 3000 }).catch(() => {});
  const failureState = await page.evaluate(() => ({ errors: window.loadErrors, outcomes: window.outcomes, failNext: window.failNext, html: document.querySelector('[data-testid="async-composed-grid"]')?.innerHTML.slice(-500) }));
  assert.equal(failureState.errors.length, 1, `range failure is surfaced: ${JSON.stringify(failureState)}`);
  assert.equal(await page.evaluate(() => window.loadEventCount), 1, "range failure also emits the bubbling custom event");
  await page.getByRole("alert").getByText("Range request failed").waitFor({ state: "visible", timeout: 1000 });
  assert.equal(await page.evaluate(() => window.loadErrors.length), 1, "range failures reach the callback");
  await page.evaluate(() => window.notifySource());
  await page.getByText("Record 500", { exact: true }).waitFor({ state: "visible", timeout: 10000 });
  assert.equal(await page.getByRole("alert").count(), 0, "a provider notification retries and clears a failed range");
  const lastVisibleCell = grid.locator('[role="gridcell"][data-column-id="name"]').last();
  const nextGridRow = Number(await lastVisibleCell.getAttribute("data-grid-row-index")) + 1;
  await lastVisibleCell.focus(); await page.keyboard.press("ArrowDown");
  await page.waitForFunction(row => document.activeElement?.getAttribute("data-grid-row-index") === String(row), nextGridRow, { timeout: 3000 }).catch(() => {});
  const navigationState = await page.evaluate(row => ({ active: document.activeElement?.outerHTML, target: document.querySelector(`[data-grid-row-index="${row}"][data-grid-column-index]`)?.outerHTML, mountedRows: [...document.querySelectorAll('[data-grid-row-index]')].map(element => element.getAttribute("data-grid-row-index")), cachedRows: [...window.dataCache.keys()].filter(index => index >= 500 && index <= 510), outcomes: window.outcomes.slice(-6), scrollTop: document.querySelector('[data-testid="async-composed-grid"]')?.scrollTop, ranges: window.ranges.slice(-3), requests: window.requests.slice(-3) }), nextGridRow);
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("data-grid-row-index")), String(nextGridRow), `arrow navigation focuses the next loaded row: ${JSON.stringify(navigationState)}`);
  assert.ok(await page.evaluate(() => window.requests.at(-1).start >= 500), "arrow navigation scrolls into and loads the next unmounted row");
  assert.ok(await page.evaluate(() => window.ranges.at(-1).total === 2001), "rendered-range callback reports source length");
  assert.deepEqual(errors, []);
  const sourceMetrics = await page.evaluate(() => ({ requests: window.requests.length, maxRequestedRows: Math.max(...window.requests.map(range => range.end - range.start)), abortedRequests: window.aborts }));
  console.log(JSON.stringify({ status: "passed", sourceRows: 2001, viewportHeightPx: 180, tailMountedRows, ...sourceMetrics, viewportBoundedRendering: true, staleRequestAborted: true, tailRangeLoaded: true, compactQueryScopedSelection: true, providerGroupToggle: true, loadErrorAndSubscriptionRetry: true, keyboardScrollReveal: true, pageErrors: errors }, null, 2));
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
