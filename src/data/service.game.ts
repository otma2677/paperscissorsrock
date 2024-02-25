/**
 *
 */
import { type Context } from 'hono';
import { GameMiddleware } from '../middlewares/game-manager.js';

/**
 * CREATE NEW ROOM OR FIND OPENED ROOM
 */
export async function serviceCreateARoom(c: Context) {
  const user = c.user;
  if (!user) return;

  const roomID = c.userCurrentRoomID;
  if (roomID) return;

  const newID = crypto.randomUUID();
  const room = {
    createdAt: new Date(),
    player1: user.public_id
  }

  c.rooms.set(newID, room);

  return newID;
}

export async function serviceFindRoom(c: Context) {
  const user = c.user;
  if (!user) return;

  const roomID = c.userCurrentRoomID;
  if (roomID) return;

  let game: GameMiddleware | undefined;

  c.rooms.forEach((v, k, m) => {
    if (!v.player2 && v.player1) {
      game = {
        created_at: new Date(),
        public_id: crypto.randomUUID(),
        player1: v.player1,
        player2: user.public_id,
        rounds: [],
      };
    }
  });

  if (!game) return;

  const uuid = crypto.randomUUID();
  c.games.set(uuid, game);

  return uuid;
}

/**
 * UPDATE & DUMPS
 */
export async function serviceUpdateRoomState(c: Context) {
  const user = c.user;
  if (!user) return;

  const roomID = c.userCurrentRoomID;
  if (!roomID) return;

  const room = c.rooms.get(roomID);
  if (room) {
    if ((Date.now() - room.createdAt.getTime()) >= 1000 * 60) {
      c.userCurrentRoomID = undefined;
      c.rooms.delete(roomID);
    }
  } else c.userCurrentGameID = undefined;
}

export async function serviceUpdateGameStateAndDump(c: Context) {
  const user = c.user;
  if (!user) return;

  const gameID = c.userCurrentGameID;
  if (!gameID) return;

  const game = c.games.get(gameID);
  if (game) {
    if ((Date.now() - game.created_at.getTime()) >= (1000 * 60) * 5) {
      c.userCurrentGameID = undefined;
      c.games.delete(gameID);

      await c
        .mysql
        .query(
          `INSERT INTO games(public_id, created_at, player1, player2, rounds, winner, aborted, ended_at, ended, details) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`.trim(),
          [
            game.public_id,
            game.created_at,
            game.player1,
            game.player2,
            JSON.stringify(game.rounds),
            game.winner ?? 0,
            game.aborted ?? true,
            game.ended_at ?? new Date(),
            game.ended ?? true,
            game.details ? JSON.stringify(game.details) : "[]"
          ]
        );
    }
  } else c.userCurrentGameID = undefined;
}
