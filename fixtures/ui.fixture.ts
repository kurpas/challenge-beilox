import { test as base, expect } from '@playwright/test';
import { SearchPage } from '../pages/SearchPage';
import { ResultsPage } from '../pages/ResultsPage';

interface UiFixtures {
  searchPage: SearchPage;
  resultsPage: ResultsPage;
}

export const test = base.extend<UiFixtures>({
  searchPage: async ({ page }, use) => {
    await use(new SearchPage(page));
  },
  resultsPage: async ({ page }, use) => {
    await use(new ResultsPage(page));
  },
});

export { expect };
