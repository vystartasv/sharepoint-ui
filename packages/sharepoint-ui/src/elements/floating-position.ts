export type FloatingPlacement = "top" | "bottom" | "start" | "end" | "left" | "right";
export type FloatingPosition = { top: number; left: number; placement: Exclude<FloatingPlacement, "start" | "end">; align: FloatingAlign };
export type FloatingAlign = "start" | "center" | "end" | "top" | "bottom";
export type FloatingModifiers = { crossAxisOffset?: number; coverTarget?: boolean; overflowBoundaryPadding?: { top?: number; right?: number; bottom?: number; left?: number } };
export type FloatingAnchorRect = Pick<DOMRectReadOnly, "left" | "top" | "right" | "bottom" | "width" | "height">;
export type FloatingBoundary = Element | { x: number; y: number; width: number; height: number } | readonly Element[] | "clippingParents" | "scrollParent" | "window" | null;

export function getFloatingBoundary(boundary: FloatingBoundary | undefined, context: Element, viewport = { width: innerWidth, height: innerHeight }): Pick<DOMRectReadOnly, "left" | "top" | "right" | "bottom"> | undefined {
  if (boundary === undefined || boundary === null || boundary === "window") return undefined;
  const rectEdges = (rect: { x?: number; y?: number; left?: number; top?: number; width: number; height: number }) => {
    const left = rect.left ?? rect.x ?? 0;
    const top = rect.top ?? rect.y ?? 0;
    return { left, top, right: left + rect.width, bottom: top + rect.height };
  };
  const isElement = (value: unknown): value is Element => Boolean(value && typeof value === "object" && (value as Node).nodeType === 1 && typeof (value as Element).getBoundingClientRect === "function");
  if (Array.isArray(boundary)) {
    const rects = boundary.map(element => rectEdges(element.getBoundingClientRect()));
    if (!rects.length) return undefined;
    const left = Math.max(...rects.map(rect => rect.left));
    const top = Math.max(...rects.map(rect => rect.top));
    return { left, top, right: Math.max(left, Math.min(...rects.map(rect => rect.right))), bottom: Math.max(top, Math.min(...rects.map(rect => rect.bottom))) };
  }
  if (isElement(boundary)) return rectEdges(boundary.getBoundingClientRect());
  if (typeof boundary === "object" && "width" in boundary && "height" in boundary) return rectEdges(boundary);
  if (boundary !== "clippingParents" && boundary !== "scrollParent") return undefined;
  const bounds = { left: 0, top: 0, right: viewport.width, bottom: viewport.height };
  const view = context.ownerDocument.defaultView;
  const parent = (current: Element): Element | null => current.parentElement ?? (current.getRootNode() instanceof ShadowRoot ? (current.getRootNode() as ShadowRoot).host : null);
  for (let current = parent(context); current; current = parent(current)) {
    const style = view?.getComputedStyle(current);
    if (!style) continue;
    const clipsX = /^(auto|scroll|hidden|clip|overlay)$/.test(style.overflowX);
    const clipsY = /^(auto|scroll|hidden|clip|overlay)$/.test(style.overflowY);
    const scrolls = /^(auto|scroll|hidden|overlay)$/.test(style.overflowX) || /^(auto|scroll|hidden|overlay)$/.test(style.overflowY);
    if (boundary === "scrollParent" && !scrolls) continue;
    if (!clipsX && !clipsY) continue;
    const rect = current.getBoundingClientRect();
    const left = rect.left + current.clientLeft;
    const top = rect.top + current.clientTop;
    if (boundary === "scrollParent") return { left, top, right: left + current.clientWidth, bottom: top + current.clientHeight };
    if (clipsX) { bounds.left = Math.max(bounds.left, left); bounds.right = Math.min(bounds.right, left + current.clientWidth); }
    if (clipsY) { bounds.top = Math.max(bounds.top, top); bounds.bottom = Math.min(bounds.bottom, top + current.clientHeight); }
  }
  return { left: bounds.left, top: bounds.top, right: Math.max(bounds.left, bounds.right), bottom: Math.max(bounds.top, bounds.bottom) };
}

export function getFloatingPosition(anchor: FloatingAnchorRect, surface: Pick<DOMRectReadOnly, "width" | "height">, placement: FloatingPlacement, direction: "ltr" | "rtl", gap = 8, viewport = { width: innerWidth, height: innerHeight }, align: FloatingAlign = "center", fallbackPlacements: Array<{ placement: FloatingPlacement; align?: FloatingAlign }> = [], pinned = false, flipBoundary?: Pick<DOMRectReadOnly, "left" | "top" | "right" | "bottom">, overflowBoundary?: Pick<DOMRectReadOnly, "left" | "top" | "right" | "bottom">, modifiers: FloatingModifiers = {}): FloatingPosition {
  const viewportBoundary = { left: 0, top: 0, right: viewport.width, bottom: viewport.height };
  const flipBounds = flipBoundary ?? viewportBoundary;
  const overflowBounds = overflowBoundary ?? viewportBoundary;
  const overflowPadding = modifiers.overflowBoundaryPadding ?? {};
  const side = placement === "start" ? direction === "rtl" ? "right" : "left" : placement === "end" ? direction === "rtl" ? "left" : "right" : placement;
  const opposite: Record<FloatingPosition["placement"], FloatingPosition["placement"]> = { top: "bottom", bottom: "top", left: "right", right: "left" };
  const coordinates = (candidate: FloatingPosition["placement"], candidateAlign: FloatingAlign = align): { top: number; left: number } => {
    const candidateInlineAlign = candidateAlign === "start" || candidateAlign === "top" ? "start" : candidateAlign === "end" || candidateAlign === "bottom" ? "end" : "center";
    const candidateBlockAlign = candidateAlign === "start" || candidateAlign === "top" ? "start" : candidateAlign === "end" || candidateAlign === "bottom" ? "end" : "center";
    const inlineStartLeft = direction === "rtl" ? anchor.right - surface.width : anchor.left;
    const inlineEndLeft = direction === "rtl" ? anchor.left : anchor.right - surface.width;
    return candidate === "top" || candidate === "bottom"
      ? { top: candidate === "top" ? (modifiers.coverTarget ? anchor.bottom : anchor.top) - surface.height - gap : (modifiers.coverTarget ? anchor.top : anchor.bottom) + gap, left: (candidateInlineAlign === "start" ? inlineStartLeft : candidateInlineAlign === "end" ? inlineEndLeft : anchor.left + (anchor.width - surface.width) / 2) + (modifiers.crossAxisOffset ?? 0) }
      : { top: (candidateBlockAlign === "start" ? anchor.top : candidateBlockAlign === "end" ? anchor.bottom - surface.height : anchor.top + (anchor.height - surface.height) / 2) + (modifiers.crossAxisOffset ?? 0), left: candidate === "left" ? (modifiers.coverTarget ? anchor.right : anchor.left) - surface.width - gap : (modifiers.coverTarget ? anchor.left : anchor.right) + gap };
  };
  const fits = (_candidate: FloatingPosition["placement"], point: { top: number; left: number }): boolean => point.top >= flipBounds.top + gap && point.left >= flipBounds.left + gap && point.top + surface.height <= flipBounds.bottom - gap && point.left + surface.width <= flipBounds.right - gap;
  const candidates = [
    { placement: side, align },
    ...(pinned ? [] : fallbackPlacements),
    ...(!pinned ? [{ placement: opposite[side], align }] : []),
  ].map(candidate => ({ placement: candidate.placement === "start" ? direction === "rtl" ? "right" as const : "left" as const : candidate.placement === "end" ? direction === "rtl" ? "left" as const : "right" as const : candidate.placement, align: candidate.align ?? align }));
  const unique = candidates.filter((candidate, index) => candidates.findIndex(other => other.placement === candidate.placement && other.align === candidate.align) === index);
  let selected = unique.map(candidate => ({ ...candidate, point: coordinates(candidate.placement, candidate.align) })).find(candidate => fits(candidate.placement, candidate.point));
  if (!selected) {
    selected = unique.map(candidate => ({ ...candidate, point: coordinates(candidate.placement, candidate.align) })).sort((a, b) => {
      const overflow = (candidate: typeof a): number => Math.max(0, flipBounds.left + gap - candidate.point.left) + Math.max(0, candidate.point.left + surface.width - (flipBounds.right - gap)) + Math.max(0, flipBounds.top + gap - candidate.point.top) + Math.max(0, candidate.point.top + surface.height - (flipBounds.bottom - gap));
      return overflow(a) - overflow(b);
    })[0];
  }
  const actual = selected.placement;
  const point = selected.point;
  return {
    placement: actual,
    align: selected.align,
    left: Math.max(overflowBounds.left + gap + (overflowPadding.left ?? 0), Math.min(point.left, overflowBounds.right - surface.width - gap - (overflowPadding.right ?? 0))),
    top: Math.max(overflowBounds.top + gap + (overflowPadding.top ?? 0), Math.min(point.top, overflowBounds.bottom - surface.height - gap - (overflowPadding.bottom ?? 0))),
  };
}
