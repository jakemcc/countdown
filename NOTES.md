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

Chart
- Inline SVG, no third-party libraries.
- Two lines: actual remaining pages vs ideal burn (total pages / total days).
- Actual remaining repeats on days with no progress.
- X-axis uses daily bins from start date to end date.

UI layout
- Setup panel for inputs.
- Page grid for tick list.
- Burndown chart.
- Header stats: completed, remaining, days elapsed, days left, pace needed.

Files
- index.html
- styles.css
- app.js
