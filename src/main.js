import './style.css'
//TODO:Create detail UI and picker
// Popout html
const popupControlsHTML = /*html*/`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Popup Controls</title>
            <style>
            body {
                font-family: Arial, sans-serif;
                background: #f0f0f0;
                margin: 0;
                padding: 20px;
            }
            h2 {
                color: #444;
            }
            button {
                padding: 10px 15px;
                background-color: #28a745;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            }
            button:hover {
                background-color: #218838;
            }
            </style>
        </head>
        <body>
          <h2>Archery timer controls</h2>
          <button onclick="window.opener.startTimer()">Start</button>
          <button onclick="window.opener.stopTimer()">Stop</button>
          <button onclick="window.opener.showMenu(); window.close()">Close</button>
          <button onclick="openSettings()">Settings</button>
          <div id="settings-modal-container"></div>
        </body>
        <script>
          function openSettings() {
            document.getElementById("settings-modal-container").innerHTML += window.opener.settingsModalHTML;
            document.getElementById("set-live-time").value = window.opener.set_live_time;
            document.getElementById("set-warning-time").value = window.opener.set_warning_time;
            document.getElementById("set-standby-time").value = window.opener.set_standby_time;
            document.getElementById("set-double-detail").checked = window.opener.set_double_detail;
          }
          function saveSettings() {
            const livetime = document.getElementById("set-live-time").value;
            const warntime = document.getElementById("set-warning-time").value;
            const standbytime = document.getElementById("set-standby-time").value;
            const doubledetail = document.getElementById("set-double-detail").checked;
            let status = window.opener.saveSettingsFR(parseInt(livetime), parseInt(warntime), parseInt(standbytime), doubledetail);
            if (status !== true) alert("invalid settings");
            else document.getElementById("settings-modal").remove();
          }
        <\/script>
        </html>
        `;

//TODO:Add default settings IKO...
// settings modal html
const settingsModalHTML = /*HTML*/ `
      <div id="settings-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); justify-content: center; align-items: center; z-index: 1000;">
        <div style="background: #ffffff; padding: 20px 30px; border-radius: 15px; width: 90%; max-width: 450px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2); font-family: 'Arial', sans-serif;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eeeeee; padding-bottom: 15px; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 1.8rem; color: #333;">Timer Settings</h2>
            <button onclick="document.getElementById('settings-modal').remove()" style="font-size: 2rem; font-weight: bold; color: #777; cursor: pointer; border: none; background: none; padding: 0 10px;">&times;</button>
          </div>

          <div style="padding-top: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <label for="set-live-time" style="font-size: 1.1rem; color: #555;">Live Time (seconds):</label>
              <input type="number" id="set-live-time" min="1" style="width: 80px; padding: 8px 12px; font-size: 1.1rem; border: 1px solid #cccccc; border-radius: 5px; text-align: center;">
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <label for="set-warning-time" style="font-size: 1.1rem; color: #555;">Warning Time (seconds):</label>
              <input type="number" id="set-warning-time" min="1" style="width: 80px; padding: 8px 12px; font-size: 1.1rem; border: 1px solid #cccccc; border-radius: 5px; text-align: center;">
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <label for="set-standby-time" style="font-size: 1.1rem; color: #555;">Standby Time (seconds):</label>
              <input type="number" id="set-standby-time" min="1" style="width: 80px; padding: 8px 12px; font-size: 1.1rem; border: 1px solid #cccccc; border-radius: 5px; text-align: center;">
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <label for="set-double-detail" style="font-size: 1.1rem; color: #555;">Double Detail:</label>
              <input type="checkbox" id="set-double-detail" min="1" style="width: 80px; padding: 8px 12px; font-size: 1.1rem; border: 1px solid #cccccc; border-radius: 5px; text-align: center;">
            </div>
          </div>
          
          <div style="display: flex; justify-content: flex-end; gap: 10px; padding-top: 15px; border-top: 1px solid #eeeeee; margin-top: 10px;">
            <button style="background-color: #f0f0f0; color: #333;" onclick="document.getElementById('settings-modal').remove()">Cancel</button>
            <button onclick="saveSettings()">Save</button>
          </div>

        </div>
      </div>
    `;

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
let timerDisplay = window.set_live_time;
let timerInterval;
const TIMER_STATE = {
  STAND_BY: 0,
  LIVE: 1,
  WARNING: 2,
  STOP: 3,
}
let timerState = TIMER_STATE.STOP;

// Elements
const detailLeftLbl = document.getElementById("detail-left-lbl");
const detailRightLbl = document.getElementById("detail-right-lbl");
const greenSquare = document.getElementById("shoot");
const yellowSquare = document.getElementById("warn");
const redSquare = document.getElementById("stop");
const timerDisplayLbl = document.getElementById('timer');
const timerControlsDiv = document.getElementById('timer-controls');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('btnStop');
const settingsButton = document.getElementById('btnSettings');
const fullscreenButton = document.getElementById('fullscreen')
const popoutButton = document.getElementById('btnPopout');

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

// Update the timer display
//FIX: This should not take in any parameter...
//OR make this the only way to update timerDisplay
window.updateTimer = function (num) {
  timerDisplayLbl.textContent = num.toString();
}

//FIX: Bug when timer is started twice! add checks and make start/stop a single btn
// Start the timer
window.startTimer = function () {
  buzzTwice();
  timerDisplay = window.set_standby_time;
  updateTimer(timerDisplay);
  flashBackground('yellow', 500);
  setIndicator(INDICATOR_STATE.YELLOW);
  timerState = TIMER_STATE.STAND_BY;
  timerInterval = setInterval(() => {
    timerDisplay--;
    updateTimer(timerDisplay);
    if (timerDisplay != 0 && timerState != TIMER_STATE.LIVE) return;
    if (timerDisplay != window.set_warning_time && timerState == TIMER_STATE.LIVE) return;

    timerState++;
    if (timerState == TIMER_STATE.LIVE) {
      timerDisplay = window.set_live_time;
      updateTimer(timerDisplay);
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

function lockButtons() {
  document.querySelectorAll("button").forEach((x) => { x.disabled = true; });
}

function unlockButtons() {
  document.querySelectorAll("button").forEach((x) => { x.disabled = false; });
}

function stopTimer() {
  lockButtons();
  buzzThrice();
  timerState = TIMER_STATE.STOP;
  clearInterval(timerInterval);
  setIndicator(INDICATOR_STATE.RED);
  document.body.style.backgroundColor = '#ff0000';
  setTimeout(() => {
    document.body.style.backgroundColor = '#ffffff';
    timerState = window.set_live_time;
    updateTimer(window.set_live_time);
    unlockButtons();
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
function saveSettingsFR(livetime, warntime, standbytime, doubledetail) {
  if (livetime < 1 || warntime < 1 || standbytime < 1 || warntime >= livetime) return false;
  window.set_live_time = livetime;
  window.set_warning_time = warntime;
  window.set_standby_time = standbytime;
  window.set_double_detail = doubledetail;
  timerDisplay = livetime;
  updateTimer(timerDisplay);
  return true;
}

function goFullscreen() {
  document.documentElement.requestFullscreen();
}

function createPopout() {
  window.settingsModalHTML = settingsModalHTML;
  const popout = window.open('', '', 'width=400, height=500');
  popout.document.write(popupControlsHTML);
  popout.document.close();
  timerControlsDiv.style.visibility = 'hidden';
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
updateTimer(window.set_live_time);
setIndicator(INDICATOR_STATE.RED);
