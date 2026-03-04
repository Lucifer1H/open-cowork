#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

function collectJsFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectJsFiles(fullPath));
    } else if (entry.isFile() && fullPath.endsWith('.cjs')) {
      files.push(fullPath);
    }
  }

  return files;
}

const filesToCheck = [
  ...collectJsFiles(path.join(process.cwd(), 'src')),
  ...collectJsFiles(path.join(process.cwd(), 'scripts'))
];

for (const file of filesToCheck) {
  try {
    const content = fs.readFileSync(file, 'utf8').replace(/^#![^\n]*\n/, '');
    new Function(content);
  } catch (error) {
    console.error(`Syntax check failed for ${file}`);
    console.error(error.message);
    process.exit(1);
  }
}

console.log(`Syntax check passed for ${filesToCheck.length} files.`);
