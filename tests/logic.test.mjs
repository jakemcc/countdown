import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDateRange,
  buildChartDateRange,
  computeIdealRemaining,
  computeIdealRemainingForChart,
  computeActualRemaining,
  computePaceStats,
  getNextPage,
  isPageCompletable,
  completePage,
  canUndo,
  undoLast,
  lockIn,
  toDateKey,
  shouldUseHeartConfetti,
  getHeartBurstChance,
} from "../logic.mjs";

test("buildDateRange returns inclusive dates", () => {
  const start = new Date(2025, 0, 1);
  const end = new Date(2025, 0, 3);
  const range = buildDateRange(start, end);

  assert.equal(range.length, 3);
  assert.equal(toDateKey(range[0]), "2025-01-01");
  assert.equal(toDateKey(range[2]), "2025-01-03");
});

test("buildChartDateRange shows the full range before any completions", () => {
  const start = new Date(2025, 0, 1);
  const end = new Date(2025, 0, 5);
  const range = buildChartDateRange(start, end, [], new Date(2025, 0, 2));

  assert.equal(range.length, 5);
  assert.equal(toDateKey(range[0]), "2025-01-01");
  assert.equal(toDateKey(range[4]), "2025-01-05");
});

test("buildChartDateRange caps at today plus three after progress", () => {
  const start = new Date(2025, 0, 1);
  const end = new Date(2025, 0, 10);
  const completions = [{ page: 1, date: "2025-01-02" }];
  const range = buildChartDateRange(
    start,
    end,
    completions,
    new Date(2025, 0, 3)
  );

  assert.equal(range.length, 6);
  assert.equal(toDateKey(range[0]), "2025-01-01");
  assert.equal(toDateKey(range[5]), "2025-01-06");
});

test("buildChartDateRange clamps to the start if the window ends early", () => {
  const start = new Date(2025, 0, 10);
  const end = new Date(2025, 0, 20);
  const completions = [{ page: 1, date: "2025-01-11" }];
  const range = buildChartDateRange(
    start,
    end,
    completions,
    new Date(2025, 0, 1)
  );

  assert.equal(range.length, 1);
  assert.equal(toDateKey(range[0]), "2025-01-10");
});

test("computeIdealRemaining linearly decreases to zero", () => {
  const start = new Date(2025, 0, 1);
  const end = new Date(2025, 0, 5);
  const range = buildDateRange(start, end);
  const ideal = computeIdealRemaining(100, range);

  assert.equal(ideal.length, 5);
  assert.equal(ideal[0], 100);
  assert.equal(ideal[4], 0);
});

test("computeIdealRemainingForChart uses the full project slope", () => {
  const start = new Date(2025, 0, 1);
  const end = new Date(2025, 0, 10);
  const fullRange = buildDateRange(start, end);
  const chartRange = buildDateRange(start, new Date(2025, 0, 4));
  const ideal = computeIdealRemainingForChart(100, fullRange, chartRange);

  assert.equal(ideal.length, 4);
  assert.ok(Math.abs(ideal[3] - 66.6667) < 0.01);
});

test("computeActualRemaining repeats remaining on no-progress days", () => {
  const start = new Date(2025, 0, 1);
  const end = new Date(2025, 0, 4);
  const range = buildDateRange(start, end);
  const completions = [
    { page: 1, date: "2025-01-01" },
    { page: 2, date: "2025-01-03" },
  ];
  const remaining = computeActualRemaining(5, range, completions);

  assert.deepEqual(remaining, [4, 4, 3, 3]);
});

test("computePaceStats uses inclusive day counts for planned and current pace", () => {
  const start = new Date(2025, 0, 1);
  const end = new Date(2025, 0, 5);
  const completions = [
    { page: 1, date: "2025-01-01" },
    { page: 2, date: "2025-01-02" },
    { page: 3, date: "2025-01-03" },
  ];
  const stats = computePaceStats({
    totalPages: 30,
    startDate: start,
    endDate: end,
    completions,
    today: new Date(2025, 0, 3),
  });

  assert.equal(stats.daysLeft, 3);
  assert.equal(stats.plannedPace, 6);
  assert.equal(stats.currentPace, 1);
  assert.equal(stats.paceNeeded, 9);
});

test("computePaceStats clamps days left after the end date", () => {
  const start = new Date(2025, 0, 1);
  const end = new Date(2025, 0, 5);
  const completions = [
    { page: 1, date: "2025-01-01" },
    { page: 2, date: "2025-01-02" },
  ];
  const stats = computePaceStats({
    totalPages: 10,
    startDate: start,
    endDate: end,
    completions,
    today: new Date(2025, 0, 7),
  });

  assert.equal(stats.daysLeft, 0);
  assert.equal(stats.currentPace, 0.4);
});

test("getNextPage returns the next sequential page", () => {
  assert.equal(getNextPage(5, []), 1);
  assert.equal(getNextPage(5, [1, 2, 3]), 4);
  assert.equal(getNextPage(3, [1, 2, 3]), null);
});

test("isPageCompletable only allows the next page", () => {
  assert.equal(isPageCompletable(1, 5, []), true);
  assert.equal(isPageCompletable(2, 5, []), false);
  assert.equal(isPageCompletable(2, 5, [1]), true);
  assert.equal(isPageCompletable(4, 5, [1, 2]), false);
});

test("completePage only adds the next page", () => {
  assert.deepEqual(completePage([], 1), [1]);
  assert.deepEqual(completePage([1], 3), [1]);
  assert.deepEqual(completePage([1], 2), [1, 2]);
});

test("canUndo only allows undo above the locked frontier", () => {
  assert.equal(canUndo([1, 2, 3], 0), true);
  assert.equal(canUndo([1, 2, 3], 3), false);
  assert.equal(canUndo([], 0), false);
});

test("undoLast removes the latest completion if allowed", () => {
  assert.deepEqual(undoLast([1, 2, 3], 0), [1, 2]);
  assert.deepEqual(undoLast([1, 2, 3], 3), [1, 2, 3]);
});

test("lockIn returns the highest completed page", () => {
  assert.equal(lockIn([]), 0);
  assert.equal(lockIn([1, 2, 3]), 3);
});

test("shouldUseHeartConfetti returns true below the chance threshold", () => {
  assert.equal(shouldUseHeartConfetti(0.34, 0.35), true);
});

test("shouldUseHeartConfetti returns false at or above the chance threshold", () => {
  assert.equal(shouldUseHeartConfetti(0.35, 0.35), false);
  assert.equal(shouldUseHeartConfetti(0.9, 0.35), false);
});

test("getHeartBurstChance returns the default heart confetti chance", () => {
  assert.equal(getHeartBurstChance(), 0.35);
});
