import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://vystartasv.github.io",
  base: "/sharepoint-ui",
  integrations: [react(), starlight({
    title: "SharePoint UI",
    description: "Small themeable React components for SharePoint Framework.",
    disable404Route: true,
    social: [{ icon: "github", label: "GitHub", href: "https://github.com/vystartasv/sharepoint-ui" }],
    customCss: ["./src/styles/custom.css"],
    sidebar: [{ label: "Guides", items: ["index", "components", "theming", "agents", "deployment"] }],
  })],
});
