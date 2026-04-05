'use strict';

// ===== Constants =====
const STORAGE_KEY_URL   = 'transcribe_local_url';
const STORAGE_KEY_MODEL = 'transcribe_local_model';
const STORAGE_KEY_KEY   = 'transcribe_api_key';
const DEFAULT_URL       = 'http://localhost:8000';
const DEFAULT_MODEL     = 'Systran/faster-whisper-large-v3';
const OPENAI_ENDPOINT   = 'https://api.openai.com';
const OPENAI_MODEL      = 'gpt-4o-transcribe';
const MAX_CHUNK_BYTES   = 24 * 1024 * 1024; // 24 MB

// ===== DOM References =====
const btnSettings       = document.getElementById('btn-settings');
const settingsPanel     = document.getElementById('settings-panel');
const inputLocalUrl     = document.getElementById('local-url');
const inputLocalModel   = document.getElementById('local-model');
const inputApiKey       = document.getElementById('api-key');
const btnToggleKey      = document.getElementById('btn-toggle-key');
const btnSaveSettings   = document.getElementById('btn-save-settings');
const btnCloseSettings  = document.getElementById('btn-close-settings');

const tabRecordBtn      = document.getElementById('tab-record-btn');
const tabUploadBtn      = document.getElementById('tab-upload-btn');
const tabRecord         = document.getElementById('tab-record');
const tabUpload         = document.getElementById('tab-upload');

const waveCanvas        = document.getElementById('wave-canvas');
const timerEl           = document.getElementById('timer');
const btnRecord         = document.getElementById('btn-record');
const btnStop           = document.getElementById('btn-stop');
const audioPlayback     = document.getElementById('audio-playback');

const dropZone          = document.getElementById('drop-zone');
const fileInput         = document.getElementById('file-input');
const fileNameEl        = document.getElementById('file-name');

const timestampsToggle  = document.getElementById('timestamps-toggle');
const btnTranscribe     = document.getElementById('btn-transcribe');

const progressEl        = document.getElementById('progress');
const progressFill      = document.getElementById('progress-fill');
const progressLabel     = document.getElementById('progress-label');

const resultSection     = document.getElementById('result');
const resultText        = document.getElementById('result-text');
const btnCopy           = document.getElementById('btn-copy');
const btnDownload       = document.getElementById('btn-download');
const btnImprove        = document.getElementById('btn-improve');
const btnClear          = document.getElementById('btn-clear');

const errorBanner       = document.getElementById('error-banner');

// ===== State =====
let audioBlob        = null;
let mediaRecorder    = null;
let recordingStream  = null;
let audioChunks      = [];
let audioCtx         = null;
let analyser         = null;
let animFrameId      = null;
let timerInterval    = null;
let elapsedSecs      = 0;
let chosenMimeType   = '';
let activeTab        = 'record';

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  checkBrowserSupport();
  setupEventListeners();
});

// ===== Settings =====
function loadSettings() {
  inputLocalUrl.value   = localStorage.getItem(STORAGE_KEY_URL)   || DEFAULT_URL;
  inputLocalModel.value = localStorage.getItem(STORAGE_KEY_MODEL) || DEFAULT_MODEL;
  inputApiKey.value     = localStorage.getItem(STORAGE_KEY_KEY)   || '';
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY_URL,   inputLocalUrl.value.trim()   || DEFAULT_URL);
  localStorage.setItem(STORAGE_KEY_MODEL, inputLocalModel.value.trim() || DEFAULT_MODEL);
  localStorage.setItem(STORAGE_KEY_KEY,   inputApiKey.value.trim());
  settingsPanel.hidden = true;
  showToast('Inställningar sparade');
}

// ===== Event Listeners =====
function setupEventListeners() {
  // Settings
  btnSettings.addEventListener('click', () => {
    settingsPanel.hidden = !settingsPanel.hidden;
  });
  btnSaveSettings.addEventListener('click', saveSettings);
  btnCloseSettings.addEventListener('click', () => { settingsPanel.hidden = true; });
  btnToggleKey.addEventListener('click', () => {
    const show = inputApiKey.type === 'password';
    inputApiKey.type = show ? 'text' : 'password';
    btnToggleKey.textContent = show ? 'Dölj' : 'Visa';
  });

  // Tabs
  tabRecordBtn.addEventListener('click', () => switchTab('record'));
  tabUploadBtn.addEventListener('click', () => switchTab('upload'));

  // Recording
  btnRecord.addEventListener('click', startRecording);
  btnStop.addEventListener('click', stopRecording);

  // Upload
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
  });

  // Transcribe & result actions
  btnTranscribe.addEventListener('click', handleTranscribe);
  btnImprove.addEventListener('click', handleImprove);
  btnCopy.addEventListener('click', copyResult);
  btnDownload.addEventListener('click', downloadResult);
  btnClear.addEventListener('click', resetAll);
}

// ===== Tab Switching =====
function switchTab(tab) {
  activeTab = tab;
  const isRecord = tab === 'record';
  tabRecordBtn.classList.toggle('active', isRecord);
  tabUploadBtn.classList.toggle('active', !isRecord);
  tabRecordBtn.setAttribute('aria-selected', isRecord);
  tabUploadBtn.setAttribute('aria-selected', !isRecord);
  tabRecord.hidden = !isRecord;
  tabUpload.hidden = isRecord;

  // Reset audio when switching
  audioBlob = null;
  updateTranscribeButton();
  hideError();
}

// ===== Browser Support Check =====
function checkBrowserSupport() {
  if (!navigator.mediaDevices || !window.MediaRecorder) {
    btnRecord.disabled = true;
    btnRecord.title = 'Din webbläsare stöder inte inspelning';
    tabRecordBtn.title = 'Ej stödd i denna webbläsare — använd Ladda upp';
  }
}

// ===== Recording =====
async function startRecording() {
  hideError();
  try {
    recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    if (err.name === 'NotAllowedError') {
      showError('Mikrofonåtkomst nekad. Tillåt mikrofon i webbläsarens inställningar och försök igen.');
    } else {
      showError('Kunde inte öppna mikrofonen: ' + err.message);
    }
    return;
  }

  // Choose best MIME type
  const mimeTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  chosenMimeType = mimeTypes.find(t => MediaRecorder.isTypeSupported(t)) || '';

  audioChunks = [];
  audioBlob = null;
  mediaRecorder = new MediaRecorder(recordingStream, chosenMimeType ? { mimeType: chosenMimeType } : {});
  mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
  mediaRecorder.onstop = onRecordingStop;
  mediaRecorder.start(1000);

  // UI
  btnRecord.classList.add('recording');
  btnRecord.disabled = true;
  btnStop.disabled = false;
  timerEl.classList.add('recording');
  elapsedSecs = 0;
  updateTimer();
  timerInterval = setInterval(() => { elapsedSecs++; updateTimer(); }, 1000);

  // Waveform
  startWaveform(recordingStream);
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  recordingStream?.getTracks().forEach(t => t.stop());
  clearInterval(timerInterval);
  stopWaveform();

  btnRecord.classList.remove('recording');
  btnRecord.disabled = false;
  btnStop.disabled = true;
  timerEl.classList.remove('recording');
}

function onRecordingStop() {
  const mimeType = chosenMimeType || mediaRecorder.mimeType || 'audio/webm';
  audioBlob = new Blob(audioChunks, { type: mimeType });
  const url = URL.createObjectURL(audioBlob);
  audioPlayback.src = url;
  audioPlayback.hidden = false;
  updateTranscribeButton();
}

// ===== Waveform =====
function startWaveform(stream) {
  audioCtx = new AudioContext();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 1024;
  const source = audioCtx.createMediaStreamSource(stream);
  source.connect(analyser);

  const ctx = waveCanvas.getContext('2d');
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  // Make canvas sharp on high-DPI displays
  const dpr = window.devicePixelRatio || 1;
  const rect = waveCanvas.getBoundingClientRect();
  waveCanvas.width  = (rect.width  || 600) * dpr;
  waveCanvas.height = (rect.height || 72)  * dpr;
  ctx.scale(dpr, dpr);

  function draw() {
    animFrameId = requestAnimationFrame(draw);
    analyser.getByteTimeDomainData(dataArray);

    const w = waveCanvas.width  / dpr;
    const h = waveCanvas.height / dpr;

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--wave-bg').trim() || '#f0f2f5';
    ctx.fillRect(0, 0, w, h);

    ctx.lineWidth = 2;
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--wave-stroke').trim() || '#2563eb';
    ctx.beginPath();

    const sliceWidth = w / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * h) / 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.lineTo(w, h / 2);
    ctx.stroke();
  }
  draw();
}

function stopWaveform() {
  if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
  if (audioCtx)    { audioCtx.close(); audioCtx = null; }
  // Draw flat line
  const ctx = waveCanvas.getContext('2d');
  const w = waveCanvas.width  / (window.devicePixelRatio || 1);
  const h = waveCanvas.height / (window.devicePixelRatio || 1);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--wave-bg').trim() || '#f0f2f5';
  ctx.fillRect(0, 0, w, h);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#e5e7eb';
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();
}

// ===== Timer =====
function updateTimer() {
  const m = String(Math.floor(elapsedSecs / 60)).padStart(2, '0');
  const s = String(elapsedSecs % 60).padStart(2, '0');
  timerEl.textContent = `${m}:${s}`;
}

// ===== File Upload =====
function handleFile(file) {
  if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
    showError('Ogiltigt filformat. Välj en ljud- eller videofil (mp3, wav, mp4, m4a, webm, ogg, etc.).');
    return;
  }
  audioBlob = file;
  const sizeStr = file.size > 1024 * 1024
    ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
    : (file.size / 1024).toFixed(0) + ' KB';
  fileNameEl.textContent = `${file.name} (${sizeStr})`;
  fileNameEl.className = 'has-file';
  hideError();
  updateTranscribeButton();
}

// ===== Transcribe Button State =====
function updateTranscribeButton() {
  btnTranscribe.disabled = !audioBlob;
}

// ===== Core Transcription =====
async function transcribeBlob(blob, endpoint, apiKey, model) {
  const ext  = mimeToExt(blob.type || (blob instanceof File ? blob.name.split('.').pop() : 'webm'));
  const name = blob instanceof File ? blob.name : `audio.${ext}`;

  const formData = new FormData();
  formData.append('file', blob, name);
  formData.append('model', model);
  formData.append('response_format', timestampsToggle.checked ? 'verbose_json' : 'text');
  // No language field — auto-detect handles code-switching best

  const headers = {};
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  const res = await fetch(`${endpoint}/v1/audio/transcriptions`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      msg = err.error?.message || msg;
    } catch (_) {}
    throw Object.assign(new Error(msg), { status: res.status });
  }

  if (timestampsToggle.checked) {
    const data = await res.json();
    return formatTimestamps(data.segments || []);
  }
  return res.text();
}

async function transcribeInChunks(blob, endpoint, apiKey, model) {
  const totalChunks = Math.ceil(blob.size / MAX_CHUNK_BYTES);
  const results = [];

  for (let i = 0; i < totalChunks; i++) {
    const start  = i * MAX_CHUNK_BYTES;
    const chunk  = blob.slice(start, start + MAX_CHUNK_BYTES, blob.type);
    const pct    = Math.round((i / totalChunks) * 90);
    setProgress(pct, `Transkriberar del ${i + 1} av ${totalChunks}…`);
    const text = await transcribeBlob(chunk, endpoint, apiKey, model);
    results.push(text.trim());
  }

  return results.join(' ');
}

// ===== Handle Transcribe (local) =====
async function handleTranscribe() {
  if (!audioBlob) return;

  const localUrl   = localStorage.getItem(STORAGE_KEY_URL)   || DEFAULT_URL;
  const localModel = localStorage.getItem(STORAGE_KEY_MODEL) || DEFAULT_MODEL;

  hideError();
  setTranscribing(true);
  showProgress();

  try {
    let text;
    if (audioBlob.size > MAX_CHUNK_BYTES) {
      text = await transcribeInChunks(audioBlob, localUrl, null, localModel);
    } else {
      setProgress(null, 'Transkriberar…'); // indeterminate
      text = await transcribeBlob(audioBlob, localUrl, null, localModel);
    }
    setProgress(100, 'Klar!');
    await delay(400);
    showResult(text);
  } catch (err) {
    hideProgress();
    showError(localErrorMessage(err, localUrl));
  } finally {
    setTranscribing(false);
  }
}

// ===== Handle Improve (OpenAI) =====
async function handleImprove() {
  if (!audioBlob) return;

  const apiKey = localStorage.getItem(STORAGE_KEY_KEY) || '';
  if (!apiKey) {
    showError('Ingen OpenAI API-nyckel inställd. Klicka på kugghjulet uppe till höger och lägg till din nyckel.');
    return;
  }

  hideError();
  setImproving(true);
  showProgress();

  try {
    let text;
    if (audioBlob.size > MAX_CHUNK_BYTES) {
      text = await transcribeInChunks(audioBlob, OPENAI_ENDPOINT, apiKey, OPENAI_MODEL);
    } else {
      setProgress(null, 'Förbättrar med AI…');
      text = await transcribeBlob(audioBlob, OPENAI_ENDPOINT, apiKey, OPENAI_MODEL);
    }
    setProgress(100, 'Klar!');
    await delay(400);
    showResult(text);
  } catch (err) {
    hideProgress();
    showError(openAiErrorMessage(err));
  } finally {
    setImproving(false);
  }
}

// ===== Error Message Helpers =====
function localErrorMessage(err, localUrl) {
  if (!navigator.onLine) return 'Ingen internetuppkoppling. Kontrollera ditt nätverk.';
  if (err.message.includes('fetch') || err.message.includes('Failed') || err.message.includes('NetworkError') || err.message.includes('CORS')) {
    return `Kunde inte nå den lokala servern på ${localUrl}.\n\nKontrollera att faster-whisper-server är igång:\n\npip install faster-whisper-server\nuvicorn faster_whisper_server.main:app`;
  }
  return `Fel vid transkribering: ${err.message}`;
}

function openAiErrorMessage(err) {
  if (!navigator.onLine) return 'Ingen internetuppkoppling. Kontrollera ditt nätverk.';
  if (err.status === 401) return 'Ogiltig API-nyckel. Kontrollera din nyckel i inställningarna.';
  if (err.status === 429) return 'För många förfrågningar. Vänta en stund och försök igen.';
  if (err.status === 413) return 'Filen är för stor för ett anrop. Testa med en kortare inspelning.';
  return `OpenAI-fel: ${err.message}`;
}

// ===== UI State Helpers =====
function setTranscribing(active) {
  btnTranscribe.disabled = active;
  btnTranscribe.classList.toggle('loading', active);
  btnTranscribe.textContent = active ? 'Transkriberar…' : 'Transkribera';
}

function setImproving(active) {
  btnImprove.disabled = active;
  btnImprove.classList.toggle('loading', active);
}

function showProgress() {
  progressEl.hidden = false;
  resultSection.hidden = true;
}

function hideProgress() {
  progressEl.hidden = true;
}

function setProgress(pct, label) {
  if (pct === null) {
    progressFill.className = 'indeterminate';
    progressFill.style.width = '';
  } else {
    progressFill.className = '';
    progressFill.style.width = pct + '%';
  }
  progressLabel.textContent = label || '';
}

function showResult(text) {
  hideProgress();
  resultText.value = text;
  resultSection.hidden = false;
  resultText.scrollTop = 0;
  btnImprove.disabled = false;
}

function resetAll() {
  audioBlob = null;
  audioChunks = [];
  audioPlayback.hidden = true;
  audioPlayback.src = '';
  fileNameEl.textContent = '';
  fileNameEl.className = '';
  fileInput.value = '';
  resultSection.hidden = true;
  resultText.value = '';
  progressEl.hidden = true;
  timerEl.textContent = '00:00';
  hideError();
  updateTranscribeButton();
  switchTab('record');
}

// ===== Result Actions =====
async function copyResult() {
  const text = resultText.value;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    const orig = btnCopy.innerHTML;
    btnCopy.textContent = 'Kopierat!';
    setTimeout(() => { btnCopy.innerHTML = orig; }, 2000);
  } catch (_) {
    resultText.select();
    document.execCommand('copy');
  }
}

function downloadResult() {
  const text = resultText.value;
  if (!text) return;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `transkription-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ===== Error Banner =====
let errorTimeout;
function showError(msg) {
  errorBanner.textContent = msg;
  errorBanner.hidden = false;
  clearTimeout(errorTimeout);
  errorTimeout = setTimeout(hideError, 10000);
}
function hideError() {
  errorBanner.hidden = true;
  clearTimeout(errorTimeout);
}

// ===== Toast =====
let toastEl;
function showToast(msg) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2200);
}

// ===== Timestamp Formatting =====
function formatTimestamps(segments) {
  return segments.map(s => {
    const t = formatTime(s.start ?? 0);
    return `[${t}] ${(s.text || '').trim()}`;
  }).join('\n');
}

function formatTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// ===== MIME → Extension =====
function mimeToExt(mime) {
  const map = {
    'audio/webm':            'webm',
    'audio/webm;codecs=opus':'webm',
    'audio/ogg':             'ogg',
    'audio/ogg;codecs=opus': 'ogg',
    'audio/mp4':             'mp4',
    'audio/mpeg':            'mp3',
    'audio/wav':             'wav',
    'audio/x-wav':           'wav',
    'audio/flac':            'flac',
    'audio/x-m4a':           'm4a',
    'video/mp4':             'mp4',
    'video/webm':            'webm',
    'video/quicktime':       'mov',
  };
  // Handle "audio/webm; codecs=opus" with spaces
  const base = mime.split(';')[0].trim().toLowerCase();
  return map[mime.toLowerCase()] || map[base] || 'webm';
}

// ===== Utility =====
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
