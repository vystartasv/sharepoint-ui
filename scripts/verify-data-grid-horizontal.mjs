import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "esbuild";

const dist = resolve("packages/sharepoint-ui/dist");
const reactBundle = await build({
  stdin: { contents: `import * as React from "react"; import { createRoot } from "react-dom/client"; import { DataGrid } from "${resolve("packages/sharepoint-ui/src/react.tsx")}"; const columns=Array.from({length:100},(_,i)=>({id:"c"+i,label:"Column "+i,width:"120px"})); const items=Array.from({length:500},(_,i)=>({id:"r"+i,...Object.fromEntries(columns.map((c,j)=>[c.id, "R"+i+" C"+j]))})); const getRowHeight=item=>item.id==="r0"?64:item.id==="r1"?24:40; window.mountReact=dir=>{document.getElementById("react").dir=dir;createRoot(document.getElementById("react")).render(React.createElement(DataGrid,{items,columns,getRowId:item=>item.id,height:260,rowHeight:40,getRowHeight,"aria-label":"React wide grid"}));};`, resolveDir: process.cwd(), sourcefile: "wide-grid.tsx", loader: "tsx" },
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
  if (pathname === "/") return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><div id='react'></div><div id='native'></div></body></html>");
  if (!/^\/elements\/(data-grid|data-grid-model|shared|virtual-list)\.js$/.test(pathname)) return response.writeHead(404).end();
  try { response.writeHead(200, { "content-type": "text/javascript", "cache-control": "no-store" }).end(readFileSync(resolve(dist, `.${pathname}`))); }
  catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 760, height: 700 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(base);
  await page.addScriptTag({ url: `${base}/react.js` });
  await page.evaluate(() => window.mountReact("ltr"));
  await page.evaluate(async url => {
    const { defineDataGrid } = await import(`${url}/elements/data-grid.js`); defineDataGrid();
    const grid = document.createElement("spui-data-grid"); grid.style.setProperty("--spui-data-grid-height", "260px");
    grid.columns = Array.from({ length: 100 }, (_, i) => ({ id: "c" + i, label: "Column " + i, width: "120px" }));
    grid.items = Array.from({ length: 500 }, (_, i) => ({ id: "r" + i, ...Object.fromEntries(grid.columns.map((c, j) => [c.id, "R" + i + " C" + j])) })); grid.itemKey = item => item.id; grid.getRowHeight = item => item.id === "r0" ? 64 : item.id === "r1" ? 24 : 40;
    document.getElementById("native").append(grid);
  }, base);
  const results = {};
  for (const adapter of ["react", "native"]) {
    const grid = adapter === "react" ? page.locator("#react [role=grid]") : page.locator("spui-data-grid");
    const cellSelector = adapter === "react" ? "[role=gridcell][data-column-index]" : ".cell[role=gridcell][data-col-index]";
    const cellCount = () => adapter === "react" ? grid.locator(cellSelector).count() : grid.evaluate(el => el.shadowRoot.querySelectorAll(".cell[role=gridcell][data-col-index]").length);
    const maxRowCells = () => adapter === "react" ? grid.locator('[role=row][data-row-index]').evaluateAll(rows => Math.max(0, ...rows.map(row => row.querySelectorAll('[role=gridcell][data-column-index]').length))) : grid.evaluate(el => Math.max(0, ...[...el.shadowRoot.querySelectorAll('.data-row')].map(row => row.querySelectorAll('.cell[role=gridcell][data-col-index]').length)));
    const initial = await cellCount();
    const maxInitial = await maxRowCells();
    assert.ok(maxInitial <= 10, `${adapter}: expected a bounded per-row column window, got ${maxInitial}; total mounted=${initial}`);
    const rowsInitiallyMounted = adapter === "react" ? await grid.locator('[role=row][data-row-index]').count() : await grid.evaluate(el => el.shadowRoot.querySelectorAll(".data-row[data-row-index]").length);
    const firstRowHeights = adapter === "react"
      ? await grid.locator('[role=row][data-row-index="0"],[role=row][data-row-index="1"]').evaluateAll(rows => rows.map(row => Math.round(row.getBoundingClientRect().height)))
      : await grid.evaluate(el => [0, 1].map(index => Math.round(el.shadowRoot.querySelector(`.data-row[data-row-index="${index}"]`).getBoundingClientRect().height)));
    assert.deepEqual(firstRowHeights, [64, 24], `${adapter}: variable row heights must be applied per record`);
    const gridHeight = adapter === "react" ? grid : grid.locator(".viewport");
    const measuredHeaderHeight = adapter === "react"
      ? await grid.locator(".spui-grid-header [role=row]").evaluate(row => row.getBoundingClientRect().height)
      : await grid.evaluate(el => el.shadowRoot.querySelector(".header-row").getBoundingClientRect().height);
    const expectedScrollHeight = Math.round(measuredHeaderHeight + 64 + 24 + 498 * 40);
    const measuredScrollHeight = adapter === "react" ? await grid.evaluate(el => el.scrollHeight) : await gridHeight.evaluate(el => el.scrollHeight);
    const scrollDetails = adapter === "native" ? await grid.evaluate(el => ({ rows: el.shadowRoot.querySelectorAll(".data-row").length, top: el.shadowRoot.querySelector(".body > [aria-hidden=true]")?.style.height, bottom: el.shadowRoot.querySelector(".body > [aria-hidden=true]:last-child")?.style.height, header: el.shadowRoot.querySelector(".header").getBoundingClientRect().height, body: el.shadowRoot.querySelector(".body").getBoundingClientRect().height })) : undefined;
    assert.ok(Math.abs(measuredScrollHeight - expectedScrollHeight) <= 2, `${adapter}: expected measured scroll extent ${expectedScrollHeight}, got ${measuredScrollHeight} ${JSON.stringify(scrollDetails)}`);
    const rowTwenty = adapter === "react" ? grid.locator('[data-row-index="0"][data-column-index="0"]') : grid.locator('.data-row[data-row-index="0"] [data-col-index="0"]');
    await rowTwenty.focus();
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(80);
    const focusedRow = adapter === "react"
      ? await page.evaluate(() => document.activeElement?.getAttribute("data-row-index"))
      : await grid.evaluate(el => el.shadowRoot.activeElement?.closest("[data-row-index]")?.getAttribute("data-row-index"));
    assert.equal(focusedRow, "1", `${adapter}: keyboard navigation should advance through mixed-size rows`);
    if (adapter === "react") await grid.evaluate(el => { el.scrollTop = el.scrollHeight; });
    else await grid.locator(".viewport").evaluate(el => { el.scrollTop = el.scrollHeight; });
    await page.waitForFunction(({ nativeGrid }) => nativeGrid
      ? Boolean(document.querySelector("spui-data-grid")?.shadowRoot.querySelector('.data-row[data-row-index="499"]'))
      : Boolean(document.querySelector('#react [role="grid"] [role="row"][data-row-index="499"]')), { nativeGrid: adapter === "native" });
    const lastMounted = adapter === "react" ? await grid.locator('[role=row][data-row-index="499"]').count() : await grid.evaluate(el => el.shadowRoot.querySelectorAll('.data-row[data-row-index="499"]').length);
    assert.equal(lastMounted, 1, `${adapter}: end scrolling should render the final variable-height row`);
    results[adapter] = { initialCells: initial, rowsInitiallyMounted, firstRowHeights, measuredScrollHeight, focusedRow, lastRowMountedAtEnd: lastMounted };
    const columnCount = adapter === "react" ? await grid.getAttribute("aria-colcount") : await grid.evaluate(el => el.shadowRoot.querySelector("[role=grid]").getAttribute("aria-colcount")); assert.equal(columnCount, "100");
    if (adapter === "react") await grid.evaluate(el => { el.scrollTop = 0; });
    else await grid.locator(".viewport").evaluate(el => { el.scrollTop = 0; });
    if (adapter === "react") await grid.locator("[data-row-index=\"0\"][data-column-index=\"0\"]").waitFor();
    else await grid.locator(".data-row[data-row-index=\"0\"] [data-col-index=\"0\"]").waitFor();
    if (adapter === "react") {
      await grid.locator('[data-row-index="0"][data-column-index="0"]').focus();
      await page.keyboard.press("End");
      await page.waitForFunction(() => document.querySelector('#react [data-row-index="0"][data-column-index="99"]')?.matches(":focus"));
    } else {
      await grid.evaluate(el => el.shadowRoot.querySelector('.data-row[data-row-index="0"] [data-col-index="0"]').focus());
      await page.keyboard.press("End");
      await page.waitForFunction(() => { const e = document.querySelector("spui-data-grid")?.shadowRoot; return e?.activeElement?.getAttribute("data-col-index") === "99"; }, undefined, { timeout: 3000 }).catch(() => undefined);
      const nativeFocus = await grid.evaluate(el => { const active=el.shadowRoot.activeElement?.getAttribute("data-col-index"); const target=el.shadowRoot.querySelector('.data-row[data-row-index="0"] [data-col-index="99"]'); target.focus(); return { keyboardActive:active, focusAfterDirectCall:el.shadowRoot.activeElement?.getAttribute("data-col-index"), focusable:target.tabIndex, scrollLeft:el.shadowRoot.querySelector('.viewport').scrollLeft }; });
      assert.equal(nativeFocus.keyboardActive, "99", `Native keyboard did not focus the last cell: ${JSON.stringify(nativeFocus)}`);
    }
    const mountedAtEnd = await cellCount();
    const maxAtEnd = await maxRowCells();
    const lastIndex = adapter === "react" ? await grid.locator('[data-row-index="0"][data-column-index="99"]').getAttribute("aria-colindex") : await grid.evaluate(el => el.shadowRoot.querySelector('.data-row[data-row-index="0"] [data-col-index="99"]')?.getAttribute("aria-colindex"));
    assert.ok(maxAtEnd <= 10, `${adapter}: window expanded unexpectedly to ${maxAtEnd} cells per row`);
    assert.equal(lastIndex, "100");
    Object.assign(results[adapter], { initiallyMountedCells: initial, maxInitialCellsPerRow: maxInitial, mountedAtEnd, maxCellsPerRowAtEnd: maxAtEnd, fullAriaColumnCount: columnCount, lastAriaColumnIndex: lastIndex });
  }
  await page.evaluate(() => { const host = document.getElementById("react"); host.dir = "rtl"; });
  await page.waitForTimeout(50);
  await page.locator('#react [role=grid] [data-row-index="0"][data-column-index="0"]').focus();
  await page.keyboard.press("End");
  await page.waitForFunction(() => document.querySelector('#react [data-row-index="0"][data-column-index="99"]')?.matches(":focus"));
  results.reactRtlEndNavigation = true;
  const native = page.locator("spui-data-grid");
  await native.evaluate(async el => { el.dir="rtl"; const viewport=el.shadowRoot.querySelector(".viewport"); viewport.scrollLeft=0; await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))); el.shadowRoot.querySelector('.data-row[data-row-index="0"] [data-col-index="0"]')?.focus(); });
  await page.keyboard.press("End");
  await page.waitForFunction(() => document.querySelector("spui-data-grid")?.shadowRoot.activeElement?.getAttribute("data-col-index") === "99");
  results.nativeRtlEndNavigation = true;
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ browser: "Chromium headless", columns: 100, dataRows: 500, assertions: "passed", ...results }, null, 2));
} finally { await browser?.close(); await new Promise(done => server.close(done)); }
