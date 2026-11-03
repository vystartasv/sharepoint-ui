import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import { Version } from "@microsoft/sp-core-library";
import { ThemeProvider } from "@microsoft/sp-component-base";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import { applySharePointTheme, type SharePointTheme, type FluentThemeTokens } from "@spfx-fast/sharepoint-ui";
import * as strings from "<%= componentName.pascal %>WebPartStrings";
import <%= componentName.pascal %> from "./components/<%= componentName.pascal %>";

export default class <%= componentName.pascal %>WebPart extends BaseClientSideWebPart<{ description: string }> {
  private root?: Root;
  private themeProvider?: ThemeProvider;
  private theme?: SharePointTheme;
  private fluentTokens?: FluentThemeTokens;
  protected async onInit(): Promise<void> {
    await super.onInit();
    this.themeProvider = this.context.serviceScope.consume(ThemeProvider.serviceKey);
    this.theme = this.themeProvider.tryGetTheme() as SharePointTheme | undefined;
    this.fluentTokens = this.themeProvider.tryGetThemeV2() as FluentThemeTokens | undefined;
  }
  protected onThemeChanged(): void {
    this.theme = this.themeProvider?.tryGetTheme() as SharePointTheme | undefined;
    this.fluentTokens = this.themeProvider?.tryGetThemeV2() as FluentThemeTokens | undefined;
    this.render();
  }
  public render(): void {
    this.root ??= createRoot(this.domElement);
    applySharePointTheme(this.domElement, this.theme, this.fluentTokens);
    this.root.render(React.createElement(<%= componentName.pascal %>, { theme: this.theme, fluentTokens: this.fluentTokens, description: this.properties.description || strings.PropertyPaneDescription, locale: this.context.pageContext.cultureInfo.currentUICultureName, rtl: this.context.pageContext.cultureInfo.isRightToLeft, strings }));
  }
  protected onDispose(): void { this.root?.unmount(); this.root = undefined; }
  protected get dataVersion(): Version { return Version.parse("1.0"); }
}
