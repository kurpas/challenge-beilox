import type { Schema } from 'ajv';
import { successEnvelope, errorEnvelope, str, uri, uriList, dateTime } from './common';

export const peopleSchema: Schema = successEnvelope({
  type: 'object',
  properties: {
    name: str, gender: str, skin_color: str, hair_color: str, eye_color: str,
    height: str, mass: str, birth_year: str,
    homeworld: uri,
    films: uriList, vehicles: uriList, starships: uriList,
    url: uri,
    created: dateTime,
    edited: dateTime,
  },
  required: ['name', 'gender', 'homeworld', 'films', 'url', 'created', 'edited'],
});

export const peopleNotFoundSchema: Schema = errorEnvelope('message', 'not found');