const test = require('node:test');
const assert = require('node:assert/strict');

const { createTaskSession } = require('../../src/core/task-session.cjs');

test('task session transitions through approval path', () => {
  const session = createTaskSession();

  session.transition('planned');
  session.transition('waiting_approval');
  session.transition('approved');
  session.transition('running');
  session.transition('verifying');
  session.transition('completed');

  assert.equal(session.state(), 'completed');
});

test('task session allows blocked path from waiting approval', () => {
  const session = createTaskSession();

  session.transition('planned');
  session.transition('waiting_approval');
  session.transition('blocked');

  assert.equal(session.state(), 'blocked');
});

test('task session rejects invalid transitions', () => {
  const session = createTaskSession();

  assert.throws(() => session.transition('running'), /Invalid transition/);
});
