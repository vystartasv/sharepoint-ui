import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    sourcefile: "data-grid-selection-cell-props.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{DataGridSelectionCell,TableSelectionCell}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";createRoot(document.querySelector("#root")).render(<><div className="spui-grid-row"><DataGridSelectionCell data-testid="mixed" checked="mixed" label="Select all" subtle /></div><DataGridSelectionCell data-testid="radio" checked type="radio" label="Select row" /><DataGridSelectionCell data-testid="invisible" checked invisible label="Invisible row" /><DataGridSelectionCell data-testid="hidden" hidden label="Hidden row" /><TableSelectionCell data-testid="table-hidden" hidden /> </>);`,
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});

const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><meta charset=utf-8><div id=root></div><script src=/bundle.js></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await (await import("playwright")).chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const mixed = page.getByTestId("mixed");
  assert.equal(await mixed.locator("input").getAttribute("type"), "checkbox");
  assert.equal(await mixed.locator("input").getAttribute("aria-checked"), "mixed");
  assert.equal(await mixed.locator("input").evaluate(node => node.indeterminate), true);
  await page.locator(".spui-grid-row").hover();
  assert.equal(await mixed.locator("input").evaluate(node => getComputedStyle(node).opacity), "1", "subtle selection appears on row hover");
  assert.equal(await page.getByTestId("radio").locator("input").getAttribute("type"), "radio");
  assert.equal(await page.getByTestId("radio").locator("input").isChecked(), true);
  assert.equal(await page.getByTestId("invisible").locator("input").evaluate(node => getComputedStyle(node).opacity), "0");
  assert.equal(await page.getByTestId("hidden").evaluate(node => node.hidden), true);
  assert.equal(await page.getByTestId("table-hidden").evaluate(node => getComputedStyle(node).display), "none", "TableSelectionCell hidden removes it from layout");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", mixedState: true, radioType: true, subtleRowHover: true, invisibleOccupiesCell: true, deprecatedHidden: true,tableSelectionHidden: true, noPageErrors: true }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
