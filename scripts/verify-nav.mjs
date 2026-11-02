import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "nav-avatars.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `
      import * as React from "react";
      import { createRoot } from "react-dom/client";
      import { Avatar, Nav, NavCategory, NavCategoryItem, NavItem, NavSubItem, NavSubItemGroup } from "${resolve("packages/sharepoint-ui/src/react.tsx")}";
      import { defineNav } from "${resolve("packages/sharepoint-ui/src/elements/nav.ts")}";
      import { defineAvatar } from "${resolve("packages/sharepoint-ui/src/elements/avatar.ts")}";

      window.mount = () => {
        defineNav();
        defineAvatar();
        const nav = document.createElement("spui-nav");
        nav.setAttribute("label", "Native navigation");
        nav.setAttribute("collapsible", "");
        nav.setAttribute("expand-label", "توسيع التنقل");
        nav.setAttribute("collapse-label", "طي التنقل");
        nav.dir = "rtl";
        nav.setAttribute("open-label", "فتح قائمة التنقل");
        nav.setAttribute("close-label", "إغلاق قائمة التنقل");
        const item = document.createElement("spui-nav-item");
        item.setAttribute("value", "team");
        item.setAttribute("href", "/team");
        item.textContent = "Team";
        const avatar = document.createElement("spui-avatar");
        avatar.setAttribute("slot", "avatar");
        avatar.setAttribute("name", "Team");
        avatar.setAttribute("initials", "TM");
        avatar.setAttribute("size", "28");
        avatar.setAttribute("decorative", "");
        item.prepend(avatar);
        const home = document.createElement("spui-nav-item");
        home.setAttribute("value", "home");
        home.textContent = "Home";
        const category = document.createElement("spui-nav-category");
        category.setAttribute("value", "people");
        const categoryItem = document.createElement("spui-nav-category-item");
        categoryItem.textContent = "People";
        const nativeExpandIcon = document.createElement("span"); nativeExpandIcon.slot = "expand-icon"; nativeExpandIcon.dataset.testid = "native-expand-icon"; nativeExpandIcon.textContent = "⌄"; categoryItem.append(nativeExpandIcon); const categoryAvatar = avatar.cloneNode();
        categoryAvatar.setAttribute("slot", "avatar");
        categoryItem.prepend(categoryAvatar);
        const group = document.createElement("spui-nav-sub-item-group");
        const child = document.createElement("spui-nav-sub-item");
        child.setAttribute("value", "directory");
        child.textContent = "Directory";
        group.append(child);
        category.append(categoryItem, group);
        nav.append(item, home, category);
        document.querySelector("#native").append(nav);

        function App() {
          const [open, setOpen] = React.useState(false);
          const [collapsed, setCollapsed] = React.useState(false);
          return React.createElement(Nav, { "data-testid": "react-nav", label: "React navigation", dir: "ltr", open, collapsed, collapsible: true, expandLabel: "Expand navigation", collapseLabel: "Collapse navigation", onCollapsedChange: setCollapsed, openLabel: "Open menu", closeLabel: "Close menu", onOpenChange: setOpen },
            React.createElement(NavItem, { value: "team", href: "/team", avatar: React.createElement(Avatar, { name: "Team", initials: "TM", size: 28 }) }, "Team"),
            React.createElement(NavItem, { value: "home" }, "Home"),
            React.createElement(NavCategory, { value: "people" },
              React.createElement(NavCategoryItem, { avatar: React.createElement(Avatar, { name: "People", initials: "PP", size: 28 }), expandIcon: React.createElement("span", { "data-testid": "react-expand-icon" }, "⌄") }, "People"),
              React.createElement(NavSubItemGroup, null, React.createElement(NavSubItem, { value: "directory" }, "Directory"))));
        }
        createRoot(document.querySelector("#react")).render(React.createElement(App));
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
  return response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><style>body{display:flex;flex-wrap:wrap;gap:24px;padding:24px;background:#f3f4f6;font:14px/1.4 system-ui}section{width:min(280px,calc(100vw - 82px));padding:16px;background:#fff;border:1px solid #d1d5db;border-radius:12px}h2{margin:0 0 12px;font-size:16px}#outside-left,#outside-right{position:fixed;top:8px;z-index:0}</style><section><h2>Native Nav</h2><div id=native></div></section><section><h2>React Nav</h2><div id=react></div></section><button id=outside-left style=left:8px>Outside</button><button id=outside-right style=right:8px>Outside</button><script src=/bundle.js></script>");
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.evaluate(() => window.mount());

  for (const [adapter, selector] of [["native", "#native spui-nav"], ["React", '[data-testid="react-nav"]']]) {
    const nav = page.locator(selector);
    const destination = nav.locator("spui-nav-item").first();
    const category = nav.locator("spui-nav-category-item");
    const group = nav.locator("spui-nav-sub-item-group");
    const railToggle = nav.locator(".rail-toggle");
    assert.equal(await railToggle.isVisible(), true, `${adapter}: collapsible rail control is visible on desktop`);
    assert.equal(await railToggle.getAttribute("aria-expanded"), "true", `${adapter}: rail starts expanded`);
    assert.equal(await railToggle.locator("svg").evaluate(node => getComputedStyle(node).transitionDuration), "0.12s", `${adapter}: chevron uses shared motion duration`);
    assert.equal(await nav.evaluate(node => getComputedStyle(node).width), "260px");
    const customExpandIcon = adapter === "native" ? page.getByTestId("native-expand-icon") : page.getByTestId("react-expand-icon");
    assert.equal(await customExpandIcon.isVisible(), true, `${adapter}: custom category expand icon is rendered while expanded`);
    if (adapter === "native") await railToggle.focus(); else await railToggle.click();
    if (adapter === "native") await page.keyboard.press("Space");
    await page.waitForFunction(selector => document.querySelector(selector)?.hasAttribute("data-collapsed"), selector);
    await page.waitForFunction(selector => getComputedStyle(document.querySelector(selector)).width === "64px", selector);
    assert.equal(await railToggle.getAttribute("aria-expanded"), "false");
    assert.equal(await railToggle.getAttribute("aria-label"), adapter === "native" ? "توسيع التنقل" : "Expand navigation");
    assert.equal(await nav.evaluate(node => getComputedStyle(node).width), "64px", `${adapter}: compact rail uses the 64px width`);
    const compactHome = nav.locator('spui-nav-item[value="home"]');
    assert.equal(await compactHome.getAttribute("compact"), "", `${adapter}: item receives compact state`);
    assert.equal(await compactHome.evaluate(node => node.shadowRoot.querySelector("a,button").getAttribute("aria-label")), "Home", `${adapter}: accessible item name is retained`);
    assert.equal(await compactHome.evaluate(node => node.shadowRoot.querySelector("a,button").title), "Home", `${adapter}: compact item has a sighted hover label`);
    assert.equal(await compactHome.evaluate(node => node.shadowRoot.querySelector("a [part=compact-fallback],button [part=compact-fallback]").textContent), "H", `${adapter}: no-icon item gets a compact initial`);
    const compactBounds = await Promise.all([nav.boundingBox(), compactHome.locator("button,a").boundingBox()]);
    assert.ok(compactBounds[1].width <= compactBounds[0].width + 1, `${adapter}: compact item stays within rail bounds ${JSON.stringify(compactBounds)}`);
    const compactCategory = nav.locator("spui-nav-category-item");
    assert.equal(await compactCategory.evaluate(node => node.shadowRoot.querySelector("[part=chevron]").classList.contains("custom")), true, `${adapter}: custom icon replaces the generated disclosure chevron`);
    assert.equal(await compactCategory.evaluate(node => node.shadowRoot.querySelector("button").getAttribute("aria-label")), "People");
    assert.equal(await compactCategory.evaluate(node => node.shadowRoot.querySelector("button [part=compact-fallback]").hidden), true, `${adapter}: assigned avatar replaces fallback initial`);
    const expectedArrowTransform = adapter === "native" ? "none" : "matrix(-1, 0, 0, -1, 0, 0)";
    await page.waitForFunction(([selector, expected]) => getComputedStyle(document.querySelector(selector).shadowRoot.querySelector(".rail-toggle svg")).transform === expected, [selector, expectedArrowTransform]);
    const arrowTransform = await railToggle.locator("svg").evaluate(node => getComputedStyle(node).transform);
    assert.equal(arrowTransform, expectedArrowTransform, `${adapter}: collapse arrow follows the LTR/RTL inline direction`);
    await page.screenshot({ path: resolve(`test-results/nav-compact-${adapter}.png`), fullPage: true });
    await railToggle.click();
    await page.waitForFunction(selector => !document.querySelector(selector)?.hasAttribute("data-collapsed"), selector);
    await page.waitForFunction(selector => getComputedStyle(document.querySelector(selector)).width === "260px", selector);
    assert.equal(await railToggle.getAttribute("aria-expanded"), "true");
    assert.equal(await compactHome.getAttribute("compact"), null, `${adapter}: expansion restores full item labels`);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await railToggle.click();
    await page.waitForFunction(selector => document.querySelector(selector)?.hasAttribute("data-collapsed"), selector);
    assert.equal(await railToggle.locator("svg").evaluate(node => getComputedStyle(node).transitionDuration), "0s", `${adapter}: chevron motion honors reduced motion`);
    assert.equal(await nav.evaluate(node => getComputedStyle(node).width), "64px", `${adapter}: reduced motion reaches the compact width immediately`);
    await railToggle.click();
    await page.waitForFunction(selector => !document.querySelector(selector)?.hasAttribute("data-collapsed"), selector);
    await page.waitForFunction(selector => getComputedStyle(document.querySelector(selector)).width === "260px", selector);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const inspect = async host => host.evaluate(node => {
      const element = node.shadowRoot.querySelector("a,button");
      const avatarSlot = element.querySelector('slot[name="avatar"]');
      const avatar = avatarSlot.assignedElements()[0];
      const face = avatar.shadowRoot.querySelector(".initials");
      const fallback = avatar.shadowRoot.querySelector(".fallback");
      return {
        slot: avatar?.getAttribute("slot"),
        tag: avatar?.localName,
        control: element.localName,
        size: avatar && getComputedStyle(avatar).inlineSize,
        initials: face.textContent,
        fallbackDisplay: getComputedStyle(fallback).display,
        decorative: avatar.hasAttribute("decorative"),
        ariaHidden: avatar.getAttribute("aria-hidden"),
        role: avatar.getAttribute("role"),
        label: element.getAttribute("aria-label"),
        direction: getComputedStyle(element).direction,
      };
    });
    const decorativeAvatar = { decorative: true, ariaHidden: "true", role: "presentation" };
    const direction = adapter === "React" ? "ltr" : "rtl";
    const destinationState = { slot: "avatar", tag: "spui-avatar", control: "a", size: "28px", initials: "TM", fallbackDisplay: "none", ...decorativeAvatar, label: "Team", direction };
    assert.deepEqual(await inspect(destination), destinationState, `${adapter} destination`);
    assert.deepEqual(await inspect(category), { slot: "avatar", tag: "spui-avatar", control: "button", size: "28px", initials: adapter === "React" ? "PP" : "TM", fallbackDisplay: "none", ...decorativeAvatar, label: "People", direction }, `${adapter} category`);
    assert.equal(await group.getAttribute("id"), await category.evaluate(node => node.shadowRoot.querySelector("button").getAttribute("aria-controls")), `${adapter}: disclosure controls its subitem group`);
    assert.equal(await group.getAttribute("hidden"), "", `${adapter}: subitems start collapsed`);
    await category.evaluate(node => node.shadowRoot.querySelector("button").focus());
    await page.keyboard.press("Enter");
    assert.equal(await category.evaluate(node => node.shadowRoot.querySelector("button").getAttribute("aria-expanded")), "true", `${adapter}: Enter opens category`);
    assert.equal(await group.getAttribute("hidden"), null, `${adapter}: Enter reveals subitems`);
    await page.keyboard.press("Space");
    assert.equal(await category.evaluate(node => node.shadowRoot.querySelector("button").getAttribute("aria-expanded")), "false", `${adapter}: Space closes category`);
    assert.equal(await group.getAttribute("hidden"), "", `${adapter}: Space hides subitems`);
    await destination.evaluate(node => node.removeAttribute("href"));
    assert.deepEqual(await inspect(destination), { ...destinationState, control: "button" }, `${adapter} avatar survives link-to-button change`);
    await destination.evaluate(node => node.setAttribute("href", "/team"));
    assert.deepEqual(await inspect(destination), destinationState, `${adapter} avatar survives button-to-link change`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => window.matchMedia("(max-width: 640px)").matches);
  for (const selector of ["#native spui-nav", '[data-testid="react-nav"]']) await page.waitForFunction(selector => document.querySelector(selector).shadowRoot.querySelector("nav").hasAttribute("popover"), selector);
  for (const selector of ["#native spui-nav", '[data-testid="react-nav"]']) assert.equal(await page.locator(selector).locator(".rail-toggle").isVisible(), false, `${selector}: desktop rail toggle is hidden in mobile drawer mode`);
  const waitForNavOpen = (selector, open) => page.waitForFunction(([target, expected]) => {
    const root = document.querySelector(target)?.shadowRoot;
    const panel = root?.querySelector("nav");
    const toggle = root?.querySelector(".mobile-toggle");
    return panel?.matches(":popover-open") === expected && toggle?.getAttribute("aria-expanded") === String(expected);
  }, [selector, open]);
  for (const [adapter, selector, direction, openLabel, closeLabel] of [
    ["native", "#native spui-nav", "rtl", "فتح قائمة التنقل", "إغلاق قائمة التنقل"],
    ["React", '[data-testid="react-nav"]', "ltr", "Open menu", "Close menu"],
  ]) {
    const nav = page.locator(selector);
    const trigger = nav.locator(".mobile-toggle");
    const panel = nav.locator("nav");
    assert.equal(await trigger.isVisible(), true, `${adapter}: mobile toggle is visible at 390px`);
    assert.equal(await panel.getAttribute("popover"), "auto", `${adapter}: mobile nav uses an auto-dismiss popover`);
    assert.equal(await panel.evaluate(node => node.matches(":popover-open")), false, `${adapter}: mobile nav starts closed`);
    assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    assert.equal(await trigger.getAttribute("aria-controls"), await panel.getAttribute("id"));
    assert.equal(await trigger.getAttribute("aria-label"), openLabel, `${adapter}: localized/open label`);

    await trigger.focus();
    await page.keyboard.press("Enter");
    await waitForNavOpen(selector, true);
    assert.equal(await trigger.getAttribute("aria-expanded"), "true");
    assert.equal(await trigger.getAttribute("aria-label"), closeLabel, `${adapter}: close label while open`);
    const geometry = await panel.evaluate(node => { const { position } = getComputedStyle(node); const rect = node.getBoundingClientRect(); return { left: rect.left, right: rect.right, width: rect.width, position, direction:getComputedStyle(node).direction, hostDirection:getComputedStyle(node.getRootNode().host).direction, hostDataDirection:node.getRootNode().host.dataset.direction, leftInset:getComputedStyle(node).left, rightInset:getComputedStyle(node).right, insetStart:getComputedStyle(node).insetInlineStart, insetEnd:getComputedStyle(node).insetInlineEnd }; });
    assert.equal(geometry.position, "fixed", `${adapter}: mobile drawer is viewport anchored`);
    assert.equal(geometry.width, 260, `${adapter}: mobile drawer follows the 260px design width`);
    assert.equal(direction === "rtl" ? geometry.right : geometry.left, direction === "rtl" ? 390 : 0, `${adapter}: drawer opens from the logical start ${JSON.stringify(geometry)}`);
    await page.screenshot({ path: resolve(`test-results/nav-responsive-${adapter}.png`), fullPage: true });

    await page.keyboard.press("Tab");
    const closeFocus = await page.evaluate(() => { let node = document.activeElement; while (node?.shadowRoot?.activeElement) node = node.shadowRoot.activeElement; return node?.className; });
    assert.equal(closeFocus, "mobile-close", `${adapter}: focus enters the drawer at its close control`);
    await page.keyboard.press("Tab");
    const firstNavFocus = await page.evaluate(() => { let node = document.activeElement; while (node?.shadowRoot?.activeElement) node = node.shadowRoot.activeElement; return { tag: node?.localName, label: node?.getAttribute("aria-label") }; });
    assert.deepEqual(firstNavFocus, { tag: "a", label: "Team" }, `${adapter}: Tab continues to the first destination`);
    await page.keyboard.press("Escape");
    await waitForNavOpen(selector, false);
    assert.equal(await trigger.getAttribute("aria-expanded"), "false", `${adapter}: Escape closes the drawer`);
    const restoredFocus = await page.evaluate(() => { let node = document.activeElement; while (node?.shadowRoot?.activeElement) node = node.shadowRoot.activeElement; return node?.className; });
    assert.equal(restoredFocus, "mobile-toggle", `${adapter}: Escape restores focus to the menu button`);

    await trigger.click();
    await waitForNavOpen(selector, true);
    await page.mouse.click(direction === "rtl" ? 20 : 370, 300);
    await waitForNavOpen(selector, false);
    assert.equal(await trigger.getAttribute("aria-expanded"), "false", `${adapter}: outside pointer closes the drawer`);

    await trigger.click();
    await waitForNavOpen(selector, true);
    await nav.getByRole("button", { name: "Home" }).click();
    await waitForNavOpen(selector, false);
    assert.equal(await trigger.getAttribute("aria-expanded"), "false", `${adapter}: selecting a destination closes the drawer`);
  }
  await page.setViewportSize({ width: 641, height: 844 });
  await page.waitForFunction(() => !window.matchMedia("(max-width: 640px)").matches);
  for (const selector of ["#native spui-nav", '[data-testid="react-nav"]']) await page.waitForFunction(selector => !document.querySelector(selector).shadowRoot.querySelector("nav").hasAttribute("popover"), selector);
  for (const selector of ["#native spui-nav", '[data-testid="react-nav"]']) {
    const nav = page.locator(selector);
    assert.equal(await nav.locator(".mobile-toggle").isVisible(), false, `${selector}: toggle hides above the breakpoint`);
    assert.equal(await nav.locator("nav").getAttribute("popover"), null, `${selector}: desktop navigation returns inline above 640px`);
    assert.equal(await nav.locator("nav").evaluate(node => getComputedStyle(node).width), "260px");
  }
  assert.deepEqual(pageErrors, []);
  assert.equal(await page.getByRole("link", { name: "Team" }).count(), 2);
  assert.equal(await page.getByRole("button", { name: "People" }).count(), 2);
  await page.screenshot({ path: resolve("test-results/nav-avatars-local.png"), fullPage: true });
  console.log(JSON.stringify({ browser: "Chromium headless", adapters: ["native", "React"], navAvatarSlot: true, avatarSize: "28px", collapsibleRail: { width: 64, labels: "aria-label + title", noIconFallback: true, rtlArrow: true, reducedMotion: true }, categoryDisclosureAccessibleName: true, categoryDisclosureKeyboard: true, responsive640px: true, popoverDismissal: ["Escape", "outside click", "selection"], focusRestore: true, logicalDrawerPlacement: true, avatarSurvivesHrefChange: true, pageErrors }));
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
