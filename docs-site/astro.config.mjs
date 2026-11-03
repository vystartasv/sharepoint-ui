import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://vystartasv.github.io",
  base: "/sharepoint-ui-docs",
  integrations: [starlight({
    title: "SharePoint UI",
    description: "Theme-aware components and reusable views for SharePoint Framework 1.24.",
    social: [{ icon: "github", label: "GitHub", href: "https://github.com/vystartasv/sharepoint-ui" }],
    customCss: ["./src/styles/custom.css"],
    sidebar: [
      { label: "Start here", items: ["index", "getting-started", "catalog"] },
      { label: "Guides", items: ["guides/spfx", "guides/theming-and-direction", "guides/custom-elements", "guides/agent-workflow"] },
      { label: "Component catalog", items: [{ autogenerate: { directory: "components" } }] },
    ],
  })],
});
