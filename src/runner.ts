import path from 'path';
import { spawn } from 'child_process';
import * as vscode from 'vscode';
import { Language, ProcessResult } from './types';

function getConfigValue<T>(key: string, fallback: T): T {
  return vscode.workspace.getConfiguration('codefortress').get<T>(key, fallback);
}

export function runProgram(language: Language, runPath: string, input: string): Promise<ProcessResult> {
  const timeoutMs = getConfigValue('timeoutMs', 3000);
  const startedAt = Date.now();
  const command = getRunCommand(language, runPath);
  const args = getRunArgs(language, runPath);

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let finished = false;

    const child = spawn(command, args, { cwd: path.dirname(runPath) });

    const finish = (result: Omit<ProcessResult, 'timeMs'>) => {
      if (finished) {
        return;
      }

      finished = true;
      clearTimeout(timer);
      resolve({ ...result, timeMs: Date.now() - startedAt });
    };

    const timer = setTimeout(() => {
      child.kill();
      finish({
        stdout,
        stderr,
        code: null,
        signal: null,
        timedOut: true,
        errorMessage: `Program took more than ${timeoutMs}ms.`
      });
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      finish({
        stdout,
        stderr,
        code: 1,
        signal: null,
        timedOut: false,
        errorMessage: `Could not start "${command}". ${error.message}`
      });
    });

    child.on('close', (code, signal) => {
      finish({
        stdout,
        stderr,
        code,
        signal,
        timedOut: false
      });
    });

    // Every testcase is just text piped into stdin, which is the same way most
    // online judges run solutions.
    child.stdin.write(input);
    child.stdin.end();
  });
}

function getRunCommand(language: Language, runPath: string): string {
  switch (language.id) {
    case 'python':
      return getConfigValue('pythonCommand', 'python');
    case 'javascript':
      return getConfigValue('nodeCommand', 'node');
    case 'java':
      return getConfigValue('javaCommand', 'java');
    case 'cpp':
      return runPath;
  }
}

function getRunArgs(language: Language, runPath: string): string[] {
  switch (language.id) {
    case 'python':
    case 'javascript':
      return [runPath];
    case 'java':
      return ['-cp', path.dirname(runPath), path.basename(runPath)];
    case 'cpp':
      return [];
  }
}
