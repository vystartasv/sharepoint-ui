import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    sourcefile: "popover-autofocus.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Popover,PopoverSurface,PopoverTrigger}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{definePopover}from"${resolve("packages/sharepoint-ui/src/elements/popover.ts")}";definePopover();createRoot(document.querySelector("#root")).render(<><Popover data-testid="default" label="Default focus" defaultOpen><PopoverTrigger><button data-testid="default-trigger">Open</button></PopoverTrigger><PopoverSurface><input data-testid="default-input" /></PopoverSurface></Popover><Popover data-testid="disabled" label="Autofocus disabled" defaultOpen unstable_disableAutoFocus><PopoverTrigger><button data-testid="disabled-trigger">Open</button></PopoverTrigger><PopoverSurface><input data-testid="disabled-input" /></PopoverSurface></Popover></>);window.mountNative=()=>{for(const [id,disabled]of [["native-default",false],["native-disabled",true]]){const host=document.createElement("spui-popover");host.id=id;host.setAttribute("default-open","");if(disabled)host.setAttribute("unstable-disable-auto-focus","");const trigger=document.createElement("button");trigger.slot="trigger";trigger.textContent=id;const content=document.createElement("div");content.slot="content";const input=document.createElement("input");input.dataset.testid=id+"-input";content.append(input);host.append(trigger,content);document.querySelector("#native-root").append(host)}};window.mountNative();`,
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
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><meta charset=utf-8><div id=root></div><div id=native-root></div><script src=/bundle.js></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await (await import("playwright")).chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector('[data-testid="native-disabled-input"]') !== null);
  const raf = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  await page.evaluate(async () => {
    const raf = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const normal = document.querySelector('[data-testid="default"]');
    const disabled = document.querySelector('[data-testid="disabled"]');
    normal.open = false;
    disabled.open = false;
    await raf();
    normal.open = true;
    await raf();
  });
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("data-testid")), "default-input", "React focuses the first surface control by default");
  await page.getByTestId("disabled").evaluate(async node => { node.open = true; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
  assert.notEqual(await page.evaluate(() => document.activeElement?.getAttribute("data-testid")), "disabled-input", "React opt-out keeps focus out of the surface");
  await page.evaluate(async () => {
    const raf = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const normal = document.querySelector("#native-default");
    const disabled = document.querySelector("#native-disabled");
    normal.open = false;
    disabled.open = false;
    await raf();
    normal.open = true;
    await raf();
  });
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("data-testid")), "native-default-input", "native element focuses its first surface control by default");
  await page.locator("#native-disabled").evaluate(async node => { node.open = true; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
  assert.notEqual(await page.evaluate(() => document.activeElement?.getAttribute("data-testid")), "native-disabled-input", "native opt-out keeps focus out of the surface");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", reactDefaultAutoFocus: true, reactOptOut: true, nativeDefaultAutoFocus: true, nativeOptOut: true, noPageErrors: true }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
