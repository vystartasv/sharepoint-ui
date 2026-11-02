import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://vystartasv.github.io",
  base: "/sharepoint-ui-docs",
  integrations: [starlight({
    title: "SharePoint UI",
    description: "Theme-aware components and reusable views for SharePoint Framework 1.24.",
    customCss: ["./src/styles/custom.css"],
    sidebar: [
      { label: "Start here", items: ["index", "getting-started", "catalog"] },
      { label: "Component catalog", items: [{ autogenerate: { directory: "components" } }] },
    ],
  })],
});
