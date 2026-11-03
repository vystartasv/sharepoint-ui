import { base, rememberNativeFormControlDefaults, syncHostAccessibleName, type NativeFormControlDefaults } from "./shared.js";

export type SelectAppearance = "outline" | "underline" | "filled-darker" | "filled-lighter";
export type SelectSize = "small" | "medium" | "large";
export type SelectChangeData = { value: string };

export function defineSelect(): void {
  if (customElements.get("spui-select")) return;
  class SpuiSelect extends HTMLElement {
    static formAssociated = true;
    static observedAttributes = ["label", "value", "default-value", "auto-complete", "autofocus", "tabindex", "appearance", "size", "disabled", "required", "name", "multiple", "form", "aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid"];
    private internals: ElementInternals | undefined;
    private observer: MutationObserver | undefined;
    private currentValue: string | undefined;
    private boundSelect: HTMLSelectElement | undefined;
    private formDisabled = false;
    private slotSelectDefaults?: NativeFormControlDefaults;
    private initialSelectedValues: Set<string> | undefined;
    private requestedTabIndex: number | undefined;
    private slotSelectTabIndex: number | undefined;
    private slotSelectTabIndexCaptured = false;
    private normalizingTabIndex = false;

    get form(): HTMLFormElement | null { return this.internals?.form ?? null; }

    private cloneOptionContent(): Node[] {
      return [...this.children]
        .filter(child => child.localName === "option" || child.localName === "optgroup")
        .map(child => child.cloneNode(true));
    }

    private handleSelectChange = (event: Event): void => {
      const select = event.currentTarget as HTMLSelectElement;
      this.currentValue = select.value;
      this.syncFormValue(select);
      this.dispatchEvent(new CustomEvent("spui-change", { detail: { value: select.value, sourceEvent: event }, bubbles: true, composed: true }));
    };

    private getSelect(): HTMLSelectElement | null {
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="select"]');
      const assigned = slot?.assignedElements().find((element): element is HTMLSelectElement => element instanceof HTMLSelectElement);
      return assigned ?? this.shadowRoot?.querySelector<HTMLSelectElement>(".select-fallback") ?? null;
    }

    constructor() {
      super();
      try { this.internals = this.attachInternals(); } catch { /* Form association is an enhancement where ElementInternals is unavailable. */ }
    }

    connectedCallback(): void {
      this.render();
      if (this.hasAttribute("autofocus")) this.getSelect()?.focus();
      this.observer = new MutationObserver(records => {
        if (records.some(record => !this.boundSelect?.contains(record.target))) this.syncOptions();
      });
      this.observer.observe(this, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["value", "label", "disabled", "selected"] });
    }

    disconnectedCallback(): void { this.observer?.disconnect(); }

    attributeChangedCallback(name: string, _oldValue: string | null, value: string | null): void {
      if (name === "tabindex" && !this.normalizingTabIndex) this.requestedTabIndex = value === null ? undefined : Number(value);
      if (this.normalizingTabIndex || !this.isConnected) return;
      const select = this.getSelect();
      if (!select) return;
      if (name === "tabindex") { this.syncTabIndex(select); return; }
      if (name === "autofocus") { if (value !== null) select.focus(); return; }
      if (name === "value") this.currentValue = value ?? "";
      if (name === "default-value" && this.currentValue === undefined && this.getAttribute("value") === null) this.currentValue = value ?? "";
      if (name === "label") {
        const label = this.shadowRoot?.querySelector("label");
        if (label) label.textContent = value ?? "";
      }
      if (name === "disabled") select.disabled = this.formDisabled || this.hasAttribute("disabled") || Boolean(this.slotSelectDefaults?.disabled);
      if (name === "required") select.required = this.hasAttribute("required") || Boolean(this.slotSelectDefaults?.required);
      if (name === "multiple") select.multiple = this.hasAttribute("multiple") || Boolean(this.slotSelectDefaults?.multiple);
      if (name === "form") value === null ? select.removeAttribute("form") : select.setAttribute("form", value);
      if (name === "auto-complete") value === null ? select.removeAttribute("autocomplete") : select.setAttribute("autocomplete", value);
      if (name === "aria-label" || name === "aria-labelledby" || name === "aria-description" || name === "aria-describedby" || name === "aria-invalid") value === null ? select.removeAttribute(name) : select.setAttribute(name, value);
      if (name === "value") select.value = this.currentValue ?? "";
      if (name === "default-value" && this.currentValue !== undefined) select.value = this.currentValue;
      if (name === "appearance" || name === "size") { this.render(); return; }
      this.syncFormValue(select);
    }

    focus(options?: FocusOptions): void { this.getSelect()?.focus(options); }
    blur(): void { this.getSelect()?.blur(); }
    get value(): string { return this.currentValue ?? this.getAttribute("value") ?? this.getSelect()?.value ?? ""; }
    set value(value: string) {
      this.currentValue = value;
      const select = this.getSelect();
      if (select) { select.value = value; this.syncFormValue(select); }
    }
    get defaultValue(): string { return this.getAttribute("default-value") ?? ""; }
    set defaultValue(value: string) { this.setAttribute("default-value", value); }

    formDisabledCallback(disabled: boolean): void {
      this.formDisabled = disabled;
      this.syncOptions();
    }

    formResetCallback(): void {
      const select = this.getSelect();
      if (select?.multiple) {
        this.currentValue = undefined;
        for (const option of [...select.options]) option.selected = this.initialSelectedValues?.has(option.value) ?? option.defaultSelected;
        this.syncFormValue(select);
        return;
      }
      const options = [...this.querySelectorAll("option")];
      this.value = this.getAttribute("value") ?? this.getAttribute("default-value") ?? this.initialSelectedValues?.values().next().value ?? options.find(option => option.hasAttribute("selected"))?.value ?? options[0]?.value ?? "";
    }
    formStateRestoreCallback(state: string | File | FormData | null): void { if (typeof state === "string") this.value = state; }

    private syncFormValue(select: HTMLSelectElement): void {
      syncHostAccessibleName(this, select);
      const value = select.multiple
        ? [...select.selectedOptions].reduce((data, option) => { const name = this.getAttribute("name"); if (name) data.append(name, option.value); return data; }, new FormData())
        : select.value;
      this.internals?.setFormValue(value);
      try { this.internals?.setValidity(select.validity.valid ? {} : { valueMissing: select.validity.valueMissing }, select.validationMessage, select); } catch { /* Older engines can omit custom-element validity anchors. */ }
    }

    private syncTabIndex(select: HTMLSelectElement): void {
      const fallback = select.classList.contains("select-fallback");
      if (!fallback && !this.slotSelectTabIndexCaptured) {
        this.slotSelectTabIndex = select.tabIndex;
        this.slotSelectTabIndexCaptured = true;
      }
      select.tabIndex = this.requestedTabIndex ?? (fallback ? 0 : this.slotSelectTabIndex ?? select.tabIndex);
      if (this.requestedTabIndex !== undefined && this.requestedTabIndex !== -1 && this.getAttribute("tabindex") !== "-1") {
        this.normalizingTabIndex = true;
        this.setAttribute("tabindex", "-1");
        this.normalizingTabIndex = false;
      }
    }

    private syncOptions(): void {
      const select = this.getSelect();
      if (!select) return;
      if (!select.classList.contains("select-fallback")) this.slotSelectDefaults = rememberNativeFormControlDefaults(this.slotSelectDefaults, select);
      const defaults = select.classList.contains("select-fallback") ? undefined : this.slotSelectDefaults;
      if (select.classList.contains("select-fallback")) {
        const priorValue = this.currentValue ?? select.value;
        const sourceOptions = [...this.querySelectorAll("option")];
        const sourceSelectedValues = new Set(sourceOptions.filter(option => option.selected).map(option => option.value));
        if (!this.initialSelectedValues && sourceOptions.length > 0) this.initialSelectedValues = sourceSelectedValues;
        const priorValues = select.multiple ? new Set([...select.selectedOptions].map(option => option.value)) : undefined;
        select.replaceChildren(...this.cloneOptionContent());
        select.disabled = this.formDisabled || this.hasAttribute("disabled");
        select.required = this.hasAttribute("required");
        select.multiple = this.hasAttribute("multiple");
        if (this.hasAttribute("form")) select.setAttribute("form", this.getAttribute("form")!); else select.removeAttribute("form");
        if (this.hasAttribute("auto-complete")) select.setAttribute("autocomplete", this.getAttribute("auto-complete")!); else select.removeAttribute("autocomplete");
        for (const name of ["aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid"]) {
          const value = this.getAttribute(name);
          if (value === null) select.removeAttribute(name); else select.setAttribute(name, value);
        }
        if (this.getAttribute("label") && !select.hasAttribute("aria-label") && !select.hasAttribute("aria-labelledby")) select.setAttribute("aria-label", this.getAttribute("label")!);
        if (priorValues) {
          const selectedValues = priorValues.size > 0 ? priorValues : this.initialSelectedValues ?? sourceSelectedValues;
          for (const option of [...select.options]) option.selected = selectedValues.has(option.value);
        } else if (this.initialSelectedValues?.size) {
          select.value = this.initialSelectedValues.values().next().value ?? priorValue;
        } else {
          select.value = priorValue;
        }
      } else {
        select.disabled = this.formDisabled || this.hasAttribute("disabled") || Boolean(defaults?.disabled);
        select.required = this.hasAttribute("required") || Boolean(defaults?.required);
        select.multiple = this.hasAttribute("multiple") || Boolean(defaults?.multiple);
        if (this.hasAttribute("auto-complete") && !select.hasAttribute("autocomplete")) select.setAttribute("autocomplete", this.getAttribute("auto-complete")!);
        if (this.hasAttribute("name")) select.removeAttribute("name");
        for (const name of ["aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid"]) {
          if (select.hasAttribute(name)) continue;
          const value = this.getAttribute(name);
          if (value !== null) select.setAttribute(name, value);
        }
        if (this.getAttribute("label") && !select.hasAttribute("aria-label") && !select.hasAttribute("aria-labelledby")) select.setAttribute("aria-label", this.getAttribute("label")!);
        if (this.currentValue !== undefined || this.hasAttribute("value") || this.hasAttribute("default-value")) select.value = this.currentValue ?? this.getAttribute("value") ?? this.getAttribute("default-value") ?? "";
      }
      this.syncTabIndex(select);
      if (this.boundSelect !== select) {
        this.boundSelect?.removeEventListener("change", this.handleSelectChange);
        select.addEventListener("change", this.handleSelectChange);
        this.boundSelect = select;
      }
      this.syncFormValue(select);
    }

    private render(): void {
      const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open" });
      const id = `select-${crypto.randomUUID()}`;
      const label = document.createElement("label");
      label.htmlFor = id;
      label.textContent = this.getAttribute("label") ?? "";
      label.part.add("label");
      const select = document.createElement("select");
      select.className = "select-fallback";
      select.id = id;
      select.part.add("control");
      select.disabled = this.hasAttribute("disabled");
      select.required = this.hasAttribute("required");
      select.multiple = this.hasAttribute("multiple");
      if (this.hasAttribute("form")) select.setAttribute("form", this.getAttribute("form")!);
      if (this.hasAttribute("auto-complete")) select.setAttribute("autocomplete", this.getAttribute("auto-complete")!);
      for (const name of ["aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid"]) { const value = this.getAttribute(name); if (value !== null) select.setAttribute(name, value); }
      select.append(...this.cloneOptionContent());
      if (this.currentValue !== undefined || this.hasAttribute("value") || this.hasAttribute("default-value")) select.value = this.currentValue ?? this.getAttribute("value") ?? this.getAttribute("default-value") ?? "";
      const control = document.createElement("span"); control.className = "control";
      const selectSlot = document.createElement("slot"); selectSlot.name = "select"; selectSlot.part.add("select"); selectSlot.append(select);
      selectSlot.addEventListener("slotchange", () => this.syncOptions());
      const icon = document.createElement("slot"); icon.name = "icon"; icon.part.add("icon"); icon.setAttribute("aria-hidden", "true");
      const fallbackIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg"); fallbackIcon.setAttribute("viewBox", "0 0 20 20"); fallbackIcon.setAttribute("width", "20"); fallbackIcon.setAttribute("height", "20"); fallbackIcon.setAttribute("fill", "none"); fallbackIcon.setAttribute("aria-hidden", "true");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path"); path.setAttribute("d", "m5 7.5 5 5 5-5"); path.setAttribute("stroke", "currentColor"); path.setAttribute("stroke-width", "1.5"); fallbackIcon.append(path); icon.append(fallbackIcon); control.append(selectSlot, icon);
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:grid;gap:var(--spui-control-gap,6px)}label{font-size:14px;font-weight:600;color:var(--spui-ui-muted,var(--spui-semantic-body-text,inherit))}.control{position:relative;min-width:0}select{box-sizing:border-box;width:100%;min-height:var(--spui-control-height,36px);padding-inline:var(--spui-control-padding-inline,12px);padding-inline-end:36px;appearance:none;border:1px solid var(--spui-control-border,var(--spui-ui-stroke,var(--spui-semantic-input-border,var(--colorNeutralStroke1,#8a8886))));border-radius:var(--spui-control-radius,4px);background:var(--spui-control-background,var(--spui-ui-surface,var(--spui-semantic-input-background,var(--colorNeutralBackground1,#fff))));box-shadow:var(--spui-control-shadow,none);color:var(--spui-ui-text,var(--spui-semantic-body-text,inherit));font:inherit}:host([size=small]) select{min-height:24px;font-size:var(--spui-text-font-size-small,12px)}:host([size=large]) select{min-height:40px;font-size:var(--spui-text-font-size-large,18px)}:host([appearance=underline]) select{border-width:0 0 1px;border-radius:0}:host([appearance=filled-darker]) select{background:var(--colorNeutralBackground3,var(--spui-ui-surface-sunken,#f0f0f0));border-color:transparent}:host([appearance=filled-lighter]) select{background:var(--colorNeutralBackground2,var(--spui-ui-surface-hover,#f5f5f5));border-color:transparent}slot[name=icon]{position:absolute;inset-inline-end:8px;top:50%;display:grid;place-items:center;width:20px;height:20px;transform:translateY(-50%);color:var(--spui-ui-muted,var(--spui-ui-text,#424242));pointer-events:none}slot[name=icon]::slotted(*){width:20px;height:20px}select:focus-visible{outline:2px solid var(--spui-focus-ring,var(--colorStrokeFocus2,#005a9e));outline-offset:2px}select:disabled{opacity:.55}@media(forced-colors:active){select{border-color:FieldText}slot[name=icon]{color:ButtonText}select:focus-visible{outline-color:Highlight}}`;
      style.textContent += `slot[name=select]{display:block}slot[name=select]::slotted(select){box-sizing:border-box;width:100%;min-height:var(--spui-control-height,36px);padding-inline:var(--spui-control-padding-inline,12px);padding-inline-end:36px;appearance:none;border:1px solid var(--spui-control-border,var(--spui-ui-stroke,var(--colorNeutralStroke1,#8a8886)));border-radius:var(--spui-control-radius,4px);background:var(--spui-control-background,var(--spui-ui-surface,#fff));color:var(--spui-ui-text,inherit);font:inherit}:host([size=small]) slot[name=select]::slotted(select){min-height:24px;font-size:var(--spui-text-font-size-small,12px)}:host([size=large]) slot[name=select]::slotted(select){min-height:40px;font-size:var(--spui-text-font-size-large,18px)}:host([appearance=underline]) slot[name=select]::slotted(select){border-width:0 0 1px;border-radius:0}:host([appearance=filled-darker]) slot[name=select]::slotted(select){background:var(--colorNeutralBackground3,var(--spui-ui-surface-sunken,#f0f0f0));border-color:transparent}:host([appearance=filled-lighter]) slot[name=select]::slotted(select){background:var(--colorNeutralBackground2,var(--spui-ui-surface-hover,#f5f5f5));border-color:transparent}slot[name=select]::slotted(select:focus-visible){outline:2px solid var(--spui-focus-ring,var(--colorStrokeFocus2,#005a9e));outline-offset:2px}slot[name=select]::slotted(select:disabled){opacity:.55}@media(forced-colors:active){slot[name=select]::slotted(select){border-color:FieldText}slot[name=select]::slotted(select:focus-visible){outline-color:Highlight}}`;
      shadow.replaceChildren(style, label, control);
      this.syncOptions();
    }
  }
  customElements.define("spui-select", SpuiSelect);
}
