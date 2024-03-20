/**
 *
 */
import { type Context } from 'hono';
import { type ResultSetHeader } from 'mysql2/promise';
import { GameMiddlewareDefinition } from '../middlewares/middleware.game.js';

/**
 * Cleaning functions
 */
export function findWinner(game: GameMiddlewareDefinition) {
  let p1Points = 0;
  let p2Points = 0;

  for (const round of game.rounds) {
    if (round.moveP1 === round.moveP2)
      continue;
    else if (round.moveP1 > round.moveP2 && round.moveP1 !== 0)
      p1Points += 1;
    else
      p2Points += 1;
  }

  if (p1Points === p2Points)
    game.winner = 0;
  else if (p1Points > p2Points)
    game.winner = 1;
  else
    game.winner = 2;
}

export function clearGames(c: Context) {
  c
    .games
    .forEach(async (v, k, m) => {
      if ((Date.now() - v.timestamp.getTime()) >= ((60 * Number(process.env.GAME_MAX_GAME)) *1000)) {
        c.playerInGames.delete(v.player1);
        c.playerInGames.delete(v.player2);

        if (v.rounds.length >= 3)
          findWinner(v);

        const insertedGame = await dumpGame(c, v);

        if (insertedGame[0])
          if (insertedGame[0].affectedRows >= 1)
            m.delete(k);
      }
    });
}

export async function dumpGame(c: Context, game: GameMiddlewareDefinition) {
  return await c
    .mysql
    .query(
      `INSERT INTO games(created_at, public_id, player1, player2, rounds, winner, aborted, ended_at, ended, details) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?) on duplicate key update ended_at = current_timestamp`,
      [
        game.timestamp,
        game.public_id,
        game.player1,
        game.player2,
        JSON.stringify(game.rounds ?? []),
        game.winner,
        game.aborted ?? true,
        game.ended_at ?? new Date(),
        game.ended ?? true,
        game.details ? JSON.stringify(game.details) : null
      ]
    ) as Array<ResultSetHeader>;
}

export function clearRooms(c: Context) {
  c.rooms = c
    .rooms
    .filter((v, i, a) => {
      if (!((Date.now() - v.sinceWhen.getTime()) >= ((60 * Number(process.env.GAME_MAX_WAIT)) *1000)))
        return v;
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


