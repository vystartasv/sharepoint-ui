import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import { Version } from "@microsoft/sp-core-library";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import * as strings from "<%= componentName.pascal %>WebPartStrings";
import <%= componentName.pascal %> from "./components/<%= componentName.pascal %>";

export default class <%= componentName.pascal %>WebPart extends BaseClientSideWebPart<{ description: string }> {
  private root?: Root;
  public render(): void {
    this.root ??= createRoot(this.domElement);
    this.root.render(React.createElement(<%= componentName.pascal %>, {
      description: this.properties.description || strings.PropertyPaneDescription,
    }));
  }
  protected onDispose(): void { this.root?.unmount(); this.root = undefined; }
  protected get dataVersion(): Version { return Version.parse("1.0"); }
}
