import type { Schema } from 'ajv';

export const str = { type: 'string' } as const;
export const uri = { type: 'string', format: 'uri' } as const;
export const dateTime = { type: 'string', format: 'date-time' } as const;
export const uriList = { type: 'array', items: uri } as const;

const metaFields = {
  apiVersion: { type: 'string' },
  timestamp: { type: 'string', format: 'date-time' },
  support: {
    type: 'object',
    properties: { contact: { type: 'string' } },
    required: ['contact'],
  },
} as const;

const metaRequired = ['apiVersion', 'timestamp', 'support'] as const;

/** Sobre común de las respuestas exitosas; cada recurso aporta su schema de `properties`. */
export const successEnvelope = (properties: Schema): Schema => ({
  type: 'object',
  properties: {
    message: { const: 'ok' },
    result: {
      type: 'object',
      properties: {
        uid: { type: 'string' },
        description: { type: 'string' },
        properties,
      },
      required: ['uid', 'description', 'properties'],
    },
    ...metaFields,
  },
  required: ['message', 'result', ...metaRequired],
});

/**
 * Sobre común de los 404. SWAPI no es consistente: el texto (y hasta el nombre
 * del campo) cambia por recurso, así que cada schema fija el suyo.
 */
export const errorEnvelope = (messageField: string, messageValue: string): Schema => ({
  type: 'object',
  properties: { [messageField]: { const: messageValue }, ...metaFields },
  required: [messageField, ...metaRequired],
});