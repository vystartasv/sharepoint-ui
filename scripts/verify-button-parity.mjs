import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(process.cwd());
const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Button,MenuButton,MenuItem,SplitButton}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";window.enabledClicks=0;window.disabledClicks=0;window.slotClicks=0;window.objectSlotClicks=0;createRoot(document.querySelector("#root")).render(<><Button data-testid="before" icon={<b>+</b>} iconPosition="before" onClick={()=>window.enabledClicks++}>Add item</Button><Button data-testid="after" icon={<b>!</b>} iconPosition="after">Review item</Button><Button data-testid="reset" type="reset">Reset</Button><Button data-testid="disabled" disabled disabledFocusable onClick={()=>window.disabledClicks++}>Disabled action</Button><Button data-testid="native-disabled" disabled>Disabled normally</Button><SplitButton data-testid="split" disabled disabledFocusable icon={<b>+</b>} iconPosition="after" menuItems={<MenuItem>Rename</MenuItem>}>Copy</SplitButton><SplitButton data-testid="split-slots" menuItems={<MenuItem>Open custom action</MenuItem>} primaryActionButton={<Button data-testid="slot-primary" appearance="outline" onClick={()=>window.slotClicks++}>Custom primary</Button>} menuButton={<MenuButton data-testid="slot-menu-button" appearance="subtle">Custom menu trigger</MenuButton>}>Fallback primary</SplitButton><SplitButton data-testid="split-slot-props" menuItems={<MenuItem>Open prop action</MenuItem>} primaryActionButton={{"data-testid":"object-primary",appearance:"subtle",onClick:()=>window.objectSlotClicks++,children:"Object primary"}} menuButton={{"data-testid":"object-menu",children:"Object menu",appearance:"outline"}}>Fallback primary</SplitButton></>);`,
    resolveDir: root,
    sourcefile: "button-parity.tsx",
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
  const page = await browser.newPage({ viewport: { width: 900, height: 420 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector("[data-testid=before]")?.shadowRoot?.querySelector("button"));

  const stylesheetReuse = await page.evaluate(() => {
    const roots = [...document.querySelectorAll("spui-button")]
      .map(host => host.shadowRoot)
      .filter(root => root !== null);
    const sheets = roots.map(root => root.adoptedStyleSheets.find(sheet => sheet.cssRules.length > 0));
    return {
      buttonRoots: roots.length,
      fallbackStyleElements: roots.reduce((count, root) => count + root.querySelectorAll("style").length, 0),
      allShareOneSheet: sheets.length > 0 && sheets.every(sheet => sheet === sheets[0]),
      sheetHasButtonRules: sheets[0]?.cssRules.length ?? 0,
    };
  });
  assert.ok(stylesheetReuse.buttonRoots > 1, "fixture mounts multiple Button shadow roots");
  assert.equal(stylesheetReuse.fallbackStyleElements, 0, "constructable stylesheet path avoids per-Button style nodes");
  assert.equal(stylesheetReuse.allShareOneSheet, true, "Button shadow roots reuse one stylesheet per document");
  assert.ok(stylesheetReuse.sheetHasButtonRules > 0, "shared stylesheet contains Button rules");

  const before = page.getByTestId("before").locator("button");
  const after = page.getByTestId("after").locator("button");
  assert.equal(await page.getByTestId("reset").locator("button").getAttribute("type"), "reset", "Button preserves the reset type");
  const positions = await Promise.all([before, after].map(control => control.evaluate(button => {
    const icon = button.querySelector(".icon").getBoundingClientRect();
    const content = button.querySelector(".content").getBoundingClientRect();
    return { icon: icon.left, content: content.left, hidden: button.querySelector(".icon").hidden };
  })));
  assert.ok(positions[0].icon < positions[0].content, `iconPosition=before places icon first (${JSON.stringify(positions[0])})`);
  assert.ok(positions[1].icon > positions[1].content, `iconPosition=after places icon last (${JSON.stringify(positions[1])})`);

  const disabledHost = page.getByTestId("disabled");
  const disabled = disabledHost.locator("button");
  assert.equal(await disabled.getAttribute("aria-disabled"), "true");
  assert.equal(await disabled.getAttribute("disabled"), null, "disabledFocusable stays in the tab sequence");
  await disabled.focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => window.disabledClicks), 0, "disabledFocusable blocks the React onClick handler");
  const nativeDisabled = page.getByTestId("native-disabled").locator("button");
  assert.equal(await nativeDisabled.isDisabled(), true, "ordinary disabled remains a native disabled button");
  const splitButtons = page.getByTestId("split").locator("spui-button");
  assert.equal(await splitButtons.count(), 2, "SplitButton composes primary and menu Button controls");
  for (const control of await splitButtons.all()) {
    const button = control.locator("button");
    assert.equal(await button.getAttribute("aria-disabled"), "true", "SplitButton disabledFocusable reaches both actions");
    assert.equal(await button.getAttribute("disabled"), null);
  }
  const customPrimary = page.getByTestId("slot-primary").locator("button");
  assert.equal(await customPrimary.getAttribute("class"), "outline", "custom primary slot keeps its appearance override");
  assert.equal(await page.getByTestId("slot-primary").evaluate(host => host.textContent.trim()), "Custom primary", "custom primary slot replaces the default action content");
  await customPrimary.click();
  assert.equal(await page.evaluate(() => window.slotClicks), 1, "custom primary slot keeps its activation handler");
  const customMenu = page.getByTestId("slot-menu-button");
  assert.equal(await customMenu.locator("button").getAttribute("aria-haspopup"), "menu", "custom menu slot receives menu semantics");
  await customMenu.locator("button").click();
  assert.equal(await page.getByRole("menuitem", { name: "Open custom action" }).isVisible(), true, "custom menu slot opens the composed Menu");
  const objectPrimary = page.getByTestId("object-primary").locator("button");
  assert.equal(await page.getByTestId("object-primary").evaluate(host => host.textContent.trim()), "Object primary", "prop-object primary slot supplies children");
  assert.equal(await objectPrimary.getAttribute("class"), "subtle");
  await objectPrimary.click();
  assert.equal(await page.evaluate(() => window.objectSlotClicks), 1, "prop-object primary slot supplies its click handler");
  const objectMenu = page.getByTestId("object-menu");
  await objectMenu.locator("button").click();
  assert.equal(await page.getByRole("menuitem", { name: "Open prop action" }).isVisible(), true, "prop-object menu slot opens the composed Menu");

  await before.click();
  assert.equal(await page.evaluate(() => window.enabledClicks), 1, "enabled Button activation remains intact");
  await before.focus();
  const beforeHost = page.getByTestId("before");
  await beforeHost.evaluate(host => host.setAttribute("appearance", "outline"));
  assert.equal(await beforeHost.evaluate(host => host.shadowRoot.activeElement?.tagName), "BUTTON", "attribute rerender restores focus when a control was already focused");
  await page.evaluate(() => {
    const button = document.createElement("spui-button");
    button.id = "native-disabled-focusable"; button.textContent = "Native action";
    button.setAttribute("disabled", ""); button.setAttribute("disabled-focusable", ""); document.body.append(button);
  });
  const native = page.locator("#native-disabled-focusable").locator("button");
  assert.equal(await native.getAttribute("aria-disabled"), "true");
  assert.equal(await native.getAttribute("disabled"), null);
  const mountKeepsFocus = await page.evaluate(() => {
    const input = document.createElement("input"); input.id = "focus-sentinel"; document.body.append(input); input.focus();
    const button = document.createElement("spui-button"); button.textContent = "Unfocused action"; document.body.append(button);
    return document.activeElement === input;
  });
  assert.equal(mountKeepsFocus, true, "mounting a Button does not steal existing focus");
  assert.deepEqual(errors, [], "no browser errors");
  await page.screenshot({ path: resolve(root, "test-results/button-parity.png"), fullPage: true });
  console.log(JSON.stringify({ status: "passed", sharedButtonStylesheet: stylesheetReuse, iconPositionBeforeAndAfter: true, disabledFocusableKeyboardAndReactActivation: true, focusRestorationAndNoStealOnMount: true, nativeDisabledBehavior: true, splitButtonElementAndPropObjectSlots: true, directCustomElement: true, noPageErrors: true, screenshot: "test-results/button-parity.png" }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
