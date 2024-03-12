/**
 *
 */
import { join } from 'node:path';
import { readdirSync, readFileSync, accessSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { createConnection } from 'mysql2/promise';
import { fail } from 'node:assert';

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
else if (answer.toLowerCase() === 'erase') await commandErase();
else if (answer.toLowerCase() === 'up') await commandUp(migrations);
else if (answer.toLowerCase() === 'up-latest') await commandUpLatest(migrations);
else console.error(`Input is not valid. Given input is "${ answer }"`);


await rl.close();

/**
 * HANDLERS
 */
async function commandErase() {
  const connection = await createConnection({
    port: process.env.MYSQL_PORT,
    host: process.env.MYSQL_HOST,
    password: process.env.MYSQL_PASS,
    user: process.env.MYSQL_USER,
    database: process.env.MYSQL_SCHEMA,
    ssl: process.env.MYSQL_SSL
  });

  try {
    let failToCommit = {
      err: false,
      content: null
    };

    const results = await connection
      .query('select TABLE_NAME as name from information_schema.TABLES where TABLE_SCHEMA = ?', [ process.env.MYSQL_SCHEMA ]);

    const tables = results[0]
      .filter(table => table['name'] !== 'migrations')
      .filter(table => table['name'] !== 'migration_logs')
      .map(table => table['name']);

    for (const tableName of tables) {
      try {
        const result = await connection.execute(`drop table ${ tableName };`);

        console.info(`Table ${ tableName } has been drop.`);
      } catch (err) {

        console.error(`Cannot drop table ${ tableName }. ${ err }`);
        failToCommit.err = true;
        failToCommit.content = JSON.stringify(err);
      }
    }

    await connection.query('truncate migrations;');
    console.info(`Table migrations has been cleaned.`);

    await connection.query(
      'INSERT INTO migration_logs(command, failed, result) VALUES(?, ?, ?)',
      [ 'erase', true, JSON.stringify(failToCommit) ]
    );

    await connection.end();
    process.exit(0);
  } catch (err) {

    await connection.query(
      'INSERT INTO migration_logs(command, failed, result) VALUES(?, ?, ?)',
      [ 'erase', true, JSON.stringify(err) ]
    );
    await connection.end();

    console.error(err);
    process.exit(1);
  }
}

async function commandUpLatest(migrations) {
  const connection = await createConnection({
    port: process.env.MYSQL_PORT,
    host: process.env.MYSQL_HOST,
    password: process.env.MYSQL_PASS,
    user: process.env.MYSQL_USER,
    database: process.env.MYSQL_SCHEMA,
    ssl: process.env.MYSQL_SSL
  });

  try {
    let failToCommit = {
      err: false,
      content: null
    };

    const migrationRows = (await connection.query('SELECT * FROM migrations WHERE failed is false ORDER BY creation_date DESC'))[0];
    let migrationsFromLastToLatest = [];

    if (migrationRows.length === 0) {
      migrationsFromLastToLatest = migrations;
    } else {
      for (const row of migrationRows) {
        const foundMigration = migrations.findIndex(migration => migration.name === row.name);
        if (foundMigration === -1) {
          migrationsFromLastToLatest.push(row[0]);
        }
      }
    }

    if (migrationsFromLastToLatest.length >= 1) {
      try {
        await connection.beginTransaction();

        for (const migration of migrationsFromLastToLatest) {
          const chunks = migration
            .content
            .split(';')
            .filter(stmt => stmt.length >= 10);

          for (const chunk of chunks)
            await connection.query(chunk);

          await connection.query(
            'INSERT INTO migrations(creation_date, name, path, content) VALUES(?, ?, ?, ?)',
            [
              migration.timestamp,
              migration.name,
              migration.path,
              migration.content
            ]
          )
        }

        await connection.commit();
        const names = migrations
          .map(migration => migration.name)
          .join(',\n');

        console.info(`Migrations have been migrated up to the latest;\n${ names }`);

      } catch (err) {

        console.error(err);
        await connection.rollback();
        failToCommit.err = true;
        failToCommit.content = JSON.stringify(err);
      }

    } else {
      console.info(`No migrations need to be done.`);
    }

    await connection.query(
      'INSERT INTO migration_logs(command, result) VALUES(?, ?)',
      [ 'up-latest', JSON.stringify(failToCommit) ]
    );
    await connection.end();

  } catch (err) {

    await connection.query(
      'INSERT INTO migration_logs(command, failed, result) VALUES(?, ?, ?)',
      [ 'up-latest', true, JSON.stringify(err) ]
    );
    await connection.end();

    console.error(err);
  }
}

async function commandUp(migrations) {
  const connection = await createConnection({
    port: process.env.MYSQL_PORT,
    host: process.env.MYSQL_HOST,
    password: process.env.MYSQL_PASS,
    user: process.env.MYSQL_USER,
    database: process.env.MYSQL_SCHEMA,
    ssl: process.env.MYSQL_SSL
  });

  try {
    let failToCommit = {
      err: false,
      content: null
    };

    const migrationRows = (await connection.query('SELECT * FROM migrations WHERE failed is false ORDER BY creation_date DESC LIMIT 1'))[0];
    const lastMigrationIndex = migrations.findIndex(migration => migration?.name === migrationRows[0]?.name);
    if (!migrations[lastMigrationIndex + 1]) {
      console.error(`Migration of ${ migrationRows[0]?.name } has already been done at ${ migrationRows[0]?.inserted_at }.`);
      process.exit(1);
    }

    const migrationToBeInserted = lastMigrationIndex === -1 ? migrations[0] : migrations[lastMigrationIndex + 1];
    const lastMigration = lastMigrationIndex === -1 ? migrations[0] : migrations[lastMigrationIndex + 1];


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

        const logs = (await connection.query(
          'INSERT INTO migration_logs(command, result) VALUES(?, ?)',
          [ 'up', result ]
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

        failToCommit.err = true;
        failToCommit.content = JSON.stringify(err);
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

    await connection.query(
      'INSERT INTO migration_logs(command, result) VALUES(?, ?)',
      [ 'up', JSON.stringify(failToCommit) ]
    );

    await connection.end();
    process.exit(0);
  } catch (err) {

    await connection.query(
      'INSERT INTO migration_logs(command, failed, result) VALUES(?, ?, ?)',
      [ 'up', true, JSON.stringify(err) ]
    );

    console.error(err);
    await rl.close();
    process.exit(1);
  }
}

async function commandShow(migrations) {
  for (const migration of migrations)
    console.log(`${ migration.name } created at ${ migration.timestamp.toLocaleTimeString() }`);

  const connection = await createConnection({
    port: process.env.MYSQL_PORT,
    host: process.env.MYSQL_HOST,
    password: process.env.MYSQL_PASS,
    user: process.env.MYSQL_USER,
    database: process.env.MYSQL_SCHEMA,
    ssl: process.env.MYSQL_SSL
  });

  await connection.query(
    'INSERT INTO migration_logs(command, result) VALUES(?, (JSON_ARRAY()))',
    [ 'show' ]
  );

  await connection.end();
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
