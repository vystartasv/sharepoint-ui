import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    sourcefile: "popover-legacy-trap-focus.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Popover,PopoverSurface,PopoverTrigger}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{definePopover}from"${resolve("packages/sharepoint-ui/src/elements/popover.ts")}";definePopover();createRoot(document.querySelector("#root")).render(<><Popover data-testid="react-legacy" label="Legacy trap" defaultOpen trapFocus legacyTrapFocus><PopoverTrigger><button>Open</button></PopoverTrigger><PopoverSurface><button data-testid="react-first">First</button><button data-testid="react-last">Last</button></PopoverSurface></Popover></>);window.mountNative=()=>{const host=document.createElement("spui-popover");host.id="native-legacy";host.setAttribute("trap-focus","");host.setAttribute("legacy-trap-focus","");host.setAttribute("label","Native legacy trap");const trigger=document.createElement("button");trigger.slot="trigger";trigger.textContent="Open";const content=document.createElement("div");content.slot="content";for(const id of ["native-first","native-last"]){const button=document.createElement("button");button.dataset.testid=id;button.textContent=id;content.append(button)}host.append(trigger,content);document.querySelector("#native-root").append(host)};window.mountNative();`,
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
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><meta charset=utf-8><div id=root></div><div id=native-root></div><button id=outside>Outside</button><script src=/bundle.js></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await (await import("playwright")).chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector('[data-testid="native-last"]') !== null);
  for (const [first, last] of [["react-first", "react-last"]]) {
    await page.getByTestId(last).focus();
    await page.keyboard.press("Tab");
    await page.waitForFunction(id => document.activeElement?.getAttribute("data-testid") === id, first);
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("data-testid")), first, `${first} receives wrapped focus from the last item`);
    await page.getByTestId(first).focus();
    await page.keyboard.press("Shift+Tab");
    await page.waitForFunction(id => document.activeElement?.getAttribute("data-testid") === id, last);
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("data-testid")), last, `${last} receives wrapped reverse focus from the first item`);
  }
  await page.getByTestId("react-legacy").evaluate(node => { node.open = false; });
  await page.locator("#native-legacy").evaluate(node => { node.open = true; });
  for (const [first, last] of [["native-first", "native-last"]]) {
    await page.getByTestId(last).focus();
    await page.keyboard.press("Tab");
    await page.waitForFunction(id => document.activeElement?.getAttribute("data-testid") === id, first);
    await page.getByTestId(first).focus();
    await page.keyboard.press("Shift+Tab");
    await page.waitForFunction(id => document.activeElement?.getAttribute("data-testid") === id, last);
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", reactLegacyTrapFocus: true, nativeLegacyTrapFocus: true, wrapsForwardAndBackward: true, noPageErrors: true }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
