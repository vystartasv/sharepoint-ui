import * as React from "react";
import { Badge, Button, SharePointUIProvider, ViewCard } from "@spfx-fast/sharepoint-ui/react";
import type { I<%= componentName.pascal %>Props } from "./I<%= componentName.pascal %>Props";
import styles from "./<%= componentName.pascal %>.module.scss";
export default function <%= componentName.pascal %>({ locale, rtl, strings }: I<%= componentName.pascal %>Props): React.ReactElement {
  const [reviewed, setReviewed] = React.useState(false);
  return <SharePointUIProvider lang={locale} dir={rtl ? "rtl" : "ltr"}>
    <main className={styles.root} lang={locale} dir={rtl ? "rtl" : "ltr"}>
      <Badge>SharePoint theme connected</Badge>
      <h2><%= componentName %></h2>
      <ViewCard kind="document" title={strings.CardTitle} subtitle={strings.CardSubtitle} description={strings.CardDescription}>
        <span slot="leading" aria-hidden="true">DOC</span>
        <span slot="eyebrow">{strings.CardEyebrow}</span>
        <span slot="status">{strings.CardStatus}</span>
        <span>{strings.CardDetails}</span>
        <Button slot="actions" variant="primary" onClick={() => setReviewed(true)}>{reviewed ? strings.Reviewed : strings.MarkReviewed}</Button>
      </ViewCard>
      <span role="status" aria-live="polite">{reviewed ? strings.Reviewed : ""}</span>
    </main>
  </SharePointUIProvider>;
}
