import * as React from "react";
import { Button, Card, Input, SharePointThemeProvider } from "@spfx-fast/sharepoint-ui/react";
import "@spfx-fast/sharepoint-ui/styles.css";
import styles from "./<%= componentName.pascal %>.module.scss";
import type { I<%= componentName.pascal %>Props } from "./I<%= componentName.pascal %>Props";

export default function <%= componentName.pascal %>({ description }: I<%= componentName.pascal %>Props): React.ReactElement {
  return <SharePointThemeProvider>
    <main className={styles.root}>
      <Card>
        <h2><%= componentName %></h2>
        <p>{description}</p>
        <form onSubmit={event => event.preventDefault()}>
          <Input aria-label="Name" placeholder="Name" />
          <Button type="submit">Save</Button>
        </form>
      </Card>
    </main>
  </SharePointThemeProvider>;
}
