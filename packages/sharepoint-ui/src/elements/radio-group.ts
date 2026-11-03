import { base, syncHostAccessibleName } from "./shared.js";

function radioOptionLabel(option: Element, fallback: string): string {
  const text = [...option.childNodes].filter(node => !(node instanceof Element && ["input", "indicator", "label"].includes(node.getAttribute("slot") ?? ""))).map(node => node.textContent ?? "").join("").trim();
  return option.getAttribute("label") ?? (text || fallback);
}

const radioRootInputAttributes = new WeakMap<HTMLInputElement, Set<string>>();
const radioManagedInputAttributes = new Set(["checked", "disabled", "hidden", "label", "label-position", "name", "required", "slot", "type", "value"]);

function isForwardableRadioInputAttribute(name: string): boolean {
  return !radioManagedInputAttributes.has(name) && !name.startsWith("on");
}

function syncRadioRootProps(option: Element, input: HTMLInputElement, label: HTMLLabelElement): void {
  label.className = option.getAttribute("class") ?? option.getAttribute("classname") ?? "";
  label.style.cssText = option.getAttribute("style") ?? "";
  for (const name of radioRootInputAttributes.get(input) ?? []) input.removeAttribute(name);
  const applied = new Set<string>();
  for (const attribute of [...option.attributes]) {
    if (attribute.name !== "class" && attribute.name !== "style" && isForwardableRadioInputAttribute(attribute.name)) {
      input.setAttribute(attribute.name, attribute.value);
      applied.add(attribute.name);
    }
  }
  radioRootInputAttributes.set(input, applied);
}

const radioInputSlotAttributes = new WeakMap<HTMLInputElement, Set<string>>();

function syncRadioInputSlot(source: HTMLInputElement | null, input: HTMLInputElement): void {
  for (const name of radioInputSlotAttributes.get(input) ?? []) input.removeAttribute(name);
  const applied = new Set<string>();
  if (!source) { radioInputSlotAttributes.set(input, applied); return; }
  for (const attribute of [...source.attributes]) {
    if (isForwardableRadioInputAttribute(attribute.name)) { input.setAttribute(attribute.name, attribute.value); applied.add(attribute.name); }
  }
  radioInputSlotAttributes.set(input, applied);
}

function createRadioIndicator(source: Element | null): HTMLElement {
  const indicator = (source?.cloneNode(true) as HTMLElement | undefined) ?? document.createElement("span");
  indicator.removeAttribute("slot");
  indicator.removeAttribute("hidden");
  indicator.setAttribute("aria-hidden", "true");
  indicator.classList.add("radio-indicator");
  indicator.part.add("indicator");
  return indicator;
}

function createRadioLabel(source: Element | null, text: string): HTMLSpanElement {
  const label = document.createElement("span");
  label.dataset.radioLabel = "";
  if (source) {
    const content = source.cloneNode(true) as HTMLElement;
    content.removeAttribute("slot"); content.removeAttribute("hidden");
    label.append(content);
  } else label.textContent = text;
  return label;
}

export function defineRadioGroup(): void {
  if (customElements.get("spui-radio-group")) return;
  class SpuiRadioGroup extends HTMLElement {
    static formAssociated = true;
    static observedAttributes = ["label", "value", "default-value", "disabled", "required", "name", "orientation", "layout", "aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid"];
    private internals: ElementInternals | undefined;
    private observer: MutationObserver | undefined;
    private currentValue: string | undefined;
    private formDisabledValue = false;

    constructor() {
      super();
      try { this.internals = this.attachInternals(); } catch { /* Keep the controls usable where custom form association is unavailable. */ }
    }

    get form(): HTMLFormElement | null { return this.internals?.form ?? null; }
    get validity(): ValidityState | undefined { return this.internals?.validity; }
    get validationMessage(): string { return this.internals?.validationMessage ?? ""; }
    get willValidate(): boolean { return this.internals?.willValidate ?? false; }
    checkValidity(): boolean { return this.internals?.checkValidity() ?? true; }
    reportValidity(): boolean { return this.internals?.reportValidity() ?? true; }

    connectedCallback(): void {
      this.render();
      this.observer = new MutationObserver(records => {
        let optionsChanged = false;
        const textChanged = new Set<Element>();
        for (const record of records) {
          if (record.type === "attributes") {
            const option = record.target instanceof Element ? record.target.closest("spui-radio-option") : null;
            if (option?.parentElement === this && record.target === option && ["value", "disabled", "checked"].includes(record.attributeName ?? "")) optionsChanged = true;
            else if (option?.parentElement === this) textChanged.add(option);
            else if (record.target === this) optionsChanged = true;
            continue;
          }
          const target = record.target instanceof Element ? record.target : record.target.parentElement;
          const option = target?.closest("spui-radio-option");
          if (option?.parentElement === this) textChanged.add(option);
          else if (record.target === this) optionsChanged = true;
        }
        if (optionsChanged) this.syncOptions();
        else for (const option of textChanged) this.syncOptionLabel(option);
      });
      this.observer.observe(this, { childList: true, subtree: true, characterData: true, attributes: true });
    }

    disconnectedCallback(): void { this.observer?.disconnect(); }

    attributeChangedCallback(name: string, _oldValue: string | null, value: string | null): void {
      if (!this.isConnected) return;
      const fieldset = this.shadowRoot?.querySelector("fieldset");
      if (!fieldset) return;
      if (name === "label") {
        const legend = this.shadowRoot?.querySelector("legend");
        if (legend) legend.textContent = value ?? "";
      }
      if (name === "disabled") fieldset.disabled = this.formDisabledValue || this.hasAttribute("disabled");
      if (name === "orientation" || name === "layout") fieldset.dataset.layout = this.getLayout();
      if (name === "aria-label" || name === "aria-labelledby" || name === "aria-description" || name === "aria-describedby" || name === "aria-invalid") {
        const value = this.getAttribute(name);
        if (value === null) fieldset.removeAttribute(name);
        else fieldset.setAttribute(name, value);
        syncHostAccessibleName(this, fieldset);
      }
      if (name === "value") this.currentValue = value ?? "";
      for (const radio of fieldset.querySelectorAll<HTMLInputElement>('input[type="radio"]')) {
        if (name === "name") radio.name = value ?? (this.id || "spui-radio-group");
        if (name === "required") radio.required = this.hasAttribute("required");
        if (name === "value") radio.checked = radio.value === (this.currentValue ?? "");
        if (name === "disabled") radio.disabled = this.hasAttribute("disabled") || radio.dataset.optionDisabled === "true";
      }
      this.syncFormValue();
    }

    get value(): string { return this.currentValue ?? this.getAttribute("value") ?? this.shadowRoot?.querySelector<HTMLInputElement>('input[type="radio"]:checked')?.value ?? ""; }
    set value(value: string) {
      this.currentValue = value;
      const fieldset = this.shadowRoot?.querySelector("fieldset");
      if (fieldset) {
        for (const radio of fieldset.querySelectorAll<HTMLInputElement>('input[type="radio"]')) radio.checked = radio.value === value;
        this.syncFormValue();
      }
    }

    get defaultValue(): string { return this.getAttribute("default-value") ?? this.querySelector(':scope > spui-radio-option[checked]')?.getAttribute("value") ?? ""; }
    set defaultValue(value: string) { this.setAttribute("default-value", value); }

    formDisabledCallback(disabled: boolean): void {
      this.formDisabledValue = disabled;
      for (const radio of this.shadowRoot?.querySelectorAll<HTMLInputElement>('input[type="radio"]') ?? []) radio.disabled = disabled || this.hasAttribute("disabled") || radio.dataset.optionDisabled === "true";
      this.syncFormValue();
    }

    formResetCallback(): void {
      const options = [...this.querySelectorAll(":scope > spui-radio-option")];
      const initial = options.find(option => option.hasAttribute("checked"))?.getAttribute("value") ?? "";
      this.value = this.getAttribute("value") ?? this.getAttribute("default-value") ?? initial;
    }

    formStateRestoreCallback(state: string | File | FormData | null): void { if (typeof state === "string") this.value = state; }

    private syncFormValue(): void {
      const checked = this.shadowRoot?.querySelector<HTMLInputElement>('input[type="radio"]:checked');
      const disabled = this.formDisabledValue || this.hasAttribute("disabled");
      const value = checked?.value ?? "";
      for (const label of this.shadowRoot?.querySelectorAll<HTMLLabelElement>("fieldset > label") ?? []) label.dataset.checked = String(Boolean(label.querySelector<HTMLInputElement>("input")?.checked));
      this.internals?.setFormValue(checked && !disabled ? value : null);
      try {
        const anchor = checked ?? this.shadowRoot?.querySelector<HTMLInputElement>('input[type="radio"]');
        const missing = !disabled && this.hasAttribute("required") && !checked;
        this.internals?.setValidity(missing ? { valueMissing: true } : {}, missing ? anchor?.validationMessage ?? "" : "", missing ? anchor ?? undefined : undefined);
      } catch { /* Some engines do not accept shadow descendants as validity anchors. */ }
    }

    private syncOptionLabel(option: Element): void {
      const index = [...this.querySelectorAll(":scope > spui-radio-option")].indexOf(option);
      const label = this.shadowRoot?.querySelectorAll<HTMLLabelElement>("fieldset > label")[index];
      const input = label?.querySelector<HTMLInputElement>("input");
      const text = label?.querySelector<HTMLSpanElement>(":scope > [data-radio-label]");
      if (input) {
        syncRadioRootProps(option, input, label!);
        syncRadioInputSlot(option.querySelector(":scope > input[slot=input]"), input);
        const sourceIndicator = option.querySelector(":scope > [slot=indicator]");
        const currentIndicator = label?.querySelector<HTMLElement>(".radio-indicator");
        if (currentIndicator && sourceIndicator) currentIndicator.replaceWith(createRadioIndicator(sourceIndicator));
        else if (currentIndicator && !sourceIndicator) currentIndicator.remove();
        else if (label && sourceIndicator) label.insertBefore(createRadioIndicator(sourceIndicator), text ?? null);
        label?.toggleAttribute("data-custom-indicator", Boolean(sourceIndicator));
        input.dataset.customIndicator = String(Boolean(sourceIndicator));
        if (label) label.dataset.labelPosition = option.getAttribute("label-position") ?? (this.getLayout() === "horizontal-stacked" ? "below" : "after");
      }
      if (label && input) {
        const nextText = createRadioLabel(option.querySelector(":scope > [slot=label]"), radioOptionLabel(option, input.value));
        if (text) text.replaceWith(nextText); else label.append(nextText);
      }
    }

    private syncOptions(): void {
      const fieldset = this.shadowRoot?.querySelector("fieldset");
      if (!fieldset) return;
      const current = this.currentValue ?? this.getAttribute("value") ?? this.getAttribute("default-value") ?? fieldset.querySelector<HTMLInputElement>('input[type="radio"]:checked')?.value ?? "";
      const options = [...this.querySelectorAll(":scope > spui-radio-option")];
      const radios = options.map((option, index) => this.createRadio(option, index));
      fieldset.replaceChildren(fieldset.querySelector("legend")!, ...radios);
      const checked = fieldset.querySelector<HTMLInputElement>(`input[type="radio"][value="${CSS.escape(current)}"]`);
      if (checked) checked.checked = true;
      this.syncFormValue();
    }

    private createRadio(option: Element, index: number): HTMLLabelElement {
      const label = document.createElement("label");
      label.part.add("option");
      label.dataset.labelPosition = option.getAttribute("label-position") ?? (this.getLayout() === "horizontal-stacked" ? "below" : "after");
      const inputSource = option.querySelector(":scope > input[slot=input]");
      const input = (inputSource?.cloneNode(false) ?? document.createElement("input")) as HTMLInputElement;
      input.removeAttribute("slot"); input.removeAttribute("hidden");
      input.type = "radio";
      input.name = this.getAttribute("name") ?? (this.id || "spui-radio-group");
      input.value = option.getAttribute("value") ?? String(index);
      input.disabled = this.formDisabledValue || this.hasAttribute("disabled") || option.hasAttribute("disabled");
      input.required = this.hasAttribute("required");
      input.dataset.optionDisabled = String(option.hasAttribute("disabled"));
      input.part.add("control");
      syncRadioRootProps(option, input, label);
      syncRadioInputSlot(inputSource as HTMLInputElement | null, input);
      const text = createRadioLabel(option.querySelector(":scope > [slot=label]"), radioOptionLabel(option, input.value));
      const indicatorSource = option.querySelector(":scope > [slot=indicator]");
      label.toggleAttribute("data-custom-indicator", Boolean(indicatorSource));
      input.dataset.customIndicator = String(Boolean(indicatorSource));
      label.append(input);
      if (indicatorSource) label.append(createRadioIndicator(indicatorSource));
      label.append(text);
      input.addEventListener("change", event => {
        if (!input.checked) return;
        this.currentValue = input.value;
        this.syncFormValue();
        option.dispatchEvent(new CustomEvent("spui-radio-change", { detail: { value: input.value, sourceEvent: event }, bubbles: true, composed: true }));
        this.dispatchEvent(new CustomEvent("spui-change", { detail: { value: input.value, sourceEvent: event }, bubbles: true, composed: true }));
      });
      return label;
    }

    private render(): void {
      const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open" });
      const fieldset = document.createElement("fieldset");
      fieldset.disabled = this.formDisabledValue || this.hasAttribute("disabled");
      fieldset.dataset.layout = this.getLayout();
      for (const name of ["aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid"]) {
        const value = this.getAttribute(name);
        if (value !== null) fieldset.setAttribute(name, value);
      }
      const legend = document.createElement("legend");
      legend.textContent = this.getAttribute("label") ?? "";
      legend.part.add("label");
      const options = [...this.querySelectorAll(":scope > spui-radio-option")];
      const radios = options.map((option, index) => this.createRadio(option, index));
      const initial = this.currentValue ?? this.getAttribute("value") ?? this.getAttribute("default-value") ?? options.find(option => option.hasAttribute("checked"))?.getAttribute("value") ?? "";
      const selected = radios.find(label => label.querySelector("input")?.value === initial)?.querySelector("input");
      if (selected) selected.checked = true;
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:block}fieldset{display:flex;flex-direction:column;gap:var(--spui-control-gap,8px);min-width:0;margin:0;padding:0;border:0}fieldset[data-layout="horizontal"],fieldset[data-layout="horizontal-stacked"]{flex-direction:row;flex-wrap:wrap;column-gap:var(--spui-control-gap,16px)}label[data-label-position="below"]{flex-direction:column;align-items:flex-start;justify-content:center}legend{margin-bottom:var(--spui-control-gap,8px);padding:0;color:var(--spui-ui-muted,var(--spui-semantic-body-text,inherit));font-size:14px;font-weight:600}label{display:inline-flex;align-items:center;gap:8px;min-height:var(--spui-control-height,32px);color:var(--spui-ui-text,var(--spui-semantic-body-text,inherit));cursor:pointer}input{width:18px;height:18px;margin:0;accent-color:var(--spui-ui-accent,var(--spui-semantic-input-background-checked,var(--colorBrandBackground,#0f6cbd)));cursor:pointer}input:focus-visible{outline:2px solid var(--spui-focus-ring,#005a9e);outline-offset:2px}input:disabled{cursor:not-allowed}label:has(input:disabled){opacity:.55;cursor:not-allowed}@media(forced-colors:active){input{accent-color:Highlight}input:focus-visible{outline-color:Highlight}}`;
      style.textContent += `.radio-indicator[hidden]{display:none!important}.radio-indicator{box-sizing:border-box;display:inline-grid;place-items:center;flex:none;width:18px;height:18px;border:1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#8a8886));border-radius:50%;color:var(--spui-ui-accent,var(--spui-semantic-accent,#0f6cbd));background:var(--spui-ui-surface,var(--spui-semantic-body-background,#fff))}.radio-indicator::after{content:"";width:10px;height:10px;border-radius:50%;background:currentColor;transform:scale(0);transition:transform var(--spui-motion-duration-fast,120ms) var(--spui-motion-easing-standard,ease)}label[data-checked=true] .radio-indicator{border-color:currentColor}label[data-checked=true] .radio-indicator::after{transform:scale(1)}input[data-custom-indicator=true]{position:absolute;inset-inline-start:0;inset-block-start:calc(50% - 9px);z-index:1;opacity:0}input[data-custom-indicator=true]:focus-visible{outline:0}input[data-custom-indicator=true]:focus-visible+.radio-indicator{outline:2px solid var(--spui-focus-ring,#005a9e);outline-offset:2px}@media(prefers-reduced-motion:reduce){.radio-indicator::after{transition:none}}@media(forced-colors:active){.radio-indicator{border-color:ButtonText;background:Canvas;color:Highlight}.radio-indicator::after{background:Highlight}}`;
      fieldset.append(legend, ...radios);
      fieldset.addEventListener("change", () => this.syncFormValue());
      shadow.replaceChildren(style, fieldset);
      syncHostAccessibleName(this, fieldset);
      this.syncFormValue();
    }

    private getLayout(): string { return this.getAttribute("layout") ?? this.getAttribute("orientation") ?? "vertical"; }
  }
  customElements.define("spui-radio-group", SpuiRadioGroup);
}
