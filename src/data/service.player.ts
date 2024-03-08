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
import { Context } from 'hono';
import { randomBytes } from 'node:crypto';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
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

export function assignUserMetadata(c: Context) {
  if (c.user) {
    c.games.forEach((v, k, m) => {
      if ((v.player1 === c.user?.public_id) || (v.player2 === c.user?.public_id))
        c.userCurrentGameID = k;
    });

    c.rooms.forEach((v, i, a) => {
      if (v.playerID === c.user?.public_id)
        c.userIsInQueue = i;
    });
  }
}

export async function setOrUpdateUserSession(c: Context) {
  const sid = getCookie(c, 'sid');
  if (!sid)
    throw new HTTPException(401, { message: 'Unauthorized' });

  const maybeUser = c.session.get(sid);
  if (!maybeUser) {
    deleteCookie(c, 'sid');
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  // Update the session id
  const newSessionID = randomBytes(32).toString('hex');
  setCookie(c, 'sid', newSessionID, {
    maxAge: Date.now() + (((24 * 60 * 60) * 1000) * 7),
    secure: true,
    httpOnly: true,
  });

  c.session.set(newSessionID, maybeUser);
  c.user = maybeUser;

  const inserted = await c
    .mysql
    .query(
      'INSERT INTO connections(user_id) VALUES(?) on duplicate key update created_at = current_timestamp',
      [ maybeUser.id ]
    ) as Array<ResultSetHeader>;

  if (!inserted[0] || (inserted[0]?.['affectedRows'] === 0))
    throw new HTTPException(500, { message: 'Internal server error' });
}
