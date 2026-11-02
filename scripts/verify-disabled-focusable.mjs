import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "disabled-focusable.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Checkbox,Switch}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineCheckbox,defineSwitch}from"${resolve("packages/sharepoint-ui/src/elements/toggle.ts")}";createRoot(document.querySelector("#react")).render(<><form id="form"><Checkbox data-testid="checkbox" label="Disabled checkbox" checked disabled disabledFocusable name="check" value="yes" onChange={()=>window.checkboxChange=true}/><Switch data-testid="switch" disabled disabledFocusable defaultChecked name="switch" value="yes" onChange={()=>window.switchChange=true}>Disabled switch</Switch><Checkbox data-testid="disabled" label="Not focusable" disabled name="disabled" value="yes"/></form></>);window.mountNative=()=>{defineCheckbox();defineSwitch();const c=document.createElement("spui-checkbox");c.dataset.testid="native";c.setAttribute("checked","");c.setAttribute("disabled","");c.setAttribute("disabled-focusable","");c.setAttribute("name","native");c.textContent="Native disabled checkbox";document.querySelector("#native-root").append(c)};window.mountNative();`,
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
  return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><meta charset=utf-8><main id=react></main><main id=native-root></main><script src=/bundle.js></script>");
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);

  for (const id of ["checkbox", "switch", "native"]) {
    const host = page.getByTestId(id);
    const input = host.locator("input");
    assert.ok(await host.getAttribute("disabled-focusable") !== null, `${id} forwards the option`);
    assert.equal(await input.evaluate(node => node.disabled), false, `${id} stays focusable`);
    assert.equal(await input.getAttribute("aria-disabled"), "true", `${id} exposes the disabled state`);
    await input.focus();
    assert.equal(await input.evaluate(node => node.getRootNode().activeElement === node), true, `${id} can receive keyboard focus`);
    await page.keyboard.press("Space");
    assert.equal(await host.evaluate(node => node.checked), true, `${id} ignores keyboard activation`);
  }

  assert.equal(await page.evaluate(() => window.checkboxChange ?? window.switchChange), undefined, "disabled React callbacks do not fire");
  const checkboxBox = await page.getByTestId("checkbox").locator("input").boundingBox();
  await page.mouse.click(checkboxBox.x + checkboxBox.width / 2, checkboxBox.y + checkboxBox.height / 2);
  assert.equal(await page.getByTestId("checkbox").evaluate(node => node.checked), true, "disabled pointer activation is suppressed");
  assert.equal(await page.getByTestId("disabled").locator("input").evaluate(node => node.disabled), true, "ordinary disabled remains non-focusable");
  assert.deepEqual(await page.locator("#form").evaluate(form => [...new FormData(form).entries()]), [], "disabled focusable controls do not submit");

  await page.getByTestId("native").evaluate(node => node.removeAttribute("disabled"));
  assert.equal(await page.getByTestId("native").locator("input").getAttribute("aria-disabled"), null, "attribute changes restore enabled semantics");
  assert.equal(await page.getByTestId("native").locator("input").evaluate(node => node.disabled), false);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", reactAndCustomElement: true, checkboxAndSwitch: true, keyboardReachable: true, activationSuppressed: true, disabledStateExposed: true, formSubmissionSuppressed: true, attributeUpdates: true, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
