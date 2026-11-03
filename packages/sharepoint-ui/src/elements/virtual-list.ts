import { base, scrollToInlineOffset } from "./shared.js";

export type VirtualListItemRenderer<T = unknown> = (item: T, index: number) => Node | string | number | null;
export interface VirtualListDataSource<T = unknown> {
  readonly length: number;
  getItem(index: number): T | undefined;
  loadRange(start: number, end: number, signal: AbortSignal): void | Promise<void>;
  subscribe?(listener: () => void): () => void;
}
export interface SharePointVirtualListElement extends HTMLElement {
  items: unknown[];
  dataSource?: VirtualListDataSource;
  renderItem?: VirtualListItemRenderer;
  itemKey?: (item: unknown, index: number) => string | number;
  axis: "vertical" | "horizontal";
  itemSize: number;
  rowHeight: number;
  measureItems: boolean;
  scrollToIndex(index: number, align?: "start" | "center" | "end", behavior?: ScrollBehavior): void;
}

declare global {
  interface HTMLElementTagNameMap { "spui-virtual-list": SharePointVirtualListElement; }
}

type VirtualRow = HTMLDivElement & { spuiItem?: unknown; spuiKey?: string };

/** Prefix-sum index for measured rows; point updates and offset lookups are O(log n). */
export class VariableSizeIndex {
  private sizes = new Float64Array(0);
  private tree = new Float64Array(1);
  private estimate = 40;
  private count = 0;
  private uniform = true;

  constructor(count = 0, estimate = 40, sizes?: readonly number[]) { this.reset(count, estimate, sizes); }
  get length(): number { return this.count; }
  get totalSize(): number { return this.offset(this.length); }

  reset(count: number, estimate: number, sizes?: readonly number[]): void {
    const safeCount = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
    this.estimate = Number.isFinite(estimate) && estimate > 0 ? estimate : 40;
    this.count = safeCount;
    if (sizes === undefined) {
      this.uniform = true;
      this.sizes = new Float64Array(0);
      this.tree = new Float64Array(1);
      return;
    }
    this.uniform = false;
    this.sizes = new Float64Array(safeCount);
    for (let i = 0; i < safeCount; i++) {
      const size = sizes?.[i];
      this.sizes[i] = Number.isFinite(size) && size! > 0 ? Math.max(1, size!) : this.estimate;
    }
    this.tree = new Float64Array(safeCount + 1);
    for (let i = 1; i <= safeCount; i++) {
      this.tree[i] += this.sizes[i - 1];
      const parent = i + (i & -i);
      if (parent <= safeCount) this.tree[parent] += this.tree[i];
    }
  }

  size(index: number): number { return this.uniform ? this.estimate : this.sizes[index] ?? this.estimate; }
  offset(index: number): number {
    let i = Math.max(0, Math.min(this.length, Math.floor(index)));
    if (this.uniform) return i * this.estimate;
    let sum = 0;
    for (; i > 0; i -= i & -i) sum += this.tree[i];
    return sum;
  }
  set(index: number, size: number): number {
    if (!Number.isInteger(index) || index < 0 || index >= this.length || !Number.isFinite(size) || size <= 0) return 0;
    const next = Math.max(1, size);
    if (this.uniform) {
      if (Math.abs(next - this.estimate) < 0.5) return 0;
      this.uniform = false;
      this.sizes = new Float64Array(this.count).fill(this.estimate);
      this.tree = new Float64Array(this.count + 1);
      for (let i = 1; i <= this.count; i++) {
        this.tree[i] += this.sizes[i - 1];
        const parent = i + (i & -i);
        if (parent <= this.count) this.tree[parent] += this.tree[i];
      }
    }
    const delta = next - this.sizes[index];
    if (Math.abs(delta) < 0.5) return 0;
    this.sizes[index] = next;
    for (let i = index + 1; i < this.tree.length; i += i & -i) this.tree[i] += delta;
    return delta;
  }
  indexAt(offset: number): number {
    if (!this.length || offset <= 0) return 0;
    const target = Math.min(offset, Math.max(0, this.totalSize - Number.EPSILON));
    if (this.uniform) return Math.max(0, Math.min(this.length - 1, Math.floor(target / this.estimate)));
    let index = 0, sum = 0, bit = 1;
    while (bit * 2 <= this.length) bit *= 2;
    for (; bit > 0; bit = Math.floor(bit / 2)) {
      const next = index + bit;
      if (next <= this.length && sum + this.tree[next] <= target) {
        index = next;
        sum += this.tree[next];
      }
    }
    return Math.min(index, this.length - 1);
  }
}

/** Fixed or measured one-dimensional virtual list. DOM work is bounded by the viewport plus overscan. */
export function defineVirtualList(): void {
  if (customElements.get("spui-virtual-list")) return;
  class SpuiVirtualList extends HTMLElement implements SharePointVirtualListElement {
    static observedAttributes = ["label", "aria-label", "row-height", "item-size", "overscan", "measure-items", "axis"];
    private data: unknown[] = [];
    private source?: VirtualListDataSource;
    private sourceUnsubscribe?: () => void;
    private activeRequest?: { key: string; controller: AbortController };
    private completedRange = "";
    private renderer?: VirtualListItemRenderer;
    private keyOf?: (item: unknown, index: number) => string | number;
    private viewport?: HTMLDivElement;
    private content?: HTMLDivElement;
    private resizeObserver?: ResizeObserver;
    private readonly rows = new Map<number, VirtualRow>();
    private readonly pool: VirtualRow[] = [];
    private frame = 0;
    private currentScrollOffset = 0;
    private readonly heightIndex = new VariableSizeIndex();

    get axis(): "vertical" | "horizontal" { return this.getAttribute("axis") === "horizontal" ? "horizontal" : "vertical"; }
    set axis(value: "vertical" | "horizontal") { this.setAttribute("axis", value === "horizontal" ? "horizontal" : "vertical"); }
    get itemSize(): number { return this.positiveNumber(this.getAttribute("item-size") ?? this.getAttribute("row-height"), 40); }
    set itemSize(value: number) { this.setAttribute("item-size", String(value)); }
    get rowHeight(): number { return this.itemSize; }
    set rowHeight(value: number) { this.setAttribute("row-height", String(value)); }

    get items(): unknown[] { return this.data; }
    set items(value: unknown[]) { this.clearDataSource(); this.data = Array.isArray(value) ? value : []; this.heightIndex.reset(this.data.length, this.itemSize); this.paint(true); }
    get dataSource(): VirtualListDataSource | undefined { return this.source; }
    set dataSource(value: VirtualListDataSource | undefined) {
      if (this.source === value) return;
      this.clearDataSource(); this.source = value;
      this.observeDataSource();
      this.heightIndex.reset(this.itemCount(), this.itemSize); this.paint(true);
    }
    get renderItem(): VirtualListItemRenderer | undefined { return this.renderer; }
    set renderItem(value: VirtualListItemRenderer | undefined) { this.renderer = value; this.paint(true); }
    get itemKey(): ((item: unknown, index: number) => string | number) | undefined { return this.keyOf; }
    set itemKey(value: ((item: unknown, index: number) => string | number) | undefined) { this.keyOf = value; this.paint(true); }
    get measureItems(): boolean { return this.hasAttribute("measure-items"); }
    set measureItems(value: boolean) { this.toggleAttribute("measure-items", Boolean(value)); }

    connectedCallback(): void {
      if (!this.shadowRoot) this.render();
      this.resizeObserver ??= new ResizeObserver(entries => this.onResize(entries));
      this.observeDataSource();
      if (this.viewport) this.resizeObserver.observe(this.viewport);
      this.paint();
    }

    disconnectedCallback(): void { cancelAnimationFrame(this.frame); this.frame = 0; this.resizeObserver?.disconnect(); this.activeRequest?.controller.abort(); this.activeRequest = undefined; this.sourceUnsubscribe?.(); this.sourceUnsubscribe = undefined; this.completedRange = ""; }

    attributeChangedCallback(name: string, previous: string | null, next: string | null): void {
      if (previous !== next && ["row-height", "item-size", "measure-items", "axis"].includes(name)) {
        this.heightIndex.reset(this.data.length, this.itemSize);
        if (name === "axis" && this.viewport) { this.viewport.scrollTop = 0; this.viewport.scrollLeft = 0; this.currentScrollOffset = 0; }
      }
      this.paint(true);
    }

    private render(): void {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `${base}:host{display:block;min-width:0;min-height:0}.viewport{box-sizing:border-box;position:relative;overflow:auto;overscroll-behavior:contain;outline:none}.viewport:focus-visible{outline:2px solid var(--spui-focus-ring,var(--spui-ui-accent,#0078d4));outline-offset:2px}.content{position:relative;min-width:0;min-height:0}.row{box-sizing:border-box;position:absolute;top:0;display:flex;align-items:center;background:var(--spui-list-row-background,transparent);color:inherit}.row:hover{background:var(--spui-list-row-hover, var(--spui-semantic-list-item-hover-background,rgba(0,0,0,.04)))}@media(prefers-reduced-motion:reduce){.row{scroll-behavior:auto}}`;
      this.viewport = document.createElement("div");
      this.viewport.className = "viewport";
      this.viewport.part.add("viewport");
      this.viewport.setAttribute("role", "list");
      this.viewport.tabIndex = 0;
      this.viewport.addEventListener("scroll", () => {
        this.currentScrollOffset = this.scrollOffset();
        if (!this.frame) this.frame = requestAnimationFrame(() => { this.frame = 0; this.paint(); });
      }, { passive: true });
      this.content = document.createElement("div");
      this.content.className = "content";
      this.content.part.add("content");
      this.viewport.append(this.content);
      shadow.append(style, this.viewport);
    }

    scrollToIndex(index: number, align: "start" | "center" | "end" = "start", behavior: ScrollBehavior = "auto"): void {
      if (!this.viewport || !this.itemCount()) return;
      const itemSize = this.itemSize;
      const safeIndex = Math.max(0, Math.min(this.itemCount() - 1, Math.floor(index)));
      const offset = this.measureItems ? this.heightIndex.offset(safeIndex) : safeIndex * itemSize;
      const size = this.measureItems ? this.heightIndex.size(safeIndex) : itemSize;
      const viewportSize = this.axis === "horizontal" ? this.viewport.clientWidth : this.viewport.clientHeight;
      const destination = align === "center" ? offset - (viewportSize - size) / 2 : align === "end" ? offset - viewportSize + size : offset;
      this.setScrollOffset(Math.max(0, destination), behavior);
      this.currentScrollOffset = this.scrollOffset();
      this.paint();
    }

    private paint(force = false): void {
      if (!this.isConnected || !this.viewport || !this.content) return;
      const itemSize = this.itemSize;
      const horizontal = this.axis === "horizontal";
      const overscanValue = this.hasAttribute("overscan") ? Number(this.getAttribute("overscan")) : 4;
      const overscan = Number.isFinite(overscanValue) ? Math.max(0, Math.min(50, Math.floor(overscanValue))) : 4;
      const count = this.itemCount();
      this.viewport.style.width = horizontal ? "var(--spui-list-width,320px)" : "100%";
      this.viewport.style.height = horizontal ? `var(--spui-list-height,${itemSize}px)` : "var(--spui-list-height,320px)";
      const viewportSize = (horizontal ? this.viewport.clientWidth : this.viewport.clientHeight) || 320;
      const firstVisible = this.measureItems ? this.heightIndex.indexAt(this.currentScrollOffset) : Math.floor(this.currentScrollOffset / itemSize);
      const lastVisible = this.measureItems ? this.heightIndex.indexAt(this.currentScrollOffset + viewportSize) + 1 : Math.ceil((this.currentScrollOffset + viewportSize) / itemSize);
      const first = Math.max(0, firstVisible - overscan);
      const last = Math.min(count, lastVisible + overscan);
      this.requestRange(first, last);
      this.viewport.setAttribute("aria-label", this.getAttribute("label") || this.getAttribute("aria-label") || "Items");
      this.viewport.setAttribute("aria-busy", String(Boolean(this.activeRequest)));
      const totalSize = this.measureItems ? this.heightIndex.totalSize : count * itemSize;
      this.content.style.width = horizontal ? `${totalSize}px` : "100%";
      this.content.style.height = horizontal ? "100%" : `${totalSize}px`;
      for (const [index, row] of this.rows) {
        if (index < first || index >= last) {
          row.remove();
          this.resizeObserver?.unobserve(row);
          this.rows.delete(index);
          this.pool.push(row);
        }
      }
      for (let index = first; index < last; index++) {
        const item = this.source ? this.source.getItem(index) : this.items[index];
        const key = this.keyOf ? String(this.keyOf(item, index)) : String(index);
        let row = this.rows.get(index);
        if (!row) {
          row = this.pool.pop() ?? Object.assign(document.createElement("div"), { className: "row" }) as VirtualRow;
          row.part.add("row");
          row.setAttribute("role", "listitem");
          this.rows.set(index, row);
        }
        row.setAttribute("aria-posinset", String(index + 1));
        row.setAttribute("aria-setsize", String(count));
        const itemOffset = this.measureItems ? this.heightIndex.offset(index) : index * itemSize;
        if (horizontal) {
          row.style.insetInline = "";
          row.style.insetInlineStart = "0";
          row.style.width = this.measureItems ? "auto" : `${itemSize}px`;
          row.style.minWidth = this.measureItems ? `${itemSize}px` : "";
          row.style.height = "100%";
          row.style.minHeight = "";
          row.style.paddingInline = "";
          row.style.paddingBlock = "var(--spui-list-row-padding,12px)";
          row.style.borderBlockEnd = "";
          row.style.borderInlineEnd = "1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#edebe9))";
          row.style.transform = `translateX(${this.isRtl() ? -itemOffset : itemOffset}px)`;
        } else {
          row.style.insetInline = "0";
          row.style.insetInlineStart = "";
          row.style.width = "";
          row.style.minWidth = "";
          row.style.height = this.measureItems ? "auto" : `${itemSize}px`;
          row.style.minHeight = this.measureItems ? `${itemSize}px` : "";
          row.style.paddingInline = "var(--spui-list-row-padding,12px)";
          row.style.paddingBlock = "";
          row.style.borderBlockEnd = "1px solid var(--spui-ui-stroke,var(--spui-semantic-body-divider,#edebe9))";
          row.style.borderInlineEnd = "";
          row.style.transform = `translateY(${itemOffset}px)`;
        }
        row.dataset.index = String(index);
        row.dataset.key = key;
        if (force || row.spuiItem !== item || row.spuiKey !== key) {
          const output = this.renderItem?.(item, index) ?? String(item ?? "");
          row.replaceChildren();
          if (output instanceof Node) row.append(output);
          else row.textContent = String(output);
          row.spuiItem = item;
          row.spuiKey = key;
        }
        this.content.append(row);
        if (this.measureItems) this.resizeObserver?.observe(row);
      }
    }

    private itemCount(): number {
      const length = this.source?.length ?? this.data.length;
      return Number.isFinite(length) ? Math.max(0, Math.floor(length)) : 0;
    }

    private requestRange(start: number, end: number): void {
      const source = this.source;
      if (!source || start >= end || !Array.from({ length: end - start }, (_, offset) => source.getItem(start + offset)).some(item => item === undefined)) return;
      const key = `${start}:${end}`;
      if (this.completedRange === key || this.activeRequest?.key === key) return;
      this.activeRequest?.controller.abort();
      const request = { key, controller: new AbortController() };
      this.activeRequest = request;
      this.viewport?.setAttribute("aria-busy", "true");
      Promise.resolve().then(() => source.loadRange(start, end, request.controller.signal)).then(() => {
        if (this.activeRequest !== request || request.controller.signal.aborted) return;
        if (Array.from({ length: end - start }, (_, offset) => source.getItem(start + offset)).some(item => item === undefined)) {
          this.activeRequest = undefined; this.viewport?.setAttribute("aria-busy", "false");
          this.dispatchEvent(new CustomEvent("spui-data-load-error", { detail: { error: new Error("loadRange resolved before every requested item was available"), start, end }, bubbles: true, composed: true }));
          return;
        }
        this.completedRange = key; this.activeRequest = undefined; this.paint(true);
      }, error => {
        if (this.activeRequest !== request || request.controller.signal.aborted) return;
        this.activeRequest = undefined; this.viewport?.setAttribute("aria-busy", "false");
        this.dispatchEvent(new CustomEvent("spui-data-load-error", { detail: { error, start, end }, bubbles: true, composed: true }));
      });
    }

    private clearDataSource(): void {
      this.activeRequest?.controller.abort(); this.activeRequest = undefined;
      this.sourceUnsubscribe?.(); this.sourceUnsubscribe = undefined;
      this.source = undefined; this.completedRange = "";
    }

    private observeDataSource(): void {
      this.sourceUnsubscribe ??= this.source?.subscribe?.(() => { this.completedRange = ""; this.heightIndex.reset(this.itemCount(), this.itemSize); this.paint(true); });
    }

    private onResize(entries: ResizeObserverEntry[]): void {
      if (!this.viewport) return;
      let changed = false, scrollAdjustment = 0;
      const firstVisible = this.measureItems ? this.heightIndex.indexAt(this.scrollOffset()) : 0;
      const viewportSize = this.axis === "horizontal" ? this.viewport.clientWidth : this.viewport.clientHeight;
      const scrollExtent = this.axis === "horizontal" ? this.viewport.scrollWidth : this.heightIndex.totalSize;
      const anchoredAtEnd = this.currentScrollOffset >= Math.max(0, scrollExtent - viewportSize * 2);
      for (const entry of entries) {
        if (entry.target === this.viewport) { this.paint(); continue; }
        const index = Number((entry.target as HTMLElement).dataset.index);
        if (!this.measureItems || !Number.isInteger(index)) continue;
        const rect = (entry.target as HTMLElement).getBoundingClientRect();
        const delta = this.heightIndex.set(index, this.axis === "horizontal" ? rect.width : rect.height);
        if (delta) {
          changed = true;
          if (anchoredAtEnd || index < firstVisible) scrollAdjustment += delta;
        }
      }
      if (!changed) return;
      if (scrollAdjustment) {
        const offset = this.currentScrollOffset + scrollAdjustment;
        this.setScrollOffset(offset);
        this.currentScrollOffset = this.scrollOffset();
      }
      this.paint();
    }

    private scrollOffset(): number { return this.axis === "horizontal" ? Math.abs(this.viewport?.scrollLeft ?? 0) : this.viewport?.scrollTop ?? 0; }
    private setScrollOffset(offset: number, behavior: ScrollBehavior = "auto"): void {
      if (!this.viewport) return;
      if (this.axis === "horizontal") scrollToInlineOffset(this.viewport, offset, behavior);
      else this.viewport.scrollTo({ top: offset, behavior });
    }
    private isRtl(): boolean { return this.axis === "horizontal" && getComputedStyle(this.viewport ?? this).direction === "rtl"; }

    private positiveNumber(value: string | null, fallback: number): number {
      const number = Number(value);
      return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
    }
  }
  customElements.define("spui-virtual-list", SpuiVirtualList);
}
