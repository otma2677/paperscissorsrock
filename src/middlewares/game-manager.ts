/**
 *
 */
import { type MiddlewareHandler } from 'hono';
import { Game } from '../data/definition.game.js';

/**
 *
 */
export function gameManager(): MiddlewareHandler {
  const games = new Map<string, Game>();

  return async function (c, next) {
    c.games = games;

    await next();
  };
}

/**
 *
 */
declare module 'hono' {
  interface Context {
    games: Map<string, Game>;
  }
}
