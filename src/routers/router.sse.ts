/**
 *
 */
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { HTTPException } from 'hono/http-exception';
import { tbValidator } from '@hono/typebox-validator';
import { Type } from '@sinclair/typebox';
import { UserDB } from '../data/definition.player.js';
import { getCookie } from 'hono/cookie';

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
    const user = c.user as UserDB;
    const param = c.req.valid('param');
    if (param.id !== c.userCurrentGameID)
      return c.notFound();

    const game = c.games.get(c.userCurrentGameID);
    if (!game)
      return c.notFound();

    if (!(game.player1 === user.public_id || game.player2 === user.public_id))
      throw new HTTPException(401, { message: 'Unauthorized' });

    return streamSSE(c, async stream => {
      while (true) {
        const game = c.games.get(param.id);
        if (!game) {
          await stream.writeSSE({
            data: 'null',
            event: 'not-found'
          });

          break;
        }

        if (game.ended) {
          await stream.writeSSE({
            data: JSON.stringify(game),
            event: 'ended',
          });
          break;
        }

        await stream.sleep(1000);
      }

      await stream.close();
    });
  });
