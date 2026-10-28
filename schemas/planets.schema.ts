import type { Schema } from 'ajv';
import { successEnvelope, errorEnvelope, str, uri, dateTime } from './common';

export const planetsSchema: Schema = successEnvelope({
  type: 'object',
  properties: {
    name: str, climate: str, terrain: str, gravity: str, population: str,
    diameter: str, rotation_period: str, orbital_period: str, surface_water: str,
    url: uri, created: dateTime, edited: dateTime,
  },
  required: ['name', 'climate', 'terrain', 'url', 'created', 'edited'],
});

/** OJO: SWAPI escribe el campo con tres "s" ("messsage"). Es un typo de la API. */
export const planetsNotFoundSchema: Schema = errorEnvelope('messsage', 'Not found');
