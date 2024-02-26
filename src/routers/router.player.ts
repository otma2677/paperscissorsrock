/**
 *
 */
import { Hono } from 'hono';
import { middlewareAuth } from '../middlewares/middleware.auth.js';

/**
 *
 */
export const routerPlayer = new Hono();

routerPlayer
  .use(middlewareAuth())
  .get('/profile', async c => c.html(await c.views.renderAsync('pages/players/profile', { user: c.user })));
