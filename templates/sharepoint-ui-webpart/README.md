# SharePoint UI SPFx template

Create an SPFx 1.24 React web part that uses SharePoint UI elements:

```sh
spfx create \
  --template sharepoint-ui-webpart \
  --template-url https://github.com/vystartasv/sharepoint-ui/tree/main \
  --library-name my-sharepoint-app \
  --component-name "My SharePoint App" \
  --component-description "My SharePoint experience"
```

The generated package depends on `@spfx-fast/sharepoint-ui@^0.4.2`. The solution installs per site because it includes SharePoint assets. When publishing an update, bump both the solution and feature versions so the packaged upgrade action reapplies the web-part manifest. The sample uses a slotted `ViewCard` for a realistic document record, a keyboard-accessible review action, and SPFx locale/direction values. English and Arabic sample strings live under the generated web part's `loc` folder.

Replace the sample card's title, metadata, status, and details with your list or Graph fields. Add tenant-specific fields and actions as named slots; customize the shared appearance with provider tokens or CSS parts instead of copying the component.
