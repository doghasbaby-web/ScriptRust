/**
 * ScriptRust Lexer - Tokenizes ScriptRust source code
 */

export enum TokenType {
  // Literals
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
  NULL = 'NULL',
  UNDEFINED = 'UNDEFINED',

  // Identifiers and Keywords
  IDENTIFIER = 'IDENTIFIER',
  LET = 'LET',
  CONST = 'CONST',
  VAR = 'VAR',
  FUNCTION = 'FUNCTION',
  RETURN = 'RETURN',
  IF = 'IF',
  ELSE = 'ELSE',
  WHILE = 'WHILE',
  FOR = 'FOR',
  BREAK = 'BREAK',
  CONTINUE = 'CONTINUE',
  CLASS = 'CLASS',
  INTERFACE = 'INTERFACE',
  TYPE = 'TYPE',
  ENUM = 'ENUM',
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
  FROM = 'FROM',
  AS = 'AS',
  NEW = 'NEW',
  THIS = 'THIS',
  ASYNC = 'ASYNC',
  AWAIT = 'AWAIT',
  TRY = 'TRY',
  CATCH = 'CATCH',
  FINALLY = 'FINALLY',
  THROW = 'THROW',

  // Rust-style Decorations
  DECORATION = 'DECORATION',

  // Operators
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  STAR = 'STAR',
  SLASH = 'SLASH',
  PERCENT = 'PERCENT',
  EQUALS = 'EQUALS',
  DOUBLE_EQUALS = 'DOUBLE_EQUALS',
  TRIPLE_EQUALS = 'TRIPLE_EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  STRICT_NOT_EQUALS = 'STRICT_NOT_EQUALS',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN_EQUALS = 'LESS_THAN_EQUALS',
  GREATER_THAN_EQUALS = 'GREATER_THAN_EQUALS',
  LOGICAL_AND = 'LOGICAL_AND',
  LOGICAL_OR = 'LOGICAL_OR',
  LOGICAL_NOT = 'LOGICAL_NOT',
  BITWISE_AND = 'BITWISE_AND',
  BITWISE_OR = 'BITWISE_OR',
  BITWISE_XOR = 'BITWISE_XOR',
  BITWISE_NOT = 'BITWISE_NOT',
  PLUS_EQUALS = 'PLUS_EQUALS',
  MINUS_EQUALS = 'MINUS_EQUALS',
  ARROW = 'ARROW',
  QUESTION = 'QUESTION',
  COLON = 'COLON',
  DOT = 'DOT',
  SPREAD = 'SPREAD',

  // Delimiters
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  LBRACE = 'LBRACE',
  RBRACE = 'RBRACE',
  LBRACKET = 'LBRACKET',
  RBRACKET = 'RBRACKET',
  SEMICOLON = 'SEMICOLON',
  COMMA = 'COMMA',

  // Special
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
  COMMENT = 'COMMENT',
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export interface Decoration {
  keyword: string;
  description: string;
}

const KEYWORDS: Record<string, TokenType> = {
  let: TokenType.LET,
  const: TokenType.CONST,
  var: TokenType.VAR,
  function: TokenType.FUNCTION,
  return: TokenType.RETURN,
  if: TokenType.IF,
  else: TokenType.ELSE,
  while: TokenType.WHILE,
  for: TokenType.FOR,
  break: TokenType.BREAK,
  continue: TokenType.CONTINUE,
  class: TokenType.CLASS,
  interface: TokenType.INTERFACE,
  type: TokenType.TYPE,
  enum: TokenType.ENUM,
  import: TokenType.IMPORT,
  export: TokenType.EXPORT,
  from: TokenType.FROM,
  as: TokenType.AS,
  new: TokenType.NEW,
  this: TokenType.THIS,
  true: TokenType.BOOLEAN,
  false: TokenType.BOOLEAN,
  null: TokenType.NULL,
  undefined: TokenType.UNDEFINED,
  async: TokenType.ASYNC,
  await: TokenType.AWAIT,
  try: TokenType.TRY,
  catch: TokenType.CATCH,
  finally: TokenType.FINALLY,
  throw: TokenType.THROW,
};

export class Lexer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  constructor(input: string) {
    this.input = input;
  }

  tokenize(): Token[] {
    while (this.position < this.input.length) {
      this.skipWhitespace();
      if (this.position >= this.input.length) break;

      const char = this.current();

      // Comments
      if (char === '/' && this.peek() === '/') {
        this.readLineComment();
        continue;
      }

      if (char === '/' && this.peek() === '*') {
        // Check if this is a decoration comment /* xxx, ... */
        const decoration = this.tryReadDecoration();
        if (decoration) {
          continue;
        }
        // Not a decoration, treat as regular block comment
        this.readBlockComment();
        continue;
      }

      // Strings
      if (char === '"' || char === "'" || char === '`') {
        this.readString(char);
        continue;
      }

      // Numbers
      if (this.isDigit(char)) {
        this.readNumber();
        continue;
      }

      // Identifiers and Keywords
      if (this.isAlpha(char) || char === '_' || char === '$') {
        this.readIdentifier();
        continue;
      }

      // Operators and Delimiters
      this.readOperator();
    }

    this.addToken(TokenType.EOF, '');
    return this.tokens;
  }

  private current(): string {
    return this.input[this.position];
  }

  private peek(offset: number = 1): string {
    return this.input[this.position + offset];
  }

  private advance(): string {
    const char = this.current();
    this.position++;
    this.column++;
    if (char === '\n') {
      this.line++;
      this.column = 1;
    }
    return char;
  }

  private skipWhitespace(): void {
    while (this.position < this.input.length) {
      const char = this.current();
      if (char === ' ' || char === '\t' || char === '\r' || char === '\n') {
        this.advance();
      } else {
        break;
      }
    }
  }

  private readLineComment(): void {
    const start = this.position;
    while (this.position < this.input.length && this.current() !== '\n') {
      this.advance();
    }
    // Comments are typically ignored, but we could add them to tokens if needed
  }

  private readBlockComment(): void {
    this.advance(); // /
    this.advance(); // *
    while (this.position < this.input.length) {
      if (this.current() === '*' && this.peek() === '/') {
        this.advance(); // *
        this.advance(); // /
        break;
      }
      this.advance();
    }
  }

  private tryReadDecoration(): boolean {
    const start = this.position;
    const startLine = this.line;
    const startColumn = this.column;

    this.advance(); // /
    this.advance(); // *

    // Skip whitespace after /*
    while (this.position < this.input.length && (this.current() === ' ' || this.current() === '\t')) {
      this.advance();
    }

    // Read first token (should be 'xxx')
    let firstToken = '';
    while (this.position < this.input.length && this.current() !== ',' && this.current() !== '*' && this.current() !== ' ' && this.current() !== '\t') {
      firstToken += this.current();
      this.advance();
    }

    firstToken = firstToken.trim();

    // Check if the first token is 'xxx'
    if (firstToken === 'xxx' && this.current() === ',') {
      this.advance(); // ,

      // Skip whitespace after comma
      while (this.position < this.input.length && (this.current() === ' ' || this.current() === '\t')) {
        this.advance();
      }

      // Read the actual keyword
      let keyword = '';
      while (this.position < this.input.length && this.current() !== ':' && this.current() !== '*') {
        keyword += this.current();
        this.advance();
      }

      keyword = keyword.trim();

      if (this.current() === ':') {
        this.advance(); // :

        // Skip whitespace after :
        while (this.position < this.input.length && (this.current() === ' ' || this.current() === '\t')) {
          this.advance();
        }

        let description = '';
        while (this.position < this.input.length) {
          if (this.current() === '*' && this.peek() === '/') {
            break;
          }
          description += this.current();
          this.advance();
        }

        if (this.current() === '*' && this.peek() === '/') {
          this.advance(); // *
          this.advance(); // /
          description = description.trim();

          const decorationValue = JSON.stringify({ keyword, description });
          this.addToken(TokenType.DECORATION, decorationValue, startLine, startColumn);
          return true;
        }
      }
    }

    // Not a decoration, reset
    this.position = start;
    this.line = startLine;
    this.column = startColumn;
    return false;
  }

  private readString(quote: string): void {
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';

    this.advance(); // opening quote

    while (this.position < this.input.length && this.current() !== quote) {
      if (this.current() === '\\') {
        this.advance();
        if (this.position < this.input.length) {
          const escaped = this.current();
          switch (escaped) {
            case 'n': value += '\n'; break;
            case 't': value += '\t'; break;
            case 'r': value += '\r'; break;
            case '\\': value += '\\'; break;
            case quote: value += quote; break;
            default: value += escaped;
          }
          this.advance();
        }
      } else {
        value += this.current();
        this.advance();
      }
    }

    if (this.current() === quote) {
      this.advance(); // closing quote
    }

    this.addToken(TokenType.STRING, value, startLine, startColumn);
  }

  private readNumber(): void {
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';

    while (this.position < this.input.length && (this.isDigit(this.current()) || this.current() === '.')) {
      value += this.current();
      this.advance();
    }

    this.addToken(TokenType.NUMBER, value, startLine, startColumn);
  }

  private readIdentifier(): void {
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';

    while (this.position < this.input.length && (this.isAlphaNumeric(this.current()) || this.current() === '_' || this.current() === '$')) {
      value += this.current();
      this.advance();
    }

    const tokenType = KEYWORDS[value] || TokenType.IDENTIFIER;
    this.addToken(tokenType, value, startLine, startColumn);
  }

  private readOperator(): void {
    const startLine = this.line;
    const startColumn = this.column;
    const char = this.current();
    const next = this.peek();

    // Multi-character operators
    if (char === '=' && next === '=') {
      this.advance();
      this.advance();
      if (this.current() === '=') {
        this.advance();
        this.addToken(TokenType.TRIPLE_EQUALS, '===', startLine, startColumn);
      } else {
        this.addToken(TokenType.DOUBLE_EQUALS, '==', startLine, startColumn);
      }
      return;
    }

    if (char === '!' && next === '=') {
      this.advance();
      this.advance();
      if (this.current() === '=') {
        this.advance();
        this.addToken(TokenType.STRICT_NOT_EQUALS, '!==', startLine, startColumn);
      } else {
        this.addToken(TokenType.NOT_EQUALS, '!=', startLine, startColumn);
      }
      return;
    }

    if (char === '<' && next === '=') {
      this.advance();
      this.advance();
      this.addToken(TokenType.LESS_THAN_EQUALS, '<=', startLine, startColumn);
      return;
    }

    if (char === '>' && next === '=') {
      this.advance();
      this.advance();
      this.addToken(TokenType.GREATER_THAN_EQUALS, '>=', startLine, startColumn);
      return;
    }

    if (char === '&' && next === '&') {
      this.advance();
      this.advance();
      this.addToken(TokenType.LOGICAL_AND, '&&', startLine, startColumn);
      return;
    }

    if (char === '|' && next === '|') {
      this.advance();
      this.advance();
      this.addToken(TokenType.LOGICAL_OR, '||', startLine, startColumn);
      return;
    }

    if (char === '+' && next === '=') {
      this.advance();
      this.advance();
      this.addToken(TokenType.PLUS_EQUALS, '+=', startLine, startColumn);
      return;
    }

    if (char === '-' && next === '=') {
      this.advance();
      this.advance();
      this.addToken(TokenType.MINUS_EQUALS, '-=', startLine, startColumn);
      return;
    }

    if (char === '=' && next === '>') {
      this.advance();
      this.advance();
      this.addToken(TokenType.ARROW, '=>', startLine, startColumn);
      return;
    }

    if (char === '.' && next === '.' && this.peek(2) === '.') {
      this.advance();
      this.advance();
      this.advance();
      this.addToken(TokenType.SPREAD, '...', startLine, startColumn);
      return;
    }

    // Single character operators
    const singleChar = this.advance();

    switch (singleChar) {
      case '+': this.addToken(TokenType.PLUS, singleChar, startLine, startColumn); break;
      case '-': this.addToken(TokenType.MINUS, singleChar, startLine, startColumn); break;
      case '*': this.addToken(TokenType.STAR, singleChar, startLine, startColumn); break;
      case '/': this.addToken(TokenType.SLASH, singleChar, startLine, startColumn); break;
      case '%': this.addToken(TokenType.PERCENT, singleChar, startLine, startColumn); break;
      case '=': this.addToken(TokenType.EQUALS, singleChar, startLine, startColumn); break;
      case '<': this.addToken(TokenType.LESS_THAN, singleChar, startLine, startColumn); break;
      case '>': this.addToken(TokenType.GREATER_THAN, singleChar, startLine, startColumn); break;
      case '!': this.addToken(TokenType.LOGICAL_NOT, singleChar, startLine, startColumn); break;
      case '&': this.addToken(TokenType.BITWISE_AND, singleChar, startLine, startColumn); break;
      case '|': this.addToken(TokenType.BITWISE_OR, singleChar, startLine, startColumn); break;
      case '^': this.addToken(TokenType.BITWISE_XOR, singleChar, startLine, startColumn); break;
      case '~': this.addToken(TokenType.BITWISE_NOT, singleChar, startLine, startColumn); break;
      case '?': this.addToken(TokenType.QUESTION, singleChar, startLine, startColumn); break;
      case ':': this.addToken(TokenType.COLON, singleChar, startLine, startColumn); break;
      case '.': this.addToken(TokenType.DOT, singleChar, startLine, startColumn); break;
      case '(': this.addToken(TokenType.LPAREN, singleChar, startLine, startColumn); break;
      case ')': this.addToken(TokenType.RPAREN, singleChar, startLine, startColumn); break;
      case '{': this.addToken(TokenType.LBRACE, singleChar, startLine, startColumn); break;
      case '}': this.addToken(TokenType.RBRACE, singleChar, startLine, startColumn); break;
      case '[': this.addToken(TokenType.LBRACKET, singleChar, startLine, startColumn); break;
      case ']': this.addToken(TokenType.RBRACKET, singleChar, startLine, startColumn); break;
      case ';': this.addToken(TokenType.SEMICOLON, singleChar, startLine, startColumn); break;
      case ',': this.addToken(TokenType.COMMA, singleChar, startLine, startColumn); break;
      default:
        throw new Error(`Unexpected character '${singleChar}' at line ${startLine}, column ${startColumn}`);
    }
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private addToken(type: TokenType, value: string, line?: number, column?: number): void {
    this.tokens.push({
      type,
      value,
      line: line ?? this.line,
      column: column ?? this.column,
    });
  }
}
