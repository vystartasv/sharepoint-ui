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

type AccessibleNameSyncState = { control: HTMLElement; originalLabel: string | null; originalLabelledBy: string | null; labelledBy?: string | null; observer?: Pick<MutationObserver, "disconnect"> };
const accessibleNameSyncStates = new WeakMap<HTMLElement, AccessibleNameSyncState>();

export function stopHostAccessibleNameSync(host: HTMLElement): void {
  const state = accessibleNameSyncStates.get(host);
  state?.observer?.disconnect();
  if (state) state.observer = undefined;
}

type AccessibleNameResolution = { name: string; targets: Set<Element>; unresolved: boolean };

function accessibleNameRoots(context: HTMLElement | Document): Array<Document | ShadowRoot> {
  const isDocument = context.nodeType === Node.DOCUMENT_NODE;
  const root = isDocument ? context : context.getRootNode();
  const document = isDocument ? context as Document : context.ownerDocument;
  return [...new Set([root, document].filter((value): value is Document | ShadowRoot => value != null && (value.nodeType === Node.DOCUMENT_NODE || (value.nodeType === Node.DOCUMENT_FRAGMENT_NODE && "host" in value))))];
}

function accessibleNameHidden(element: Element): boolean {
  const view = element.ownerDocument.defaultView;
  let current: Element | null = element;
  while (current) {
    if (current.hasAttribute("hidden") || current.getAttribute("aria-hidden") === "true") return true;
    if (view) {
      const style = view.getComputedStyle(current);
      if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse" || style.contentVisibility === "hidden") return true;
    }
    if (current.parentElement) current = current.parentElement;
    else {
      const root = current.getRootNode();
      current = root.nodeType === Node.DOCUMENT_FRAGMENT_NODE && "host" in root ? (root as ShadowRoot).host : null;
    }
  }
  return false;
}

function normalizeAccessibleText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function resolveAccessibleName(context: HTMLElement | Document, labelledBy: string): AccessibleNameResolution {
  const roots = accessibleNameRoots(context);
  const targets = new Set<Element>();
  const contentPath = new Set<Element>();
  let unresolved = false;
  const find = (id: string): Element | null => {
    for (const root of roots) {
      const target = root.getElementById(id);
      if (target) return target;
    }
    return null;
  };
  const resolveIds = (ids: string, path: Set<Element>): string => ids.trim().split(/\s+/).filter(Boolean).map(id => {
    const target = find(id);
    if (!target) { unresolved = true; return ""; }
    return nameOf(target, path, true);
  }).filter(Boolean).join(" ");
  const nameOf = (element: Element, path: Set<Element>, referenced: boolean): string => {
    targets.add(element);
    const alreadyReferenced = path.has(element);
    const repeatedContent = contentPath.has(element);
    const addedReference = referenced && !alreadyReferenced;
    if (addedReference) path.add(element);
    const addedContent = !repeatedContent;
    if (addedContent) contentPath.add(element);
    try {
      const hidden = accessibleNameHidden(element);
      if (hidden && !referenced) return "";
      const includeHiddenDescendants = hidden && referenced;
      if (referenced && ["none", "presentation"].includes(element.getAttribute("role") ?? "")) return "";
      const labelledByValue = element.getAttribute("aria-labelledby");
      if (labelledByValue && !alreadyReferenced) {
        const name = resolveIds(labelledByValue, path);
        if (name) return name;
      }
      const embedded = referenced || element.closest("label") !== null;
      if (embedded) {
        const role = element.getAttribute("role");
        if (role === "textbox" && (element as HTMLElement).isContentEditable) return normalizeAccessibleText(element.textContent ?? "");
        if (["slider", "spinbutton", "scrollbar", "progressbar"].includes(role ?? "")) {
          const valueText = element.getAttribute("aria-valuetext");
          if (valueText !== null) return normalizeAccessibleText(valueText);
          const valueNow = element.getAttribute("aria-valuenow");
          if (valueNow !== null) return normalizeAccessibleText(valueNow);
        }
        if (element.localName === "input") {
          const input = element as HTMLInputElement;
          if (["text", "search", "url", "tel", "email", "password", "number"].includes(input.type)) return normalizeAccessibleText(input.value);
          if (input.type === "range") return normalizeAccessibleText(input.value);
        }
        if (element.localName === "textarea") return normalizeAccessibleText((element as HTMLTextAreaElement).value);
        if (element.localName === "select") {
          const selected = [...(element as HTMLSelectElement).selectedOptions].map(option => normalizeAccessibleText(option.textContent ?? "")).filter(Boolean);
          return selected.join(" ");
        }
      }
      const ariaLabel = element.getAttribute("aria-label");
      if (ariaLabel?.trim()) return normalizeAccessibleText(ariaLabel);
      if (element.localName === "img" && element.hasAttribute("alt")) return normalizeAccessibleText(element.getAttribute("alt") ?? "");
      if (element.localName === "input") {
        const input = element as HTMLInputElement;
        if (input.type === "image" && element.hasAttribute("alt")) return normalizeAccessibleText(element.getAttribute("alt") ?? "");
        if (["button", "submit", "reset"].includes(input.type) && input.value) return normalizeAccessibleText(input.value);
      }
      if (element.namespaceURI === "http://www.w3.org/2000/svg" && element.localName === "svg") {
        const title = element.querySelector(":scope > title")?.textContent;
        if (title?.trim()) return normalizeAccessibleText(title);
      }
      const text = [...element.childNodes].map(node => {
        if (node.nodeType === Node.TEXT_NODE) return normalizeAccessibleText(node.textContent ?? "");
        return node.nodeType === Node.ELEMENT_NODE && !repeatedContent ? nameOf(node as Element, path, includeHiddenDescendants) : "";
      }).filter(Boolean).join(" ");
      return normalizeAccessibleText(text || element.getAttribute("title") || "");
    } finally {
      if (addedReference) path.delete(element);
      if (addedContent) contentPath.delete(element);
    }
  };
  return { name: resolveIds(labelledBy, new Set()), targets, unresolved };
}

export function observeAccessibleNameFromIdRefs(context: HTMLElement, labelledBy: string, onName: (name: string) => void): Pick<MutationObserver, "disconnect"> {
  const view = context.ownerDocument.defaultView;
  const Observer = view?.MutationObserver ?? MutationObserver;
  const observer = new Observer(() => update());
  const roots = accessibleNameRoots(context);
  const valueListeners = new Map<Element, EventListener>();
  const removeValueListeners = (): void => {
    for (const [target, listener] of valueListeners) {
      target.removeEventListener("input", listener);
      target.removeEventListener("change", listener);
    }
    valueListeners.clear();
  };
  const disconnectNative = observer.disconnect.bind(observer);
  const update = (): void => {
    const result = resolveAccessibleName(context, labelledBy);
    onName(result.name);
    disconnectNative();
    removeValueListeners();
    const subscriptions = new Map<Node, MutationObserverInit>();
    const add = (node: Node, options: MutationObserverInit): void => {
      const current = subscriptions.get(node) ?? {};
      const filters = new Set([...(current.attributeFilter ?? []), ...(options.attributeFilter ?? [])]);
      subscriptions.set(node, {
        childList: current.childList || options.childList,
        subtree: current.subtree || options.subtree,
        characterData: current.characterData || options.characterData,
        attributes: current.attributes || options.attributes,
        ...(filters.size ? { attributeFilter: [...filters] } : {}),
      });
    };
    for (const target of result.targets) {
      add(target, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["aria-label", "aria-labelledby", "alt", "title", "hidden", "aria-hidden", "id", "value", "class", "style"] });
      if (target.parentNode) add(target.parentNode, { childList: true });
      for (let parent = target.parentElement; parent; parent = parent.parentElement) {
        add(parent, { attributes: true, attributeFilter: ["class", "style", "hidden", "aria-hidden"] });
      }
    }
    if (result.unresolved) for (const root of roots) add(root, { subtree: true, childList: true, attributes: true, attributeFilter: ["id"] });
    for (const [node, options] of subscriptions) observer.observe(node, options);
    for (const target of result.targets) if (["input", "textarea", "select"].includes(target.localName)) {
      const listener: EventListener = () => update();
      target.addEventListener("input", listener);
      target.addEventListener("change", listener);
      valueListeners.set(target, listener);
    }
  };
  update();
  return { disconnect: () => { disconnectNative(); removeValueListeners(); } };
}

export function resolveAccessibleNameFromIdRefs(context: HTMLElement | Document, labelledBy: string): string {
  return resolveAccessibleName(context, labelledBy).name;
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
      state.labelledBy = labelledBy;
      control.removeAttribute("aria-label");
      control.setAttribute("aria-labelledby", labelledBy);
      return;
    }
    control.removeAttribute("aria-labelledby");
    if (state.labelledBy !== labelledBy || !state.observer) {
      stopHostAccessibleNameSync(host);
      state.labelledBy = labelledBy;
      state.observer = observeAccessibleNameFromIdRefs(host, labelledBy, resolved => {
        if (resolved) {
          if (control.getAttribute("aria-label") !== resolved) control.setAttribute("aria-label", resolved);
        } else if (control.hasAttribute("aria-label")) control.removeAttribute("aria-label");
      });
    }
    return;
  }
  stopHostAccessibleNameSync(host);
  state.labelledBy = labelledBy;
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

