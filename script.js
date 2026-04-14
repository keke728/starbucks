const processSection = document.querySelector("#process");
const processSteps = [...document.querySelectorAll("#process .process-step")];
const processNodes = [...document.querySelectorAll("#process .process-node")];
const processScenes = [...document.querySelectorAll("#process .process-scene")];
const processIllustration = document.querySelector("#process .process-illustration");
const sections = [...document.querySelectorAll("main section[id]")];
const scrollScenes = document.querySelectorAll(".scroll-scene");
const caffeineSection = document.querySelector("#next");
const ingredientsSection = document.querySelector("#ingredients");
const impactSection = document.querySelector("#impact");
const builderInteractiveSection = document.querySelector("#alternatives");


const PROCESS_TEXT_REVEAL_DELAY = 120;
const PROCESS_PANEL_REVEAL_DELAY = 520;
const PROCESS_FIRST_STEP_HOLD_MS = 1100;
const PROCESS_STEP_INTERVAL_MS = 980;
const PROCESS_LOOP_DELAY_MS = 780;
const PROCESS_RESET_OFFSET = 0.04;
const PROCESS_START_TOP = 0.82;
const PROCESS_START_BOTTOM = 0.28;

let currentProcessStep = 0;
let processIntroStage = 0;
let processSequenceStarted = false;
let processSequenceCompleted = false;
let processAutoTimers = [];

function setProcessStep(index) {
  if (!processIllustration || !processSteps.length) {
    return;
  }

  currentProcessStep = clamp(index, 0, processSteps.length - 1);
  const stepValue = String(currentProcessStep + 1);

  processIllustration.dataset.step = stepValue;

  processSteps.forEach((step, stepIndex) => {
    step.classList.toggle("is-active", stepIndex === currentProcessStep);
    step.classList.toggle("is-current-node", stepIndex === currentProcessStep);
  });

  processNodes.forEach((node, nodeIndex) => {
    node.classList.toggle("is-current", nodeIndex === currentProcessStep);
  });

  processScenes.forEach((scene, sceneIndex) => {
    scene.classList.toggle("is-current", sceneIndex === currentProcessStep);
  });
}

function updateProcessIntroState() {
  if (!processSection) {
    return;
  }

  processSection.classList.toggle("is-text-visible", processIntroStage >= 1);
  processSection.classList.toggle("is-panel-visible", processIntroStage >= 2);
  processSection.classList.toggle("is-process-playing", processSequenceStarted && !processSequenceCompleted);
}

function clearProcessTimers() {
  processAutoTimers.forEach((timerId) => window.clearTimeout(timerId));
  processAutoTimers = [];
}

function resetProcessSequence() {
  clearProcessTimers();
  setProcessStep(0);
  processIntroStage = 0;
  processSequenceStarted = false;
  processSequenceCompleted = false;
  updateProcessIntroState();
}

function getProcessSectionRect() {
  return processSection?.getBoundingClientRect() ?? null;
}

function canStartProcessSequence() {
  const rect = getProcessSectionRect();
  if (!rect) {
    return false;
  }

  const viewportHeight = window.innerHeight;
  return rect.top <= viewportHeight * PROCESS_START_TOP && rect.bottom >= viewportHeight * PROCESS_START_BOTTOM;
}

function isProcessSectionResetZone() {
  const rect = getProcessSectionRect();
  if (!rect) {
    return true;
  }

  const viewportHeight = window.innerHeight;
  return rect.bottom < viewportHeight * PROCESS_RESET_OFFSET || rect.top > viewportHeight * (1 - PROCESS_RESET_OFFSET);
}

function queueProcessStep(stepIndex, delay, replayOnly = false) {
  processAutoTimers.push(
    window.setTimeout(() => {
      setProcessStep(stepIndex);
      if (stepIndex === processSteps.length - 1) {
        processSequenceCompleted = true;
        updateProcessIntroState();

        if (canStartProcessSequence()) {
          processAutoTimers.push(
            window.setTimeout(() => {
              if (canStartProcessSequence()) {
                playProcessSequence({ replayOnly: true });
              }
            }, PROCESS_LOOP_DELAY_MS),
          );
        }
      }
    }, delay),
  );
}

function playProcessSequence({ replayOnly = false } = {}) {
  if (!processSection || !processIllustration || (processSequenceStarted && !processSequenceCompleted)) {
    return;
  }

  clearProcessTimers();
  setProcessStep(0);
  processSequenceStarted = true;
  processSequenceCompleted = false;

  if (replayOnly) {
    processIntroStage = 2;
    updateProcessIntroState();

    let delay = Math.max(260, PROCESS_FIRST_STEP_HOLD_MS - 220);
    for (let stepIndex = 1; stepIndex < processSteps.length; stepIndex += 1) {
      queueProcessStep(stepIndex, delay, true);
      delay += PROCESS_STEP_INTERVAL_MS;
    }
    return;
  }

  processIntroStage = 0;
  updateProcessIntroState();

  processAutoTimers.push(
    window.setTimeout(() => {
      processIntroStage = 1;
      updateProcessIntroState();
    }, PROCESS_TEXT_REVEAL_DELAY),
  );

  processAutoTimers.push(
    window.setTimeout(() => {
      processIntroStage = 2;
      updateProcessIntroState();
    }, PROCESS_PANEL_REVEAL_DELAY),
  );

  let delay = PROCESS_PANEL_REVEAL_DELAY + PROCESS_FIRST_STEP_HOLD_MS;
  for (let stepIndex = 1; stepIndex < processSteps.length; stepIndex += 1) {
    queueProcessStep(stepIndex, delay);
    delay += PROCESS_STEP_INTERVAL_MS;
  }
}

if (processSection && processIllustration) {
  resetProcessSequence();
  window.addEventListener("scroll", () => {
    if (!processSequenceStarted && canStartProcessSequence()) {
      playProcessSequence();
      return;
    }

    if (processSequenceStarted && isProcessSectionResetZone()) {
      resetProcessSequence();
    }
  }, { passive: true });
}

function updateCurrentSection() {
  let currentSection = sections[0];

  sections.forEach((section) => {
    const top = section.getBoundingClientRect().top;
    if (top <= window.innerHeight * 0.28) {
      currentSection = section;
    }
  });
}

function updateScrollScenes() {
  scrollScenes.forEach((scene) => {
    const rate = Number(scene.dataset.parallax || 0);
    const rect = scene.getBoundingClientRect();
    const viewportCenter = window.innerHeight / 2;
    const sceneCenter = rect.top + rect.height / 2;
    const distance = sceneCenter - viewportCenter;
    const offset = distance * rate * -1;

    scene.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`);
  });
}

function toggleChartAnimation(section) {
  if (!section) {
    return;
  }

  const rect = section.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const isVisible = rect.top <= viewportHeight * 0.72 && rect.bottom >= viewportHeight * 0.28;

  section.classList.toggle("is-chart-animated", isVisible);
}

function toggleBuilderActive(section) {
  if (!section) {
    return;
  }

  const rect = section.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const isVisible = rect.top <= viewportHeight * 0.72 && rect.bottom >= viewportHeight * 0.28;
  const wasVisible = section.classList.contains("is-builder-active");

  section.classList.toggle("is-builder-active", isVisible);

  if (isVisible && !wasVisible) {
    updateBuilder({ animate: true });
  }
}

function updateSectionChartAnimations() {
  toggleChartAnimation(caffeineSection);
  toggleChartAnimation(ingredientsSection);
  toggleChartAnimation(impactSection);
  toggleBuilderActive(builderInteractiveSection);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function updateSectionProgress() {
  const viewportHeight = window.innerHeight;

  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const sectionCenter = rect.top + (rect.height / 2);
    const focusStrength = section.id === "process" ? 0.62 : 0.9;
    const focusLine = section.id === "process" ? 0.48 : 0.52;
    const distanceFromFocus = Math.abs(sectionCenter - (viewportHeight * focusLine));
    const normalizedDistance = clamp(distanceFromFocus / (viewportHeight * focusStrength), 0, 1);
    const progress = 1 - normalizedDistance;
    const eased = 1 - Math.pow(1 - progress, 2.4);
    const visual = clamp((eased - 0.08) / 0.9, 0, 1);
    const delayedEarly = clamp((eased - 0.8) / 0.08, 0, 1);
    const delayed = clamp((eased - 0.86) / 0.06, 0, 1);
    const delayedMid = clamp((eased - 0.91) / 0.04, 0, 1);
    const delayedLate = clamp((eased - 0.95) / 0.025, 0, 1);

    section.style.setProperty("--section-progress", eased.toFixed(3));
    section.style.setProperty("--visual-progress", visual.toFixed(3));
    section.style.setProperty("--text-progress-delayed-early", delayedEarly.toFixed(3));
    section.style.setProperty("--text-progress-delayed", delayed.toFixed(3));
    section.style.setProperty("--text-progress-delayed-mid", delayedMid.toFixed(3));
    section.style.setProperty("--text-progress-delayed-late", delayedLate.toFixed(3));
  });
}

function onScroll() {
  updateCurrentSection();
  updateScrollScenes();
  updateSectionProgress();
  updateSectionChartAnimations();
}

const builderSection = document.querySelector("#alternatives");
const builderGroups = [...document.querySelectorAll("[data-builder-group]")];
const builderName = document.querySelector("[data-builder-name]");
const builderCard = document.querySelector(".builder-card");
const builderStatCalories = document.querySelector('[data-stat="calories"]');
const builderStatSugar = document.querySelector('[data-stat="sugar"]');
const builderStatCaffeine = document.querySelector('[data-stat="caffeine"]');
const builderLayers = {
  coffee: document.querySelector('[data-layer="coffee"]'),
  milk: document.querySelector('[data-layer="milk"]'),
  syrup: document.querySelector('[data-layer="syrup"]'),
  topping: document.querySelector('[data-layer="topping"]'),
};

const builderConfig = {
  base: {
    "cold-brew": { label: "Cold Brew", calories: 5, sugar: 0, caffeine: 205, layer: 42 },
    latte: { label: "Latte", calories: 110, sugar: 14, caffeine: 150, layer: 34 },
    mocha: { label: "Mocha", calories: 190, sugar: 24, caffeine: 175, layer: 30 },
  },
  milk: {
    nonfat: { label: "Nonfat Milk", calories: 80, sugar: 12, caffeine: 0, layer: 24 },
    soymilk: { label: "Soymilk", calories: 100, sugar: 9, caffeine: 0, layer: 24 },
    "two-percent": { label: "2% Milk", calories: 120, sugar: 12, caffeine: 0, layer: 24 },
  },
  syrup: {
    none: { label: "No Syrup", calories: 0, sugar: 0, caffeine: 0, layer: 0 },
    vanilla: { label: "Vanilla", calories: 20, sugar: 5, caffeine: 0, layer: 8 },
    "mocha-syrup": { label: "Mocha", calories: 60, sugar: 8, caffeine: 5, layer: 10 },
  },
  topping: {
    none: { label: "No Topping", calories: 0, sugar: 0, caffeine: 0, layer: 0 },
    foam: { label: "Foam", calories: 15, sugar: 2, caffeine: 0, layer: 8 },
    whip: { label: "Whipped Cream", calories: 80, sugar: 1, caffeine: 0, layer: 12 },
  },
};

const builderState = {
  base: "cold-brew",
  milk: "nonfat",
  syrup: "none",
  topping: "none",
};

let builderAnimationTimeout = null;

function applyBuilderLayerHeights(layerHeights) {
  let offset = 0;
  ["coffee", "milk", "syrup", "topping"].forEach((key) => {
    const layer = builderLayers[key];
    if (!layer) return;
    const heightPct = layerHeights[key] || 0;
    layer.style.height = `${heightPct}%`;
    layer.style.bottom = `${offset}%`;
    layer.style.opacity = heightPct > 0 ? "1" : "0";
    offset += heightPct;
  });
}

function playBuilderFillAnimation(layerHeights) {
  if (!builderSection || !builderCard || !builderSection.classList.contains("is-builder-active")) {
    applyBuilderLayerHeights(layerHeights);
    return;
  }

  window.clearTimeout(builderAnimationTimeout);
  builderCard.classList.remove("is-refilling");

  window.requestAnimationFrame(() => {
    builderCard.classList.add("is-refilling");
    window.requestAnimationFrame(() => {
      applyBuilderLayerHeights(layerHeights);
      builderAnimationTimeout = window.setTimeout(() => {
        builderCard.classList.remove("is-refilling");
      }, 760);
    });
  });
}

function updateBuilder({ animate = false } = {}) {
  if (!builderSection) {
    return;
  }

  const base = builderConfig.base[builderState.base];
  const milk = builderConfig.milk[builderState.milk];
  const syrup = builderConfig.syrup[builderState.syrup];
  const topping = builderConfig.topping[builderState.topping];
  const selections = [base, milk, syrup, topping];

  const calories = selections.reduce((sum, item) => sum + item.calories, 0);
  const sugar = selections.reduce((sum, item) => sum + item.sugar, 0);
  const caffeine = selections.reduce((sum, item) => sum + item.caffeine, 0);
  const totalHeight = selections.reduce((sum, item) => sum + item.layer, 0) || 1;

  if (builderName) {
    const suffix = syrup.label === 'No Syrup' && topping.label === 'No Topping'
      ? `${milk.label}`
      : `${milk.label}, ${syrup.label === 'No Syrup' ? 'no syrup' : syrup.label}, ${topping.label === 'No Topping' ? 'no topping' : topping.label}`;
    builderName.textContent = `${base.label} with ${suffix}`;
  }

  if (builderStatCalories) builderStatCalories.textContent = String(calories);
  if (builderStatSugar) builderStatSugar.textContent = `${sugar}g`;
  if (builderStatCaffeine) builderStatCaffeine.textContent = `${caffeine}mg`;

  const layerHeights = {
    coffee: (base.layer / totalHeight) * 100,
    milk: (milk.layer / totalHeight) * 100,
    syrup: (syrup.layer / totalHeight) * 100,
    topping: (topping.layer / totalHeight) * 100,
  };

  if (animate) {
    playBuilderFillAnimation(layerHeights);
  } else {
    applyBuilderLayerHeights(layerHeights);
  }
}

if (builderGroups.length) {
  builderGroups.forEach((group) => {
    group.addEventListener('click', (event) => {
      const button = event.target.closest('.builder-option');
      if (!button) return;

      const groupName = group.dataset.builderGroup;
      const value = button.dataset.builderValue;
      if (!groupName || !value) return;

      builderState[groupName] = value;
      [...group.querySelectorAll('.builder-option')].forEach((option) => {
        option.classList.toggle('is-selected', option === button);
      });
      updateBuilder({ animate: true });
    });
  });

  updateBuilder({ animate: false });
}

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("load", () => {
  onScroll();
  requestAnimationFrame(() => {
    document.body.classList.add("is-ready");
  });
});
