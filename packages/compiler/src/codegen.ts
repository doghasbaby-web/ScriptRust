/**
 * ScriptRust Code Generator - Transpiles AST to JavaScript
 */

import * as AST from './ast';

export class CodeGenerator {
  private output: string = '';
  private indentLevel: number = 0;

  generate(program: AST.Program): string {
    this.output = '';
    this.indentLevel = 0;

    for (const statement of program.body) {
      this.generateStatement(statement);
      this.output += '\n';
    }

    return this.output;
  }

  private generateStatement(node: AST.Statement): void {
    switch (node.type) {
      case 'VariableDeclaration':
        this.generateVariableDeclaration(node);
        break;
      case 'FunctionDeclaration':
        this.generateFunctionDeclaration(node);
        break;
      case 'ClassDeclaration':
        this.generateClassDeclaration(node);
        break;
      case 'InterfaceDeclaration':
        // Interfaces are TypeScript-only, emit as comment
        this.writeIndent();
        this.output += `// interface ${node.id.name} { ... }\n`;
        break;
      case 'TypeAliasDeclaration':
        // Type aliases are TypeScript-only, emit as comment
        this.writeIndent();
        this.output += `// type ${node.id.name} = ...\n`;
        break;
      case 'ExpressionStatement':
        this.writeIndent();
        this.generateExpression(node.expression);
        this.output += ';\n';
        break;
      case 'ReturnStatement':
        this.writeIndent();
        this.output += 'return';
        if (node.argument) {
          this.output += ' ';
          this.generateExpression(node.argument);
        }
        this.output += ';\n';
        break;
      case 'IfStatement':
        this.generateIfStatement(node);
        break;
      case 'WhileStatement':
        this.generateWhileStatement(node);
        break;
      case 'ForStatement':
        this.generateForStatement(node);
        break;
      case 'BlockStatement':
        this.generateBlockStatement(node);
        break;
      case 'ImportDeclaration':
        this.generateImportDeclaration(node);
        break;
      case 'ExportDeclaration':
        this.writeIndent();
        this.output += 'export ';
        this.generateStatement(node.declaration);
        break;
      case 'TryStatement':
        this.generateTryStatement(node);
        break;
      case 'ThrowStatement':
        this.writeIndent();
        this.output += 'throw ';
        this.generateExpression(node.argument);
        this.output += ';\n';
        break;
    }
  }

  private generateVariableDeclaration(node: AST.VariableDeclaration): void {
    this.writeIndent();
    this.output += node.kind + ' ';

    for (let i = 0; i < node.declarations.length; i++) {
      if (i > 0) this.output += ', ';

      const decl = node.declarations[i];

      // Add Rust-style decorations as comments
      if (decl.id.decorations && decl.id.decorations.length > 0) {
        for (const decoration of decl.id.decorations) {
          this.output += `/* xxx, ${decoration.keyword}: ${decoration.description} */ `;
        }
      }

      this.output += decl.id.name;

      if (decl.init) {
        this.output += ' = ';
        this.generateExpression(decl.init);
      }
    }

    this.output += ';\n';
  }

  private generateFunctionDeclaration(node: AST.FunctionDeclaration): void {
    this.writeIndent();

    // Add Rust-style decorations as comments
    if (node.decorations && node.decorations.length > 0) {
      for (const decoration of node.decorations) {
        this.output += `/* xxx, ${decoration.keyword}: ${decoration.description} */\n`;
        this.writeIndent();
      }
    }

    if (node.isAsync) {
      this.output += 'async ';
    }

    this.output += `function ${node.id.name}(`;

    for (let i = 0; i < node.params.length; i++) {
      if (i > 0) this.output += ', ';
      this.generateParameter(node.params[i]);
    }

    this.output += ') ';
    this.generateBlockStatement(node.body, false);
    this.output += '\n';
  }

  private generateClassDeclaration(node: AST.ClassDeclaration): void {
    this.writeIndent();

    // Add Rust-style decorations as comments
    if (node.decorations && node.decorations.length > 0) {
      for (const decoration of node.decorations) {
        this.output += `/* xxx, ${decoration.keyword}: ${decoration.description} */\n`;
        this.writeIndent();
      }
    }

    this.output += `class ${node.id.name}`;

    if (node.superClass) {
      this.output += ` extends ${node.superClass.name}`;
    }

    this.output += ' {\n';
    this.indentLevel++;

    for (const member of node.body.body) {
      if (member.type === 'MethodDefinition') {
        this.writeIndent();

        if (member.value.decorations && member.value.decorations.length > 0) {
          for (const decoration of member.value.decorations) {
            this.output += `/* xxx, ${decoration.keyword}: ${decoration.description} */\n`;
            this.writeIndent();
          }
        }

        if (member.isStatic) {
          this.output += 'static ';
        }

        if (member.value.isAsync) {
          this.output += 'async ';
        }

        this.output += `${member.key.name}(`;

        for (let i = 0; i < member.value.params.length; i++) {
          if (i > 0) this.output += ', ';
          this.generateParameter(member.value.params[i]);
        }

        this.output += ') ';
        this.generateBlockStatement(member.value.body, false);
        this.output += '\n';
      } else if (member.type === 'PropertyDefinition') {
        this.writeIndent();

        if (member.decorations && member.decorations.length > 0) {
          for (const decoration of member.decorations) {
            this.output += `/* xxx, ${decoration.keyword}: ${decoration.description} */\n`;
            this.writeIndent();
          }
        }

        if (member.isStatic) {
          this.output += 'static ';
        }

        this.output += member.key.name;

        if (member.value) {
          this.output += ' = ';
          this.generateExpression(member.value);
        }

        this.output += ';\n';
      }
    }

    this.indentLevel--;
    this.writeIndent();
    this.output += '}\n';
  }

  private generateIfStatement(node: AST.IfStatement): void {
    this.writeIndent();
    this.output += 'if (';
    this.generateExpression(node.test);
    this.output += ') ';

    if (node.consequent.type === 'BlockStatement') {
      this.generateBlockStatement(node.consequent, false);
    } else {
      this.output += '\n';
      this.indentLevel++;
      this.generateStatement(node.consequent);
      this.indentLevel--;
    }

    if (node.alternate) {
      this.output += ' else ';

      if (node.alternate.type === 'IfStatement') {
        this.generateIfStatement(node.alternate);
      } else if (node.alternate.type === 'BlockStatement') {
        this.generateBlockStatement(node.alternate, false);
      } else {
        this.output += '\n';
        this.indentLevel++;
        this.generateStatement(node.alternate);
        this.indentLevel--;
      }
    }

    this.output += '\n';
  }

  private generateWhileStatement(node: AST.WhileStatement): void {
    this.writeIndent();
    this.output += 'while (';
    this.generateExpression(node.test);
    this.output += ') ';

    if (node.body.type === 'BlockStatement') {
      this.generateBlockStatement(node.body, false);
    } else {
      this.output += '\n';
      this.indentLevel++;
      this.generateStatement(node.body);
      this.indentLevel--;
    }

    this.output += '\n';
  }

  private generateForStatement(node: AST.ForStatement): void {
    this.writeIndent();
    this.output += 'for (';

    if (node.init) {
      if (node.init.type === 'VariableDeclaration') {
        this.output += node.init.kind + ' ';
        const decl = node.init.declarations[0];
        this.output += decl.id.name;
        if (decl.init) {
          this.output += ' = ';
          this.generateExpression(decl.init);
        }
      } else {
        this.generateExpression(node.init);
      }
    }

    this.output += '; ';

    if (node.test) {
      this.generateExpression(node.test);
    }

    this.output += '; ';

    if (node.update) {
      this.generateExpression(node.update);
    }

    this.output += ') ';

    if (node.body.type === 'BlockStatement') {
      this.generateBlockStatement(node.body, false);
    } else {
      this.output += '\n';
      this.indentLevel++;
      this.generateStatement(node.body);
      this.indentLevel--;
    }

    this.output += '\n';
  }

  private generateBlockStatement(node: AST.BlockStatement, writeIndent = true): void {
    if (writeIndent) {
      this.writeIndent();
    }

    this.output += '{\n';
    this.indentLevel++;

    for (const statement of node.body) {
      this.generateStatement(statement);
    }

    this.indentLevel--;
    this.writeIndent();
    this.output += '}';
  }

  private generateImportDeclaration(node: AST.ImportDeclaration): void {
    this.writeIndent();
    this.output += 'import ';

    if (node.specifiers.length === 1 && node.specifiers[0].imported.name === 'default') {
      this.output += node.specifiers[0].local?.name || 'default';
    } else {
      this.output += '{ ';
      for (let i = 0; i < node.specifiers.length; i++) {
        if (i > 0) this.output += ', ';
        this.output += node.specifiers[i].imported.name;
        if (node.specifiers[i].local) {
          this.output += ' as ' + node.specifiers[i].local!.name;
        }
      }
      this.output += ' }';
    }

    this.output += ` from '${node.source.value}';\n`;
  }

  private generateTryStatement(node: AST.TryStatement): void {
    this.writeIndent();
    this.output += 'try ';
    this.generateBlockStatement(node.block, false);

    if (node.handler) {
      this.output += ' catch';
      if (node.handler.param) {
        this.output += ` (${node.handler.param.name})`;
      }
      this.output += ' ';
      this.generateBlockStatement(node.handler.body, false);
    }

    if (node.finalizer) {
      this.output += ' finally ';
      this.generateBlockStatement(node.finalizer, false);
    }

    this.output += '\n';
  }

  private generateParameter(param: AST.Parameter): void {
    if (param.id.decorations && param.id.decorations.length > 0) {
      for (const decoration of param.id.decorations) {
        this.output += `/* xxx, ${decoration.keyword}: ${decoration.description} */ `;
      }
    }

    this.output += param.id.name;

    if (param.defaultValue) {
      this.output += ' = ';
      this.generateExpression(param.defaultValue);
    }
  }

  private generateExpression(node: AST.Expression): void {
    switch (node.type) {
      case 'Identifier':
        this.output += node.name;
        break;
      case 'StringLiteral':
        this.output += `'${node.value.replace(/'/g, "\\'")}'`;
        break;
      case 'NumberLiteral':
        this.output += node.value.toString();
        break;
      case 'BooleanLiteral':
        this.output += node.value.toString();
        break;
      case 'NullLiteral':
        this.output += 'null';
        break;
      case 'BinaryExpression':
        this.generateExpression(node.left);
        this.output += ` ${node.operator} `;
        this.generateExpression(node.right);
        break;
      case 'UnaryExpression':
        if (node.prefix) {
          this.output += node.operator;
          this.generateExpression(node.argument);
        } else {
          this.generateExpression(node.argument);
          this.output += node.operator;
        }
        break;
      case 'AssignmentExpression':
        this.generateExpression(node.left);
        this.output += ` ${node.operator} `;
        this.generateExpression(node.right);
        break;
      case 'CallExpression':
        this.generateExpression(node.callee);
        this.output += '(';
        for (let i = 0; i < node.arguments.length; i++) {
          if (i > 0) this.output += ', ';
          this.generateExpression(node.arguments[i]);
        }
        this.output += ')';
        break;
      case 'MemberExpression':
        this.generateExpression(node.object);
        if (node.computed) {
          this.output += '[';
          this.generateExpression(node.property);
          this.output += ']';
        } else {
          this.output += '.';
          this.generateExpression(node.property);
        }
        break;
      case 'ArrayExpression':
        this.output += '[';
        for (let i = 0; i < node.elements.length; i++) {
          if (i > 0) this.output += ', ';
          this.generateExpression(node.elements[i]);
        }
        this.output += ']';
        break;
      case 'ObjectExpression':
        this.output += '{ ';
        for (let i = 0; i < node.properties.length; i++) {
          if (i > 0) this.output += ', ';
          const prop = node.properties[i];
          if (prop.shorthand) {
            this.generateExpression(prop.key);
          } else {
            this.generateExpression(prop.key);
            this.output += ': ';
            this.generateExpression(prop.value);
          }
        }
        this.output += ' }';
        break;
      case 'FunctionExpression':
        if (node.isAsync) {
          this.output += 'async ';
        }
        this.output += 'function';
        if (node.id) {
          this.output += ' ' + node.id.name;
        }
        this.output += '(';
        for (let i = 0; i < node.params.length; i++) {
          if (i > 0) this.output += ', ';
          this.generateParameter(node.params[i]);
        }
        this.output += ') ';
        this.generateBlockStatement(node.body, false);
        break;
      case 'ArrowFunctionExpression':
        if (node.isAsync) {
          this.output += 'async ';
        }
        this.output += '(';
        for (let i = 0; i < node.params.length; i++) {
          if (i > 0) this.output += ', ';
          this.generateParameter(node.params[i]);
        }
        this.output += ') => ';
        if (node.body.type === 'BlockStatement') {
          this.generateBlockStatement(node.body, false);
        } else {
          this.generateExpression(node.body);
        }
        break;
      case 'ConditionalExpression':
        this.generateExpression(node.test);
        this.output += ' ? ';
        this.generateExpression(node.consequent);
        this.output += ' : ';
        this.generateExpression(node.alternate);
        break;
      case 'NewExpression':
        this.output += 'new ';
        this.generateExpression(node.callee);
        this.output += '(';
        for (let i = 0; i < node.arguments.length; i++) {
          if (i > 0) this.output += ', ';
          this.generateExpression(node.arguments[i]);
        }
        this.output += ')';
        break;
      case 'ThisExpression':
        this.output += 'this';
        break;
      case 'AwaitExpression':
        this.output += 'await ';
        this.generateExpression(node.argument);
        break;
    }
  }

  private writeIndent(): void {
    this.output += '  '.repeat(this.indentLevel);
  }
}
