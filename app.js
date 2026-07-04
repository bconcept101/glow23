const GAME_CONFIG = {
  gameName: "Glow 23",
  glowNumberMin: 1,
  glowNumberMax: 23,
  glowBallMin: 1,
  glowBallMax: 20,
  cutoffMinutesBeforeRound: 10,
  glowNumberRevealSeconds: 4,
  glowBallRevealSeconds: 8,
  drawCompleteSeconds: 12,
  rounds: [
    {
      id: 1,
      name: "Round 1",
      drawTimeLabel: "12:00 PM",
      cutoffTimeLabel: "11:50 AM",
      startHour: 12,
      startMinute: 0
    },
    {
      id: 2,
      name: "Round 2",
      drawTimeLabel: "3:00 PM",
      cutoffTimeLabel: "2:50 PM",
      startHour: 15,
      startMinute: 0
    },
    {
      id: 3,
      name: "Round 3",
      drawTimeLabel: "7:00 PM",
      cutoffTimeLabel: "6:50 PM",
      startHour: 19,
      startMinute: 0
    }
  ]
};

let previousResults = [];

let revealState = {
  key: null,
  numberTimer: null,
  ballTimer: null,
  completeTimer: null,
  resultPosted: false
};

const elements = {
  sideMenu: document.getElementById("sideMenu"),
  openMenuBtn: document.getElementById("openMenuBtn"),
  floatingMenuBtn: document.getElementById("floatingMenuBtn"),
  openResultsBtn: document.getElementById("openResultsBtn"),
  closeMenuBtn: document.getElementById("closeMenuBtn"),

  headerStatusPill: document.getElementById("headerStatusPill"),
  currentRoundName: document.getElementById("currentRoundName"),
  currentRoundWindow: document.getElementById("currentRoundWindow"),
  currentDrawTime: document.getElementById("currentDrawTime"),
  currentCutoffTime: document.getElementById("currentCutoffTime"),
  countdownTimer: document.getElementById("countdownTimer"),
  cutoffBox: document.getElementById("cutoffBox"),
  cutoffStatus: document.getElementById("cutoffStatus"),

  officialGlowNumber: document.getElementById("officialGlowNumber"),
  officialGlowBall: document.getElementById("officialGlowBall"),
  officialResultDate: document.getElementById("officialResultDate"),
  officialResultTime: document.getElementById("officialResultTime"),

  glowNumberBall: document.getElementById("glowNumberBall"),
  glowBallBall: document.getElementById("glowBallBall"),
  chamberMachine: document.getElementById("chamberMachine"),
  drawStatus: document.getElementById("drawStatus"),

  todayResults: document.getElementById("todayResults"),
  yesterdayResults: document.getElementById("yesterdayResults"),
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

function formatLongDate(date) {
  return date.toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function getTodayDate() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function getYesterdayDate() {
  const date = getTodayDate();
  date.setDate(date.getDate() - 1);
  return date;
}

function createRoundDate(round, baseDate = new Date()) {
  const date = new Date(baseDate);
  date.setHours(round.startHour, round.startMinute, 0, 0);
  return date;
}

function createCutoffDate(round, baseDate = new Date()) {
  const date = createRoundDate(round, baseDate);
  date.setMinutes(date.getMinutes() - GAME_CONFIG.cutoffMinutesBeforeRound);
  return date;
}

function createDrawCompleteDate(round, baseDate = new Date()) {
  const date = createRoundDate(round, baseDate);
  date.setSeconds(date.getSeconds() + GAME_CONFIG.drawCompleteSeconds);
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

function getResultForRound(round, baseDate = new Date()) {
  const dateKey = formatDateKey(baseDate);

  return {
    date: dateKey,
    displayDate: formatLongDate(baseDate),
    round: round.name,
    drawTime: round.drawTimeLabel,
    cutoffTime: round.cutoffTimeLabel,
    glowNumber: seededNumber(
      `${dateKey}-${round.id}-glow-number`,
      GAME_CONFIG.glowNumberMin,
      GAME_CONFIG.glowNumberMax
    ),
    glowBall: seededNumber(
      `${dateKey}-${round.id}-glow-ball`,
      GAME_CONFIG.glowBallMin,
      GAME_CONFIG.glowBallMax
    ),
    timestamp: round.drawTimeLabel
  };
}

function getNextRoundAfter(roundId) {
  return GAME_CONFIG.rounds.find((round) => round.id > roundId) || null;
}

function getLatestRevealedRound(baseDate = new Date()) {
  const now = new Date();

  const revealedRounds = GAME_CONFIG.rounds.filter((round) => {
    return now >= createDrawCompleteDate(round, baseDate);
  });

  if (revealedRounds.length === 0) {
    return null;
  }

  return revealedRounds[revealedRounds.length - 1];
}

function getTomorrowFirstCutoff() {
  const tomorrow = getTodayDate();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return createCutoffDate(GAME_CONFIG.rounds[0], tomorrow);
}

function getCurrentPhase() {
  const now = new Date();
  const today = getTodayDate();

  for (const round of GAME_CONFIG.rounds) {
    const cutoffDate = createCutoffDate(round, today);
    const drawDate = createRoundDate(round, today);
    const completeDate = createDrawCompleteDate(round, today);

    if (now < cutoffDate) {
      return {
        phase: "open",
        round,
        resultRound: null,
        nextRound: round,
        title: `${round.name} Upcoming`,
        statusText: "Entries Open",
        pillText: "Entries Open",
        targetDate: cutoffDate,
        countdownLabel: "Entries close in"
      };
    }

    if (now >= cutoffDate && now < drawDate) {
      return {
        phase: "cutoff",
        round,
        resultRound: null,
        nextRound: round,
        title: `${round.name} Ready`,
        statusText: "Entries Closed",
        pillText: "Entries Closed",
        targetDate: drawDate,
        countdownLabel: "Draw starts in"
      };
    }

    if (now >= drawDate && now < completeDate) {
      return {
        phase: "drawing",
        round,
        resultRound: round,
        nextRound: getNextRoundAfter(round.id),
        title: `${round.name} Drawing`,
        statusText: "Drawing Now",
        pillText: "Drawing Now",
        targetDate: completeDate,
        countdownLabel: "Result posts in"
      };
    }

    const nextRound = getNextRoundAfter(round.id);

    if (now >= completeDate && nextRound) {
      const nextCutoffDate = createCutoffDate(nextRound, today);

      if (now < nextCutoffDate) {
        return {
          phase: "posted",
          round: nextRound,
          resultRound: round,
          nextRound,
          title: `${round.name} Result Posted`,
          statusText: "Result Posted",
          pillText: "Result Posted",
          targetDate: nextCutoffDate,
          countdownLabel: `${nextRound.name} entries close in`
        };
      }
    }
  }

  const latestRound = getLatestRevealedRound(today);

  return {
    phase: "finished",
    round: GAME_CONFIG.rounds[0],
    resultRound: latestRound,
    nextRound: GAME_CONFIG.rounds[0],
    title: "Today’s Draws Complete",
    statusText: "Result Posted",
    pillText: "Complete",
    targetDate: getTomorrowFirstCutoff(),
    countdownLabel: "Tomorrow’s first entries close in"
  };
}

function clearRevealTimers() {
  if (revealState.numberTimer) {
    clearTimeout(revealState.numberTimer);
  }

  if (revealState.ballTimer) {
    clearTimeout(revealState.ballTimer);
  }

  if (revealState.completeTimer) {
    clearTimeout(revealState.completeTimer);
  }

  revealState.numberTimer = null;
  revealState.ballTimer = null;
  revealState.completeTimer = null;
}

function resetRevealDisplay(numberTitle, message) {
  clearRevealTimers();

  revealState.key = null;
  revealState.resultPosted = false;

  elements.chamberMachine.classList.remove("is-drawing");

  elements.glowNumberBall.classList.remove("pop");
  elements.glowNumberBall.classList.add("waiting");
  elements.glowNumberBall.textContent = "?";

  elements.glowBallBall.classList.remove("pop");
  elements.glowBallBall.classList.add("waiting");
  elements.glowBallBall.textContent = "?";

  elements.drawStatus.innerHTML = `
    <strong>${numberTitle}</strong>
    <span>${message}</span>
  `;
}

function popBall(ballElement, value) {
  ballElement.classList.remove("waiting");
  ballElement.classList.remove("pop");
  ballElement.textContent = value;

  window.requestAnimationFrame(() => {
    ballElement.classList.add("pop");
  });
}

function showOfficialResult(result) {
  elements.officialGlowNumber.textContent = result.glowNumber;
  elements.officialGlowBall.textContent = result.glowBall;
  elements.officialResultDate.textContent = result.displayDate;
  elements.officialResultTime.textContent = result.drawTime;
}

function clearOfficialResult(nextRound) {
  elements.officialGlowNumber.textContent = "--";
  elements.officialGlowBall.textContent = "--";
  elements.officialResultDate.textContent = formatLongDate(new Date());
  elements.officialResultTime.textContent = nextRound ? nextRound.drawTimeLabel : "--";
}

function revealFinalResult(result) {
  elements.chamberMachine.classList.remove("is-drawing");

  elements.drawStatus.innerHTML = `
    <strong>${result.round} Result Posted</strong>
    <span>Glow Number ${result.glowNumber} • Glow Ball ${result.glowBall} • ${result.displayDate} • ${result.drawTime}</span>
  `;

  showOfficialResult(result);
  revealState.resultPosted = true;
}

function startRevealSequence(round) {
  const result = getResultForRound(round, getTodayDate());
  const key = `${result.date}-${round.id}`;

  if (revealState.key === key) {
    return;
  }

  clearRevealTimers();

  revealState.key = key;
  revealState.resultPosted = false;

  elements.chamberMachine.classList.add("is-drawing");

  elements.glowNumberBall.classList.add("waiting");
  elements.glowNumberBall.classList.remove("pop");
  elements.glowNumberBall.textContent = "?";

  elements.glowBallBall.classList.add("waiting");
  elements.glowBallBall.classList.remove("pop");
  elements.glowBallBall.textContent = "?";

  elements.drawStatus.innerHTML = `
    <strong>Drawing Glow Number</strong>
    <span>The chamber is active. Glow Number reveal in progress.</span>
  `;

  revealState.numberTimer = setTimeout(() => {
    popBall(elements.glowNumberBall, result.glowNumber);

    elements.drawStatus.innerHTML = `
      <strong>Drawing Glow Ball</strong>
      <span>Glow Number ${result.glowNumber} is posted. Glow Ball reveal in progress.</span>
    `;
  }, GAME_CONFIG.glowNumberRevealSeconds * 1000);

  revealState.ballTimer = setTimeout(() => {
    popBall(elements.glowBallBall, result.glowBall);
  }, GAME_CONFIG.glowBallRevealSeconds * 1000);

  revealState.completeTimer = setTimeout(() => {
    revealFinalResult(result);
  }, GAME_CONFIG.drawCompleteSeconds * 1000);
}

function showPostedResult(round) {
  const result = getResultForRound(round, getTodayDate());
  const key = `${result.date}-${round.id}-posted`;

  if (revealState.key !== key) {
    clearRevealTimers();

    revealState.key = key;
    revealState.resultPosted = true;

    elements.chamberMachine.classList.remove("is-drawing");

    popBall(elements.glowNumberBall, result.glowNumber);
    popBall(elements.glowBallBall, result.glowBall);

    revealFinalResult(result);
  }
}

function updateRevealDisplay(phase) {
  if (phase.phase === "open") {
    resetRevealDisplay(
      "Waiting for reveal",
      `Next draw starts at ${phase.round.drawTimeLabel}. Entries close at ${phase.round.cutoffTimeLabel}.`
    );

    clearOfficialResult(phase.round);
    return;
  }

  if (phase.phase === "cutoff") {
    resetRevealDisplay(
      "Entries closed",
      `The chamber is preparing for the ${phase.round.drawTimeLabel} draw.`
    );

    clearOfficialResult(phase.round);
    return;
  }

  if (phase.phase === "drawing") {
    startRevealSequence(phase.round);
    return;
  }

  if (phase.phase === "posted" && phase.resultRound) {
    showPostedResult(phase.resultRound);
    return;
  }

  if (phase.phase === "finished" && phase.resultRound) {
    showPostedResult(phase.resultRound);
    return;
  }

  resetRevealDisplay(
    "Waiting for first draw",
    "The first Glow Number and Glow Ball will appear at 12:00 PM."
  );
}

function updateLivePanel() {
  const phase = getCurrentPhase();
  const detailRound = phase.nextRound || phase.round;

  elements.currentRoundName.textContent = phase.title;
  elements.currentRoundWindow.textContent = `${phase.countdownLabel}`;
  elements.currentDrawTime.textContent = detailRound.drawTimeLabel;
  elements.currentCutoffTime.textContent = detailRound.cutoffTimeLabel;
  elements.countdownTimer.textContent = getCountdownText(phase.targetDate);
  elements.cutoffStatus.textContent = phase.statusText;
  elements.headerStatusPill.textContent = phase.pillText;

  const isClosed =
    phase.phase === "cutoff" ||
    phase.phase === "drawing" ||
    phase.phase === "posted" ||
    phase.phase === "finished";

  elements.cutoffBox.classList.toggle("closed", isClosed);
  elements.headerStatusPill.classList.toggle("closed", isClosed);

  updateRevealDisplay(phase);
}

function buildTodayResults() {
  const now = new Date();
  const today = getTodayDate();

  const cards = GAME_CONFIG.rounds.map((round) => {
    const completeDate = createDrawCompleteDate(round, today);
    const resultAvailable = now >= completeDate;

    if (!resultAvailable) {
      return `
        <article class="result-card pending">
          <span>${round.name}</span>
          <strong>Pending</strong>
          <p>Date: ${formatLongDate(today)}</p>
          <p>Draw time: ${round.drawTimeLabel}</p>
          <p>Entries close: ${round.cutoffTimeLabel}</p>
        </article>
      `;
    }

    const result = getResultForRound(round, today);

    return `
      <article class="result-card">
        <span>${round.name}</span>
        <strong>Glow ${result.glowNumber}</strong>
        <p>Glow Ball: ${result.glowBall}</p>
        <p>Date: ${result.displayDate}</p>
        <p>Draw time: ${result.drawTime}</p>
      </article>
    `;
  });

  elements.todayResults.innerHTML = cards.join("");
}

function buildYesterdayResults() {
  const yesterday = getYesterdayDate();

  const cards = GAME_CONFIG.rounds.map((round) => {
    const result = getResultForRound(round, yesterday);

    return `
      <article class="result-card">
        <span>${round.name}</span>
        <strong>Glow ${result.glowNumber}</strong>
        <p>Glow Ball: ${result.glowBall}</p>
        <p>Date: ${result.displayDate}</p>
        <p>Draw time: ${result.drawTime}</p>
      </article>
    `;
  });

  elements.yesterdayResults.innerHTML = cards.join("");
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
  const now = new Date();
  const today = getTodayDate();

  return GAME_CONFIG.rounds
    .filter((round) => now >= createDrawCompleteDate(round, today))
    .map((round) => getResultForRound(round, today));
}

function getYesterdayGeneratedResults() {
  const yesterday = getYesterdayDate();

  return GAME_CONFIG.rounds.map((round) => {
    return getResultForRound(round, yesterday);
  });
}

function normalizeStoredResult(result) {
  return {
    date: result.date,
    displayDate: result.displayDate || result.date,
    round: result.round,
    glowNumber: result.glowNumber,
    glowBall: result.glowBall,
    timestamp: result.drawTime || result.timestamp || "--"
  };
}

function renderSearchResults(searchTerm = "") {
  const cleanSearch = searchTerm.trim().toLowerCase();

  const todaysAvailableResults = getAvailableTodayResults();
  const yesterdayResults = getYesterdayGeneratedResults();
  const storedResults = previousResults.map(normalizeStoredResult);

  const allResults = [
    ...todaysAvailableResults,
    ...yesterdayResults,
    ...storedResults
  ];

  const filteredResults = allResults.filter((result) => {
    const searchableText = `
      ${result.date}
      ${result.displayDate || ""}
      ${result.round}
      ${result.glowNumber}
      ${result.glowBall}
      ${result.timestamp}
    `.toLowerCase();

    return searchableText.includes(cleanSearch);
  });

  if (filteredResults.length === 0) {
    elements.searchResults.innerHTML = `<p class="empty-note">No past results found.</p>`;
    return;
  }

  elements.searchResults.innerHTML = filteredResults
    .map((result) => {
      return `
        <article class="search-card">
          <span>${result.displayDate || result.date} • ${result.round}</span>
          <p><strong>Glow Number:</strong> ${result.glowNumber}</p>
          <p><strong>Glow Ball:</strong> ${result.glowBall}</p>
          <p><strong>Draw Time:</strong> ${result.timestamp}</p>
        </article>
      `;
    })
    .join("");
}

function openSideMenu() {
  elements.sideMenu.classList.add("open");
}

function closeSideMenu() {
  elements.sideMenu.classList.remove("open");
}

function setupSideMenu() {
  elements.openMenuBtn.addEventListener("click", openSideMenu);
  elements.floatingMenuBtn.addEventListener("click", openSideMenu);
  elements.openResultsBtn.addEventListener("click", openSideMenu);
  elements.closeMenuBtn.addEventListener("click", closeSideMenu);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSideMenu();
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
  buildYesterdayResults();

  setInterval(() => {
    updateLivePanel();
    buildTodayResults();
    buildYesterdayResults();
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
