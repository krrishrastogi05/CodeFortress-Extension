# CodeFortress Simplified

This folder is a smaller interview-friendly version of CodeFortress. It keeps
the main idea of the original project: import a competitive programming problem,
store its sample tests, run the current program, compare output, and show the
statement plus judge results in a webview.

The code intentionally avoids online submission, telemetry, remote services, and
many language runtimes. It keeps the Competitive Companion server because that
is the useful end-to-end flow: browser problem page to VS Code file, statement,
and samples.

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

## Competitive Companion flow

1. Install the Competitive Companion browser extension.
2. Open this simplified extension in the Extension Development Host.
3. Open a normal workspace folder where solutions should be created.
4. Visit a Codeforces problem page and click the Competitive Companion button.
5. CodeFortress listens on port `10045`, creates a source file, saves the sample
   tests, and shows the imported problem statement in the Judge panel.

The browser import asks which of the four supported languages you want for the
new file. Online submit is intentionally not included.

## Main flow

1. Import a problem using Competitive Companion, or create a local problem.
2. Read the statement in the Judge panel.
3. Edit sample tests if needed.
4. Run one case or all cases.
5. The extension compiles when needed, runs the program, and compares the output.

Testcases are saved beside the source file in:

```text
.codefortress/<source-file-name>.json
```

## Why this version is easier to explain

- `extension.ts` registers commands, the webview, and the import server.
- `companionServer.ts` receives browser-extension problem JSON.
- `commands.ts` contains user actions.
- `languages.ts` detects the programming language.
- `compiler.ts` compiles only C++ and Java.
- `runner.ts` starts the program process and handles timeout.
- `judge.ts` compares expected and actual output.
- `problemStore.ts` saves and loads testcases.
- `JudgeView.ts` connects VS Code to the React UI.
