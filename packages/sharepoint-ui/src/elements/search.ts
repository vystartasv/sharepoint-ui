import { base, stopHostAccessibleNameSync, syncHostAccessibleName } from "./shared.js";

export type SearchSize = "small" | "medium" | "large";
export type SearchAppearance = "outline" | "underline" | "filled-darker" | "filled-lighter" | "filled-darker-shadow" | "filled-lighter-shadow";

export function defineSearchBox(): void {
  if (customElements.get("spui-search-box")) return;
  class SpuiSearchBox extends HTMLElement {
    static formAssociated = true;
    static observedAttributes = ["label", "value", "placeholder", "type", "disabled", "required", "read-only", "name", "autocomplete", "maxlength", "minlength", "pattern", "inputmode", "size", "appearance", "clear-label", "aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid", "aria-required"];
    #internals = this.attachInternals();
    #value = "";
    #dirty = false;
    #formDisabled = false;

    get form(): HTMLFormElement | null { return this.#internals.form; }
    get value(): string { return this.#value; }
    set value(value: string) { this.setValue(String(value ?? ""), true); }
    get defaultValue(): string { return this.getAttribute("value") ?? ""; }
    set defaultValue(value: string) { this.setAttribute("value", value); }
    get name(): string { return this.getAttribute("name") ?? ""; }
    set name(value: string) { this.setAttribute("name", value); }

    connectedCallback(): void {
      if (!this.#dirty) this.#value = this.getAttribute("value") ?? "";
      this.render();
    }

    disconnectedCallback(): void { stopHostAccessibleNameSync(this); }

    attributeChangedCallback(name: string, _oldValue: string | null, value: string | null): void {
      if (!this.isConnected || !this.shadowRoot?.querySelector("input")) return;
      if (name === "value") {
        if (!this.#dirty) this.setValue(value ?? "", false);
        return;
      }
      if (name === "label") {
        const label = this.shadowRoot?.querySelector("label");
        if (label) label.textContent = value ?? "";
      }
      if (name === "placeholder") this.input().placeholder = value ?? "";
      if (name === "type") this.input().type = value || "search";
      if (name === "disabled") this.input().disabled = value !== null || this.#formDisabled;
      if (name === "required") { this.input().required = value !== null; this.syncFormValue(); }
      if (name === "read-only") this.input().readOnly = value !== null;
      if (["autocomplete", "maxlength", "minlength", "pattern", "inputmode"].includes(name)) {
        if (value === null) this.input().removeAttribute(name);
        else this.input().setAttribute(name, value);
      }
      if (name === "aria-label" || name === "aria-labelledby" || name === "aria-description" || name === "aria-describedby" || name === "aria-invalid" || name === "aria-required") {
        if (value === null) this.input().removeAttribute(name);
        else this.input().setAttribute(name, value);
      }
      if (name === "size") this.shadowRoot!.querySelector<HTMLElement>(".control")!.dataset.size = value || "medium";
      if (name === "appearance") this.shadowRoot!.querySelector<HTMLElement>(".control")!.dataset.appearance = value || "outline";
      if (name === "clear-label") this.shadowRoot!.querySelector("[part=clear-button]")!.setAttribute("aria-label", value || "Clear search");
      if (name === "disabled" || name === "read-only") this.setValue(this.#value, false);
      this.syncFormValue();
    }

    formResetCallback(): void { this.#dirty = false; this.setValue(this.defaultValue, false); }
    formStateRestoreCallback(state: string | File | FormData | null): void { if (typeof state === "string") this.setValue(state, false); }
    formDisabledCallback(disabled: boolean): void {
      this.#formDisabled = disabled;
      const input = this.shadowRoot?.querySelector("input");
      if (input) input.disabled = disabled || this.hasAttribute("disabled");
      const clear = this.shadowRoot?.querySelector<HTMLElement>("[part=clear-button]");
      if (clear) clear.hidden = !this.#value || Boolean(input?.disabled) || Boolean(input?.readOnly);
    }

    private input(): HTMLInputElement { return this.shadowRoot!.querySelector("input")!; }

    private setValue(value: string, dirty: boolean): void {
      this.#value = value;
      if (dirty) this.#dirty = true;
      const input = this.shadowRoot?.querySelector("input");
      if (input && input.value !== value) input.value = value;
      const clear = this.shadowRoot?.querySelector<HTMLElement>("[part=clear-button]");
      if (clear) clear.hidden = !value || Boolean(input?.disabled) || Boolean(input?.readOnly);
      this.syncFormValue();
    }

    private syncFormValue(): void {
      if (!this.#internals) return;
      const input = this.shadowRoot?.querySelector("input");
      if (input) syncHostAccessibleName(this, input);
      this.#internals.setFormValue(this.#value, this.#value);
      if (input && !input.validity.valid) {
        const invalidFlags = ["badInput", "customError", "patternMismatch", "rangeOverflow", "rangeUnderflow", "stepMismatch", "tooLong", "tooShort", "typeMismatch", "valueMissing"] as const;
        const flags: Partial<Record<(typeof invalidFlags)[number], boolean>> = {};
        for (const flag of invalidFlags) if (input.validity[flag]) flags[flag] = true;
        this.#internals.setValidity(flags, input.validationMessage, input);
      } else this.#internals.setValidity({});
    }

    private render(): void {
      const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open" });
      const label = document.createElement("label");
      label.part.add("label");
      label.htmlFor = "search-input";
      label.textContent = this.getAttribute("label") ?? "";

      const control = document.createElement("div");
      control.className = "control";
      control.dataset.size = this.getAttribute("size") || "medium";
      control.dataset.appearance = this.getAttribute("appearance") || "outline";
      const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      icon.setAttribute("viewBox", "0 0 20 20");
      icon.setAttribute("aria-hidden", "true");
      icon.setAttribute("focusable", "false");
      icon.setAttribute("part", "search-icon");
      icon.innerHTML = '<circle cx="8.5" cy="8.5" r="5.75"/><path d="m13 13 4.25 4.25"/>';
      const contentBefore = document.createElement("slot");
      contentBefore.name = "content-before";
      contentBefore.append(icon);
      const input = document.createElement("input");
      input.type = this.getAttribute("type") || "search";
      input.value = this.#value;
      input.placeholder = this.getAttribute("placeholder") ?? "";
      input.disabled = this.#formDisabled || this.hasAttribute("disabled");
      input.required = this.hasAttribute("required");
      input.readOnly = this.hasAttribute("read-only");
      input.id = "search-input";
      input.part.add("control");
      for (const name of ["autocomplete", "maxlength", "minlength", "pattern", "inputmode"]) {
        const value = this.getAttribute(name);
        if (value !== null) input.setAttribute(name, value);
      }
      for (const name of ["aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid", "aria-required"]) {
        const value = this.getAttribute(name);
        if (value !== null) input.setAttribute(name, value);
      }

      const clear = document.createElement("span");
      clear.className = "dismiss";
      clear.setAttribute("role", "button");
      clear.tabIndex = -1;
      clear.part.add("clear-button");
      clear.setAttribute("aria-label", this.getAttribute("clear-label") || "Clear search");
      clear.hidden = !this.#value || input.disabled || input.readOnly;
      const dismiss = document.createElement("slot");
      dismiss.name = "dismiss";
      const dismissIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      dismissIcon.setAttribute("viewBox", "0 0 16 16");
      dismissIcon.setAttribute("aria-hidden", "true");
      dismissIcon.setAttribute("focusable", "false");
      dismissIcon.innerHTML = '<path d="m4 4 8 8m0-8-8 8"/>';
      dismiss.append(dismissIcon);
      clear.append(dismiss);
      clear.addEventListener("click", event => {
        this.setValue("", true);
        input.focus();
        this.dispatchEvent(new CustomEvent("spui-input", { bubbles: true, composed: true, detail: { value: "", reason: "clear", sourceEvent: event } }));
        this.dispatchEvent(new CustomEvent("spui-clear", { bubbles: true, composed: true }));
      });
      clear.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        clear.click();
      });

      input.addEventListener("input", event => {
        this.setValue(input.value, true);
        this.dispatchEvent(new CustomEvent("spui-input", { bubbles: true, composed: true, detail: { value: input.value, reason: "input", sourceEvent: event } }));
      });
      input.addEventListener("keydown", event => {
        if (event.key !== "Enter" || event.isComposing) return;
        this.dispatchEvent(new CustomEvent("spui-search", { bubbles: true, composed: true, detail: { value: input.value } }));
        if (this.#internals.form) {
          event.preventDefault();
          this.#internals.form.requestSubmit();
        }
      });

      const afterSlot = document.createElement("slot");
      afterSlot.name = "content-after";
      const after = document.createElement("span");
      after.className = "content-after";
      after.append(afterSlot, clear);
      control.append(contentBefore, input, after);
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:grid;gap:var(--spui-control-gap,6px);min-width:0}label:empty{display:none}label{font-size:14px;font-weight:600;color:var(--spui-ui-muted,var(--spui-semantic-body-text,inherit))}.control{box-sizing:border-box;display:flex;align-items:center;gap:8px;min-width:0;min-height:var(--spui-control-height,36px);padding-inline:var(--spui-control-padding-inline,12px);border:1px solid var(--spui-control-border,var(--spui-ui-stroke,var(--spui-semantic-input-border,var(--colorNeutralStroke1,#8a8886))));border-radius:var(--spui-control-radius,4px);background:var(--spui-control-background,var(--spui-ui-surface,var(--spui-semantic-input-background,var(--colorNeutralBackground1,#fff))));box-shadow:var(--spui-control-shadow,none);color:var(--spui-ui-text,var(--spui-semantic-body-text,inherit))}.control[data-size=small]{min-height:28px;font-size:13px}.control[data-size=large]{min-height:44px;font-size:16px}.control[data-appearance=underline]{border:0;border-bottom:1px solid var(--spui-control-border,var(--spui-ui-stroke,#8a8886));border-radius:0}.control[data-appearance=filled-darker],.control[data-appearance=filled-darker-shadow]{border-color:transparent;background:var(--spui-input-filled-darker,var(--spui-ui-surface-hover,var(--spui-semantic-input-background,#f3f2f1)))}.control[data-appearance=filled-lighter],.control[data-appearance=filled-lighter-shadow]{border-color:transparent;background:var(--spui-input-filled-lighter,var(--spui-base-surface,var(--spui-ui-canvas,#faf9f8)))}.control[data-appearance=filled-darker-shadow],.control[data-appearance=filled-lighter-shadow]{box-shadow:var(--spui-input-filled-shadow,var(--spui-control-shadow,var(--shadow2,0 1px 2px rgb(0 0 0 / 20%))))}.control:focus-within{border-color:var(--spui-focus-ring,var(--spui-semantic-focus-border,var(--colorStrokeFocus2,#005a9e)))}.control:has(input[aria-invalid]:not([aria-invalid=false])){border-color:var(--spui-input-invalid-border,var(--spui-ui-danger,var(--colorPaletteRedBorder2,#c50f1f)))}.control:focus-within[data-appearance=underline]{border-bottom-width:2px}slot[name=content-before],.content-after{display:inline-flex;align-items:center;flex:none;gap:4px}slot[name=content-after]{display:inline-flex;align-items:center;gap:4px}input{box-sizing:border-box;flex:1;min-width:0;width:100%;padding:0;border:0;outline:0;background:transparent;color:inherit;font:inherit}input:focus-visible{outline:0}input::placeholder{color:var(--spui-ui-muted,var(--spui-semantic-body-subtext,#616161));opacity:1}input::-webkit-search-cancel-.dismiss{display:none}svg[part=search-icon]{width:18px;height:18px;flex:none;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.dismiss{display:grid;place-items:center;flex:none;width:28px;height:28px;padding:5px;border:0;border-radius:var(--spui-control-radius,4px);background:transparent;color:inherit;cursor:pointer}.dismiss[hidden]{display:none}.dismiss:hover{background:var(--spui-ui-surface-hover,var(--spui-ui-canvas,#f5f5f5))}.dismiss:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:1px}.dismiss svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round}@media(forced-colors:active){.control{border-color:FieldText}.control:focus-within{border-color:Highlight}.control:has(input[aria-invalid]:not([aria-invalid=false])){border-color:CanvasText}.control:has(input[aria-invalid]:not([aria-invalid=false])):focus-within{border-color:Highlight}.dismiss:focus-visible{outline-color:Highlight}}`;
      shadow.replaceChildren(style, label, control);
      this.syncFormValue();
    }
  }
  customElements.define("spui-search-box", SpuiSearchBox);
}
