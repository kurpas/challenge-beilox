import { test, expect } from '../../fixtures/api.fixture';
import { MAX_RESPONSE_TIME_MS } from '../../helpers/constants';
import { saveHappyPath } from '../../helpers/fileHelper';
import { expectValidSchema } from '../../helpers/schemaValidator';
import type { SwapiResponse } from '../../helpers/types';
import { peopleSchema, peopleNotFoundSchema } from '../../schemas/people.schema';

test.describe('GET /people', () => {
  test('devuelve un personaje existente (happy path)', async ({ swapi }) => {
    const { status, body, elapsedMs } = await swapi.get<SwapiResponse<{ name: string }>>('people/1');

    expect(status).toBe(200);
    expect(elapsedMs).toBeLessThan(MAX_RESPONSE_TIME_MS);
    expectValidSchema(peopleSchema, body);
    expect(body.result.properties.name).toBe('Luke Skywalker');

    saveHappyPath('people', body);
  });

  for (const [title, id] of [
    ['un id inexistente', '99999'],
    ['un id no numérico (la API no responde 400)', 'abc'],
  ] as const) {
    test(`devuelve 404 para ${title}`, async ({ swapi }) => {
      const { status, body, elapsedMs } = await swapi.get(`people/${id}`);

      expect(status).toBe(404);
      expect(elapsedMs).toBeLessThan(MAX_RESPONSE_TIME_MS);
      expectValidSchema(peopleNotFoundSchema, body);
    });
  }
});