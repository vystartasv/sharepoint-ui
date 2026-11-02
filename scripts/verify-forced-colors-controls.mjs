import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const root = resolve(process.cwd());
const bundle = await build({
  stdin: {
    sourcefile: "forced-colors-controls.tsx",
    loader: "tsx",
    resolveDir: root,
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{Button,Tag,Input,Checkbox,ProgressBar,Rating,RatingDisplay}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";createRoot(document.querySelector("#root")).render(<><Button appearance="primary" data-testid="primary">Save</Button><Input data-testid="input" aria-label="Search"/><Checkbox data-testid="checkbox-checked" aria-label="Select" defaultChecked/><Checkbox data-testid="checkbox-unchecked" aria-label="Other"/><ProgressBar data-testid="progress-brand" value={.5}/><Rating data-testid="rating" label="Priority" value={3} readOnly/><RatingDisplay data-testid="rating-display" label="Priority display" value={3}/>{["success","warning","error"].map(color=><ProgressBar key={color} data-testid={"progress-"+color} color={color} value={.5}/>)}{["neutral","success","warning","danger","informative"].flatMap(color=>["filled","outline","brand"].map(appearance=><Tag key={color+appearance} data-testid={"tag-"+color+"-"+appearance} color={color} appearance={appearance} selected={color==="success"}>Status</Tag>))}</>);`,
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
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ forcedColors: "active", reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForSelector('[data-testid="tag-neutral-filled"]');
  const system = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.cssText = "position:fixed;color:CanvasText;background:Canvas;outline:1px solid Highlight";
    document.body.append(probe);
    const style = getComputedStyle(probe);
    probe.style.color = "HighlightText";
    const values = { text: getComputedStyle(probe).color, canvas: style.backgroundColor, highlight: style.outlineColor, highlightText: getComputedStyle(probe).color };
    probe.style.color = "CanvasText";
    values.text = getComputedStyle(probe).color;
    probe.remove();
    return values;
  });
  assert.equal(await page.evaluate(() => matchMedia("(forced-colors: active)").matches), true);

  const tags = [];
  for (const color of ["neutral", "success", "warning", "danger", "informative"]) {
    for (const appearance of ["filled", "outline", "brand"]) {
      const host = page.getByTestId(`tag-${color}-${appearance}`);
      const result = await host.evaluate(element => {
        const label = getComputedStyle(element.shadowRoot.querySelector(".label"));
        const hostStyle = getComputedStyle(element);
        return { text: label.color, background: hostStyle.backgroundColor, border: hostStyle.borderTopColor, selected: element.hasAttribute("selected") };
      });
      assert.equal(result.text, system.text, `${color}/${appearance} Tag text must use CanvasText in forced colors`);
      assert.equal(result.background, system.canvas, `${color}/${appearance} Tag background must use Canvas in forced colors`);
      assert.equal(result.border, system.text, `${color}/${appearance} Tag border must use CanvasText in forced colors`);
      if (result.selected) assert.equal(await host.evaluate(element => getComputedStyle(element).outlineColor), system.highlight, "selected Tag outline must use Highlight");
      tags.push({ color, appearance, ...result });
    }
  }

  const primary = page.getByTestId("primary").locator("button");
  const button = await primary.evaluate(element => ({ text: getComputedStyle(element).color, background: getComputedStyle(element).backgroundColor, border: getComputedStyle(element).borderTopColor }));
  assert.deepEqual(button, { text: system.highlightText, background: system.highlight, border: system.highlight }, "primary Button uses system highlight colors");

  const inputHost = page.getByTestId("input");
  await inputHost.locator("input").focus();
  assert.equal(await inputHost.evaluate(element => getComputedStyle(element.shadowRoot.querySelector(".control")).outlineStyle), "solid", "focused Input keeps a visible outline");
  assert.equal(await inputHost.evaluate(element => getComputedStyle(element.shadowRoot.querySelector(".control")).outlineColor), system.highlight, "focused Input outline uses Highlight");

  const checkboxes = {};
  for (const state of ["checked", "unchecked"]) {
    const host = page.getByTestId(`checkbox-${state}`);
    await host.locator("input").focus();
    checkboxes[state] = await host.evaluate(element => {
      const indicator = getComputedStyle(element.shadowRoot.querySelector(".indicator"));
      return { background: indicator.backgroundColor, border: indicator.borderTopColor, outline: indicator.outlineColor };
    });
    assert.equal(checkboxes[state].outline, system.highlight, `${state} Checkbox focus uses Highlight`);
    if (state === "checked") {
      assert.equal(checkboxes[state].background, system.highlight, "checked Checkbox uses Highlight");
      assert.equal(checkboxes[state].border, system.highlight, "checked Checkbox border uses Highlight");
    } else {
      assert.equal(checkboxes[state].background, system.canvas, "unchecked Checkbox uses Canvas");
      assert.equal(checkboxes[state].border, system.text, "unchecked Checkbox uses CanvasText");
    }
  }

  const rating = await page.getByTestId("rating").evaluate(element => ({ empty: getComputedStyle(element.shadowRoot.querySelector(".icon")).color, filled: getComputedStyle(element.shadowRoot.querySelector(".fill")).color }));
  assert.equal(rating.empty, system.text, "Rating empty stars use CanvasText in forced colors");
  assert.equal(rating.filled, system.highlight, "Rating filled stars use Highlight in forced colors");
  const ratingDisplay = await page.getByTestId("rating-display").evaluate(element => { const item = element.shadowRoot.querySelector("spui-rating-item"); return { empty: getComputedStyle(item.shadowRoot.querySelector(".outline")).color, filled: getComputedStyle(item.shadowRoot.querySelector(".filled")).color }; });
  assert.equal(ratingDisplay.empty, system.text, "RatingDisplay empty stars use CanvasText in forced colors");
  assert.equal(ratingDisplay.filled, system.highlight, "RatingDisplay filled stars use Highlight in forced colors");

  const progress = {};
  for (const color of ["brand", "success", "warning", "error"]) {
    progress[color] = await page.getByTestId(`progress-${color}`).evaluate(element => ({
      fill: getComputedStyle(element.shadowRoot.querySelector(".indicator")).backgroundColor,
      track: getComputedStyle(element.shadowRoot.querySelector(".track")).backgroundColor,
      border: getComputedStyle(element.shadowRoot.querySelector(".track")).borderTopColor,
    }));
    assert.equal(progress[color].fill, system.highlight, `${color} ProgressBar fill uses Highlight`);
    assert.equal(progress[color].track, system.canvas, `${color} ProgressBar track uses Canvas`);
    assert.equal(progress[color].border, system.text, `${color} ProgressBar track border uses CanvasText`);
  }
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify({ status: "passed", forcedColors: true, system, tagCases: tags.length, button, checkboxes, progress, pageErrors: errors.length }));
} finally {
  await browser?.close();
  server.close();
}
