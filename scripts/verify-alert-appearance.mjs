import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "alert-appearance.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Alert}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineAlert}from"${resolve("packages/sharepoint-ui/src/elements/alert.ts")}";createRoot(document.querySelector("#react")).render(<><Alert data-testid="primary" intent="warning">Primary warning</Alert><Alert data-testid="inverted" intent="warning" appearance="inverted">Inverted warning</Alert><Alert data-testid="slots" intent="info" icon={<span data-testid="custom-icon">I</span>} avatar={<span data-testid="custom-avatar">A</span>} action={<button data-testid="custom-action">Retry</button>}>Slot alert</Alert><Alert data-testid="polite-warning" intent="warning" assertive={false}>Polite warning</Alert></>);window.mountNative=()=>{defineAlert();const a=document.createElement("spui-alert");a.id="native";a.setAttribute("intent","error");a.setAttribute("appearance","inverted");const avatar=document.createElement("span");avatar.slot="avatar";avatar.textContent="V";const action=document.createElement("button");action.slot="action";action.type="button";action.textContent="Retry";a.append("Native error",avatar,action);document.querySelector("#native-root").append(a)};window.mountNative();`,
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});

const server = createServer((request, response) => {
  if (new URL(request.url, "http://localhost").pathname === "/bundle.js") return response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents);
  return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><meta charset=utf-8><div id=react></div><div id=native-root></div><script src=/bundle.js></script>");
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const colors = await page.locator('[data-testid="inverted"]').evaluate(node => {
    const style = getComputedStyle(node);
    return { foreground: style.color, background: style.backgroundColor, role: node.getAttribute("role") };
  });
  assert.equal(colors.role, "alert", "warning intent is assertive by default");
  assert.equal(await page.locator('[data-testid="primary"]').getAttribute("aria-live"), "assertive");
  assert.equal(await page.locator('[data-testid="polite-warning"]').getAttribute("role"), "status", "explicit assertive=false keeps a warning polite");
  assert.equal(await page.locator('[data-testid="custom-avatar"]').count(), 1);
  assert.equal(await page.locator('[data-testid="custom-icon"]').count(), 1);
  assert.equal(await page.locator('[data-testid="slots"] >>> slot[name="icon"]').evaluate(node => node.hidden), true, "avatar takes precedence over icon");
  assert.equal(await page.locator('[data-testid="custom-action"]').getAttribute("slot"), "action");
  const contrast = await page.locator('[data-testid="inverted"]').evaluate(node => {
    const parse = color => color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => { const c = value / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; });
    const [r1, g1, b1] = parse(getComputedStyle(node).color), [r2, g2, b2] = parse(getComputedStyle(node).backgroundColor);
    const l1 = .2126 * r1 + .7152 * g1 + .0722 * b1, l2 = .2126 * r2 + .7152 * g2 + .0722 * b2;
    return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
  });
  assert.ok(contrast >= 4.5, `inverted appearance maintains strong text contrast (${contrast.toFixed(2)}:1)`);
  const native = page.locator("#native");
  assert.equal(await native.getAttribute("appearance"), "inverted");
  assert.equal(await native.getAttribute("role"), "alert", "inverted appearance preserves assertive error semantics");
  assert.equal(await native.locator("slot[name=avatar]").evaluate(node => node.assignedElements().length), 1);
  assert.equal(await native.locator("slot[name=action]").evaluate(node => node.assignedElements().length), 1);
  await page.emulateMedia({ forcedColors: "active" });
  const systemColors = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.cssText = "position:fixed;color:CanvasText;background:Canvas;border:1px solid CanvasText";
    document.body.append(probe);
    const colors = { text: getComputedStyle(probe).color, canvas: getComputedStyle(probe).backgroundColor, border: getComputedStyle(probe).borderTopColor };
    probe.remove();
    return colors;
  });
  const forcedAlerts = {};
  for (const id of ["primary", "inverted", "native"]) {
    forcedAlerts[id] = await page.locator(id === "native" ? "#native" : `[data-testid=${id}]`).evaluate(node => {
      const style = getComputedStyle(node);
      return { text: style.color, background: style.backgroundColor, border: style.borderTopColor, accentBorder: style.borderInlineStartColor };
    });
    assert.equal(forcedAlerts[id].text, systemColors.text, `${id} Alert text uses CanvasText in forced colors`);
    assert.equal(forcedAlerts[id].background, systemColors.canvas, `${id} Alert background uses Canvas`);
    assert.equal(forcedAlerts[id].border, systemColors.border, `${id} Alert border uses CanvasText`);
    assert.equal(forcedAlerts[id].accentBorder, systemColors.border, `${id} Alert intent edge uses CanvasText`);
  }
  await page.emulateMedia({ forcedColors: "none" });
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", invertedAppearance: true, warningAndErrorIntents: true, reactAndNativeSlots: true, avatarPrecedence: true, explicitPoliteOverride: true, contrast: Number(contrast.toFixed(2)), forcedColors: { systemColors, alerts: forcedAlerts }, nativeCustomElement: true, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
