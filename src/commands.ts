import * as vscode from 'vscode';
import { compileSource } from './compiler';
import { outputsMatch } from './judge';
import { requireActiveSourceFile } from './languages';
import { createBlankProblem, createBlankTestCase, loadProblem, saveProblem } from './problemStore';
import { runProgram } from './runner';
import { Problem, RunResult, TestCase } from './types';
import { JudgeViewProvider } from './webview/JudgeView';

export class CommandController {
  constructor(private readonly judgeView: JudgeViewProvider) {}

  async createLocalProblem(): Promise<void> {
    const active = requireActiveSourceFile();
    if (!active) {
      return;
    }

    await active.editor.document.save();
    const existing = loadProblem(active.srcPath);
    const problem = existing ?? createBlankProblem(active.srcPath);
    saveProblem(problem);

    await this.judgeView.focus();
    this.judgeView.postMessage({ command: 'load-problem', problem });
  }

  async openJudge(): Promise<void> {
    await this.judgeView.focus();
    this.loadProblemForActiveEditor();
  }

  async runAllFromActiveEditor(): Promise<void> {
    const problem = await this.getOrCreateProblemForActiveEditor();
    if (!problem) {
      return;
    }

    await this.judgeView.focus();
    this.judgeView.postMessage({ command: 'load-problem', problem });
    await this.runAll(problem);
  }

  loadProblemForActiveEditor(): void {
    const active = requireActiveSourceFile();
    if (!active) {
      this.judgeView.postMessage({ command: 'load-problem', problem: undefined });
      return;
    }

    this.judgeView.postMessage({ command: 'load-problem', problem: loadProblem(active.srcPath) });
  }

  save(problem: Problem): void {
    saveProblem(problem);
  }

  addCase(problem: Problem): Problem {
    const updated = { ...problem, tests: [...problem.tests, createBlankTestCase()] };
    saveProblem(updated);
    this.judgeView.postMessage({ command: 'load-problem', problem: updated });
    return updated;
  }

  deleteCase(problem: Problem, id: number): Problem {
    const tests = problem.tests.filter((test) => test.id !== id);
    const updated = { ...problem, tests: tests.length > 0 ? tests : [createBlankTestCase()] };
    saveProblem(updated);
    this.judgeView.postMessage({ command: 'load-problem', problem: updated });
    return updated;
  }

  async runAll(problem: Problem): Promise<void> {
    saveProblem(problem);
    this.judgeView.postMessage({ command: 'run-started' });

    for (const test of problem.tests) {
      await this.runOne(problem, test.id);
    }

    this.judgeView.postMessage({ command: 'run-finished' });
  }

  async runOne(problem: Problem, id: number): Promise<void> {
    saveProblem(problem);

    const test = problem.tests.find((item) => item.id === id);
    if (!test) {
      return;
    }

    this.judgeView.postMessage({ command: 'case-running', id });

    const active = requireActiveSourceFile();
    const language = active?.srcPath === problem.srcPath ? active.language : undefined;
    if (!language) {
      this.judgeView.postMessage({ command: 'case-result', result: this.simpleError(test, 'runtime-error', 'Open the matching source file before running.') });
      return;
    }

    await vscode.workspace.openTextDocument(problem.srcPath).then((document) => document.save());
    const compiled = await compileSource(problem.srcPath, language);
    if (!compiled.ok) {
      this.judgeView.postMessage({
        command: 'case-result',
        result: this.simpleError(test, 'compile-error', compiled.errorMessage ?? 'Compilation failed.', compiled.stderr)
      });
      return;
    }

    const processResult = await runProgram(language, compiled.runPath, test.input);
    let status: RunResult['status'] = 'passed';
    let errorMessage = processResult.errorMessage;

    if (processResult.timedOut) {
      status = 'timeout';
    } else if (processResult.errorMessage || processResult.code !== 0) {
      status = 'runtime-error';
      errorMessage = errorMessage ?? `Program exited with code ${processResult.code}.`;
    } else if (!outputsMatch(test.expectedOutput, processResult.stdout)) {
      status = 'failed';
    }

    this.judgeView.postMessage({
      command: 'case-result',
      result: {
        id: test.id,
        status,
        actualOutput: processResult.stdout,
        stderr: processResult.stderr,
        timeMs: processResult.timeMs,
        errorMessage
      }
    });
  }

  private async getOrCreateProblemForActiveEditor(): Promise<Problem | undefined> {
    const active = requireActiveSourceFile();
    if (!active) {
      return undefined;
    }

    await active.editor.document.save();
    const problem = loadProblem(active.srcPath) ?? createBlankProblem(active.srcPath);
    saveProblem(problem);
    return problem;
  }

  private simpleError(test: TestCase, status: RunResult['status'], message: string, stderr = ''): RunResult {
    return {
      id: test.id,
      status,
      actualOutput: '',
      stderr,
      timeMs: 0,
      errorMessage: message
    };
  }
}
