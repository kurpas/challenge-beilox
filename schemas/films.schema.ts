import type { Schema } from 'ajv';
import { successEnvelope, errorEnvelope, str, uri, uriList, dateTime } from './common';

export const filmsSchema: Schema = successEnvelope({
  type: 'object',
  properties: {
    title: str, director: str, producer: str, opening_crawl: str,
    episode_id: { type: 'integer' },
    release_date: { type: 'string', format: 'date' },
    characters: uriList, planets: uriList, starships: uriList,
    vehicles: uriList, species: uriList,
    url: uri, created: dateTime, edited: dateTime,
  },
  required: ['title', 'episode_id', 'director', 'release_date', 'characters', 'url', 'created', 'edited'],
});

export const filmsNotFoundSchema: Schema = errorEnvelope('message', 'Film not found');