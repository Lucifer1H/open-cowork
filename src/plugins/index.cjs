const { refactorPlugin } = require('./refactor.cjs');
const { bugfixPlugin } = require('./bugfix.cjs');
const { docgenPlugin } = require('./docgen.cjs');
const { migrationPlugin } = require('./migration.cjs');

const BUILTIN_PLUGINS = [
  refactorPlugin,
  bugfixPlugin,
  docgenPlugin,
  migrationPlugin
];

module.exports = {
  BUILTIN_PLUGINS,
  refactorPlugin,
  bugfixPlugin,
  docgenPlugin,
  migrationPlugin
};
