import { expect, type Locator, type Page } from '@playwright/test';
import { toCalendarMonth, toInputValue } from '../helpers/dates';
import type { Route, Terminal } from '../test-data/ui/routes';

type Field = 'origin' | 'destination';

/** Mensajes de validación (Parsley) que muestra el formulario. */
export const VALIDATION_MESSAGES = {
  origin: 'Completá el Origen de tu viaje',
  destination: 'Completá el Destino de tu viaje',
  date: 'Completá la fecha',
} as const;

/** Home de centraldepasajes.com.ar: formulario de búsqueda de pasajes. */
export class SearchPage {
  // ---------- Selectores ----------
  // Origen/destino son select2: el nombre accesible del combobox cambia al elegir una opción,
  // por eso se ubican por su `aria-labelledby` (estable) y no por nombre.
  private readonly combobox: Record<Field, Locator>;
  private readonly selectedValue: Record<Field, Locator>;
  private readonly autocompleteSearch: Locator;
  private readonly autocompleteMessage: Locator;
  private readonly departureDateInput: Locator;
  // Hay dos calendarios en el DOM (ida y vuelta); este es el de ida.
  private readonly departureCalendar: Locator;
  private readonly searchButton: Locator;

  constructor(private readonly page: Page) {
    this.combobox = {
      origin: page.locator('[aria-labelledby="select2-PadOrigen-container"]'),
      destination: page.locator('[aria-labelledby="select2-PadDestino-container"]'),
    };
    this.selectedValue = {
      origin: page.locator('#select2-PadOrigen-container'),
      destination: page.locator('#select2-PadDestino-container'),
    };
    this.autocompleteSearch = page.locator('.select2-search__field');
    this.autocompleteMessage = page.locator('.select2-results__message');
    this.departureDateInput = page.locator('#fechaPartida');
    this.departureCalendar = page.locator('#cdp-calendar-container .date-picker-wrapper');
    this.searchButton = page.getByRole('button', { name: 'Buscar' });
  }

  // ---------- Acciones ----------
  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async selectTerminal(field: Field, terminal: Terminal): Promise<void> {
    await this.typeInAutocomplete(field, terminal.query);
    // El código entre paréntesis es único; el nombre solo puede matchear varias terminales.
    await this.page.getByRole('treeitem', { name: new RegExp(`^\\(${terminal.code}\\)`) }).click();
  }

  async typeInAutocomplete(field: Field, text: string): Promise<void> {
    await this.openAutocomplete(field);
    await this.autocompleteSearch.fill(text);
  }

  async selectDepartureDate(date: Date): Promise<void> {
    await this.departureDateInput.click();
    await expect(this.departureCalendar).toBeVisible();

    const monthName = this.departureCalendar.locator('.month-name');
    const target = toCalendarMonth(date);
    for (let i = 0; i < 12 && !(await this.isShowingMonth(monthName, target)); i++) {
      await this.departureCalendar.locator('.next').click();
    }
    await this.departureCalendar
      .locator('.day.toMonth.valid')
      .getByText(String(date.getDate()), { exact: true })
      .click();
  }

  async submit(): Promise<void> {
    await this.searchButton.click();
  }

  /** Flujo completo de búsqueda: el atajo que usan la mayoría de los tests. */
  async search(route: Route, date: Date): Promise<void> {
    await this.selectTerminal('origin', route.origin);
    await this.selectTerminal('destination', route.destination);
    await this.selectDepartureDate(date);
    await this.submit();
  }

  /**
   * Al elegir el origen, el sitio abre solo el dropdown de destino: un click ahí lo cerraría.
   * Por eso se clickea únicamente si no está abierto.
   */
  private async openAutocomplete(field: Field): Promise<void> {
    const combobox = this.combobox[field];
    if ((await combobox.getAttribute('aria-expanded')) !== 'true') {
      await combobox.click();
    }
    await expect(combobox).toHaveAttribute('aria-expanded', 'true');
  }

  private async isShowingMonth(monthName: Locator, target: string): Promise<boolean> {
    const text = (await monthName.innerText()).replace(/\s+/g, ' ').trim();
    return text.toLowerCase() === target;
  }

  // ---------- Aserciones ----------
  async expectToBeDisplayed(): Promise<void> {
    // Ruta relativa: Playwright la combina con el baseURL, así funciona en cualquier ambiente.
    await expect(this.page).toHaveURL('/');
    await expect(this.searchButton).toBeVisible();
  }

  async expectSearchParams(route: Route, date: Date): Promise<void> {
    await expect(this.selectedValue.origin).toContainText(`(${route.origin.code})`);
    await expect(this.selectedValue.destination).toContainText(`(${route.destination.code})`);
    await expect(this.departureDateInput).toHaveValue(toInputValue(date));
  }

  async expectValidationErrors(messages: readonly string[]): Promise<void> {
    for (const message of messages) {
      await expect(this.page.getByText(message, { exact: true })).toBeVisible();
    }
  }

  async expectNoAutocompleteMatches(): Promise<void> {
    await expect(this.autocompleteMessage).toHaveText('No se encontraron resultados');
    await expect(this.page.getByRole('treeitem').filter({ hasText: /^\(/ })).toHaveCount(0);
  }
}
