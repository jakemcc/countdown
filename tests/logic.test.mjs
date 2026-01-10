import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDateRange,
  computeIdealRemaining,
  computeActualRemaining,
  getNextPage,
  isPageCompletable,
  completePage,
  canUndo,
  undoLast,
  lockIn,
  toDateKey,
} from "../logic.mjs";

test("buildDateRange returns inclusive dates", () => {
  const start = new Date(2025, 0, 1);
  const end = new Date(2025, 0, 3);
  const range = buildDateRange(start, end);

  assert.equal(range.length, 3);
  assert.equal(toDateKey(range[0]), "2025-01-01");
  assert.equal(toDateKey(range[2]), "2025-01-03");
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
