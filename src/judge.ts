// Competitive programming judges usually ignore extra spaces at line boundaries.
// This keeps the comparison friendly without hiding genuinely different answers.
export function outputsMatch(expected: string, actual: string): boolean {
  const expectedLines = normalize(expected);
  const actualLines = normalize(actual);

  if (expectedLines.length !== actualLines.length) {
    return false;
  }

  return expectedLines.every((line, index) => line === actualLines[index]);
}

function normalize(value: string): string[] {
  const fixedLineEndings = value.replace(/\r\n/g, '\n');
  const trimmed = fixedLineEndings.trim();

  if (trimmed === '') {
    return [];
  }

  return trimmed.split('\n').map((line) => line.trim());
}
