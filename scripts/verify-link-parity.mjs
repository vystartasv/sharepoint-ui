import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "link-parity.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Link}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineLink}from"${resolve("packages/sharepoint-ui/src/elements/link.ts")}";window.clicks=0;window.linkEvents=[];window.linkCaptures=[];createRoot(document.querySelector("#react")).render(<><Link data-testid="disabled" href="#disabled" disabled disabledFocusable onClick={()=>window.clicks++}>Disabled link</Link><Link data-testid="native-attrs" href="#native-attrs" hrefLang="ar" media="screen" ping="/ping" type="text/html" onClick={event=>{window.linkEvents.push({target:event.target.tagName,currentTarget:event.currentTarget.tagName,href:event.currentTarget.href,nativeEventType:event.nativeEvent.type});event.preventDefault()}} onClickCapture={event=>window.linkCaptures.push({currentTarget:event.currentTarget.tagName,nativeEventType:event.nativeEvent.type})}>Native attributes</Link><Link data-testid="inline" href="#inline" inline>Inline link</Link><Link data-testid="unsafe" href="javascript:alert(1)" disabledFocusable onClick={()=>window.clicks++}>Unsafe link</Link><Link data-testid="action" onClick={event=>{window.clicks++;window.linkEvents.push({target:event.target.tagName,currentTarget:event.currentTarget.tagName,nativeEventType:event.nativeEvent.type});event.preventDefault()}} onClickCapture={event=>window.linkCaptures.push({currentTarget:event.currentTarget.tagName,nativeEventType:event.nativeEvent.type})}>Action</Link><Link data-testid="span" as="span" onClick={event=>{window.clicks++;window.linkEvents.push({target:event.target.tagName,currentTarget:event.currentTarget.tagName,nativeEventType:event.nativeEvent.type})}}>Span action</Link><Link data-testid="button-disabled" as="button" disabled disabledFocusable onClick={()=>window.clicks++}>Disabled action</Link></>);window.mountNative=()=>{defineLink();const link=document.createElement("spui-link");link.id="native-disabled";link.setAttribute("href","#native");link.setAttribute("disabled","");link.setAttribute("disabled-focusable","");link.textContent="Native disabled";document.querySelector("#native").append(link);};window.mountNative();`,
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
  return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><meta charset=utf-8><div id=react></div><div id=native></div><script src=/bundle.js></script>");
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const disabled = page.locator('[data-testid="disabled"]');
  const disabledAnchor = disabled.locator("a");
  assert.equal(await disabledAnchor.getAttribute("href"), null);
  assert.equal(await disabledAnchor.getAttribute("aria-disabled"), "true");
  assert.equal(await disabledAnchor.evaluate(node => node.tabIndex), 0, "disabledFocusable leaves disabled link in the Tab sequence");
  const disabledColor = await disabledAnchor.evaluate(node => getComputedStyle(node).color);
  await page.emulateMedia({ forcedColors: "active" });
  assert.notEqual(await disabledAnchor.evaluate(node => getComputedStyle(node).color), disabledColor, "disabled links switch to the system high-contrast color");
  await page.emulateMedia({ forcedColors: "none" });
  await disabledAnchor.focus();
  await page.keyboard.press("Enter");
  await disabledAnchor.evaluate(node => node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, composed: true })));
  assert.equal(await page.evaluate(() => window.clicks), 0, "disabled links suppress activation and React click callbacks");
  const inline = page.locator('[data-testid="inline"]');
  const nativeAttrs = page.locator('[data-testid="native-attrs"] a');
  assert.equal(await nativeAttrs.getAttribute("hreflang"), "ar", "React hrefLang is forwarded with idiomatic casing");
  assert.equal(await nativeAttrs.getAttribute("media"), "screen", "React media prop reaches the anchor");
  assert.equal(await nativeAttrs.getAttribute("ping"), "/ping", "React ping prop reaches the anchor");
  assert.equal(await nativeAttrs.getAttribute("type"), "text/html", "React type prop reaches the anchor");
  await nativeAttrs.click();
  assert.deepEqual((await page.evaluate(() => window.linkEvents))[0], { target: "A", currentTarget: "A", href: `http://127.0.0.1:${server.address().port}/#native-attrs`, nativeEventType: "click" }, "Link anchor callbacks receive the native anchor as currentTarget");
  assert.deepEqual((await page.evaluate(() => window.linkCaptures))[0], { currentTarget: "A", nativeEventType: "click" }, "Link onClickCapture receives the native anchor");
  assert.notEqual(await inline.getAttribute("inline"), null);
  assert.equal(await inline.locator("a").evaluate(node => getComputedStyle(node).textDecorationLine), "underline", "inline links stay visibly underlined within text");
  const action = page.locator('[data-testid="action"] button');
  assert.equal(await action.getAttribute("type"), "button", "links without href use a non-submitting button");
  await action.click();
  assert.equal(await page.evaluate(() => window.clicks), 1, "action links forward click callbacks");
  assert.deepEqual((await page.evaluate(() => window.linkEvents))[1], { target: "BUTTON", currentTarget: "BUTTON", nativeEventType: "click" }, "action Link callbacks receive the native button");
  assert.deepEqual((await page.evaluate(() => window.linkCaptures))[1], { currentTarget: "BUTTON", nativeEventType: "click" }, "action Link capture callbacks receive the native button");
  const span = page.locator('[data-testid="span"] span');
  assert.equal(await span.getAttribute("role"), "button");
  await span.focus(); await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => window.clicks), 2, "span overrides support keyboard activation");
  assert.deepEqual((await page.evaluate(() => window.linkEvents))[2], { target: "SPAN", currentTarget: "SPAN", nativeEventType: "click" }, "span Link callbacks receive the native span");
  const disabledButton = page.locator('[data-testid="button-disabled"] button');
  assert.equal(await disabledButton.evaluate(node => node.tabIndex), 0, "disabled-focusable button actions remain reachable");
  assert.equal(await disabledButton.evaluate(node => node.disabled), false, "disabled-focusable button actions retain native focusability");
  await disabledButton.evaluate(node => node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, composed: true })));
  assert.equal(await page.evaluate(() => window.clicks), 2, "disabled-focusable button actions suppress callbacks");
  const unsafe = page.locator('[data-testid="unsafe"] a');
  assert.equal(await unsafe.getAttribute("href"), null, "unsafe protocols never reach the rendered anchor");
  assert.equal(await unsafe.evaluate(node => node.tabIndex), -1, "disabledFocusable does not restore focus to an unsafe URL");
  const native = page.locator("#native-disabled a");
  assert.equal(await native.evaluate(node => node.tabIndex), 0, "custom elements support disabled-focusable links");
  assert.equal(await native.evaluate(node => !node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, composed: true }))), true, "native disabledFocusable links cancel activation");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", disabledFocusableTabStop: true, disabledActivationSuppressed: true, inlineDecoration: true, actionButton: true, spanKeyboardActivation: true, unsafeSchemeBlocked: true, directCustomElement: true, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
