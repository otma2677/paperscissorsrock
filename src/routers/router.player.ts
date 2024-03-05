/**
 *
 */
import { Hono } from 'hono';
import { middlewareAuth } from '../middlewares/middleware.auth.js';
import { HTTPException } from 'hono/http-exception';
import { RowDataPacket } from 'mysql2/promise';

/**
 *
 */
export const routerPlayer = new Hono();

routerPlayer
  .use(middlewareAuth())
  .get('/profile', async c => {
    const user = c.user;
    if (!user)
      throw new HTTPException(401, { message: 'Unauthorized' });

    // Find games played
    const countRows = await c
      .mysql
      .query(
        'SELECT count(*) FROM games WHERE player1 = ? OR player2 = ?',
        [
          user.public_id,
          user.public_id
        ]
      ) as Array<Array<any>>;

    if (!countRows[0])
      throw new HTTPException(500, { message: 'Internal server error' });

    // Find recent games played (~ 5)
    const gameRows = await c
      .mysql
      .query(
        'SELECT * FROM games WHERE player1 = ? OR player2 = ? ORDER BY created_at DESC LIMIT 5',
        [
          user.public_id,
          user.public_id
        ]
      )

    if (!gameRows[0])
      throw new HTTPException(500, { message: 'Internal server error' });


    return c.html(await c.views.renderAsync('pages/players/profile', {
      user: c.user,
      gamesPlayed: countRows[0][0]['count(*)'],
      recentGames: gameRows[0]
    }));
  });
