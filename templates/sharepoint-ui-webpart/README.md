# SharePoint UI web part template

This is a minimal SPFx 1.24 React web part using `Field`, `Input`, `Button`, `Card`, and `Alert`. It validates and saves a workspace name in local component state to demonstrate the control flow. Replace that state update with the web part's SharePoint service when the app needs persistence.

React 18.3.1 is supplied by the SPFx host. The template imports `@spfx-fast/sharepoint-ui/styles.css` and wraps its controls in `SharePointThemeProvider`.

An agent can fill `getByRole("textbox", { name: "Workspace name" })`, click `getByRole("button", { name: "Save workspace" })`, then verify the named `status` message.
