/**
 *
 */
import { Hono } from 'hono';
import { authManager } from '../middlewares/auth-manager.js';

/**
 *
 */
export const routerGame = new Hono();

routerGame
  .use(authManager())
  .get('/', async c => c.text('Hello ' + c.user?.name));
