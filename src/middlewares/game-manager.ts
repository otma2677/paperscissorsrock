/**
 *
 */
import { type MiddlewareHandler } from 'hono';
import { Game } from '../data/definition.game.js';
import { type Static, Type } from '@sinclair/typebox';
import { Player } from '../data/definition.player.js';

/**
 *
 */
export const schemaRoom = Type.Object({});

export type Room = Static<typeof schemaRoom>;

export const schemaMove = Type.Object({
  round: Type.Number(),
  player1: Type.Union([ Type.String(), Type.Number() ]),
  player2: Type.Union([ Type.String(), Type.Number() ]),
  moves: Type.Object({
    moveP1: Type.Number(),
    dateP1: Type.Date(),
    moveP2: Type.Number(),
    dateP2: Type.Date()
  })
});

export type Move = Static<typeof schemaMove>;

/**
 *
 */
export function gameManager(): MiddlewareHandler {
  const games = new Map<string, Game>();
  const room = new Map<string, Player>();
  const moves = new Map<string, Move>();

  return async function (c, next) {
    c.games = games;
    c.room = room;
    c.moves = moves;

    await next();
  };
}

/**
 *
 */
declare module 'hono' {
  interface Context {
    games: Map<string, Game>;
    room: Map<string, Player>;
    moves: Map<string, Move>;
  }
}
