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
