import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const pageUrl = "https://workswithagents.sharepoint.com/sites/spfx-validation-lab/SitePages/SharePointUIParityLab058.aspx";
const profileDir = "/Users/vilius/.playwright-profiles/profile-3";
const repo = "/Users/vilius/.t3/projects/spfx-research";
const require = createRequire(import.meta.url);
const { chromium } = require(`${repo}/node_modules/playwright`);
const { acquireProfileLock } = await import(pathToFileURL(`${repo}/packages/playwright/src/profile-lock.js`));
const artifacts = resolve("test-results/library-demo");
const solution = JSON.parse(readFileSync("examples/spfx124-webpart/config/package-solution.json", "utf8")).solution;
const manifest = JSON.parse(readFileSync("examples/spfx124-webpart/dist/dff44344-7455-4955-ad27-2929a39d27e9.manifest.json", "utf8"));
const expectedBundle = manifest.loaderConfig.scriptResources["library-demo-web-part"].path;
mkdirSync(artifacts, { recursive: true });
const unlock = acquireProfileLock(profileDir);
let context;
try {
  context = await chromium.launchPersistentContext(profileDir, { headless: true, serviceWorkers: "block", viewport: { width: 1440, height: 960 } });
  const page = context.pages()[0] ?? await context.newPage();
  const pageErrors = [];
  const loadedBundles = [];
  page.on("pageerror", error => pageErrors.push({ name: error.name, message: error.message, stack: error.stack }));
  page.on("response", response => { if (response.url().includes("library-demo-web-part_")) loadedBundles.push(response.url()); });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setBypassServiceWorker", { bypass: true });
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  if (page.url().includes("login.microsoftonline.com")) throw new Error("Vilius profile is signed out.");
  let frame;
  for (let attempt = 0; attempt < 60 && !frame; attempt++) {
    frame = page.frames().find(candidate => candidate.url().includes("ClientSideAssets") || candidate.url().includes("SharePointUIParityLab058"));
    if (frame && await frame.getByTestId("teaching-popover-trigger").count().catch(() => 0)) break;
    frame = undefined;
    await page.waitForTimeout(500);
  }
  if (!frame) throw new Error("The published page did not render the TeachingPopover trigger.");
  const trigger = frame.getByTestId("teaching-popover-trigger");
  const popover = frame.locator("spui-popover").filter({ has: trigger });
  const getOpen = async () => (await popover.getAttribute("open")) !== null;
  const focusPath = () => frame.evaluate(() => {
    const path = [];
    let active = document.activeElement;
    while (active) {
      path.push(`${active.tagName.toLowerCase()}[${active.getAttribute("aria-label") || active.textContent?.trim().slice(0, 40) || ""}]`);
      active = active.shadowRoot?.activeElement ?? null;
    }
    return path;
  });
  const start = performance.now();
  await trigger.click();
  await popover.waitFor({ state: "attached" });
  await frame.locator("spui-popover [aria-current='step']").waitFor({ state: "visible" });
  await frame.waitForTimeout(80);
  const initiallyOpen = await getOpen();
  const expanded = await trigger.getAttribute("aria-expanded");
  const firstFocus = await focusPath();
  await frame.getByRole("button", { name: "Close tour" }).press("Shift+Tab");
  await frame.waitForTimeout(30);
  const shiftTabFocus = await focusPath();
  await frame.getByRole("button", { name: "Finish tour" }).press("Tab");
  await frame.waitForTimeout(30);
  const tabWrapFocus = await focusPath();
  const stepTwoButton = frame.getByRole("button", { name: "Step 2" });
  await stepTwoButton.click();
  const stepTwoSelected = await stepTwoButton.getAttribute("aria-current") === "step";
  const pageCountTwo = await frame.locator("[aria-live=polite]").filter({ hasText: "2 of 2" }).count();
  await frame.getByRole("button", { name: "Previous step" }).click();
  const previousWorks = await frame.getByRole("button", { name: "Step 1" }).getAttribute("aria-current") === "step";
  const screenshot = `${artifacts}/teaching-popover.png`;
  await frame.getByTestId("teaching-popover-surface").screenshot({ path: screenshot });
  await frame.getByRole("button", { name: "Finish tour" }).click();
  const finishDismisses = !(await getOpen());
  const finishFocusReturned = (await focusPath()).some(item => item.includes("Start tour"));
  await trigger.click();
  await frame.waitForTimeout(50);
  await trigger.press("Escape");
  const escapeDismisses = !(await getOpen());
  const focusReturned = await trigger.getAttribute("aria-expanded") === "false" && (await focusPath()).some(item => item.includes("Start tour"));
  const expectedBundleLoaded = loadedBundles.some(url => url.endsWith(expectedBundle));
  const result = {
    status: expectedBundleLoaded && initiallyOpen && expanded === "true" && shiftTabFocus.some(item => item.includes("Finish tour")) && tabWrapFocus.some(item => item.includes("Close tour")) && stepTwoSelected && pageCountTwo > 0 && previousWorks && finishDismisses && finishFocusReturned && escapeDismisses && focusReturned && pageErrors.length === 0 ? "passed" : "failed",
    page: pageUrl,
    packageVersion: solution.version,
    expectedBundle,
    loadedBundles,
    checks: { expectedBundleLoaded, initiallyOpen, triggerExpanded: expanded === "true", initialFocus: firstFocus, shiftTabWrapsToLast: shiftTabFocus.some(item => item.includes("Finish tour")), shiftTabFocus, tabWrapReturnsToFirst: tabWrapFocus.some(item => item.includes("Close tour")), tabWrapFocus, stepTwoSelected, pageCountTwo, previousWorks, finishDismisses, finishFocusReturned, escapeDismisses, focusReturned, pageErrors },
    openInteractionMs: Number((performance.now() - start).toFixed(1)),
    screenshot,
  };
  writeFileSync(`${artifacts}/teaching-popover-metrics.json`, JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== "passed") process.exitCode = 1;
} finally {
  await context?.close();
  unlock();
}
