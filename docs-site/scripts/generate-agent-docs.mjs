import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import ts from "typescript";

const siteRoot = resolve(import.meta.dirname, "..");
const projectRoot = resolve(siteRoot, "..");
const packageRoot = resolve(projectRoot, "packages/sharepoint-ui");
const catalogPath = [
  resolve(packageRoot, "components.json"),
  resolve(siteRoot, "node_modules/@spfx-fast/sharepoint-ui/components.json"),
].find(existsSync);
if (!catalogPath) throw new Error("Cannot find components.json for agent docs.");

const output = resolve(siteRoot, "public/agents");
await mkdir(resolve(siteRoot, "public"), { recursive: true });
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const slug = value => (value === "SharePointField" ? "sharepoint-field" : value.replace(/([a-z0-9])([A-Z])/g, "$1-$2")).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
function elementEventsFor(source, fileName) {
  const root = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const events = new Map();
  const readName = node => node && (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) ? node.text : undefined;
  const readFlag = (options, key) => {
    if (!options) return false;
    if (!ts.isObjectLiteralExpression(options)) return "unknown";
    const property = options.properties.find(item => ts.isPropertyAssignment(item) && readName(item.name) === key);
    if (!property) return false;
    return property.initializer.kind === ts.SyntaxKind.TrueKeyword ? true : property.initializer.kind === ts.SyntaxKind.FalseKeyword ? false : "unknown";
  };
  const visit = node => {
    if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "CustomEvent") {
      const name = node.arguments?.[0];
      if (name && (ts.isStringLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name))) {
        const options = node.arguments?.[1];
        const detailProperty = options && ts.isObjectLiteralExpression(options)
          ? options.properties.find(item => ts.isPropertyAssignment(item) && readName(item.name) === "detail")
          : undefined;
        const detail = detailProperty?.initializer;
        const complete = !detailProperty || Boolean(detail && ts.isObjectLiteralExpression(detail) && detail.properties.every(item => !ts.isSpreadAssignment(item) && readName(item.name) !== undefined));
        const detailProperties = complete && detail && ts.isObjectLiteralExpression(detail)
          ? detail.properties.map(item => readName(item.name)).filter(Boolean)
          : [];
        const item = events.get(name.text) ?? { name: name.text, detailProperties: new Set(), complete: true, bubbles: new Set(), composed: new Set() };
        detailProperties.forEach(key => item.detailProperties.add(key));
        item.complete &&= complete;
        item.bubbles.add(readFlag(options, "bubbles"));
        item.composed.add(readFlag(options, "composed"));
        events.set(name.text, item);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(root);
  const delivery = values => values.size === 1 ? values.values().next().value === true ? "always" : values.values().next().value === false ? "never" : "unknown" : "varies";
  return [...events.values()].map(item => ({
    name: item.name,
    detailProperties: [...item.detailProperties].sort(),
    detailPropertiesComplete: item.complete,
    bubbles: delivery(item.bubbles),
    composed: delivery(item.composed),
  })).sort((a, b) => a.name.localeCompare(b.name));
}
function elementAttributesFor(source, fileName) {
  const root = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const classAttributes = new Map();
  const tagAttributes = {};
  const readName = node => node && (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined;
  const observedAttributes = node => {
    const property = node.members?.find(member => ts.isPropertyDeclaration(member) && readName(member.name) === "observedAttributes" && ts.getModifiers(member)?.some(modifier => modifier.kind === ts.SyntaxKind.StaticKeyword));
    return property && ts.isArrayLiteralExpression(property.initializer)
      ? property.initializer.elements.map(readName).filter(Boolean)
      : [];
  };
  const readClasses = node => {
    if ((ts.isClassDeclaration(node) || ts.isClassExpression(node)) && node.name) classAttributes.set(node.name.text, observedAttributes(node));
    ts.forEachChild(node, readClasses);
  };
  readClasses(root);
  const readDefinitions = node => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "define") {
      const receiver = node.expression.expression;
      const isCustomElements = (ts.isIdentifier(receiver) && receiver.text === "customElements") || (ts.isPropertyAccessExpression(receiver) && receiver.name.text === "customElements");
      const tag = readName(node.arguments[0]);
      const definition = node.arguments[1];
      const className = definition && ts.isIdentifier(definition) ? definition.text : undefined;
      const attrs = definition && (ts.isClassDeclaration(definition) || ts.isClassExpression(definition))
        ? observedAttributes(definition)
        : className ? classAttributes.get(className) ?? [] : [];
      if (isCustomElements && tag && attrs.length) tagAttributes[tag] = [...new Set(attrs)].sort();
    }
    ts.forEachChild(node, readDefinitions);
  };
  readDefinitions(root);
  return tagAttributes;
}
const modules = new Map();
const elementModuleEvents = {};
const elementModuleAttributes = {};
for (let componentIndex = 0; componentIndex < catalog.components.length; componentIndex++) {
  const component = catalog.components[componentIndex];
  const sourcePath = resolve(packageRoot, "src/elements", `${component.module}.ts`);
  if (!(component.module in elementModuleAttributes)) {
    const source = await readFile(sourcePath, "utf8").catch(() => "");
    elementModuleEvents[component.module] = elementEventsFor(source, sourcePath);
    elementModuleAttributes[component.module] = elementAttributesFor(source, sourcePath);
  }
  const attributes = component.tag ? elementModuleAttributes[component.module]?.[component.tag] : undefined;
  const enriched = attributes ? { ...component, customElementAttributes: attributes } : component;
  catalog.components[componentIndex] = enriched;
  modules.set(component.module, [...(modules.get(component.module) ?? []), enriched]);
}
catalog.elementEventScope = "Events are listed by source module because a module can define a parent and its child tags. Check event.target when a module composes multiple tags; detailProperties lists statically declared top-level keys and may be incomplete when detailPropertiesComplete is false.";
const sliceContract = Object.fromEntries(["composition", "state", "customElements"].map(key => [key, catalog.agentContract[key]]));
sliceContract.customElements += " Where present, a component JSON slice reports its tag's statically declared observed attributes as customElementAttributes; set non-attribute objects and callbacks as DOM properties.";
await writeFile(join(output, "components.json"), `${JSON.stringify(catalog, null, 2)}\n`);
await mkdir(join(output, "modules"), { recursive: true });
await mkdir(join(output, "components"), { recursive: true });
await mkdir(join(output, "events"), { recursive: true });
for (const [module, components] of modules) {
  const eventInventory = { url: `https://vystartasv.github.io/sharepoint-ui/agents/events/${slug(module)}.json`, scope: "source module; composed child tags may also emit listed events" };
  await writeFile(join(output, "modules", `${slug(module)}.json`), `${JSON.stringify({ package: catalog.package, module, elementEventInventory: eventInventory, components }, null, 2)}\n`);
  await writeFile(join(output, "events", `${slug(module)}.json`), `${JSON.stringify({ module, scope: catalog.elementEventScope, events: elementModuleEvents[module] }, null, 2)}\n`);
  for (const component of components) {
    const componentSlug = slug(component.react ?? component.tag ?? component.module);
    const componentPath = join(output, "components", slug(module), `${componentSlug}.json`);
    await mkdir(dirname(componentPath), { recursive: true });
    await writeFile(componentPath, `${JSON.stringify({ package: catalog.package, agentContract: sliceContract, elementEventInventory: eventInventory, component }, null, 2)}\n`);
  }
}

const skillRoot = resolve(packageRoot, "skills/sharepoint-ui");
await copyFile(resolve(packageRoot, "QUICKSTART.md"), join(output, "QUICKSTART.md"));
const sourceAgentGuide = await readFile(resolve(packageRoot, "AGENTS.md"), "utf8");
const agentGuide = sourceAgentGuide.replace("](../../investigation/FLUENT-V9-PARITY-PLAN.md)", "](https://github.com/vystartasv/sharepoint-ui/blob/main/investigation/FLUENT-V9-PARITY-PLAN.md)");
await writeFile(join(output, "AGENTS.md"), agentGuide);
const sourceSkill = await readFile(resolve(skillRoot, "SKILL.md"), "utf8");
const publishedSkill = sourceSkill
  .replace("`../../components.json`", "[`components.json`](https://vystartasv.github.io/sharepoint-ui/agents/components.json)")
  .replace("](../../QUICKSTART.md)", "](https://vystartasv.github.io/sharepoint-ui/agents/QUICKSTART.md)");
await writeFile(join(output, "SKILL.md"), publishedSkill);
await mkdir(join(output, "references"), { recursive: true });
for (const name of ["choosing-components.md", "sharepoint-patterns.md"]) {
  await copyFile(resolve(skillRoot, "references", name), join(output, "references", name));
}
const [skill, choosing, patterns] = await Promise.all([
  readFile(join(output, "SKILL.md"), "utf8"),
  readFile(join(output, "references/choosing-components.md"), "utf8"),
  readFile(join(output, "references/sharepoint-patterns.md"), "utf8"),
]);
const full = [
  "# SharePoint UI agent context pack",
  "\nUse this full pack when broad context is useful. For smaller prompts, download `AGENTS.md` plus one module or component JSON slice instead.",
  "\n## Agent guide\n\n" + agentGuide,
  "\n## Agent skill\n\n" + skill,
  "\n## Choosing components\n\n" + choosing,
  "\n## SharePoint patterns\n\n" + patterns,
].join("\n");
await writeFile(resolve(siteRoot, "public/llms-full.txt"), `${full.trim()}\n`);

const moduleLinks = [...modules.keys()].sort().map(module => `- [${module} JSON slice](https://vystartasv.github.io/sharepoint-ui/agents/modules/${slug(module)}.json)`).join("\n");
const agentIndex = `# SharePoint UI agent references\n\n- [Quickstart](https://vystartasv.github.io/sharepoint-ui/agents/QUICKSTART.md)\n- [Agent instructions](https://vystartasv.github.io/sharepoint-ui/agents/AGENTS.md)\n- [SharePoint UI skill](https://vystartasv.github.io/sharepoint-ui/agents/SKILL.md)\n- [Full component catalog JSON](https://vystartasv.github.io/sharepoint-ui/agents/components.json)\n- [Full context pack](https://vystartasv.github.io/sharepoint-ui/llms-full.txt)\n- [Browsable human documentation](https://vystartasv.github.io/sharepoint-ui/)\n\n## Module slices\n\n${moduleLinks}\n`;
await writeFile(resolve(siteRoot, "public/llms.txt"), agentIndex);
console.log(JSON.stringify({ components: catalog.components.length, modules: modules.size, componentSlices: catalog.components.length, output: "public/agents" }));
