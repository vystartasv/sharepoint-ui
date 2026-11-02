import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const presets = {
  Body1: [300, "regular"], Body1Strong: [300, "semibold"], Body1Stronger: [300, "bold"], Body2: [400, "regular"],
  Caption1: [200, "regular"], Caption1Strong: [200, "semibold"], Caption1Stronger: [200, "bold"], Caption2: [100, "regular"],
  Caption2Strong: [100, "semibold"], Display: [1100, "semibold"], LargeTitle: [900, "semibold"], Subtitle1: [500, "semibold"],
  Subtitle2: [400, "semibold"], Subtitle2Stronger: [400, "bold"], Title1: [800, "semibold"], Title2: [700, "semibold"], Title3: [600, "semibold"],
};
const names = Object.keys(presets);
const sizes = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200];
const imports = `import * as React from "react";import{createRoot}from"react-dom/client";import{webLightTheme}from"@fluentui/react-theme";import{SharePointUIProvider,Text,${names.join(",")}}from"${resolve("packages/sharepoint-ui/src/react.tsx")}";window.fluentTheme=webLightTheme;`;
const children = names.map(name => `React.createElement(${name},{key:"${name}","data-testid":"${name}"},"${name}")`).join(",");
const sizeChildren = sizes.map(size => `React.createElement(Text,{key:"size-${size}",size:${size},"data-testid":"size-${size}"},"Size ${size}")`).join(",");
const bundle = await build({
  stdin: { contents: `${imports}createRoot(document.querySelector("#react")).render(React.createElement(SharePointUIProvider,{fluentTokens:webLightTheme},React.createElement(React.Fragment,null,React.createElement(Text,{"data-testid":"text-default",className:"parity-text",title:"Text host props"},"Default"),React.createElement(Text,{as:"b","data-testid":"text-bold"},"Bold"),React.createElement(Text,{as:"i","data-testid":"text-italic"},"Italic"),${children},${sizeChildren},React.createElement(Text,{size:1100,"data-testid":"size-1100-custom",style:{"--spui-text-font-size-1100":"72px","--spui-text-line-height-1100":"88px"}},"Custom display"),React.createElement(SharePointUIProvider,{theme:{typography:{fontFamilyMono:'"Cascadia Code", monospace',fontSize700:"30px",lineHeight700:"38px",fontSize1000:"64px",lineHeight1000:"84px",fontSize1100:"72px",lineHeight1100:"88px",fontSize1200:"88px",lineHeight1200:"108px"}}},React.createElement(React.Fragment,null,React.createElement(Text,{font:"monospace","data-testid":"typed-monospace"},"Monospace"),React.createElement(Text,{as:"code","data-testid":"typed-code"},"Code"),React.createElement(Text,{as:"pre","data-testid":"typed-pre"},"Pre"),React.createElement(Text,{size:700,"data-testid":"semantic-hero-700"},"Hero 700"),React.createElement(Text,{size:1000,"data-testid":"semantic-hero-1000"},"Hero 1000"),React.createElement(Text,{size:1100,"data-testid":"semantic-hero-1100"},"Hero 1100"),React.createElement(Text,{size:1200,"data-testid":"semantic-hero-1200"},"Hero 1200"))))));`, resolveDir: process.cwd(), sourcefile: "text-presets.tsx", loader: "tsx" },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});
const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><div id='react'></div><script src='/bundle.js'></script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  assert.equal(await page.getByTestId("text-default").getAttribute("size"), "300", "Fluent Text default size is 300");
  assert.equal(await page.getByTestId("text-default").getAttribute("class"), "parity-text", "React Text forwards className to its custom-element host");
  assert.equal(await page.getByTestId("text-default").getAttribute("title"), "Text host props", "React Text forwards inherited native title props");
  assert.equal(await page.getByTestId("text-bold").evaluate(node => node.shadowRoot.querySelector(".text").localName), "b", "bold semantic element is supported");
  assert.equal(await page.getByTestId("text-italic").evaluate(node => node.shadowRoot.querySelector(".text").localName), "i", "italic semantic element is supported");
  for (const [name, [size, weight]] of Object.entries(presets)) {
    const element = page.getByTestId(name);
    assert.equal(await element.getAttribute("size"), String(size), `${name} maps to Fluent typography size`);
    assert.equal(await element.getAttribute("weight"), weight, `${name} maps to Fluent typography weight`);
    assert.equal(await element.textContent(), name);
  }
  for (const size of sizes) {
    const element = page.getByTestId(`size-${size}`);
    const tokenPrefix = size <= 600 ? "Base" : "Hero";
    const tokenSize = size <= 600 ? size : size;
    const actual = await element.evaluate(node => { const style = getComputedStyle(node.shadowRoot.querySelector(".text")); return { fontSize: style.fontSize, lineHeight: style.lineHeight }; });
    const expected = size <= 600 ? await page.evaluate(({ fontSize, lineHeight }) => ({ fontSize: window.fluentTheme[fontSize], lineHeight: window.fluentTheme[lineHeight] }), { fontSize: `fontSize${tokenPrefix}${tokenSize}`, lineHeight: `lineHeight${tokenPrefix}${tokenSize}` }) : size <= 1000 ? await page.evaluate(({ fontSize, lineHeight }) => ({ fontSize: window.fluentTheme[fontSize], lineHeight: window.fluentTheme[lineHeight] }), { fontSize: `fontSize${tokenPrefix}${tokenSize}`, lineHeight: `lineHeight${tokenPrefix}${tokenSize}` }) : { fontSize: size === 1100 ? "80px" : "96px", lineHeight: size === 1100 ? "104px" : "128px" };
    assert.deepEqual(actual, expected, `size ${size} resolves to the correct Fluent token or local extended fallback`);
  }
  const customDisplay = await page.getByTestId("size-1100-custom").evaluate(node => { const style = getComputedStyle(node.shadowRoot.querySelector(".text")); return { fontSize: style.fontSize, lineHeight: style.lineHeight }; });
  assert.deepEqual(customDisplay, { fontSize: "72px", lineHeight: "88px" }, "local display sizes accept direct component token overrides");
  for (const [testId, expected] of [["semantic-hero-700", { fontSize: "30px", lineHeight: "38px" }], ["semantic-hero-1000", { fontSize: "64px", lineHeight: "84px" }], ["semantic-hero-1100", { fontSize: "72px", lineHeight: "88px" }], ["semantic-hero-1200", { fontSize: "88px", lineHeight: "108px" }]]) {
    const actual = await page.getByTestId(testId).evaluate(node => { const style = getComputedStyle(node.shadowRoot.querySelector(".text")); return { fontSize: style.fontSize, lineHeight: style.lineHeight }; });
    assert.deepEqual(actual, expected, `${testId} maps typed semantic typography roles to the Fluent hero ramp`);
  }
  for (const testId of ["typed-monospace", "typed-code", "typed-pre"]) {
    const actual = await page.getByTestId(testId).evaluate(node => getComputedStyle(node.shadowRoot.querySelector(".text")).fontFamily);
    assert.match(actual, /Cascadia Code/, `${testId} uses typed typography.fontFamilyMono`);
  }
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify({ status: "passed", textDefault300: true, presetCount: names.length, allPresetSizesAndWeights: true, allFluentAndExtendedSizes: sizes, heroTypographyTokenMapping: true, extendedTypedTypographyTokens: [1100, 1200], customExtendedSizeTokens: true, typedMonospaceFamily: ["font=monospace", "as=code", "as=pre"], semanticBoldAndItalicTags: true, pageErrors: errors }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
