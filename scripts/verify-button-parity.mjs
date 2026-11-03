import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(process.cwd());
const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Button,MenuButton,MenuItem,SplitButton}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";import{SplitButton as FluentSplitButton}from"@fluentui/react-components";window.enabledClicks=0;window.disabledClicks=0;window.slotClicks=0;window.objectSlotClicks=0;window.buttonEvents=[];createRoot(document.querySelector("#root")).render(<><Button data-testid="before" icon={<b>+</b>} iconPosition="before" onClick={()=>window.enabledClicks++}>Add item</Button><Button data-testid="native-click" onClick={event=>window.buttonEvents.push([event.target.tagName,event.currentTarget.tagName,event.nativeEvent.type])}><span>Click child</span></Button><Button data-testid="native-capture" onClickCapture={event=>window.buttonEvents.push([event.target.tagName,event.currentTarget.tagName,event.nativeEvent.type+":capture"])}>Capture</Button><Button as="a" href="/target" data-testid="native-anchor" onClick={event=>{window.buttonEvents.push([event.target.tagName,event.currentTarget.tagName,event.currentTarget.href]);event.preventDefault()}}><span>Open link</span></Button><Button data-testid="after" icon={<b>!</b>} iconPosition="after">Review item</Button><Button data-testid="reset" type="reset">Reset</Button><Button data-testid="disabled" disabled disabledFocusable onClick={()=>window.disabledClicks++}>Disabled action</Button><Button data-testid="native-disabled" disabled>Disabled normally</Button><FluentSplitButton data-testid="fluent-split">Copy</FluentSplitButton><SplitButton data-testid="split-labelledby" menuItems={<MenuItem>Run</MenuItem>} primaryActionButton={<Button data-testid="external-label-primary" aria-labelledby="split-primary-label-late">Fallback primary</Button>} menuButton={<MenuButton data-testid="external-label-menu">Other visible name</MenuButton>}>Fallback primary</SplitButton><span id="split-primary-label-late">Approve request</span><MenuButton data-testid="menu-button-labelledby" aria-labelledby="split-primary-label-late">More</MenuButton><SplitButton data-testid="split" disabled disabledFocusable icon={<b>+</b>} iconPosition="after" menuItems={<MenuItem>Rename</MenuItem>}>Copy</SplitButton><SplitButton data-testid="split-explicit-menu-label" menuItems={<MenuItem>Open custom action</MenuItem>} menuButton={<MenuButton aria-label="File actions">Menu caption</MenuButton>}>Save file</SplitButton><SplitButton data-testid="split-slots" menuItems={<MenuItem>Open custom action</MenuItem>} primaryActionButton={<Button data-testid="slot-primary" appearance="outline" onClick={()=>window.slotClicks++}>Custom primary</Button>} menuButton={<MenuButton data-testid="slot-menu-button" appearance="subtle">Custom menu trigger</MenuButton>}>Fallback primary</SplitButton><SplitButton data-testid="split-slot-props" menuItems={<MenuItem>Open prop action</MenuItem>} primaryActionButton={{"data-testid":"object-primary",appearance:"subtle",onClick:()=>window.objectSlotClicks++,children:"Object primary"}} menuButton={{"data-testid":"object-menu",children:"Object menu",appearance:"outline"}}>Fallback primary</SplitButton></>);`,
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
  assert.equal(await page.getByTestId("fluent-split").getByRole("button", { name: "Copy", exact: true }).count(), 2, "pinned Fluent labels both split actions from the primary action");
  assert.equal(await page.getByTestId("split-labelledby").getByRole("button", { name: "Approve request", exact: true }).count(), 2, "SplitButton resolves an aria-labelledby target rendered later in the same React commit for both actions");
  assert.equal(await page.getByTestId("menu-button-labelledby").getByRole("button", { name: "Approve request", exact: true }).count(), 1, "MenuButton resolves an external aria-labelledby target inside its shadow control");
  await page.evaluate(() => { document.querySelector("#split-primary-label-late").textContent = "Approve invoice"; });
  await page.waitForFunction(() => {
    const host = document.querySelector('[data-testid="split-labelledby"]');
    const primary = host?.querySelector('[slot="primary"]')?.shadowRoot?.querySelector("button");
    const menu = host?.querySelector("spui-menu");
    const trigger = menu?.shadowRoot?.querySelector('slot[name="trigger"]')?.assignedElements()[0]?.shadowRoot?.querySelector("button");
    return primary?.getAttribute("aria-label") === "Approve invoice" && trigger?.getAttribute("aria-label") === "Approve invoice";
  });
  assert.equal(await page.getByTestId("split-labelledby").getByRole("button", { name: "Approve invoice", exact: true }).count(), 2, "both SplitButton names follow later changes to the referenced label");
  assert.equal(await page.getByTestId("menu-button-labelledby").getByRole("button", { name: "Approve invoice", exact: true }).count(), 1, "MenuButton follows later changes to the referenced label");
  await page.evaluate(() => {
    const target = document.querySelector("#split-primary-label-late");
    target.setAttribute("aria-labelledby", "split-primary-label-inner");
    const inner = document.createElement("span"); inner.id = "split-primary-label-inner"; inner.textContent = "Approve nested invoice"; document.body.append(inner);
  });
  await page.waitForFunction(() => document.querySelector('[data-testid="split-labelledby"]')?.querySelector('[slot="primary"]')?.getAttribute("aria-label") === "Approve nested invoice");
  assert.equal(await page.getByTestId("split-labelledby").getByRole("button", { name: "Approve nested invoice", exact: true }).count(), 2, "SplitButton resolves a nested aria-labelledby reference for both actions");
  await page.evaluate(() => {
    const replacement = document.createElement("span"); replacement.id = "split-primary-label-inner"; replacement.textContent = "Replacement nested invoice";
    document.getElementById("split-primary-label-inner").replaceWith(replacement);
  });
  await page.waitForFunction(() => document.querySelector('[data-testid="split-labelledby"]')?.querySelector('[slot="primary"]')?.getAttribute("aria-label") === "Replacement nested invoice");
  assert.equal(await page.getByTestId("split-labelledby").getByRole("button", { name: "Replacement nested invoice", exact: true }).count(), 2, "SplitButton follows replacement of a nested aria-labelledby target");
  await page.getByTestId("menu-button-labelledby").evaluate(host => host.removeAttribute("aria-labelledby"));
  assert.equal(await page.getByTestId("menu-button-labelledby").getByRole("button", { name: "More", exact: true }).count(), 1, "MenuButton restores its content name when the external reference is removed");
  assert.equal(await page.getByTestId("split").getByRole("button", { name: "Copy", exact: true }).count(), 2, "local SplitButton matches Fluent accessible names");
  for (const control of await splitButtons.all()) {
    const button = control.locator("button");
    assert.equal(await button.getAttribute("aria-disabled"), "true", "SplitButton disabledFocusable reaches both actions");
    assert.equal(await button.getAttribute("disabled"), null);
  }
  assert.equal(await page.getByTestId("split-explicit-menu-label").getByRole("button", { name: "File actions", exact: true }).count(), 1, "an explicit menu-button accessible name is preserved");
  assert.equal(await page.getByTestId("split-slots").getByRole("button", { name: "Custom primary", exact: true }).count(), 2, "the menu action inherits the custom primary action name");
  const customPrimary = page.getByTestId("slot-primary").locator("button");
  assert.equal(await customPrimary.getAttribute("class"), "outline", "custom primary slot keeps its appearance override");
  assert.equal(await page.getByTestId("slot-primary").evaluate(host => host.textContent.trim()), "Custom primary", "custom primary slot replaces the default action content");
  await customPrimary.click();
  assert.equal(await page.evaluate(() => window.slotClicks), 1, "custom primary slot keeps its activation handler");
  const customMenu = page.getByTestId("slot-menu-button");
  assert.equal(await customMenu.locator("button").getAttribute("aria-haspopup"), "menu", "custom menu slot receives menu semantics");
  await customMenu.locator("button").click();
  assert.equal(await page.getByRole("menuitem", { name: "Open custom action" }).isVisible(), true, "custom menu slot opens the composed Menu");
  assert.equal(await page.getByTestId("split-slot-props").getByRole("button", { name: "Object primary", exact: true }).count(), 2, "object slots inherit the primary accessible name");
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
  await page.getByTestId("native-click").getByText("Click child").click();
  await page.getByTestId("native-capture").locator("button").click();
  await page.getByTestId("native-anchor").getByText("Open link").click();
  const buttonEvents = await page.evaluate(() => window.buttonEvents);
  assert.deepEqual(buttonEvents.slice(0, 2), [["SPAN", "BUTTON", "click"], ["SPAN", "BUTTON", "click:capture"]], "Button click and capture callbacks receive native target/currentTarget");
  assert.deepEqual(buttonEvents[2].slice(0, 2), ["SPAN", "A"], "polymorphic anchor callback receives its native target and currentTarget");
  assert.ok(buttonEvents[2][2].endsWith("/target"), "polymorphic anchor currentTarget exposes its resolved href");
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
