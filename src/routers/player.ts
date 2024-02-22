/**
 *
 */
import { Hono } from 'hono';
import { authManager } from '../middlewares/auth-manager.js';

/**
 *
 */
export const routerPlayer = new Hono();

routerPlayer
  .use(authManager())
  .get('/profile', async c => c.html(await c.views.renderAsync('pages/player/profile', { user: c.user })));
