import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "/Users/vilius/.t3/projects/spfx-research/node_modules/playwright/index.mjs";

const bundle = await build({
  stdin: {
    sourcefile: "tree-localization.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `
      import * as React from "react";
      import { createRoot } from "react-dom/client";
      import { SharePointUIProvider, Tree } from "${resolve("packages/sharepoint-ui/src/react.tsx")}";
      import { defineTree } from "${resolve("packages/sharepoint-ui/src/elements/tree.ts")}";
      defineTree();
      const items = [{ id: "parent", label: "Projects", children: [{ id: "child", label: "Current" }] }];
      function App() {
        return <>
          <SharePointUIProvider lang="lt" strings={{ treeLabel: "Failai", treeToggleLabel: "Perjungti", treeEmptyMessage: "Įrašų nėra" }}>
            <Tree data-testid="localized" items={items} />
            <Tree data-testid="localized-empty" items={[]} />
            <Tree data-testid="override" label="Custom tree" toggleLabel="Open branch" emptyMessage="Custom empty" items={[]} />
            <Tree data-testid="empty-suppressed" emptyMessage={null} items={[]} />
          </SharePointUIProvider>
        </>;
      }
      createRoot(document.querySelector("#root")).render(<App />);
      const native = document.createElement("spui-tree");
      native.items = items;
      native.setAttribute("label", "Native files");
      native.setAttribute("toggle-label", "Open folder");
      native.setAttribute("empty-label", "Nothing here");
      document.body.append(native);
      const nativeEmpty = document.createElement("spui-tree");
      nativeEmpty.setAttribute("empty-label", "No native entries");
      document.body.append(nativeEmpty);
    `,
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});

const server = createServer((request, response) => new URL(request.url, "http://localhost").pathname === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><main id='root'></main><script src='/bundle.js'></script>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);

  const localized = page.getByTestId("localized");
  assert.equal(await localized.getByRole("tree").getAttribute("aria-label"), "Failai");
  await page.getByRole("button", { name: "Perjungti Projects" }).waitFor();
  assert.equal(await page.getByTestId("localized-empty").locator(".spui-tree-empty").textContent(), "Įrašų nėra");
  assert.equal(await page.getByTestId("override").getByRole("tree").getAttribute("aria-label"), "Custom tree", "explicit component labels override provider strings");
  assert.equal(await page.getByTestId("override").locator(".spui-tree-empty").textContent(), "Custom empty");
  assert.equal(await page.getByTestId("empty-suppressed").locator(".spui-tree-empty").textContent(), "", "explicit null keeps the prior empty-message suppression behavior");
  assert.equal(await page.locator("spui-tree").first().getAttribute("label"), "Native files");
  assert.equal(await page.locator("spui-tree").first().locator("[data-tree-key=parent] button").getAttribute("aria-label"), "Open folder Projects");
  assert.equal(await page.locator("spui-tree").last().locator(".empty").textContent(), "No native entries");
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", providerTreeLabels: true, providerEmptyMessage: true, componentOverrides: true, nativeElementLabels: true, pageErrors: errors }));
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
