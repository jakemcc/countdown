Notes for countdown2

Project goal
Create a static web app for tracking page-by-page editing progress.
The app shows a grid of pages and a burndown chart with pages on Y-axis and dates on X-axis.

Inputs
- Total pages
- Start date
- End date

Rules
- Only the next page can be checked.
- "Lock in" sets the locked frontier to the highest completed page.
- Pages at or below the locked frontier cannot be undone.

Data storage
- IndexedDB for all state.
- Single project, one book at a time.
- Request persistent storage after user actions; show a warning if denied.

Chart
- Inline SVG, no third-party libraries.
- Two lines: actual remaining pages vs ideal burn (total pages / total days).
- After today, the actual line projects with a dotted continuation using current pace.
- Actual remaining repeats on days with no progress.
- Legend includes Actual, Ideal, and Projected.
- X-axis uses daily bins from start date to end date until the first completion.
- After the first completion, the chart shows through today + 3 days, capped at the end date.
- Ideal values stay tied to the full project timeline even when the chart window is shorter.

UI layout
- Setup panel for inputs.
- Page grid for tick list.
- Burndown chart.
- Header stats: days left, planned pace, current pace, pace needed.
- Header stats include % Done based on completed pages.
- Compact header with eyebrow only; stats box reduced for mobile.
- Small-screen stats stack labels above values.
- Stats are centered within the header card.
- Small-screen page grid targets 10 columns with tighter spacing.
- Page Frontier header text removed; buttons remain.
- Header stats hide completed; total pages default to 140.
- Stats update no longer expects a completed node after removal.
- Change goal button edits total pages inline; shrinking trims completions and clamps the lock.
- Page tile completion triggers a confetti burst.
- Confetti burst is medium: more pieces, wider spread, longer duration.
- Confetti burst is wild: larger, longer, and wider.
- Confetti now randomizes subtle/medium/wild presets.
- Confetti bursts use heart-shaped pieces 35% of the time.
- Heart-shaped confetti pieces are larger (20px) for readability.
- GitHub Pages workflow copies site files into a single artifact folder.
- Locked page tiles render a lock icon instead of the page number.

Files
- index.html
- styles.css
- app.js
