/**
 * ScriptRust Compiler - Main compiler interface
 */

import { Lexer } from './lexer';
import { Parser } from './parser';
import { CodeGenerator } from './codegen';
import * as AST from './ast';

export interface CompilationResult {
  code: string;
  ast: AST.Program;
  errors: CompilationError[];
}

export interface CompilationError {
  message: string;
  line?: number;
  column?: number;
}

export class Compiler {
  compile(source: string): CompilationResult {
    const errors: CompilationError[] = [];
    let ast: AST.Program | null = null;
    let code = '';

    try {
      // Lexical analysis
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();

      // Syntax analysis
      const parser = new Parser(tokens);
      ast = parser.parse();

      // Code generation
      const codegen = new CodeGenerator();
      code = codegen.generate(ast);
    } catch (error: any) {
      errors.push({
        message: error.message,
      });
    }

    return {
      code,
      ast: ast || { type: 'Program', body: [] },
      errors,
    };
  }

  compileAndRun(source: string): any {
    const result = this.compile(source);

    if (result.errors.length > 0) {
      throw new Error(`Compilation failed:\n${result.errors.map(e => e.message).join('\n')}`);
    }

    // Create a function from the generated code and execute it
    const fn = new Function(result.code);
    return fn();
  }
}

export { Lexer, Parser, CodeGenerator };
export * from './ast';
