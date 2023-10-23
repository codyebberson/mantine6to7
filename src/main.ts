import fastGlob from 'fast-glob';
import { resolve } from 'path';
import ts from 'typescript';
import { convert } from './convert';

const inputDir = '../medplum/packages/react';

async function main(): Promise<void> {
  const files = (await fastGlob([inputDir + '/src/**/*', inputDir + '/public/**/*'])).map((f) => resolve(f));
  const rootNames = files.filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));
  await convert(ts.createProgram(rootNames, {}), files);
}

main()
  .then(() => console.log('done'))
  .catch((err) => console.error(err));
