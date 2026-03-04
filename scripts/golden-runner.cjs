#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { createCoworkRuntime } = require('../src/index.cjs');

function loadCases(filePath) {
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!payload || !Array.isArray(payload.cases)) {
    throw new Error('Golden cases file must contain an array at `cases`.');
  }
  return payload.cases;
}

async function runGoldenCases(options = {}) {
  const casesPath = options.casesPath || path.resolve(process.cwd(), 'tests/golden/cases/basic.json');
  const runtime = options.runtime || createCoworkRuntime({ cwd: process.cwd() });
  const cases = loadCases(casesPath);

  const results = [];
  for (const testCase of cases) {
    const outcome = await runtime.orchestrate(testCase.request);
    const passed = outcome.status === testCase.expectedStatus;

    results.push({
      id: testCase.id,
      expectedStatus: testCase.expectedStatus,
      actualStatus: outcome.status,
      passed
    });
  }

  const passed = results.filter((item) => item.passed).length;
  const failed = results.length - passed;

  return {
    casesPath,
    total: results.length,
    passed,
    failed,
    results
  };
}

function parseCliArgs(argv) {
  const args = { json: false };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--json') {
      args.json = true;
      continue;
    }
    if (value === '--cases' && argv[index + 1]) {
      args.casesPath = path.resolve(process.cwd(), argv[index + 1]);
      index += 1;
    }
  }

  return args;
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const summary = await runGoldenCases({ casesPath: args.casesPath });

  if (args.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`Golden run: ${summary.passed}/${summary.total} passed, ${summary.failed} failed`);
    for (const result of summary.results) {
      const marker = result.passed ? 'PASS' : 'FAIL';
      console.log(`[${marker}] ${result.id}: expected=${result.expectedStatus}, actual=${result.actualStatus}`);
    }
  }

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = {
  runGoldenCases
};
