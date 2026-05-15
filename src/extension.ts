import * as vscode from 'vscode';
import { CommandController } from './commands';
import { JudgeViewProvider } from './webview/JudgeView';

export function activate(context: vscode.ExtensionContext): void {
  const judgeView = new JudgeViewProvider(context.extensionUri);
  const commands = new CommandController(judgeView);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(JudgeViewProvider.viewType, judgeView),
    vscode.commands.registerCommand('codefortress.runTestCases', () => commands.runAllFromActiveEditor()),
    vscode.commands.registerCommand('codefortress.openJudge', () => commands.openJudge()),
    vscode.commands.registerCommand('codefortress.createLocalProblem', () => commands.createLocalProblem())
  );

  judgeView.setController(commands);

  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  status.text = '$(run-all) Run Test Cases';
  status.command = 'codefortress.runTestCases';
  status.tooltip = 'Run the current file against saved CodeFortress test cases.';
  status.show();
  context.subscriptions.push(status);
}

export function deactivate(): void {
  // Nothing to clean up in the simplified version.
}
