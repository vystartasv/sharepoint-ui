import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import { Version } from "@microsoft/sp-core-library";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import { MetricsDashboard } from "./components/MetricsDashboard";

export default class LibraryDemoWebPart extends BaseClientSideWebPart<Record<string, never>> {
  private root?: Root;

  public render(): void {
    this.root ??= createRoot(this.domElement);
    this.root.render(<MetricsDashboard />);
  }

  protected onDispose(): void {
    this.root?.unmount();
    this.root = undefined;
  }

  protected get dataVersion(): Version { return Version.parse("1.0"); }
}
