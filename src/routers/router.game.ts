/**
 *
 */
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { Type } from '@sinclair/typebox';
import { tbValidator } from '@hono/typebox-validator';

import { middlewareAuth } from '../middlewares/middleware.auth.js';
import { type UserDB } from '../data/definition.player.js';
import { type Game, Round } from '../data/definition.game.js';
import {
  cleanGames,
  cleanRooms,
  dequeueRoom,
  enqueueRoom,
  peekRoom,
  roomSize
} from '../data/service.game.js';
import { getUserByPublicId } from '../data/service.player.js';
import { RoundMiddlewareDefinition } from '../middlewares/middleware.game.js';

/**
 *
 */
export const schemaPostGameIdMove = Type.Object({
  id: Type.String(),
  move: Type.Union([
    Type.Literal('0'),
    Type.Literal('1'),
    Type.Literal('2')
  ])
});

/**
 *
 */
export const routerGame = new Hono();

routerGame
  .use(middlewareAuth())
  .use(async (c, next) => {
    cleanRooms(c);
    cleanGames(c);

    await next();
  })
  .get('/gaming', async c => {
    c.userIsInQueue = undefined;
    const gameID = c.userCurrentGameID;
    if (!gameID)
      return c.redirect('games/waiting');

    const game = c.games.get(gameID);
    if (!game)
      throw new HTTPException(500, { message: 'Internal server error' });

    const player1 = await getUserByPublicId({ public_id: game.player1 }, c.mysql);
    const player2 = await getUserByPublicId({ public_id: game.player2 }, c.mysql);

    return c.html(
      c.views.renderAsync('pages/games/gaming-room', {
        game,
        player1,
        player2
      })
    );
  })
  .get('/waiting', async c => {
    const user = c.user as UserDB;

    if (c.userCurrentGameID)
      return c.redirect('/games/gaming');

    // We send the player to its already existing game if any
    if (typeof c.userIsInQueue === 'number') {
      const room = c.rooms[c.userIsInQueue];
      if (room) {
        return c.html(
          c.views.renderAsync('pages/games/waiting-room', { room })
        );
      }
    }

    c.userIsInQueue = undefined;

    // If there is available players AND we're not in a queue, we try to match them together
    if (roomSize(c) >= 1 && !c.userIsInQueue) {
      const peekedRoom = peekRoom(c);

      if (peekedRoom) {
        if (peekedRoom.playerID !== user.public_id) {
          const room = dequeueRoom(c) as any;

          const uuid = crypto.randomUUID();
          const game: Game = {
            public_id: uuid,
            player1: room.playerID,
            player2: user.public_id,
            rounds: []
          }

          c.userIsInQueue = undefined;
          c.userCurrentGameID = uuid;
          c.games.set(uuid, { ... game, timestamp: new Date() });
          return c.redirect('/games/gaming');
        }
      }
    }

    // By default, we create a new entry in the queue and then send the user to it
    const roomID = enqueueRoom(c, user.public_id);
    if (roomID >= 0) {
      c.userIsInQueue = roomID;
      const room = c.rooms[c.userIsInQueue] as unknown;

      if (room) {
        return c.html(
          c.views.renderAsync('pages/games/waiting-room', { room })
        );
      }
    }

    throw new HTTPException(500, { message: 'Internal server error' });
  });

routerGame
  .basePath('/json_api')
  .post('/game/:id/:move', tbValidator('param', schemaPostGameIdMove), async c => {
    const param = c.req.valid('param');
    const user = c.user as UserDB;

    const game = c.games.get(param.id);
    if (game) {
      if (
        game.player1 !== user.public_id &&
        game.player2 !== user.public_id
      ) return c.json({ success: false, roundEnded: false });

      const isPlayerPlayer1 = game.player1 === user.public_id;

      const round = c.rounds.get(game.public_id);
      if (round) {
        if (isPlayerPlayer1) {
          round.dateP1 = new Date() as Date;
          round.moveP1 = Number(param.move) as number;
        } else {
          round.dateP2 = new Date() as Date;
          round.moveP2 = Number(param.move) as number;
        }

        if (round.dateP1 &&
          round.dateP2 &&
          typeof round.moveP1 === 'number' &&
          typeof round.moveP2 === 'number')
        {
          // The round is finished, then we proceed to dump it back into the game's rounds
          game.rounds.push({
            moveP1: round.moveP1,
            dateP1: round.dateP1,
            moveP2: round.moveP2,
            dateP2: round.dateP2
          });

          c.rounds.delete(game.public_id);

          return c.json({ success: true, roundEnded: true });
        }
      }
    }

    return c.json({ success: false, roundEnded: false });
  })
