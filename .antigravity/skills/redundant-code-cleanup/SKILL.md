---
name: redundant-code-cleanup
description: Identify and safely remove or isolate redundant code (unused commands, dead code, duplicated logic). Use when cleaning up after a refactor, when tests or builds fail due to obsolete code, or when consolidating logic into a single source of truth.
---

# Redundant Code Cleanup

Use this skill when removing or isolating code that is no longer used or that duplicates logic elsewhere, especially in test or support code.

## 1. When to apply

- After refactoring (e.g. moving “ready” logic into shared-test-utils): remove or isolate the old code so it isn’t executed or parsed.
- Unused Cypress commands, Jest helpers, or similar that are never invoked.
- Duplicate logic that now lives in a single place; remove the duplicate and keep one source of truth.
- Build/compile errors caused by “commented” code that still gets parsed (e.g. block comments containing `*/`).

## 2. Safety rules

- **Do not delete code that is still referenced.** Search the repo for usages (e.g. command name, function name, file path) before removing.
- **Prefer remove over comment** when the code is clearly dead. If you comment, avoid block comments `/* ... */` that contain `*/` inside (e.g. in strings or CSS) — that closes the comment and can break parsing. Use line comments `//` or remove the block entirely.
- **Keep type declarations** when removing implementations (e.g. Cypress command types) if other code or docs reference them, unless you confirm no references exist.
- **One logical change per cleanup** (e.g. one file or one command group) so changes are easy to review and revert.

## 3. Checklist for visual tests repo (globale.core.checkout.visual.tests)

- **cypress/support/commands.ts:**  
  If custom commands were moved to shared-test-utils, remove their implementations. Do not wrap large blocks that contain `*/` (e.g. template literals with CSS) in `/* ... */` — remove the block or use a separate file that is not loaded. Keep `declare global` types only if needed for TypeScript.
- **tests/shared-test-utils.ts:**  
  Single source of truth for checkout readiness; don’t leave duplicate “wait for ready” logic in commands or elsewhere.
- **Legacy/backup specs:**  
  If a file is explicitly backup/legacy (e.g. daily-checkout-test.cy.ts), leave it as-is or document it; only remove if the team confirms.

## 4. Verification after cleanup

- Run the test suite (e.g. `npm run visual:test:stg-int` or prod) to ensure nothing breaks.
- Run a quick lint/build if available (e.g. TypeScript compile) so commented/removed code doesn’t introduce parse errors.

## 5. Integration with visual-test-runner

When the user asks to “run visual tests and clean redundant code,” run the visual suite first and fix any failures (using the visual-test-stability skill). After tests pass, apply this skill to remove or isolate redundant code (e.g. in commands.ts) and re-run the suite once to confirm.
