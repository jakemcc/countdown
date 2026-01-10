function normalizeDate(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function toDateKey(date) {
  const d = normalizeDate(date);
  const year = String(d.getFullYear());
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildDateRange(startDate, endDate) {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);

  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
    return [];
  }
  if (end < start) {
    return [];
  }

  const days = [];
  let cursor = start;
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor = new Date(
      cursor.getFullYear(),
      cursor.getMonth(),
      cursor.getDate() + 1
    );
  }
  return days;
}

export function computeIdealRemaining(totalPages, dateRange) {
  if (!dateRange.length) {
    return [];
  }
  if (dateRange.length === 1) {
    return [totalPages];
  }
  const lastIndex = dateRange.length - 1;
  return dateRange.map((_, index) => {
    const remaining = totalPages * (1 - index / lastIndex);
    return Math.max(0, remaining);
  });
}

export function computeActualRemaining(totalPages, dateRange, completions) {
  const counts = new Map();
  for (const completion of completions) {
    const count = counts.get(completion.date) ?? 0;
    counts.set(completion.date, count + 1);
  }

  let completed = 0;
  return dateRange.map((date) => {
    const key = toDateKey(date);
    completed += counts.get(key) ?? 0;
    return Math.max(totalPages - completed, 0);
  });
}

export function getNextPage(totalPages, completedPages) {
  const maxCompleted = completedPages.length
    ? Math.max(...completedPages)
    : 0;
  const next = maxCompleted + 1;
  if (typeof totalPages !== "number") {
    return next;
  }
  return next > totalPages ? null : next;
}

export function isPageCompletable(pageNumber, totalPages, completedPages) {
  const next = getNextPage(totalPages, completedPages);
  return next !== null && pageNumber === next;
}

export function completePage(completedPages, pageNumber, totalPages) {
  if (!isPageCompletable(pageNumber, totalPages, completedPages)) {
    return completedPages;
  }
  return [...completedPages, pageNumber];
}

export function canUndo(completedPages, lockedFrontier) {
  if (!completedPages.length) {
    return false;
  }
  const last = completedPages[completedPages.length - 1];
  return last > lockedFrontier;
}

export function undoLast(completedPages, lockedFrontier) {
  if (!canUndo(completedPages, lockedFrontier)) {
    return completedPages;
  }
  return completedPages.slice(0, -1);
}

export function lockIn(completedPages) {
  return completedPages.length ? Math.max(...completedPages) : 0;
}
