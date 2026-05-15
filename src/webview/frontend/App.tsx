import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ExtensionToWebviewMessage, Problem, RunResult, TestCase, WebviewToExtensionMessage } from '../../types';

declare function acquireVsCodeApi(): {
  postMessage: (message: WebviewToExtensionMessage) => void;
  getState: () => { problem?: Problem; results?: Record<number, RunResult> } | undefined;
  setState: (state: { problem?: Problem; results?: Record<number, RunResult> }) => void;
};

const vscode = acquireVsCodeApi();

function App() {
  const savedState = vscode.getState();
  const [problem, setProblem] = useState<Problem | undefined>(savedState?.problem);
  const [results, setResults] = useState<Record<number, RunResult>>(savedState?.results ?? {});
  const [runningIds, setRunningIds] = useState<Set<number>>(new Set());
  const [runningAll, setRunningAll] = useState(false);
  const [activeTab, setActiveTab] = useState<'statement' | 'tests'>('statement');
  const saveTimer = useRef<NodeJS.Timeout | undefined>();

  useEffect(() => {
    const handler = (event: MessageEvent<ExtensionToWebviewMessage>) => {
      const message = event.data;

      switch (message.command) {
        case 'load-problem':
          setProblem(message.problem);
          setResults({});
          setRunningIds(new Set());
          setActiveTab(message.problem?.problemStatement ? 'statement' : 'tests');
          break;
        case 'case-running':
          setRunningIds((current) => new Set(current).add(message.id));
          setActiveTab('tests');
          break;
        case 'case-result':
          setRunningIds((current) => {
            const next = new Set(current);
            next.delete(message.result.id);
            return next;
          });
          setResults((current) => ({ ...current, [message.result.id]: message.result }));
          break;
        case 'run-started':
          setRunningAll(true);
          break;
        case 'run-finished':
          setRunningAll(false);
          break;
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    vscode.setState({ problem, results });
  }, [problem, results]);

  useEffect(() => {
    if (!problem) {
      return;
    }

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    saveTimer.current = setTimeout(() => {
      vscode.postMessage({ command: 'save-problem', problem });
    }, 400);
  }, [problem]);

  const passCount = useMemo(() => {
    return Object.values(results).filter((result) => result.status === 'passed').length;
  }, [results]);

  if (!problem) {
    return (
      <main className="empty">
        <h1>CodeFortress</h1>
        <p>Open a supported file and run Create Local Problem.</p>
      </main>
    );
  }

  const updateTest = (id: number, patch: Partial<TestCase>) => {
    setProblem((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        tests: current.tests.map((test) => (test.id === id ? { ...test, ...patch } : test))
      };
    });
  };

  const runAll = () => {
    vscode.postMessage({ command: 'run-all', problem });
  };

  const runOne = (id: number) => {
    vscode.postMessage({ command: 'run-one', problem, id });
  };

  const addCase = () => {
    vscode.postMessage({ command: 'add-case', problem });
  };

  const deleteCase = (id: number) => {
    vscode.postMessage({ command: 'delete-case', problem, id });
  };

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <h1>CodeFortress</h1>
          <p>{problem.name}</p>
        </div>
        <div className="summary">
          <span>{passCount}/{problem.tests.length} passed</span>
          <div className="tabs">
            <button className={activeTab === 'statement' ? 'selected' : ''} onClick={() => setActiveTab('statement')}>
              Statement
            </button>
            <button className={activeTab === 'tests' ? 'selected' : ''} onClick={() => setActiveTab('tests')}>
              Tests
            </button>
          </div>
          <button className="primary" disabled={runningAll || runningIds.size > 0} onClick={runAll}>
            <span className="codicon codicon-run-all" />
            {runningAll ? 'Running' : 'Run All'}
          </button>
        </div>
      </header>

      {activeTab === 'statement' ? (
        <ProblemStatement problem={problem} />
      ) : (
        <section className="cases">
          {problem.tests.map((test, index) => (
            <CaseCard
              key={test.id}
              index={index}
              test={test}
              result={results[test.id]}
              isRunning={runningIds.has(test.id)}
              onChange={updateTest}
              onRun={runOne}
              onDelete={deleteCase}
            />
          ))}
        </section>
      )}

      <footer className="footer">
        <button onClick={addCase}>
          <span className="codicon codicon-add" />
          Add Case
        </button>
      </footer>
    </main>
  );
}

function ProblemStatement({ problem }: { problem: Problem }) {
  const statementRef = useRef<HTMLDivElement>(null);
  const html = useMemo(() => sanitizeStatement(problem.problemStatement ?? ''), [problem.problemStatement]);

  useEffect(() => {
    const element = statementRef.current;
    if (!element) {
      return;
    }

    element.querySelectorAll('img').forEach((image) => {
      image.setAttribute('loading', 'lazy');
    });

    const mathJax = (window as unknown as { MathJax?: { typesetClear?: (elements: HTMLElement[]) => void; typesetPromise?: (elements: HTMLElement[]) => Promise<void> } }).MathJax;
    mathJax?.typesetClear?.([element]);
    mathJax?.typesetPromise?.([element]).catch(console.error);
  }, [html]);

  return (
    <section className="statement">
      <div className="statement-meta">
        {problem.url && (
          <a href={problem.url}>
            <span className="codicon codicon-link-external" />
            Source
          </a>
        )}
        {problem.timeLimit !== undefined && <span>Time: {problem.timeLimit}ms</span>}
        {problem.memoryLimit !== undefined && <span>Memory: {problem.memoryLimit}MB</span>}
      </div>

      {html ? (
        <div ref={statementRef} className="statement-html" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <div className="statement-empty">
          <h2>No imported statement yet</h2>
          <p>Use Competitive Companion on a Codeforces problem page to import the statement and sample tests.</p>
        </div>
      )}
    </section>
  );
}

function sanitizeStatement(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<link\b[^>]*\brel=["']?stylesheet["']?[^>]*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .replace(/<span\b[^>]*class="[^"]*MathJax_Preview[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
    .replace(/<div\b[^>]*class="[^"]*input-output-copier[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
}

function CaseCard(props: {
  index: number;
  test: TestCase;
  result?: RunResult;
  isRunning: boolean;
  onChange: (id: number, patch: Partial<TestCase>) => void;
  onRun: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const { index, test, result, isRunning, onChange, onRun, onDelete } = props;
  const status = isRunning ? 'running' : result?.status ?? 'ready';

  return (
    <article className={`case-card ${status}`}>
      <div className="case-head">
        <div>
          <h2>Case {index + 1}</h2>
          <span className="badge">{labelForStatus(status)}</span>
          {result && <span className="time">{result.timeMs}ms</span>}
        </div>
        <div className="actions">
          <button title="Run this case" disabled={isRunning} onClick={() => onRun(test.id)}>
            <span className={`codicon ${isRunning ? 'codicon-loading codicon-modifier-spin' : 'codicon-play'}`} />
          </button>
          <button title="Delete this case" onClick={() => onDelete(test.id)}>
            <span className="codicon codicon-trash" />
          </button>
        </div>
      </div>

      <div className="io-grid">
        <label>
          Input
          <textarea value={test.input} onChange={(event) => onChange(test.id, { input: event.target.value })} />
        </label>
        <label>
          Expected Output
          <textarea value={test.expectedOutput} onChange={(event) => onChange(test.id, { expectedOutput: event.target.value })} />
        </label>
      </div>

      {result && (
        <div className="result">
          <label>
            Actual Output
            <pre>{result.actualOutput || '(no output)'}</pre>
          </label>
          {result.stderr && (
            <label>
              Stderr
              <pre>{result.stderr}</pre>
            </label>
          )}
          {result.errorMessage && <p className="error-message">{result.errorMessage}</p>}
        </div>
      )}
    </article>
  );
}

function labelForStatus(status: string): string {
  switch (status) {
    case 'passed':
      return 'Passed';
    case 'failed':
      return 'Wrong Answer';
    case 'compile-error':
      return 'Compile Error';
    case 'runtime-error':
      return 'Runtime Error';
    case 'timeout':
      return 'Timeout';
    case 'running':
      return 'Running';
    default:
      return 'Ready';
  }
}

createRoot(document.getElementById('root')!).render(<App />);
