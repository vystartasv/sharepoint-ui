import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "button-context.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Button,ButtonContextProvider,useButtonContext}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";function Buttons(){const context=useButtonContext();return <><output data-testid="context-value">{context.size ?? "unset"}</output><Button data-testid="inherited" aria-label="Small inherited button">Inherited</Button><Button data-testid="explicit" size="large">Explicit size</Button><Button data-testid="icon-only" aria-label="Close" icon={<span>×</span>}/></>}createRoot(document.querySelector("#root")).render(<ButtonContextProvider value={{size:"small"}}><Buttons/></ButtonContextProvider>);`,
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
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><div id='root'></div><script src='/bundle.js'></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  assert.equal(await page.getByTestId("context-value").textContent(), "small");
  assert.equal(await page.getByTestId("inherited").getAttribute("size"), "small", "Button inherits context size");
  assert.equal(await page.getByTestId("explicit").getAttribute("size"), "large", "explicit size overrides context");
  assert.notEqual(await page.getByTestId("icon-only").getAttribute("icon-only"), null, "icon without content is detected as icon-only");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", providerSize: "small", inheritedSize: "small", explicitOverride: "large", inferredIconOnly: true, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
