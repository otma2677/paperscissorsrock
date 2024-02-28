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

export const tableUserDB = `
  create table if not exists users
  (
      id         int unsigned primary key auto_increment not null,
      created_at datetime    default current_timestamp   not null,
      public_id  varchar(36) unique default (uuid())     not null,
      name       varchar(64) unique                      not null,
      pass       varchar(128)                            not null,
      salt       varchar(128)                            not null
  );
`
  .trim()
  .replaceAll('\r', '')
  .replaceAll('\n', '');
