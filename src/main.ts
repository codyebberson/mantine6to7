import fastGlob from 'fast-glob';
import { readFileSync, writeFileSync } from 'fs';
import { basename, resolve } from 'path';
import { convertToCssModules } from './css';

const inputDir = '../medplum/packages/react';
const startToken = '\nconst useStyles = createStyles(';
const endToken = '\n});\n';

async function main(): Promise<void> {
  const files = (await fastGlob([inputDir + '/src/**/*.tsx'])).map((f) => resolve(f));
  for (const fileName of files) {
    await convertFile(fileName);
  }
}

async function convertFile(fileName: string): Promise<void> {
  // Read file contents
  const contents = readFileSync(fileName, 'utf8');

  // Look for call to "createStyles"
  const startIndex = contents.indexOf(startToken);
  if (startIndex === -1) {
    // console.log('File ' + fileName + ' does not contain createStyles() (1)');
    return;
  }

  // Find the end of the createStyles(...) call
  const endIndex = contents.indexOf(endToken, startIndex);
  if (endIndex === -1) {
    // console.log('File ' + fileName + ' does not contain createStyles() (2)');
    return;
  }

  // Extract the createStyles(...) call
  const nextNewLine = contents.indexOf('\n', startIndex + startToken.length);
  const createStyles = contents.substring(nextNewLine, endIndex);

  // Create a new file with the same name but .module.css
  const cssFileName = fileName.replace('.tsx', '.module.css');
  console.log('Writing ' + cssFileName);
  writeFileSync(cssFileName, convertToCssModules(createStyles), 'utf8');

  // Replace the createStyles(...) call with CSS import
  const newContents =
    contents.substring(0, startIndex) +
    `\nimport classes from './${basename(cssFileName)}';\n` +
    contents.substring(endIndex + endToken.length);
  writeFileSync(fileName, newContents, 'utf8');
}

main()
  .then(() => console.log('done'))
  .catch((err) => console.error(err));
