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
const manifestPath = resolve(`examples/spfx124-webpart/dist/${manifestId}.manifest.json`);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const expectedBundle = manifest.loaderConfig.scriptResources["library-demo-web-part"].path;
const repo = "/Users/vilius/.t3/projects/spfx-research";
const require = createRequire(import.meta.url);
const { chromium } = require(`${repo}/node_modules/playwright`);
const { acquireProfileLock } = await import(`${repo}/packages/playwright/src/profile-lock.js`);
const artifact = resolve("test-results/library-demo/data-grid-edit-tenant.json");
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
  const dataGridCard = page.getByRole("region", { name: "SharePoint tasks data grid" });
  await dataGridCard.scrollIntoViewIfNeeded();
  const grid = dataGridCard.getByRole("grid", { name: "SharePoint task grid" });
  const target = grid.locator('[data-row-key="SP-1"][data-column-id="title"]');
  const originalTitle = await target.textContent();
  const rowCount = await grid.locator('[role="row"][data-row-index]').count();
  await target.focus();
  await page.keyboard.press("Enter");
  const editor = grid.getByTestId("spui-data-grid-editor");
  await editor.waitFor({ state: "visible" });
  await editor.fill("");
  await editor.press("Enter");
  const validationMessage = await grid.getByRole("alert").textContent();
  const validationRetainedEditor = await editor.getAttribute("aria-invalid") === "true" && validationMessage === "A task title is required.";
  const replacement = `Tenant edit check ${new Date().toISOString().slice(11, 19)}`;
  const commitStart = performance.now();
  await editor.fill(replacement);
  await editor.press("Enter");
  await target.getByText(replacement, { exact: true }).waitFor({ state: "visible" });
  const commitObservedMs = +(performance.now() - commitStart).toFixed(1);
  const commitUpdatedDisplay = await target.getByText(replacement, { exact: true }).isVisible();
  await target.focus(); await page.keyboard.press("Enter");
  const restoreEditor = grid.getByTestId("spui-data-grid-editor"); await restoreEditor.waitFor({ state: "visible" });
  await restoreEditor.fill(originalTitle ?? ""); await restoreEditor.press("Enter");
  await target.getByText(originalTitle ?? "", { exact: true }).waitFor({ state: "visible" });
  const restoredOriginal = await target.getByText(originalTitle ?? "", { exact: true }).isVisible();
  const bundleEntry = await page.evaluate(bundle => performance.getEntriesByType("resource").find(entry => new URL(entry.name).pathname.endsWith(bundle)), expectedBundle);
  const result = {
    status: "passed",
    page: pageUrl.href,
    expectedBundle,
    servedBundle: bundleResponses.find(path => path.endsWith(expectedBundle)),
    packageVersion: JSON.parse(readFileSync("examples/spfx124-webpart/config/package-solution.json", "utf8")).solution.version,
    rowCount,
    keyboardEntry: true,
    validationRetainedEditor,
    validationMessage,
    textCommit: commitUpdatedDisplay,
    commitObservedMs,
    restoredOriginal,
    resource: bundleEntry ? { durationMs: +bundleEntry.duration.toFixed(1), transferSizeBytes: bundleEntry.transferSize || null, encodedBodyBytes: bundleEntry.encodedBodySize || null, decodedBodyBytes: bundleEntry.decodedBodySize || null } : null,
    diagnostics: { pageErrors, consoleErrors },
    caveat: "One authenticated SharePoint visit; the commit timing includes Playwright and page scheduling. This example updates React state only and does not write SharePoint list data.",
  };
  assert.equal(validationRetainedEditor, true);
  assert.equal(commitUpdatedDisplay, true);
  assert.equal(restoredOriginal, true);
  assert.equal(pageErrors.length, 0);
  assert.equal(consoleErrors.length, 0);
  await dataGridCard.screenshot({ path: resolve("test-results/library-demo/data-grid-edit.png") });
  writeFileSync(artifact, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
} finally {
  await context?.close();
  unlock();
}
