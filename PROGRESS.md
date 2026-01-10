Progress log

2026-01-10
- Fixed Change goal form visibility when hidden.
- Added a Projected label in the burndown legend.
- Added a dotted projection in the burndown chart using current pace after today.
- Added an inline Change goal editor for total pages.
- When the goal shrinks, completions above the new total drop and the lock clamps.
- Adjusted heart confetti chance to 35%.
- Added a 1-in-5 heart-shaped confetti burst.
- Increased heart confetti size for readability.
- Centered header stats in the card layout.
- Stacked stat labels above values on all screen sizes.
- Added a test to keep the mobile stat stack layout.
- Updated header stats to days left, planned pace, current pace, and pace needed.
- Added pace stat calculations with inclusive day counting.
- Added tests for pace stats helper.
- Locked tiles now show a lock icon.
- Fixed GitHub Pages artifact upload by staging files in a site folder.
- Randomized confetti intensity across three presets.
- Tuned confetti to a wild burst.
- Tuned confetti to a medium burst.
- Added a confetti burst on page completion clicks.
- Fixed stats rendering after removing the Completed tile.
- Removed the Completed stat and set total pages default to 140.
- Removed the Page Frontier header text to keep the card compact.
- Tightened the Page Frontier card and set a 10-column grid on small screens.
- Made small-screen stats render as a single-line strip.
- Compacted the hero area to eyebrow-only.
- Shrunk the stats box and made it a horizontal strip on mobile.
- Added chart windowing to show full range before progress and today + 3 days afterward.
- Kept the ideal line tied to the full project timeline with a chart-specific helper.
- Added tests for the chart date range helper.

2025-01-10
- Captured requirements and design decisions.
- Added NOTES.md and AGENTS.md instructions for notes and progress logs.
- Implemented the static app structure, styling, IndexedDB persistence, and SVG burndown rendering.
