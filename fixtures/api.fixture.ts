import { test as base, expect } from '@playwright/test';
import { SwapiClient } from '../helpers/SwapiClient';

export const test = base.extend<{ swapi: SwapiClient }>({
  swapi: async ({ request }, use) => {
    await use(new SwapiClient(request));
  },
});

export { expect };