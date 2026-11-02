import { base } from "./shared.js";

export function defineSlider(): void {
  if (customElements.get("spui-slider")) return;
  class SpuiSlider extends HTMLElement {
    static formAssociated = true;
    static observedAttributes = ["label", "value", "default-value", "min", "max", "step", "size", "vertical", "disabled", "name", "aria-label", "aria-description", "aria-describedby", "aria-invalid", "aria-orientation", "aria-required", "aria-valuetext"];
    private internals: ElementInternals | undefined;
    private currentValue: string | undefined;
    private currentDefaultValue: string | undefined;
    private boundInput?: HTMLInputElement;
    private defaultAriaOrientation?: { input: HTMLInputElement; value: string };

    get form(): HTMLFormElement | null { return this.internals?.form ?? null; }

    constructor() {
      super();
      try { this.internals = this.attachInternals(); } catch { /* The native range input remains usable without ElementInternals. */ }
    }

    connectedCallback(): void { this.render(); }

    attributeChangedCallback(name: string, _oldValue: string | null, value: string | null): void {
      if (!this.isConnected) return;
      const input = this.getInput();
      if (!input) return;
      if (name === "label") {
        const label = this.shadowRoot?.querySelector("label");
        if (label) label.textContent = value ?? "";
      } else if (name === "value") {
        this.currentValue = value ?? "";
        if (value !== null) input.value = value;
        this.syncVisual(input);
      } else if (name === "default-value") {
        this.currentDefaultValue = value ?? "";
        if (this.getAttribute("value") === null) input.value = value ?? "0";
        this.syncVisual(input);
      } else if (["min", "max", "step"].includes(name)) {
        if (value === null) input.removeAttribute(name); else input.setAttribute(name, value);
        this.syncVisual(input);
      } else if (name === "size" || name === "vertical") {
        if (value === null || value === "false") this.removeAttribute(name);
        if (name === "vertical") {
          if (this.hasAttribute("vertical")) input.setAttribute("orient", "vertical");
          else input.removeAttribute("orient");
        }
      } else if (name === "disabled") input.disabled = this.hasAttribute("disabled");
      else if (name === "aria-label" || name === "aria-description" || name === "aria-describedby" || name === "aria-invalid" || name === "aria-orientation" || name === "aria-required" || name === "aria-valuetext") {
        if (name === "aria-orientation") this.defaultAriaOrientation = undefined;
        value === null ? input.removeAttribute(name) : input.setAttribute(name, value);
      }
      this.syncFormValue(input);
      this.syncSlots();
    }

    get value(): number { return this.getInput()?.valueAsNumber ?? Number(this.currentValue ?? this.getAttribute("value")); }
    set value(value: number) {
      this.currentValue = String(value);
      const input = this.getInput();
      if (input) { input.value = this.currentValue; this.syncFormValue(input); this.syncVisual(input); }
    }

    get defaultValue(): number { return Number(this.currentDefaultValue ?? this.getAttribute("default-value") ?? 0); }
    set defaultValue(value: number) {
      this.currentDefaultValue = String(value);
      this.setAttribute("default-value", this.currentDefaultValue);
    }

    formDisabledCallback(disabled: boolean): void { const input = this.getInput(); if (input) input.disabled = disabled || this.hasAttribute("disabled"); }
    formResetCallback(): void { const input = this.getInput(); if (input) { input.value = this.getAttribute("value") ?? this.getAttribute("default-value") ?? "0"; this.currentValue = input.value; this.syncFormValue(input); this.syncVisual(input); } }
    formStateRestoreCallback(state: string | File | FormData | null): void { if (typeof state === "string") this.value = Number(state); }

    private syncFormValue(input: HTMLInputElement): void { this.internals?.setFormValue(input.value); }

    private getInput(): HTMLInputElement | undefined {
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="input"]');
      return slot?.assignedElements().find((element): element is HTMLInputElement => element instanceof HTMLInputElement)
        ?? this.shadowRoot?.querySelector<HTMLInputElement>(".input-fallback") ?? undefined;
    }
    private syncVisual(input: HTMLInputElement): void {
      const min = Number(input.min || 0); const max = Number(input.max || 100); const range = max - min;
      const progress = range > 0 ? Math.max(0, Math.min(1, (input.valueAsNumber - min) / range)) : 0;
      const track = this.shadowRoot?.querySelector<HTMLElement>(".track");
      track?.style.setProperty("--spui-slider-progress", String(progress));
      const thumbSlot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="thumb"]');
      const thumb = thumbSlot?.assignedElements()[0] as HTMLElement | undefined ?? this.shadowRoot?.querySelector<HTMLElement>(".thumb");
      const progressPercent = `${progress * 100}%`;
      track?.style.setProperty("--spui-slider-progress-percent", progressPercent);
      track?.style.setProperty("--spui-slider-fill-percent", progressPercent);
      if (thumb) {
        if (this.hasAttribute("vertical")) { thumb.style.insetInlineStart = "50%"; thumb.style.insetBlockStart = `${(1 - progress) * 100}%`; }
        else { thumb.style.insetInlineStart = `${progress * 100}%`; thumb.style.insetBlockStart = "50%"; }
      }
    }
    private syncSlots(): void {
      const input = this.getInput(); if (!input) return;
      if (this.boundInput !== input) {
        this.boundInput?.removeEventListener("input", this.handleInput);
        input.addEventListener("input", this.handleInput);
        this.boundInput = input;
        input.value = this.currentValue ?? this.getAttribute("value") ?? this.currentDefaultValue ?? this.getAttribute("default-value") ?? input.value ?? "0";
      }
      const fallback = this.shadowRoot?.querySelector<HTMLInputElement>(".input-fallback");
      if (fallback) { const assigned = input !== fallback; fallback.hidden = assigned; fallback.setAttribute("aria-hidden", String(assigned)); }
      input.type = "range"; input.removeAttribute("name");
      if (!input.id) input.id = this.shadowRoot?.querySelector("label")?.htmlFor ?? `slider-${crypto.randomUUID()}`;
      if (this.hasAttribute("vertical")) input.setAttribute("orient", "vertical");
      else input.removeAttribute("orient");
      if (!input.hasAttribute("aria-label") && !input.hasAttribute("aria-labelledby")) { const label = this.getAttribute("label"); if (label) input.setAttribute("aria-label", label); }
      for (const name of ["min", "max", "step", "aria-description", "aria-describedby", "aria-invalid", "aria-orientation", "aria-required", "aria-valuetext"]) if (!input.hasAttribute(name)) { const value = this.getAttribute(name); if (value !== null) input.setAttribute(name, value); }
      const orientation = this.hasAttribute("vertical") ? "vertical" : "horizontal";
      const previousDefault = this.defaultAriaOrientation;
      const orientationWasDefaulted = previousDefault?.input === input && input.getAttribute("aria-orientation") === previousDefault.value;
      if (orientationWasDefaulted || !input.hasAttribute("aria-orientation")) {
        input.setAttribute("aria-orientation", orientation);
        this.defaultAriaOrientation = { input, value: orientation };
      } else this.defaultAriaOrientation = undefined;
      input.disabled = this.hasAttribute("disabled") || input.disabled;
      this.syncFormValue(input); this.syncVisual(input);
    }
    private handleInput = (event: Event): void => {
      const input = event.currentTarget as HTMLInputElement;
      this.currentValue = input.value;
      this.syncFormValue(input); this.syncVisual(input);
      this.dispatchEvent(new CustomEvent("spui-change", { detail: { value: input.valueAsNumber, sourceEvent: event }, bubbles: true, composed: true }));
    };

    private render(): void {
      const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open" });
      const id = `slider-${crypto.randomUUID()}`;
      const label = document.createElement("label");
      label.htmlFor = id;
      label.textContent = this.getAttribute("label") ?? "";
      label.part.add("label");
      const input = document.createElement("input");
      input.className = "input-fallback";
      input.id = id;
      input.type = "range";
      if (this.hasAttribute("vertical")) input.setAttribute("orient", "vertical");
      input.value = this.currentValue ?? this.getAttribute("value") ?? this.currentDefaultValue ?? this.getAttribute("default-value") ?? "0";
      for (const name of ["min", "max", "step", "aria-label", "aria-description", "aria-describedby", "aria-invalid", "aria-required", "aria-valuetext"]) { const value = this.getAttribute(name); if (value !== null) input.setAttribute(name, value); }
      input.disabled = this.hasAttribute("disabled");
      input.part.add("control");
      const track = document.createElement("div"); track.className = "track"; track.part.add("track");
      const rail = document.createElement("div"); rail.className = "rail"; rail.part.add("rail");
      const railSlot = document.createElement("slot"); railSlot.name = "rail"; railSlot.append(rail); railSlot.addEventListener("slotchange", () => this.syncSlots());
      const fill = document.createElement("div"); fill.className = "rail-fill"; fill.setAttribute("aria-hidden", "true");
      const thumb = document.createElement("span"); thumb.className = "thumb"; thumb.part.add("thumb");
      const thumbSlot = document.createElement("slot"); thumbSlot.name = "thumb"; thumbSlot.append(thumb); thumbSlot.addEventListener("slotchange", () => this.syncSlots());
      const inputSlot = document.createElement("slot"); inputSlot.name = "input"; inputSlot.part.add("input"); inputSlot.append(input); inputSlot.addEventListener("slotchange", () => this.syncSlots());
      track.append(railSlot, fill, thumbSlot, inputSlot);
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:grid;gap:var(--spui-control-gap,6px)}label{font-size:14px;font-weight:600;color:var(--spui-ui-muted,var(--spui-semantic-body-text,inherit))}input{width:100%;min-height:var(--spui-control-height,32px);margin:0;accent-color:var(--spui-ui-accent,var(--spui-semantic-primary-button-background,var(--colorBrandBackground,#0f6cbd)));cursor:pointer}input:focus-visible{outline:2px solid var(--spui-focus-ring,#005a9e);outline-offset:3px}input:disabled{opacity:.55;cursor:not-allowed}:host([size=small]) input{min-height:24px}:host([vertical]){display:inline-grid;justify-items:center;align-content:start}:host([vertical]) input{width:var(--spui-control-height,32px);height:160px;min-height:160px;writing-mode:vertical-lr;direction:rtl}:host([vertical]) label{grid-row:2}@media(forced-colors:active){input{accent-color:Highlight}input:focus-visible{outline-color:Highlight}}`;
      style.textContent += `.track{position:relative;width:100%;min-width:0;height:var(--spui-control-height,32px);touch-action:pan-y}.rail{position:absolute;inset-inline:0;inset-block-start:50%;height:4px;transform:translateY(-50%);border-radius:999px;background:var(--spui-slider-rail,var(--spui-ui-stroke,var(--colorNeutralStroke1,#d1d1d1)))}.rail-fill{position:absolute;inset-inline-start:0;inset-block-start:50%;width:var(--spui-slider-fill-percent,0%);height:4px;transform:translateY(-50%);border-radius:999px;background:var(--spui-slider-fill,var(--spui-ui-accent,var(--colorBrandBackground,#0f6cbd)));pointer-events:none}.thumb{position:absolute;inset-inline-start:var(--spui-slider-progress-percent,0%);inset-block-start:50%;width:16px;height:16px;transform:translate(-50%,-50%);border:2px solid var(--spui-slider-thumb-border,var(--spui-ui-accent,var(--colorBrandBackground,#0f6cbd)));border-radius:50%;background:var(--spui-slider-thumb-background,var(--spui-ui-canvas,#fff));box-shadow:var(--shadow2,0 1px 2px rgb(0 0 0 / 20%));pointer-events:none}slot[name=rail]{position:absolute;inset:0;pointer-events:none}slot[name=rail]::slotted(*){position:absolute;inset-inline:0;inset-block-start:50%;height:4px;transform:translateY(-50%);border-radius:999px;background:var(--spui-slider-rail,var(--spui-ui-stroke,var(--colorNeutralStroke1,#d1d1d1)))}slot[name=thumb]{position:absolute;inset:0;pointer-events:none}slot[name=thumb]::slotted(*){position:absolute;inset-inline-start:var(--spui-slider-progress-percent,0%);inset-block-start:50%;width:16px;height:16px;transform:translate(-50%,-50%);border:2px solid var(--spui-slider-thumb-border,var(--spui-ui-accent,var(--colorBrandBackground,#0f6cbd)));border-radius:50%;background:var(--spui-slider-thumb-background,var(--spui-ui-canvas,#fff));box-shadow:var(--shadow2,0 1px 2px rgb(0 0 0 / 20%))}slot[name=input]{position:absolute;inset:0}input{position:absolute;inset:0;width:100%;height:100%;min-height:24px;opacity:0;appearance:none;cursor:pointer}input::-webkit-slider-thumb{appearance:none;width:24px;height:24px}input:focus-visible{outline:0}.track:focus-within{outline:2px solid var(--spui-focus-ring,#005a9e);outline-offset:2px;border-radius:4px}:host([size=small]) .track{height:24px}:host([vertical]) .track{display:block;width:var(--spui-control-height,32px);height:160px;min-height:160px;touch-action:pan-x}:host([vertical]) .rail,:host([vertical]) slot[name=rail]::slotted(*){inset-inline:50%;inset-block:0;width:4px;height:auto;transform:translateX(-50%)}:host([vertical]) .rail-fill{inset-inline-start:50%;inset-block-start:auto;inset-block-end:0;width:4px;height:var(--spui-slider-fill-percent,0%);transform:translateX(-50%)}:host([vertical]) .thumb,:host([vertical]) slot[name=thumb]::slotted(*){inset-inline-start:50%;inset-block-start:calc(100% - var(--spui-slider-progress-percent,0%));transform:translate(-50%,-50%)}:host([vertical]) label{grid-row:2}:host([dir=rtl]) .rail-fill{inset-inline-start:auto;inset-inline-end:0}:host([dir=rtl]) .thumb,:host([dir=rtl]) slot[name=thumb]::slotted(*){inset-inline-start:auto;inset-inline-end:var(--spui-slider-progress-percent,0%);transform:translate(50%,-50%)}@media(forced-colors:active){.rail{background:CanvasText}.rail-fill{background:Highlight}.thumb{border-color:Highlight;background:Canvas}}`;
      shadow.replaceChildren(style, label, track);
      this.syncSlots();
    }
  }
  customElements.define("spui-slider", SpuiSlider);
}
