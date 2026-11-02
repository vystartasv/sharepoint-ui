import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "esbuild";

const dist = resolve("packages/sharepoint-ui/dist");
const reactBundle = await build({
  stdin: { contents: `import * as React from "react"; import { createRoot } from "react-dom/client"; import { Toaster, useToastController } from "${resolve("packages/sharepoint-ui/src/react.tsx")}"; function Child(){const controller=useToastController();React.useEffect(()=>{window.toastController=controller;},[controller]);return React.createElement("button",{id:"react-origin"},"origin");} function OutsideChild(){const controller=useToastController();React.useEffect(()=>{window.outsideToastController=controller;},[controller]);return null;} function QueueChild(){const controller=useToastController();React.useEffect(()=>{window.queueToastController=controller;},[controller]);return null;} function TargetChild(){const controller=useToastController("react-queue");React.useEffect(()=>{window.targetToastController=controller;},[controller]);return null;} function App(){return React.createElement(React.Fragment,null,React.createElement(TargetChild),React.createElement(OutsideChild),React.createElement(Toaster,{position:"top-end","aria-label":"Test notifications",inline:true},React.createElement(Child)),React.createElement(Toaster,{id:"react-queue-toaster",toasterId:"react-queue",limit:1,inline:true},React.createElement(QueueChild)));} createRoot(document.getElementById("react-root")).render(React.createElement(App));`, resolveDir: process.cwd(), sourcefile: "toast-parity-test.tsx", loader: "tsx" },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); }
catch { const fallback = "/Users/vilius/.t3/projects/spfx-research/node_modules/playwright"; if (!existsSync(fallback)) throw new Error("Install Playwright locally or provide the workspace Playwright package."); ({ chromium } = require(fallback)); }

const server = createServer((request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  if (pathname === "/react.js") return response.writeHead(200, { "content-type": "text/javascript" }).end(reactBundle.outputFiles[0].contents);
  if (pathname === "/") return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><button id='native-origin'>Native origin</button><spui-toaster id='native-toaster' inline aria-label='Native notifications'></spui-toaster><div id='react-root'></div></body></html>");
  if (!/^\/elements\/(toast|toaster|shared)\.js$/.test(pathname)) return response.writeHead(404).end();
  try { response.writeHead(200, { "content-type": "text/javascript", "cache-control": "no-store" }).end(readFileSync(resolve(dist, `.${pathname}`))); }
  catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
const delay = ms => new Promise(resolveDelay => setTimeout(resolveDelay, ms));
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(base);
  await page.evaluate(async url => { const { defineToaster } = await import(`${url}/elements/toaster.js`); defineToaster(); }, base);
  await page.addScriptTag({ url: `${base}/react.js` });
  await page.waitForFunction(() => Boolean(window.toastController && window.outsideToastController && window.targetToastController));

  const native = await page.evaluate(async () => {
    const toaster = document.querySelector("#native-toaster");
    document.querySelector("#native-origin").focus();
    const timerId = toaster.show({ id: "native-timer", body: "Native timer", timeout: 180 });
    await new Promise(resolve => setTimeout(resolve, 35));
    const paused = toaster.pause(timerId);
    await new Promise(resolve => setTimeout(resolve, 220));
    const survivedPause = Boolean(toaster.querySelector('[toast-id="native-timer"]'));
    const played = toaster.play(timerId);
    await new Promise(resolve => setTimeout(resolve, 220));
    const dismissedAfterPlay = !toaster.querySelector('[toast-id="native-timer"]');
    toaster.show({ id: "native-permanent", body: "Persistent", timeout: -1 });
    await new Promise(resolve => setTimeout(resolve, 220));
    const negativeOneIsPersistent = Boolean(toaster.querySelector('[toast-id="native-permanent"]'));
    toaster.dismiss("native-permanent");

    const focusA = toaster.show({ id: "native-focus-a", body: "First", timeout: 150 });
    toaster.show({ id: "native-focus-b", body: "Second", timeout: 150 });
    toaster.focusNewest();
    await new Promise(resolve => setTimeout(resolve, 220));
    const groupSurvivedFocus = Boolean(toaster.querySelector(`[toast-id="${focusA}"]`) && toaster.querySelector('[toast-id="native-focus-b"]'));
    document.querySelector("#native-origin").focus();
    await new Promise(resolve => setTimeout(resolve, 220));
    const groupExpiredAfterBlur = !toaster.querySelector(`[toast-id="${focusA}"]`) && !toaster.querySelector('[toast-id="native-focus-b"]');

    const defaultId = toaster.show({ id: "native-defaults", body: "Default timer" });
    const defaultToast = toaster.querySelector(`[toast-id="${defaultId}"]`);
    const defaults = { timeout: defaultToast?.getAttribute("timeout"), pauseOnHover: defaultToast?.getAttribute("pause-on-hover"), pauseOnWindowBlur: defaultToast?.getAttribute("pause-on-window-blur") };
    defaultToast?.dispatchEvent(new MouseEvent("mouseenter"));
    window.dispatchEvent(new Event("blur"));
    await new Promise(resolve => setTimeout(resolve, 3150));
    const defaultExpiredWhileHoveredAndBlurred = !toaster.querySelector(`[toast-id="${defaultId}"]`);

    toaster.show({ id: "native-key-a", body: "A", timeout: 0 });
    toaster.show({ id: "native-key-b", body: "B", timeout: 0 });
    toaster.show({ id: "native-key-c", body: "C", timeout: 0 });
    toaster.focusNewest();
    const newestFocused = document.activeElement?.getAttribute("toast-id");
    document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, composed: true }));
    const arrowUpFocusedPrevious = document.activeElement?.getAttribute("toast-id");
    document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, composed: true }));
    const arrowDownFocusedNext = document.activeElement?.getAttribute("toast-id");
    document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, composed: true }));
    document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete", bubbles: true, composed: true }));
    await new Promise(resolve => setTimeout(resolve, 30));
    const deleteRestoredFocus = document.activeElement?.getAttribute("toast-id");
    const liveState = toaster.querySelector('[toast-id="native-key-c"]');
    const announcement = { role: liveState?.getAttribute("role"), live: liveState?.getAttribute("aria-live"), atomic: liveState?.getAttribute("aria-atomic") };
    toaster.dismissAll();
    return { paused, survivedPause, played, dismissedAfterPlay, negativeOneIsPersistent, groupSurvivedFocus, groupExpiredAfterBlur, defaults, defaultExpiredWhileHoveredAndBlurred, newestFocused, arrowUpFocusedPrevious, arrowDownFocusedNext, deleteRestoredFocus, announcement };
  });
  assert.equal(native.paused, true);
  assert.equal(native.survivedPause, true);
  assert.equal(native.played, true);
  assert.equal(native.dismissedAfterPlay, true);
  assert.equal(native.negativeOneIsPersistent, true);
  assert.equal(native.groupSurvivedFocus, true);
  assert.equal(native.groupExpiredAfterBlur, true);
  assert.deepEqual(native.defaults, { timeout: "3000", pauseOnHover: "false", pauseOnWindowBlur: "false" });
  assert.equal(native.defaultExpiredWhileHoveredAndBlurred, true, "default Toast timeout continues while hovered and while the window is blurred");
  assert.equal(native.newestFocused, "native-key-c");
  assert.equal(native.arrowUpFocusedPrevious, "native-key-b");
  assert.equal(native.arrowDownFocusedNext, "native-key-c");
  assert.equal(native.deleteRestoredFocus, "native-key-c");
  assert.deepEqual(native.announcement, { role: "group", live: null, atomic: null });

  const react = await page.evaluate(async () => {
    const api = window.toastController;
    document.querySelector("#react-origin").focus();
    const id = api.dispatchToast("React timer", { id: "react-timer", timeout: 180, intent: "success" });
    await new Promise(resolve => setTimeout(resolve, 35));
    const paused = api.pauseToast(id);
    await new Promise(resolve => setTimeout(resolve, 220));
    const toast = document.querySelector('#react-root spui-toast[toast-id="react-timer"]');
    const survivedPause = Boolean(toast && !toast.hidden);
    const played = api.playToast(id);
    await new Promise(resolve => setTimeout(resolve, 220));
    const dismissedAfterPlay = !document.querySelector('#react-root spui-toast[toast-id="react-timer"]');
    const permanentId = api.dispatchToast("Persistent", { id: "react-permanent", timeout: -1 });
    await new Promise(resolve => setTimeout(resolve, 220));
    const negativeOneIsPersistent = Boolean(document.querySelector('#react-root spui-toast[toast-id="react-permanent"]'));
    api.dismissToast(permanentId);
    api.dispatchToast("React defaults", { id: "react-defaults" });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const defaultToast = document.querySelector('#react-root spui-toast[toast-id="react-defaults"]');
    const defaults = { timeout: defaultToast?.getAttribute("timeout"), pauseOnHover: defaultToast?.getAttribute("pause-on-hover"), pauseOnWindowBlur: defaultToast?.getAttribute("pause-on-window-blur") };
    defaultToast?.dispatchEvent(new MouseEvent("mouseenter"));
    window.dispatchEvent(new Event("blur"));
    await new Promise(resolve => setTimeout(resolve, 3150));
    const defaultExpiredWhileHoveredAndBlurred = !document.querySelector('#react-root spui-toast[toast-id="react-defaults"]');
    const first = api.dispatchToast("First", { id: "react-key-a", timeout: 0 });
    api.dispatchToast("Second", { id: "react-key-b", timeout: 0 });
    const last = api.dispatchToast("Newest", { id: "react-key-c", timeout: 0, intent: "success" });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    api.focusNewest();
    const newestFocused = document.activeElement?.getAttribute("toast-id");
    document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, composed: true }));
    const arrowUpFocusedPrevious = document.activeElement?.getAttribute("toast-id");
    document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete", bubbles: true, composed: true }));
    await new Promise(resolve => setTimeout(resolve, 30));
    const deleteRestoredFocus = document.activeElement?.getAttribute("toast-id");
    const assertive = document.querySelector('#react-root spui-toast[toast-id="react-key-c"]');
    const toaster = document.querySelector("#react-root spui-toaster");
    return { paused, survivedPause, played, dismissedAfterPlay, negativeOneIsPersistent, defaults, defaultExpiredWhileHoveredAndBlurred, first, last, newestFocused, arrowUpFocusedPrevious, deleteRestoredFocus, announcement: { role: assertive?.getAttribute("role"), live: assertive?.getAttribute("aria-live"), regionCount: toaster.shadowRoot.querySelectorAll('[aria-live="polite"],[aria-live="assertive"]').length } };
  });
  assert.equal(react.paused, true);
  assert.equal(react.survivedPause, true);
  assert.equal(react.played, true);
  assert.equal(react.dismissedAfterPlay, true);
  assert.equal(react.negativeOneIsPersistent, true);
  assert.deepEqual(react.defaults, { timeout: "3000", pauseOnHover: "false", pauseOnWindowBlur: "false" });
  assert.equal(react.defaultExpiredWhileHoveredAndBlurred, true, "React Toast default timeout continues while hovered and while the window is blurred");
  assert.equal(react.newestFocused, "react-key-c");
  assert.equal(react.arrowUpFocusedPrevious, "react-key-b");
  assert.equal(react.deleteRestoredFocus, "react-key-c");
  assert.deepEqual(react.announcement, { role: "group", live: null, regionCount: 2 });
  const externalController = await page.evaluate(async () => {
    const api = window.outsideToastController;
    const toaster = document.querySelector('#react-root spui-toaster:not([toaster-id])');
    const id = api.dispatchToast("Sibling initial", { id: "react-sibling-toast", timeout: 1500 });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const routed = Boolean(toaster.querySelector('[toast-id="react-sibling-toast"]'));
    api.updateToast(id, { content: "Sibling legacy update" });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const legacyUpdate = toaster.querySelector('[toast-id="react-sibling-toast"]')?.textContent?.includes("Sibling legacy update");
    api.updateToast({ toastId: id, content: "Sibling object update", priority: -4 });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const objectUpdate = toaster.querySelector('[toast-id="react-sibling-toast"]')?.textContent?.includes("Sibling object update");
    const paused = api.pauseToast(id);
    const played = api.playToast(id);
    api.focusNewest();
    const focused = document.activeElement?.getAttribute("toast-id") === id;
    api.dismissToast(id);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const dismissed = !toaster.querySelector(`[toast-id="${id}"]`);
    api.dispatchToast("Dismiss all", { id: "react-sibling-dismiss-all", timeout: 0 });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    api.dismissAllToasts();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const dismissedAll = toaster.querySelectorAll("spui-toast").length === 0;
    return { routed, legacyUpdate, objectUpdate, paused, played, focused, dismissed, dismissedAll };
  });
  assert.deepEqual(externalController, { routed: true, legacyUpdate: true, objectUpdate: true, paused: true, played: true, focused: true, dismissed: true, dismissedAll: true }, "a controller outside the Toaster subtree uses Fluent-style document routing for all imperative methods");
  const queue = await page.evaluate(async () => {
    const toaster = document.createElement("spui-toaster");
    toaster.setAttribute("inline", "");
    document.body.append(toaster);
    const polite = toaster.shadowRoot.querySelector('[aria-live="polite"]');
    const assertive = toaster.shadowRoot.querySelector('[aria-live="assertive"]');
    toaster.show({ id: "announce-polite-one", body: "polite one", timeout: 0, intent: "info" });
    toaster.show({ id: "announce-assertive-one", body: "assertive one", timeout: 0, intent: "error" });
    toaster.show({ id: "announce-polite-two", body: "polite two", timeout: 0, intent: "info" });
    toaster.show({ id: "announce-assertive-two", body: "assertive two", timeout: 0, intent: "warning" });
    await new Promise(resolve => setTimeout(resolve, 80));
    const first = { polite: polite.textContent, assertive: assertive.textContent };
    await new Promise(resolve => setTimeout(resolve, 530));
    const second = { polite: polite.textContent, assertive: assertive.textContent };
    await new Promise(resolve => setTimeout(resolve, 600));
    const third = { polite: polite.textContent, assertive: assertive.textContent };
    await new Promise(resolve => setTimeout(resolve, 550));
    const fourth = { polite: polite.textContent, assertive: assertive.textContent };
    toaster.dismissAll();
    toaster.remove();
    return { first, second, third, fourth };
  });
  assert.deepEqual(queue.first, { polite: "polite one", assertive: "" });
  assert.deepEqual(queue.second, { polite: "", assertive: "assertive one" });
  assert.deepEqual(queue.third, { polite: "", assertive: "assertive two" });
  assert.deepEqual(queue.fourth, { polite: "polite two", assertive: "" });

  const visibleQueue = await page.evaluate(async () => {
    const toaster = document.createElement("spui-toaster");
    toaster.setAttribute("inline", "");
    toaster.setAttribute("limit", "1");
    document.body.append(toaster);
    toaster.show({ id: "queue-first", body: "First", timeout: 0 });
    toaster.show({ id: "queue-low", body: "Low priority", priority: 4, timeout: 0 });
    toaster.show({ id: "queue-high", body: "High priority", priority: -1, timeout: 150 });
    await new Promise(resolve => setTimeout(resolve, 220));
    const firstState = [...toaster.querySelectorAll("spui-toast")].map(toast => ({ id: toast.toastId, hidden: toast.hidden }));
    toaster.dismiss("queue-first");
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const promoted = toaster.querySelector('[toast-id="queue-high"]');
    const promotedVisible = Boolean(promoted && !promoted.hidden);
    await new Promise(resolve => setTimeout(resolve, 75));
    const queuedTimerPaused = Boolean(promoted && !promoted.hidden);
    await new Promise(resolve => setTimeout(resolve, 120));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const nextPromoted = toaster.querySelector('[toast-id="queue-low"]');
    const priorityOrder = Boolean(nextPromoted && !nextPromoted.hidden);
    const dismissAllCount = toaster.dismissAll();
    await new Promise(resolve => setTimeout(resolve, 10));
    toaster.show({ id: "limit-a", body: "A", timeout: 0 });
    toaster.show({ id: "limit-b", body: "B", timeout: 0 });
    toaster.show({ id: "limit-c", body: "C", timeout: 0 });
    toaster.setAttribute("limit", "2");
    const raisedCount = [...toaster.querySelectorAll("spui-toast")].filter(toast => !toast.hidden).length;
    toaster.setAttribute("limit", "1");
    const loweredCount = [...toaster.querySelectorAll("spui-toast")].filter(toast => !toast.hidden).length;
    toaster.setAttribute("limit", "3");
    const raisedAgainCount = [...toaster.querySelectorAll("spui-toast")].filter(toast => !toast.hidden).length;
    const limitChangeDismissCount = toaster.dismissAll();
    toaster.remove();
    return { firstState, promotedVisible, queuedTimerPaused, priorityOrder, dismissAllCount, raisedCount, loweredCount, raisedAgainCount, limitChangeDismissCount };
  });
  assert.deepEqual(visibleQueue.firstState, [
    { id: "queue-first", hidden: false },
    { id: "queue-low", hidden: true },
    { id: "queue-high", hidden: true },
  ]);
  assert.equal(visibleQueue.promotedVisible, true);
  assert.equal(visibleQueue.queuedTimerPaused, true, "queued Toast timeout does not elapse before promotion");
  assert.equal(visibleQueue.priorityOrder, true, "lower numeric priority is promoted first and ties remain FIFO");
  assert.equal(visibleQueue.dismissAllCount, 1, "dismissAll removes the currently visible toast after queued items were promoted");
  assert.equal(visibleQueue.raisedCount, 2, "raising the visible limit promotes queued Toasts");
  assert.equal(visibleQueue.loweredCount, 1, "lowering the visible limit queues excess Toasts");
  assert.equal(visibleQueue.raisedAgainCount, 3, "raising the limit again restores queued Toasts");
  assert.equal(visibleQueue.limitChangeDismissCount, 3, "dismissAll includes hidden queued Toasts");

  const targetedController = await page.evaluate(async () => {
    const api = window.targetToastController;
    const toaster = document.querySelector("#react-queue-toaster");
    const id = api.dispatchToast("Outside initial", { toastId: "targeted-toast", timeout: 0 });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const initiallyRouted = Boolean(toaster.querySelector('[toast-id="targeted-toast"]'));
    api.updateToast({ toastId: id, content: "Outside updated", priority: -5 });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const toast = toaster.querySelector('[toast-id="targeted-toast"]');
    const objectUpdate = { content: toast?.textContent?.includes("Outside updated"), priority: toast?.getAttribute("priority") };
    api.dismissToast(id);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return { initiallyRouted, objectUpdate, dismissed: !toaster.querySelector('[toast-id="targeted-toast"]') };
  });
  assert.equal(targetedController.initiallyRouted, true, "a controller outside the Toaster routes by toasterId");
  assert.deepEqual(targetedController.objectUpdate, { content: true, priority: "-5" }, "Fluent object-form updateToast updates toast content and options");
  assert.equal(targetedController.dismissed, true, "a targeted controller dismisses the toast it dispatched");

  const reactQueue = await page.evaluate(async () => {
    const api = window.queueToastController;
    const toaster = document.querySelector("#react-queue-toaster");
    api.dispatchToast("Current", { id: "react-queue-current", timeout: 0 });
    api.dispatchToast("Normal priority", { id: "react-queue-normal", priority: 2, timeout: 0 });
    api.dispatchToast("Urgent", { id: "react-queue-urgent", priority: -2, timeout: 0 });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const initial = [...toaster.querySelectorAll("spui-toast")].map(toast => ({ id: toast.toastId, hidden: toast.hidden }));
    api.dismissToast("react-queue-current");
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const promoted = toaster.querySelector('[toast-id="react-queue-urgent"]');
    const priorityPromotion = Boolean(promoted && !promoted.hidden);
    api.updateToast("react-queue-normal", { options: { priority: -3 } });
    api.dismissToast("react-queue-urgent");
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const updatedPriorityPromotion = !toaster.querySelector('[toast-id="react-queue-normal"]')?.hidden;
    api.dismissAllToasts();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const dismissAllClearedQueue = toaster.querySelectorAll("spui-toast").length === 0;
    return { initial, priorityPromotion, updatedPriorityPromotion, dismissAllClearedQueue };
  });
  assert.deepEqual(reactQueue.initial, [
    { id: "react-queue-current", hidden: false },
    { id: "react-queue-normal", hidden: true },
    { id: "react-queue-urgent", hidden: true },
  ]);
  assert.equal(reactQueue.priorityPromotion, true);
  assert.equal(reactQueue.updatedPriorityPromotion, true, "changing queued Toast priority affects its next promotion");
  assert.equal(reactQueue.dismissAllClearedQueue, true, "dismissAll removes both visible and queued Toasts");
  const queuePerformance = await page.evaluate(async () => {
    const output = {};
    const percentile = (samples, fraction) => [...samples].sort((a, b) => a - b)[Math.min(samples.length - 1, Math.ceil(samples.length * fraction) - 1)];
    for (const count of [100, 1000]) {
      const samples = [];
      let visible = 0;
      for (let run = 0; run < 5; run++) {
        const toaster = document.createElement("spui-toaster");
        toaster.setAttribute("inline", "");
        toaster.setAttribute("limit", "5");
        document.body.append(toaster);
        const start = performance.now();
        for (let index = 0; index < count; index++) toaster.show({ id: `bench-${count}-${run}-${index}`, body: "Notice", priority: index % 4, timeout: 0 });
        samples.push(performance.now() - start);
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        visible = [...toaster.querySelectorAll("spui-toast")].filter(toast => !toast.hidden).length;
        toaster.remove();
      }
      output[count] = { samples: samples.length, p50Ms: Number(percentile(samples, 0.5).toFixed(2)), p95Ms: Number(percentile(samples, 0.95).toFixed(2)), visible, expectedLimit: 5 };
    }
    return output;
  });
  assert.ok(Object.values(queuePerformance).every(result => result.visible === result.expectedLimit));
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ browser: "Chromium headless", adapters: ["React", "custom-element"], assertions: "passed", announcementQueue: queue, visibleQueue, reactQueue, targetedController, externalController, queuePerformance, native, react }, null, 2));
} finally { await browser?.close(); await new Promise(done => server.close(done)); }
