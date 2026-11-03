import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    contents: `import * as React from "react";
import { createRoot } from "react-dom/client";
import { Button, SharePointUIProvider, TeachingPopover, TeachingPopoverBody, TeachingPopoverCarousel, TeachingPopoverCarouselCard, TeachingPopoverCarouselFooter, TeachingPopoverCarouselFooterButton, TeachingPopoverCarouselNav, TeachingPopoverCarouselNavButton, TeachingPopoverCarouselPageCount, TeachingPopoverFooter, TeachingPopoverHeader, TeachingPopoverSurface, TeachingPopoverTitle, TeachingPopoverTrigger } from "${resolve("packages/sharepoint-ui/src/react.tsx")}";
import { defineTeachingPopover } from "${resolve("packages/sharepoint-ui/src/elements/teaching-popover.ts")}";
window.reactCarouselChanges=[]; window.finishData=null; window.teachingOpenChanges=[]; const ContractMotion=({visible,children})=><div data-testid="contract-surface-motion" data-visible={String(visible)}>{children}</div>; window.mountTour = () => {
  function App() {
    const [announcement, setAnnouncement] = React.useState("");
    const [finished, setFinished] = React.useState("");
    return <SharePointUIProvider lang="ar" dir="rtl" appearance="ios" strings={{ teachingPopoverLabel: "جولة مساحة العمل", teachingPopoverDismiss: "إغلاق الجولة", teachingPopoverSteps: "خطوات الجولة", teachingPopoverPrevious: "السابق", teachingPopoverNext: "التالي", teachingPopoverFinish: "إنهاء الجولة", teachingPopoverPageCount: "{current} من {total}", teachingPopoverPageLabel: "الخطوة {current} من {total}" }}>
      <TeachingPopover data-testid="tour" placement="bottom" onOpenChange={(event,data)=>window.teachingOpenChanges.push({open:data.open,eventType:event.type})} trigger={<Button data-testid="tour-trigger">ابدأ الجولة</Button>}>
        <TeachingPopoverSurface data-testid="tour-surface">
          <TeachingPopoverHeader icon={<span data-testid="custom-header-icon">i</span>} dismissButton={<Button data-testid="custom-header-dismiss">×</Button>}><TeachingPopoverTitle>التعرّف على مساحة العمل</TeachingPopoverTitle></TeachingPopoverHeader>
          <TeachingPopoverFooter data-testid="react-action-footer" primary="متابعة" secondary={<Button onClick={event => event.preventDefault()}>السابق</Button>} />
          <TeachingPopoverCarousel aria-label="خطوات الجولة" defaultValue="views" announcement={value => "تم الانتقال إلى " + value} onAnnouncement={setAnnouncement} onValueChange={(event,data)=>window.reactCarouselChanges.push({value:data.value,type:data.type,eventType:event.type,sameEvent:event===data.event})} onFinish={(event,data)=>{window.finishData={value:data.value,type:data.type,eventType:event.type,sameEvent:event===data.event};setFinished(data.value ?? "")}}>
            <TeachingPopoverCarouselCard value="views"><TeachingPopoverBody>الخطوة الأولى</TeachingPopoverBody></TeachingPopoverCarouselCard>
            <TeachingPopoverCarouselCard value="save"><TeachingPopoverBody>الخطوة الثانية</TeachingPopoverBody></TeachingPopoverCarouselCard>
            <TeachingPopoverCarouselFooter initialStepText="البداية" finalStepText="أكملت الجولة" previous={<TeachingPopoverCarouselFooterButton navType="prev">السابق</TeachingPopoverCarouselFooterButton>} next={<TeachingPopoverCarouselFooterButton navType="next">التالي</TeachingPopoverCarouselFooterButton>}>
              <TeachingPopoverCarouselNav aria-label="التنقل بين الخطوات">
                <TeachingPopoverCarouselNavButton value="views" aria-label="الخطوة الأولى">١</TeachingPopoverCarouselNavButton>
                <TeachingPopoverCarouselNavButton value="save" aria-label="الخطوة الثانية">٢</TeachingPopoverCarouselNavButton>
              </TeachingPopoverCarouselNav>
              <TeachingPopoverCarouselPageCount>{(current, total) => current + " / " + total}</TeachingPopoverCarouselPageCount>
              <TeachingPopoverCarouselFooterButton navType="dismiss">إغلاق</TeachingPopoverCarouselFooterButton>
            </TeachingPopoverCarouselFooter>
          </TeachingPopoverCarousel>
        </TeachingPopoverSurface>
      </TeachingPopover>
      <TeachingPopover data-testid="contract-tour" defaultOpen label="Contract tour" appearance="brand" size="large" closeOnIframeFocus={false} closeOnScroll inertTrapFocus inline openOnContext openOnHover mouseLeaveDelay={13} positioning={{ position: "below", align: "end" }} trapFocus={false} withArrow={false} unstable_disableAutoFocus surfaceMotion={ContractMotion}>
        <TeachingPopoverTrigger data-testid="contract-trigger" disableButtonEnhancement><div>Contract trigger</div></TeachingPopoverTrigger>
        <TeachingPopoverSurface>Contract surface</TeachingPopoverSurface>
      </TeachingPopover>
      <TeachingPopover data-testid="title-tour" label="جولة العنوان" trigger={<Button data-testid="title-trigger">جولة العنوان</Button>}>
        <TeachingPopoverSurface><TeachingPopoverTitle dismissButton={<Button data-testid="title-dismiss">إغلاق العنوان</Button>}>عنوان الجولة</TeachingPopoverTitle></TeachingPopoverSurface>
      </TeachingPopover>
      <TeachingPopoverCarouselFooterButton data-testid="contract-footer-button" navType="next" appearance="outline" size="small" shape="square" disabledFocusable icon={<span data-testid="contract-footer-icon">→</span>} iconPosition="after">Continue</TeachingPopoverCarouselFooterButton>
      <output data-testid="announcement">{announcement}</output><output data-testid="finished">{finished}</output>
    </SharePointUIProvider>;
  }
  createRoot(document.getElementById("root")).render(<App />);
};
window.mountNativeTour = () => {
  defineTeachingPopover();
  const el = (name, attrs = {}, text = "") => { const node = document.createElement(name); for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value); node.textContent = text; return node; };
  const root = el("spui-teaching-popover", { "data-testid": "native-tour", dir: "rtl", lang: "ar", label: "جولة أصلية" });
  const trigger = el("spui-teaching-popover-trigger", { slot: "trigger" });
  trigger.append(el("button", { type: "button", "data-testid": "native-trigger" }, "ابدأ الجولة الأصلية"));
  const surface = el("spui-teaching-popover-surface", { slot: "content" });
  const header = el("spui-teaching-popover-header");
  header.append(el("spui-teaching-popover-title", {}, "التعرّف على الجولة الأصلية"));
  const carousel = el("spui-teaching-popover-carousel", { "aria-label": "خطوات الجولة الأصلية", "default-value": "views" });
  carousel.announcement = value => "تم الانتقال إلى " + value;
  carousel.addEventListener("spui-announcement", event => { document.getElementById("native-value").setAttribute("data-announcement", event.detail.message); });
  window.nativeCarouselChanges=[]; window.nativeFinishData=null; carousel.addEventListener("keydown", event => { window.nativeKeydownSource=event; }, true); carousel.addEventListener("click", event => { window.nativeClickSource=event; }, true); carousel.addEventListener("spui-finish", event => { document.getElementById("native-value").setAttribute("data-finished", event.detail.value); window.nativeFinishData={value:event.detail.value,type:event.detail.type,eventType:event.detail.event?.type,sameEvent:event.detail.event===window.nativeClickSource}; });
  carousel.addEventListener("spui-value-change", event => { document.getElementById("native-value").setAttribute("value", event.detail.value); window.nativeCarouselChanges.push({value:event.detail.value,type:event.detail.type,eventType:event.detail.event?.type,sameEvent:event.detail.event===window.nativeKeydownSource}); });
  carousel.append(el("spui-teaching-popover-carousel-card", { value: "views" }, "الخطوة الأولى"));
  carousel.append(el("spui-teaching-popover-carousel-card", { value: "save" }, "الخطوة الثانية"));
  const footer = el("spui-teaching-popover-carousel-footer", { "initial-step-text": "البداية الأصلية", "final-step-text": "اكتملت الجولة الأصلية" });
  const nav = el("spui-teaching-popover-carousel-nav", { "aria-label": "الانتقال إلى خطوة" });
  nav.append(el("spui-teaching-popover-carousel-nav-button", { value: "views" }, "١"), el("spui-teaching-popover-carousel-nav-button", { value: "save" }, "٢"));
  footer.append(nav, el("spui-teaching-popover-carousel-page-count"));
  footer.append(el("spui-teaching-popover-carousel-footer-button", { slot: "previous", "nav-type": "previous" }, "السابق"));
  footer.append(el("spui-teaching-popover-carousel-footer-button", { slot: "next", "nav-type": "next" }, "التالي"));
  footer.append(el("spui-teaching-popover-carousel-footer-button", { "nav-type": "dismiss" }, "إنهاء"));
  carousel.append(footer);
  surface.append(header, carousel);
  const actionFooter = el("spui-teaching-popover-footer", { "data-testid": "native-action-footer" });
  actionFooter.append(el("button", { slot: "primary", "data-testid": "native-primary-action" }, "متابعة"), el("button", { slot: "secondary", "data-testid": "native-secondary-action" }, "السابق"));
  surface.append(actionFooter);
  root.append(trigger, surface);
  document.getElementById("native").append(root);
  const titleRoot = el("spui-teaching-popover", { "data-testid": "native-title-tour", dir: "rtl", lang: "ar", label: "جولة العنوان" });
  const titleTrigger = el("spui-teaching-popover-trigger", { slot: "trigger" }); titleTrigger.append(el("button", { type: "button", "data-testid": "native-title-trigger" }, "جولة العنوان"));
  const titleSurface = el("spui-teaching-popover-surface", { slot: "content" });
  const title = el("spui-teaching-popover-title", {}, "عنوان الجولة"); title.append(el("button", { slot: "dismiss-button", "aria-label": "إغلاق العنوان", "data-testid": "native-title-dismiss" }, "×"));
  titleSurface.append(title); titleRoot.append(titleTrigger, titleSurface); document.getElementById("native").append(titleRoot);
  const customHeader = el("spui-teaching-popover-header"); customHeader.append(el("span", { slot: "icon" }, "i"), el("button", { slot: "dismiss-button", "aria-label": "Close custom header" }, "×")); document.getElementById("native").append(customHeader);
};`,
    resolveDir: process.cwd(),
    sourcefile: "teaching-popover-check.tsx",
    loader: "tsx",
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
  write: false,
});

const server = createServer((request, response) => {
  const path = new URL(request.url, "http://localhost").pathname;
  if (path === "/") return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html lang='ar'><body><div id='root'></div><div id='native'></div><output id='native-value'></output></body></html>");
  if (path === "/tour.js") return response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents);
  response.writeHead(404).end();
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.addScriptTag({ url: `http://127.0.0.1:${server.address().port}/tour.js` });
  await page.evaluate(() => window.mountTour());
  await page.evaluate(() => window.mountNativeTour());
  const contractTour = page.getByTestId("contract-tour");
  assert.equal(await contractTour.getAttribute("default-open"), "true", "TeachingPopover supports uncontrolled defaultOpen");
  assert.equal(await contractTour.getAttribute("appearance"), "brand");
  assert.equal(await contractTour.getAttribute("size"), "large");
  assert.equal(await contractTour.getAttribute("close-on-iframe-focus"), "false");
  assert.equal(await contractTour.getAttribute("close-on-scroll"), "true");
  assert.equal(await contractTour.getAttribute("inert-trap-focus"), "true");
  assert.equal(await contractTour.getAttribute("inline"), "true");
  assert.equal(await contractTour.getAttribute("open-on-context"), "true");
  assert.equal(await contractTour.getAttribute("open-on-hover"), "true");
  assert.equal(await contractTour.getAttribute("mouse-leave-delay"), "13");
  assert.equal(await contractTour.getAttribute("trap-focus"), null, "explicitly disabling focus trap is preserved");
  assert.equal(await contractTour.getAttribute("arrow"), null, "explicitly disabling the arrow is preserved");
  assert.deepEqual(await contractTour.evaluate(node => node.positioning), { position: "below", align: "end" }, "positioning object reaches the native engine");
  assert.equal(await page.getByTestId("contract-surface-motion").getAttribute("data-visible"), "true", "surfaceMotion is used for the open teaching surface");
  assert.equal(await page.getByTestId("contract-trigger").getAttribute("disable-button-enhancement"), "true", "TeachingPopoverTrigger forwards disableButtonEnhancement");
  const footerButton = page.getByTestId("contract-footer-button");
  assert.equal(await footerButton.getAttribute("appearance"), "outline");
  assert.equal(await footerButton.getAttribute("size"), "small");
  assert.equal(await footerButton.getAttribute("shape"), "square");
  assert.equal(await footerButton.getAttribute("icon-position"), "after");
  assert.equal(await footerButton.getAttribute("disabled-focusable"), "true");
  assert.equal(await footerButton.locator('[slot="icon"]').count(), 1, "footer button icon prop is slotted");
  await contractTour.evaluate(node => node.remove());
  const trigger = page.getByTestId("tour-trigger");
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "جولة مساحة العمل" });
  await dialog.waitFor({ state: "visible" });
  assert.deepEqual(await page.evaluate(() => window.teachingOpenChanges[0]), { open: true, eventType: "click" }, "TeachingPopover forwards Fluent’s event and open data");
  await page.waitForFunction(() => {
    const host = document.querySelector('[data-testid="tour-trigger"]');
    return host?.getAttribute("aria-expanded") === "true" || host?.shadowRoot?.querySelector("button")?.getAttribute("aria-expanded") === "true";
  });
  const reactIconSlotWorks = await page.getByTestId("custom-header-icon").isVisible();
  const reactHeaderDismissSlotWorks = await page.getByTestId("custom-header-dismiss").isVisible();
  const reactDefaultDismissLabel = await page.locator('header spui-button[slot="dismiss-button"]').getAttribute("aria-label");
  const expandedOnOpen = await trigger.evaluate(node => node.getAttribute("aria-expanded") === "true" || node.shadowRoot?.querySelector("button")?.getAttribute("aria-expanded") === "true");
  const firstPageCount = await page.getByText("1 / 2", { exact: true }).isVisible();
  const firstCardName = await page.getByRole("group", { name: "الخطوة 1 من 2" }).isVisible();
  const initialStepLabel = await page.locator('spui-button[aria-label="البداية"]').isVisible();
  const reactFooterSlots = await page.getByTestId("react-action-footer").evaluate(node => [...node.shadowRoot.querySelectorAll("slot")].map(slot => [slot.name || "default", slot.assignedElements().length]));
  const surfaceStyles = await page.getByTestId("tour-surface").evaluate(node => ({ display: getComputedStyle(node).display, minWidth: getComputedStyle(node).minWidth, direction: getComputedStyle(node).direction }));
  const firstNav = page.locator('spui-button[data-value="views"]');
  const secondNav = page.locator('spui-button[data-value="save"]');
  await firstNav.evaluate(node => node.shadowRoot.querySelector("button").focus());
  await page.keyboard.press("ArrowLeft");
  await page.waitForFunction(() => document.querySelector('[data-testid="announcement"]')?.textContent === "تم الانتقال إلى save");
  const customAnnouncement = await page.locator("[data-spui-teaching-announcement]").textContent();
  const rtlArrowNavigation = await secondNav.getAttribute("aria-current") === "step";
  const rovingTabStops = await Promise.all([firstNav.evaluate(node => node.shadowRoot.querySelector("button").tabIndex), secondNav.evaluate(node => node.shadowRoot.querySelector("button").tabIndex)]);
  const edgeLabel = await page.locator('spui-button[appearance="primary"][aria-label="أكملت الجولة"]').isVisible();
  mkdirSync(resolve("test-results"), { recursive: true });
  await page.screenshot({ path: resolve("test-results/teaching-popover-local.png") });
  await page.keyboard.press("ArrowRight");
  await page.waitForFunction(() => document.querySelector('[data-testid="announcement"]')?.textContent === "تم الانتقال إلى views");
  const rtlReverseNavigation = await firstNav.getAttribute("aria-current") === "step";
  await page.keyboard.press("End");
  await page.waitForFunction(() => document.querySelector('[data-testid="announcement"]')?.textContent === "تم الانتقال إلى save");
  await page.locator('spui-button[appearance="primary"][aria-label="أكملت الجولة"]').evaluate(node => node.shadowRoot.querySelector("button").click());
  await page.waitForFunction(() => document.querySelector('[data-testid="finished"]')?.textContent === "save");
  await page.locator('[data-testid="react-action-footer"] spui-button[slot="secondary"]').evaluate(node => node.shadowRoot.querySelector("button").click());
  const preventedReactActionKeepsPopoverOpen = await dialog.isVisible();
  await page.locator('header spui-button[slot="dismiss-button"]').evaluate(node => node.shadowRoot.querySelector("button").click());
  await dialog.waitFor({ state: "hidden" });
  await page.waitForFunction(() => {
    const host = document.querySelector('[data-testid="tour-trigger"]');
    const button = host?.shadowRoot?.querySelector("button");
    return button?.getAttribute("aria-expanded") === "false" && host?.shadowRoot?.activeElement === button;
  });
  const restoredFocus = await trigger.evaluate(node => { const button = node.shadowRoot?.querySelector("button"); return button?.getAttribute("aria-expanded") === "false" && node.shadowRoot?.activeElement === button; });
  await trigger.click();
  await dialog.waitFor({ state: "visible" });
  await page.locator('[data-testid="react-action-footer"] spui-button[slot="primary"]').evaluate(node => node.shadowRoot.querySelector("button").click());
  await dialog.waitFor({ state: "hidden" });
  const reactPrimaryActionClosesPopover = await trigger.evaluate(node => node.shadowRoot?.querySelector("button")?.getAttribute("aria-expanded") === "false");
  await page.getByTestId("title-trigger").click();
  const titleDialog = page.getByRole("dialog", { name: "جولة العنوان" });
  await titleDialog.waitFor({ state: "visible" });
  const titleDismissSlotWorks = await page.getByTestId("title-dismiss").isVisible();
  await page.getByTestId("title-dismiss").click();
  await titleDialog.waitFor({ state: "hidden" });
  const nativeTrigger = page.getByTestId("native-trigger");
  await nativeTrigger.click();
  const nativeDialog = page.getByRole("dialog", { name: "جولة أصلية" });
  await nativeDialog.waitFor({ state: "visible" });
  const nativeDefaults = await page.getByTestId("native-tour").evaluate(node => ({ trapFocus: node.hasAttribute("trap-focus"), arrow: node.hasAttribute("arrow"), open: node.open, controls: typeof node.show === "function" && typeof node.hide === "function" }));
  const nativeCarousel = page.locator("spui-teaching-popover-carousel");
  const nativeHeader = page.locator("spui-teaching-popover-header").first();
  const nativeHeaderFallbacks = await nativeHeader.evaluate(node => ({ icon: node.shadowRoot.querySelector('slot[name="icon"] svg') !== null, dismissLabel: node.shadowRoot.querySelector('slot[name="dismiss-button"] button')?.getAttribute("aria-label") }));
  const nativeHeaderAssignedSlots = await page.locator("#native spui-teaching-popover-header").last().evaluate(node => [...node.shadowRoot.querySelectorAll("slot")].map(slot => [slot.name, slot.assignedElements().length]));
  const nativeFirst = nativeCarousel.locator('spui-teaching-popover-carousel-nav-button[value="views"]');
  const nativeSecond = nativeCarousel.locator('spui-teaching-popover-carousel-nav-button[value="save"]');
  const nativeInitialStepLabel = await nativeCarousel.locator('spui-teaching-popover-carousel-footer-button[nav-type="previous"]').getAttribute("aria-label");
  await nativeFirst.evaluate(node => node.shadowRoot.querySelector("button").focus());
  await page.keyboard.press("ArrowLeft");
  await page.waitForFunction(() => document.getElementById("native-value")?.getAttribute("value") === "save");
  const nativeRtlNavigation = await nativeSecond.getAttribute("aria-current") === "step";
  const nativePageCount = await nativeCarousel.locator("spui-teaching-popover-carousel-page-count").locator("span[aria-live]").textContent();
  const nativeRovingTabStops = await Promise.all([nativeFirst, nativeSecond].map(node => node.evaluate(el => el.shadowRoot.querySelector("button").tabIndex)));
  const nativeEdgeLabel = await nativeCarousel.locator('spui-teaching-popover-carousel-footer-button[nav-type="next"]').getAttribute("aria-label");
  await page.waitForFunction(() => document.getElementById("native-value")?.getAttribute("data-announcement") === "تم الانتقال إلى save");
  await nativeCarousel.locator('spui-teaching-popover-carousel-footer-button[nav-type="next"]').evaluate(node => node.shadowRoot.querySelector("button").click());
  await page.waitForFunction(() => document.getElementById("native-value")?.getAttribute("data-finished") === "save");
  assert.deepEqual(await page.evaluate(() => window.reactCarouselChanges), [{ value: "save", type: "keydown", eventType: "keydown", sameEvent: true }, { value: "views", type: "keydown", eventType: "keydown", sameEvent: true }, { value: "save", type: "keydown", eventType: "keydown", sameEvent: true }]);
  assert.deepEqual(await page.evaluate(() => window.finishData), { value: "save", type: "click", eventType: "click", sameEvent: true });
  assert.deepEqual(await page.evaluate(() => window.nativeCarouselChanges), [{ value: "save", type: "keydown", eventType: "keydown", sameEvent: true }]);
  assert.deepEqual(await page.evaluate(() => window.nativeFinishData), { value: "save", type: "click", eventType: "click", sameEvent: true });
  await page.screenshot({ path: resolve("test-results/teaching-popover-local.png") });
  await nativeCarousel.locator('spui-teaching-popover-carousel-footer-button[nav-type="dismiss"]').evaluate(node => node.shadowRoot.querySelector("button").click());
  await nativeDialog.waitFor({ state: "hidden" });
  await nativeTrigger.click();
  await nativeDialog.waitFor({ state: "visible" });
  const nativeFooterSlots = await page.getByTestId("native-action-footer").evaluate(node => [...node.shadowRoot.querySelectorAll("slot")].map(slot => [slot.name || "default", slot.assignedElements().length]));
  await page.getByTestId("native-secondary-action").evaluate(node => node.addEventListener("click", event => event.preventDefault()));
  await page.getByTestId("native-secondary-action").click();
  const preventedNativeActionKeepsPopoverOpen = await page.getByTestId("native-tour").evaluate(node => node.open);
  await page.getByTestId("native-primary-action").click();
  await nativeDialog.waitFor({ state: "hidden" });
  const nativePrimaryActionClosesPopover = await page.getByTestId("native-tour").evaluate(node => !node.open);
  const nativeFocusRestored = await nativeTrigger.evaluate(node => document.activeElement === node || node.getRootNode().activeElement === node || node.matches(":focus"));
  await nativeTrigger.click();
  await nativeDialog.waitFor({ state: "visible" });
  await nativeHeader.evaluate(node => node.shadowRoot.querySelector('slot[name="dismiss-button"] button').click());
  await nativeDialog.waitFor({ state: "hidden" });
  const nativeHeaderDismissClosesPopover = await page.getByTestId("native-tour").evaluate(node => !node.open);
  await page.getByTestId("native-title-trigger").click();
  const nativeTitleDialog = page.getByRole("dialog", { name: "جولة العنوان" });
  await nativeTitleDialog.waitFor({ state: "visible" });
  await page.getByTestId("native-title-dismiss").click();
  await nativeTitleDialog.waitFor({ state: "hidden" });
  const nativeTitleFocusRestored = await page.getByTestId("native-title-trigger").evaluate(node => document.activeElement === node || node.getRootNode().activeElement === node || node.matches(":focus"));
  await trigger.click();
  await dialog.waitFor({ state: "visible" });
  await page.emulateMedia({ forcedColors: "active" });
  const systemColors = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.cssText = "position:fixed;color:CanvasText;background:Canvas;border:1px solid CanvasText";
    document.body.append(probe);
    const colors = { text: getComputedStyle(probe).color, canvas: getComputedStyle(probe).backgroundColor, border: getComputedStyle(probe).borderTopColor };
    probe.remove();
    return colors;
  });
  const forcedSurface = await page.getByTestId("tour").evaluate(node => {
    const panel = node.shadowRoot.querySelector('[role="dialog"]');
    const style = getComputedStyle(panel);
    return { text: style.color, background: style.backgroundColor, border: style.borderTopColor, shadow: style.boxShadow };
  });
  assert.equal(forcedSurface.text, systemColors.text, "TeachingPopover uses CanvasText in forced colors");
  assert.equal(forcedSurface.background, systemColors.canvas, "TeachingPopover surface uses Canvas");
  assert.equal(forcedSurface.border, systemColors.border, "TeachingPopover border uses CanvasText");
  assert.equal(forcedSurface.shadow, "none", "TeachingPopover does not rely on shadow in forced colors");
  await page.emulateMedia({ forcedColors: "none" });
  await trigger.evaluate(node => node.shadowRoot.querySelector("button").click());
  await dialog.waitFor({ state: "hidden" });
  const result = { assertions: "passed", expandedOnOpen, firstPageCount, firstCardName, reactIconSlotWorks, reactHeaderDismissSlotWorks, reactDefaultDismissLabel, titleDismissSlotWorks, rtlArrowNavigation, rtlReverseNavigation, rovingTabStops, edgeLabel, initialStepLabel, reactFooterSlots, preventedReactActionKeepsPopoverOpen, reactPrimaryActionClosesPopover, customAnnouncement, finishedValue: await page.getByTestId("finished").textContent(), surfaceStyles, forcedColors: { systemColors, surface: forcedSurface }, restoredFocus, nativeDefaults, nativeHeaderFallbacks, nativeHeaderAssignedSlots, nativeHeaderDismissClosesPopover, nativeRtlNavigation, nativePageCount, nativeRovingTabStops, nativeInitialStepLabel, nativeEdgeLabel, nativeFooterSlots, preventedNativeActionKeepsPopoverOpen, nativePrimaryActionClosesPopover, nativeTitleDismissClosesPopover: !(await page.getByTestId("native-title-tour").evaluate(node => node.open)), nativeTitleFocusRestored, nativeAnnouncement: await page.locator("#native-value").getAttribute("data-announcement"), nativeFinishValue: await page.locator("#native-value").getAttribute("data-finished"), nativeFocusRestored, pageErrors: errors, screenshot: resolve("test-results/teaching-popover-local.png") };
  for (const [key, value] of Object.entries({ expandedOnOpen: true, firstPageCount: true, firstCardName: true, rtlArrowNavigation: true, rtlReverseNavigation: true, edgeLabel: true, initialStepLabel: true, customAnnouncement: "تم الانتقال إلى save", restoredFocus: true, finishedValue: "save", nativeInitialStepLabel: "البداية الأصلية", nativeEdgeLabel: "اكتملت الجولة الأصلية", nativeAnnouncement: "تم الانتقال إلى save", nativeFinishValue: "save" })) assert.equal(result[key], value, `TeachingPopover check failed: ${key}`);
  assert.deepEqual(rovingTabStops, [-1, 0]);
  assert.deepEqual(nativeDefaults, { trapFocus: true, arrow: true, open: true, controls: true });
  assert.equal(nativeRtlNavigation, true);
  assert.equal(nativePageCount?.trim(), "2 من 2");
  assert.deepEqual(nativeRovingTabStops, [-1, 0]);
  assert.equal(nativeEdgeLabel, "اكتملت الجولة الأصلية");
  assert.equal(nativeFocusRestored, true);
  assert.equal(result.nativeTitleDismissClosesPopover, true);
  assert.equal(nativeTitleFocusRestored, true);
  assert.deepEqual(reactFooterSlots, [["primary", 1], ["secondary", 1], ["default", 0]]);
  assert.equal(reactIconSlotWorks, true);
  assert.equal(reactHeaderDismissSlotWorks, true);
  assert.equal(reactDefaultDismissLabel, "إغلاق الجولة");
  assert.equal(titleDismissSlotWorks, true);
  assert.equal(preventedReactActionKeepsPopoverOpen, true);
  assert.equal(reactPrimaryActionClosesPopover, true);
  assert.deepEqual(nativeFooterSlots, [["primary", 1], ["secondary", 1], ["default", 0]]);
  assert.deepEqual(nativeHeaderFallbacks, { icon: true, dismissLabel: "إغلاق" });
  assert.deepEqual(nativeHeaderAssignedSlots, [["icon", 1], ["dismiss-button", 1], ["", 0]]);
  assert.equal(nativeHeaderDismissClosesPopover, true);
  assert.equal(preventedNativeActionKeepsPopoverOpen, true);
  assert.equal(nativePrimaryActionClosesPopover, true);
  assert.equal(surfaceStyles.display, "grid");
  assert.equal(errors.length, 0);
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
