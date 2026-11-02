import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: { contents: `import * as React from "react"; import { createRoot } from "react-dom/client"; import { Popover, PopoverSurface, PopoverTrigger } from "${resolve("packages/sharepoint-ui/src/react.tsx")}"; import { definePopover } from "${resolve("packages/sharepoint-ui/src/elements/popover.ts")}"; definePopover(); window.popoverChanges=[];createRoot(document.querySelector("#react")).render(<><Popover label="React details" onOpenChange={(event,data)=>window.popoverChanges.push({open:data.open,eventType:event?.type,key:event?.key})}><PopoverTrigger data-testid="react-trigger"><button>Details</button></PopoverTrigger><PopoverSurface data-testid="react-surface"><p>Composable content</p></PopoverSurface></Popover><Popover label="Boundary details" positioning={{position:"bottom",align:"start",target:document.querySelector("#external-target"),flipBoundary:document.querySelector("#flip-boundary"),overflowBoundary:document.querySelector("#overflow-boundary")}}><PopoverTrigger data-testid="boundary-trigger"><button style={{position:"fixed",left:20,top:500}}>Boundary details</button></PopoverTrigger><PopoverSurface data-testid="boundary-surface"><div style={{width:160}}>Clamped within overflow boundary</div></PopoverSurface></Popover></>); window.mountNative=()=>{const host=document.createElement("spui-popover");host.label="Native details";const trigger=document.createElement("spui-popover-trigger");trigger.dataset.testid="native-trigger";const button=document.createElement("button");button.textContent="Native details";trigger.append(button);const content=document.createElement("div");content.slot="content";const surface=document.createElement("spui-popover-surface");surface.dataset.testid="native-surface";surface.textContent="Native surface";content.append(surface);host.append(trigger,content);document.querySelector("#native").append(host)};`, resolveDir: process.cwd(), sourcefile: "popover-check.tsx", loader: "tsx" },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});
const html = `<!doctype html><html><body style="margin:0;font:14px system-ui"><main id="react"></main><main id="native"></main><div id="flip-boundary" style="position:fixed;left:40px;top:150px;width:400px;height:220px;pointer-events:none"></div><div id="clip-container" style="position:fixed;left:40px;top:150px;width:340px;height:180px;overflow:hidden;pointer-events:none"><div id="clipping-target" style="position:absolute;left:120px;top:130px;width:20px;height:20px"></div></div><div id="extra-boundary" style="position:fixed;left:50px;top:160px;width:300px;height:300px;pointer-events:none"></div><div id="external-target" style="position:fixed;left:220px;top:315px;width:115px;height:21px;pointer-events:none"></div><div id="overflow-boundary" style="position:fixed;left:50px;top:170px;width:240px;height:180px;pointer-events:none"></div><spui-popover id="bottom" placement="bottom" arrow open unstable-disable-auto-focus><button slot="trigger" style="position:fixed;right:2px;bottom:2px">Bottom trigger</button><div slot="content" style="width:280px">A useful amount of content lets the surface exercise width clamping near the viewport edge.</div></spui-popover><spui-popover id="rtl-start" placement="start" dir="rtl" arrow open unstable-disable-auto-focus><button slot="trigger" style="position:fixed;right:2px;top:140px;width:20px;height:20px">RTL</button><div slot="content" style="width:260px">RTL logical start should flip to the available left side.</div></spui-popover><script src="/bundle.js"></script><script>window.mountNative()</script></body></html>`;
const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end(html));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const surface = id => page.locator(`#${id}`).locator(".surface");
  await page.waitForFunction(() => document.querySelector("#bottom").shadowRoot.querySelector(".surface").style.left !== "");
  const bottomAnchor = await page.locator("#bottom [slot=trigger]").boundingBox();
  const bottomSurface = await surface("bottom").boundingBox();
  assert.equal(await surface("bottom").getAttribute("data-placement"), "top", "bottom placement flips above when the viewport has no room");
  assert.ok(bottomSurface.y + bottomSurface.height <= bottomAnchor.y - 7);
  assert.ok(bottomSurface.x >= 8 && bottomSurface.x + bottomSurface.width <= 382, "surface clamps within viewport margins");
  assert.ok(await surface("bottom").evaluate(node => node.matches(":popover-open")), "surface uses the browser top layer");
  await page.locator("#bottom [slot=trigger]").evaluate(node => { node.style.height = "48px"; });
  await page.waitForFunction(previous => document.querySelector("#bottom").shadowRoot.querySelector(".surface").getBoundingClientRect().top < previous - 10, bottomSurface.y);
  assert.ok((await surface("bottom").boundingBox()).y < bottomSurface.y - 10, "trigger ResizeObserver keeps default placement aligned after trigger size changes");
  const rtlAnchor = await page.locator("#rtl-start [slot=trigger]").boundingBox();
  const rtlSurface = await surface("rtl-start").boundingBox();
  assert.equal(await surface("rtl-start").getAttribute("data-placement"), "left", "RTL start maps right then flips to available left side");
  assert.ok(rtlSurface.x + rtlSurface.width <= rtlAnchor.x - 7);
  assert.ok(await surface("rtl-start").evaluate(node => node.matches(":popover-open")));
  const reactTrigger = page.getByTestId("react-trigger").getByRole("button");
  assert.equal(await reactTrigger.getAttribute("aria-haspopup"), "dialog", "composed React trigger receives dialog semantics");
  await reactTrigger.click();
  assert.equal(await page.getByTestId("react-surface").innerText(), "Composable content");
  assert.equal(await reactTrigger.getAttribute("aria-expanded"), "true");
  await page.keyboard.press("Escape");
  assert.deepEqual(await page.evaluate(() => window.popoverChanges), [{ open: true, eventType: "click", key: undefined }, { open: false, eventType: "keydown", key: "Escape" }], "open-change callback identifies the source click and Escape key");
  const boundaryTrigger = page.getByTestId("boundary-trigger").getByRole("button");
  await boundaryTrigger.click();
  const boundaryHost = page.locator("#react").locator("spui-popover").nth(1);
  await page.waitForFunction(() => document.querySelectorAll("#react spui-popover")[1].positioning?.flipBoundary?.id === "flip-boundary" && document.querySelectorAll("#react spui-popover")[1].shadowRoot.querySelector(".surface").dataset.placement === "top");
  const positionedBoundarySurface = boundaryHost.locator(".surface");
  assert.equal(await positionedBoundarySurface.getAttribute("data-placement"), "top", "flipBoundary drives placement selection independently of the viewport");
  assert.equal(await positionedBoundarySurface.evaluate(node => getComputedStyle(node).position), "absolute", "Fluent positioning defaults to absolute strategy");
  await page.waitForTimeout(180);
  const externalTarget = await page.locator("#external-target").boundingBox();
  const triggerBox = await boundaryTrigger.boundingBox();
  const initialPosition = await positionedBoundarySurface.evaluate(node => ({ top: node.getBoundingClientRect().top, cssTop: node.style.top, y: node.style.getPropertyValue("--spui-popover-y"), translate: getComputedStyle(node).translate }));
  const surfaceHeight = await positionedBoundarySurface.evaluate(node => node.offsetHeight);
  assert.notEqual(triggerBox.y, externalTarget.y, "fixture trigger and external target are independent");
  assert.ok(Math.abs(initialPosition.top - externalTarget.y + surfaceHeight + 8) < 1, `Popover anchors to the external Element target instead of its trigger: top=${JSON.stringify(initialPosition)}, target=${externalTarget.y}, height=${surfaceHeight}`);
  const overflowRect = await page.locator("#overflow-boundary").boundingBox();
  const constrainedRect = await positionedBoundarySurface.boundingBox();
  assert.ok(constrainedRect.x >= overflowRect.x + 7 && constrainedRect.x + constrainedRect.width <= overflowRect.x + overflowRect.width - 7, "overflowBoundary constrains the final surface position");
  await boundaryHost.evaluate(node => { node.positioning = { position: "bottom", align: "start", target: document.querySelector("#external-target"), overflowBoundary: document.querySelector("#overflow-boundary"), overflowBoundaryPadding: { start: 8, end: 16 } }; });
  const paddedLeft = await positionedBoundarySurface.evaluate(node => node.getBoundingClientRect().left);
  const measuredSurfaceWidth = await positionedBoundarySurface.evaluate(node => node.offsetWidth);
  assert.ok(Math.abs(paddedLeft - (overflowRect.x + overflowRect.width - 16 - 8 - measuredSurfaceWidth)) < 1, "logical boundary padding is included in the final clamp");
  await boundaryHost.evaluate(node => { node.positioning = { position: "bottom", align: "start", target: document.querySelector("#external-target"), overflowBoundary: document.querySelector("#overflow-boundary"), overflowBoundaryPadding: { start: 60, end: 60 }, autoSize: "width" }; });
  const paddedSize = await positionedBoundarySurface.evaluate(node => ({ width: node.offsetWidth, maxWidth: parseFloat(node.style.maxWidth) }));
  assert.equal(paddedSize.maxWidth, overflowRect.width - 120 - 16, "autoSize uses the padded boundary width");
  assert.equal(paddedSize.width, paddedSize.maxWidth);
  await boundaryHost.evaluate(node => { node.positioning = { position: "bottom", target: document.querySelector("#external-target"), offset: 0 }; });
  const beforeTargetMove = await positionedBoundarySurface.evaluate(node => node.getBoundingClientRect().top);
  await page.locator("#external-target").evaluate(node => { node.style.top = "340px"; node.style.height = "30px"; });
  await page.waitForFunction(previous => document.querySelectorAll("#react spui-popover")[1].shadowRoot.querySelector(".surface").getBoundingClientRect().top >= previous + 24, beforeTargetMove);
  const movedPosition = await positionedBoundarySurface.evaluate(node => node.getBoundingClientRect().top);
  assert.ok(movedPosition >= beforeTargetMove + 24, "ResizeObserver repositions the surface when the external target moves and resizes");
  await boundaryHost.evaluate(node => { node.positioning = { position: "bottom", strategy: "fixed" }; });
  assert.equal(await positionedBoundarySurface.evaluate(node => getComputedStyle(node).position), "fixed", "strategy selects fixed positioning");
  await boundaryHost.evaluate(node => { node.positioning = { position: "bottom", positionFixed: true }; });
  assert.equal(await positionedBoundarySurface.evaluate(node => getComputedStyle(node).position), "fixed", "legacy positionFixed remains supported");
  await boundaryHost.evaluate(node => { node.positioning = { position: "bottom", strategy: "absolute", positionFixed: true }; });
  assert.equal(await positionedBoundarySurface.evaluate(node => getComputedStyle(node).position), "absolute", "strategy takes precedence over the deprecated positionFixed option");
  await boundaryTrigger.evaluate(node => { node.style.left = "100px"; });
  await boundaryHost.evaluate(node => { node.positioning = { position: "bottom", align: "start", offset: { mainAxis: 12, crossAxis: 16 } }; });
  const offsetAnchor = await boundaryTrigger.boundingBox();
  const offsetStyle = await positionedBoundarySurface.evaluate(node => ({ left: node.getBoundingClientRect().left, top: node.getBoundingClientRect().top }));
  assert.ok(Math.abs(offsetStyle.left - offsetAnchor.x - 16) < 1, "crossAxis offset moves the surface along the target edge");
  assert.ok(Math.abs(offsetStyle.top - offsetAnchor.y - offsetAnchor.height - 12) < 1, "mainAxis offset controls the target gap");
  await boundaryHost.evaluate(node => { node.positioning = { position: "bottom", align: "start", offset: 0, coverTarget: true }; });
  const coveredTop = await positionedBoundarySurface.evaluate(node => node.getBoundingClientRect().top);
  assert.ok(Math.abs(coveredTop - offsetAnchor.y) < 1, "coverTarget overlays the target from its top edge");
  await boundaryHost.evaluate(node => { node.setAttribute("arrow", ""); node.positioning = { position: "bottom", align: "start", offset: 0, arrowPadding: 60 }; });
  const arrowOffset = await positionedBoundarySurface.evaluate(node => ({ inline: parseFloat(getComputedStyle(node, "::before").insetInlineStart), width: node.offsetWidth }));
  assert.ok(arrowOffset.inline >= 60 && arrowOffset.inline < arrowOffset.width / 2, "arrow tracks its anchor and respects corner padding rather than staying centered");
  await boundaryHost.evaluate(node => { node.dir = "rtl"; const target = document.querySelector("#external-target"); target.style.left = "250px"; target.style.top = "315px"; target.style.width = "30px"; target.style.height = "21px"; node.positioning = { position: "bottom", align: "start", target, overflowBoundaryPadding: { start: 12, end: 24 }, offset: 0 }; });
  const rtlTargetAnchor = await page.locator("#external-target").boundingBox();
  const rtlPosition = await positionedBoundarySurface.evaluate(node => ({ left: node.getBoundingClientRect().left, width: node.offsetWidth }));
  assert.ok(Math.abs(rtlPosition.left - rtlTargetAnchor.x - rtlTargetAnchor.width + rtlPosition.width) < 1, "RTL start alignment uses the target's inline end edge and logical boundary padding");
  await boundaryHost.evaluate(node => { node.removeAttribute("dir"); node.positioning = { position: "bottom", target: document.querySelector("#clipping-target"), flipBoundary: "clippingParents", overflowBoundary: "scrollParent", offset: 8 }; });
  await page.waitForFunction(() => document.querySelectorAll("#react spui-popover")[1].shadowRoot.querySelector(".surface").dataset.placement === "top");
  const clippingRect = await page.locator("#clip-container").boundingBox();
  const clippedPanel = await positionedBoundarySurface.evaluate(node => ({ left: node.getBoundingClientRect().left, top: node.getBoundingClientRect().top, width: node.offsetWidth, height: node.offsetHeight }));
  assert.ok(clippedPanel.left >= clippingRect.x + 7 && clippedPanel.left + clippedPanel.width <= clippingRect.x + clippingRect.width - 7, "clippingParents resolves the nearest clipping region for flipping");
  assert.ok(clippedPanel.top >= clippingRect.y + 7 && clippedPanel.top + clippedPanel.height <= clippingRect.y + clippingRect.height - 7, "scrollParent resolves an overflow ancestor for clamping");
  await boundaryHost.evaluate(node => { node.positioning = { position: "bottom", target: document.querySelector("#external-target"), overflowBoundary: [document.querySelector("#clip-container"), document.querySelector("#extra-boundary")], offset: 0 }; });
  const arrayBounds = await positionedBoundarySurface.evaluate(node => ({ left: node.getBoundingClientRect().left, top: node.getBoundingClientRect().top, width: node.offsetWidth, height: node.offsetHeight }));
  assert.ok(arrayBounds.left >= 50 && arrayBounds.left + arrayBounds.width <= 350 && arrayBounds.top >= 160 && arrayBounds.top + arrayBounds.height <= 330, "an element array intersects to form the overflow boundary");
  await boundaryHost.evaluate(node => { node.positioning = { position: "bottom", target: document.querySelector("#external-target"), overflowBoundary: { x: 70, y: 160, width: 260, height: 165 }, offset: 0 }; });
  const rectBounds = await positionedBoundarySurface.evaluate(node => ({ left: node.getBoundingClientRect().left, top: node.getBoundingClientRect().top, width: node.offsetWidth, height: node.offsetHeight }));
  assert.ok(rectBounds.left >= 70 && rectBounds.left + rectBounds.width <= 330 && rectBounds.top >= 160 && rectBounds.top + rectBounds.height <= 325, "plain x/y/width/height rectangles work as boundaries");
  const positioningContract = await page.evaluate(async () => {
    const host = document.createElement("spui-popover");
    host.setAttribute("unstable-disable-auto-focus", "");
    const trigger = document.createElement("button");
    trigger.slot = "trigger";
    const targetRect = { x: 100, y: 350, top: 350, left: 100, bottom: 370, right: 144, width: 44, height: 20 };
    const target = { getBoundingClientRect: () => targetRect, contextElement: trigger };
    const ref = { current: null };
    let callback;
    let callbackOffset;
    host.positioning = {
      position: "below",
      align: "start",
      target,
      matchTargetSize: "width",
      offset: params => { callbackOffset = params; return { mainAxis: 13, crossAxis: 5 }; },
      positioningRef: ref,
      onPositioningEnd: event => { callback = event.detail; },
    };
    host.open = true;
    host.append(trigger);
    const content = document.createElement("div");
    content.slot = "content";
    content.textContent = "Positioning contract surface";
    host.append(content);
    document.body.append(host);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await new Promise(resolve => setTimeout(resolve, 180));
    const panel = host.shadowRoot.querySelector(".surface");
    const initial = { bounds: panel.getBoundingClientRect().toJSON(), width: panel.getBoundingClientRect().width, leftStyle: panel.style.left, translate: getComputedStyle(panel).translate, callback, callbackOffset, refAvailable: Boolean(ref.current?.updatePosition && ref.current?.setTarget) };
    const spacer = document.createElement("div");
    spacer.style.height = "1400px";
    document.body.append(spacer);
    window.scrollTo(0, 200);
    await new Promise(resolve => requestAnimationFrame(resolve));
    const scrolledTop = panel.getBoundingClientRect().top;
    const nextRect = { x: 150, y: 400, top: 400, left: 150, bottom: 420, right: 194, width: 44, height: 20 };
    ref.current.setTarget({ getBoundingClientRect: () => nextRect, contextElement: trigger });
    await new Promise(resolve => requestAnimationFrame(resolve));
    const retargeted = panel.getBoundingClientRect().toJSON();
    const constrainedTarget = { x: 100, y: 270, top: 270, left: 100, bottom: 290, right: 144, width: 44, height: 20 };
    host.positioning = { position: "below", target: { getBoundingClientRect: () => constrainedTarget, contextElement: trigger }, offset: 8, pinned: true, flipBoundary: { x: 20, y: 100, width: 300, height: 200 }, shiftToCoverTarget: true, useTransform: false };
    const shiftedTop = panel.getBoundingClientRect().top;
    const externalTarget = document.querySelector("#external-target");
    host.positioning = { position: "below", target: externalTarget, offset: 0, useTransform: false, disableUpdateOnResize: true, positioningRef: ref };
    await new Promise(resolve => requestAnimationFrame(resolve));
    const beforeResize = panel.getBoundingClientRect().top;
    externalTarget.style.top = "500px";
    await new Promise(resolve => setTimeout(resolve, 60));
    const whileResizeDisabled = panel.getBoundingClientRect().top;
    ref.current.updatePosition();
    const afterImperativeUpdate = panel.getBoundingClientRect().top;
    host.remove();
    return { initial, scrolledTop, retargeted, shiftedTop, beforeResize, whileResizeDisabled, afterImperativeUpdate };
  });
  assert.equal(positioningContract.initial.refAvailable, true, "positioningRef exposes update and target controls");
  assert.equal(positioningContract.initial.width, 44, "matchTargetSize accepts Fluent's width value");
  assert.ok(Math.abs(positioningContract.initial.bounds.left - 105) < 1 && Math.abs(positioningContract.initial.bounds.top - 383) < 1, "functional main/cross-axis offset positions the virtual target");
  assert.equal(positioningContract.initial.callback.placement, "bottom-start", "positioning-end reports Fluent placement details");
  assert.equal(positioningContract.initial.callback.escaped, false);
  assert.equal(positioningContract.initial.callbackOffset.position, "below");
  assert.ok(positioningContract.initial.translate !== "none", "transform positioning is enabled by default");
  assert.ok(Math.abs(positioningContract.scrolledTop - positioningContract.initial.bounds.top) < 1, "absolute strategy compensates for page scroll so the popup remains anchored in the viewport");
  assert.ok(Math.abs(positioningContract.retargeted.top - 433) < 1, "positioningRef.setTarget retargets without React state changes");
  assert.ok(positioningContract.shiftedTop < 290, "shiftToCoverTarget moves a pinned surface over the reference when its boundary is exceeded");
  assert.ok(Math.abs(positioningContract.whileResizeDisabled - positioningContract.beforeResize) < 1, "disableUpdateOnResize suppresses automatic target resize observation");
  assert.ok(Math.abs(positioningContract.afterImperativeUpdate - positioningContract.whileResizeDisabled) > 100, "positioningRef.updatePosition still updates explicitly when observation is disabled");
  await page.getByTestId("native-trigger").getByRole("button").click();
  assert.equal(await page.getByTestId("native-surface").innerText(), "Native surface", "framework-neutral trigger/surface compose directly");
  await page.screenshot({ path: resolve("test-results/popover-positioning.png"), fullPage: true });
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", viewport: "390x844", reactComposition: true, customElementComposition: true, bottomCollisionFlip: true, rtlLogicalSideFlip: true, viewportClamping: true, externalElementTarget: true, targetResizeObservation: true, elementAndRectBoundaries: true, elementArrayBoundaryIntersection: true, clippingParentsAndScrollParent: true, separateFlipAndOverflowBoundaries: true, overflowBoundaryPaddingAndAutoSize: true, strategyAndLegacyAlias: true, mainAndCrossAxisOffset: true, coverTarget: true, arrowAnchorAlignmentAndPadding: true, rtlAlignedTarget: true, positioningRefTarget: true, positioningEndCallback: true, shiftToCoverTarget: true, resizeObserverOptOut: true, pageScroll: true, transformDefault: true, topLayer: true, pageErrors: errors.length }));
} finally { await browser?.close(); server.close(); }
