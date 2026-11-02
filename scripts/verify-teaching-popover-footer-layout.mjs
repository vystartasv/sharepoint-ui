import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    sourcefile: "teaching-popover-footer-layout.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{TeachingPopoverFooter}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";createRoot(document.querySelector("#root")).render(<><TeachingPopoverFooter data-testid="default"><button>Back</button><button>Continue</button></TeachingPopoverFooter><TeachingPopoverFooter data-testid="vertical" footerLayout="vertical"><button>Back</button><button>Continue</button></TeachingPopoverFooter></>);`,
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
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><meta charset=utf-8><div id=root></div><script src=/bundle.js></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await (await import("playwright")).chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  assert.equal(await page.getByTestId("default").getAttribute("data-footer-layout"), "horizontal");
  assert.equal(await page.getByTestId("default").evaluate(node => getComputedStyle(node).flexDirection), "row");
  assert.equal(await page.getByTestId("default").evaluate(node => getComputedStyle(node).justifyContent), "flex-end");
  assert.equal(await page.getByTestId("vertical").evaluate(node => getComputedStyle(node).flexDirection), "column");
  assert.equal(await page.getByTestId("vertical").evaluate(node => getComputedStyle(node).justifyContent), "normal");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", defaultHorizontal: true, explicitVertical: true, noPageErrors: true }));
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
