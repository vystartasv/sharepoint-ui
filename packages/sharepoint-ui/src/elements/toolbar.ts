import { buttonControlCss } from "./button.js";
import { base } from "./shared.js";

const itemSelector = "button:not(:disabled),a[href],input:not([type='hidden']):not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex='-1']),[data-toolbar-focus]";

export type ToolbarCheckedValues = Record<string, readonly string[]>;
export type ToolbarCheckedValueChange = { name: string; checkedItems: string[]; sourceEvent?: Event; currentTarget?: HTMLElement };

export function defineToolbarGroup(): void {
  if (customElements.get("spui-toolbar-group")) return;
  class SpuiToolbarGroup extends HTMLElement {
    static observedAttributes = ["label", "orientation"];
    connectedCallback(): void { if (!this.shadowRoot) this.render(); this.sync(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    private sync(): void {
      this.setAttribute("role", "group");
      const label = this.getAttribute("aria-label") || this.getAttribute("label");
      if (label) this.setAttribute("aria-label", label);
      else this.removeAttribute("aria-label");
    }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{box-sizing:border-box;display:inline-flex;align-items:center;gap:var(--spui-toolbar-group-gap,4px);min-width:0}:host([orientation=vertical]){flex-direction:column;align-items:stretch;width:100%}`;
      shadow.append(style, document.createElement("slot"));
    }
  }
  customElements.define("spui-toolbar-group", SpuiToolbarGroup);
}

export function defineToolbarSeparator(): void {
  if (customElements.get("spui-toolbar-separator")) return;
  class SpuiToolbarSeparator extends HTMLElement {
    static observedAttributes = ["orientation", "vertical"];
    connectedCallback(): void { if (!this.shadowRoot) this.render(); this.sync(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    private sync(): void {
      this.setAttribute("role", "separator");
      const orientation = this.hasAttribute("vertical") ? (this.getAttribute("vertical") === "false" ? "horizontal" : "vertical") : this.getAttribute("orientation") === "horizontal" ? "horizontal" : "vertical";
      if (this.getAttribute("orientation") !== orientation) this.setAttribute("orientation", orientation);
      this.setAttribute("aria-orientation", orientation);
    }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{box-sizing:border-box;display:inline-flex;flex:0 0 auto;align-items:stretch;align-self:stretch;min-height:24px;padding-inline:var(--spui-toolbar-separator-inset,3px)}.line{width:1px;background:var(--spui-toolbar-separator,var(--spui-ui-stroke,var(--spui-semantic-body-divider,#d1d1d1)))}:host([orientation=horizontal]){align-self:center;min-height:0;width:100%;height:1px;padding-inline:0;padding-block:var(--spui-toolbar-separator-inset,3px)}:host([orientation=horizontal]) .line{width:100%;height:1px}@media(forced-colors:active){.line{background:CanvasText}}`;
      const line = document.createElement("span"); line.className = "line"; line.part.add("line"); line.setAttribute("aria-hidden", "true");
      const wrapper = document.createElement("slot"); wrapper.name = "wrapper"; wrapper.append(line);
      shadow.append(style, wrapper);
    }
  }
  customElements.define("spui-toolbar-separator", SpuiToolbarSeparator);
}

export function defineToolbarRadioGroup(): void {
  if (customElements.get("spui-toolbar-radio-group")) return;
  class SpuiToolbarRadioGroup extends HTMLElement {
    static observedAttributes = ["label", "aria-label", "orientation"];
    connectedCallback(): void { if (!this.shadowRoot) this.render(); this.sync(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    private sync(): void {
      this.setAttribute("role", "radiogroup");
      if (!this.hasAttribute("aria-label") && this.hasAttribute("label")) this.setAttribute("aria-label", this.getAttribute("label") ?? "");
    }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{box-sizing:border-box;display:inline-flex;align-items:center;gap:var(--spui-toolbar-group-gap,4px);min-width:0}:host([orientation=vertical]){flex-direction:column;align-items:stretch;width:100%}`;
      shadow.append(style, document.createElement("slot"));
    }
  }
  customElements.define("spui-toolbar-radio-group", SpuiToolbarRadioGroup);
}

export function defineToolbarRadioButton(): void {
  if (customElements.get("spui-toolbar-radio-button")) return;
  class SpuiToolbarRadioButton extends HTMLElement {
    static observedAttributes = ["name", "value", "checked", "disabled", "appearance", "size", "aria-label", "aria-labelledby", "aria-describedby", "title"];
    get checked(): boolean { return this.hasAttribute("checked"); }
    set checked(value: boolean) { this.toggleAttribute("checked", Boolean(value)); }
    connectedCallback(): void { if (!this.shadowRoot) this.render(); this.sync(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    private sync(): void {
      const button = this.shadowRoot?.querySelector<HTMLButtonElement>("button");
      if (!button) return;
      button.disabled = this.hasAttribute("disabled");
      button.setAttribute("aria-checked", String(this.checked));
      const label = this.getAttribute("aria-label");
      if (label) button.setAttribute("aria-label", label); else button.removeAttribute("aria-label");
      for (const name of ["aria-labelledby", "aria-describedby", "title"]) {
        const value = this.getAttribute(name);
        value === null ? button.removeAttribute(name) : button.setAttribute(name, value);
      }
      const appearance = this.getAttribute("appearance") ?? "subtle";
      button.className = appearance === "primary" ? "primary" : appearance === "transparent" ? "transparent" : "subtle";
    }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const button = document.createElement("button");
      button.type = "button"; button.setAttribute("role", "radio"); button.setAttribute("aria-checked", "false"); button.part.add("control");
      const icon = document.createElement("slot"); icon.name = "icon";
      button.append(icon, document.createElement("slot"));
      button.addEventListener("click", event => {
        if (this.hasAttribute("disabled")) return;
        this.dispatchEvent(new CustomEvent("spui-toolbar-radio-select", { bubbles: true, composed: true, detail: { name: this.getAttribute("name") ?? "", value: this.getAttribute("value") ?? "", sourceEvent: event, currentTarget: event.currentTarget } }));
      });
      const style = document.createElement("style");
      style.textContent = `${buttonControlCss}:host{display:inline-block;vertical-align:middle}`;
      shadow.append(style, button); this.sync();
    }
  }
  customElements.define("spui-toolbar-radio-button", SpuiToolbarRadioButton);
}

export function defineToolbar(): void {
  if (customElements.get("spui-toolbar")) return;
  defineToolbarGroup(); defineToolbarSeparator(); defineToolbarRadioGroup(); defineToolbarRadioButton();
  class SpuiToolbar extends HTMLElement {
    static observedAttributes = ["label", "orientation", "vertical", "loop", "size"];
    private observer?: MutationObserver;
    private events?: AbortController;
    private observedShadowRoots = new WeakSet<ShadowRoot>();
    private syncFrame = 0;
    private controlledCheckedValues?: ToolbarCheckedValues;
    private uncontrolledCheckedValues: ToolbarCheckedValues = {};

    get checkedValues(): ToolbarCheckedValues | undefined { return this.controlledCheckedValues; }
    set checkedValues(value: ToolbarCheckedValues | undefined) {
      if (value === undefined) { if (this.controlledCheckedValues) this.uncontrolledCheckedValues = this.controlledCheckedValues; this.controlledCheckedValues = undefined; }
      else this.controlledCheckedValues = value;
      this.syncRadioButtons();
    }
    get defaultCheckedValues(): ToolbarCheckedValues { return this.uncontrolledCheckedValues; }
    set defaultCheckedValues(value: ToolbarCheckedValues | undefined) { if (!this.controlledCheckedValues && value) this.uncontrolledCheckedValues = value; this.syncRadioButtons(); }
    private get selectedValues(): ToolbarCheckedValues { return this.controlledCheckedValues ?? this.uncontrolledCheckedValues; }

    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      this.observer?.disconnect();
      this.observer = new MutationObserver(() => this.scheduleSync());
      const changes: MutationObserverInit = { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "hidden", "aria-disabled"] };
      this.observer.observe(this, changes);
      for (let parent = this.parentElement; parent; parent = parent.parentElement) this.observer.observe(parent, { attributes: true, attributeFilter: ["disabled"] });
      this.observeShadowRoots(this);
      this.events?.abort();
      this.events = new AbortController();
      this.addEventListener("keydown", this.onKeyDown, { signal: this.events.signal });
      this.addEventListener("focusin", this.onFocusIn, { signal: this.events.signal });
      this.addEventListener("spui-toolbar-radio-select", this.onRadioSelect as EventListener, { signal: this.events.signal });
      this.addEventListener("spui-checked-change", this.onToggleChange as EventListener, { signal: this.events.signal });
      this.sync();
      this.scheduleSync();
    }

    disconnectedCallback(): void { this.observer?.disconnect(); this.observedShadowRoots = new WeakSet(); this.events?.abort(); cancelAnimationFrame(this.syncFrame); this.syncFrame = 0; }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }

    private items(): HTMLElement[] {
      const result: HTMLElement[] = [];
      const visit = (nodes: Iterable<Node>): void => {
        for (const child of nodes) {
          if (child instanceof HTMLSlotElement) {
            const assigned = child.assignedNodes({ flatten: true });
            visit(assigned.length ? assigned : child.childNodes);
            continue;
          }
          if (!(child instanceof HTMLElement)) continue;
          if (child.matches(itemSelector) && !child.matches(":disabled") && !child.closest("[hidden], [inert]") && child.getAttribute("aria-disabled") !== "true") result.push(child);
          visit(child.shadowRoot?.childNodes ?? child.childNodes);
        }
      };
      const slot = this.shadowRoot?.querySelector("slot");
      if (slot) {
        const assigned = slot.assignedNodes({ flatten: true });
        visit(assigned.length ? assigned : slot.childNodes);
      } else visit(this.childNodes);
      return result;
    }

    private scheduleSync(): void {
      if (this.syncFrame) return;
      this.syncFrame = requestAnimationFrame(() => { this.syncFrame = 0; if (this.isConnected) this.sync(); });
    }

    private syncItems(): void {
      const items = this.items();
      const active = items.find(item => item === this.shadowRoot?.activeElement || item === this.ownerDocument.activeElement || item.matches(":focus"));
      const remembered = items.find(item => item.dataset.toolbarFocus === "true");
      const initial = items[0];
      const current = active ?? remembered ?? initial;
      for (const item of items) {
        item.tabIndex = item === current ? 0 : -1;
        item.dataset.toolbarFocus = String(item === current);
      }
    }

    private observeShadowRoots(root: ParentNode): void {
      const visit = (node: Node): void => {
        if (node instanceof HTMLElement && node.shadowRoot) {
          const shadow = node.shadowRoot;
          if (!this.observedShadowRoots.has(shadow)) {
            this.observer?.observe(shadow, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "hidden", "aria-disabled"] });
            this.observedShadowRoots.add(shadow);
          }
          for (const child of shadow.childNodes) visit(child);
        }
        for (const child of node.childNodes) visit(child);
      };
      for (const child of root.childNodes) visit(child);
    }

    private onFocusIn = (event: FocusEvent): void => {
      const items = this.items();
      const target = event.composedPath().find(node => node instanceof HTMLElement && items.includes(node)) as HTMLElement | undefined;
      if (!target) return;
      for (const item of items) {
        item.tabIndex = item === target ? 0 : -1;
        item.dataset.toolbarFocus = String(item === target);
      }
    };

    private onKeyDown = (event: KeyboardEvent): void => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const items = this.items();
      const current = event.composedPath().find(node => node instanceof HTMLElement && items.includes(node)) as HTMLElement | undefined;
      if (!current) return;
      const vertical = this.getAttribute("orientation") === "vertical";
      const rtl = getComputedStyle(this).direction === "rtl";
      const nextKey = vertical ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
      const previousKey = vertical ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
      const index = items.indexOf(current);
      let next: HTMLElement | undefined;
      const loop = this.getAttribute("loop") !== "false";
      if (event.key === nextKey) next = items[index + 1] ?? (loop ? items[0] : undefined);
      else if (event.key === previousKey) next = items[index - 1] ?? (loop ? items.at(-1) : undefined);
      else if (event.key === "Home") next = items[0];
      else if (event.key === "End") next = items.at(-1);
      if (!next) return;
      event.preventDefault();
      for (const item of items) {
        item.tabIndex = item === next ? 0 : -1;
        item.dataset.toolbarFocus = String(item === next);
      }
      next.focus();
    };

    private sync(): void {
      this.observeShadowRoots(this);
      const toolbar = this.shadowRoot?.querySelector<HTMLElement>("[role=toolbar]");
      if (!toolbar) return;
      const orientation = this.hasAttribute("vertical") ? (this.getAttribute("vertical") === "false" ? "horizontal" : "vertical") : this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";
      toolbar.setAttribute("aria-orientation", orientation);
      toolbar.setAttribute("aria-label", this.getAttribute("label") || this.getAttribute("aria-label") || "Toolbar");
      toolbar.dataset.size = this.getAttribute("size") || "medium";
      this.dataset.orientation = orientation;
      for (const group of this.querySelectorAll<HTMLElement>("spui-toolbar-group")) if (group.closest("spui-toolbar") === this) group.setAttribute("orientation", orientation);
      for (const group of this.querySelectorAll<HTMLElement>("spui-toolbar-radio-group")) if (group.closest("spui-toolbar") === this) group.setAttribute("orientation", orientation);
      for (const button of this.querySelectorAll<HTMLElement>("spui-button,spui-toggle-button,spui-toolbar-radio-button")) {
        if (button.closest("spui-toolbar") === this && !button.hasAttribute("size")) button.setAttribute("size", this.getAttribute("size") || "medium");
      }
      const separatorOrientation = orientation === "vertical" ? "horizontal" : "vertical";
      for (const separator of this.querySelectorAll<HTMLElement>("spui-toolbar-separator")) if (separator.closest("spui-toolbar") === this && !separator.hasAttribute("vertical")) separator.setAttribute("orientation", separatorOrientation);
      this.syncItems();
      this.syncRadioButtons();
    }

    private syncRadioButtons(): void {
      for (const button of this.querySelectorAll<HTMLElement>("spui-toolbar-radio-button")) {
        if (button.closest("spui-toolbar") !== this) continue;
        const name = button.getAttribute("name") ?? "";
        const value = button.getAttribute("value") ?? "";
        const checked = Boolean(name && value && this.selectedValues[name]?.includes(value));
        button.toggleAttribute("checked", checked);
        if (!button.hasAttribute("size") && this.hasAttribute("size")) button.setAttribute("size", this.getAttribute("size") ?? "medium");
      }
      for (const button of this.querySelectorAll<HTMLElement>("spui-toggle-button[name][value]")) {
        if (button.closest("spui-toolbar") !== this) continue;
        const name = button.getAttribute("name") ?? "";
        const value = button.getAttribute("value") ?? "";
        button.toggleAttribute("checked", Boolean(name && value && this.selectedValues[name]?.includes(value)));
        if (!button.hasAttribute("size") && this.hasAttribute("size")) button.setAttribute("size", this.getAttribute("size") ?? "medium");
      }
    }

    private onRadioSelect = (event: CustomEvent<{ name: string; value: string; sourceEvent?: Event; currentTarget?: HTMLElement }>): void => {
      const { name, value, sourceEvent, currentTarget } = event.detail;
      if (!name || !value) return;
      const checkedItems = [value];
      if (!this.controlledCheckedValues) this.uncontrolledCheckedValues = { ...this.uncontrolledCheckedValues, [name]: checkedItems };
      this.syncRadioButtons();
      this.dispatchEvent(new CustomEvent<ToolbarCheckedValueChange>("spui-checked-value-change", { bubbles: true, composed: true, detail: { name, checkedItems, sourceEvent, currentTarget } }));
    };

    private onToggleChange = (event: CustomEvent<{ checked: boolean; sourceEvent?: Event; currentTarget?: HTMLElement }>): void => {
      const button = event.target;
      if (!(button instanceof HTMLElement) || button.tagName.toLowerCase() !== "spui-toggle-button" || button.closest("spui-toolbar") !== this) return;
      const name = button.getAttribute("name") ?? "";
      const value = button.getAttribute("value") ?? "";
      if (!name || !value) return;
      const checked = new Set(this.selectedValues[name] ?? []);
      if (event.detail.checked) checked.add(value); else checked.delete(value);
      const checkedItems = [...checked];
      if (!this.controlledCheckedValues) this.uncontrolledCheckedValues = { ...this.uncontrolledCheckedValues, [name]: checkedItems };
      this.syncRadioButtons();
      this.dispatchEvent(new CustomEvent<ToolbarCheckedValueChange>("spui-checked-value-change", { bubbles: true, composed: true, detail: { name, checkedItems, sourceEvent: event.detail.sourceEvent, currentTarget: event.detail.currentTarget } }));
    };

    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:block;min-width:0}.toolbar{box-sizing:border-box;display:flex;align-items:center;gap:var(--spui-toolbar-gap,6px);min-width:0;max-width:100%;overflow:auto;overscroll-behavior-inline:contain;scrollbar-width:thin;padding:var(--spui-toolbar-padding,4px);border:1px solid var(--spui-toolbar-border,var(--spui-ui-stroke,var(--colorNeutralStroke2,#e1dfdd)));border-radius:var(--spui-toolbar-radius,var(--spui-control-radius,6px));background:var(--spui-toolbar-background,var(--spui-ui-surface,var(--colorNeutralBackground1,#fff)));color:var(--spui-ui-text,var(--colorNeutralForeground1,#242424));font:inherit}.toolbar:focus-within{outline:var(--spui-toolbar-focus-outline,none)}:host([orientation=vertical]) .toolbar{flex-direction:column;align-items:stretch;width:max-content;max-width:100%;max-height:100%;overflow:auto;overflow-x:hidden}@media(forced-colors:active){.toolbar{border-color:CanvasText;background:Canvas}::slotted(*){forced-color-adjust:auto}}`;
      const toolbar = document.createElement("div");
      toolbar.className = "toolbar";
      toolbar.setAttribute("role", "toolbar");
      toolbar.setAttribute("part", "control");
      toolbar.tabIndex = -1;
      toolbar.append(document.createElement("slot"));
      shadow.append(style, toolbar);
      this.sync();
    }
  }
  customElements.define("spui-toolbar", SpuiToolbar);
}
