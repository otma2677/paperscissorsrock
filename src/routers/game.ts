/**
 *
 */
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { HTTPException } from 'hono/http-exception';
import { tbValidator } from '@hono/typebox-validator';
import { Type } from '@sinclair/typebox';

import { authManager } from '../middlewares/auth-manager.js';
import { UserDB } from '../data/definition.database.js';
import { Room } from '../middlewares/game-manager.js';
import { serviceCreateARoom, serviceFindRoom } from '../data/service.game.js';

/**
 *
 */
export const routerGame = new Hono();

const schemaParamIDString = Type.Object({
  id: Type.String()
});

/**
 *
 */
routerGame
  .use(authManager())
  .all('/sse/*', async (c, next) => {
    c.res.headers.set('Content-Type', 'text/event-stream; charset=UTF-8');
    c.res.headers.set('Cache-Control', 'no-cache');
    c.res.headers.set('Connection', 'keep-alive');

    await next();
  })
  .get('/sse/broadcast', tbValidator('param', schemaParamIDString), async c => {
    return streamSSE(c, async stream => {
      const param = c.req.valid('param');
      const game = c.games.get(param.id);

      if (game) {
        while (true) {
          const temp = c.games.get(param.id);
          if (!temp)
            break;

          await stream.writeSSE({
            data: JSON.stringify(game),
            event: 'game'
          });

          if (temp.ended)
            break;

          await stream.sleep(1000);
        }
      }

      await stream.close();
    });
  })
  .get('/sse/waiting-room', async c => {
    return streamSSE(c, async stream => {
      const roomID = c.userCurrentRoomID;

      while (true) {
        if (!roomID)
          break;

        await stream.writeSSE({
          data: JSON.stringify({
            availablePlayers: c.rooms.size
          }),
          event: 'wait-for-opponent',
          id: roomID
        });

        await stream.sleep(1000);
      }

      await stream.close();
    });
  })
  .get('/game/:id', tbValidator('param', schemaParamIDString), async c => {
    const param = c.req.valid('param');
    const user = c.user as UserDB;

    const game = c.games.get(param.id);
    if (!game)
      return c.notFound();

    if (user.public_id !== game.player1 || user.public_id !== game.player2)
      throw new HTTPException(401, { message: 'Unauthorized' });

    return c
      .html(
        c.views.renderAsync('pages/game/gaming-room', { game })
      );
  })
  .get('/waiting', async c => {
      const user = c.user as UserDB;

      // In case already into a game, redirection to the game
      const gameID = c.userCurrentGameID;
      if (gameID)
        return c.redirect(`/game/${gameID}`);

      let roomID = c.userCurrentRoomID;
      let room: Room | undefined;

      if (roomID)
        room = c.rooms.get(roomID);

      // Search for an opened room
      // Or create a new one
      const existingRoom = await serviceFindRoom(c);
      if (existingRoom?.key) { // Search
        room = existingRoom.value;
        c.userCurrentRoomID = undefined;
      }

      const newRoomID = await serviceCreateARoom(c);
      if (!newRoomID) {
        return c.html(
          c.views.renderAsync('pages/game/waiting-room', {
            room: JSON.stringify(room),
            size: c.rooms.size ?? null,
            path: '/sse/waiting-room',
          })
        );
      }

      return c.notFound();
    }
  )
;
