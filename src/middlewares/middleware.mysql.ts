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
  let connection: Promise<Connection>;
  let pool: Pool;

  if (typeof options === 'string')
    connection = createConnection(options);
  if (typeof options === 'object') {
    connection = createConnection({
      host: options.host,
      port: options.port,
      user: options.user,
      password: options.password,
      database: options.database,
      ssl: options.ssl
    });
  }

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
    c.mysql = await connection;
    c.mysqlPool = pool;

    await next();
  };
}

/**
 *
 */
declare module 'hono' {
  interface Context {
    mysql: Connection;
    mysqlPool: Pool;
  }
}
