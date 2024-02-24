/**
 *
 */
import { type Static, Type } from '@sinclair/typebox';

/**
 *
 */
export const schemaGame = Type.Object({
  created_at: Type.Date(),
  public_id: Type.String(),
  player1: Type.Union([ Type.String(), Type.Number() ]),
  player2: Type.Union([ Type.String(), Type.Number() ]),
  rounds: Type.Array(Type.Object({
    moveP1: Type.Number(),
    dateP1: Type.Date(),
    moveP2: Type.Number(),
    dateP2: Type.Date()
  })),
  winner: Type.Optional(Type.Number()),
  aborted: Type.Boolean(),
  ended_at: Type.Optional(Type.Date()),
  ended: Type.Boolean(),
  details: Type.Unknown(),
});

export type Game = Static<typeof schemaGame>;
