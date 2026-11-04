import { defineConfig } from "astro/config";
import { readFileSync } from "node:fs";
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";

const { components } = JSON.parse(readFileSync(new URL("../packages/sharepoint-ui/components.json", import.meta.url), "utf8"));
const componentGroups = components.filter(component => component.available).reduce((groups, component) => {
  (groups[component.group] ??= []).push(component);
  return groups;
}, {});
const componentSlug = name => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const componentSidebar = Object.entries(componentGroups).map(([label, items]) => ({
  label,
  collapsed: true,
  items: items.map(component => ({ label: component.name, link: `/components/${componentSlug(component.name)}/` })),
}));

export default defineConfig({
  site: "https://vystartasv.github.io",
  base: "/sharepoint-ui",
  integrations: [react(), starlight({
    title: "SharePoint UI",
    description: "Small themeable React components for SharePoint Framework.",
    disable404Route: true,
    social: [{ icon: "github", label: "GitHub", href: "https://github.com/vystartasv/sharepoint-ui" }],
    customCss: ["./src/styles/custom.css"],
    sidebar: [
      { label: "Guides", items: ["index", "components", "theming", "agents", "deployment"] },
      { label: "Components", collapsed: false, items: componentSidebar },
    ],
  })],
});
