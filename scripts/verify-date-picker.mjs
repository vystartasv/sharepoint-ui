import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "date-picker-check.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `
      import * as React from "react";
      import { createRoot } from "react-dom/client";
      import { DatePicker, SharePointUIProvider } from "${resolve("packages/sharepoint-ui/src/react.tsx")}";
      import { defineDatePicker } from "${resolve("packages/sharepoint-ui/src/elements/date-picker.ts")}";
      window.mount = () => {
        defineDatePicker();
        const form = document.createElement("form"); form.id="date-form";
        const native = document.createElement("spui-date-picker"); native.dataset.testid="native-date"; native.setAttribute("lang","en-US"); native.setAttribute("label","Due date"); native.setAttribute("name","dueDate"); native.setAttribute("value","2026-11-03"); native.setAttribute("min","2026-11-03"); native.setAttribute("max","2026-11-30"); native.setAttribute("required",""); form.append(native); document.querySelector("#native").append(form);
        const disabledFieldset=document.createElement("fieldset"); disabledFieldset.disabled=true; const disabled=document.createElement("spui-date-picker"); disabled.dataset.testid="disabled-date"; disabled.setAttribute("label","Disabled date"); disabledFieldset.append(disabled); document.querySelector("#native").append(disabledFieldset);
        function App() { const [value,setValue]=React.useState("2026-11-03"); return <SharePointUIProvider lang="ar" dir="rtl" appearance="ios" strings={{datePickerCalendar:"افتح التقويم"}}><DatePicker data-testid="react-date" label="تاريخ المراجعة" name="reviewDate" value={value} min="2026-11-03" max="2026-11-30" required onValueChange={next=>{window.lastDateChange=next;setValue(next)}} /></SharePointUIProvider>; }
        createRoot(document.querySelector("#react")).render(<App />);
      };
    `,
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});

const server = createServer((request, response) => {
  if (new URL(request.url, "http://localhost").pathname === "/bundle.js") return response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents);
  return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html lang=en-US><meta name=viewport content='width=device-width,initial-scale=1'><style>body{font:14px system-ui;background:#eee;padding:20px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px}section{background:white;padding:20px;min-height:360px}</style><main><section><h2>English date</h2><div id=native></div></section><section><h2>Arabic date</h2><div id=react></div></section></main><script src=/bundle.js></script>");
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.evaluate(() => window.mount());

  const native = page.getByTestId("native-date");
  const input = native.getByRole("combobox", { name: "Due date" });
  const openTiming = await native.evaluate(element => {
    const samples = [];
    for (let index = 0; index < 22; index++) {
      element.closeCalendar(false);
      const start = performance.now(); element.openCalendar(); const elapsed = performance.now() - start;
      if (index > 1) samples.push(elapsed);
    }
    element.closeCalendar(false);
    samples.sort((left, right) => left - right);
    return { medianMs: Number(samples[Math.floor(samples.length / 2)].toFixed(3)), p95Ms: Number(samples[Math.floor(samples.length * 0.95)].toFixed(3)), samples: samples.length };
  });
  assert.equal(await input.getAttribute("aria-expanded"), "false");
  assert.equal(await input.inputValue(), new Intl.DateTimeFormat("en-US", { year: "numeric", month: "numeric", day: "numeric" }).format(new Date(2026, 10, 3)));
  await native.getByRole("button", { name: "Open calendar" }).click();
  const nativeCalendar = native.getByRole("dialog", { name: "November 2026" });
  assert.equal(await nativeCalendar.getByRole("grid").getByRole("row").count(), 6, "weekday header plus five date weeks");
  assert.equal(await nativeCalendar.getByRole("columnheader").count(), 7);
  assert.equal(await nativeCalendar.locator('button[data-month="-1"]').isDisabled(), true);
  assert.equal(await nativeCalendar.locator('button[data-month="1"]').isDisabled(), true);
  assert.equal(await nativeCalendar.locator('button[data-date="2026-11-01"]').getAttribute("aria-disabled"), "true");
  assert.equal(await nativeCalendar.locator('button[data-date="2026-12-01"]').getAttribute("aria-disabled"), "true");
  await nativeCalendar.locator('button[data-date="2026-11-03"]').focus();
  await page.keyboard.press("ArrowLeft");
  const disabledActiveDate = nativeCalendar.locator('[tabindex="0"]');
  assert.equal(await disabledActiveDate.getAttribute("data-date"), "2026-11-02", "keyboard can navigate to a disabled date");
  assert.equal(await disabledActiveDate.getAttribute("aria-disabled"), "true");
  await page.keyboard.press("Enter");
  assert.equal(await native.evaluate(element => element.value), "2026-11-03", "disabled date cannot be selected");
  await nativeCalendar.locator('button[data-date="2026-11-10"]').click();
  assert.equal(await native.evaluate(element => element.value), "2026-11-10");
  assert.equal(await page.evaluate(() => new FormData(document.querySelector("#date-form")).get("dueDate")), "2026-11-10");
  assert.equal(await input.getAttribute("aria-expanded"), "false");
  await native.evaluate(element => { element.value = ""; });
  assert.equal(await native.evaluate(element => element.checkValidity()), false, "required empty value is invalid");
  await page.evaluate(() => document.querySelector("#date-form").reset());
  await page.waitForFunction(() => document.querySelector("[data-testid=native-date]").value === "2026-11-03");
  assert.equal(await input.inputValue(), new Intl.DateTimeFormat("en-US", { year: "numeric", month: "numeric", day: "numeric" }).format(new Date(2026, 10, 3)));
  assert.equal(await page.getByTestId("disabled-date").locator("input").evaluate(node => node.disabled), true, "disabled fieldset disables the custom date input");

  const rtl = page.getByTestId("react-date");
  const rtlInput = rtl.getByRole("combobox", { name: "تاريخ المراجعة" });
  const localizedInitial = await page.evaluate(() => new Intl.DateTimeFormat("ar", { year: "numeric", month: "numeric", day: "numeric" }).format(new Date(2026, 10, 3)));
  assert.equal(await rtlInput.inputValue(), localizedInitial);
  await rtl.getByRole("button", { name: "افتح التقويم" }).click();
  const rtlCalendar = rtl.getByRole("dialog", { name: "نوفمبر 2026" });
  const arabicWeekdays = await rtlCalendar.getByRole("row").first().getByRole("columnheader").allTextContents();
  assert.equal(arabicWeekdays.length, 7);
  assert.equal(await rtlCalendar.getByRole("row").first().getByRole("columnheader").first().getAttribute("aria-label"), "السبت", "Arabic calendar starts the week on Saturday");
  await page.screenshot({ path: resolve("test-results/date-picker-calendar-rtl.png"), fullPage: true });
  const activeDate = rtlCalendar.locator('button[data-date="2026-11-03"]');
  await activeDate.focus();
  await page.keyboard.press("ArrowLeft");
  assert.equal(await rtlCalendar.locator('[tabindex="0"]').getAttribute("data-date"), "2026-11-04", "RTL left arrow moves to the next chronological date");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => window.lastDateChange === "2026-11-04");
  await page.waitForFunction(() => document.querySelector("[data-testid=react-date]").value === "2026-11-04");
  assert.equal(await rtl.evaluate(element => element.value), "2026-11-04");
  assert.equal(await rtl.getAttribute("dir"), "rtl");

  await rtlInput.fill(await page.evaluate(() => new Intl.DateTimeFormat("ar", { year: "numeric", month: "numeric", day: "numeric" }).format(new Date(2026, 10, 12))));
  await rtlInput.press("Enter");
  await page.waitForFunction(() => window.lastDateChange === "2026-11-12");
  await page.waitForFunction(() => document.querySelector("[data-testid=react-date]").value === "2026-11-12");
  assert.equal(await rtl.evaluate(element => element.value), "2026-11-12", "localized digits parse back to the ISO value");
  await rtlInput.click(); await page.keyboard.press("Escape");
  assert.equal(await rtlInput.getAttribute("aria-expanded"), "false", "Escape dismisses the nonmodal calendar");
  assert.equal(await rtl.evaluate(element => element.shadowRoot.activeElement === element.shadowRoot.querySelector("input")), true, "Escape returns focus to the date input");
  await rtlInput.fill("not a date");
  await rtlInput.press("Enter");
  assert.equal(await rtlInput.getAttribute("aria-invalid"), "true");
  assert.equal(await rtl.evaluate(element => element.checkValidity()), false);
  assert.deepEqual(errors, []);
  await page.screenshot({ path: resolve("test-results/date-picker-components.png"), fullPage: true });
  console.log(JSON.stringify({ browser: "Chromium headless", calendar: "localized 7-day grid, month controls, selection, focus restoration", forms: "ISO FormData, required validity, reset, disabled fieldset", localization: "English and Arabic date format and numerals", rtl: "logical direction and arrow navigation", invalidText: true, calendarOpenSynchronousRender: openTiming, pageErrors: errors }));
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
