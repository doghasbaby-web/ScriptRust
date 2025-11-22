# ScriptRust

TypeScript with Rust decorations - a tool that converts TypeScript files enhanced with Rust-inspired decorations into Rust code.

## Overview

ScriptRust is pure TypeScript enhanced with Rust-like features through a decoration system. Files remain standard `.ts` TypeScript files, but use special comment-style decorations: `/* xxx, keyword: description */` to annotate variables, functions, and class members with Rust-inspired semantics. The `scriptrust` command converts these decorated TypeScript files into Rust code.

## Features

### TypeScript Compatibility
- Full TypeScript syntax support
- Type annotations and interfaces
- Classes and inheritance
- Async/await
- Arrow functions
- Modern ES features

### Rust-Style Decorations

Decorations follow the format: `/* xxx, keyword: description */`

All decorations must begin with the `xxx` keyword prefix for explicit identification.

Common decoration keywords:
- `immutable` - Mark variables that cannot be reassigned
- `mut` - Explicitly mark mutable variables
- `ownership` - Indicate ownership semantics (borrowed, moved, owned)
- `pure` - Mark functions with no side effects
- `unsafe` - Mark potentially unsafe operations
- `lifetime` - Describe lifetime constraints

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd ScriptRust

# Install dependencies
npm install

# Build the compiler
npm run build
```

## Usage

### CLI

```bash
# Convert a TypeScript file with Rust decorations to Rust code
npx scriptrust examples/hello.ts

# Specify custom output file
npx scriptrust examples/hello.ts -o output.rs

# Output defaults to <input>.rs if not specified
npx scriptrust examples/ownership.ts  # Creates ownership.rs
```

### Playground

```bash
# Start the playground
npm run dev:playground

# Open http://localhost:5173 in your browser
```

## Example Code

```scriptrust
// Variable with immutability decoration
/* xxx, immutable: This value cannot be changed */
const PI: number = 3.14159;

// Function with ownership decoration
/* xxx, ownership: borrowed */
function calculateArea(/* xxx, immutable: radius */ r: number): number {
  return PI * r * r;
}

// Class with lifetime decorations
class Buffer {
  /* xxx, mut: mutable internal state */
  data: number[] = [];

  /* xxx, pure: no side effects */
  length(): number {
    return this.data.length;
  }

  /* xxx, mut: modifies internal state */
  push(value: number): void {
    this.data.push(value);
  }
}

// Usage
const buffer = new Buffer();
buffer.push(1);
buffer.push(2);

console.log("Buffer length:", buffer.length());
console.log("Area:", calculateArea(5));
```

## Language Syntax

### Decorations

Decorations can be applied to:
- Variable declarations
- Function parameters
- Function declarations
- Class members (properties and methods)

All decorations must use the `xxx` keyword prefix:

```scriptrust
// Variable decoration
/* xxx, immutable: constant value */
const x: number = 10;

// Parameter decoration
function foo(/* xxx, mut: can be modified */ param: string) {
  // ...
}

// Function decoration
/* xxx, pure: no side effects */
function add(a: number, b: number): number {
  return a + b;
}

// Class member decorations
class Example {
  /* xxx, mut: mutable field */
  count: number = 0;

  /* xxx, ownership: borrowed */
  method(/* xxx, immutable: param */ value: string): void {
    // ...
  }
}
```

### Type Annotations

ScriptRust supports TypeScript-style type annotations:

```scriptrust
const name: string = "Alice";
const age: number = 30;
const active: boolean = true;

function greet(name: string): string {
  return "Hello, " + name;
}

interface User {
  name: string;
  age: number;
}

type ID = string | number;
```

## Project Structure

```
ScriptRust/
├── packages/
│   ├── compiler/          # ScriptRust compiler
│   │   ├── src/
│   │   │   ├── lexer.ts   # Tokenizer
│   │   │   ├── parser.ts  # Parser
│   │   │   ├── ast.ts     # AST definitions
│   │   │   ├── codegen.ts # Code generator
│   │   │   ├── compiler.ts # Main compiler
│   │   │   ├── cli.ts     # CLI tool
│   │   │   └── index.ts   # Public API
│   │   └── package.json
│   └── playground/        # Web playground
│       ├── src/
│       │   ├── App.tsx    # Main app component
│       │   ├── components/ # UI components
│       │   └── main.tsx
│       └── package.json
├── examples/              # Example ScriptRust programs
└── package.json
```

## Development

```bash
# Install dependencies
npm install

# Build compiler
npm run build

# Run compiler in watch mode
npm run dev:compiler

# Run playground
npm run dev:playground

# Run tests
npm test
```

## How It Works

1. **Lexical Analysis**: The lexer tokenizes ScriptRust source code, including decorations
2. **Parsing**: The parser builds an Abstract Syntax Tree (AST) with decoration metadata
3. **Code Generation**: The code generator generates Rust code directly from the AST, translating TypeScript syntax and decorations into equivalent Rust constructs

## Decoration Philosophy

Decorations in ScriptRust serve as:
- **Documentation**: Self-documenting code with Rust-inspired semantics
- **Intent Declaration**: Explicitly state the intended behavior of code
- **Static Analysis Hints**: Enable future tooling for more advanced checks

While decorations are currently compiled to comments, they provide a foundation for:
- Linting rules
- Runtime validation
- Performance optimizations
- Advanced type checking

## Examples

See the `examples/` directory for more complete examples:
- `hello.ts` - Basic hello world
- `ownership.ts` - Ownership decorations
- `classes.ts` - Class-based examples
- `async.ts` - Async/await patterns

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
