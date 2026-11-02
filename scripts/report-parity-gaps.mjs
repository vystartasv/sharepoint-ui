import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const [baseline, local, reactSource] = await Promise.all([
  readFile(resolve(root, "investigation/fluent-v9-catalog-9.75.0.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "packages/sharepoint-ui/components.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "packages/sharepoint-ui/src/react.tsx"), "utf8"),
]);
const aliases = {
  breadcrumb: ["Breadcrumb", "BreadcrumbItem"],
  carousel: ["Carousel"],
  combobox: ["ComboboxProvider", "Dropdown", "Listbox", "Option", "OptionGroup"],
  image: ["Image"],
  infobutton: ["InfoButton"],
  infolabel: ["InfoLabel"],
  overflow: ["Overflow"],
  persona: ["Persona"],
  rating: ["Rating"],
  "swatch-picker": ["SwatchPicker"],
  "teaching-popover": ["TeachingPopover"],
  toolbar: ["Toolbar"],
  tree: ["Tree"],
  tags: ["Tag", "TagGroup"],
  table: ["DataGrid"],
  tabs: ["TabList", "Tab", "TabPanel"],
  "tag-picker": ["TagPicker"],
  virtualizer: ["Virtualizer", "VirtualizerScrollView", "VirtualizerScrollViewDynamic"],
};
const localNameEquivalents = { card: { Card: "SharePointCard" }, toolbar: { ToolbarDivider: "ToolbarSeparator" }, combobox: { Combobox: "ComboBox" } };
const normalize = value => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const localNames = new Set([
  ...local.components.map(component => component.react),
  ...[...reactSource.matchAll(/export function ([A-Za-z_$][\w$]*)\s*(?:<[^>\n]+>)?\s*\(/g)].map(([, name]) => name),
].map(normalize));
const rows = baseline.families.map(({ family, componentExamples = [] }) => {
  const expected = [...new Set([...componentExamples, ...(aliases[family] ?? [])])];
  const equivalents = localNameEquivalents[family] ?? {};
  const missing = expected.filter(name => !localNames.has(normalize(name)) && !localNames.has(normalize(equivalents[name] ?? "")));
  return { family, expected, missing };
});
const missing = rows.filter(row => row.missing.length);
if (process.argv.includes("--check") && missing.length) process.exitCode = 1;

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ baseline: `${baseline.reference}@${baseline.version}`, localCatalogEntries: local.components.length, families: rows, missingFamilyCount: missing.length }, null, 2));
} else {
  console.log(`${baseline.reference}@${baseline.version} named-API gap report`);
  console.log(`${local.components.length} local catalog entries; ${missing.length}/${rows.length} Fluent families have at least one named API missing.`);
  console.log("This compares exported names only; it does not claim behavior, accessibility, theme, documentation, or performance parity.");
  for (const row of missing) console.log(`- ${row.family}: ${row.missing.join(", ")}`);
}
