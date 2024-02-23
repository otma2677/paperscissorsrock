/**
 *
 */
import { type MiddlewareHandler } from 'hono';
import { Type, type Static } from '@sinclair/typebox';

/**
 *
 */
export const schemaRoom = Type.Object({});

export type Room = Static<typeof schemaRoom>;

export function waitingRoomManager(): MiddlewareHandler {
  const waitingRoom = new Map<string, Date>();

  return async function (c, next) {
    c.room = waitingRoom;

    await next();
  };
}

/**
 *
 */
declare module 'hono' {
  interface Context {
    room: Map<string, Date>;
  }
}
