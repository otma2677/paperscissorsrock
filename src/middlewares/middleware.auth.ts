/**
 *
 */
import { randomBytes } from 'node:crypto';

import { type MiddlewareHandler } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import { type ResultSetHeader } from 'mysql2/promise';

import { UserDB } from '../data/definition.player.js';
import { clearGames, clearRooms } from '../data/service.game.js';
import { assignUserMetadata, setOrUpdateUserSession } from '../data/service.player.js';

/**
 *
 */
export function middlewareAuth(): MiddlewareHandler {
  return async function (c, next) {
    await setOrUpdateUserSession(c);

    // Clear Games & Rooms
    clearGames(c);
    clearRooms(c);

    console.log('games', c.games);
    console.log('rooms', c.rooms);

    // Assign ID (rooms & games) to user
    assignUserMetadata(c);

    await next();
  }
}

/**
 *
 */
declare module 'hono' {
  interface Context {
    user?: Pick<UserDB, 'id' | 'created_at' | 'public_id' | 'name'>;
    userCurrentGameID?: string;
    userIsInQueue?: number;
  }
}
