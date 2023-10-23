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
              cssContent += `.${styleName} {\n` + styleProps.join('\n') + '\n}\n';
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
  if (input.startsWith('theme.')) {
    let result = input
      .replace('theme.', '')
      .replace(/\./g, '-')
      .replace(/\[/g, '-')
      .replace(/\]/g, '');
    return `var(--mantine-${result})`;
  }

  return input;
}

const jsCode = `import { createStyles } from '@mantine/core';
const useStyles = createStyles((theme) => ({
  root: {
    backgroundColor: theme.colors.red[5],
  },
}));`;

console.log(convertToCssModules(jsCode));
