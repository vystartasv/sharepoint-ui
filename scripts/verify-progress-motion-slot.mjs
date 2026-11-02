import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "progress-motion-slot.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react"; import {createRoot} from "react-dom/client"; import {ProgressBar} from "${resolve("packages/sharepoint-ui/src/react.tsx")}"; import {defineProgressBar} from "${resolve("packages/sharepoint-ui/src/elements/progress-bar.ts")}"; createRoot(document.querySelector("#react")).render(<ProgressBar data-testid="react-progress" indeterminateMotion={<span data-testid="react-motion" style={{backgroundColor:"rebeccapurple"}}/>}/>); window.mountNative=()=>{defineProgressBar();const progress=document.createElement("spui-progress-bar");progress.setAttribute("label","Native loading");const motion=document.createElement("span");motion.id="native-motion";motion.slot="indeterminateMotion";progress.append(motion);document.querySelector("#native").append(progress)};window.mountNative();`,
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
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><div id=react></div><div id=native></div><script src=/bundle.js></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  for (const host of [page.getByTestId("react-progress"), page.locator("#native spui-progress-bar")]) {
    assert.equal(await host.getAttribute("data-indeterminate"), "");
    assert.equal(await host.getAttribute("data-custom-motion"), "");
    const slot = host.locator('slot[name="indeterminateMotion"]');
    assert.equal(await slot.getAttribute("aria-hidden"), "true");
  }
  assert.equal(await page.getByTestId("react-motion").getAttribute("slot"), "indeterminateMotion");
  assert.equal(await page.locator("#native-motion").getAttribute("slot"), "indeterminateMotion");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", reactSlot: true, nativeSlot: true, indeterminateState: true, slotDecorative: true, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
