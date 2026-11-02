import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = resolve("packages/sharepoint-ui/dist");
const reactTestBundle = await build({
  stdin: {
    contents: `import * as React from "react"; import { createRoot } from "react-dom/client"; import { DataGrid } from "${resolve("packages/sharepoint-ui/src/react.tsx")}"; const columns = [{ id: "id", label: "ID" }, { id: "title", label: "Title", editable: true }, { id: "count", label: "Count", editable: true, editType: "number" }]; const initial = [{ id: "a", title: "Alpha", count: 2 }, { id: "b", title: "Beta", count: 4 }]; window.__mountReactGrid = () => { function App() { const [items, setItems] = React.useState(initial); const [commits, setCommits] = React.useState([]); const onCellEdit = async edit => { if (edit.value === "server-fail") throw new Error("The save service rejected this value."); setCommits(values => [...values, edit]); setItems(current => current.map(item => item.id === edit.rowId ? { ...item, [edit.columnId]: edit.value == null ? "" : String(edit.value) } : item)); }; return React.createElement(React.Fragment, null, React.createElement(DataGrid, { "data-testid": "react-data-grid", "aria-label": "Editable task grid", items, columns, getRowId: item => item.id, rowLabel: "row", editHint: "Press Enter or F2 to edit", validateCellEdit: edit => edit.columnId === "title" && !String(edit.value ?? "").trim() ? "A title is required." : undefined, onCellEdit }), React.createElement("output", { "data-testid": "react-edit-count" }, String(commits.length))); } createRoot(document.getElementById("react-root")).render(React.createElement(App)); };`,
    resolveDir: process.cwd(),
    sourcefile: "react-data-grid-edit-test.tsx",
    loader: "tsx",
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
  write: false,
});
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); }
catch {
  const fallback = "/Users/vilius/.t3/projects/spfx-research/node_modules/playwright";
  if (!existsSync(fallback)) throw new Error("Install Playwright locally or provide the workspace Playwright package.");
  ({ chromium } = require(fallback));
}

const server = createServer((request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  if (pathname === "/react-test.js") { response.writeHead(200, { "content-type": "text/javascript; charset=utf-8" }).end(reactTestBundle.outputFiles[0].contents); return; }
  if (pathname === "/") { response.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end("<!doctype html><html><body><div id='react-root'></div></body></html>"); return; }
  if (!/^\/elements\/(data-grid|data-grid-model|shared|virtual-list)\.js$/.test(pathname)) return response.writeHead(404).end();
  try { response.writeHead(200, { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-store" }); response.end(readFileSync(resolve(root, `.${pathname}`))); }
  catch { response.writeHead(404).end(); }
});

await new Promise(resolveListen => server.listen(0, "127.0.0.1", resolveListen));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 720 } });
  const reactPageErrors = [];
  page.on("pageerror", error => reactPageErrors.push(error.stack || error.message));
  page.on("console", message => { if (message.type() === "error") reactPageErrors.push(message.text()); });
  await page.goto(base);
  await page.addScriptTag({ url: `${base}/react-test.js` });
  await page.evaluate(() => window.__mountReactGrid());
  await page.waitForTimeout(100);
  if (await page.locator("#react-root [role=grid]").count() === 0) throw new Error(`React grid failed to mount: ${JSON.stringify({ errors: reactPageErrors, html: await page.locator("#react-root").innerHTML() })}`);
  const reactGrid = page.getByRole("grid", { name: "Editable task grid" });
  const reactCell = (id, column) => reactGrid.locator(`[data-row-key="${id}"][data-column-index="${column}"]`);
  await reactCell("a", 1).focus();
  await page.keyboard.press("Enter");
  const reactKeyboardEntry = await reactGrid.getByTestId("spui-data-grid-editor").isVisible();
  let reactEditor = reactGrid.getByTestId("spui-data-grid-editor");
  await reactEditor.fill(""); await reactEditor.press("Enter");
  await reactEditor.waitFor({ state: "visible" });
  const reactValidation = await reactEditor.getAttribute("aria-invalid") === "true" && await reactGrid.getByRole("alert").textContent() === "A title is required.";
  await reactEditor.fill("Alpha revised"); await reactEditor.press("Enter");
  try { await page.getByText("Alpha revised", { exact: true }).waitFor({ timeout: 5000 }); }
  catch (error) { const snapshot = await page.evaluate(() => ({ url: location.href, body: document.body.innerText, root: document.querySelector("#react-root")?.innerHTML, editorValue: document.querySelector("#react-root [data-testid=spui-data-grid-editor]")?.value })); throw new Error(`React edit did not commit: ${JSON.stringify({ errors: reactPageErrors, snapshot })}`, { cause: error }); }
  const reactTextCommit = await reactCell("a", 1).textContent() === "Alpha revised";
  await reactCell("a", 2).dblclick();
  reactEditor = reactGrid.getByTestId("spui-data-grid-editor");
  await reactEditor.fill("8"); await reactEditor.press("Enter");
  await page.getByText("8", { exact: true }).waitFor();
  const reactNumberCommit = await reactCell("a", 2).textContent() === "8";
  await reactCell("b", 1).dblclick();
  reactEditor = reactGrid.getByTestId("spui-data-grid-editor");
  await reactEditor.waitFor({ state: "visible" });
  await reactEditor.fill("server-fail"); await reactEditor.press("Enter");
  await page.getByText("The save service rejected this value.", { exact: true }).waitFor();
  const reactAsyncError = await reactEditor.getAttribute("aria-invalid") === "true";
  await reactEditor.press("Escape");
  const reactEscapeCancel = await reactGrid.getByText("Beta", { exact: true }).isVisible();
  const reactResult = { keyboardEntry: reactKeyboardEntry, validation: reactValidation, textCommit: reactTextCommit, numberCommit: reactNumberCommit, asyncError: reactAsyncError, escapeCancel: reactEscapeCancel, successfulCommits: await page.getByTestId("react-edit-count").textContent() };
  const result = await page.evaluate(async baseUrl => {
    const { defineDataGrid } = await import(`${baseUrl}/elements/data-grid.js`);
    defineDataGrid();
    const grid = document.createElement("spui-data-grid");
    grid.style.setProperty("--spui-data-grid-height", "240px");
    grid.columns = [
      { id: "id", label: "ID" },
      { id: "title", label: "Title", editable: true },
      { id: "count", label: "Count", editable: true, editType: "number" },
    ];
    grid.items = [{ id: "a", title: "Alpha", count: 2 }, { id: "b", title: "Beta", count: 4 }];
    grid.itemKey = item => item.id;
    const committed = [];
    const events = [];
    grid.validateCellEdit = edit => edit.columnId === "title" && !String(edit.value ?? "").trim() ? "A title is required." : undefined;
    grid.onCellEdit = async edit => { if (edit.value === "server-fail") throw new Error("The save service rejected this value."); committed.push({ rowId: edit.rowId, columnId: edit.columnId, value: edit.value }); };
    grid.addEventListener("spui-cell-edit", event => events.push({ rowId: event.detail.rowId, columnId: event.detail.columnId, value: event.detail.value }));
    document.body.append(grid);
    const cell = (id, columnIndex) => grid.shadowRoot.querySelector(`[data-row-id="${id}"][data-col-index="${columnIndex}"]`);
    cell("a", 1).focus();
    cell("a", 1).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    let editor = grid.shadowRoot.querySelector("[data-testid=spui-data-grid-editor]");
    const keyboardEntry = Boolean(editor);
    if (!editor) throw new Error("Keyboard entry did not create the editor.");
    grid.selectedKeys = [];
    await new Promise(resolve => requestAnimationFrame(resolve));
    const focusSurvivedGridRepaint = grid.shadowRoot.activeElement === grid.shadowRoot.querySelector(".cell-editor");
    editor = grid.shadowRoot.querySelector(".cell-editor");
    editor.value = ""; editor.dispatchEvent(new Event("input", { bubbles: true })); editor.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await new Promise(resolve => requestAnimationFrame(resolve));
    const validationRetainedEditor = Boolean(grid.shadowRoot.querySelector(".cell-editor[aria-invalid=true]") && grid.shadowRoot.querySelector(".edit-error")?.textContent === "A title is required.");
    editor = grid.shadowRoot.querySelector(".cell-editor"); if (!editor) throw new Error("Validation failure removed the active editor."); editor.value = "Alpha revised"; editor.dispatchEvent(new Event("input", { bubbles: true })); editor.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const textCommit = cell("a", 1)?.textContent === "Alpha revised";
    cell("a", 2).dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    await new Promise(resolve => requestAnimationFrame(resolve));
    const numericEditor = grid.shadowRoot.querySelector(".cell-editor[type=number]");
    if (!numericEditor) throw new Error("Double-click did not create a numeric editor."); numericEditor.value = "8"; numericEditor.dispatchEvent(new Event("input", { bubbles: true })); numericEditor.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const numberCommit = cell("a", 2)?.textContent === "8" && typeof committed.at(-1)?.value === "number";
    cell("b", 1).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await new Promise(resolve => requestAnimationFrame(resolve));
    editor = grid.shadowRoot.querySelector(".cell-editor"); if (!editor) throw new Error("Second keyboard edit did not create an editor."); editor.value = "server-fail"; editor.dispatchEvent(new Event("input", { bubbles: true })); editor.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 10));
    const asyncErrorRetainedEditor = grid.shadowRoot.querySelector(".cell-editor[aria-invalid=true]")?.getAttribute("aria-busy") !== "true" && grid.shadowRoot.querySelector(".edit-error")?.textContent === "The save service rejected this value.";
    editor = grid.shadowRoot.querySelector(".cell-editor"); editor.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await new Promise(resolve => requestAnimationFrame(resolve));
    const escapeCancelled = !grid.shadowRoot.querySelector(".cell-editor") && cell("b", 1)?.textContent === "Beta";
    return { keyboardEntry, focusSurvivedGridRepaint, validationRetainedEditor, textCommit, numericEditor: Boolean(numericEditor), numberCommit, asyncErrorRetainedEditor, escapeCancelled, committed, events };
  }, base);
  assert.equal(result.keyboardEntry, true);
  assert.equal(result.focusSurvivedGridRepaint, true);
  assert.equal(result.validationRetainedEditor, true);
  assert.equal(result.textCommit, true);
  assert.equal(result.numericEditor, true);
  assert.equal(result.numberCommit, true);
  assert.equal(result.asyncErrorRetainedEditor, true);
  assert.equal(result.escapeCancelled, true);
  assert.equal(result.committed.length, 2);
  assert.equal(result.events.length, 2, "The custom event should report successful commits only.");
  for (const [key, value] of Object.entries({ keyboardEntry: true, validation: true, textCommit: true, numberCommit: true, asyncError: true, escapeCancel: true, successfulCommits: "2" })) assert.equal(reactResult[key], value, `React DataGrid edit check failed: ${key}`);
  const screenshot = resolve("test-results/data-grid-edit-local.png");
  mkdirSync(resolve("test-results"), { recursive: true });
  await page.screenshot({ path: screenshot });
  console.log(JSON.stringify({ browser: "Chromium headless", adapters: ["React", "custom-element"], assertions: "passed", screenshot, react: reactResult, ...result }, null, 2));
} finally {
  await browser?.close();
  await new Promise(resolveClose => server.close(resolveClose));
}
