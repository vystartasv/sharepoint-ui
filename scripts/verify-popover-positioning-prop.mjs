import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "popover-positioning-prop.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Popover,PopoverSurface,PopoverTrigger}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{definePopover}from"${resolve("packages/sharepoint-ui/src/elements/popover.ts")}";definePopover();createRoot(document.querySelector("#root")).render(<><Popover data-testid="object" open unstable_disableAutoFocus positioning={{position:"below",align:"start",offset:14}}><PopoverTrigger><button style={{position:"fixed",left:100,top:100,width:40,height:30}}>Object</button></PopoverTrigger><PopoverSurface style={{width:100,height:50}}>Object surface</PopoverSurface></Popover><Popover data-testid="aligned" open unstable_disableAutoFocus positioning="above-end"><PopoverTrigger><button style={{position:"fixed",left:300,top:300,width:40,height:30}}>Aligned</button></PopoverTrigger><PopoverSurface style={{width:100,height:50}}>Aligned surface</PopoverSurface></Popover><Popover data-testid="fallback" open unstable_disableAutoFocus positioning={{position:"below",fallbackPositions:["before-start"]}}><PopoverTrigger><button style={{position:"fixed",left:300,top:500,width:40,height:30}}>Fallback</button></PopoverTrigger><PopoverSurface style={{width:100,height:50}}>Fallback surface</PopoverSurface></Popover><Popover data-testid="autosize" open unstable_disableAutoFocus style={{"--spui-popover-max-height":"1000px"}} positioning={{position:"below",fallbackPositions:["above"],autoSize:"height"}}><PopoverTrigger><button style={{position:"fixed",left:100,top:300,width:40,height:30}}>Auto size</button></PopoverTrigger><PopoverSurface><div style={{height:800}}>Tall content</div></PopoverSurface></Popover><Popover data-testid="matchsize" open unstable_disableAutoFocus positioning={{position:"below",matchTargetSize:true}}><PopoverTrigger><button style={{position:"fixed",left:400,top:100,width:140,height:30}}>Match size</button></PopoverTrigger><PopoverSurface style={{width:240,height:50}}>Matched content</PopoverSurface></Popover><Popover data-testid="pinned" open unstable_disableAutoFocus positioning={{position:"below",pinned:true}}><PopoverTrigger><button style={{position:"fixed",left:300,top:550,width:40,height:30}}>Pinned</button></PopoverTrigger><PopoverSurface style={{width:100,height:50}}>Pinned surface</PopoverSurface></Popover></>);window.mountNative=()=>{const host=document.createElement("spui-popover");host.id="native";host.setAttribute("unstable-disable-auto-focus","");host.open=true;host.positioning={position:"after",align:"top",offset:7};const trigger=document.createElement("button");trigger.slot="trigger";trigger.style.cssText="position:fixed;left:400px;top:100px;width:40px;height:30px";trigger.textContent="Native";const content=document.createElement("div");content.slot="content";content.style.cssText="width:100px;height:50px";content.textContent="Native surface";host.append(trigger,content);document.querySelector("#native-root").append(host)};window.mountNative();`,
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
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  try {
    await page.waitForFunction(() => ["object", "aligned", "fallback", "autosize", "matchsize", "pinned"].every(id => document.querySelector(`[data-testid=${id}]`)?.open) && document.querySelector("#native")?.open, undefined, { timeout: 5000 });
  } catch (error) {
    console.log(JSON.stringify(await page.locator("spui-popover").evaluateAll(hosts => hosts.map(host => ({ id: host.dataset.testid || host.id, open: host.open, positioning: host.positioning, placement: host.shadowRoot?.querySelector(".surface")?.dataset.placement })))));
    throw error;
  }
  await page.evaluate(() => {
    const host = document.createElement("spui-popover");
    host.id = "native-width";
    host.setAttribute("unstable-disable-auto-focus", "");
    host.style.setProperty("--spui-popover-max-width", "1200px");
    host.positioning = { position: "below", autoSize: "width" };
    host.open = true;
    const trigger = document.createElement("button");
    trigger.slot = "trigger";
    trigger.style.cssText = "position:fixed;left:100px;top:200px;width:40px;height:30px";
    const content = document.createElement("div");
    content.slot = "content";
    content.style.cssText = "width:1000px;height:40px";
    host.append(trigger, content);
    document.querySelector("#native-root").append(host);
  });
  await page.waitForFunction(() => document.querySelector("#native-width")?.open);
  await page.waitForTimeout(180);
  const geometry = id => page.locator(id).evaluate(host => {
    const surface = host.shadowRoot.querySelector(".surface").getBoundingClientRect();
    const trigger = host.querySelector("button") ?? host.querySelector('[slot="trigger"]');
    const anchor = trigger.getBoundingClientRect();
    return { left: surface.left, top: surface.top, width: surface.width, height: surface.height, anchor: { left: anchor.left, right: anchor.right, top: anchor.top, bottom: anchor.bottom }, placement: host.shadowRoot.querySelector(".surface").dataset.placement };
  });
  const close = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1, `${message}: expected ${expected}, got ${actual}`);
  const object = await geometry('[data-testid="object"]');
  close(object.left, object.anchor.left, "object positioning start alignment");
  close(object.top, object.anchor.bottom + 14, "object positioning offset");
  assert.equal(object.placement, "bottom");
  const aligned = await geometry('[data-testid="aligned"]');
  close(aligned.left, aligned.anchor.right - aligned.width, "above-end inline alignment");
  close(aligned.top, aligned.anchor.top - aligned.height - 8, "above shorthand placement");
  assert.equal(aligned.placement, "top");
  const fallback = await geometry('[data-testid="fallback"]');
  close(fallback.left, fallback.anchor.left - fallback.width - 8, "explicit fallback placement before the automatic opposite side");
  close(fallback.top, fallback.anchor.top, "fallback start alignment on the cross axis");
  assert.equal(fallback.placement, "left");
  const autosize = await page.locator('[data-testid="autosize"] .surface').evaluate(node => ({ maxHeight: Number.parseFloat(getComputedStyle(node).maxHeight), height: node.getBoundingClientRect().height, clientHeight: node.clientHeight, scrollHeight: node.scrollHeight }));
  assert.ok(autosize.maxHeight <= 584, `autoSize height follows available room after flipping: ${JSON.stringify(autosize)}`);
  assert.ok(autosize.scrollHeight > autosize.clientHeight, "auto-sized tall content scrolls inside its constrained surface");
  const matchsize = await geometry('[data-testid="matchsize"]');
  close(matchsize.width, matchsize.anchor.right - matchsize.anchor.left, "matchTargetSize sets the surface width to the trigger width");
  const pinned = await geometry('[data-testid="pinned"]');
  assert.equal(pinned.placement, "bottom", "pinned positioning retains its requested side without flipping");
  assert.ok(pinned.top + pinned.height <= 592, "pinned surface still clamps within the viewport");
  const native = await geometry("#native");
  close(native.left, native.anchor.right + 7, "custom-element logical after side and offset");
  close(native.top, native.anchor.top, "custom-element top alignment");
  assert.equal(native.placement, "right");
  const nativeWidth = await page.locator("#native-width .surface").evaluate(node => ({ maxWidth: Number.parseFloat(getComputedStyle(node).maxWidth), width: node.clientWidth, scrollWidth: node.scrollWidth }));
  assert.ok(nativeWidth.maxWidth < 1000 && nativeWidth.scrollWidth > nativeWidth.width, "custom-element autoSize width constrains oversized content and keeps it scrollable");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", reactPositioningObject: object, fluentAlignedShorthand: aligned, explicitFallbackPositions: fallback, autoSizing: autosize, autoSizeWidth: nativeWidth, matchTargetSize: matchsize.width, pinnedPlacement: pinned.placement, customElementPositioningProperty: native, pageErrors: 0 }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
