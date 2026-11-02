import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import { Version } from "@microsoft/sp-core-library";
import { ThemeProvider, type ThemeChangedEventArgs } from "@microsoft/sp-component-base";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import { SPHttpClient } from "@microsoft/sp-http";
import { applySharePointTheme, type SharePointTheme, type FluentThemeTokens } from "@vilius/sharepoint-ui";
import { MetricsDashboard } from "./components/MetricsDashboard";

export default class LibraryDemoWebPart extends BaseClientSideWebPart<Record<string, never>> {
  private root?: Root;
  private themeProvider?: ThemeProvider;
  private theme?: SharePointTheme;
  private fluentTokens?: FluentThemeTokens;
  private startedAt = performance.now();

  protected async onInit(): Promise<void> {
    await super.onInit();
    this.themeProvider = this.context.serviceScope.consume(ThemeProvider.serviceKey);
    this.theme = this.themeProvider.tryGetTheme() as SharePointTheme | undefined;
    this.fluentTokens = this.themeProvider.tryGetThemeV2() as FluentThemeTokens | undefined;
    this.themeProvider.themeChangedEvent.add(this, this._handleSharePointThemeChanged);
  }

  private _handleSharePointThemeChanged = (args: ThemeChangedEventArgs): void => {
    this.theme = args.theme as SharePointTheme | undefined;
    this.fluentTokens = this.themeProvider?.tryGetThemeV2() as FluentThemeTokens | undefined;
    this.render();
  };

  public render(): void {
    this.root ??= createRoot(this.domElement);
    applySharePointTheme(this.domElement, this.theme, this.fluentTokens);
    this.root.render(<MetricsDashboard startedAt={this.startedAt} theme={this.theme} fluentTokens={this.fluentTokens} spHttpClient={this.context.spHttpClient} webUrl={this.context.pageContext.web.absoluteUrl} locale={this.context.pageContext.cultureInfo.currentUICultureName} rtl={this.context.pageContext.cultureInfo.isRightToLeft} />);
  }

  protected onDispose(): void {
    this.root?.unmount();
    this.root = undefined;
    this.themeProvider?.themeChangedEvent.remove(this, this._handleSharePointThemeChanged);
  }

  protected get dataVersion(): Version { return Version.parse("1.0"); }
}
