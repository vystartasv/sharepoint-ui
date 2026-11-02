import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    sourcefile: "info-button-inline.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{InfoButton}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineInfoButton}from"${resolve("packages/sharepoint-ui/src/elements/info.ts")}";defineInfoButton();createRoot(document.querySelector("#root")).render(<><InfoButton data-testid="default" info="Help">Default</InfoButton><InfoButton data-testid="portal" inline={false} info="Help">Portal</InfoButton></>);window.mountNative=()=>{const host=document.createElement("spui-info-button");host.id="native";host.setAttribute("info","Native help");host.inline=false;host.textContent="Native";document.querySelector("#native-root").append(host)};window.mountNative();`,
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
  await page.waitForFunction(() => document.querySelector("#native") !== null);
  const states = await page.evaluate(() => [document.querySelector('[data-testid="default"]'), document.querySelector('[data-testid="portal"]'), document.querySelector("#native")].map(host => { const popover = host.shadowRoot.querySelector("spui-popover"); return { inline: host.inline, popoverInline: popover.inline, surfaceZIndex: getComputedStyle(popover.shadowRoot.querySelector(".surface")).zIndex }; }));
  assert.deepEqual(states, [{ inline: true, popoverInline: true, surfaceZIndex: "1" }, { inline: false, popoverInline: false, surfaceZIndex: "10000" }, { inline: false, popoverInline: false, surfaceZIndex: "10000" }], "inline surfaces use Fluent's low stacking layer while portal-mode surfaces use the overlay layer");
  await page.locator('[data-testid="default"]').evaluate(host => host.shadowRoot.querySelector("spui-popover").shadowRoot.querySelector("slot[name=trigger]").assignedElements()[0].click());
  const inlineRender = await page.locator('[data-testid="default"]').evaluate(host => { const popover = host.shadowRoot.querySelector("spui-popover"); const surface = popover.shadowRoot.querySelector(".surface"); return { open: popover.open, hidden: surface.hidden, localRender: surface.dataset.inline ?? null, topLayer: surface.matches(":popover-open"), position: surface.style.position, zIndex: getComputedStyle(surface).zIndex, popoverAttribute: surface.hasAttribute("popover") }; });
  assert.deepEqual(inlineRender, { open: true, hidden: false, localRender: null, topLayer: true, position: "absolute", zIndex: "1", popoverAttribute: true }, "inline=true keeps the surface in source order and applies Fluent's low inline stacking level in the browser top layer");
  await page.locator('[data-testid="portal"]').evaluate(host => host.shadowRoot.querySelector("spui-popover").shadowRoot.querySelector("slot[name=trigger]").assignedElements()[0].click());
  const overlayRender = await page.locator('[data-testid="portal"]').evaluate(host => { const popover = host.shadowRoot.querySelector("spui-popover"); const surface = popover.shadowRoot.querySelector(".surface"); return { open: popover.open, hidden: surface.hidden, localRender: surface.dataset.inline ?? null, topLayer: surface.matches(":popover-open"), zIndex: getComputedStyle(surface).zIndex, popoverAttribute: surface.hasAttribute("popover") }; });
  assert.deepEqual(overlayRender, { open: true, hidden: false, localRender: null, topLayer: true, zIndex: "10000", popoverAttribute: true }, "inline=false uses the browser top layer and overlay stacking level");
  await page.locator("#native").evaluate(host => { host.inline = true; });
  assert.equal(await page.locator("#native").evaluate(host => host.shadowRoot.querySelector("spui-popover").inline), true);
  assert.deepEqual(await page.locator("#native").evaluate(host => { const popover = host.shadowRoot.querySelector("spui-popover"); const surface = popover.shadowRoot.querySelector(".surface"); return { inline: popover.inline, hostInline: host.inline, surfaceZIndex: getComputedStyle(surface).zIndex, inlineStyle: surface.style.zIndex, hasPopover: surface.hasAttribute("popover") }; }), { inline: true, hostInline: true, surfaceZIndex: "1", inlineStyle: "1", hasPopover: true }, "changing inline mode updates the rendered surface rather than only reflecting the attribute");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", reactDefaultInline: true, reactInlineFalseProp: true, nativePropertyAndPopoverPropagation: true, inlineLocalSourceOrder: true, inlineLowStackingVsOverlayStacking: true, nativeTopLayerPlacement: true, noPageErrors: true }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
