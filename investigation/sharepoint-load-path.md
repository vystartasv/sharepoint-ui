# SharePoint page loading experiment

**Run date:** 2026-10-31  
**Page:** `SharePointUIParityLab036.aspx` in the Vilius profile  
**Scope:** one authenticated browser reload; existing comprehensive UI lab, no page edits.

## What the page does

Modern SharePoint does not hydrate this web part's React markup from server-rendered HTML. SharePoint loads its page/canvas model, mounts the client-side canvas, asks the SPFx component loader for the web part bundle, then runs the web part lifecycle. This web part uses React `createRoot`, so React mounts client-side after SPFx calls `render`; it does not call `hydrateRoot`.

The library's core does not fetch SharePoint content. The host web part supplies `SPHttpClient` and site context. This demo has an effect that asynchronously reads the latest rich-text test item after its first React render. Saving content is an explicit action and performs list/field checks, a write, and readback.

## One-run browser observations

The values below came from the browser's Navigation/Resource Timing entries and SharePoint's own performance marks after opening the published page. They are a diagnostic sample, not a repeatable benchmark or p50/p95 claim.

| Event/measurement | Observed | Meaning / limitation |
|---|---:|---|
| Document response start (TTFB) | 1,761 ms | Dominated by page/tenant/network startup in this run; outside the UI library. |
| DOMContentLoaded | 1,808 ms | Main document parsing milestone. |
| SharePoint canvas mounted | 2,084 ms | SharePoint mark `SPCanvas.Mounted`. |
| Web part module load start | 2,099 ms | SharePoint `ClientSideWebPartManager.load(...).start`. |
| Web part script resource | 255,848 B encoded body; 235 ms resource duration | Browser reported `transferSize: 0` (cached), so this is not a wire-transfer size. It is the whole lab web-part bundle, not the library's minimal component cost. |
| Web part module load end | 2,348 ms | SharePoint loader's end mark, about 249 ms after load start. Includes loader/module work, not just download. |
| Initialize | 0.5 ms | SharePoint start/end marks around `initialize`; `onInit` does not wait for data calls. |
| SPFx render completion | 1.7 ms | SharePoint render/complete marks. React `createRoot.render()` schedules the commit, so this is not a React commit/paint duration. |
| First rich-text item request | started about 2,431 ms | Initiated after web-part render; asynchronous, so it does not gate `onInit`. |
| DOM in the web part | 400 descendants; about 542 KB serialized `innerHTML` | This fixture deliberately displays many examples and large generated component styles/markup. It is not representative of a normal single-card web part. |
| Page resources | 331 entries; about 24.4 MB encoded body sizes | Includes SharePoint shell, deferred chunks, and cached resources; `transferSize` totals only about 26 KB in this run due to cache. Do not interpret as cold-network cost. |
| Long tasks | 0 entries observed | One run after load; does not rule out shorter tasks or early tasks not captured by the observer. |

### Fresh live-page inspection

I reread the currently open page in the Vilius profile without changing it. This is another single warm/cached observation, not an independent cold run. The dashboard's mount counter reports 36.1 ms, alongside 66 registered library elements, one long task, and a 72.7 MiB JS heap. **The 36.1 ms value is not a true mount/paint measurement:** it is calculated in a `useState` initializer during React render, before commit. The web part script is still 255,848 B decoded, 235.3 ms resource duration, and `transferSize: 0`. The browser exposes 357 resource entries and about 24.5 MB of encoded body sizes, but only about 26.8 KB transferred in this cached session.

| Additional observation | Result | Interpretation |
|---|---:|---|
| SPFx component module load | 2,099–2,348 ms (249.4 ms) | Loader interval includes loading/evaluating the full demo bundle. |
| SPFx initialize | 0.5 ms | Theme/context wiring only; no awaited content fetch. |
| SPFx render-complete | 1.6 ms | Ends before React's scheduled commit and paint. |
| First demo rich-text list request | 2,431 ms start; 113.3 ms duration | Occurs after SPFx render, so saved content does not block initial web-part creation. |
| Demo root DOM | 399 descendants; 542,169-character `innerHTML` | Broad fixture cost; not a single-control baseline. |
| Largest SharePoint JS resource | `sp-pages-assembly`: 5,295,157 decoded bytes | Host resource, cached; not a UI-library download charge. |

This supports (but does not yet prove causally) the hypothesis that the biggest opportunity we control is reducing eager demo/component work, not changing the page's SharePoint-shell startup. Import slices in `component-slice-benchmarks.json` already indicate a leaf custom element can be roughly 1–5.5 KB compressed depending on the component, while selected React adapter slices range roughly 3–7.2 KB compressed with React external. The end-to-end 255.8 KB is the whole demo app, so it cannot be attributed to the library runtime alone.

## Package composition decision from this experiment

- Keep custom elements as the small framework-neutral engine, and retain the explicit per-element package exports. The React adapter remains optional and tree-shakeable; use a selected component import instead of `defineSharePointUIElements()` when a page needs only a few controls.
- Make heavy editors, data grids, advanced pickers, and rarely opened property-pane experiences asynchronous imports. For rich text, load editor code on activation/visibility and show a light placeholder first; do not delay page rendering while the editor initializes.
- Keep SharePoint data fetching in the consuming web part/application. Render the shell or loading state first, cancel obsolete requests, and only fetch offscreen/closed surfaces when product behavior requires it.
- Avoid promising an exact SharePoint page speedup from package microbenchmarks. Verify with three separate deployed fixtures—empty web part, one card/form, and full catalog—using the Developer Dashboard's response/module/init/data/render categories and browser commit/paint marks. Run repeated warm/cold samples; this turn only re-inspected one warm cached page.
- Replace the demo's current “Library mount” metric with a React `Profiler`/commit timestamp plus a first-visible-frame mark; keep the existing class-start-to-render number only if renamed to describe that interval accurately.

## What this tells us

1. **The host dominates this sample.** The document TTFB and SharePoint shell/canvas startup happen before our web part's module load. A library cannot optimize those phases.
2. **Keep `onInit` free of content fetching.** The current web part gets theme/context in `onInit` and starts saved-content loading in a React effect. That follows Microsoft's guidance: render useful UI first, then load non-critical data asynchronously.
3. **Our sample page is the main optimization target.** It mounts a broad catalog of examples together; its 400 descendants and ~542 KB markup should not be mistaken for the normal cost of one library component. Benchmark a minimal web part, one card/form, and the full catalog separately.
4. **Preserve per-component imports and tree-shaking.** The package exports individual element entry points and declares `sideEffects: false`; consumers should import only the component(s) they render. Avoid importing the full `defineSharePointUIElements()` registration path for a single component. The framework-neutral custom-element entry is the low-overhead path; React adapters should remain optional.
5. **Offer demand-loaded recipes for heavy features.** Rich text, data grid, charts, advanced pickers, and editor-only/property-pane experiences should be dynamically imported when needed. Measure whether code splitting lowers the initial web-part cost enough to offset extra requests and cache behavior.
6. **The library should not own SharePoint data loading.** Keep data access in the host application's service layer; provide examples for loading/empty/error states, cancellation, caching, and progressive rendering. That lets a list or editor fetch only when it is visible/needed and avoids surprising requests from merely importing a control.

## Next controlled experiment

Use the same Vilius profile, same site theme/viewport, and SharePoint's Developer Dashboard Performance tab. Compare (a) an empty SPFx web part, (b) one UI card, (c) one form with one data request, and (d) the full catalog lab. Collect at least 10 warm and 10 cold runs for module-load, initialize, data, render, first usable content, JS transfer, long tasks, DOM count, and compressed per-entry bundle sizes. Use the dashboard's module-load/init/data/render splits and browser Resource Timing together; measure React commit with a `Profiler` or an explicit first-commit mark because SPFx's render-complete mark does not guarantee React has painted.

Do not infer cold cache/network results from `transferSize: 0` runs. Record browser cache state and whether resources came from memory/disk/service-worker cache. Test the framework-neutral entry and React adapter independently before making a parity/performance claim.

## References

- [SPFx dynamic loading guidance](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/dynamic-loading)
- [SPFx Developer Dashboard](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/use-developer-dashboard)
- [Modern SharePoint web part optimization](https://learn.microsoft.com/en-us/microsoft-365/enterprise/modern-web-part-optimization?view=o365-worldwide)
- [SPFx overview and framework support](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/sharepoint-framework-overview)

## Vilius profile browser diagnostic

The signed-in Playwright profile is healthy: SharePoint's `GetMyProperties` returned HTTP 200 for Vilius, and both the validation-site root and the library page loaded without JavaScript errors or unhandled rejections in a controlled comparison. Both pages emitted the same Graph `users/{user}/photo/$value` 404. The profile API returned `PictureUrl: null`, so this is a missing optional account photo; SharePoint falls back to initials. It does not indicate a stale browser session or a library request failure.

The earlier browser diagnostic also exposed an unsafe error handler in `scripts/tenant-validate.mjs`: it called `error.message.slice(...)` without checking that `message` was a string. The handler now formats unusual thrown values safely and reports JavaScript errors separately from resource warnings, while tracking Graph profile-photo 404s as their own count. The original intermittent `undefined` rejection did not recur in the controlled root/page comparison, so its source remains unconfirmed; it must not be attributed to Nav.

## App catalog and site instance recheck (2026-11-01)

The signed-in Vilius profile confirmed the tenant catalog was still at `1.0.0.134` while local source/package configuration had advanced to `.136`. The published test page continued to request `/sites/spfx-validation-lab/ClientSideAssets/5f68f9b1-18bb-47e8-a85f-9957dce645e4/library-demo-web-part_e70d3c0908a27188944d.js`; `GetClientSideWebParts` did not return the expected web part.

Built SPFx solution `1.0.0.137` with bundle `library-demo-web-part_3bb3cf0de590b79e739f.js`, uploaded it to the tenant app catalog, and confirmed the catalog reports `.137`, deployed, enabled, and valid. SharePoint's `InstalledVersion` field remains blank. The target site's app instance is status 9 (`Initialized`) with `InError: false`, and the page still serves `.e70d…` from the site's `ClientSideAssets` folder.

The catalog-level `Reinstall` action and a direct `AppInstance.Install()` call both returned HTTP 200, but status remained 9 after each bounded 120-second wait. `Install()` returned job ID `8e7cb866-286b-49a6-a571-43ade058711e`. The uninstall/reinstall produced a new app instance ID (`3f929b84-7fd9-44af-a9f8-685cf199ebad`) but did not provision the web part or copy the new client-side asset. No further lifecycle calls were issued after the direct retry. The first remaining deployment problem is therefore SharePoint's install job/status transition; this is separate from local build numbering and catalog upload.

For repeatable diagnosis, the deployment product now has `scripts/retry-sharepoint-app-instance-install.mjs`. It only retries exactly one status-9 instance and verifies status 5; on this tenant it reproduced the stuck state without starting unbounded retries. Keep catalog version, `InstalledVersion`, `AppInstance.Status`, registered web-part manifest, and served asset hash as separate signals.

After the tenant trial, the final local Card build is `.138` with bundle `library-demo-web-part_faded969d769c428d02e.js` (496,972 raw / 114,394 gzip / 88,990 Brotli bytes; `.sppkg` 120,072 bytes). It was not uploaded over `.137` because the existing site instance remains uninstalled; further version uploads would not validate its assets.
