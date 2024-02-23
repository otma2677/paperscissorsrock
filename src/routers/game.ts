/**
 *
 */
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { authManager } from '../middlewares/auth-manager.js';
import { Game } from '../data/definition.game.js';
import { UserDB } from '../data/definition.database.js';

/**
 *
 */
export const routerGame = new Hono();

routerGame
  .use(authManager())
  .all('/sse/*', async (c, next) => {
    c.res.headers.set('Content-Type', 'text/event-stream; charset=UTF-8');
    c.res.headers.set('Cache-Control', 'no-cache');
    c.res.headers.set('Connection', 'keep-alive');

    await next();
  })
  .get('/sse/update', async c => {
    return streamSSE(c, async stream => {
      while (true) {
        c.room
          .forEach((v, k, m) => {
            if ((Date.now() - v.getTime()) >= 1000 * 10)
              m.delete(k);
          })

        await stream.writeSSE({
          data: 'Searching an opponent ... ' + c.room.size,
        });

        if (!c.room.has(c.user?.public_id as string))
          break;

        await stream.sleep(1000);
      }

      await stream.close();
    });
  })
  .get('/waiting', async c => {
    const user = c.user as UserDB;

    const waiter = c.room.get(user.public_id);
    const moment = new Date();
    if (!waiter)
      c.room.set(user.public_id, moment);

    return c.html(
      c.views.renderAsync('pages/game/waiting-room', {
        room: waiter ? waiter.toString() : moment.toString(),
        size: c.room.size ?? null,
        path: '/sse/update'
      })
    );
  });
