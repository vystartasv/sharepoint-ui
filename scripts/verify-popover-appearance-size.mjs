import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    sourcefile: "popover-appearance.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Popover,PopoverSurface,PopoverTrigger}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{definePopover}from"${resolve("packages/sharepoint-ui/src/elements/popover.ts")}";definePopover();createRoot(document.querySelector("#root")).render(<><Popover data-testid="brand" appearance="brand" withArrow open><PopoverTrigger><button>Brand</button></PopoverTrigger><PopoverSurface>Brand content</PopoverSurface></Popover><Popover data-testid="inverted" appearance="inverted" size="small" open><PopoverTrigger><button>Inverted</button></PopoverTrigger><PopoverSurface>Inverted content</PopoverSurface></Popover><Popover data-testid="large" size="large" arrow open><PopoverTrigger><button>Large</button></PopoverTrigger><PopoverSurface>Large content</PopoverSurface></Popover></>);window.mountNative=()=>{const host=document.createElement("spui-popover");host.id="native";host.setAttribute("appearance","brand");host.setAttribute("size","small");host.setAttribute("arrow","");host.setAttribute("open","");const trigger=document.createElement("button");trigger.slot="trigger";trigger.textContent="Native";const content=document.createElement("div");content.slot="content";content.textContent="Native content";host.append(trigger,content);document.querySelector("#native-root").append(host)};window.mountNative();`,
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
  const { chromium } = await import("playwright");
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.evaluate(() => document.documentElement.style.setProperty("--spui-ui-accent", "#78716c"));
  await page.waitForFunction(() => document.querySelector('[data-testid=brand]')?.shadowRoot?.querySelector(".surface")?.matches(":popover-open"));
  const surface = id => page.getByTestId(id).locator(".surface");
  const brand = await surface("brand").evaluate(node => ({ color: getComputedStyle(node).color, background: getComputedStyle(node).backgroundColor, arrow: getComputedStyle(node, "::before").content }));
  assert.equal(brand.background, "rgb(120, 113, 108)", "brand appearance uses the themed accent");
  assert.equal(brand.color, "rgb(255, 255, 255)", "brand appearance uses the generated on-accent foreground");
  assert.notEqual(brand.arrow, "none", "withArrow aliases arrow rendering");
  const inverted = await surface("inverted").evaluate(node => ({ color: getComputedStyle(node).color, background: getComputedStyle(node).backgroundColor, padding: getComputedStyle(node).padding, fontSize: getComputedStyle(node).fontSize }));
  assert.equal(inverted.background, "rgb(36, 36, 36)");
  assert.equal(inverted.color, "rgb(255, 255, 255)");
  assert.equal(inverted.padding, "8px");
  assert.equal(inverted.fontSize, "12px");
  assert.equal(await surface("large").evaluate(node => getComputedStyle(node).padding), "20px");
  const native = page.locator("#native").locator(".surface");
  assert.equal(await native.evaluate(node => getComputedStyle(node).backgroundColor), brand.background);
  assert.equal(await native.evaluate(node => getComputedStyle(node).padding), "8px");
  await page.emulateMedia({ forcedColors: "active" });
  const systemColors = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.cssText = "position:fixed;color:CanvasText;background:Canvas;border:1px solid CanvasText";
    document.body.append(probe);
    const colors = { text: getComputedStyle(probe).color, canvas: getComputedStyle(probe).backgroundColor, border: getComputedStyle(probe).borderTopColor };
    probe.remove();
    return colors;
  });
  const forcedSurfaces = {};
  for (const id of ["brand", "inverted", "large"]) {
    forcedSurfaces[id] = await surface(id).evaluate(node => {
      const style = getComputedStyle(node);
      return { text: style.color, background: style.backgroundColor, border: style.borderTopColor, shadow: style.boxShadow };
    });
    assert.equal(forcedSurfaces[id].text, systemColors.text, `${id} Popover text uses CanvasText in forced colors`);
    assert.equal(forcedSurfaces[id].background, systemColors.canvas, `${id} Popover surface uses Canvas`);
    assert.equal(forcedSurfaces[id].border, systemColors.border, `${id} Popover border uses CanvasText`);
    assert.equal(forcedSurfaces[id].shadow, "none", `${id} Popover does not rely on shadow in forced colors`);
  }
  await page.emulateMedia({ forcedColors: "none" });
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify({ status: "passed", brandAndInverted: true, arrowAlias: true, smallMediumLarge: true, customElementPath: true, forcedColors: { systemColors, surfaces: forcedSurfaces }, pageErrors: 0 }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
