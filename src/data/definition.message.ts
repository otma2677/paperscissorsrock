/**
 *
 */
import { Type, type Static } from '@sinclair/typebox';
import { schemaBaseDB } from './definition.base-types.js';

/**
 *
 */
export const schemaMessage = Type.Object({
  public_id: Type.String(),
  title: Type.String(),
  email: Type.String(),
  content: Type.String(),
  ip_address: Type.String()
});

export type Message = Static<typeof schemaMessage>;

export const schemaMessageDB = Type.Composite([
  schemaBaseDB,
  schemaMessage
]);

export type MessageDB = Static<typeof schemaMessageDB>;
