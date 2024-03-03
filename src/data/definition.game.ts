/**
 *
 */
import { Type, type Static } from '@sinclair/typebox';
import { schemaBaseDB } from './definition.base-types.js';

/**
 *
 */
export const schemaGame = Type.Object({
  public_id: Type.String(),
  player1: Type.String(),
  player2: Type.String(),
  rounds: Type.Array(Type.Object({
    moveP1: Type.Number(),
    dateP1: Type.Date(),
    moveP2: Type.Number(),
    dateP2: Type.Date()
  })),
  winner: Type.Optional(Type.Number()),
  aborted: Type.Optional(
    Type.Transform(Type.Number())
      .Decode(v => v === 1)
      .Encode(v => v ? 1 : 0)
  ),
  ended_at: Type.Optional(Type.Date()),
  ended: Type.Optional(
    Type.Transform(Type.Number())
      .Decode(v => v === 1)
      .Encode(v => v ? 1 : 0)
  ),
  details: Type.Optional(Type.Unknown()),
});

export type Game = Static<typeof schemaGame>;

export const schemaGameDB = Type.Composite([
  schemaBaseDB,
  schemaGame
]);

export type GameDB = Static<typeof schemaGameDB>;

export const schemaRound = Type.Pick(schemaGameDB, [ 'rounds' ]);

export type Round = Static<typeof schemaRound>;
