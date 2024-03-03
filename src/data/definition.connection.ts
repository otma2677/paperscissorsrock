/**
 *
 */
import { Type, type Static } from '@sinclair/typebox';
import { schemaBaseDB } from './definition.base-types.js';

/**
 *
 */
export const schemaConnectionDB = Type.Composite([
  schemaBaseDB,
  Type.Object({
    user_id: Type.Number()
  })
]);

export type ConnectionDB = Static<typeof schemaConnectionDB>;
