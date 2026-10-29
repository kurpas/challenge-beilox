import { expect, type Locator, type Page } from '@playwright/test';
import { toResultsStrip, toUrlParam } from '../helpers/dates';
import type { Route } from '../test-data/ui/routes';

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

/** Página de resultados: /cdp/pasajes-micro/{origen}/{destino}?FIda=MM/DD/YYYY */
export class ResultsPage {
  // ---------- Selectores ----------
  private readonly headingOrigin: Locator;
  private readonly headingDestination: Locator;
  private readonly selectedDate: Locator;
  private readonly serviceCards: Locator;
  private readonly noResultsMessage: Locator;

  constructor(private readonly page: Page) {
    this.headingOrigin = page.locator('h1 .salida');
    this.headingDestination = page.locator('h1 .llegada');
    this.selectedDate = page.locator('.fechas-group a.active .fecha');
    this.serviceCards = page.locator('#servicios .card');
    this.noResultsMessage = page.getByText('No encontramos opciones para tu viaje');
  }

  // ---------- Acciones ----------
  async goBack(): Promise<void> {
    await this.page.goBack();
  }

  // ---------- Aserciones ----------
  async expectUrlFor(route: Route, date: Date): Promise<void> {
    const path = `/cdp/pasajes-micro/${route.origin.slug}/${route.destination.slug}`;
    await expect(this.page).toHaveURL(
      new RegExp(`${escapeRegExp(path)}\\?.*FIda=${escapeRegExp(toUrlParam(date))}`),
    );
  }

  /** Resultados visibles y coherentes con los parámetros: URL, encabezado, fecha y cada servicio. */
  async expectResultsFor(route: Route, date: Date): Promise<void> {
    await this.expectUrlFor(route, date);
    await expect(this.headingOrigin).toHaveText(route.origin.name);
    await expect(this.headingDestination).toHaveText(route.destination.name);
    await expect(this.selectedDate).toHaveText(toResultsStrip(date));

    await expect(this.serviceCards.first()).toBeVisible();
    for (const card of await this.serviceCards.all()) {
      await expect(card).toContainText(route.origin.name);
      await expect(card).toContainText(route.destination.name);
    }
  }

  async expectNoResults(route: Route, date: Date): Promise<void> {
    await this.expectUrlFor(route, date);
    await expect(this.noResultsMessage).toBeVisible();
    await expect(this.serviceCards).toHaveCount(0);
  }
}
