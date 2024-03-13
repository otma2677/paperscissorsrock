/**
 *
 */
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { tbValidator } from '@hono/typebox-validator';
import { Type } from '@sinclair/typebox';
import { getCookie } from 'hono/cookie';
import { dumpGame, findWinner } from '../data/service.game.js';
import { HTTPException } from 'hono/http-exception';

/**
 *
 */
export const routerSSE = new Hono();

const schemaGameSSE = Type.Object({
  id: Type.String(),
})

routerSSE
  .all('/*', async (c, next) => {
    c.res.headers.set('Content-Type', 'text/event-stream');
    c.res.headers.set('Cache-Control', 'no-cache');
    c.res.headers.set('Connection', 'keep-alive');

    await next();
  })
  .get('/wait', async c => {
    const sid = getCookie(c, 'sid');
    if (!sid)
      return c.notFound();

    const user = c.session.get(sid);
    if (!user)
      return c.notFound();

    return streamSSE(c, async stream => {
      let count = 0;
      while (true) {
        if (c.playerInGames.get(user.public_id))
          break;

        if (count >= 60)
          break;

        await stream.writeSSE({
          data: 'null',
          event: 'wait'
        });

        count += 1;
        await stream.sleep(1000);
      }

      const gameID = c.playerInGames.get(user.public_id);
      if (gameID) {
        c.userCurrentGameID = gameID;
        const game = c.games.get(c.userCurrentGameID);
        if (game) {
          await stream.writeSSE({
            data: c.userCurrentGameID,
            event: 'found'
          });
        }
      } else {
        await stream.writeSSE({
          data: 'not-found',
          event: 'not-found'
        });
      }

      await stream.close();
    });
  })
  .get('/game/:id', tbValidator('param', schemaGameSSE), async c => {
    const param = c.req.valid('param');
    const game = c.games.get(param.id);
    if (!game)
      return c.notFound();

    const sid = getCookie(c, 'sid');
    if (!sid)
      throw new HTTPException(401, { message: 'Unauthorized' });

    const user = c.session.get(sid);
    if (!user)
      throw new HTTPException(401, { message: 'Unauthorized' });

    if (!(game.player1 === user.public_id || game.player2 === user.public_id))
      throw new HTTPException(401, { message: 'Unauthorized' });

    return streamSSE(c, async stream => {
      while (true) {
        if (
          ((game.timestamp.getTime() + ((60 * Number(process.env.GAME_MAX_GAME)) *1000)) - Date.now() <= 0) ||
          game.rounds.length >= Number(process.env.GAME_MAX_ROUNDS)
        ) {
          game.ended_at = new Date();
          game.ended = 1;

          if (game.rounds.length >= Number(process.env.GAME_MAX_ROUNDS)) {
            game.aborted = 0
            findWinner(game);
          }

          break;
        }

        if (game.ended === 1)
          break;

        await stream.writeSSE({
          data: JSON.stringify(game),
          event: 'broadcast'
        });

        await stream.sleep(1000);
      }

      await stream.sleep(2000);
      await stream.writeSSE({
        data: JSON.stringify(game),
        event: 'graceful-end'
      });

      c.games.delete(game.public_id);
      const inserted = await dumpGame(c, game);
      await stream.close();
    });
  });
