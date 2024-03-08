/**
 *
 */
import { type Context } from 'hono';
import { type ResultSetHeader } from 'mysql2/promise';

/**
 * Cleaning functions
 */
export function clearGames(c: Context) {
  c
    .games
    .forEach(async (v, k, m) => {
      if ((Date.now() - v.timestamp.getTime()) >= ((60 * 5) *1000)) {
        c.playerInGames.delete(v.player1);
        c.playerInGames.delete(v.player2);

        const insertedGame = await c
          .mysql
          .query(
            `INSERT INTO games(created_at, public_id, player1, player2, rounds, winner, aborted, ended_at, ended, details) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              v.timestamp,
              v.public_id,
              v.player1,
              v.player2,
              JSON.stringify(v.rounds ?? []),
              v.winner,
              v.aborted ?? true,
              v.ended_at ?? new Date(),
              v.ended ?? true,
              v.details ? JSON.stringify(v.details) : null
            ]
          ) as Array<ResultSetHeader>;

        if (insertedGame[0])
          if (insertedGame[0].affectedRows >= 1)
            m.delete(k);
      }
    });
}

export function clearRooms(c: Context) {
  c
    .rooms
    .forEach((v, i, a) => {
      if ((Date.now() - v.sinceWhen.getTime()) >= ((60 * 1) *1000))
        delete a[i];
    });
}

/**
 * QUEUES related actions
 */
export function enqueueRoom(c: Context, playerID: string) {
  const uuid = crypto.randomUUID();

  return c.rooms
    .push({
      uuid,
      sinceWhen: new Date(),
      playerID
    }) -1;
}

export function peekRoom(c: Context) {
  return c.rooms[0];
}

export function dequeueRoom(c: Context) {
  return c.rooms.shift();
}

export function isRoomEmpty(c: Context) {
  return c.rooms.length === 0;
}

export function roomSize(c: Context) {
  return c.rooms.length;
}


