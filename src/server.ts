/**
 * Node Imports
 */

/**
 * External Imports
 */
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';

import { secureHeaders } from 'hono/secure-headers';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';

import { Type, type Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

/**
 * Internal Imports
 */
import { routerDefault } from './routers/router.default.js';
import { routerPlayer } from './routers/router.player.js';
import { routerGame } from './routers/router.game.js';
import { routerSSE } from './routers/router.sse.js';

import { middlewareViewRenderer } from './middlewares/middleware.view-renderer.js';
import { middlewareSession } from './middlewares/middleware.session.js';
import { middlewareMysql } from './middlewares/middleware.mysql.js';
import { middlewareGame } from './middlewares/middleware.game.js';

import { handlerErrors } from './handlers/handler.errors.js';
import { handlerNotFound } from './handlers/handler.not-found.js';
import { init } from './core/init.js';

/**
 *
 */
export const schemaOptions = Type.Object({
  port: Type.Number(),
  host: Type.String(),
  mysqlOptions: Type.Union([
    Type.Object({
      port: Type.Number(),
      host: Type.String(),
      user: Type.String(),
      password: Type.String(),
      database: Type.String(),
      ssl: Type.Optional(Type.String()),
    }),
    Type.String(),
  ])
});

export type Options = Static<typeof schemaOptions>;

async function server(options?: Options) {
  init();

  const isValid = Value.Check(schemaOptions, options);
  if (!isValid) {
    Array
      .from(Value.Errors(schemaOptions, options))
      .forEach(err => {
        console.error(err);
      });

    process.exit(1);
  }

  /**
   *
   */
  const hono = new Hono();

  // Middlewares
  hono
    .use(logger())
    .use(cors())
    .use(secureHeaders())
    .use('/statics/*', serveStatic({
      root: './public/statics/',
      rewriteRequestPath: (path) => path.replace(/^\/statics/, '/'),
    }))
    .use(middlewareViewRenderer())
    .use(middlewareMysql(options.mysqlOptions))
    .use(middlewareSession())
    .use(middlewareGame());

  // Routers
  hono
    .notFound(handlerNotFound)
    .onError(handlerErrors)
    .route('/', routerDefault)
    .route('/players', routerPlayer)
    .route('/games', routerGame)
    .route('/sse', routerSSE);

  // Listen
  const server = serve({
    fetch: hono.fetch,
    port: options.port,
    hostname: options.host
  }, info => {
    console.log(`http://${info.address}:${info.port}`);
  });

  server.setTimeout(2000);
}

/**
 * Start server
 */
await server({
  port: Number(process.env.PORT),
  host: process.env.HOST,
  mysqlOptions: {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_SCHEMA,
    ssl: process.env.MYSQL_SSL
  }
});
