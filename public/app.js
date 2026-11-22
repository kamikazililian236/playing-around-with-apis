// --- Pomodoro Timer, Settings & Aesthetics ---
const savedDurations = JSON.parse(localStorage.getItem('pomodoro_durations')) || {
  focus: 25,
  shortBreak: 5,
  longBreak: 15
};

let settings = JSON.parse(localStorage.getItem('pomodoro_settings')) || {
  autoBreaks: false,
  autoFocus: false,
  alarm: true,
  sound: 'chime',
  volume: 80,
  timerStyle: 'ring',
  accent: ''
};

const MODES = {
  focus: { label: 'Focus session', seconds: savedDurations.focus * 60 },
  shortBreak: { label: 'Short break', seconds: savedDurations.shortBreak * 60 },
  longBreak: { label: 'Long break', seconds: savedDurations.longBreak * 60 }
};

let currentMode = 'focus';
let timeLeft = MODES.focus.seconds;
let timerId = null;

const todayKey = new Date().toDateString();
let challenge = JSON.parse(localStorage.getItem('pomodoro_challenge')) || {
  goalMinutes: 120,
  focusedMinutes: 0,
  date: todayKey
};
if (challenge.date !== todayKey) {
  challenge.focusedMinutes = 0;
  challenge.date = todayKey;
}

let counts = JSON.parse(localStorage.getItem('pomodoro_counts')) || {
  focus: 0,
  shortBreak: 0,
  longBreak: 0,
};

// DOM elements
const timeDisplay = document.getElementById('timeDisplay');
const sessionLabel = document.getElementById('sessionLabel');
const timerRing = document.getElementById('timerRing');
const startPauseBtn = document.getElementById('startPauseBtn');
const resetBtn = document.getElementById('resetBtn');
const tabs = document.querySelectorAll('.tab');

const statsBtn = document.getElementById('statsBtn');
const bgDimBtn = document.getElementById('bgDimBtn');
const settingsBtn = document.getElementById('settingsBtn');

const modalBackdrop = document.getElementById('modalBackdrop');
const challengeModal = document.getElementById('challengeModal');
const settingsModal = document.getElementById('settingsModal');
const appearanceModal = document.getElementById('appearanceModal');

const goalHoursEl = document.getElementById('goalHours');
const goalMinsEl = document. getElementById('goalMins');
const challengeHeading = document.getElementById('challengeHeading');
const challengeProgress = document.getElementById('challengeProgress');

// --- Timer & Sound ---
function playChime() {
  if (!settings.alarm || settings.volume == 0) return;
  const freqs = { chime: 660, bell: 880, digital: 520, soft: 440 };
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = settings.sound === 'digital' ? 'square' : 'sine';
  osc.frequency.setValueAtTime(freqs[settings.sound] || 660, ctx.currentTime);
  gain.gain.setValueAtTime(settings.volume / 100, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.6);
}

function updateTimerUI() {
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  timeDisplay.textContent = `${mins}:${secs}`;
  document.title = `${mins}:${secs} - Pomodoro Timer`;
  const total = MODES[currentMode].seconds;
  timerRing.style.setProperty('--progress', `${(timeLeft / total) * 100}%`);
}

function updateModeCounts() {
  document.getElementById('focusCount').textContent = counts.focus;
  document.getElementById('shortBreakCount').textContent = counts.shortBreak;
  document.getElementById('longBreakCount').textContent = counts.longBreak;
}

function toggleTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
    startPauseBtn.textContent = 'Start';
    return;
  }

  startPauseBtn.textContent = 'Pause';
  timerId = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateTimerUI();
    } else {
      clearInterval(timerId);
      timerId = null;
      startPauseBtn.textContent = 'Start';
      playChime();

      counts[currentMode]++;
      localStorage.setItem('pomodoro_counts', JSON.stringify(counts));
      if (currentMode === 'focus') {
        challenge.focusedMinutes += Math.round(MODES.focus.seconds / 60);
        localStorage.setItem('pomodoro_challenge',JSON.stringify(challenge));
      }
      updateModeCounts();

      const nextMode = currentMode === 'focus' ? 'shortBreak' : 'focus';
      switchMode(nextMode);
      if ((nextMode !== 'focus' && settings.autoBreaks) || (nextMode === 'focus' && settings.autoFocus)) {
        toggleTimer();
      }
    }
  }, 1000);
}

function resetTimer(){
  clearInterval(timerId);
  timerId = null;
  startPauseBtn.textContent = 'Start';
  timeLeft = MODES[currentMode].seconds;
  updateTimerUI();
}

function switchMode(mode) {
  currentMode = mode;
  document.body.dataset.mode = mode;
  if (!settings.accent) document.body.style.removeProperty('--accent');
  tabs.forEach(t => t.classList.toggle('active', t.dataset.mode == mode));
  sessionLabel.textContent = MODES[mode].label;
  resetTimer();
}

// --- Modals ---
function openModal(modal) {
  [challengeModal, settingsModal, appearanceModal].forEach(m => m.classList.add('hidden'));
  modal.classList.remove('hidden');
  modalBackdrop.classList.remove('hidden');
}
function closeModal() {
  modalBackdrop.classList.add('hidden');
}


// Challenge Modal
let draftHours = Math.floor(challenge.goalMinutes / 60);
let draftMins = challenge.goalMinutes % 60;

function renderChallengeUI() {
  const weekday = new Date().toLocaleDateString(undefined, { weekday: 'long' });
  challengeHeading.textContent = `Today ${weekday}, I want to focus for a total of...`; 
  goalHoursEl.textContent = draftHours;
  goalMinsEl.textContent = String(draftMins).padStart(2, '0');
  challengeProgress.textContent = `Progress today: ${challenge.focusedMinutes} / ${challenge.goalMinutes} min`;
}

statsBtn.addEventListener('click', () => {
  draftHours = Math.floor(challenge.goalMinutes / 60);
  draftMins = challenge.goalMinutes % 60;
  renderChallengeUI();
  openModal(challengeModal);
});

document.getElementById('hoursMinus').addEventListener('click', () => { if (draftHours > 0) draftHours--; renderChallengeUI(); });
document.getElementById('hoursPlus').addEventListener('click', () => { if (draftHours < 12) draftHours++; renderChallengeUI(); });
document.getElementById('minsMinus').addEventListener('click', ()=> {draftMins = draftMins >= 15 ? draftMins - 15 : 45; renderChallengeUI(); });
document.getElementById('minsPlus').addEventListener('click', () => {draftMins = (draftMins + 15) % 60; renderChallengeUI(); });

document.getElementById('acceptChallengeBtn').addEventListener('click',() => {
  challenge.goalMinutes = Math.max(15, draftHours * 60 + draftMins);
  localStorage.setItem('pomodoro_challenge', JSON.stringify(challenge));
  closeModal();
});

// settings Modal
function syncSettingsUI() {
  document.getElementById('setFocusVal').textContent = MODES.focus.seconds / 60;
  document.getElementById('setShortVal').textContent = MODES.shortBreak.seconds / 60;
  document.getElementById('setLongVal').textContent = MODES.longBreak.seconds / 60;
  document.getElementById('autoBreaksToggle').checked = settings.autoBreaks;
  document.getElementById('autoFocusToggle').checked = settings.autoFocus;
  document.getElementById('alarmToggle').checked = settings.alarm;
  document.getElementById('volumeSlider').value = settings.volume;
  document.getElementById('volumeText').textContent = `${settings.volume}%`;
  document.getElementById('apiCityInput').value = apiConfig.city;
  document.getElementById('apiCountryInput').value = apiConfig.country;
  document.getElementById('apiError').classList.add('hidden');
  document.querySelectorAll('.pill-opt').forEach(p => p.classList.toggle('active', p.dataset.sound === settings.sound));  
}

function saveSettings() {
  localStorage.setItem('pomodoro_settings', JSON.stringify(settings));
}

settingsBtn.addEventListener('click', () => {
  syncSettingsUI();
  openModal(settingsModal);
});

document.querySelectorAll('.len-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.target;
    const delta = Number(btn.dataset.delta);
    const nextMins = Math.max(1, Math.min(120, MODES[mode].seconds / 60 + delta));
    MODES[mode].seconds = nextMins * 60;
    localStorage.setItem('pomodoro_durations', JSON.stringify({
      focus: MODES.focus.seconds / 60,
      shortBreak: MODES.shortBreak.seconds / 60,
      longBreak: MODES.longBreak.seconds / 60
    }));
    syncSettingsUI();
    if (currentMode === mode) resetTimer();
  });
});

document.getElementById('resetCountersBtn').addEventListener('click', () => {
 counts = { focus: 0, shortBreak: 0, longBreak: 0 };
localStorage.setItem('pomodoro_counts', JSON.stringify(counts));
updateModeCounts();
});

document.getElementById('autoBreaksToggle').addEventListener('change', e => { settings.autoBreaks = e.target.checked; saveSettings(); });
document.getElementById('autoFocusToggle').addEventListener('change', e => { settings.autoFocus = e.target.checked; saveSettings(); });
document.getElementById('alarmToggle').addEventListener('change', e => { settings.alarm = e.target.checked; saveSettings(); });

document.querySelectorAll('.pill-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    settings.sound = btn.dataset.sound;
    saveSettings();
    syncSettingsUI();
    playChime();
  });
});

document .getElementById('volumeSlider').addEventListener('input', e => {
  settings.volume = Number(e.target.value);
  document.getElementById('volumeText').textContent = `${settings.volume}%`;
  saveSettings();
});

// Aesthetics Modal
function applyAesthetics() {
  timerRing.classList.toggle('numbers-only', settings.timerStyle === 'numbers');
  document.querySelectorAll('.style-card').forEach(c => c.classList.toggle('active', c.dataset.style === settings.timerStyle));
  if (settings.accent) document.body.style.setProperty('--accent', settings.accent);
  document.querySelectorAll('.swatch').forEach(s => s.classList.toggle('active', s.dataset.color === settings.accent));
}

bgDimBtn.addEventListener('click', () => {
  applyAesthetics();
  openModal(appearanceModal);
});

document.querySelectorAll('.style-card').forEach(card => {
  card.addEventListener('click', () => {
    settings.timerStyle = card.dataset.style;
    saveSettings();
    applyAesthetics();
  });
});

document.querySelectorAll('.dim-btn').forEach(btn => {
  btn.addEventListener('click',() => {
    document.documentElement.style.setProperty('--scrim', btn.dataset.scrim);
  });
});

document.querySelectorAll('.swatch').forEach(swatch => {
  swatch.addEventListener('click', () => {
    settings.accent = swatch.dataset.color;
    saveSettings();
    applyAesthetics();
  });
});

document.getElementById('bgFileInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    document.documentElement.style.setProperty('--bg-image', `url("${reader.result}")`);
    closeModal();
  };
  reader.readAsDataURL(file);
});

document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', closeModal));
modalBackdrop.addEventListener('click', e=> {
  if (e.target === modalBackdrop) closeModal();
});

// Timer Events & Init
startPauseBtn.addEventListener('click', toggleTimer);
resetBtn.addEventListener('click', resetTimer);
tabs.forEach(tab => tab.addEventListener('click', () => switchMode(tab.dataset.mode)));

applyAesthetics();
updateModeCounts();
updateTimerUI();
