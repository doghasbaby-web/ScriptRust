#!/usr/bin/env node

/**
 * ScriptRust CLI - Converts TypeScript files with Rust decorations to Rust code
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { Compiler } from './compiler.js';

const program = new Command();

program
  .name('scriptrust')
  .description('Convert TypeScript with Rust decorations to Rust code')
  .version('0.1.0')
  .argument('<file>', 'TypeScript file to convert')
  .option('-o, --output <file>', 'Output file (defaults to <input>.rs)')
  .action((file: string, options: { output?: string }) => {
    const filePath = path.resolve(file);

    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }

    const source = fs.readFileSync(filePath, 'utf-8');
    const compiler = new Compiler();

    const result = compiler.compileToRust(source);

    if (result.errors.length > 0) {
      console.error('Compilation errors:');
      for (const error of result.errors) {
        console.error(`  ${error.message}`);
      }
      process.exit(1);
    }

    const outputFile = options.output || filePath.replace(/\.ts$/, '.rs');
    fs.writeFileSync(outputFile, result.code);
    console.log(`Converted to Rust: ${outputFile}`);

    // Validate generated Rust code with rustc
    try {
      execSync(`rustc --crate-type lib ${outputFile} -o /tmp/check.out`,
        { stdio: 'pipe' });
      console.log('✓ Generated Rust code is valid');
    } catch (error: any) {
      console.warn('⚠ Warning: Generated Rust code may have errors:');
      console.warn(error.stderr?.toString());
    }
  });

program.parse();
