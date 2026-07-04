const GAME_CONFIG = {
  gameName: "Glow 23",
  glowNumberMin: 1,
  glowNumberMax: 23,
  glowBallMin: 1,
  glowBallMax: 20,
  cutoffMinutesBeforeRound: 10,
  revealAnimationSeconds: 8,
  rounds: [
    {
      id: 1,
      name: "Round 1",
      drawTimeLabel: "12:00 PM",
      cutoffTimeLabel: "11:50 AM",
      startHour: 12,
      startMinute: 0,
      endHour: 13,
      endMinute: 0
    },
    {
      id: 2,
      name: "Round 2",
      drawTimeLabel: "3:00 PM",
      cutoffTimeLabel: "2:50 PM",
      startHour: 15,
      startMinute: 0,
      endHour: 17,
      endMinute: 0
    },
    {
      id: 3,
      name: "Round 3",
      drawTimeLabel: "7:00 PM",
      cutoffTimeLabel: "6:50 PM",
      startHour: 19,
      startMinute: 0,
      endHour: 22,
      endMinute: 0
    }
  ]
};

let previousResults = [];

let revealState = {
  key: null,
  timer: null,
  complete: false
};

const elements = {
  sideMenu: document.getElementById("sideMenu"),
  openMenuBtn: document.getElementById("openMenuBtn"),
  closeMenuBtn: document.getElementById("closeMenuBtn"),
  liveStatusPill: document.getElementById("liveStatusPill"),
  currentRoundName: document.getElementById("currentRoundName"),
  currentRoundWindow: document.getElementById("currentRoundWindow"),
  currentDrawTime: document.getElementById("currentDrawTime"),
  currentCutoffTime: document.getElementById("currentCutoffTime"),
  countdownTimer: document.getElementById("countdownTimer"),
  cutoffBox: document.getElementById("cutoffBox"),
  cutoffStatus: document.getElementById("cutoffStatus"),
  winnerBall: document.getElementById("winnerBall"),
  chamberMachine: document.getElementById("chamberMachine"),
  drawStatus: document.getElementById("drawStatus"),
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

function getResultForRound(round) {
  const todayKey = formatDateKey(new Date());

  return {
    date: todayKey,
    round: round.name,
    drawTime: round.drawTimeLabel,
    cutoffTime: round.cutoffTimeLabel,
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
    timestamp: round.drawTimeLabel
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
        statusText: "Entries Open",
        pillText: "Open",
        targetDate: cutoffDate,
        countdownLabel: "Entries close in"
      };
    }

    if (now >= cutoffDate && now < startDate) {
      return {
        round,
        phase: "cutoff",
        title: `${round.name} Ready`,
        statusText: "Entries Closed",
        pillText: "Closed",
        targetDate: startDate,
        countdownLabel: "Draw starts in"
      };
    }

    if (now >= startDate && now <= endDate) {
      return {
        round,
        phase: "live",
        title: `${round.name} Live`,
        statusText: "Draw Live",
        pillText: "Live",
        targetDate: endDate,
        countdownLabel: "Draw window ends in"
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
    countdownLabel: "Next entry cutoff begins in"
  };
}

function getLatestRevealedRound() {
  const now = new Date();

  const revealedRounds = GAME_CONFIG.rounds.filter((round) => {
    return now >= createRoundDate(round, "start");
  });

  if (revealedRounds.length === 0) {
    return null;
  }

  return revealedRounds[revealedRounds.length - 1];
}

function updateLivePanel() {
  const phase = getCurrentPhase();

  elements.currentRoundName.textContent = phase.title;
  elements.currentRoundWindow.textContent = `Draw time: ${phase.round.drawTimeLabel} • ${phase.countdownLabel}`;
  elements.currentDrawTime.textContent = phase.round.drawTimeLabel;
  elements.currentCutoffTime.textContent = phase.round.cutoffTimeLabel;
  elements.countdownTimer.textContent = getCountdownText(phase.targetDate);
  elements.cutoffStatus.textContent = phase.statusText;
  elements.liveStatusPill.textContent = phase.pillText;

  const isClosed =
    phase.phase === "cutoff" ||
    phase.phase === "live" ||
    phase.phase === "finished";

  elements.cutoffBox.classList.toggle("closed", isClosed);
  elements.liveStatusPill.classList.toggle("closed", isClosed);
}

function clearRevealTimer() {
  if (revealState.timer) {
    clearTimeout(revealState.timer);
  }

  revealState.timer = null;
}

function setWaitingDisplay(title, message) {
  clearRevealTimer();

  revealState.key = null;
  revealState.complete = false;

  elements.chamberMachine.classList.remove("is-drawing");
  elements.winnerBall.classList.remove("pop");
  elements.winnerBall.classList.add("waiting");
  elements.winnerBall.textContent = "?";

  elements.drawStatus.innerHTML = `
    <strong>${title}</strong>
    <span>${message}</span>
  `;
}

function revealResult(result) {
  elements.chamberMachine.classList.remove("is-drawing");
  elements.winnerBall.classList.remove("waiting");
  elements.winnerBall.classList.remove("pop");
  elements.winnerBall.textContent = result.glowNumber;

  window.requestAnimationFrame(() => {
    elements.winnerBall.classList.add("pop");
  });

  elements.drawStatus.innerHTML = `
    <strong>${result.round} Result</strong>
    <span>Glow Number ${result.glowNumber} • Glow Ball ${result.glowBall} • ${result.timestamp}</span>
  `;

  revealState.complete = true;
}

function startRevealSequence(round) {
  const result = getResultForRound(round);
  const key = `${result.date}-${round.id}`;

  if (revealState.key === key) {
    return;
  }

  clearRevealTimer();

  revealState.key = key;
  revealState.complete = false;

  elements.winnerBall.classList.add("waiting");
  elements.winnerBall.classList.remove("pop");
  elements.winnerBall.textContent = "?";

  elements.chamberMachine.classList.add("is-drawing");

  elements.drawStatus.innerHTML = `
    <strong>Drawing Now</strong>
    <span>The chamber is active. Glow Number reveal in progress.</span>
  `;

  revealState.timer = setTimeout(() => {
    revealResult(result);
  }, GAME_CONFIG.revealAnimationSeconds * 1000);
}

function updateRevealDisplay() {
  const phase = getCurrentPhase();

  if (phase.phase === "open") {
    setWaitingDisplay(
      "Waiting for reveal",
      `Next draw starts at ${phase.round.drawTimeLabel}. Entries close at ${phase.round.cutoffTimeLabel}.`
    );
    return;
  }

  if (phase.phase === "cutoff") {
    setWaitingDisplay(
      "Entries closed",
      `The chamber is preparing for the ${phase.round.drawTimeLabel} draw.`
    );
    return;
  }

  if (phase.phase === "live") {
    startRevealSequence(phase.round);
    return;
  }

  if (phase.phase === "finished") {
    const latestRound = getLatestRevealedRound();

    if (!latestRound) {
      setWaitingDisplay(
        "Waiting for first draw",
        "The first Glow Number will appear at 12:00 PM."
      );
      return;
    }

    startRevealSequence(latestRound);
  }
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
          <p>Draw time: ${round.drawTimeLabel}</p>
          <p>Entries close: ${round.cutoffTimeLabel}</p>
        </article>
      `;
    }

    const result = getResultForRound(round);

    return `
      <article class="result-card">
        <span>${round.name}</span>
        <strong>Glow ${result.glowNumber}</strong>
        <p>Glow Ball: ${result.glowBall}</p>
        <p>Draw time: ${result.timestamp}</p>
      </article>
    `;
  });

  elements.todayResults.innerHTML = cards.join("");
}

async function loadPreviousResults() {
  try {
    const response = await fetch("data/results.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Could not load previous results.");
    }

    previousResults = await response.json();
  } catch (error) {
    previousResults = [];
    console.warn("Glow 23 previous results failed to load:", error);
  }
}

function getAvailableTodayResults() {
  return GAME_CONFIG.rounds
    .filter((round) => new Date() >= createRoundDate(round, "start"))
    .map(getResultForRound);
}

function renderSearchResults(searchTerm = "") {
  const cleanSearch = searchTerm.trim().toLowerCase();

  const todaysAvailableResults = getAvailableTodayResults();
  const allResults = [...todaysAvailableResults, ...previousResults];

  const filteredResults = allResults.filter((result) => {
    const searchableText = `
      ${result.date}
      ${result.round}
      ${result.drawTime || ""}
      ${result.cutoffTime || ""}
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
          <p><strong>Draw Time:</strong> ${result.timestamp}</p>
        </article>
      `;
    })
    .join("");
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
  updateRevealDisplay();
  buildTodayResults();

  setInterval(() => {
    updateLivePanel();
    updateRevealDisplay();
    buildTodayResults();
    renderSearchResults(elements.resultSearch.value);
  }, 1000);
}

async function initGlow23() {
  setupSideMenu();

  await loadPreviousResults();

  setupSearch();
  startClock();
}

initGlow23();
