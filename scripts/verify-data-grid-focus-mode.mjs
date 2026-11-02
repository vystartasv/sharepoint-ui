import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "esbuild";

const dist = resolve("packages/sharepoint-ui/dist");
const reactBundle = await build({
  stdin: { contents: `import * as React from "react"; import {createRoot} from "react-dom/client"; import {DataGrid} from "${resolve("packages/sharepoint-ui/src/react.tsx")}"; const items=[{id:"a",name:"Alpha"},{id:"b",name:"Beta"},{id:"c",name:"Gamma"}]; const columns=[{id:"name",label:"Name",sortable:false}]; window.mountReact=(mode,selectionMode="none",selectionAppearance="brand",subtleSelection=false)=>createRoot(document.getElementById("react")).render(React.createElement(DataGrid,{items,columns,getRowId:item=>item.id,focusMode:mode,selectionMode,selectionAppearance,subtleSelection,height:240,renderCell:item=>React.createElement("button",{"data-row-button":item.id},item.name)}));`, resolveDir: process.cwd(), sourcefile: "focus-mode.tsx", loader: "tsx" },
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
  const page = await browser.newPage(); const errors = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto(base); await page.addScriptTag({ url: `${base}/react.js` });
  await page.evaluate(async url => {
    const { defineDataGrid } = await import(`${url}/elements/data-grid.js`); defineDataGrid();
    const grid = document.createElement("spui-data-grid"); grid.columns = [{ id: "name", label: "Name", sortable: false }]; grid.items = [{ id: "a", name: "Alpha" }, { id: "b", name: "Beta" }, { id: "c", name: "Gamma" }]; grid.itemKey = item => item.id;
    grid.renderer = item => { const button = document.createElement("button"); button.dataset.rowButton = item.id; button.textContent = item.name; return button; };
    document.getElementById("native").append(grid); window.nativeGrid = grid;
  }, base);
  const results = {};
  for (const adapter of ["react", "native"]) {
    const grid = adapter === "react" ? page.locator("#react [role=grid]") : page.locator("spui-data-grid");
    const sentinel = await page.evaluate(({ selector, id }) => { const root = document.querySelector(selector); const button = document.createElement("button"); button.id = id; button.textContent = "Before grid"; root.before(button); return id; }, { selector: adapter === "react" ? "#react" : "spui-data-grid", id: `before-${adapter}` });
    const row = index => adapter === "react" ? grid.locator(`[role=row][data-row-index="${index}"]`) : grid.locator(`.data-row[data-row-index="${index}"]`);
    const cell = index => adapter === "react" ? grid.locator(`[role=gridcell][data-row-index="${index}"][data-column-index="0"]`) : grid.locator(`.data-row[data-row-index="${index}"] [role=gridcell][data-col-index="0"]`);
    const active = () => adapter === "react" ? page.evaluate(() => document.activeElement?.outerHTML.slice(0, 140)) : grid.evaluate(el => el.shadowRoot.activeElement?.outerHTML.slice(0, 140));
    const renderMode = async (mode, selectionMode = "none", selectionAppearance = "brand", subtleSelection = false) => { if (adapter === "react") { await page.evaluate(options => window.mountReact(...options), [mode, selectionMode, selectionAppearance, subtleSelection]); await page.waitForTimeout(30); } else { await grid.evaluate((el, options) => { el.focusMode = options[0]; el.setAttribute("selection-mode", options[1]); el.selectionAppearance = options[2]; el.subtleSelection = options[3]; }, [mode, selectionMode, selectionAppearance, subtleSelection]); await page.waitForTimeout(30); } };
    await renderMode("cell");
    assert.equal(await cell(0).getAttribute("tabindex"), "0", `${adapter}: cell is the default tab stop`);
    await renderMode("none");
    assert.equal(await cell(0).getAttribute("tabindex"), "-1", `${adapter}: none removes the managed cell tab stop`);
    await page.locator(`#${sentinel}`).focus(); await page.keyboard.press("Tab");
    assert.match(await active(), /data-row-button="a"/, `${adapter}: nested controls remain in the natural Tab sequence in none mode`);
    await renderMode("row_unstable");
    assert.equal(await row(0).getAttribute("tabindex"), "0", `${adapter}: active row is tabbable`);
    await row(0).focus(); await page.keyboard.press("ArrowDown"); await page.waitForTimeout(40);
    assert.equal((await active()).includes("data-row-index=\"1\""), true, `${adapter}: row focus advances with ArrowDown`);
    await renderMode("composite");
    await row(0).focus(); await page.keyboard.press("ArrowRight"); await page.waitForTimeout(30);
    assert.match(await active(), /data-row-button="a"|role="gridcell"/, `${adapter}: ArrowRight enters the composite row`);
    await page.keyboard.press("ArrowLeft"); await page.waitForTimeout(30);
    assert.equal((await active()).includes("data-row-index=\"0\""), true, `${adapter}: ArrowLeft exits the composite row to its row stop`);
    await page.keyboard.press("ArrowDown"); await page.waitForTimeout(40);
    assert.equal((await active()).includes("data-row-index=\"1\""), true, `${adapter}: composite ArrowDown advances to the next row`);
    await renderMode("row_unstable", "multiple", "brand", true);
    await row(2).focus(); await page.keyboard.press("Control+Home"); await page.waitForTimeout(30);
    assert.match(await active(), /type="checkbox"|data-sort-column/, `${adapter}: Ctrl+Home moves focus to the first grid header control`);
    await page.keyboard.press("Control+End"); await page.waitForTimeout(50);
    assert.match(await active(), /data-row-index="2"|data-row-button="c"|data-col-index="0"|data-column-index="0"/, `${adapter}: Ctrl+End reveals and focuses the final data row`);
    await row(0).click();
    assert.equal(await row(0).getAttribute("aria-selected"), "true", `${adapter}: row click selects a row`);
    await row(0).locator('[data-row-button="a"]').click();
    assert.equal(await row(0).getAttribute("aria-selected"), "false", `${adapter}: clicking a nested control selects the row like Fluent DataGrid`);
    await row(0).click();
    assert.equal(await row(0).getAttribute("aria-selected"), "true", `${adapter}: row click selects a row after the nested action`);
    await row(0).focus(); await page.keyboard.press("Space");
    assert.equal(await row(0).getAttribute("aria-selected"), "false", `${adapter}: Space toggles selection from a focused row`);
    const checkbox = index => row(index).locator(adapter === "react" ? ".spui-grid-selection input" : ".selection-cell input");
    assert.equal(await checkbox(1).evaluate(element => getComputedStyle(element).opacity), "0", `${adapter}: subtle selection hides the idle selection control`);
    await renderMode("row_unstable", "multiple", "brand"); if (await row(0).getAttribute("aria-selected") !== "true") await row(0).click();
    const background = index => row(index).evaluate(element => getComputedStyle(element).backgroundColor);
    const brandBackground = await background(0);
    await renderMode("row_unstable", "multiple", "neutral"); if (await row(0).getAttribute("aria-selected") !== "true") await row(0).click();
    const neutralBackground = await background(0);
    const neutralState = adapter === "native" ? await grid.evaluate(el => ({ appearance: el.shadowRoot.querySelector(".viewport").dataset.selectionAppearance, selected: el.shadowRoot.querySelector('.data-row[data-row-index="0"]')?.getAttribute("aria-selected"), rule: [...el.shadowRoot.styleSheets[0].cssRules].filter(rule => rule.cssText.includes("selection-appearance=neutral")).map(rule => rule.cssText) })) : undefined;
    await renderMode("row_unstable", "multiple", "none"); if (await row(0).getAttribute("aria-selected") !== "true") await row(0).click();
    const noAppearanceBackground = await background(0);
    const selectionStylesState = adapter === "react" ? await grid.evaluate(el => ({ appearance: el.dataset.selectionAppearance, selected: el.querySelector('[data-row-index="0"]')?.getAttribute("aria-selected") })) : await grid.evaluate(el => ({ appearance: el.shadowRoot.querySelector(".viewport").dataset.selectionAppearance, selected: el.shadowRoot.querySelector('.data-row[data-row-index="0"]')?.getAttribute("aria-selected") }));
    assert.equal(new Set([brandBackground, neutralBackground, noAppearanceBackground]).size, 3, `${adapter}: brand, neutral, and none appearances render distinct selected surfaces: ${JSON.stringify({ colors: [brandBackground, neutralBackground, noAppearanceBackground], neutralState, selectionStylesState })}`);
    await renderMode("row_unstable", "single"); await row(0).click(); await row(1).click();
    assert.equal(await row(0).getAttribute("aria-selected"), "false", `${adapter}: single selection clears the previous row`);
    assert.equal(await row(1).getAttribute("aria-selected"), "true", `${adapter}: single selection selects the clicked row`);
    results[adapter] = { defaultCellTabIndex: "0", noneCellTabIndex: "-1", rowStop: "active row", composite: "enter, exit, vertical navigation passed", rowClickSpaceSelection: true, nestedControlRowSelection: true, subtleSelection: true, appearances: { brand: brandBackground, neutral: neutralBackground, none: noAppearanceBackground }, singleSelection: true };
  }
  assert.deepEqual(errors, [], "browser page errors");
  console.log(JSON.stringify({ results, pageErrors: errors }, null, 2));
} finally { await browser?.close(); await new Promise(resolveClose => server.close(resolveClose)); }
