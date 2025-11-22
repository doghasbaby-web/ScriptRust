#!/usr/bin/env node

/**
 * ScriptRust CLI - Command-line interface for ScriptRust compiler
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { Compiler } from './compiler';

const program = new Command();

program
  .name('scriptrust')
  .description('ScriptRust - A hybrid language combining TypeScript and Rust features')
  .version('0.1.0');

program
  .command('run <file>')
  .description('Compile and run a ScriptRust file')
  .action((file: string) => {
    const filePath = path.resolve(file);

    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }

    const source = fs.readFileSync(filePath, 'utf-8');
    const compiler = new Compiler();

    try {
      const result = compiler.compile(source);

      if (result.errors.length > 0) {
        console.error('Compilation errors:');
        for (const error of result.errors) {
          console.error(`  ${error.message}`);
        }
        process.exit(1);
      }

      // Execute the compiled code
      const fn = new Function(result.code);
      fn();
    } catch (error: any) {
      console.error(`Runtime error: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('compile <file>')
  .description('Compile a ScriptRust file to JavaScript')
  .option('-o, --output <file>', 'Output file')
  .action((file: string, options: { output?: string }) => {
    const filePath = path.resolve(file);

    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }

    const source = fs.readFileSync(filePath, 'utf-8');
    const compiler = new Compiler();

    const result = compiler.compile(source);

    if (result.errors.length > 0) {
      console.error('Compilation errors:');
      for (const error of result.errors) {
        console.error(`  ${error.message}`);
      }
      process.exit(1);
    }

    if (options.output) {
      fs.writeFileSync(options.output, result.code);
      console.log(`Compiled to: ${options.output}`);
    } else {
      console.log(result.code);
    }
  });

program
  .command('ast <file>')
  .description('Print the AST of a ScriptRust file')
  .action((file: string) => {
    const filePath = path.resolve(file);

    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }

    const source = fs.readFileSync(filePath, 'utf-8');
    const compiler = new Compiler();

    const result = compiler.compile(source);

    if (result.errors.length > 0) {
      console.error('Compilation errors:');
      for (const error of result.errors) {
        console.error(`  ${error.message}`);
      }
      process.exit(1);
    }

    console.log(JSON.stringify(result.ast, null, 2));
  });

program.parse();
