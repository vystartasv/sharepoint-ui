import { BaseCopilotComponent, createCopilotTextContent } from '@microsoft/sp-copilot-component';
import { ThemeProvider, type ThemeChangedEventArgs } from '@microsoft/sp-component-base';
import { SPHttpClient } from '@microsoft/sp-http';
import { applySharePointTheme, type FluentThemeTokens, type SharePointTheme } from '@spfx-fast/sharepoint-ui';
import { defineButton } from '@spfx-fast/sharepoint-ui/elements/button';
import { defineSearchBox } from '@spfx-fast/sharepoint-ui/elements/search';
import { defineTag } from '@spfx-fast/sharepoint-ui/elements/tags';
import { defineViewCard } from '@spfx-fast/sharepoint-ui/elements/view-card';

import type { IAccessReviewCopilotComponentProperties } from './AccessReviewCopilotComponentProperties';
import styles from './AccessReviewCopilotComponent.module.scss';

type ReviewItem = { Id: number; Title: string; Status?: string };
type ListResponse = { value?: ReviewItem[] };

const STATUS_FIELD = 'Status';
const MAX_ITEMS = 25;
const LIST_ID_PATTERN = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;

export default class AccessReviewCopilotComponent extends BaseCopilotComponent<IAccessReviewCopilotComponentProperties> {
  private items: ReviewItem[] = [];
  private query = '';
  private busyItems = new Set<number>();
  private loadError = '';
  private themeProvider?: ThemeProvider;
  private sharePointTheme?: SharePointTheme;
  private fluentTokens?: FluentThemeTokens;

  protected async onInit(): Promise<void> {
    defineButton();
    defineSearchBox();
    defineTag();
    defineViewCard();

    this.query = this.properties.query?.trim() ?? '';
    this.themeProvider = this.context.serviceScope.consume(ThemeProvider.serviceKey);
    this.sharePointTheme = this.themeProvider.tryGetTheme() as SharePointTheme | undefined;
    this.fluentTokens = this.themeProvider.tryGetThemeV2() as FluentThemeTokens | undefined;
    this.themeProvider.themeChangedEvent.add(this, this._onThemeChanged);

    if (!LIST_ID_PATTERN.test(this.properties.listId)) {
      this.loadError = 'The agent supplied an invalid SharePoint list ID.';
      return;
    }

    try {
      const url = `${this.context.pageContext.web.absoluteUrl}/_api/web/lists(guid'${this.properties.listId}')/items?$select=Id,Title,${STATUS_FIELD}&$orderby=Modified desc&$top=${MAX_ITEMS}`;
      const response = await this.context.spHttpClient.get(url, SPHttpClient.configurations.v1, {
        headers: { Accept: 'application/json;odata=nometadata' }
      });
      if (!response.ok) throw new Error(`SharePoint returned ${response.status}.`);

      const result = await response.json() as ListResponse;
      this.items = Array.isArray(result.value) ? result.value.filter(item => Number.isSafeInteger(item.Id) && item.Id > 0) : [];
    } catch (error) {
      this.loadError = error instanceof Error ? error.message : 'The review list could not be loaded.';
    }
  }

  protected render(): void {
    const rtl = this.context.pageContext.cultureInfo.isRightToLeft;
    applySharePointTheme(this.context.domElement, this.sharePointTheme, this.fluentTokens, {
      appearance: 'ios',
      tokens: { '--spui-color-scheme': this.hostContext.theme === 'dark' ? 'dark' : 'light' }
    });

    const root = document.createElement('section');
    root.className = styles.accessReview;
    root.dir = rtl ? 'rtl' : 'ltr';
    root.lang = this.context.pageContext.cultureInfo.currentUICultureName;
    root.setAttribute('aria-labelledby', 'access-review-title');

    const heading = document.createElement('h2');
    heading.id = 'access-review-title';
    heading.textContent = 'Access reviews';
    root.append(heading);

    const description = document.createElement('p');
    description.className = styles.description;
    description.textContent = `Latest ${MAX_ITEMS} items from the selected SharePoint list. Approvals are saved to that list.`;
    root.append(description);

    const search = document.createElement('spui-search-box');
    search.setAttribute('label', 'Filter access reviews');
    search.setAttribute('placeholder', 'Search title or status');
    search.setAttribute('clear-label', 'Clear search');
    search.setAttribute('size', 'medium');
    (search as HTMLElement & { value: string }).value = this.query;
    const list = document.createElement('div');
    list.className = styles.items;
    list.setAttribute('aria-label', 'Access review items');
    search.addEventListener('spui-input', event => {
      this.query = String((event as CustomEvent<{ value?: string }>).detail?.value ?? (search as HTMLElement & { value: string }).value).trim();
      this.renderItems(list);
      this.updateCopilotContext().catch(() => undefined);
    });
    root.append(search);

    const feedback = document.createElement('p');
    feedback.className = styles.feedback;
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    if (this.loadError) {
      feedback.textContent = `Couldn't load this SharePoint list. ${this.loadError} Check the list ID, the Status field, and your access, then try again.`;
      root.append(feedback);
      this.context.domElement.replaceChildren(root);
      return;
    }

    this.renderItems(list);
    root.append(list, feedback);
    this.context.domElement.replaceChildren(root);
  }

  protected onDispose(): void {
    this.themeProvider?.themeChangedEvent.remove(this, this._onThemeChanged);
  }

  private _onThemeChanged = (event: ThemeChangedEventArgs): void => {
    this.sharePointTheme = event.theme as SharePointTheme | undefined;
    this.fluentTokens = this.themeProvider?.tryGetThemeV2() as FluentThemeTokens | undefined;
    this.render();
  };

  private renderItems(target: HTMLElement): void {
    const locale = this.context.pageContext.cultureInfo.currentUICultureName;
    const query = this.query.toLocaleLowerCase(locale);
    const visibleItems = this.items.filter(item => `${item.Title} ${item.Status ?? ''}`.toLocaleLowerCase(locale).includes(query));
    target.replaceChildren();

    if (!visibleItems.length) {
      const empty = document.createElement('p');
      empty.className = styles.feedback;
      empty.textContent = this.items.length ? 'No reviews match this filter.' : 'This list has no review items yet.';
      target.append(empty);
      return;
    }

    for (const item of visibleItems) {
      const card = document.createElement('spui-view-card');
      card.setAttribute('kind', 'approval');
      card.setAttribute('title', item.Title || `Review ${item.Id}`);
      card.setAttribute('subtitle', `SharePoint item ${item.Id}`);

      const status = document.createElement('spui-tag');
      status.slot = 'status';
      status.setAttribute('size', 'small');
      const isApproved = item.Status?.toLocaleLowerCase(locale) === 'approved';
      status.setAttribute('color', isApproved ? 'success' : 'warning');
      status.textContent = item.Status || 'Needs review';
      card.append(status);

      const approve = document.createElement('spui-button');
      approve.slot = 'actions';
      approve.setAttribute('appearance', 'primary');
      approve.setAttribute('size', 'small');
      approve.textContent = isApproved ? 'Approved' : this.busyItems.has(item.Id) ? 'Saving…' : 'Approve';
      if (isApproved || this.busyItems.has(item.Id)) approve.setAttribute('disabled', '');
      approve.setAttribute('aria-label', `Approve ${item.Title || `review ${item.Id}`}`);
      approve.addEventListener('click', () => { this.approveItem(item, target).catch(() => undefined); });
      card.append(approve);

      target.append(card);
    }
  }

  private async approveItem(item: ReviewItem, target: HTMLElement): Promise<void> {
    if (this.busyItems.has(item.Id) || item.Status?.toLocaleLowerCase() === 'approved') return;
    this.busyItems.add(item.Id);
    this.renderItems(target);

    try {
      const url = `${this.context.pageContext.web.absoluteUrl}/_api/web/lists(guid'${this.properties.listId}')/items(${item.Id})`;
      const response = await this.context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
        headers: {
          Accept: 'application/json;odata=nometadata',
          'Content-Type': 'application/json;odata=nometadata',
          'X-HTTP-Method': 'MERGE',
          'IF-MATCH': '*'
        },
        body: JSON.stringify({ [STATUS_FIELD]: 'Approved' })
      });
      if (!response.ok) throw new Error(`SharePoint returned ${response.status}.`);

      this.setItemApproved(item.Id);
      const feedback = this.context.domElement.querySelector<HTMLElement>(`.${styles.feedback}`);
      if (feedback) feedback.textContent = `${item.Title} was saved as Approved in SharePoint.`;
      this.renderItems(target);
      this.updateCopilotContext().catch(() => undefined);
    } catch (error) {
      const feedback = this.context.domElement.querySelector<HTMLElement>(`.${styles.feedback}`);
      if (feedback) feedback.textContent = `Couldn't save ${item.Title}. ${error instanceof Error ? error.message : 'Check your edit access and try again.'}`;
    } finally {
      this.busyItems.delete(item.Id);
      this.renderItems(target);
    }
  }

  private async updateCopilotContext(): Promise<void> {
    const locale = this.context.pageContext.cultureInfo.currentUICultureName;
    const query = this.query.toLocaleLowerCase(locale);
    const visible = this.items.filter(item => `${item.Title} ${item.Status ?? ''}`.toLocaleLowerCase(locale).includes(query));
    const pending = visible.filter(item => item.Status?.toLocaleLowerCase(locale) !== 'approved');
    const summary = `SharePoint access reviews: ${visible.length} visible of the latest ${this.items.length} loaded; ${pending.length} still need review. Filter: ${this.query || 'all'}. ${visible.slice(0, 15).map(item => `${item.Title}: ${item.Status || 'Needs review'}`).join('; ')}`;
    try {
      await this.context.copilotBridge.updateModelContextAsync({ content: [createCopilotTextContent(summary)] });
    } catch {
      // The visible task still works when a host does not accept a context update.
    }
  }

  private setItemApproved(itemId: number): void {
    this.items = this.items.map(item => item.Id === itemId ? { ...item, Status: 'Approved' } : item);
  }
}
