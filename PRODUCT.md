# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

GitHub Pages hosting is confirmed by the user. The docs site will use Astro/Starlight, built code-first and generated from the component catalog and compiled custom elements.

## Users

SharePoint Framework developers and coding agents assembling SharePoint web parts. The library should let both groups find a component, understand its constraints, and compose a working web part quickly.

## Product Purpose

Provide a fast, accessible, theme-aware UI library for SPFx 1.24, with a public documentation and presentation site that explains the library, its components, usage patterns, and measured behavior.

## Positioning

The library aims for Fluent UI v9 breadth while keeping its core framework-independent, performance-focused, and shaped for SharePoint. React is an adapter rather than a requirement. Agent-ready APIs, per-component packaging, SharePoint theme inheritance, and practical SPFx examples are core differentiators.

## Operating Context

The library is developed in this GitHub repository and validated in SPFx 1.24 against an authenticated SharePoint tenant. Consumers may use React 18 or custom elements from other frameworks and plain HTML. The documentation site should live with the source so API guidance and examples can be reviewed and versioned alongside components. NPM publication is planned after the library is ready; CI publication follows the first release.

## Capabilities and Constraints

- Reach parity with the Fluent UI v9 component catalog, with each family documented, accessible, theme-aware, composable, and measured before it is called complete.
- Support all SharePoint and Fluent theme tokens, fonts, custom styling, and appearance presets including iOS, Windows, Linux, and derived glass/stone finishes.
- Support multilingual content and language-driven LTR/RTL direction, including Arabic.
- Package only selected components in consumer builds and keep React optional for custom-element use.
- Include realistic, usable component examples and SharePoint-specific persistence and data-rendering guidance.
- The docs website should make component guidance, examples, explanations, theming, accessibility, and performance information browsable from GitHub.
- Performance, accessibility, and current API behavior must be demonstrated with evidence; do not present partial catalog matches as complete parity.

## Brand Commitments

The documentation site should provide a browsable component and design-system experience similar in purpose to the Fluent UI documentation site. Do not copy Fluent UI's branding or claim official affiliation.

## Evidence on Hand

- `packages/sharepoint-ui/components.json` contains the public component API index.
- `investigation/fluent-v9-catalog-9.75.0.json` and `investigation/FLUENT-V9-PARITY-PLAN.md` track comparison scope and open work.
- Authenticated SPFx validation pages and measurements are recorded under `test-results/library-demo/` and `investigation/`.
- No customer testimonials, adoption statistics, or independently validated comparative performance claims are supplied.

## Product Principles

- Make common SharePoint web-part work quick for people and coding agents.
- Keep Toolbar commands visually consistent with the library's existing controls.
- Preserve host theme, locale, direction, and accessibility semantics.
- Keep bundle cost proportional to the components an app selects.
- Explain behavioral limits and incomplete parity plainly.
- Tie performance and accessibility claims to reproducible measurements.

## Accessibility & Inclusion

Accessibility is an explicit product requirement. Components and documentation examples should support keyboard operation, visible focus, semantic names and roles, high contrast, reduced motion, readable contrast, responsive layouts, localization, and language-driven RTL/LTR behavior.
