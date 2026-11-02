import { base } from "./shared.js";

export type FileUploadError = { code: "too-many-files" | "file-too-large" | "file-type-not-accepted"; file?: File };

/** File selection surface. Uploading and SharePoint persistence remain the consumer's responsibility. */
export function defineFileUpload(): void {
  if (customElements.get("spui-file-upload")) return;
  class SpuiFileUpload extends HTMLElement {
    static formAssociated = true;
    static observedAttributes = ["accept", "multiple", "disabled", "required", "name", "max-files", "max-file-size", "label", "aria-label", "aria-labelledby", "aria-description", "aria-describedby", "aria-invalid", "browse-label", "remove-label", "drop-label", "selected-label", "invalid-message", "required-message"];
    private internals?: ElementInternals;
    private input!: HTMLInputElement;
    private list!: HTMLUListElement;
    private status!: HTMLDivElement;
    private selected: File[] = [];
    private formDisabled = false;
    get form(): HTMLFormElement | null { return this.internals?.form ?? null; }
    get files(): readonly File[] { return this.selected; }

    constructor() { super(); try { this.internals = this.attachInternals(); } catch { /* Native picker continues to work where form-associated elements are unavailable. */ } }
    connectedCallback(): void { if (!this.shadowRoot) this.render(); this.sync(); }
    attributeChangedCallback(): void { if (this.isConnected) this.sync(); }
    formDisabledCallback(disabled: boolean): void { this.formDisabled = disabled; if (this.input) this.sync(); }
    formResetCallback(): void { if (this.status) this.status.textContent = ""; this.setFiles([], false); }
    formStateRestoreCallback(state: string | File | FormData | null): void { if (state instanceof File) this.setFiles([state], false); else if (state instanceof FormData) this.setFiles(state.getAll(this.getAttribute("name") || "").filter((value): value is File => value instanceof File), false); }

    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:block;min-width:0;color:var(--spui-ui-text,var(--spui-semantic-body-text,#242424));font-family:var(--spui-font-family,inherit)}.label{display:block;margin-block-end:6px;font-size:14px;font-weight:600}.drop{box-sizing:border-box;display:grid;place-items:center;gap:6px;min-height:104px;padding:16px;border:1px dashed var(--spui-ui-stroke,var(--spui-semantic-input-border,#8a8886));border-radius:var(--spui-control-radius,6px);background:var(--spui-ui-surface,var(--spui-semantic-input-background,#fff));text-align:center;transition:border-color var(--spui-motion-duration-fast,120ms) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1)),background-color var(--spui-motion-duration-fast,120ms) var(--spui-motion-easing-standard,cubic-bezier(.2,0,0,1))}.drop[data-dragging=true]{border-color:var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));background:var(--spui-ui-surface-hover,var(--spui-ui-canvas,#f5f5f5))}.hint{color:var(--spui-ui-muted,var(--spui-semantic-body-subtext,#616161));font-size:12px}.browse{min-height:32px;padding:4px 12px;border:1px solid var(--spui-control-border,var(--spui-ui-stroke,#8a8886));border-radius:var(--spui-control-radius,4px);background:var(--spui-ui-surface,#fff);color:inherit;font:inherit;cursor:pointer}.browse:hover:not(:disabled){background:var(--spui-ui-surface-hover,var(--spui-ui-canvas,#f5f5f5))}.browse:focus-visible,.remove:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:2px}.browse:disabled,.remove:disabled{opacity:.55;cursor:not-allowed}.input{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.files{display:grid;gap:4px;margin:8px 0 0;padding:0;list-style:none}.files:empty{display:none}.file{display:flex;align-items:center;gap:8px;min-width:0;padding:6px 8px;border:1px solid var(--spui-ui-stroke,#d1d1d1);border-radius:var(--spui-control-radius,4px)}.filename{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.size{flex:none;color:var(--spui-ui-muted,#616161);font-size:12px;font-variant-numeric:tabular-nums}.remove{min-width:32px;min-height:32px;border:0;border-radius:var(--spui-control-radius,4px);background:transparent;color:inherit;font:inherit;cursor:pointer}.status{margin-block-start:6px;color:var(--spui-semantic-error-text,var(--spui-ui-danger,#b10e1c));font-size:12px}.status:empty{display:none}:host([data-spui-appearance=glass]) .drop{backdrop-filter:var(--spui-card-backdrop,blur(12px) saturate(1.2))}@media(prefers-reduced-motion:reduce){.drop{transition:none}}@media(forced-colors:active){.drop,.file{border-color:CanvasText;background:Canvas;color:CanvasText}.drop[data-dragging=true]{outline:2px solid Highlight}.browse{border-color:ButtonText;background:ButtonFace;color:ButtonText}}`;
      const label = document.createElement("label"); label.className = "label"; label.part.add("label");
      const drop = document.createElement("div"); drop.className = "drop"; drop.part.add("dropzone"); drop.tabIndex = -1;
      const hint = document.createElement("span"); hint.className = "hint";
      const browse = document.createElement("button"); browse.type = "button"; browse.className = "browse"; browse.part.add("browse-button");
      this.input = document.createElement("input"); this.input.type = "file"; this.input.className = "input"; this.input.part.add("input");
      browse.addEventListener("click", () => this.input.click());
      this.input.addEventListener("change", () => { this.addFiles(Array.from(this.input.files ?? [])); this.input.value = ""; });
      drop.addEventListener("dragover", event => { event.preventDefault(); if (!this.isDisabled()) drop.dataset.dragging = "true"; });
      drop.addEventListener("dragleave", event => { if (!drop.contains(event.relatedTarget as Node | null)) delete drop.dataset.dragging; });
      drop.addEventListener("drop", event => { event.preventDefault(); delete drop.dataset.dragging; if (!this.isDisabled()) this.addFiles(Array.from((event as DragEvent).dataTransfer?.files ?? [])); });
      drop.addEventListener("keydown", event => { if ((event as KeyboardEvent).key === "Enter" || (event as KeyboardEvent).key === " ") { event.preventDefault(); this.input.click(); } });
      this.input.addEventListener("focus", () => browse.focus());
      this.list = document.createElement("ul"); this.list.className = "files"; this.list.part.add("file-list"); this.list.setAttribute("aria-label", "Selected files");
      this.status = document.createElement("div"); this.status.className = "status"; this.status.part.add("status"); this.status.setAttribute("role", "status"); this.status.setAttribute("aria-live", "polite");
      drop.append(hint, browse, this.input); shadow.append(style, label, drop, this.list, this.status);
    }

    private sync(): void {
      const disabled = this.isDisabled();
      this.input.accept = this.getAttribute("accept") || ""; this.input.multiple = this.hasAttribute("multiple"); this.input.disabled = disabled; this.input.required = this.hasAttribute("required") && this.selected.length === 0;
      const label = this.getAttribute("aria-label") || this.getAttribute("label") || "Add files"; const browse = this.getAttribute("browse-label") || "Browse files";
      if (!this.hasAttribute("role")) this.setAttribute("role", "group");
      const labelElement = this.shadowRoot?.querySelector<HTMLLabelElement>(".label"); if (labelElement) { labelElement.textContent = this.getAttribute("label") || ""; labelElement.hidden = !this.hasAttribute("label"); }
      this.input.setAttribute("aria-label", label);
      for (const name of ["aria-labelledby", "aria-description", "aria-describedby", "aria-invalid"]) {
        const value = this.getAttribute(name);
        if (value === null) this.input.removeAttribute(name); else this.input.setAttribute(name, value);
      }
      const hint = this.shadowRoot?.querySelector<HTMLElement>(".hint"); if (hint) hint.textContent = this.getAttribute("drop-label") || "Drag files here or browse to select";
      const button = this.shadowRoot?.querySelector<HTMLButtonElement>(".browse"); if (button) { button.textContent = browse; button.disabled = disabled; button.setAttribute("aria-label", browse); }
      this.list?.setAttribute("aria-label", `${label}: ${this.getAttribute("selected-label") || "selected files"}`);
      this.renderFiles(); this.syncForm();
    }

    private addFiles(files: File[]): void {
      if (!files.length || this.isDisabled()) return;
      const max = Number(this.getAttribute("max-files")); const limit = Number(this.getAttribute("max-file-size"));
      const next = this.hasAttribute("multiple") ? [...this.selected] : [];
      const errors: FileUploadError[] = [];
      for (const file of files) {
        if (!this.accepts(file)) { errors.push({ code: "file-type-not-accepted", file }); continue; }
        if (Number.isFinite(limit) && limit > 0 && file.size > limit) { errors.push({ code: "file-too-large", file }); continue; }
        if (Number.isFinite(max) && max > 0 && next.length >= max) { errors.push({ code: "too-many-files", file }); continue; }
        if (!next.some(existing => existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified)) next.push(file);
      }
      this.status.textContent = errors.length ? (this.getAttribute("invalid-message") || this.getAttribute(errors[0]!.code === "file-too-large" ? "file-too-large-message" : errors[0]!.code === "too-many-files" ? "max-files-message" : "file-type-message") || this.describeError(errors[0]!)) : "";
      this.setFiles(next, true);
      if (errors.length) this.dispatchEvent(new CustomEvent("spui-file-error", { detail: { errors }, bubbles: true, composed: true }));
    }

    private describeError(error: FileUploadError): string {
      if (error.code === "file-too-large") return `${error.file?.name || "File"} exceeds the allowed size.`;
      if (error.code === "too-many-files") return "The maximum number of files has been reached.";
      return "The selected file type is not accepted.";
    }
    private accepts(file: File): boolean {
      const accepted = (this.getAttribute("accept") || "").split(",").map(value => value.trim().toLowerCase()).filter(Boolean);
      if (!accepted.length) return true;
      const name = file.name.toLowerCase(); const type = file.type.toLowerCase();
      return accepted.some(value => value.startsWith(".") ? name.endsWith(value) : value.endsWith("/*") ? type.startsWith(value.slice(0, -1)) : type === value);
    }
    private setFiles(files: File[], emit: boolean): void {
      this.selected = files; this.renderFiles(); this.syncForm();
      if (emit) this.dispatchEvent(new CustomEvent("spui-file-change", { detail: { files: [...files] }, bubbles: true, composed: true }));
    }
    private renderFiles(): void {
      if (!this.list) return;
      this.list.replaceChildren(...this.selected.map((file, index) => {
        const item = document.createElement("li"); item.className = "file"; item.part.add("file");
        const name = document.createElement("span"); name.className = "filename"; name.textContent = file.name;
        const size = document.createElement("span"); size.className = "size"; size.textContent = this.formatSize(file.size);
        const remove = document.createElement("button"); remove.type = "button"; remove.className = "remove"; remove.textContent = "×"; remove.disabled = this.isDisabled(); remove.setAttribute("aria-label", `${this.getAttribute("remove-label") || "Remove"} ${file.name}`);
        remove.addEventListener("click", () => {
          this.status.textContent = "";
          const next = this.selected.filter((_, i) => i !== index);
          this.setFiles(next, true);
          const nextRemove = this.list.querySelectorAll<HTMLButtonElement>(".remove")[Math.min(index, next.length - 1)];
          (nextRemove ?? this.shadowRoot?.querySelector<HTMLButtonElement>(".browse"))?.focus();
        });
        item.append(name, size, remove); return item;
      }));
    }
    private formatSize(size: number): string { return size < 1024 ? `${size} B` : size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`; }
    private syncForm(): void {
      if (!this.internals) return;
      const name = this.getAttribute("name") || ""; const data = new FormData();
      if (name) this.selected.forEach(file => data.append(name, file, file.name));
      this.internals.setFormValue(this.selected.length && name ? data : null, JSON.stringify(this.selected.map(file => ({ name: file.name, size: file.size, lastModified: file.lastModified }))));
      if (this.hasAttribute("required") && !this.selected.length) this.internals.setValidity({ valueMissing: true }, this.getAttribute("required-message") || "Select at least one file.", this.shadowRoot?.querySelector(".browse") ?? undefined);
      else this.internals.setValidity({});
    }
    private isDisabled(): boolean { return this.formDisabled || this.hasAttribute("disabled"); }
  }
  customElements.define("spui-file-upload", SpuiFileUpload);
}
