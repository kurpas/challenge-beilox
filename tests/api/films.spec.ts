import { test, expect } from '../../fixtures/api.fixture';
import { MAX_RESPONSE_TIME_MS } from '../../helpers/constants';
import { saveHappyPath } from '../../helpers/fileHelper';
import { expectValidSchema } from '../../helpers/schemaValidator';
import type { SwapiResponse } from '../../helpers/types';
import { filmsSchema, filmsNotFoundSchema } from '../../schemas/films.schema';

test.describe('GET /films', () => {
  test('devuelve una película existente (happy path)', async ({ swapi }) => {
    const { status, body, elapsedMs } = await swapi.get<SwapiResponse<{ title: string }>>('films/1');

    expect(status).toBe(200);
    expect(elapsedMs).toBeLessThan(MAX_RESPONSE_TIME_MS);
    expectValidSchema(filmsSchema, body);
    expect(body.result.properties.title).toBe('A New Hope');

    saveHappyPath('films', body);
  });

  for (const [title, id] of [
    ['un id inexistente', '99999'],
    ['un id no numérico (la API no responde 400)', 'abc'],
  ] as const) {
    test(`devuelve 404 para ${title}`, async ({ swapi }) => {
      const { status, body, elapsedMs } = await swapi.get(`films/${id}`);

      expect(status).toBe(404);
      expect(elapsedMs).toBeLessThan(MAX_RESPONSE_TIME_MS);
      expectValidSchema(filmsNotFoundSchema, body);
    });
  }
});