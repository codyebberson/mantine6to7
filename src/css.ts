export function convertToCssModules(jsCode: string): string {
  const lines = jsCode.split('\n');
  const result: string[] = [];
  for (let line of lines) {
    // if (line.includes(': {')) {
    //   // Remove the colon ":"
    //   line = line.replace(':', '');
    // }

    // if (line.includes('},')) {
    //   // Remove the comma ","
    //   // result.push(line.replace(',', ''));
    //   line = line.replace(',', '');
    // }

    if (line.startsWith('  ')) {
      // Remove the leading spaces
      line = line.slice(2);
    }

    const indent = line.indexOf(line.trim());

    line = line.replaceAll(': {', ' {');
    line = line.replaceAll('},', '}');

    // If line starts with a letter, add a period to make it a class name
    if (/^[a-zA-Z]/.test(line)) {
      line = '.' + line;
    }

    if (line.includes('{')) {
      // Remove quotes around selectors (i.e., "'&:hover'")
      line = line.replaceAll("'", '');
    }

    if (line.endsWith(',')) {
      line = line.slice(0, -1) + ';';
    }

    if (line.includes(':') && line.endsWith(';')) {
      line = line.slice(0, -1);
      const colonIndex = line.indexOf(':');
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      // const [key, value] = line.split(':');
      const newKey = camelToDash(key.trim());
      const newValue = convertCssValue(value.trim());
      line = `${' '.repeat(indent)}${newKey}: ${newValue};`;
    }

    result.push(line);
  }
  // return convertCssValue(jsCode);
  return result.join('\n');
}

function camelToDash(str: string): string {
  return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
}

function convertCssValue(input: string): string {
  // +   "  background-color: var(--mantine-colorScheme === 'dark' ? theme-color-dark-6 : theme-colors-gray-0);n" +
  // +   "  color: var(--mantine-colorScheme === 'dark' ? theme-white : theme-black);n" +
  // -   '  background-color: light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6));n' +
  // -   '  color: light-dark(var(--mantine-color-black), var(--mantine-color-white));n' +

  if (input.startsWith("'") && input.endsWith("'")) {
    input = input.slice(1, -1);
  }

  if (input.startsWith('`') && input.endsWith('`')) {
    input = input.slice(1, -1);
  }

  if (input.includes('${')) {
    input = input.replaceAll('${', '');
    input = input.replaceAll('}', '');
  }

  // Use regex to search for pattern:
  // --mantine-colorScheme === 'dark' ? (.+) : (.+)
  // and replace with:
  // light-dark($1, $2)
  input = input.replaceAll(/theme.colorScheme === 'dark' \? (.+) : (.+)/g, 'light-dark($2, $1)');

  // theme.colors.red[5] -> var(--mantine-color-red-5)
  input = input.replaceAll(/theme\.colors\.(\w+)\[(\d+)\]/g, 'var(--mantine-color-$1-$2)');

  // theme.white
  // var(--mantine-color-white)
  input = input.replaceAll('theme.white', 'var(--mantine-color-white)');

  // theme.black
  // var(--mantine-color-black)
  input = input.replaceAll('theme.black', 'var(--mantine-color-black)');

  // theme.fontSizes.{xs,sm,md,lg,xl}
  // var(--mantine-font-size-{xs,sm,md,lg,xl})
  input = input.replaceAll(/theme\.fontSizes\.(\w+)/g, 'var(--mantine-font-size-$1)');

  // theme.spacing.{xs,sm,md,lg,xl}
  // var(--mantine-spacing-{xs,sm,md,lg,xl})
  input = input.replaceAll(/theme\.spacing\.(\w+)/g, 'var(--mantine-spacing-$1)');

  // theme.lineHeights.{xs,sm,md,lg,xl}
  // var(--mantine-line-height-{xs,sm,md,lg,xl})
  input = input.replaceAll(/theme\.lineHeights\.(\w+)/g, 'var(--mantine-line-height-$1)');

  // theme.radius.{xs,sm,md,lg,xl}
  // var(--mantine-radius-{xs,sm,md,lg,xl})
  input = input.replaceAll(/theme\.radius\.(\w+)/g, 'var(--mantine-radius-$1)');

  // If the value is just an integer, add "px"
  if (/^\d+$/.test(input)) {
    input += 'px';
  }

  return input;
}
