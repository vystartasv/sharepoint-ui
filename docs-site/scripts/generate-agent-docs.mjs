import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

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
const slug = value => value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
const modules = new Map();
for (const component of catalog.components) modules.set(component.module, [...(modules.get(component.module) ?? []), component]);

await writeFile(join(output, "components.json"), `${JSON.stringify(catalog, null, 2)}\n`);
await mkdir(join(output, "modules"), { recursive: true });
await mkdir(join(output, "components"), { recursive: true });
for (const [module, components] of modules) {
  await writeFile(join(output, "modules", `${slug(module)}.json`), `${JSON.stringify({ package: catalog.package, module, components }, null, 2)}\n`);
  for (const component of components) {
    const componentSlug = slug(component.react ?? component.tag ?? component.module);
    const componentPath = join(output, "components", slug(module), `${componentSlug}.json`);
    await mkdir(dirname(componentPath), { recursive: true });
    await writeFile(componentPath, `${JSON.stringify({ package: catalog.package, component }, null, 2)}\n`);
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
