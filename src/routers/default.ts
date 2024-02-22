/**
 *
 */
import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { tbValidator } from '@hono/typebox-validator';
import { Type } from '@sinclair/typebox';
import { generatePassword } from '../core/crypt.js';
import { randomBytes } from 'node:crypto';
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

routerDefault
  .get('/', async c => c.html(await c.views.renderAsync('pages/index', {})))
  .get('/stats', async c => {
    const countTotalPlayers = await countPlayers(c.mysql);
    const countActivePlayers = await countPlayersActive(c.mysql);

    const allRequestResultsValid = typeof countTotalPlayers === 'number' &&
      typeof countActivePlayers === 'number';
    if (!allRequestResultsValid) {
      c.status(500);
      return c
        .html(c.views.renderAsync('pages/internal-server-error', {}));
    }

    return c
      .html(c.views.renderAsync('pages/stats', {
        playersTotal: countTotalPlayers,
        playersConnected: countActivePlayers,
        gamesCurrently: c.games.size
      }));
  })
  .get('/login', async c => c.html(await c.views.renderAsync('pages/login', {})))
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

    if (inserted.affectedRows === 0) {
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
