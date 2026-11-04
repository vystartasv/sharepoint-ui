import * as React from "react";
import { Button, Card, Input, SharePointThemeProvider } from "@spfx-fast/sharepoint-ui/react";
import "@spfx-fast/sharepoint-ui/styles.css";
import styles from "./MetricsDashboard.module.scss";

export function MetricsDashboard() {
  return <SharePointThemeProvider>
    <main className={styles.root}>
      <Card>
        <h2>SharePoint UI</h2>
        <p>Native React components styled from the active SharePoint theme.</p>
        <form className={styles.form} onSubmit={event => { event.preventDefault(); }}>
          <Input aria-label="Workspace name" placeholder="Workspace name" />
          <Button type="submit">Save</Button>
        </form>
      </Card>
    </main>
  </SharePointThemeProvider>;
}
