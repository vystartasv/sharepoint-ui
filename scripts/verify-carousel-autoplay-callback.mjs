import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "carousel-autoplay-callback.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{CarouselAutoplayButton}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";createRoot(document.querySelector("#root")).render(<CarouselAutoplayButton data-testid="autoplay" onCheckedChange={(event,data)=>window.callback={eventType:event.type,...data}}/>);`,
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
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const button = page.getByTestId("autoplay");
  await button.locator("button").click();
  const callback = await page.evaluate(() => window.callback);
  assert.equal(callback.type, "click");
  assert.equal(callback.checked, true, "autoplay starts on first activation");
  assert.equal(callback.eventType, "click", "callback receives the original click event");
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify({ status: "passed", checked: callback.checked, originalClickEvent: true, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
