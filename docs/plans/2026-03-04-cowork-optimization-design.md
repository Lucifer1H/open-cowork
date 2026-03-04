# Cowork Optimization Design (Claude Cowork-Inspired)

## Context

`open-cowork` has completed v3 beta runtime pluginization with strong `/cowork` compatibility. The next phase is product-strengthening toward a more Cowork-like experience: safer autonomy, explicit approval gates, long-running task control, scheduling, and stronger plugin/product ergonomics.

## Objectives

- Add explicit plan approval and high-risk gating without breaking existing `/cowork` usage
- Add runtime task state machine for recoverable, inspectable execution
- Add scheduling for recurring and one-off tasks
- Add instruction layering (global + project) for stable behavior personalization
- Add plugin manifest and policy checks to make plugin ecosystem safer and more operable
- Add measurable execution quality via events and benchmark tasks

## Non-Goals

- Full GUI dashboard in this phase
- Distributed multi-node scheduler
- Third-party plugin marketplace publication flow

## Architecture Direction (Wave-Based)

### Wave 0: Foundation

- Unified request and execution models (`TaskRequest`, `ExecutionPlan`, `TaskSession`)
- Risk taxonomy (`low`, `medium`, `high`, `critical`)
- Shared test fixtures and golden task seed cases

### Wave 1: Safety and Control (P0)

- Plan approval gate:
  - Support `mode=plan_only` to generate but not execute
  - Support `approval_token` for execution unlock
- Policy engine:
  - High/critical steps require explicit approval
  - Guard potentially destructive actions by default
- Task state machine:
  - `draft -> planned -> waiting_approval -> approved -> running -> verifying -> completed`
  - failure branches: `failed` / `blocked`

### Wave 2: Operational Capability (P1)

- Scheduler module (`once`, `cron`)
- Instruction resolver:
  - Merge global and project-local directives
  - Deterministic precedence and conflict resolution
- Event log stream for observability and postmortem

### Wave 3: Ecosystem and Quality (P2)

- Plugin manifest schema with compatibility constraints
- Plugin enable/disable policy and version checks
- Golden tasks regression runner and baseline metrics output

## Data Flow

1. Parse raw task input into `TaskRequest`
2. Resolve instruction context (global + local)
3. Generate plan and annotate risk per step
4. Evaluate policy and possibly move to `waiting_approval`
5. Execute approved steps
6. Verify execution and transition terminal state
7. Emit structured events + summary output

## Compatibility Contract

- Keep `/cowork <task>` as primary entrypoint
- Keep current install workflow via `install.sh`
- Keep legacy markdown command behavior as fallback path
- New approval/risk features default to safe but backwards-compatible behavior

## Testing Strategy

- Unit:
  - state machine transitions
  - policy/risk decisions
  - scheduler parsing and due selection
  - instruction merge precedence
  - plugin manifest validation
- Integration:
  - planning + policy + execution + verification loop
- E2E:
  - legacy command compatibility
  - approval-required path
  - scheduled task trigger path
- Benchmark:
  - golden task suite with pass/fail + latency stats

## Milestones

- M1 (Week 1): Wave 0 + Wave 1 core closed-loop
- M2 (Week 2): Scheduler + instruction layering + event logging
- M3 (Week 3): Plugin manifest + compatibility checks + golden runner
- M4 (Week 4): hardening, docs, beta release prep

## Success Criteria

- Approval gate blocks high-risk operations without token
- State machine transitions are deterministic and test-covered
- At least one scheduled task executes end-to-end
- Golden tasks produce stable regression report
- `npm test`, `npm run build`, `bash -n install.sh` all pass

## Risks and Mitigations

- Risk: approval UX too heavy for low-risk tasks
  - Mitigation: policy thresholds configurable, default low-friction for low/medium
- Risk: scheduler drift or missed triggers
  - Mitigation: deterministic due-time computation and idempotent trigger handling
- Risk: plugin compatibility fragmentation
  - Mitigation: strict manifest schema and runtime compatibility checks
