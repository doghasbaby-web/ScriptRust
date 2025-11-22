/**
 * ScriptRust AST Node Definitions
 */

export interface Position {
  line: number;
  column: number;
}

export interface BaseNode {
  type: string;
  position?: Position;
  decorations?: Decoration[];
}

export interface Decoration {
  keyword: string;
  description: string;
}

// Program
export interface Program extends BaseNode {
  type: 'Program';
  body: Statement[];
}

// Statements
export type Statement =
  | VariableDeclaration
  | FunctionDeclaration
  | ClassDeclaration
  | InterfaceDeclaration
  | TypeAliasDeclaration
  | ExpressionStatement
  | ReturnStatement
  | IfStatement
  | WhileStatement
  | ForStatement
  | BlockStatement
  | ImportDeclaration
  | ExportDeclaration
  | TryStatement
  | ThrowStatement;

export interface VariableDeclaration extends BaseNode {
  type: 'VariableDeclaration';
  kind: 'let' | 'const' | 'var';
  declarations: VariableDeclarator[];
}

export interface VariableDeclarator extends BaseNode {
  type: 'VariableDeclarator';
  id: Identifier;
  init?: Expression;
  typeAnnotation?: TypeAnnotation;
}

export interface FunctionDeclaration extends BaseNode {
  type: 'FunctionDeclaration';
  id: Identifier;
  params: Parameter[];
  body: BlockStatement;
  returnType?: TypeAnnotation;
  isAsync?: boolean;
}

export interface Parameter extends BaseNode {
  type: 'Parameter';
  id: Identifier;
  typeAnnotation?: TypeAnnotation;
  defaultValue?: Expression;
}

export interface ClassDeclaration extends BaseNode {
  type: 'ClassDeclaration';
  id: Identifier;
  superClass?: Identifier;
  body: ClassBody;
}

export interface ClassBody extends BaseNode {
  type: 'ClassBody';
  body: (MethodDefinition | PropertyDefinition)[];
}

export interface MethodDefinition extends BaseNode {
  type: 'MethodDefinition';
  key: Identifier;
  value: FunctionExpression;
  kind: 'constructor' | 'method';
  isStatic?: boolean;
}

export interface PropertyDefinition extends BaseNode {
  type: 'PropertyDefinition';
  key: Identifier;
  value?: Expression;
  typeAnnotation?: TypeAnnotation;
  isStatic?: boolean;
}

export interface InterfaceDeclaration extends BaseNode {
  type: 'InterfaceDeclaration';
  id: Identifier;
  body: InterfaceBody;
}

export interface InterfaceBody extends BaseNode {
  type: 'InterfaceBody';
  body: PropertySignature[];
}

export interface PropertySignature extends BaseNode {
  type: 'PropertySignature';
  key: Identifier;
  typeAnnotation?: TypeAnnotation;
  optional?: boolean;
}

export interface TypeAliasDeclaration extends BaseNode {
  type: 'TypeAliasDeclaration';
  id: Identifier;
  typeAnnotation: TypeAnnotation;
}

export interface ExpressionStatement extends BaseNode {
  type: 'ExpressionStatement';
  expression: Expression;
}

export interface ReturnStatement extends BaseNode {
  type: 'ReturnStatement';
  argument?: Expression;
}

export interface IfStatement extends BaseNode {
  type: 'IfStatement';
  test: Expression;
  consequent: Statement;
  alternate?: Statement;
}

export interface WhileStatement extends BaseNode {
  type: 'WhileStatement';
  test: Expression;
  body: Statement;
}

export interface ForStatement extends BaseNode {
  type: 'ForStatement';
  init?: VariableDeclaration | Expression;
  test?: Expression;
  update?: Expression;
  body: Statement;
}

export interface BlockStatement extends BaseNode {
  type: 'BlockStatement';
  body: Statement[];
}

export interface ImportDeclaration extends BaseNode {
  type: 'ImportDeclaration';
  specifiers: ImportSpecifier[];
  source: StringLiteral;
}

export interface ImportSpecifier extends BaseNode {
  type: 'ImportSpecifier';
  imported: Identifier;
  local?: Identifier;
}

export interface ExportDeclaration extends BaseNode {
  type: 'ExportDeclaration';
  declaration: Statement;
}

export interface TryStatement extends BaseNode {
  type: 'TryStatement';
  block: BlockStatement;
  handler?: CatchClause;
  finalizer?: BlockStatement;
}

export interface CatchClause extends BaseNode {
  type: 'CatchClause';
  param?: Identifier;
  body: BlockStatement;
}

export interface ThrowStatement extends BaseNode {
  type: 'ThrowStatement';
  argument: Expression;
}

// Expressions
export type Expression =
  | Identifier
  | Literal
  | BinaryExpression
  | UnaryExpression
  | AssignmentExpression
  | CallExpression
  | MemberExpression
  | ArrayExpression
  | ObjectExpression
  | FunctionExpression
  | ArrowFunctionExpression
  | ConditionalExpression
  | NewExpression
  | ThisExpression
  | AwaitExpression;

export interface Identifier extends BaseNode {
  type: 'Identifier';
  name: string;
}

export type Literal = StringLiteral | NumberLiteral | BooleanLiteral | NullLiteral;

export interface StringLiteral extends BaseNode {
  type: 'StringLiteral';
  value: string;
}

export interface NumberLiteral extends BaseNode {
  type: 'NumberLiteral';
  value: number;
}

export interface BooleanLiteral extends BaseNode {
  type: 'BooleanLiteral';
  value: boolean;
}

export interface NullLiteral extends BaseNode {
  type: 'NullLiteral';
  value: null;
}

export interface BinaryExpression extends BaseNode {
  type: 'BinaryExpression';
  left: Expression;
  operator: string;
  right: Expression;
}

export interface UnaryExpression extends BaseNode {
  type: 'UnaryExpression';
  operator: string;
  argument: Expression;
  prefix: boolean;
}

export interface AssignmentExpression extends BaseNode {
  type: 'AssignmentExpression';
  left: Expression;
  operator: string;
  right: Expression;
}

export interface CallExpression extends BaseNode {
  type: 'CallExpression';
  callee: Expression;
  arguments: Expression[];
}

export interface MemberExpression extends BaseNode {
  type: 'MemberExpression';
  object: Expression;
  property: Expression;
  computed: boolean;
}

export interface ArrayExpression extends BaseNode {
  type: 'ArrayExpression';
  elements: Expression[];
}

export interface ObjectExpression extends BaseNode {
  type: 'ObjectExpression';
  properties: Property[];
}

export interface Property extends BaseNode {
  type: 'Property';
  key: Expression;
  value: Expression;
  shorthand?: boolean;
}

export interface FunctionExpression extends BaseNode {
  type: 'FunctionExpression';
  id?: Identifier;
  params: Parameter[];
  body: BlockStatement;
  returnType?: TypeAnnotation;
  isAsync?: boolean;
}

export interface ArrowFunctionExpression extends BaseNode {
  type: 'ArrowFunctionExpression';
  params: Parameter[];
  body: BlockStatement | Expression;
  returnType?: TypeAnnotation;
  isAsync?: boolean;
}

export interface ConditionalExpression extends BaseNode {
  type: 'ConditionalExpression';
  test: Expression;
  consequent: Expression;
  alternate: Expression;
}

export interface NewExpression extends BaseNode {
  type: 'NewExpression';
  callee: Expression;
  arguments: Expression[];
}

export interface ThisExpression extends BaseNode {
  type: 'ThisExpression';
}

export interface AwaitExpression extends BaseNode {
  type: 'AwaitExpression';
  argument: Expression;
}

// Type Annotations
export interface TypeAnnotation extends BaseNode {
  type: 'TypeAnnotation';
  typeAnnotation: TSType;
}

export type TSType =
  | TSStringKeyword
  | TSNumberKeyword
  | TSBooleanKeyword
  | TSVoidKeyword
  | TSAnyKeyword
  | TSArrayType
  | TSFunctionType
  | TSTypeReference
  | TSUnionType
  | TSIntersectionType;

export interface TSStringKeyword extends BaseNode {
  type: 'TSStringKeyword';
}

export interface TSNumberKeyword extends BaseNode {
  type: 'TSNumberKeyword';
}

export interface TSBooleanKeyword extends BaseNode {
  type: 'TSBooleanKeyword';
}

export interface TSVoidKeyword extends BaseNode {
  type: 'TSVoidKeyword';
}

export interface TSAnyKeyword extends BaseNode {
  type: 'TSAnyKeyword';
}

export interface TSArrayType extends BaseNode {
  type: 'TSArrayType';
  elementType: TSType;
}

export interface TSFunctionType extends BaseNode {
  type: 'TSFunctionType';
  parameters: Parameter[];
  returnType: TSType;
}

export interface TSTypeReference extends BaseNode {
  type: 'TSTypeReference';
  typeName: Identifier;
}

export interface TSUnionType extends BaseNode {
  type: 'TSUnionType';
  types: TSType[];
}

export interface TSIntersectionType extends BaseNode {
  type: 'TSIntersectionType';
  types: TSType[];
}
