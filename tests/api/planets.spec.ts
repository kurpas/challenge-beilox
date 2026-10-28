import { test, expect } from '../../fixtures/api.fixture';
import { MAX_RESPONSE_TIME_MS } from '../../helpers/constants';
import { saveHappyPath } from '../../helpers/fileHelper';
import { expectValidSchema } from '../../helpers/schemaValidator';
import type { SwapiResponse } from '../../helpers/types';
import { planetsSchema, planetsNotFoundSchema } from '../../schemas/planets.schema';

test.describe('GET /planets', () => {
  test('devuelve un planeta existente (happy path)', async ({ swapi }) => {
    const { status, body, elapsedMs } = await swapi.get<SwapiResponse<{ name: string }>>('planets/1');

    expect(status).toBe(200);
    expect(elapsedMs).toBeLessThan(MAX_RESPONSE_TIME_MS);
    expectValidSchema(planetsSchema, body);
    expect(body.result.properties.name).toBe('Tatooine');

    saveHappyPath('planets', body);
  });

  for (const [title, id] of [
    ['un id inexistente', '99999'],
    ['un id no numérico (la API no responde 400)', 'abc'],
  ] as const) {
    test(`devuelve 404 para ${title}`, async ({ swapi }) => {
      const { status, body, elapsedMs } = await swapi.get(`planets/${id}`);

      expect(status).toBe(404);
      expect(elapsedMs).toBeLessThan(MAX_RESPONSE_TIME_MS);
      expectValidSchema(planetsNotFoundSchema, body);
    });
  }
});