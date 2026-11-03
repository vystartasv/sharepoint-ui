export function observeDocsPreviewColorScheme(...targets) {
  const apply = () => {
    const scheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    for (const target of targets) {
      if (!(target instanceof HTMLElement)) continue;
      target.style.colorScheme = scheme;
      target.style.setProperty("--spui-color-scheme", scheme);
    }
  };
  new MutationObserver(apply).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  apply();
  return apply;
}
