import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://vystartasv.github.io",
  base: "/sharepoint-ui",
  integrations: [starlight({
    title: "SharePoint UI",
    description: "Small themeable React components for SharePoint Framework.",
    disable404Route: true,
    social: [{ icon: "github", label: "GitHub", href: "https://github.com/vystartasv/sharepoint-ui" }],
    customCss: ["./src/styles/custom.css"],
    sidebar: [{ label: "Guide", items: ["index"] }],
  })],
});
