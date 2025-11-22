import { useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Compiler } from '@scriptrust/compiler';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Play, Code2, FileCode } from 'lucide-react';

const EXAMPLE_CODE = `// Welcome to ScriptRust!
// A hybrid language combining TypeScript and Rust features

// Rust-style decorations for variable immutability
[immutable: This value cannot be changed]
const message: string = "Hello, ScriptRust!";

// Function with ownership decoration
[ownership: borrowed]
function greet([immutable: parameter] name: string): string {
  return "Hello, " + name + "!";
}

// Class with lifetime decorations
class Counter {
  [mut: mutable field]
  count: number = 0;

  [pure: no side effects]
  increment(): number {
    this.count = this.count + 1;
    return this.count;
  }

  getValue(): number {
    return this.count;
  }
}

// Create and use the counter
const counter = new Counter();
counter.increment();
counter.increment();

// Log the results
console.log(greet("World"));
console.log("Counter value:", counter.getValue());
console.log(message);
`;

function App() {
  const [code, setCode] = useState(EXAMPLE_CODE);
  const [output, setOutput] = useState<string>('');
  const [compiledCode, setCompiledCode] = useState<string>('');
  const [ast, setAst] = useState<string>('');
  const [errors, setErrors] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('output');

  const runCode = useCallback(() => {
    const compiler = new Compiler();

    // Clear previous output
    setOutput('');
    setErrors('');
    setCompiledCode('');
    setAst('');

    // Capture console.log
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      logs.push(args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '));
      originalLog(...args);
    };

    try {
      const result = compiler.compile(code);

      if (result.errors.length > 0) {
        setErrors(result.errors.map(e => e.message).join('\n'));
        setActiveTab('errors');
      } else {
        setCompiledCode(result.code);
        setAst(JSON.stringify(result.ast, null, 2));

        // Execute the compiled code
        try {
          const fn = new Function(result.code);
          fn();
          setOutput(logs.join('\n') || 'Code executed successfully (no output)');
          setActiveTab('output');
        } catch (runtimeError: any) {
          setErrors(`Runtime Error: ${runtimeError.message}`);
          setActiveTab('errors');
        }
      }
    } catch (error: any) {
      setErrors(`Compilation Error: ${error.message}`);
      setActiveTab('errors');
    } finally {
      // Restore console.log
      console.log = originalLog;
    }
  }, [code]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileCode className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ScriptRust Playground
            </h1>
          </div>
          <p className="text-muted-foreground">
            A hybrid programming language combining TypeScript and Rust features through decorations
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor Panel */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                Code Editor
              </CardTitle>
              <CardDescription>
                Write ScriptRust code with TypeScript syntax and Rust-style decorations
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="border-t">
                <Editor
                  height="500px"
                  defaultLanguage="typescript"
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>
              <div className="p-4 border-t bg-muted/50">
                <Button onClick={runCode} className="w-full" size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  Run Code
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Output Panel */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                View output, compiled JavaScript, AST, or errors
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="output">Output</TabsTrigger>
                  <TabsTrigger value="compiled">JavaScript</TabsTrigger>
                  <TabsTrigger value="ast">AST</TabsTrigger>
                  <TabsTrigger value="errors">Errors</TabsTrigger>
                </TabsList>

                <TabsContent value="output" className="mt-4">
                  <div className="bg-slate-950 text-green-400 p-4 rounded-md font-mono text-sm h-[500px] overflow-auto">
                    {output || 'Run the code to see output here...'}
                  </div>
                </TabsContent>

                <TabsContent value="compiled" className="mt-4">
                  <div className="bg-slate-950 text-slate-100 p-4 rounded-md font-mono text-sm h-[500px] overflow-auto whitespace-pre">
                    {compiledCode || 'Compiled JavaScript will appear here...'}
                  </div>
                </TabsContent>

                <TabsContent value="ast" className="mt-4">
                  <div className="bg-slate-950 text-blue-300 p-4 rounded-md font-mono text-xs h-[500px] overflow-auto whitespace-pre">
                    {ast || 'Abstract Syntax Tree will appear here...'}
                  </div>
                </TabsContent>

                <TabsContent value="errors" className="mt-4">
                  <div className="bg-slate-950 text-red-400 p-4 rounded-md font-mono text-sm h-[500px] overflow-auto whitespace-pre">
                    {errors || 'No errors'}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Documentation */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>ScriptRust Features</CardTitle>
            <CardDescription>Learn about the language features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">TypeScript Compatibility</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Full TypeScript syntax support</li>
                  <li>• Type annotations and interfaces</li>
                  <li>• Classes and async/await</li>
                  <li>• Arrow functions and destructuring</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Rust-Style Decorations</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• [immutable: description] - Mark variables as immutable</li>
                  <li>• [mut: description] - Explicit mutability</li>
                  <li>• [ownership: borrowed/moved] - Ownership semantics</li>
                  <li>• [pure: description] - Pure functions with no side effects</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
