import { base } from "./shared.js";

export type SpinButtonAppearance = "outline" | "underline" | "filled-darker" | "filled-lighter";
export type SpinButtonSize = "small" | "medium";
export type SpinButtonChangeData = { value: number | null; displayValue?: string };

export function defineSpinButton(): void {
  if (customElements.get("spui-spin-button")) return;
  class SpuiSpinButton extends HTMLElement {
    static formAssociated = true;
    static observedAttributes = ["label", "value", "default-value", "display-value", "min", "max", "step", "step-page", "precision", "size", "appearance", "disabled", "required", "read-only", "name", "aria-label", "aria-description", "aria-describedby", "aria-invalid", "aria-valuetext", "increment-label", "decrement-label"];
    private internals: ElementInternals | undefined;
    private currentValue: string | undefined;
    private draft: string | undefined;
    private previousDraft: string | undefined;
    private boundInput?: HTMLInputElement;
    private boundDecrement?: HTMLButtonElement;
    private boundIncrement?: HTMLButtonElement;

    get form(): HTMLFormElement | null { return this.internals?.form ?? null; }

    constructor() {
      super();
      try { this.internals = this.attachInternals(); } catch { /* Native input behavior remains available without ElementInternals. */ }
    }

    connectedCallback(): void { this.render(); }

    attributeChangedCallback(name: string, _oldValue: string | null, value: string | null): void {
      if (!this.isConnected) return;
      if (name === "label" || name === "increment-label" || name === "decrement-label") {
        this.render();
        return;
      }
      const input = this.getInput();
      if (!input) return;
      if (name === "value") {
        this.currentValue = value ?? "";
        input.value = this.getAttribute("display-value") ?? this.currentValue;
        this.syncAria(input);
      } else if (name === "default-value") {
        if (this.getAttribute("value") === null && this.currentValue === undefined) {
          this.currentValue = value ?? "";
          input.value = this.currentValue;
          this.syncAria(input);
        }
      } else if (name === "display-value") input.value = value ?? this.currentValue ?? "";
      else if (["min", "max", "step"].includes(name)) {
        if (value === null) input.removeAttribute(name); else input.setAttribute(name, value);
        this.updateButtons(input);
      } else if (name === "step-page" || name === "precision" || name === "size" || name === "appearance") {
        this.render();
        return;
      } else if (name === "disabled") input.disabled = this.hasAttribute("disabled");
      else if (name === "required") input.required = this.hasAttribute("required");
      else if (name === "read-only") input.readOnly = this.hasAttribute("read-only");
      else if (name === "name") { /* The form-associated host owns the submitted name. */ }
      else if (name === "aria-label" || name === "aria-description" || name === "aria-describedby" || name === "aria-invalid" || name === "aria-valuetext") value === null ? input.removeAttribute(name) : input.setAttribute(name, value);
      this.syncAria(input);
      this.syncFormState(input);
      this.updateButtons(input);
    }

    get value(): string { return this.currentValue ?? this.getAttribute("value") ?? this.getInput()?.value ?? ""; }
    set value(value: string | number | null) {
      this.currentValue = value === null ? "" : String(value);
      const input = this.getInput();
      if (input) { input.value = this.getAttribute("display-value") ?? this.currentValue; this.syncAria(input); this.syncFormState(input); this.updateButtons(input); }
    }
    get valueAsNumber(): number { return this.currentValue === "" || this.currentValue === undefined ? NaN : Number(this.currentValue); }
    get defaultValue(): number | null { const value = this.getAttribute("default-value"); return value === null || value === "" ? null : Number(value); }
    set defaultValue(value: number | null) { if (value === null) this.removeAttribute("default-value"); else this.setAttribute("default-value", String(value)); }

    formDisabledCallback(disabled: boolean): void { const input = this.getInput(); if (input) { input.disabled = disabled || this.hasAttribute("disabled"); this.updateButtons(input); } }
    formResetCallback(): void { this.currentValue = this.getAttribute("value") ?? this.getAttribute("default-value") ?? "0"; this.draft = undefined; this.previousDraft = undefined; const input = this.getInput(); if (input) { input.value = this.getAttribute("display-value") ?? this.currentValue; this.syncAria(input); this.syncFormState(input); this.updateButtons(input); } }
    formStateRestoreCallback(state: string | File | FormData | null): void { if (typeof state === "string") this.value = state; }

    private numberValue(value = this.currentValue): number | null {
      if (value === null || value === undefined || value.trim() === "") return null;
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
    }
    private decimals(): number {
      const precision = Number(this.getAttribute("precision"));
      if (this.hasAttribute("precision") && Number.isFinite(precision)) return Math.max(0, Math.min(12, Math.trunc(precision)));
      const step = this.getAttribute("step") ?? "1";
      const parts = step.toLowerCase().split("e");
      const fraction = (parts[0].split(".")[1] ?? "").length - Number(parts[1] ?? 0);
      return Math.max(0, Math.min(12, fraction));
    }
    private rounded(value: number): number { const scale = 10 ** this.decimals(); return Math.round((value + Number.EPSILON) * scale) / scale; }
    private bounds(value: number): number {
      const min = this.hasAttribute("min") ? Number(this.getAttribute("min")) : -Infinity;
      const max = this.hasAttribute("max") ? Number(this.getAttribute("max")) : Infinity;
      return Math.min(max, Math.max(min, this.rounded(value)));
    }
    private syncAria(input: HTMLInputElement): void {
      const value = this.numberValue();
      const min = this.getAttribute("min");
      const max = this.getAttribute("max");
      if (min === null) input.removeAttribute("aria-valuemin"); else input.setAttribute("aria-valuemin", min);
      if (max === null) input.removeAttribute("aria-valuemax"); else input.setAttribute("aria-valuemax", max);
      if (value === null) input.removeAttribute("aria-valuenow"); else input.setAttribute("aria-valuenow", String(value));
      const display = this.getAttribute("display-value");
      const valueText = this.getAttribute("aria-valuetext") ?? display;
      if (valueText) input.setAttribute("aria-valuetext", valueText); else input.removeAttribute("aria-valuetext");
    }
    private syncFormState(input: HTMLInputElement): void {
      const value = this.numberValue();
      this.internals?.setFormValue(value === null ? null : String(value));
      const v = input.validity;
      const flags = { valueMissing: v.valueMissing, rangeUnderflow: v.rangeUnderflow, rangeOverflow: v.rangeOverflow, stepMismatch: v.stepMismatch, badInput: v.badInput, typeMismatch: v.typeMismatch, patternMismatch: v.patternMismatch };
      try { this.internals?.setValidity(v.valid ? {} : flags, input.validationMessage, input); } catch { /* Keep native input validation when shadow anchors are unsupported. */ }
    }
    private updateButtons(input: HTMLInputElement): void {
      const value = this.numberValue();
      const min = this.hasAttribute("min") ? Number(this.getAttribute("min")) : -Infinity;
      const max = this.hasAttribute("max") ? Number(this.getAttribute("max")) : Infinity;
      const disabled = input.disabled || input.readOnly;
      const down = this.getStepper("decrement");
      const up = this.getStepper("increment");
      if (down) down.disabled = disabled || (value !== null && value <= min);
      if (up) up.disabled = disabled || (value !== null && value >= max);
    }
    private emitChange(input: HTMLInputElement, sourceEvent: Event, value: number | null, displayValue?: string, emitValueChange = true): void {
      const detail = { value, displayValue, sourceEvent };
      const committedValue = value === null ? "" : String(value);
      this.currentValue = committedValue;
      input.value = this.getAttribute("display-value") ?? committedValue;
      this.draft = undefined;
      this.previousDraft = undefined;
      this.syncAria(input);
      this.syncFormState(input);
      this.updateButtons(input);
      this.dispatchEvent(new CustomEvent("spui-commit", { detail, bubbles: true, composed: true }));
      if (emitValueChange) this.dispatchEvent(new CustomEvent("spui-change", { detail: { value: committedValue, sourceEvent, committed: true }, bubbles: true, composed: true }));
    }
    private commit(input: HTMLInputElement, sourceEvent: Event): void {
      const text = this.draft;
      const parsed = text === undefined ? this.numberValue() : (text.trim() === "" ? null : Number(text));
      if (parsed !== null && !Number.isFinite(parsed)) {
        input.value = this.getAttribute("display-value") ?? this.currentValue ?? "";
        this.draft = undefined;
        this.previousDraft = undefined;
        return;
      }
      const value = parsed === null ? null : this.bounds(parsed);
      const oldValue = this.numberValue();
      if (oldValue !== value || text !== undefined && text !== this.previousDraft) this.emitChange(input, sourceEvent, value, text, false);
      else { input.value = this.getAttribute("display-value") ?? (value === null ? "" : String(value)); this.draft = undefined; this.previousDraft = undefined; }
    }
    private step(input: HTMLInputElement, event: Event, direction: number, page = false): void {
      if (input.disabled || input.readOnly) return;
      const baseValue = this.draft !== undefined && this.draft.trim() !== "" ? Number(this.draft) : this.numberValue();
      const step = Number(this.getAttribute(page ? "step-page" : "step") ?? "1");
      const start = baseValue ?? (this.hasAttribute("min") ? Number(this.getAttribute("min")) : 0);
      const next = this.bounds(start + direction * (Number.isFinite(step) && step > 0 ? step : 1));
      if (this.numberValue() !== next || this.draft !== undefined) this.emitChange(input, event, next);
    }

    private getInput(): HTMLInputElement | undefined {
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="input"]');
      return slot?.assignedElements().find((element): element is HTMLInputElement => element instanceof HTMLInputElement)
        ?? this.shadowRoot?.querySelector<HTMLInputElement>(".input-fallback") ?? undefined;
    }
    private getStepper(direction: "increment" | "decrement"): HTMLButtonElement | undefined {
      const name = direction === "increment" ? "incrementButton" : "decrementButton";
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>(`slot[name="${name}"]`);
      return slot?.assignedElements().find((element): element is HTMLButtonElement => element instanceof HTMLButtonElement)
        ?? this.shadowRoot?.querySelector<HTMLButtonElement>(`[part~="${direction}-button"]`) ?? undefined;
    }
    private syncSlots(): void {
      const input = this.getInput();
      if (input) {
        const fallback = this.shadowRoot?.querySelector<HTMLInputElement>(".input-fallback");
        if (fallback) { const assigned = input !== fallback; fallback.hidden = assigned; fallback.setAttribute("aria-hidden", String(assigned)); fallback.removeAttribute("name"); }
        if (this.boundInput !== input) {
          this.boundInput?.removeEventListener("input", this.handleInput);
          this.boundInput?.removeEventListener("change", this.handleChange);
          this.boundInput?.removeEventListener("blur", this.handleBlur);
          this.boundInput?.removeEventListener("keydown", this.handleKeyDown);
          input.addEventListener("input", this.handleInput);
          input.addEventListener("change", this.handleChange);
          input.addEventListener("blur", this.handleBlur);
          input.addEventListener("keydown", this.handleKeyDown);
          this.boundInput = input;
        }
        if (!input.id) input.id = this.shadowRoot?.querySelector("label")?.htmlFor ?? `spin-${crypto.randomUUID()}`;
        if (!input.hasAttribute("role")) input.setAttribute("role", "spinbutton");
        if (!input.hasAttribute("aria-label") && !input.hasAttribute("aria-labelledby")) {
          const label = this.getAttribute("label"); if (label) input.setAttribute("aria-label", label);
        }
        for (const name of ["min", "max", "aria-label", "aria-description", "aria-describedby", "aria-invalid"]) {
          if (input.hasAttribute(name)) continue;
          const value = this.getAttribute(name); if (value !== null) input.setAttribute(name, value);
        }
        input.disabled = this.hasAttribute("disabled") || input.disabled;
        input.required = this.hasAttribute("required") || input.required;
        input.readOnly = this.hasAttribute("read-only") || input.readOnly;
        input.removeAttribute("name");
        if (this.draft === undefined) input.value = this.getAttribute("display-value") ?? this.currentValue ?? "";
        this.syncAria(input); this.syncFormState(input); this.updateButtons(input);
      }
      const decrement = this.getStepper("decrement");
      if (decrement && !decrement.hasAttribute("type")) decrement.type = "button";
      const decrementFallback = this.shadowRoot?.querySelector<HTMLButtonElement>('[part~="decrement-button"]');
      if (decrementFallback) { const assigned = decrement !== decrementFallback; decrementFallback.hidden = assigned; decrementFallback.setAttribute("aria-hidden", String(assigned)); }
      if (this.boundDecrement !== decrement) {
        this.boundDecrement?.removeEventListener("click", this.handleDecrement);
        decrement?.addEventListener("click", this.handleDecrement);
        this.boundDecrement = decrement;
      }
      const increment = this.getStepper("increment");
      if (increment && !increment.hasAttribute("type")) increment.type = "button";
      const incrementFallback = this.shadowRoot?.querySelector<HTMLButtonElement>('[part~="increment-button"]');
      if (incrementFallback) { const assigned = increment !== incrementFallback; incrementFallback.hidden = assigned; incrementFallback.setAttribute("aria-hidden", String(assigned)); }
      if (this.boundIncrement !== increment) {
        this.boundIncrement?.removeEventListener("click", this.handleIncrement);
        increment?.addEventListener("click", this.handleIncrement);
        this.boundIncrement = increment;
      }
    }
    private handleInput = (event: Event): void => {
      const input = event.currentTarget as HTMLInputElement;
      if (this.draft === undefined) this.previousDraft = this.getAttribute("display-value") ?? this.currentValue ?? "";
      this.draft = input.value;
      const parsed = this.draft.trim() === "" ? null : Number(this.draft);
      if (parsed === null) input.removeAttribute("aria-valuenow"); else if (Number.isFinite(parsed)) input.setAttribute("aria-valuenow", String(parsed));
      this.internals?.setFormValue(parsed === null || !Number.isFinite(parsed) ? null : String(parsed));
      this.dispatchEvent(new CustomEvent("spui-change", { detail: { value: parsed === null ? "" : String(parsed), sourceEvent: event, committed: false }, bubbles: true, composed: true }));
    };
    private handleChange = (event: Event): void => this.commit(event.currentTarget as HTMLInputElement, event);
    private handleBlur = (event: Event): void => this.commit(event.currentTarget as HTMLInputElement, event);
    private handleKeyDown = (rawEvent: Event): void => {
      const event = rawEvent as KeyboardEvent; const input = event.currentTarget as HTMLInputElement;
      if (event.altKey || event.ctrlKey || event.metaKey || input.readOnly) return;
      if (event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "PageUp" || event.key === "PageDown") { event.preventDefault(); this.step(input, event, event.key === "ArrowUp" || event.key === "PageUp" ? 1 : -1, event.key.startsWith("Page")); }
      else if (event.key === "Home" && this.hasAttribute("min")) { event.preventDefault(); const min = Number(this.getAttribute("min")); if (this.numberValue() !== min) this.emitChange(input, event, min); }
      else if (event.key === "End" && this.hasAttribute("max")) { event.preventDefault(); const max = Number(this.getAttribute("max")); if (this.numberValue() !== max) this.emitChange(input, event, max); }
      else if (event.key === "Enter") { event.preventDefault(); this.commit(input, event); }
      else if (event.key === "Escape" && this.draft !== undefined) { input.value = this.getAttribute("display-value") ?? this.currentValue ?? ""; this.draft = undefined; this.previousDraft = undefined; this.syncAria(input); }
    };
    private handleDecrement = (event: Event): void => this.handleStepButton(event, -1);
    private handleIncrement = (event: Event): void => this.handleStepButton(event, 1);
    private handleStepButton(event: Event, direction: number): void {
      const input = this.getInput(); if (!input || input.disabled || input.readOnly) return;
      this.commit(input, event); this.step(input, event, direction); input.focus();
    }

    private render(): void {
      const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open" });
      const id = `spin-${crypto.randomUUID()}`;
      const label = document.createElement("label");
      label.htmlFor = id;
      label.textContent = this.getAttribute("label") ?? "";
      label.part.add("label");
      const control = document.createElement("div");
      control.part.add("control-group");
      const input = document.createElement("input");
      input.className = "input-fallback";
      input.id = id;
      input.type = "text";
      input.inputMode = "decimal";
      input.autocomplete = "off";
      input.setAttribute("role", "spinbutton");
      const initial = this.currentValue ?? this.getAttribute("value") ?? this.getAttribute("default-value") ?? "0";
      this.currentValue = initial;
      input.value = this.getAttribute("display-value") ?? initial;
      for (const name of ["min", "max", "aria-label", "aria-description", "aria-describedby", "aria-invalid"]) { const value = this.getAttribute(name); if (value !== null) input.setAttribute(name, value); }
      input.disabled = this.hasAttribute("disabled");
      input.required = this.hasAttribute("required");
      input.readOnly = this.hasAttribute("read-only");
      input.part.add("input");
      const buttons = document.createElement("span");
      buttons.part.add("buttons");
      const makeButton = (direction: "increment" | "decrement", fallback: string, symbol: string) => {
        const button = document.createElement("button");
        button.type = "button";
        button.tabIndex = -1;
        button.setAttribute("aria-label", this.getAttribute(`${direction}-label`) ?? fallback);
        button.part.add(`${direction}-button`);
        button.innerHTML = `<svg aria-hidden="true" viewBox="0 0 16 16"><path d="${symbol}"/></svg>`;
        return button;
      };
      const decrement = makeButton("decrement", "Decrease value", "m3.25 5.5 4.75 4.75 4.75-4.75");
      const increment = makeButton("increment", "Increase value", "m3.25 10.5 4.75-4.75 4.75 4.75");
      const inputSlot = document.createElement("slot"); inputSlot.name = "input"; inputSlot.part.add("input"); inputSlot.append(input); inputSlot.addEventListener("slotchange", () => this.syncSlots());
      const incrementSlot = document.createElement("slot"); incrementSlot.name = "incrementButton"; incrementSlot.part.add("increment-button-slot"); incrementSlot.append(increment); incrementSlot.addEventListener("slotchange", () => this.syncSlots());
      const decrementSlot = document.createElement("slot"); decrementSlot.name = "decrementButton"; decrementSlot.part.add("decrement-button-slot"); decrementSlot.append(decrement); decrementSlot.addEventListener("slotchange", () => this.syncSlots());
      buttons.append(incrementSlot, decrementSlot);
      control.append(inputSlot, buttons);
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:grid;gap:var(--spui-control-gap,6px);width:100%}label{font-size:14px;font-weight:600;color:var(--spui-ui-muted,var(--spui-semantic-body-text,inherit))}[part~=control-group]{box-sizing:border-box;display:grid;grid-template-columns:minmax(0,1fr) 24px;grid-template-rows:1fr 1fr;min-height:var(--spui-control-height,32px);column-gap:4px;position:relative;isolation:isolate;border:1px solid var(--spui-control-border,var(--spui-ui-stroke,var(--spui-semantic-input-border,var(--colorNeutralStroke1,#8a8886))));border-radius:var(--spui-control-radius,4px);background:var(--spui-control-background,var(--spui-ui-surface,var(--spui-semantic-input-background,var(--colorNeutralBackground1,#fff))));color:var(--spui-ui-text,var(--spui-semantic-body-text,inherit))}[part~=control-group]:focus-within{outline:2px solid var(--spui-focus-ring,var(--colorStrokeFocus2,#005a9e));outline-offset:2px}:host([size=small]) [part~=control-group]{min-height:24px}:host([appearance=underline]) [part~=control-group]{border-width:0 0 1px;border-radius:0}:host([appearance=filled-darker]) [part~=control-group]{background:var(--colorNeutralBackground3,var(--spui-ui-surface-sunken,#f0f0f0));border-color:transparent}:host([appearance=filled-lighter]) [part~=control-group]{background:var(--colorNeutralBackground2,var(--spui-ui-surface-hover,#f5f5f5));border-color:transparent}input{grid-column:1;grid-row:1/3;min-width:0;width:100%;padding-inline:var(--spui-control-padding-inline,10px);border:0;border-radius:inherit;background:transparent;color:inherit;font:inherit;outline:none}input::-webkit-inner-spin-button,input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}span[part=buttons]{grid-column:2;grid-row:1/3;display:grid;grid-template-rows:1fr 1fr;min-height:0}button{display:grid;place-items:center;min-width:24px;padding:0;border:0;background:transparent;color:inherit;cursor:pointer}button:hover:not(:disabled){background:var(--spui-ui-surface-hover,#f5f5f5)}button:disabled{opacity:.42;cursor:not-allowed}button svg{width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}input:disabled{opacity:.55}input:read-only{cursor:default}@media(forced-colors:active){[part~=control-group]{border-color:FieldText}button:focus-visible,input:focus-visible{outline:1px solid Highlight}}`;
      style.textContent += "[part~=control-group]{grid-template-rows:24px 24px;min-height:50px}:host([size=small]) [part~=control-group]{min-height:50px}span[part=buttons]{grid-template-rows:24px 24px;min-height:48px}button{min-height:24px}";
      style.textContent += "slot[name=input]{display:contents}slot[name=input]::slotted(input){grid-column:1;grid-row:1/3;min-width:0;width:100%;padding-inline:var(--spui-control-padding-inline,10px);border:0;border-radius:inherit;background:transparent;color:inherit;font:inherit;outline:none}slot[name=incrementButton],slot[name=decrementButton]{display:contents}slot[name=incrementButton]::slotted(button),slot[name=decrementButton]::slotted(button){display:grid;place-items:center;min-width:24px;min-height:24px;padding:0;border:0;background:transparent;color:inherit;cursor:pointer}slot[name=incrementButton]::slotted(button:disabled),slot[name=decrementButton]::slotted(button:disabled){opacity:.42;cursor:not-allowed}";
      shadow.replaceChildren(style, label, control);
      this.syncSlots();
    }
  }
  customElements.define("spui-spin-button", SpuiSpinButton);
}
