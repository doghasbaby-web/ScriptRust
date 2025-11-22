/**
 * ScriptRust Parser - Builds AST from tokens
 */

import { Token, TokenType, Decoration } from './lexer';
import * as AST from './ast';

export class Parser {
  private tokens: Token[];
  private current: number = 0;
  private pendingDecorations: Decoration[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): AST.Program {
    const body: AST.Statement[] = [];

    while (!this.isAtEnd()) {
      const stmt = this.statement();
      if (stmt) {
        body.push(stmt);
      }
    }

    return {
      type: 'Program',
      body,
    };
  }

  private statement(): AST.Statement | null {
    // Collect decorations
    while (this.match(TokenType.DECORATION)) {
      const decoration = JSON.parse(this.previous().value) as Decoration;
      this.pendingDecorations.push(decoration);
    }

    if (this.match(TokenType.IMPORT)) return this.importDeclaration();
    if (this.match(TokenType.EXPORT)) return this.exportDeclaration();
    if (this.match(TokenType.FUNCTION)) return this.functionDeclaration();
    if (this.match(TokenType.CLASS)) return this.classDeclaration();
    if (this.match(TokenType.INTERFACE)) return this.interfaceDeclaration();
    if (this.match(TokenType.TYPE)) return this.typeAliasDeclaration();
    if (this.match(TokenType.LET, TokenType.CONST, TokenType.VAR)) return this.variableDeclaration();
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.WHILE)) return this.whileStatement();
    if (this.match(TokenType.FOR)) return this.forStatement();
    if (this.match(TokenType.RETURN)) return this.returnStatement();
    if (this.match(TokenType.LBRACE)) return this.blockStatement();
    if (this.match(TokenType.TRY)) return this.tryStatement();
    if (this.match(TokenType.THROW)) return this.throwStatement();

    return this.expressionStatement();
  }

  private importDeclaration(): AST.ImportDeclaration {
    const specifiers: AST.ImportSpecifier[] = [];

    if (this.match(TokenType.LBRACE)) {
      do {
        const imported = this.consume(TokenType.IDENTIFIER, 'Expected identifier');
        let local = imported;

        if (this.match(TokenType.AS)) {
          local = this.consume(TokenType.IDENTIFIER, 'Expected identifier after as');
        }

        specifiers.push({
          type: 'ImportSpecifier',
          imported: { type: 'Identifier', name: imported.value },
          local: local !== imported ? { type: 'Identifier', name: local.value } : undefined,
        });
      } while (this.match(TokenType.COMMA));

      this.consume(TokenType.RBRACE, 'Expected }');
    } else {
      const defaultImport = this.consume(TokenType.IDENTIFIER, 'Expected identifier');
      specifiers.push({
        type: 'ImportSpecifier',
        imported: { type: 'Identifier', name: 'default' },
        local: { type: 'Identifier', name: defaultImport.value },
      });
    }

    this.consume(TokenType.FROM, 'Expected from');
    const source = this.consume(TokenType.STRING, 'Expected string');

    this.match(TokenType.SEMICOLON);

    return {
      type: 'ImportDeclaration',
      specifiers,
      source: { type: 'StringLiteral', value: source.value },
    };
  }

  private exportDeclaration(): AST.ExportDeclaration {
    const declaration = this.statement();
    if (!declaration) {
      throw new Error('Expected declaration after export');
    }

    return {
      type: 'ExportDeclaration',
      declaration,
    };
  }

  private functionDeclaration(): AST.FunctionDeclaration {
    const isAsync = this.previous().type === TokenType.ASYNC;
    const id = this.consume(TokenType.IDENTIFIER, 'Expected function name');

    // Save function decorations before parsing parameters
    const decorations = this.pendingDecorations;
    this.pendingDecorations = [];

    this.consume(TokenType.LPAREN, 'Expected (');
    const params = this.parameters();
    this.consume(TokenType.RPAREN, 'Expected )');

    let returnType: AST.TypeAnnotation | undefined;
    if (this.match(TokenType.COLON)) {
      returnType = this.typeAnnotation();
    }

    this.consume(TokenType.LBRACE, 'Expected {');
    const body = this.blockStatement();

    return {
      type: 'FunctionDeclaration',
      id: { type: 'Identifier', name: id.value },
      params,
      body,
      returnType,
      isAsync,
      decorations: decorations.length > 0 ? decorations : undefined,
    };
  }

  private classDeclaration(): AST.ClassDeclaration {
    const id = this.consume(TokenType.IDENTIFIER, 'Expected class name');

    this.consume(TokenType.LBRACE, 'Expected {');

    const bodyNodes: (AST.MethodDefinition | AST.PropertyDefinition)[] = [];

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      // Collect decorations for class members
      while (this.match(TokenType.DECORATION)) {
        const decoration = JSON.parse(this.previous().value) as Decoration;
        this.pendingDecorations.push(decoration);
      }

      // Allow any token with a value as property name (including keywords)
      const keyToken = this.peek();
      if (this.isAtEnd() || keyToken.type === TokenType.RBRACE) {
        throw new Error(`Expected member name at line ${keyToken.line}, column ${keyToken.column}`);
      }
      const key = this.advance();

      if (this.match(TokenType.LPAREN)) {
        // Method
        const params = this.parameters();
        this.consume(TokenType.RPAREN, 'Expected )');

        let returnType: AST.TypeAnnotation | undefined;
        if (this.match(TokenType.COLON)) {
          returnType = this.typeAnnotation();
        }

        this.consume(TokenType.LBRACE, 'Expected {');
        const body = this.blockStatement();

        const decorations = this.pendingDecorations;
        this.pendingDecorations = [];

        bodyNodes.push({
          type: 'MethodDefinition',
          key: { type: 'Identifier', name: key.value },
          value: {
            type: 'FunctionExpression',
            params,
            body,
            returnType,
            decorations: decorations.length > 0 ? decorations : undefined,
          },
          kind: key.value === 'constructor' ? 'constructor' : 'method',
        });
      } else {
        // Property
        let typeAnnotation: AST.TypeAnnotation | undefined;
        if (this.match(TokenType.COLON)) {
          typeAnnotation = this.typeAnnotation();
        }

        let value: AST.Expression | undefined;
        if (this.match(TokenType.EQUALS)) {
          value = this.expression();
        }

        this.match(TokenType.SEMICOLON);

        const decorations = this.pendingDecorations;
        this.pendingDecorations = [];

        bodyNodes.push({
          type: 'PropertyDefinition',
          key: { type: 'Identifier', name: key.value },
          value,
          typeAnnotation,
          decorations: decorations.length > 0 ? decorations : undefined,
        });
      }
    }

    this.consume(TokenType.RBRACE, 'Expected }');

    const decorations = this.pendingDecorations;
    this.pendingDecorations = [];

    return {
      type: 'ClassDeclaration',
      id: { type: 'Identifier', name: id.value },
      body: {
        type: 'ClassBody',
        body: bodyNodes,
      },
      decorations: decorations.length > 0 ? decorations : undefined,
    };
  }

  private interfaceDeclaration(): AST.InterfaceDeclaration {
    const id = this.consume(TokenType.IDENTIFIER, 'Expected interface name');

    this.consume(TokenType.LBRACE, 'Expected {');

    const body: AST.PropertySignature[] = [];

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      // Allow keywords as property names
      if (this.isAtEnd()) {
        throw new Error(`Expected property name at line ${this.peek().line}, column ${this.peek().column}`);
      }
      const key = this.advance();
      const optional = this.match(TokenType.QUESTION);

      this.consume(TokenType.COLON, 'Expected :');
      const typeAnnotation = this.typeAnnotation();

      this.match(TokenType.SEMICOLON);

      body.push({
        type: 'PropertySignature',
        key: { type: 'Identifier', name: key.value },
        typeAnnotation,
        optional,
      });
    }

    this.consume(TokenType.RBRACE, 'Expected }');

    return {
      type: 'InterfaceDeclaration',
      id: { type: 'Identifier', name: id.value },
      body: {
        type: 'InterfaceBody',
        body,
      },
    };
  }

  private typeAliasDeclaration(): AST.TypeAliasDeclaration {
    const id = this.consume(TokenType.IDENTIFIER, 'Expected type name');

    this.consume(TokenType.EQUALS, 'Expected =');
    const typeAnnotation = this.typeAnnotation();

    this.match(TokenType.SEMICOLON);

    return {
      type: 'TypeAliasDeclaration',
      id: { type: 'Identifier', name: id.value },
      typeAnnotation,
    };
  }

  private variableDeclaration(): AST.VariableDeclaration {
    const kind = this.previous().value as 'let' | 'const' | 'var';
    const declarations: AST.VariableDeclarator[] = [];

    do {
      const id = this.consume(TokenType.IDENTIFIER, 'Expected variable name');

      let typeAnnotation: AST.TypeAnnotation | undefined;
      if (this.match(TokenType.COLON)) {
        typeAnnotation = this.typeAnnotation();
      }

      let init: AST.Expression | undefined;
      if (this.match(TokenType.EQUALS)) {
        init = this.expression();
      }

      const decorations = this.pendingDecorations;
      this.pendingDecorations = [];

      declarations.push({
        type: 'VariableDeclarator',
        id: {
          type: 'Identifier',
          name: id.value,
          decorations: decorations.length > 0 ? decorations : undefined,
        },
        init,
        typeAnnotation,
      });
    } while (this.match(TokenType.COMMA));

    this.match(TokenType.SEMICOLON);

    return {
      type: 'VariableDeclaration',
      kind,
      declarations,
    };
  }

  private ifStatement(): AST.IfStatement {
    this.consume(TokenType.LPAREN, 'Expected (');
    const test = this.expression();
    this.consume(TokenType.RPAREN, 'Expected )');

    const consequent = this.statement()!;
    let alternate: AST.Statement | undefined;

    if (this.match(TokenType.ELSE)) {
      alternate = this.statement()!;
    }

    return {
      type: 'IfStatement',
      test,
      consequent,
      alternate,
    };
  }

  private whileStatement(): AST.WhileStatement {
    this.consume(TokenType.LPAREN, 'Expected (');
    const test = this.expression();
    this.consume(TokenType.RPAREN, 'Expected )');

    const body = this.statement()!;

    return {
      type: 'WhileStatement',
      test,
      body,
    };
  }

  private forStatement(): AST.ForStatement {
    this.consume(TokenType.LPAREN, 'Expected (');

    let init: AST.VariableDeclaration | AST.Expression | undefined;
    if (!this.check(TokenType.SEMICOLON)) {
      if (this.match(TokenType.LET, TokenType.CONST, TokenType.VAR)) {
        init = this.variableDeclaration();
      } else {
        init = this.expression();
        this.consume(TokenType.SEMICOLON, 'Expected ;');
      }
    } else {
      this.advance();
    }

    let test: AST.Expression | undefined;
    if (!this.check(TokenType.SEMICOLON)) {
      test = this.expression();
    }
    this.consume(TokenType.SEMICOLON, 'Expected ;');

    let update: AST.Expression | undefined;
    if (!this.check(TokenType.RPAREN)) {
      update = this.expression();
    }
    this.consume(TokenType.RPAREN, 'Expected )');

    const body = this.statement()!;

    return {
      type: 'ForStatement',
      init,
      test,
      update,
      body,
    };
  }

  private returnStatement(): AST.ReturnStatement {
    let argument: AST.Expression | undefined;

    if (!this.check(TokenType.SEMICOLON) && !this.isAtEnd()) {
      argument = this.expression();
    }

    this.match(TokenType.SEMICOLON);

    return {
      type: 'ReturnStatement',
      argument,
    };
  }

  private blockStatement(): AST.BlockStatement {
    const body: AST.Statement[] = [];

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const stmt = this.statement();
      if (stmt) {
        body.push(stmt);
      }
    }

    this.consume(TokenType.RBRACE, 'Expected }');

    return {
      type: 'BlockStatement',
      body,
    };
  }

  private tryStatement(): AST.TryStatement {
    this.consume(TokenType.LBRACE, 'Expected {');
    const block = this.blockStatement();

    let handler: AST.CatchClause | undefined;
    if (this.match(TokenType.CATCH)) {
      let param: AST.Identifier | undefined;

      if (this.match(TokenType.LPAREN)) {
        const paramToken = this.consume(TokenType.IDENTIFIER, 'Expected parameter');
        param = { type: 'Identifier', name: paramToken.value };
        this.consume(TokenType.RPAREN, 'Expected )');
      }

      this.consume(TokenType.LBRACE, 'Expected {');
      const body = this.blockStatement();

      handler = {
        type: 'CatchClause',
        param,
        body,
      };
    }

    let finalizer: AST.BlockStatement | undefined;
    if (this.match(TokenType.FINALLY)) {
      this.consume(TokenType.LBRACE, 'Expected {');
      finalizer = this.blockStatement();
    }

    return {
      type: 'TryStatement',
      block,
      handler,
      finalizer,
    };
  }

  private throwStatement(): AST.ThrowStatement {
    const argument = this.expression();
    this.match(TokenType.SEMICOLON);

    return {
      type: 'ThrowStatement',
      argument,
    };
  }

  private expressionStatement(): AST.ExpressionStatement {
    const expression = this.expression();
    this.match(TokenType.SEMICOLON);

    return {
      type: 'ExpressionStatement',
      expression,
    };
  }

  private expression(): AST.Expression {
    return this.assignment();
  }

  private assignment(): AST.Expression {
    let expr = this.ternary();

    if (this.match(TokenType.EQUALS, TokenType.PLUS_EQUALS, TokenType.MINUS_EQUALS)) {
      const operator = this.previous().value;
      const right = this.assignment();

      expr = {
        type: 'AssignmentExpression',
        left: expr,
        operator,
        right,
      };
    }

    return expr;
  }

  private ternary(): AST.Expression {
    let expr = this.logicalOr();

    if (this.match(TokenType.QUESTION)) {
      const consequent = this.expression();
      this.consume(TokenType.COLON, 'Expected :');
      const alternate = this.expression();

      expr = {
        type: 'ConditionalExpression',
        test: expr,
        consequent,
        alternate,
      };
    }

    return expr;
  }

  private logicalOr(): AST.Expression {
    let expr = this.logicalAnd();

    while (this.match(TokenType.LOGICAL_OR)) {
      const operator = this.previous().value;
      const right = this.logicalAnd();

      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right,
      };
    }

    return expr;
  }

  private logicalAnd(): AST.Expression {
    let expr = this.equality();

    while (this.match(TokenType.LOGICAL_AND)) {
      const operator = this.previous().value;
      const right = this.equality();

      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right,
      };
    }

    return expr;
  }

  private equality(): AST.Expression {
    let expr = this.comparison();

    while (this.match(TokenType.DOUBLE_EQUALS, TokenType.TRIPLE_EQUALS, TokenType.NOT_EQUALS, TokenType.STRICT_NOT_EQUALS)) {
      const operator = this.previous().value;
      const right = this.comparison();

      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right,
      };
    }

    return expr;
  }

  private comparison(): AST.Expression {
    let expr = this.additive();

    while (this.match(TokenType.LESS_THAN, TokenType.GREATER_THAN, TokenType.LESS_THAN_EQUALS, TokenType.GREATER_THAN_EQUALS)) {
      const operator = this.previous().value;
      const right = this.additive();

      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right,
      };
    }

    return expr;
  }

  private additive(): AST.Expression {
    let expr = this.multiplicative();

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.previous().value;
      const right = this.multiplicative();

      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right,
      };
    }

    return expr;
  }

  private multiplicative(): AST.Expression {
    let expr = this.unary();

    while (this.match(TokenType.STAR, TokenType.SLASH, TokenType.PERCENT)) {
      const operator = this.previous().value;
      const right = this.unary();

      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right,
      };
    }

    return expr;
  }

  private unary(): AST.Expression {
    if (this.match(TokenType.LOGICAL_NOT, TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous().value;
      const argument = this.unary();

      return {
        type: 'UnaryExpression',
        operator,
        argument,
        prefix: true,
      };
    }

    if (this.match(TokenType.AWAIT)) {
      const argument = this.unary();
      return {
        type: 'AwaitExpression',
        argument,
      };
    }

    return this.postfix();
  }

  private postfix(): AST.Expression {
    let expr = this.primary();

    while (true) {
      if (this.match(TokenType.LPAREN)) {
        const args: AST.Expression[] = [];

        if (!this.check(TokenType.RPAREN)) {
          do {
            args.push(this.expression());
          } while (this.match(TokenType.COMMA));
        }

        this.consume(TokenType.RPAREN, 'Expected )');

        expr = {
          type: 'CallExpression',
          callee: expr,
          arguments: args,
        };
      } else if (this.match(TokenType.DOT)) {
        // Allow keywords as property names
        if (this.isAtEnd()) {
          throw new Error(`Expected property name at line ${this.peek().line}, column ${this.peek().column}`);
        }
        const property = this.advance();

        expr = {
          type: 'MemberExpression',
          object: expr,
          property: { type: 'Identifier', name: property.value },
          computed: false,
        };
      } else if (this.match(TokenType.LBRACKET)) {
        const property = this.expression();
        this.consume(TokenType.RBRACKET, 'Expected ]');

        expr = {
          type: 'MemberExpression',
          object: expr,
          property,
          computed: true,
        };
      } else {
        break;
      }
    }

    return expr;
  }

  private primary(): AST.Expression {
    if (this.match(TokenType.NUMBER)) {
      return {
        type: 'NumberLiteral',
        value: parseFloat(this.previous().value),
      };
    }

    if (this.match(TokenType.STRING)) {
      return {
        type: 'StringLiteral',
        value: this.previous().value,
      };
    }

    if (this.match(TokenType.BOOLEAN)) {
      return {
        type: 'BooleanLiteral',
        value: this.previous().value === 'true',
      };
    }

    if (this.match(TokenType.NULL)) {
      return {
        type: 'NullLiteral',
        value: null,
      };
    }

    if (this.match(TokenType.THIS)) {
      return {
        type: 'ThisExpression',
      };
    }

    if (this.match(TokenType.NEW)) {
      // Parse the constructor (could be an identifier or member expression)
      let callee: AST.Expression = this.primary();

      // Handle member expressions like new obj.Constructor()
      while (this.match(TokenType.DOT)) {
        if (this.isAtEnd()) {
          throw new Error(`Expected property name at line ${this.peek().line}, column ${this.peek().column}`);
        }
        const property = this.advance();
        callee = {
          type: 'MemberExpression',
          object: callee,
          property: { type: 'Identifier', name: property.value },
          computed: false,
        };
      }

      // Parse constructor arguments
      const args: AST.Expression[] = [];
      if (this.match(TokenType.LPAREN)) {
        if (!this.check(TokenType.RPAREN)) {
          do {
            args.push(this.expression());
          } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RPAREN, 'Expected )');
      }

      return {
        type: 'NewExpression',
        callee,
        arguments: args,
      };
    }

    if (this.match(TokenType.IDENTIFIER)) {
      return {
        type: 'Identifier',
        name: this.previous().value,
      };
    }

    // Allow some keywords to be used as identifiers
    const current = this.peek();
    if (current.value && current.type !== TokenType.LPAREN && current.type !== TokenType.RPAREN &&
        current.type !== TokenType.LBRACE && current.type !== TokenType.RBRACE &&
        current.type !== TokenType.LBRACKET && current.type !== TokenType.RBRACKET &&
        current.type !== TokenType.SEMICOLON && current.type !== TokenType.COMMA &&
        current.type !== TokenType.DOT && current.type !== TokenType.EOF) {
      // Check if it's a keyword that can be used as identifier
      if (current.type === TokenType.TYPE || current.type === TokenType.AS ||
          current.type === TokenType.FROM) {
        this.advance();
        return {
          type: 'Identifier',
          name: this.previous().value,
        };
      }
    }

    if (this.match(TokenType.LPAREN)) {
      // Could be arrow function or grouped expression
      // First check if this looks like it could be arrow function parameters
      const checkpoint = this.current;
      let isArrowFunction = false;

      try {
        // Try parsing as arrow function parameters
        const params: AST.Parameter[] = [];
        if (!this.check(TokenType.RPAREN)) {
          // Quick check: if we see 'this' or other keywords that can't be parameters, it's not an arrow function
          if (this.check(TokenType.THIS) || this.check(TokenType.NEW)) {
            throw new Error('Not arrow function');
          }

          do {
            const paramToken = this.check(TokenType.IDENTIFIER) ? this.advance() : null;
            if (!paramToken) {
              throw new Error('Not arrow function');
            }

            let typeAnnotation: AST.TypeAnnotation | undefined;
            if (this.match(TokenType.COLON)) {
              typeAnnotation = this.typeAnnotation();
            }

            params.push({
              type: 'Parameter',
              id: { type: 'Identifier', name: paramToken.value },
              typeAnnotation,
            });
          } while (this.match(TokenType.COMMA));
        }

        if (!this.check(TokenType.RPAREN)) {
          throw new Error('Not arrow function');
        }
        this.consume(TokenType.RPAREN, 'Expected )');

        if (this.match(TokenType.ARROW)) {
          isArrowFunction = true;
          let returnType: AST.TypeAnnotation | undefined;
          if (this.match(TokenType.COLON)) {
            returnType = this.typeAnnotation();
          }

          let body: AST.BlockStatement | AST.Expression;
          if (this.match(TokenType.LBRACE)) {
            body = this.blockStatement();
          } else {
            body = this.expression();
          }

          return {
            type: 'ArrowFunctionExpression',
            params,
            body,
            returnType,
          };
        }
      } catch (e) {
        // Not an arrow function
      }

      if (!isArrowFunction) {
        // Parse as grouped expression
        this.current = checkpoint;
        const expr = this.expression();
        this.consume(TokenType.RPAREN, 'Expected )');
        return expr;
      }
    }

    if (this.match(TokenType.LBRACKET)) {
      const elements: AST.Expression[] = [];

      if (!this.check(TokenType.RBRACKET)) {
        do {
          elements.push(this.expression());
        } while (this.match(TokenType.COMMA));
      }

      this.consume(TokenType.RBRACKET, 'Expected ]');

      return {
        type: 'ArrayExpression',
        elements,
      };
    }

    if (this.match(TokenType.LBRACE)) {
      const properties: AST.Property[] = [];

      while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
        const key = this.consume(TokenType.IDENTIFIER, 'Expected property key');

        if (this.match(TokenType.COLON)) {
          const value = this.expression();
          properties.push({
            type: 'Property',
            key: { type: 'Identifier', name: key.value },
            value,
          });
        } else {
          // Shorthand
          properties.push({
            type: 'Property',
            key: { type: 'Identifier', name: key.value },
            value: { type: 'Identifier', name: key.value },
            shorthand: true,
          });
        }

        if (!this.check(TokenType.RBRACE)) {
          this.consume(TokenType.COMMA, 'Expected ,');
        }
      }

      this.consume(TokenType.RBRACE, 'Expected }');

      return {
        type: 'ObjectExpression',
        properties,
      };
    }

    throw new Error(`Unexpected token: ${this.peek().type} at line ${this.peek().line}`);
  }

  private parameters(): AST.Parameter[] {
    const params: AST.Parameter[] = [];

    if (!this.check(TokenType.RPAREN)) {
      do {
        // Collect decorations for parameters
        while (this.match(TokenType.DECORATION)) {
          const decoration = JSON.parse(this.previous().value) as Decoration;
          this.pendingDecorations.push(decoration);
        }

        // Allow keywords as parameter names
        if (this.isAtEnd()) {
          throw new Error(`Expected parameter at line ${this.peek().line}, column ${this.peek().column}`);
        }
        const paramToken = this.advance();

        let typeAnnotation: AST.TypeAnnotation | undefined;
        if (this.match(TokenType.COLON)) {
          typeAnnotation = this.typeAnnotation();
        }

        let defaultValue: AST.Expression | undefined;
        if (this.match(TokenType.EQUALS)) {
          defaultValue = this.expression();
        }

        const decorations = this.pendingDecorations;
        this.pendingDecorations = [];

        params.push({
          type: 'Parameter',
          id: {
            type: 'Identifier',
            name: paramToken.value,
            decorations: decorations.length > 0 ? decorations : undefined,
          },
          typeAnnotation,
          defaultValue,
        });
      } while (this.match(TokenType.COMMA));
    }

    return params;
  }

  private typeAnnotation(): AST.TypeAnnotation {
    const tsType = this.tsType();

    return {
      type: 'TypeAnnotation',
      typeAnnotation: tsType,
    };
  }

  private tsType(): AST.TSType {
    let type = this.tsPrimaryType();

    // Union types
    if (this.match(TokenType.BITWISE_OR)) {
      const types = [type];
      do {
        types.push(this.tsPrimaryType());
      } while (this.match(TokenType.BITWISE_OR));

      return {
        type: 'TSUnionType',
        types,
      };
    }

    return type;
  }

  private tsPrimaryType(): AST.TSType {
    const current = this.peek();

    if (this.match(TokenType.IDENTIFIER)) {
      const name = this.previous().value;

      // Check for array type
      if (this.match(TokenType.LBRACKET)) {
        this.consume(TokenType.RBRACKET, 'Expected ]');
        return {
          type: 'TSArrayType',
          elementType: {
            type: 'TSTypeReference',
            typeName: { type: 'Identifier', name },
          },
        };
      }

      // Built-in types
      switch (name) {
        case 'string': return { type: 'TSStringKeyword' };
        case 'number': return { type: 'TSNumberKeyword' };
        case 'boolean': return { type: 'TSBooleanKeyword' };
        case 'void': return { type: 'TSVoidKeyword' };
        case 'any': return { type: 'TSAnyKeyword' };
        default:
          return {
            type: 'TSTypeReference',
            typeName: { type: 'Identifier', name },
          };
      }
    }

    throw new Error(`Expected type at line ${current.line}`);
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();

    const token = this.peek();
    throw new Error(`${message} at line ${token.line}, column ${token.column}. Got ${token.type}`);
  }
}
