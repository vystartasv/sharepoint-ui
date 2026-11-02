import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = process.cwd();
const bundle = await build({
  stdin: {
    sourcefile: "accordion-collapse-motion.tsx",
    loader: "tsx",
    resolveDir: root,
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Accordion,AccordionHeader,AccordionItem,AccordionPanel}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";function Motion({visible,children}){const ref=React.useRef(null);React.useLayoutEffect(()=>{const animation=ref.current?.animate([{opacity:visible?0:1,transform:visible?"translateY(-8px)":"translateY(0)"},{opacity:visible?1:0,transform:visible?"translateY(0)":"translateY(-8px)"}],{duration:800,easing:"linear",fill:"both"});return()=>animation?.cancel()},[visible]);return <div ref={ref} data-testid="collapse-motion" data-visible={String(visible)}>{children}</div>}createRoot(document.querySelector("#root")).render(<Accordion collapsible><AccordionItem value="details" defaultOpen><AccordionHeader>Details</AccordionHeader><AccordionPanel data-testid="panel" collapseMotion={Motion}><p>Animated details</p></AccordionPanel></AccordionItem></Accordion>);`,
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
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><div id='root'></div><script src='/bundle.js'></script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const item = page.locator("spui-accordion-item");
  const region = item.locator("[role=region]");
  assert.equal(await page.getByTestId("collapse-motion").getAttribute("data-visible"), "true");
  await item.getByRole("button", { name: "Details" }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="collapse-motion"]')?.getAttribute("data-visible") === "false");
  assert.equal(await region.evaluate(node => node.hidden), false, "panel remains rendered during exit");
  assert.equal(await region.evaluate(node => node.inert), true, "exiting panel is inert");
  assert.equal(await region.getAttribute("aria-hidden"), "true", "exiting panel is hidden from assistive technology");
  await page.waitForFunction(() => document.querySelector('[data-testid="panel"]')?.closest("spui-accordion-item")?.shadowRoot?.querySelector("[role=region]")?.hidden === true);
  await item.getByRole("button", { name: "Details" }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="collapse-motion"]')?.getAttribute("data-visible") === "true");
  assert.equal(await region.evaluate(node => node.hidden), false, "opening restores the panel");
  assert.equal(await region.evaluate(node => node.inert), false, "opening restores panel interaction");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", exitPresence: true, inertAndAriaHiddenDuringExit: true, reopenCancelsExit: true, noPageErrors: true }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
