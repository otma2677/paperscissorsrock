/**
 *
 */
import { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

/**
 *
 */
export const errorHandler: ErrorHandler = async function (err, c) {
  if (!(err instanceof HTTPException)) {
    c.status(500);
    return c.html(
      c.views.renderAsync('pages/errors/internal-server-error', {})
    );
  }

  c.status(err.status);
  return c.html(
    c.views.renderAsync('pages/errors/custom-error', {
      status: err.status,
      message: err.message
    })
  );
};
