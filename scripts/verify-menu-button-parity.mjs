import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(process.cwd());
const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Menu,MenuButton,MenuItem}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";createRoot(document.querySelector("#root")).render(<><Menu data-testid="menu" trigger={<MenuButton data-testid="trigger" icon={<b>+</b>}>Actions</MenuButton>}><MenuItem value="new">New item</MenuItem></Menu><Menu data-testid="custom-menu" trigger={<MenuButton data-testid="custom-trigger" menuIcon={<svg data-testid="custom-icon" viewBox="0 0 16 16"><path d="m4 6 4 4 4-4"/></svg>}>Options</MenuButton>}><MenuItem>Rename</MenuItem></Menu><MenuButton data-testid="disabled" disabled>Unavailable</MenuButton><MenuButton data-testid="disabled-focusable" disabled disabledFocusable>Unavailable but focusable</MenuButton></>);`,
    resolveDir: root,
    sourcefile: "menu-button-parity.tsx",
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
  const page = await browser.newPage({ viewport: { width: 800, height: 420 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector("[data-testid=trigger]")?.shadowRoot?.querySelector("button"));

  const triggerHost = page.getByTestId("trigger");
  const trigger = triggerHost.locator("button");
  assert.equal(await trigger.getAttribute("aria-haspopup"), "menu", "Menu wires the trigger's popup semantics");
  assert.equal(await trigger.getAttribute("aria-expanded"), "false");
  assert.equal(await triggerHost.locator(".menu-icon svg").count(), 1, "default menu chevron is present");
  await trigger.click();
  assert.equal(await trigger.getAttribute("aria-expanded"), "true", "click opens the composed Menu");
  assert.equal(await page.getByRole("menuitem", { name: "New item" }).isVisible(), true);
  await page.keyboard.press("Escape");
  assert.equal(await trigger.getAttribute("aria-expanded"), "false", "Escape closes the Menu");
  assert.equal(await trigger.evaluate(button => button.getRootNode().activeElement === button), true, "Escape restores focus to MenuButton");

  const customHost = page.getByTestId("custom-trigger");
  assert.equal(await customHost.evaluate(host => host.shadowRoot.querySelector('slot[name="menu-icon"]').assignedElements().some(element => element.querySelector("[data-testid=custom-icon]"))), true, "consumer menuIcon replaces the default chevron");
  const disabledHost = page.getByTestId("disabled");
  assert.equal(await disabledHost.locator("button").isDisabled(), true, "native disabled behavior is preserved");
  const focusableHost = page.getByTestId("disabled-focusable");
  const focusable = focusableHost.locator("button");
  assert.equal(await focusable.getAttribute("aria-disabled"), "true");
  assert.equal(await focusable.getAttribute("disabled"), null, "disabledFocusable remains in tab sequence");
  await focusable.focus(); await page.keyboard.press("Enter");
  assert.equal(await focusable.getAttribute("aria-expanded"), null, "disabledFocusable cannot activate as a menu trigger");

  await page.evaluate(() => {
    const menu = document.createElement("spui-menu"); menu.id = "native-menu";
    const button = document.createElement("spui-menu-button"); button.slot = "trigger"; button.textContent = "Native menu";
    const items = document.createElement("div"); items.slot = "menu";
    const item = document.createElement("spui-menu-item"); item.textContent = "Native action"; items.append(item); menu.append(button, items); document.body.append(menu);
  });
  const nativeTrigger = page.locator("#native-menu spui-menu-button button");
  await nativeTrigger.click();
  assert.equal(await nativeTrigger.getAttribute("aria-expanded"), "true", "direct custom elements compose with Menu");
  assert.deepEqual(errors, [], "no browser errors");
  await page.screenshot({ path: resolve(root, "test-results/menu-button-parity.png"), fullPage: true });
  console.log(JSON.stringify({ status: "passed", menuCompositionAndAria: true, defaultAndCustomMenuIcons: true, escapeFocusRestore: true, disabledFocusable: true, directCustomElement: true, noPageErrors: true, screenshot: "test-results/menu-button-parity.png" }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
