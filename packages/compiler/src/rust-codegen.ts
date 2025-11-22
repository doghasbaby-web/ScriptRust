/**
 * ScriptRust Rust Code Generator - Transpiles AST to Rust
 * Converts TypeScript with decorations to Rust code
 */

import * as AST from './ast.js';

export class RustCodeGenerator {
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
        this.generateInterfaceDeclaration(node);
        break;
      case 'TypeAliasDeclaration':
        this.generateTypeAliasDeclaration(node);
        break;
      case 'ExpressionStatement':
        this.writeIndent();
        this.generateExpression(node.expression);
        this.output += ';\n';
        break;
      case 'ReturnStatement':
        this.writeIndent();
        if (node.argument) {
          this.generateExpression(node.argument);
        } else {
          this.output += 'return';
        }
        this.output += '\n';
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
        this.output += 'pub ';
        this.generateStatement(node.declaration);
        break;
      case 'TryStatement':
        this.generateTryStatement(node);
        break;
      case 'ThrowStatement':
        this.writeIndent();
        this.output += 'panic!(';
        this.generateExpression(node.argument);
        this.output += ');\n';
        break;
    }
  }

  private generateVariableDeclaration(node: AST.VariableDeclaration): void {
    for (const decl of node.declarations) {
      this.writeIndent();

      // Check for decoration hints
      const isMutable = this.hasDecoration(decl.id, 'mut');
      const isImmutable = this.hasDecoration(decl.id, 'immutable');

      // In Rust, variables are immutable by default
      this.output += 'let ';

      // Only add mut if explicitly marked as mutable
      if (isMutable && !isImmutable) {
        this.output += 'mut ';
      }

      this.output += decl.id.name;

      // Type annotation
      if (decl.typeAnnotation) {
        this.output += ': ';
        this.generateRustType(decl.typeAnnotation);
      }

      // Initialization
      if (decl.init) {
        this.output += ' = ';
        this.generateExpression(decl.init);
      }

      this.output += ';\n';
    }
  }

  private generateFunctionDeclaration(node: AST.FunctionDeclaration): void {
    this.writeIndent();

    // Add async if needed
    if (node.isAsync) {
      this.output += 'async ';
    }

    this.output += 'fn ';
    this.output += node.id.name;
    this.output += '(';

    // Parameters
    for (let i = 0; i < node.params.length; i++) {
      if (i > 0) this.output += ', ';
      this.generateParameter(node.params[i]);
    }

    this.output += ')';

    // Return type
    if (node.returnType) {
      this.output += ' -> ';
      this.generateRustType(node.returnType);
    }

    this.output += ' ';
    this.generateBlockStatement(node.body, false);
    this.output += '\n';
  }

  private generateParameter(node: AST.Parameter): void {
    const isImmutable = this.hasDecoration(node.id, 'immutable');

    // In Rust, parameters are immutable by default
    // We can add mut if needed
    if (!isImmutable && this.hasDecoration(node.id, 'mut')) {
      this.output += 'mut ';
    }

    this.output += node.id.name;

    if (node.typeAnnotation) {
      this.output += ': ';
      this.generateRustType(node.typeAnnotation);
    }
  }

  private generateClassDeclaration(node: AST.ClassDeclaration): void {
    // Generate struct
    this.writeIndent();
    this.output += 'struct ';
    this.output += node.id.name;
    this.output += ' {\n';

    this.indentLevel++;

    // Generate fields
    for (const member of node.body.body) {
      if (member.type === 'PropertyDefinition') {
        this.writeIndent();

        // Check if field is public (default to pub for simplicity)
        this.output += 'pub ';

        this.output += member.key.name;

        if (member.typeAnnotation) {
          this.output += ': ';
          this.generateRustType(member.typeAnnotation);
        }

        this.output += ',\n';
      }
    }

    this.indentLevel--;
    this.writeIndent();
    this.output += '}\n\n';

    // Generate impl block for methods
    const methods = node.body.body.filter(m => m.type === 'MethodDefinition');
    if (methods.length > 0) {
      this.writeIndent();
      this.output += 'impl ';
      this.output += node.id.name;
      this.output += ' {\n';

      this.indentLevel++;

      for (const method of methods as AST.MethodDefinition[]) {
        this.generateMethodDefinition(method);
      }

      this.indentLevel--;
      this.writeIndent();
      this.output += '}\n';
    }
  }

  private generateMethodDefinition(node: AST.MethodDefinition): void {
    this.writeIndent();

    if (node.kind === 'constructor') {
      this.output += 'pub fn new(';
    } else {
      this.output += 'pub fn ';
      this.output += node.key.name;
      this.output += '(';
    }

    // Add &self or &mut self for non-constructor methods
    if (node.kind !== 'constructor') {
      const isPure = this.hasDecoration(node.value, 'pure');
      const isBorrowed = this.hasDecoration(node.value, 'ownership') &&
                         node.value.decorations?.some(d => d.description.includes('borrowed'));

      if (isPure || isBorrowed) {
        this.output += '&self';
      } else {
        this.output += '&mut self';
      }

      if (node.value.params.length > 0) {
        this.output += ', ';
      }
    }

    // Parameters
    for (let i = 0; i < node.value.params.length; i++) {
      if (i > 0) this.output += ', ';
      this.generateParameter(node.value.params[i]);
    }

    this.output += ')';

    // Return type
    if (node.value.returnType) {
      this.output += ' -> ';
      this.generateRustType(node.value.returnType);
    } else if (node.kind === 'constructor') {
      this.output += ' -> Self';
    }

    this.output += ' ';
    this.generateBlockStatement(node.value.body, false);
    this.output += '\n';
  }

  private generateInterfaceDeclaration(node: AST.InterfaceDeclaration): void {
    this.writeIndent();
    this.output += 'pub trait ';
    this.output += node.id.name;
    this.output += ' {\n';

    this.indentLevel++;

    // Generate trait methods (simplified)
    for (const member of node.body.body) {
      if (member.type === 'PropertySignature') {
        this.writeIndent();
        this.output += 'fn get_';
        this.output += member.key.name;
        this.output += '(&self)';
        if (member.typeAnnotation) {
          this.output += ' -> ';
          this.generateRustType(member.typeAnnotation);
        }
        this.output += ';\n';
      }
    }

    this.indentLevel--;
    this.writeIndent();
    this.output += '}\n';
  }

  private generateTypeAliasDeclaration(node: AST.TypeAliasDeclaration): void {
    this.writeIndent();
    this.output += 'type ';
    this.output += node.id.name;
    this.output += ' = ';
    this.generateRustType(node.typeAnnotation);
    this.output += ';\n';
  }

  private generateIfStatement(node: AST.IfStatement): void {
    this.writeIndent();
    this.output += 'if ';
    this.generateExpression(node.test);
    this.output += ' ';

    if (node.consequent.type === 'BlockStatement') {
      this.generateBlockStatement(node.consequent, false);
    } else {
      this.output += '{\n';
      this.indentLevel++;
      this.generateStatement(node.consequent);
      this.indentLevel--;
      this.writeIndent();
      this.output += '}';
    }

    if (node.alternate) {
      this.output += ' else ';
      if (node.alternate.type === 'IfStatement') {
        this.generateIfStatement(node.alternate);
      } else if (node.alternate.type === 'BlockStatement') {
        this.generateBlockStatement(node.alternate, false);
      } else {
        this.output += '{\n';
        this.indentLevel++;
        this.generateStatement(node.alternate);
        this.indentLevel--;
        this.writeIndent();
        this.output += '}';
      }
    }
    this.output += '\n';
  }

  private generateWhileStatement(node: AST.WhileStatement): void {
    this.writeIndent();
    this.output += 'while ';
    this.generateExpression(node.test);
    this.output += ' ';

    if (node.body.type === 'BlockStatement') {
      this.generateBlockStatement(node.body, false);
    } else {
      this.output += '{\n';
      this.indentLevel++;
      this.generateStatement(node.body);
      this.indentLevel--;
      this.writeIndent();
      this.output += '}';
    }
    this.output += '\n';
  }

  private generateForStatement(node: AST.ForStatement): void {
    // Convert simple for loops to Rust's for..in range syntax
    this.writeIndent();
    this.output += '// for loop - requires manual conversion\n';
    this.writeIndent();
    this.output += 'loop ';

    if (node.body.type === 'BlockStatement') {
      this.generateBlockStatement(node.body, false);
    } else {
      this.output += '{\n';
      this.indentLevel++;
      this.generateStatement(node.body);
      this.indentLevel--;
      this.writeIndent();
      this.output += '}';
    }
    this.output += '\n';
  }

  private generateBlockStatement(node: AST.BlockStatement, addIndent: boolean = true): void {
    this.output += '{\n';
    this.indentLevel++;

    for (const statement of node.body) {
      this.generateStatement(statement);
    }

    this.indentLevel--;
    if (addIndent) this.writeIndent();
    this.output += '}';
  }

  private generateImportDeclaration(node: AST.ImportDeclaration): void {
    this.writeIndent();
    this.output += 'use ';

    // Simple conversion - assumes module path
    const modulePath = node.source.value.replace(/['"]/g, '');
    this.output += modulePath.replace(/\//g, '::');

    if (node.specifiers && node.specifiers.length > 0) {
      this.output += '::{';
      for (let i = 0; i < node.specifiers.length; i++) {
        if (i > 0) this.output += ', ';
        const spec = node.specifiers[i];
        if (spec.type === 'ImportSpecifier') {
          this.output += spec.imported.name;
        }
      }
      this.output += '}';
    }

    this.output += ';\n';
  }

  private generateTryStatement(node: AST.TryStatement): void {
    this.writeIndent();
    this.output += '// try-catch - use Result<T, E> pattern in Rust\n';
    this.generateBlockStatement(node.block);
    this.output += '\n';
  }

  private generateExpression(node: AST.Expression): void {
    switch (node.type) {
      case 'Identifier':
        this.output += node.name;
        break;
      case 'StringLiteral':
      case 'NumberLiteral':
      case 'BooleanLiteral':
      case 'NullLiteral':
        this.generateLiteral(node);
        break;
      case 'BinaryExpression':
        this.generateBinaryExpression(node);
        break;
      case 'UnaryExpression':
        this.generateUnaryExpression(node);
        break;
      case 'AssignmentExpression':
        this.generateAssignmentExpression(node);
        break;
      case 'CallExpression':
        this.generateCallExpression(node);
        break;
      case 'MemberExpression':
        this.generateMemberExpression(node);
        break;
      case 'NewExpression':
        this.generateNewExpression(node);
        break;
      case 'ArrayExpression':
        this.generateArrayExpression(node);
        break;
      case 'ObjectExpression':
        this.generateObjectExpression(node);
        break;
      case 'ArrowFunctionExpression':
        this.generateArrowFunctionExpression(node);
        break;
      case 'ConditionalExpression':
        this.generateConditionalExpression(node);
        break;
      case 'AwaitExpression':
        this.generateExpression(node.argument);
        this.output += '.await';
        break;
      case 'FunctionExpression':
        this.output += '/* ' + node.type + ' */';
        break;
      case 'ThisExpression':
        this.output += 'self';
        break;
    }
  }

  private generateLiteral(node: AST.Literal): void {
    if (node.type === 'StringLiteral') {
      this.output += '"' + node.value + '"';
    } else if (node.type === 'NumberLiteral') {
      this.output += String(node.value);
    } else if (node.type === 'BooleanLiteral') {
      this.output += String(node.value);
    } else if (node.type === 'NullLiteral') {
      this.output += 'None';
    }
  }

  private generateBinaryExpression(node: AST.BinaryExpression): void {
    this.generateExpression(node.left);

    // Convert JavaScript operators to Rust equivalents
    let operator = node.operator;
    if (operator === '===') operator = '==';
    if (operator === '!==') operator = '!=';

    this.output += ' ' + operator + ' ';
    this.generateExpression(node.right);
  }

  private generateUnaryExpression(node: AST.UnaryExpression): void {
    this.output += node.operator;
    this.generateExpression(node.argument);
  }

  private generateAssignmentExpression(node: AST.AssignmentExpression): void {
    this.generateExpression(node.left);
    this.output += ' ' + node.operator + ' ';
    this.generateExpression(node.right);
  }

  private generateCallExpression(node: AST.CallExpression): void {
    // Handle console.log specially
    if (node.callee.type === 'MemberExpression' &&
        node.callee.object.type === 'Identifier' &&
        node.callee.object.name === 'console' &&
        node.callee.property.type === 'Identifier' &&
        node.callee.property.name === 'log') {
      this.output += 'println!(';

      // Generate format string if there are multiple arguments
      if (node.arguments.length > 1) {
        this.output += '"';
        for (let i = 0; i < node.arguments.length; i++) {
          if (i > 0) this.output += ' ';
          this.output += '{:?}';
        }
        this.output += '", ';
        for (let i = 0; i < node.arguments.length; i++) {
          if (i > 0) this.output += ', ';
          this.generateExpression(node.arguments[i]);
        }
      } else if (node.arguments.length === 1) {
        this.output += '"{:?}", ';
        this.generateExpression(node.arguments[0]);
      }

      this.output += ')';
    } else {
      this.generateExpression(node.callee);
      this.output += '(';
      for (let i = 0; i < node.arguments.length; i++) {
        if (i > 0) this.output += ', ';
        this.generateExpression(node.arguments[i]);
      }
      this.output += ')';
    }
  }

  private generateMemberExpression(node: AST.MemberExpression): void {
    this.generateExpression(node.object);
    if (node.computed) {
      this.output += '[';
      this.generateExpression(node.property);
      this.output += ']';
    } else {
      this.output += '.';
      if (node.property.type === 'Identifier') {
        this.output += node.property.name;
      } else {
        this.generateExpression(node.property);
      }
    }
  }

  private generateNewExpression(node: AST.NewExpression): void {
    // In Rust, we use StructName::new() pattern
    if (node.callee.type === 'Identifier') {
      this.output += node.callee.name;
      this.output += '::new(';
      for (let i = 0; i < node.arguments.length; i++) {
        if (i > 0) this.output += ', ';
        this.generateExpression(node.arguments[i]);
      }
      this.output += ')';
    } else {
      this.generateExpression(node.callee);
      this.output += '::new(';
      for (let i = 0; i < node.arguments.length; i++) {
        if (i > 0) this.output += ', ';
        this.generateExpression(node.arguments[i]);
      }
      this.output += ')';
    }
  }

  private generateArrayExpression(node: AST.ArrayExpression): void {
    this.output += 'vec![';
    for (let i = 0; i < node.elements.length; i++) {
      if (i > 0) this.output += ', ';
      this.generateExpression(node.elements[i]);
    }
    this.output += ']';
  }

  private generateObjectExpression(node: AST.ObjectExpression): void {
    // Rust doesn't have object literals, need to use struct initialization
    this.output += '/* object literal - use struct */ {';
    for (let i = 0; i < node.properties.length; i++) {
      if (i > 0) this.output += ', ';
      const prop = node.properties[i];
      if (prop.type === 'Property') {
        if (prop.key.type === 'Identifier') {
          this.output += prop.key.name;
        }
        this.output += ': ';
        this.generateExpression(prop.value);
      }
    }
    this.output += '}';
  }

  private generateArrowFunctionExpression(node: AST.ArrowFunctionExpression): void {
    this.output += '|';
    for (let i = 0; i < node.params.length; i++) {
      if (i > 0) this.output += ', ';
      this.generateParameter(node.params[i]);
    }
    this.output += '| ';

    if (node.body.type === 'BlockStatement') {
      this.generateBlockStatement(node.body, false);
    } else {
      this.generateExpression(node.body);
    }
  }

  private generateConditionalExpression(node: AST.ConditionalExpression): void {
    this.output += 'if ';
    this.generateExpression(node.test);
    this.output += ' { ';
    this.generateExpression(node.consequent);
    this.output += ' } else { ';
    this.generateExpression(node.alternate);
    this.output += ' }';
  }

  private generateRustType(typeAnnotation: AST.TypeAnnotation): void {
    const tsType = typeAnnotation.typeAnnotation;
    this.generateTSType(tsType);
  }

  private generateTSType(tsType: AST.TSType): void {
    switch (tsType.type) {
      case 'TSStringKeyword':
        this.output += '&str';
        break;
      case 'TSNumberKeyword':
        this.output += 'f64';
        break;
      case 'TSBooleanKeyword':
        this.output += 'bool';
        break;
      case 'TSVoidKeyword':
        this.output += '()';
        break;
      case 'TSAnyKeyword':
        this.output += '/* any */ ()';
        break;
      case 'TSArrayType':
        this.output += 'Vec<';
        this.generateTSType(tsType.elementType);
        this.output += '>';
        break;
      case 'TSTypeReference':
        // Map TypeScript type references to Rust types
        const typeName = tsType.typeName.name;
        switch (typeName) {
          case 'string':
            this.output += '&str';
            break;
          case 'number':
            this.output += 'f64';
            break;
          case 'boolean':
            this.output += 'bool';
            break;
          case 'void':
            this.output += '()';
            break;
          case 'Promise':
            // Handle Promise specially
            this.output += 'Future';
            break;
          default:
            this.output += typeName;
        }
        break;
      case 'TSUnionType':
        this.output += '/* union */ ';
        this.generateTSType(tsType.types[0]);
        break;
      case 'TSIntersectionType':
        this.output += '/* intersection */ ';
        this.generateTSType(tsType.types[0]);
        break;
      case 'TSFunctionType':
        this.output += 'fn(';
        for (let i = 0; i < tsType.parameters.length; i++) {
          if (i > 0) this.output += ', ';
          this.generateParameter(tsType.parameters[i]);
        }
        this.output += ') -> ';
        this.generateTSType(tsType.returnType);
        break;
      default:
        this.output += '/* unknown type */';
    }
  }

  private hasDecoration(node: AST.BaseNode, keyword: string): boolean {
    return node.decorations?.some(d => d.keyword === keyword) || false;
  }

  private writeIndent(): void {
    this.output += '    '.repeat(this.indentLevel);
  }
}
