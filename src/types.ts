export type LanguageId = 'cpp' | 'python' | 'java' | 'javascript';

export type Language = {
  id: LanguageId;
  label: string;
  extension: string;
  compile: boolean;
};

export type TestCase = {
  id: number;
  input: string;
  expectedOutput: string;
};

export type Problem = {
  name: string;
  srcPath: string;
  url?: string;
  group?: string;
  timeLimit?: number;
  memoryLimit?: number;
  problemStatement?: string;
  tests: TestCase[];
};

export type CompanionTest = {
  input: string;
  output: string;
};

export type CompanionProblem = {
  name: string;
  url: string;
  group?: string;
  timeLimit?: number;
  memoryLimit?: number;
  interactive?: boolean;
  tests: CompanionTest[];
  problemStatement?: string;
};

export type RunStatus = 'passed' | 'failed' | 'compile-error' | 'runtime-error' | 'timeout';

export type RunResult = {
  id: number;
  status: RunStatus;
  actualOutput: string;
  stderr: string;
  timeMs: number;
  errorMessage?: string;
};

export type ExtensionToWebviewMessage =
  | { command: 'load-problem'; problem?: Problem }
  | { command: 'case-running'; id: number }
  | { command: 'case-result'; result: RunResult }
  | { command: 'run-started' }
  | { command: 'run-finished' };

export type WebviewToExtensionMessage =
  | { command: 'save-problem'; problem: Problem }
  | { command: 'run-all'; problem: Problem }
  | { command: 'run-one'; problem: Problem; id: number }
  | { command: 'add-case'; problem: Problem }
  | { command: 'delete-case'; problem: Problem; id: number };

export type CompileResult = {
  ok: boolean;
  runPath: string;
  stderr: string;
  errorMessage?: string;
};

export type ProcessResult = {
  stdout: string;
  stderr: string;
  code: number | null;
  signal: NodeJS.Signals | null;
  timeMs: number;
  timedOut: boolean;
  errorMessage?: string;
};
