import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const [siteArg = "https://workswithagents.sharepoint.com/sites/spfx-validation-lab", pageArg = `${siteArg}/SitePages/SharePointUIParityLab059.aspx`, profileArg = "/Users/vilius/.playwright-profiles/profile-3"] = process.argv.slice(2);
const site = new URL(siteArg); const pageUrl = new URL(pageArg);
if (site.origin !== pageUrl.origin || !pageUrl.pathname.startsWith(`${site.pathname.replace(/\/$/, "")}/`)) throw new Error("The diagnostic page must be inside the supplied SharePoint site.");
const profileDir = resolve(profileArg);
const repo = "/Users/vilius/.t3/projects/spfx-research";
const require = createRequire(import.meta.url);
const { chromium } = require(`${repo}/node_modules/playwright`);
const { acquireProfileLock } = await import(pathToFileURL(`${repo}/packages/playwright/src/profile-lock.js`));
const productId = "5f68f9b1-18bb-47e8-a85f-9957dce645e4";
const artifacts = resolve("test-results/library-demo"); mkdirSync(artifacts, { recursive: true });
const describeBrowserError = value => {
  let rendered;
  try { rendered = typeof value?.message === "string" && value.message ? value.message : String(value); }
  catch { rendered = "<unprintable browser error>"; }
  return { type: typeof value, prototype: value && Object.getPrototypeOf(value)?.constructor?.name, name: value?.name ?? null, message: value?.message ?? null, stack: value?.stack ?? null, rendered: rendered === "undefined" ? "<thrown undefined>" : rendered.slice(0, 500) };
};
const unlock = acquireProfileLock(profileDir); let context;
try {
  context = await chromium.launchPersistentContext(profileDir, { headless: true, serviceWorkers: "block", viewport: { width: 1440, height: 960 } });
  const page = context.pages()[0] ?? await context.newPage(); const bundlePaths = []; const pageErrors = []; const runtimeExceptions = []; const consoleErrors = [];
  const cdp = await context.newCDPSession(page);
  await cdp.send("Runtime.enable");
  cdp.on("Runtime.exceptionThrown", event => runtimeExceptions.push({ text: event.exceptionDetails.text, url: event.exceptionDetails.url, lineNumber: event.exceptionDetails.lineNumber, columnNumber: event.exceptionDetails.columnNumber, description: event.exceptionDetails.exception?.description, stackTrace: event.exceptionDetails.stackTrace?.callFrames?.slice(0, 8) }));
  page.on("response", response => { if (/library-demo-web-part.*\.js(?:\?|$)/.test(response.url())) bundlePaths.push(new URL(response.url()).pathname); });
  page.on("pageerror", error => pageErrors.push(describeBrowserError(error)));
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text().slice(0, 300)); });
  await page.goto(pageUrl.href, { waitUntil: "domcontentloaded", timeout: 60000 });
  if (page.url().includes("login.microsoftonline.com")) throw new Error("The signed-in SharePoint profile is not authenticated.");
  await page.getByRole("heading", { name: "SharePoint UI Lab" }).waitFor({ state: "visible", timeout: 60000 });
  const publishedPage = await page.evaluate(() => ({ title: document.title, uiElementCount: document.querySelectorAll("[data-testid], [data-spui-appearance], [data-spui-base-appearance]").length, customElementCounts: Object.fromEntries([...new Set([...document.querySelectorAll("*")].map(element => element.localName).filter(name => name.startsWith("spui-")))].map(name => [name, document.querySelectorAll(name).length])), visibleControls: [...document.querySelectorAll("button,input,textarea,select,[role=button]")].filter(element => element.getClientRects().length).slice(0, 40).map(element => ({ tag: element.localName, label: element.getAttribute("aria-label") || element.innerText?.trim() || element.getAttribute("placeholder") || "" })), siteAccent: getComputedStyle(document.querySelector('[data-automation-id="CanvasSection"]') ?? document.body).getPropertyValue("--colorBrandBackground").trim() }));
  const publishedPageScreenshot = `${artifacts}/deployment-published-page.png`;
  await page.screenshot({ path: publishedPageScreenshot, fullPage: true });
  const appearanceControl = page.getByRole("combobox", { name: "Base appearance" });
  const initialBaseAppearance = await appearanceControl.inputValue();
  const themeVariantSamples = [];
  for (const appearance of ["fluent", "ios", "windows", "linux"]) {
    await appearanceControl.selectOption(appearance);
    await page.waitForFunction(value => document.querySelector("spui-button")?.getAttribute("data-spui-base-appearance") === value, appearance);
    await page.evaluate(() => document.querySelector("spui-combobox")?.setOpen?.(true));
    themeVariantSamples.push(await page.evaluate(expectedAppearance => {
      const hosts = [...document.querySelectorAll("[data-spui-base-appearance]")];
      const host = document.querySelector("spui-button");
      const style = host ? getComputedStyle(host) : null;
      const control = host?.shadowRoot?.querySelector("button");
      const controlStyle = control ? getComputedStyle(control) : null;
      const brand = getComputedStyle(document.querySelector('[data-automation-id="CanvasSection"]') ?? document.body).getPropertyValue("--colorBrandBackground").trim();
      const sampleSurface = (selector, surfaceSelector) => {
        const component = document.querySelector(selector);
        const surface = component?.shadowRoot?.querySelector(surfaceSelector) ?? null;
        if (!component || !surface) return { component: selector, found: false };
        const computed = getComputedStyle(surface);
        return { component: selector, found: true, accent: computed.getPropertyValue("--spui-ui-accent").trim(), brand: computed.getPropertyValue("--colorBrandBackground").trim(), backgroundColor: computed.backgroundColor, color: computed.color };
      };
      const configHostsWithoutRawBrand = hosts.filter(element => ["spui-radio-option", "spui-combobox-option"].includes(element.localName) && !getComputedStyle(element).getPropertyValue("--colorBrandBackground").trim());
      const combo = document.querySelector("spui-combobox");
      const comboOption = combo?.shadowRoot?.querySelector("[role=option]");
      const comboStyle = comboOption ? getComputedStyle(comboOption) : null;
      const derivedAccent = style?.getPropertyValue("--spui-base-accent").trim() ?? "";
      const visualTokenSurfaces = [sampleSurface("spui-radio-group", ".radio-indicator"), sampleSurface("spui-radio-group", "input"), { component: "spui-combobox", found: Boolean(comboOption), accent: comboStyle?.getPropertyValue("--spui-ui-accent").trim() ?? "", brand: comboStyle?.getPropertyValue("--colorBrandBackground").trim() ?? "", backgroundColor: comboStyle?.backgroundColor ?? null, color: comboStyle?.color ?? null }, sampleSurface("spui-avatar-group-item", "spui-avatar")];
      const visualThemeFailures = visualTokenSurfaces.filter(surface => surface.found && (surface.accent !== derivedAccent || surface.brand !== brand));
      return { appearance: expectedAppearance, themedHostCount: hosts.length, appearanceAppliedCount: hosts.filter(element => element.getAttribute("data-spui-base-appearance") === expectedAppearance).length, configHostsWithoutRawBrandCount: configHostsWithoutRawBrand.length, visualTokenSurfaces, visualThemeFailures, siteBrand: brand, derivedAccent, controlBackground: controlStyle?.backgroundColor ?? null, controlColor: controlStyle?.color ?? null, radius: controlStyle?.borderRadius ?? null };
    }, appearance));
    await page.evaluate(() => document.querySelector("spui-combobox")?.setOpen?.(false));
  }
  await appearanceControl.selectOption(initialBaseAppearance);
  await page.waitForFunction(value => document.querySelector("spui-button")?.getAttribute("data-spui-base-appearance") === value, initialBaseAppearance);
  const publishedPageErrors = pageErrors.slice();
  const publishedPageRuntimeExceptions = runtimeExceptions.slice();
  const publishedPageConsoleErrors = consoleErrors.slice();
  pageErrors.length = 0; runtimeExceptions.length = 0; consoleErrors.length = 0;
  const remote = await page.evaluate(async ({ productId, manifestId }) => {
    const base = `${location.origin}${location.pathname.split("/").slice(0, 3).join("/")}`;
    const api = `${base}/_api`;
    const headers = { Accept: "application/json;odata=nometadata" };
    const tenantSettingsResponse = await fetch(`${api}/SP_TenantSettings_Current`, { headers });
    const tenantSettings = tenantSettingsResponse.ok ? await tenantSettingsResponse.json() : null;
    const tenantCatalogSettings = tenantSettings ? Object.fromEntries(Object.entries(tenantSettings).filter(([key]) => /catalog/i.test(key))) : null;
    const response = await fetch(`${api}/web/tenantappcatalog/AvailableApps`, { headers });
    const available = response.ok ? (await response.json()).value ?? [] : [];
    const app = available.find(candidate => String(candidate.ProductId).toLowerCase() === productId.toLowerCase());
    const siteCatalogResponse = await fetch(`${api}/web/sitecollectionappcatalog/AvailableApps`, { headers });
    const siteCatalogApps = siteCatalogResponse.ok ? (await siteCatalogResponse.json()).value ?? [] : [];
    const siteCatalogMatches = siteCatalogApps.filter(candidate => String(candidate.ProductId).toLowerCase() === productId.toLowerCase()).map(candidate => ({ ID: candidate.ID, ProductId: candidate.ProductId, AppCatalogVersion: candidate.AppCatalogVersion, InstalledVersion: candidate.InstalledVersion, CurrentVersionDeployed: candidate.CurrentVersionDeployed, IsEnabled: candidate.IsEnabled, IsValidAppPackage: candidate.IsValidAppPackage }));
    const lookupIds = [...new Set([productId, app?.ID].filter(Boolean))];
    const byId = await Promise.all(lookupIds.map(async id => {
      const result = await fetch(`${api}/web/tenantappcatalog/AvailableApps/GetById('${id}')`, { headers });
      const value = result.ok ? await result.json() : null;
      return { requestedId: id, status: result.status, ID: value?.ID, ProductId: value?.ProductId, AppCatalogVersion: value?.AppCatalogVersion, InstalledVersion: value?.InstalledVersion, CurrentVersionDeployed: value?.CurrentVersionDeployed, IsEnabled: value?.IsEnabled, IsValidAppPackage: value?.IsValidAppPackage };
    }));
    const webPartsResponse = await fetch(`${api}/web/GetClientSideWebParts`, { headers });
    const webParts = webPartsResponse.ok ? (await webPartsResponse.json()).value ?? [] : [];
    const webPart = webParts.find(value => String(value.Id).replace(/[{}]/g, "").toLowerCase() === manifestId.toLowerCase());
    let manifest = null;
    try { manifest = typeof webPart?.Manifest === "string" ? JSON.parse(webPart.Manifest) : webPart?.Manifest ?? null; } catch {}
    const instancesResponse = await fetch(`${api}/web/GetAppInstancesByProductId('${productId}')`, { headers });
    const instancePayload = instancesResponse.ok ? await instancesResponse.json() : null;
    const instances = instancePayload?.value ?? instancePayload?.d?.results ?? [];
    const instanceDetails = await Promise.all(instances.map(async instance => {
      const detailResponse = await fetch(`${api}/web/GetAppInstanceById('${instance.Id}')`, { headers });
      const detail = detailResponse.ok ? await detailResponse.json() : null;
      return { Id: instance.Id, ProductId: instance.ProductId, Status: instance.Status, AppVersion: instance.AppVersion, Title: instance.Title, ErrorDetails: instance.ErrorDetails, WebFullUrl: instance.WebFullUrl, DetailStatus: detailResponse.status, Detail: detail ? { Id: detail.Id, Status: detail.Status, InError: detail.InError, PackageFingerprint: detail.PackageFingerprint, StartPage: detail.StartPage, AppWebFullUrl: detail.AppWebFullUrl, ErrorDetails: detail.ErrorDetails, Keys: Object.keys(detail) } : null };
    }));
    const readTheme = element => {
      const style = getComputedStyle(element);
      const names = ["--colorBrandBackground", "--colorStrokeFocus2", "--colorNeutralForeground1", "--colorNeutralBackground1", "--spui-semantic-focus-border", "--spui-ui-border-focus", "--spui-ui-text", "--spui-ui-surface"];
      return { tag: element.tagName, id: element.id || undefined, className: typeof element.className === "string" ? element.className.slice(0, 100) : undefined, colorScheme: style.colorScheme, color: style.color, backgroundColor: style.backgroundColor, tokens: Object.fromEntries(names.map(name => [name, style.getPropertyValue(name).trim()]).filter(([, value]) => value)) };
    };
    const themeSample = { document: readTheme(document.documentElement), body: readTheme(document.body), canvasSections: [...document.querySelectorAll('[data-automation-id="CanvasSection"], [data-automation-id="CanvasZone"], .CanvasSection, .CanvasZone')].slice(0, 8).map(readTheme) };
    return { tenantSettingsStatus: tenantSettingsResponse.status, tenantCatalogSettings, themeSample, availableAppsStatus: response.status, catalogMatch: app ? { ID: app.ID, ProductId: app.ProductId, AppCatalogVersion: app.AppCatalogVersion, InstalledVersion: app.InstalledVersion, CurrentVersionDeployed: app.CurrentVersionDeployed, IsEnabled: app.IsEnabled, IsValidAppPackage: app.IsValidAppPackage } : null, siteCollectionCatalogStatus: siteCatalogResponse.status, siteCollectionCatalogMatches: siteCatalogMatches, getById: byId, webPartStatus: webPartsResponse.status, registeredWebPart: webPart ? { Id: webPart.Id, Version: webPart.Version, ManifestVersion: manifest?.version, bundleResource: manifest?.loaderConfig?.scriptResources?.["library-demo-web-part"] } : null, appInstancesStatus: instancesResponse.status, appInstances: instanceDetails };
  }, { productId, manifestId: "dff44344-7455-4955-ad27-2929a39d27e9" });
  await page.goto(`${site.origin}${site.pathname}/_layouts/15/viewlsts.aspx?view=14`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2000);
  const siteContents = await page.locator("body").innerText({ timeout: 30000 }).catch(() => "");
  const appUiLines = siteContents.split(/\r?\n/).map(line => line.trim()).filter(line => /sharepoint ui|install|update|version/i.test(line)).slice(0, 30);
  const appUiControls = await page.locator("button,a,[role=button]").evaluateAll(nodes => nodes.map(node => ({ text: node.innerText?.trim() ?? "", label: node.getAttribute("aria-label"), title: node.getAttribute("title"), href: node.getAttribute("href") })).filter(item => /sharepoint ui|install|update|version|get it|upgrade/i.test([item.text, item.label, item.title].join(" "))).slice(0, 30));
  const siteContentsScreenshot = `${artifacts}/site-contents-app-status.png`;
  await page.screenshot({ path: siteContentsScreenshot });
  const scrollState = await page.evaluate(() => {
    const candidates = [document.scrollingElement, ...document.querySelectorAll("*")].filter(node => node && node.scrollHeight > node.clientHeight + 100).sort((a, b) => (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight));
    const target = candidates[0];
    if (!target) return null;
    target.scrollTop = target.scrollHeight;
    return { tag: target.tagName, id: target.id, className: typeof target.className === "string" ? target.className.slice(0, 120) : "", scrollTop: target.scrollTop, scrollHeight: target.scrollHeight, clientHeight: target.clientHeight };
  });
  await page.waitForTimeout(250);
  const bottomScreenshot = `${artifacts}/site-contents-app-status-bottom.png`;
  await page.screenshot({ path: bottomScreenshot });
  const siteContentsEndText = (await page.locator("body").innerText({ timeout: 30000 }).catch(() => "")).split(/\r?\n/).map(line => line.trim()).filter(Boolean).slice(-40);
  const appRow = page.getByText("sharepoint-ui-lab-client-side-solution", { exact: true });
  let appDetailsText = null, appDetailsScreenshot = null, appRowControls = null, appActionsText = null, appActionsScreenshot = null;
  if (await appRow.count()) {
    await appRow.click();
    await page.waitForTimeout(1000);
    appRowControls = await appRow.evaluate(node => {
      const row = node.closest('[role="row"]') ?? node.parentElement?.parentElement;
      return { rowRole: row?.getAttribute("role"), rowLabel: row?.getAttribute("aria-label"), rowText: row?.innerText?.trim(), controls: [...(row?.querySelectorAll("button,[role=button]") ?? [])].map(control => ({ label: control.getAttribute("aria-label"), title: control.getAttribute("title"), text: control.innerText?.trim() })) };
    });
    appDetailsText = (await page.locator("body").innerText({ timeout: 30000 }).catch(() => "")).split(/\r?\n/).map(line => line.trim()).filter(line => /sharepoint ui|install|update|version|get it|upgrade|app/i.test(line)).slice(-40);
    appDetailsScreenshot = `${artifacts}/site-contents-app-details.png`;
    await page.screenshot({ path: appDetailsScreenshot });
    const actionsButton = page.getByRole("row", { name: /sharepoint-ui-lab-client-side-solution/ }).getByRole("button", { name: "Show actions" });
    if (await actionsButton.count()) {
      await actionsButton.click();
      await page.waitForTimeout(250);
      appActionsText = (await page.locator("body").innerText({ timeout: 30000 }).catch(() => "")).split(/\r?\n/).map(line => line.trim()).filter(line => /install|update|version|get it|upgrade|remove|delete|sharepoint ui/i.test(line)).slice(-30);
      appActionsScreenshot = `${artifacts}/site-contents-app-actions.png`;
      await page.screenshot({ path: appActionsScreenshot });
    }
  }
  const result = { site: site.href, page: pageUrl.href, loadedBundlePaths: [...new Set(bundlePaths)], publishedPage, themeVariantSamples, publishedPageScreenshot, publishedPageErrors, publishedPageRuntimeExceptions, publishedPageConsoleErrors, siteContentsErrors: pageErrors, siteContentsRuntimeExceptions: runtimeExceptions, siteContentsConsoleErrors: consoleErrors, ...remote, siteContentsUrl: page.url(), siteContentsTitle: await page.title(), appUiLines, appUiControls, siteContentsScreenshot, scrollState, siteContentsBottomScreenshot: bottomScreenshot, siteContentsEndText, appRowControls, appDetailsText, appDetailsScreenshot, appActionsText, appActionsScreenshot };
  writeFileSync(`${artifacts}/deployment-diagnostic.json`, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
} finally { await context?.close(); unlock(); }
