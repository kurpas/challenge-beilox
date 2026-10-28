import { Page, Locator } from "@playwright/test";

export class SearchPage {
  readonly page: Page;

  // Selectores
  readonly originInput: Locator;
  readonly destinationInput: Locator;
  readonly departureDateInput: Locator;
  readonly searchButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.originInput = page.getByRole("textbox", {
      name: "Ingresá desde dónde viajás",
    });

    this.destinationInput = page.getByRole("textbox", {
      name: "Ingresá hacia dónde viajás",
    });

    this.departureDateInput = page.getByRole("textbox", {
      name: "Ida",
    });

    this.searchButton = page.getByRole("button", {
      name: "Buscar",
    });
  }

  // Navegación
  async navigate(): Promise<void> {
    await this.page.goto("https://www.centraldepasajes.com.ar/");
  }

  // Seleccionar origen
  public async SelectOrigin( origin: string,): Promise<void>  {
    await this.page.getByRole('combobox', { name: 'Ingresá desde dónde viajás' }).click();
    await this.originInput.fill(origin);
    await this.originInput.press('Enter');
  }

  // Seleccionar destino
  public async SelectDestination( destino: string,): Promise<void>  {
    await this.page.getByRole('combobox', { name: 'Ingresá desde dónde viajás' }).click();
    await this.originInput.fill(destino);
    await this.originInput.press('Enter');
  }



  // Abrir calendario
  async openDepartureCalendar(): Promise<void> {
    await this.departureDateInput.click();
  }

  // Ejecutar búsqueda
  async clickSearch(): Promise<void> {
    await this.searchButton.click();
  }
}
