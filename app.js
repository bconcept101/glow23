const GAME_CONFIG = {
  gameName: "Glow 23",
  glowNumberMin: 1,
  glowNumberMax: 23,
  glowBallMin: 1,
  glowBallMax: 20,
  cutoffMinutesBeforeRound: 10,
  rounds: [
    {
      id: 1,
      name: "Round 1",
      windowLabel: "12:00 PM – 1:00 PM",
      startHour: 12,
      startMinute: 0,
      endHour: 13,
      endMinute: 0
    },
    {
      id: 2,
      name: "Round 2",
      windowLabel: "3:00 PM – 5:00 PM",
      startHour: 15,
      startMinute: 0,
      endHour: 17,
      endMinute: 0
    },
    {
      id: 3,
      name: "Round 3",
      windowLabel: "7:00 PM – 10:00 PM",
      startHour: 19,
      startMinute: 0,
      endHour: 22,
      endMinute: 0
    }
  ]
};

const previousResults = [
  {
    date: "2026-07-04",
    round: "Round 1",
    glowNumber: 7,
    glowBall: 12,
    timestamp: "12:08 PM"
  },
  {
    date: "2026-07-04",
    round: "Round 2",
    glowNumber: 19,
    glowBall: 4,
    timestamp: "3:26 PM"
  },
  {
    date: "2026-07-03",
    round: "Round 3",
    glowNumber: 12,
    glowBall: 17,
    timestamp: "8:42 PM"
  }
];

const elements = {
  sideMenu: document.getElementById("sideMenu"),
  openMenuBtn: document.getElementById("openMenuBtn"),
  closeMenuBtn: document.getElementById("closeMenuBtn"),
  liveStatusPill: document.getElementById("liveStatusPill"),
  currentRoundName: document.getElementById("currentRoundName"),
  currentRoundWindow: document.getElementById("currentRoundWindow"),
  countdownTimer: document.getElementById("countdownTimer"),
  cutoffBox: document.getElementById("cutoffBox"),
  cutoffStatus: document.getElementById("cutoffStatus"),
  winnerBall: document.getElementById("winnerBall"),
  previewDrawBtn: document.getElementById("previewDrawBtn"),
  todayResults: document.getElementById("todayResults"),
  resultSearch: document.getElementById("resultSearch"),
  searchResults: document.getElementById("searchResults")
};

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = padNumber(date.getMonth() + 1);
  const day = padNumber(date.getDate());

  return `${year}-${month}-${day}`;
}

function formatDisplayTime(date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function createRoundDate(round, type) {
  const date = new Date();

  if (type === "start") {
    date.setHours(round.startHour, round.startMinute, 0, 0);
  }

  if (type === "end") {
    date.setHours(round.endHour, round.endMinute, 0, 0);
  }

  if (type === "cutoff") {
    date.setHours(round.startHour, round.startMinute, 0, 0);
    date.setMinutes(date.getMinutes() - GAME_CONFIG.cutoffMinutesBeforeRound);
  }

  return date;
}

function getCountdownText(targetDate) {
  const now = new Date();
  const difference = targetDate.getTime() - now.getTime();

  if (difference <= 0) {
    return "00:00:00";
  }

  const totalSeconds = Math.floor(difference / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(seconds)}`;
}

function seededNumber(seedText, min, max) {
  let hash = 0;

  for (let i = 0; i < seedText.length; i += 1) {
    hash = (hash << 5) - hash + seedText.charCodeAt(i);
    hash |= 0;
  }

  const range = max - min + 1;
  return min + Math.abs(hash % range);
}

function getDemoResultForRound(round) {
  const todayKey = formatDateKey(new Date());

  return {
    date: todayKey,
    round: round.name,
    glowNumber: seededNumber(
      `${todayKey}-${round.id}-glow-number`,
      GAME_CONFIG.glowNumberMin,
      GAME_CONFIG.glowNumberMax
    ),
    glowBall: seededNumber(
      `${todayKey}-${round.id}-glow-ball`,
      GAME_CONFIG.glowBallMin,
      GAME_CONFIG.glowBallMax
    ),
    timestamp: formatDisplayTime(createRoundDate(round, "start"))
  };
}

function getCurrentPhase() {
  const now = new Date();
  const rounds = GAME_CONFIG.rounds;

  for (const round of rounds) {
    const cutoffDate = createRoundDate(round, "cutoff");
    const startDate = createRoundDate(round, "start");
    const endDate = createRoundDate(round, "end");

    if (now < cutoffDate) {
      return {
        round,
        phase: "open",
        title: `${round.name} Upcoming`,
        statusText: "Star Placement Open",
        pillText: "Open",
        targetDate: cutoffDate,
        countdownLabel: "Placement cutoff starts in"
      };
    }

    if (now >= cutoffDate && now < startDate) {
      return {
        round,
        phase: "cutoff",
        title: `${round.name} Cutoff`,
        statusText: "Closed For Reveal",
        pillText: "Cutoff",
        targetDate: startDate,
        countdownLabel: "Reveal window starts in"
      };
    }

    if (now >= startDate && now <= endDate) {
      return {
        round,
        phase: "live",
        title: `${round.name} Live`,
        statusText: "Closed / Round Live",
        pillText: "Live",
        targetDate: endDate,
        countdownLabel: "Round window ends in"
      };
    }
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(
    rounds[0].startHour,
    rounds[0].startMinute - GAME_CONFIG.cutoffMinutesBeforeRound,
    0,
    0
  );

  return {
    round: rounds[0],
    phase: "finished",
    title: "All Rounds Complete",
    statusText: "Closed Until Tomorrow",
    pillText: "Complete",
    targetDate: tomorrow,
    countdownLabel: "Tomorrow’s first cutoff starts in"
  };
}

function updateLivePanel() {
  const phase = getCurrentPhase();

  elements.currentRoundName.textContent = phase.title;
  elements.currentRoundWindow.textContent = `${phase.round.windowLabel} • ${phase.countdownLabel}`;
  elements.countdownTimer.textContent = getCountdownText(phase.targetDate);
  elements.cutoffStatus.textContent = phase.statusText;
  elements.liveStatusPill.textContent = phase.pillText;

  const isClosed = phase.phase === "cutoff" || phase.phase === "live" || phase.phase === "finished";

  elements.cutoffBox.classList.toggle("closed", isClosed);
  elements.liveStatusPill.classList.toggle("closed", isClosed);
}

function buildTodayResults() {
  const now = new Date();

  const cards = GAME_CONFIG.rounds.map((round) => {
    const startDate = createRoundDate(round, "start");
    const resultAvailable = now >= startDate;

    if (!resultAvailable) {
      return `
        <article class="result-card pending">
          <span>${round.name}</span>
          <strong>Pending</strong>
          <p>${round.windowLabel}</p>
        </article>
      `;
    }

    const result = getDemoResultForRound(round);

    return `
      <article class="result-card">
        <span>${round.name}</span>
        <strong>Glow ${result.glowNumber}</strong>
        <p>Glow Ball: ${result.glowBall}</p>
        <p>Timestamp: ${result.timestamp}</p>
      </article>
    `;
  });

  elements.todayResults.innerHTML = cards.join("");
}

function renderSearchResults(searchTerm = "") {
  const cleanSearch = searchTerm.trim().toLowerCase();

  const todaysAvailableResults = GAME_CONFIG.rounds
    .filter((round) => new Date() >= createRoundDate(round, "start"))
    .map(getDemoResultForRound);

  const allResults = [...todaysAvailableResults, ...previousResults];

  const filteredResults = allResults.filter((result) => {
    const searchableText = `
      ${result.date}
      ${result.round}
      ${result.glowNumber}
      ${result.glowBall}
      ${result.timestamp}
    `.toLowerCase();

    return searchableText.includes(cleanSearch);
  });

  if (filteredResults.length === 0) {
    elements.searchResults.innerHTML = `<p class="empty-note">No previous results found.</p>`;
    return;
  }

  elements.searchResults.innerHTML = filteredResults
    .map((result) => {
      return `
        <article class="search-card">
          <span>${result.date} • ${result.round}</span>
          <p><strong>Glow Number:</strong> ${result.glowNumber}</p>
          <p><strong>Glow Ball:</strong> ${result.glowBall}</p>
          <p><strong>Timestamp:</strong> ${result.timestamp}</p>
        </article>
      `;
    })
    .join("");
}

function previewChamberReveal() {
  const randomGlowNumber = Math.floor(
    Math.random() * (GAME_CONFIG.glowNumberMax - GAME_CONFIG.glowNumberMin + 1)
  ) + GAME_CONFIG.glowNumberMin;

  elements.winnerBall.textContent = randomGlowNumber;
  elements.winnerBall.classList.remove("pop");

  window.requestAnimationFrame(() => {
    elements.winnerBall.classList.add("pop");
  });
}

function setupSideMenu() {
  elements.openMenuBtn.addEventListener("click", () => {
    elements.sideMenu.classList.add("open");
  });

  elements.closeMenuBtn.addEventListener("click", () => {
    elements.sideMenu.classList.remove("open");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      elements.sideMenu.classList.remove("open");
    }
  });
}

function setupSearch() {
  elements.resultSearch.addEventListener("input", (event) => {
    renderSearchResults(event.target.value);
  });

  renderSearchResults("");
}

function startClock() {
  updateLivePanel();
  buildTodayResults();

  setInterval(() => {
    updateLivePanel();
    buildTodayResults();
  }, 1000);
}

function initGlow23() {
  setupSideMenu();
  setupSearch();

  elements.previewDrawBtn.addEventListener("click", previewChamberReveal);

  startClock();
}

initGlow23();
