# AGENTS.md — Codex CLI Guidance

This repo contains a static, client-only web app (“Page Countdown”) hosted on GitHub Pages.

## Goals
- Keep the UI extremely simple and fast.
- Support forward-only completion.
- Support undo for mistakes.
- Support “lock-in” so progress before a boundary can’t be undone (chapter complete).
- Persist all state in IndexedDB.
- Provide an accurate burndown chart (actual remaining vs ideal remaining).
- Include unit tests for core logic (pace math, forward-only rules, undo + lock behavior, event replay).

## Recommended stack
- TypeScript + Vite
- IndexedDB via a small helper (e.g., `idb-keyval` or a minimal wrapper)
- Chart.js OR a minimal SVG chart (both acceptable; keep deps light)
- No backend, no auth.

## Suggested structure
- `src/`
  - `domain/` (pure, testable)
    - `types.ts` (Project, Event types)
    - `date.ts` (date math helpers)
    - `reducer.ts` (event replay -> derived state)
    - `rules.ts` (forward-only, undoability rules)
    - `burndown.ts` (ideal + actual series)
  - `storage/`
    - `db.ts` (IndexedDB reads/writes)
  - `ui/`
    - `SetupView.ts`
    - `MainView.ts`
    - `GridView.ts`
    - `ChartView.ts`
    - `ExportImportView.ts`
- `tests/` (Vitest)

## Behavioral requirements

### Forward-only completion
- Allowed completion always starts at `state.lastCompletedPage + 1`.
- Completing N pages completes `[from..to]` where:
  - `from = lastCompletedPage + 1`
  - `to = min(totalPages, from + N - 1)`
- No gaps.

### Undo behavior
- Undo should reverse the **most recent completion action that is still undoable**.
- Undo must not reduce progress below the locked boundary:
  - Let `lockedPage` be the current lock boundary.
  - After undo, `lastCompletedPage >= lockedPage` must remain true.
- If undo would cross the lock boundary, disable/deny undo.

### Lock behavior (lock the current page frontier)
- Pressing the Lock UI action should create a `lock` event with:
  - `lockedUntilPage = state.lastCompletedPage` at the moment the user presses Lock.
- Reducer rule:
  - `lockedPage = max(lockedPage, lockedUntilPage)`
- Once locked, earlier progress becomes immutable (cannot be undone past `lockedPage`).

### Event sourcing
- Use an append-only event log with event types:
  - `complete_pages`, `undo`, `lock`
- Derived state is produced by replaying events in timestamp order.
- Burndown “actual” series is computed by replaying events up through each day’s end-of-day.

### Burndown rules
- X-axis dates include every day from startDate to dueDate inclusive.
- Ideal remaining is linear from totalPages to 0 by dueDate.
- Actual remaining is derived from event replay as-of each date.
- Actual can rise on days where undos occur (expected).

Be explicit about inclusive/exclusive date handling. Add unit tests.

## Storage requirements
- IndexedDB for project + events.
- Export/Import JSON for the entire project.
- Reset with confirmation.

## UX requirements
- Mobile-first.
- Primary: “Complete next page” (big button).
- Secondary: “Complete next N pages”.
- Also visible: “Undo” and “Lock progress”.
- Header must show **Locked through page: X** so it’s obvious why undo might be disabled.
- Grid should be readable for ~140 pages, but handle larger totals via paging/windowing if needed.

## Testing requirements
Add unit tests for:
- forward-only completion creation
- undo behavior (including multiple undos)
- lock behavior (undo blocked past lock boundary)
- event replay correctness
- burndown series generation with undos + locks
- date math edge cases (start==due, etc.)

## Commands
- `npm run dev`
- `npm run build`
- `npm run test`

## Don’ts
- No backend, no accounts.
- Don’t rely on only localStorage for persistence.
- Don’t add heavy frameworks without justification.
