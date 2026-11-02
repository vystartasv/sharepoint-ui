import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";

const [pageArg = "https://workswithagents.sharepoint.com/sites/spfx-validation-lab/SitePages/SharePointUIParityLab059.aspx", profileArg = "/Users/vilius/.playwright-profiles/profile-3"] = process.argv.slice(2);
const pageUrl = new URL(pageArg);
if (pageUrl.protocol !== "https:") throw new TypeError("--page must be HTTPS.");
const profileDir = resolve(profileArg);
if (!existsSync(profileDir)) throw new Error("Signed-in browser profile not found.");
const manifestId = "dff44344-7455-4955-ad27-2929a39d27e9";
const manifest = JSON.parse(readFileSync(resolve(`examples/spfx124-webpart/dist/${manifestId}.manifest.json`), "utf8"));
const expectedBundle = manifest.loaderConfig.scriptResources["library-demo-web-part"].path;
const repo = "/Users/vilius/.t3/projects/spfx-research";
const require = createRequire(import.meta.url);
const { chromium } = require(`${repo}/node_modules/playwright`);
const { acquireProfileLock } = await import(`${repo}/packages/playwright/src/profile-lock.js`);
const artifact = resolve("test-results/library-demo/teaching-popover-tenant.json");
mkdirSync(resolve("test-results/library-demo"), { recursive: true });
const unlock = acquireProfileLock(profileDir);
let context;

try {
  context = await chromium.launchPersistentContext(profileDir, { headless: true, serviceWorkers: "block", viewport: { width: 1440, height: 960 } });
  const page = context.pages()[0] ?? await context.newPage();
  const pageErrors = [], consoleErrors = [], bundleResponses = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("response", response => { if (response.url().includes("library-demo-web-part")) bundleResponses.push(new URL(response.url()).pathname); });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setBypassServiceWorker", { bypass: true });
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await page.goto(pageUrl.href, { waitUntil: "domcontentloaded", timeout: 60000 });
  if (page.url().includes("login.microsoftonline.com")) throw new Error("The Vilius profile is signed out.");
  await page.getByRole("heading", { name: "SharePoint UI Lab" }).waitFor({ state: "visible", timeout: 60000 });
  if (!bundleResponses.some(path => path.endsWith(expectedBundle))) throw new Error(`The existing page did not serve the expected package bundle: ${JSON.stringify({ expectedBundle, bundleResponses })}`);

  const directionResults = [];
  for (const direction of ["ltr", "rtl"]) {
    const directionToggle = page.locator('header spui-button[aria-label^="Switch to"]');
    const toggleLabel = await directionToggle.getAttribute("aria-label");
    const currentlyRtl = toggleLabel === "Switch to LTR layout";
    if ((direction === "rtl") !== currentlyRtl) await directionToggle.evaluate(node => node.shadowRoot.querySelector("button").click());

    const trigger = page.getByTestId("teaching-popover-trigger");
    await trigger.scrollIntoViewIfNeeded();
    const triggerText = await trigger.textContent() ?? "";
    const arabic = /[\u0600-\u06FF]/.test(triggerText);
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ state: "visible" });
    const expanded = await trigger.getAttribute("aria-expanded") === "true";
    const dialogLabel = await dialog.getAttribute("aria-label");
    const firstNav = page.locator('spui-button[data-value="views"]');
    const secondNav = page.locator('spui-button[data-value="save"]');
    await firstNav.evaluate(node => { if (node.getAttribute("aria-current") !== "step") node.shadowRoot.querySelector("button").click(); });
    const firstPage = page.locator("[data-spui-teaching-card]").first();
    const firstPageLabel = await firstPage.getAttribute("aria-label");
    const firstCountText = arabic ? "1 من 2" : "1 of 2";
    await page.waitForFunction(text => [...document.querySelectorAll('[aria-live="polite"]')].some(node => node.textContent?.trim() === text), firstCountText);
    const firstPageCountVisible = true;
    await firstNav.evaluate(node => node.shadowRoot.querySelector("button").focus());
    await page.keyboard.press(direction === "rtl" ? "ArrowLeft" : "ArrowRight");
    const expectedSecondCount = arabic ? "2 من 2" : "2 of 2";
    await page.waitForFunction(text => [...document.querySelectorAll('[aria-live="polite"]')].some(node => node.textContent?.trim() === text), expectedSecondCount);
    const arrowMovedForward = await secondNav.getAttribute("aria-current") === "step";
    const tabStopsAfterMove = await Promise.all([firstNav, secondNav].map(locator => locator.evaluate(node => node.shadowRoot.querySelector("button").tabIndex)));
    const nextStepLabel = arabic ? "الخطوة التالية" : "Next step";
    const edgeLabel = await page.locator("spui-button").filter({ hasText: nextStepLabel }).isVisible();
    await page.waitForTimeout(250);
    const popoverGeometry = await trigger.evaluate(trigger => {
      const host = trigger.closest("spui-popover");
      const panel = host.shadowRoot.querySelector(".surface");
      const rect = panel.getBoundingClientRect();
      const triggerRect = host.querySelector('[slot="trigger"]')?.getBoundingClientRect();
      const style = getComputedStyle(panel);
      return { open: panel.matches(":popover-open"), hidden: panel.hidden, left: rect.left, top: rect.top, width: rect.width, height: rect.height, inlineLeft: panel.style.left, inlineTop: panel.style.top, inlineStyle: panel.getAttribute("style"), computedPosition: style.position, computedInset: style.inset, transform: style.transform, direction: style.direction, hostDirection: getComputedStyle(host).direction, hostDir: host.getAttribute("dir"), triggerDirection: getComputedStyle(trigger).direction, trigger: triggerRect && { left: triggerRect.left, top: triggerRect.top, width: triggerRect.width, height: triggerRect.height }, viewport: { width: innerWidth, height: innerHeight }, scroll: { x: scrollX, y: scrollY } };
    });
    const screenshot = resolve(`test-results/library-demo/teaching-popover-${direction}.png`);
    await page.screenshot({ path: screenshot });
    await dialog.screenshot({ path: resolve(`test-results/library-demo/teaching-popover-${direction}-surface.png`) });
    await page.keyboard.press(direction === "rtl" ? "ArrowRight" : "ArrowLeft");
    const expectedFirstCount = arabic ? "1 من 2" : "1 of 2";
    await page.waitForFunction(text => [...document.querySelectorAll('[aria-live="polite"]')].some(node => node.textContent?.trim() === text), expectedFirstCount);
    const arrowMovedBack = await firstNav.getAttribute("aria-current") === "step";
    await page.keyboard.press("End");
    await page.waitForFunction(text => [...document.querySelectorAll('[aria-live="polite"]')].some(node => node.textContent?.trim() === text), expectedSecondCount);
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    const focusRestored = await trigger.getAttribute("aria-expanded") === "false" && await trigger.evaluate(node => node.shadowRoot.activeElement === node.shadowRoot.querySelector("button"));
    directionResults.push({ direction, expanded, dialogLabel, firstPageLabel, firstPageCountVisible, arrowMovedForward, arrowMovedBack, tabStopsAfterMove, edgeLabel, popoverGeometry, focusRestored, screenshot });
  }

  const resource = await page.evaluate(bundle => performance.getEntriesByType("resource").find(entry => new URL(entry.name).pathname.endsWith(bundle)), expectedBundle);
  const result = {
    status: "captured",
    page: pageUrl.href,
    packageVersion: JSON.parse(readFileSync("examples/spfx124-webpart/config/package-solution.json", "utf8")).solution.version,
    expectedBundle,
    servedBundle: bundleResponses.find(path => path.endsWith(expectedBundle)),
    directions: directionResults,
    bundle: resource ? { durationMs: +resource.duration.toFixed(1), transferSizeBytes: resource.transferSize || null, encodedBodyBytes: resource.encodedBodySize || null, decodedBodyBytes: resource.decodedBodySize || null } : null,
    diagnostics: { pageErrors, consoleErrors },
    caveat: "One authenticated SharePoint visit. Resource and interaction timings include the SharePoint page, browser scheduling, and Playwright; they are not component-only performance claims.",
  };
  writeFileSync(artifact, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  for (const check of directionResults) {
    assert.equal(check.expanded, true, `${check.direction}: trigger expanded state`);
    assert.ok(check.dialogLabel, `${check.direction}: dialog has an accessible name`);
    assert.ok(check.firstPageLabel, `${check.direction}: slide has an accessible name`);
    assert.equal(check.firstPageCountVisible, true, `${check.direction}: localized page count`);
    assert.equal(check.arrowMovedForward, true, `${check.direction}: forward arrow movement`);
    assert.equal(check.arrowMovedBack, true, `${check.direction}: reverse arrow movement`);
    assert.deepEqual(check.tabStopsAfterMove, [-1, 0], `${check.direction}: one roving tab stop`);
    assert.equal(check.edgeLabel, true, `${check.direction}: end-step button label`);
    const geometry = check.popoverGeometry;
    assert.ok(Math.abs((geometry.left + geometry.width / 2) - (geometry.trigger.left + geometry.trigger.width / 2)) < 3, `${check.direction}: popover centered on trigger: ${JSON.stringify(geometry)}`);
    assert.ok(geometry.left >= 0 && geometry.top >= 0 && geometry.left + geometry.width <= geometry.viewport.width && geometry.top + geometry.height <= geometry.viewport.height, `${check.direction}: popover remains within viewport`);
    assert.equal(check.focusRestored, true, `${check.direction}: focus restored to trigger`);
  }
  assert.equal(pageErrors.length, 0);
  assert.equal(consoleErrors.length, 0);
  result.status = "passed";
  writeFileSync(artifact, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({ status: result.status, artifact }, null, 2));
} finally {
  await context?.close();
  unlock();
}
