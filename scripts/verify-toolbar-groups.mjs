import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    sourcefile: "toolbar-groups.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Button,Toolbar,ToolbarGroup,ToolbarSeparator}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineToolbar}from"${resolve("packages/sharepoint-ui/src/elements/toolbar.ts")}";window.toolbarRootEvents=[];window.mount=()=>{defineToolbar();const native=document.createElement("spui-toolbar");native.setAttribute("label","Native commands");native.setAttribute("loop","false");const first=document.createElement("spui-toolbar-group");first.setAttribute("label","File actions");for(const label of ["New","Open"]){const button=document.createElement("button");button.textContent=label;button.dataset.testid="native-"+label.toLowerCase();first.append(button)}const separator=document.createElement("spui-toolbar-separator");const second=document.createElement("spui-toolbar-group");second.setAttribute("aria-label","Edit actions");for(const [label,disabled] of [["Disabled",true],["Save",false]]){const button=document.createElement("button");button.textContent=label;button.disabled=disabled;button.dataset.testid="native-"+label.toLowerCase();second.append(button)}native.append(first,separator,second);document.querySelector("#native").append(native);function App(){return React.createElement(Toolbar,{"data-testid":"react-toolbar",label:"React commands",loop:false,onClickCapture:event=>window.toolbarRootEvents.push(["click-capture",event.target.tagName,event.currentTarget.tagName]),onClick:event=>window.toolbarRootEvents.push(["click",event.target.tagName,event.currentTarget.tagName]),onScrollCapture:event=>window.toolbarRootEvents.push(["scroll-capture",event.target.className,event.currentTarget.className,event.detail,event.view===window]),onScroll:event=>window.toolbarRootEvents.push(["scroll",event.target.className,event.currentTarget.className,event.detail,event.view===window])},React.createElement(ToolbarGroup,{label:"File actions"},React.createElement(Button,{"data-testid":"react-new"},"New"),React.createElement(Button,{"data-testid":"react-open"},"Open")),React.createElement(ToolbarSeparator),React.createElement(ToolbarGroup,{"aria-label":"Edit actions"},React.createElement(Button,{"data-testid":"react-disabled",disabled:true},"Disabled"),React.createElement(Button,{"data-testid":"react-save"},"Save")))}createRoot(document.querySelector("#react")).render(React.createElement(App))};`,
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
  const pathname = new URL(request.url, "http://localhost").pathname;
  if (pathname === "/") return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><div id='native'></div><div id='react'></div><script src='/bundle.js'></script></body></html>");
  if (pathname === "/bundle.js") return response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents);
  return response.writeHead(404).end();
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 500 } });
  page.setDefaultTimeout(5000);
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.evaluate(() => window.mount());

  const results = {};
  for (const adapter of ["react", "native"]) {
    const toolbar = adapter === "react" ? page.getByTestId("react-toolbar") : page.locator("#native spui-toolbar");
    if (adapter === "react") {
      await page.getByTestId("react-new").click();
      assert.deepEqual(await page.evaluate(() => window.toolbarRootEvents.splice(0)), [["click-capture", "SPAN", "DIV"], ["click", "SPAN", "DIV"]], "React Toolbar click events preserve the nested native target and Fluent's native div root with capture order");
      await toolbar.evaluate(node => node.shadowRoot.querySelector(".toolbar").dispatchEvent(new UIEvent("scroll", { bubbles: false, view: window, detail: 5 })));
      assert.deepEqual(await page.evaluate(() => window.toolbarRootEvents), [["scroll-capture", "toolbar", "toolbar", 5, true], ["scroll", "toolbar", "toolbar", 5, true]], "React Toolbar receives non-bubbling native scroll events in phase order");
    }
    const group = adapter === "react" ? toolbar.locator("spui-toolbar-group").first() : toolbar.locator("spui-toolbar-group").first();
    const separator = toolbar.locator("spui-toolbar-separator");
    assert.equal(await group.getAttribute("role"), "group");
    assert.equal(await group.getAttribute("aria-label"), "File actions");
    assert.equal(await separator.getAttribute("role"), "separator");
    assert.equal(await separator.getAttribute("aria-orientation"), "vertical");
    const first = adapter === "react" ? page.getByTestId("react-new") : page.getByTestId("native-new");
    const open = adapter === "react" ? page.getByTestId("react-open") : page.getByTestId("native-open");
    const save = adapter === "react" ? page.getByTestId("react-save") : page.getByTestId("native-save");
    const focusInner = host => host.evaluate(node => (node.shadowRoot?.querySelector("button") ?? node).focus());
    const tabIndex = host => host.evaluate(node => (node.shadowRoot?.querySelector("button") ?? node).tabIndex);
    assert.equal(await tabIndex(first), 0);
    assert.equal(await tabIndex(open), -1, `${adapter}: only the first enabled command should be in the tab sequence`);
    await focusInner(first); await page.keyboard.press("ArrowRight");
    assert.equal(await tabIndex(open), 0, `${adapter}: ArrowRight crosses ToolbarGroup boundary`);
    await focusInner(open); await page.keyboard.press("ArrowRight");
    assert.equal(await tabIndex(save), 0, `${adapter}: disabled commands are skipped across separators`);
    await focusInner(save); await page.keyboard.press("ArrowRight");
    assert.equal(await tabIndex(save), 0, `${adapter}: loop=false keeps focus at the end`);

    await toolbar.evaluate(node => node.setAttribute("orientation", "vertical"));
    assert.equal(await separator.getAttribute("aria-orientation"), "horizontal");
    assert.equal(await toolbar.locator("spui-toolbar-group").first().getAttribute("orientation"), "vertical");
    await toolbar.evaluate(node => { node.setAttribute("orientation", "horizontal"); node.setAttribute("dir", "rtl"); });
    await focusInner(first); await page.keyboard.press("ArrowLeft");
    assert.equal(await tabIndex(open), 0, `${adapter}: RTL arrow follows logical direction inside groups`);
    results[adapter] = { groupName: true, separatorOrientation: true, rovingAcrossGroups: true, disabledSkipped: true, noLoopAtEnd: true, verticalOrientation: true, rtlNavigation: true };
  }
  assert.deepEqual(pageErrors, []);
  console.log(JSON.stringify({ browser: "Chromium headless", adapters: results, pageErrors }));
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
