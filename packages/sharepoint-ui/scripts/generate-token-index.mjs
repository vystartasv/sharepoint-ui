import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = resolve(packageDir, "src");
const outputPath = resolve(packageDir, "tokens.json");
const checkOnly = process.argv.includes("--check");
const components = new Map();
const declarations = new Map();
const addTokens = (map, source, text) => {
  for (const token of text.match(/--spui-[\w-]+/g) ?? []) {
    if (token === "--spui-palette-") continue;
    const sources = map.get(token) ?? new Set();
    sources.add(source);
    map.set(token, sources);
  }
};

for (const file of (await readdir(resolve(sourceDir, "elements"))).filter(name => name.endsWith(".ts")).sort()) {
  addTokens(components, file.slice(0, -3), await readFile(resolve(sourceDir, "elements", file), "utf8"));
}
for (const file of ["appearance.ts", "theme.ts"]) {
  addTokens(declarations, file.slice(0, -3), await readFile(resolve(sourceDir, file), "utf8"));
}

const tokens = [...new Set([...components.keys(), ...declarations.keys()])].sort().map(name => ({
  name,
  components: [...(components.get(name) ?? [])].sort(),
  declaredBy: [...(declarations.get(name) ?? [])].sort()
}));
const dynamicPrefixes = [{ prefix: "--spui-palette-", declaredBy: ["theme"] }];
const content = `${JSON.stringify({ generatedFrom: "src/elements/*.ts, src/appearance.ts, src/theme.ts", dynamicPrefixes, tokens }, null, 2)}\n`;
if (checkOnly) {
  const current = await readFile(outputPath, "utf8").catch(() => "");
  if (current !== content) {
    console.error("Token index is stale. Run npm run tokens:generate --workspace @vilius/sharepoint-ui.");
    process.exitCode = 1;
  } else console.log(`Token index is current (${tokens.length} tokens).`);
} else {
  await writeFile(outputPath, content);
  console.log(`Wrote ${tokens.length} component token entries to ${outputPath}.`);
}
