import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    sourcefile: "popover-trigger-enhancement.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Popover,PopoverSurface,PopoverTrigger}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{definePopover}from"${resolve("packages/sharepoint-ui/src/elements/popover.ts")}";definePopover();createRoot(document.querySelector("#root")).render(<><Popover data-testid="default" label="Default trigger" defaultOpen unstable_disableAutoFocus><PopoverTrigger data-testid="default-wrapper"><button data-testid="default-button">Default</button></PopoverTrigger><PopoverSurface>Default surface</PopoverSurface></Popover><Popover data-testid="disabled" label="Disabled enhancement" defaultOpen unstable_disableAutoFocus><PopoverTrigger data-testid="disabled-wrapper" disableButtonEnhancement><button data-testid="disabled-button" aria-haspopup="menu" aria-controls="existing-controls" aria-expanded="true">Custom</button></PopoverTrigger><PopoverSurface>Custom surface</PopoverSurface></Popover></>);window.mountNative=()=>{const make=(id,disable,aria={})=>{const host=document.createElement("spui-popover");host.id=id;host.setAttribute("default-open","");host.setAttribute("unstable-disable-auto-focus","");const trigger=document.createElement("spui-popover-trigger");trigger.slot="trigger";trigger.dataset.testid=id+"-wrapper";if(disable)trigger.setAttribute("disable-button-enhancement","");const button=document.createElement("button");button.dataset.testid=id+"-button";button.textContent=id;for(const [key,value]of Object.entries(aria))button.setAttribute(key,value);trigger.append(button);const content=document.createElement("div");content.slot="content";content.textContent=id+" surface";host.append(trigger,content);document.querySelector("#native-root").append(host)};make("native-default",false);make("native-disabled",true,{"aria-haspopup":"menu","aria-controls":"native-existing","aria-expanded":"true"})};window.mountNative();`,
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
  await page.waitForFunction(() => document.querySelector('[data-testid="native-disabled-button"]') !== null);
  await page.waitForTimeout(100);
  const attributes = id => page.getByTestId(id).evaluate(node => Object.fromEntries(["aria-haspopup", "aria-controls", "aria-expanded"].map(name => [name, node.getAttribute(name)])));
  const defaultReact = await attributes("default-button");
  assert.equal(defaultReact["aria-haspopup"], "dialog");
  assert.equal(defaultReact["aria-controls"], null, "cross-shadow panels do not expose unresolved ID references");
  assert.equal(defaultReact["aria-expanded"], "true");
  assert.deepEqual(await attributes("disabled-button"), { "aria-haspopup": "menu", "aria-controls": "existing-controls", "aria-expanded": "true" }, "React opt-out preserves the child's ARIA contract");
  assert.equal((await attributes("native-default-button"))["aria-haspopup"], "dialog", "native default is enhanced");
  assert.equal((await attributes("native-default-button"))["aria-controls"], null, "native cross-shadow panels do not expose unresolved ID references");
  assert.deepEqual(await attributes("native-disabled-button"), { "aria-haspopup": "menu", "aria-controls": "native-existing", "aria-expanded": "true" }, "native custom-element opt-out preserves existing ARIA");
  await page.getByTestId("default-wrapper").evaluate(node => node.setAttribute("disable-button-enhancement", ""));
  await page.waitForFunction(() => document.querySelector('[data-testid="default-button"]').getAttribute("aria-haspopup") === null);
  await page.getByTestId("default-wrapper").evaluate(node => node.removeAttribute("disable-button-enhancement"));
  await page.waitForFunction(() => document.querySelector('[data-testid="default-button"]').getAttribute("aria-haspopup") === "dialog");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", reactDefaultEnhancement: true, reactOptOutPreservesAttributes: true, nativeDefaultEnhancement: true, nativeOptOutPreservesAttributes: true, runtimeToggle: true, noPageErrors: true }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
