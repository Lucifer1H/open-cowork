# Cowork Optimization Task Board

## Status

- [ ] Wave 0 Foundation
- [ ] Wave 1 Safety & Approval
- [ ] Wave 2 Operations
- [ ] Wave 3 Ecosystem & Quality
- [ ] Final hardening and release docs

## Detailed Tasks

### Wave 0

- [ ] Task 1: add `src/core/models.cjs` and risk taxonomy
- [ ] Validate: `node --test tests/core/models.test.js`

### Wave 1

- [ ] Task 2: add state machine (`src/core/task-session.cjs`)
- [ ] Task 3: add policy engine (`src/core/policy-engine.cjs`)
- [ ] Task 4: add orchestrator approval flow (`src/core/orchestrator.cjs`)
- [ ] Validate: `npm test`

### Wave 2

- [ ] Task 5: scheduler core (`src/scheduler/*`)
- [ ] Task 6: instruction resolver (`src/instructions/resolver.cjs`)
- [ ] Task 7: event store + metrics (`src/observability/*`)
- [ ] Validate: `npm test && npm run build`

### Wave 3

- [ ] Task 8: plugin manifest validation
- [ ] Task 9: golden task runner
- [ ] Validate: `npm test && npm run build`

### Hardening

- [ ] Task 10: docs and CI hardening
- [ ] Final verify: `npm test && npm run build && bash -n install.sh`

## Execution Rule

Every task must follow strict TDD cycle:
1. write failing test
2. run and confirm fail
3. implement minimal code
4. run and confirm pass
5. commit

## Primary Plan Reference

See full implementation details:
- `docs/plans/2026-03-04-cowork-optimization-implementation-plan.md`
