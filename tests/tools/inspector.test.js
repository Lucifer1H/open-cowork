const test = require('node:test');
const assert = require('node:assert/strict');

const { createToolInspector, FIX_SUGGESTIONS } = require('../../src/tools/inspector.cjs');
const { createOutputParser } = require('../../src/tools/output-parser.cjs');

// ============ Tool Inspector Tests ============

test('createToolInspector creates inspector with methods', () => {
  const inspector = createToolInspector();

  assert.equal(typeof inspector.parseOutput, 'function');
  assert.equal(typeof inspector.extractErrors, 'function');
  assert.equal(typeof inspector.suggestFix, 'function');
  assert.equal(typeof inspector.validateResult, 'function');
  assert.equal(typeof inspector.formatReport, 'function');
});

test('parseOutput handles empty output', () => {
  const inspector = createToolInspector();

  const result = inspector.parseOutput('npm', '');

  assert.equal(result.tool, 'npm');
  assert.equal(result.summary.hasErrors, false);
  assert.equal(result.errors.length, 0);
});

test('parseOutput parses npm errors', () => {
  const inspector = createToolInspector();

  const output = `npm ERR! code E404
npm ERR! 404 Not Found - GET https://registry.npmjs.org/nonexistent
npm ERR! Error: Package not found`;

  const result = inspector.parseOutput('npm', output);

  assert.ok(result.summary.hasErrors);
  assert.ok(result.errors.length > 0);
});

test('parseOutput parses node errors', () => {
  const inspector = createToolInspector();

  const output = `Error: Cannot find module './missing'
    at require (internal/modules/cjs/loader.js:883:15)
TypeError: undefined is not a function`;

  const result = inspector.parseOutput('node', output);

  assert.ok(result.summary.hasErrors);
  assert.ok(result.errors.some((e) => e.match.includes('Error:')));
});

test('parseOutput parses TypeScript errors', () => {
  const inspector = createToolInspector();

  const output = `src/index.ts(10,5): error TS2322: Type 'string' is not assignable to type 'number'.
src/utils.ts(20,1): error TS1005: ',' expected.`;

  const result = inspector.parseOutput('tsc', output);

  assert.ok(result.summary.hasErrors);
  assert.ok(result.errors.some((e) => e.match.includes('error TS')));
});

test('parseOutput parses ESLint errors', () => {
  const inspector = createToolInspector();

  const output = `src/index.js
  10:5  error  'x' is not defined    no-undef
  15:3  error  Unexpected console statement  no-console`;

  const result = inspector.parseOutput('eslint', output);

  assert.ok(result.summary.hasErrors);
});

test('parseOutput parses Jest output', () => {
  const inspector = createToolInspector();

  const output = `FAIL src/test.js
  ● Test suite failed to run
    TypeError: Cannot read property 'x' of undefined

PASS src/other.test.js`;

  const result = inspector.parseOutput('jest', output);

  assert.ok(result.summary.hasErrors);
});

test('extractErrors finds common error patterns', () => {
  const inspector = createToolInspector();

  const output = `Error: something went wrong
TypeError: undefined is not a function
Warning: this is deprecated`;

  const errors = inspector.extractErrors(output);

  assert.ok(errors.length >= 2);
});

test('suggestFix provides suggestions for known patterns', () => {
  const inspector = createToolInspector();

  const error = { match: 'Cannot find module xyz' };
  const fix = inspector.suggestFix(error);

  assert.ok(fix.suggestion);
  assert.ok(Array.isArray(fix.actions));
});

test('suggestFix provides generic suggestion for unknown patterns', () => {
  const inspector = createToolInspector();

  const error = { match: 'Some unknown error' };
  const fix = inspector.suggestFix(error);

  assert.ok(fix.suggestion);
});

test('validateResult checks error count', () => {
  const inspector = createToolInspector();

  const actual = {
    summary: { errorCount: 5, warningCount: 2, hasErrors: true }
  };

  const result = inspector.validateResult('npm', { maxErrors: 3 }, actual);

  assert.equal(result.valid, false);
  assert.ok(result.issues.some((i) => i.type === 'error_count_exceeded'));
});

test('validateResult checks for unexpected errors', () => {
  const inspector = createToolInspector();

  const actual = {
    summary: { errorCount: 1, warningCount: 0, hasErrors: true }
  };

  const result = inspector.validateResult('npm', { shouldFail: false }, actual);

  assert.equal(result.valid, false);
});

test('formatReport generates readable report', () => {
  const inspector = createToolInspector();

  const result = {
    tool: 'test',
    summary: { hasErrors: true, hasWarnings: false, errorCount: 1, warningCount: 0 },
    errors: [{ match: 'Test error' }],
    warnings: []
  };

  const report = inspector.formatReport(result);

  assert.ok(report.includes('Tool Output Report'));
  assert.ok(report.includes('Test error'));
});

// ============ Output Parser Tests ============

test('createOutputParser creates parser with methods', () => {
  const parser = createOutputParser();

  assert.equal(typeof parser.parseJSON, 'function');
  assert.equal(typeof parser.parseLines, 'function');
  assert.equal(typeof parser.parseKeyValue, 'function');
  assert.equal(typeof parser.parseTable, 'function');
  assert.equal(typeof parser.parseCSV, 'function');
  assert.equal(typeof parser.autoParse, 'function');
});

test('parseJSON parses valid JSON', () => {
  const parser = createOutputParser();

  const result = parser.parseJSON('{"name": "test", "value": 123}');

  assert.equal(result.ok, true);
  assert.equal(result.data.name, 'test');
  assert.equal(result.data.value, 123);
});

test('parseJSON handles invalid JSON', () => {
  const parser = createOutputParser();

  const result = parser.parseJSON('{ invalid json }');

  assert.equal(result.ok, false);
  assert.ok(result.error);
});

test('parseLines splits output into lines', () => {
  const parser = createOutputParser();

  const result = parser.parseLines('line 1\nline 2\nline 3');

  assert.equal(result.ok, true);
  assert.equal(result.data.count, 3);
  assert.equal(result.data.lines[0].content, 'line 1');
});

test('parseLines detects line types', () => {
  const parser = createOutputParser();

  const result = parser.parseLines('error: something\nwarning: other\ninfo: note', { detectType: true });

  assert.equal(result.data.lines[0].type, 'error');
  assert.equal(result.data.lines[1].type, 'warning');
});

test('parseKeyValue parses key:value pairs', () => {
  const parser = createOutputParser();

  const result = parser.parseKeyValue('name: John\nage: 30\ncity: NYC');

  assert.equal(result.ok, true);
  assert.equal(result.data.name, 'John');
  assert.equal(result.data.age, '30');
  assert.equal(result.data.city, 'NYC');
});

test('parseTable parses pipe-delimited tables', () => {
  const parser = createOutputParser();

  const output = `Name | Age | City
John | 30 | NYC
Jane | 25 | LA`;

  const result = parser.parseTable(output);

  assert.equal(result.ok, true);
  assert.equal(result.data.headers.length, 3);
  assert.equal(result.data.rows.length, 2);
});

test('parseCSV parses CSV format', () => {
  const parser = createOutputParser();

  const output = `name,age,city
John,30,NYC
Jane,25,LA`;

  const result = parser.parseCSV(output);

  assert.equal(result.ok, true);
  assert.equal(result.data.length, 3);
  assert.deepEqual(result.data[1], ['John', '30', 'NYC']);
});

test('autoParse detects JSON', () => {
  const parser = createOutputParser();

  const result = parser.autoParse('{"type": "json"}');

  assert.equal(result.type, 'json');
  assert.equal(result.ok, true);
});

test('autoParse detects table format', () => {
  const parser = createOutputParser();

  const result = parser.autoParse('col1 | col2\nval1 | val2');

  assert.equal(result.type, 'table');
});

test('autoParse defaults to lines', () => {
  const parser = createOutputParser();

  const result = parser.autoParse('plain text\nmultiple lines');

  assert.equal(result.type, 'lines');
});

test('detectLineType identifies errors', () => {
  const parser = createOutputParser();

  assert.equal(parser.detectLineType('error: something failed'), 'error');
  assert.equal(parser.detectLineType('ERROR: critical'), 'error');
});

test('detectLineType identifies warnings', () => {
  const parser = createOutputParser();

  assert.equal(parser.detectLineType('warning: deprecated'), 'warning');
  assert.equal(parser.detectLineType('WARN: check this'), 'warning');
});

test('detectLineType identifies success', () => {
  const parser = createOutputParser();

  assert.equal(parser.detectLineType('success: completed'), 'success');
  assert.equal(parser.detectLineType('PASS: test passed'), 'success');
});