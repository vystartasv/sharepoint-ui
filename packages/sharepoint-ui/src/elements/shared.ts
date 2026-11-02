export const base = `:host{font:inherit;font-family:var(--spui-font-family,inherit);color:var(--spui-ui-text,var(--spui-semantic-body-text,var(--colorNeutralForeground1,#323130)));color-scheme:var(--spui-color-scheme,light dark)}button,input,textarea{font:inherit;font-family:var(--spui-font-family,inherit)}button:focus-visible,input:focus-visible,textarea:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-semantic-focus-border,var(--colorStrokeFocus2,#005a9e)));outline-offset:2px}`;

export function findFocusable(root: ParentNode): HTMLElement | undefined {
  const selector = "button,a[href],input:not([type=hidden]),select,textarea,[tabindex],slot";
  const candidates = [...(root instanceof HTMLElement && root.matches(selector) ? [root] : []), ...root.querySelectorAll<HTMLElement>(selector)];
  for (const node of candidates) {
    if (!node.hasAttribute("disabled") && node.tabIndex >= 0 && node.getClientRects().length) return node;
    if (node.shadowRoot) { const nested = findFocusable(node.shadowRoot); if (nested) return nested; }
    if (node instanceof HTMLSlotElement) for (const assigned of node.assignedElements({ flatten: true })) { const nested = findFocusable(assigned); if (nested) return nested; }
  }
  return undefined;
}

