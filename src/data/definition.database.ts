/**
 *
 */
import { Type, type Static } from '@sinclair/typebox';

/**
 * Users
 */
export const schemaUserDB = Type.Object({
  id: Type.Number(),
  created_at: Type.Date(),
  public_id: Type.String(),
  name: Type.String(),
  pass: Type.String(),
  salt: Type.String()
});

export type UserDB = Static<typeof schemaUserDB>;

export const tableUserDB = `
create table if not exists users
(
    id         int unsigned primary key auto_increment not null,
    created_at datetime    default current_timestamp   not null,
    public_id  varchar(36) default (uuid())            not null,
    name       varchar(64) unique                      not null,
    pass       varchar(128)                            not null,
    salt       varchar(128)                            not null
);
`
  .trim()
  .replaceAll('\r', '')
  .replaceAll('\n', '');

/**
 * Games
 */
export const schemaGameDB = Type.Object({
  id: Type.Number(),
  created_at: Type.Date(),
  public_id: Type.String(),
  player1: Type.Number(),
  player2: Type.Number(),
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
  details: Type.Unknown(),
});

export type GameDB = Static<typeof schemaGameDB>;

export const tableGameDB = `
  create table if not exists games
  (
      id         int unsigned primary key auto_increment not null,
      created_at datetime                                not null,
      public_id  varchar(36) unique                      not null,
      player1    int unsigned                            not null,
      player2    int unsigned                            not null,
      rounds     json default (json_array())             not null,
      winner     int unsigned,
      aborted    boolean,
      ended_at   datetime,
      ended boolean,
      details    json
  );
`
  .trim()
  .replaceAll('\r', '')
  .replaceAll('\n', '');

/**
 * Connections
 */
export const schemaConnectionDB = Type.Object({
  id: Type.Number(),
  created_at: Type.Date(),
  user_id: Type.Number()
});

export type ConnectionDB = Static<typeof schemaConnectionDB>

export const tableConnectionDB = `
create table if not exists connections
(
    id         int unsigned primary key auto_increment not null,
    created_at datetime default current_timestamp      not null,
    user_id    int unsigned unique                     not null
);
`
  .trim()
  .replaceAll('\r', '')
  .replaceAll('\n', '');
