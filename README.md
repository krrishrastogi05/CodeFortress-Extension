# CodeFortress Simplified

This folder is a smaller interview-friendly version of CodeFortress. It keeps
the main idea of the original project: a VS Code extension that stores test
cases, runs the current program, compares output, and shows the result in a
webview.

The code intentionally avoids production integrations such as Competitive
Companion, online submission, telemetry, remote services, and many language
runtimes. That keeps the architecture easy to explain in a college project or
interview.

## Supported languages

- C++ (`.cpp`) using `g++`
- Python (`.py`) using `python`
- Java (`.java`) using `javac` and `java`
- JavaScript (`.js`) using `node`

## How to run

```bash
npm install
npm run compile
npm run webpack
```

Then open this folder in VS Code and press `F5` to launch an Extension
Development Host.

## Main flow

1. Open a supported source file.
2. Run `CodeFortress: Create Local Problem` to create a testcase file.
3. Add input and expected output in the Judge panel.
4. Run one case or all cases.
5. The extension compiles when needed, runs the program, and compares the output.

Testcases are saved beside the source file in:

```text
.codefortress/<source-file-name>.json
```

## Why this version is easier to explain

- `extension.ts` registers commands and the webview.
- `commands.ts` contains user actions.
- `languages.ts` detects the programming language.
- `compiler.ts` compiles only C++ and Java.
- `runner.ts` starts the program process and handles timeout.
- `judge.ts` compares expected and actual output.
- `problemStore.ts` saves and loads testcases.
- `JudgeView.ts` connects VS Code to the React UI.
