/**
 *
 */
import { type MiddlewareHandler } from 'hono';
import {
  createConnection,
  type Connection,
} from 'mysql2/promise';
import { Options } from '../server.js';

/**
 *
 */
export function middlewareMysql(options: Options['mysqlOptions'], pool = false): MiddlewareHandler {
  let connection: Promise<Connection>;

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
