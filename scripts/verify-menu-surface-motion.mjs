import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = process.cwd();
const bundle = await build({
  stdin: {
    sourcefile: "menu-surface-motion.tsx",
    loader: "tsx",
    resolveDir: root,
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Menu,MenuItem,MenuTrigger}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";function Motion({visible,children}){const ref=React.useRef(null);React.useLayoutEffect(()=>{const animation=ref.current?.animate([{opacity:visible?0:1},{opacity:visible?1:0}],{duration:800,easing:"linear",fill:"both"});return()=>animation?.cancel()},[visible]);return <div ref={ref} data-testid="menu-motion" data-visible={String(visible)}>{children}</div>}createRoot(document.querySelector("#root")).render(<Menu data-testid="menu" label="Animated commands" defaultOpen surfaceMotion={Motion}><MenuTrigger><button>Commands</button></MenuTrigger><MenuItem>Open document</MenuItem></Menu>);`,
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
  const menu = page.getByTestId("menu");
  await menu.getByRole("button", { name: "Commands" }).focus();
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.querySelector('[data-testid="menu-motion"]')?.getAttribute("data-visible") === "false");
  assert.equal(await menu.evaluate(host => host.shadowRoot.querySelector(".surface").matches(":popover-open")), true, "menu remains in the top layer during exit motion");
  assert.equal(await menu.evaluate(host => host.shadowRoot.querySelector(".surface").inert), true, "exiting menu is inert");
  await page.waitForFunction(() => !document.querySelector('[data-testid="menu"]')?.shadowRoot?.querySelector(".surface")?.matches(":popover-open"));
  assert.equal(await menu.evaluate(host => host.shadowRoot.querySelector(".surface").hidden), true);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", topLayerExit: true, inertDuringExit: true, noPageErrors: true }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
