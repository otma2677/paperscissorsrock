/**
 *
 */
import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { tbValidator } from '@hono/typebox-validator';
import { Type } from '@sinclair/typebox';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { generatePassword } from '../core/crypt.js';
import { Value } from '@sinclair/typebox/value';
import { schemaUserDB, UserDB } from '../data/definition.database.js';
import { randomBytes } from 'node:crypto';

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

routerDefault
  .get('/', async c => c.html(await c.views.renderAsync('pages/index', {})))
  .get('/stats', async c => {
    // Total players
    const rowsTotalPlayers = await c
      .mysql
      .query('SELECT count(*) FROM users') as Array<RowDataPacket>;

    const rowTotalPlayers = rowsTotalPlayers[0] as Array<unknown>;
    const countTotalPlayer = rowTotalPlayers[0] as Record<string, any>;

    // Active players
    const rowsActivePlayers = await c
      .mysql
      .query(
        'select count(*) from users where timestampdiff(minute, created_at, current_timestamp) <= 15'
      ) as Array<RowDataPacket>;

    const rowActivePlayers = rowsActivePlayers[0] as Array<unknown>;
    const countActivePlayers = rowActivePlayers[0] as Record<string, any>;

    const allRequestResultsValid = rowsActivePlayers && countActivePlayers;
    if (!allRequestResultsValid) {
      c.status(500);
      return c
        .html(c.views.renderAsync('pages/internal-server-error', {}));
    }

    return c
      .html(c.views.renderAsync('pages/stats', {
        playersTotal: countTotalPlayer['count(*)'],
        playersConnected: countActivePlayers['count(*)']
      }));
  })
  .get('/login', async c => c.html(await c.views.renderAsync('pages/login', {})))
  .post('/login', tbValidator('form', schemaPostLogin), async c => {
    const data = c.req.valid('form');
    const rows = await c.mysql
      .query('SELECT * FROM users WHERE name = ?', [ data.name ]) as Array<RowDataPacket>;

    if (rows[0]?.length === 0) {
      c.status(404);
      return c
        .html(c.views.renderAsync('pages/login', {
          error: {
            message: `Account "${data.name}" does not exists. Please register before.`
          },
          form: data
        }));
    }

    if (!Value.Check(schemaUserDB, rows[0]?.at(0))) {
      c.status(500);
      return c
        .html(c.views.renderAsync('pages/login', {
          error: {
            message: 'Services unavailable. Please retry later.'
          },
          form: data
        }));
    }

    const user = rows[0]?.at(0) as UserDB;
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

    return c.redirect('/player/profile');
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

    const rows = await c.mysql
      .query('SELECT * FROM users WHERE name = ?', [ data.name ]) as Array<RowDataPacket>;

    if (rows[0]?.at(0)) {
      c.status(400);
      return c
        .html(c.views.renderAsync('pages/register', {
          error: {
            message: 'The user name already exists'
          },
          form: data
        }));
    }

    const password = await generatePassword(data.password);
    const inserted = await c.mysql
      .query(
        'INSERT INTO users(name, pass, salt) VALUES(?, ?, ?)',
        [
          data.name,
          password.bytesFinal.toString('hex'),
          password.bytesSalt.toString('hex')
        ]
      ) as Array<ResultSetHeader>;

    if (inserted[0]?.affectedRows === 0) {
      c.status(500);
      return c
        .html(c.views.renderAsync('pages/register', {
          error: {
            message: 'Services unavailable. Please retry later.'
          },
          form: data
        }));
    }

    return c.html(await c.views.renderAsync('pages/login', {
      message: 'You are registered, you can now log in'
    }));
  });
