/**
 *
 */
import { type MiddlewareHandler } from 'hono';
import { type UserDB } from '../data/definition.player.js';

/**
 *
 */
const session = new Map<string, Pick<UserDB, 'id' | 'created_at' | 'public_id' | 'name'>>();

export function middlewareSession(): MiddlewareHandler {
  return async function (c, next) {
    c.session = session;

    await next();
  };
}

/**
 *
 */
declare module 'hono' {
  interface Context {
    session: Map<string, Pick<UserDB, 'id' | 'created_at' | 'public_id' | 'name'>>;
  }
}
