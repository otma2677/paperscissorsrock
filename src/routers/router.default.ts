/**
 *
 */
import { randomBytes } from 'node:crypto';

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { tbValidator } from '@hono/typebox-validator';
import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { type RowDataPacket } from 'mysql2/promise';

import { generatePassword } from '../core/crypt.js';
import { countPlayers, countPlayersActive, getUserByName, insertUser } from '../data/service.player.js';

/**
 *
 */
export const routerDefault = new Hono();

const schemaPostLogin = Type.Object({
  name: Type.String({ minLength: 5, maxLength: 64 }),
  password: Type.String({ minLength: 8, maxLength: 64 })
});

const schemaPostRegister = Type.Object({
  name: Type.String({ minLength: 5, maxLength: 64 }),
  password: Type.String({ minLength: 8, maxLength: 64 }),
  passwordConfirmation: Type.String({ minLength: 8, maxLength: 64 }),
});

const schemaParamPageStringToNumber = Type.Object({
  page: Type.Transform(Type.String())
    .Decode(v => Number(v))
    .Encode(v => String(v))
});

routerDefault
  .get('/', async c => c.html(await c.views.renderAsync('pages/index', {})))
  .get('/contact', async c => c.html(await c.views.renderAsync('pages/contact', {})))
  .get('/privacy', async c => c.html(await c.views.renderAsync('pages/privacy', {})))
  .get('/past-games/:page', tbValidator('param', schemaParamPageStringToNumber), async c => {
    const param = Value.Decode(schemaParamPageStringToNumber, c.req.valid('param'));
    const size = 50;
    const offset = size * (param.page -1);

    const countSelectQuery = await c.mysql.query('SELECT count(*) FROM games') as Array<RowDataPacket>;
    const count = countSelectQuery[0]?.[0]?.['count(*)'] as number | undefined;

    if (count === undefined)
      throw new HTTPException(500, { message: 'Internal server error' });

    if (!Number.isInteger(count))
      throw new HTTPException(500, { message: 'Internal Server Error' });


    const rows = await c
      .mysql
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
            order by created_at desc
            limit ? offset ?;
        `,
        [
          size,
          offset
        ]
      ) as Array<RowDataPacket>;

    const sid = getCookie(c, 'sid') ?? '';
    const auth = c.session.has(sid);

    return c.html(c.views.renderAsync('pages/past-games', { games: rows[0], count, size, page: param.page, pages: Math.floor(count / size), auth }));
  })
  .get('/stats', async c => {
    const countTotalPlayers = await countPlayers(c.mysql);
    const countActivePlayers = await countPlayersActive(c.mysql);

    const allRequestResultsValid = typeof countTotalPlayers === 'number' &&
      typeof countActivePlayers === 'number';
    if (!allRequestResultsValid)
      throw new HTTPException(500, { message: 'Internal Server Error' });

    const sid = getCookie(c, 'sid') ?? '';
    const auth = c.session.has(sid);

    return c
      .html(c.views.renderAsync('pages/stats', {
        playersTotal: countTotalPlayers,
        playersConnected: countActivePlayers,
        gamesCurrently: c.games.size,
        auth
      }));
  })
  .get('/login', async c => {
    const sid = getCookie(c, 'sid');
    if (sid) {
      const session = c.session.get(sid);
      if (session)
        return c.redirect('/players/profile');
    }

    return c.html(await c.views.renderAsync('pages/login', {}))
  })
  .post('/login', tbValidator('form', schemaPostLogin), async c => {
    const data = c.req.valid('form');
    const user = await getUserByName(data, c.mysql);

    if (!user) {
      c.status(404);
      return c
        .html(c.views.renderAsync('pages/login', {
          error: {
            message: `Account "${data.name}" does not exists. Please register before.`
          },
          form: data
        }));
    }

    const password = await generatePassword(data.password, user.salt);
    if (user.pass !== password.bytesFinal.toString('hex')) {
      c.status(400);
      return c
        .html(c.views.renderAsync('pages/login', {
          error: {
            message: `The password is not valid.`
          },
          form: data
        }));
    }

    const idSession = randomBytes(32).toString('hex');
    c.session.set(idSession, {
      id: user.id,
      created_at: user.created_at,
      public_id: user.public_id,
      name: user.name,
    });
    setCookie(c, 'sid', idSession, {
      maxAge: Date.now() + (((24 * 60 * 60) *1000) *7),
      secure: true,
      httpOnly: true,
    })

    return c.redirect('/players/profile');
  })
  .get('/logout', async c => {
    const sid = getCookie(c, 'sid');
    if (sid)
      c.session.delete(sid);

    deleteCookie(c, 'sid');
    return c.redirect('/');
  })
  .get('/register', async c => c.html(await c.views.renderAsync('pages/register', {})))
  .post('/register', tbValidator('form', schemaPostRegister), async c => {
    const data = c.req.valid('form');

    if (data.password !== data.passwordConfirmation) {
      c.status(400);
      return c
        .html(c.views.renderAsync('pages/register', {
          error: {
            message: 'Passwords are not the same'
          },
          form: data
        }));
    }

    const user = await getUserByName(data, c.mysql);

    if (user) {
      c.status(400);
      return c
        .html(c.views.renderAsync('pages/register', {
          error: {
            message: 'The user name already exists'
          },
          form: data
        }));
    }

    const passAndSalt = await generatePassword(data.password);
    const inserted = await insertUser(
      {
        name: data.name,
        pass: passAndSalt.bytesFinal.toString('hex'),
        salt: passAndSalt.bytesSalt.toString('hex')
      },
      c.mysql
    );

    if (inserted.affectedRows === 0)
      throw new HTTPException(500, { message: 'Internal Server Error' });

    return c.html(await c.views.renderAsync('pages/login', {
      message: 'You are registered, you can now log in'
    }));
  });
