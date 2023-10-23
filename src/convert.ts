import fs from 'fs';
import prettier from 'prettier';
import ts from 'typescript';
import { convertToCssModules } from './css';
import { addImport, isJsxAttribute, renameJsxAttribute, tryGetFullText } from './utils';

export async function convert(program: ts.Program, files: string[]): Promise<void> {
  for (const file of files) {
    if (file.endsWith('tsconfig.json')) {
      continue;
    }

    if (!file.includes('Header.tsx')) {
      continue;
    }

    const source = program.getSourceFile(file) as ts.SourceFile;
    const result = ts.transform(source, [transformer(file, program)]);
    const printer = ts.createPrinter();

    for (const output of result.transformed) {
      const transformerOutput = printer.printFile(output);
      const prettierOutput = await prettier.format(transformerOutput, { filepath: file });
      fs.writeFileSync(file, prettierOutput, 'utf8');
    }
  }
}

function transformer(fileName: string, program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
  if (!program) {
    throw new Error('Missing program');
  }

  const checker = program.getTypeChecker();
  if (!checker) {
    throw new Error('Missing checker');
  }

  let foundCreateStyles = false;

  return (context: ts.TransformationContext) => {
    const visitor: ts.Visitor = (node) => {
      node = ts.visitEachChild(node, visitor, context);

      // Remove "createStyles" from imports
      if (ts.isImportSpecifier(node) && node.getText() === 'createStyles') {
        return undefined;
      }

      // Remove declaration "const useStyles = createStyles(...)"
      if (
        ts.isVariableStatement(node) &&
        node.declarationList.declarations[0].name.getText() === 'useStyles'
      ) {
        foundCreateStyles = true;
        const cssFileName = fileName.replace('.tsx', '.module.css');
        fs.writeFileSync(cssFileName, convertToCssModules(tryGetFullText(node)), 'utf8');
        return undefined;
      }

      // Remove declaration "const { classes } = useStyles()"
      if (
        ts.isVariableStatement(node) &&
        node.declarationList.declarations[0].name.getText().includes('classes')
      ) {
        return undefined;
      }

      // Rename Group "position" to "justify"
      if (isJsxAttribute(node, 'Group', 'position')) {
        return renameJsxAttribute(node, 'justify');
      }

      // Rename Group "spacing" to "gap"
      if (isJsxAttribute(node, 'Group', 'spacing')) {
        return renameJsxAttribute(node, 'gap');
      }

      // Rename Menu "justify" to "position"
      if (isJsxAttribute(node, 'Menu', 'justify')) {
        return renameJsxAttribute(node, 'position');
      }

      // Rename Menu.Item "icon" to "leftSection"
      if (isJsxAttribute(node, 'Menu.Item', 'icon')) {
        return renameJsxAttribute(node, 'leftSection');
      }

      // Rename Text "align" to "ta"
      if (isJsxAttribute(node, 'Text', 'align')) {
        return renameJsxAttribute(node, 'ta');
      }

      // Rename Text "weight" to "fw"
      if (isJsxAttribute(node, 'Text', 'weight')) {
        return renameJsxAttribute(node, 'fw');
      }

      return node;
    };

    // Return transformer factory
    return (sourceFile: ts.SourceFile) => {
      // Visit all nodes
      let outputSourceFile = ts.visitNode(sourceFile, visitor) as ts.SourceFile;

      if (foundCreateStyles) {
        // Add .module.css import
        const cssFileName = fileName.replace('.tsx', '.module.css');
        console.log('CODY cssFileName', cssFileName);
        outputSourceFile = addImport(outputSourceFile, 'classes', undefined, cssFileName);
      }

      return outputSourceFile;
    };
  };
}
