import {
  buildDateRange,
  buildChartDateRange,
  computeActualRemaining,
  computeIdealRemainingForChart,
  getNextPage,
  isPageCompletable,
  canUndo,
  lockIn,
  toDateKey,
} from "./logic.mjs";

const DB_NAME = "countdown2";
const STORE_NAME = "project";
const PROJECT_KEY = "current";

const elements = {
  setupCard: document.querySelector("#setup-card"),
  trackerCard: document.querySelector("#tracker-card"),
  chartCard: document.querySelector("#chart-card"),
  setupForm: document.querySelector("#setup-form"),
  formError: document.querySelector("#form-error"),
  pageGrid: document.querySelector("#page-grid"),
  resetButton: document.querySelector("#reset-button"),
  lockButton: document.querySelector("#lock-button"),
  chart: document.querySelector("#chart"),
  stats: document.querySelector("#stats"),
};

const statEls = {
  remaining: document.querySelector('[data-stat="remaining"]'),
  daysLeft: document.querySelector('[data-stat="days-left"]'),
  pace: document.querySelector('[data-stat="pace"]'),
};

const CONFETTI_COLORS = ["#c74a2e", "#2b5b4b", "#f4d9c7", "#d8e7db", "#f2b56b"];
const CONFETTI_PRESETS = [
  { pieces: 12, spreadX: 80, riseY: 60, spin: 180, delay: 80 },
  { pieces: 24, spreadX: 140, riseY: 110, spin: 210, delay: 120 },
  { pieces: 48, spreadX: 220, riseY: 180, spin: 360, delay: 160 },
];

let projectState = null;

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function loadProject() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(PROJECT_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function saveProject(project) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ ...project, id: PROJECT_KEY });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function clearProject() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(PROJECT_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function validateSetup(formData) {
  const totalPages = Number(formData.get("totalPages"));
  const startDate = formData.get("startDate");
  const endDate = formData.get("endDate");

  if (!Number.isInteger(totalPages) || totalPages <= 0) {
    return { error: "Enter a positive page count." };
  }
  if (!startDate || !endDate) {
    return { error: "Start and end dates are required." };
  }
  if (new Date(endDate) <= new Date(startDate)) {
    return { error: "End date must be after the start date." };
  }

  return {
    value: {
      totalPages,
      startDate,
      endDate,
    },
  };
}

function getCompletedPages(project) {
  return project.completions.map((entry) => entry.page);
}

function setStats(project) {
  const completed = project.completions.length;
  const remaining = Math.max(project.totalPages - completed, 0);
  const dateRange = buildDateRange(
    new Date(project.startDate),
    new Date(project.endDate)
  );
  const today = new Date();
  const normalizedToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const endDate = new Date(project.endDate);
  const totalDays = Math.max(dateRange.length - 1, 1);
  const daysLeftRaw = Math.max(
    0,
    Math.round(
      (endDate - normalizedToday) / (1000 * 60 * 60 * 24)
    )
  );
  const daysLeft = Math.min(daysLeftRaw, totalDays);
  const pace = remaining / Math.max(daysLeft, 1);

  statEls.remaining.textContent = remaining;
  statEls.daysLeft.textContent = daysLeft;
  statEls.pace.textContent = pace.toFixed(2);
}

function launchConfetti(target) {
  const rect = target.getBoundingClientRect();
  const burst = document.createElement("div");
  burst.className = "confetti-burst";
  burst.style.left = `${rect.left + rect.width / 2}px`;
  burst.style.top = `${rect.top + rect.height / 2}px`;

  const preset = CONFETTI_PRESETS[Math.floor(Math.random() * CONFETTI_PRESETS.length)];
  const pieces = preset.pieces;
  for (let i = 0; i < pieces; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    const x = Math.round((Math.random() - 0.5) * preset.spreadX);
    const y = Math.round(-40 - Math.random() * preset.riseY);
    const r = Math.round((Math.random() * preset.spin * 2) - preset.spin);
    const delay = Math.round(Math.random() * preset.delay);
    piece.style.setProperty("--x", `${x}px`);
    piece.style.setProperty("--y", `${y}px`);
    piece.style.setProperty("--r", `${r}deg`);
    piece.style.setProperty("--delay", `${delay}ms`);
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    burst.appendChild(piece);
  }

  document.body.appendChild(burst);
  window.setTimeout(() => burst.remove(), 900);
}

function buildTile(pageNumber, state) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `page-tile ${state}`.trim();
  button.dataset.page = String(pageNumber);
  button.textContent = pageNumber;
  if (state.includes("page-tile--disabled")) {
    button.disabled = true;
  }
  return button;
}

function renderGrid(project) {
  const completedPages = getCompletedPages(project);
  const nextPage = getNextPage(project.totalPages, completedPages);
  const lastCompleted =
    completedPages.length > 0 ? completedPages[completedPages.length - 1] : null;

  elements.pageGrid.innerHTML = "";
  for (let page = 1; page <= project.totalPages; page += 1) {
    let state = "";
    const isCompleted = completedPages.includes(page);
    const locked = page <= project.lockedFrontier;

    if (isCompleted) {
      state = "page-tile--completed";
      if (locked) {
        state += " page-tile--locked page-tile--disabled";
      } else if (page !== lastCompleted) {
        state += " page-tile--disabled";
      }
    } else if (page === nextPage) {
      state = "page-tile--active";
    } else {
      state = "page-tile--disabled";
    }
    elements.pageGrid.appendChild(buildTile(page, state));
  }
}

function renderChart(project) {
  const chartWidth = 900;
  const chartHeight = 360;
  const padding = 40;

  const fullRange = buildDateRange(
    new Date(project.startDate),
    new Date(project.endDate)
  );
  const chartRange = buildChartDateRange(
    new Date(project.startDate),
    new Date(project.endDate),
    project.completions
  );
  const ideal = computeIdealRemainingForChart(
    project.totalPages,
    fullRange,
    chartRange
  );
  const actual = computeActualRemaining(
    project.totalPages,
    chartRange,
    project.completions
  );

  if (!chartRange.length) {
    elements.chart.innerHTML = "";
    return;
  }

  const maxY = Math.max(project.totalPages, 1);
  const plotWidth = chartWidth - padding * 2;
  const plotHeight = chartHeight - padding * 2;

  const xForIndex = (index) => {
    if (chartRange.length === 1) {
      return padding + plotWidth / 2;
    }
    return padding + (index / (chartRange.length - 1)) * plotWidth;
  };

  const yForValue = (value) =>
    padding + plotHeight - (value / maxY) * plotHeight;

  const linePath = (values) =>
    values
      .map((value, index) => {
        const x = xForIndex(index);
        const y = yForValue(value);
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  const tickCount = Math.min(chartRange.length, 6);
  const ticks = Array.from({ length: tickCount }, (_, index) => {
    const position = Math.round(
      (index / Math.max(tickCount - 1, 1)) * (chartRange.length - 1)
    );
    return {
      index: position,
      label: toDateKey(chartRange[position]),
    };
  });

  const svg = `
    <svg viewBox="0 0 ${chartWidth} ${chartHeight}" role="img">
      <rect x="0" y="0" width="${chartWidth}" height="${chartHeight}" fill="#fffdf8"/>
      <g stroke="rgba(31, 27, 22, 0.15)" stroke-width="1">
        <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${
    chartHeight - padding
  }"></line>
        <line x1="${padding}" y1="${
    chartHeight - padding
  }" x2="${chartWidth - padding}" y2="${chartHeight - padding}"></line>
      </g>
      ${ticks
        .map((tick) => {
          const x = xForIndex(tick.index);
          return `
            <g>
              <line x1="${x}" y1="${chartHeight - padding}" x2="${x}" y2="${
            chartHeight - padding + 6
          }" stroke="rgba(31, 27, 22, 0.2)"></line>
              <text x="${x}" y="${chartHeight - padding + 22}" text-anchor="middle" font-size="11" fill="${"#5a5249"}">${
            tick.label
          }</text>
            </g>
          `;
        })
        .join("")}
      <path d="${linePath(ideal)}" fill="none" stroke="${
    "#c74a2e"
  }" stroke-width="3" stroke-linecap="round"></path>
      <path d="${linePath(actual)}" fill="none" stroke="${
    "#2b5b4b"
  }" stroke-width="3" stroke-linecap="round"></path>
    </svg>
  `;

  elements.chart.innerHTML = svg;
}

function render(project) {
  const hasProject = Boolean(project);
  elements.setupCard.hidden = hasProject;
  elements.trackerCard.hidden = !hasProject;
  elements.chartCard.hidden = !hasProject;
  if (!hasProject) {
    return;
  }

  setStats(project);
  renderGrid(project);
  renderChart(project);

  const highestCompleted = lockIn(getCompletedPages(project));
  if (highestCompleted > project.lockedFrontier) {
    elements.lockButton.hidden = false;
    elements.lockButton.textContent = `Lock in to page ${highestCompleted}`;
  } else {
    elements.lockButton.hidden = true;
  }
}

async function updateProject(updater) {
  const nextProject = updater({ ...projectState });
  projectState = nextProject;
  await saveProject(projectState);
  render(projectState);
}

elements.setupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  elements.formError.textContent = "";
  const formData = new FormData(event.target);
  const result = validateSetup(formData);

  if (result.error) {
    elements.formError.textContent = result.error;
    return;
  }

  projectState = {
    ...result.value,
    completions: [],
    lockedFrontier: 0,
    createdAt: new Date().toISOString(),
  };
  await saveProject(projectState);
  render(projectState);
});

elements.pageGrid.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-page]");
  if (!button || !projectState) {
    return;
  }

  const pageNumber = Number(button.dataset.page);
  const completedPages = getCompletedPages(projectState);
  const nextPage = getNextPage(projectState.totalPages, completedPages);
  const canUndoLast = canUndo(completedPages, projectState.lockedFrontier);

  if (isPageCompletable(pageNumber, projectState.totalPages, completedPages)) {
    launchConfetti(button);
    const today = toDateKey(new Date());
    await updateProject((project) => {
      project.completions = [...project.completions, { page: pageNumber, date: today }];
      return project;
    });
    return;
  }

  const lastCompleted = completedPages[completedPages.length - 1];
  if (
    canUndoLast &&
    pageNumber === lastCompleted &&
    nextPage !== null &&
    pageNumber === nextPage - 1
  ) {
    await updateProject((project) => {
      project.completions = project.completions.slice(0, -1);
      return project;
    });
  }
});

elements.lockButton.addEventListener("click", async () => {
  if (!projectState) {
    return;
  }
  const completedPages = getCompletedPages(projectState);
  const highestCompleted = lockIn(completedPages);
  if (highestCompleted <= projectState.lockedFrontier) {
    return;
  }

  const confirmed = window.confirm(
    `Lock in pages 1 through ${highestCompleted}? This cannot be undone.`
  );
  if (!confirmed) {
    return;
  }

  await updateProject((project) => {
    project.lockedFrontier = highestCompleted;
    return project;
  });
});

elements.resetButton.addEventListener("click", async () => {
  const confirmed = window.confirm(
    "Reset this project? This clears all progress."
  );
  if (!confirmed) {
    return;
  }
  await clearProject();
  projectState = null;
  render(projectState);
});

async function init() {
  projectState = await loadProject();
  render(projectState);
}

init();
