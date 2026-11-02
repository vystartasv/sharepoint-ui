import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(process.cwd());
const contrastRatio = (foreground, background) => {
  const luminance = value => {
    const parsed = value.match(/\d*\.?\d+/g)?.slice(0, 3).map(Number) ?? [];
    const channels = value.startsWith("color(srgb") ? parsed : parsed.map(channel => channel / 255);
    const linear = channels.map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  };
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};
const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{SharePointUIProvider,Toast,ToastBody,ToastFooter,ToastTitle,ToastTrigger,Toaster,useToastController}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";import{applySharePointTheme}from"${resolve(root, "packages/sharepoint-ui/src/theme.ts")}";applySharePointTheme(document.querySelector("#glass-target"),undefined,undefined,{appearance:"glass",theme:{colors:{accent:"#2468aa"}}});applySharePointTheme(document.querySelector("#theme-target"),{palette:{themePrimary:"#123456"},semanticColors:{bodyText:"#334455"}},{"--colorBrandBackground":"#654321",colorNeutralForeground1:"#354e66"},{theme:{colors:{accent:"#aa22cc"},shape:{controlRadius:"13px"}},tokens:{"--spui-ui-accent":"#aa22cc"}});window.dismissed=[];window.announcements=[];function Capture(){const controller=useToastController();React.useEffect(()=>{window.toastController=controller},[controller]);return null}createRoot(document.querySelector("#root")).render(<SharePointUIProvider theme={{colors:{accent:"rgb(120, 80, 180)",foreground:"rgb(35, 30, 50)"},typography:{fontFamily:"Arial, sans-serif",fontSize:"15px",lineHeight:"1.5"},spacing:{controlHeight:"40px"},shape:{controlRadius:"13px"},motion:{durationFast:"90ms"}}} fluentTokens={{colorNeutralForeground1:"rgb(53, 78, 102)","--colorBrandBackground":"rgb(102, 80, 164)"}}><Toaster inline data-testid="toaster" aria-label="Notifications"><button data-testid="toaster-child-control">Save</button><Toast data-testid="primary-toast" id="primary" title="File saved" intent="success" timeout={-1} onDismiss={(id,reason)=>window.dismissed.push([id,reason])}><ToastBody data-testid="body" subtitle="Synced just now">Your changes are available.</ToastBody><ToastFooter data-testid="footer"><ToastTrigger><div data-testid="undo-trigger">Undo</div></ToastTrigger></ToastFooter></Toast><Toast data-testid="prevent-toast" id="prevent" title="Update pending" timeout={-1}><ToastFooter><ToastTrigger><button data-testid="prevent-trigger" onClick={event=>event.preventDefault()}>Keep open</button></ToastTrigger></ToastFooter></Toast><Toast data-testid="plain-trigger-toast" id="plain-trigger" title="Action needed" timeout={-1}><ToastFooter><ToastTrigger disableButtonEnhancement><div data-testid="plain-trigger">Close notification</div></ToastTrigger></ToastFooter></Toast><Toast data-testid="custom-title-toast" id="custom-title" timeout={-1}><ToastTitle data-testid="custom-title"><span slot="media" data-testid="custom-media">!</span>Custom title<button slot="action" data-testid="title-action">Details</button></ToastTitle><ToastBody>Custom body</ToastBody></Toast><Toast data-testid="brand-toast" appearance="brand" intent="warning" timeout={-1}>Brand appearance</Toast><Toast data-testid="inverted-toast" appearance="inverted" timeout={-1}>Inverted appearance</Toast></Toaster><Toaster inline data-testid="managed-toaster" announce={(message,options)=>window.announcements.push([message,options.politeness])}><Capture/></Toaster><SharePointUIProvider theme={{colors:{accent:"rgb(0, 103, 184)"}}}><Toast data-testid="blue-theme-toast" appearance="brand" timeout={-1}>Blue theme</Toast></SharePointUIProvider><SharePointUIProvider theme={{colors:{accent:"rgb(16, 124, 16)"}}}><Toast data-testid="green-theme-toast" appearance="brand" timeout={-1}>Green theme</Toast></SharePointUIProvider><SharePointUIProvider theme={{colors:{accent:"rgb(176, 0, 101)"}}}><Toast data-testid="pink-theme-toast" appearance="brand" timeout={-1}>Pink theme</Toast></SharePointUIProvider></SharePointUIProvider>);`,
    resolveDir: root,
    sourcefile: "toast-composition.tsx",
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
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><div id='theme-target'></div><div id='glass-target'></div><div id='root'></div><script src='/bundle.js'></script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector('[data-testid="primary-toast"]')?.shadowRoot?.querySelector("slot[name=title]"));
  const toasterChildControl = page.getByTestId("toaster-child-control");
  assert.equal(await toasterChildControl.isVisible(), true, "ordinary Toaster descendants remain rendered outside the toast overlay");
  assert.notEqual(await toasterChildControl.evaluate(node => node.parentElement?.localName), "spui-toaster", "provider descendants are kept outside the focus group");

  const toast = page.getByTestId("primary-toast");
  assert.equal(await toast.getAttribute("role"), "group");
  assert.equal(await toast.locator("spui-toast-title").innerText(), "File saved");
  assert.equal(await toast.evaluate(node => getComputedStyle(node).getPropertyValue("--spui-ui-accent").trim()), "rgb(120, 80, 180)", "provider semantic color inherits through the provider root");
  assert.equal(await toast.evaluate(node => getComputedStyle(node).getPropertyValue("--spui-control-height").trim()), "40px", "provider semantic spacing inherits through the provider root");
  assert.equal(await toast.evaluate(node => getComputedStyle(node).getPropertyValue("--spui-control-radius").trim()), "13px", "provider semantic shape inherits through the provider root");
  assert.equal(await toast.evaluate(node => getComputedStyle(node).getPropertyValue("--spui-text-font-size").trim()), "15px", "provider semantic typography inherits through the provider root");
  assert.equal(await toast.evaluate(node => getComputedStyle(node).getPropertyValue("--colorNeutralForeground1").trim()), "rgb(53, 78, 102)", "raw Fluent tokens remain available alongside semantic overrides");
  assert.equal(await toast.locator("spui-toast-title").locator("svg").count(), 1, "intent media defaults from the toast intent");
  assert.equal(await toast.getByTestId("body").innerText(), "Your changes are available.Synced just now");
  assert.equal(await toast.getByTestId("footer").getAttribute("slot"), "action");
  assert.equal(await toast.getByTestId("body").evaluate(node => getComputedStyle(node).color), "rgb(35, 30, 50)", "semantic theme foreground applies consistently through the shadow DOM");
  const undo = page.getByTestId("undo-trigger");
  const firstDismiss = page.getByTestId("primary-toast").locator("button.close");
  const lastDismiss = page.getByTestId("inverted-toast").locator("button.close");
  const deeplyFocusedIs = locator => locator.evaluate(button => {
    let active = button.ownerDocument.activeElement;
    while (active instanceof HTMLElement && active.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return active === button;
  });
  assert.equal(await firstDismiss.evaluate(button => button.getRootNode().host.parentElement?.localName), "spui-toaster", "compound toast children belong to their toaster focus group");
  await lastDismiss.focus(); await page.keyboard.press("Tab");
  assert.equal(await deeplyFocusedIs(firstDismiss), true, "Tab wraps from the last toaster action to the first");
  await page.keyboard.press("Shift+Tab");
  assert.equal(await deeplyFocusedIs(lastDismiss), true, "Shift+Tab wraps from the first toaster action to the last");
  assert.equal(await undo.getAttribute("role"), "button", "non-button trigger is keyboard accessible");
  assert.equal(await undo.getAttribute("tabindex"), "0");
  await undo.focus(); await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.querySelector('[data-testid="primary-toast"]')?.hidden);
  assert.deepEqual(await page.evaluate(() => window.dismissed), [["primary", "trigger"]]);

  await page.getByTestId("prevent-trigger").click();
  assert.equal(await page.getByTestId("prevent-toast").count(), 1, "preventDefault keeps the toast open");
  const plain = page.getByTestId("plain-trigger");
  assert.equal(await plain.getAttribute("role"), null, "disableButtonEnhancement preserves the child contract");
  assert.equal(await plain.getAttribute("tabindex"), null);
  await plain.click();
  await page.waitForFunction(() => document.querySelector('[data-testid="plain-trigger-toast"]')?.hidden);

  const customTitle = page.getByTestId("custom-title-toast").locator("spui-toast-title");
  assert.equal(await customTitle.getByTestId("custom-media").count(), 1);
  assert.equal(await customTitle.getByTestId("title-action").count(), 1);
  assert.equal(await customTitle.locator("svg").count(), 0, "consumer media replaces the default intent icon");
  const brandColors = await page.getByTestId("brand-toast").evaluate(node => ({ foreground: getComputedStyle(node).color, background: getComputedStyle(node).backgroundColor }));
  const invertedColors = await page.getByTestId("inverted-toast").evaluate(node => ({ foreground: getComputedStyle(node).color, background: getComputedStyle(node).backgroundColor }));
  assert.ok(contrastRatio(brandColors.foreground, brandColors.background) >= 4.5, "brand appearance keeps readable contrast from Fluent tokens");
  assert.ok(contrastRatio(invertedColors.foreground, invertedColors.background) >= 4.5, `inverted appearance contrast failed: ${JSON.stringify(invertedColors)}`);
  const themeSamples = await Promise.all(["blue", "green", "pink"].map(async theme => {
    const colors = await page.getByTestId(`${theme}-theme-toast`).evaluate(node => ({ foreground: getComputedStyle(node).color, background: getComputedStyle(node).backgroundColor }));
    return { theme, contrast: Number(contrastRatio(colors.foreground, colors.background).toFixed(2)), background: colors.background };
  }));
  assert.ok(themeSamples.every(sample => sample.contrast >= 4.5), `theme-derived brand surfaces preserve contrast: ${JSON.stringify(themeSamples)}`);

  await page.evaluate(() => {
    const toast = document.createElement("spui-toast"); toast.id = "native-toast"; toast.setAttribute("toast-id", "native"); toast.setAttribute("timeout", "-1"); toast.setAttribute("intent", "warning");
    const title = document.createElement("spui-toast-title"); title.slot = "title"; title.textContent = "Native title";
    const body = document.createElement("spui-toast-body"); body.textContent = "Native body";
    const footer = document.createElement("spui-toast-footer"); footer.slot = "action"; footer.textContent = "Native footer";
    toast.append(title, body, footer); document.body.append(toast);
  });
  assert.equal(await page.locator("#native-toast spui-toast-title").locator("svg").count(), 1);
  assert.equal(await page.locator("#native-toast spui-toast-body").textContent(), "Native body");
  assert.equal(await page.locator("#native-toast spui-toast-footer").textContent(), "Native footer");

  await page.emulateMedia({ forcedColors: "active" });
  const systemColors = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.cssText = "position:fixed;color:CanvasText;background:Canvas;border:1px solid CanvasText";
    document.body.append(probe);
    const colors = { text: getComputedStyle(probe).color, canvas: getComputedStyle(probe).backgroundColor, border: getComputedStyle(probe).borderTopColor };
    probe.remove();
    return colors;
  });
  const forcedToasts = {};
  for (const [id, locator] of [["brand", page.getByTestId("brand-toast")], ["inverted", page.getByTestId("inverted-toast")], ["native", page.locator("#native-toast")]]) {
    forcedToasts[id] = await locator.evaluate(node => {
      const style = getComputedStyle(node);
      return { text: style.color, background: style.backgroundColor, border: style.borderTopColor, shadow: style.boxShadow };
    });
    assert.equal(forcedToasts[id].text, systemColors.text, `${id} Toast text uses CanvasText`);
    assert.equal(forcedToasts[id].background, systemColors.canvas, `${id} Toast surface uses Canvas`);
    assert.equal(forcedToasts[id].border, systemColors.border, `${id} Toast border uses CanvasText`);
    assert.equal(forcedToasts[id].shadow, "none", `${id} Toast does not rely on shadow in forced colors`);
  }
  await page.emulateMedia({ forcedColors: "none" });

  const themeTarget = page.locator("#theme-target");
  assert.equal(await themeTarget.evaluate(node => node.style.getPropertyValue("--colorBrandBackground")), "#654321", "applySharePointTheme accepts CSS-variable Fluent token keys");
  assert.equal(await themeTarget.evaluate(node => node.style.getPropertyValue("--colorNeutralForeground1")), "#354e66", "applySharePointTheme accepts unprefixed Fluent token keys");
  assert.equal(await themeTarget.evaluate(node => node.style.getPropertyValue("--spui-ui-accent")), "#aa22cc", "semantic theme flows through applySharePointTheme and raw token overrides win");
  assert.equal(await themeTarget.evaluate(node => node.style.getPropertyValue("--spui-control-radius")), "13px", "semantic shape tokens flow through applySharePointTheme");
  assert.equal(await page.locator("#glass-target").evaluate(node => node.style.getPropertyValue("--spui-base-accent")), "#2468aa", "glass derives its base from semantic theme colors");
  assert.equal(await themeTarget.evaluate(node => node.style.getPropertyValue("--spui-ui-accent")), "#aa22cc", "library token overrides compose with Fluent tokens");

  const managedToaster = page.getByTestId("managed-toaster");
  assert.equal(await managedToaster.getAttribute("inline"), "true", "inline Toaster renders in the local flow");
  assert.equal(await managedToaster.evaluate(node => getComputedStyle(node).position), "relative");
  await page.evaluate(() => window.toastController.dispatchToast("Managed success", { id: "managed-toast", timeout: -1, intent: "success", appearance: "brand" }));
  const managedToast = page.locator('spui-toaster[data-testid="managed-toaster"] spui-toast[toast-id="managed-toast"]');
  assert.equal(await managedToast.getAttribute("appearance"), "brand", "imperative ToastOptions accepts Toast appearance");
  assert.equal(await managedToast.evaluate(node => getComputedStyle(node).backgroundColor), "rgb(120, 80, 180)", "imperative Toast inherits the semantic provider accent");
  await page.waitForFunction(() => window.announcements.length > 0);
  assert.deepEqual(await page.evaluate(() => window.announcements), [["Managed success", "assertive"]], "custom announce callback receives the message and politeness");

  assert.deepEqual(errors, [], "no browser errors");
  await page.screenshot({ path: resolve(root, "test-results/toast-composition.png"), fullPage: true });
  console.log(JSON.stringify({ status: "passed", titleBodyFooterComposition: true, providerDescendantPreserved: true, intentMediaAndOverride: true, triggerActivationAndPrevention: true, toasterTabWrapForwardReverse: true, appearanceContrast: { brand: Number(contrastRatio(brandColors.foreground, brandColors.background).toFixed(2)), inverted: Number(contrastRatio(invertedColors.foreground, invertedColors.background).toFixed(2)), themedSamples: themeSamples }, forcedColors: { systemColors, toasts: forcedToasts }, fluentTokenProvider: true, sharePointThemeTokenForms: true, directCustomElementComposition: true, noPageErrors: true, screenshot: "test-results/toast-composition.png" }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
