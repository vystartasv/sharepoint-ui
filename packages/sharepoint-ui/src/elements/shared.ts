export const base = `:host{font:inherit;font-family:var(--spui-font-family,inherit);color:var(--spui-ui-text,var(--spui-semantic-body-text,var(--colorNeutralForeground1,#323130)));color-scheme:var(--spui-color-scheme,light dark)}button,input,textarea{font:inherit;font-family:var(--spui-font-family,inherit)}button:focus-visible,input:focus-visible,textarea:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-semantic-focus-border,var(--colorStrokeFocus2,#005a9e)));outline-offset:2px}`;

export type NativeFormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
export type NativeFormControlDefaults = {
  control: NativeFormControl;
  disabled: boolean;
  required: boolean;
  readOnly: boolean;
  multiple: boolean;
  value: string;
  defaultValue: string;
  checked: boolean;
  defaultChecked: boolean;
};

type AccessibleNameSyncState = { control: HTMLElement; originalLabel: string | null; originalLabelledBy: string | null; observer?: MutationObserver };
const accessibleNameSyncStates = new WeakMap<HTMLElement, AccessibleNameSyncState>();

export function stopHostAccessibleNameSync(host: HTMLElement): void {
  accessibleNameSyncStates.get(host)?.observer?.disconnect();
}

export function syncHostAccessibleName(host: HTMLElement, control: HTMLElement): void {
  const label = host.getAttribute("aria-label");
  const labelledBy = host.getAttribute("aria-labelledby");
  const root = control.getRootNode();
  const inShadowRoot = host.shadowRoot?.contains(control) ?? false;
  if (!inShadowRoot) return;
  let state = accessibleNameSyncStates.get(host);
  if (state?.control !== control) {
    state?.observer?.disconnect();
    state = {
      control,
      originalLabel: control.getAttribute("aria-label") === label ? null : control.getAttribute("aria-label"),
      originalLabelledBy: control.getAttribute("aria-labelledby") === labelledBy ? null : control.getAttribute("aria-labelledby"),
    };
    accessibleNameSyncStates.set(host, state);
  }
  if (label === null && labelledBy === null) {
    stopHostAccessibleNameSync(host);
    if (state.originalLabel === null) control.removeAttribute("aria-label"); else control.setAttribute("aria-label", state.originalLabel);
    if (state.originalLabelledBy === null) control.removeAttribute("aria-labelledby"); else control.setAttribute("aria-labelledby", state.originalLabelledBy);
    accessibleNameSyncStates.delete(host);
    return;
  }
  if (labelledBy !== null && inShadowRoot) {
    const ids = labelledBy.trim().split(/\s+/).filter(Boolean);
    const localRoot = root as ShadowRoot;
    if (ids.length && ids.every(id => localRoot.getElementById(id))) {
      stopHostAccessibleNameSync(host);
      control.removeAttribute("aria-label");
      control.setAttribute("aria-labelledby", labelledBy);
      return;
    }
    const scope = host.getRootNode() as Document | ShadowRoot;
    const resolved = ids.map(id => {
      const target = scope.getElementById(id) ?? host.ownerDocument.getElementById(id);
      return target?.getAttribute("aria-label") || target?.textContent?.trim() || "";
    }).filter(Boolean).join(" ");
    control.removeAttribute("aria-labelledby");
    if (resolved) control.setAttribute("aria-label", resolved); else control.removeAttribute("aria-label");
    const observer = state.observer ?? new MutationObserver(() => syncHostAccessibleName(host, control));
    state.observer = observer;
    observer.disconnect();
    const targets = ids.map(id => scope.getElementById(id) ?? host.ownerDocument.getElementById(id));
    for (const target of targets) if (target) observer.observe(target, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["aria-label", "aria-labelledby", "title"] });
    if (targets.some(target => !target)) {
      observer.observe(scope, { subtree: true, childList: true, attributes: true, attributeFilter: ["id"] });
      if (scope !== host.ownerDocument) observer.observe(host.ownerDocument.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["id"] });
    }
    return;
  }
  stopHostAccessibleNameSync(host);
  if (labelledBy !== null) control.setAttribute("aria-labelledby", labelledBy); else control.removeAttribute("aria-labelledby");
  if (labelledBy === null && label !== null) control.setAttribute("aria-label", label); else control.removeAttribute("aria-label");
}

export function rememberNativeFormControlDefaults(current: NativeFormControlDefaults | undefined, control: NativeFormControl): NativeFormControlDefaults {
  if (current?.control === control) return current;
  return {
    control,
    disabled: control.disabled,
    required: control.required,
    readOnly: "readOnly" in control && control.readOnly,
    multiple: "multiple" in control && control.multiple,
    value: control.value,
    defaultValue: "defaultValue" in control ? control.defaultValue : control.value,
    checked: "checked" in control && control.checked,
    defaultChecked: "defaultChecked" in control && control.defaultChecked,
  };
}

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

