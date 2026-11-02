import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(process.cwd());
const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{SharePointUIProvider,Button,MessageBar,MessageBarActions,MessageBarBody,MessageBarGroup,MessageBarTitle}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";createRoot(document.querySelector("#root")).render(<SharePointUIProvider><MessageBarGroup data-testid="group" animate="both"><MessageBar data-testid="bar" intent="warning" shape="square" politeness="polite" layout="singleline" aria-label="Storage warning" icon={<b data-testid="custom-message-icon">!</b>} style={{"--spui-warning-surface":"rgb(220, 230, 240)"}}><MessageBarTitle data-testid="title">Storage almost full</MessageBarTitle><MessageBarBody data-testid="body">Remove files to make room.</MessageBarBody><MessageBarActions data-testid="actions" containerAction={<Button data-testid="dismiss">Dismiss</Button>}><Button>Review files</Button></MessageBarActions></MessageBar><MessageBar data-testid="success-bar" intent="success">Saved</MessageBar></MessageBarGroup><MessageBar data-testid="assertive" intent="info" politeness="assertive">Urgent information</MessageBar><MessageBar data-testid="rtl-bar" dir="rtl" layout="multiline"><MessageBarActions data-testid="rtl-actions" containerAction={<Button data-testid="rtl-dismiss">إغلاق</Button>}><Button>متابعة</Button></MessageBarActions></MessageBar><MessageBar data-testid="custom-spacer" intent="warning" layout="multiline" bottomReflowSpacer={<div data-testid="custom-spacer-content">Reflow</div>}>Warning layout</MessageBar></SharePointUIProvider>);`,
    resolveDir: root,
    sourcefile: "message-bar-composition.tsx",
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
  const page = await browser.newPage({ viewport: { width: 900, height: 540 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);

  const group = page.getByTestId("group");
  assert.equal(await group.getAttribute("role"), "group", "MessageBarGroup exposes group semantics");
  assert.equal(await group.getAttribute("data-animate"), "both");
  assert.equal(await group.locator("spui-message-bar").count(), 2);
  const bar = page.getByTestId("bar");
  assert.equal(await bar.getAttribute("role"), "status", "explicit polite announcement takes precedence over intent default");
  assert.equal(await bar.getAttribute("shape"), "square");
  assert.equal(await bar.evaluate(node => getComputedStyle(node).borderRadius), "0px");
  assert.equal(await bar.evaluate(node => getComputedStyle(node).backgroundColor), "rgb(220, 230, 240)", "SharePoint theme variables reach the message surface");
  assert.equal(await bar.evaluate(node => node.shadowRoot.querySelector("slot[name=icon]").assignedElements().length), 1, "React icon replacement is assigned to the named slot");
  assert.equal(await page.getByTestId("custom-message-icon").getAttribute("aria-hidden"), "true", "the decorative icon stays hidden from assistive technology");
  assert.equal(await bar.evaluate(node => node.shadowRoot.querySelector(".icon").hidden), true, "custom icon replaces the intent fallback");
  const successBar = page.getByTestId("success-bar");
  assert.equal(await successBar.locator(".icon").getAttribute("data-intent"), "success");
  assert.equal(await successBar.locator(".icon svg path").count(), 2, "success intent renders its own icon shape");
  assert.equal(await page.getByTestId("assertive").locator(".icon svg path").count(), 3, "info intent renders its own icon shape");
  assert.equal(await page.getByTestId("custom-spacer").locator(".icon").getAttribute("data-intent"), "warning");
  assert.equal(await page.getByTestId("custom-spacer").locator(".icon svg path").count(), 3, "warning intent renders its own icon shape");
  assert.equal(await page.getByTestId("custom-spacer").evaluate(node => node.shadowRoot.querySelector('slot[name="bottom-reflow-spacer"]').assignedElements().length), 1, "React spacer replacement is assigned to its named slot");
  assert.equal(await page.getByTestId("rtl-bar").evaluate(node => getComputedStyle(node.shadowRoot.querySelector(".reflow-spacer")).display), "block", "multiline layout provides its default reflow spacer");
  assert.equal(await page.getByTestId("title").innerText(), "Storage almost full");
  assert.equal(await page.getByTestId("body").innerText(), "Remove files to make room.");
  assert.equal(await page.getByRole("button", { name: "Review files" }).count(), 1);
  assert.equal(await page.getByRole("button", { name: "Dismiss" }).count(), 1, "container action occupies its named slot");
  assert.equal(await page.getByTestId("assertive").getAttribute("role"), "alert", "assertive politeness maps to alert semantics");
  assert.equal(await page.getByTestId("rtl-bar").evaluate(node => getComputedStyle(node).direction), "rtl", "RTL direction reaches the host");
  assert.equal(await page.getByTestId("rtl-actions").locator("slot[name=container-action]").evaluate(slot => slot.assignedElements().some(element => element.textContent?.includes("إغلاق"))), true, "RTL container action uses its named slot");

  await page.evaluate(() => {
    const group = document.createElement("spui-message-bar-group"); group.id = "native-group"; group.setAttribute("animate", "both"); group.style.setProperty("--spui-font-family", "Arial, sans-serif");
    const bar = document.createElement("spui-message-bar"); bar.setAttribute("intent", "error"); bar.setAttribute("shape", "rounded");
    const title = document.createElement("spui-message-bar-title"); title.textContent = "Native title";
    const body = document.createElement("spui-message-bar-body"); body.textContent = "Native description";
    const actions = document.createElement("spui-message-bar-actions"); actions.textContent = "Native action";
    bar.append(title, body, actions); group.append(bar); document.body.append(group);
    const customIconBar = document.createElement("spui-message-bar"); customIconBar.id = "native-custom-icon"; customIconBar.setAttribute("intent", "error"); customIconBar.setAttribute("layout", "multiline");
    const icon = document.createElement("span"); icon.slot = "icon"; icon.id = "native-custom-icon-content"; icon.textContent = "!";
    const spacer = document.createElement("div"); spacer.slot = "bottom-reflow-spacer"; spacer.id = "native-spacer"; spacer.textContent = "Native spacer";
    customIconBar.append(icon, "Native error", spacer); group.append(customIconBar);
  });
  const nativeGroup = page.locator("#native-group");
  assert.equal(await nativeGroup.getAttribute("role"), "group");
  assert.equal(await nativeGroup.locator("spui-message-bar[role=alert]").count(), 2);
  assert.equal(await nativeGroup.locator("#native-custom-icon").evaluate(node => node.shadowRoot.querySelector("slot[name=icon]").assignedElements().length), 1, "native icon replacement is assigned to the named slot");
  assert.equal(await nativeGroup.locator("#native-custom-icon").evaluate(node => node.shadowRoot.querySelector(".icon").hidden), true);
  assert.equal(await nativeGroup.locator("#native-custom-icon").evaluate(node => node.shadowRoot.querySelector('slot[name="bottom-reflow-spacer"]').assignedElements().length), 1, "native spacer replacement is assigned to its named slot");
  assert.equal(await nativeGroup.locator("spui-message-bar").first().locator(".icon").getAttribute("data-intent"), "error");
  assert.equal(await nativeGroup.locator("spui-message-bar-title").textContent(), "Native title");
  const nativeTitleFont = await nativeGroup.locator("spui-message-bar-title").evaluate(node => getComputedStyle(node).fontFamily);
  assert.match(nativeTitleFont, /Arial/, "native composition parts inherit the configured font token");
  assert.equal(nativeTitleFont, await nativeGroup.locator("spui-message-bar").first().evaluate(node => getComputedStyle(node).fontFamily));
  assert.equal(await nativeGroup.locator("spui-message-bar").first().evaluate(node => getComputedStyle(node).animationName), "spui-message-enter", "animate=both applies the entry motion");
  await page.emulateMedia({ forcedColors: "active" });
  const systemColors = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.cssText = "position:fixed;color:CanvasText;background:Canvas;border:1px solid CanvasText";
    document.body.append(probe);
    const colors = { text: getComputedStyle(probe).color, canvas: getComputedStyle(probe).backgroundColor, border: getComputedStyle(probe).borderTopColor };
    probe.remove();
    return colors;
  });
  const forcedBars = {};
  for (const [id, locator] of [["warning", bar], ["success", successBar], ["error", nativeGroup.locator("spui-message-bar").first()]]) {
    forcedBars[id] = await locator.evaluate(node => {
      const host = getComputedStyle(node);
      const fallback = node.shadowRoot.querySelector(".icon");
      const iconNode = fallback.hidden ? node.shadowRoot.querySelector('slot[name="icon"]').assignedElements()[0] : fallback;
      const icon = getComputedStyle(iconNode);
      return { text: host.color, background: host.backgroundColor, border: host.borderTopColor, icon: icon.color };
    });
    assert.equal(forcedBars[id].text, systemColors.text, `${id} MessageBar text uses CanvasText`);
    assert.equal(forcedBars[id].background, systemColors.canvas, `${id} MessageBar background uses Canvas`);
    assert.equal(forcedBars[id].border, systemColors.border, `${id} MessageBar border uses CanvasText`);
    assert.equal(forcedBars[id].icon, systemColors.text, `${id} MessageBar icon uses CanvasText`);
  }
  await page.emulateMedia({ forcedColors: "none" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(await nativeGroup.locator("spui-message-bar").first().evaluate(node => getComputedStyle(node).animationName), "none", "reduced-motion preference disables entry motion");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForTimeout(200);
  assert.deepEqual(errors, [], "no browser errors");
  await page.screenshot({ path: resolve(root, "test-results/message-bar-composition.png"), fullPage: true });
  console.log(JSON.stringify({ status: "passed", groupAndAnnouncementSemantics: true, titleBodyAndActionSlots: true, defaultAndCustomIntentIcons: true, shapeLayoutAndThemeTokens: true, rtlHostAndActionSlot: true, directCustomElementComposition: true, forcedColors: { systemColors, bars: forcedBars }, entryMotionAndReducedMotion: true, nativePartsInheritFontToken: true, noPageErrors: true, screenshot: "test-results/message-bar-composition.png" }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
