import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const catalog = JSON.parse(await readFile(resolve(root, "packages/sharepoint-ui/components.json"), "utf8"));
const verifierFiles = (await readdir(resolve(root, "scripts"))).filter(file => file.startsWith("verify-") && file.endsWith(".mjs"));
const verifiers = await Promise.all(verifierFiles.map(async file => ({ file, source: await readFile(resolve(root, "scripts", file), "utf8") })));

function importedReactNames(source) {
  const names = new Set();
  const pattern = /import\s*\{([^}]+)\}\s*from([^;\n]*)/g;
  for (const match of source.matchAll(pattern)) {
    if (!/(?:react\.tsx|reactPath)/.test(match[2])) continue;
    for (const item of match[1].split(",")) {
      const name = item.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0];
      if (/^[A-Za-z_$][\w$]*$/.test(name)) names.add(name);
    }
  }
  return names;
}

const rows = catalog.components.map(component => {
  const references = [];
  const familyReferences = [];
  for (const verifier of verifiers) {
    const imports = importedReactNames(verifier.source);
    const signals = [];
    if (imports.has(component.react)) signals.push("react-import");
    if (verifier.source.includes(component.tag)) signals.push("custom-element-tag");
    if (signals.length) references.push({ verifier: verifier.file, signals });
    else if (verifier.source.includes(`elements/${component.module}.ts`) || verifier.source.includes(`elements/${component.module}.js`)) familyReferences.push(verifier.file);
  }
  if (!references.length) {
    for (const verifier of verifiers) {
      if (verifier.source.includes("names.join") && new RegExp(`\\b${component.react}\\s*:`).test(verifier.source)) references.push({ verifier: verifier.file, signals: ["generated-react-import"] });
    }
  }
  return { react: component.react, module: component.module, tag: component.tag, references, familyReferences };
});

const directlyReferenced = rows.filter(row => row.references.length);
const uncovered = rows.filter(row => !row.references.length);
console.log(JSON.stringify({
  scope: "Static inventory of verifier-file references. A reference is not proof that all behavior, states, browsers, or accessibility paths are covered.",
  catalogEntries: rows.length,
  verifierScripts: verifiers.length,
  entriesWithDirectVerifierReferences: directlyReferenced.length,
  entriesWithoutDirectVerifierReferences: uncovered.length,
  familyOnlyVerifierReferences: rows.filter(row => !row.references.length && row.familyReferences.length).length,
  uncovered,
}, null, 2));
if (process.argv.includes("--check") && uncovered.length) {
  console.error(`Runtime verifier reference check failed for ${uncovered.length} catalog entries: ${uncovered.map(row => row.react).join(", ")}`);
  process.exitCode = 1;
}
