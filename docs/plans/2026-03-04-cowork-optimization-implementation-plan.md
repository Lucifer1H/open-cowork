# Cowork Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Claude Cowork-inspired product improvements (approval gate, risk policy, state machine, scheduler, instruction layering, plugin manifest checks, observability) while preserving `/cowork` compatibility.

**Architecture:** Extend the existing CJS runtime with a new orchestration layer. Execution is driven by a deterministic task session state machine and guarded by a policy engine. New operational modules (scheduler, instruction resolver, event store, benchmark runner) integrate through the runtime facade without changing legacy command entrypoint semantics.

**Tech Stack:** Node.js (CJS), Node built-in `node:test`, existing build scripts (`npm test`, `npm run build`), GitHub Actions CI.

---

### Task 1: Add Unified Task Models and Risk Taxonomy (Wave 0)

**Files:**
- Create: `src/core/models.cjs`
- Create: `tests/core/models.test.js`
- Modify: `src/index.cjs`

**Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { createTaskRequest, RISK_LEVELS } = require('../../src/core/models.cjs');

test('createTaskRequest normalizes defaults', () => {
  const req = createTaskRequest({ task: 'refactor auth' });
  assert.equal(req.mode, 'execute');
  assert.equal(req.riskPolicy, 'balanced');
  assert.deepEqual(RISK_LEVELS, ['low', 'medium', 'high', 'critical']);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/core/models.test.js`
Expected: FAIL with missing module or function.

**Step 3: Write minimal implementation**

```js
const RISK_LEVELS = ['low', 'medium', 'high', 'critical'];
function createTaskRequest(input) {
  return {
    task: input.task,
    mode: input.mode || 'execute',
    approvalToken: input.approvalToken || null,
    riskPolicy: input.riskPolicy || 'balanced',
    metadata: input.metadata || {}
  };
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/core/models.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/core/models.cjs tests/core/models.test.js src/index.cjs
git commit -m "feat: add task models and risk taxonomy"
```

### Task 2: Implement Task Session State Machine (Wave 1)

**Files:**
- Create: `src/core/task-session.cjs`
- Create: `tests/core/task-session.test.js`
- Modify: `src/index.cjs`

**Step 1: Write the failing test**

```js
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
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/core/task-session.test.js`
Expected: FAIL with missing module.

**Step 3: Write minimal implementation**

Implement allowed transitions:
- `draft -> planned`
- `planned -> waiting_approval | approved`
- `waiting_approval -> approved | blocked`
- `approved -> running`
- `running -> verifying | failed`
- `verifying -> completed | failed`

**Step 4: Run test to verify it passes**

Run: `node --test tests/core/task-session.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/core/task-session.cjs tests/core/task-session.test.js src/index.cjs
git commit -m "feat: add deterministic task session state machine"
```

### Task 3: Add Policy Engine and Approval Gate (Wave 1)

**Files:**
- Create: `src/core/policy-engine.cjs`
- Create: `tests/core/policy-engine.test.js`
- Modify: `src/core/planner.cjs`
- Modify: `src/index.cjs`

**Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { requiresApproval } = require('../../src/core/policy-engine.cjs');

test('high-risk step requires approval', () => {
  const required = requiresApproval({ risk: 'high' }, { riskPolicy: 'balanced', approvalToken: null });
  assert.equal(required, true);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/core/policy-engine.test.js`
Expected: FAIL.

**Step 3: Write minimal implementation**

Rules:
- `low/medium` no approval for `balanced`
- `high/critical` approval required unless token present
- `safe` policy requires approval for `medium+`
- `aggressive` requires approval only for `critical`

**Step 4: Run test to verify it passes**

Run: `node --test tests/core/policy-engine.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/core/policy-engine.cjs tests/core/policy-engine.test.js src/core/planner.cjs src/index.cjs
git commit -m "feat: add risk policy engine and approval rules"
```

### Task 4: Implement Plan-Only + Approval Token Orchestration (Wave 1)

**Files:**
- Create: `src/core/orchestrator.cjs`
- Create: `tests/core/orchestrator-approval.test.js`
- Modify: `src/index.cjs`

**Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { runTask } = require('../../src/core/orchestrator.cjs');

test('plan_only does not execute steps', async () => {
  const result = await runTask({ task: 'delete logs', mode: 'plan_only' }, { plan: () => ({ steps: [{ id: 's1', risk: 'high' }] }) });
  assert.equal(result.status, 'waiting_approval');
});
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/core/orchestrator-approval.test.js`
Expected: FAIL.

**Step 3: Write minimal implementation**

- If `mode=plan_only`: return plan with `waiting_approval`
- If high-risk and missing token: block execution and return approval-needed response
- If token exists: allow execution flow

**Step 4: Run test to verify it passes**

Run: `node --test tests/core/orchestrator-approval.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/core/orchestrator.cjs tests/core/orchestrator-approval.test.js src/index.cjs
git commit -m "feat: add plan-only and approval-token orchestration"
```

### Task 5: Add Scheduler Core (Wave 2)

**Files:**
- Create: `src/scheduler/store.cjs`
- Create: `src/scheduler/engine.cjs`
- Create: `tests/scheduler/engine.test.js`
- Modify: `src/index.cjs`

**Step 1: Write failing tests**

- once job becomes due when `runAt <= now`
- cron-like interval job computes next run deterministically

**Step 2: Run tests to verify fail**

Run: `node --test tests/scheduler/engine.test.js`
Expected: FAIL.

**Step 3: Write minimal implementation**

- in-memory schedule store
- `createOnceJob`, `createIntervalJob`, `pollDueJobs`

**Step 4: Run tests to verify pass**

Run: `node --test tests/scheduler/engine.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/scheduler/store.cjs src/scheduler/engine.cjs tests/scheduler/engine.test.js src/index.cjs
git commit -m "feat: add scheduler core for once and interval jobs"
```

### Task 6: Add Instruction Resolver (Wave 2)

**Files:**
- Create: `src/instructions/resolver.cjs`
- Create: `tests/instructions/resolver.test.js`
- Modify: `src/config/load-config.cjs`
- Modify: `src/index.cjs`

**Step 1: Write failing tests**

- global + local instructions merged in deterministic order
- local rules override global conflicts

**Step 2: Run tests to verify fail**

Run: `node --test tests/instructions/resolver.test.js`
Expected: FAIL.

**Step 3: Write minimal implementation**

- read global instructions from user-level config path if present
- read local from project `.opencode/cowork.instructions.json`
- merge with precedence: local > global

**Step 4: Run tests to verify pass**

Run: `node --test tests/instructions/resolver.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/instructions/resolver.cjs tests/instructions/resolver.test.js src/config/load-config.cjs src/index.cjs
git commit -m "feat: add global and local instruction resolver"
```

### Task 7: Add Event Store + Metrics Snapshot (Wave 2)

**Files:**
- Create: `src/observability/event-store.cjs`
- Create: `src/observability/metrics.cjs`
- Create: `tests/observability/metrics.test.js`
- Modify: `src/core/reporter.cjs`
- Modify: `src/index.cjs`

**Step 1: Write failing test**

- records event stream
- computes success rate, failure count, avg duration

**Step 2: Run test to verify fail**

Run: `node --test tests/observability/metrics.test.js`
Expected: FAIL.

**Step 3: Write minimal implementation**

- append-only event store
- metrics aggregate from events

**Step 4: Run tests to verify pass**

Run: `node --test tests/observability/metrics.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/observability/event-store.cjs src/observability/metrics.cjs tests/observability/metrics.test.js src/core/reporter.cjs src/index.cjs
git commit -m "feat: add event store and runtime metrics snapshot"
```

### Task 8: Add Plugin Manifest Validation (Wave 3)

**Files:**
- Create: `src/plugins/manifest-validator.cjs`
- Create: `tests/plugins/manifest-validator.test.js`
- Modify: `src/plugins/index.cjs`
- Modify: `src/core/plugin-registry.cjs`

**Step 1: Write failing tests**

- rejects plugin without required manifest fields
- rejects incompatible runtime range
- accepts valid manifest

**Step 2: Run tests to verify fail**

Run: `node --test tests/plugins/manifest-validator.test.js`
Expected: FAIL.

**Step 3: Write minimal implementation**

- required fields: `name`, `version`, `runtime`, `capabilities`
- compatibility check against runtime version prefix (`3.`)

**Step 4: Run tests to verify pass**

Run: `node --test tests/plugins/manifest-validator.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/plugins/manifest-validator.cjs tests/plugins/manifest-validator.test.js src/plugins/index.cjs src/core/plugin-registry.cjs
git commit -m "feat: add plugin manifest compatibility validation"
```

### Task 9: Add Golden Task Regression Runner (Wave 3)

**Files:**
- Create: `scripts/golden-runner.cjs`
- Create: `tests/golden/golden-runner.test.js`
- Create: `tests/golden/cases/basic.json`
- Modify: `package.json`

**Step 1: Write failing test**

- runner loads cases and outputs deterministic summary

**Step 2: Run test to verify fail**

Run: `node --test tests/golden/golden-runner.test.js`
Expected: FAIL.

**Step 3: Write minimal implementation**

- run case set through orchestrator in dry mode
- emit pass/fail summary JSON

**Step 4: Run tests to verify pass**

Run: `node --test tests/golden/golden-runner.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add scripts/golden-runner.cjs tests/golden/golden-runner.test.js tests/golden/cases/basic.json package.json
git commit -m "feat: add golden task regression runner"
```

### Task 10: Docs + CI Hardening

**Files:**
- Modify: `README.md`
- Modify: `README_ZH.md`
- Modify: `CONTRIBUTING.md`
- Modify: `CHANGELOG.md`
- Modify: `.github/workflows/ci.yml`

**Step 1: Write failing expectation test (docs/ci consistency check)**

Add a small repository check script that fails if new commands are undocumented.

**Step 2: Run to verify fail**

Run: `npm test`
Expected: FAIL before docs updates.

**Step 3: Implement minimal updates**

- document approval flow, schedule usage, instruction layering
- add CI step for golden runner dry check

**Step 4: Run final verification**

Run: `npm test && npm run build && bash -n install.sh`
Expected: PASS.

**Step 5: Commit**

```bash
git add README.md README_ZH.md CONTRIBUTING.md CHANGELOG.md .github/workflows/ci.yml
git commit -m "docs: finalize cowork optimization workflow and release notes"
```

## Global Verification Checklist

1. `npm test` => all tests pass, 0 failures
2. `npm run build` => syntax/build pipeline succeeds
3. `bash -n install.sh` => installer syntax valid
4. Legacy compatibility check still passes (`tests/e2e/cowork-command.e2e.test.js`)
5. Approval gate + scheduler + manifest checks covered by tests

## Skills During Execution

- `@superpowers/test-driven-development`
- `@superpowers/systematic-debugging`
- `@superpowers/verification-before-completion`
- `@superpowers/requesting-code-review`
