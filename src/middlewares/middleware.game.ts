/**
 *
 */
import { type MiddlewareHandler } from 'hono';
import { Type, type Static } from '@sinclair/typebox';
import { type Player } from '../data/definition.player.js';
import { schemaGame as sg, type Round } from '../data/definition.game.js';

/**
 *
 */
export const schemaGameMiddlewareDefinition = Type.Composite([
  sg,
  Type.Object({
    timestamp: Type.Date()
  })
]);

export type GameMiddlewareDefinition = Static<typeof schemaGameMiddlewareDefinition>;

export const schemaRoundMiddlewareDefinition = Type.Object({
  moveP1: Type.Optional(Type.Number()),
  dateP1: Type.Optional(Type.Date()),
  moveP2: Type.Optional(Type.Number()),
  dateP2: Type.Optional(Type.Date())
});

export type RoundMiddlewareDefinition = Static<typeof schemaRoundMiddlewareDefinition>;

/**
 *
 */
const playingGames = new Map<string, GameMiddlewareDefinition>()
const waitingQueues: Array<{ uuid: string; sinceWhen: Date, playerID: Player['public_id'] }> = [];
const temporaryRounds = new Map<string, RoundMiddlewareDefinition>;

export function middlewareGame(): MiddlewareHandler {
  return async function (c, next) {
    c.games = playingGames;
    c.rooms = waitingQueues;
    c.rounds = temporaryRounds;

    await next();
  };
}

/**
 *
 */
declare module 'hono' {
  interface Context {
    games: Map<string, GameMiddlewareDefinition>;
    rooms: Array<{ uuid: string; sinceWhen: Date, playerID: Player['public_id'] }>;
    rounds: Map<string, RoundMiddlewareDefinition>;
  }
}
