/**
 *
 */
import { join } from 'node:path';
import { readdirSync, readFileSync, accessSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { createConnection } from 'mysql2/promise';

/**
 *
 */
const rl = createInterface({ input: process.stdin, output: process.stdout });

console.log(`  Choose an option in the next prompt;
- up (Migrate one step up)
- down (Migrate one step down)
- show (Show all available migrations metadata)
- erase (Migrate down all tables)
- up-latest (Migrate up from first to last migration)`);

const answer = await rl.question('What do you want to do ?\n');

const migrations = parseMigrations();

if (migrations.length <= 0) console.log('\n## No migrations available.');
else if (answer.toLowerCase() === 'show') commandShow(migrations);
else if (answer.toLowerCase() === 'up') await commandUp(migrations);
else console.error(`Input is not valid. Given input is "${ answer }"`);


await rl.close();

/**
 * HANDLERS
 */
async function commandUp(migrations) {
  try {
    const connection = await createConnection({
      port: process.env.MYSQL_PORT,
      host: process.env.MYSQL_HOST,
      password: process.env.MYSQL_PASS,
      user: process.env.MYSQL_USER,
      database: process.env.MYSQL_SCHEMA,
      ssl: process.env.MYSQL_SSL
    });

    const migrationRows = (await connection.query('SELECT * FROM migrations WHERE failed is false ORDER BY creation_date DESC LIMIT 1'))[0];
    const lastMigrationIndex = migrations.findIndex(migration => migration?.name === migrationRows[0]?.name);
    if (!migrations[lastMigrationIndex +1]) {
      console.error(`Migration of ${ migrationRows[0]?.name } has already been done at ${ migrationRows[0]?.inserted_at}.`);
      process.exit(1);
    }

    const migrationToBeInserted = lastMigrationIndex === -1 ? migrations[0] : migrations[lastMigrationIndex +1];
    const lastMigration = lastMigrationIndex === -1 ? migrations[0] : migrations[lastMigrationIndex +1];


    /**
     * Insert the last migration
     */
    try {
      const statements = lastMigration
        ?.content
        .split(';')
        .filter(stmt => stmt.length >= 10)

      try {
        await connection.beginTransaction();

        for (const statement of statements)
          await connection.query(statement);

        await connection.commit();

        const result = (await connection.query(
          'INSERT INTO migrations(creation_date, name, path, content) VALUES(?, ?, ?, ?)',
          [
            lastMigration.timestamp,
            lastMigration.name,
            lastMigration.path,
            lastMigration.content
          ]
        ))[0];

        if (result.affectedRows === 1)
          console.log(`Migration ${ lastMigration.name } has been successfully applied.`);

      } catch (err) {
        await connection.rollback();

        await connection.query(
          'INSERT INTO migrations(creation_date, name, path, content, failed, error) VALUES(?, ?, ?, ?, ?, ?)',
          [
            lastMigration.timestamp,
            lastMigration.name,
            lastMigration.path,
            lastMigration.content,
            true,
            JSON.stringify(err)
          ]
        );

        console.error(err);
        console.error(`No changes to the database have been made.`);
      }

    } catch (err) {
      await connection.query(
        'INSERT INTO migrations(creation_date, name, path, content, failed, error) VALUES(?, ?, ?, ?, ?, ?)',
        [
          lastMigration.timestamp,
          lastMigration.name,
          lastMigration.path,
          lastMigration.content,
          true,
          JSON.stringify(err)
        ]
      );

      console.error(err);
    }

    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error(err);
    await rl.close();
    process.exit(1);
  }

}

function commandShow(migrations) {
  for (const migration of migrations) {
    console.log(`${ migration.name } created at ${ migration.timestamp.toLocaleTimeString() }`);
  }
}

/**
 * PARSER
 */
function parseMigrations() {
  const pathToMigrations = join(process.cwd(), 'migrations');
  const fileNames = readdirSync(pathToMigrations);

  return fileNames
    .map(file => {
      const path = join(pathToMigrations, file);
      const chunks = file.split('.');
      if (chunks[0].length <= 0)
        throw new Error(`File name is not valid at path ${ path }`);

      const note = chunks[2];

      const chunk = chunks[0]
        .replace('--', '.')
        .replaceAll('_', ':');
      const timestamp = new Date(chunk);

      if (isNaN(timestamp.getTime()))
        throw new Error(`File name is not valid iso timestamp first chunk at path ${ path }`);

      const raw = readFileSync(path, { encoding: 'utf-8' })
        .trim()
        .replaceAll('\r', '');

      const content = raw
        .split('\n')
        .map(line => {
          const symbols = line.split('');
          if (symbols.at(0) !== '#')
            return line;
        })
        .filter(line => line !== undefined)
        .join('');

      return {
        name: file,
        path,
        timestamp,
        content,
        note: note !== 'sql' ? chunks[1] : undefined
      }
    })
    .sort((a, b) => {
      if (a.timestamp > b.timestamp) return 1;
      if (a.timestamp < b.timestamp) return -1;
      return 0;
    });
}

/**
 * HELPERS
 */
function checkPath(path) {
  try {
    accessSync(path);

    return true;
  } catch (err) {
    return false;
  }
}

async function connection() {
  return await createConnection({
    port: process.env.MYSQL_PORT,
    host: process.env.MYSQL_HOST,
    password: process.env.MYSQL_PASS,
    user: process.env.MYSQL_USER,
    database: process.env.MYSQL_SCHEMA,
    ssl: process.env.MYSQL_SSL
  });
}
