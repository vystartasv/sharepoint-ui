import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "esbuild";
import { fitDataGridColumnWidths } from "../packages/sharepoint-ui/dist/elements/data-grid-model.js";

const sizingColumns = [{ id: "first", label: "First" }, { id: "second", label: "Second" }, { id: "last", label: "Last" }];
const sizingOptions = { first: { defaultWidth: 100, idealWidth: 180, minWidth: 80, padding: 0 }, second: { defaultWidth: 100, idealWidth: 150, minWidth: 80, padding: 0 }, last: { defaultWidth: 120, idealWidth: 120, minWidth: 80, padding: 0 } };
assert.deepEqual(fitDataGridColumnWidths(sizingColumns, 400, sizingOptions), { first: 180, second: 100, last: 120 }, "auto-fit expands toward ideal widths in column order");
assert.deepEqual(fitDataGridColumnWidths(sizingColumns, 250, sizingOptions, { first: 180, second: 100, last: 120 }), { first: 90, second: 80, last: 80 }, "auto-fit shrinks from the last column toward each minimum");

const dist = resolve("packages/sharepoint-ui/dist");
const reactBundle = await build({
  stdin: { contents: `import * as React from "react"; import {createRoot} from "react-dom/client"; import {DataGrid} from "${resolve("packages/sharepoint-ui/src/react.tsx")}"; const items=[{id:"a",name:"A deliberately long cell value"}]; const columns=[{id:"name",label:"Name",sortable:false}]; window.reactResizeEvents=[]; window.mount=(target,autoFit,options,customColumns=columns,customItems=items,offset=0,mode="none")=>createRoot(document.getElementById(target)).render(React.createElement(DataGrid,{items:customItems,columns:customColumns,getRowId:item=>item.id,resizableColumns:true,columnSizingOptions:options,resizableColumnsOptions:{autoFitColumns:autoFit},containerWidthOffset:offset,selectionMode:mode,onColumnResize:(event,data)=>window.reactResizeEvents.push({eventType:event.type,columnId:data.columnId,width:data.width}),height:240}));`, resolveDir: process.cwd(), sourcefile: "data-grid-sizing.tsx", loader: "tsx" },
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
  if (pathname === "/") return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><div id='react' style='width:680px'></div><div id='native' style='width:680px'></div><div id='autofit-react' style='width:680px'></div><div id='autofit-native' style='width:680px'></div><div id='distribution-react' style='width:400px'></div><div id='distribution-native' style='width:400px'></div></body></html>");
  if (!/^\/elements\/(data-grid|data-grid-model|shared|virtual-list)\.js$/.test(pathname)) return response.writeHead(404).end();
  try { response.writeHead(200, { "content-type": "text/javascript", "cache-control": "no-store" }).end(readFileSync(resolve(dist, `.${pathname}`))); }
  catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(base);
  await page.addScriptTag({ url: `${base}/react.js` });
  await page.evaluate(async url => {
    const { defineDataGrid } = await import(`${url}/elements/data-grid.js`);
    defineDataGrid();
    const grid = document.createElement("spui-data-grid");
    grid.items = [{ id: "a", name: "A deliberately long cell value" }];
    grid.columns = [{ id: "name", label: "Name", sortable: false }];
    grid.itemKey = item => item.id;
    grid.resizableColumns = true;
    window.resizeEvents = [];
    grid.addEventListener("spui-column-resize", event => window.resizeEvents.push(event.detail));
    document.getElementById("native").append(grid);
    window.nativeGrid = grid;
    const autoFitGrid = document.createElement("spui-data-grid");
    autoFitGrid.items = [{ id: "a", name: "A deliberately long cell value" }];
    autoFitGrid.columns = [{ id: "name", label: "Name", sortable: false }];
    autoFitGrid.itemKey = item => item.id;
    autoFitGrid.resizableColumns = true;
    autoFitGrid.containerWidthOffset = 40;
    autoFitGrid.setAttribute("selection-mode", "multiselect");
    document.getElementById("autofit-native").append(autoFitGrid);
    window.autoFitNativeGrid = autoFitGrid;
    const distributionGrid = document.createElement("spui-data-grid");
    distributionGrid.items = [{ id: "a", first: "A", second: "B", last: "C" }];
    distributionGrid.columns = [{ id: "first", label: "First" }, { id: "second", label: "Second" }, { id: "last", label: "Last" }];
    distributionGrid.itemKey = item => item.id;
    distributionGrid.resizableColumns = true;
    distributionGrid.columnSizingOptions = { first: { defaultWidth: 100, idealWidth: 180, minWidth: 80, padding: 0 }, second: { defaultWidth: 100, idealWidth: 150, minWidth: 80, padding: 0 }, last: { defaultWidth: 120, idealWidth: 120, minWidth: 80, padding: 0 } };
    document.getElementById("distribution-native").append(distributionGrid);
    window.distributionNativeGrid = distributionGrid;
  }, base);
  await page.evaluate(() => window.mount("autofit-react", true, {}, undefined, undefined, 40, "multiselect"));
  await page.evaluate(() => window.mount("distribution-react", true, { first: { defaultWidth: 100, idealWidth: 180, minWidth: 80, padding: 0 }, second: { defaultWidth: 100, idealWidth: 150, minWidth: 80, padding: 0 }, last: { defaultWidth: 120, idealWidth: 120, minWidth: 80, padding: 0 } }, [{ id: "first", label: "First" }, { id: "second", label: "Second" }, { id: "last", label: "Last" }], [{ id: "a", first: "A", second: "B", last: "C" }]));

  const results = {};
  for (const adapter of ["react", "native"]) {
    if (adapter === "react") await page.evaluate(() => window.mount("react", false, { name: { defaultWidth: 180, idealWidth: 220, minWidth: 90, padding: 12 } }));
    else await page.evaluate(() => { const grid = window.nativeGrid; grid.autoFitColumns = false; grid.columnSizingOptions = { name: { defaultWidth: 180, idealWidth: 220, minWidth: 90, padding: 12 } }; });
    const root = adapter === "react" ? page.locator("#react [role=grid]") : page.locator("#native spui-data-grid");
    const handle = adapter === "react" ? root.locator(".spui-grid-resize-handle") : root.locator(".resize-handle");
    await handle.waitFor();
    assert.equal(await handle.getAttribute("aria-valuemin"), "90", `${adapter}: configured minimum is reflected accessibly`);
    const configuredWidth = await (adapter === "react" ? root.locator(".spui-grid-header [role=row]") : root.locator(".header-row")).evaluate(row => getComputedStyle(row).gridTemplateColumns);
    assert.match(configuredWidth, /180px/, `${adapter}: defaultWidth initializes the column`);
    await handle.focus();
    await page.keyboard.press("Home");
    await page.waitForTimeout(20);
    assert.equal(await handle.getAttribute("aria-valuenow"), "90", `${adapter}: keyboard Home clamps to configured minimum`);
    await handle.focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(20);
    assert.equal(await handle.getAttribute("aria-valuenow"), "100", `${adapter}: keyboard resizing honors the configured minimum`);
    if (adapter === "react") {
      let resizeEvents = await page.evaluate(() => window.reactResizeEvents);
      assert.equal(resizeEvents.at(-1).eventType, "keydown", "React callback receives its originating keyboard event");
      assert.deepEqual({ columnId: resizeEvents.at(-1).columnId, width: resizeEvents.at(-1).width }, { columnId: "name", width: 100 });
      const rect = await handle.boundingBox();
      await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
      await page.mouse.down();
      await page.mouse.move(rect.x + rect.width / 2 + 24, rect.y + rect.height / 2);
      await page.mouse.up();
      await page.waitForTimeout(20);
      resizeEvents = await page.evaluate(() => window.reactResizeEvents);
      assert.equal(resizeEvents.at(-1).eventType, "pointerup", "React callback receives its originating pointer event");
      assert.ok(resizeEvents.at(-1).width > 100, "pointer resize updates callback width");
    }
    await handle.dblclick();
    await page.waitForTimeout(20);
    const fittedWidth = Number(await handle.getAttribute("aria-valuenow"));
    assert.ok(fittedWidth >= 90, `${adapter}: double-click auto-fit respects configured minimum`);
    const resizeEvents = await page.evaluate(adapterName => adapterName === "native" ? window.resizeEvents : window.reactResizeEvents, adapter);
    assert.equal(resizeEvents.at(-1).width, fittedWidth, `${adapter}: resize callback reflects the auto-fit width`);
    if (adapter === "react") assert.equal(resizeEvents.at(-1).eventType, "dblclick", "React callback receives its originating auto-fit event");
    if (adapter === "native") assert.equal(resizeEvents.at(-1).autoFit, true, "native emits auto-fit metadata");
    results[adapter] = { configuredWidth, minimum: 90, keyboardWidthAfterArrow: 100, autoFitWidth: fittedWidth, padding: 12, resizeEvents };
  }
  const reactAutoFitCell = page.locator("#autofit-react [data-column-id='name']").first();
  const nativeAutoFitCell = page.locator("#autofit-native spui-data-grid").locator(".header-cell:not(.selection-cell)");
  await reactAutoFitCell.waitFor(); await nativeAutoFitCell.waitFor();
  assert.equal(await page.locator("#autofit-react .spui-grid-selection input[type=checkbox]").count(), 2, "React accepts multiselect and renders row plus select-all checkboxes");
  assert.equal(await page.locator("#autofit-native spui-data-grid input[type=checkbox]").count(), 2, "custom element accepts multiselect and renders row plus select-all checkboxes");
  const reactAutoFitWidth = await reactAutoFitCell.evaluate(node => node.getBoundingClientRect().width);
  const nativeAutoFitWidth = await nativeAutoFitCell.evaluate(node => node.getBoundingClientRect().width);
  assert.equal(reactAutoFitWidth, 594, "React subtracts the 40px offset and 44px selection track from the 678px viewport");
  assert.equal(nativeAutoFitWidth, 594, "native subtracts the 40px offset and 44px selection track from the 678px viewport");
  assert.equal(reactAutoFitWidth, nativeAutoFitWidth, "React and native auto-fit produce the same available width");
  assert.equal(results.react.autoFitWidth, results.native.autoFitWidth, "React and native double-click auto-fit agree");
  results.autoFitColumns = { reactWidth: reactAutoFitWidth, nativeWidth: nativeAutoFitWidth };
  const trackWidths = async adapter => {
    const row = adapter === "react" ? page.locator("#distribution-react .spui-grid-header [role=row]") : page.locator("#distribution-native spui-data-grid .header-row");
    return row.evaluate(node => getComputedStyle(node).gridTemplateColumns.split(" ").map(value => Number.parseFloat(value)));
  };
  const expandedTracks = { react: await trackWidths("react"), native: await trackWidths("native") };
  assert.deepEqual(expandedTracks.react, [178, 100, 120], "React grows the first track toward idealWidth before assigning remaining space to the last track");
  assert.deepEqual(expandedTracks.native, expandedTracks.react, "native matches React auto-fit distribution");
  await page.evaluate(() => { document.getElementById("distribution-react").style.width = "250px"; document.getElementById("distribution-native").style.width = "250px"; });
  await page.waitForTimeout(80);
  const shrunkTracks = { react: await trackWidths("react"), native: await trackWidths("native") };
  assert.deepEqual(shrunkTracks.react, [88, 80, 80], "React shrinks from the last track toward each configured minimum");
  assert.deepEqual(shrunkTracks.native, shrunkTracks.react, "native matches React shrink distribution");
  results.responsiveDistribution = { expanded: expandedTracks, shrunk: shrunkTracks };
  assert.deepEqual(errors, [], "browser page errors");
  console.log(JSON.stringify({ results, pageErrors: errors }, null, 2));
} finally { await browser?.close(); await new Promise(resolveClose => server.close(resolveClose)); }
