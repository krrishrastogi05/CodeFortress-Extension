import * as vscode from 'vscode';
import { ExtensionToWebviewMessage, Problem, WebviewToExtensionMessage } from '../types';

type JudgeController = {
  loadProblemForActiveEditor: () => void;
  save: (problem: Problem) => void;
  runAll: (problem: Problem) => void;
  runOne: (problem: Problem, id: number) => void;
  addCase: (problem: Problem) => void;
  deleteCase: (problem: Problem, id: number) => void;
};

export class JudgeViewProvider implements vscode.WebviewViewProvider {
  static readonly viewType = 'codefortress.judgeView';

  private view?: vscode.WebviewView;
  private controller?: JudgeController;
  private pendingMessages: ExtensionToWebviewMessage[] = [];

  constructor(private readonly extensionUri: vscode.Uri) {}

  setController(controller: JudgeController): void {
    this.controller = controller;
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    webviewView.webview.html = this.html(webviewView.webview);
    webviewView.webview.onDidReceiveMessage((message: WebviewToExtensionMessage) => this.handleMessage(message));

    this.controller?.loadProblemForActiveEditor();
    for (const message of this.pendingMessages) {
      webviewView.webview.postMessage(message);
    }
    this.pendingMessages = [];
  }

  async focus(): Promise<void> {
    if (!this.view) {
      await vscode.commands.executeCommand('codefortress.judgeView.focus');
      return;
    }

    this.view.show?.(true);
  }

  postMessage(message: ExtensionToWebviewMessage): void {
    if (!this.view) {
      this.pendingMessages.push(message);
      return;
    }

    this.view.webview.postMessage(message);
  }

  private handleMessage(message: WebviewToExtensionMessage): void {
    if (!this.controller) {
      return;
    }

    switch (message.command) {
      case 'save-problem':
        this.controller.save(message.problem);
        break;
      case 'run-all':
        this.controller.runAll(message.problem);
        break;
      case 'run-one':
        this.controller.runOne(message.problem, message.id);
        break;
      case 'add-case':
        this.controller.addCase(message.problem);
        break;
      case 'delete-case':
        this.controller.deleteCase(message.problem, message.id);
        break;
    }
  }

  private html(webview: vscode.Webview): string {
    const nonce = getNonce();
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'dist', 'frontend.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'dist', 'app.css'));
    const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'dist', 'codicon.css'));

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource}; img-src ${webview.cspSource} https: data:; script-src 'nonce-${nonce}' https://cdn.jsdelivr.net;" />
  <link rel="stylesheet" href="${codiconsUri}" />
  <link rel="stylesheet" href="${styleUri}" />
  <title>CodeFortress</title>
  <script nonce="${nonce}">
    window.MathJax = {
      tex: { inlineMath: [['$$$', '$$$'], ['\\\\(', '\\\\)']], displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']] },
      options: { skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'] },
      startup: { typeset: false }
    };
  </script>
  <script nonce="${nonce}" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"></script>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}
