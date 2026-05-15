import fs from 'fs';
import path from 'path';
import { CompanionProblem, Problem, TestCase } from './types';

function storageFolder(srcPath: string): string {
  return path.join(path.dirname(srcPath), '.codefortress');
}

export function problemFilePath(srcPath: string): string {
  return path.join(storageFolder(srcPath), `${path.basename(srcPath)}.json`);
}

export function createBlankProblem(srcPath: string): Problem {
  return {
    name: path.basename(srcPath),
    srcPath,
    tests: [createBlankTestCase()]
  };
}

export function problemFromCompanion(srcPath: string, companion: CompanionProblem): Problem {
  return {
    name: companion.name,
    srcPath,
    url: companion.url,
    group: companion.group,
    timeLimit: companion.timeLimit,
    memoryLimit: companion.memoryLimit,
    problemStatement: companion.problemStatement,
    tests: companion.tests.map((test, index) => ({
      id: Date.now() + index,
      input: test.input,
      expectedOutput: test.output
    }))
  };
}

export function createBlankTestCase(): TestCase {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    input: '',
    expectedOutput: ''
  };
}

export function loadProblem(srcPath: string): Problem | undefined {
  const filePath = problemFilePath(srcPath);
  if (!fs.existsSync(filePath)) {
    return undefined;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const problem = JSON.parse(raw) as Problem;
  return { ...problem, srcPath };
}

export function saveProblem(problem: Problem): void {
  const folder = storageFolder(problem.srcPath);
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }

  fs.writeFileSync(problemFilePath(problem.srcPath), JSON.stringify(problem, null, 2));
}
