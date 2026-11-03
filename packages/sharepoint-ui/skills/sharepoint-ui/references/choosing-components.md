# Choosing components

- Actions: `Button`.
- People and entities: `Avatar` with a name and optional image; use theme-derived `color="colorful"` for stable initials colors.
- Repeated SharePoint records: `ViewCard` for document, person, task, approval, or list-item content; compose details through slots.
- Filter and selected-value chips: use `Tag` inside a labelled `TagGroup`; set `dismissible` and update the backing array in `onDismiss`.
- Searchable multi-select values: use `TagPicker` with `TagPickerOption` children, stable values, and a controlled `selectedValues` array.
- User-provided scores: use `Rating` with a visible label and controlled `value`; set `step={0.5}` when half-star scores are useful.
- Short text and multiline text: `TextField` and `TextArea`.
- Typography and semantic labels: `Text` for heading/body/emphasis styles, and `Label` for form-control labels. Non-React code can use `spui-text` with `defineText()`; use the `createLabel()` factory when native `for` association is needed.
- Fixed choices: `Select` or `RadioGroup`.
- Searchable choices: `ComboBox` and `ComboOption`.
- Numeric/date/range values: `SpinButton`, `DatePicker`, and `Slider`.
- Rich formatted notes: `RichTextEditor`; it is a lightweight SharePoint-oriented editor, not a collaborative document surface.
- Navigation and disclosure: `Link` for URLs, `Divider` to separate content groups, and `Accordion` with `AccordionItem` for progressive disclosure. Prefer an explicit link name and preserve native anchor behavior.
- Persistent feedback: `Alert` for live status/urgent information; `MessageBar` for page-level notices. Use `Skeleton` for loading placeholders, and `Badge`, `Spinner`, or `ProgressBar` for compact status/progress.
- Brief feedback: mount one `Toaster` near the app root and call `dispatchToast` from `useToastController()`. Use persistent `Alert`/`MessageBar` content as well when the user must be able to return to the information later.
- Confirmation: `Dialog`.

Import React adapters from `@spfx-fast/sharepoint-ui/react`. For non-React use, import the matching leaf module, call its `define*()` function once, and use the tag from `components.json`; `Label` is the exception because its factory returns a native `<label>`. Check the source catalog before substituting a native element for a missing library family.
