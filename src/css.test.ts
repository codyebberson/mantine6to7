import assert from 'node:assert';
import { test } from 'node:test';
import { convertToCssModules } from './css';

// test('Simple', () => {
//   const input = `import { createStyles } from '@mantine/core';
// const useStyles = createStyles((theme) => ({
//   root: {
//     backgroundColor: theme.colors.red[5],
//   },
// }));
// `;

//   const expected = `.root {
//   background-color: var(--mantine-color-red-5);
// }
// `;

//   assert.strictEqual(convertToCssModules(input), expected);
// });

test('Color scheme.', () => {
  const input = `import { createStyles } from '@mantine/core';
const useStyles = createStyles((theme) => ({
  root: {
    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
    color: theme.colorScheme === 'dark' ? theme.white : theme.black,
  },
}));
`;

  const expected = `.root {
  background-color: light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6));
  color: light-dark(var(--mantine-color-black), var(--mantine-color-white));
}
`;

  assert.strictEqual(convertToCssModules(input), expected);
});
