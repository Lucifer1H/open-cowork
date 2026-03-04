# Cowork v3 Pluginization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Evolve `open-cowork` from single markdown command into a plugin-capable runtime while preserving `/cowork` usage and existing install flow.

**Architecture:** Keep `command/cowork.md` as a legacy-compatible adapter, introduce a TypeScript runtime (`planner` + `executor` + `validator` + `plugin registry`), and compile/serve the compatibility command through the new core with fallback behavior.

**Tech Stack:** Node.js 20+, TypeScript 5, Vitest, npm scripts, existing shell installer.

---

### Task 1: Reintroduce Minimal Runtime Tooling

**Files:**
- Modify: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/index.ts`
- Test: `tests/smoke/runtime-entry.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { createCoworkRuntime } from "../../src/index";

describe("runtime entry", () => {
  it("creates runtime with version", () => {
    const runtime = createCoworkRuntime();
    expect(runtime.version).toBe("3.0.0-alpha");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/smoke/runtime-entry.test.ts -t "creates runtime with version"`
Expected: FAIL with module/import or undefined export error.

**Step 3: Write minimal implementation**

```ts
export type CoworkRuntime = {
  version: string;
};

export function createCoworkRuntime(): CoworkRuntime {
  return { version: "3.0.0-alpha" };
}
```

Also add scripts/deps:
- `build`: `tsc -p tsconfig.json`
- `test`: `vitest run`
- devDependencies: `typescript`, `vitest`, `@types/node`

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/smoke/runtime-entry.test.ts -t "creates runtime with version"`
Expected: PASS

**Step 5: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts src/index.ts tests/smoke/runtime-entry.test.ts
git commit -m "feat: bootstrap v3 runtime tooling"
```

### Task 2: Implement Plugin Contract and Registry

**Files:**
- Create: `src/core/types.ts`
- Create: `src/core/plugin-registry.ts`
- Create: `src/core/errors.ts`
- Modify: `src/index.ts`
- Test: `tests/core/plugin-registry.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { PluginRegistry } from "../../src/core/plugin-registry";

const refactorPlugin = {
  id: "refactor",
  canHandle: (task: string) => task.includes("refactor"),
  plan: () => ({ steps: [] }),
  run: async () => ({ ok: true }),
  verify: async () => ({ ok: true })
};

describe("PluginRegistry", () => {
  it("returns matching plugins in priority order", () => {
    const registry = new PluginRegistry();
    registry.register(refactorPlugin as any, 20);
    const matches = registry.match("refactor auth module");
    expect(matches.map((p) => p.id)).toEqual(["refactor"]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/core/plugin-registry.test.ts`
Expected: FAIL with missing registry/types implementation.

**Step 3: Write minimal implementation**

```ts
export interface CoworkPlugin {
  id: string;
  canHandle(task: string): boolean;
  plan(task: string): { steps: Array<{ id: string; summary: string }> };
  run(plan: { steps: Array<{ id: string; summary: string }> }): Promise<{ ok: boolean }>;
  verify(result: { ok: boolean }): Promise<{ ok: boolean }>;
}

export class PluginRegistry {
  private items: Array<{ plugin: CoworkPlugin; priority: number }> = [];

  register(plugin: CoworkPlugin, priority = 0): void {
    this.items.push({ plugin, priority });
    this.items.sort((a, b) => b.priority - a.priority);
  }

  match(task: string): CoworkPlugin[] {
    return this.items
      .filter(({ plugin }) => plugin.canHandle(task))
      .map(({ plugin }) => plugin);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/core/plugin-registry.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/types.ts src/core/plugin-registry.ts src/core/errors.ts src/index.ts tests/core/plugin-registry.test.ts
git commit -m "feat: add plugin contract and registry"
```

### Task 3: Add Planner with Routing and Fallback Graph

**Files:**
- Create: `src/core/planner.ts`
- Create: `src/core/task-context.ts`
- Modify: `src/index.ts`
- Test: `tests/core/planner.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { createPlanner } from "../../src/core/planner";

const plugin = {
  id: "docgen",
  canHandle: () => true,
  plan: () => ({ steps: [{ id: "s1", summary: "generate docs" }] }),
  run: async () => ({ ok: true }),
  verify: async () => ({ ok: true })
};

describe("planner", () => {
  it("uses fallback plan when no plugin matches", () => {
    const planner = createPlanner([] as any);
    const plan = planner.plan("unknown task");
    expect(plan.mode).toBe("fallback");
  });

  it("uses plugin plan when matched", () => {
    const planner = createPlanner([plugin as any]);
    const plan = planner.plan("anything");
    expect(plan.mode).toBe("plugin");
    expect(plan.steps.length).toBe(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/core/planner.test.ts`
Expected: FAIL with missing planner behavior.

**Step 3: Write minimal implementation**

```ts
export type PlanMode = "plugin" | "fallback";

export function createPlanner(plugins: Array<{ id: string; canHandle(task: string): boolean; plan(task: string): { steps: Array<{ id: string; summary: string }> } }>) {
  return {
    plan(task: string) {
      const matched = plugins.find((p) => p.canHandle(task));
      if (!matched) {
        return {
          mode: "fallback" as PlanMode,
          pluginId: "fallback.generic",
          steps: [{ id: "fallback.explore", summary: "Explore repo and derive execution steps" }]
        };
      }
      return {
        mode: "plugin" as PlanMode,
        pluginId: matched.id,
        ...matched.plan(task)
      };
    }
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/core/planner.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/planner.ts src/core/task-context.ts src/index.ts tests/core/planner.test.ts
git commit -m "feat: add planner routing and fallback plan"
```

### Task 4: Implement Executor + Validator Pipeline

**Files:**
- Create: `src/core/executor.ts`
- Create: `src/core/validator.ts`
- Create: `src/core/reporter.ts`
- Modify: `src/index.ts`
- Test: `tests/core/executor-validator.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { runPipeline } from "../../src/core/executor";

describe("pipeline", () => {
  it("does not return completed when validator fails", async () => {
    const result = await runPipeline(
      { steps: [{ id: "s1", summary: "run" }] } as any,
      async () => ({ ok: true }),
      async () => ({ ok: false, reason: "checks failed" })
    );

    expect(result.status).toBe("needs_fix");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/core/executor-validator.test.ts`
Expected: FAIL with missing pipeline function.

**Step 3: Write minimal implementation**

```ts
export async function runPipeline(
  plan: { steps: Array<{ id: string; summary: string }> },
  run: (plan: { steps: Array<{ id: string; summary: string }> }) => Promise<{ ok: boolean }>,
  validate: (result: { ok: boolean }) => Promise<{ ok: boolean; reason?: string }>
): Promise<{ status: "completed" | "needs_fix"; reason?: string }> {
  const runResult = await run(plan);
  const verifyResult = await validate(runResult);
  if (!verifyResult.ok) {
    return { status: "needs_fix", reason: verifyResult.reason };
  }
  return { status: "completed" };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/core/executor-validator.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/executor.ts src/core/validator.ts src/core/reporter.ts src/index.ts tests/core/executor-validator.test.ts
git commit -m "feat: add execution and verification pipeline"
```

### Task 5: Build Legacy Adapter and Keep `/cowork` Compatibility

**Files:**
- Modify: `command/cowork.md`
- Create: `command/cowork.legacy.md`
- Create: `src/adapter/legacy-adapter.ts`
- Create: `scripts/build-command.ts`
- Modify: `install.sh`
- Modify: `package.json`
- Test: `tests/adapter/legacy-compat.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { buildCoworkCommand } from "../../src/adapter/legacy-adapter";

describe("legacy adapter", () => {
  it("preserves cowork command description header", () => {
    const md = buildCoworkCommand({ mode: "balanced" as const });
    expect(md).toContain("description: Cowork mode");
    expect(md).toContain("$ARGUMENTS");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/adapter/legacy-compat.test.ts`
Expected: FAIL with missing adapter implementation.

**Step 3: Write minimal implementation**

```ts
export function buildCoworkCommand(_: { mode: "safe" | "balanced" | "aggressive" }): string {
  return [
    "---",
    "description: Cowork mode - Autonomous AI agent that reads, edits, and creates files to complete complex tasks",
    "subtask: true",
    "---",
    "",
    "## Your Task",
    "$ARGUMENTS"
  ].join("\n");
}
```

Update installer behavior:
- Prefer generated `dist/command/cowork.md` when present
- Fallback to repository `command/cowork.md` for compatibility

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/adapter/legacy-compat.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add command/cowork.md command/cowork.legacy.md src/adapter/legacy-adapter.ts scripts/build-command.ts install.sh package.json tests/adapter/legacy-compat.test.ts
git commit -m "feat: add legacy adapter while preserving cowork entrypoint"
```

### Task 6: Add First-Party Plugins and Profile Config

**Files:**
- Create: `src/plugins/refactor.ts`
- Create: `src/plugins/bugfix.ts`
- Create: `src/plugins/docgen.ts`
- Create: `src/plugins/migration.ts`
- Create: `src/config/profiles.ts`
- Create: `src/config/load-config.ts`
- Test: `tests/plugins/builtin-plugins.test.ts`
- Test: `tests/config/profile-config.test.ts`

**Step 1: Write the failing tests**

```ts
import { describe, it, expect } from "vitest";
import { loadProfile } from "../../src/config/profiles";
import { refactorPlugin } from "../../src/plugins/refactor";

describe("profiles", () => {
  it("loads balanced profile by default", () => {
    expect(loadProfile(undefined).name).toBe("balanced");
  });
});

describe("plugins", () => {
  it("refactor plugin matches refactor tasks", () => {
    expect(refactorPlugin.canHandle("refactor auth module")).toBe(true);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/plugins/builtin-plugins.test.ts tests/config/profile-config.test.ts`
Expected: FAIL with missing plugin/config modules.

**Step 3: Write minimal implementation**

```ts
export const PROFILES = {
  safe: { name: "safe", autoExecute: false, maxParallelSteps: 1 },
  balanced: { name: "balanced", autoExecute: true, maxParallelSteps: 2 },
  aggressive: { name: "aggressive", autoExecute: true, maxParallelSteps: 4 }
} as const;

export function loadProfile(name?: keyof typeof PROFILES) {
  return PROFILES[name ?? "balanced"];
}

export const refactorPlugin = {
  id: "refactor",
  canHandle: (task: string) => /refactor|reorganize|extract/i.test(task),
  plan: () => ({ steps: [{ id: "refactor.plan", summary: "analyze refactor targets" }] }),
  run: async () => ({ ok: true }),
  verify: async () => ({ ok: true })
};
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/plugins/builtin-plugins.test.ts tests/config/profile-config.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/plugins/refactor.ts src/plugins/bugfix.ts src/plugins/docgen.ts src/plugins/migration.ts src/config/profiles.ts src/config/load-config.ts tests/plugins/builtin-plugins.test.ts tests/config/profile-config.test.ts
git commit -m "feat: add builtin plugins and profile config"
```

### Task 7: Add E2E Compatibility Tests and Documentation

**Files:**
- Test: `tests/e2e/cowork-command.e2e.test.ts`
- Modify: `README.md`
- Modify: `README_ZH.md`
- Modify: `CONTRIBUTING.md`
- Modify: `CHANGELOG.md`

**Step 1: Write the failing E2E compatibility test**

```ts
import { describe, it, expect } from "vitest";
import { buildCoworkCommand } from "../../src/adapter/legacy-adapter";

describe("cowork compatibility e2e", () => {
  it("keeps legacy markers required by existing users", () => {
    const md = buildCoworkCommand({ mode: "balanced" });
    expect(md).toContain("## Your Task");
    expect(md).toContain("$ARGUMENTS");
    expect(md).toContain("Execution Flow");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/e2e/cowork-command.e2e.test.ts`
Expected: FAIL because adapter output is still incomplete.

**Step 3: Implement minimal fix + docs updates**

- Expand adapter output to include the full compatibility sections (`How You Work`, `Execution Flow`, `Important Notes`)
- Update docs with:
  - v3 plugin architecture overview
  - compatibility guarantee (`/cowork` unchanged)
  - migration notes for contributors

**Step 4: Run full verification**

Run: `npm test`
Expected: PASS (all tests green)

Run: `npm run build`
Expected: PASS (`tsc` exits with code 0)

Run: `bash -n install.sh`
Expected: PASS (no syntax errors)

**Step 5: Commit**

```bash
git add tests/e2e/cowork-command.e2e.test.ts README.md README_ZH.md CONTRIBUTING.md CHANGELOG.md src/adapter/legacy-adapter.ts
git commit -m "feat: finalize v3 compatibility and docs"
```

### Task 8: Release Preparation (Beta)

**Files:**
- Modify: `package.json`
- Modify: `CHANGELOG.md`
- Modify: `.github/workflows/ci.yml`

**Step 1: Write failing CI expectation (local check)**

Add CI assertions for:
- `npm test`
- `npm run build`
- `bash -n install.sh`

**Step 2: Run pipeline to expose missing pieces**

Run: `npm test && npm run build && bash -n install.sh`
Expected: FAIL until CI and scripts are aligned.

**Step 3: Implement release readiness changes**

- Set version to `3.0.0-beta.1`
- Add changelog entries for plugin runtime and compatibility policy
- Ensure CI executes full verification matrix

**Step 4: Re-run verification**

Run: `npm test && npm run build && bash -n install.sh`
Expected: PASS

**Step 5: Commit**

```bash
git add package.json CHANGELOG.md .github/workflows/ci.yml
git commit -m "chore: prepare v3.0.0-beta.1 release"
```

## Global Verification Checklist (Must run before merge)

1. `npm test` => all tests pass, zero failed suites
2. `npm run build` => TypeScript compile success
3. `bash -n install.sh` => installer syntax valid
4. Manual smoke:
- install script copies `cowork.md`
- `/cowork <task>` format remains unchanged in generated command text

## Skills to apply during execution

- `@superpowers/test-driven-development`
- `@superpowers/systematic-debugging`
- `@superpowers/verification-before-completion`
- `@superpowers/requesting-code-review`
