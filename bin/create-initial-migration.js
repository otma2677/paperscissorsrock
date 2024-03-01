/**
 *
 */
import {createConnection} from 'mysql2/promise';

/**
 *
 */
const connection = await createConnection({
  port: process.env.MYSQL_PORT,
  host: process.env.MYSQL_HOST,
  password: process.env.MYSQL_PASS,
  user: process.env.MYSQL_USER,
  database: process.env.MYSQL_SCHEMA,
  ssl: process.env.MYSQL_SSL
});

try {
  const availableTables = (await connection
    .query('select TABLE_NAME as name from information_schema.tables where table_schema = ?', [ process.env.MYSQL_SCHEMA ]))[0];
  const existingMigrationTable = availableTables.find(table => table['name'] === 'migrations');

  if (existingMigrationTable) {
    console.log(`Table "migrations" already exists in schema "${ process.env.MYSQL_SCHEMA }"`);
    await connection.end();
    process.exit(0);
  }

} catch (err) {
  console.error(`An error occurred while creating table "migrations" in schema "${ process.env.MYSQL_SCHEMA }".\n\n\n${err}`);
  await connection.end();
  process.exit(1);
}

const migrationTable = `
  CREATE TABLE IF NOT EXISTS migrations
  (
      id            int unsigned primary key auto_increment not null,
      creation_date datetime                                not null,
      inserted_at   datetime default current_timestamp      not null,
      name          varchar(256)                            not null,
      path          varchar(1024)                           not null,
      content       mediumtext                              not null,
      failed        boolean  default false                  not null,
      error         json
  );
`.trim().replaceAll('\r', '').replaceAll('\n', '');


try {
  await connection.query(migrationTable);

  const availableTables = (await connection
    .query('select TABLE_NAME as name from information_schema.tables where table_schema = ?', [ process.env.MYSQL_SCHEMA ]))[0];
  const existingMigrationTable = availableTables.find(table => table['name'] === 'migrations');

  if (existingMigrationTable)
    console.log(`Table "migrations" successfully created within "${ process.env.MYSQL_SCHEMA }".`);
  else
    console.error(`Table "migrations" cannot be created within schema "${ process.env.MYSQL_SCHEMA }" for un unknown reason.`);

} catch (err) {
  console.error(`An error occurred while creating table "migrations" in schema "${ process.env.MYSQL_SCHEMA }".\n\n\n${err}`);
  await connection.end();
  process.exit(1);
}

await connection.end();
