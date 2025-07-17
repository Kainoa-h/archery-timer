import './style.css';
import styleSheet from './style.css?raw';
import popupControlsHTML_no_style from './template/pop_out_controls.html?raw';
import settingsModalHTML from './template/settings_modal.html?raw';
//TODO: fucked up styling of contorls
const popupControlsHTML = popupControlsHTML_no_style.replace("<style></style>", "<style>" + styleSheet + "</style>");


//TODO:Create detail UI and picker

//TODO:Add default settings IKO...


// Elements
const detailLeftLbl = document.getElementById("detail-left-lbl");
const detailRightLbl = document.getElementById("detail-right-lbl");
const greenSquare = document.getElementById("shoot");
const yellowSquare = document.getElementById("warn");
const redSquare = document.getElementById("stop");
const timerDisplayLbl = document.getElementById('timer');
const timerControlsDiv = document.getElementById('timer-controls');
const startButton = document.getElementById('btnStart');
const stopButton = document.getElementById('btnStop');
const settingsButton = document.getElementById('btnSettings');
const fullscreenButton = document.getElementById('fullscreen')
const popoutButton = document.getElementById('btnPopout');

// Buzzer
const SHORT_BUZZ_DURATION = 0.5;
const LONG_BUZZ_DURATION = 0.8;
const BUZZ_INTERVAL_DURATION = 0.2;
function buzz(duration) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // Main oscillator
  const oscillator = audioContext.createOscillator();
  oscillator.type = 'square'; // Sharp, buzzy tone
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Deeper than pure sine whistle

  // Gain for shaping volume envelope
  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);

  // Bandpass filter to mimic whistle tube resonance
  const filter = audioContext.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1200, audioContext.currentTime); // Focused around 1200 Hz
  filter.Q.setValueAtTime(15, audioContext.currentTime); // Narrow resonance

  // Create tremolo (amplitude modulation for "chirpy" effect)
  const tremolo = audioContext.createOscillator();
  tremolo.frequency.setValueAtTime(5, audioContext.currentTime); // Fast on/off ~25 Hz

  const tremoloGain = audioContext.createGain();
  tremoloGain.gain.setValueAtTime(0.1, audioContext.currentTime); // Depth of modulation

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
  gainNode.gain.linearRampToValueAtTime(9, now + 0.02); // Sharp attack

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
// Has to be var so that it gets attached to the window object, making it accessible to the popout
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

var DETAIL_STATE = {
  d1: 1,
  d2: 2,
  d3: 3,
  d4: 4
}
var detailState = DETAIL_STATE.d1;

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
window.startTimer = function (callback = false) {
  console.log("start timer callback:", callback);
  startButton.hidden = true;
  stopButton.hidden = false;
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
        startTimer(callback);
        return;
      }
      stopTimer(callback);
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

function lockButtons() {
  document.querySelectorAll("button").forEach((x) => { x.disabled = true; });
}

function unlockButtons() {
  document.querySelectorAll("button").forEach((x) => { x.disabled = false; });
}

window.stopTimer = function (callback = false) {
  lockButtons();
  buzzThrice();
  timerState = TIMER_STATE.STOP;
  clearInterval(timerInterval);
  setIndicator(INDICATOR_STATE.RED);
  document.body.style.backgroundColor = '#ff0000';
  setTimeout(() => {
    document.body.style.backgroundColor = '#ffffff';
    window.timerDisplay = window.set_live_time;
    unlockButtons();
    startButton.hidden = false;
    stopButton.hidden = true;
    if (callback) callback();
  }, (SHORT_BUZZ_DURATION + BUZZ_INTERVAL_DURATION) * 2000);
}

//TODO:lock settings button while timer is running
function openSettings() {
  document.getElementById("settings-modal-container").innerHTML += settingsModalHTML;
  document.getElementById("set-live-time").value = window.set_live_time;
  document.getElementById("set-warning-time").value = window.set_warning_time;
  document.getElementById("set-standby-time").value = window.set_standby_time;
  document.getElementById("set-double-detail").checked = window.set_double_detail;
}

window.saveSettings = function () {
  const livetime = document.getElementById("set-live-time").value;
  const warntime = document.getElementById("set-warning-time").value;
  const standbytime = document.getElementById("set-standby-time").value;
  const doubledetail = document.getElementById("set-double-detail").checked;
  let status = saveSettingsFR(parseInt(livetime), parseInt(warntime), parseInt(standbytime), doubledetail);
  if (status !== true) alert("invalid settings");
  else document.getElementById("settings-modal").remove();
}

//TODO:add validation for double detail
window.saveSettingsFR = function (livetime, warntime, standbytime, doubledetail) {
  if (livetime < 1 || warntime < 1 || standbytime < 1 || warntime >= livetime) {
    console.log({
      livetime: livetime,
      warntime: warntime,
      standbytime: standbytime,
      doubledetail: doubledetail
    });
    return false;
  }
  window.set_live_time = livetime;
  window.set_warning_time = warntime;
  window.set_standby_time = standbytime;
  window.set_double_detail = doubledetail;
  window.timerDisplay = livetime;
  return true;
}

function goFullscreen() {
  document.documentElement.requestFullscreen();
}

function createPopout() {
  window.settingsModalHTML = settingsModalHTML;
  const popout = window.open('', '', 'width=400, height=500');
  if (popout) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(popupControlsHTML, 'text/html');
    popout.document.head.innerHTML = doc.head.innerHTML;
    popout.document.body.innerHTML = doc.body.innerHTML;
    const scripts = doc.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const script = popout.document.createElement('script');
      script.textContent = scripts[i].textContent;
      popout.document.body.appendChild(script);
    }
    timerControlsDiv.style.visibility = 'hidden';
  }
}

window.showMenu = function () {
  timerControlsDiv.style.visibility = 'visible';
}

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

// Event listeners
startButton.addEventListener('click', startTimer);
stopButton.addEventListener('click', stopTimer);
settingsButton.addEventListener('click', openSettings);
fullscreenButton.addEventListener('click', goFullscreen);
popoutButton.addEventListener('click', createPopout);

// Initialize the timer display
setIndicator(INDICATOR_STATE.RED);
