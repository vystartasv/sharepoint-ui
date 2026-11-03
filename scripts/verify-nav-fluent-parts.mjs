import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import ts from "typescript";
import { chromium } from "playwright";

const typeFixturePath = resolve("packages/sharepoint-ui/src/.nav-event-type-contract.tsx");
const typeFixture = `import * as React from "react"; import { AppItem, Hamburger, Nav, NavCategoryItem, NavDrawer, NavItem } from "./react.js"; const navClick = (event: React.MouseEvent<HTMLElement>) => event; const itemClick = (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => event; const categoryClick = (event: React.MouseEvent<HTMLButtonElement>) => event; const click = (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => event; const hamburgerClick = (event: React.MouseEvent<HTMLButtonElement>) => event; const example = <><Hamburger onClick={hamburgerClick} onClickCapture={hamburgerClick} /><NavItem value="type-nav-item" onClick={itemClick} /><AppItem value="type-app-item" onClick={itemClick} /><NavCategoryItem onClick={categoryClick} /><Nav onClick={navClick} onClickCapture={navClick} onNavItemSelect={(event, data) => { const callbackEvent: Event | React.SyntheticEvent = event; if (data.type === "click") { const branch = click(data.event); void branch; } else { const branch: Event | React.SyntheticEvent = data.event; void branch; } void [callbackEvent, data.value]; }} onNavCategoryItemToggle={(event, data) => { const callbackEvent: Event | React.SyntheticEvent = event; if (data.type === "click") { const branch = click(data.event); void branch; } else { const branch: Event | React.SyntheticEvent = data.event; void branch; } void [callbackEvent, data.open]; }} /><NavDrawer onNavItemSelect={(event, data) => { if (data.type === "click") { const branch = click(data.event); void branch; } }} /></>;`;
const typeOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, jsx: ts.JsxEmit.ReactJSX, strict: true, skipLibCheck: true, noEmit: true };
const originalReadFile = ts.sys.readFile;
const originalGetSourceFile = ts.createCompilerHost(typeOptions).getSourceFile;
const typeHost = ts.createCompilerHost(typeOptions);
typeHost.readFile = file => resolve(file) === typeFixturePath ? typeFixture : originalReadFile(file);
typeHost.getSourceFile = (file, languageVersion, onError, fresh) => resolve(file) === typeFixturePath ? ts.createSourceFile(file, typeFixture, languageVersion, true, ts.ScriptKind.TSX) : originalGetSourceFile(file, languageVersion, onError, fresh);
const typeErrors = ts.getPreEmitDiagnostics(ts.createProgram([typeFixturePath], typeOptions, typeHost)).map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
assert.deepEqual(typeErrors, [], `Nav selection and category events should narrow like Fluent: ${typeErrors.join("\n")}`);

const bundle = await build({
  stdin: {
    sourcefile: "nav-fluent-parts.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{AppItem,AppItemStatic,Hamburger,Nav,NavCategory,NavCategoryItem,NavDrawer,NavDrawerBody,NavDrawerFooter,NavDrawerHeader,NavItem,NavSubItemGroup,SplitNavItem}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";window.selects=[];window.toggles=[];window.navEvents=[];window.hamburgers=0;window.navRootEvents=[];window.navRootCaptures=[];window.navItemEvents=[];window.navCategoryEvents=[];window.hamburgerEvents=[];window.hamburgerCaptures=[];function App(){return <><Nav data-testid="nav" onClick={event=>window.navRootEvents.push({target:event.target.tagName,currentTarget:event.currentTarget.tagName,nativeEventType:event.nativeEvent.type})} onClickCapture={event=>window.navRootCaptures.push({target:event.target.tagName,currentTarget:event.currentTarget.tagName,nativeEventType:event.nativeEvent.type})} defaultSelectedCategoryValue="projects" onNavItemSelect={(e,d)=>{window.selects.push(d);window.navEvents.push({eventSame:e===d.event,type:d.type,currentTarget:d.event.currentTarget?.tagName,target:d.event.target?.tagName,nativeEventType:d.event.nativeEvent?.type})}} onNavCategoryItemToggle={(e,d)=>{window.toggles.push(d);window.navEvents.push({eventSame:e===d.event,type:d.type,currentTarget:d.event.currentTarget?.tagName,target:d.event.target?.tagName,nativeEventType:d.event.nativeEvent?.type})}}><AppItem value="app" href="#app" onClick={event=>window.navItemEvents.push({target:event.target.tagName,currentTarget:event.currentTarget.tagName,nativeEventType:event.nativeEvent.type})}>App</AppItem><AppItemStatic>Application label</AppItemStatic><NavCategory value="projects"><NavCategoryItem onClick={event=>window.navCategoryEvents.push({target:event.target.tagName,currentTarget:event.currentTarget.tagName,nativeEventType:event.nativeEvent.type})}>Projects</NavCategoryItem><NavItem value="project-a" href="#project-a">Project A</NavItem></NavCategory><SplitNavItem value="split" actionLabel="More split actions" onAction={()=>window.selects.push({value:"action"})}>Split destination</SplitNavItem></Nav><NavDrawer data-testid="drawer" label="Workspace" defaultOpen modal={false} dismissible={false} position="end" tabbable={false} defaultOpenCategories={["drawer-projects"]}><NavDrawerHeader>Workspace title</NavDrawerHeader><NavDrawerBody><NavCategory value="drawer-projects"><NavCategoryItem>Drawer projects</NavCategoryItem><NavSubItemGroup><NavItem value="drawer-home">Drawer home</NavItem></NavSubItemGroup></NavCategory></NavDrawerBody><NavDrawerFooter><NavItem value="settings">Settings</NavItem></NavDrawerFooter></NavDrawer><NavDrawer data-testid="inline-drawer" type="inline" label="Inline navigation" defaultOpen><NavItem value="inline-home">Inline home</NavItem></NavDrawer><Hamburger data-testid="hamburger" label="Open workspace navigation" appearance="primary" iconPosition="after" shape="square" size="large" open onClick={event=>{window.hamburgers++;window.hamburgerEvents.push({target:event.target.tagName,currentTarget:event.currentTarget.tagName,nativeEventType:event.nativeEvent.type})}} onClickCapture={event=>window.hamburgerCaptures.push({currentTarget:event.currentTarget.tagName,nativeEventType:event.nativeEvent.type})}/><Hamburger data-testid="disabled-hamburger" label="Unavailable navigation" disabledFocusable onClick={()=>window.hamburgers++}/></>}createRoot(document.querySelector("#root")).render(<App/>);`,
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
  return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><meta charset=utf-8><style>body{font:14px/1.4 system-ui}</style><div id=root></div><script src=/bundle.js></script>");
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const nav = page.locator('[data-testid="nav"]');
  const category = nav.locator("spui-nav-category-item");
  assert.equal(await category.getAttribute("selected"), "", "defaultSelectedCategoryValue selects its category");
  assert.equal(await category.evaluate(node => node.shadowRoot.querySelector("button").getAttribute("aria-current")), "page");
  await category.locator("button").click();
  assert.equal((await page.evaluate(() => window.toggles))[0].value, "projects", "Fluent named category callback receives the selected category");
  assert.equal(await page.evaluate(() => window.toggles[0].event?.type), "click", "category callback preserves the originating click event");
  assert.equal((await page.evaluate(() => window.toggles))[0].type, "click", "category callback identifies the click source");
  assert.deepEqual((await page.evaluate(() => window.navEvents))[0], { eventSame: true, type: "click", currentTarget: "BUTTON", target: "BUTTON", nativeEventType: "click" }, "category callback supplies the originating React button event");
  assert.deepEqual(await page.evaluate(() => window.navCategoryEvents[0]), { target: "BUTTON", currentTarget: "BUTTON", nativeEventType: "click" }, "NavCategoryItem onClick receives its native button");
  assert.deepEqual(await page.evaluate(() => window.navRootEvents[0]), { target: "BUTTON", currentTarget: "NAV", nativeEventType: "click" }, "Nav onClick receives its internal root and native target");
  assert.deepEqual(await page.evaluate(() => window.navRootCaptures[0]), { target: "BUTTON", currentTarget: "NAV", nativeEventType: "click" }, "Nav onClickCapture receives its internal root");
  assert.equal(await category.getAttribute("selected"), "", "category selection is independent of disclosure state");
  await nav.locator("spui-app-item a").click();
  assert.equal((await page.evaluate(() => window.selects))[0].value, "app", "AppItem participates in Nav selection and native link behavior");
  assert.equal(await page.evaluate(() => window.selects[0].event?.type), "click", "item callback preserves the originating click event");
  assert.equal((await page.evaluate(() => window.selects))[0].type, "click", "item callback identifies the click source");
  assert.deepEqual((await page.evaluate(() => window.navEvents))[1], { eventSame: true, type: "click", currentTarget: "A", target: "A", nativeEventType: "click" }, "item callback supplies the originating React anchor event");
  assert.deepEqual(await page.evaluate(() => window.navItemEvents[0]), { target: "A", currentTarget: "A", nativeEventType: "click" }, "AppItem onClick receives its native anchor");
  const split = nav.locator("spui-split-nav-item");
  assert.equal(await split.locator("spui-nav-item button").count(), 1);
  await split.locator('[slot="action"]').click();
  assert.equal((await page.evaluate(() => window.selects)).at(-1).value, "action", "split secondary action remains separate from destination selection");
  await split.locator("spui-nav-item button").click();
  assert.equal((await page.evaluate(() => window.selects)).at(-1).value, "split", "split primary action selects its destination");
  const drawer = page.locator('[data-testid="drawer"]');
  const drawerNav = drawer.locator("spui-nav");
  assert.equal(await drawer.locator("spui-nav-drawer-header").textContent(), "Workspace title");
  assert.equal(await drawer.locator("spui-nav-drawer-body").count(), 1);
  assert.equal(await drawer.locator("spui-nav-drawer-footer").count(), 1);
  assert.equal(await drawerNav.getAttribute("tabbable"), "false");
  const drawerItems = drawerNav.locator("spui-nav-category-item,spui-nav-item");
  assert.deepEqual(await drawerItems.evaluateAll(items => items.map(item => item.shadowRoot.querySelector("button,a").tabIndex)), [0, -1, -1]);
  await drawerNav.locator("spui-nav-category-item button").focus();
  await page.keyboard.press("ArrowDown");
  assert.equal(await drawerNav.locator("spui-nav-item").first().evaluate(node => node.shadowRoot.querySelector("button,a") === node.shadowRoot.activeElement), true, "arrow navigation moves focus through roving drawer items");
  const hamburger = page.locator('[data-testid="hamburger"]');
  const hamburgerButton = hamburger.locator("button");
  assert.equal(await hamburgerButton.getAttribute("aria-label"), "Open workspace navigation");
  assert.equal(await hamburgerButton.getAttribute("aria-expanded"), "true");
  assert.equal(await hamburger.getAttribute("appearance"), "primary");
  assert.equal(await hamburger.getAttribute("icon-position"), "after");
  assert.equal(await hamburger.getAttribute("shape"), "square");
  assert.equal(await hamburger.getAttribute("size"), "large");
  assert.equal(await hamburgerButton.evaluate(node => getComputedStyle(node).borderRadius), "0px", "shape=square reaches the native control styling");
  assert.notEqual(await hamburgerButton.evaluate(node => getComputedStyle(node).backgroundColor), "rgba(0, 0, 0, 0)", "appearance=primary uses the theme-derived button surface");
  await hamburger.focus();
  await page.keyboard.press("Space");
  assert.equal(await page.evaluate(() => window.hamburgers), 1, "Hamburger is keyboard operable");
  assert.deepEqual(await page.evaluate(() => window.hamburgerEvents), [{ target: "BUTTON", currentTarget: "BUTTON", nativeEventType: "click" }], "Hamburger onClick receives the native button event");
  assert.deepEqual(await page.evaluate(() => window.hamburgerCaptures), [{ currentTarget: "BUTTON", nativeEventType: "click" }], "Hamburger onClickCapture receives the native button event");
  const disabledHamburger = page.locator('[data-testid="disabled-hamburger"]');
  const disabledButton = disabledHamburger.locator("button");
  assert.equal(await disabledButton.getAttribute("aria-disabled"), "true", "disabledFocusable remains reachable and announced as disabled");
  assert.deepEqual(await disabledButton.evaluate(button => ({ disabled: button.disabled, tabIndex: button.tabIndex })), { disabled: false, tabIndex: 0 }, "disabledFocusable uses a focusable native button");
  await disabledHamburger.focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => window.hamburgers), 1, "disabledFocusable blocks activation");
  const drawerSurface = drawer.locator("spui-drawer");
  assert.equal(await drawerSurface.getAttribute("open"), "true", "defaultOpen opens the composed Drawer engine");
  await drawerSurface.evaluate(node => { node.open = false; });
  assert.equal(await drawerSurface.getAttribute("open"), null, "the composed Drawer engine can close independently");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => window.matchMedia("(max-width: 640px)").matches);
  const inlineNav = page.locator('[data-testid="inline-drawer"] spui-nav');
  const inlinePanel = inlineNav.locator("nav");
  await page.waitForFunction(() => document.querySelector('[data-testid="inline-drawer"] spui-nav')?.hasAttribute("data-mobile"));
  assert.equal(await inlinePanel.getAttribute("popover"), null, "inline drawers remain in page flow instead of entering the top layer");
  assert.equal(await inlinePanel.isHidden(), true, "inline drawer starts closed at mobile width");
  await inlineNav.locator(".mobile-toggle").click();
  assert.equal(await inlinePanel.isVisible(), true, "inline drawer opens in the page flow");
  assert.equal(await inlinePanel.evaluate(node => getComputedStyle(node).position), "static");
  await page.keyboard.press("Escape");
  assert.equal(await inlinePanel.isHidden(), true, "Escape closes the inline drawer");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", appItems: true, staticAppItem: true, categorySelectionAliases: true, splitDestinationAndAction: true, drawerParts: true, tabbableRovingKeyboard: true, hamburgerAccessibleAndKeyboardOperable: true, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
