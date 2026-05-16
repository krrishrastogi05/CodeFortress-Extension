# CodeFortress

[![Downloads](https://img.shields.io/visual-studio-marketplace/d/KrishRastogi.codefortress)](https://marketplace.visualstudio.com/items?itemName=KrishRastogi.codefortress)

Quickly compile, run and judge competitive programming problems in VS Code.
Automatically download testcases, or write & test your own problems. Once you
are done, easily submit your solutions directly with the click of a button!

CodeFortress supports a large number of popular platforms like Codeforces, Codechef,
TopCoder etc. with the help of the Competitive Companion browser extension.

## Quick start

1. [Install CodeFortress](https://marketplace.visualstudio.com/items?itemName=KrishRastogi.codefortress)
   in VS Code and open any folder.
1. [Install Competitive Companion](https://github.com/jmerle/competitive-companion#readme)
   in your browser.
1. Use Companion by pressing the green plus (+) circle from the browser toolbar
   when visiting any problem page.
1. The file opens in VS Code with testcases preloaded. Press
   <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>B</kbd> to run them.

-   (Optional) Install the [cph-submit](https://github.com/agrawal-d/cph-submit)
    browser extension to enable submitting directly on CodeForces.
-   (Optional) Install submit client and config file from the
    [Kattis help page](https://open.kattis.com/help/submit) after logging in.

You can also use this extension locally — just open any supported file and press
'Run Testcases' (<kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>B</kbd>) to manually
enter testcases.

## Features

-   LeetCode-inspired dark/light UI with smooth theme switching.
-   Automatic compilation with display for compilation errors.
-   Intelligent judge with support for signals, timeouts and runtime errors.
-   Problem statement viewer with rendered math (MathJax) and inline code chips.
-   Works with Competitive Companion.
-   Codeforces auto-submit integration.
-   [Kattis auto-submit](docs/user-guide.md) integration.
-   Works locally for your own problems.
-   Support for several languages.

# User flow diagram 
<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/ed0c94a3-e01c-4216-b78d-31aac7431067" />


# Architecture diagram 
<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/af2f3119-01cd-4ae3-8064-c2e80ade85d3" />

## Order to read 
extension.ts
    ↓
companion.ts
    ↓
parser/storage
    ↓
Judge Webview
    ↓
runTestCases.ts
    ↓
compiler.ts
    ↓
executions.ts
    ↓
judge/comparator

## Supported Languages

-   C++
-   C
-   C#
-   Rust
-   Go
-   Haskell
-   Python
-   Ruby
-   Java
-   JavaScript (Node.js)
-   Cangjie

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>B</kbd> | Run test cases |
| <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>S</kbd> | Submit to Codeforces |
| <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>D</kbd> | Focus judge panel |

## License

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with
this program. If not, see https://www.gnu.org/licenses/.
