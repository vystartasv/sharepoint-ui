import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
import { contrastRatio } from "./lib/color-contrast.mjs";
import { mkdir, writeFile } from "node:fs/promises";

const bundle = await build({
  stdin: {
    sourcefile: "theme-contrast.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{SharePointUIProvider,Button,Link,Text,Input,Checkbox,Tag,Field,ProgressBar}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";const appearances=["fluent","ios","windows","linux","glass"];const brands=[{name:"blue",color:"#1769aa",strongSurface:"#092b4f"},{name:"green",color:"#217a36",strongSurface:"#153b27"},{name:"pink",color:"#c83282",strongSurface:"#47172f"},{name:"tenant-teal",color:"#007780",strongSurface:"#003c3e"}];const surfaces=[{name:"light",background:"#ffffff",foreground:"#242424",body:"#ffffff",card:"#ffffff"},{name:"strong",background:"#092b4f",foreground:"#ffffff",body:"#092b4f",card:"#103d6b"}];const directions=["ltr","rtl"];const cases=appearances.flatMap(appearance=>brands.flatMap(brand=>surfaces.flatMap(surface=>directions.map(dir=>({appearance,brand,surface,dir})))));function App(){return <>{cases.map(({appearance,brand,surface,dir})=>{const id=brand.name+"-"+appearance+"-"+surface.name+"-"+dir;const sectionBackground=surface.name==="light"?surface.background:brand.strongSurface;return <section key={id} dir={dir} data-testid={"surface-"+id} style={{colorScheme:surface.name==="light"?"light":"dark",backgroundColor:sectionBackground,color:surface.foreground,"--spui-semantic-body-text":surface.foreground,"--spui-semantic-body-background":sectionBackground,"--spui-semantic-card-background":sectionBackground}}><SharePointUIProvider appearance={appearance} dir={dir} theme={{brandColor:brand.color,fluentTokens:{colorStrokeFocus2:"#000000"}}} tokens={{"--spui-color-scheme":surface.name==="light"?"light":"dark"}}>{["primary","secondary","outline","subtle","transparent"].map(buttonAppearance=><React.Fragment key={buttonAppearance}><Button data-testid={"button-"+buttonAppearance+"-"+id} appearance={buttonAppearance}>Action</Button><Button data-testid={"button-disabled-"+buttonAppearance+"-"+id} appearance={buttonAppearance} disabled>Action</Button></React.Fragment>)}<Link data-testid={"link-"+id} href="#">Link</Link><Text data-testid={"text-"+id}>Readable text</Text><Input data-testid={"input-"+id} aria-label="Search" defaultValue="Query"/><Input data-testid={"input-disabled-"+id} aria-label="Disabled search" defaultValue="Query" disabled/><Checkbox data-testid={"checkbox-"+id} aria-label="Select" defaultChecked/><Checkbox data-testid={"checkbox-disabled-"+id} aria-label="Disabled selection" defaultChecked disabled/>{["filled","outline","brand"].flatMap(appearance=>["neutral","success","warning","danger","informative"].map(color=><Tag key={appearance+"-"+color} data-testid={"tag-"+appearance+"-"+color+"-"+id} appearance={appearance} color={color}>Status</Tag>))}<Field label="Error progress" validationState="error"><ProgressBar data-testid={"progress-error-"+id} value={0.5}/></Field><Field label="Warning progress" validationState="warning"><ProgressBar data-testid={"progress-warning-"+id} value={0.5}/></Field><Field label="Success progress" validationState="success"><ProgressBar data-testid={"progress-success-"+id} value={0.5}/></Field><ProgressBar data-testid={"progress-brand-"+id} value={0.5}/></SharePointUIProvider></section>})}</>}createRoot(document.querySelector("#root")).render(<App/>);`,
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});

const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><main id='root'></main><script src='/bundle.js'></script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const errors = [];
  const measurements = [];
  for (const colorScheme of ["light", "dark"]) {
    const page = await browser.newPage({ colorScheme, reducedMotion: "reduce" });
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.waitForSelector('[data-testid="surface-blue-fluent-light-ltr"]');
    for (const appearance of ["fluent", "ios", "windows", "linux", "glass"]) {
    for (const brand of ["blue", "green", "pink", "tenant-teal"]) {
        for (const surface of ["light", "strong"]) {
          for (const dir of ["ltr", "rtl"]) {
        const id = `${brand}-${appearance}-${surface}-${dir}`;
        const root = page.getByTestId(`surface-${id}`);
        const background = await root.evaluate(node => getComputedStyle(node).backgroundColor);
        const link = root.getByTestId(`link-${id}`).locator("a");
        const linkColor = await link.evaluate(node => getComputedStyle(node).color);
        const linkContrast = contrastRatio(linkColor, background);
        assert.ok(linkContrast >= 4.5, `${id} link contrast is ${linkContrast.toFixed(2)}:1 (${linkColor} on ${background})`);
        const visitedColor = await root.getByTestId(`link-${id}`).evaluate(node => {
          const probe = document.createElement("span");
          probe.style.color = "var(--spui-link-visited)";
          node.append(probe);
          const color = getComputedStyle(probe).color;
          probe.remove();
          return color;
        });
        const visitedContrast = contrastRatio(visitedColor, background);
        assert.ok(visitedContrast >= 4.5, `${id} visited-link role contrast is ${visitedContrast.toFixed(2)}:1 (${visitedColor} on ${background})`);
        const text = root.getByTestId(`text-${id}`);
        const textColor = await text.evaluate(node => getComputedStyle(node.shadowRoot.querySelector(".text")).color);
        const textContrast = contrastRatio(textColor, background);
        assert.ok(textContrast >= 4.5, `${id} body text contrast is ${textContrast.toFixed(2)}:1 (${textColor} on ${background})`);

        const buttonContrasts = {};
        for (const appearance of ["primary", "secondary", "outline", "subtle", "transparent"]) {
          const button = root.getByTestId(`button-${appearance}-${id}`).locator("button");
          for (const state of ["rest", "hover"]) {
            await page.mouse.move(0, 0);
            if (state === "hover") await button.hover();
            const colors = await button.evaluate(node => ({ foreground: getComputedStyle(node).color, background: getComputedStyle(node).backgroundColor }));
            const contrast = contrastRatio(colors.foreground, colors.background, background);
            buttonContrasts[`${appearance}-${state}`] = Number(contrast.toFixed(2));
            assert.ok(contrast >= 4.5, `${id} ${appearance} button ${state} contrast is ${contrast.toFixed(2)}:1 (${colors.foreground} on ${colors.background})`);
          }
        }
        const disabledColors = await root.evaluate((node, { surfaceBackground }) => {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 1;
          const context = canvas.getContext("2d", { willReadFrequently: true });
          const flattened = (top, bottom, opacity) => {
            context.clearRect(0, 0, 1, 1);
            context.globalAlpha = 1;
            context.fillStyle = bottom;
            context.fillRect(0, 0, 1, 1);
            context.globalAlpha = opacity;
            context.fillStyle = top;
            context.fillRect(0, 0, 1, 1);
            context.globalAlpha = 1;
            const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
            return "rgb(" + r + " " + g + " " + b + ")";
          };
          const read = (element, pseudo = null) => {
            const style = getComputedStyle(element);
            const foreground = pseudo ? getComputedStyle(element, pseudo).color : style.color;
            const opacity = Number(style.opacity) || 0;
            const background = flattened(style.backgroundColor, surfaceBackground, opacity);
            return { foreground: flattened(foreground, background, opacity), background, opacity, disabled: element.disabled === true };
          };
          const buttons = [...node.querySelectorAll('spui-button[data-testid^="button-disabled-"]')].map(host => {
            const element = host.shadowRoot.querySelector("button");
            return { appearance: host.getAttribute("appearance"), ...read(element) };
          });
          const inputHost = node.querySelector('spui-input[data-testid^="input-disabled-"]');
          const input = inputHost.shadowRoot.querySelector("input");
          const checkboxHost = node.querySelector('spui-checkbox[data-testid^="checkbox-disabled-"]');
          const checkbox = checkboxHost.shadowRoot.querySelector("input");
          return { buttons, input: read(input), checkbox: read(checkbox, "::before") };
        }, { surfaceBackground: background });
        const disabledContrasts = Object.fromEntries([
          ...disabledColors.buttons.map(item => [item.appearance + " Button", item]),
          ["Input", disabledColors.input],
          ["checked Checkbox", disabledColors.checkbox],
        ].map(([name, colors]) => {
          assert.equal(colors.disabled, true, id + " " + name + " must be disabled during measurement");
          return [name, { contrast: Number(contrastRatio(colors.foreground, colors.background).toFixed(2)), foreground: colors.foreground, background: colors.background, opacity: colors.opacity }];
        }));
        const inputHost = root.getByTestId(`input-${id}`);
        const inputControl = inputHost.locator(".control");
        await inputHost.locator("input").focus();
        const inputColors = await inputControl.evaluate(node => ({ border: getComputedStyle(node).borderBlockStartColor, background: getComputedStyle(node).backgroundColor }));
        const focusBorderContrast = contrastRatio(inputColors.border, inputColors.background === "rgba(0, 0, 0, 0)" ? background : inputColors.background);
        assert.ok(focusBorderContrast >= 3, `${id} focused input border contrast is ${focusBorderContrast.toFixed(2)}:1 (${inputColors.border} on ${inputColors.background})`);
        const checkbox = root.getByTestId(`checkbox-${id}`).locator("input");
        const checkboxColors = await checkbox.evaluate(node => ({ foreground: getComputedStyle(node, "::before").color, background: getComputedStyle(node).backgroundColor }));
        const checkedIndicatorContrast = contrastRatio(checkboxColors.foreground, checkboxColors.background);
        assert.ok(checkedIndicatorContrast >= 3, `${id} checked indicator contrast is ${checkedIndicatorContrast.toFixed(2)}:1 (${checkboxColors.foreground} on ${checkboxColors.background})`);
        const tagColors = await root.evaluate(node => [...node.querySelectorAll("spui-tag")].map(tag => ({ appearance: tag.getAttribute("appearance"), color: tag.getAttribute("color"), foreground: getComputedStyle(tag.shadowRoot.querySelector(".label")).color, background: getComputedStyle(tag).backgroundColor })));
        const tags = {};
        for (const result of tagColors) {
          const contrast = contrastRatio(result.foreground, result.background);
          const key = result.appearance + "-" + result.color;
          tags[key] = { contrast: Number(contrast.toFixed(2)), foreground: result.foreground, background: result.background };
          assert.ok(contrast >= 4.5, id + " " + key + " Tag text contrast is " + contrast.toFixed(2) + ":1 (" + result.foreground + " on " + result.background + ")");
        }
        const progressIndicators = {};
        for (const status of ["brand", "success", "warning", "error"]) {
          const progress = root.getByTestId(`progress-${status}-${id}`);
          const colors = await progress.evaluate(node => ({ fill: getComputedStyle(node.shadowRoot.querySelector(".indicator")).backgroundColor, track: getComputedStyle(node.shadowRoot.querySelector(".track")).backgroundColor }));
          progressIndicators[status] = { contrast: Number(contrastRatio(colors.fill, colors.track, background).toFixed(2)), fill: colors.fill, track: colors.track };
        }
        measurements.push({ colorScheme, appearance, brand, surface, dir, disabledContrasts, link: Number(linkContrast.toFixed(2)), visitedLinkRole: Number(visitedContrast.toFixed(2)), text: Number(textContrast.toFixed(2)), focusBorder: Number(focusBorderContrast.toFixed(2)), checkedIndicator: Number(checkedIndicatorContrast.toFixed(2)), progressIndicators, buttons: buttonContrasts, tags });
          }
        }
      }
    }
    await page.close();
  }
  assert.deepEqual(errors, [], "no browser errors");
  const textChecks = measurements.flatMap(entry => [
    { ...entry, control: "Link", contrast: entry.link },
    { ...entry, control: "visited link role", contrast: entry.visitedLinkRole },
    { ...entry, control: "Text", contrast: entry.text },
    ...Object.entries(entry.buttons).map(([state, contrast]) => ({ ...entry, control: `${state} Button`, contrast })),
    ...Object.entries(entry.tags).map(([color, result]) => ({ ...entry, control: `${color} Tag text`, contrast: result.contrast }))
  ]);
  const tagChecks = measurements.flatMap(entry => Object.entries(entry.tags).map(([color, result]) => ({ ...entry, control: `${color} Tag text`, contrast: result.contrast, foreground: result.foreground, background: result.background })));
  const nonTextChecks = measurements.flatMap(entry => [
    { ...entry, control: "focused Input border", contrast: entry.focusBorder },
    { ...entry, control: "checked Checkbox indicator", contrast: entry.checkedIndicator }
  ]);
  const lowest = checks => checks.reduce((minimum, entry) => entry.contrast < minimum.contrast ? entry : minimum);
  const summarize = ({ colorScheme, appearance, brand, surface, dir, control, contrast, foreground, background, fill, track }) => ({ colorScheme, appearance, brand, surface, dir, control, contrast, foreground, background, fill, track });
  const disabledChecks = measurements.flatMap(entry => Object.entries(entry.disabledContrasts).map(([control, result]) => ({ ...entry, control: "Disabled " + control, ...result })));
  const disabledControlMinima = Object.fromEntries([...new Set(disabledChecks.map(entry => entry.control))].map(control => [control, summarize(lowest(disabledChecks.filter(entry => entry.control === control)))]));
  const progressChecks = measurements.flatMap(entry => Object.entries(entry.progressIndicators).map(([status, result]) => ({ ...entry, control: `ProgressBar ${status} fill against track`, ...result })));
  const failingProgressChecks = progressChecks.filter(entry => entry.contrast < 3);
  const progressPass = failingProgressChecks.length === 0;
  const worstProgressCases = [...failingProgressChecks].sort((a, b) => a.contrast - b.contrast).slice(0, 20).map(({ colorScheme, appearance, brand, surface, dir, control, contrast, fill, track }) => ({ colorScheme, appearance, brand, surface, dir, control, contrast, fill, track }));
  const report = { status: progressPass ? "passed" : "failed", cases: measurements.length, controlStates: measurements.length * 41, matrix: { colorSchemes: ["light", "dark"], appearances: 5, brands: ["blue", "green", "pink", "tenant teal #007780"], surfaces: ["light", "brand-paired strong section (blue #092b4f, green #153b27, pink #47172f, tenant teal #003c3e)"], directions: ["ltr", "rtl"], siteFocusToken: "#000000", controls: ["Link", "visited-link role", "Text", "five Button appearances at rest and hover", "focused Input border", "checked Checkbox indicator", "disabled Button/Input/checked Checkbox (opacity-composited telemetry)", "15 Tag appearance/color combinations", "ProgressBar brand/success/warning/error fills"] }, minimumText: summarize(lowest(textChecks)), minimumTagText: summarize(lowest(tagChecks)), minimumNonText: summarize(lowest(nonTextChecks)), minimumCheckedIndicator: summarize(lowest(measurements.map(entry => ({ ...entry, control: "checked Checkbox indicator", contrast: entry.checkedIndicator })))), minimumProgressIndicator: summarize(lowest(progressChecks)), minimumDisabledControlText: summarize(lowest(disabledChecks)), disabledControlMinima, disabledControlThreshold: "measured and reported; disabled UI contrast is not treated as a WCAG 1.4.3 failure", progressIndicatorContrastPass: progressPass, failingProgressCaseCount: failingProgressChecks.length, worstProgressCases, pageErrors: errors };
  await mkdir("test-results/theme-contrast", { recursive: true });
  await writeFile("test-results/theme-contrast/results.json", JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
  assert.equal(failingProgressChecks.length, 0, `ProgressBar indicator contrast must be at least 3:1 against its track; worst is ${lowest(progressChecks).contrast}:1`);
} finally {
  await browser?.close();
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
}
