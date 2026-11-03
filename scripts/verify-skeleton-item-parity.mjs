import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(process.cwd());
const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{SharePointUIProvider,Skeleton,SkeletonItem,SkeletonContextProvider,useSkeletonContext}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";import{Skeleton as FluentSkeleton,SkeletonItem as FluentSkeletonItem,SkeletonContextProvider as FluentSkeletonContextProvider,useSkeletonContext as useFluentSkeletonContext}from"@fluentui/react-skeleton";function ContextProbe(){const value=useSkeletonContext();return <output data-testid="context-probe" data-animation={value.animation} data-appearance={value.appearance} data-size={value.size} data-shape={value.shape}/>};function FluentContextProbe(){const value=useFluentSkeletonContext();return <output data-testid="fluent-context-probe" data-animation={value.animation} data-appearance={value.appearance} data-size={value.size} data-shape={value.shape}/>};createRoot(document.querySelector("#root")).render(<SharePointUIProvider><Skeleton data-testid="composition" aria-label="Loading profile" animation="pulse" appearance="translucent"><SkeletonItem data-testid="avatar" shape="circle" size={40}/><SkeletonItem data-testid="line" size={20}/></Skeleton><Skeleton data-testid="plain" shape="circle" width="48px" height="48px" animated={false}/><Skeleton data-testid="numeric-size" shape="circle" width={48} height={48}/><Skeleton data-testid="override" animation="wave"><SkeletonItem data-testid="override-item" animation="none" shape="square" size={32}/></Skeleton><SkeletonContextProvider value={{animation:"pulse",appearance:"translucent",size:40,shape:"circle"}}><ContextProbe/><SkeletonItem data-testid="provider-item"/></SkeletonContextProvider><SkeletonContextProvider value={{animation:"pulse",size:24,shape:"square"}}><SkeletonItem data-testid="override-context-item" animation="none" size={32}/></SkeletonContextProvider><FluentSkeletonContextProvider value={{animation:"pulse",appearance:"translucent",size:40,shape:"circle"}}><FluentContextProbe/><FluentSkeletonItem data-testid="fluent-provider-item"/></FluentSkeletonContextProvider><FluentSkeleton animation="pulse" appearance="translucent" size={40} shape="circle"><FluentSkeletonItem data-testid="fluent-nested-item"/></FluentSkeleton></SharePointUIProvider>);`,
    resolveDir: root,
    sourcefile: "skeleton-item-parity.tsx",
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
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><div id='root'></div><script src='/bundle.js'></script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);

  const skeleton = page.getByTestId("composition");
  assert.equal(await page.getByRole("progressbar", { name: "Loading profile" }).count(), 1, "composed Skeleton exposes a labelled progressbar");
  const avatar = page.getByTestId("avatar");
  assert.equal(await avatar.getAttribute("data-shape"), "circle");
  assert.equal(await avatar.getAttribute("data-size"), "40");
  assert.equal(await avatar.getAttribute("data-animation"), "pulse", "animation inherits from Skeleton");
  assert.equal(await avatar.getAttribute("data-appearance"), "translucent", "appearance inherits from Skeleton");
  assert.equal(await avatar.evaluate(node => getComputedStyle(node).width), "40px");
  assert.equal(await page.getByTestId("line").evaluate(node => getComputedStyle(node).height), "20px");
  assert.equal(await skeleton.getAttribute("data-has-items"), "", "composition switches parent to slot mode");

  const plain = page.getByTestId("plain");
  assert.equal(await plain.getAttribute("role"), "progressbar", "standalone Skeleton preserves Fluent progress semantics");
  assert.equal(await plain.getAttribute("aria-busy"), "true", "standalone Skeleton exposes Fluent busy state");
  assert.equal(await plain.getAttribute("aria-hidden"), null, "Skeleton is not hidden from assistive technology");
  assert.equal(await plain.evaluate(node => getComputedStyle(node).width), "48px");
  const numericSize = page.getByTestId("numeric-size");
  assert.equal(await numericSize.evaluate(node => getComputedStyle(node).width), "48px", "Fluent-compatible numeric width is treated as pixels");
  assert.equal(await numericSize.evaluate(node => getComputedStyle(node).height), "48px", "Fluent-compatible numeric height is treated as pixels");
  assert.equal(await page.getByTestId("override-item").getAttribute("data-animation"), "none", "item-level motion overrides parent motion");
  assert.equal(await page.getByTestId("override-item").getAttribute("data-size"), "32");

  const contextProbe = page.getByTestId("context-probe");
  assert.deepEqual(await contextProbe.evaluate(node => ({ animation: node.dataset.animation, appearance: node.dataset.appearance, size: node.dataset.size, shape: node.dataset.shape })), { animation: "pulse", appearance: "translucent", size: "40", shape: "circle" }, "useSkeletonContext returns the values supplied by SkeletonContextProvider");
  const providerItem = page.getByTestId("provider-item");
  assert.equal(await providerItem.getAttribute("data-animation"), "pulse", "provider animation reaches an item outside Skeleton");
  assert.equal(await providerItem.getAttribute("data-appearance"), "translucent", "provider appearance reaches an item outside Skeleton");
  assert.equal(await providerItem.getAttribute("data-size"), "40", "provider size reaches an item outside Skeleton");
  assert.equal(await providerItem.getAttribute("data-shape"), "circle", "provider shape reaches an item outside Skeleton");
  assert.equal(await providerItem.evaluate(node => getComputedStyle(node).width), "40px");
  assert.equal(await providerItem.getAttribute("aria-hidden"), null, "SkeletonItem retains Fluent's generic div semantics");
  assert.equal(await page.getByTestId("fluent-provider-item").getAttribute("aria-hidden"), null, "pinned Fluent SkeletonItem is not hidden from assistive technology");
  assert.deepEqual(await page.getByTestId("context-probe").evaluate(node => ({ animation: node.dataset.animation, appearance: node.dataset.appearance, size: node.dataset.size, shape: node.dataset.shape })), await page.getByTestId("fluent-context-probe").evaluate(node => ({ animation: node.dataset.animation, appearance: node.dataset.appearance, size: node.dataset.size, shape: node.dataset.shape })), "local hook matches Fluent SkeletonContextProvider values");
  assert.equal(await page.getByTestId("fluent-provider-item").evaluate(node => getComputedStyle(node).width), await page.getByTestId("provider-item").evaluate(node => getComputedStyle(node).width), "provider-controlled item geometry matches Fluent");
  assert.equal(await page.getByTestId("fluent-nested-item").evaluate(node => getComputedStyle(node).width), await page.getByTestId("avatar").evaluate(node => getComputedStyle(node).width), "Skeleton props propagate size to nested items like Fluent");
  const overrideContextItem = page.getByTestId("override-context-item");
  assert.equal(await overrideContextItem.getAttribute("data-animation"), "none", "explicit item animation overrides provider");
  assert.equal(await overrideContextItem.getAttribute("data-size"), "32", "explicit item size overrides provider");
  assert.equal(await overrideContextItem.getAttribute("data-shape"), "square", "provider shape supplies the default for an item");

  await page.evaluate(() => {
    const parent = document.createElement("spui-skeleton"); parent.setAttribute("aria-label", "Native loading"); parent.setAttribute("animation", "wave"); parent.setAttribute("size", "24");
    const item = document.createElement("spui-skeleton-item"); item.setAttribute("shape", "square"); parent.append(item); document.body.append(parent);
  });
  const native = page.locator("spui-skeleton[aria-label='Native loading']");
  assert.equal(await native.getAttribute("role"), "progressbar", "framework-neutral composition gets progressbar semantics");
  assert.equal(await native.locator("spui-skeleton-item").getAttribute("data-size"), "24", "direct custom-element item inherits parent size");
  assert.deepEqual(errors, [], "no browser errors");
  await page.screenshot({ path: resolve(root, "test-results/skeleton-item-parity.png"), fullPage: true });
  console.log(JSON.stringify({ status: "passed", compositionAndProgressbarName: true, standaloneProgressSemantics: true, skeletonItemAccessibilitySemantics: true, inheritedAndOverriddenOptions: true, contextProviderAndHook: true, contextOverrides: true, fluentContextAndGeometryComparison: true, sizeAndShapeGeometry: true, directCustomElementComposition: true, noPageErrors: true, screenshot: "test-results/skeleton-item-parity.png" }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
