/**
 *
 */
import { Hono } from 'hono';
import { middlewareAuth } from '../middlewares/middleware.auth.js';
import { HTTPException } from 'hono/http-exception';

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

    const connection = await c.mysqlPool.getConnection();
    // Find games played
    const countRows = await connection
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
    const gameRows = await connection
      .query(
        `
            select games.created_at,
                   games.public_id,
                   u1.name as player1,
                   u2.name as player2,
                   games.winner
            from games
                     inner join users as u1 on games.player1 = u1.public_id
                     inner join users as u2 on games.player2 = u2.public_id
            where games.player1 = ?
            or games.player2 = ?
            order by created_at desc
            limit ?
        `.trim(),
        [
          user.public_id,
          user.public_id,
          10
        ]
      )

    connection.release();

    if (!gameRows[0])
      throw new HTTPException(500, { message: 'Internal server error' });


    return c.html(await c.views.renderAsync('pages/players/profile', {
      user: c.user,
      gamesPlayed: countRows[0][0]['count(*)'],
      recentGames: gameRows[0]
    }));
  });
