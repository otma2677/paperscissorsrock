/**
 *
 */
import { Type, type Static } from '@sinclair/typebox';

/**
 *
 */
export const schemaPlayer = Type.Object({
  public_id: Type.String(),
  name: Type.String()
});

export type Player = Static<typeof schemaPlayer>;
