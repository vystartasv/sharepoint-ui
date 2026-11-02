import { base } from "./shared.js";

export type ColorPickerSize = "small" | "medium" | "large";
export type ColorPickerShape = "rounded" | "square";
export type ColorPickerFormat = "hex" | "rgb";
export type ColorPickerHsvColor = { h: number; s: number; v: number; a?: number };
export type ColorSliderChannel = "hue" | "saturation" | "value";
export type ColorPickerState = { value: string; alpha: number; hue: number; saturation: number; brightness: number; color: ColorPickerHsvColor; disabled: boolean; readOnly: boolean };

type ColorPickerController = HTMLElement & {
  getColorState(): ColorPickerState;
  setHsvFromControl(hue: number, saturation: number, brightness: number, source?: HTMLElement, sourceEvent?: Event): void;
  setAlphaFromControl(alpha: number, source?: HTMLElement, sourceEvent?: Event): void;
  getControlLabel(name: "area-label" | "hue-label" | "alpha-label" | "saturation-label" | "value-label"): string;
};

function pickerFor(control: HTMLElement): ColorPickerController | null { return control.closest("spui-color-picker") as ColorPickerController | null; }

const standaloneControls = new WeakMap<HTMLElement, { color: ColorPickerHsvColor; dirty: boolean }>();
function parseControlColor(raw: string | null): ColorPickerHsvColor | undefined {
  if (!raw) return undefined;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return undefined;
    const { h, s, v, a } = value as Partial<ColorPickerHsvColor>;
    if (![h, s, v].every(channel => typeof channel === "number" && Number.isFinite(channel))) return undefined;
    return { h: ((h! % 360) + 360) % 360, s: Math.max(0, Math.min(1, s!)), v: Math.max(0, Math.min(1, v!)), a: typeof a === "number" && Number.isFinite(a) ? Math.max(0, Math.min(1, a)) : 1 };
  } catch { return undefined; }
}

function standaloneController(control: HTMLElement): ColorPickerController {
  const state = standaloneControls.get(control) ?? { color: { h: 0, s: 0, v: 0, a: 1 }, dirty: false };
  standaloneControls.set(control, state);
  const read = parseControlColor;
  const apply = (color: ColorPickerHsvColor, emit: boolean, sourceEvent?: Event): void => {
    const normalized = read(JSON.stringify(color)); if (!normalized) return;
    state.color = normalized; state.dirty = state.dirty || emit;
    (control as HTMLElement & { syncFromPicker?: () => void }).syncFromPicker?.();
    if (emit) control.dispatchEvent(new CustomEvent("spui-color-change", { detail: { color: { ...normalized }, event: sourceEvent, type: "change" }, bubbles: true, composed: true }));
  };
  const initial = read(control.getAttribute("color")) ?? read(control.getAttribute("default-color"));
  if (initial && !state.dirty) state.color = initial;
  return Object.assign(control, {
    getColorState: () => {
      const hex = hsvToHex(state.color.h, state.color.s, state.color.v);
      return { value: hex, alpha: state.color.a ?? 1, hue: state.color.h, saturation: state.color.s, brightness: state.color.v, color: { ...state.color }, disabled: control.hasAttribute("disabled"), readOnly: control.hasAttribute("read-only") };
    },
    setHsvFromControl: (h: number, s: number, v: number, _source?: HTMLElement, sourceEvent?: Event) => apply({ ...state.color, h, s, v }, true, sourceEvent),
    setAlphaFromControl: (a: number, _source?: HTMLElement, sourceEvent?: Event) => apply({ ...state.color, a }, true, sourceEvent),
    setControlColor: (color: ColorPickerHsvColor) => apply(color, false),
    getControlLabel: (name: string) => control.getAttribute(name) ?? "",
  }) as ColorPickerController;
}

function controlController(control: HTMLElement): ColorPickerController { return pickerFor(control) ?? standaloneController(control); }

export function defineColorArea(): void {
  if (customElements.get("spui-color-area")) return;
  class SpuiColorArea extends HTMLElement {
    static observedAttributes = ["aria-label", "shape", "disabled", "color", "default-color"];
    private picker: ColorPickerController | null = null;
    private area!: HTMLDivElement;
    private inputX!: HTMLInputElement;
    private inputY!: HTMLInputElement;
    private boundInputX?: HTMLInputElement;
    private boundInputY?: HTMLInputElement;
    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      this.picker = controlController(this);
      this.syncFromPicker();
    }
    get color(): ColorPickerHsvColor { return this.picker?.getColorState().color ?? { h: 0, s: 0, v: 0, a: 1 }; }
    set color(value: ColorPickerHsvColor) { const controller = (this.picker ?? controlController(this)) as ColorPickerController & { setControlColor?: (color: ColorPickerHsvColor) => void }; controller.setControlColor?.(value); }
    get defaultColor(): ColorPickerHsvColor { return parseControlColor(this.getAttribute("default-color") || this.getAttribute("color")) ?? this.color; }
    set defaultColor(value: ColorPickerHsvColor) { this.setAttribute("default-color", JSON.stringify(value)); }
    focus(options?: FocusOptions): void { this.inputX?.focus(options); }
    syncFromPicker(): void {
      const state = this.picker?.getColorState(); if (!state || !this.area) return;
      this.inputX = this.axisInput("x"); this.inputY = this.axisInput("y");
      this.area.style.setProperty("--picker-hue", `${state.hue}deg`);
      this.area.style.setProperty("--picker-saturation", `${state.saturation * 100}%`);
      this.area.style.setProperty("--picker-brightness", `${(1 - state.brightness) * 100}%`);
      const shape = this.getAttribute("shape") || this.picker?.getAttribute("shape");
      this.style.setProperty("--picker-radius", shape === "square" ? "var(--spui-control-radius,4px)" : "10px");
      this.area.removeAttribute("aria-valuenow");
      this.area.removeAttribute("aria-valuetext");
      this.area.setAttribute("aria-label", this.getAttribute("aria-label") || this.picker?.getControlLabel("area-label") || "Saturation and brightness");
      this.area.setAttribute("aria-disabled", String(state.disabled || state.readOnly || this.hasAttribute("disabled")));
      this.area.removeAttribute("aria-readonly");
      this.inputX.value = String(Math.round(state.saturation * 100));
      this.inputY.value = String(Math.round(state.brightness * 100));
      this.inputX.disabled = this.inputY.disabled = state.disabled || state.readOnly || this.hasAttribute("disabled");
      this.inputX.setAttribute("aria-valuetext", String(Math.round(state.saturation * 100)) + "% saturation");
      this.inputY.setAttribute("aria-valuetext", String(Math.round(state.brightness * 100)) + "% brightness");
      this.inputX.setAttribute("aria-valuenow", String(Math.round(state.saturation * 100)));
      this.inputY.setAttribute("aria-valuenow", String(Math.round(state.brightness * 100)));
      this.inputX.setAttribute("aria-readonly", String(state.readOnly));
      this.inputY.setAttribute("aria-readonly", String(state.readOnly));
      const thumb = this.shadowRoot?.querySelector<HTMLElement>(".thumb") ?? this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="thumb"]')?.assignedElements()[0] as HTMLElement | undefined;
      if (thumb) { thumb.style.insetInlineStart = String(state.saturation * 100) + "%"; thumb.style.insetBlockStart = String((1 - state.brightness) * 100) + "%"; }
    }
    private axisInput(axis: "x" | "y"): HTMLInputElement {
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>(`slot[name="input${axis.toUpperCase()}"]`);
      const fallback = this.shadowRoot?.querySelector<HTMLInputElement>(`.input-${axis}`) as HTMLInputElement;
      const assigned = slot?.assignedElements().find((element): element is HTMLInputElement => element instanceof HTMLInputElement);
      const input = assigned ?? fallback;
      if (input) {
        input.type = "range"; input.min = "0"; input.max = "100"; input.step = "1";
        if (!input.hasAttribute("aria-label") && !input.hasAttribute("aria-labelledby")) input.setAttribute("aria-label", this.picker?.getControlLabel(axis === "x" ? "saturation-label" : "value-label") || (axis === "x" ? "Saturation" : "Brightness"));
        fallback.hidden = Boolean(assigned); fallback.setAttribute("aria-hidden", String(Boolean(assigned)));
        const bound = axis === "x" ? this.boundInputX : this.boundInputY;
        if (bound !== input) { bound?.removeEventListener("input", axis === "x" ? this.handleAxisX : this.handleAxisY); input.addEventListener("input", axis === "x" ? this.handleAxisX : this.handleAxisY); if (axis === "x") this.boundInputX = input; else this.boundInputY = input; }
      }
      return input;
    }
    private handleAxisX = (event: Event): void => { if (this.blocked()) return; const state = this.picker?.getColorState(); if (state) this.picker?.setHsvFromControl(state.hue, Number((event.currentTarget as HTMLInputElement).value) / 100, state.brightness, this, event); };
    private handleAxisY = (event: Event): void => { if (this.blocked()) return; const state = this.picker?.getColorState(); if (state) this.picker?.setHsvFromControl(state.hue, state.saturation, Number((event.currentTarget as HTMLInputElement).value) / 100, this, event); };
    attributeChangedCallback(name: string): void { if (name === "color" || name === "default-color") this.color = this.defaultColor; this.syncFromPicker(); }
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:block;min-width:0}.area{position:relative;width:min(260px,100%);height:160px;border:1px solid var(--spui-ui-stroke,var(--colorNeutralStroke1,#8a8886));border-radius:var(--picker-radius,var(--spui-control-radius,8px));background-image:linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,hsl(var(--picker-hue,0deg) 100% 50%));touch-action:none;cursor:crosshair}.thumb{position:absolute;inset-inline-start:var(--picker-saturation,0%);top:var(--picker-brightness,100%);width:14px;height:14px;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 1px #000;transform:translate(-50%,-50%);pointer-events:none}.area:focus-within{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:3px}.inputs{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}.inputs slot{display:contents}.inputs input{position:absolute;width:1px;height:1px}@media(forced-colors:active){.area{border-color:FieldText}.area:focus-within{outline-color:Highlight}.thumb{border-color:Canvas;box-shadow:0 0 0 1px CanvasText}}`;
      this.area = document.createElement("div"); this.area.className = "area"; this.area.setAttribute("role", "group"); this.area.setAttribute("aria-label", this.getAttribute("aria-label") || "Saturation and brightness"); this.area.part.add("control");
      this.area.addEventListener("pointerdown", event => { if (this.blocked()) return; this.area.setPointerCapture(event.pointerId); this.updateFromPointer(event); });
      this.area.addEventListener("pointermove", event => { if (this.area.hasPointerCapture(event.pointerId)) this.updateFromPointer(event); });
      const thumb = document.createElement("span"); thumb.className = "thumb"; thumb.setAttribute("aria-hidden", "true");
      const thumbSlot = document.createElement("slot"); thumbSlot.name = "thumb"; thumbSlot.append(thumb); thumbSlot.addEventListener("slotchange", () => this.syncFromPicker());
      this.area.append(thumbSlot);
      const inputs = document.createElement("div"); inputs.className = "inputs";
      const makeInput = (axis: "x" | "y"): HTMLInputElement => { const input = document.createElement("input"); input.type = "range"; input.min = "0"; input.max = "100"; input.step = "1"; input.className = `input-${axis}`; return input; };
      this.inputX = makeInput("x"); this.inputY = makeInput("y");
      const inputXSlot = document.createElement("slot"); inputXSlot.name = "inputX"; inputXSlot.append(this.inputX); inputXSlot.addEventListener("slotchange", () => this.syncFromPicker());
      const inputYSlot = document.createElement("slot"); inputYSlot.name = "inputY"; inputYSlot.append(this.inputY); inputYSlot.addEventListener("slotchange", () => this.syncFromPicker());
      inputs.append(inputXSlot, inputYSlot);
      shadow.append(style, this.area, inputs);
    }
    private blocked(): boolean { const state = this.picker?.getColorState(); return !state || state.disabled || state.readOnly || this.hasAttribute("disabled"); }
    private updateFromPointer(event: PointerEvent): void {
      const state = this.picker?.getColorState(), bounds = this.area.getBoundingClientRect();
      if (!state || !bounds.width || !bounds.height) return;
      const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
      this.picker?.setHsvFromControl(state.hue, x, 1 - Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)), this, event);
    }
  }
  customElements.define("spui-color-area", SpuiColorArea);
}

function defineRangeControl(tag: "spui-color-slider" | "spui-alpha-slider", alpha: boolean): void {
  if (customElements.get(tag)) return;
  class SpuiColorRangeControl extends HTMLElement {
    static observedAttributes = ["channel", "vertical", "transparency", "aria-label", "disabled", "shape", "color", "default-color"];
    private picker: ColorPickerController | null = null;
    private input!: HTMLInputElement;
    private boundInput?: HTMLInputElement;
    private track!: HTMLDivElement;
    connectedCallback(): void { if (!this.shadowRoot) this.render(); this.picker = controlController(this); this.syncFromPicker(); }
    get color(): ColorPickerHsvColor { return this.picker?.getColorState().color ?? { h: 0, s: 0, v: 0, a: 1 }; }
    set color(value: ColorPickerHsvColor) { const controller = (this.picker ?? controlController(this)) as ColorPickerController & { setControlColor?: (color: ColorPickerHsvColor) => void }; controller.setControlColor?.(value); }
    get defaultColor(): ColorPickerHsvColor { return parseControlColor(this.getAttribute("default-color") || this.getAttribute("color")) ?? this.color; }
    set defaultColor(value: ColorPickerHsvColor) { this.setAttribute("default-color", JSON.stringify(value)); }
    focus(options?: FocusOptions): void { this.input?.focus(options); }
    syncFromPicker(): void {
      const state = this.picker?.getColorState(); if (!state || !this.input) return;
      this.input = this.getInput();
      const channel = this.getAttribute("channel") === "saturation" || this.getAttribute("channel") === "value" ? this.getAttribute("channel") as "saturation" | "value" : "hue";
      this.input.max = alpha ? "100" : channel === "hue" ? "360" : "100";
      this.input.classList.remove("hue", "saturation", "value", "alpha"); this.input.classList.add(alpha ? "alpha" : channel);
      const transparency = alpha && this.hasAttribute("transparency");
      const value = alpha ? (transparency ? 1 - state.alpha : state.alpha) * 100 : channel === "hue" ? state.hue : (channel === "saturation" ? state.saturation : state.brightness) * 100;
      this.input.value = String(Math.round(value));
      this.input.setAttribute("aria-valuenow", this.input.value);
      this.input.setAttribute("aria-valuetext", `${this.input.value}${alpha ? "%" : channel === "hue" ? "°" : "%"}`);
      this.input.setAttribute("aria-label", this.input.getAttribute("aria-label") || this.getAttribute("aria-label") || (alpha ? this.picker?.getControlLabel("alpha-label") : channel === "hue" ? this.picker?.getControlLabel("hue-label") : this.picker?.getControlLabel(channel === "saturation" ? "saturation-label" : "value-label")) || (alpha ? "Opacity" : "Hue"));
      this.input.setAttribute("aria-orientation", this.hasAttribute("vertical") ? "vertical" : "horizontal");
      this.input.disabled = state.disabled || state.readOnly || this.hasAttribute("disabled");
      this.input.style.writingMode = this.hasAttribute("vertical") ? "vertical-lr" : "horizontal-tb";
      this.input.style.direction = this.hasAttribute("vertical") ? "rtl" : getComputedStyle(this).direction;
      this.track.classList.toggle("vertical", this.hasAttribute("vertical"));
      this.track.classList.toggle("horizontal", !this.hasAttribute("vertical"));
      const progress = Math.max(0, Math.min(1, Number(this.input.value) / Number(this.input.max || 100)));
      this.track.style.setProperty("--color-range-progress", String(progress * 100) + "%");
      const railSlot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="rail"]');
      const rail = railSlot?.assignedElements()[0] as HTMLElement | undefined ?? this.shadowRoot?.querySelector<HTMLElement>(".rail");
      if (rail && rail === this.shadowRoot?.querySelector(".rail")) rail.style.backgroundImage = getComputedStyle(this.input).backgroundImage;
      const thumbSlot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="thumb"]');
      const thumb = thumbSlot?.assignedElements()[0] as HTMLElement | undefined ?? this.shadowRoot?.querySelector<HTMLElement>(".thumb");
      if (thumb) { thumb.style.insetInlineStart = String(progress * 100) + "%"; thumb.style.insetBlockStart = this.hasAttribute("vertical") ? String((1 - progress) * 100) + "%" : "50%"; }
      const hex = state.value;
      this.style.setProperty("--picker-current-color", `#${hex.slice(1)}`);
      this.style.setProperty("--picker-hue", `${state.hue}deg`);
      const shape = this.getAttribute("shape") || this.picker?.getAttribute("shape");
      this.style.setProperty("--picker-radius", shape === "square" ? "var(--spui-control-radius,4px)" : "10px");
    }
    attributeChangedCallback(name: string): void { if (name === "color" || name === "default-color") this.color = this.defaultColor; this.syncFromPicker(); }
    private getInput(): HTMLInputElement {
      const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="input"]');
      const fallback = this.shadowRoot?.querySelector<HTMLInputElement>(".input-fallback") as HTMLInputElement;
      const assigned = slot?.assignedElements().find((element): element is HTMLInputElement => element instanceof HTMLInputElement);
      const input = assigned ?? fallback;
      if (input) {
        input.type = "range"; input.min = "0"; input.step = "1";
        fallback.hidden = Boolean(assigned); fallback.setAttribute("aria-hidden", String(Boolean(assigned)));
        if (this.boundInput !== input) { this.boundInput?.removeEventListener("input", this.handleInput); input.addEventListener("input", this.handleInput); this.boundInput = input; }
      }
      return input;
    }
    private handleInput = (event: Event): void => {
      const state = this.picker?.getColorState(); if (!state || state.disabled || state.readOnly) return;
      const value = Number((event.currentTarget as HTMLInputElement).value);
      if (alpha) this.picker?.setAlphaFromControl((this.hasAttribute("transparency") ? 100 - value : value) / 100, this, event);
      else { const channel = this.getAttribute("channel"); this.picker?.setHsvFromControl(channel === "hue" || !channel ? value : state.hue, channel === "saturation" ? value / 100 : state.saturation, channel === "value" ? value / 100 : state.brightness, this, event); }
    };
    private render(): void {
      const shadow = this.attachShadow({ mode: "open" }); const style = document.createElement("style");
      style.textContent = `${base}:host{display:block;width:min(260px,100%);min-width:80px}.track{position:relative;width:100%;height:32px;touch-action:none}.track.vertical{width:32px;height:160px}.rail{position:absolute;inset:8px 0;border:1px solid var(--spui-ui-stroke,#8a8886);border-radius:var(--picker-radius,999px);background-color:var(--spui-ui-canvas,#fff);background-size:100% 100%}.track.vertical .rail{inset:0 8px}.thumb{position:absolute;inset-inline-start:var(--color-range-progress,0%);top:50%;width:14px;height:14px;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 1px #000;background:var(--picker-current-color,#fff);transform:translate(-50%,-50%);pointer-events:none}.track.vertical .thumb{inset-inline-start:50%;top:calc(100% - var(--color-range-progress,0%))}slot[name=thumb]::slotted(*){position:absolute;inset-inline-start:var(--color-range-progress,0%);top:50%;transform:translate(-50%,-50%)}.track.vertical slot[name=thumb]::slotted(*){inset-inline-start:50%;top:calc(100% - var(--color-range-progress,0%))}input{box-sizing:border-box;position:absolute;z-index:1;inset:0;width:100%;height:100%;min-height:0;margin:0;opacity:.001;cursor:pointer;accent-color:var(--spui-ui-accent,#78716c);direction:ltr}input:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:2px}.track.vertical input{writing-mode:vertical-lr;direction:rtl}input.hue{background-image:linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)}input.saturation{background-image:linear-gradient(to right,#888,hsl(var(--picker-hue,0deg) 100% 50%))}input.value{background-image:linear-gradient(to right,#000,var(--picker-current-color,#fff))}input.alpha{background-image:linear-gradient(to right,transparent,var(--picker-current-color,#000))}@media(forced-colors:active){.rail{border-color:CanvasText;background:Canvas}.thumb{border-color:Canvas;box-shadow:0 0 0 1px CanvasText}.track:focus-within{outline:2px solid Highlight}}`;
      style.textContent += `slot[name=rail]::slotted(*){position:absolute;inset:8px 0;border:1px solid var(--spui-ui-stroke,#8a8886);border-radius:var(--picker-radius,999px)}.track.vertical slot[name=rail]::slotted(*){inset:0 8px}`;
      this.track = document.createElement("div"); this.track.className = "track";
      const railFallback = document.createElement("span"); railFallback.className = "rail";
      const rail = document.createElement("slot"); rail.name = "rail"; rail.append(railFallback); rail.addEventListener("slotchange", () => this.syncFromPicker());
      const thumbFallback = document.createElement("span"); thumbFallback.className = "thumb"; thumbFallback.setAttribute("aria-hidden", "true");
      const thumb = document.createElement("slot"); thumb.name = "thumb"; thumb.append(thumbFallback); thumb.addEventListener("slotchange", () => this.syncFromPicker());
      this.input = document.createElement("input"); this.input.className = "input-fallback"; this.input.type = "range"; this.input.min = "0"; this.input.step = "1"; this.input.part.add("input");
      const input = document.createElement("slot"); input.name = "input"; input.append(this.input); input.addEventListener("slotchange", () => this.syncFromPicker());
      this.track.append(rail, thumb, input); shadow.append(style, this.track);
    }
  }
  customElements.define(tag, SpuiColorRangeControl);
}

export function defineColorSlider(): void { defineRangeControl("spui-color-slider", false); }
export function defineAlphaSlider(): void { defineRangeControl("spui-alpha-slider", true); }

function normalizeHex(value: string): string | undefined {
  const hex = value.trim().replace(/^#/, "");
  if (/^[\da-f]{3}$/i.test(hex)) return `#${[...hex].map(character => character + character).join("").toUpperCase()}`;
  return /^[\da-f]{6}$/i.test(hex) ? `#${hex.toUpperCase()}` : undefined;
}

function colorToHex(color: string): string | undefined {
  const channels = color.match(/[\d.]+/g)?.map(Number);
  if (!channels || channels.length < 3 || channels.slice(0, 3).some(channel => !Number.isFinite(channel))) return undefined;
  return `#${channels.slice(0, 3).map(channel => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function hexToHsv(hex: string): [number, number, number] {
  const channels = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
  const [r, g, b] = channels;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  let hue = 0;
  if (delta) hue = max === r ? 60 * (((g - b) / delta) % 6) : max === g ? 60 * ((b - r) / delta + 2) : 60 * ((r - g) / delta + 4);
  return [(hue + 360) % 360, max ? delta / max : 0, max];
}

function hsvToHex(hue: number, saturation: number, brightness: number): string {
  const chroma = brightness * saturation;
  const x = chroma * (1 - Math.abs((hue / 60) % 2 - 1));
  const offset = brightness - chroma;
  const [r, g, b] = hue < 60 ? [chroma, x, 0] : hue < 120 ? [x, chroma, 0] : hue < 180 ? [0, chroma, x] : hue < 240 ? [0, x, chroma] : hue < 300 ? [x, 0, chroma] : [chroma, 0, x];
  return `#${[r, g, b].map(channel => Math.round((channel + offset) * 255).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function rgbToHex(red: number, green: number, blue: number): string {
  return `#${[red, green, blue].map(channel => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

export function defineColorPicker(): void {
  defineColorArea(); defineColorSlider(); defineAlphaSlider();
  if (customElements.get("spui-color-picker")) return;
  class SpuiColorPicker extends HTMLElement {
    static formAssociated = true;
    static observedAttributes = ["label", "value", "default-value", "default-color", "alpha", "default-alpha", "disabled", "required", "read-only", "name", "size", "shape", "colors", "color-format", "aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid", "color-input-label", "hex-input-label", "hue-label", "area-label", "area-value-text", "format-label", "rgb-label", "red-label", "green-label", "blue-label", "alpha-label", "saturation-label", "value-label", "swatches-label", "swatch-label", "invalid-message"];
    private internals?: ElementInternals;
    private currentValue = "#000000";
    private currentAlpha = 1;
    private hue = 0;
    private saturation = 0;
    private brightness = 0;
    private dirty = false;
    private formDisabled = false;
    private customError = "";
    private colorOptions?: string[];
    private themeObserver?: MutationObserver;

    get form(): HTMLFormElement | null { return this.internals?.form ?? null; }

    constructor() {
      super();
      try { this.internals = this.attachInternals(); } catch { /* Native color selection still works without form association. */ }
    }

    get value(): string { return this.currentValue; }
    set value(value: string) { this.setColor(value, this.currentAlpha, true); }
    get color(): ColorPickerHsvColor { return this.currentColor(); }
    set color(value: ColorPickerHsvColor) { this.setHsvColor(value, true); }
    getColorState(): ColorPickerState { return { value: this.currentValue, alpha: this.currentAlpha, hue: this.hue, saturation: this.saturation, brightness: this.brightness, color: this.currentColor(), disabled: this.formDisabled || this.hasAttribute("disabled"), readOnly: this.hasAttribute("read-only") }; }
    getControlLabel(name: "area-label" | "hue-label" | "alpha-label" | "saturation-label" | "value-label"): string { return this.getAttribute(name) || ({ "area-label": "Saturation and brightness", "hue-label": "Hue", "alpha-label": "Opacity", "saturation-label": "Saturation", "value-label": "Brightness" }[name]); }
    setHsvFromControl(hue: number, saturation: number, brightness: number, source?: HTMLElement, sourceEvent?: Event): void {
      const state = this.getColorState(); if (state.disabled || state.readOnly) return;
      this.hue = ((hue % 360) + 360) % 360; this.saturation = Math.max(0, Math.min(1, saturation)); this.brightness = Math.max(0, Math.min(1, brightness)); this.commitHsv(sourceEvent);
      if (source) source.dispatchEvent(new CustomEvent("spui-color-change", { detail: { color: this.currentColor(), event: sourceEvent, type: "change" } }));
    }
    setAlphaFromControl(alpha: number, source?: HTMLElement, sourceEvent?: Event): void {
      const state = this.getColorState(); if (state.disabled || state.readOnly) return;
      this.currentAlpha = Number.isFinite(alpha) ? Math.max(0, Math.min(1, alpha)) : 1; this.dirty = true;
      const input = this.shadowRoot?.querySelector<HTMLInputElement>(".alpha"); if (input) input.value = String(Math.round(this.currentAlpha * 100));
      const preview = this.shadowRoot?.querySelector<HTMLElement>(".preview"); if (preview) preview.style.backgroundColor = this.cssColor();
      this.syncComposedControls(); this.syncForm();
      this.dispatchChange(sourceEvent);
      if (source) source.dispatchEvent(new CustomEvent("spui-color-change", { detail: { color: this.currentColor(), event: sourceEvent, type: "change" } }));
    }
    get alpha(): number { return this.currentAlpha; }
    set alpha(value: number) { this.setColor(this.currentValue, value, true); }
    get format(): ColorPickerFormat { return this.getAttribute("color-format") === "rgb" ? "rgb" : "hex"; }
    set format(value: ColorPickerFormat) { this.setAttribute("color-format", value === "rgb" ? "rgb" : "hex"); }
    get name(): string { return this.getAttribute("name") ?? ""; }
    set name(value: string) { this.setAttribute("name", value); }
    get disabled(): boolean { return this.hasAttribute("disabled"); }
    set disabled(value: boolean) { this.toggleAttribute("disabled", Boolean(value)); }
    get required(): boolean { return this.hasAttribute("required"); }
    set required(value: boolean) { this.toggleAttribute("required", Boolean(value)); }
    get readOnly(): boolean { return this.hasAttribute("read-only"); }
    set readOnly(value: boolean) { this.toggleAttribute("read-only", Boolean(value)); }
    get validity(): ValidityState | undefined { return this.internals?.validity ?? this.validationInput()?.validity; }
    get validationMessage(): string { return this.internals?.validationMessage ?? this.validationInput()?.validationMessage ?? ""; }
    get willValidate(): boolean { return this.internals?.willValidate ?? Boolean(this.validationInput() && !this.disabled && !this.readOnly && !this.formDisabled); }
    get defaultAlpha(): number { return this.readAlpha(this.getAttribute("default-alpha") ?? this.getAttribute("alpha")); }
    set defaultAlpha(value: number) { this.setAttribute("default-alpha", String(value)); }
    get defaultValue(): string { return normalizeHex(this.getAttribute("default-value") ?? this.getAttribute("value") ?? "#000000") ?? "#000000"; }
    set defaultValue(value: string) { this.setAttribute("default-value", value); }
    get defaultColor(): ColorPickerHsvColor {
      const color = this.readHsv(this.getAttribute("default-color")); if (color) return { ...color, a: color.a ?? this.defaultAlpha };
      const [h, s, v] = hexToHsv(this.defaultValue); return { h, s, v, a: this.defaultAlpha };
    }
    set defaultColor(value: ColorPickerHsvColor) { this.setAttribute("default-color", JSON.stringify(value)); }
    private currentColor(): ColorPickerHsvColor { return { h: this.hue, s: this.saturation, v: this.brightness, a: this.currentAlpha }; }
    private readHsv(value: string | null): ColorPickerHsvColor | undefined {
      if (!value) return undefined;
      try {
        const color: unknown = JSON.parse(value);
        if (!color || typeof color !== "object") return undefined;
        const { h, s, v, a } = color as Partial<ColorPickerHsvColor>;
        if (![h, s, v].every(channel => typeof channel === "number" && Number.isFinite(channel))) return undefined;
        return { h: ((h! % 360) + 360) % 360, s: Math.max(0, Math.min(1, s!)), v: Math.max(0, Math.min(1, v!)), ...(typeof a === "number" && Number.isFinite(a) ? { a: Math.max(0, Math.min(1, a)) } : {}) };
      } catch { return undefined; }
    }
    private setHsvColor(color: ColorPickerHsvColor, dirty: boolean): void {
      const normalized = this.readHsv(JSON.stringify(color)); if (!normalized) return;
      this.hue = normalized.h; this.saturation = normalized.s; this.brightness = normalized.v; this.currentAlpha = normalized.a ?? (dirty ? 1 : this.defaultAlpha);
      this.currentValue = hsvToHex(this.hue, this.saturation, this.brightness); if (dirty) this.dirty = true;
      this.syncValueInputs();
      const preview = this.shadowRoot?.querySelector<HTMLElement>(".preview"); if (preview) preview.style.backgroundColor = this.cssColor();
      this.syncPickerArea(); this.syncForm(); this.syncComposedControls();
    }
    private changeDetail(): { value: string; alpha: number; color: ColorPickerHsvColor } { return { value: this.currentValue, alpha: this.currentAlpha, color: this.currentColor() }; }
    get colors(): string[] { return this.colorOptions ?? this.parseColors(this.getAttribute("colors")); }
    set colors(value: string[]) { this.colorOptions = value.map(normalizeHex).filter((color): color is string => Boolean(color)); this.renderSwatches(); }

    checkValidity(): boolean { return this.internals?.checkValidity() ?? this.validationInput()?.checkValidity() ?? true; }
    reportValidity(): boolean { return this.internals?.reportValidity() ?? this.validationInput()?.reportValidity() ?? true; }
    setCustomValidity(message: string): void { this.customError = message; this.syncForm(); }

    connectedCallback(): void {
      if (!this.shadowRoot) {
        this.currentValue = this.readInitialValue();
        this.currentAlpha = this.defaultAlpha;
        [this.hue, this.saturation, this.brightness] = hexToHsv(this.currentValue);
        const defaultColor = this.readHsv(this.getAttribute("default-color"));
        if (defaultColor) {
          this.hue = defaultColor.h; this.saturation = defaultColor.s; this.brightness = defaultColor.v;
          this.currentAlpha = defaultColor.a ?? this.defaultAlpha; this.currentValue = hsvToHex(this.hue, this.saturation, this.brightness);
        }
        this.render();
      }
      this.observeThemeColors();
    }

    disconnectedCallback(): void { this.themeObserver?.disconnect(); }

    attributeChangedCallback(name: string, _oldValue: string | null, value: string | null): void {
      if (!this.isConnected || !this.shadowRoot) return;
      if (name === "value" || name === "default-value") {
        if (!this.dirty) this.setColor(this.readInitialValue(), this.currentAlpha, false);
      } else if (name === "alpha" || name === "default-alpha") {
        const alpha = this.readAlpha(value);
        if (!this.dirty) this.setColor(this.currentValue, alpha, false);
      } else if (name === "default-color") {
        const color = this.readHsv(value); if (!this.dirty && color) this.setHsvColor(color, false);
      } else if (name === "label") {
        const label = this.shadowRoot.querySelector("label"); if (label) label.textContent = value ?? "";
        this.syncInputLabels();
      } else if (name === "disabled" || name === "read-only") this.syncDisabled();
      else if (name === "size") this.shadowRoot.querySelector<HTMLElement>(".picker")!.dataset.size = value || "medium";
      else if (name === "shape") this.shadowRoot.querySelector<HTMLElement>(".picker")!.dataset.shape = value || "rounded";
      else if (name === "colors") this.renderSwatches();
      else if (name === "color-format") { this.syncFormat(); this.syncForm(); }
      else if (["color-input-label", "hex-input-label", "hue-label", "area-label", "aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid", "rgb-label", "red-label", "green-label", "blue-label"].includes(name)) this.syncInputLabels();
      else if (name === "area-value-text") this.syncPickerArea();
      else if (name === "format-label") this.syncFormat();
      else if (["alpha-label", "swatches-label"].includes(name)) this.syncGroupLabels();
      else if (name === "swatch-label") this.renderSwatches();
      else if (name === "invalid-message") this.syncForm();
      this.syncComposedControls();
    }

    formDisabledCallback(disabled: boolean): void { this.formDisabled = disabled; this.syncDisabled(); }
    formResetCallback(): void { this.dirty = false; const color = this.readHsv(this.getAttribute("default-color")); if (color) this.setHsvColor(color, false); else this.setColor(this.defaultValue, this.defaultAlpha, false); }
    formStateRestoreCallback(state: string | File | FormData | null): void {
      if (typeof state !== "string") return;
      const [value, alpha] = state.split("|");
      this.setColor(value, alpha === undefined ? 1 : Number(alpha), false);
    }

    private readInitialValue(): string { return normalizeHex(this.getAttribute("value") ?? this.getAttribute("default-value") ?? "#000000") ?? "#000000"; }
    private readAlpha(value: string | null): number { const alpha = Number(value ?? 1); return Number.isFinite(alpha) ? Math.max(0, Math.min(1, alpha)) : 1; }
    private parseColors(value: string | null): string[] { return (value ?? "").split(/[\s,]+/).map(normalizeHex).filter((color): color is string => Boolean(color)); }

    private syncValueInputs(preserveHex = false): void {
      const color = this.shadowRoot?.querySelector<HTMLInputElement>('input[type="color"]');
      const hex = this.shadowRoot?.querySelector<HTMLInputElement>(".hex");
      const channels = this.shadowRoot?.querySelectorAll<HTMLInputElement>(".channel-value");
      if (color) color.value = this.currentValue.toLowerCase();
      if (hex && !preserveHex) { hex.value = this.currentValue; hex.setCustomValidity(""); }
      if (channels?.length === 3) {
        const values = [1, 3, 5].map(index => parseInt(this.currentValue.slice(index, index + 2), 16));
        channels.forEach((channel, index) => { channel.value = String(values[index]); });
      }
      const hue = this.shadowRoot?.querySelector<HTMLInputElement>(".hue");
      if (hue) hue.value = String(Math.round(this.hue));
    }

    private syncFormat(): void {
      const select = this.shadowRoot?.querySelector<HTMLSelectElement>(".format");
      const hex = this.shadowRoot?.querySelector<HTMLInputElement>(".hex");
      const channels = this.shadowRoot?.querySelector<HTMLElement>(".channels");
      if (select) select.value = this.format;
      if (hex) hex.hidden = this.format !== "hex";
      if (channels) channels.hidden = this.format !== "rgb";
    }

    private validationInput(): HTMLInputElement | undefined {
      if (this.format === "rgb") return [...(this.shadowRoot?.querySelectorAll<HTMLInputElement>(".channel-value") ?? [])].find(input => !input.validity.valid) ?? this.shadowRoot?.querySelector<HTMLInputElement>(".channel-value") ?? undefined;
      return this.shadowRoot?.querySelector<HTMLInputElement>(".hex") ?? undefined;
    }

    private setColor(value: string, alpha: number, dirty: boolean): void {
      const normalized = normalizeHex(value);
      if (normalized) this.currentValue = normalized;
      this.currentAlpha = Number.isFinite(alpha) ? Math.max(0, Math.min(1, alpha)) : 1;
      if (dirty) this.dirty = true;
      const range = this.shadowRoot?.querySelector<HTMLInputElement>(".alpha");
      [this.hue, this.saturation, this.brightness] = hexToHsv(this.currentValue);
      this.syncValueInputs();
      if (range) range.value = String(Math.round(this.currentAlpha * 100));
      const preview = this.shadowRoot?.querySelector<HTMLElement>(".preview");
      if (preview) preview.style.backgroundColor = this.cssColor();
      this.syncPickerArea();
      this.syncForm();
      this.syncComposedControls();
    }

    private syncPickerArea(): void {
      const area = this.shadowRoot?.querySelector<HTMLElement>(".area");
      if (!area) return;
      area.style.setProperty("--picker-hue", `${this.hue}deg`);
      area.style.setProperty("--picker-saturation", `${this.saturation * 100}%`);
      area.style.setProperty("--picker-brightness", `${(1 - this.brightness) * 100}%`);
      area.setAttribute("aria-valuenow", String(Math.round(this.saturation * 100)));
      area.setAttribute("aria-valuetext", (this.getAttribute("area-value-text") || "{saturation}% saturation, {brightness}% brightness").replaceAll("{saturation}", String(Math.round(this.saturation * 100))).replaceAll("{brightness}", String(Math.round(this.brightness * 100))));
    }

    private commitHsv(sourceEvent?: Event): void {
      this.currentValue = hsvToHex(this.hue, this.saturation, this.brightness);
      this.dirty = true;
      this.syncValueInputs();
      const preview = this.shadowRoot?.querySelector<HTMLElement>(".preview");
      if (preview) preview.style.backgroundColor = this.cssColor();
      this.syncPickerArea();
      this.syncForm();
      this.syncComposedControls();
      this.dispatchChange(sourceEvent);
    }

    private commitRgb(sourceEvent: Event): void {
      const channels = [...(this.shadowRoot?.querySelectorAll<HTMLInputElement>(".channel-value") ?? [])];
      if (channels.length !== 3 || channels.some(channel => !channel.value || !channel.validity.valid)) { this.syncForm(); return; }
      const [red, green, blue] = channels.map(channel => Number(channel.value));
      this.setColor(rgbToHex(red, green, blue), this.currentAlpha, true);
      this.dispatchChange(sourceEvent);
    }

    private updateAreaFromPointer(event: PointerEvent, area: HTMLElement): void {
      const bounds = area.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      this.saturation = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
      this.brightness = 1 - Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
      this.commitHsv(event);
    }

    private cssColor(): string {
      const alpha = Math.round(this.currentAlpha * 1000) / 1000;
      return `rgb(${parseInt(this.currentValue.slice(1, 3), 16)} ${parseInt(this.currentValue.slice(3, 5), 16)} ${parseInt(this.currentValue.slice(5, 7), 16)} / ${alpha})`;
    }

    private syncForm(): void {
      const activeInput = this.validationInput();
      const validity = activeInput?.validity;
      const valid = Boolean(validity?.valid) && !this.customError;
      const alphaHex = Math.round(this.currentAlpha * 255).toString(16).padStart(2, "0").toUpperCase();
      this.internals?.setFormValue(this.currentAlpha < 1 ? `${this.currentValue}${alphaHex}` : this.currentValue, `${this.currentValue}|${this.currentAlpha}`);
      try {
        this.internals?.setValidity(valid ? {} : { badInput: Boolean(validity?.badInput), patternMismatch: Boolean(validity?.patternMismatch), rangeOverflow: Boolean(validity?.rangeOverflow), rangeUnderflow: Boolean(validity?.rangeUnderflow), stepMismatch: Boolean(validity?.stepMismatch), valueMissing: Boolean(validity?.valueMissing), customError: Boolean(this.customError || validity?.customError) }, valid ? "" : (this.customError || activeInput?.validationMessage) ?? "", activeInput ?? undefined);
      } catch { /* Native input validity remains available if the browser rejects a shadow validity anchor. */ }
    }

    private syncDisabled(): void {
      const disabled = this.formDisabled || this.hasAttribute("disabled");
      for (const input of this.shadowRoot?.querySelectorAll<HTMLInputElement>("input") ?? []) input.disabled = disabled || this.hasAttribute("read-only");
      for (const button of this.shadowRoot?.querySelectorAll<HTMLButtonElement>("button") ?? []) button.disabled = disabled || this.hasAttribute("read-only");
      const format = this.shadowRoot?.querySelector<HTMLSelectElement>(".format");
      if (format) format.disabled = disabled || this.hasAttribute("read-only");
      const area = this.shadowRoot?.querySelector<HTMLElement>(".area");
      if (area) { area.tabIndex = disabled ? -1 : 0; area.setAttribute("aria-disabled", String(disabled || this.hasAttribute("read-only"))); area.setAttribute("aria-readonly", String(this.hasAttribute("read-only"))); }
      this.syncComposedControls();
    }

    private syncInputLabels(): void {
      const color = this.shadowRoot?.querySelector<HTMLInputElement>("input[type=color]");
      const hex = this.shadowRoot?.querySelector<HTMLInputElement>(".hex");
      const colorLabel = this.getAttribute("color-input-label") || "Choose color";
      if (color) color.setAttribute("aria-label", colorLabel);
      if (hex) hex.setAttribute("aria-label", this.getAttribute("hex-input-label") || "Hex color");
      const picker = this.shadowRoot?.querySelector(".picker");
      if (picker) picker.setAttribute("aria-label", this.getAttribute("aria-label") || this.getAttribute("label") || "Color picker");
      if (picker) for (const name of ["aria-labelledby", "aria-description", "aria-describedby", "aria-invalid"]) {
        const value = this.getAttribute(name);
        if (value === null) picker.removeAttribute(name); else picker.setAttribute(name, value);
      }
      const describedBy = this.getAttribute("aria-describedby");
      const hue = this.shadowRoot?.querySelector<HTMLInputElement>(".hue");
      const area = this.shadowRoot?.querySelector<HTMLElement>(".area");
      const alpha = this.shadowRoot?.querySelector<HTMLInputElement>(".alpha");
      const channels = this.shadowRoot?.querySelectorAll<HTMLInputElement>(".channel-value");
      const format = this.shadowRoot?.querySelector<HTMLSelectElement>(".format");
      if (hue) hue.setAttribute("aria-label", this.getAttribute("hue-label") || "Hue");
      if (area) area.setAttribute("aria-label", this.getAttribute("area-label") || "Saturation and brightness");
      if (channels?.length === 3) ["red-label", "green-label", "blue-label"].forEach((name, index) => channels[index].setAttribute("aria-label", this.getAttribute(name) || ["Red", "Green", "Blue"][index]));
      if (format) format.setAttribute("aria-label", this.getAttribute("format-label") || "Color format");
      for (const input of [color, hex, hue, alpha, area, format, ...(channels ?? [])]) {
        if (!input) continue;
        if (describedBy) input.setAttribute("aria-describedby", describedBy);
        else input.removeAttribute("aria-describedby");
        const description = this.getAttribute("aria-description");
        if (description) input.setAttribute("aria-description", description); else input.removeAttribute("aria-description");
        const invalid = this.getAttribute("aria-invalid");
        if (invalid) input.setAttribute("aria-invalid", invalid); else input.removeAttribute("aria-invalid");
      }
      if (picker) {
        if (describedBy) picker.setAttribute("aria-describedby", describedBy);
        else picker.removeAttribute("aria-describedby");
      }
    }

    private syncGroupLabels(): void {
      const alpha = this.shadowRoot?.querySelector(".alpha");
      const swatches = this.shadowRoot?.querySelector(".swatches");
      const channels = this.shadowRoot?.querySelector(".channels");
      alpha?.setAttribute("aria-label", this.getAttribute("alpha-label") || "Opacity");
      swatches?.setAttribute("aria-label", this.getAttribute("swatches-label") || "Color swatches");
      channels?.setAttribute("aria-label", this.getAttribute("rgb-label") || "RGB color values");
    }

    private renderSwatches(): void {
      const root = this.shadowRoot?.querySelector<HTMLElement>(".swatches");
      if (!root) return;
      const labelTemplate = this.getAttribute("swatch-label") || "Select {color}";
      const theme = [
        ["--spui-ui-accent", "#78716C"], ["--spui-ui-success", "#107C10"],
        ["--spui-ui-warning", "#835B00"], ["--spui-ui-danger", "#B10E1C"]
      ] as const;
      const buttons = theme.map(([token, fallback]) => {
        const button = document.createElement("button"); button.type = "button"; button.dataset.token = token; button.style.backgroundColor = `var(${token},${fallback})`;
        button.setAttribute("aria-label", labelTemplate.replaceAll("{color}", fallback));
        button.addEventListener("click", event => this.commitSwatch(colorToHex(getComputedStyle(button).backgroundColor) ?? fallback, event));
        return button;
      });
      for (const color of this.colors) {
        const button = document.createElement("button"); button.type = "button"; button.style.backgroundColor = color;
        button.setAttribute("aria-label", labelTemplate.replaceAll("{color}", color));
        button.addEventListener("click", event => this.commitSwatch(color, event));
        buttons.push(button);
      }
      root.replaceChildren(...buttons);
      for (const button of root.querySelectorAll<HTMLButtonElement>("button[data-token]")) {
        const color = colorToHex(getComputedStyle(button).backgroundColor) ?? "#78716C";
        button.setAttribute("aria-label", labelTemplate.replaceAll("{color}", color));
      }
    }

    private observeThemeColors(): void {
      this.themeObserver?.disconnect();
      this.themeObserver = new MutationObserver(() => {
        const template = this.getAttribute("swatch-label") || "Select {color}";
        for (const button of this.shadowRoot?.querySelectorAll<HTMLButtonElement>("button[data-token]") ?? []) {
          const color = colorToHex(getComputedStyle(button).backgroundColor);
          if (color) button.setAttribute("aria-label", template.replaceAll("{color}", color));
        }
      });
      for (let current: HTMLElement | null = this; current; current = current.parentElement) {
        this.themeObserver.observe(current, { attributes: true, attributeFilter: ["style", "class", "data-spui-appearance", "data-spui-base-appearance"] });
      }
    }

    private commitSwatch(color: string, sourceEvent: Event): void {
      this.setColor(color, this.currentAlpha, true);
      this.dispatchChange(sourceEvent);
    }

    private dispatchChange(sourceEvent?: Event): void {
      this.dispatchEvent(new CustomEvent("spui-change", { detail: { ...this.changeDetail(), event: sourceEvent, type: "change" }, bubbles: true, composed: true }));
    }

    private syncComposedControls(): void {
      for (const control of this.querySelectorAll<HTMLElement & { syncFromPicker?: () => void }>("spui-color-area,spui-color-slider,spui-alpha-slider")) control.syncFromPicker?.();
    }

    private render(): void {
      const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open" });
      const id = `color-${crypto.randomUUID()}`;
      const label = document.createElement("label"); label.htmlFor = `${id}-color`; label.part.add("label"); label.textContent = this.getAttribute("label") ?? "";
      const picker = document.createElement("div"); picker.className = "picker"; picker.dataset.size = this.getAttribute("size") || "medium"; picker.dataset.shape = this.getAttribute("shape") || "rounded"; picker.setAttribute("role", "group");
      picker.setAttribute("aria-label", this.getAttribute("aria-label") || this.getAttribute("label") || "Color picker");
      for (const name of ["aria-labelledby", "aria-description", "aria-describedby", "aria-invalid"]) { const value = this.getAttribute(name); if (value !== null) picker.setAttribute(name, value); }
      const color = document.createElement("input"); color.type = "color"; color.id = `${id}-color`; color.value = this.currentValue.toLowerCase(); color.part.add("color-input");
      const hex = document.createElement("input"); hex.type = "text"; hex.id = `${id}-hex`; hex.className = "hex"; hex.value = this.currentValue; hex.pattern = "#(?:[\\da-fA-F]{3}|[\\da-fA-F]{6})"; hex.required = this.hasAttribute("required"); hex.autocomplete = "off"; hex.spellcheck = false; hex.part.add("hex-input");
      const formatLabel = document.createElement("label"); formatLabel.className = "format-label"; formatLabel.append(document.createTextNode(`${this.getAttribute("format-label") || "Color format"} `));
      const format = document.createElement("select"); format.className = "format"; format.part.add("format-select");
      for (const [value, text] of [["hex", "HEX"], ["rgb", "RGB"]]) { const option = document.createElement("option"); option.value = value; option.textContent = text; format.append(option); }
      formatLabel.append(format);
      const channels = document.createElement("div"); channels.className = "channels"; channels.setAttribute("role", "group"); channels.part.add("rgb-inputs");
      for (const [key, labelText, index] of [["red", "Red", 0], ["green", "Green", 1], ["blue", "Blue", 2]] as const) {
        const field = document.createElement("label"); field.className = "channel"; field.htmlFor = `${id}-${key}`; field.textContent = this.getAttribute(`${key}-label`) || labelText;
        const input = document.createElement("input"); input.id = `${id}-${key}`; input.className = "channel-value"; input.type = "number"; input.min = "0"; input.max = "255"; input.step = "1"; input.required = this.hasAttribute("required"); input.inputMode = "numeric"; input.value = String(parseInt(this.currentValue.slice(1 + index * 2, 3 + index * 2), 16)); input.part.add(`${key}-input`);
        field.append(input); channels.append(field);
      }
      const preview = document.createElement("span"); preview.className = "preview"; preview.setAttribute("aria-hidden", "true"); preview.part.add("preview"); preview.style.backgroundColor = this.cssColor();
      const alpha = document.createElement("input"); alpha.type = "range"; alpha.className = "alpha"; alpha.min = "0"; alpha.max = "100"; alpha.value = String(Math.round(this.currentAlpha * 100)); alpha.part.add("alpha-input");
      const alphaRow = document.createElement("div"); alphaRow.className = "alpha-row"; alphaRow.append(alpha);
      const hue = document.createElement("input"); hue.type = "range"; hue.className = "hue"; hue.min = "0"; hue.max = "360"; hue.value = String(Math.round(this.hue)); hue.part.add("hue-input");
      const area = document.createElement("div"); area.className = "area"; area.tabIndex = 0; area.setAttribute("role", "slider"); area.setAttribute("aria-valuemin", "0"); area.setAttribute("aria-valuemax", "100"); area.part.add("color-area");
      const areaSlot = document.createElement("slot"); areaSlot.name = "area"; areaSlot.append(area);
      const sliderSlot = document.createElement("slot"); sliderSlot.name = "sliders"; sliderSlot.append(hue);
      const alphaSlot = document.createElement("slot"); alphaSlot.name = "alpha"; alphaSlot.append(alphaRow);
      const swatches = document.createElement("div"); swatches.className = "swatches"; swatches.part.add("swatches");
      color.setAttribute("aria-label", this.getAttribute("color-input-label") || "Choose color"); hex.setAttribute("aria-label", this.getAttribute("hex-input-label") || "Hex color");
      alpha.setAttribute("aria-label", this.getAttribute("alpha-label") || "Opacity"); swatches.setAttribute("role", "group"); swatches.setAttribute("aria-label", this.getAttribute("swatches-label") || "Color swatches");
      for (const name of ["aria-describedby"]) { const value = this.getAttribute(name); if (value) { color.setAttribute(name, value); hex.setAttribute(name, value); alpha.setAttribute(name, value); } }

      color.addEventListener("input", event => this.commitInput(color.value, hex, event));
      hex.addEventListener("input", event => {
        const normalized = normalizeHex(hex.value);
        hex.setCustomValidity(normalized ? "" : this.getAttribute("invalid-message") || "Enter a 3 or 6 digit hex color, for example #336699.");
        if (normalized) this.commitInput(normalized, hex, event, true);
        else this.syncForm();
      });
      hex.addEventListener("blur", () => { const normalized = normalizeHex(hex.value); if (normalized) hex.value = normalized; });
      alpha.addEventListener("input", event => this.setAlphaFromControl(Number(alpha.value) / 100, undefined, event));
      format.value = this.format;
      format.addEventListener("change", () => { this.format = format.value as ColorPickerFormat; this.dispatchEvent(new CustomEvent("spui-format-change", { detail: { format: this.format }, bubbles: true, composed: true })); });
      for (const input of channels.querySelectorAll<HTMLInputElement>(".channel-value")) input.addEventListener("input", event => this.commitRgb(event));
      hue.addEventListener("input", event => this.setHsvFromControl(Number(hue.value), this.saturation, this.brightness, undefined, event));
      area.addEventListener("pointerdown", event => { if (this.hasAttribute("disabled") || this.hasAttribute("read-only") || this.formDisabled) return; area.setPointerCapture(event.pointerId); this.updateAreaFromPointer(event, area); });
      area.addEventListener("pointermove", event => { if (area.hasPointerCapture(event.pointerId)) this.updateAreaFromPointer(event, area); });
      area.addEventListener("keydown", event => {
        if (this.hasAttribute("disabled") || this.hasAttribute("read-only") || this.formDisabled) return;
        const step = event.shiftKey ? 0.1 : 0.01;
        const rtl = getComputedStyle(area).direction === "rtl";
        if (event.key === "ArrowLeft") this.saturation = Math.max(0, Math.min(1, this.saturation + (rtl ? step : -step)));
        else if (event.key === "ArrowRight") this.saturation = Math.max(0, Math.min(1, this.saturation + (rtl ? -step : step)));
        else if (event.key === "ArrowUp") this.brightness = Math.min(1, this.brightness + step);
        else if (event.key === "ArrowDown") this.brightness = Math.max(0, this.brightness - step);
        else if (event.key === "Home") this.saturation = 0;
        else if (event.key === "End") this.saturation = 1;
        else return;
        event.preventDefault(); this.commitHsv(event);
      });

      picker.append(color, hex, preview); shadow.replaceChildren();
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:grid;gap:var(--spui-control-gap,8px);min-width:0}label:empty{display:none}label{font-size:14px;font-weight:600;color:var(--spui-ui-muted,var(--spui-semantic-body-text,inherit))}.picker{display:flex;align-items:center;gap:var(--spui-control-gap,8px);min-width:0}.picker[data-size=small]{--picker-height:32px}.picker[data-size=medium]{--picker-height:40px}.picker[data-size=large]{--picker-height:48px}.picker[data-shape=square]{--picker-radius:var(--spui-control-radius,4px)}.picker[data-shape=rounded]{--picker-radius:10px}.picker:focus-within{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#78716c));outline-offset:2px;border-radius:var(--picker-radius)}input,select{box-sizing:border-box;min-height:var(--picker-height,40px);border:1px solid var(--spui-control-border,var(--spui-ui-stroke,var(--spui-semantic-input-border,#8a8886)));border-radius:var(--picker-radius,10px);background:var(--spui-control-background,var(--spui-ui-surface,var(--spui-semantic-input-background,#fff)));color:var(--spui-ui-text,var(--spui-semantic-body-text,#242424));font:inherit}input[type=color]{flex:none;width:var(--picker-height,40px);padding:4px;cursor:pointer}input[type=color]::-webkit-color-swatch-wrapper{padding:2px}input[type=color]::-webkit-color-swatch{border:1px solid var(--spui-ui-stroke,#8a8886);border-radius:calc(var(--picker-radius,10px) - 3px)}input.hex{width:10ch;max-width:42vw;padding-inline:10px;font-variant-numeric:tabular-nums;text-transform:uppercase}input:disabled,select:disabled{opacity:.55;cursor:not-allowed}input.hex:invalid{border-color:var(--spui-ui-danger,var(--spui-semantic-error-text,#b10e1c))}.format-label{display:flex;align-items:center;gap:8px}.format{min-height:32px;padding-inline:8px}.channels{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;width:min(320px,100%)}.channels[hidden],.hex[hidden]{display:none!important}.channel{display:grid;gap:3px;font-size:12px;color:var(--spui-ui-muted,var(--spui-semantic-body-subtext,#616161))}.channel-value{width:100%;min-height:32px;padding-inline:6px;direction:ltr;text-align:start;font-variant-numeric:tabular-nums}.preview{flex:none;width:var(--picker-height,40px);height:var(--picker-height,40px);border:1px solid var(--spui-ui-stroke,#8a8886);border-radius:var(--picker-radius,10px)}.area{position:relative;width:min(260px,100%);height:160px;border:1px solid var(--spui-ui-stroke,#8a8886);border-radius:var(--picker-radius,10px);background-image:linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,hsl(var(--picker-hue,0deg) 100% 50%));touch-action:none;cursor:crosshair}.area::after{content:"";position:absolute;left:var(--picker-saturation,0%);top:var(--picker-brightness,100%);width:14px;height:14px;border:2px solid white;border-radius:50%;box-shadow:0 0 0 1px #000;transform:translate(-50%,-50%);pointer-events:none}.area:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#78716c));outline-offset:3px}.hue{direction:ltr;max-width:260px;background:linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)}.hue::-webkit-slider-runnable-track{height:8px;border-radius:999px;background:linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)}.hue::-moz-range-track{height:8px;border-radius:999px;background:linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)}.alpha-row{display:flex;align-items:center;gap:8px;max-width:320px}input[type=range]{width:100%;min-height:32px;accent-color:var(--spui-ui-accent,#78716c)}.swatches{display:flex;flex-wrap:wrap;gap:8px}.swatches button{box-sizing:border-box;width:36px;height:36px;padding:0;border:1px solid var(--spui-ui-stroke,#8a8886);border-radius:10px;cursor:pointer}:host([shape=square]) .swatches button{border-radius:var(--spui-control-radius,4px)}.swatches button:hover{outline:2px solid var(--spui-ui-accent,#78716c);outline-offset:1px}.swatches button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#78716c));outline-offset:2px}@media(forced-colors:active){input,select,.area,.swatches button{border-color:FieldText}.area:focus-visible,.swatches button:focus-visible,input:focus-visible,select:focus-visible{outline-color:Highlight}}@media(prefers-reduced-motion:reduce){.area::after{transition:none}}`;
      style.textContent += ".picker:focus-within{outline:none}input.hex{direction:ltr;text-align:left}";
      style.textContent += "slot[name=area],slot[name=sliders],slot[name=alpha]{display:block;max-width:100%}slot[name=sliders]{display:flex;align-items:center;gap:var(--spui-control-gap,8px);flex-wrap:wrap}slot[name=area]>spui-color-area,slot[name=sliders]>spui-color-slider,slot[name=alpha]>spui-alpha-slider{max-width:100%}";
      shadow.append(style, label, picker, areaSlot, sliderSlot, formatLabel, channels, alphaSlot, swatches);
      this.syncInputLabels(); this.syncGroupLabels(); this.syncDisabled(); this.renderSwatches(); this.syncPickerArea(); this.syncFormat(); this.syncForm(); this.syncComposedControls();
    }

    private commitInput(value: string, hex: HTMLInputElement, sourceEvent: Event, preserveHex = false): void {
      const normalized = normalizeHex(value);
      if (!normalized) return;
      this.currentValue = normalized; this.dirty = true; if (!preserveHex) hex.value = normalized; hex.setCustomValidity("");
      const preview = this.shadowRoot?.querySelector<HTMLElement>(".preview"); if (preview) preview.style.backgroundColor = this.cssColor();
      [this.hue, this.saturation, this.brightness] = hexToHsv(normalized);
      this.syncValueInputs(preserveHex);
      this.syncPickerArea();
      this.syncForm();
      this.dispatchChange(sourceEvent);
    }
  }
  customElements.define("spui-color-picker", SpuiColorPicker);
}
