/**
 *
 */
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { type ConnectionOptions } from 'mysql2/promise';

// Internals
import { routerGame } from './routers/game.js';
import { routerDefault } from './routers/default.js';
import { viewRenderer } from './middlewares/view-renderer.js';
import { gameManager } from './middlewares/game-manager.js';
import { sessionManager } from './middlewares/session-manager.js';
import { mysql } from './middlewares/mysql.js';
import { routerPlayer } from './routers/player.js';
import { waitingRoomManager } from './middlewares/waiting-room-manager.js';

/**
 *
 */
export interface Options {
  port: number;
  host: string;
  mysqlOptions: ConnectionOptions;
}

async function server(options: Options) {
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
    .use(viewRenderer())
    .use(mysql(options.mysqlOptions))
    .use(gameManager())
    .use(waitingRoomManager())
    .use(sessionManager());

  // Routers
  hono
    .notFound(async c => c.html(await c.views.renderAsync('./pages/not-found', {})))
    .route('/', routerDefault)
    .route('/player', routerPlayer)
    .route('/game', routerGame);

  // Listen
  const server = serve({
    fetch: hono.fetch,
    port: options.port,
    hostname: options.host
  }, info => {
    console.log(`http://${info.address}:${info.port}`);
  });
}

await server({
  port: 3000,
  host: '127.0.0.1',
  mysqlOptions: {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_SCHEMA,
    ssl: process.env.MYSQL_SSL
  }
});
