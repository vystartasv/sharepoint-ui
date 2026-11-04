# Contributing

Use native HTML and the current component API. Do not add compatibility layers for removed APIs.

Run the relevant build from the repository root:

```sh
npm ci
npm run build:library
npm run build:spfx
npm run build:docs
```

Update the component catalog and docs when public behavior changes. Measure package changes with `npm run measure:components`.
