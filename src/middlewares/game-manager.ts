/**
 *
 */
import { type MiddlewareHandler } from 'hono';
import { schemaGame } from '../data/definition.game.js';
import { type Static, Type } from '@sinclair/typebox';
import { serviceUpdateGameStateAndDump, serviceUpdateRoomState } from '../data/service.game.js';

/**
 *
 */
export const schemaRoom = Type.Object({
  createdAt: Type.Date(),
  player1: Type.String(),
  player2: Type.Optional(Type.String()),
});

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

export const schemaTemporaryZone = Type.Object({
  createdAt: Type.Date(),
  player1: Type.Optional(Type.String()),
  player2: Type.Optional(Type.String())
});

export type TemporaryZone = Static<typeof schemaTemporaryZone>;

export const schemaGameMiddleware = Type.Composite([
  Type.Object({
    created_at: Type.Date(),
  }),
  schemaGame,
]);

export type GameMiddleware = Static<typeof schemaGameMiddleware>;

/**
 *
 */
const games = new Map<string, GameMiddleware>();
const rooms = new Map<string, Room>();
const moves = new Map<string, Move>();
const temporaryZones = new Array<TemporaryZone>();

export function gameManager(): MiddlewareHandler {

  return async function (c, next) {
    c.games = games;
    c.rooms = rooms;
    c.moves = moves;
    c.temporaryZones = temporaryZones;

    // Clean existing State at each connection
    await serviceUpdateGameStateAndDump(c);
    await serviceUpdateRoomState(c);

    c.rooms.forEach((v, k, m) => {
      if (v.player1 === c.user?.public_id || v.player2 === c.user?.public_id)
        c.userCurrentRoomID = k;
    })

    c.games.forEach((v, k, m) => {
      if (v.player1 === c.user?.public_id || v.player2 === c.user?.public_id)
        c.userCurrentGameID = k;
    });

    await next();
  };
}

/**
 *
 */
declare module 'hono' {
  interface Context {
    userCurrentGameID?: string;
    userCurrentRoomID?: string;
    games: Map<string, GameMiddleware>;
    rooms: Map<string, Room>;
    moves: Map<string, Move>;
    temporaryZones: Array<TemporaryZone>;
  }
}
