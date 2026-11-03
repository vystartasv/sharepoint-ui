import { base, syncHostAccessibleName } from "./shared.js";

export interface SharePointRichTextEditorElement extends HTMLElement {
  value: string;
  uploadImage?: (file: File) => Promise<string>;
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

const ALLOWED = new Set(["P", "DIV", "SPAN", "BR", "HR", "STRONG", "B", "EM", "I", "U", "S", "DEL", "INS", "UL", "OL", "LI", "A", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "PRE", "TABLE", "THEAD", "TBODY", "TFOOT", "TR", "TH", "TD", "CAPTION", "SUP", "SUB", "CODE", "IMG"]);
const DROP_CONTENT = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "TEMPLATE"]);
function safeHref(value: string): boolean {
  if (/[\u0000-\u001f\u007f]/.test(value)) return false;
  try { return ["http:", "https:", "mailto:"].includes(new URL(value.trim(), document.baseURI).protocol); }
  catch { return false; }
}
function safeImageSrc(value: string): boolean {
  try { return ["http:", "https:"].includes(new URL(value.trim(), document.baseURI).protocol); } catch { return false; }
}
function cleanHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const clean = (node: Node): void => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement;
        if (DROP_CONTENT.has(element.tagName)) { child.remove(); continue; }
        if (!ALLOWED.has(element.tagName)) { clean(element); child.replaceWith(...[...child.childNodes]); continue; }
        for (const attr of [...element.attributes]) {
          const link = element.tagName === "A" && attr.name === "href" && safeHref(attr.value);
          const linkTitle = element.tagName === "A" && attr.name === "title" && attr.value.length <= 512;
          const linkTarget = element.tagName === "A" && attr.name === "target" && attr.value === "_blank";
          const linkRel = element.tagName === "A" && attr.name === "rel" && /^(noopener noreferrer|noreferrer noopener)$/i.test(attr.value.trim());
          const span = ["TD", "TH"].includes(element.tagName) && ["colspan", "rowspan"].includes(attr.name) && /^\d{1,2}$/.test(attr.value) && Number(attr.value) > 0;
          const scope = element.tagName === "TH" && attr.name === "scope" && ["row", "col", "rowgroup", "colgroup"].includes(attr.value);
          const image = element.tagName === "IMG" && ((attr.name === "src" && safeImageSrc(attr.value)) || attr.name === "alt" || ((attr.name === "width" || attr.name === "height") && /^\d{1,4}$/.test(attr.value)));
          if (!link && !linkTitle && !linkTarget && !linkRel && !span && !scope && !image) element.removeAttribute(attr.name);
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
    static observedAttributes = ["label", "editor-label", "placeholder", "disabled", "read-only", "required", "required-message", "value", "name", "aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid", "bold-label", "italic-label", "underline-label", "bullet-list-label", "number-list-label", "link-label", "undo-label", "redo-label", "insert-table-label", "insert-image-label", "image-input-label", "insert-row-above-label", "insert-row-below-label", "insert-column-before-label", "insert-column-after-label", "delete-row-label", "delete-column-label", "delete-table-label", "toolbar-label", "link-prompt", "link-dialog-label", "link-text-label", "link-title-label", "link-apply-label", "link-remove-label", "link-cancel-label", "link-new-tab-label", "link-invalid-message"];
    private editor!: HTMLDivElement;
    private internals: ElementInternals | undefined;
    private formDisabled = false;
    private pendingValue: string | undefined;
    private customError = "";
    private savedRange?: Range;
    /** Uploads to a durable asset store and returns the image URL to persist in editor HTML. */
    private imageUploader?: (file: File) => Promise<string>;
    get uploadImage(): ((file: File) => Promise<string>) | undefined { return this.imageUploader; }
    set uploadImage(value: ((file: File) => Promise<string>) | undefined) { this.imageUploader = value; this.syncImageButton(); }
    private imageInput?: HTMLInputElement;
    private linkForm?: HTMLFormElement;
    private linkUrlInput?: HTMLInputElement;
    private linkTextInput?: HTMLInputElement;
    private linkTitleInput?: HTMLInputElement;
    private linkNewTabInput?: HTMLInputElement;
    private linkError?: HTMLElement;
    private linkRemoveButton?: HTMLButtonElement;
    private uploadingImage = false;
    private savedCell?: HTMLTableCellElement;
    private selectedTablePath?: { table: number; row: number; cell: number };
    private events?: AbortController;
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
    get value(): string { return this.editor ? cleanHtml(this.editor.innerHTML) : this.pendingValue ?? this.getAttribute("value") ?? ""; }
    set value(value: string) { this.pendingValue = value; if (this.editor) { this.editor.innerHTML = cleanHtml(value); this.syncForm(); } }
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
      this.editor.contentEditable = String(!readOnly);
      this.editor.setAttribute("aria-readonly", String(this.hasAttribute("read-only")));
      this.editor.setAttribute("aria-disabled", String(disabled));
      this.shadowRoot?.querySelectorAll<HTMLButtonElement>("[role=toolbar] button").forEach(button => { button.disabled = readOnly; });
      if (this.linkForm) {
        if (readOnly) this.linkForm.hidden = true;
        this.linkForm.querySelectorAll<HTMLInputElement | HTMLButtonElement>("input,button").forEach(control => { control.disabled = readOnly; });
      }
      this.syncImageButton();
    }
    private syncImageButton(): void {
      const button = this.shadowRoot?.querySelector<HTMLButtonElement>('[data-command="insertImage"]');
      if (button) button.disabled = this.formDisabled || this.hasAttribute("disabled") || this.hasAttribute("read-only") || !this.imageUploader || this.uploadingImage;
    }
    private syncForm(): void { const value = this.value; this.pendingValue = value; this.internals?.setFormValue(value || null); const active = this.willValidate; const missing = active && this.hasAttribute("required") && !this.editor?.textContent?.trim(); const customError = active && Boolean(this.customError); const flags: ValidityStateFlags = { ...(missing ? { valueMissing: true } : {}), ...(customError ? { customError: true } : {}) }; const message = customError ? this.customError : missing ? this.getAttribute("required-message") ?? "Enter some text." : ""; try { this.internals?.setValidity(flags, message); } catch { /* Engines without form association remain editable. */ } }
    private sanitizeEditor(): void {
      const html = this.editor.innerHTML;
      const value = cleanHtml(html);
      if (value === html) return;
      const cell = this.selectedCell();
      const tableIndex = cell ? [...this.editor.querySelectorAll("table")].indexOf(cell.closest("table")!) : -1;
      const rowIndex = cell?.closest("tr")?.rowIndex ?? -1;
      const cellIndex = cell?.cellIndex ?? -1;
      this.editor.innerHTML = value;
      const restoredCell = tableIndex >= 0 && rowIndex >= 0 && cellIndex >= 0
        ? this.editor.querySelectorAll("table")[tableIndex]?.rows[rowIndex]?.cells[cellIndex]
        : undefined;
      this.savedCell = restoredCell;
      if (restoredCell) {
        const range = document.createRange();
        range.selectNodeContents(restoredCell);
        range.collapse(true);
        this.savedRange = range;
      } else this.savedRange = undefined;
      this.syncTableActions();
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
      return root instanceof ShadowRoot ? (root as ShadowRoot & { getSelection?: () => Selection | null }).getSelection?.() ?? document.getSelection() : document.getSelection();
    }
    private onSelectionChange = (): void => {
      const selection = this.selection();
      if (selection?.rangeCount) {
        const range = selection.getRangeAt(0);
        if (this.editor.contains(range.commonAncestorContainer)) {
          this.savedRange = range.cloneRange();
          const node = range.startContainer;
          const element = node instanceof Element ? node : node.parentElement;
          const cell = element?.closest<HTMLTableCellElement>("td,th");
          if (cell && this.editor.contains(cell)) { this.savedCell = cell; this.rememberCell(cell); }
        }
      }
      this.syncTableActions();
    };
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
      this.shadowRoot?.querySelectorAll<HTMLButtonElement>("button[data-table-command]").forEach(button => {
        const command = button.dataset.tableCommand;
        button.disabled = !cell || !table || hasSpans || (command === "deleteRow" && rowCount <= 1) || (command === "deleteColumn" && columnCount <= 1);
      });
    }
    private restoreSelection(): void {
      this.editor.focus();
      const selection = this.selection();
      if (!selection || !this.savedRange || !this.editor.contains(this.savedRange.commonAncestorContainer)) return;
      selection.removeAllRanges();
      selection.addRange(this.savedRange);
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
      this.syncForm();
      this.syncTableActions();
      this.dispatchEvent(new CustomEvent("spui-input", { detail: { value: this.value }, bubbles: true, composed: true }));
    }
    private command(command: string, value?: string): void {
      if (command === "insertImage") { this.imageInput?.click(); return; }
      if (["insertRowAbove", "insertRowBelow", "insertColumnBefore", "insertColumnAfter", "deleteRow", "deleteColumn", "deleteTable"].includes(command)) { this.editTable(command); return; }
      if (command === "createLink") { this.openLinkEditor(); return; }
      this.restoreSelection();
      if (command === "insertTable") value = '<table><caption><br></caption><thead><tr><th scope="col"><br></th><th scope="col"><br></th></tr></thead><tbody><tr><td><br></td><td><br></td></tr><tr><td><br></td><td><br></td></tr></tbody></table><p><br></p>';
      this.editor.ownerDocument.execCommand(command === "insertTable" ? "insertHTML" : command, false, value);
      this.sanitizeEditor();
      this.syncForm();
      this.onSelectionChange();
      this.dispatchEvent(new CustomEvent("spui-input", { detail: { value: this.value }, bubbles: true, composed: true }));
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
      this.linkUrlInput!.focus();
      this.linkUrlInput!.select();
    }
    private closeLinkEditor(restoreEditor: boolean): void {
      if (!this.linkForm) return;
      this.linkForm.hidden = true;
      this.linkError!.hidden = true;
      this.linkUrlInput!.removeAttribute("aria-invalid");
      if (restoreEditor) this.restoreSelection();
      else this.shadowRoot?.querySelector<HTMLButtonElement>('button[data-command="createLink"]')?.focus();
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
      this.sanitizeEditor();
      this.syncForm();
      this.dispatchEvent(new CustomEvent("spui-input", { detail: { value: this.value }, bubbles: true, composed: true }));
    }
    private removeLink(): void {
      const link = this.linkAtRange(this.savedRange);
      if (!link) return;
      link.replaceWith(...link.childNodes);
      this.closeLinkEditor(true);
      this.sanitizeEditor();
      this.syncForm();
      this.dispatchEvent(new CustomEvent("spui-input", { detail: { value: this.value }, bubbles: true, composed: true }));
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
        this.savedRange = range?.cloneRange(); this.syncForm();
        this.dispatchEvent(new CustomEvent("spui-input", { detail: { value: this.value }, bubbles: true, composed: true }));
      } catch (error) {
        this.dispatchEvent(new CustomEvent("spui-image-upload-error", { detail: { fileName: file.name, error }, bubbles: true, composed: true }));
      } finally { this.uploadingImage = false; this.syncImageButton(); }
    }
    private render(): void {
      const shadow = this.shadowRoot ?? this.attachShadow({ mode: "open" });
      const label = document.createElement("label"); label.textContent = this.getAttribute("label") ?? ""; label.hidden = !this.hasAttribute("label"); label.part.add("label");
      const toolbar = document.createElement("div"); toolbar.setAttribute("role", "toolbar"); toolbar.setAttribute("aria-orientation", "horizontal"); toolbar.part.add("toolbar");
      const actions: Array<[string,string,string?,string?,string?]> = [["Bold","bold"],["Italic","italic"],["Underline","underline"],["Bulleted list","insertUnorderedList",undefined,"• List"],["Numbered list","insertOrderedList",undefined,"1. List"],["Undo","undo"],["Redo","redo"],["Insert table","insertTable"],["Insert image","insertImage",undefined,undefined,"insert-image-label"],["Insert row above","insertRowAbove",undefined,undefined,"insert-row-above-label"],["Insert row below","insertRowBelow",undefined,undefined,"insert-row-below-label"],["Insert column before","insertColumnBefore",undefined,undefined,"insert-column-before-label"],["Insert column after","insertColumnAfter",undefined,undefined,"insert-column-after-label"],["Delete row","deleteRow",undefined,undefined,"delete-row-label"],["Delete column","deleteColumn",undefined,undefined,"delete-column-label"],["Delete table","deleteTable",undefined,undefined,"delete-table-label"],["Link","createLink"]];
      for (const [title, command, value, short, labelAttribute] of actions) { const button = document.createElement("button"); button.type = "button"; button.dataset.command = command; button.dataset.fallback = short ?? title; if (labelAttribute) { button.dataset.labelAttribute = labelAttribute; if (command.startsWith("insertRow") || command.startsWith("insertColumn") || command.startsWith("delete")) button.dataset.tableCommand = command; } button.tabIndex = toolbar.children.length === 0 ? 0 : -1; button.textContent = title; button.setAttribute("aria-label", title); button.addEventListener("mousedown", event => event.preventDefault()); button.addEventListener("click", () => this.command(command, value)); toolbar.append(button); }
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
      this.linkUrlInput.setAttribute("aria-describedby", this.linkError.id);
      const linkActions = document.createElement("div"); linkActions.className = "link-actions";
      const makeLinkAction = (action: "apply" | "remove" | "cancel", attribute: string, fallback: string, onClick: () => void): HTMLButtonElement => {
        const button = document.createElement("button"); button.type = action === "apply" ? "submit" : "button"; button.dataset.linkAction = action; button.dataset.labelAttribute = attribute; button.part.add(`link-${action}`); button.textContent = this.getAttribute(attribute) ?? fallback; button.addEventListener("click", onClick); linkActions.append(button); return button;
      };
      makeLinkAction("apply", "link-apply-label", "Apply link", () => {});
      this.linkRemoveButton = makeLinkAction("remove", "link-remove-label", "Remove link", () => this.removeLink());
      makeLinkAction("cancel", "link-cancel-label", "Cancel", () => this.closeLinkEditor(false));
      linkForm.append(linkActions);
      linkForm.addEventListener("submit", event => { event.preventDefault(); this.applyLink(); });
      linkForm.addEventListener("keydown", event => { if ((event as KeyboardEvent).key === "Escape") { event.preventDefault(); event.stopPropagation(); this.closeLinkEditor(false); } });
      toolbar.addEventListener("focusin", event => { const active = event.target as HTMLButtonElement; toolbar.querySelectorAll<HTMLButtonElement>("button").forEach(button => { button.tabIndex = button === active ? 0 : -1; }); });
      toolbar.addEventListener("keydown", event => {
        const key = (event as KeyboardEvent).key;
        const buttons = [...toolbar.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
        const current = buttons.indexOf(event.target as HTMLButtonElement);
        const rtl = getComputedStyle(this).direction === "rtl";
        const step = key === "ArrowRight" ? (rtl ? -1 : 1) : key === "ArrowLeft" ? (rtl ? 1 : -1) : 0;
        const index = key === "Home" ? 0 : key === "End" ? buttons.length - 1 : step ? (current + step + buttons.length) % buttons.length : -1;
        if (index < 0 || !buttons[index]) return;
        event.preventDefault(); buttons[index].tabIndex = 0; buttons.forEach((button, buttonIndex) => { if (buttonIndex !== index) button.tabIndex = -1; }); buttons[index].focus();
      });
      this.editor = document.createElement("div"); this.editor.setAttribute("role", "textbox"); this.editor.setAttribute("aria-multiline", "true"); this.syncEditorLabel(); const invalid = this.getAttribute("aria-invalid"); if (invalid !== null) this.editor.setAttribute("aria-invalid", invalid); this.editor.contentEditable = String(!this.hasAttribute("disabled") && !this.hasAttribute("read-only")); this.editor.setAttribute("aria-readonly", String(this.hasAttribute("read-only"))); this.editor.setAttribute("aria-disabled", String(this.hasAttribute("disabled"))); this.editor.setAttribute("aria-required", String(this.hasAttribute("required"))); this.editor.dataset.placeholder = this.getAttribute("placeholder") ?? "Write something…"; this.editor.part.add("editor");
      this.editor.addEventListener("keydown", event => { const key = (event as KeyboardEvent).key.toLowerCase(); const shortcut = (event as KeyboardEvent).metaKey || (event as KeyboardEvent).ctrlKey; if (!shortcut) return; if (key === "z") { event.preventDefault(); this.command((event as KeyboardEvent).shiftKey ? "redo" : "undo"); } else if (key === "y") { event.preventDefault(); this.command("redo"); } });
      this.editor.addEventListener("input", () => { this.sanitizeEditor(); this.syncForm(); this.dispatchEvent(new CustomEvent("spui-input", { detail: { value: this.value }, bubbles: true, composed: true })); });
      this.editor.addEventListener("mouseup", this.onSelectionChange);
      this.editor.addEventListener("keyup", this.onSelectionChange);
      this.editor.addEventListener("click", this.onEditorClick);
      shadow.addEventListener("selectionchange", this.onSelectionChange, { signal: this.events?.signal });
      this.editor.addEventListener("paste", event => {
        event.preventDefault();
        const clipboard = (event as ClipboardEvent).clipboardData;
        const imageFile = [...(clipboard?.files ?? [])].find(file => file.type.startsWith("image/"));
        if (imageFile) { void this.insertUploadedImage(imageFile); return; }
        const html = cleanHtml(clipboard?.getData("text/html") ?? "");
        const text = clipboard?.getData("text/plain") ?? "";
        if (html) this.editor.ownerDocument.execCommand("insertHTML", false, html);
        else this.editor.ownerDocument.execCommand("insertText", false, text);
        this.sanitizeEditor();
        this.syncForm();
        this.dispatchEvent(new CustomEvent("spui-input", { detail: { value: this.value }, bubbles: true, composed: true }));
      });
      this.editor.addEventListener("blur", () => { this.sanitizeEditor(); this.syncForm(); this.dispatchEvent(new CustomEvent("spui-change", { detail: { value: this.value }, bubbles: true, composed: true })); });
      const style = document.createElement("style"); style.textContent = `${base}:host{display:grid;gap:6px}label{font-weight:600;color:var(--spui-ui-muted,var(--spui-semantic-body-text,inherit))}[role=toolbar]{display:flex;flex-wrap:wrap;gap:4px;padding:4px;border:1px solid var(--spui-control-border,var(--spui-ui-stroke,#c8c8c8));border-radius:var(--spui-control-radius,6px);background:var(--spui-ui-surface,#fff)}button{border:0;border-radius:4px;background:transparent;color:var(--spui-ui-text,inherit);padding:6px 8px;font:inherit;cursor:pointer}button:hover:not(:disabled){background:var(--spui-ui-surface-hover,#eee)}button:disabled{opacity:.55;cursor:not-allowed}button:focus-visible,[role=textbox]:focus-visible,input:focus-visible{outline:2px solid var(--spui-focus-ring,#005a9e);outline-offset:2px}[role=textbox]{min-height:120px;box-sizing:border-box;padding:10px 12px;border:1px solid var(--spui-control-border,var(--spui-ui-stroke,#c8c8c8));border-radius:var(--spui-control-radius,6px);background:var(--spui-control-background,var(--spui-ui-surface,#fff));color:var(--spui-ui-text,inherit);font:inherit;line-height:1.5;overflow:auto;caret-color:var(--spui-focus-ring,#005a9e)}[role=textbox]:empty:before{content:attr(data-placeholder);color:var(--spui-ui-muted,#666);pointer-events:none}table{border-collapse:collapse;max-width:100%;margin-block:8px}caption{text-align:start;font-weight:600}td,th{min-width:56px;padding:6px 9px;border:1px solid var(--spui-ui-stroke,#c8c8c8);text-align:start}th{background:var(--spui-ui-surface-hover,#f5f5f5);font-weight:600}a{color:var(--spui-semantic-link,#0f6cbd)}@media(forced-colors:active){button{border:1px solid ButtonText}td,th{border-color:CanvasText}}`;
      style.textContent += `.link-editor{display:flex;flex-wrap:wrap;align-items:end;gap:8px;padding:8px;border:1px solid var(--spui-ui-stroke,#c8c8c8);border-radius:var(--spui-control-radius,6px);background:var(--spui-ui-surface-hover,var(--spui-ui-surface,#fff))}.link-editor[hidden]{display:none}.link-field{display:grid;flex:1 1 150px;gap:4px;min-width:0;color:var(--spui-ui-text,inherit);font-size:13px}.link-field input{box-sizing:border-box;width:100%;min-width:0;min-height:32px;padding:5px 8px;border:1px solid var(--spui-control-border,var(--spui-ui-stroke,#8a8886));border-radius:var(--spui-control-radius,4px);background:var(--spui-control-background,var(--spui-ui-surface,#fff));color:var(--spui-ui-text,inherit)}.link-actions{display:flex;flex-wrap:wrap;gap:4px}.link-actions button{border:1px solid var(--spui-ui-stroke,#c8c8c8);border-radius:var(--spui-control-radius,4px);background:var(--spui-ui-surface,#fff)}.link-actions [data-link-action=apply]{border-color:transparent;background:var(--spui-semantic-primary-button-background,var(--spui-ui-accent,#0078d4));color:var(--spui-ui-accent-text,#fff)}.link-error{flex:1 0 100%;color:var(--spui-ui-danger,var(--spui-semantic-error-text,#c50f1f));font-size:13px}`;
      style.textContent += `.link-new-tab{display:inline-flex;flex:1 0 100%;align-items:center;gap:8px;color:var(--spui-ui-text,inherit);font-size:13px}.link-new-tab input{width:16px;height:16px;min-height:16px;margin:0;accent-color:var(--spui-ui-accent,#0078d4)}`;
      shadow.replaceChildren(style,label,toolbar,linkForm,this.editor);
      syncHostAccessibleName(this, this.editor);
      this.syncDisabled();
      this.refreshStrings();
      this.onSelectionChange();
    }
    private refreshStrings(): void {
      const toolbar = this.shadowRoot?.querySelector<HTMLElement>('[role="toolbar"]');
      if (!toolbar) return;
      this.imageInput?.setAttribute("aria-label", this.getAttribute("image-input-label") ?? "Choose image");
      const label = this.getAttribute("label") ?? "Rich text";
      toolbar.setAttribute("aria-label", this.getAttribute("toolbar-label") ?? `${label} formatting`);
      const attrs = ["bold-label","italic-label","underline-label","bullet-list-label","number-list-label","undo-label","redo-label","insert-table-label","insert-image-label","insert-row-above-label","insert-row-below-label","insert-column-before-label","insert-column-after-label","delete-row-label","delete-column-label","delete-table-label","link-label"];
      toolbar.querySelectorAll<HTMLButtonElement>("button[data-command]").forEach((button,index) => {
        const attribute = button.dataset.labelAttribute ?? attrs[index];
        const text = this.getAttribute(attribute) ?? button.dataset.fallback ?? "";
        button.textContent = button.dataset.command === "insertUnorderedList" && !this.hasAttribute(attribute) ? "• List" : button.dataset.command === "insertOrderedList" && !this.hasAttribute(attribute) ? "1. List" : text;
        button.setAttribute("aria-label", text);
      });
      if (this.linkForm) {
        this.linkForm.setAttribute("aria-label", this.getAttribute("link-dialog-label") ?? "Edit link");
        const fieldFallbacks: Record<string, string> = { "link-prompt": "Link URL", "link-text-label": "Display text", "link-title-label": "Title" };
        this.linkForm.querySelectorAll<HTMLElement>(".link-field[data-label-attribute]").forEach(field => {
          const attribute = field.dataset.labelAttribute!;
          if (field.firstChild) field.firstChild.textContent = this.getAttribute(attribute) ?? fieldFallbacks[attribute] ?? "";
        });
        const actionFallbacks: Record<string, string> = { "link-apply-label": "Apply link", "link-remove-label": "Remove link", "link-cancel-label": "Cancel" };
        this.linkForm.querySelectorAll<HTMLButtonElement>("button[data-label-attribute]").forEach(button => {
          const attribute = button.dataset.labelAttribute!;
          button.textContent = this.getAttribute(attribute) ?? actionFallbacks[attribute] ?? "";
        });
        const newTabText = this.linkForm.querySelector<HTMLElement>(".link-new-tab span");
        if (newTabText) newTabText.textContent = this.getAttribute("link-new-tab-label") ?? "Open in new tab";
      }
      this.syncTableActions();
    }
  }
  customElements.define("spui-rich-text-editor", SpuiRichTextEditor);
}
