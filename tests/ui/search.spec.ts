import { test, expect } from "@playwright/test";
import { SearchPage } from "../../pages/SearchPage";

test("Seleccionar origen y destino", async ({ page }) => {
  const searchPage = new SearchPage(page);

  await searchPage.navigate();

  await searchPage.SelectOrigin("BUE");
  //await searchPage.enterDestination("mar del plata");

  await expect(searchPage.originInput).toHaveValue(/Buenos Aires/i);
  await expect(searchPage.destinationInput).toHaveValue(/Mar del Plata/i);
});
