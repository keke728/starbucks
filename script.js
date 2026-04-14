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

function updateSectionChartAnimations() {
  toggleChartAnimation(caffeineSection);
  toggleChartAnimation(ingredientsSection);
  toggleChartAnimation(impactSection);
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

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("load", () => {
  onScroll();
  requestAnimationFrame(() => {
    document.body.classList.add("is-ready");
  });
});
