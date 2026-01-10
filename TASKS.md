# TASKS.md — Page Countdown

Format:
- Each task has a unique ID: `countdown-XX`
- Dependencies listed as `Depends on: ...`
- Each task includes clear completion criteria

---

## countdown-01 — Repo scaffold
Depends on: none

Create a repo scaffold suitable for GitHub Pages hosting.
Completion criteria:
- `package.json` exists with Vite (or equivalent)
- `npm run dev` runs
- `npm run build` outputs static files to `dist/`

---

## countdown-02 — Test runner setup
Depends on: countdown-01

Add a unit test runner (e.g., Vitest).
Completion criteria:
- `npm run test` runs and executes at least one test file successfully

---

## countdown-03 — Domain types
Depends on: countdown-01

Define types/interfaces:
- Project settings (totalPages, startDate, dueDate)
- Event types: `complete_pages`, `undo`, `lock`
Completion criteria:
- Types exist and are used (no `any` in domain modules)

---

## countdown-04 — Date utilities (pure + tested)
Depends on: countdown-02, countdown-03

Implement and test:
- parse/format `YYYY-MM-DD`
- inclusive date range generation
- “end of day” timestamp boundary for local time
Completion criteria:
- Unit tests cover typical and edge cases

---

## countdown-05 — Event replay reducer (pure + tested)
Depends on: countdown-02, countdown-03

Implement a pure reducer that replays events -> derived state:
- `lockedPage` (max of all locks)
- `lastCompletedPage`
- `remainingPages`
- tracking needed to support undo (e.g., completion stack or equivalent)
Completion criteria:
- Unit tests cover replay order and correctness

---

## countdown-06 — Forward-only completion rule (pure + tested)
Depends on: countdown-02, countdown-05

Implement logic to create a completion event:
- “complete next page”
- “complete next N pages”
Must:
- start at `lastCompletedPage + 1`
- clamp to totalPages
Completion criteria:
- Unit tests verify no gaps and clamping

---

## countdown-07 — Undo rule with lock boundary (pure + tested)
Depends on: countdown-02, countdown-05

Implement undo behavior:
- Undo reverses the most recent undoable completion action
- Undo cannot reduce `lastCompletedPage` below `lockedPage`
Completion criteria:
- Unit tests cover:
  - single undo
  - multiple undos
  - undo blocked by lock boundary
  - undo when nothing to undo (no-op or error handled)

---

## countdown-08 — Lock rule (lock the current page frontier) (pure + tested)
Depends on: countdown-02, countdown-05

Implement lock behavior:
- Locking sets `lockedPage = max(lockedPage, lockedUntilPage)`
- The Lock UI action should typically create `lockedUntilPage = lastCompletedPage` at the moment of locking
Completion criteria:
- Unit tests cover:
  - locking at current progress
  - multiple locks
  - lock prevents undo past boundary (integration via reducer tests)

---

## countdown-09 — Ideal burndown series (pure + tested)
Depends on: countdown-02, countdown-03, countdown-04

Compute ideal remaining line:
- dates from startDate..dueDate
- linear from totalPages to 0
Completion criteria:
- Unit tests cover start==due, small totals, clamps

---

## countdown-10 — Actual burndown series (pure + tested)
Depends on: countdown-02, countdown-04, countdown-05

Compute actual remaining per date:
- for each date, replay events with timestamp <= end-of-day
- remaining can rise if undo occurs later
Completion criteria:
- Unit tests cover:
  - multiple events across days
  - undo on a later day
  - lock events included (don’t break series)

---

## countdown-11 — IndexedDB storage wrapper
Depends on: countdown-01, countdown-03

Implement storage API using IndexedDB:
- getProject / saveProject
- getEvents / appendEvent
- resetAll
Completion criteria:
- Refresh reloads project + events successfully

---

## countdown-12 — App shell + routing between Setup/Main
Depends on: countdown-01, countdown-11

Two states:
- Setup screen when no project exists
- Main screen when project exists
Completion criteria:
- Correct screen shown on load depending on storage

---

## countdown-13 — Setup screen UI + validation
Depends on: countdown-12

UI fields:
- totalPages (>=1)
- startDate
- dueDate (>= startDate)
Completion criteria:
- Valid setup persists project
- Invalid input blocks save with clear message

---

## countdown-14 — Main summary header (includes lock boundary)
Depends on: countdown-05, countdown-11, countdown-12

Display:
- completed / remaining
- due date
- **Locked through page: X** (where X = current `lockedPage`, default 0)
- optional: “pace needed from today to due”
Completion criteria:
- Updates instantly after any event append
- Locked boundary display is correct and survives refresh

---

## countdown-15 — Complete next page UI
Depends on: countdown-06, countdown-11, countdown-14

Add primary button:
- Appends `complete_pages` event for next page
Completion criteria:
- Works end-to-end; disabled when remaining==0

---

## countdown-16 — Complete next N pages UI
Depends on: countdown-06, countdown-11, countdown-14

Add input + button:
- N integer >= 1
- appends completion event for next N pages
Completion criteria:
- Clamps at totalPages; UI updates correctly

---

## countdown-17 — Undo UI
Depends on: countdown-07, countdown-11, countdown-14

Add Undo button:
- appends `undo` event
- disabled when undo not possible (no undoable completion or blocked by lock boundary)
Completion criteria:
- Undo changes derived state correctly
- Disabled state is correct (including lock boundary)

---

## countdown-18 — Lock progress UI (locks current page frontier)
Depends on: countdown-08, countdown-11, countdown-14

Add Lock button:
- appends `lock` event with `lockedUntilPage = lastCompletedPage` at the moment of pressing Lock
- include confirmation (“This prevents undoing earlier pages”)
Completion criteria:
- After locking, undo cannot go below locked boundary
- Lock is persisted and survives refresh
- Header “Locked through page: X” updates immediately

---

## countdown-19 — Grid view (note-card feel)
Depends on: countdown-05, countdown-14

Render page numbers in a grid:
- completed pages crossed off
- upcoming pages normal
Completion criteria:
- Looks good on mobile and desktop
- For ~140 pages, renders all pages without performance issues

---

## countdown-20 — Grid scaling strategy for larger totals
Depends on: countdown-19

If totalPages is “large” (choose a threshold), avoid heavy DOM:
- paging or windowing
Completion criteria:
- Large totals remain responsive
- Past pages are viewable read-only; no gap editing

---

## countdown-21 — Chart rendering (actual + ideal)
Depends on: countdown-09, countdown-10, countdown-12

Render chart with:
- two lines (ideal, actual)
- X-axis dates, Y-axis remaining pages
Completion criteria:
- Chart renders without console errors
- Responsive on mobile

---

## countdown-22 — Ahead/behind indicator (small UX win)
Depends on: countdown-21, countdown-14

Show “X pages ahead/behind pace” for today (or nearest date).
Completion criteria:
- Correct calculation; handles edge cases (finished, due today)

---

## countdown-23 — Export JSON
Depends on: countdown-11

Export settings + events as JSON file.
Completion criteria:
- Exported JSON restores the same state when imported

---

## countdown-24 — Import JSON
Depends on: countdown-23

Import JSON with confirmation (replaces current project).
Completion criteria:
- Invalid JSON shows error and does not modify state
- Valid JSON fully restores

---

## countdown-25 — Reset project
Depends on: countdown-11, countdown-12

Reset with confirmation.
Completion criteria:
- Clears IndexedDB and returns to setup screen

---

## countdown-26 — Styling + accessibility pass
Depends on: countdown-15, countdown-17, countdown-19, countdown-21

Improve:
- button sizes (mobile)
- contrast for crossed-off pages
- keyboard focus and sensible tab order
Completion criteria:
- No obvious mobile layout breakage
- Primary actions usable via keyboard

---

## countdown-27 — CI workflow (build + test)
Depends on: countdown-02, countdown-01

Add GitHub Actions workflow:
- install
- test
- build
Completion criteria:
- CI runs on PRs and passes on main

---

## countdown-28 — GitHub Pages deployment
Depends on: countdown-01, countdown-27

Configure deployment to GitHub Pages.
Completion criteria:
- `main` deploys successfully
- App is reachable via Pages URL

---

## countdown-29 — Minimal README
Depends on: countdown-28, countdown-23, countdown-24

Document:
- what it is
- local dev commands
- backup/restore
Completion criteria:
- New user can run locally in < 5 minutes
- Backup/restore steps are clear
