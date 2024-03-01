/**
 *
 */
import { join } from 'node:path';
import { writeFileSync, accessSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { randomBytes } from 'node:crypto';

/**
 *
 */
const pathToMigrationsFolder = join(process.cwd(), 'migrations');
if (!checkPath(pathToMigrationsFolder))
  throw new Error('Please create a migrations folder at the root of the project.');

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

let isThereAName = await rl.question('Add a name to add to the file name of the migration ? (leave blank if none)');
let isThereAComment = await rl.question('Add a comment/note to add in the migration file ? (leave blank if none)');

let fileName = new Date()
  .toISOString()
  .replaceAll(':', '_')
  .replace('.', '--');

if (isThereAName.length >= 1) {
  isThereAName = isThereAName
    .replaceAll(' ', '-')
    .replaceAll('.', '-');

  fileName += ('.' + isThereAName);
}

if (isThereAComment.length >= 1) {
  isThereAComment = isThereAComment
    .replaceAll('\n', '\n #');
}

fileName += '.' + randomBytes(3).toString('hex');
fileName += '.sql';
fileName = fileName
  .replaceAll('/', '-');

const finalPath = join(pathToMigrationsFolder, fileName);
if (checkPath(finalPath)) {
  console.error('File already exists.');
  await rl.close();
  process.exit(1);
}

let defaultContent =
  `#Generated at through the script ${ import.meta.filename } at ${ new Date().toISOString() }.\n`;

if (isThereAComment.length >= 0) {
  defaultContent += `#${ isThereAComment }`;
}

writeFileSync(finalPath, defaultContent, { flag: 'ax' });

console.log(`File created at ${ finalPath }`);

await rl.close();

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
