import assert from "node:assert/strict";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const bundle = await build({
  stdin: {
    sourcefile: "nav-multiple.tsx",
    loader: "tsx",
    resolveDir: process.cwd(),
    contents: `
      import * as React from "react";
      import { createRoot } from "react-dom/client";
      import { Nav, NavCategory, NavCategoryItem, NavSubItemGroup, NavSubItem } from "${resolve("packages/sharepoint-ui/src/react.tsx")}";
      import { defineNav } from "${resolve("packages/sharepoint-ui/src/elements/nav.ts")}";
      const addCategory = (nav, value) => {
        const category = document.createElement("spui-nav-category"); category.setAttribute("value", value);
        const item = document.createElement("spui-nav-category-item"); item.textContent = value;
        const group = document.createElement("spui-nav-sub-item-group"); const child = document.createElement("spui-nav-sub-item"); child.setAttribute("value", value + "-child"); child.textContent = "child"; group.append(child);
        category.append(item, group); nav.append(category);
      };
      const Category = ({ value }) => React.createElement(NavCategory, { value }, React.createElement(NavCategoryItem, null, value), React.createElement(NavSubItemGroup, null, React.createElement(NavSubItem, { value: value + "-child" }, "child")));
      window.mount = () => {
        defineNav();
        for (const [id, single] of [["native-multiple", false], ["native-single", true]]) {
          const nav = document.createElement("spui-nav"); nav.dataset.testid = id; nav.setAttribute("label", id);
          if (single) nav.setAttribute("multiple", "false");
          nav.defaultOpenCategories = ["first", "second"];
          addCategory(nav, "first"); addCategory(nav, "second"); document.body.append(nav);
        }
        function App() { return <><Nav data-testid="react-multiple" label="React multiple" defaultOpenCategories={["first", "second"]}><Category value="first"/><Category value="second"/></Nav><Nav data-testid="react-single" label="React single" multiple={false} defaultOpenCategories={["first", "second"]}><Category value="first"/><Category value="second"/></Nav></>; }
        createRoot(document.querySelector("#react")).render(<App/>);
      };
    `,
  },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});

const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><main id='react'></main><script src='/bundle.js'></script><script>window.mount()</script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector('[data-testid="react-single"]')?.shadowRoot.querySelectorAll("[hidden]").length >= 1);

  for (const [id, expectMulti] of [["native-multiple", true], ["react-multiple", true], ["native-single", false], ["react-single", false]]) {
    const nav = page.getByTestId(id);
    const groups = nav.locator("spui-nav-sub-item-group");
    assert.equal(await groups.nth(0).isHidden(), false, `${id}: first default-open category is open`);
    assert.equal(await groups.nth(1).isHidden(), !expectMulti, `${id}: multiple default matches Fluent contract`);
    if (id === "react-multiple") assert.equal(await nav.getAttribute("multiple"), "", "React multiple defaults to true");
    if (id === "react-single") assert.equal(await nav.getAttribute("multiple"), "false", "React false is distinct from omitted/default true");
    const toggleCategory = async index => {
      await nav.locator("spui-nav-category-item").nth(index).locator("button").focus();
      await page.keyboard.press("Enter");
    };
    if (expectMulti) {
      await toggleCategory(0);
      assert.equal(await groups.nth(0).isHidden(), true, `${id}: first category closes independently`);
      assert.equal(await groups.nth(1).isHidden(), false, `${id}: second category stays open`);
      await toggleCategory(0);
      assert.equal(await groups.nth(0).isHidden(), false, `${id}: first category reopens`);
      assert.equal(await groups.nth(1).isHidden(), false, `${id}: multiple open categories stay open`);
    } else {
      await toggleCategory(1);
      assert.equal(await groups.nth(0).isHidden(), true, `${id}: single-open mode closes the first category`);
      assert.equal(await groups.nth(1).isHidden(), false, `${id}: single-open mode opens the second category`);
    }
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "passed", defaultMultipleOpen: true, explicitSingleOpen: true, defaultOpenCategoriesRespectsMultiple: true, adapters: ["React", "custom element"], pageErrors: errors.length }));
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
