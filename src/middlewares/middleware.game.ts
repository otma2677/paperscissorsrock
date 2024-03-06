/**
 *
 */
import { type MiddlewareHandler } from 'hono';
import { Type, type Static } from '@sinclair/typebox';
import { type Player } from '../data/definition.player.js';
import { schemaGame as sg, type Game } from '../data/definition.game.js';

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
const playingPlayers = new Map<Player['public_id'], Game['public_id']>();
const waitingQueues: Array<{ uuid: string; sinceWhen: Date, playerID: Player['public_id'] }> = [];
const temporaryRounds = new Map<string, RoundMiddlewareDefinition>;

export function middlewareGame(): MiddlewareHandler {
  return async function (c, next) {
    c.games = playingGames;
    c.rooms = waitingQueues;
    c.rounds = temporaryRounds;
    c.playerInGames = playingPlayers;

    await next();
  };
}

/**
 *
 */
declare module 'hono' {
  interface Context {
    games: Map<string, GameMiddlewareDefinition>;
    playerInGames: Map<Player['public_id'], Game['public_id']>;
    rooms: Array<{ uuid: string; sinceWhen: Date, playerID: Player['public_id'] }>;
    rounds: Map<string, RoundMiddlewareDefinition>;
  }
}
