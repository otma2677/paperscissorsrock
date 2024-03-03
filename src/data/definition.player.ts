/**
 *
 */
import { Type, type Static } from '@sinclair/typebox';
import { schemaBaseDB } from './definition.base-types.js';

/**
 *
 */
export const schemaPlayer = Type.Object({
  public_id: Type.String(),
  name: Type.String(),
  pass: Type.String(),
  salt: Type.String()
});

export type Player = Static<typeof schemaPlayer>;

export const schemaUserDB = Type.Composite([
  schemaBaseDB,
  schemaPlayer
]);

export type UserDB = Static<typeof schemaUserDB>;
