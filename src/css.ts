import ts from 'typescript';

export function convertToCssModules(jsCode: string): string {
  console.log('CODY jsCode', jsCode);

  const sourceFile = ts.createSourceFile(
    'temp.ts',
    jsCode,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  let cssContent = '';

  function visit(node: ts.Node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'createStyles'
    ) {
      const stylesObj = node.arguments[0] as ts.ArrowFunction;
      let objectExpr: ts.ObjectLiteralExpression | undefined;

      if (stylesObj && ts.isParenthesizedExpression(stylesObj.body)) {
        objectExpr = stylesObj.body.expression as ts.ObjectLiteralExpression;
      }

      if (stylesObj && stylesObj.body && ts.isBlock(stylesObj.body)) {
        const returnStmt = stylesObj.body.statements.find(ts.isReturnStatement);
        if (returnStmt?.expression) {
          objectExpr = returnStmt.expression as ts.ObjectLiteralExpression;
        }
      }

      if (objectExpr) {
        objectExpr.properties.forEach((prop) => {
          if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
            const styleName = prop.name.text;
            if (ts.isObjectLiteralExpression(prop.initializer)) {
              const styleProps = prop.initializer.properties.map((p) => {
                const assignment = p as ts.PropertyAssignment;
                return (
                  camelToDash(assignment.name.getText()) +
                  ': ' +
                  convertCssValue(assignment.initializer.getText()) +
                  ';'
                );
              });
              cssContent +=
                `.${styleName} {\n` + styleProps.map((s) => '  ' + s).join('\n') + '\n}\n';
            }
          }
        });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return cssContent;
}

function camelToDash(str: string): string {
  return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
}

function convertCssValue(input: string): string {
  // +   "  background-color: var(--mantine-colorScheme === 'dark' ? theme-color-dark-6 : theme-colors-gray-0);n" +
  // +   "  color: var(--mantine-colorScheme === 'dark' ? theme-white : theme-black);n" +
  // -   '  background-color: light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6));n' +
  // -   '  color: light-dark(var(--mantine-color-black), var(--mantine-color-white));n' +

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

  return input;
}
