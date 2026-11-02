import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    sourcefile: "data-grid-header-sort-direction.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{DataGridHeaderCell}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";createRoot(document.querySelector("#root")).render(<><DataGridHeaderCell data-testid="ascending" columnId="name" sortDirection="ascending">Name</DataGridHeaderCell><DataGridHeaderCell data-testid="descending" columnId="date" sortDirection="descending">Date</DataGridHeaderCell><DataGridHeaderCell data-testid="unsorted" columnId="status">Status</DataGridHeaderCell></>);`,
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
  const ascending = page.getByTestId("ascending");
  const descending = page.getByTestId("descending");
  const unsorted = page.getByTestId("unsorted");
  assert.equal(await ascending.getAttribute("aria-sort"), "ascending");
  assert.equal(await ascending.getByTestId("data-grid-sort-indicator").textContent(), "↑");
  assert.equal(await descending.getAttribute("aria-sort"), "descending");
  assert.equal(await descending.getByTestId("data-grid-sort-indicator").textContent(), "↓");
  assert.equal(await unsorted.getAttribute("aria-sort"), null);
  assert.equal(await unsorted.getByTestId("data-grid-sort-indicator").count(), 0);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", ascendingAriaAndIndicator: true, descendingAriaAndIndicator: true, unsortedHasNoIndicator: true, noPageErrors: true }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
