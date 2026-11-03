import { base, syncHostAccessibleName } from "./shared.js";
import { getRichTextEditorFieldOptions, type SharePointMultiLineField } from "../sharepoint-fields.js";
export { getRichTextEditorFieldOptions, type SharePointMultiLineField } from "../sharepoint-fields.js";

export type RichTextEditorLink = { href: string; text?: string; title?: string; openInNewTab?: boolean };
export type RichTextEditorLinkPicker = (currentLink: RichTextEditorLink | null) => Promise<RichTextEditorLink | null>;

export interface SharePointRichTextEditorElement extends HTMLElement {
  value: string;
  uploadImage?: (file: File) => Promise<string>;
  linkPicker?: RichTextEditorLinkPicker;
  readonly form: HTMLFormElement | null;
  readonly validity: ValidityState | undefined;
  readonly validationMessage: string;
  readonly willValidate: boolean;
  checkValidity(): boolean;
  reportValidity(): boolean;
  setCustomValidity(message: string): void;
  formStateRestoreCallback(state: string | File | FormData | null): void;
}
declare global { interface HTMLElementTagNameMap { "spui-rich-text-editor": SharePointRichTextEditorElement; } }

const toolbarIconPaths: Record<string, string> = {
  bold: "M6 4h5a3 3 0 0 1 0 6H6z M6 10h6a3 3 0 0 1 0 6H6z", italic: "M10 4h6 M8 16h6 M13 4 9 16", underline: "M6 4v5a4 4 0 0 0 8 0V4 M5 16h10", strikeThrough: "M3 10h14 M6 5c1-2 7-2 8 0 M6 15c1 2 7 2 8 0",
  removeFormat: "M4 4l12 12 M6 6l4 4m2 2 2 2 M8 4h8 M5 16h5",
  insertUnorderedList: "M8 5h9 M8 10h9 M8 15h9 M4 5h.01 M4 10h.01 M4 15h.01", insertOrderedList: "M9 5h8 M9 10h8 M9 15h8 M4 4h1v3 M3.5 7h2 M3.5 10.5c0-1 2-1 2 0 0 .6-2 1.5-2 2.5h2 M4 14h1a1 1 0 0 1 0 2H4",
  undo: "M9 7 5 10l4 3 M5 10h7a4 4 0 0 1 4 4", redo: "M11 7 15 10l-4 3 M15 10H8a4 4 0 0 0-4 4",
  insertTable: "M3 4h14v12H3z M3 8h14 M3 12h14 M8 4v12 M13 4v12", insertImage: "M3 4h14v12H3z M4 14l4-4 3 3 2-2 3 3 M7 7h.01",
  insertRowAbove: "M3 9h14v7H3z M3 12h14 M10 3v4 M8 5h4", insertRowBelow: "M3 4h14v7H3z M3 8h14 M10 13v4 M8 15h4",
  insertColumnBefore: "M6 4h11v12H6z M10 4v12 M14 4v12 M3 10h3 M4.5 8.5v3", insertColumnAfter: "M3 4h11v12H3z M7 4v12 M11 4v12 M14 10h3 M15.5 8.5v3",
  deleteRow: "M3 5h14v10H3z M3 10h14 M8 5v5 M13 5v5 M8 13h4", deleteColumn: "M5 3v14h10V3z M10 3v14 M5 8h5 M5 13h5 M12 8v4", deleteTable: "M3 4h14v12H3z M3 8h14 M3 12h14 M8 4v12 M13 4v12 M10 9v4 M8.5 11h3",
  createLink: "M7 10h6 M9 7l1-1a3 3 0 0 1 4 4l-2 2a3 3 0 0 1-4 0 M11 13l-1 1a3 3 0 0 1-4-4l2-2a3 3 0 0 1 4 0"
};
function createToolbarIcon(command: string): SVGSVGElement {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 20 20"); icon.setAttribute("width", "20"); icon.setAttribute("height", "20"); icon.setAttribute("aria-hidden", "true"); icon.setAttribute("focusable", "false"); icon.setAttribute("fill", "none"); icon.setAttribute("stroke", "currentColor"); icon.setAttribute("stroke-width", "1.7"); icon.setAttribute("stroke-linecap", "round"); icon.setAttribute("stroke-linejoin", "round");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path"); path.setAttribute("d", toolbarIconPaths[command] ?? "M4 10h12"); icon.append(path); return icon;
}

const ALLOWED = new Set(["P", "DIV", "SPAN", "BR", "HR", "STRONG", "B", "EM", "I", "U", "S", "STRIKE", "DEL", "INS", "UL", "OL", "LI", "A", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "PRE", "TABLE", "THEAD", "TBODY", "TFOOT", "TR", "TH", "TD", "CAPTION", "SUP", "SUB", "CODE", "IMG"]);
const HTML_ONLY = new Set(["MAIN", "SECTION", "ARTICLE", "HEADER", "FOOTER", "ASIDE", "FIGURE", "FIGCAPTION", "DETAILS", "SUMMARY", "DL", "DT", "DD", "ABBR", "CITE", "Q", "MARK", "SMALL", "TIME", "WBR"]);
const RESTRICTED = new Set(["P", "DIV", "SPAN", "BR", "STRONG", "B", "EM", "I", "U", "S", "STRIKE", "DEL", "INS", "UL", "OL", "LI", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "PRE", "SUP", "SUB", "CODE"]);
const DROP_CONTENT = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "TEMPLATE"]);
const HTML_STYLE_PROPERTIES = new Set(["background-color", "color", "direction", "font-family", "font-size", "font-style", "font-weight", "letter-spacing", "line-height", "list-style-type", "margin-block-end", "margin-block-start", "margin-inline-end", "margin-inline-start", "text-align", "text-decoration", "text-indent", "text-transform", "vertical-align", "white-space"]);
const RICH_STYLE_PROPERTIES = new Set(["background-color", "color", "font-family", "font-size", "font-style", "font-weight", "text-align", "text-decoration"]);
const FONT_SIZE_PX: Record<string, string> = { "1": "10px", "2": "12px", "3": "16px", "4": "18px", "5": "24px", "6": "32px", "7": "48px" };
type TextSelectionPoint = { offset: number; path: number[]; nodeOffset: number; text?: string; tag?: string };
type TextSelectionSnapshot = { anchor: TextSelectionPoint; focus: TextSelectionPoint };
function safeHref(value: string): boolean {
  if (/[\u0000-\u001f\u007f]/.test(value)) return false;
  try { return ["http:", "https:", "mailto:"].includes(new URL(value.trim(), document.baseURI).protocol); }
  catch { return false; }
}
function safeImageSrc(value: string): boolean {
  try { return ["http:", "https:"].includes(new URL(value.trim(), document.baseURI).protocol); } catch { return false; }
}
function safeLanguageTag(value: string): boolean {
  const tag = value.trim();
  if (!tag || tag.length > 128) return false;
  if (typeof Intl !== "undefined" && typeof Intl.getCanonicalLocales === "function") {
    try { return Intl.getCanonicalLocales(tag).length === 1; } catch { return false; }
  }
  return /^[a-z]{2,8}(?:-[a-z0-9]{1,8})*$/i.test(tag);
}
function plainText(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.body.querySelectorAll([...DROP_CONTENT].join(",")).forEach(element => element.remove());
  const read = (node: Node): string => [...node.childNodes].map(child => {
    if (child.nodeType === Node.TEXT_NODE) return child.textContent ?? "";
    if (child.nodeType !== Node.ELEMENT_NODE) return "";
    if ((child as Element).tagName === "BR") return "\n";
    const value = read(child);
    return /^(ADDRESS|ARTICLE|BLOCKQUOTE|DIV|H[1-6]|LI|P|PRE|SECTION)$/.test((child as Element).tagName) ? `${value}\n` : value;
  }).join("");
  return read(doc.body).replace(/[\t ]*\n[\t ]*/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/\n$/, "");
}
function cleanHtml(html: string, mode: "plain" | "restricted" | "rich" | "html" = "html", allowHyperlink = true): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (mode === "plain") return plainText(html);
  const allowedTags = mode === "restricted" ? RESTRICTED : mode === "html" ? new Set([...ALLOWED, ...HTML_ONLY]) : ALLOWED;
  const clean = (node: Node): void => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement;
        if (DROP_CONTENT.has(element.tagName)) { child.remove(); continue; }
        if (element.tagName === "FONT" && (mode === "rich" || mode === "html")) {
          const span = doc.createElement("span");
          const face = element.getAttribute("face")?.trim();
          const color = element.getAttribute("color")?.trim();
          const size = element.getAttribute("size")?.trim();
          if (face && (typeof CSS === "undefined" || CSS.supports("font-family", face))) span.style.fontFamily = face;
          if (color && (typeof CSS === "undefined" || CSS.supports("color", color))) span.style.color = color;
          if (size && FONT_SIZE_PX[size]) span.style.fontSize = FONT_SIZE_PX[size];
          if (element.hasAttribute("style")) span.setAttribute("style", [span.getAttribute("style"), element.getAttribute("style")].filter(Boolean).join(";"));
          span.append(...[...element.childNodes]);
          child.replaceWith(span);
          clean(span);
          continue;
        }
        if (!allowedTags.has(element.tagName) || (element.tagName === "A" && !allowHyperlink)) { clean(element); child.replaceWith(...[...child.childNodes]); continue; }
        for (const attr of [...element.attributes]) {
          if (attr.name === "style" && (mode === "html" || mode === "rich")) {
            const allowedStyles = mode === "html" ? HTML_STYLE_PROPERTIES : RICH_STYLE_PROPERTIES;
            const safeStyles = [...element.style].filter(property => {
              const value = element.style.getPropertyValue(property).trim();
              return allowedStyles.has(property) && !/(?:url|expression|@import|javascript:|var\s*\()/i.test(value) && (typeof CSS === "undefined" || CSS.supports(property, value));
            }).map(property => `${property}: ${element.style.getPropertyValue(property).trim()}`).join("; ");
            if (safeStyles) element.setAttribute("style", safeStyles); else element.removeAttribute("style");
            continue;
          }
          const link = element.tagName === "A" && attr.name === "href" && safeHref(attr.value);
          const linkTitle = element.tagName === "A" && attr.name === "title" && attr.value.length <= 512;
          const linkTarget = element.tagName === "A" && attr.name === "target" && attr.value === "_blank";
          const linkRel = element.tagName === "A" && attr.name === "rel" && /^(noopener noreferrer|noreferrer noopener)$/i.test(attr.value.trim());
          const span = ["TD", "TH"].includes(element.tagName) && ["colspan", "rowspan"].includes(attr.name) && /^\d{1,2}$/.test(attr.value) && Number(attr.value) > 0;
          const scope = element.tagName === "TH" && attr.name === "scope" && ["row", "col", "rowgroup", "colgroup"].includes(attr.value);
          const image = element.tagName === "IMG" && ((attr.name === "src" && safeImageSrc(attr.value)) || attr.name === "alt" || ((attr.name === "width" || attr.name === "height") && /^\d{1,4}$/.test(attr.value)));
          const direction = attr.name === "dir" && ["ltr", "rtl", "auto"].includes(attr.value.trim().toLowerCase());
          const language = attr.name === "lang" && safeLanguageTag(attr.value);
          if (!link && !linkTitle && !linkTarget && !linkRel && !span && !scope && !image && !direction && !language) element.removeAttribute(attr.name);
        }
        if (element.tagName === "A") {
          if (element.hasAttribute("href") && element.getAttribute("target") === "_blank") element.setAttribute("rel", "noopener noreferrer");
          else { element.removeAttribute("target"); element.removeAttribute("rel"); }
        }
        clean(element);
      } else if (child.nodeType !== Node.TEXT_NODE) child.remove();
    }
  };
  clean(doc.body);
  return doc.body.innerHTML;
}

export function defineRichTextEditor(): void {
  if (customElements.get("spui-rich-text-editor")) return;
  class SpuiRichTextEditor extends HTMLElement implements SharePointRichTextEditorElement {
    static formAssociated = true;
    static observedAttributes = ["label", "editor-label", "placeholder", "content-mode", "allow-hyperlink", "disabled", "read-only", "required", "required-message", "value", "name", "aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid", "bold-label", "italic-label", "underline-label", "strike-label", "clear-formatting-label", "format-block-label", "font-family-label", "font-size-label", "paragraph-label", "heading-1-label", "heading-2-label", "heading-3-label", "blockquote-label", "preformatted-label", "bullet-list-label", "number-list-label", "link-label", "text-color-label", "highlight-color-label", "custom-color-label", "theme-accent-label", "color-swatch-label", "undo-label", "redo-label", "insert-table-label", "insert-image-label", "image-input-label", "insert-row-above-label", "insert-row-below-label", "insert-column-before-label", "insert-column-after-label", "delete-row-label", "delete-column-label", "delete-table-label", "toolbar-label", "link-prompt", "link-dialog-label", "link-text-label", "link-title-label", "link-apply-label", "link-remove-label", "link-cancel-label", "link-new-tab-label", "link-invalid-message", "link-picker-label", "link-picker-loading-label", "link-picker-error-message"];
    private editor!: HTMLDivElement;
    private internals: ElementInternals | undefined;
    private formDisabled = false;
    private pendingValue: string | undefined;
    private customError = "";
    private savedRange?: Range;
    private preserveToolbarSelection = false;
    private probingSelection = false;
    private probedSelection?: Range;
    /** Uploads to a durable asset store and returns the image URL to persist in editor HTML. */
    private imageUploader?: (file: File) => Promise<string>;
    get uploadImage(): ((file: File) => Promise<string>) | undefined { return this.imageUploader; }
    set uploadImage(value: ((file: File) => Promise<string>) | undefined) { this.imageUploader = value; this.syncImageButton(); }
    private linkPickerValue?: RichTextEditorLinkPicker;
    private linkPickerButton?: HTMLButtonElement;
    private pickingLink = false;
    private linkEditorVersion = 0;
    get linkPicker(): RichTextEditorLinkPicker | undefined { return this.linkPickerValue; }
    set linkPicker(value: RichTextEditorLinkPicker | undefined) { this.linkPickerValue = value; this.syncLinkPickerButton(); }
    private imageInput?: HTMLInputElement;
    private linkForm?: HTMLFormElement;
    private linkUrlInput?: HTMLInputElement;
    private linkTextInput?: HTMLInputElement;
    private linkTitleInput?: HTMLInputElement;
    private linkNewTabInput?: HTMLInputElement;
    private linkError?: HTMLElement;
    private linkPickerStatus?: HTMLElement;
    private linkRemoveButton?: HTMLButtonElement;
    private uploadingImage = false;
    private savedCell?: HTMLTableCellElement;
    private selectedTablePath?: { table: number; row: number; cell: number };
    private events?: AbortController;
    private get contentMode(): "plain" | "restricted" | "rich" | "html" { const mode = this.getAttribute("content-mode"); return mode === "plain" || mode === "restricted" || mode === "rich" || mode === "html" ? mode : "html"; }
    private get allowHyperlinks(): boolean { return this.contentMode !== "plain" && this.contentMode !== "restricted" && this.getAttribute("allow-hyperlink") !== "false"; }
    constructor() { super(); try { this.internals = this.attachInternals(); } catch { /* Editing remains available in engines without form association. */ } }
    connectedCallback(): void {
      this.events?.abort();
      this.events = new AbortController();
      this.render();
      document.addEventListener("selectionchange", this.onSelectionChange, { signal: this.events.signal });
      if (this.pendingValue !== undefined) this.value = this.pendingValue;
      else if (this.hasAttribute("value")) this.value = this.getAttribute("value") ?? "";
      this.syncForm();
    }
    disconnectedCallback(): void { this.events?.abort(); }
    attributeChangedCallback(name: string): void {
      if (!this.isConnected) return;
      if (name === "value") this.value = this.getAttribute("value") ?? "";
      else if ((name === "content-mode" || name === "allow-hyperlink") && this.editor) { this.value = this.value; this.syncContentMode(); }
      else if ((name === "disabled" || name === "read-only") && this.editor) { this.syncDisabled(); this.syncForm(); }
      else if (name === "required" && this.editor) { this.editor.setAttribute("aria-required", String(this.hasAttribute("required"))); this.syncForm(); }
      else if (name === "required-message" && this.editor) this.syncForm();
      else if (name === "placeholder" && this.editor) this.editor.dataset.placeholder = this.getAttribute("placeholder") ?? "Write something…";
      else if (name === "label" && this.editor) {
        const label = this.shadowRoot?.querySelector("label");
        if (label) { label.textContent = this.getAttribute("label") ?? ""; label.hidden = !this.hasAttribute("label"); }
        this.syncEditorLabel();
        this.refreshStrings();
      } else if (name === "editor-label" && this.editor) this.syncEditorLabel();
      else if (["aria-label", "aria-labelledby", "aria-description", "aria-describedby"].includes(name) && this.editor) syncHostAccessibleName(this, this.editor);
      else if (name === "aria-invalid" && this.editor) { const value = this.getAttribute(name); if (value === null) this.editor.removeAttribute(name); else this.editor.setAttribute(name, value); }
      else this.refreshStrings();
    }
    private syncEditorLabel(): void { this.editor.setAttribute("aria-label", this.getAttribute("aria-label") ?? this.getAttribute("label") ?? this.getAttribute("editor-label") ?? "Rich text"); }
    get value(): string { return this.editor ? (this.contentMode === "plain" ? plainText(this.editor.innerHTML) : cleanHtml(this.editor.innerHTML, this.contentMode, this.allowHyperlinks)) : this.pendingValue ?? this.getAttribute("value") ?? ""; }
    set value(value: string) { this.pendingValue = value; if (this.editor) { if (this.contentMode === "plain") this.editor.textContent = plainText(value); else this.editor.innerHTML = cleanHtml(value, this.contentMode, this.allowHyperlinks); this.syncForm(); } }
    get form(): HTMLFormElement | null { return this.internals?.form ?? null; }
    get validity(): ValidityState | undefined { return this.internals?.validity; }
    get validationMessage(): string { return this.internals?.validationMessage ?? ""; }
    get willValidate(): boolean { return Boolean(this.editor && !this.formDisabled && !this.hasAttribute("disabled") && !this.hasAttribute("read-only") && (this.internals?.willValidate ?? true)); }
    checkValidity(): boolean { return this.willValidate ? this.internals?.checkValidity() ?? true : true; }
    reportValidity(): boolean { return this.willValidate ? this.internals?.reportValidity() ?? true : true; }
    setCustomValidity(message: string): void { this.customError = String(message ?? ""); this.syncForm(); }
    formResetCallback(): void { this.value = this.getAttribute("value") ?? ""; }
    formStateRestoreCallback(state: string | File | FormData | null): void { if (typeof state === "string") this.value = state; }
    formDisabledCallback(disabled: boolean): void { this.formDisabled = disabled; if (this.editor) { this.syncDisabled(); this.syncForm(); } }
    private syncDisabled(): void {
      const disabled = this.formDisabled || this.hasAttribute("disabled");
      const readOnly = disabled || this.hasAttribute("read-only");
      this.editor.contentEditable = readOnly ? "false" : this.contentMode === "plain" ? "plaintext-only" : "true";
      this.editor.setAttribute("aria-readonly", String(this.hasAttribute("read-only")));
      this.editor.setAttribute("aria-disabled", String(disabled));
      this.shadowRoot?.querySelectorAll<HTMLButtonElement | HTMLSelectElement | HTMLInputElement>("[role=toolbar] button,[role=toolbar] select,[role=toolbar] input[type=color]").forEach(control => { control.disabled = readOnly; });
      this.shadowRoot?.querySelectorAll<HTMLElement>("[role=toolbar] .toolbar-color").forEach(picker => {
        const summary = picker.querySelector<HTMLElement>("summary");
        if (summary) { summary.tabIndex = readOnly ? -1 : 0; summary.setAttribute("aria-disabled", String(readOnly)); }
        if (readOnly) (picker as HTMLDetailsElement).open = false;
      });
      if (this.linkForm) {
        if (readOnly) this.linkForm.hidden = true;
        this.linkForm.querySelectorAll<HTMLInputElement | HTMLButtonElement>("input,button").forEach(control => { control.disabled = readOnly; });
      }
      this.syncImageButton();
      this.syncLinkPickerButton();
    }
    private syncImageButton(): void {
      const button = this.shadowRoot?.querySelector<HTMLButtonElement>('[data-command="insertImage"]');
      if (button) { button.hidden = !this.imageUploader || this.contentMode === "plain" || this.contentMode === "restricted"; button.disabled = this.formDisabled || this.hasAttribute("disabled") || this.hasAttribute("read-only") || !this.imageUploader || this.uploadingImage; }
      this.syncToolbarGroups();
    }
    private syncToolbarGroups(): void {
      this.shadowRoot?.querySelectorAll<HTMLElement>(".toolbar-group:not(.toolbar-group--table):not(.toolbar-group--color):not(.toolbar-group--fonts)").forEach(group => { group.hidden = !group.querySelector("button:not([hidden])"); });
      const colorGroup = this.shadowRoot?.querySelector<HTMLElement>(".toolbar-group--color");
      if (colorGroup) colorGroup.hidden = !["rich", "html"].includes(this.contentMode);
      const fontGroup = this.shadowRoot?.querySelector<HTMLElement>(".toolbar-group--fonts");
      if (fontGroup) fontGroup.hidden = !["rich", "html"].includes(this.contentMode);
    }
    private syncContentMode(): void {
      const toolbar = this.shadowRoot?.querySelector<HTMLElement>('[role="toolbar"]');
      if (toolbar) {
        toolbar.hidden = this.contentMode === "plain";
        toolbar.querySelectorAll<HTMLButtonElement>("button[data-command]").forEach(button => {
          const command = button.dataset.command;
          button.hidden = (this.contentMode === "restricted" && (command === "insertTable" || command === "insertImage" || button.hasAttribute("data-table-command"))) || (command === "createLink" && !this.allowHyperlinks);
        });
        const colorGroup = toolbar.querySelector<HTMLElement>(".toolbar-group--color");
        if (colorGroup) colorGroup.hidden = !["rich", "html"].includes(this.contentMode);
        const fontGroup = toolbar.querySelector<HTMLElement>(".toolbar-group--fonts");
        if (fontGroup) fontGroup.hidden = !["rich", "html"].includes(this.contentMode);
      }
      if (this.editor) this.editor.style.whiteSpace = this.contentMode === "plain" ? "pre-wrap" : "";
      this.syncDisabled(); this.syncTableActions(); this.syncToolbarGroups();
    }
    private syncLinkPickerButton(): void {
      if (this.linkPickerButton) {
        this.linkPickerButton.hidden = !this.linkPickerValue || !this.allowHyperlinks;
        this.linkPickerButton.disabled = this.formDisabled || this.hasAttribute("disabled") || this.hasAttribute("read-only");
        this.linkPickerButton.setAttribute("aria-disabled", String(this.pickingLink));
        this.linkPickerButton.setAttribute("aria-busy", String(this.pickingLink));
        this.linkPickerButton.textContent = this.pickingLink
          ? this.getAttribute("link-picker-loading-label") ?? "Opening picker…"
          : this.getAttribute("link-picker-label") ?? "Browse SharePoint";
      }
      if (this.linkPickerStatus) this.linkPickerStatus.textContent = this.pickingLink ? this.getAttribute("link-picker-loading-label") ?? "Opening picker…" : "";
    }
    private syncForm(value = this.value): void { this.pendingValue = value; this.internals?.setFormValue(value || null); const active = this.willValidate; const missing = active && this.hasAttribute("required") && !this.editor?.textContent?.trim(); const customError = active && Boolean(this.customError); const flags: ValidityStateFlags = { ...(missing ? { valueMissing: true } : {}), ...(customError ? { customError: true } : {}) }; const message = customError ? this.customError : missing ? this.getAttribute("required-message") ?? "Enter some text." : ""; try { this.internals?.setValidity(flags, message); } catch { /* Engines without form association remain editable. */ } }
    private commitEditorValue(eventName: "spui-input" | "spui-change" = "spui-input"): void {
      const value = this.sanitizeEditor();
      this.onSelectionChange();
      this.syncForm(value);
      const event = eventName === "spui-change"
        ? new CustomEvent("spui-change", { detail: { value }, bubbles: true, composed: true })
        : new CustomEvent("spui-input", { detail: { value }, bubbles: true, composed: true });
      this.dispatchEvent(event);
    }
    private sanitizeEditor(): string {
      const html = this.editor.innerHTML;
      const value = cleanHtml(html, this.contentMode, this.allowHyperlinks);
      if (this.contentMode === "plain") { if (this.editor.textContent !== value) this.editor.textContent = value; return value; }
      if (value === html) return value;
      const selection = this.captureTextSelection();
      const cell = this.selectedCell();
      const tableIndex = cell ? [...this.editor.querySelectorAll("table")].indexOf(cell.closest("table")!) : -1;
      const rowIndex = cell?.closest("tr")?.rowIndex ?? -1;
      const cellIndex = cell?.cellIndex ?? -1;
      this.editor.innerHTML = value;
      if (selection) this.restoreTextSelection(selection);
      const restoredCell = tableIndex >= 0 && rowIndex >= 0 && cellIndex >= 0
        ? this.editor.querySelectorAll("table")[tableIndex]?.rows[rowIndex]?.cells[cellIndex]
        : undefined;
      this.savedCell = restoredCell ?? this.selectedCell();
      if (!selection && restoredCell) {
        const range = document.createRange();
        range.selectNodeContents(restoredCell);
        range.collapse(true);
        this.savedRange = range;
      } else if (!selection) this.savedRange = undefined;
      this.syncTableActions();
      return value;
    }
    private captureTextSelection(): TextSelectionSnapshot | undefined {
      const selection = this.selection();
      const anchorNode = selection?.anchorNode;
      const focusNode = selection?.focusNode;
      if (anchorNode && focusNode && this.editor.contains(anchorNode) && this.editor.contains(focusNode)) {
        return { anchor: this.selectionPoint(anchorNode, selection!.anchorOffset), focus: this.selectionPoint(focusNode, selection!.focusOffset) };
      }
      const range = this.savedRange;
      if (!range || !this.editor.contains(range.commonAncestorContainer)) return undefined;
      return { anchor: this.selectionPoint(range.startContainer, range.startOffset), focus: this.selectionPoint(range.endContainer, range.endOffset) };
    }
    private selectionPoint(node: Node, nodeOffset: number): TextSelectionPoint {
      const path: number[] = [];
      for (let current: Node = node; current !== this.editor;) {
        const parent = current.parentNode;
        if (!parent) break;
        path.unshift(Array.from(parent.childNodes).findIndex(child => child === current));
        current = parent;
      }
      return {
        offset: this.textOffset(node, nodeOffset), path, nodeOffset,
        ...(node.nodeType === Node.TEXT_NODE ? { text: node.textContent ?? "" } : {}),
        ...(node instanceof Element ? { tag: node.tagName } : {})
      };
    }
    private textOffset(node: Node, offset: number): number {
      const range = document.createRange();
      range.selectNodeContents(this.editor);
      range.setEnd(node, offset);
      return range.toString().length;
    }
    private textPoint(offset: number): { node: Node; offset: number } {
      const walker = document.createTreeWalker(this.editor, NodeFilter.SHOW_TEXT);
      let remaining = Math.max(0, offset);
      let last: Node | undefined;
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const length = node.textContent?.length ?? 0;
        last = node;
        if (remaining <= length) return { node, offset: remaining };
        remaining -= length;
      }
      return last ? { node: last, offset: last.textContent?.length ?? 0 } : { node: this.editor, offset: 0 };
    }
    private restoreTextSelection(snapshot: TextSelectionSnapshot): void {
      const anchor = this.restoreSelectionPoint(snapshot.anchor);
      const focus = this.restoreSelectionPoint(snapshot.focus);
      const selection = this.selection();
      if (selection?.setBaseAndExtent) {
        selection.setBaseAndExtent(anchor.node, anchor.offset, focus.node, focus.offset);
        this.savedRange = selection.rangeCount ? selection.getRangeAt(0).cloneRange() : undefined;
        return;
      }
      const range = document.createRange();
      const forward = snapshot.anchor.offset <= snapshot.focus.offset;
      const start = forward ? anchor : focus;
      const end = forward ? focus : anchor;
      range.setStart(start.node, start.offset);
      range.setEnd(end.node, end.offset);
      selection?.removeAllRanges();
      selection?.addRange(range);
      this.savedRange = range.cloneRange();
    }
    private restoreSelectionPoint(point: TextSelectionPoint): { node: Node; offset: number } {
      let node: Node | undefined = this.editor;
      for (const index of point.path) node = node?.childNodes[index];
      if (node && point.text !== undefined && node.nodeType === Node.TEXT_NODE && node.textContent === point.text) {
        return { node, offset: Math.min(point.nodeOffset, point.text.length) };
      }
      if (node && point.text === undefined && node instanceof Element && node.tagName === point.tag && point.nodeOffset <= node.childNodes.length) {
        return { node, offset: point.nodeOffset };
      }
      return this.textPoint(point.offset);
    }
    private selectedCell(): HTMLTableCellElement | undefined {
      const node = this.savedRange?.startContainer;
      const element = node instanceof Element ? node : node?.parentElement;
      const cell = element?.closest<HTMLTableCellElement>("td,th");
      if (cell && this.editor.contains(cell)) { this.rememberCell(cell); return cell; }
      if (this.savedCell && this.editor.contains(this.savedCell)) return this.savedCell;
      const path = this.selectedTablePath;
      return path ? this.editor.querySelectorAll("table")[path.table]?.rows[path.row]?.cells[path.cell] : undefined;
    }
    private rememberCell(cell: HTMLTableCellElement): void {
      const table = cell.closest("table");
      this.selectedTablePath = table ? { table: [...this.editor.querySelectorAll("table")].indexOf(table), row: (cell.parentElement as HTMLTableRowElement).rowIndex, cell: cell.cellIndex } : undefined;
    }
    private selection(): Selection | null {
      const root = this.editor.getRootNode();
      return root instanceof ShadowRoot ? (root as ShadowRoot & { getSelection?: () => Selection | null }).getSelection?.() ?? this.editor.ownerDocument.getSelection() : this.editor.ownerDocument.getSelection();
    }
    private onSelectionChange = (): void => {
      const selection = this.selection();
      let range = selection?.rangeCount ? selection.getRangeAt(0) : undefined;
      if (!range || !this.editor.contains(range.commonAncestorContainer)) {
        const InputEventConstructor = this.editor.ownerDocument.defaultView?.InputEvent;
        const touchFirst = this.editor.ownerDocument.defaultView?.matchMedia("(pointer: coarse)").matches ?? false;
        if (!touchFirst && this.editor.matches(":focus") && typeof InputEventConstructor?.prototype.getTargetRanges === "function" && !this.probingSelection) {
          this.probedSelection = undefined;
          this.probingSelection = true;
          try { this.editor.ownerDocument.execCommand("indent"); }
          finally { this.probingSelection = false; }
          range = this.probedSelection;
        }
      }
      if (!range || !this.editor.contains(range.commonAncestorContainer)) return;
      if (range.collapsed && this.preserveToolbarSelection && this.savedRange && !this.savedRange.collapsed) return;
      if (!range.collapsed) this.preserveToolbarSelection = false;
      this.savedRange = range.cloneRange();
      const node = range.startContainer;
      const element = node instanceof Element ? node : node.parentElement;
      const cell = element?.closest<HTMLTableCellElement>("td,th");
      if (cell && this.editor.contains(cell)) { this.savedCell = cell; this.rememberCell(cell); }
      this.syncToolbarState();
      this.syncTableActions();
    };
    private syncToolbarState(): void {
      const document = this.editor.ownerDocument;
      const toolbar = this.shadowRoot?.querySelector<HTMLElement>('[role="toolbar"]');
      if (!toolbar) return;
      for (const button of toolbar.querySelectorAll<HTMLButtonElement>('button[data-command="bold"],button[data-command="italic"],button[data-command="underline"],button[data-command="strikeThrough"],button[data-command="insertUnorderedList"],button[data-command="insertOrderedList"]')) {
        try { button.setAttribute("aria-pressed", String(document.queryCommandState(button.dataset.command!))); }
        catch { button.setAttribute("aria-pressed", "false"); }
      }
      const format = toolbar.querySelector<HTMLSelectElement>('select[data-command="formatBlock"]');
      if (format) {
        try {
          const block = document.queryCommandValue("formatBlock").replace(/[<>]/g, "").toUpperCase();
          format.value = [...format.options].some(option => option.value === block) ? block : "P";
        } catch { format.value = "P"; }
      }
      const selection = this.selection();
      const node = selection?.anchorNode && this.editor.contains(selection.anchorNode) ? selection.anchorNode : this.savedRange?.startContainer;
      const element = node instanceof Element ? node : node?.parentElement;
      if (element && this.editor.contains(element)) {
        const computed = this.editor.ownerDocument.defaultView?.getComputedStyle(element);
        const family = toolbar.querySelector<HTMLSelectElement>('select[data-command="fontFamily"]');
        const size = toolbar.querySelector<HTMLSelectElement>('select[data-command="fontSize"]');
        if (family && computed) family.value = [...family.options].some(option => option.value === computed.fontFamily) ? computed.fontFamily : "";
        if (size && computed) size.value = Object.entries(FONT_SIZE_PX).find(([, px]) => px === computed.fontSize)?.[0] ?? "";
      }
    }
    private onEditorClick = (event: MouseEvent): void => {
      const cell = event.composedPath().find((node): node is HTMLTableCellElement => node instanceof HTMLTableCellElement && this.editor.contains(node));
      if (cell) { this.savedCell = cell; this.rememberCell(cell); }
      this.onSelectionChange();
    };
    private syncTableActions(): void {
      const cell = this.selectedCell();
      const table = cell?.closest("table");
      const hasSpans = Boolean(table && [...table.querySelectorAll<HTMLTableCellElement>("td,th")].some(cell => cell.rowSpan !== 1 || cell.colSpan !== 1));
      const rowCount = table?.rows.length ?? 0;
      const columnCount = table ? Math.min(...[...table.rows].map(row => row.cells.length)) : 0;
      const tableGroup = this.shadowRoot?.querySelector<HTMLElement>(".toolbar-group--table");
      if (tableGroup) tableGroup.hidden = this.contentMode === "restricted" || this.contentMode === "plain" || !cell || !table;
      this.shadowRoot?.querySelectorAll<HTMLButtonElement>("button[data-table-command]").forEach(button => {
        const command = button.dataset.tableCommand;
        button.disabled = !cell || !table || hasSpans || (command === "deleteRow" && rowCount <= 1) || (command === "deleteColumn" && columnCount <= 1);
      });
    }
    private restoreSelection(): void {
      const selection = this.selection();
      const liveRange = selection?.rangeCount ? selection.getRangeAt(0) : undefined;
      if ((!liveRange || !this.editor.contains(liveRange.commonAncestorContainer)) && this.editor.matches(":focus")) return;
      this.editor.focus();
      if (!selection || !this.savedRange || !this.editor.contains(this.savedRange.commonAncestorContainer)) return;
      selection.removeAllRanges();
      selection.addRange(this.savedRange);
    }
    private applyInlineStyle(property: "color" | "background-color" | "font-family" | "font-size", value: string): void {
      this.restoreSelection();
      const selection = this.selection();
      const liveRange = selection?.rangeCount ? selection.getRangeAt(0) : undefined;
      const range = liveRange && this.editor.contains(liveRange.commonAncestorContainer) ? liveRange : this.savedRange;
      if (!range || range.collapsed || !this.editor.contains(range.commonAncestorContainer)) return;
      const command = property === "color" ? "foreColor" : property === "background-color" ? "hiliteColor" : property === "font-family" ? "fontName" : "fontSize";
      const document = this.editor.ownerDocument;
      document.execCommand("styleWithCSS", false, "true");
      const applied = document.execCommand(command, false, value);
      if (command === "hiliteColor" && !applied) document.execCommand("backColor", false, value);
      this.commitEditorValue();
    }
    private editTable(command: string): void {
      const cell = this.selectedCell();
      const table = cell?.closest<HTMLTableElement>("table");
      const merged = Boolean(table && [...table.querySelectorAll<HTMLTableCellElement>("td,th")].some(item => item.rowSpan !== 1 || item.colSpan !== 1));
      if (!cell || !table || merged) return;
      let focusCell: HTMLTableCellElement | undefined;
      if (command === "deleteTable") {
        table.remove();
        this.savedRange = undefined;
        this.savedCell = undefined;
        this.selectedTablePath = undefined;
      } else if (command === "insertRowAbove" || command === "insertRowBelow") {
        const source = cell.parentElement as HTMLTableRowElement;
        const row = source.cloneNode(true) as HTMLTableRowElement;
        for (const clone of [...row.cells]) { clone.replaceChildren(document.createElement("br")); }
        source.parentElement?.insertBefore(row, command === "insertRowAbove" ? source : source.nextSibling);
        focusCell = row.cells[cell.cellIndex];
      } else if (command === "insertColumnBefore" || command === "insertColumnAfter") {
        const index = cell.cellIndex + (command === "insertColumnAfter" ? 1 : 0);
        for (const row of [...table.rows]) {
          const isHeader = row.parentElement?.tagName === "THEAD";
          const next = document.createElement(isHeader ? "th" : "td");
          if (isHeader) next.setAttribute("scope", "col");
          next.append(document.createElement("br"));
          row.insertBefore(next, row.cells[index] ?? null);
          if (row === cell.parentElement) focusCell = next;
        }
      } else if (command === "deleteRow") {
        const row = cell.parentElement as HTMLTableRowElement;
        const index = row.rowIndex;
        const cellIndex = cell.cellIndex;
        row.remove();
        const next = table.rows[Math.min(index, table.rows.length - 1)];
        focusCell = next?.cells[Math.min(cellIndex, next.cells.length - 1)];
      } else if (command === "deleteColumn") {
        const index = cell.cellIndex;
        const row = cell.parentElement as HTMLTableRowElement;
        for (const row of [...table.rows]) row.cells[index]?.remove();
        focusCell = row.cells[Math.min(index, row.cells.length - 1)];
      }
      if (focusCell) {
        this.savedCell = focusCell;
        this.rememberCell(focusCell);
        const range = document.createRange();
        range.selectNodeContents(focusCell);
        range.collapse(true);
        this.savedRange = range;
        this.restoreSelection();
      } else this.editor.focus();
      this.commitEditorValue();
    }
    private command(command: string, value?: string): void {
      if ((this.contentMode === "plain" && !["undo", "redo"].includes(command)) || (this.contentMode === "restricted" && ["insertTable", "insertImage", "insertRowAbove", "insertRowBelow", "insertColumnBefore", "insertColumnAfter", "deleteRow", "deleteColumn", "deleteTable", "foreColor", "hiliteColor", "fontFamily", "fontSize"].includes(command)) || (command === "createLink" && !this.allowHyperlinks)) return;
      if (command === "formatBlock" && !["P", "H1", "H2", "H3", "BLOCKQUOTE", "PRE"].includes(value?.toUpperCase() ?? "")) return;
      if (command === "insertImage") { this.imageInput?.click(); return; }
      if (["insertRowAbove", "insertRowBelow", "insertColumnBefore", "insertColumnAfter", "deleteRow", "deleteColumn", "deleteTable"].includes(command)) { this.editTable(command); return; }
      if (command === "createLink") { this.openLinkEditor(); return; }
      this.restoreSelection();
      if (command === "insertTable") value = '<table><caption><br></caption><thead><tr><th scope="col"><br></th><th scope="col"><br></th></tr></thead><tbody><tr><td><br></td><td><br></td></tr><tr><td><br></td><td><br></td></tr></tbody></table><p><br></p>';
      const applied = this.editor.ownerDocument.execCommand(command === "insertTable" ? "insertHTML" : command, false, command === "formatBlock" ? `<${value?.toLowerCase() ?? "p"}>` : value);
      if (command === "hiliteColor" && !applied) this.editor.ownerDocument.execCommand("backColor", false, value);
      this.commitEditorValue();
    }
    private linkAtRange(range?: Range): HTMLAnchorElement | undefined {
      const node = range?.startContainer;
      const element = node instanceof Element ? node : node?.parentElement;
      const link = element?.closest<HTMLAnchorElement>("a");
      return link && this.editor.contains(link) ? link : undefined;
    }
    private openLinkEditor(): void {
      if (!this.linkForm || this.formDisabled || this.hasAttribute("disabled") || this.hasAttribute("read-only")) return;
      const selection = this.selection();
      const activeRange = selection?.rangeCount ? selection.getRangeAt(0) : undefined;
      if (activeRange && this.editor.contains(activeRange.commonAncestorContainer)) this.savedRange = activeRange.cloneRange();
      if (!this.savedRange || !this.editor.contains(this.savedRange.commonAncestorContainer)) {
        const range = this.editor.ownerDocument.createRange();
        range.selectNodeContents(this.editor);
        range.collapse(false);
        this.savedRange = range;
      }
      const link = this.linkAtRange(this.savedRange);
      this.linkUrlInput!.value = link?.getAttribute("href") ?? "";
      this.linkTextInput!.value = link?.textContent ?? this.savedRange.toString();
      this.linkTitleInput!.value = link?.getAttribute("title") ?? "";
      this.linkNewTabInput!.checked = link?.getAttribute("target") === "_blank";
      this.linkRemoveButton!.hidden = !link;
      this.linkError!.hidden = true;
      this.linkUrlInput!.removeAttribute("aria-invalid");
      this.linkForm.hidden = false;
      this.linkEditorVersion++;
      this.linkUrlInput!.focus();
      this.linkUrlInput!.select();
    }
    private closeLinkEditor(restoreEditor: boolean): void {
      if (!this.linkForm) return;
      this.linkForm.hidden = true;
      this.linkEditorVersion++;
      this.linkError!.hidden = true;
      this.linkUrlInput!.removeAttribute("aria-invalid");
      if (restoreEditor) this.restoreSelection();
      else this.shadowRoot?.querySelector<HTMLButtonElement>('button[data-command="createLink"]')?.focus();
    }
    private async browseLink(): Promise<void> {
      const picker = this.linkPickerValue;
      if (!picker || this.pickingLink || this.formDisabled || this.hasAttribute("disabled") || this.hasAttribute("read-only")) return;
      const version = this.linkEditorVersion;
      const existing = this.linkAtRange(this.savedRange);
      const currentLink: RichTextEditorLink | null = existing ? {
        href: existing.getAttribute("href") ?? "",
        text: this.linkTextInput?.value ?? existing.textContent ?? "",
        title: this.linkTitleInput?.value ?? existing.getAttribute("title") ?? "",
        openInNewTab: this.linkNewTabInput?.checked ?? existing.getAttribute("target") === "_blank",
      } : null;
      this.pickingLink = true;
      this.linkError!.hidden = true;
      this.syncLinkPickerButton();
      try {
        const result = await picker(currentLink);
        if (!result || !this.isConnected || version !== this.linkEditorVersion || this.linkForm?.hidden) return;
        if (typeof result.href !== "string" || !safeHref(result.href)) throw new Error(this.getAttribute("link-invalid-message") ?? "Enter a valid HTTP, HTTPS, or mailto link.");
        this.linkUrlInput!.value = result.href;
        if (typeof result.text === "string") this.linkTextInput!.value = result.text;
        if (typeof result.title === "string") this.linkTitleInput!.value = result.title.slice(0, 512);
        if (typeof result.openInNewTab === "boolean") this.linkNewTabInput!.checked = result.openInNewTab;
        this.linkTextInput!.focus();
      } catch (error) {
        if (!this.isConnected || version !== this.linkEditorVersion || this.linkForm?.hidden) return;
        this.linkError!.textContent = this.getAttribute("link-picker-error-message") ?? "Unable to open the SharePoint link picker.";
        this.linkError!.hidden = false;
        this.dispatchEvent(new CustomEvent("spui-link-picker-error", { detail: { error }, bubbles: true, composed: true }));
      } finally {
        this.pickingLink = false;
        this.syncLinkPickerButton();
      }
    }
    private applyLink(): void {
      const href = this.linkUrlInput!.value.trim();
      if (!safeHref(href)) {
        this.linkError!.textContent = this.getAttribute("link-invalid-message") ?? "Enter a valid HTTP, HTTPS, or mailto link.";
        this.linkError!.hidden = false;
        this.linkUrlInput!.setAttribute("aria-invalid", "true");
        this.linkUrlInput!.focus();
        return;
      }
      const normalizedHref = new URL(href, this.editor.ownerDocument.baseURI).href;
      const displayText = this.linkTextInput!.value.trim() || href;
      const title = this.linkTitleInput!.value.trim();
      const range = this.savedRange?.cloneRange();
      const existing = this.linkAtRange(range);
      let link = existing;
      if (existing) {
        existing.setAttribute("href", normalizedHref);
      } else if (range?.collapsed) {
        link = this.editor.ownerDocument.createElement("a");
        link.href = normalizedHref;
        range.insertNode(link);
      } else {
        this.restoreSelection();
        const created = this.editor.ownerDocument.execCommand("createLink", false, normalizedHref);
        const selection = this.selection();
        link = this.linkAtRange(range) ?? this.linkAtRange(selection?.rangeCount ? selection.getRangeAt(0) : undefined);
        if (!created && !link && range && !range.collapsed) {
          link = this.editor.ownerDocument.createElement("a");
          link.href = normalizedHref;
          link.append(range.extractContents());
          range.insertNode(link);
        }
      }
      if (link) {
        if (link.textContent !== displayText) link.textContent = displayText;
        if (title) link.setAttribute("title", title); else link.removeAttribute("title");
        if (this.linkNewTabInput!.checked) { link.setAttribute("target", "_blank"); link.setAttribute("rel", "noopener noreferrer"); }
        else { link.removeAttribute("target"); link.removeAttribute("rel"); }
        const caret = this.editor.ownerDocument.createRange();
        caret.selectNodeContents(link);
        caret.collapse(false);
        this.savedRange = caret;
      }
      this.closeLinkEditor(true);
      this.commitEditorValue();
    }
    private removeLink(): void {
      const link = this.linkAtRange(this.savedRange);
      if (!link) return;
      link.replaceWith(...link.childNodes);
      this.closeLinkEditor(true);
      this.commitEditorValue();
    }
    private async insertUploadedImage(file: File): Promise<void> {
      if (!this.imageUploader || !file.type.startsWith("image/") || file.size > 10 * 1024 * 1024 || this.uploadingImage) return;
      this.uploadingImage = true; this.syncImageButton();
      try {
        const src = await this.imageUploader(file);
        if (!safeImageSrc(src)) throw new Error("Image upload must return an HTTP or HTTPS URL.");
        this.restoreSelection();
        const image = document.createElement("img"); image.src = new URL(src, document.baseURI).href; image.alt = file.name.replace(/\\.[^.]*$/, "").slice(0, 200);
        const selection = this.selection(); const range = selection?.rangeCount ? selection.getRangeAt(0) : undefined;
        if (range && this.editor.contains(range.commonAncestorContainer)) { range.deleteContents(); range.insertNode(image); range.setStartAfter(image); range.collapse(true); selection!.removeAllRanges(); selection!.addRange(range); }
        else this.editor.append(image);
        this.savedRange = range?.cloneRange(); this.commitEditorValue();
      } catch (error) {
        this.dispatchEvent(new CustomEvent("spui-image-upload-error", { detail: { fileName: file.name, error }, bubbles: true, composed: true }));
      } finally { this.uploadingImage = false; this.syncImageButton(); }
    }
    private render(): void {
      const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open" });
      const label = document.createElement("label"); label.textContent = this.getAttribute("label") ?? ""; label.hidden = !this.hasAttribute("label"); label.part.add("label");
      const toolbar = document.createElement("div"); toolbar.setAttribute("role", "toolbar"); toolbar.setAttribute("aria-orientation", "horizontal"); toolbar.part.add("toolbar");
      toolbar.addEventListener("pointerdown", () => {
        const selection = this.selection();
        const range = selection?.rangeCount ? selection.getRangeAt(0) : undefined;
        if (range && !range.collapsed && this.editor.contains(range.commonAncestorContainer)) { this.savedRange = range.cloneRange(); this.preserveToolbarSelection = true; }
      }, true);
      const format = document.createElement("select"); format.className = "toolbar-format"; format.dataset.command = "formatBlock"; format.dataset.labelAttribute = "format-block-label"; format.setAttribute("aria-label", this.getAttribute("format-block-label") ?? "Text style");
      for (const [value, attribute, fallback] of [["P", "paragraph-label", "Paragraph"], ["H1", "heading-1-label", "Heading 1"], ["H2", "heading-2-label", "Heading 2"], ["H3", "heading-3-label", "Heading 3"], ["BLOCKQUOTE", "blockquote-label", "Quote"], ["PRE", "preformatted-label", "Preformatted"]]) {
        const option = document.createElement("option"); option.value = value; option.dataset.labelAttribute = attribute; option.textContent = this.getAttribute(attribute) ?? fallback; format.append(option);
      }
      format.addEventListener("change", () => this.command("formatBlock", format.value));
      toolbar.append(format);
      const fontGroup = document.createElement("div"); fontGroup.className = "toolbar-group toolbar-group--fonts";
      const addFontSelect = (command: string, labelAttribute: string, fallback: string, options: Array<[string, string]>): void => {
        const select = document.createElement("select"); select.className = "toolbar-format toolbar-font-select"; select.dataset.command = command; select.dataset.labelAttribute = labelAttribute; select.setAttribute("aria-label", this.getAttribute(labelAttribute) ?? fallback);
        for (const [value, text] of options) { const option = document.createElement("option"); option.value = value; option.textContent = text; if (!value) { option.disabled = true; option.selected = true; } select.append(option); }
        select.addEventListener("change", () => this.applyInlineStyle(command === "fontFamily" ? "font-family" : "font-size", select.value));
        fontGroup.append(select);
      };
      addFontSelect("fontFamily", "font-family-label", "Font family", [["", "Font family"], ["Arial", "Arial"], ["Calibri", "Calibri"], ["Georgia", "Georgia"], ["Segoe UI", "Segoe UI"], ["Tahoma", "Tahoma"], ["Times New Roman", "Times New Roman"], ["Verdana", "Verdana"]]);
      addFontSelect("fontSize", "font-size-label", "Font size", [["", "Font size"], ["1", "10 px"], ["2", "12 px"], ["3", "16 px"], ["4", "18 px"], ["5", "24 px"], ["6", "32 px"], ["7", "48 px"]]);
      toolbar.append(fontGroup);
      const actions: Array<[string,string,string?,string?,string?]> = [["Bold","bold"],["Italic","italic"],["Underline","underline"],["Strikethrough","strikeThrough",undefined,undefined,"strike-label"],["Bulleted list","insertUnorderedList",undefined,"• List"],["Numbered list","insertOrderedList",undefined,"1. List"],["Clear formatting","removeFormat",undefined,undefined,"clear-formatting-label"],["Undo","undo"],["Redo","redo"],["Insert table","insertTable"],["Insert image","insertImage",undefined,undefined,"insert-image-label"],["Insert row above","insertRowAbove",undefined,undefined,"insert-row-above-label"],["Insert row below","insertRowBelow",undefined,undefined,"insert-row-below-label"],["Insert column before","insertColumnBefore",undefined,undefined,"insert-column-before-label"],["Insert column after","insertColumnAfter",undefined,undefined,"insert-column-after-label"],["Delete row","deleteRow",undefined,undefined,"delete-row-label"],["Delete column","deleteColumn",undefined,undefined,"delete-column-label"],["Delete table","deleteTable",undefined,undefined,"delete-table-label"],["Link","createLink"]];
      const toolbarGroups = new Map<string, HTMLDivElement>();
      for (const [title, command, value, , labelAttribute] of actions) {
        const isTableAction = command.startsWith("insertRow") || command.startsWith("insertColumn") || command.startsWith("delete");
        const groupName = isTableAction ? "table" : ["bold", "italic", "underline", "strikeThrough", "removeFormat"].includes(command) ? "formatting" : ["insertUnorderedList", "insertOrderedList"].includes(command) ? "lists" : ["undo", "redo"].includes(command) ? "history" : "insert";
        let group = toolbarGroups.get(groupName);
        if (!group) {
          group = document.createElement("div"); group.className = `toolbar-group toolbar-group--${groupName}`;
          if (groupName === "table") group.hidden = true;
          toolbarGroups.set(groupName, group); toolbar.append(group);
        }
        const button = document.createElement("button"); button.type = "button"; button.dataset.command = command; button.dataset.fallback = title;
        if (labelAttribute) button.dataset.labelAttribute = labelAttribute;
        if (isTableAction) button.dataset.tableCommand = command;
        button.tabIndex = toolbar.querySelector("button[data-command],select[data-command]") ? -1 : 0; button.append(createToolbarIcon(command)); button.setAttribute("aria-label", title); button.title = title;
        button.addEventListener("mousedown", event => event.preventDefault()); button.addEventListener("click", () => this.command(command, value));
        group.append(button);
      }
      const colorGroup = document.createElement("div"); colorGroup.className = "toolbar-group toolbar-group--color";
      for (const [attribute, fallback, command, color, colors] of [
        ["text-color-label", "Text color", "foreColor", "#323130", ["#000000", "#323130", "#605e5c", "#a4262c", "#d83b01", "#ca5010", "#8e562e", "#498205", "#038387", "#0078d4", "#5c2d91", "#b4009e"]],
        ["highlight-color-label", "Highlight color", "hiliteColor", "#fff2cc", ["#fff2cc", "#fff4ce", "#fed9cc", "#fce100", "#e2f2d5", "#c8e6e0", "#cfe4fa", "#e7d8f5", "#f4d5ef", "#f3f2f1", "#d2d0ce", "#ffffff"]]
      ] as Array<[string, string, string, string, string[]]>) {
        const picker = document.createElement("details"); picker.className = "toolbar-color"; picker.dataset.labelAttribute = attribute; picker.dataset.command = command; picker.part.add(command === "foreColor" ? "text-color" : "highlight-color");
        const summary = document.createElement("summary"); summary.setAttribute("aria-label", this.getAttribute(attribute) ?? fallback); summary.title = this.getAttribute(attribute) ?? fallback;
        const glyph = document.createElement("span"); glyph.className = "toolbar-color__glyph"; glyph.setAttribute("aria-hidden", "true"); glyph.textContent = command === "foreColor" ? "A" : "▰";
        const swatch = document.createElement("span"); swatch.className = "toolbar-color__current"; swatch.style.setProperty("--spui-picked-color", color); swatch.setAttribute("aria-hidden", "true");
        const name = document.createElement("span"); name.className = "toolbar-color__name"; name.textContent = this.getAttribute(attribute) ?? fallback;
        summary.append(glyph, swatch, name); summary.addEventListener("mousedown", this.onSelectionChange); picker.append(summary);
        const palette = document.createElement("div"); palette.className = "toolbar-color__palette"; palette.setAttribute("role", "group"); palette.setAttribute("aria-label", this.getAttribute(attribute) ?? fallback);
        for (const value of ["theme-accent", ...colors]) {
          const isThemeAccent = value === "theme-accent";
          const option = document.createElement("button"); option.type = "button"; option.className = "toolbar-color__swatch"; option.style.setProperty("--spui-picked-color", isThemeAccent ? "var(--spui-ui-accent,#0078d4)" : value); option.dataset.color = value;
          option.addEventListener("mousedown", this.onSelectionChange); option.addEventListener("click", () => { const selected = isThemeAccent ? getComputedStyle(this).getPropertyValue("--spui-ui-accent").trim() || "#0078d4" : value; swatch.style.setProperty("--spui-picked-color", selected); this.command(command, selected); picker.open = false; }); palette.append(option);
        }
        const custom = document.createElement("label"); custom.className = "toolbar-color__custom"; custom.dataset.labelAttribute = "custom-color-label"; custom.append(document.createTextNode(this.getAttribute("custom-color-label") ?? "Custom color"));
        const input = document.createElement("input"); input.type = "color"; input.value = color; input.dataset.command = command; input.dataset.labelAttribute = attribute; input.setAttribute("aria-label", `${this.getAttribute(attribute) ?? fallback}: ${this.getAttribute("custom-color-label") ?? "custom color"}`); input.addEventListener("mousedown", this.onSelectionChange); input.addEventListener("input", () => swatch.style.setProperty("--spui-picked-color", input.value)); input.addEventListener("change", () => { swatch.style.setProperty("--spui-picked-color", input.value); this.command(command, input.value); picker.open = false; }); custom.append(input); palette.append(custom); picker.append(palette); colorGroup.append(picker);
      }
      toolbar.append(colorGroup);
      this.imageInput = document.createElement("input"); this.imageInput.type = "file"; this.imageInput.accept = "image/*"; this.imageInput.hidden = true; this.imageInput.setAttribute("aria-label", this.getAttribute("image-input-label") ?? "Choose image"); this.imageInput.addEventListener("change", () => { const file = this.imageInput?.files?.[0]; if (file) void this.insertUploadedImage(file); this.imageInput!.value = ""; }); toolbar.append(this.imageInput);
      const linkForm = document.createElement("form"); this.linkForm = linkForm; linkForm.className = "link-editor"; linkForm.part.add("link-editor"); linkForm.hidden = true; linkForm.setAttribute("aria-label", this.getAttribute("link-dialog-label") ?? "Edit link");
      const makeLinkField = (attribute: string, fallback: string, type = "text"): HTMLInputElement => {
        const field = document.createElement("label"); field.className = "link-field"; field.dataset.labelAttribute = attribute; field.append(document.createTextNode(this.getAttribute(attribute) ?? fallback));
        const input = document.createElement("input"); input.type = type; input.part.add(attribute === "link-prompt" ? "link-url" : attribute === "link-text-label" ? "link-text" : "link-title"); field.append(input); linkForm.append(field); return input;
      };
      this.linkUrlInput = makeLinkField("link-prompt", "Link URL"); this.linkUrlInput.inputMode = "url"; this.linkUrlInput.setAttribute("autocomplete", "url"); this.linkUrlInput.placeholder = "https://";
      this.linkTextInput = makeLinkField("link-text-label", "Display text");
      this.linkTitleInput = makeLinkField("link-title-label", "Title"); this.linkTitleInput.maxLength = 512;
      const newTabLabel = document.createElement("label"); newTabLabel.className = "link-new-tab"; newTabLabel.part.add("link-new-tab"); newTabLabel.dataset.labelAttribute = "link-new-tab-label";
      this.linkNewTabInput = document.createElement("input"); this.linkNewTabInput.type = "checkbox"; this.linkNewTabInput.part.add("link-new-tab-checkbox");
      const newTabText = document.createElement("span"); newTabText.textContent = this.getAttribute("link-new-tab-label") ?? "Open in new tab"; newTabLabel.append(this.linkNewTabInput, newTabText); linkForm.append(newTabLabel);
      this.linkError = document.createElement("div"); this.linkError.className = "link-error"; this.linkError.part.add("link-error"); this.linkError.id = `rich-text-link-error-${crypto.randomUUID()}`; this.linkError.setAttribute("role", "alert"); this.linkError.hidden = true; linkForm.append(this.linkError);
      this.linkPickerStatus = document.createElement("div"); this.linkPickerStatus.className = "link-picker-status"; this.linkPickerStatus.setAttribute("role", "status"); this.linkPickerStatus.setAttribute("aria-live", "polite"); linkForm.append(this.linkPickerStatus);
      this.linkUrlInput.setAttribute("aria-describedby", this.linkError.id);
      const linkActions = document.createElement("div"); linkActions.className = "link-actions";
      const makeLinkAction = (action: "apply" | "remove" | "cancel" | "browse", attribute: string, fallback: string, onClick: () => void): HTMLButtonElement => {
        const button = document.createElement("button"); button.type = action === "apply" ? "submit" : "button"; button.dataset.linkAction = action; button.dataset.labelAttribute = attribute; button.part.add(`link-${action}`); button.textContent = this.getAttribute(attribute) ?? fallback; button.addEventListener("click", onClick); linkActions.append(button); return button;
      };
      makeLinkAction("apply", "link-apply-label", "Apply link", () => {});
      this.linkRemoveButton = makeLinkAction("remove", "link-remove-label", "Remove link", () => this.removeLink());
      this.linkPickerButton = makeLinkAction("browse", "link-picker-label", "Browse SharePoint", () => { void this.browseLink(); });
      makeLinkAction("cancel", "link-cancel-label", "Cancel", () => this.closeLinkEditor(false));
      linkForm.append(linkActions);
      linkForm.addEventListener("submit", event => { event.preventDefault(); this.applyLink(); });
      linkForm.addEventListener("keydown", event => { if ((event as KeyboardEvent).key === "Escape") { event.preventDefault(); event.stopPropagation(); this.closeLinkEditor(false); } });
      toolbar.querySelectorAll<HTMLElement>("button[data-command],select[data-command],input[type=color][data-command]").forEach((control,index) => { control.tabIndex = index === 0 ? 0 : -1; });
      toolbar.addEventListener("focusin", event => { const active = event.target; toolbar.querySelectorAll<HTMLElement>("button[data-command],select[data-command],input[type=color][data-command]").forEach(control => { control.tabIndex = control === active ? 0 : -1; }); });
      toolbar.addEventListener("keydown", event => {
        const key = (event as KeyboardEvent).key;
        if ((event.target instanceof HTMLSelectElement || event.target instanceof HTMLInputElement) && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(key)) return;
        const controls = [...toolbar.querySelectorAll<HTMLElement>("button[data-command]:not(:disabled):not([hidden]),select[data-command]:not(:disabled):not([hidden]),input[type=color][data-command]:not(:disabled):not([hidden])")];
        const current = controls.indexOf(event.target as HTMLElement);
        const rtl = getComputedStyle(this).direction === "rtl";
        const step = key === "ArrowRight" ? (rtl ? -1 : 1) : key === "ArrowLeft" ? (rtl ? 1 : -1) : 0;
        const index = key === "Home" ? 0 : key === "End" ? controls.length - 1 : step ? (current + step + controls.length) % controls.length : -1;
        if (index < 0 || !controls[index]) return;
        event.preventDefault(); controls[index].tabIndex = 0; controls.forEach((control, controlIndex) => { if (controlIndex !== index) control.tabIndex = -1; }); controls[index].focus();
      });
      this.editor = document.createElement("div"); this.editor.setAttribute("role", "textbox"); this.editor.setAttribute("aria-multiline", "true"); this.syncEditorLabel(); const invalid = this.getAttribute("aria-invalid"); if (invalid !== null) this.editor.setAttribute("aria-invalid", invalid); this.editor.contentEditable = this.hasAttribute("disabled") || this.hasAttribute("read-only") ? "false" : this.contentMode === "plain" ? "plaintext-only" : "true"; this.editor.setAttribute("aria-readonly", String(this.hasAttribute("read-only"))); this.editor.setAttribute("aria-disabled", String(this.hasAttribute("disabled"))); this.editor.setAttribute("aria-required", String(this.hasAttribute("required"))); this.editor.dataset.placeholder = this.getAttribute("placeholder") ?? "Write something…"; this.editor.part.add("editor");
      this.editor.addEventListener("keydown", event => { const key = (event as KeyboardEvent).key.toLowerCase(); const shortcut = (event as KeyboardEvent).metaKey || (event as KeyboardEvent).ctrlKey; if (!shortcut) return; if (key === "z") { event.preventDefault(); this.command((event as KeyboardEvent).shiftKey ? "redo" : "undo"); } else if (key === "y") { event.preventDefault(); this.command("redo"); } });
      this.editor.addEventListener("beforeinput", event => {
        if (!this.probingSelection) return;
        const targetRange = (event as InputEvent & { getTargetRanges?: () => StaticRange[] }).getTargetRanges?.()[0];
        if (targetRange && this.editor.contains(targetRange.startContainer) && this.editor.contains(targetRange.endContainer)) {
          const range = this.editor.ownerDocument.createRange();
          range.setStart(targetRange.startContainer, targetRange.startOffset);
          range.setEnd(targetRange.endContainer, targetRange.endOffset);
          this.probedSelection = range;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
      }, true);
      this.editor.addEventListener("input", () => this.commitEditorValue());
      this.editor.addEventListener("pointerdown", () => { this.preserveToolbarSelection = false; });
      this.editor.addEventListener("mouseup", this.onSelectionChange);
      this.editor.addEventListener("keyup", this.onSelectionChange);
      this.editor.addEventListener("click", this.onEditorClick);
      this.editor.addEventListener("paste", event => {
        event.preventDefault();
        const clipboard = (event as ClipboardEvent).clipboardData;
        if (this.contentMode === "plain" || this.contentMode === "restricted") {
          this.editor.ownerDocument.execCommand("insertText", false, clipboard?.getData("text/plain") ?? plainText(clipboard?.getData("text/html") ?? ""));
          this.commitEditorValue();
          return;
        }
        const imageFile = [...(clipboard?.files ?? [])].find(file => file.type.startsWith("image/"));
        if (imageFile) { void this.insertUploadedImage(imageFile); return; }
        const html = cleanHtml(clipboard?.getData("text/html") ?? clipboard?.getData("text/plain") ?? "", this.contentMode, this.allowHyperlinks);
        const text = clipboard?.getData("text/plain") ?? "";
        if (html) this.editor.ownerDocument.execCommand("insertHTML", false, html);
        else this.editor.ownerDocument.execCommand("insertText", false, text);
        this.commitEditorValue();
      });
      this.editor.addEventListener("blur", () => this.commitEditorValue("spui-change"));
      const style = document.createElement("style"); style.textContent = `${base}:host{display:grid;min-width:0;max-width:100%;container-type:inline-size;gap:6px}label{font-weight:600;color:var(--spui-ui-muted,var(--spui-semantic-body-text,inherit))}[role=toolbar]{display:flex;flex-wrap:wrap;align-items:center;gap:4px;padding:6px;border:1px solid var(--spui-control-border,var(--spui-ui-stroke,#c8c8c8));border-radius:var(--spui-control-radius,6px);background:var(--spui-ui-surface,#fff)}[role=toolbar][hidden],button[hidden]{display:none}.toolbar-group{display:flex;flex:0 1 auto;flex-wrap:wrap;align-items:center;gap:2px;min-width:0;padding-inline-start:6px;border-inline-start:1px solid var(--spui-ui-stroke,#c8c8c8)}.toolbar-group[hidden]{display:none}button{box-sizing:border-box;display:inline-grid;place-items:center;flex:none;width:36px;min-width:36px;min-height:36px;padding:0;border:0;border-radius:var(--spui-control-radius,4px);background:transparent;color:var(--spui-ui-text,inherit);font:inherit;cursor:pointer}.toolbar-format{box-sizing:border-box;max-width:172px;min-width:116px;min-height:36px;padding:0 8px;border:1px solid var(--spui-control-border,var(--spui-ui-stroke,#c8c8c8));border-radius:var(--spui-control-radius,4px);background:var(--spui-control-background,var(--spui-ui-surface,#fff));color:var(--spui-ui-text,inherit);font:inherit}.toolbar-format:hover{background:var(--spui-ui-surface-hover,#eee)}button svg{display:block;width:18px;height:18px}button:hover:not(:disabled){background:var(--spui-ui-surface-hover,#eee)}button[aria-pressed=true]{background:color-mix(in srgb,var(--spui-ui-accent,#0078d4) 14%,var(--spui-ui-surface,#fff));color:var(--spui-ui-text,var(--spui-semantic-body-text,#323130))}button:disabled{opacity:.42;cursor:not-allowed}button:focus-visible,select:focus-visible,[role=textbox]:focus-visible,input:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#005a9e));outline-offset:2px}[role=textbox]{min-width:0;min-height:150px;box-sizing:border-box;padding:10px 12px;border:1px solid var(--spui-control-border,var(--spui-ui-stroke,#c8c8c8));border-radius:var(--spui-control-radius,6px);background:var(--spui-control-background,var(--spui-ui-surface,#fff));color:var(--spui-ui-text,inherit);font:inherit;line-height:1.5;overflow:auto;caret-color:var(--spui-focus-ring,var(--spui-ui-accent,#005a9e))}[role=textbox]:empty:before{content:attr(data-placeholder);color:var(--spui-ui-muted,#666);pointer-events:none}table{border-collapse:collapse;max-width:100%;margin-block:8px}caption{text-align:start;font-weight:600}td,th{min-width:56px;padding:6px 9px;border:1px solid var(--spui-ui-stroke,#c8c8c8);text-align:start}th{background:var(--spui-ui-surface-hover,#f5f5f5);font-weight:600}a{color:var(--spui-semantic-link,#0f6cbd)}@media(pointer:coarse){[role=toolbar] button{width:44px;min-width:44px;min-height:44px}[role=toolbar] select{min-height:44px}}@container (max-width: 64rem){[role=toolbar]{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:8px}.toolbar-format{flex:1 0 100%;width:100%;max-width:none;min-width:0;min-height:40px}.toolbar-group{display:flex;flex:0 1 auto;flex-wrap:wrap;align-items:center;gap:4px;min-width:0;padding:0;border:0}.toolbar-group--fonts{display:grid;flex:1 0 100%;grid-template-columns:repeat(2,minmax(0,1fr))}.toolbar-font-select{width:100%;max-width:none;min-width:0;min-height:44px}.toolbar-group button{width:44px;min-width:44px;min-height:44px}.toolbar-group--table{flex:1 0 100%}[role=textbox]{min-height:12rem;overflow-wrap:anywhere}table{display:block;overflow-x:auto}}@media(forced-colors:active){select{border:1px solid ButtonText;background:Field;color:FieldText}button{border:1px solid ButtonText}button[aria-pressed=true]{color:Highlight;border-color:Highlight}td,th{border-color:CanvasText}}`;
      style.textContent += `.link-editor{display:flex;flex-wrap:wrap;align-items:end;gap:8px;padding:8px;border:1px solid var(--spui-ui-stroke,#c8c8c8);border-radius:var(--spui-control-radius,6px);background:var(--spui-ui-surface-hover,var(--spui-ui-surface,#fff))}.link-editor[hidden]{display:none}.link-field{display:grid;flex:1 1 150px;gap:4px;min-width:0;color:var(--spui-ui-text,inherit);font-size:13px}.link-field input{box-sizing:border-box;width:100%;min-width:0;min-height:32px;padding:5px 8px;border:1px solid var(--spui-control-border,var(--spui-ui-stroke,#8a8886));border-radius:var(--spui-control-radius,4px);background:var(--spui-control-background,var(--spui-ui-surface,#fff));color:var(--spui-ui-text,inherit)}.link-actions{display:flex;flex-wrap:wrap;gap:4px}.link-actions button{border:1px solid var(--spui-ui-stroke,#c8c8c8);border-radius:var(--spui-control-radius,4px);background:var(--spui-ui-surface,#fff)}.link-actions [data-link-action=apply]{border-color:transparent;background:var(--spui-semantic-primary-button-background,var(--spui-ui-accent,#0078d4));color:var(--spui-ui-accent-text,#fff)}.link-error{flex:1 0 100%;color:var(--spui-ui-danger,var(--spui-semantic-error-text,#c50f1f));font-size:13px}`;
      style.textContent += `[role=textbox],[role=textbox] *{-webkit-user-select:text!important;user-select:text!important;-webkit-touch-callout:default;touch-action:auto}`;
      style.textContent += `.toolbar-group--fonts{gap:4px}.toolbar-font-select{width:100%;min-width:0}.toolbar-group--color{gap:6px;padding-inline:8px}.toolbar-color{position:relative;min-width:0}.toolbar-color>summary{box-sizing:border-box;display:flex;align-items:center;gap:5px;min-height:36px;padding:4px 7px;border:1px solid var(--spui-control-border,var(--spui-ui-stroke,#c8c8c8));border-radius:var(--spui-control-radius,5px);background:var(--spui-control-background,var(--spui-ui-surface,#fff));color:var(--spui-ui-text,inherit);font-size:11px;font-weight:600;cursor:pointer;list-style:none}.toolbar-color>summary::-webkit-details-marker{display:none}.toolbar-color__glyph{font-size:17px;line-height:1}.toolbar-color[data-command=foreColor] .toolbar-color__glyph{border-bottom:3px solid var(--spui-picked-color)}.toolbar-color[data-command=hiliteColor] .toolbar-color__glyph{color:var(--spui-picked-color);text-shadow:0 0 0 var(--spui-picked-color)}.toolbar-color__current{width:16px;height:16px;border:1px solid color-mix(in srgb,var(--spui-ui-text,#323130) 22%,transparent);border-radius:4px;background:var(--spui-picked-color);flex:none}.toolbar-color__name{white-space:nowrap}.toolbar-color__palette{position:absolute;z-index:10;inset-block-start:calc(100% + 4px);inset-inline-start:0;display:grid;grid-template-columns:repeat(6,28px);gap:4px;min-width:196px;padding:8px;border:1px solid var(--spui-ui-stroke,#c8c8c8);border-radius:8px;background:var(--spui-ui-surface,#fff);box-shadow:0 8px 24px #0003}.toolbar-color__swatch{width:28px;min-width:28px;height:28px;min-height:28px;padding:0;border:1px solid color-mix(in srgb,var(--spui-ui-text,#323130) 22%,transparent);border-radius:50%;background:var(--spui-picked-color);cursor:pointer}.toolbar-color__swatch:hover{outline:2px solid var(--spui-ui-accent,#0078d4);outline-offset:1px}.toolbar-color__custom{grid-column:1/-1;display:flex;align-items:center;gap:8px;padding-block-start:6px;border-block-start:1px solid var(--spui-ui-stroke,#ddd);font-size:12px;font-weight:500}.toolbar-color__custom input{box-sizing:border-box;width:42px;height:34px;min-height:34px;padding:2px;border:1px solid var(--spui-control-border,var(--spui-ui-stroke,#c8c8c8));border-radius:5px;background:var(--spui-control-background,var(--spui-ui-surface,#fff));cursor:pointer}.toolbar-color input:disabled{opacity:.42;cursor:not-allowed}@container (max-width:64rem){.toolbar-group--fonts{grid-template-columns:repeat(2,minmax(0,1fr))}.toolbar-font-select{width:100%;min-width:0;max-width:none;min-height:44px}.toolbar-group--color{display:flex;flex-wrap:wrap;justify-content:start;padding:0}.toolbar-color>summary{min-height:44px;padding-inline:9px}.toolbar-color__palette{grid-template-columns:repeat(6,32px);min-width:220px}.toolbar-color__swatch{width:32px;min-width:32px;height:32px;min-height:32px}}`;
      style.textContent += `.link-new-tab{display:inline-flex;flex:1 0 100%;align-items:center;gap:8px;color:var(--spui-ui-text,inherit);font-size:13px}.link-new-tab input{width:16px;height:16px;min-height:16px;margin:0;accent-color:var(--spui-ui-accent,#0078d4)}`;
      style.textContent += `.link-picker-status{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}.toolbar-color>summary[aria-disabled=true]{opacity:.42;cursor:not-allowed}`;
      style.textContent += `.toolbar-color>summary:focus-visible,.toolbar-color__swatch:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#005a9e));outline-offset:2px}`;
      shadow.replaceChildren(style,label,toolbar,linkForm,this.editor);
      syncHostAccessibleName(this, this.editor);
      this.syncDisabled();
      this.refreshStrings();
      this.syncContentMode();
      this.onSelectionChange();
    }
    private refreshStrings(): void {
      const toolbar = this.shadowRoot?.querySelector<HTMLElement>('[role="toolbar"]');
      if (!toolbar) return;
      this.imageInput?.setAttribute("aria-label", this.getAttribute("image-input-label") ?? "Choose image");
      const label = this.getAttribute("label") ?? "Rich text";
      toolbar.setAttribute("aria-label", this.getAttribute("toolbar-label") ?? `${label} formatting`);
      const attrs = ["bold-label","italic-label","underline-label","strike-label","bullet-list-label","number-list-label","clear-formatting-label","undo-label","redo-label","insert-table-label","insert-image-label","insert-row-above-label","insert-row-below-label","insert-column-before-label","insert-column-after-label","delete-row-label","delete-column-label","delete-table-label","link-label"];
      toolbar.querySelectorAll<HTMLButtonElement>("button[data-command]").forEach((button,index) => {
        const attribute = button.dataset.labelAttribute ?? attrs[index];
        const text = this.getAttribute(attribute) ?? button.dataset.fallback ?? "";
        button.setAttribute("aria-label", text);
        button.title = text;
      });
      const format = toolbar.querySelector<HTMLSelectElement>('select[data-command="formatBlock"]');
      if (format) {
        format.setAttribute("aria-label", this.getAttribute("format-block-label") ?? "Text style");
        const labels: Record<string, [string, string]> = { P: ["paragraph-label", "Paragraph"], H1: ["heading-1-label", "Heading 1"], H2: ["heading-2-label", "Heading 2"], H3: ["heading-3-label", "Heading 3"], BLOCKQUOTE: ["blockquote-label", "Quote"], PRE: ["preformatted-label", "Preformatted"] };
        format.querySelectorAll<HTMLOptionElement>("option").forEach(option => { const [attribute, fallback] = labels[option.value]; option.textContent = this.getAttribute(attribute) ?? fallback; });
      }
      toolbar.querySelectorAll<HTMLSelectElement>(".toolbar-font-select").forEach(select => select.setAttribute("aria-label", this.getAttribute(select.dataset.labelAttribute ?? "") ?? (select.dataset.command === "fontFamily" ? "Font family" : "Font size")));
      toolbar.querySelectorAll<HTMLElement>(".toolbar-color[data-label-attribute]").forEach(picker => {
        const text = this.getAttribute(picker.dataset.labelAttribute ?? "") ?? (picker.dataset.command === "foreColor" ? "Text color" : "Highlight color");
        const summary = picker.querySelector("summary");
        if (summary) { summary.setAttribute("aria-label", text); summary.title = text; }
        picker.querySelector<HTMLElement>(".toolbar-color__palette")?.setAttribute("aria-label", text);
        picker.querySelector<HTMLInputElement>('input[type="color"]')?.setAttribute("aria-label", `${text}: ${this.getAttribute("custom-color-label") ?? "Custom color"}`);
        const themeAccent = picker.querySelector<HTMLButtonElement>('.toolbar-color__swatch[data-color="theme-accent"]');
        if (themeAccent) { const accentLabel = this.getAttribute("theme-accent-label") ?? "SharePoint theme accent"; themeAccent.setAttribute("aria-label", accentLabel); themeAccent.title = accentLabel; }
        const swatchLabel = this.getAttribute("color-swatch-label") ?? "Select {color}";
        picker.querySelectorAll<HTMLButtonElement>('.toolbar-color__swatch:not([data-color="theme-accent"])').forEach(swatch => { const label = swatchLabel.replace(/\{color\}/g, swatch.dataset.color ?? ""); swatch.setAttribute("aria-label", label); swatch.title = label; });
        const customLabel = picker.querySelector<HTMLElement>(".toolbar-color__custom");
        if (customLabel?.firstChild?.nodeType === Node.TEXT_NODE) customLabel.firstChild.textContent = this.getAttribute("custom-color-label") ?? "Custom color";
        const name = picker.querySelector<HTMLElement>(".toolbar-color__name");
        if (name) name.textContent = text;
      });
      if (this.linkForm) {
        this.linkForm.setAttribute("aria-label", this.getAttribute("link-dialog-label") ?? "Edit link");
        const fieldFallbacks: Record<string, string> = { "link-prompt": "Link URL", "link-text-label": "Display text", "link-title-label": "Title" };
        this.linkForm.querySelectorAll<HTMLElement>(".link-field[data-label-attribute]").forEach(field => {
          const attribute = field.dataset.labelAttribute!;
          if (field.firstChild) field.firstChild.textContent = this.getAttribute(attribute) ?? fieldFallbacks[attribute] ?? "";
        });
        const actionFallbacks: Record<string, string> = { "link-apply-label": "Apply link", "link-remove-label": "Remove link", "link-cancel-label": "Cancel", "link-picker-label": "Browse SharePoint" };
        this.linkForm.querySelectorAll<HTMLButtonElement>("button[data-label-attribute]").forEach(button => {
          const attribute = button.dataset.labelAttribute!;
          button.textContent = this.getAttribute(attribute) ?? actionFallbacks[attribute] ?? "";
        });
        const newTabText = this.linkForm.querySelector<HTMLElement>(".link-new-tab span");
        if (newTabText) newTabText.textContent = this.getAttribute("link-new-tab-label") ?? "Open in new tab";
      }
      this.syncLinkPickerButton();
      this.syncTableActions();
    }
  }
  customElements.define("spui-rich-text-editor", SpuiRichTextEditor);
}
