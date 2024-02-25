/**
 *
 */
import { randomBytes } from 'node:crypto';

import { type MiddlewareHandler } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import { ResultSetHeader } from 'mysql2/promise';

import { UserDB } from '../data/definition.database.js';

/**
 *
 */
export function authManager(): MiddlewareHandler {
  return async function (c, next) {
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
    })

    c.session.set(newSessionID, maybeUser);
    c.user = maybeUser;
    const inserted = await c
      .mysql
      .query(
        'INSERT INTO connections(user_id) VALUES(?) on duplicate key update created_at = current_timestamp',
        [ maybeUser.id ]
      ) as Array<ResultSetHeader>;

    if (!inserted[0] || (inserted[0]?.['affectedRows'] === 0)) {
      throw new Error('Internal server error');
    }

    if (c.user) {
      c.rooms.forEach((v, k, m) => {
        if ((v.player1 === c.user?.public_id) || (v.player2 === c.user?.public_id))
          c.userCurrentRoomID = k;
      });

      c.games.forEach((v, k, m) => {
        if ((v.player1 === c.user?.public_id) || (v.player2 === c.user?.public_id))
          c.userCurrentGameID = k;
      });
    }

    await next();
  }
}

/**
 *
 */
declare module 'hono' {
  interface Context {
    user?: Pick<UserDB, 'id' | 'created_at' | 'public_id' | 'name'>;
  }
}
