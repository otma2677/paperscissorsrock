/**
 *
 */
import { join } from 'node:path';
import { type MiddlewareHandler } from 'hono';
import { Eta } from 'eta';

/**
 *
 */
export function middlewareViewRenderer(): MiddlewareHandler {
  const eta = new Eta({
    views: join(process.cwd(), 'public', 'views')
  });
  return async function(c, next) {
    c.views = eta;

    await next();
  };
}

/**
 *
 */
declare module 'hono' {
  interface Context {
    views: Eta;
  }
}
