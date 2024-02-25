/**
 *
 */
import { NotFoundHandler } from 'hono';

/**
 *
 */
export const notFoundHandler: NotFoundHandler = async function (c) {
  c.status(404);
  return c.html(await c.views.renderAsync('./pages/errors/not-found', {}));
};
