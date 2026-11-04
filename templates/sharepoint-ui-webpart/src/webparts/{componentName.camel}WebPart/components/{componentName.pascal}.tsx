import * as React from "react";
import { Alert, Button, Card, Field, Input, SharePointThemeProvider } from "@spfx-fast/sharepoint-ui/react";
import "@spfx-fast/sharepoint-ui/styles.css";
import styles from "./<%= componentName.pascal %>.module.scss";
import type { I<%= componentName.pascal %>Props } from "./I<%= componentName.pascal %>Props";

export default function <%= componentName.pascal %>({ description }: I<%= componentName.pascal %>Props): React.ReactElement {
  const fieldId = React.useId();
  const [name, setName] = React.useState("");
  const [savedName, setSavedName] = React.useState("");

  return <SharePointThemeProvider>
    <section className={styles.root} aria-labelledby={`${fieldId}-title`}>
      <Card>
        <h2 id={`${fieldId}-title`}><%= componentName %></h2>
        <p>{description}</p>
        <form onSubmit={event => { event.preventDefault(); setSavedName(name.trim()); }}>
          <Field id={fieldId} label="Workspace name" required>
            <Input name="workspaceName" value={name} maxLength={80} pattern=".*\S.*" onChange={event => { setName(event.currentTarget.value); setSavedName(""); }} required />
          </Field>
          <Button type="submit">Save workspace</Button>
        </form>
        {savedName && <Alert role="status">Saved {savedName}.</Alert>}
      </Card>
    </section>
  </SharePointThemeProvider>;
}
