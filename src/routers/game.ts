/**
 *
 */
import { Hono } from 'hono';
import { authManager } from '../middlewares/auth-manager.js';
import { Game } from '../data/definition.game.js';
import { UserDB } from '../data/definition.database.js';

/**
 *
 */
export const routerGame = new Hono();

routerGame
  .use(authManager())
  .get('/waiting', async c => {
    const user = c.user as UserDB;

    const waiter = c.room.get(user.public_id);
    if (waiter) {
      return c.html(
        c.views.renderAsync('pages/game/waiting-room', {
          room: waiter.toString()
        })
      )
    }

    const d = new Date()
    c.room.set(user.public_id, d);
    return c.html(
      c.views.renderAsync('pages/game/waiting-room', {
        room: d.toString()
      })
    )
  });
