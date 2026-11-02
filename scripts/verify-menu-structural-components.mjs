import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = process.cwd();
const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Menu,MenuDivider,MenuGroup,MenuGroupHeader,MenuItem,MenuList,Nav,NavItem,NavSectionHeader}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";import{defineMenuDivider,defineMenuGroup,defineMenuGroupHeader}from"${resolve(root, "packages/sharepoint-ui/src/elements/menu.ts")}";import{defineNavSectionHeader}from"${resolve(root, "packages/sharepoint-ui/src/elements/nav.ts")}";window.mountNative=()=>{defineMenuDivider();defineMenuGroup();defineMenuGroupHeader();defineNavSectionHeader();const root=document.querySelector("#native");const group=document.createElement("spui-menu-group");group.dataset.testid="native-group";group.setAttribute("label","Native group");const header=document.createElement("spui-menu-group-header");header.textContent="Native group heading";const item=document.createElement("spui-menu-item");item.textContent="Native command";group.append(header,item);root.append(group);const divider=document.createElement("spui-menu-divider");divider.dataset.testid="native-divider";root.append(divider);const section=document.createElement("spui-nav-section-header");section.dataset.testid="native-section";section.textContent="Native section";root.append(section)};function App(){return <><Menu label="Commands" open inline><MenuList><MenuGroup data-testid="react-group" label="File commands"><MenuGroupHeader>File commands</MenuGroupHeader><MenuItem value="open">Open</MenuItem></MenuGroup><MenuDivider data-testid="react-divider"/><MenuGroup data-testid="react-group-fallback" label="Other commands"><MenuItem value="help">Help</MenuItem></MenuGroup></MenuList></Menu><Nav label="Primary navigation"><NavSectionHeader data-testid="react-section">Documents</NavSectionHeader><NavItem value="recent">Recent</NavItem></Nav></>}createRoot(document.querySelector("#react")).render(<App/>);window.mountNative();`,
    resolveDir: root,
    sourcefile: "menu-structural-components.tsx",
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
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><main id='native'></main><main id='react'></main><script src='/bundle.js'></script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
const { chromium } = createRequire(import.meta.url)("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);

  const reactGroup = page.getByTestId("react-group");
  assert.equal(await reactGroup.getAttribute("role"), "group");
  assert.equal(await reactGroup.getAttribute("aria-labelledby"), await reactGroup.locator("spui-menu-group-header").getAttribute("id"), "MenuGroup is labelled by its MenuGroupHeader");
  assert.equal(await reactGroup.getAttribute("aria-label"), null, "the heading relationship is the group's accessible name");
  assert.equal(await reactGroup.locator("spui-menu-group-header").getAttribute("role"), null, "MenuGroupHeader remains a normal heading slot element");
  const fallbackGroup = page.getByTestId("react-group-fallback");
  assert.equal(await fallbackGroup.getAttribute("aria-label"), "Other commands", "label remains an accessible fallback when no header is rendered");
  assert.equal(await fallbackGroup.getAttribute("aria-labelledby"), null);

  const reactDivider = page.getByTestId("react-divider");
  assert.equal(await reactDivider.getAttribute("role"), "presentation");
  assert.equal(await reactDivider.getAttribute("aria-hidden"), "true", "MenuDivider is decorative to assistive technology");
  assert.equal(await reactDivider.evaluate(host => host.shadowRoot.querySelector('[aria-hidden="true"]') !== null), true);

  const reactSection = page.getByTestId("react-section");
  assert.equal(await reactSection.getAttribute("role"), "heading");
  assert.equal(await reactSection.getAttribute("aria-level"), "3", "NavSectionHeader matches Fluent's h3 heading level");
  assert.equal(await reactSection.textContent(), "Documents");

  const nativeGroup = page.getByTestId("native-group");
  await page.waitForFunction(() => document.querySelector('[data-testid="native-group"]')?.hasAttribute("aria-labelledby"));
  assert.equal(await nativeGroup.getAttribute("role"), "group");
  assert.equal(await nativeGroup.getAttribute("aria-labelledby"), await nativeGroup.locator("spui-menu-group-header").getAttribute("id"), "native MenuGroup links its native heading");
  const nativeDivider = page.getByTestId("native-divider");
  assert.equal(await nativeDivider.getAttribute("aria-hidden"), "true");
  assert.equal(await nativeDivider.getAttribute("role"), "presentation");
  const nativeSection = page.getByTestId("native-section");
  assert.equal(await nativeSection.getAttribute("role"), "heading");
  assert.equal(await nativeSection.getAttribute("aria-level"), "3");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", menuGroupLabelRelationship: true, dividerDecorativeSemantics: true, sectionHeadingLevel: 3, reactAndNative: true, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
