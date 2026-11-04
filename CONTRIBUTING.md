# Contributing

## Report a problem

Include the component, package version, SPFx version, browser, locale and direction, SharePoint theme, and a short reproduction. Remove tenant data, tokens, and personal information.

## Propose a change

Keep changes focused and native-first. Avoid compatibility aliases for removed APIs and avoid copying another library's interface design. Update the component catalog, agent examples, and human docs when public behavior changes. Describe the behavior and package measurements you verified.

Useful local checks:

```sh
npm run build:library
npm run build:spfx
npm run build:docs
npm run measure:components
```

For UI changes, use visible labels and native roles, forward `data-*` props, and document agent locators that verify a resulting value or status.
