import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

const sourceDirectory = "packages/sharepoint-ui/src";
const componentFiles = (await readdir(`${sourceDirectory}/elements`))
  .filter(file => file.endsWith(".ts"))
  .map(file => `${sourceDirectory}/elements/${file}`);
componentFiles.push(`${sourceDirectory}/react.tsx`);

const usedRoles = new Set();
for (const file of componentFiles) {
  const source = await readFile(file, "utf8");
  for (const role of source.match(/--spui-(?:ui|layer)-[\w-]+/g) ?? []) usedRoles.add(role);
}

const themeSources = await Promise.all(["appearance.ts", "theme.ts"].map(file => readFile(`${sourceDirectory}/${file}`, "utf8")));
const definedRoles = new Set(themeSources.flatMap(source => source.match(/--spui-(?:ui|layer)-[\w-]+/g) ?? []));
const missing = [...usedRoles].filter(role => !definedRoles.has(role)).sort();
assert.deepEqual(missing, [], `Shared component theme roles need a theme default or typed mapping: ${missing.join(", ")}`);

console.log(`Shared theme and layer role coverage passed (${usedRoles.size} roles used across ${componentFiles.length} source files).`);
