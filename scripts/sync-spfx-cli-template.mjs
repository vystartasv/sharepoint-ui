import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "examples/spfx124-copilot-ux");
const destination = path.join(root, "templates/spfx-fast-copilot-access-review");
const packageJson = JSON.parse(await fs.readFile(path.join(source, "package.json"), "utf8"));
const sharePointUI = JSON.parse(await fs.readFile(path.join(root, "packages/sharepoint-ui/package.json"), "utf8"));
const excluded = new Set(["node_modules", "package-lock.json", ".yo-rc.json", ".npmignore", ".vscode", "dist", "lib", "lib-commonjs", "lib-esm", "lib-dts", "release", "sharepoint", "teams", "temp", ".heft"]);

const replacements = [
  ['"name": "spfx-fast-access-review"', '"name": "<%= libraryName %>"'],
  ["file:../../packages/sharepoint-ui", `^${sharePointUI.version}`],
  ["spfx-fast-access-review-client-side-solution", "<%= solution_name %>-client-side-solution"],
  ["spfx-fast-access-review.sppkg", "<%= solution_name %>.sppkg"],
  ['"container": "spfx-fast-access-review"', '"container": "<%= solution_name %>"'],
  ["85fcd4b8-d9d2-4ea8-a63a-78a8bec0109a", "<%= solutionId %>"],
  ["a8556135-6356-408f-8a07-1d040af14d22", "<%= featureId %>"],
  ["b323fe6f-f51d-4649-a1be-b333421a8c7a", "<%= componentId %>"],
  ["2465fa77-9a48-472f-a970-92cfb974116d", "<%= solutionId %>"],
  ["AccessReviewTool", "<%= componentName.pascal %>Tool"],
  ["accessReviewAction", "<%= componentName.camel %>Action"],
  ["accessReviewAgent", "<%= componentName.camel %>Agent"],
  ['"namespace": "accessReview"', '"namespace": "<%= componentName.camel %>"'],
  ["SharePoint Access Review", "<%= componentName %>"],
  ["Access review Agent", "<%= componentName %> Agent"],
  ["Read and approve items in the user's authorized SharePoint access review list.", "<%= componentDescription %>"],
  ["Review and approve authorized SharePoint access review items.", "<%= componentDescription %>"],
  ["Review and approve SharePoint access review items.", "<%= componentDescription %>"]
];

async function copyTree(from, to, relative = "") {
  await fs.mkdir(to, { recursive: true });
  for (const item of await fs.readdir(from, { withFileTypes: true })) {
    if (excluded.has(item.name)) continue;
    const sourcePath = path.join(from, item.name);
    const targetPath = path.join(to, item.name);
    if (item.isDirectory()) {
      await copyTree(sourcePath, targetPath, path.join(relative, item.name));
      continue;
    }

    const contents = await fs.readFile(sourcePath);
    if (item.name.endsWith(".png")) {
      await fs.writeFile(targetPath, contents);
      continue;
    }

    let text = contents.toString("utf8");
    for (const [fromValue, toValue] of replacements) text = text.split(fromValue).join(toValue);
    if (relative === "" && item.name === "README.md") text = templateReadme;
    await fs.writeFile(targetPath, text);
  }
}

const templateReadme = `# <%= componentName %> for SharePoint and Copilot

Framework-free SPFx 1.24.1 Copilot UX component using SharePoint UI. It reads the signed-in user's latest access-review items, supports local filtering and RTL, applies SharePoint theme tokens, saves user-approved changes with \`SPHttpClient\`, and keeps Copilot informed of the visible state.

## List fields

Create a SharePoint list with the default \`Title\` field and a single-line text \`Status\` field. Use \`Pending\` and \`Approved\` values. Pass the list ID when the agent asks for it. Users need edit access to approve.

## Run

\`\`\`sh
npm install
npm run build
npm start
\`\`\`

Set \`{tenantDomain}\` in \`config/serve.json\` before running the local Copilot Workbench. Deploy the resulting \`.sppkg\` to the tenant App Catalog and follow Microsoft's [Copilot UX deployment guide](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/copilot/get-started/build-your-first-copilot-app).

The example uses direct imports of Button, SearchBox, Tag, and ViewCard; React is not required. Approval is reported as saved only after SharePoint confirms the update.
`;

await fs.rm(destination, { recursive: true, force: true });
await copyTree(source, destination);
await fs.writeFile(path.join(destination, "template.json"), `${JSON.stringify({
  name: "spfx-fast-copilot-access-review",
  description: "Framework-free SPFx 1.24 Copilot UX component using SharePoint UI and live SharePoint list data.",
  category: "webpart",
  version: "0.1.0",
  spfxVersion: "1.24.1",
  minimumEngineVersion: "0.1.0-pre.3"
}, null, 2)}\n`);

console.log(`Generated ${path.relative(root, destination)} from ${path.relative(root, source)}.`);
