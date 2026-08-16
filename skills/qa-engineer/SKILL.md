---
name: qa-engineer
description: Guarantees quality before code is merged. Use when modifying source code, adding features, fixing bugs, refactoring, changing APIs, changing the database schema, or touching the UI. Runs the appropriate test level (unit/integration/e2e/regression/smoke) based on the change type, blocks commit/push/PR on failure, and produces a QA Report.
---

# QA Engineer

## Overview

Every change must meet the project quality gates before it reaches the repository. This skill selects the right tests for the change, executes them against the real system, and blocks release unless everything passes. Follows the AGENTS.md policy: **Postgres is the only source of truth** and **no merge to `dev` without local tests passing**.

## When to Use

This skill applies automatically when any of the following happens:

- Source code is modified.
- A feature is added.
- Code is deleted.
- An API endpoint changes.
- The database schema changes (`prisma/schema.prisma`).
- The UI/UX changes.
- A bug is fixed.
- Code is refactored or simplified.

## Analysis First (never skip)

Before choosing tests, understand the change:

1. Identify modified files (`git status`, `git diff`).
2. Identify affected components and runtime flows.
3. Identify risks and dependencies (DB, API contracts, roles/permissions, shared components).

## Selecting the Right Test Level (scale by change type)

| Change type | Test level required | Notes / concrete tools |
|---|---|---|
| Pure logic, business rule, function/class | **Unit** | If a runner exists for the area; otherwise rely on integration + e2e below |
| API / service / DB / communication between modules | **Integration** | Hit real endpoints via the running backend (Postgres via Prisma). See `scratch/` runners |
| Interface / navigation / full flow | **End-to-End (E2E)** | **Playwright** (`npx playwright test`) from a real browser against `http://localhost:3000`. This is mandatory before any PR to `dev` (see AGENTS.md) |
| Existing code changed, bug fix, refactor | **Regression** | Re-run the affected module's e2e specs plus affected flows |
| Closing a task / before handoff | **Smoke** | Always run before task close |

> Do not over-test: a one-line fix does not require re-running every spec in the suite. Scale the level to the surface area of the change, but **never skip e2e for UI/flow changes**.

## Mandatory Verification Steps (baseline for this repo)

1. **Compile/type-check**: `npm run lint` → clean. Fix errors from your own change; triage pre-existing unrelated errors separately.
2. **E2E from the browser** (UI/flow changes): `npx playwright test` — simulate real user interaction (clicks, forms, navigation). Do NOT verify UI with isolated unit tests only.
3. **Integration** (API/DB/model/offline sync/state cascade): validate endpoints and `prisma.schema.prisma` behavior without breaking existing flows.
4. If e2e/integration scenarios were authored, persist them to `Documentacion/pruebas_e2e/<slug>.md`.

## QA Report (mandatory artifact)

After verification, produce a concise report covering:

- Files affected
- Tests executed
- Tests passed
- Tests failed (with root cause + fix status)
- Coverage note (what was and was not covered)
- Risks / dependencies
- Status: **APPROVED** or **REJECTED**

## Definition of Done (DoD)

- [ ] Code compiles.
- [ ] Lint is clean (own changes; pre-existing unrelated errors noted, not blocking).
- [ ] All applicable unit/integration/e2e/regression/smoke tests pass.
- [ ] No critical errors.
- [ ] E2E flows captured in `Documentacion/pruebas_e2e/` when UI/API changed.
- [ ] QA Report generated with status **APPROVED**.
- [ ] Ready for commit → push → PR.

## Policy

- Never commit if any test fails.
- Never push with lint errors.
- Never accept code without tests.
- Never bypass e2e for UI/API changes.
- Always generate a QA Report.
- Postgres (via Prisma) is the single source of truth — do not validate against `db.json` or mock files for data.

## Rejection criteria

Reject when any of:

- A test fails.
- Compilation errors exist.
- Lint errors exist (from the change).
- No tests exist for a new feature.

## Philosophy

Never assume. Always verify. Automate everything possible.

## See Also

- Project test/QA orchestration: `Documentacion/planes/qa/` and `Documentacion/pruebas_e2e/`.
- Mandatory e2e/integration rules and branch policy: root `AGENTS.md`.
- UI quality rules (no `window.alert`, tokens, Dashboard reference): `Documentacion/guia_ui_ux.md`.