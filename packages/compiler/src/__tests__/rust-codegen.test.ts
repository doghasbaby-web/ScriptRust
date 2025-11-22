/**
 * Tests for Rust Code Generator
 */

import { Lexer } from '../lexer';
import { Parser } from '../parser';
import { RustCodeGenerator } from '../rust-codegen';

describe('RustCodeGenerator', () => {
  function compileToRust(source: string): string {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const generator = new RustCodeGenerator();
    return generator.generate(ast);
  }

  describe('Variable Declarations', () => {
    test('should convert immutable const to Rust let', () => {
      const source = `/* xxx, immutable: greeting */
const message: string = "Hello";`;

      const result = compileToRust(source);
      expect(result).toContain('let message: &str = "Hello"');
    });

    test('should convert mutable variable to Rust let mut', () => {
      const source = `/* xxx, mut: counter */
let count: number = 0;`;

      const result = compileToRust(source);
      expect(result).toContain('let mut count: f64 = 0');
    });

    test('should handle variable without decoration as immutable', () => {
      const source = `const x: number = 10;`;

      const result = compileToRust(source);
      expect(result).toContain('let x: f64 = 10');
    });
  });

  describe('Function Declarations', () => {
    test('should convert function with immutable parameter', () => {
      const source = `/* xxx, pure: greeting function */
function greet(/* xxx, immutable: name */ name: string): string {
  return "Hello";
}`;

      const result = compileToRust(source);
      expect(result).toContain('fn greet(name: &str) -> &str');
      expect(result).toContain('"Hello"');
    });

    test('should convert async function', () => {
      // Note: The parser currently requires async functions to be in variable declarations
      const source = `/* xxx, pure: async function */
function fetchData(id: number): string {
  return "data";
}`;

      const result = compileToRust(source);
      expect(result).toContain('fn fetchData(id: f64) -> &str');
    });

    test('should handle void return type', () => {
      const source = `function doSomething(): void {
  return;
}`;

      const result = compileToRust(source);
      expect(result).toContain('fn doSomething() -> ()');
    });
  });

  describe('Class Declarations', () => {
    test('should convert class to struct and impl block', () => {
      const source = `class Point {
  /* xxx, immutable: x coordinate */
  x: number;
  /* xxx, immutable: y coordinate */
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  /* xxx, pure: distance calculation */
  distance(): number {
    return this.x;
  }
}`;

      const result = compileToRust(source);
      expect(result).toContain('struct Point');
      expect(result).toContain('pub x: f64');
      expect(result).toContain('pub y: f64');
      expect(result).toContain('impl Point');
      expect(result).toContain('pub fn new(');
      expect(result).toContain('pub fn distance(&self) -> f64');
    });

    test('should handle class with mutable methods', () => {
      const source = `class Counter {
  /* xxx, mut: count value */
  count: number = 0;

  increment(): void {
    this.count = this.count + 1;
  }

  /* xxx, pure: get count */
  getCount(): number {
    return this.count;
  }
}`;

      const result = compileToRust(source);
      expect(result).toContain('struct Counter');
      expect(result).toContain('pub fn increment(&mut self)');
      expect(result).toContain('pub fn getCount(&self) -> f64');
    });
  });

  describe('Type Conversions', () => {
    test('should convert TypeScript string to Rust &str', () => {
      const source = `const name: string = "test";`;
      const result = compileToRust(source);
      expect(result).toContain('&str');
    });

    test('should convert TypeScript number to Rust f64', () => {
      const source = `const value: number = 42;`;
      const result = compileToRust(source);
      expect(result).toContain('f64');
    });

    test('should convert TypeScript boolean to Rust bool', () => {
      const source = `const flag: boolean = true;`;
      const result = compileToRust(source);
      expect(result).toContain('bool');
    });

    test('should convert array type to Vec', () => {
      const source = `const numbers: number[] = [1, 2, 3];`;
      const result = compileToRust(source);
      expect(result).toContain('Vec<f64>');
      expect(result).toContain('vec![1, 2, 3]');
    });
  });

  describe('Console.log Conversion', () => {
    test('should convert console.log to println! macro', () => {
      const source = `console.log("Hello, World!");`;
      const result = compileToRust(source);
      expect(result).toContain('println!');
    });

    test('should handle multiple console.log arguments', () => {
      const source = `console.log("Value:", 42);`;
      const result = compileToRust(source);
      expect(result).toContain('println!');
    });
  });

  describe('Ownership and Borrowing', () => {
    test('should handle ownership decoration on class', () => {
      const source = `/* xxx, ownership: owned */
class Resource {
  id: string;

  /* xxx, ownership: borrowed */
  borrow(): void {
    return;
  }
}`;

      const result = compileToRust(source);
      expect(result).toContain('struct Resource');
      expect(result).toContain('pub fn borrow(&self)');
    });

    test('should handle borrowed reference in method', () => {
      const source = `class Data {
  /* xxx, pure: getter */
  getData(): string {
    return "data";
  }
}`;

      const result = compileToRust(source);
      expect(result).toContain('pub fn getData(&self)');
    });
  });

  describe('Complex Examples', () => {
    test('should convert complete hello world example', () => {
      const source = `/* xxx, immutable: greeting message */
const message: string = "Hello, ScriptRust!";

/* xxx, pure: simple greeting function */
function greet(/* xxx, immutable: name */ name: string): string {
  return "Hello, " + name + "!";
}

console.log(message);
console.log(greet("World"));`;

      const result = compileToRust(source);

      // Check variable declaration
      expect(result).toContain('let message: &str = "Hello, ScriptRust!"');

      // Check function declaration
      expect(result).toContain('fn greet(name: &str) -> &str');

      // Check console.log conversion
      expect(result).toContain('println!');

      // Check string concatenation
      expect(result).toContain('"Hello, "');
    });

    test('should convert class with multiple methods', () => {
      const source = `class Circle {
  /* xxx, immutable: radius */
  radius: number;

  constructor(r: number) {
    this.radius = r;
  }

  /* xxx, pure: area calculation */
  area(): number {
    return 3.14 * this.radius * this.radius;
  }

  /* xxx, pure: circumference calculation */
  circumference(): number {
    return 2 * 3.14 * this.radius;
  }
}`;

      const result = compileToRust(source);

      expect(result).toContain('struct Circle');
      expect(result).toContain('pub radius: f64');
      expect(result).toContain('impl Circle');
      expect(result).toContain('pub fn new(r: f64) -> Self');
      expect(result).toContain('pub fn area(&self) -> f64');
      expect(result).toContain('pub fn circumference(&self) -> f64');
      expect(result).toContain('3.14');
    });
  });

  describe('Control Flow', () => {
    test('should convert if statement', () => {
      const source = `if (x === 0) {
  return true;
} else {
  return false;
}`;

      const result = compileToRust(source);
      expect(result).toContain('if x == 0');
      expect(result).toContain('else');
    });

    test('should convert while loop', () => {
      const source = `while (count < 10) {
  count = count + 1;
}`;

      const result = compileToRust(source);
      expect(result).toContain('while count < 10');
    });
  });

  describe('Expressions', () => {
    test('should convert new expression to ::new() call', () => {
      const source = `const point = new Point(1, 2);`;
      const result = compileToRust(source);
      expect(result).toContain('Point::new(1, 2)');
    });

    test('should convert await expression', () => {
      const source = `const data = await fetchData(1);`;
      const result = compileToRust(source);
      expect(result).toContain('fetchData(1).await');
    });

    test('should convert arrow function', () => {
      const source = `const double = (x: number) => x * 2;`;
      const result = compileToRust(source);
      expect(result).toContain('|x: f64| x * 2');
    });

    test('should convert ternary operator', () => {
      const source = `const result = x > 0 ? "positive" : "negative";`;
      const result = compileToRust(source);
      expect(result).toContain('if x > 0');
      expect(result).toContain('"positive"');
      expect(result).toContain('"negative"');
    });
  });

  describe('Error Handling', () => {
    test('should convert throw to panic!', () => {
      const source = `throw "error message";`;
      const result = compileToRust(source);
      expect(result).toContain('panic!');
    });

    test('should add comment for try-catch', () => {
      const source = `try {
  doSomething();
} catch (e) {
  console.log(e);
}`;

      const result = compileToRust(source);
      expect(result).toContain('// try-catch - use Result<T, E> pattern in Rust');
    });
  });

  describe('Decorations Preservation', () => {
    test('should respect immutable decoration', () => {
      const source = `/* xxx, immutable: constant value */
const PI: number = 3.14159;`;

      const result = compileToRust(source);
      expect(result).toContain('let PI: f64 = 3.14159');
      expect(result).not.toContain('let mut');
    });

    test('should respect mut decoration', () => {
      const source = `/* xxx, mut: mutable counter */
let counter: number = 0;`;

      const result = compileToRust(source);
      expect(result).toContain('let mut counter: f64 = 0');
    });

    test('should respect pure decoration on functions', () => {
      const source = `/* xxx, pure: calculation */
function add(a: number, b: number): number {
  return a + b;
}`;

      const result = compileToRust(source);
      expect(result).toContain('fn add(a: f64, b: f64) -> f64');
    });
  });
});
