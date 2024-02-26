/**
 *
 */
import { Value } from '@sinclair/typebox/value';
import {
  type Connection,
  type ResultSetHeader,
  type RowDataPacket
} from 'mysql2/promise';
import { schemaUserDB, type UserDB } from './definition.player.js';

/**
 *
 */
export async function insertUser(obj: Omit<UserDB, 'id' | 'created_at' | 'public_id'>, connection: Connection) {
  const inserted = await connection
    .query(
      'INSERT INTO users(name, pass, salt) VALUES(?, ?, ?)',
      [
        obj.name,
        obj.pass,
        obj.salt
      ]
    ) as Array<ResultSetHeader>;

  return inserted[0] as ResultSetHeader;
}

export async function getUserByName(obj: Pick<UserDB, 'name'>, connection: Connection) {
  const rows = await connection
    .query('SELECT * FROM users WHERE name = ?', [ obj.name ]) as Array<RowDataPacket>;

  if (!rows[0])
    return null;

  if (!Value.Check(schemaUserDB, rows[0][0]))
    return null;

  return rows[0][0] as UserDB;
}

export async function getUserByPublicId(obj: Pick<UserDB, 'public_id'>, connection: Connection) {
  const rows = await connection
    .query('SELECT * FROM users WHERE public_id = ?', [ obj.public_id ]) as Array<RowDataPacket>;

  if (!rows[0])
    return null;

  if (!Value.Check(schemaUserDB, rows[0][0]))
    return null;

  return rows[0][0] as UserDB;
}

export async function countPlayers(connection: Connection) {
  const rowsTotalPlayers = await connection
    .query('SELECT count(*) FROM users') as Array<RowDataPacket>;

  const rowTotalPlayers = rowsTotalPlayers[0] as Array<unknown>;
  const countTotalPlayer = rowTotalPlayers[0] as Record<string, any>;

  return countTotalPlayer['count(*)'] as number | undefined;
}

export async function countPlayersActive(connection: Connection) {
  const rowsActivePlayers = await connection
    .query(
      'select count(*) from users where timestampdiff(minute, created_at, current_timestamp) <= 15'
    ) as Array<RowDataPacket>;

  const rowActivePlayers = rowsActivePlayers[0] as Array<unknown>;
  const countActivePlayers = rowActivePlayers[0] as Record<string, any>;

  return countActivePlayers['count(*)'] as number | undefined;
}
