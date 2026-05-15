import path from 'path';
import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { CompileResult, Language } from './types';

function getConfigValue<T>(key: string, fallback: T): T {
  return vscode.workspace.getConfiguration('codefortress').get<T>(key, fallback);
}

function binaryPath(srcPath: string, language: Language): string {
  const parsed = path.parse(srcPath);
  if (language.id === 'java') {
    return path.join(parsed.dir, parsed.name);
  }

  const extension = process.platform === 'win32' ? '.exe' : '';
  return path.join(parsed.dir, `${parsed.name}.codefortress${extension}`);
}

export async function compileSource(srcPath: string, language: Language): Promise<CompileResult> {
  if (!language.compile) {
    return { ok: true, runPath: srcPath, stderr: '' };
  }

  if (language.id === 'cpp') {
    const compiler = getConfigValue('cppCompiler', 'g++');
    const outputPath = binaryPath(srcPath, language);
    return runCompiler(compiler, [srcPath, '-std=c++17', '-O2', '-o', outputPath], outputPath);
  }

  if (language.id === 'java') {
    const compiler = getConfigValue('javaCompiler', 'javac');
    return runCompiler(compiler, [srcPath], binaryPath(srcPath, language));
  }

  return {
    ok: false,
    runPath: srcPath,
    stderr: '',
    errorMessage: `No compiler rule exists for ${language.label}.`
  };
}

function runCompiler(command: string, args: string[], runPath: string): Promise<CompileResult> {
  return new Promise((resolve) => {
    let stderr = '';

    // Compiler output is collected instead of streamed so the UI can show one clean message.
    const compiler = spawn(command, args, { cwd: path.dirname(args[0]) });

    compiler.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    compiler.on('error', (error) => {
      resolve({
        ok: false,
        runPath,
        stderr,
        errorMessage: `Could not start compiler "${command}". ${error.message}`
      });
    });

    compiler.on('close', (code) => {
      if (code === 0) {
        resolve({ ok: true, runPath, stderr });
      } else {
        resolve({
          ok: false,
          runPath,
          stderr,
          errorMessage: `Compilation failed with exit code ${code}.`
        });
      }
    });
  });
}
