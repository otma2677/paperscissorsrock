/**
 *
 */
import { Type, type Static } from '@sinclair/typebox';

/**
 *
 */
export const schemaBaseDB = Type.Object({
  id: Type.Number(),
  created_at: Type.Date()
});
