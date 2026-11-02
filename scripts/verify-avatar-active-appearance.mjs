import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "avatar-active-appearance.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Avatar,AvatarGroup,AvatarGroupItem,AvatarGroupProvider,SharePointUIProvider}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";import{defineAvatar}from"${resolve("packages/sharepoint-ui/src/elements/avatar.ts")}";createRoot(document.querySelector("#react")).render(<><Avatar data-testid="default" className="parity-avatar" title="Avatar host props" name="A" active="active"/><Avatar data-testid="ring" name="B" active="active" activeAppearance="ring"/><Avatar data-testid="shadow" name="C" active="active" activeAppearance="shadow"/><Avatar data-testid="ring-shadow" name="D" active="active" activeAppearance="ring-shadow"/><SharePointUIProvider theme={{elevation:{cardShadow:"0px 0px 0px 4px rgb(10, 20, 30)"}}}><Avatar data-testid="theme-shadow" name="Theme" active="active" activeAppearance="shadow"/></SharePointUIProvider><AvatarGroupProvider value={{size:48,layout:"spread"}}><AvatarGroup data-testid="provider-group" label="Team"><AvatarGroupItem name="Vilius"/></AvatarGroup></AvatarGroupProvider><AvatarGroup data-testid="explicit-group" size={24} layout="stack" label="Small team"><AvatarGroupItem name="Mira"/></AvatarGroup></>);defineAvatar();const native=document.createElement("spui-avatar");native.id="native";native.setAttribute("name","Native");native.setAttribute("active","active");native.setAttribute("active-appearance","shadow");document.body.append(native);`,
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});

const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><meta charset=utf-8><div id=react></div><script src=/bundle.js></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector("[data-testid=ring-shadow]")?.shadowRoot?.querySelector(".surface"));
  assert.equal(await page.getByTestId("default").getAttribute("class"), "parity-avatar", "React Avatar forwards className to its custom-element host");
  assert.equal(await page.getByTestId("default").getAttribute("title"), "Avatar host props", "React Avatar forwards inherited native title props");
  const shadows = {};
  for (const appearance of ["default", "ring", "shadow", "ring-shadow"]) {
    shadows[appearance] = await page.getByTestId(appearance).evaluate(host => getComputedStyle(host.shadowRoot.querySelector(".surface")).boxShadow);
  }
  assert.equal(shadows.default, shadows.ring, "ring remains the Fluent default active appearance");
  assert.notEqual(shadows.shadow, shadows.ring, "shadow appearance removes the accent ring");
  assert.notEqual(shadows.ringShadow, shadows.ring, "ring-shadow adds a distinct shadow");
  const themedShadow = await page.getByTestId("theme-shadow").evaluate(host => getComputedStyle(host.shadowRoot.querySelector(".surface")).boxShadow);
  assert.match(themedShadow, /10, 20, 30/);
  assert.match(themedShadow, /4px/);
  const native = await page.locator("#native").evaluate(host => getComputedStyle(host.shadowRoot.querySelector(".surface")).boxShadow);
  assert.equal(native, shadows.shadow, "direct custom-element attributes render the shadow appearance");
  const providerGroup = await page.getByTestId("provider-group").evaluate(host => ({ size: host.getAttribute("size"), layout: host.getAttribute("layout"), itemSize: host.querySelector("spui-avatar-group-item")?.getAttribute("size") }));
  const explicitGroup = await page.getByTestId("explicit-group").evaluate(host => ({ size: host.getAttribute("size"), layout: host.getAttribute("layout") }));
  assert.deepEqual(providerGroup, { size: "48", layout: "spread", itemSize: "48" }, "AvatarGroupProvider shares group defaults with the group and descendant items");
  assert.deepEqual(explicitGroup, { size: "24", layout: "stack" }, "direct group props override provider values");
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify({ status: "passed", appearances: shadows, customElement: true, providerGroup, explicitGroup, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
