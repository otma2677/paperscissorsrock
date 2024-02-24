/**
 *
 */
import { type Static, Type } from '@sinclair/typebox';
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

export const tableGameDB = `
  create table if not exists games
  (
      id         int unsigned primary key auto_increment not null,
      created_at datetime                                not null,
      public_id  varchar(36) unique                      not null,
      player1    varchar(36)                             not null,
      player2    varchar(36)                             not null,
      rounds     json default (json_array())             not null,
      winner     tinyint unsigned,
      aborted    boolean,
      ended_at   datetime,
      ended      boolean,
      details    json
  );
`
  .trim()
  .replaceAll('\r', '')
  .replaceAll('\n', '');
