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

export function buildChartDateRange(
  startDate,
  endDate,
  completions,
  today = new Date()
) {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);

  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
    return [];
  }
  if (end < start) {
    return [];
  }

  const hasCompletions = Array.isArray(completions) && completions.length > 0;
  if (!hasCompletions) {
    return buildDateRange(start, end);
  }

  const normalizedToday = normalizeDate(today);
  const windowEnd = new Date(
    normalizedToday.getFullYear(),
    normalizedToday.getMonth(),
    normalizedToday.getDate() + 3
  );
  const cappedEnd = windowEnd < end ? windowEnd : end;
  const clampedEnd = cappedEnd < start ? start : cappedEnd;
  return buildDateRange(start, clampedEnd);
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

export function computeIdealRemainingForChart(
  totalPages,
  fullDateRange,
  chartDateRange
) {
  if (!fullDateRange.length || !chartDateRange.length) {
    return [];
  }
  const ideal = computeIdealRemaining(totalPages, fullDateRange);
  const length = Math.min(chartDateRange.length, ideal.length);
  return ideal.slice(0, length);
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

export function computePaceStats({
  totalPages,
  startDate,
  endDate,
  completions,
  today = new Date(),
}) {
  const safeCompletions = Array.isArray(completions) ? completions : [];
  const start = normalizeDate(new Date(startDate));
  const end = normalizeDate(new Date(endDate));
  const dateRange = buildDateRange(start, end);
  const totalDays = Math.max(dateRange.length, 1);
  const normalizedToday = normalizeDate(today);
  const msPerDay = 1000 * 60 * 60 * 24;

  const daysDoneRaw = normalizedToday < start
    ? 0
    : Math.floor((normalizedToday - start) / msPerDay) + 1;
  const daysDone = Math.min(Math.max(daysDoneRaw, 0), totalDays);

  const daysLeftRaw = normalizedToday > end
    ? 0
    : Math.floor((end - normalizedToday) / msPerDay) + 1;
  const daysLeft = Math.min(Math.max(daysLeftRaw, 0), totalDays);

  const completed = safeCompletions.length;
  const remaining = Math.max((Number(totalPages) || 0) - completed, 0);

  const plannedPace = (Number(totalPages) || 0) / totalDays;
  const currentPace = completed / Math.max(daysDone, 1);
  const paceNeeded = remaining / Math.max(daysLeft, 1);

  return {
    daysLeft,
    plannedPace,
    currentPace,
    paceNeeded,
  };
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
