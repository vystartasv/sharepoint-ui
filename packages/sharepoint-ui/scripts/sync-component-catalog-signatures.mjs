import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = resolve(pkgDir, "components.json");
const adapterPath = resolve(pkgDir, "src/react.tsx");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const adapterText = await readFile(adapterPath, "utf8");
const source = ts.createSourceFile(adapterPath, adapterText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const components = new Map();

function collect(node) {
  if (ts.isFunctionDeclaration(node) && node.name && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
    components.set(node.name.text, node);
  }
  if (ts.isVariableStatement(node) && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
    for (const declaration of node.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
      function findNamedFunction(candidate) {
        if (ts.isFunctionExpression(candidate) && candidate.name?.text === declaration.name.text) return candidate;
        let found;
        ts.forEachChild(candidate, child => { found ??= findNamedFunction(child); });
        return found;
      }
      const component = findNamedFunction(declaration.initializer);
      if (component) components.set(declaration.name.text, component);
    }
  }
  ts.forEachChild(node, collect);
}

collect(source);
const changed = [];
for (const entry of catalog.components) {
  const component = components.get(entry.react);
  const parameter = component?.parameters[0];
  if (!parameter) throw new Error(`Cannot find first React parameter for ${entry.react}`);
  const signature = parameter.getText(source);
  if (entry.api.reactSignature !== signature) {
    changed.push(entry.react);
    entry.api.reactSignature = signature;
  }
}

if (process.argv.includes("--check")) {
  if (changed.length) {
    console.error(`Catalog React signatures are stale: ${changed.join(", ")}`);
    process.exitCode = 1;
  } else console.log(`React signatures match all ${catalog.components.length} adapters.`);
} else if (changed.length) {
  await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`Updated ${changed.length} React signatures: ${changed.join(", ")}`);
} else console.log(`React signatures already match all ${catalog.components.length} adapters.`);
