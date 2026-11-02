import assert from "node:assert/strict";
import { build } from "esbuild";

const { outputFiles } = await build({
  entryPoints: ["packages/sharepoint-ui/src/theme.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`;
const { applySharePointTheme } = await import(moduleUrl);
const values = new Map();
const target = {
  style: {
    setProperty: (name, value) => values.set(name, value),
    removeProperty: name => values.delete(name),
    set colorScheme(value) { values.set("color-scheme", value); },
  },
  dataset: {},
};

applySharePointTheme(target, {
  effects: { elevation4: "0 1px 4px #0003" },
  spacing: { s1: "4px" },
  fonts: { medium: { fontFamily: "Arial", fontSize: 14, fontWeight: 400 } },
  defaultFontStyle: { fontFamily: "Verdana" },
});
assert.equal(values.get("--spui-effects-elevation4"), "0 1px 4px #0003");
assert.equal(values.get("--spui-spacing-s1"), "4px");
assert.equal(values.get("--spui-fonts-medium-font-family"), "Arial");
assert.equal(values.get("--spui-fonts-medium-font-size"), "14");
assert.equal(values.get("--spui-default-font-style-font-family"), "Verdana");

applySharePointTheme(target, { effects: { elevation8: "0 2px 8px #0004" } });
assert.equal(values.has("--spui-effects-elevation4"), false, "removed theme tokens do not remain stale");
assert.equal(values.get("--spui-effects-elevation8"), "0 2px 8px #0004");
console.log("SharePoint effects, spacing, and font theme tokens passed.");
