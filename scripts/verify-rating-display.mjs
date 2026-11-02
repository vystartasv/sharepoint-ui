import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(process.cwd());
const bundle = await build({
  stdin: {
    contents: `import * as React from "react";import{createRoot}from"react-dom/client";import{SharePointUIProvider,Rating,RatingDisplay,RatingItem}from"${resolve(root, "packages/sharepoint-ui/src/react.tsx")}";function FilledIcon(){return <b data-rating-icon="filled">F</b>}function OutlineIcon(){return <i data-rating-icon="outline">O</i>}function App(){return <SharePointUIProvider theme={{colors:{accent:"#2468aa"}}}><form id="rating-form"><Rating data-testid="interactive" label="Interactive rating" value={3} max={5} iconFilled={FilledIcon} iconOutline={OutlineIcon} step={0.5} fullValueInput={{className:"custom-full-input","data-testid":"rating-full-input"}} halfValueInput={{className:"custom-half-input","data-testid":"rating-half-input"}} onChange={(event,data)=>window.ratingChange={eventType:event.type,sameEvent:event===data.event,type:data.type,value:data.value,sourceValue:data.event.target.value}}/><Rating data-testid="required-rating" label="Required score" name="score" defaultValue={0} required/><fieldset disabled><Rating data-testid="fieldset-rating" label="Disabled fieldset score" name="disabledScore" defaultValue={3}/></fieldset><button type="reset">Reset ratings</button></form><RatingDisplay data-testid="normal" value={3.5} max={5} count={1234} color="brand" size="large" label="Customer rating"/><RatingDisplay data-testid="compact" value={4} compact/><RatingDisplay data-testid="custom" value={2.5} max={4} label="Custom score">{[1,2,3,4].map(value=><RatingItem key={value} value={value} selectedIcon={<b>♥</b>} unselectedIcon={<i>♡</i>}/>)}</RatingDisplay></SharePointUIProvider>}createRoot(document.querySelector("#root")).render(<App/>);`,
    resolveDir: root,
    sourcefile: "rating-display.tsx",
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
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><main id='root'></main><script src='/bundle.js'></script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector('[data-testid="normal"]')?.shadowRoot?.querySelector(".root"));
  await page.evaluate(() => {
    const form = document.createElement("form"); form.id = "direct-rating-form";
    const rating = document.createElement("spui-rating"); rating.dataset.testid = "direct-rating"; rating.setAttribute("label", "Direct rating"); rating.setAttribute("name", "directScore"); rating.setAttribute("default-value", "3"); const fullInput = document.createElement("input"); fullInput.slot = "full-value-input"; fullInput.dataset.testid = "direct-full-input"; rating.append(fullInput);
    const reset = document.createElement("button"); reset.type = "reset"; reset.textContent = "Reset direct rating";
    form.append(rating, reset); document.body.append(form);
    const fieldset = document.createElement("fieldset"); fieldset.disabled = true;
    const disabled = document.createElement("spui-rating"); disabled.dataset.testid = "direct-disabled-rating"; disabled.setAttribute("default-value", "2"); fieldset.append(disabled); document.body.append(fieldset);
  });

  const interactive = page.getByTestId("interactive");
  assert.equal(await interactive.evaluate(node => node.shadowRoot.querySelector('input[value="4"]').classList.contains("custom-full-input")), true, "full-value input slot props reach full-step radios");
  assert.equal(await interactive.evaluate(node => node.shadowRoot.querySelector('input[value="3.5"]').classList.contains("custom-half-input")), true, "half-value input slot props reach half-step radios");
  await interactive.evaluate(node => node.shadowRoot.querySelector('input[type="radio"][value="4"]').click());
  assert.deepEqual(await page.evaluate(() => window.ratingChange), { eventType: "change", sameEvent: true, type: "change", value: 4, sourceValue: "4" }, "React callback matches Fluent event and data contract with the originating radio event");
  assert.equal(await interactive.evaluate(node => node.shadowRoot.querySelectorAll(".items [data-rating-icon=filled]").length), 5, "custom filled icons are cloned into each interactive star");
  assert.equal(await interactive.evaluate(node => node.shadowRoot.querySelectorAll(".items [data-rating-icon=outline]").length), 5, "custom outline icons are cloned into each interactive star");
  const requiredRating = page.getByTestId("required-rating");
  const ratingForm = page.locator("#rating-form");
  assert.equal(await ratingForm.evaluate(form => form.checkValidity()), false, "required rating participates in native form validity");
  assert.deepEqual(await ratingForm.evaluate(form => [...new FormData(form).entries()]), [], "empty required rating does not submit a value");
  assert.equal(await page.getByTestId("fieldset-rating").locator('input[type="radio"]').first().isDisabled(), true, "disabled fieldset disables rating choices");
  await requiredRating.evaluate(node => node.shadowRoot.querySelector('input[type="radio"][value="4"]').click());
  assert.equal(await ratingForm.evaluate(form => form.checkValidity()), true, "selected rating satisfies required validity");
  assert.deepEqual(await ratingForm.evaluate(form => [...new FormData(form).entries()]), [["score", "4"]], "selected rating participates in FormData");
  await ratingForm.locator('button[type="reset"]').click();
  assert.equal(await requiredRating.evaluate(node => node.value), 0, "form reset restores the initial rating");
  assert.equal(await ratingForm.evaluate(form => form.checkValidity()), false, "reset restores required invalidity");
  assert.deepEqual(await ratingForm.evaluate(form => [...new FormData(form).entries()]), [], "reset removes rating from form submission");
  const directRating = page.getByTestId("direct-rating");
  assert.equal(await directRating.evaluate(node => node.shadowRoot.querySelector('input[value="1"]').dataset.testid), "direct-full-input", "native full-value input slot templates reach generated radios");
  await directRating.evaluate(node => { node.querySelector('input[slot="full-value-input"]').dataset.testid = "updated-full-input"; });
  await page.waitForFunction(() => document.querySelector('[data-testid="direct-rating"]').shadowRoot.querySelector('input[value="1"]').dataset.testid === "updated-full-input");
  assert.deepEqual(await page.locator("#direct-rating-form").evaluate(form => [...new FormData(form).entries()]), [["directScore", "3"]], "direct custom-element usage submits its initial value");
  await directRating.evaluate(node => node.shadowRoot.querySelector('input[type="radio"][value="5"]').click());
  assert.deepEqual(await page.locator("#direct-rating-form").evaluate(form => [...new FormData(form).entries()]), [["directScore", "5"]], "direct custom-element selection updates form value");
  await page.locator("#direct-rating-form button[type=reset]").click();
  assert.equal(await directRating.evaluate(node => node.value), 3, "direct custom-element form reset restores default value");
  assert.equal(await page.getByTestId("direct-disabled-rating").locator('input[type="radio"]').first().isDisabled(), true, "disabled fieldset state is applied when a direct custom element connects");

  const normal = page.getByTestId("normal");
  assert.equal(await normal.evaluate(node => node.shadowRoot.querySelector(".root").getAttribute("role")), "img");
  assert.equal(await normal.evaluate(node => node.shadowRoot.querySelector(".root").getAttribute("aria-label")), "Customer rating");
  assert.equal(await page.getByRole("img", { name: "Customer rating" }).count(), 1, "the rating is exposed as one named image, not separate star glyphs");
  assert.equal(await normal.evaluate(node => [...node.shadowRoot.querySelectorAll("spui-rating-item")].every(item => item.getAttribute("aria-hidden") === "true")), true, "visual rating stars are hidden from the accessibility tree");
  assert.equal(await normal.evaluate(node => node.shadowRoot.querySelectorAll(".items spui-rating-item").length), 5);
  assert.equal(await normal.evaluate(node => node.shadowRoot.querySelector(".value-text").textContent), "3.5");
  assert.equal(await normal.evaluate(node => node.shadowRoot.querySelector(".count-text").textContent), "1,234");
  assert.equal(await normal.evaluate(node => getComputedStyle(node.shadowRoot.querySelectorAll("spui-rating-item")[3].shadowRoot.querySelector(".filled")).width), "15px", "fractional fill follows the large item size");
  assert.equal(await normal.evaluate(node => getComputedStyle(node).getPropertyValue("--spui-ui-accent").trim()), "#2468aa", "rating display inherits provider theme");

  const compact = page.getByTestId("compact");
  assert.equal(await compact.evaluate(node => node.shadowRoot.querySelectorAll(".items spui-rating-item").length), 1, "compact mode draws one star");
  assert.equal(await compact.evaluate(node => node.shadowRoot.querySelector(".root").getAttribute("aria-label")), "4 of 5");

  const custom = page.getByTestId("custom");
  assert.equal(await custom.evaluate(node => node.querySelectorAll(":scope > spui-rating-item").length), 4);
  assert.equal(await page.getByRole("img", { name: "Custom score" }).count(), 1, "custom filled and outline glyphs remain under one named rating image");
  assert.equal(await custom.evaluate(node => [...node.querySelectorAll(":scope > spui-rating-item")].every(item => item.getAttribute("aria-hidden") === "true")), true, "custom visual RatingItems are excluded from duplicate screen-reader output");
  assert.equal(await custom.evaluate(node => getComputedStyle(node.querySelector("spui-rating-item[value='3']").shadowRoot.querySelector(".filled")).width), "12px", "composed items inherit fractional rating value");
  assert.equal(await custom.getByText("♥").count(), 4, "custom filled icon composes in each RatingItem");
  assert.equal(await custom.getByText("♡").count(), 4, "custom outline icon composes in each RatingItem");

  await normal.evaluate(node => node.setAttribute("value", "2"));
  assert.equal(await normal.evaluate(node => node.shadowRoot.querySelector(".root").getAttribute("aria-label")), "Customer rating", "consumer label remains stable when value changes");
  const direct = await page.evaluate(() => {
    const display = document.createElement("spui-rating-display"); display.setAttribute("value", "2.5"); display.setAttribute("max", "5"); display.setAttribute("lang", "en-GB");
    const item = document.createElement("spui-rating-item"); item.setAttribute("value", "3"); display.append(item); document.body.append(display);
    return { role: display.shadowRoot.querySelector(".root").getAttribute("role"), label: display.shadowRoot.querySelector(".root").getAttribute("aria-label"), fill: getComputedStyle(item.shadowRoot.querySelector(".filled")).width };
  });
  assert.deepEqual(direct, { role: "img", label: "2.5 of 5", fill: "12px" }, "framework-neutral elements compose and render fractional values");
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify({ status: "passed", adapters: ["React", "custom element"], assertions: ["Fluent-shaped onChange data and source event identity", "accessible naming", "decorative glyph hiding in the accessibility tree", "theme inheritance", "count/value text", "fractional fills", "compact mode", "custom icon slots", "interactive custom icon props", "full and half input slots", "live input slot updates", "attribute updates", "React and direct-element FormData", "required validity", "form reset", "disabled fieldsets", "direct element composition"], noPageErrors: true }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
