import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const UI_BASE_URL = process.env.UI_BASE_URL ?? 'https://www.centraldepasajes.com.ar';
const API_BASE_URL = process.env.API_BASE_URL ?? 'https://www.swapi.tech/api/';

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }]]
    : [['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'ui',
      testDir: './tests/ui',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: UI_BASE_URL,
        // El runner de CI corre en UTC y en inglés: se fija el contexto de un usuario argentino.
        locale: 'es-AR',
        timezoneId: 'America/Argentina/Buenos_Aires',
      },
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: API_BASE_URL },
    },
  ],
});