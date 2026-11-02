import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "nav-fluent-parts.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{AppItem,AppItemStatic,Hamburger,Nav,NavCategory,NavCategoryItem,NavDrawer,NavDrawerBody,NavDrawerFooter,NavDrawerHeader,NavItem,NavSubItemGroup,SplitNavItem}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";window.selects=[];window.toggles=[];window.hamburgers=0;function App(){return <><Nav data-testid="nav" defaultSelectedCategoryValue="projects" onNavItemSelect={(_e,d)=>window.selects.push(d)} onNavCategoryItemToggle={(_e,d)=>window.toggles.push(d)}><AppItem value="app" href="#app">App</AppItem><AppItemStatic>Application label</AppItemStatic><NavCategory value="projects"><NavCategoryItem>Projects</NavCategoryItem><NavItem value="project-a" href="#project-a">Project A</NavItem></NavCategory><SplitNavItem value="split" actionLabel="More split actions" onAction={()=>window.selects.push({value:"action"})}>Split destination</SplitNavItem></Nav><NavDrawer data-testid="drawer" label="Workspace" defaultOpen modal={false} dismissible={false} position="end" tabbable={false} defaultOpenCategories={["drawer-projects"]}><NavDrawerHeader>Workspace title</NavDrawerHeader><NavDrawerBody><NavCategory value="drawer-projects"><NavCategoryItem>Drawer projects</NavCategoryItem><NavSubItemGroup><NavItem value="drawer-home">Drawer home</NavItem></NavSubItemGroup></NavCategory></NavDrawerBody><NavDrawerFooter><NavItem value="settings">Settings</NavItem></NavDrawerFooter></NavDrawer><NavDrawer data-testid="inline-drawer" type="inline" label="Inline navigation" defaultOpen><NavItem value="inline-home">Inline home</NavItem></NavDrawer><Hamburger data-testid="hamburger" label="Open workspace navigation" open onClick={()=>window.hamburgers++}/></>}createRoot(document.querySelector("#root")).render(<App/>);`,
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
  assert.equal(await category.getAttribute("selected"), "", "category selection is independent of disclosure state");
  await nav.locator("spui-app-item a").click();
  assert.equal((await page.evaluate(() => window.selects))[0].value, "app", "AppItem participates in Nav selection and native link behavior");
  assert.equal(await page.evaluate(() => window.selects[0].event?.type), "click", "item callback preserves the originating click event");
  assert.equal((await page.evaluate(() => window.selects))[0].type, "click", "item callback identifies the click source");
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
  assert.equal(await hamburger.getAttribute("role"), "button");
  assert.equal(await hamburger.getAttribute("aria-label"), "Open workspace navigation");
  assert.equal(await hamburger.getAttribute("aria-expanded"), "true");
  await hamburger.focus();
  await page.keyboard.press("Space");
  assert.equal(await page.evaluate(() => window.hamburgers), 1, "Hamburger is keyboard operable");
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
