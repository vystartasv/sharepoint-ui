import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
import { contrastRatio } from "./lib/color-contrast.mjs";

const root = resolve(process.cwd());
const bundle = await build({
  stdin: {
    sourcefile: "breadcrumb-theme-hover.tsx",
    loader: "tsx",
    resolveDir: root,
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{SharePointUIProvider,Breadcrumb,BreadcrumbItem,BreadcrumbButton}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";const dirs=["ltr","rtl"];createRoot(document.querySelector("#root")).render(<>{dirs.map(dir=><section key={dir} dir={dir} data-testid={dir} style={{background:"#092b4f",color:"#fff"}}><SharePointUIProvider dir={dir} theme={{colors:{foreground:"#fff",canvas:"#092b4f",surface:"#092b4f"}}}><Breadcrumb label="Path"><BreadcrumbItem><BreadcrumbButton data-testid={"crumb-"+dir} href="#">Current section</BreadcrumbButton></BreadcrumbItem></Breadcrumb></SharePointUIProvider></section>)}</>);`,
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
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><main id='root'></main><script src='/bundle.js'></script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  for (const dir of ["ltr", "rtl"]) {
    const link = page.getByTestId(`crumb-${dir}`).locator("a");
    await link.hover();
    const colors = await link.evaluate(node => ({ foreground: getComputedStyle(node).color, background: getComputedStyle(node).backgroundColor }));
    const section = await page.getByTestId(dir).evaluate(node => getComputedStyle(node).backgroundColor);
    const contrast = contrastRatio(colors.foreground, colors.background, section);
    assert.ok(contrast >= 4.5, `${dir} breadcrumb hover contrast ${contrast.toFixed(2)}:1 (${colors.foreground} on ${colors.background}, section ${section})`);
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", directions: ["ltr", "rtl"], minimumTextContrast: ">=4.5:1", pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
