const test = require('node:test');
const assert = require('node:assert/strict');

const { createSessionStore } = require('../../src/session/store.cjs');
const { createSessionManager } = require('../../src/session/manager.cjs');
const {
  createSession,
  createTask,
  SESSION_STATUS,
  TASK_STATUS,
  isValidTransition
} = require('../../src/session/types.cjs');
const { createEventStore } = require('../../src/observability/event-store.cjs');

// ============ Session Types Tests ============

test('createSession creates valid session', () => {
  const session = createSession({ task: 'Test task' });

  assert.ok(session.id);
  assert.equal(session.status, SESSION_STATUS.ACTIVE);
  assert.equal(session.task, 'Test task');
  assert.ok(session.createdAt);
  assert.ok(session.updatedAt);
  assert.deepEqual(session.tasks, []);
});

test('createSession preserves context', () => {
  const context = { project: 'my-project', userId: '123' };
  const session = createSession({ task: 'Test', context });

  assert.deepEqual(session.context, context);
});

test('createTask creates valid task', () => {
  const task = createTask({ description: 'Do something', pluginId: 'bugfix' });

  assert.ok(task.id);
  assert.equal(task.status, TASK_STATUS.PENDING);
  assert.equal(task.description, 'Do something');
  assert.equal(task.pluginId, 'bugfix');
});

test('isValidTransition validates state changes', () => {
  assert.equal(isValidTransition(SESSION_STATUS.ACTIVE, SESSION_STATUS.PAUSED), true);
  assert.equal(isValidTransition(SESSION_STATUS.ACTIVE, SESSION_STATUS.COMPLETED), true);
  assert.equal(isValidTransition(SESSION_STATUS.COMPLETED, SESSION_STATUS.ACTIVE), false);
  assert.equal(isValidTransition(SESSION_STATUS.PAUSED, SESSION_STATUS.ACTIVE), true);
});

// ============ Session Store Tests ============

test('createSessionStore provides CRUD operations', () => {
  const store = createSessionStore();

  assert.equal(typeof store.add, 'function');
  assert.equal(typeof store.get, 'function');
  assert.equal(typeof store.update, 'function');
  assert.equal(typeof store.remove, 'function');
  assert.equal(typeof store.list, 'function');
});

test('sessionStore add and get', () => {
  const store = createSessionStore();
  const session = createSession({ task: 'Test' });

  store.add(session);
  const retrieved = store.get(session.id);

  assert.deepEqual(retrieved, session);
});

test('sessionStore update', () => {
  const store = createSessionStore();
  const session = createSession({ task: 'Test' });

  store.add(session);
  const updated = { ...session, status: SESSION_STATUS.PAUSED };
  store.update(updated);

  const retrieved = store.get(session.id);
  assert.equal(retrieved.status, SESSION_STATUS.PAUSED);
});

test('sessionStore remove', () => {
  const store = createSessionStore();
  const session = createSession({ task: 'Test' });

  store.add(session);
  store.remove(session.id);

  assert.equal(store.get(session.id), null);
});

test('sessionStore list with filter', () => {
  const store = createSessionStore();

  store.add(createSession({ task: 'Task 1' }));
  store.add(createSession({ task: 'Task 2' }));

  const all = store.list();
  assert.equal(all.length, 2);
});

// ============ Session Manager Tests ============

test('createSessionManager creates manager with methods', () => {
  const store = createSessionStore();
  const events = createEventStore();
  const manager = createSessionManager({ store, eventStore: events });

  assert.equal(typeof manager.create, 'function');
  assert.equal(typeof manager.get, 'function');
  assert.equal(typeof manager.list, 'function');
  assert.equal(typeof manager.pause, 'function');
  assert.equal(typeof manager.resume, 'function');
  assert.equal(typeof manager.complete, 'function');
  assert.equal(typeof manager.fail, 'function');
  assert.equal(typeof manager.addTask, 'function');
  assert.equal(typeof manager.updateTask, 'function');
  assert.equal(typeof manager.getHistory, 'function');
});

test('sessionManager.create creates and stores session', () => {
  const store = createSessionStore();
  const events = createEventStore();
  const manager = createSessionManager({ store, eventStore: events });

  const session = manager.create({ task: 'New session' });

  assert.ok(session.id);
  assert.equal(session.task, 'New session');
  assert.equal(store.get(session.id).id, session.id);
});

test('sessionManager.pause pauses active session', () => {
  const store = createSessionStore();
  const manager = createSessionManager({ store });

  const session = manager.create({ task: 'Test' });
  const result = manager.pause(session.id);

  assert.equal(result.ok, true);
  assert.equal(result.session.status, SESSION_STATUS.PAUSED);
});

test('sessionManager.pause fails for non-active session', () => {
  const store = createSessionStore();
  const manager = createSessionManager({ store });

  const session = manager.create({ task: 'Test' });
  manager.complete(session.id);

  const result = manager.pause(session.id);
  assert.equal(result.ok, false);
});

test('sessionManager.resume resumes paused session', () => {
  const store = createSessionStore();
  const manager = createSessionManager({ store });

  const session = manager.create({ task: 'Test' });
  manager.pause(session.id);
  const result = manager.resume(session.id);

  assert.equal(result.ok, true);
  assert.equal(result.session.status, SESSION_STATUS.ACTIVE);
});

test('sessionManager.complete marks session complete', () => {
  const store = createSessionStore();
  const manager = createSessionManager({ store });

  const session = manager.create({ task: 'Test' });
  const result = manager.complete(session.id, { summary: 'Done' });

  assert.equal(result.ok, true);
  assert.equal(result.session.status, SESSION_STATUS.COMPLETED);
  assert.ok(result.session.completedAt);
});

test('sessionManager.fail marks session failed', () => {
  const store = createSessionStore();
  const manager = createSessionManager({ store });

  const session = manager.create({ task: 'Test' });
  const result = manager.fail(session.id, 'Something went wrong');

  assert.equal(result.ok, true);
  assert.equal(result.session.status, SESSION_STATUS.FAILED);
  assert.equal(result.session.failureReason, 'Something went wrong');
});

test('sessionManager.addTask adds task to session', () => {
  const store = createSessionStore();
  const manager = createSessionManager({ store });

  const session = manager.create({ task: 'Test' });
  const result = manager.addTask(session.id, { description: 'Subtask 1' });

  assert.equal(result.ok, true);
  assert.ok(result.task);
  assert.equal(result.session.tasks.length, 1);
});

test('sessionManager.updateTask updates task status', () => {
  const store = createSessionStore();
  const manager = createSessionManager({ store });

  const session = manager.create({ task: 'Test' });
  const addResult = manager.addTask(session.id, { description: 'Subtask' });
  const taskId = addResult.task.id;

  const result = manager.updateTask(session.id, taskId, TASK_STATUS.COMPLETED, { output: 'done' });

  assert.equal(result.ok, true);
  assert.equal(result.task.status, TASK_STATUS.COMPLETED);
});

test('sessionManager.getHistory returns session history', () => {
  const store = createSessionStore();
  const manager = createSessionManager({ store });

  const session = manager.create({ task: 'Test' });
  manager.addTask(session.id, { description: 'Task 1' });
  manager.addTask(session.id, { description: 'Task 2' });

  const history = manager.getHistory(session.id);

  assert.ok(history);
  assert.equal(history.totalTasks, 2);
});

test('sessionManager records events', () => {
  const store = createSessionStore();
  const events = createEventStore();
  const manager = createSessionManager({ store, eventStore: events });

  manager.create({ task: 'Test' });

  const allEvents = events.all();
  assert.ok(allEvents.some((e) => e.type === 'session.created'));
});