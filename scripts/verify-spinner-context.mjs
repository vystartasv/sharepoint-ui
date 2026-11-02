import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "spinner-context.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Spinner,SpinnerContextProvider,useSpinnerContext}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";function Inherited(){const context=useSpinnerContext();return <><output data-testid="context-value">{context.size ?? "unset"}</output><Spinner data-testid="inherited" label="Inherited size"/><Spinner data-testid="explicit" size="large" label="Explicit size"/><Spinner data-testid="custom-slots" label="Custom loader" spinner={<span data-testid="spinner-slot">custom spinner</span>} spinnerTail={<span data-testid="spinner-tail-slot">tail</span>}/></>}createRoot(document.querySelector("#root")).render(<SpinnerContextProvider value={{size:"tiny"}}><Inherited/></SpinnerContextProvider>);`,
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
  assert.equal(await page.getByTestId("context-value").textContent(), "tiny", "useSpinnerContext exposes the provider value");
  assert.equal(await page.getByTestId("inherited").getAttribute("data-size"), "tiny", "Spinner inherits the context size");
  assert.equal(await page.getByTestId("explicit").getAttribute("data-size"), "large", "explicit Spinner size overrides context");
  const customSlots = page.getByTestId("custom-slots");
  assert.equal(await customSlots.evaluate(element => element.shadowRoot.querySelector('slot[name="spinner"]').assignedElements()[0]?.getAttribute("data-testid")), "spinner-slot", "Spinner exposes its custom spinner slot");
  assert.equal(await customSlots.evaluate(element => element.shadowRoot.querySelector('slot[name="spinner-tail"]').assignedElements()[0]?.getAttribute("data-testid")), "spinner-tail-slot", "Spinner exposes its custom spinner-tail slot");
  assert.equal(await customSlots.locator('[data-testid="spinner-slot"]').getAttribute("aria-hidden"), "true", "custom spinner content stays decorative to assistive technology by default");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", providerSize: "tiny", inheritedSize: "tiny", explicitOverride: "large", customSpinnerSlot: true, customSpinnerTailSlot: true, customSlotsDecorative: true, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
