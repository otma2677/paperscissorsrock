/**
 *
 */
import { Type, type Static } from '@sinclair/typebox';

/**
 *
 */
export const schemaPlayer = Type.Object({
  publicId: Type.String(),
  privateId: Type.String(),
  name: Type.String()
});

export type Player = Static<typeof schemaPlayer>;
