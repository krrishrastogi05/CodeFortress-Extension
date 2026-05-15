import http from 'http';
import fs from 'fs';
import path from 'path';
import * as vscode from 'vscode';
import { problemFromCompanion, saveProblem } from './problemStore';
import { CompanionProblem, LanguageId } from './types';
import { JudgeViewProvider } from './webview/JudgeView';

export function startCompanionServer(judgeView: JudgeViewProvider): http.Server {
  const companionPort = vscode.workspace.getConfiguration('codefortress').get<number>('companionPort', 10045);
  const server = http.createServer((request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', 'content-type');
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

    if (request.method === 'OPTIONS') {
      response.writeHead(204);
      response.end();
      return;
    }

    if (request.method !== 'POST') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ ok: true, message: 'CodeFortress server is running.' }));
      return;
    }

    let body = '';
    request.on('data', (chunk) => {
      body += chunk.toString();
    });

    request.on('end', async () => {
      try {
        const companionProblem = JSON.parse(body) as CompanionProblem;
        await importCompanionProblem(companionProblem, judgeView);
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ ok: true }));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`CodeFortress could not import the problem: ${message}`);
        response.writeHead(400, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ ok: false, error: message }));
      }
    });
  });

  server.listen(companionPort, () => {
    console.log(`CodeFortress Companion server listening on ${companionPort}`);
  });

  server.on('error', (error) => {
    vscode.window.showWarningMessage(`CodeFortress Companion server could not start on port ${companionPort}: ${error.message}`);
  });

  return server;
}

async function importCompanionProblem(companionProblem: CompanionProblem, judgeView: JudgeViewProvider): Promise<void> {
  const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!folder) {
    throw new Error('Open a VS Code folder before importing a problem.');
  }

  const languageId = await chooseLanguage();
  if (!languageId) {
    throw new Error('Problem import cancelled.');
  }

  const fileBaseName = languageId === 'java' ? javaClassName(companionProblem.name) : safeFileName(companionProblem.name);
  const srcPath = path.join(folder, `${fileBaseName}${extensionForLanguage(languageId)}`);
  if (!fs.existsSync(srcPath)) {
    fs.writeFileSync(srcPath, starterCode(languageId, companionProblem.name));
  }

  const problem = problemFromCompanion(srcPath, companionProblem);
  saveProblem(problem);

  const document = await vscode.workspace.openTextDocument(srcPath);
  await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
  await judgeView.focus();
  judgeView.postMessage({ command: 'load-problem', problem });
}

async function chooseLanguage(): Promise<LanguageId | undefined> {
  const picked = await vscode.window.showQuickPick(
    [
      { label: 'C++', language: 'cpp' as const },
      { label: 'Python', language: 'python' as const },
      { label: 'Java', language: 'java' as const },
      { label: 'JavaScript', language: 'javascript' as const }
    ],
    { placeHolder: 'Choose the language for the imported problem file' }
  );

  return picked?.language;
}

function extensionForLanguage(language: LanguageId): string {
  switch (language) {
    case 'cpp':
      return '.cpp';
    case 'python':
      return '.py';
    case 'java':
      return '.java';
    case 'javascript':
      return '.js';
  }
}

function starterCode(language: LanguageId, problemName: string): string {
  if (language === 'cpp') {
    return '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    return 0;\n}\n';
  }

  if (language === 'python') {
    return '# Write your solution here.\n';
  }

  if (language === 'java') {
    return `import java.util.*;\n\npublic class ${javaClassName(problemName)} {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        scanner.close();\n    }\n}\n`;
  }

  return "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8');\n";
}

function safeFileName(value: string): string {
  const cleaned = value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').replace(/\s+/g, '_');
  return cleaned.slice(0, 80) || 'problem';
}

function javaClassName(problemName: string): string {
  const base = safeFileName(problemName).replace(/[^A-Za-z0-9_]/g, '_');
  const className = base.replace(/^[^A-Za-z_]+/, '') || 'Main';
  return className;
}
