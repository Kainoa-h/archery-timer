import './style.css';


// Elements
const detailLeftLbl = document.getElementById("detail-left-lbl");
const detailRightLbl = document.getElementById("detail-right-lbl");
const greenSquare = document.getElementById("shoot");
const yellowSquare = document.getElementById("warn");
const redSquare = document.getElementById("stop");
const timerDisplayLbl = document.getElementById('timer');
const settingsLip = document.getElementById('settings-lip');
const settingsPanel = document.getElementById('settings-panel');
const liveInput = document.getElementById('set-live-time');
const warnInput = document.getElementById('set-warning-time');
const standbyInput = document.getElementById('set-standby-time');
const doubleDetailInput = document.getElementById('set-double-detail');
const detailButtons = document.querySelectorAll('.detail-btn');
const settingsError = document.getElementById('settings-error');
const introModal = document.getElementById('intro-modal');
const introClose = document.getElementById('intro-close');


// Buzzer
const SHORT_BUZZ_DURATION = 0.5;
const LONG_BUZZ_DURATION = 0.8;
const BUZZ_INTERVAL_DURATION = 0.2;
function buzz(duration) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // Main oscillator
  const oscillator = audioContext.createOscillator();
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);

  // Gain for shaping volume envelope
  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);

  // Bandpass filter to mimic whistle tube resonance
  const filter = audioContext.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1200, audioContext.currentTime);
  filter.Q.setValueAtTime(15, audioContext.currentTime);

  // Create tremolo (amplitude modulation for "chirpy" effect)
  const tremolo = audioContext.createOscillator();
  tremolo.frequency.setValueAtTime(5, audioContext.currentTime);

  const tremoloGain = audioContext.createGain();
  tremoloGain.gain.setValueAtTime(0.1, audioContext.currentTime);

  // Route tremolo to gain control
  tremolo.connect(tremoloGain);
  tremoloGain.connect(gainNode.gain);

  // Connect signal chain
  oscillator.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Start everything
  oscillator.start();
  tremolo.start();

  // Envelope (quick fade in, quick fade out)
  const now = audioContext.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(9, now + 0.02);

  oscillator.stop(now + duration);
  tremolo.stop(now + duration);

  oscillator.onended = () => {
    audioContext.close();
  };
}
function buzzOnce() { buzz(SHORT_BUZZ_DURATION); }
function buzzTwice() {
  buzz(SHORT_BUZZ_DURATION);
  setTimeout(() => {
    buzz(SHORT_BUZZ_DURATION);
  }, (SHORT_BUZZ_DURATION + BUZZ_INTERVAL_DURATION) * 1000);
}
function buzzThrice() {
  buzz(SHORT_BUZZ_DURATION);
  setTimeout(() => {
    buzz(SHORT_BUZZ_DURATION);
  }, (SHORT_BUZZ_DURATION + BUZZ_INTERVAL_DURATION) * 1000);
  setTimeout(() => {
    buzz(LONG_BUZZ_DURATION);
  }, (SHORT_BUZZ_DURATION + BUZZ_INTERVAL_DURATION) * 2000);
}


// Timer Settings
window.set_standby_time = 3;
window.set_live_time = 10;
window.set_warning_time = 5;
window.set_double_detail = true;


// Timer functionality
Object.defineProperty(window, "timerDisplay", {
  get() {
    return this._timerDisplay;
  },
  set(x) {
    this._timerDisplay = x;
    timerDisplayLbl.textContent = x.toString();
  }
});
window.timerDisplay = window.set_live_time;

let timerInterval;
const TIMER_STATE = {
  STAND_BY: 0,
  LIVE: 1,
  WARNING: 2,
  STOP: 3,
}
let timerState = TIMER_STATE.STOP;

const DETAIL_STATE = {
  d1: 1,
  d2: 2,
  d3: 3,
  d4: 4
}

window.detailState = DETAIL_STATE.d1;

function updateDetail() {
  if (detailState == 1 || detailState == 4) {
    detailLeftLbl.textContent = "A";
    detailRightLbl.textContent = "B";
  }
  else {
    detailLeftLbl.textContent = "C";
    detailRightLbl.textContent = "D";
  }
}

function setDetail(detail) {
  console.assert(Object.values(DETAIL_STATE).includes(detail), "Invalid state passed into setDetail");
  detailState = detail;
  updateDetail();
}

function nextDetail() {
  detailState++;
  if (detailState == 5) detailState = 1;
  updateDetail();
}

// Start the timer
window.startTimer = function () {
  settingsLip.classList.add('hidden-running');
  settingsLip.classList.remove('open');
  buzzTwice();
  window.timerDisplay = window.set_standby_time;
  flashBackground('yellow', 500);
  setIndicator(INDICATOR_STATE.YELLOW);
  timerState = TIMER_STATE.STAND_BY;
  timerInterval = setInterval(() => {
    window.timerDisplay--;
    if (window.timerDisplay != 0 && timerState != TIMER_STATE.LIVE) return;
    if (window.timerDisplay != window.set_warning_time && timerState == TIMER_STATE.LIVE) return;

    timerState++;
    if (timerState == TIMER_STATE.LIVE) {
      window.timerDisplay = window.set_live_time;
      setIndicator(INDICATOR_STATE.GREEN);
      flashBackground('green', 500);
      buzzOnce();
      return;
    }
    if (timerState == TIMER_STATE.WARNING) {
      flashBackground('yellow', 500);
      setIndicator(INDICATOR_STATE.YELLOW);
      return;
    }
    if (timerState == TIMER_STATE.STOP) {
      clearInterval(timerInterval);
      if (window.set_double_detail && (detailState == DETAIL_STATE.d1 || detailState == DETAIL_STATE.d3)) {
        nextDetail();
        startTimer();
        return;
      }
      stopTimer();
      if (window.set_double_detail) nextDetail();
    }
  }, 1000);
}

function flashBackground(color, duration) {
  document.body.style.backgroundColor = color;
  setTimeout(() => {
    document.body.style.backgroundColor = '#FFFFFF';
  }, duration);

}

window.stopTimer = function () {
  buzzThrice();
  timerState = TIMER_STATE.STOP;
  clearInterval(timerInterval);
  setIndicator(INDICATOR_STATE.RED);
  document.body.style.backgroundColor = '#ff0000';
  const stopDelay = (SHORT_BUZZ_DURATION + BUZZ_INTERVAL_DURATION) * 2000;
  setTimeout(() => {
    if (timerState !== TIMER_STATE.STOP) return;
    document.body.style.backgroundColor = '#ffffff';
    window.timerDisplay = window.set_live_time;
    settingsLip.classList.remove('hidden-running');
  }, stopDelay);
}

function selectDetailButton(detail) {
  detailButtons.forEach((btn) => { btn.classList.remove('selected'); });
  const selected = document.querySelector(`.detail-btn[data-detail="${detail}"]`);
  if (selected) selected.classList.add('selected');
}


// Settings form
let lastValidSettings = {
  live: window.set_live_time,
  warn: window.set_warning_time,
  standby: window.set_standby_time,
  double: window.set_double_detail,
  detail: window.detailState
};

function populateForm() {
  liveInput.value = window.set_live_time;
  warnInput.value = window.set_warning_time;
  standbyInput.value = window.set_standby_time;
  doubleDetailInput.checked = window.set_double_detail;
  selectDetailButton(window.detailState);
}

function readForm() {
  return {
    live: parseInt(liveInput.value, 10),
    warn: parseInt(warnInput.value, 10),
    standby: parseInt(standbyInput.value, 10),
    double: doubleDetailInput.checked,
    detail: parseInt(settingsPanel.querySelector('.detail-btn.selected')?.dataset.detail, 10)
  };
}

function showError(message) {
  settingsError.textContent = message;
}

function clearError() {
  settingsError.textContent = '';
}

function validateAndSave() {
  const values = readForm();
  if ([values.live, values.warn, values.standby, values.detail].some(Number.isNaN)) {
    showError('All number fields must have valid values.');
    return false;
  }
  if (values.live < 1 || values.warn < 1 || values.standby < 1 || values.warn >= values.live) {
    showError('All times must be ≥1 and warning time must be less than live time.');
    return false;
  }

  window.set_live_time = values.live;
  window.set_warning_time = values.warn;
  window.set_standby_time = values.standby;
  window.set_double_detail = values.double;
  window.timerDisplay = values.live;
  setDetail(values.detail);

  lastValidSettings = { ...values };
  clearError();
  return true;
}

function revertSettings() {
  liveInput.value = lastValidSettings.live;
  warnInput.value = lastValidSettings.warn;
  standbyInput.value = lastValidSettings.standby;
  doubleDetailInput.checked = lastValidSettings.double;
  selectDetailButton(lastValidSettings.detail);
  clearError();
}


// Event listeners
settingsLip.addEventListener('mouseenter', () => {
  if (timerState === TIMER_STATE.STOP) {
    populateForm();
    settingsLip.classList.add('open');
  }
});

settingsLip.addEventListener('mouseleave', () => {
  if (!validateAndSave()) {
    revertSettings();
  }
  settingsLip.classList.remove('open');
});

liveInput.addEventListener('change', validateAndSave);
warnInput.addEventListener('change', validateAndSave);
standbyInput.addEventListener('change', validateAndSave);
doubleDetailInput.addEventListener('change', validateAndSave);

detailButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    detailButtons.forEach((b) => { b.classList.remove('selected'); });
    btn.classList.add('selected');
    validateAndSave();
  });
});

document.addEventListener('keydown', (e) => {
  if (e.code !== 'Space') return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || settingsLip.classList.contains('open')) {
    return;
  }
  e.preventDefault();
  if (timerState === TIMER_STATE.STOP) {
    window.startTimer();
  } else {
    window.stopTimer();
  }
});

const INDICATOR_STATE = {
  YELLOW: 0,
  GREEN: 1,
  RED: 2,
  NONE: 3
};
window.setIndicator = function (indicatorState) {
  console.assert((typeof (indicatorState)) === "number", "Non number passed into setIndicator", indicatorState);
  console.assert(Object.values(INDICATOR_STATE).includes(indicatorState), "Invalid state passed into setIndicator");
  if (indicatorState == INDICATOR_STATE.YELLOW) {
    redSquare.style.visibility = "hidden"
    yellowSquare.style.visibility = "visible"
    greenSquare.style.visibility = "hidden"
    return;
  }
  if (indicatorState == INDICATOR_STATE.GREEN) {
    redSquare.style.visibility = "hidden"
    yellowSquare.style.visibility = "hidden"
    greenSquare.style.visibility = "visible"
    return;
  }
  if (indicatorState == INDICATOR_STATE.RED) {
    redSquare.style.visibility = "visible"
    yellowSquare.style.visibility = "hidden"
    greenSquare.style.visibility = "hidden"
    return;
  }
  if (indicatorState == INDICATOR_STATE.NONE) {
    redSquare.style.visibility = "hidden"
    yellowSquare.style.visibility = "hidden"
    greenSquare.style.visibility = "hidden"
    return;
  }
}

// Initialize
populateForm();
setIndicator(INDICATOR_STATE.RED);

function closeIntroModal() {
  introModal.classList.add('hidden');
}

introClose.addEventListener('click', closeIntroModal);
introModal.addEventListener('click', (e) => {
  if (e.target === introModal) closeIntroModal();
});
