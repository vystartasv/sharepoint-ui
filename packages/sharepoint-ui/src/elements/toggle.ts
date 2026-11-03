import { base, rememberNativeFormControlDefaults, syncHostAccessibleName, type NativeFormControlDefaults } from "./shared.js";

type CheckedState = boolean | "mixed";

function defineToggle(name: "spui-checkbox" | "spui-switch", type: "checkbox" | "switch"): void {
  if (customElements.get(name)) return;
  class SpuiToggle extends HTMLElement {
    static formAssociated = true;
    static observedAttributes = ["checked", "default-checked", "disabled", "disabled-focusable", "required", "name", "value", "aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid"];
    private readonly internals: ElementInternals;
    private checkedValue?: CheckedState;
    private defaultCheckedValue?: CheckedState;
    private formDisabledValue = false;
    private boundInput?: HTMLInputElement;
    private slotInputDefaults?: NativeFormControlDefaults;
    private generatedLabelInput?: HTMLInputElement;
    private generatedLabel = "";

    private readonly handleInputChange = (event: Event): void => {
      const input = this.getInput();
      if (!input) return;
      if (this.isDisabled()) { this.syncInput(); this.syncFormState(); return; }
      const indicator = this.shadowRoot?.querySelector<HTMLElement>(".indicator");
      if (indicator) indicator.dataset.state = input.indeterminate ? "mixed" : input.checked ? "checked" : "unchecked";
      this.syncFormState();
      this.dispatchEvent(new CustomEvent("spui-change", { bubbles: true, composed: true, detail: { checked: input.indeterminate ? "mixed" : input.checked, value: input.value, sourceEvent: event } }));
    };
    private readonly handleInputClick = (event: MouseEvent): void => {
      if (this.isDisabled() && this.isDisabledFocusable()) event.preventDefault();
    };

    constructor() { super(); this.internals = this.attachInternals(); }
    get checked(): CheckedState { const input = this.getInput(); return input ? (input.indeterminate ? "mixed" : input.checked) : this.checkedValue ?? this.initialChecked(); }
    set checked(value: CheckedState) { this.checkedValue = this.normalizeChecked(value); this.syncInput(); this.syncFormState(); }
    get defaultChecked(): CheckedState { return this.defaultCheckedValue ?? this.initialDefaultChecked(); }
    set defaultChecked(value: CheckedState) { this.defaultCheckedValue = this.normalizeChecked(value); if (this.checkedValue === undefined) this.syncInput(); this.syncFormState(); }
    get form(): HTMLFormElement | null { return this.internals.form; }
    get validity(): ValidityState { return this.internals.validity; }
    get validationMessage(): string { return this.internals.validationMessage; }
    get willValidate(): boolean { return this.internals.willValidate; }
    checkValidity(): boolean { return this.internals.checkValidity(); }
    reportValidity(): boolean { return this.internals.reportValidity(); }

    formResetCallback(): void { this.checked = this.defaultChecked; }
    formDisabledCallback(disabled: boolean): void { this.formDisabledValue = disabled; this.syncInput(); this.syncFormState(); }
    formStateRestoreCallback(state: string | File | FormData | null): void {
      if (typeof state === "string") this.checked = state === "mixed" ? "mixed" : state === "checked";
    }

    private getInput(): HTMLInputElement | null {
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="input"]');
      const assigned = slot?.assignedElements().find((element): element is HTMLInputElement => element instanceof HTMLInputElement);
      const fallback = this.shadowRoot?.querySelector<HTMLInputElement>(".input-fallback");
      if (fallback) { fallback.hidden = Boolean(assigned); fallback.toggleAttribute("aria-hidden", Boolean(assigned)); }
      return assigned ?? fallback ?? this.shadowRoot?.querySelector<HTMLInputElement>("input") ?? null;
    }
    private bindInput(input: HTMLInputElement): void {
      if (this.boundInput === input) return;
      this.boundInput?.removeEventListener("change", this.handleInputChange);
      this.boundInput?.removeEventListener("click", this.handleInputClick);
      input.addEventListener("change", this.handleInputChange);
      input.addEventListener("click", this.handleInputClick);
      this.boundInput = input;
    }
    private syncInputSlot(): void {
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="input"]');
      const assigned = slot?.assignedElements().some(element => element instanceof HTMLInputElement) ?? false;
      const fallback = this.shadowRoot?.querySelector<HTMLInputElement>(".input-fallback");
      if (fallback) fallback.hidden = assigned;
      const input = this.getInput();
      if (input && !input.classList.contains("input-fallback")) this.slotInputDefaults = rememberNativeFormControlDefaults(this.slotInputDefaults, input);
      if (input) this.bindInput(input);
      this.syncInput();
      this.syncFormState();
    }
    private isDisabled(): boolean { return this.formDisabledValue || this.hasAttribute("disabled"); }
    private isDisabledFocusable(): boolean { return this.isDisabled() && this.hasAttribute("disabled-focusable"); }
    private initialChecked(): CheckedState {
      const initial = this.getAttribute("checked") ?? this.getAttribute("default-checked");
      if (initial === null && this.slotInputDefaults) return this.slotInputDefaults.checked;
      return type === "checkbox" && initial === "mixed" ? "mixed" : initial !== null;
    }
    private initialDefaultChecked(): CheckedState {
      const initial = this.getAttribute("checked") ?? this.getAttribute("default-checked");
      if (initial === null && this.slotInputDefaults) return this.slotInputDefaults.defaultChecked;
      return type === "checkbox" && initial === "mixed" ? "mixed" : initial !== null;
    }
    private normalizeChecked(value: CheckedState): CheckedState { return type === "checkbox" && value === "mixed" ? "mixed" : Boolean(value); }

    private syncInput(): void {
      const input = this.getInput();
      if (!input) return;
      if (!input.classList.contains("input-fallback")) this.slotInputDefaults = rememberNativeFormControlDefaults(this.slotInputDefaults, input);
      const defaults = input.classList.contains("input-fallback") ? undefined : this.slotInputDefaults;
      const checked = this.checkedValue ?? this.defaultCheckedValue ?? this.initialChecked();
      input.checked = checked === true;
      input.indeterminate = checked === "mixed";
      input.disabled = (this.isDisabled() && !this.isDisabledFocusable()) || Boolean(defaults?.disabled);
      input.type = "checkbox";
      if (type === "switch") input.setAttribute("role", "switch");
      input.required = this.hasAttribute("required") || Boolean(defaults?.required);
      input.value = this.getAttribute("value") ?? defaults?.value ?? "on";
      input.removeAttribute("name");
      for (const attr of ["aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid"]) {
        const value = this.getAttribute(attr);
        if (value !== null && !input.hasAttribute(attr)) input.setAttribute(attr, value);
      }
      syncHostAccessibleName(this, input);
      if (this.generatedLabelInput && this.generatedLabelInput.getAttribute("aria-label") === this.generatedLabel) this.generatedLabelInput.removeAttribute("aria-label");
      this.generatedLabelInput = undefined;
      this.generatedLabel = "";
      if (!input.classList.contains("input-fallback") && !input.hasAttribute("aria-label") && !input.hasAttribute("aria-labelledby")) {
        const labelSlot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="label"]');
        const label = labelSlot?.assignedNodes({ flatten: true }).map(node => node.textContent ?? "").join("").trim();
        if (label) { input.setAttribute("aria-label", label); this.generatedLabelInput = input; this.generatedLabel = label; }
      }
      const indicator = this.shadowRoot?.querySelector<HTMLElement>(".indicator");
      if (indicator) indicator.dataset.state = input.indeterminate ? "mixed" : input.checked ? "checked" : "unchecked";
      if (this.isDisabledFocusable()) { input.setAttribute("aria-disabled", "true"); input.tabIndex = 0; }
      else { input.removeAttribute("aria-disabled"); input.removeAttribute("tabindex"); }
    }

    private syncFormState(): void {
      const input = this.getInput();
      if (!input) return;
      const disabled = this.formDisabledValue || input.disabled || this.hasAttribute("disabled");
      const checked = input.checked && !disabled;
      this.internals.setFormValue(checked ? input.value : null, checked ? "checked" : input.indeterminate ? "mixed" : "unchecked");
      const missing = !disabled && input.required && !input.checked;
      this.internals.setValidity(missing ? { valueMissing: true } : {}, missing ? input.validationMessage : "", missing ? input : undefined);
    }

    connectedCallback(): void {
      if (!this.shadowRoot) {
        const shadow = this.attachShadow({ mode: "open" });
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "checkbox";
        input.className = "input-fallback";
        if (type === "switch") input.setAttribute("role", "switch");
        input.part.add("control"); label.part.add("label");
        input.required = this.hasAttribute("required");
        input.name = this.getAttribute("name") ?? "";
        input.value = this.getAttribute("value") ?? "on";
        for (const attr of ["aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid"]) { const value = this.getAttribute(attr); if (value !== null) input.setAttribute(attr, value); }
        const text = document.createElement("span");
        const labelSlot = document.createElement("slot"); labelSlot.name = "label"; labelSlot.part.add("label"); labelSlot.append(document.createElement("slot")); labelSlot.addEventListener("slotchange", () => this.syncInput()); text.append(labelSlot);
        const inputSlot = document.createElement("slot"); inputSlot.name = "input"; inputSlot.part.add("input"); inputSlot.append(input);
        inputSlot.addEventListener("slotchange", () => this.syncInputSlot());
        const control = document.createElement("span"); control.className = "control"; control.part.add("control");
        const indicator = document.createElement("span"); indicator.className = "indicator"; indicator.part.add("indicator"); indicator.setAttribute("aria-hidden", "true");
        const indicatorSlot = document.createElement("slot"); indicatorSlot.name = "indicator";
        const mark = document.createElement("span"); mark.className = "indicator-mark"; indicatorSlot.append(mark); indicatorSlot.addEventListener("slotchange", () => indicator.toggleAttribute("data-custom", indicatorSlot.assignedElements().length > 0)); indicator.append(indicatorSlot);
        this.bindInput(input);
        control.append(inputSlot, indicator); label.append(control, text);

        const styles = type === "switch"
          ? `input{appearance:none;position:relative;box-sizing:border-box;width:38px;height:22px;border:1px solid var(--spui-control-border,var(--spui-ui-stroke,var(--spui-semantic-input-border,var(--colorNeutralStroke1,#8a8886))));border-radius:999px;background:var(--spui-control-background,var(--spui-ui-surface-hover,var(--spui-semantic-input-background,var(--colorNeutralBackground1,#fff))));cursor:pointer;transition:background-color var(--spui-motion-duration-normal,.15s) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1))}input::after{content:'';position:absolute;top:2px;inset-inline-start:2px;width:16px;height:16px;border-radius:50%;background:var(--spui-ui-muted,var(--spui-semantic-input-foreground,var(--colorNeutralForeground2,#605e5c)));transition:transform var(--spui-motion-duration-normal,.15s) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1))}input:checked{border-color:var(--spui-primary-background,var(--spui-ui-accent,var(--spui-semantic-primary-button-background,var(--colorBrandBackground,#0078d4))));background:var(--spui-primary-background,var(--spui-ui-accent,var(--spui-semantic-primary-button-background,var(--colorBrandBackground,#0078d4))))}input:checked::after{background:var(--spui-ui-accent-text,var(--colorNeutralForegroundOnBrand,#fff));transform:translateX(16px)}@media(prefers-reduced-motion:reduce){input,input::after{transition:none}}`
          : `input{appearance:none;display:grid;place-content:center;box-sizing:border-box;width:16px;height:16px;margin:0;border:1px solid var(--spui-control-border,var(--spui-ui-stroke,var(--spui-semantic-input-border,#8a8886)));border-radius:3px;background:var(--spui-control-background,var(--spui-ui-surface,#fff));color:var(--spui-ui-accent-text,#fff);cursor:pointer}input::before{content:'';width:4px;height:8px;border:solid currentColor;border-width:0 2px 2px 0;transform:rotate(45deg) translate(-1px,-1px);opacity:0}input:checked{border-color:var(--spui-ui-accent,var(--spui-semantic-input-background-checked,#0f6cbd));background:var(--spui-ui-accent,var(--spui-semantic-input-background-checked,#0f6cbd))}input:checked::before{opacity:1}input:indeterminate{border-color:var(--spui-ui-accent,var(--spui-semantic-input-background-checked,#0f6cbd));background:var(--spui-ui-accent,var(--spui-semantic-input-background-checked,#0f6cbd))}input:indeterminate::before{width:8px;height:2px;border:0;border-radius:1px;background:currentColor;transform:none;opacity:1}:host([shape=circular]) input{border-radius:50%}:host([shape=circular]) input:indeterminate::before{width:6px;height:6px;border-radius:50%}`;
        const style = document.createElement("style");
        style.textContent = `${base}:host{display:inline-block}label{display:inline-flex;align-items:center;gap:8px;min-height:32px;padding-inline:4px;cursor:pointer}input{flex:none}input:disabled,input[aria-disabled=true]{cursor:not-allowed}label:has(input:disabled),label:has(input[aria-disabled=true]){opacity:.55;cursor:not-allowed}input:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-semantic-focus-border,var(--colorStrokeFocus2,#005a9e)));outline-offset:2px}${styles}:host(:not([size=small])) input[role=switch]{width:40px;height:20px}:host(:not([size=small])) input[role=switch]::after{top:0;width:18px;height:18px}:host(:not([size=small])) input[role=switch]:checked::after{transform:translateX(18px)}:host([dir=rtl]:not([size=small])) input[role=switch]:checked::after,:host-context([dir=rtl]) :host(:not([size=small])) input[role=switch]:checked::after{transform:translateX(-18px)}:host([label-position=before]) label{flex-direction:row-reverse}:host([label-position=above]) label{flex-direction:column;align-items:flex-start}:host([size=small]) label{min-height:24px;gap:6px;padding-inline:5px}:host([size=small]) input[type=checkbox]{width:14px;height:14px}:host([size=small]) input[role=switch]{width:32px;height:16px}:host([size=small]) input[role=switch]::after{top:0;width:14px;height:14px}:host([size=small]) input[role=switch]:checked::after{transform:translateX(14px)}:host([size=small][dir=rtl]) input[role=switch]:checked::after,:host-context([dir=rtl]) :host([size=small]) input[role=switch]:checked::after{transform:translateX(-14px)}:host([size=large]) label{min-height:44px;gap:10px}:host([size=large]) input[type=checkbox]{width:20px;height:20px}:host([dir=rtl]) input:checked::after,:host-context([dir=rtl]) input:checked::after{transform:translateX(-16px)}@media(forced-colors:active){input{forced-color-adjust:none;border-color:ButtonText;background:Canvas}input:checked,input:indeterminate{border-color:Highlight;background:Highlight}input::before,input:checked::before,input:indeterminate::before{color:HighlightText;background:HighlightText}}`;
        if (type === "checkbox") style.textContent += `.control{position:relative;display:grid;place-items:center;flex:none;width:16px;height:16px}.control>slot[name=input]{position:absolute;inset:0;z-index:1;width:100%;height:100%}.control>slot[name=input]::slotted(input){position:absolute;inset:0;box-sizing:border-box;width:100%;height:100%;margin:0;appearance:none;opacity:0;cursor:pointer}.indicator{box-sizing:border-box;display:grid;place-items:center;width:100%;height:100%;border:1px solid var(--spui-checkbox-indicator-border,var(--spui-control-border,var(--spui-ui-stroke,var(--spui-semantic-input-border,#8a8886))));border-radius:var(--spui-checkbox-indicator-radius,3px);background:var(--spui-checkbox-indicator-background,var(--spui-control-background,var(--spui-ui-surface,#fff)));color:var(--spui-checkbox-indicator-foreground,var(--spui-ui-accent-text,#fff));transition:background-color var(--spui-motion-duration-fast,120ms) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1)),border-color var(--spui-motion-duration-fast,120ms) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1));pointer-events:none}.indicator[data-state=checked],.indicator[data-state=mixed]{border-color:var(--spui-checkbox-checked-background,var(--spui-ui-accent,var(--colorBrandBackground,#0f6cbd)));background:var(--spui-checkbox-checked-background,var(--spui-ui-accent,var(--colorBrandBackground,#0f6cbd)))}.indicator:not([data-custom])[data-state=checked]::after{content:"";width:4px;height:8px;border:solid currentColor;border-width:0 2px 2px 0;transform:rotate(45deg) translate(-1px,-1px)}.indicator:not([data-custom])[data-state=mixed]::after{content:"";width:8px;height:2px;border-radius:1px;background:currentColor}:host([shape=circular]) .indicator{border-radius:50%}:host([shape=circular]) .indicator:not([data-custom])[data-state=mixed]::after{width:6px;height:6px;border-radius:50%}.control:has(input:focus-visible) .indicator{outline:2px solid var(--spui-focus-ring,var(--spui-semantic-focus-border,var(--colorStrokeFocus2,#005a9e)));outline-offset:2px}:host([size=small]) .control{width:14px;height:14px}:host([size=large]) .control{width:20px;height:20px}:host([disabled]) .indicator{opacity:.55}slot[name=indicator]::slotted(*){display:grid;place-items:center;max-width:100%;max-height:100%}@media(prefers-reduced-motion:reduce){.indicator{transition:none}}@media(forced-colors:active){.indicator{forced-color-adjust:none;border-color:ButtonText;background:Canvas;color:CanvasText}.indicator[data-state=checked],.indicator[data-state=mixed]{border-color:Highlight;background:Highlight;color:HighlightText}.control:has(input:focus-visible) .indicator{outline-color:Highlight}}`;
        else style.textContent += `.control{position:relative;display:grid;align-items:center;flex:none;width:40px;height:20px}.control>slot[name=input]{position:absolute;inset:0;z-index:1;width:100%;height:100%}.control>slot[name=input] input,.control>slot[name=input]::slotted(input){position:absolute;inset:0;box-sizing:border-box;width:100%;height:100%;margin:0;appearance:none;opacity:0;cursor:pointer}.indicator{position:relative;box-sizing:border-box;width:100%;height:100%;border:1px solid var(--spui-switch-track-border,var(--spui-control-border,var(--spui-ui-stroke,var(--spui-semantic-input-border,#8a8886))));border-radius:999px;background:var(--spui-switch-track-background,var(--spui-control-background,var(--spui-ui-surface-hover,var(--colorNeutralBackground1,#fff))));transition:background-color var(--spui-motion-duration-normal,.15s) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1)),border-color var(--spui-motion-duration-normal,.15s) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1));pointer-events:none}.indicator:not([data-custom])::after{content:"";position:absolute;top:0;inset-inline-start:2px;width:18px;height:18px;border-radius:50%;background:var(--spui-switch-thumb,var(--spui-ui-muted,var(--spui-semantic-input-foreground,var(--colorNeutralForeground2,#605e5c))));transition:transform var(--spui-motion-duration-normal,.15s) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1)),background-color var(--spui-motion-duration-fast,.12s) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1))}.indicator[data-state=checked]{border-color:var(--spui-switch-checked-background,var(--spui-ui-accent,var(--colorBrandBackground,#0078d4)));background:var(--spui-switch-checked-background,var(--spui-ui-accent,var(--colorBrandBackground,#0078d4)))}.indicator:not([data-custom])[data-state=checked]::after{background:var(--spui-ui-accent-text,var(--colorNeutralForegroundOnBrand,#fff));transform:translateX(18px)}:host([size=small]) .control{width:32px;height:16px}:host([size=small]) .indicator:not([data-custom])::after{width:14px;height:14px}:host([size=small]) .indicator:not([data-custom])[data-state=checked]::after{transform:translateX(14px)}:host([dir=rtl]) .indicator:not([data-custom])[data-state=checked]::after,:host-context([dir=rtl]) :host .indicator:not([data-custom])[data-state=checked]::after{transform:translateX(-18px)}:host([dir=rtl][size=small]) .indicator:not([data-custom])[data-state=checked]::after,:host-context([dir=rtl]) :host([size=small]) .indicator:not([data-custom])[data-state=checked]::after{transform:translateX(-14px)}.control:has(input:focus-visible) .indicator{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#005a9e));outline-offset:2px}:host([disabled]) .indicator{opacity:.55}slot[name=indicator]::slotted(*){display:grid;place-items:center;max-width:100%;max-height:100%}@media(prefers-reduced-motion:reduce){.indicator,.indicator::after{transition:none}}@media(forced-colors:active){.indicator{forced-color-adjust:none;border-color:ButtonText;background:Canvas}.indicator[data-state=checked]{border-color:Highlight;background:Highlight}.indicator:not([data-custom])::after{background:ButtonText}.control:has(input:focus-visible) .indicator{outline-color:Highlight}}`;
        shadow.append(style, label);
      }
      this.syncInputSlot();
    }

    attributeChangedCallback(name: string): void {
      const input = this.getInput();
      if (!input) return;
      if ((name === "checked" || name === "default-checked") && this.checkedValue === undefined) this.syncInput();
      if (name === "disabled" || name === "disabled-focusable") this.syncInput();
      if (name === "required") input.required = this.hasAttribute(name) || Boolean(this.slotInputDefaults?.required);
      if (name === "name") input.removeAttribute("name");
      if (name === "value") input.value = this.getAttribute(name) ?? this.slotInputDefaults?.value ?? "on";
      if (name === "aria-label" || name === "aria-labelledby" || name === "aria-description" || name === "aria-describedby" || name === "aria-invalid") {
        const value = this.getAttribute(name); value === null ? input.removeAttribute(name) : input.setAttribute(name, value);
        syncHostAccessibleName(this, input);
      }
      this.syncFormState();
    }
  }
  customElements.define(name, SpuiToggle);
}

export const defineCheckbox = (): void => defineToggle("spui-checkbox", "checkbox");
export const defineSwitch = (): void => defineToggle("spui-switch", "switch");
