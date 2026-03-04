#!/usr/bin/env node
const path = require('node:path');
const { writeBuiltCommand } = require('../src/adapter/legacy-adapter.cjs');

const output = path.resolve(__dirname, '../dist/command/cowork.md');
const mode = process.env.COWORK_PROFILE || 'balanced';

writeBuiltCommand(output, { mode });
console.log(`Generated command at ${output}`);
