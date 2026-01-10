# Page Countdown (Book Editing Tick List)

A tiny, static, browser-only web app for tracking book editing progress page-by-page (like crossing off page numbers on a note card), plus a burndown chart showing “remaining pages” vs an “ideal pace” line to finish by a deadline.

Designed to be simple, fast, and motivating.

## Core Concept

- Pages are edited from **page 1 forward**.
- The app displays a **grid of page numbers**; completed pages are crossed off.
- A **burndown chart** shows:
  - **Actual remaining pages** over time (can go up if you undo)
  - **Ideal remaining pages** assuming constant pace from start date to due date

## Key Behaviors

### Forward-only completion
- You can only mark completion starting at the next uncompleted page (`lastCompletedPage + 1`).
- No gaps; you can’t complete page 10 if page 9 isn’t complete.

### Undo (mistakes happen)
- The app supports undoing completion actions.
- Undo is **bounded by locks** (see below).

### Lock-in progress (chapter finished)
- The user can **lock the current page frontier** (lock progress up through the current completed page).
- Pressing **Lock** makes earlier progress immutable:
  - You **cannot undo** any completion that would move progress below the locked boundary.
  - In practice: once a chapter is finished, lock it so you can’t go back.

#### What “Lock” means (precise)
- Pressing **Lock** creates a `lock` event where:
  - `lockedUntilPage = lastCompletedPage` at the moment Lock is pressed.
- Let `lockedPage` be the max of all `lockedUntilPage` values seen so far.
- Undo is permitted only if the resulting `lastCompletedPage >= lockedPage`.

## Primary User Flow

1. **Setup**
   - Enter:
     - Total pages (integer, e.g. 140)
     - Start date
     - Due date
   - App initializes locally in the browser.

2. **Daily editing**
   - Primary action: **Complete next page**
   - Secondary: **Complete next N pages**
   - Occasional: **Undo last action**
   - When finishing a chapter: **Lock progress** (locks the current page frontier)

3. **Monitoring**
   - Summary shows: completed, remaining, due date, pace needed, and **Locked through page: X**
   - Burndown chart shows actual vs ideal.

## Burndown Chart Definition

- X-axis: dates from `startDate` to `dueDate` (inclusive)
- Y-axis: remaining pages
- Ideal line:
  - Straight line from `(startDate, totalPages)` to `(dueDate, 0)`
- Actual line:
  - For each day, compute remaining pages **as-of end-of-day** based on the event log up to that point.
  - If undo happens later, the actual line may rise on that later date (which is expected and useful).

## Storage

- No backend, no accounts.
- Persist to **IndexedDB** (best long-lived browser storage option).
- Support **Export/Import JSON** for backup/migration.
- “Reset project” with confirmation.

## Data Model (high-level)

Project settings:
- `totalPages: number`
- `startDate: YYYY-MM-DD`
- `dueDate: YYYY-MM-DD`

Event log (append-only):
- `complete_pages`:
  - `timestamp`
  - `fromPage`
  - `toPage`
- `undo`:
  - `timestamp`
  - (undoes the most recent *undoable* completion action)
- `lock`:
  - `timestamp`
  - `lockedUntilPage` (typically current `lastCompletedPage`)

Derived state:
- `lockedPage` (max of all locks)
- `lastCompletedPage`
- `remainingPages = totalPages - lastCompletedPage`

## UX Notes

- Mobile-first: big primary button for “Complete next page”.
- Grid should be “note-card-like” for ~140 pages, but remain usable for larger totals:
  - for larger page counts, use paging/windowing to avoid slow rendering.
- The header should always show **Locked through page: X** so it’s obvious why undo might be disabled.

## Success Criteria

- Setup in under a minute.
- Logging progress is faster than the physical card.
- Undo fixes mistakes without letting locked chapters get reopened.
- The chart clearly answers: “Am I on pace to finish by the due date?”
- Data survives refresh/restart and is recoverable via export.
