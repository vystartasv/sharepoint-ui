import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(process.cwd());
const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{SharePointUIProvider,ToggleButton}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";window.checkedChanges=[];window.disabledChanges=[];window.toggleButtonEvents=[];function Demo(){const[checked,setChecked]=React.useState(false);return <ToggleButton data-testid="controlled" checked={checked} isAccessible onCheckedChange={value=>{window.checkedChanges.push(value);setChecked(value)}}>Controlled</ToggleButton>}createRoot(document.querySelector("#root")).render(<SharePointUIProvider tokens={{"--spui-ui-accent":"rgb(0, 120, 212)","--spui-ui-accent-text":"rgb(255, 255, 255)"}}><ToggleButton data-testid="default" defaultChecked isAccessible style={{"--spui-ui-accent":"rgb(20, 100, 200)"}}>Default selected</ToggleButton><Demo/><ToggleButton data-testid="legacy" defaultPressed>Legacy pressed</ToggleButton><ToggleButton data-testid="event-button" onClick={event=>window.toggleButtonEvents.push({target:event.target.tagName,currentTarget:event.currentTarget.tagName,nativeEventType:event.nativeEvent.type})}>Event</ToggleButton><ToggleButton data-testid="icon-after" iconPosition="after" icon={<span>★</span>}>After icon</ToggleButton><ToggleButton data-testid="disabled-focusable" disabled disabledFocusable onCheckedChange={value=>window.disabledChanges.push(value)}>Disabled but focusable</ToggleButton></SharePointUIProvider>);`,
    resolveDir: root,
    sourcefile: "toggle-button-parity.tsx",
    loader: "tsx",
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
  alias: { react: resolve(root, "node_modules/react"), "react-dom/client": resolve(root, "examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve(root, "examples/spfx124-webpart/node_modules")],
});
const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><div id='root'></div><script src='/bundle.js'></script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 450 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector("[data-testid=default]")?.shadowRoot?.querySelector("button"));

  const selected = page.getByTestId("default");
  assert.equal(await selected.locator("button").getAttribute("aria-pressed"), "true");
  const accessibleSurface = await selected.evaluate(host => ({ color: getComputedStyle(host.shadowRoot.querySelector("button")).backgroundColor, accent: getComputedStyle(host).getPropertyValue("--spui-ui-accent").trim(), style: host.getAttribute("style") }));
  assert.equal(accessibleSurface.accent, "rgb(20, 100, 200)", "per-component style tokens override provider defaults");
  assert.equal(accessibleSurface.color, accessibleSurface.accent, `isAccessible uses the theme accent as a high-contrast selected surface (${JSON.stringify(accessibleSurface)})`);
  assert.equal(await page.getByTestId("legacy").locator("button").getAttribute("aria-pressed"), "true", "defaultPressed remains supported");
  await page.getByTestId("event-button").locator("button").click();
  assert.deepEqual(await page.evaluate(() => window.toggleButtonEvents), [{ target: "SPAN", currentTarget: "BUTTON", nativeEventType: "click" }], "ToggleButton onClick receives the native button event");
  const iconAfter = page.getByTestId("icon-after");
  assert.equal(await iconAfter.locator("slot[name=icon]").getAttribute("name"), "icon", "ToggleButton exposes its icon slot");
  assert.equal(await iconAfter.locator(".icon").evaluate(element => getComputedStyle(element).order), "2", "iconPosition after positions icon after content");
  const disabledFocusable = page.getByTestId("disabled-focusable").locator("button");
  assert.equal(await disabledFocusable.evaluate(button => button.disabled), false, "disabledFocusable keeps the native button focusable");
  assert.equal(await disabledFocusable.getAttribute("aria-disabled"), "true");
  await disabledFocusable.evaluate(button => button.click());
  assert.deepEqual(await page.evaluate(() => window.disabledChanges), [], "disabledFocusable preserves focus while suppressing activation");

  const controlledHost = page.getByTestId("controlled");
  const controlled = controlledHost.locator("button");
  assert.equal(await controlled.getAttribute("aria-pressed"), "false");
  await controlled.click();
  await page.waitForFunction(() => document.querySelector("[data-testid=controlled]")?.shadowRoot?.querySelector("button")?.getAttribute("aria-pressed") === "true");
  assert.deepEqual(await page.evaluate(() => window.checkedChanges), [true], "controlled checked state reports a single change");
  assert.equal(await controlled.getAttribute("aria-pressed"), "true");
  await controlled.click();
  await page.waitForFunction(() => document.querySelector("[data-testid=controlled]")?.shadowRoot?.querySelector("button")?.getAttribute("aria-pressed") === "false");
  assert.deepEqual(await page.evaluate(() => window.checkedChanges), [true, false]);

  await selected.locator("button").click();
  assert.equal(await selected.locator("button").getAttribute("aria-pressed"), "false", "uncontrolled defaultChecked toggles locally");
  await page.evaluate(() => {
    const element = document.createElement("spui-toggle-button");
    element.id = "native-checked"; element.setAttribute("checked", ""); element.textContent = "Native checked"; document.body.append(element);
  });
  const native = page.locator("#native-checked");
  assert.equal(await native.locator("button").getAttribute("aria-pressed"), "true");
  assert.equal(await native.getAttribute("pressed"), "", "checked and pressed attributes stay aliased for direct elements");
  assert.deepEqual(errors, [], "no browser errors");
  await page.screenshot({ path: resolve(root, "test-results/toggle-button-parity.png"), fullPage: true });
  console.log(JSON.stringify({ status: "passed", controlledAndUncontrolledChecked: true, legacyPressedAliases: true, accessibleSelectedStyling: true, directCustomElement: true, noPageErrors: true, screenshot: "test-results/toggle-button-parity.png" }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
