/**
 *
 */
import { type MiddlewareHandler } from 'hono';
import { UserDB } from '../data/definition.database.js';

/**
 *
 */
export function sessionManager(): MiddlewareHandler {
  const session = new Map<string, Pick<UserDB, 'id' | 'created_at' | 'public_id' | 'name'>>();

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
