/**
 *
 */
import { Type, type Static } from '@sinclair/typebox';
import { schemaBaseDB } from './definition.base-types.js';

/**
 *
 */
export const schemaPlayer = Type.Object({
  name: Type.String(),
  pass: Type.String(),
  salt: Type.String()
});

export type Player = Static<typeof schemaPlayer>;

export const schemaPlayerDB = Type.Composite([
  schemaBaseDB,
  Type.Object({
    public_id: Type.String(),
  }),
  schemaPlayer
]);

export type PlayerDB = Static<typeof schemaPlayerDB>;

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
