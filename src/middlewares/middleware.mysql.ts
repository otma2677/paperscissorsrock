/**
 *
 */
import { type MiddlewareHandler } from 'hono';
import {
  createConnection,
  type Connection,
  createPool,
  type PoolConnection,
  type Pool
} from 'mysql2/promise';
import { Options } from '../server.js';

/**
 *
 */
export function middlewareMysql(options: Options['mysqlOptions']): MiddlewareHandler {
  let pool: Pool;

  if (typeof options === 'string')
    pool = createPool(options);
  if (typeof options === 'object') {
    pool = createPool({
      host: options.host,
      port: options.port,
      user: options.user,
      password: options.password,
      database: options.database,
      ssl: options.ssl
    });
  }

  return async function (c, next) {
    c.mysqlPool = pool;

    try {
      await c.mysqlPool.ping();

    } catch (err) {
      await pool.connect();
    }

    await next();
  };
}

/**
 *
 */
declare module 'hono' {
  interface Context {
    mysqlPool: Pool;
  }
}
