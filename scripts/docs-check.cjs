#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const REQUIRED_MARKERS = [
  { file: 'README.md', text: 'plan_only' },
  { file: 'README.md', text: 'approvalToken' },
  { file: 'README.md', text: 'createOnceJob' },
  { file: 'README.md', text: 'cowork.instructions.json' },
  { file: 'README_ZH.md', text: 'plan_only' },
  { file: 'README_ZH.md', text: 'approvalToken' },
  { file: 'README_ZH.md', text: 'createOnceJob' },
  { file: 'README_ZH.md', text: 'cowork.instructions.json' },
  { file: 'CONTRIBUTING.md', text: 'npm run golden:run' },
  { file: 'CHANGELOG.md', text: '3.0.0-beta.2' }
];

function checkDocsCoverage(rootDir) {
  const missing = [];

  for (const marker of REQUIRED_MARKERS) {
    const filePath = path.join(rootDir, marker.file);
    if (!fs.existsSync(filePath)) {
      missing.push(`${marker.file}: file not found`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes(marker.text)) {
      missing.push(`${marker.file}: missing \"${marker.text}\"`);
    }
  }

  return {
    ok: missing.length === 0,
    missing
  };
}

function main() {
  const result = checkDocsCoverage(process.cwd());
  if (!result.ok) {
    console.error('Documentation coverage check failed:');
    for (const item of result.missing) {
      console.error(`- ${item}`);
    }
    process.exit(1);
  }

  console.log('Documentation coverage check passed.');
}

if (require.main === module) {
  main();
}

module.exports = {
  checkDocsCoverage
};
