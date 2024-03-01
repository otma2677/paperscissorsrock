/**
 *
 */
import { join } from 'node:path';
import { writeFileSync, accessSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';

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

let isFullDate = '';
while(true) {
  const temp = await rl.question('Use default date format (year-month-day is default, or time) ? (Y/n)');
  if (temp === '' || temp.toLowerCase() === 'y')
    isFullDate = 'y';

  if (temp.toLowerCase() === 'n')
    isFullDate = 'n';

  if (isFullDate === 'y' || isFullDate === 'n')
    break;
}

let isThereAName = await rl.question('Add a name to the migration ? (leave blank if none)');
let isThereAComment = await rl.question('Add a comment to the migration ? (leave blank if none)');

let fileName = '';
if (isFullDate === 'y')
  fileName += new Date().toLocaleDateString();
else
  fileName += Date.now();

if (isThereAName.length >= 1) {
  isThereAName = isThereAName
    .replaceAll(' ', '-')
    .replaceAll('.', '_');

  fileName += ('.' + isThereAName);
} else {
  fileName += ('.' + '0001');
}

if (isThereAComment) {
  isThereAComment = isThereAComment
    .replaceAll('\n', '\n #');
}

fileName += '.sql';
fileName = fileName
  .replaceAll('/', '-');

let count = 1;
while (true) {
  const previous = '000' + String(count);
  const pathToMaybeFile = join(process.cwd(), 'migrations', fileName);

  console.log(pathToMaybeFile);

  if (checkPath(pathToMaybeFile)) {
    count += 1;
    const current = '000' + String(count);
    fileName = fileName.replace(previous, current);
  }

  if (!checkPath(pathToMaybeFile))
    break;
}

const finalPath = join(process.cwd(), 'migrations', fileName);
const defaultContent = `# Generated at ${ new Date().toLocaleTimeString() }.\n#${ isThereAComment }`;
writeFileSync(finalPath, defaultContent, { encoding: 'utf-8' });

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
