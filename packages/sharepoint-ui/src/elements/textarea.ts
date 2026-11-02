import { base } from "./shared.js";

export function defineTextArea(): void {
  if (customElements.get("spui-textarea")) return;
  class SpuiTextArea extends HTMLElement {
    static formAssociated = true;
    static observedAttributes = ["label", "value", "default-value", "rows", "size", "appearance", "resize", "disabled", "required", "read-only", "placeholder", "aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid", "name", "autocomplete", "dirname", "form", "maxlength", "minlength", "cols", "wrap"];
    private internals?: ElementInternals;
    private currentValue = "";
    private dirty = false;
    private formDisabled = false;
    private boundTextarea?: HTMLTextAreaElement;
    constructor() { super(); try { this.internals = this.attachInternals(); } catch { /* The native textarea still works when form-associated custom elements are unavailable. */ } }
    get value(): string { return this.input()?.value ?? this.currentValue; }
    set value(value: string) { this.currentValue = String(value ?? ""); this.dirty = true; const control = this.input(); if (control) control.value = this.currentValue; this.syncForm(control); }
    get defaultValue(): string { return this.getAttribute("default-value") ?? this.getAttribute("value") ?? ""; }
    set defaultValue(value: string) { this.setAttribute("default-value", String(value ?? "")); }
    get name(): string { return this.getAttribute("name") ?? ""; }
    set name(value: string) { this.setAttribute("name", value); }
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
    connectedCallback() {
      if (this.shadowRoot) return;
      const shadow = this.attachShadow({ mode: "open" }); const id = `textarea-${Math.random().toString(36).slice(2)}`; const label = document.createElement("label"); label.htmlFor = id; label.textContent = this.getAttribute("label") ?? "";
      label.part.add("label");
      const input = document.createElement("textarea"); input.className = "textarea-fallback"; input.id = id; input.defaultValue = this.getAttribute("default-value") ?? this.getAttribute("value") ?? ""; input.value = this.getAttribute("value") ?? input.defaultValue; input.rows = Number(this.getAttribute("rows") ?? 3); input.disabled = this.hasAttribute("disabled"); input.required = this.hasAttribute("required"); input.readOnly = this.hasAttribute("read-only"); input.placeholder = this.getAttribute("placeholder") ?? "";
      input.part.add("control");
      for (const name of ["aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid", "name", "autocomplete", "dirname", "form", "maxlength", "minlength", "cols", "wrap"]) { const value = this.getAttribute(name); if (value !== null) input.setAttribute(name, value); }
      const style = document.createElement("style"); style.textContent = `${base}:host{display:grid;gap:var(--spui-control-gap,6px)}label{font-size:14px;font-weight:600;color:var(--spui-ui-muted,var(--spui-semantic-body-text,inherit))}textarea{width:100%;min-height:72px;box-sizing:border-box;padding:var(--spui-control-padding-block,10px) var(--spui-control-padding-inline,12px);border:1px solid var(--spui-control-border,var(--spui-ui-stroke,var(--spui-semantic-input-border,var(--colorNeutralStroke1,#8a8886))));border-radius:var(--spui-control-radius,4px);background:var(--spui-control-background,var(--spui-ui-surface,var(--spui-semantic-input-background,var(--colorNeutralBackground1,#fff))));box-shadow:var(--spui-control-shadow,none);color:var(--spui-ui-text,var(--spui-semantic-body-text,inherit));font:inherit;resize:none}:host([size=small]) textarea{min-height:64px;padding-block:8px;font-size:var(--spui-text-font-size-small,12px)}:host([size=medium]) textarea{min-height:72px}:host([size=large]) textarea{min-height:88px;font-size:var(--spui-text-font-size-large,16px)}:host([appearance=filled-darker]),:host([appearance=filled-darker-shadow]){--spui-control-background:var(--spui-input-filled-darker,var(--spui-ui-surface-hover,var(--colorNeutralBackground3,#f0f0f0)));--spui-control-border:transparent}:host([appearance=filled-lighter]),:host([appearance=filled-lighter-shadow]){--spui-control-background:var(--spui-input-filled-lighter,var(--spui-ui-canvas,var(--colorNeutralBackground2,#fafafa)));--spui-control-border:transparent}:host([appearance=filled-darker-shadow]) textarea,:host([appearance=filled-lighter-shadow]) textarea{box-shadow:var(--spui-input-filled-shadow,var(--shadow2,0 1px 2px rgb(0 0 0 / 20%)))}:host([resize=vertical]) textarea{resize:vertical}:host([resize=horizontal]) textarea{resize:horizontal}:host([resize=both]) textarea{resize:both}textarea:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:1px}textarea:disabled{opacity:.55}@media(forced-colors:active){textarea{border-color:FieldText}textarea:focus-visible{outline-color:Highlight}}`;
      style.textContent += `textarea[hidden]{display:none}slot[name=textarea]{display:contents}slot[name=textarea]::slotted(textarea){width:100%;min-height:72px;box-sizing:border-box;padding:var(--spui-control-padding-block,10px) var(--spui-control-padding-inline,12px);border:1px solid var(--spui-control-border,var(--spui-ui-stroke,var(--spui-semantic-input-border,var(--colorNeutralStroke1,#8a8886))));border-radius:var(--spui-control-radius,4px);background:var(--spui-control-background,var(--spui-ui-surface,var(--spui-semantic-input-background,var(--colorNeutralBackground1,#fff))));box-shadow:var(--spui-control-shadow,none);color:var(--spui-ui-text,var(--spui-semantic-body-text,inherit));font:inherit;resize:none}:host([size=small]) slot[name=textarea]::slotted(textarea){min-height:64px;padding-block:8px;font-size:var(--spui-text-font-size-small,12px)}:host([size=large]) slot[name=textarea]::slotted(textarea){min-height:88px;font-size:var(--spui-text-font-size-large,16px)}:host([resize=vertical]) slot[name=textarea]::slotted(textarea){resize:vertical}:host([resize=horizontal]) slot[name=textarea]::slotted(textarea){resize:horizontal}:host([resize=both]) slot[name=textarea]::slotted(textarea){resize:both}slot[name=textarea]::slotted(textarea:focus-visible){outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:1px}`;
      const controlSlot = document.createElement("slot"); controlSlot.name = "textarea"; controlSlot.part.add("textarea"); controlSlot.append(input); controlSlot.addEventListener("slotchange", () => this.syncTextareaSlot());
      shadow.append(style, label, controlSlot);
      if (!this.dirty) { this.currentValue = this.defaultValue; input.value = this.currentValue; }
      this.syncTextareaSlot();
    }
    attributeChangedCallback(name: string) {
      const input = this.input(); if (!input) return;
      if (name === "value" || name === "default-value") {
        input.defaultValue = this.defaultValue;
        if (!this.dirty) { this.currentValue = this.defaultValue; input.value = this.currentValue; }
      }
      if (name === "rows") input.rows = Number(this.getAttribute(name) ?? 3);
      if (name === "disabled") input.disabled = this.hasAttribute(name) || this.formDisabled;
      if (name === "required") input.required = this.hasAttribute(name);
      if (name === "read-only") input.readOnly = this.hasAttribute(name);
      if (name === "placeholder") input.placeholder = this.getAttribute(name) ?? "";
      if (name === "label") { const label = this.shadowRoot?.querySelector("label"); if (label) label.textContent = this.getAttribute(name) ?? ""; }
      if (["aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid", "name", "autocomplete", "dirname", "form", "maxlength", "minlength", "cols", "wrap"].includes(name)) { const value = this.getAttribute(name); value === null ? input.removeAttribute(name) : input.setAttribute(name, value); }
      this.syncTextareaSlot();
    }
    formDisabledCallback(disabled: boolean): void { this.formDisabled = disabled; const input = this.input(); if (input) { input.disabled = disabled || this.disabled; this.syncForm(input); } }
    formResetCallback(): void { this.dirty = false; const input = this.input(); this.currentValue = this.defaultValue; if (input) { input.value = this.currentValue; this.syncForm(input); } }
    formStateRestoreCallback(state: string | File | FormData | null): void { if (typeof state === "string") this.value = state; }
    focus(options?: FocusOptions): void { this.input()?.focus(options); }
    select(): void { this.input()?.select(); }
    checkValidity(): boolean { return this.internals?.checkValidity() ?? this.input()?.checkValidity() ?? true; }
    reportValidity(): boolean { return this.internals?.reportValidity() ?? this.input()?.reportValidity() ?? true; }
    private input(): HTMLTextAreaElement | null {
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="textarea"]');
      return slot?.assignedElements().find((element): element is HTMLTextAreaElement => element instanceof HTMLTextAreaElement) ?? this.shadowRoot?.querySelector<HTMLTextAreaElement>(".textarea-fallback") ?? null;
    }
    private syncTextareaSlot(): void {
      const input = this.input(); if (!input) return;
      if (this.boundTextarea !== input) {
        this.boundTextarea?.removeEventListener("input", this.handleTextareaInput);
        input.addEventListener("input", this.handleTextareaInput);
        this.boundTextarea = input;
      }
      const fallback = this.shadowRoot?.querySelector<HTMLTextAreaElement>(".textarea-fallback");
      if (fallback) { const assigned = input !== fallback; fallback.hidden = assigned; fallback.setAttribute("aria-hidden", String(assigned)); }
      if (input !== fallback) {
        input.disabled = this.disabled || this.formDisabled || input.disabled;
        input.required = this.required || input.required;
        input.readOnly = this.readOnly || input.readOnly;
        for (const name of ["autocomplete", "dirname", "form", "maxlength", "minlength", "cols", "wrap"]) if (!input.hasAttribute(name) && this.hasAttribute(name)) input.setAttribute(name, this.getAttribute(name)!);
        if (!input.hasAttribute("aria-label") && !input.hasAttribute("aria-labelledby")) { const label = this.getAttribute("label"); if (label) input.setAttribute("aria-label", label); }
        if (this.hasAttribute("name")) input.removeAttribute("name");
        if (!this.dirty && (this.hasAttribute("value") || this.defaultValue)) input.value = this.currentValue || this.defaultValue;
      }
      this.syncForm(input);
    }
    private handleTextareaInput = (event: Event): void => { const input = this.input(); if (!input) return; this.currentValue = input.value; this.dirty = true; this.syncForm(input); this.dispatchEvent(new CustomEvent("spui-input", { bubbles: true, composed: true, detail: { value: input.value, sourceEvent: event } })); };
    private syncForm(input?: HTMLTextAreaElement | null): void {
      if (!input) return;
      this.currentValue = input.value;
      this.internals?.setFormValue(input.disabled || this.formDisabled ? null : input.value, input.value);
      const validity = input.validity;
      const flags: ValidityStateFlags = { badInput: validity.badInput, patternMismatch: validity.patternMismatch, rangeOverflow: validity.rangeOverflow, rangeUnderflow: validity.rangeUnderflow, stepMismatch: validity.stepMismatch, tooLong: validity.tooLong, tooShort: validity.tooShort, typeMismatch: validity.typeMismatch, valueMissing: validity.valueMissing, customError: false };
      try { this.internals?.setValidity(validity.valid ? {} : flags, input.validationMessage, input); } catch { /* Native validity remains available inside the shadow root. */ }
    }
  }
  customElements.define("spui-textarea", SpuiTextArea);
}
