# Cowork v3 Plugin Architecture Design

## Context

`open-cowork` currently provides a zero-dependency `/cowork` command via `command/cowork.md`. The project has adoption signal (138 stars) but limited extensibility and weak product surface for advanced task handling.

User direction for this design:
- Primary goal: strengthen product capability
- Architecture preference: full pluginization
- Compatibility requirement: strong backward compatibility

## Goals

- Keep existing user entrypoints unchanged (`/cowork`, `install.sh`)
- Introduce a modular, extensible plugin core for capability growth
- Improve execution reliability via structured planning, execution, and verification
- Enable progressive rollout with safe fallback to legacy behavior

## Non-Goals

- Immediate removal of legacy markdown command behavior
- Building a marketplace in first release
- Introducing breaking UX for existing users

## Proposed Architecture (Dual-Track)

### 1) Legacy Adapter Layer

Keep `command/cowork.md` as a compatibility shell.

Responsibilities:
- Receive user task (`$ARGUMENTS`)
- Provide minimal execution contract and compatibility text format
- Call into the new core runtime when available
- Fallback to legacy behavior if runtime is unavailable

### 2) Cowork Core Runtime

Core modules:
- `planner`: task decomposition, dependency ordering, risk-point insertion
- `executor`: file/command operations + permission-aware execution
- `validator`: post-action gates (syntax/tests/custom checks)
- `reporter`: progress events and final human-readable summary

### 3) Capability Plugin Layer

Each capability is a plugin with standardized lifecycle:
- `canHandle(task, context): boolean`
- `plan(task, context): Plan`
- `run(plan, context): RunResult`
- `verify(runResult, context): VerifyResult`

Initial plugin set:
- `refactor`
- `bugfix`
- `docgen`
- `migration`

### 4) Profile + Config Layer

Config hierarchy:
- Global defaults
- Project-local override (e.g., `.opencode/cowork.config.json`)

Profiles:
- `safe`: conservative execution, explicit checks
- `balanced`: default mode
- `aggressive`: higher autonomy, more parallel action

## Execution Lifecycle

1. Input normalization
- Convert raw task + environment into `TaskContext`

2. Capability routing
- Match plugin candidates via `canHandle`
- Single hit: direct
- Multi-hit: planner composes
- No hit: generic fallback pipeline

3. Plan generation
- Generate structured step graph with dependencies, stop conditions, validation checkpoints

4. Execution loop
- Execute step-by-step, emitting `ExecutionEvent`
- On error: retry -> degrade -> fallback -> request user confirmation (high-risk only)

5. Verification gate
- Run all required checks before completion state

6. Reporting
- Emit compatibility narrative output + structured events for future UI/analytics

## Error Handling and Recovery

Error classes:
- `recoverable`: transient command failure, recoverable file state mismatch
- `fatal`: unsupported environment, irreversible prerequisite failure

Recovery sequence:
1. Retry same strategy
2. Degrade strategy
3. Switch to fallback generic executor
4. Ask user confirmation for unsafe or ambiguous continuation

All failures log:
- `error_code`
- failed step
- side effects already applied
- attempted recovery path

## Backward Compatibility Contract

- Keep `install.sh` working for current install path
- Keep `/cowork` command format unchanged
- Preserve user-facing execution narrative style
- Auto-fallback to legacy flow if core runtime cannot load

## Testing Strategy

1. Unit tests
- planner, executor, validator, registry, plugin contract

2. Contract tests
- legacy adapter output compatibility with baseline snapshots

3. End-to-end tests
- `/cowork` input -> runtime -> verification -> summary
- Include success, recoverable failure, fatal failure, fallback cases

4. Regression benchmark tasks
- Curated tasks across refactor/bugfix/docgen/migration
- Compare plan quality and completion reliability

## Rollout Strategy

- `v3.0.0-beta`: plugin core available, compatibility mode default
- `v3.0.0`: plugin core default path, explicit legacy opt-in remains
- Post-release review after two cycles before discussing legacy removal

## Risks and Mitigations

- Risk: behavior drift from legacy expectations
  - Mitigation: contract tests + snapshot verification

- Risk: plugin contract fragmentation
  - Mitigation: strict type/interface and compatibility test suite

- Risk: larger maintenance burden from dual-track
  - Mitigation: narrow legacy adapter responsibilities and document deprecation criteria early

## Milestone Outline

- M1: Core skeleton + adapter + fallback
- M2: First-party plugins + verification pipeline
- M3: Profile/config + e2e coverage + beta release
- M4: Stabilization and v3.0.0 release
