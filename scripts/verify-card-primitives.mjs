import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = process.cwd();
const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{CardFooter,CardHeader,CardPreview}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";import{defineCardFooter,defineCardHeader,defineCardPreview}from"${resolve(root, "packages/sharepoint-ui/src/elements/card-primitives.ts")}";window.mountNative=()=>{defineCardFooter();defineCardHeader();defineCardPreview();const root=document.querySelector("#native");const footer=document.createElement("spui-card-footer");footer.dataset.testid="native-footer";footer.innerHTML='<button>Cancel</button><button slot="action">Save</button>';root.append(footer);const preview=document.createElement("spui-card-preview");preview.dataset.testid="native-preview";const image=document.createElement("img");image.slot="";image.src="/preview.png";image.alt="Native preview";const logo=document.createElement("span");logo.slot="logo";logo.textContent="Native brand";preview.append(image,logo);root.append(preview)};function App(){return <><CardHeader data-testid="header" image={<img alt="" src="/avatar.png"/>} header="Quarterly plan" description="Updated today" action={<button type="button">Open</button>}/><CardFooter data-testid="footer" action={<button type="button">Save</button>}><button type="button">Cancel</button><button type="button">More</button></CardFooter><CardPreview data-testid="preview" logo={<img alt="Brand mark" src="/logo.svg"/>}><img src="/roadmap.png" alt="Roadmap preview"/></CardPreview><section dir="rtl"><CardFooter data-testid="rtl-footer" action={<button type="button">حفظ</button>}><button type="button">إلغاء</button></CardFooter><CardPreview data-testid="rtl-preview" logo={<span>علامة</span>}><img src="/rtl-preview.png" alt="معاينة"/></CardPreview></section></>}createRoot(document.querySelector("#react")).render(<App/>);window.mountNative();`,
    resolveDir: root,
    sourcefile: "card-primitives.tsx",
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
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);

  const header = page.getByTestId("header");
  assert.equal(await header.locator('[slot="image"]').count(), 1);
  assert.equal(await header.locator('[slot="header"]').textContent(), "Quarterly plan");
  assert.equal(await header.locator('[slot="description"]').textContent(), "Updated today");
  assert.equal(await header.getByRole("button", { name: "Open" }).count(), 1);
  assert.equal(await header.evaluate(host => ["image", "header", "description", "action"].every(name => host.shadowRoot.querySelector(`slot[name=${name}]`).assignedElements().length === 1)), true, "CardHeader projects all named slots");

  const footer = page.getByTestId("footer");
  assert.equal(await footer.getByRole("button", { name: "Cancel" }).count(), 1);
  assert.equal(await footer.getByRole("button", { name: "More" }).count(), 1);
  assert.equal(await footer.getByRole("button", { name: "Save" }).count(), 1);
  assert.equal(await footer.evaluate(host => host.shadowRoot.querySelector("slot:not([name])").assignedElements().length), 2, "CardFooter keeps regular actions in its wrapping default slot");
  assert.equal(await footer.evaluate(host => host.shadowRoot.querySelector('slot[name="action"]').assignedElements().length), 1, "CardFooter aligns its optional action in the action slot");
  assert.equal(await footer.evaluate(host => getComputedStyle(host.shadowRoot.querySelector('slot[name="action"]')).marginInlineStart), "auto");

  const preview = page.getByTestId("preview");
  assert.equal(await preview.locator("img[alt='Roadmap preview']").count(), 1);
  assert.equal(await preview.getByRole("img", { name: "Brand mark" }).count(), 1);
  assert.equal(await preview.evaluate(host => host.shadowRoot.querySelector("slot:not([name])").assignedElements().length), 1);
  assert.equal(await preview.evaluate(host => host.shadowRoot.querySelector('slot[name="logo"]').assignedElements().length), 1, "CardPreview places its logo in an overlay slot");
  assert.equal(await preview.locator("img[alt='Roadmap preview']").evaluate(image => Math.round(image.getBoundingClientRect().width)), await preview.evaluate(host => Math.round(host.getBoundingClientRect().width)), "preview media fills the edge-to-edge preview surface");

  const rtlFooter = page.getByTestId("rtl-footer");
  assert.equal(await rtlFooter.evaluate(host => getComputedStyle(host).direction), "rtl");
  assert.equal(await rtlFooter.evaluate(host => getComputedStyle(host.shadowRoot.querySelector('slot[name="action"]')).marginInlineStart), "auto", "action alignment follows logical direction in RTL");
  const rtlPreview = page.getByTestId("rtl-preview");
  assert.equal(await rtlPreview.evaluate(host => getComputedStyle(host).direction), "rtl");
  assert.equal(await rtlPreview.evaluate(host => getComputedStyle(host.shadowRoot.querySelector('slot[name="logo"]')).insetInlineStart), "10px", "logo placement uses a logical inset in RTL");

  const nativeFooter = page.getByTestId("native-footer");
  assert.equal(await nativeFooter.getByRole("button", { name: "Cancel" }).count(), 1);
  assert.equal(await nativeFooter.getByRole("button", { name: "Save" }).count(), 1);
  const nativePreview = page.getByTestId("native-preview");
  assert.equal(await nativePreview.getByRole("img", { name: "Native preview" }).count(), 1);
  assert.equal(await nativePreview.locator('[slot="logo"]').textContent(), "Native brand");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", reactAndNative: true, headerSlots: true, footerWrappingAndAction: true, previewMediaAndLogo: true, rtlLogicalPlacement: true, pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
