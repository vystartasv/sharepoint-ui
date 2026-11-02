import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const root = resolve(process.cwd());
const bundle = await build({
  stdin: {
    sourcefile: "default-theme-inheritance.tsx",
    loader: "tsx",
    resolveDir: root,
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{SharePointUIProvider,Button}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";createRoot(document.querySelector("#root")).render(<><section style={{"--spui-semantic-primary-button-background":"rgb(22, 119, 204)","--spui-semantic-primary-button-text":"#fff"}}><SharePointUIProvider><Button data-testid="inherited" appearance="primary">Inherited theme</Button></SharePointUIProvider></section><SharePointUIProvider theme={{colors:{accent:"rgb(190, 30, 80)"}}}><Button data-testid="custom" appearance="primary">Custom theme</Button><Button data-testid="custom-override" appearance="primary" style={{"--spui-primary-background":"rgb(10, 20, 30)"}}>Caller override</Button></SharePointUIProvider><SharePointUIProvider appearance="ios"><Button data-testid="ios" appearance="primary">iOS theme</Button></SharePointUIProvider></>);`,
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
  alias: { react: resolve(root, "examples/spfx124-webpart/node_modules/react"), "react-dom/client": resolve(root, "examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve(root, "examples/spfx124-webpart/node_modules")],
});

const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><div id=root></div><script src=/bundle.js></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector('[data-testid="inherited"]')?.shadowRoot?.querySelector("button"));
  const inherited = await page.getByTestId("inherited").evaluate(host => ({
    inlineAccent: host.style.getPropertyValue("--spui-ui-accent"),
    background: getComputedStyle(host.shadowRoot.querySelector("button")).backgroundColor,
  }));
  assert.equal(inherited.inlineAccent, "", "default Fluent rendering leaves theme variables to inherited SharePoint CSS tokens");
  assert.equal(inherited.background, "rgb(22, 119, 204)", "default Fluent rendering resolves the inherited SharePoint brand token");
  const customAccent = await page.getByTestId("custom").evaluate(host => ({
    inlineAccent: host.style.getPropertyValue("--spui-ui-accent"),
    providerRoot: host.closest("[data-spui-provider]") !== null,
    providerAccent: host.closest("[data-spui-provider]").style.getPropertyValue("--spui-ui-accent"),
    computedAccent: getComputedStyle(host).getPropertyValue("--spui-ui-accent").trim(),
    background: getComputedStyle(host.shadowRoot.querySelector("button")).backgroundColor,
  }));
  assert.equal(customAccent.inlineAccent, "", "provider tokens do not create a per-component inline style map");
  assert.equal(customAccent.providerRoot, true, "provider exposes one inherited theme root");
  assert.notEqual(customAccent.providerAccent, "", "provider root owns the theme token values");
  assert.equal(customAccent.computedAccent, "rgb(190, 30, 80)", "explicit design tokens resolve on the component host");
  assert.equal(customAccent.background, "rgb(190, 30, 80)", "explicit design tokens still style the control");
  const override = await page.getByTestId("custom-override").evaluate(host => ({
    inline: host.style.getPropertyValue("--spui-primary-background"),
    background: getComputedStyle(host.shadowRoot.querySelector("button")).backgroundColor,
  }));
  assert.equal(override.inline, "rgb(10, 20, 30)", "caller inline styles remain the last theme override");
  assert.equal(override.background, "rgb(10, 20, 30)", "caller inline token overrides still reach shadow content");
  const iosRadius = await page.getByTestId("ios").evaluate(host => getComputedStyle(host).getPropertyValue("--spui-control-radius").trim());
  assert.equal(iosRadius, "11px", "non-default appearance tokens inherit from the provider root");
  assert.deepEqual(errors, [], "no page errors");
  console.log(JSON.stringify({ status: "passed", inheritedSharePointTokens: true, explicitDesignTokens: true, nonDefaultAppearanceTokens: true, pageErrors: 0 }, null, 2));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
