/**
 *
 */
import {createConnection} from 'mysql2/promise';
import {createInterface} from 'node:readline/promises';

/**
 *
 */
const connection = await createConnection({
  port: process.env.MYSQL_PORT,
  host: process.env.MYSQL_HOST,
  password: process.env.MYSQL_PASS,
  user: process.env.MYSQL_USER,
  // database: process.env.MYSQL_SCHEMA,
  ssl: process.env.MYSQL_SSL
});

const rl = createInterface({input: process.stdin, output: process.stdout});
let schemaName = '';
while (true) {
  const answer = await rl.question('What is the name of the MySQL Schema ? (Between 4 and 16 characters)\n');

  if (answer.length >= 4 && answer.length <= 16) {
    schemaName = answer.toLowerCase();
    break;
  }
}

const availableSchemas = (await connection.query('select SCHEMA_NAME as name from information_schema.SCHEMATA;\n'))[0];
const existingSchema = availableSchemas.find(schema => schema['name'] === schemaName);
if (existingSchema) {
  console.log(`Schema name "${schemaName}" is already in use within your MySQL instance.`);
  await rl.close();
  await connection.end();
  process.exit(1);
}

try {
  await connection.query('CREATE SCHEMA IF NOT EXISTS ?', [schemaName]);

} catch (err) {
  console.error(`An error occurred while creating schema ${schemaName}\n\n\n${err}`);
}

await rl.close();
await connection.end();
