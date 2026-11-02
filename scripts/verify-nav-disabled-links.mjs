import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "nav-disabled-links.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Nav,NavItem}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineNav}from"${resolve("packages/sharepoint-ui/src/elements/nav.ts")}";window.mount=()=>{defineNav();const nav=document.createElement("spui-nav");nav.dataset.testid="native-nav";const item=document.createElement("spui-nav-item");item.setAttribute("value","disabled");item.setAttribute("href","/should-not-navigate");item.setAttribute("disabled","");item.textContent="Disabled link";nav.append(item);document.querySelector("#native").append(nav);function App(){return React.createElement(Nav,{"data-testid":"react-nav",onItemSelect:()=>window.reactSelected=(window.reactSelected||0)+1},React.createElement(NavItem,{value:"disabled",href:"/should-not-navigate",disabled:true},"Disabled link"))}createRoot(document.querySelector("#react")).render(React.createElement(App))};`,
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
  return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><div id=native></div><div id=react></div><script src=/bundle.js></script>");
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.evaluate(() => window.mount());

  for (const selector of ["#native spui-nav", '[data-testid="react-nav"]']) {
    const nav = page.locator(selector);
    const link = nav.locator("spui-nav-item");
    const result = await link.evaluate(host => {
      const anchor = host.shadowRoot.querySelector("a");
      const event = new MouseEvent("click", { bubbles: true, composed: true, cancelable: true });
      anchor.dispatchEvent(event);
      return { defaultPrevented: event.defaultPrevented, ariaDisabled: anchor.getAttribute("aria-disabled"), tabIndex: anchor.tabIndex };
    });
    assert.deepEqual(result, { defaultPrevented: true, ariaDisabled: "true", tabIndex: -1 }, selector);
    assert.equal(await link.getAttribute("selected"), null, `${selector}: disabled link is not selected`);
  }
  assert.equal(await page.evaluate(() => window.reactSelected ?? 0), 0, "disabled React link does not emit selection");
  assert.deepEqual(pageErrors, []);
  console.log(JSON.stringify({ browser: "Chromium headless", adapters: ["native", "React"], disabledHrefCancelled: true, pageErrors }));
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
