import * as React from "react";

export type VirtualizerMeasureProps = { defaultItemSize: number; direction?: "vertical" | "horizontal"; bufferItems?: number; bufferSize?: number };
export type VirtualizerContextMeasureProps = { contextIndex: number; setContextIndex: (index: number) => void; childProgressiveSizes: React.MutableRefObject<number[]> };
export type VirtualizerMeasureDynamicProps = VirtualizerMeasureProps & { virtualizerContext: VirtualizerContextMeasureProps; numItems: number; getItemSize: (index: number) => number };
export interface IndexedResizeCallbackElement { handleResize: () => void }

type Measurement = { virtualizerLength: number; bufferItems: number; bufferSize: number };

function viewportLength(element: HTMLElement, direction: "vertical" | "horizontal"): number {
  if (element === element.ownerDocument.body) return direction === "vertical" ? element.ownerDocument.defaultView?.innerHeight ?? 0 : element.ownerDocument.defaultView?.innerWidth ?? 0;
  const rect = element.getBoundingClientRect();
  return direction === "vertical" ? rect.height : rect.width;
}

function scrollToHorizontalItem(view: HTMLElement, offset: number, behavior: ScrollBehavior): void {
  const rtl = view.ownerDocument.defaultView?.getComputedStyle(view).direction === "rtl";
  view.scrollTo({ left: rtl ? -offset : offset, behavior });
}

/** Measure a fixed-size viewport and calculate a bounded item window. */
export function useStaticVirtualizerMeasure<TElement extends HTMLElement = HTMLElement>(props: VirtualizerMeasureProps): {
  virtualizerLength: number; bufferItems: number; bufferSize: number; scrollRef: (element: TElement | null) => void; containerSizeRef: React.MutableRefObject<number>;
} {
  const { defaultItemSize, direction = "vertical", bufferItems: configuredBufferItems, bufferSize: configuredBufferSize } = props;
  const [measurement, setMeasurement] = React.useState<Measurement>({ virtualizerLength: 0, bufferItems: 0, bufferSize: 0 });
  const containerSizeRef = React.useRef(0);
  const elementRef = React.useRef<HTMLElement | null>(null);
  const update = React.useCallback((element = elementRef.current) => {
    if (!element) return;
    const size = Math.max(0, viewportLength(element, direction));
    containerSizeRef.current = size;
    const visible = Math.ceil(size / Math.max(1, defaultItemSize) + 1);
    const next = { virtualizerLength: visible + (configuredBufferItems ?? Math.max(Math.ceil(visible / 4), 1)) * 2, bufferItems: configuredBufferItems ?? Math.max(Math.ceil(visible / 4), 1), bufferSize: configuredBufferSize ?? Math.max(defaultItemSize / 2, 1) };
    setMeasurement(previous => previous.virtualizerLength === next.virtualizerLength && previous.bufferItems === next.bufferItems && previous.bufferSize === next.bufferSize ? previous : next);
  }, [direction, defaultItemSize, configuredBufferItems, configuredBufferSize]);
  const observerRef = useResizeObserverRef_unstable(() => update());
  const scrollRef = React.useCallback((element: TElement | null) => {
    elementRef.current = element;
    observerRef(element);
    if (element) update(element);
  }, [observerRef, update]);
  React.useEffect(() => {
    const element = elementRef.current;
    const win = element?.ownerDocument.defaultView;
    if (!element || element !== element.ownerDocument.body || !win) return;
    const onResize = (): void => update();
    win.addEventListener("resize", onResize, { passive: true });
    return () => win.removeEventListener("resize", onResize);
  }, [update]);
  return { ...measurement, scrollRef, containerSizeRef };
}

/** Measure only enough variable-size rows to cover the current scroll viewport. */
export function useDynamicVirtualizerMeasure<TElement extends HTMLElement = HTMLElement>(props: VirtualizerMeasureDynamicProps): {
  virtualizerLength: number; bufferItems: number; bufferSize: number; scrollRef: (element: TElement | null) => void; containerSizeRef: React.RefObject<number>; updateScrollPosition: (position: number) => void;
} {
  const { defaultItemSize, direction = "vertical", numItems, getItemSize, bufferItems: configuredBufferItems, bufferSize: configuredBufferSize, virtualizerContext } = props;
  const [measurement, setMeasurement] = React.useState<Measurement>({ virtualizerLength: 0, bufferItems: 0, bufferSize: 0 });
  const containerSizeRef = React.useRef(0);
  const elementRef = React.useRef<HTMLElement | null>(null);
  const positionRef = React.useRef(0);
  const update = React.useCallback((element = elementRef.current) => {
    if (!element) return;
    containerSizeRef.current = Math.max(0, viewportLength(element, direction));
    const bufferSize = configuredBufferSize ?? Math.max(defaultItemSize / 2, 1);
    const progressiveSizes = virtualizerContext.childProgressiveSizes.current;
    let visible = 0;
    let covered = 0;
    let start = Math.max(0, Math.min(Math.floor(virtualizerContext.contextIndex), Math.max(0, numItems - 1)));
    if (progressiveSizes.length >= numItems) {
      let low = 0;
      let high = numItems;
      while (low < high) {
        const middle = (low + high) >>> 1;
        if (progressiveSizes[middle] <= positionRef.current) low = middle + 1;
        else high = middle;
      }
      start = Math.min(Math.max(0, numItems - 1), low);
    }
    while (start + visible < numItems && covered < containerSizeRef.current + bufferSize * 2) {
      const estimated = getItemSize(start + visible);
      const size = Number.isFinite(estimated) && estimated > 0 ? estimated : defaultItemSize;
      const end = progressiveSizes[start + visible];
      const beginning = start + visible === 0 ? 0 : progressiveSizes[start + visible - 1];
      const rowStart = Number.isFinite(end) ? beginning : (start + visible) * defaultItemSize;
      const rowEnd = Number.isFinite(end) ? end : rowStart + size;
      if (rowEnd > positionRef.current) { covered += Math.max(0, Math.min(rowEnd, positionRef.current + containerSizeRef.current + bufferSize * 2) - Math.max(rowStart, positionRef.current)); visible++; }
      else visible++;
    }
    const nextBufferItems = configuredBufferItems ?? Math.max(Math.ceil(visible / 3), 1);
    const next = { virtualizerLength: Math.min(numItems, visible + nextBufferItems * 2), bufferItems: nextBufferItems, bufferSize };
    if (virtualizerContext.contextIndex !== start) virtualizerContext.setContextIndex(start);
    setMeasurement(previous => previous.virtualizerLength === next.virtualizerLength && previous.bufferItems === next.bufferItems && previous.bufferSize === next.bufferSize ? previous : next);
  }, [direction, defaultItemSize, numItems, getItemSize, configuredBufferItems, configuredBufferSize, virtualizerContext.contextIndex, virtualizerContext.childProgressiveSizes]);
  const observerRef = useResizeObserverRef_unstable(() => update());
  const scrollRef = React.useCallback((element: TElement | null) => { elementRef.current = element; observerRef(element); if (element) update(element); }, [observerRef, update]);
  const updateScrollPosition = React.useCallback((position: number) => { positionRef.current = Number.isFinite(position) ? Math.max(0, position) : 0; update(); }, [update]);
  React.useLayoutEffect(() => { update(); }, [update]);
  return { ...measurement, scrollRef, containerSizeRef, updateScrollPosition };
}

/** Track measured widths/heights by item index for legacy dynamic virtualizer composition. */
export function useMeasureList<TElement extends HTMLElement & IndexedResizeCallbackElement = HTMLElement & IndexedResizeCallbackElement>(currentIndex: number, _refLength: number, totalLength: number, defaultItemSize: number): {
  widthArray: React.MutableRefObject<number[]>; heightArray: React.MutableRefObject<number[]>; createIndexedRef: (index: number) => (element: TElement | null) => void; refArray: React.MutableRefObject<Array<TElement | undefined | null>>; sizeUpdateCount: number;
} {
  const widthArray = React.useRef(Array(Math.max(0, totalLength)).fill(defaultItemSize));
  const heightArray = React.useRef(Array(Math.max(0, totalLength)).fill(defaultItemSize));
  const refArray = React.useRef<Array<TElement | undefined | null>>([]);
  const [sizeUpdateCount, setSizeUpdateCount] = React.useState(0);
  const observer = React.useRef<ResizeObserver | null>(null);
  const observerDocument = React.useRef<Document | null>(null);
  const indexByElement = React.useRef(new WeakMap<Element, number>());
  React.useEffect(() => {
    const previousLength = widthArray.current.length;
    widthArray.current.length = Math.max(0, totalLength);
    heightArray.current.length = Math.max(0, totalLength);
    for (let index = previousLength; index < widthArray.current.length; index++) widthArray.current[index] = heightArray.current[index] = defaultItemSize;
    refArray.current.length = Math.max(0, totalLength);
  }, [defaultItemSize, totalLength]);
  React.useEffect(() => () => observer.current?.disconnect(), []);
  const measure = React.useCallback((element: TElement, index: number) => {
    const rect = element.getBoundingClientRect();
    const width = rect.width || defaultItemSize;
    const height = rect.height || defaultItemSize;
    if (widthArray.current[index] !== width || heightArray.current[index] !== height) {
      widthArray.current[index] = width;
      heightArray.current[index] = height;
      setSizeUpdateCount(count => count + 1);
    }
  }, [defaultItemSize]);
  const createIndexedRef = React.useCallback((index: number) => (element: TElement | null) => {
    const absoluteIndex = Math.max(0, Math.floor(currentIndex + index));
    const prior = refArray.current[absoluteIndex];
    if (prior && prior !== element) observer.current?.unobserve(prior);
    refArray.current[absoluteIndex] = element;
    if (!element) return;
    indexByElement.current.set(element, absoluteIndex);
    element.handleResize = () => measure(element, absoluteIndex);
    const ResizeObserverCtor = element.ownerDocument.defaultView?.ResizeObserver;
    if (ResizeObserverCtor && (!observer.current || observerDocument.current !== element.ownerDocument)) {
      observer.current?.disconnect();
      const nextObserver = createResizeObserverFromDocument(element.ownerDocument, entries => entries.forEach(entry => {
        const row = entry.target as TElement;
        const rowIndex = indexByElement.current.get(row);
        if (rowIndex !== undefined) measure(row, rowIndex);
      }));
      observer.current = nextObserver;
      observerDocument.current = element.ownerDocument;
    }
    observer.current?.observe(element);
    measure(element, absoluteIndex);
  }, [currentIndex, measure]);
  return { widthArray, heightArray, createIndexedRef, refArray, sizeUpdateCount };
}

export type ResizeCallbackWithRef = (entries: ResizeObserverEntry[], observer: ResizeObserver, scrollRef?: React.MutableRefObject<HTMLElement | null>) => void;
export type ScrollToItemStaticParams = { index: number; itemSize: number; totalItems: number; scrollViewRef: React.RefObject<HTMLElement | null>; axis?: "horizontal" | "vertical"; reversed?: boolean; behavior?: ScrollBehavior };
export type ScrollToItemDynamicParams = { index: number; itemSizes: React.RefObject<number[] | null>; totalSize: number; scrollViewRef: React.RefObject<HTMLElement | null>; axis?: "horizontal" | "vertical"; reversed?: boolean; behavior?: ScrollBehavior };

/** Create an observer from the document's own window, including when an SPFx part is rendered in an iframe. */
export function createResizeObserverFromDocument(targetDocument: Document | null | undefined, callback: ResizeObserverCallback): ResizeObserver | null {
  const Observer = targetDocument?.defaultView?.ResizeObserver;
  return Observer ? new Observer(callback) : null;
}

/** Mirror a four-sided LTR observer margin for an RTL root. */
export function getRTLRootMargin(ltrRootMargin: string, target?: Element | Document | null, win?: Window | null): string {
  const element = target?.nodeType === 9 ? (target as Document).documentElement : target as Element | undefined | null;
  if (!element || !win || win.getComputedStyle(element).direction !== "rtl") return ltrRootMargin;
  const margins = ltrRootMargin.trim().split(/\s+/);
  return margins.length === 4 ? `${margins[0]} ${margins[3]} ${margins[2]} ${margins[1]}` : ltrRootMargin;
}

/** Observe a changing element list with native IntersectionObserver and direction-aware margins. */
export function useIntersectionObserver(callback: IntersectionObserverCallback, options?: IntersectionObserverInit): {
  setObserverList: React.Dispatch<React.SetStateAction<Element[] | undefined>>;
  setObserverInit: (next: IntersectionObserverInit | undefined) => void;
  observer: React.MutableRefObject<IntersectionObserver | undefined>;
} {
  const [elements, setElements] = React.useState<Element[] | undefined>();
  const [init, setInit] = React.useState(options);
  const observer = React.useRef<IntersectionObserver | undefined>(undefined);
  const callbackRef = React.useRef(callback);
  const [directionRevision, setDirectionRevision] = React.useState(0);
  callbackRef.current = callback;

  const setObserverInit = React.useCallback((next: IntersectionObserverInit | undefined) => setInit(next), []);
  React.useEffect(() => {
    const root = init?.root as Element | null | undefined;
    const doc = root?.ownerDocument ?? (typeof document === "undefined" ? undefined : document);
    const MutationObserverCtor = doc?.defaultView?.MutationObserver;
    if (!MutationObserverCtor || !root) return;
    const mutationObserver = new MutationObserverCtor(records => {
      if (records.some(record => record.attributeName === "dir")) setDirectionRevision(revision => revision + 1);
    });
    mutationObserver.observe(doc!.documentElement, { attributes: true, subtree: true, attributeFilter: ["dir"] });
    return () => mutationObserver.disconnect();
  }, [init?.root]);
  React.useEffect(() => {
    const root = init?.root as Element | null | undefined;
    const doc = (root?.nodeType === 1 ? root.ownerDocument : typeof document === "undefined" ? undefined : document);
    const win = doc?.defaultView;
    if (!win?.IntersectionObserver) return;
    const rootMargin = getRTLRootMargin(init?.rootMargin ?? "0px", init?.root as Element | null, win);
    const instance = new win.IntersectionObserver((entries, current) => callbackRef.current(entries, current), { ...init, rootMargin });
    observer.current = instance;
    elements?.forEach(element => instance.observe(element));
    return () => {
      instance.disconnect();
      if (observer.current === instance) observer.current = undefined;
    };
  }, [elements, init, directionRevision]);
  return { setObserverList: setElements, setObserverInit, observer };
}

/** Attach a resize observer callback ref; it is safe when ResizeObserver is unavailable. */
export function useResizeObserverRef_unstable(resizeCallback: ResizeCallbackWithRef): (instance: HTMLElement | null) => void {
  const callbackRef = React.useRef(resizeCallback);
  callbackRef.current = resizeCallback;
  const observed = React.useRef<{ element: HTMLElement; observer: ResizeObserver } | null>(null);
  React.useEffect(() => () => { observed.current?.observer.disconnect(); observed.current = null; }, []);
  return React.useCallback(instance => {
    const current = observed.current;
    if (current?.element === instance) return;
    current?.observer.disconnect();
    observed.current = null;
    const Observer = instance?.ownerDocument.defaultView?.ResizeObserver;
    if (!instance || !Observer) return;
    const target = { current: instance };
    const observer = new Observer((entries, currentObserver) => callbackRef.current(entries, currentObserver, target));
    observed.current = { element: instance, observer };
    observer.observe(instance);
  }, []);
}

/** Scroll an element to a fixed-size virtual item. */
export function scrollToItemStatic({ index, itemSize, totalItems, scrollViewRef, axis = "vertical", reversed = false, behavior = "auto" }: ScrollToItemStaticParams): void {
  const view = scrollViewRef.current;
  if (!view || !Number.isFinite(index) || !Number.isFinite(itemSize) || itemSize <= 0 || totalItems <= 0) return;
  const safeIndex = Math.max(0, Math.min(totalItems - 1, Math.floor(index)));
  const offset = reversed ? Math.max(0, totalItems * itemSize - itemSize * (safeIndex + 1)) : safeIndex * itemSize;
  if (axis === "horizontal") scrollToHorizontalItem(view, offset, behavior);
  else view.scrollTo({ top: offset, behavior });
}

/** Scroll an element to a measured item; summing the prefix is O(index), so keep the measured list modest. */
export function scrollToItemDynamic({ index, itemSizes, totalSize, scrollViewRef, axis = "vertical", reversed = false, behavior = "auto" }: ScrollToItemDynamicParams): void {
  const view = scrollViewRef.current;
  const sizes = itemSizes.current;
  if (!view || !sizes || !Number.isFinite(index) || !sizes.length) return;
  const safeIndex = Math.max(0, Math.min(sizes.length - 1, Math.floor(index)));
  let offset = 0;
  for (let item = 0; item < safeIndex; item++) offset += Number.isFinite(sizes[item]) ? Math.max(0, sizes[item]) : 0;
  if (reversed) offset = Math.max(0, totalSize - offset - (Number.isFinite(sizes[safeIndex]) ? Math.max(0, sizes[safeIndex]) : 0));
  if (axis === "horizontal") scrollToHorizontalItem(view, offset, behavior);
  else view.scrollTo({ top: offset, behavior });
}
