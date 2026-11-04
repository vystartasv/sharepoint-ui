import catalog from "../../../packages/sharepoint-ui/components.json";

export const availableComponents = catalog.components.filter(component => component.available);
export const componentGroups = availableComponents.reduce((groups, component) => {
  groups[component.group] ??= [];
  groups[component.group].push(component);
  return groups;
}, {});

export function componentSlug(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}
