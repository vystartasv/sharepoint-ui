import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const [siteUrl = "https://workswithagents.sharepoint.com/sites/spfx-validation-lab", profileDir = "/Users/vilius/.playwright-profiles/profile-3"] = process.argv.slice(2);
const site = new URL(siteUrl);
if (site.protocol !== "https:") throw new TypeError("SharePoint URL must use HTTPS.");

const researchRepo = "/Users/vilius/.t3/projects/spfx-research";
const localManifestDirectory = resolve("examples/spfx124-webpart/release/manifests");
const localManifestFile = readdirSync(localManifestDirectory).find(file => file.endsWith(".manifest.json"));
if (!localManifestFile) throw new Error("Build the SPFx package before running the live theme iteration.");
const localManifest = JSON.parse(readFileSync(resolve(localManifestDirectory, localManifestFile), "utf8"));
const expectedBundle = localManifest.loaderConfig.scriptResources["library-demo-web-part"].path;
const require = createRequire(import.meta.url);
const { chromium } = require(`${researchRepo}/node_modules/playwright`);
const { acquireProfileLock } = await import(pathToFileURL(`${researchRepo}/packages/playwright/src/profile-lock.js`));
const pageUrl = new URL("SitePages/SharePointUIParityLab035.aspx", `${site.href.replace(/\/$/, "")}/`).href;
const artifacts = resolve("test-results/theme-iterations");
mkdirSync(artifacts, { recursive: true });
const unlock = acquireProfileLock(profileDir);
let context;

async function postApi(page, path, body) {
  return page.evaluate(async ({ path, body }) => {
    const base = new URL(location.href);
    const api = `${base.origin}${base.pathname.split("/").slice(0, 3).join("/")}/_api`;
    const accept = "application/json;odata=nometadata";
    const digestResponse = await fetch(`${api}/contextinfo`, { method: "POST", headers: { Accept: accept } });
    if (!digestResponse.ok) throw new Error(`SharePoint context digest failed (${digestResponse.status}).`);
    const digest = (await digestResponse.json()).FormDigestValue;
    const response = await fetch(`${api}${path}`, {
      method: "POST",
      headers: { Accept: accept, "Content-Type": "application/json;odata=nometadata", "X-RequestDigest": digest },
      body: JSON.stringify(body)
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`SharePoint theme API failed (${response.status}): ${text.slice(0, 400)}`);
    return text ? JSON.parse(text) : {};
  }, { path, body });
}

const mix = (hex, target, amount) => {
  const rgb = hex.slice(1).match(/../g).map(value => parseInt(value, 16));
  const to = target === "white" ? [255, 255, 255] : [0, 0, 0];
  return "#" + rgb.map((channel, index) => Math.round(channel * (1 - amount) + to[index] * amount).toString(16).padStart(2, "0")).join("");
};
const presets = [
  { name: "SharePoint UI Blue Iteration", slug: "blue", accent: "#0078d4" },
  { name: "SharePoint UI Green Iteration", slug: "green", accent: "#107c10" },
  { name: "SharePoint UI Pink Iteration", slug: "pink", accent: "#e3008c" }
];
const paletteFor = (accent, original) => ({
  ...original,
  themeDarker: mix(accent, "black", 0.62),
  themeDark: mix(accent, "black", 0.44),
  themeDarkAlt: mix(accent, "black", 0.28),
  themePrimary: accent,
  themeSecondary: mix(accent, "black", 0.1),
  themeTertiary: mix(accent, "white", 0.28),
  themeLight: mix(accent, "white", 0.58),
  themeLighter: mix(accent, "white", 0.78),
  themeLighterAlt: mix(accent, "white", 0.93),
  accent,
  backgroundColor: original.backgroundColor ?? "#ffffff",
  white: original.white ?? "#ffffff",
  black: original.black ?? "#000000"
});

try {
  context = await chromium.launchPersistentContext(profileDir, { headless: true, serviceWorkers: "block", viewport: { width: 1440, height: 1000 } });
  const page = context.pages()[0] ?? await context.newPage();
  const targetResponses = [];
  page.on("response", response => {
    if (response.url().includes("library-demo-web-part")) targetResponses.push(response.url());
  });
  await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  if (page.url().includes("login.microsoftonline.com")) throw new Error("The signed-in SharePoint profile is unavailable.");
  await page.getByRole("heading", { name: "SharePoint UI Lab" }).waitFor({ timeout: 90000 });
  await page.waitForFunction(expected => performance.getEntriesByType("resource").some(entry => entry.name.endsWith(expected)), expectedBundle, { timeout: 30000 }).catch(() => {
    throw new Error(`SharePoint is serving a stale web part bundle; expected ${expectedBundle}. Upgrade the installed app before capturing theme results.`);
  });

  const original = await page.evaluate(async () => {
    const root = document.querySelector("div[data-spui-appearance]");
    if (!root) throw new Error("The SharePoint UI web part root was not found.");
    const palette = {};
    for (const property of [...root.style]) {
      const match = /^--spui-palette-(.+)$/.exec(property);
      const value = root.style.getPropertyValue(property).trim();
      if (match && /^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(value)) {
        palette[match[1].replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
      }
    }
    if (!palette.themePrimary) throw new Error("Could not read the current SharePoint palette before testing.");
    const response = await fetch(`${location.pathname.split("/").slice(0, 3).join("/")}/_api/web/ThemeInfo`, { headers: { Accept: "application/json;odata=nometadata" } });
    const info = response.ok ? await response.json() : {};
    return { palette, description: info.AccessibleDescription ?? "Previous SharePoint theme", background: info.ThemeBackgroundImageUri ?? null };
  });
  const originalThemeJson = {
    palette: original.palette,
    secondaryColors: {
      light: [
        { themePrimary: "#FFFFFF", backgroundColor: "#007780" },
        { themePrimary: "#E3FFFD", backgroundColor: "#007780" },
        { themePrimary: "#007780", backgroundColor: "#E3FFFD" },
        { themePrimary: "#FFF9E3", backgroundColor: "#007780" },
        { themePrimary: "#007780", backgroundColor: "#FFF9E3" },
        { themePrimary: "#007780", backgroundColor: "#F5F5F5" },
        { themePrimary: "#242424", backgroundColor: "#F5F5F5" },
        { themePrimary: "#155473", backgroundColor: "#FFFFFF" },
        { themePrimary: "#FFFFFF", backgroundColor: "#155473" },
        { themePrimary: "#155473", backgroundColor: "#E3FFFD" },
        { themePrimary: "#E3FFFD", backgroundColor: "#155473" },
        { themePrimary: "#FFF9E3", backgroundColor: "#155473" }
      ],
      dark: []
    },
    displayMode: "light",
    themeSchemaVersion: "2.0.0",
    version: "2.0.0"
  };
  const results = [];
  let restore = { attempted: false, succeeded: false };
  try {
    for (const preset of presets) {
      const themeJson = { palette: paletteFor(preset.accent, original.palette), themeSchemaVersion: "1.0.0", version: "1.0.0" };
      await postApi(page, "/thememanager/ApplyTheme", { name: preset.name, themeJson: JSON.stringify(themeJson) });
      await page.waitForTimeout(2500);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { name: "SharePoint UI Lab" }).waitFor({ timeout: 90000 });
      await page.waitForFunction(expected => performance.getEntriesByType("resource").some(entry => entry.name.endsWith(expected)), expectedBundle, { timeout: 30000 }).catch(() => {
        throw new Error(`The published page stopped loading expected bundle ${expectedBundle} during theme iteration.`);
      });

      const accentControl = page.getByRole("combobox", { name: "Color theme" });
      if (await accentControl.count()) await accentControl.selectOption("tenant");
      const appearance = page.getByRole("combobox", { name: "Base appearance" });
      if (await appearance.count()) await appearance.selectOption("ios");
      const glass = page.getByRole("checkbox", { name: "Glass finish" });
      if (await glass.count() && !(await glass.isChecked())) await glass.check();
      await page.waitForTimeout(500);

      const root = page.getByRole("heading", { name: "SharePoint UI Lab" }).locator("xpath=ancestor::div[@data-spui-appearance][1]");
      await root.scrollIntoViewIfNeeded();
      const metrics = await root.evaluate(element => {
        const style = getComputedStyle(element);
        const button = element.querySelector('spui-button[variant="primary"]')?.shadowRoot?.querySelector("button");
        const field = element.querySelector("spui-field")?.shadowRoot?.querySelector("input");
        const avatar = element.querySelector('spui-avatar[name="Amara Okafor"]');
        const avatarSurface = avatar?.shadowRoot?.querySelector(".surface");
        return {
          appearance: element.dataset.spuiAppearance,
          baseAppearance: element.querySelector("spui-card")?.getAttribute("data-spui-base-appearance") ?? null,
          palettePrimary: style.getPropertyValue("--spui-palette-theme-primary").trim(),
          semanticPrimary: style.getPropertyValue("--spui-semantic-primary-button-background").trim(),
          derivedGlassAccent: style.getPropertyValue("--spui-base-accent").trim(),
          glassCardBackground: style.getPropertyValue("--spui-card-background").trim(),
          canvas: style.getPropertyValue("--spui-ui-canvas").trim(),
          glassSurface: style.getPropertyValue("--spui-ui-surface").trim(),
          actionBackground: button ? getComputedStyle(button).backgroundColor : null,
          fieldFocusToken: field ? getComputedStyle(field).getPropertyValue("--spui-focus-ring").trim() : null,
          personAvatar: avatar && avatarSurface ? {
            label: avatar.getAttribute("aria-label"),
            initials: avatar.shadowRoot.querySelector(".initials")?.textContent ?? "",
            size: getComputedStyle(avatar).width,
            background: getComputedStyle(avatarSurface).backgroundColor,
            foreground: getComputedStyle(avatarSurface).color,
            themeColor: style.getPropertyValue("--spui-palette-theme-primary").trim(),
            derivedColor: getComputedStyle(avatar).getPropertyValue("--spui-avatar-colorful-background").trim()
          } : null,
          libraryMount: [...element.querySelectorAll("dt")].find(node => node.textContent?.trim() === "Library mount")?.nextElementSibling?.textContent?.trim() ?? null,
          themeEntries: [...element.querySelectorAll("dt")].find(node => node.textContent?.trim() === "SP theme entries")?.nextElementSibling?.textContent?.trim() ?? null,
          fluentTokens: [...element.querySelectorAll("dt")].find(node => node.textContent?.trim() === "Fluent v9 tokens")?.nextElementSibling?.textContent?.trim() ?? null,
          renderedElements: [...element.querySelectorAll("dt")].find(node => node.textContent?.trim() === "Library elements on page")?.nextElementSibling?.textContent?.trim() ?? null,
          longTasks: [...element.querySelectorAll("dt")].find(node => node.textContent?.trim() === "Page long tasks")?.nextElementSibling?.textContent?.trim() ?? null,
          jsHeap: [...element.querySelectorAll("dt")].find(node => node.textContent?.trim() === "JS heap")?.nextElementSibling?.textContent?.trim() ?? null
        };
      });
      const screenshot = `${artifacts}/${preset.slug}.png`;
      const avatarScreenshot = `${artifacts}/${preset.slug}-person-card.png`;
      const bounds = await root.boundingBox();
      const viewport = page.viewportSize();
      if (!bounds || !viewport) throw new Error("Could not measure the web part for a clipped screenshot.");
      await page.screenshot({
        path: screenshot,
        clip: {
          x: Math.max(0, bounds.x),
          y: Math.max(0, bounds.y + 160),
          width: Math.min(bounds.width, viewport.width - Math.max(0, bounds.x)),
          height: Math.min(560, viewport.height - Math.max(0, bounds.y + 160))
        }
      });
      const personCard = page.locator('spui-view-card[kind="person"]');
      await personCard.screenshot({ path: avatarScreenshot });
      results.push({ theme: preset.name, expectedAccent: preset.accent, screenshot, avatarScreenshot, bundle: targetResponses.at(-1) ?? null, metrics });
      if (metrics.palettePrimary.toLowerCase() !== preset.accent) throw new Error(`${preset.name} did not reach the rendered web part (expected ${preset.accent}, received ${metrics.palettePrimary || "empty"}).`);
      if (!metrics.personAvatar || metrics.personAvatar.label !== "Amara Okafor" || metrics.personAvatar.initials !== "AO" || !metrics.personAvatar.background) throw new Error(`${preset.name} did not render the accessible person Avatar.`);
    }
    if (new Set(results.map(result => result.metrics.personAvatar.derivedColor)).size !== presets.length) throw new Error("The colorful Avatar did not derive a distinct background from each SharePoint theme.");
  } finally {
    restore.attempted = true;
    await postApi(page, "/thememanager/ApplyTheme", { name: original.description, themeJson: JSON.stringify(originalThemeJson) });
    await page.waitForTimeout(2500);
    await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.getByRole("heading", { name: "SharePoint UI Lab" }).waitFor({ timeout: 90000 });
    const restoredState = await page.evaluate(async expected => {
      const root = document.querySelector("div[data-spui-appearance]");
      const response = await fetch(`${location.pathname.split("/").slice(0, 3).join("/")}/_api/web/ThemeInfo`, { headers: { Accept: "application/json;odata=nometadata" } });
      const theme = response.ok ? await response.json() : {};
      return {
        primaryRestored: root?.style.getPropertyValue("--spui-palette-theme-primary").trim().toLowerCase() === expected.toLowerCase(),
        description: theme.AccessibleDescription ?? null
      };
    }, original.palette.themePrimary);
    restore.succeeded = restoredState.primaryRestored;
    restore.descriptionMatches = restoredState.description === original.description;
    restore.restoredDescription = restoredState.description;
    if (!restore.descriptionMatches) restore.note = "The original primary accent was restored; SharePoint normalized the accessible description for this palette JSON.";
  }
  const report = { page: pageUrl, expectedBundle, originalTheme: original.description, originalAccent: original.palette.themePrimary, results, restore, finalBundle: targetResponses.at(-1) ?? null };
  writeFileSync(resolve(artifacts, "results.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!restore.succeeded) throw new Error("The original SharePoint theme could not be verified after restoration.");
} finally {
  await context?.close();
  unlock();
}
