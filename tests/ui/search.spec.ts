import { test } from '../../fixtures/ui.fixture';
import { daysFromToday } from '../../helpers/dates';
import { VALIDATION_MESSAGES } from '../../pages/SearchPage';
import { DAYS_AHEAD, ROUTES, UNKNOWN_CITY } from '../../test-data/ui/routes';

test.describe('Búsqueda de pasajes', () => {
  const departure = daysFromToday(DAYS_AHEAD);

  test.beforeEach(async ({ searchPage }) => {
    await searchPage.goto();
  });

  test('búsqueda válida muestra servicios coherentes con origen, destino y fecha', async ({ searchPage, resultsPage }) => {
    await searchPage.search(ROUTES.withServices, departure);

    await resultsPage.expectResultsFor(ROUTES.withServices, departure);
  });

  test('ruta sin servicios muestra el mensaje de sin resultados', async ({ searchPage, resultsPage }) => {
    await searchPage.search(ROUTES.withoutServices, departure);

    await resultsPage.expectNoResults(ROUTES.withoutServices, departure);
  });

  test.describe('datos inválidos', () => {
    test('enviar el formulario vacío muestra los tres errores y no navega', async ({ searchPage }) => {
      await searchPage.submit();

      await searchPage.expectValidationErrors(Object.values(VALIDATION_MESSAGES));
      await searchPage.expectToBeDisplayed();
    });

    test('una ciudad inexistente no ofrece opciones en el autocompletado', async ({ searchPage }) => {
      await searchPage.typeInAutocomplete('origin', UNKNOWN_CITY);

      await searchPage.expectNoAutocompleteMatches();
    });

    test('sin fecha de ida no permite buscar', async ({ searchPage }) => {
      await searchPage.selectTerminal('origin', ROUTES.withServices.origin);
      await searchPage.selectTerminal('destination', ROUTES.withServices.destination);
      await searchPage.submit();

      await searchPage.expectValidationErrors([VALIDATION_MESSAGES.date]);
      await searchPage.expectToBeDisplayed();
    });
  });

  test('volver atrás desde resultados regresa al buscador con los parámetros cargados', async ({ searchPage, resultsPage }) => {
    await searchPage.search(ROUTES.withServices, departure);
    await resultsPage.expectUrlFor(ROUTES.withServices, departure);

    await resultsPage.goBack();

    await searchPage.expectToBeDisplayed();
    await searchPage.expectSearchParams(ROUTES.withServices, departure);
  });
});
