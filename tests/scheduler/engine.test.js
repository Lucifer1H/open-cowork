const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createScheduleStore,
  createOnceJob,
  createIntervalJob,
  pollDueJobs
} = require('../../src/scheduler/engine.cjs');
const {
  createSchedulerRunner,
  createDelayedJob,
  createRecurringJob
} = require('../../src/scheduler/runner.cjs');
const { createEventStore } = require('../../src/observability/event-store.cjs');

// ============ Engine Tests ============

test('once job becomes due when runAt <= now', () => {
  const store = createScheduleStore();
  const now = new Date('2026-03-04T00:00:00.000Z');

  store.add(createOnceJob({ id: 'job.once', runAt: '2026-03-03T23:00:00.000Z', payload: { task: 'a' } }));

  const due = pollDueJobs(store, now);
  assert.equal(due.length, 1);
  assert.equal(due[0].id, 'job.once');
});

test('interval job updates next run deterministically', () => {
  const store = createScheduleStore();
  const now = new Date('2026-03-04T00:00:00.000Z');

  store.add(createIntervalJob({
    id: 'job.interval',
    everyMs: 60_000,
    nextRunAt: '2026-03-03T23:59:00.000Z',
    payload: { task: 'b' }
  }));

  const due = pollDueJobs(store, now);
  assert.equal(due.length, 1);
  const job = store.get('job.interval');
  assert.equal(job.nextRunAt, '2026-03-04T00:00:00.000Z');
});

test('once job is removed after execution', () => {
  const store = createScheduleStore();
  const now = new Date('2026-03-04T00:00:00.000Z');

  store.add(createOnceJob({ id: 'job.once', runAt: '2026-03-03T23:00:00.000Z', payload: { task: 'a' } }));

  pollDueJobs(store, now);

  assert.equal(store.get('job.once'), null);
});

test('future job is not due', () => {
  const store = createScheduleStore();
  const now = new Date('2026-03-04T00:00:00.000Z');

  store.add(createOnceJob({ id: 'job.future', runAt: '2026-03-05T00:00:00.000Z', payload: { task: 'a' } }));

  const due = pollDueJobs(store, now);
  assert.equal(due.length, 0);
  assert.ok(store.get('job.future'));
});

// ============ Runner Tests ============

test('createSchedulerRunner creates runner with correct methods', () => {
  const store = createScheduleStore();
  const events = createEventStore();

  const runner = createSchedulerRunner({
    scheduleStore: store,
    eventStore: events,
    orchestrate: async () => ({ status: 'completed' })
  });

  assert.equal(typeof runner.start, 'function');
  assert.equal(typeof runner.stop, 'function');
  assert.equal(typeof runner.status, 'function');
  assert.equal(typeof runner.triggerNow, 'function');
  assert.equal(typeof runner.executeJob, 'function');
});

test('runner start returns success', () => {
  const store = createScheduleStore();
  const events = createEventStore();

  const runner = createSchedulerRunner({
    scheduleStore: store,
    eventStore: events,
    orchestrate: async () => ({ status: 'completed' })
  });

  const result = runner.start();

  assert.equal(result.ok, true);
  assert.ok(result.message);

  // Cleanup
  runner.stop();
});

test('runner start twice returns error', () => {
  const store = createScheduleStore();
  const events = createEventStore();

  const runner = createSchedulerRunner({
    scheduleStore: store,
    eventStore: events,
    orchestrate: async () => ({ status: 'completed' })
  });

  runner.start();
  const result = runner.start();

  assert.equal(result.ok, false);
  assert.ok(result.reason.includes('already running'));

  // Cleanup
  runner.stop();
});

test('runner stop returns success', () => {
  const store = createScheduleStore();
  const events = createEventStore();

  const runner = createSchedulerRunner({
    scheduleStore: store,
    eventStore: events,
    orchestrate: async () => ({ status: 'completed' })
  });

  runner.start();
  const result = runner.stop();

  assert.equal(result.ok, true);
  assert.ok(result.message);
});

test('runner stop when not running returns error', () => {
  const store = createScheduleStore();
  const events = createEventStore();

  const runner = createSchedulerRunner({
    scheduleStore: store,
    eventStore: events,
    orchestrate: async () => ({ status: 'completed' })
  });

  const result = runner.stop();

  assert.equal(result.ok, false);
  assert.ok(result.reason.includes('not running'));
});

test('runner status returns correct state', () => {
  const store = createScheduleStore();
  const events = createEventStore();

  const runner = createSchedulerRunner({
    scheduleStore: store,
    eventStore: events,
    orchestrate: async () => ({ status: 'completed' }),
    intervalMs: 30000
  });

  let status = runner.status();
  assert.equal(status.running, false);
  assert.equal(status.intervalMs, 30000);
  assert.equal(status.executionCount, 0);

  runner.start();
  status = runner.status();
  assert.equal(status.running, true);

  runner.stop();
  status = runner.status();
  assert.equal(status.running, false);
});

test('executeJob records events', async () => {
  const store = createScheduleStore();
  const events = createEventStore();

  const runner = createSchedulerRunner({
    scheduleStore: store,
    eventStore: events,
    orchestrate: async () => ({ status: 'completed' })
  });

  const job = createOnceJob({
    id: 'test-job',
    runAt: new Date().toISOString(),
    payload: { task: 'test' }
  });

  await runner.executeJob(job);

  const allEvents = events.all();
  const types = allEvents.map((e) => e.type);

  assert.ok(types.includes('schedule.triggered'));
  assert.ok(types.includes('schedule.completed'));
});

test('executeJob records failed event on error', async () => {
  const store = createScheduleStore();
  const events = createEventStore();

  const runner = createSchedulerRunner({
    scheduleStore: store,
    eventStore: events,
    orchestrate: async () => {
      throw new Error('orchestration failed');
    }
  });

  const job = createOnceJob({
    id: 'failing-job',
    runAt: new Date().toISOString(),
    payload: { task: 'test' }
  });

  const result = await runner.executeJob(job);

  assert.equal(result.ok, false);
  assert.ok(result.error);

  const allEvents = events.all();
  const failedEvent = allEvents.find((e) => e.type === 'schedule.failed');
  assert.ok(failedEvent);
});

// ============ Job Creation Helpers Tests ============

test('createDelayedJob creates job with future runAt', () => {
  const job = createDelayedJob({
    id: 'delayed-job',
    delayMs: 60000,
    payload: { task: 'delayed' }
  });

  assert.equal(job.id, 'delayed-job');
  assert.equal(job.type, 'once');
  assert.ok(job.runAt);

  const runAt = new Date(job.runAt);
  const now = new Date();
  const diff = runAt.getTime() - now.getTime();

  // Should be approximately 60 seconds in the future
  assert.ok(diff >= 59000 && diff <= 61000);
});

test('createRecurringJob creates interval job', () => {
  const job = createRecurringJob({
    id: 'recurring-job',
    everyMs: 300000, // 5 minutes
    payload: { task: 'recurring' }
  });

  assert.equal(job.id, 'recurring-job');
  assert.equal(job.type, 'interval');
  assert.equal(job.everyMs, 300000);
  assert.ok(job.nextRunAt);
});

test('createRecurringJob respects startAt', () => {
  const startAt = new Date('2026-03-05T10:00:00.000Z');
  const job = createRecurringJob({
    id: 'scheduled-recurring',
    everyMs: 60000,
    payload: { task: 'scheduled' },
    startAt
  });

  assert.equal(job.nextRunAt, startAt.toISOString());
});