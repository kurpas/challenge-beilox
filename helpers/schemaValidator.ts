import Ajv, { type Schema } from 'ajv';
import addFormats from 'ajv-formats';
import { expect } from '@playwright/test';

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);

export function expectValidSchema(schema: Schema, data: unknown): void {
  const validate = ajv.compile(schema);
  const valid = validate(data);
  expect(valid, `Schema errors:\n${ajv.errorsText(validate.errors, { separator: '\n' })}`).toBe(true);
}