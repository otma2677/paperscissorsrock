/**
 *
 */
import { type MiddlewareHandler } from 'hono';
import {
  createPool,
  createConnection,
  type Connection,
  type ConnectionOptions,
} from 'mysql2/promise';

/**
 *
 */
export function mysql(options: ConnectionOptions, pool = false): MiddlewareHandler {
  const connection = createConnection(options);

  return async function (c, next) {
    c.mysql = await connection;

    await next();
  };
}

/**
 *
 */
declare module 'hono' {
  interface Context {
    mysql: Connection;
  }
}
