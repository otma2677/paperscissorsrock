/**
 *
 */

/**
 *
 */
export function init() {
  if (process.env.NODE_ENV !== 'production')
    throw new Error('NODE_ENV is not set to "production", in environment variables.');

  if (Number.isNaN(Number(process.env.PORT)))
    throw new Error('PORT is not set and or is not a number, in environment variables.');

  if (!process.env.HOST)
    throw new Error('HOST is not set, in environment variables.');

  if (Number.isNaN(Number(process.env.GAME_MAX_GAME)))
    throw new Error('GAME_MAX_GAME is not set, in environment variables.');

  if (Number.isNaN(Number(process.env.GAME_MAX_WAIT)))
    throw new Error('GAME_MAX_WAIT is not set, in environment variables.');

  if (Number.isNaN(Number(process.env.GAME_MAX_ROUNDS)))
    throw new Error('GAME_MAX_ROUNDS is not set, in environment variables.');

  if (Number.isNaN(Number(process.env.MYSQL_PORT)))
    throw new Error('MYSQL_PORT is not set and or is not a number, in environment variables.');

  if (!process.env.MYSQL_HOST)
    throw new Error('MYSQL_HOST is not set, in environment variables.');

  if (!process.env.MYSQL_PASS)
    throw new Error('MYSQL_PASS is not set, in environment variables.');

  if (!process.env.MYSQL_USER)
    throw new Error('MYSQL_USER is not set, in environment variables.');

  if (!process.env.MYSQL_SCHEMA)
    throw new Error('MYSQL_SCHEMA is not set, in environment variables.');
}
