import path from 'path';
import * as vscode from 'vscode';
import { Language } from './types';

const supportedLanguages: Record<string, Language> = {
  '.cpp': { id: 'cpp', label: 'C++', extension: '.cpp', compile: true },
  '.py': { id: 'python', label: 'Python', extension: '.py', compile: false },
  '.java': { id: 'java', label: 'Java', extension: '.java', compile: true },
  '.js': { id: 'javascript', label: 'JavaScript', extension: '.js', compile: false }
};

export function getLanguage(srcPath: string): Language | undefined {
  return supportedLanguages[path.extname(srcPath).toLowerCase()];
}

export function requireActiveSourceFile(): { editor: vscode.TextEditor; srcPath: string; language: Language } | undefined {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage('Open a source file before running CodeFortress.');
    return undefined;
  }

  const srcPath = editor.document.fileName;
  const language = getLanguage(srcPath);
  if (!language) {
    vscode.window.showErrorMessage('Unsupported file. Use .cpp, .py, .java, or .js.');
    return undefined;
  }

  return { editor, srcPath, language };
}

export function supportedExtensionList(): string {
  return Object.values(supportedLanguages).map((lang) => lang.extension).join(', ');
}
