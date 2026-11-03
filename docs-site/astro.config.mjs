import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = import.meta.dirname;
const catalogPath = [
  resolve(root, "../packages/sharepoint-ui/components.json"),
  resolve(root, "node_modules/@spfx-fast/sharepoint-ui/components.json"),
].find(existsSync);
if (!catalogPath) throw new Error("Cannot find the SharePoint UI component catalog.");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const titleFor = value => value.split("-").map(part => part === "ui" ? "UI" : part[0].toUpperCase() + part.slice(1)).join(" ");
const slugFor = value => value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
const componentsByModule = new Map();
for (const component of catalog.components) componentsByModule.set(component.module, [...(componentsByModule.get(component.module) ?? []), component]);
const componentSidebar = [...componentsByModule.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([module, components]) => ({
  label: titleFor(module),
  collapsed: true,
  items: components.map(component => {
    const name = component.react?.replace(/([a-z0-9])([A-Z])/g, "$1 $2") ?? titleFor(component.tag?.replace(/^spui-/, "") ?? component.module);
    return { label: name, link: `/components/${module}/${slugFor(component.react ?? component.tag ?? name)}/` };
  }),
}));

export default defineConfig({
  site: "https://vystartasv.github.io",
  base: "/sharepoint-ui",
  vite: {
    build: {
      rolldownOptions: {
        onwarn(warning, defaultHandler) {
          // ponytail: Astro generates this internal directive once per MDX page; the completed static build confirms it is handled by Astro.
          if (warning.code === "MODULE_LEVEL_DIRECTIVE" && warning.message.includes("use astro:head-inject") && warning.id?.includes("?astroPropagatedAssets")) return;
          defaultHandler(warning);
        },
      },
    },
  },
  integrations: [starlight({
    title: "SharePoint UI",
    description: "Theme-aware components and reusable views for SharePoint Framework 1.24.",
    // The content catch-all emits src/content/docs/404.md; avoid injecting a duplicate route.
    disable404Route: true,
    head: [{
      tag: "script",
      content: `try { const key = "starlight-theme"; const saved = localStorage.getItem(key); if (saved !== "light" && saved !== "dark") localStorage.setItem(key, matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); } catch {}`,
    }],
    components: { Header: "./src/components/DocsHeader.astro" },
    social: [{ icon: "github", label: "GitHub", href: "https://github.com/vystartasv/sharepoint-ui" }],
    customCss: ["./src/styles/custom.css"],
    sidebar: [
      { label: "For people", items: ["index", "getting-started", "catalog", { label: "Rich text editor", link: "/components/rich-text-editor/rich-text-editor/" }] },
      { label: "For agents", items: [{ label: "Agent documentation", link: "/agents/" }] },
      { label: "Guides", items: ["guides/spfx", { label: "Copilot UX in SPFx 1.24", link: "/guides/copilot-ux/" }, "guides/payload", "guides/theming-and-direction", "guides/saved-palettes", "guides/component-patterns", "guides/custom-elements", { label: "Save rich text in SharePoint", link: "/guides/rich-text-editor/" }, "guides/agent-workflow"] },
      { label: "Component catalog", collapsed: true, items: componentSidebar },
    ],
  })],
});
