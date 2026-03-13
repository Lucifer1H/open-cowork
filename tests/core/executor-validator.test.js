const test = require('node:test');
const assert = require('node:assert/strict');

const {
  runPipeline,
  executePlan,
  runWithConcurrency,
  withTimeout,
  withRetry,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_RETRY_ATTEMPTS
} = require('../../src/core/executor.cjs');
const { PROFILES } = require('../../src/config/profiles.cjs');

// ============ Pipeline Tests ============

test('pipeline does not return completed when validator fails', async () => {
  const result = await runPipeline(
    { steps: [{ id: 's1', summary: 'run' }] },
    async () => ({ ok: true }),
    async () => ({ ok: false, reason: 'checks failed' })
  );

  assert.equal(result.status, 'needs_fix');
  assert.equal(result.reason, 'checks failed');
});

test('pipeline returns completed when validator passes', async () => {
  const result = await runPipeline(
    { steps: [{ id: 's1', summary: 'run' }] },
    async () => ({ ok: true }),
    async () => ({ ok: true })
  );

  assert.equal(result.status, 'completed');
});

// ============ Concurrency Tests ============

test('runWithConcurrency respects concurrency limit', async () => {
  const items = [1, 2, 3, 4, 5];
  let maxConcurrent = 0;
  let currentConcurrent = 0;

  const results = await runWithConcurrency(items, 2, async (item) => {
    currentConcurrent++;
    maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
    await new Promise((r) => setTimeout(r, 10));
    currentConcurrent--;
    return item * 2;
  });

  assert.equal(maxConcurrent, 2, 'Should not exceed concurrency limit of 2');
  assert.deepEqual(results, [2, 4, 6, 8, 10]);
});

test('runWithConcurrency handles empty array', async () => {
  const results = await runWithConcurrency([], 2, async (item) => item);
  assert.deepEqual(results, []);
});

test('runWithConcurrency handles single item', async () => {
  const results = await runWithConcurrency([1], 2, async (item) => item * 2);
  assert.deepEqual(results, [2]);
});

// ============ Timeout Tests ============

test('withTimeout resolves before timeout', async () => {
  const promise = new Promise((resolve) => {
    setTimeout(() => resolve('success'), 10);
  });

  const result = await withTimeout(promise, 100, 'test-step');
  assert.equal(result, 'success');
});

test('withTimeout rejects after timeout', async () => {
  const promise = new Promise((resolve) => {
    setTimeout(() => resolve('too late'), 200);
  });

  await assert.rejects(
    async () => withTimeout(promise, 10, 'test-step'),
    {
      message: /test-step.*timed out.*10ms/
    }
  );
});

test('withTimeout with zero timeout bypasses timeout', async () => {
  const promise = new Promise((resolve) => {
    setTimeout(() => resolve('success'), 100);
  });

  // Zero or negative timeout should not apply
  const result = await withTimeout(promise, 0, 'test-step');
  assert.equal(result, 'success');
});

// ============ Retry Tests ============

test('withRetry succeeds on first attempt', async () => {
  let attempts = 0;

  const result = await withRetry(async () => {
    attempts++;
    return 'success';
  });

  assert.equal(result, 'success');
  assert.equal(attempts, 1);
});

test('withRetry retries on failure', async () => {
  let attempts = 0;

  const result = await withRetry(
    async () => {
      attempts++;
      if (attempts < 3) throw new Error('temporary error');
      return 'success';
    },
    { attempts: 3, baseDelay: 1 }
  );

  assert.equal(result, 'success');
  assert.equal(attempts, 3);
});

test('withRetry throws after max attempts', async () => {
  let attempts = 0;

  await assert.rejects(
    async () =>
      withRetry(
        async () => {
          attempts++;
          throw new Error('persistent error');
        },
        { attempts: 2, baseDelay: 1 }
      ),
    {
      message: 'persistent error'
    }
  );

  assert.equal(attempts, 2);
});

test('withRetry respects shouldRetry callback', async () => {
  let attempts = 0;

  // The shouldRetry callback is called inside the retry loop
  // If it returns false, retry stops immediately
  await assert.rejects(
    async () =>
      withRetry(
        async () => {
          attempts++;
          throw new Error('fatal error');
        },
        {
          attempts: 3,
          baseDelay: 1,
          shouldRetry: (error, attempt) => {
            // Only retry if error message includes 'retryable'
            return error.message.includes('retryable');
          }
        }
      ),
    {
      message: 'fatal error'
    }
  );

  // Should not retry because shouldRetry returns false for 'fatal error'
  assert.equal(attempts, 1);
});

// ============ ExecutePlan Tests ============

test('executePlan handles empty plan', async () => {
  const plugin = {
    run: async () => ({ ok: true })
  };

  const result = await executePlan({ steps: [] }, plugin, {});

  assert.equal(result.ok, true);
  assert.equal(result.message, 'No steps to execute');
});

test('executePlan executes all steps', async () => {
  const executedSteps = [];
  const plugin = {
    executeStep: async (step) => {
      executedSteps.push(step.id);
      return { ok: true, stepId: step.id };
    }
  };

  const result = await executePlan(
    {
      steps: [
        { id: 'step1', summary: 'First' },
        { id: 'step2', summary: 'Second' }
      ]
    },
    plugin,
    { profile: PROFILES.safe }
  );

  assert.equal(result.ok, true);
  assert.deepEqual(executedSteps, ['step1', 'step2']);
});

test('executePlan uses profile maxParallelSteps', async () => {
  const executionOrder = [];
  const plugin = {
    executeStep: async (step) => {
      executionOrder.push(`start:${step.id}`);
      await new Promise((r) => setTimeout(r, 20));
      executionOrder.push(`end:${step.id}`);
      return { ok: true, stepId: step.id };
    }
  };

  // With safe profile (maxParallelSteps = 1), steps should run sequentially
  await executePlan(
    {
      steps: [
        { id: 'step1', summary: 'First' },
        { id: 'step2', summary: 'Second' }
      ]
    },
    plugin,
    { profile: PROFILES.safe }
  );

  // step1 should complete before step2 starts
  assert.ok(executionOrder.indexOf('end:step1') < executionOrder.indexOf('start:step2'));
});

test('executePlan reports failed steps', async () => {
  const plugin = {
    executeStep: async (step) => {
      if (step.id === 'step2') {
        return { ok: false, stepId: step.id, error: 'Step 2 failed' };
      }
      return { ok: true, stepId: step.id };
    }
  };

  const result = await executePlan(
    {
      steps: [
        { id: 'step1', summary: 'First' },
        { id: 'step2', summary: 'Second' },
        { id: 'step3', summary: 'Third' }
      ]
    },
    plugin,
    { profile: PROFILES.balanced }
  );

  assert.equal(result.ok, false);
  assert.ok(result.failedSteps.includes('step2'));
  assert.ok(result.reason.includes('failed'));
});

test('executePlan sends step events', async () => {
  const events = [];
  const plugin = {
    executeStep: async (step) => ({ ok: true, stepId: step.id })
  };

  await executePlan(
    { steps: [{ id: 'step1', summary: 'First' }] },
    plugin,
    {
      profile: PROFILES.balanced,
      emit: (type, payload) => events.push({ type, ...payload })
    }
  );

  const eventTypes = events.map((e) => e.type);
  assert.ok(eventTypes.includes('step.started'));
  assert.ok(eventTypes.includes('step.completed'));
});

test('executePlan calls onProgress callback', async () => {
  const progressEvents = [];
  const plugin = {
    executeStep: async (step) => ({ ok: true, stepId: step.id })
  };

  await executePlan(
    { steps: [{ id: 'step1', summary: 'First' }] },
    plugin,
    {
      profile: PROFILES.balanced,
      onProgress: (event) => progressEvents.push(event)
    }
  );

  assert.ok(progressEvents.length > 0);
  assert.ok(progressEvents[0].type);
  assert.ok(progressEvents[0].timestamp);
});