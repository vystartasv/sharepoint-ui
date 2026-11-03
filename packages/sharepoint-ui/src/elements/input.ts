import { base, rememberNativeFormControlDefaults, stopHostAccessibleNameSync, syncHostAccessibleName, type NativeFormControlDefaults } from "./shared.js";

export type InputSize = "small" | "medium" | "large";
export type InputAppearance = "outline" | "underline" | "filled-darker" | "filled-lighter" | "filled-darker-shadow" | "filled-lighter-shadow";
export type InputType = "button" | "checkbox" | "color" | "date" | "datetime-local" | "email" | "file" | "hidden" | "image" | "month" | "number" | "password" | "radio" | "range" | "reset" | "search" | "submit" | "tel" | "text" | "time" | "url" | "week" | (string & {});

/** Bare, form-associated input; pair it with Label or Field for an accessible name. */
export function defineInput(): void {
  if (customElements.get("spui-input")) return;
  class SpuiInput extends HTMLElement {
    static formAssociated = true;
    static observedAttributes = ["value", "type", "placeholder", "disabled", "required", "read-only", "name", "size", "appearance", "autocomplete", "inputmode", "min", "max", "step", "minlength", "maxlength", "pattern", "multiple", "accept", "alt", "capture", "checked", "default-checked", "form", "formaction", "formenctype", "formmethod", "formnovalidate", "formtarget", "height", "list", "src", "width", "aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid"];
    private internals?: ElementInternals;
    private currentValue = "";
    private dirty = false;
    private formDisabled = false;
    private customError = "";
    private boundInput?: HTMLInputElement;
    private slotInputDefaults?: NativeFormControlDefaults;

    private handleInput = (event: Event): void => {
      const input = this.input();
      if (!input) return;
      this.currentValue = input.value;
      this.dirty = true;
      this.syncForm(input);
      this.dispatchEvent(new CustomEvent("spui-input", { detail: { value: input.value, checked: input.checked, sourceEvent: event }, bubbles: true, composed: true }));
    };
    private handleChange = (): void => {
      const input = this.input();
      if (input) this.dispatchEvent(new CustomEvent("spui-change", { detail: { value: input.value }, bubbles: true, composed: true }));
    };

    constructor() {
      super();
      try { this.internals = this.attachInternals(); } catch { /* Native input remains usable where form-associated custom elements are unavailable. */ }
    }

    get value(): string { return this.input()?.value ?? this.currentValue; }
    set value(value: string) { this.currentValue = String(value ?? ""); this.dirty = true; const input = this.input(); if (input && (input.type !== "file" || !this.currentValue)) input.value = this.currentValue; this.syncForm(input); }
    get defaultValue(): string { return this.getAttribute("value") ?? this.input()?.defaultValue ?? ""; }
    set defaultValue(value: string) { this.setAttribute("value", String(value ?? "")); }
    get name(): string { return this.getAttribute("name") ?? ""; }
    set name(value: string) { this.setAttribute("name", value); }
    get type(): string { return this.input()?.type ?? this.getAttribute("type") ?? "text"; }
    set type(value: string) { this.setAttribute("type", value); }
    get checked(): boolean { return Boolean(this.input()?.checked); }
    set checked(value: boolean) { const input = this.input(); if (input) input.checked = Boolean(value); else this.toggleAttribute("checked", Boolean(value)); this.syncForm(input); }
    get disabled(): boolean { return this.hasAttribute("disabled"); }
    set disabled(value: boolean) { this.toggleAttribute("disabled", Boolean(value)); }
    get required(): boolean { return this.hasAttribute("required"); }
    set required(value: boolean) { this.toggleAttribute("required", Boolean(value)); }
    get readOnly(): boolean { return this.hasAttribute("read-only"); }
    set readOnly(value: boolean) { this.toggleAttribute("read-only", Boolean(value)); }
    get form(): HTMLFormElement | null { return this.internals?.form ?? null; }
    get validity(): ValidityState | undefined { return this.internals?.validity ?? this.input()?.validity; }
    get validationMessage(): string { return this.internals?.validationMessage ?? this.input()?.validationMessage ?? ""; }
    get willValidate(): boolean { return this.internals?.willValidate ?? Boolean(this.input() && !this.input()!.disabled && !this.input()!.readOnly); }

    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      const input = this.input();
      if (!input) return;
      if (!this.dirty) {
        if (this.hasAttribute("value")) { this.currentValue = this.defaultValue; if (input.type !== "file") input.value = this.currentValue; }
        else this.currentValue = input.type === "file" ? "" : input.value;
      }
      this.syncForm(input);
    }

    disconnectedCallback(): void { stopHostAccessibleNameSync(this); }

    attributeChangedCallback(name: string, _oldValue: string | null, value: string | null): void {
      if (!this.isConnected || !this.shadowRoot) return;
      const input = this.input();
      if (!input) return;
      if (name === "value") { if (!this.dirty && input.type !== "file") { this.currentValue = value ?? ""; input.value = this.currentValue; this.syncForm(input); } return; }
      if (name === "size" || name === "appearance") this.shadowRoot.querySelector<HTMLElement>(".control")!.dataset[name] = value || (name === "size" ? "medium" : "outline");
      else if (name === "type") { try { input.type = value || "text"; } catch { input.type = "text"; } }
      else if (name === "checked") input.checked = value !== null || (!this.dirty && Boolean(this.slotInputDefaults?.checked));
      else if (name === "default-checked") { input.defaultChecked = value !== null || Boolean(this.slotInputDefaults?.defaultChecked); if (!this.dirty) input.checked = value !== null || Boolean(this.slotInputDefaults?.checked); }
      else if (["placeholder", "autocomplete", "inputmode", "min", "max", "step", "minlength", "maxlength", "pattern", "multiple"].includes(name)) {
        const target = name === "read-only" ? "readonly" : name;
        if (value === null) input.removeAttribute(target); else input.setAttribute(target, value);
      } else if (["accept", "alt", "capture", "form", "formaction", "formenctype", "formmethod", "formnovalidate", "formtarget", "height", "list", "src", "width"].includes(name)) {
        if (value === null) input.removeAttribute(name); else input.setAttribute(name, value);
      } else if (["aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid"].includes(name)) {
        if (value === null) input.removeAttribute(name); else input.setAttribute(name, value);
      }
      this.syncInputSlot();
    }

    formDisabledCallback(disabled: boolean): void { this.formDisabled = disabled; this.syncInputSlot(); }
    formResetCallback(): void { this.dirty = false; const input = this.input(); this.currentValue = input?.type === "file" ? "" : this.defaultValue; if (input) { input.value = this.currentValue; input.checked = input.defaultChecked; this.syncForm(input); } }
    formStateRestoreCallback(state: string | File | FormData | null): void { if (typeof state === "string") this.value = state; }
    focus(options?: FocusOptions): void { this.input()?.focus(options); }
    select(): void { this.input()?.select(); }
    checkValidity(): boolean { return this.internals?.checkValidity() ?? this.input()?.checkValidity() ?? true; }
    reportValidity(): boolean { return this.internals?.reportValidity() ?? this.input()?.reportValidity() ?? true; }
    setCustomValidity(message: string): void { this.customError = message; this.syncForm(this.input()); }

    private input(): HTMLInputElement | undefined {
      const slotted = Array.from(this.children).find((element): element is HTMLInputElement => element instanceof HTMLInputElement && element.slot === "input");
      return slotted ?? this.shadowRoot?.querySelector<HTMLInputElement>(".input-fallback") ?? undefined;
    }

    private syncInputSlot(): void {
      const input = this.input();
      if (!input) return;
      const fallback = this.shadowRoot?.querySelector<HTMLInputElement>(".input-fallback");
      if (fallback) fallback.hidden = input !== fallback;
      if (input !== fallback) this.slotInputDefaults = rememberNativeFormControlDefaults(this.slotInputDefaults, input);
      if (this.boundInput !== input) {
        this.boundInput?.removeEventListener("input", this.handleInput);
        this.boundInput?.removeEventListener("change", this.handleChange);
        input.addEventListener("input", this.handleInput);
        input.addEventListener("change", this.handleChange);
        this.boundInput = input;
      }
      if (this.hasAttribute("name")) input.removeAttribute("name");
      for (const name of ["type", "placeholder", "autocomplete", "inputmode", "min", "max", "step", "minlength", "maxlength", "pattern", "multiple", "accept", "alt", "capture", "form", "formaction", "formenctype", "formmethod", "formnovalidate", "formtarget", "height", "list", "src", "width", "aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid"]) {
        if (input.hasAttribute(name)) continue;
        const value = this.getAttribute(name);
        if (value !== null) input.setAttribute(name, value);
      }
      const defaults = input === fallback ? undefined : this.slotInputDefaults;
      input.disabled = this.disabled || this.formDisabled || Boolean(defaults?.disabled);
      input.required = this.required || Boolean(defaults?.required);
      input.readOnly = this.readOnly || Boolean(defaults?.readOnly);
      if (this.hasAttribute("default-checked")) input.defaultChecked = true;
      if (this.hasAttribute("checked")) input.checked = true;
      if (!this.dirty && input.type !== "file" && this.hasAttribute("value")) input.value = this.currentValue || this.defaultValue;
      syncHostAccessibleName(this, input);
      this.syncForm(input);
    }

    private syncForm(input?: HTMLInputElement): void {
      if (!input) return;
      let value: string | File | FormData | null = input.disabled || this.formDisabled || ((input.type === "checkbox" || input.type === "radio") && !input.checked) ? null : input.value;
      if (input.type === "file") {
        value = null;
        const files = input.disabled || this.formDisabled ? null : input.files;
        if (files?.length && this.name) {
          const formData = new FormData();
          for (const file of Array.from(files)) formData.append(this.name, file);
          value = formData;
        }
      }
      this.internals?.setFormValue(value, input.type === "file" ? null : input.value);
      const v = input.validity;
      const flags: ValidityStateFlags = { badInput: v.badInput, patternMismatch: v.patternMismatch, rangeOverflow: v.rangeOverflow, rangeUnderflow: v.rangeUnderflow, stepMismatch: v.stepMismatch, tooLong: v.tooLong, tooShort: v.tooShort, typeMismatch: v.typeMismatch, valueMissing: v.valueMissing, customError: Boolean(this.customError) };
      const message = this.customError || input.validationMessage;
      try { this.internals?.setValidity(input.validity.valid && !this.customError ? {} : flags, message, input); } catch { /* Native validation remains available inside the shadow root. */ }
    }

    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:inline-block;min-width:0;vertical-align:middle}.control{box-sizing:border-box;display:flex;align-items:center;gap:var(--spui-input-content-gap,8px);min-width:0;width:100%;border:1px solid var(--spui-input-border,var(--spui-control-border,var(--spui-ui-stroke,var(--spui-semantic-input-border,#8a8886))));border-radius:var(--spui-input-radius,var(--spui-control-radius,4px));background:var(--spui-input-background,var(--spui-control-background,var(--spui-ui-surface,var(--spui-semantic-input-background,#fff))));box-shadow:var(--spui-input-shadow,var(--spui-control-shadow,none));color:var(--spui-ui-text,var(--spui-semantic-body-text,inherit));font-family:var(--spui-font-family,inherit);font-size:var(--fontSizeBase200,14px);transition:border-color var(--spui-motion-duration-fast,120ms) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1)),box-shadow var(--spui-motion-duration-fast,120ms) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1))}.control:focus-within{border-width:1px;border-color:var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));box-shadow:none}.control[data-size=small]{min-height:24px;font-size:var(--fontSizeBase100,12px)}.control[data-size=medium]{min-height:32px}.control[data-size=large]{min-height:40px;font-size:var(--fontSizeBase200,14px)}.control[data-appearance=underline]{border-width:0 0 1px;border-radius:0;box-shadow:none}.control[data-appearance=underline]:focus-within{border-width:0 0 2px}.control[data-appearance=filled-darker],.control[data-appearance=filled-darker-shadow]{background:var(--spui-input-filled-darker,var(--spui-ui-surface-hover,var(--colorNeutralBackground3,#f0f0f0)));border-color:transparent}.control[data-appearance=filled-lighter],.control[data-appearance=filled-lighter-shadow]{background:var(--spui-input-filled-lighter,var(--spui-ui-canvas,var(--colorNeutralBackground1,#fafafa)));border-color:transparent}.control[data-appearance=filled-darker-shadow],.control[data-appearance=filled-lighter-shadow]{box-shadow:var(--spui-input-filled-shadow,var(--shadow2,0 1px 2px rgb(0 0 0 / 20%)))}input{box-sizing:border-box;flex:1;min-width:0;width:100%;height:100%;padding-inline:var(--spui-input-padding-inline,var(--spui-control-padding-inline,12px));border:0;outline:0;background:transparent;color:inherit;font:var(--spui-input-font,var(--spui-font-family,inherit));font-size:inherit}input:focus-visible{outline:0;box-shadow:none}input::placeholder{color:var(--spui-ui-muted,var(--spui-semantic-body-subtext,#616161));opacity:1}input:disabled{cursor:not-allowed;opacity:.55}.control:has(input:disabled){opacity:.65}slot[name=before],slot[name=after]{display:inline-flex;align-items:center;flex:none;color:var(--spui-input-content-color,var(--spui-ui-muted,var(--spui-semantic-body-subtext,#616161)))}slot[name=before]{padding-inline-start:12px}slot[name=after]{padding-inline-end:12px}:host([data-spui-appearance=glass]) .control{backdrop-filter:blur(12px) saturate(1.2)}@media(prefers-reduced-motion:reduce){.control{transition:none}}@media(forced-colors:active){.control{border-color:FieldText;background:Field;color:FieldText}.control:focus-within{border:1px solid Highlight;outline:0;box-shadow:none}.control[data-appearance=underline]:focus-within{border-width:0 0 2px}input::placeholder{color:GrayText}}`;
      style.textContent += `slot[name=input]{display:contents}slot[name=input]::slotted(input){box-sizing:border-box;flex:1;min-width:0;width:100%;height:100%;padding-inline:var(--spui-input-padding-inline,var(--spui-control-padding-inline,12px));border:0;outline:0;background:transparent;color:inherit;font:var(--spui-input-font,var(--spui-font-family,inherit));font-size:inherit}slot[name=input]::slotted(input:focus-visible){outline:0;box-shadow:none}slot[name=input]::slotted(input:disabled){cursor:not-allowed;opacity:.55}`;
      style.textContent += `input[type=checkbox],input[type=radio],slot[name=input]::slotted(input[type=checkbox]),slot[name=input]::slotted(input[type=radio]){box-sizing:border-box;flex:none;width:16px;height:16px;padding:0}`;
      const control = document.createElement("div"); control.className = "control"; control.part.add("control"); control.dataset.size = this.getAttribute("size") || "medium"; control.dataset.appearance = this.getAttribute("appearance") || "outline";
      const before = document.createElement("slot"); before.name = "before"; before.setAttribute("aria-hidden", "true");
      const input = document.createElement("input"); input.className = "input-fallback"; input.type = this.getAttribute("type") || "text"; if (input.type !== "file") input.value = this.defaultValue; input.placeholder = this.getAttribute("placeholder") || ""; input.disabled = this.disabled || this.formDisabled; input.required = this.required; input.readOnly = this.readOnly; input.part.add("input");
      for (const name of ["autocomplete", "inputmode", "min", "max", "step", "minlength", "maxlength", "pattern", "accept", "alt", "capture", "form", "formaction", "formenctype", "formmethod", "formnovalidate", "formtarget", "height", "list", "src", "width", "aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid"]) { const value = this.getAttribute(name); if (value !== null) input.setAttribute(name, value); }
      if (this.hasAttribute("multiple")) input.multiple = true;
      input.defaultChecked = this.hasAttribute("default-checked");
      input.checked = this.hasAttribute("checked") || input.defaultChecked;
      const inputSlot = document.createElement("slot"); inputSlot.name = "input"; inputSlot.part.add("input"); inputSlot.addEventListener("slotchange", () => this.syncInputSlot());
      const after = document.createElement("slot"); after.name = "after"; after.setAttribute("aria-hidden", "true");
      control.append(before, input, inputSlot, after); shadow.append(style, control); this.syncInputSlot();
    }
  }
  customElements.define("spui-input", SpuiInput);
}
