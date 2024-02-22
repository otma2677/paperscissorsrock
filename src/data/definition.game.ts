/**
 *
 */
import { type Static, Type } from '@sinclair/typebox';

/**
 *
 */
export const schemaGame = Type.Object({
  publicId: Type.String(),
  player1Id: Type.String(),
  player2Id: Type.String(),
  rounds: Type.Array(Type.Object({
    player1Move: Type.Number(),
    player2Move: Type.Number(),
    winner: Type.Union([
      Type.Literal('p1'),
      Type.Literal('p2'),
    ])
  }))
});

export type Game = Static<typeof schemaGame>;
