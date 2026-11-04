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
const componentSubgroups = {
  Actions: {
    Buttons: ["Button", "ButtonGroup", "CommandBar"],
    "Links and menus": ["CopyButton", "Link", "Menu"],
  },
  Content: {
    Structure: ["Accordion", "Card", "List", "Text"],
    "Media and layout": ["Carousel", "Divider", "EmptyState", "Image"],
    "Labels and tags": ["Badge", "Rating", "Tag", "TagGroup"],
  },
  Forms: {
    Fields: ["Field", "Input", "Label", "TextArea"],
    Choices: ["Checkbox", "Radio", "RadioGroup", "Switch"],
    Pickers: ["ComboBox", "DateRangePicker", "Select", "SwatchPicker"],
    "Other controls": ["FileDropzone", "FilterBar", "TagPicker"],
  },
  Navigation: {
    "Site navigation": ["Breadcrumb", "Nav", "Tree"],
    "Page controls": ["Pagination", "Tabs", "ViewSwitcher"],
  },
  SharePoint: {
    Pickers: ["LookupPicker", "PersonPicker"],
    "Files and fields": ["AttachmentList", "SharePointField", "ViewCard"],
  },
};
const componentLink = component => ({ label: component.name, link: `/components/${componentSlug(component.name)}/` });
const componentSidebar = Object.entries(componentGroups).map(([label, items]) => {
  const subgroups = componentSubgroups[label];
  const assignedNames = Object.values(subgroups ?? {}).flat();
  if ((!subgroups && items.length > 4) || (subgroups && (
    assignedNames.length !== items.length || items.some(component => !assignedNames.includes(component.name)) ||
    Object.values(subgroups).some(names => names.length > 4)
  ))) {
    throw new Error(`Component sidebar groups for ${label} must list each component once, with no more than four links per group.`);
  }
  return {
    label,
    collapsed: true,
    items: subgroups
      ? Object.entries(subgroups).map(([groupLabel, names]) => ({
        label: groupLabel,
        collapsed: true,
        items: names.map(name => componentLink(items.find(component => component.name === name))),
      }))
      : items.map(componentLink),
  };
});

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
