/**
 *
 */
import { randomBytes } from 'node:crypto';
import { type MiddlewareHandler } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { UserDB } from '../data/definition.database.js';

/**
 *
 */
export function authManager(): MiddlewareHandler {
  return async function (c, next) {
    const sid = getCookie(c, 'sid');
    if (!sid) {
      c.status(403);
      return c.html(c.views.renderAsync('pages/unauthorized', {}))
    }

    const maybeUser = c.session.get(sid);
    if (!maybeUser) {
      deleteCookie(c, 'sid');
      c.status(401);
      return c.html(c.views.renderAsync('pages/unauthorized', {}))
    }

    // Update the session id
    const newSessionID = randomBytes(32).toString('hex');
    setCookie(c, 'sid', newSessionID, {
      maxAge: Date.now() + (((24 * 60 * 60) *1000) *7),
      secure: true,
      httpOnly: true,
    })

    c.session.set(newSessionID, maybeUser);
    c.user = maybeUser;

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
