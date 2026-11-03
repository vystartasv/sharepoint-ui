import { base, syncHostAccessibleName } from "./shared.js";

/** Selectable, form-associated star rating with optional half steps. */
export function defineRating(): void {
  if (customElements.get("spui-rating")) return;
  class SpuiRating extends HTMLElement {
    static formAssociated = true;
    static observedAttributes = ["value", "default-value", "max", "step", "size", "color", "label", "item-label", "name", "disabled", "readonly", "required", "required-message", "aria-label", "aria-labelledby", "aria-description", "aria-describedby"];
    private internals?: ElementInternals;
    private readonly instanceName = `spui-rating-${crypto.randomUUID()}`;
    private rating = 0;
    private maxValue = 5;
    private stepValue: 0.5 | 1 = 1;
    private initialValue = 0;
    private itemLabelFormatter?: (value: number) => string;
    private formDisabled = false;
    private inputTemplateObserver?: MutationObserver;

    get form(): HTMLFormElement | null { return this.internals?.form ?? null; }

    constructor() {
      super();
      try { this.internals = this.attachInternals(); } catch { /* Radio interaction still works without custom form association. */ }
    }

    connectedCallback(): void {
      this.maxValue = this.readMax();
      this.stepValue = this.readStep();
      this.rating = this.hasAttribute("value") ? this.readValue(this.getAttribute("value")) : this.readValue(this.getAttribute("default-value"));
      this.initialValue = this.rating;
      this.render();
      this.syncForm();
      this.watchInputTemplates();
    }

    disconnectedCallback(): void { this.inputTemplateObserver?.disconnect(); }

    attributeChangedCallback(name: string): void {
      if (!this.isConnected) return;
      if (name === "value") this.rating = this.readValue(this.getAttribute("value"));
      if (name === "max") { this.maxValue = this.readMax(); this.rating = this.readValue(String(this.rating)); }
      if (name === "step") { this.stepValue = this.readStep(); this.rating = this.clampValue(this.rating); }
      if (name === "default-value") this.initialValue = this.readValue(this.getAttribute("default-value"));
      this.render();
      this.syncForm();
    }

    get value(): number { return this.rating; }
    set value(value: number) {
      this.rating = this.clampValue(Number(value));
      this.render();
      this.syncForm();
    }
    get max(): number { return this.maxValue; }
    set max(value: number) { this.setAttribute("max", String(value)); }
    set itemLabel(value: ((rating: number) => string) | undefined) { this.itemLabelFormatter = value; if (this.isConnected) this.render(); }

    formDisabledCallback(disabled: boolean): void { this.formDisabled = disabled; this.queryInputs().forEach(input => { input.disabled = disabled || this.hasAttribute("disabled") || this.hasAttribute("readonly"); }); }
    formResetCallback(): void { this.rating = this.initialValue; this.render(); this.syncForm(); }
    formStateRestoreCallback(state: string | File | FormData | null): void { if (typeof state === "string") this.value = Number(state); }

    private readMax(): number { const max = Number(this.getAttribute("max") ?? 5); return Number.isInteger(max) && max > 1 ? Math.min(max, 20) : 5; }
    private readStep(): 0.5 | 1 { return this.getAttribute("step") === "0.5" ? 0.5 : 1; }
    private readValue(value: string | null): number { return this.clampValue(Number(value ?? 0)); }
    private clampValue(value: number): number {
      const safe = Number.isFinite(value) ? Math.max(0, Math.min(this.maxValue, value)) : 0;
      return Math.round(safe / this.stepValue) * this.stepValue;
    }
    private queryInputs(): HTMLInputElement[] { return [...(this.shadowRoot?.querySelectorAll<HTMLInputElement>("input[type=radio]") ?? [])]; }
    private watchInputTemplates(): void {
      this.inputTemplateObserver ??= new MutationObserver(() => { this.watchInputTemplates(); this.render(); });
      this.inputTemplateObserver.observe(this, { childList: true });
      for (const input of this.querySelectorAll<HTMLInputElement>('input[slot="full-value-input"],input[slot="half-value-input"]')) this.inputTemplateObserver.observe(input, { attributes: true });
    }
    private updateValue(value: number, event: Event): void {
      const next = this.clampValue(value);
      if (this.hasAttribute("value")) {
        this.render();
        this.syncForm();
        this.dispatchEvent(new CustomEvent("spui-change", { detail: { event, type: "change", value: next }, bubbles: true, composed: true }));
        return;
      }
      this.rating = next;
      this.render();
      this.syncForm();
      this.dispatchEvent(new CustomEvent("spui-change", { detail: { event, type: "change", value: next }, bubbles: true, composed: true }));
    }
    private syncForm(): void {
      this.internals?.setFormValue(this.rating > 0 ? String(this.rating) : null, String(this.rating));
      const missing = this.hasAttribute("required") && this.rating === 0;
      try { this.internals?.setValidity(missing ? { valueMissing: true } : {}, missing ? this.getAttribute("required-message") || "Choose a rating." : "", this.queryInputs()[0]); } catch { /* Keep the radio group functional if a browser rejects the validity anchor. */ }
    }
    private labelFor(value: number): string {
      if (this.itemLabelFormatter) return this.itemLabelFormatter(value);
      const template = this.getAttribute("item-label") || "{value} of {max}";
      return template.replaceAll("{value}", String(value)).replaceAll("{max}", String(this.maxValue));
    }
    private render(): void {
      const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open" });
      shadow.replaceChildren();
      const labelText = this.getAttribute("label") ?? this.getAttribute("aria-label") ?? "Rating";
      const label = document.createElement("span"); label.className = "label"; label.part.add("label"); label.textContent = this.getAttribute("label") ?? "";
      label.hidden = !this.getAttribute("label");
      const group = document.createElement("div"); group.className = "items"; group.setAttribute("role", "radiogroup"); group.setAttribute("aria-label", labelText); group.part.add("items");
      if (this.hasAttribute("readonly")) group.setAttribute("aria-readonly", "true");
      if (this.hasAttribute("disabled")) group.setAttribute("aria-disabled", "true");
      const half = this.stepValue === 0.5;
      for (let star = 1; star <= this.maxValue; star++) {
        const starItem = document.createElement("span"); starItem.className = "star";
        const icon = document.createElement("span"); icon.className = "icon"; icon.part.add("icon"); icon.setAttribute("aria-hidden", "true"); icon.textContent = "☆";
        const fill = document.createElement("span"); fill.className = "fill"; fill.textContent = "★";
        fill.style.width = `${Math.max(0, Math.min(1, this.rating - (star - 1))) * 100}%`;
        icon.append(fill); starItem.append(icon);
        for (const value of (half ? [star - 0.5, star] : [star])) {
          const inputSlot = value % 1 ? "half-value-input" : "full-value-input";
          const template = this.querySelector<HTMLInputElement>(`input[slot="${inputSlot}"]`);
          const input = template ? template.cloneNode(false) as HTMLInputElement : document.createElement("input");
          for (const attribute of ["slot", "hidden", "aria-hidden", "tabindex", "type", "name", "value", "checked", "disabled", "required"]) input.removeAttribute(attribute);
          input.type = "radio"; input.name = this.instanceName; input.value = String(value);
          input.checked = this.rating === value; input.disabled = this.formDisabled || this.hasAttribute("disabled") || this.hasAttribute("readonly"); input.required = this.hasAttribute("required");
          if (!input.hasAttribute("aria-label")) input.setAttribute("aria-label", this.labelFor(value)); input.part.add("option");
          input.addEventListener("change", event => { if (input.checked) this.updateValue(value, event); });
          const hit = document.createElement("label"); hit.className = half ? (value % 1 ? "hit half" : "hit full") : "hit whole";
          hit.append(input); starItem.append(hit);
        }
        group.append(starItem);
      }
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:inline-grid;gap:4px;min-width:0;color:var(--spui-ui-text,var(--spui-semantic-body-text,inherit));font-family:var(--spui-font-family,inherit)}.label{font-size:14px;font-weight:600;color:var(--spui-ui-muted,var(--spui-semantic-body-text,inherit))}.label[hidden]{display:none}.items{display:inline-flex;align-items:center;gap:2px;width:max-content}.star{position:relative;display:inline-block;flex:none;width:var(--spui-rating-size,28px);height:var(--spui-rating-size,28px)}.icon{position:relative;display:inline-block;font-size:var(--spui-rating-size,28px);line-height:1;color:var(--spui-rating-empty,color-mix(in srgb,var(--spui-ui-text,var(--spui-semantic-body-text,#242424)) 65%,var(--spui-ui-surface,var(--spui-semantic-body-background,#ffffff)) 35%));user-select:none}.fill{position:absolute;inset-block:0;inset-inline-start:0;overflow:hidden;width:0;color:var(--spui-rating-color,var(--spui-ui-accent,#0078d4));white-space:nowrap}:host([color=brand]){--spui-rating-color:color-mix(in srgb,var(--spui-ui-accent,#0078d4) 65%,var(--spui-ui-text,var(--spui-semantic-body-text,#242424)) 35%)}:host([color=marigold]){--spui-rating-color:color-mix(in srgb,var(--spui-rating-marigold,#c58b00) 65%,var(--spui-ui-text,var(--spui-semantic-body-text,#242424)) 35%)}:host(:not([color])),:host([color=neutral]){--spui-rating-color:var(--spui-ui-text,var(--spui-semantic-body-text,currentColor))}:host([size=small]){--spui-rating-size:18px}:host([size=medium]){--spui-rating-size:24px}:host([size=large]){--spui-rating-size:30px}:host([size=extra-large]),:host(:not([size])){--spui-rating-size:36px}.hit{position:absolute;z-index:1;inset-block:0;display:block;cursor:pointer}.hit.whole{inset-inline:0}.hit.half{inset-inline-start:0;width:50%}.hit.full{inset-inline-end:0;width:50%}.hit input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:inherit}.hit input:focus-visible{outline:0}.hit:focus-within{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:2px;border-radius:3px}:host([disabled]) .hit,:host([readonly]) .hit{cursor:default}@media(forced-colors:active){.icon{color:CanvasText}.fill{color:Highlight}.hit:focus-within{outline-color:Highlight}}`;
      const templates = document.createElement("div"); templates.hidden = true;
      for (const slotName of ["icon-filled", "icon-outline", "full-value-input", "half-value-input"]) {
        const slot = document.createElement("slot"); slot.name = slotName;
        slot.addEventListener("slotchange", () => this.syncIcons());
        templates.append(slot);
      }
      shadow.append(style, templates, label, group);
      syncHostAccessibleName(this, group);
      this.syncIcons();
    }

    private syncIcons(): void {
      const source = (name: string): Element | undefined => {
        const template = this.shadowRoot?.querySelector<HTMLSlotElement>(`slot[name=${name}]`)?.assignedElements()[0];
        if (!template) return undefined;
        const content = template.localName === "span" && (template as HTMLElement).hidden ? template.firstElementChild : template;
        if (!content) return undefined;
        const clone = content.cloneNode(true) as Element;
        clone.removeAttribute("slot"); clone.removeAttribute("hidden"); clone.setAttribute("aria-hidden", "true");
        return clone;
      };
      const filledIcon = source("icon-filled");
      const outlineIcon = source("icon-outline");
      for (const icon of this.shadowRoot?.querySelectorAll<HTMLElement>(".items .icon") ?? []) {
        const fill = icon.querySelector<HTMLElement>(".fill");
        if (!fill) continue;
        icon.replaceChildren(outlineIcon?.cloneNode(true) ?? document.createTextNode("☆"), fill);
        fill.replaceChildren(filledIcon?.cloneNode(true) ?? document.createTextNode("★"));
      }
    }
  }
  customElements.define("spui-rating", SpuiRating);
}
