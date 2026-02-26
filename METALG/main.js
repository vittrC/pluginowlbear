// ═══════════════════════════════════════════════════════════
//  VYPER PESSOAL AGENT SYSTEM — main.js
//  Firebase Firestore backend + full app logic
// ═══════════════════════════════════════════════════════════
//
//  ⚙️  CONFIGURAÇÃO NECESSÁRIA:
//  1. Crie um projeto em https://console.firebase.google.com
//  2. Ative o Firestore Database (modo de teste por enquanto)
//  3. Cole suas credenciais abaixo substituindo os valores
//  4. Mude GM_PASSWORD para a senha do mestre que preferir
//
// ═══════════════════════════════════════════════════════════

import { initializeApp }        from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ──────────────────────────────────────────────────────────
//  ⚙️  CONFIGURAÇÃO FIREBASE — substitua com seus valores
// ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyD5-uC4T9wbaIVZMMG14qU2Z5ad_vDUeDs",
  authDomain: "vypersys.firebaseapp.com",
  projectId: "vypersys",
  storageBucket: "vypersys.firebasestorage.app",
  messagingSenderId: "15989413477",
  appId: "1:15989413477:web:0cc2137f4c5964ceb6988c",
  measurementId: "G-H97W0F0759"
};

// ──────────────────────────────────────────────────────────
//  ⚙️  SENHA DO MESTRE — altere como quiser
// ──────────────────────────────────────────────────────────
const GM_PASSWORD = "FOXHOUND";

// ──────────────────────────────────────────────────────────
//  CONSTANTES DO SISTEMA
// ──────────────────────────────────────────────────────────
const GRADES = ["F", "E", "D", "D+", "C", "C+", "B", "B+", "A", "A+", "A++", "S", "S+"];

const GRADE_CLASS_MAP = {
  "F":   "grade-f",  "E":  "grade-e",  "D":  "grade-d",  "D+": "grade-dp",
  "C":   "grade-c",  "C+": "grade-cp", "B":  "grade-b",  "B+": "grade-bp",
  "A":   "grade-a",  "A+": "grade-ap", "A++":"grade-app","S":  "grade-s",
  "S+":  "grade-sp"
};

const ATTRS = ["fisico", "intelecto", "reflexos", "resiliencia", "presenca"];

const ATTR_LABELS = {
  fisico: "FÍSICO", intelecto: "INTELECTO",
  reflexos: "REFLEXOS", resiliencia: "RESILIÊNCIA", presenca: "PRESENÇA"
};

const DEFAULT_CHAR = () => ({
  codename:   "",
  nome:       "",
  origem:     "[CONFIDENCIAL]",
  photo:      "",
  statusAtivo:"ativo",    // ativo | inativo | morto
  security:   "seguro",   // seguro | alerta | comprometido
  integrity:  5,
  attrs: {
    fisico:      "D",
    intelecto:   "D",
    reflexos:    "D",
    resiliencia: "D",
    presenca:    "D"
  },
  updatedAt: null
});

// ──────────────────────────────────────────────────────────
//  FIREBASE INIT
// ──────────────────────────────────────────────────────────
let db = null;
let firebaseOk = false;

try {
  const app = initializeApp(firebaseConfig);
  db      = getFirestore(app);
  firebaseOk = true;
} catch (e) {
  console.warn("Firebase não configurado. Usando modo local (localStorage).", e);
}

// ──────────────────────────────────────────────────────────
//  LOCAL STORAGE FALLBACK
// ──────────────────────────────────────────────────────────
const LS_PREFIX = "vyper_";

const LocalDB = {
  getChar(codename) {
    const raw = localStorage.getItem(LS_PREFIX + codename.toUpperCase());
    return raw ? JSON.parse(raw) : null;
  },
  setChar(codename, data) {
    localStorage.setItem(LS_PREFIX + codename.toUpperCase(), JSON.stringify(data));
  },
  getAllChars() {
    const chars = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(LS_PREFIX)) {
        try { chars.push(JSON.parse(localStorage.getItem(key))); } catch {}
      }
    }
    return chars;
  }
};

// ──────────────────────────────────────────────────────────
//  APP STATE
// ──────────────────────────────────────────────────────────
let state = {
  role: null,           // 'player' | 'gm'
  codename: null,
  character: null,
  unsubscribe: null,    // Firestore listener cleanup
  currentTab: 'main',
  editingAttr: null,
  gmCharsUnsub: null
};

// ──────────────────────────────────────────────────────────
//  UI HELPERS
// ──────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.add('hidden');
    s.classList.remove('active');
  });
  const screen = $(id);
  screen.classList.remove('hidden');
  screen.classList.add('active');
}

function showToast(msg, type = 'info', duration = 2500) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast ' + type;
  t.classList.remove('hidden');
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => t.classList.add('hidden'), duration);
}

function showError(elemId, msg) {
  const el = $(elemId);
  el.textContent = '⚠ ' + msg;
  el.classList.remove('hidden');
  el.style.animation = 'none';
  requestAnimationFrame(() => { el.style.animation = ''; });
  setTimeout(() => el.classList.add('hidden'), 4000);
}

// ──────────────────────────────────────────────────────────
//  BOOT SEQUENCE
// ──────────────────────────────────────────────────────────
const bootMessages = [
  { text: "CARREGANDO KERNEL DE SEGURANÇA...",        ms: 200, ok: true },
  { text: "INICIALIZANDO PROTOCOLO DE CRIPTOGRAFIA...",ms: 400, ok: true },
  { text: "VERIFICANDO ASSINATURA DE ACESSO...",       ms: 350, ok: true },
  { text: "AUTENTICANDO CERTIFICADO VYPER...",          ms: 500, ok: true },
  { text: "MONTANDO SISTEMA DE ARQUIVOS PROTEGIDOS...", ms: 300, ok: true },
  { text: "CARREGANDO BANCO DE DADOS DE AGENTES...",    ms: 600, ok: true },
  { text: "CONEXÃO COM SERVIDOR CENTRAL ESTABELECIDA.",ms: 200, ok: true },
  { text: "PRONTO.",                                    ms: 100, ok: true }
];

async function runBoot() {
  const linesEl = $('boot-lines');
  const barEl   = $('boot-bar');
  linesEl.innerHTML = '';

  let elapsed = 0;
  const totalMs = bootMessages.reduce((s, m) => s + m.ms, 0);

  for (let i = 0; i < bootMessages.length; i++) {
    const m = bootMessages[i];
    await sleep(m.ms);
    elapsed += m.ms;

    const line = document.createElement('div');
    line.className = 'boot-line' + (m.ok ? ' ok' : ' error');
    line.textContent = (m.ok ? '[ OK ] ' : '[ERR] ') + m.text;
    linesEl.appendChild(line);
    linesEl.scrollTop = linesEl.scrollHeight;

    barEl.style.width = Math.round((elapsed / totalMs) * 100) + '%';
  }

  await sleep(400);
  showScreen('screen-login');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ──────────────────────────────────────────────────────────
//  ROLE SELECTION
// ──────────────────────────────────────────────────────────
function selectRole(role) {
  // Visual selection
  $('btn-player').classList.toggle('selected', role === 'player');
  $('btn-gm').classList.toggle('selected', role === 'gm');

  $('login-player').classList.add('hidden');
  $('login-gm').classList.add('hidden');
  $('login-error-player').classList.add('hidden');
  $('login-error-gm').classList.add('hidden');

  if (role === 'player') {
    $('login-player').classList.remove('hidden');
    setTimeout(() => $('input-codename').focus(), 100);
  } else {
    $('login-gm').classList.remove('hidden');
    setTimeout(() => $('input-gm-pass').focus(), 100);
  }
}

// ──────────────────────────────────────────────────────────
//  PLAYER LOGIN
// ──────────────────────────────────────────────────────────
async function loginPlayer() {
  const codename = $('input-codename').value.trim().toUpperCase();
  if (!codename || codename.length < 2) {
    showError('login-error-player', 'Insira um codinome válido (mínimo 2 caracteres).');
    return;
  }

  let charData;

  if (firebaseOk) {
    try {
      const ref = doc(db, 'characters', codename);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        charData = snap.data();
      } else {
        // Create new character
        charData = DEFAULT_CHAR();
        charData.codename = codename;
        charData.updatedAt = serverTimestamp();
        await setDoc(ref, charData);
        charData.updatedAt = new Date();
      }
    } catch (e) {
      console.error(e);
      showError('login-error-player', 'Erro ao conectar. Verifique o Firebase e tente novamente.');
      return;
    }
  } else {
    // Local mode
    charData = LocalDB.getChar(codename);
    if (!charData) {
      charData = DEFAULT_CHAR();
      charData.codename = codename;
      LocalDB.setChar(codename, charData);
    }
    showToast('⚠ MODO LOCAL — sem sincronização em tempo real', 'error', 5000);
  }

  state.role     = 'player';
  state.codename = codename;
  state.character = charData;

  renderSheet(charData);
  showScreen('screen-sheet');

  // Realtime listener
  if (firebaseOk) {
    if (state.unsubscribe) state.unsubscribe();
    state.unsubscribe = onSnapshot(doc(db, 'characters', codename), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const old  = state.character;
      state.character = data;

      // Update only GM-controlled fields to avoid disrupting player edits
      updateSecurityDisplay(data.security);
      updateIntegrityDisplay(data.integrity);
      updateStatusAtivoDisplay(data.statusAtivo);

      // Notify player if status changed
      if (old && old.security !== data.security) {
        triggerStatusChangeEffect(data.security);
      }

      // Refresh fitas tab if open
      if (state.currentTab === 'fitas') renderFitasTab();
      // Refresh radio tab if open
      if (state.currentTab === 'radio') renderRadioTab();
    });
  }
}

// ──────────────────────────────────────────────────────────
//  GM LOGIN
// ──────────────────────────────────────────────────────────
async function loginGM() {
  const pass = $('input-gm-pass').value.trim();
  if (pass !== GM_PASSWORD) {
    showError('login-error-gm', 'Código de acesso inválido.');
    $('input-gm-pass').value = '';
    $('input-gm-pass').focus();
    return;
  }

  state.role = 'gm';
  showScreen('screen-gm');
  loadGMDashboard();
}

// ──────────────────────────────────────────────────────────
//  LOGOUT
// ──────────────────────────────────────────────────────────
function logout() {
  if (state.unsubscribe)    state.unsubscribe();
  if (state.gmCharsUnsub)   state.gmCharsUnsub();
  state = {
    role: null, codename: null, character: null,
    unsubscribe: null, currentTab: 'main',
    editingAttr: null, gmCharsUnsub: null
  };
  // Reset login form
  $('input-codename').value = '';
  $('input-gm-pass').value  = '';
  $('login-player').classList.add('hidden');
  $('login-gm').classList.add('hidden');
  $('btn-player').classList.remove('selected');
  $('btn-gm').classList.remove('selected');
  showScreen('screen-login');
}

// ──────────────────────────────────────────────────────────
//  CHARACTER SHEET RENDER
// ──────────────────────────────────────────────────────────
function renderSheet(data) {
  // Photo
  const photoEl = $('agent-photo');
  if (data.photo) {
    photoEl.src = data.photo;
    const ph1 = $('photo-frame').querySelector('.photo-ph'); if (ph1) ph1.style.display = 'none';
  } else {
    photoEl.src = '';
  }

  // Registro
  setDisplayValue('nome',   data.nome   || data.codename);
  setDisplayValue('origem', data.origem || '[CONFIDENCIAL]');
  updateStatusAtivoDisplay(data.statusAtivo || 'ativo');

  // Attributes
  ATTRS.forEach(a => {
    const grade = (data.attrs && data.attrs[a]) ? data.attrs[a] : 'D';
    setAttrGrade(a, grade);
  });

  // Integrity
  updateIntegrityDisplay(data.integrity ?? 5);

  // Security
  updateSecurityDisplay(data.security || 'seguro');

  // Reset to main tab
  switchTab('main');
}

function setDisplayValue(field, val) {
  const el = $('display-' + field);
  if (el) el.textContent = val || '—';
}

function setAttrGrade(attr, grade) {
  const gradeEl = $('grade-' + attr);
  if (!gradeEl) return;
  gradeEl.textContent = grade;
  // Remove all grade classes then add correct one
  gradeEl.className = 'attr-grade';
  const cls = GRADE_CLASS_MAP[grade];
  if (cls) gradeEl.classList.add(cls);
}

function updateSecurityDisplay(security) {
  const badge = $('security-display');
  const text  = $('security-text');
  badge.className = 'sec-badge ' + (security || 'seguro');
  const labels = { seguro: 'SEGURO', alerta: 'ALERTA', comprometido: 'COMPROMETIDO', inativo: 'INATIVO' };
  text.textContent = labels[security] || 'SEGURO';
}

function updateIntegrityDisplay(integrity) {
  const val     = typeof integrity === 'number' ? integrity : 5;
  const bars    = document.querySelectorAll('#integrity-bars .integrity-bar');
  const countEl = $('integrity-count');
  const section = document.getElementById('integrity-bars');

  bars.forEach((bar, i) => {
    bar.classList.toggle('active', i < val);
  });
  if (countEl) countEl.textContent = val + '/5';

  // Visual warning levels
  if (section) {
    section.classList.remove('warn-low', 'warn-crit');
    if (val <= 1) section.classList.add('warn-crit');
    else if (val <= 2) section.classList.add('warn-low');
  }
}

function updateStatusAtivoDisplay(status) {
  const el   = $('display-status-ativo');
  const labels = { ativo: 'ATIVO', inativo: 'INATIVO', morto: 'K.I.A.' };
  const colors = { ativo: '#00e040', inativo: '#888', morto: '#cc0000' };
  if (el) {
    el.textContent = labels[status] || 'ATIVO';
    el.style.color = colors[status] || '#e0e0e0';
  }
}

function triggerStatusChangeEffect(newSecurity) {
  const badge = $('security-display');
  badge.classList.remove('status-changed');
  requestAnimationFrame(() => badge.classList.add('status-changed'));

  const alerts = {
    seguro:       '🟢 STATUS: SEGURO',
    alerta:       '⚠ ALERTA — possível ameaça detectada!',
    comprometido: '🔴 COMPROMETIDO — identidade exposta!'
  };
  showToast(alerts[newSecurity] || '', newSecurity === 'seguro' ? 'success' : 'error', 4000);
}

// ──────────────────────────────────────────────────────────
//  PLAYER EDIT FUNCTIONS
// ──────────────────────────────────────────────────────────
function toggleEdit(field) {
  const display = $('display-' + field);
  const input   = $('edit-'    + field);
  if (!display || !input) return;

  const isEditing = !input.classList.contains('hidden');
  if (isEditing) {
    saveField(field);
    return;
  }
  input.value = state.character ? (state.character[field] || '') : '';
  display.classList.add('hidden');
  input.classList.remove('hidden');
  input.focus();
  input.select();
}

async function saveField(field) {
  const display = $('display-' + field);
  const input   = $('edit-'    + field);
  if (!display || !input) return;

  const val = input.value.trim();
  display.textContent = val || '—';
  display.classList.remove('hidden');
  input.classList.add('hidden');

  if (!state.character) return;
  state.character[field] = val;

  await persistChar({ [field]: val });
}

function cycleAttr(attr) {
  // Instead of cycling, show the modal selector
  openGradeModal(attr);
}

function openGradeModal(attr) {
  state.editingAttr = attr;
  const title = $('grade-modal-title');
  const opts  = $('grade-modal-options');

  title.textContent = '► ' + (ATTR_LABELS[attr] || attr.toUpperCase());
  opts.innerHTML = '';

  const current = state.character?.attrs?.[attr] || 'D';

  GRADES.forEach(grade => {
    const btn = document.createElement('button');
    btn.className = 'grade-opt-btn' + (grade === current ? ' current' : '');
    btn.textContent = grade;
    btn.onclick = () => selectGrade(attr, grade);
    opts.appendChild(btn);
  });

  $('grade-modal').classList.remove('hidden');
}

async function selectGrade(attr, grade) {
  closeGradeModal();
  setAttrGrade(attr, grade);

  if (!state.character) return;
  if (!state.character.attrs) state.character.attrs = {};
  state.character.attrs[attr] = grade;

  await persistChar({ [`attrs.${attr}`]: grade });
}

function closeGradeModal(event) {
  if (event && event.target !== $('grade-modal')) return;
  $('grade-modal').classList.add('hidden');
  state.editingAttr = null;
}

async function toggleIntegrity(index) {
  if (!state.character && state.role !== 'player') return;

  const current = state.character?.integrity ?? 5;
  // Clicking a bar sets integrity to index+1 if it was off, or index if it was on (last active)
  let newVal;
  if (index < current) {
    // Clicking an active bar — set integrity to index (turn off from here down)
    newVal = index;
  } else {
    // Clicking an inactive bar — set integrity to index+1
    newVal = index + 1;
  }
  newVal = Math.max(0, Math.min(5, newVal));

  if (state.character) state.character.integrity = newVal;
  updateIntegrityDisplay(newVal);

  await persistChar({ integrity: newVal });
}

// ──────────────────────────────────────────────────────────
//  PHOTO UPLOAD
// ──────────────────────────────────────────────────────────
function editPhoto() {
  $('photo-input').click();
}

function handlePhotoUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = async () => {
      // Compress: resize to max 240x240, JPEG quality 0.65
      const canvas = document.createElement('canvas');
      const MAX = 240;
      let w = img.width, h = img.height;
      if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
      else        { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const base64 = canvas.toDataURL('image/jpeg', 0.65);

      // Display
      const photoEl = $('agent-photo');
      photoEl.src = base64;
      const ph2 = $('photo-frame').querySelector('.photo-ph'); if (ph2) ph2.style.display = 'none';

      if (state.character) state.character.photo = base64;
      await persistChar({ photo: base64 });
      showToast('Foto do agente atualizada.', 'success');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}

// ──────────────────────────────────────────────────────────
//  TAB NAVIGATION
// ──────────────────────────────────────────────────────────
function switchTab(tab) {
  state.currentTab = tab;

  // Update nav indicators
  document.querySelectorAll('.nav-tab').forEach(el => {
    el.classList.toggle('active', el.id === 'nav-' + tab);
  });

  const tabContent = $('tab-content');

  if (tab === 'main') {
    tabContent.classList.add('hidden');
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  } else {
    tabContent.classList.remove('hidden');
    document.querySelectorAll('.tab-panel').forEach(p => {
      p.classList.toggle('hidden', p.id !== 'tab-panel-' + tab);
    });
    if (tab === 'fitas') renderFitasTab();
    if (tab === 'radio') renderRadioTab();
    if (tab === 'mald')  { loadMaldicoes().then(renderMaldicoesTab); }
  }
}

// ──────────────────────────────────────────────────────────
//  RÁDIO — PLAYER
// ──────────────────────────────────────────────────────────
const RADIO_FREQS = ['00.221', '00.425', '00.614', '00.733', '00.881', '00.963'];

function renderRadioTab() {
  const char = state.character;
  if (!char) return;
  const radio  = char.radio || {};
  const status = radio.status || 'idle';
  const freq   = radio.frequencia || RADIO_FREQS[0];

  // Player photo
  const pPhoto = $('radio-player-photo');
  const pPh    = $('radio-player-ph');
  if (char.photo) { pPhoto.src = char.photo; pPhoto.classList.remove('hidden'); pPh.style.display = 'none'; }
  else            { pPhoto.src = ''; pPhoto.classList.add('hidden'); pPh.style.display = ''; pPh.textContent = '?'; }
  $('radio-player-name').textContent = '\u25b6 ' + (char.codename || '—');

  // Frequency display
  $('radio-freq-val').textContent = freq;

  // NPC photo
  const nPhoto = $('radio-npc-photo');
  const nPh    = $('radio-npc-ph');
  if (status === 'conectado' && radio.npcFoto) {
    nPhoto.src = radio.npcFoto; nPhoto.classList.remove('hidden'); nPh.style.display = 'none';
  } else {
    nPhoto.src = ''; nPhoto.classList.add('hidden'); nPh.style.display = '';
    nPh.textContent = status === 'aguardando' ? '...' : '?';
  }
  $('radio-npc-name').textContent = status === 'conectado' ? '\u25b6 ' + (radio.npcNome || '—') : '—';

  // Waveform
  const waveSvg = $('radio-wave-svg');
  if (waveSvg) waveSvg.classList.toggle('radio-wave-active', status === 'conectado');

  // Status badge
  const badge = $('radio-status-badge');
  const labels = { idle: 'OCIOSO', aguardando: 'AGUARDANDO', conectado: 'CONECTADO', recusado: 'RECUSADO' };
  badge.textContent = labels[status] || 'OCIOSO';
  badge.className   = 'radio-status-badge radio-status-' + status;

  // Action buttons
  const acts = $('radio-actions');
  if (status === 'idle' || status === 'recusado') {
    acts.innerHTML = '<button class="radio-btn" onclick="App.radioSolicitar()">SOLICITAR CONEXÃO</button>';
  } else if (status === 'aguardando') {
    acts.innerHTML = '<button class="radio-btn radio-btn-cancel" onclick="App.radioCancelar()">CANCELAR</button>';
  } else if (status === 'conectado') {
    acts.innerHTML = '<button class="radio-btn radio-btn-cancel" onclick="App.radioCancelar()">ENCERRAR</button>';
  }
}

function radioChangeFreq(dir) {
  const char = state.character;
  if (!char) return;
  const radio  = char.radio || {};
  if ((radio.status || 'idle') === 'conectado') return;
  let idx = RADIO_FREQS.indexOf(radio.frequencia || RADIO_FREQS[0]);
  if (idx === -1) idx = 0;
  idx = (idx + dir + RADIO_FREQS.length) % RADIO_FREQS.length;
  const freq = RADIO_FREQS[idx];
  if (!char.radio) char.radio = {};
  char.radio.frequencia = freq;
  if ($('radio-freq-val')) $('radio-freq-val').textContent = freq;
  persistChar({ 'radio.frequencia': freq });
}

const radioCodecAudio = new Audio('codec.mp3');

async function radioSolicitar() {
  const char = state.character;
  if (!char) return;
  radioCodecAudio.currentTime = 0;
  radioCodecAudio.play().catch(() => {});
  if (!char.radio) char.radio = {};
  char.radio.status = 'aguardando';
  await persistChar({ 'radio.status': 'aguardando' });
  renderRadioTab();
}

async function radioCancelar() {
  const char = state.character;
  if (!char) return;
  if (!char.radio) char.radio = {};
  Object.assign(char.radio, { status: 'idle', npcNome: '', npcFoto: '' });
  await persistChar({ 'radio.status': 'idle', 'radio.npcNome': '', 'radio.npcFoto': '' });
  renderRadioTab();
}

// ──────────────────────────────────────────────────────────
//  RÁDIO — GM CONTROLS
// ──────────────────────────────────────────────────────────
let npcPresets = [];

async function loadNpcPresets() {
  if (firebaseOk) {
    try {
      const snap = await getDoc(doc(db, 'meta', 'npcs'));
      npcPresets = snap.exists() ? (snap.data().presets || []) : [];
    } catch (e) { npcPresets = []; }
  } else {
    const raw = localStorage.getItem('vyper_npc_presets');
    npcPresets = raw ? JSON.parse(raw) : [];
  }
  renderGMNpcPresets();
}

async function saveNpcPresets() {
  if (firebaseOk) {
    await setDoc(doc(db, 'meta', 'npcs'), { presets: npcPresets });
  } else {
    localStorage.setItem('vyper_npc_presets', JSON.stringify(npcPresets));
  }
}

function renderGMNpcPresets() {
  const el = $('gm-npc-list');
  if (!el) return;
  if (!npcPresets.length) { el.innerHTML = '<div class="gm-fitas-empty">Nenhum preset.</div>'; return; }
  el.innerHTML = npcPresets.map((p, i) =>
    `<div class="gm-npc-item">
      ${p.foto ? `<img class="gm-npc-thumb" src="${p.foto}" />` : '<div class="gm-npc-thumb-ph">?</div>'}
      <span class="gm-npc-nome">${escHtml(p.nome)}</span>
      <button class="gm-fita-del" onclick="App.gmRemoveNpcPreset(${i})">&#10005;</button>
    </div>`
  ).join('');
}

async function gmAddNpcPreset(fileInput) {
  const file      = fileInput.files?.[0];
  const nomeInput = $('gm-npc-nome-input');
  const nome      = nomeInput?.value?.trim();
  if (!nome) { showToast('Digite o nome do NPC.', 'error'); fileInput.value = ''; return; }
  if (!file) { showToast('Selecione uma foto.', 'error'); return; }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const MAX = 200; let w = img.width, h = img.height;
      if (w > h) { if (w > MAX) { h = Math.round(h*MAX/w); w = MAX; } }
      else       { if (h > MAX) { w = Math.round(w*MAX/h); h = MAX; } }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const foto = canvas.toDataURL('image/jpeg', 0.7);
      npcPresets.push({ nome, foto });
      await saveNpcPresets();
      nomeInput.value = ''; fileInput.value = '';
      renderGMNpcPresets();
      showToast(`NPC "${nome}" adicionado.`, 'success');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function gmRemoveNpcPreset(index) {
  npcPresets.splice(index, 1);
  await saveNpcPresets();
  renderGMNpcPresets();
}

async function gmRadioAceitar(codename) {
  const sel = document.getElementById('gm-radio-npc-sel-' + codename);
  const idx = sel ? parseInt(sel.value) : -1;
  if (isNaN(idx) || idx < 0 || !npcPresets[idx]) { showToast('Selecione um NPC.', 'error'); return; }
  const npc = npcPresets[idx];
  await gmUpdateChar(codename, { 'radio.status': 'conectado', 'radio.npcNome': npc.nome, 'radio.npcFoto': npc.foto });
}

async function gmRadioRecusar(codename) {
  await gmUpdateChar(codename, { 'radio.status': 'recusado' });
  setTimeout(() => gmUpdateChar(codename, { 'radio.status': 'idle' }), 3000);
}

async function gmRadioDesconectar(codename) {
  await gmUpdateChar(codename, { 'radio.status': 'idle', 'radio.npcNome': '', 'radio.npcFoto': '' });
}

// ──────────────────────────────────────────────────────────
//  FITAS — PLAYER
// ──────────────────────────────────────────────────────────
const fitaPlayer = { audio: null, tapeId: null, tapeName: null, loop: false };

function escHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

function formatFitaTime(s) {
  if (!s || isNaN(s)) return '0:00';
  return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
}

function renderFitasTab() {
  const tapes = (state.character && state.character.tapes) || [];
  const tree = $('fitas-tree');
  if (!tree) return;

  if (!tapes.length) {
    tree.innerHTML = '<div class="fitas-empty">Nenhuma fita alocada.</div>';
    return;
  }

  const cats = [['historia','HISTÓRIA'],['musica','MUSICAS'],['outro','OUTROS']];
  const grouped = { historia: [], musica: [], outro: [] };
  tapes.forEach(t => (grouped[t.categoria] || grouped.outro).push(t));

  let html = '';
  for (const [key, label] of cats) {
    if (!grouped[key].length) continue;
    html += `<div class="fita-cat"><div class="fita-cat-header">&#9658; ${label}</div>`;
    grouped[key].forEach(t => {
      const active = fitaPlayer.tapeId === t.id ? 'fita-item-active' : '';
      html += `<div class="fita-item ${active}" onclick="App.playFita('${t.id}','${escHtml(t.nome)}')"><span class="fita-tree-line">&#9492;&#9472;&#9472;</span><span class="fita-item-name">${escHtml(t.nome)}</span></div>`;
    });
    html += `</div>`;
  }
  tree.innerHTML = html;
}

async function playFita(tapeId, tapeName) {
  // Stop existing
  if (fitaPlayer.audio) {
    fitaPlayer.audio.pause();
    fitaPlayer.audio.src = '';
    fitaPlayer.audio = null;
  }
  fitaPlayer.tapeId  = tapeId;
  fitaPlayer.tapeName = tapeName;

  const np  = $('fitas-now-playing');
  const btn = $('fitas-btn-play');
  if (np)  np.textContent  = '▶ CARREGANDO: ' + tapeName;
  if (btn) btn.textContent = '⏸';

  let audioSrc = null;
  if (firebaseOk) {
    try {
      const metaSnap = await getDoc(doc(db, 'tapes', tapeId));
      if (!metaSnap.exists()) { showToast('Fita não encontrada.', 'error'); return; }
      const meta = metaSnap.data();
      if (meta.chunks && meta.chunks > 0) {
        if (np) np.textContent = '▶ CARREGANDO (' + meta.chunks + ' partes)...';
        const chunkDocs = await Promise.all(
          Array.from({ length: meta.chunks }, (_, i) =>
            getDoc(doc(db, 'tapes', `${tapeId}_chunk_${i}`))
          )
        );
        audioSrc = chunkDocs.map(d => d.data().chunk).join('');
      } else {
        audioSrc = meta.data || null; // legado
      }
    } catch (e) { console.error(e); showToast('Erro ao carregar fita.', 'error'); return; }
  } else {
    audioSrc = localStorage.getItem('fita_data_' + tapeId);
  }

  if (!audioSrc) { showToast('Dados da fita não encontrados.', 'error'); return; }

  const audio = new Audio(audioSrc);
  audio.loop  = fitaPlayer.loop;
  fitaPlayer.audio = audio;

  audio.addEventListener('loadedmetadata', () => {
    const dur = $('fitas-time-dur');
    if (dur) dur.textContent = formatFitaTime(audio.duration);
  });
  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct  = audio.currentTime / audio.duration;
    const fill = $('fitas-prog-fill'), knob = $('fitas-prog-knob'), cur = $('fitas-time-cur');
    if (fill) fill.style.width = (pct * 100) + '%';
    if (knob) knob.style.left  = (pct * 100) + '%';
    if (cur)  cur.textContent  = formatFitaTime(audio.currentTime);
  });
  audio.addEventListener('ended', () => {
    if (!fitaPlayer.loop) {
      if (btn) btn.textContent = '▶';
      if (np)  np.textContent  = '■ FIM: ' + tapeName;
    }
  });

  try {
    await audio.play();
  } catch (err) {
    console.error('play() bloqueado:', err);
    showToast('Toque na fita novamente para iniciar.', 'error');
    if (btn) btn.textContent = '▶';
    return;
  }
  if (np)  np.textContent  = '▶ TOCANDO: ' + tapeName;
  renderFitasTab();
}

function fitaTogglePlay() {
  const audio = fitaPlayer.audio;
  if (!audio) return;
  const btn = $('fitas-btn-play');
  if (audio.paused) { audio.play();  if (btn) btn.textContent = '⏸'; }
  else              { audio.pause(); if (btn) btn.textContent = '▶'; }
}

function fitaToggleLoop() {
  fitaPlayer.loop = !fitaPlayer.loop;
  if (fitaPlayer.audio) fitaPlayer.audio.loop = fitaPlayer.loop;
  const btn = $('fitas-btn-loop');
  if (btn) btn.classList.toggle('fita-btn-active', fitaPlayer.loop);
}

function fitaSkip(seconds) {
  const audio = fitaPlayer.audio;
  if (!audio) return;
  audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + seconds);
}

function fitaSeek(event) {
  const audio = fitaPlayer.audio;
  if (!audio || !audio.duration) return;
  const bar  = $('fitas-prog-bar');
  const rect = bar.getBoundingClientRect();
  audio.currentTime = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * audio.duration;
}

// ──────────────────────────────────────────────────────────
//  FITAS — GM CONTROLS
// ──────────────────────────────────────────────────────────
function buildGMRadioHtml(char) {
  const radio     = char.radio || {};
  const status    = radio.status || 'idle';
  const freq      = radio.frequencia || '—';
  const labels    = { idle: 'OCIOSO', aguardando: 'AGUARDANDO', conectado: 'CONECTADO', recusado: 'RECUSADO' };
  let html = `<div class="gm-radio-status gm-radio-${status}">${labels[status] || 'OCIOSO'}</div>`;

  if (status === 'aguardando') {
    const opts = npcPresets.length
      ? npcPresets.map((p, i) => `<option value="${i}">${escHtml(p.nome)}</option>`).join('')
      : '<option value="">Nenhum preset</option>';
    html += `
      <div class="gm-radio-freq">FREQ: ${freq}</div>
      <select id="gm-radio-npc-sel-${char.codename}" class="gm-select">${opts}</select>
      <div class="gm-radio-btns">
        <button class="gm-toggle-btn active-ativo" onclick="App.gmRadioAceitar('${char.codename}')">ACEITAR</button>
        <button class="gm-toggle-btn active-morto" onclick="App.gmRadioRecusar('${char.codename}')">RECUSAR</button>
      </div>`;
  } else if (status === 'conectado') {
    html += `
      <div class="gm-radio-freq">FREQ: ${freq} — ${escHtml(radio.npcNome || '?')}</div>
      <button class="gm-toggle-btn active-morto" onclick="App.gmRadioDesconectar('${char.codename}')">DESCONECTAR</button>`;
  }
  return html;
}

function buildGMFitasListHtml(codename, tapes) {
  if (!tapes || !tapes.length) return '<div class="gm-fitas-empty">Nenhuma fita.</div>';
  const ico = { musica: '&#9835;', historia: '&#9658;', outro: '&#9672;' };
  return tapes.map(t =>
    `<div class="gm-fita-item">
      <span class="gm-fita-cat-tag">${ico[t.categoria] || '&#9672;'}</span>
      <span class="gm-fita-name">${escHtml(t.nome)}</span>
      <button class="gm-fita-del" onclick="App.gmRemoveFita('${codename}','${t.id}')">&#10005;</button>
    </div>`
  ).join('');
}

// tamanho de cada chunk base64 (~700KB por doc Firestore)
const CHUNK_SIZE = 700_000;

async function gmUploadFita(codename, fileInput) {
  const file = fileInput.files?.[0];
  if (!file) return;
  const nomeFld   = document.getElementById('gm-fita-nome-' + codename);
  const catFld    = document.getElementById('gm-fita-cat-'  + codename);
  const nome      = nomeFld?.value?.trim();
  const categoria = catFld?.value || 'musica';
  if (!nome) { showToast('Digite o nome da fita.', 'error'); fileInput.value = ''; return; }

  const id = 'fita_' + codename + '_' + Date.now();

  showToast('Lendo arquivo...', 'info');
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result; // data:audio/...;base64,...

    if (firebaseOk) {
      // Divide em chunks e salva cada um como doc separado no Firestore
      const parts = [];
      for (let i = 0; i < base64.length; i += CHUNK_SIZE)
        parts.push(base64.slice(i, i + CHUNK_SIZE));

      showToast(`Enviando fita (${parts.length} partes)...`, 'info');
      try {
        await Promise.all(parts.map((chunk, i) =>
          setDoc(doc(db, 'tapes', `${id}_chunk_${i}`), { chunk, index: i })
        ));
        await setDoc(doc(db, 'tapes', id), { id, nome, categoria, assignedTo: codename, chunks: parts.length });
        const charRef  = doc(db, 'characters', codename);
        const charSnap = await getDoc(charRef);
        const tapes    = [...(charSnap.data()?.tapes || []), { id, nome, categoria }];
        await updateDoc(charRef, { tapes });
        nomeFld.value = ''; fileInput.value = '';
        document.getElementById('gm-fitas-list-' + codename).innerHTML = buildGMFitasListHtml(codename, tapes);
        showToast(`"${nome}" alocada com sucesso.`, 'success');
      } catch (err) { console.error(err); showToast('Erro ao enviar fita: ' + err.message, 'error'); }
    } else {
      // Modo local — base64 direto no localStorage
      localStorage.setItem('fita_data_' + id, base64);
      const char  = LocalDB.getChar(codename) || {};
      const tapes = [...(char.tapes || []), { id, nome, categoria }];
      char.tapes  = tapes; LocalDB.setChar(codename, char);
      nomeFld.value = ''; fileInput.value = '';
      document.getElementById('gm-fitas-list-' + codename).innerHTML = buildGMFitasListHtml(codename, tapes);
      showToast(`"${nome}" alocada (local).`, 'success');
    }
  };
  reader.readAsDataURL(file);
}

async function gmRemoveFita(codename, tapeId) {
  if (firebaseOk) {
    try {
      const metaSnap   = await getDoc(doc(db, 'tapes', tapeId));
      const chunkCount = metaSnap.exists() ? (metaSnap.data().chunks || 0) : 0;
      // Apaga todos os chunks em paralelo + o doc de metadados
      await Promise.all([
        ...Array.from({ length: chunkCount }, (_, i) => deleteDoc(doc(db, 'tapes', `${tapeId}_chunk_${i}`))),
        deleteDoc(doc(db, 'tapes', tapeId))
      ]);
      const charRef  = doc(db, 'characters', codename);
      const charSnap = await getDoc(charRef);
      const tapes    = (charSnap.data()?.tapes || []).filter(t => t.id !== tapeId);
      await updateDoc(charRef, { tapes });
      document.getElementById('gm-fitas-list-' + codename).innerHTML = buildGMFitasListHtml(codename, tapes);
      showToast('Fita removida.', 'success');
    } catch (e) { showToast('Erro ao remover fita.', 'error'); }
  } else {
    localStorage.removeItem('fita_data_' + tapeId);
    const char  = LocalDB.getChar(codename) || {};
    const tapes = (char.tapes || []).filter(t => t.id !== tapeId);
    char.tapes  = tapes; LocalDB.setChar(codename, char);
    document.getElementById('gm-fitas-list-' + codename).innerHTML = buildGMFitasListHtml(codename, tapes);
    showToast('Fita removida.', 'success');
  }
}

// ──────────────────────────────────────────────────────────
//  PERSIST DATA
// ──────────────────────────────────────────────────────────
async function persistChar(updates) {
  const codename = state.codename;
  if (!codename) return;

  if (firebaseOk) {
    try {
      const ref = doc(db, 'characters', codename);
      await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
    } catch (e) {
      // If doc doesn't exist yet, setDoc
      try {
        const ref = doc(db, 'characters', codename);
        const full = { ...state.character, ...flatToNested(updates), updatedAt: serverTimestamp() };
        await setDoc(ref, full);
      } catch (e2) {
        console.error('persistChar error:', e2);
        showToast('Erro ao salvar. Verifique a conexão.', 'error');
      }
    }
  } else {
    // Local mode
    if (state.character) {
      LocalDB.setChar(codename, state.character);
    }
  }
}

// Convert dotted paths like "attrs.fisico" to nested objects
function flatToNested(obj) {
  const result = {};
  for (const key in obj) {
    if (key.includes('.')) {
      const parts = key.split('.');
      let cur = result;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!cur[parts[i]]) cur[parts[i]] = {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = obj[key];
    } else {
      result[key] = obj[key];
    }
  }
  return result;
}

// ──────────────────────────────────────────────────────────
//  GM DASHBOARD
// ──────────────────────────────────────────────────────────
function loadGMDashboard() {
  const listEl = $('gm-agent-list');
  listEl.innerHTML = '<div class="gm-empty">Carregando operadores...</div>';
  loadNpcPresets();
  renderGMMaldicoes();

  if (firebaseOk) {
    if (state.gmCharsUnsub) state.gmCharsUnsub();
    const q = query(collection(db, 'characters'));
    state.gmCharsUnsub = onSnapshot(q, (snap) => {
      const chars = [];
      snap.forEach(d => chars.push(d.data()));
      renderGMList(chars.sort((a,b) => (a.codename || '').localeCompare(b.codename || '')));
    });
  } else {
    // Local mode
    const chars = LocalDB.getAllChars();
    renderGMList(chars);
    showToast('⚠ MODO LOCAL — atualizações não sincronizadas', 'error', 5000);
  }
}

function renderGMList(chars) {
  const listEl = $('gm-agent-list');
  if (!chars || chars.length === 0) {
    listEl.innerHTML = '<div class="gm-empty">Nenhum operador registrado.</div>';
    return;
  }
  listEl.innerHTML = '';
  chars.forEach(char => {
    const card = buildGMCard(char);
    listEl.appendChild(card);
  });
}

function buildGMCard(char) {
  const card = document.createElement('div');
  card.className = 'gm-agent-card';
  card.id = 'gm-card-' + char.codename;

  const statusLabel = { ativo: 'ATIVO', inativo: 'INATIVO', morto: 'K.I.A.' };
  const secLabel    = { seguro: 'SEGURO', alerta: 'ALERTA', comprometido: 'COMPROMETIDO' };
  const integ       = char.integrity ?? 5;

  const photoHtml = char.photo
    ? `<img class="gm-agent-photo-sm" src="${char.photo}" alt="foto" />`
    : `<div class="gm-agent-photo-placeholder">◈</div>`;

  const attrsHtml = ATTRS.map(a =>
    `<div class="gm-attr-mini-item">
      <div class="gm-attr-mini-grade">${(char.attrs && char.attrs[a]) || '—'}</div>
      <div class="gm-attr-mini-name">${ATTR_LABELS[a].slice(0,3)}</div>
    </div>`
  ).join('');

  const intBarsHtml = Array.from({length:5}, (_,i) =>
    `<div class="gm-int-bar ${i < integ ? 'active' : ''}"
          onclick="App.gmSetIntegrity('${char.codename}', ${i+1 > integ ? i+1 : i})" ></div>`
  ).join('');

  const secBtns = ['seguro','alerta','comprometido'].map(s =>
    `<button class="gm-sec-btn ${char.security === s ? 'active-'+s : ''}"
             onclick="App.gmSetSecurity('${char.codename}','${s}')">
       ${secLabel[s]}
     </button>`
  ).join('');

  const statusBtns = ['ativo','inativo','morto'].map(s =>
    `<button class="gm-toggle-btn ${char.statusAtivo === s ? 'active-'+s : ''}"
             onclick="App.gmSetStatus('${char.codename}','${s}')">
       ${statusLabel[s]}
     </button>`
  ).join('');

  card.innerHTML = `
    <div class="gm-card-header" onclick="App.gmToggleCard('${char.codename}')">
      ${photoHtml}
      <div class="gm-card-info">
        <div class="gm-card-codename">${char.codename}</div>
        <div class="gm-card-meta">
          <span>${char.nome || '—'}</span>
          <span>${statusLabel[char.statusAtivo] || 'ATIVO'}</span>
          <span>INT: ${integ}/5</span>
        </div>
      </div>
      <div class="gm-status-dot ${char.security || 'seguro'}"></div>
      <div class="gm-card-chevron">▾</div>
    </div>
    <div class="gm-controls">
      <div class="gm-ctrl-group">
        <div class="gm-ctrl-label">⬡ ATRIBUTOS</div>
        <div class="gm-attr-mini">${attrsHtml}</div>
      </div>
      <div class="gm-ctrl-group">
        <div class="gm-ctrl-label">⬡ INTEGRIDADE FÍSICA</div>
        <div class="gm-integrity-control">
          <div class="gm-integrity-bars">${intBarsHtml}</div>
          <div class="gm-integrity-val">${integ}</div>
        </div>
      </div>
      <div class="gm-ctrl-group">
        <div class="gm-ctrl-label">⬡ STATUS DE SEGURANÇA</div>
        <div class="gm-security-btns">${secBtns}</div>
      </div>
      <div class="gm-ctrl-group">
        <div class="gm-ctrl-label">⬡ STATUS DO OPERADOR</div>
        <div class="gm-active-toggle">${statusBtns}</div>
      </div>
      <div class="gm-ctrl-group">
        <div class="gm-ctrl-label">⬡ RÁDIO</div>
        <div id="gm-radio-panel-${char.codename}">${buildGMRadioHtml(char)}</div>
      </div>
      <div class="gm-ctrl-group">
        <div class="gm-ctrl-label">⬡ FITAS ALOCADAS</div>
        <div class="gm-fitas-list" id="gm-fitas-list-${char.codename}">${buildGMFitasListHtml(char.codename, char.tapes || [])}</div>
        <div class="gm-fitas-add">
          <input type="text" id="gm-fita-nome-${char.codename}" placeholder="nome da fita..." class="gm-text-input" />
          <select id="gm-fita-cat-${char.codename}" class="gm-select">
            <option value="musica">MÚSICA</option>
            <option value="historia">HISTÓRIA</option>
            <option value="outro">OUTRO</option>
          </select>
          <label class="gm-fita-upload-btn">+ MP3
            <input type="file" accept=".mp3,audio/*" class="hidden" onchange="App.gmUploadFita('${char.codename}', this)" />
          </label>
        </div>
      </div>
    </div>
  `;
  return card;
}

function gmToggleCard(codename) {
  const card = $('gm-card-' + codename);
  if (card) card.classList.toggle('expanded');
}

async function gmSetSecurity(codename, security) {
  await gmUpdateChar(codename, { security });
}

async function gmSetIntegrity(codename, val) {
  const newVal = Math.max(0, Math.min(5, val));
  await gmUpdateChar(codename, { integrity: newVal });
}

async function gmSetStatus(codename, statusAtivo) {
  await gmUpdateChar(codename, { statusAtivo });
}

async function gmUpdateChar(codename, updates) {
  if (firebaseOk) {
    try {
      const ref = doc(db, 'characters', codename);
      await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
      showToast(`${codename}: atualizado.`, 'success', 1500);
    } catch (e) {
      console.error(e);
      showToast('Erro ao atualizar operador.', 'error');
    }
  } else {
    // Local mode
    const char = LocalDB.getChar(codename);
    if (char) {
      Object.assign(char, updates);
      LocalDB.setChar(codename, char);
      // Re-render
      const chars = LocalDB.getAllChars();
      renderGMList(chars);
    }
  }
}

// ──────────────────────────────────────────────────────────
//  MALDIÇÕES
// ──────────────────────────────────────────────────────────
let maldicoesData = [];
let malState = { view: 'elem', elemento: null, maldicaoId: null };
let _malIconBase64 = null;
let _malTags = [];

function gmAddMaldTag() {
  const input = $('gm-mald-tag-input');
  if (!input) return;
  const tag = input.value.trim().toUpperCase();
  if (!tag || _malTags.includes(tag)) { input.value = ''; return; }
  _malTags.push(tag);
  input.value = '';
  _renderGMTagPills();
}

function gmRemoveMaldTag(i) {
  _malTags.splice(i, 1);
  _renderGMTagPills();
}

function _renderGMTagPills() {
  const el = $('gm-mald-tags-list');
  if (!el) return;
  el.innerHTML = _malTags.map((t, i) =>
    `<span class="mald-tag-pill gm-tag-pill">${escHtml(t)}<button onclick="App.gmRemoveMaldTag(${i})">&#10005;</button></span>`
  ).join('');
}

const ELEM_LABELS = {
  sangue: 'SANGUE', morte: 'MORTE',
  energia: 'ENERGIA', conhecimento: 'CONHECIMENTO'
};

async function loadMaldicoes() {
  if (!firebaseOk) return;
  try {
    const snap = await getDoc(doc(db, 'meta', 'maldicoes'));
    maldicoesData = snap.exists() ? (snap.data().maldicoes || []) : [];
  } catch (e) {
    console.error('loadMaldicoes:', e);
    maldicoesData = [];
  }
}

async function saveMaldicoes() {
  if (!firebaseOk) return;
  try {
    await setDoc(doc(db, 'meta', 'maldicoes'), { maldicoes: maldicoesData });
  } catch (e) {
    console.error('saveMaldicoes:', e);
    showToast('Erro ao salvar: documento muito grande. Reduza o tamanho dos ícones.', 'error', 5000);
    throw e;
  }
}

function _maldShowView(view) {
  malState.view = view;
  ['elem', 'grid', 'detail'].forEach(v => {
    const el = $('mald-view-' + v);
    if (el) el.classList.toggle('hidden', v !== view);
  });
}

function renderMaldicoesTab() {
  _maldShowView('elem');
}

function maldSelectElement(elem) {
  malState.elemento = elem;
  _maldShowView('grid');
  const titleEl   = $('mald-grid-title');
  const lblEl     = $('mald-grid-elem-lbl');
  const accentEl  = $('mald-grid-accent');
  const viewEl    = $('mald-view-grid');
  const gridEl    = $('mald-slots-grid');
  if (titleEl)  titleEl.textContent = 'MALDI\u00C7\u00D5ES';
  if (lblEl)    lblEl.textContent   = '\u25BA ' + (ELEM_LABELS[elem] || elem).toUpperCase();
  if (accentEl) { accentEl.className = 'mald-grid-accent accent-' + elem; }
  if (viewEl)   { viewEl.className = viewEl.className.replace(/elem-bg-\w+/g,'').trim() + ' elem-bg-' + elem; }
  if (gridEl)   { gridEl.className = 'mald-slots-grid mald-slots-elem-' + elem; }
  _renderMaldSlots(elem);
}

function _renderMaldSlots(elem) {
  const grid = $('mald-slots-grid');
  if (!grid) return;
  const filtered = maldicoesData.filter(m => m.elemento === elem);
  const TOTAL_SLOTS = 16;
  let html = '';
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const m = filtered[i];
    const num = String(i + 1).padStart(2, '0');
    if (m) {
      const iconHtml = m.icone
        ? `<img class="mald-slot-img" src="${m.icone}" alt="" />`
        : `<span style="font-size:26px;color:var(--dim)">&#9672;</span>`;
      html += `<div class="mald-slot" onclick="App.maldShowDetail('${escHtml(m.id)}')">
        <div class="mald-slot-idx">${num}</div>
        <div class="mald-slot-icon-wrap">${iconHtml}</div>
        <div class="mald-slot-name">${escHtml(m.nome)}</div>
        <div class="mald-slot-cut"></div>
      </div>`;
    } else {
      html += `<div class="mald-slot mald-slot-empty">
        <div class="mald-slot-empty-num">${num}</div>
      </div>`;
    }
  }
  grid.innerHTML = html;
}

function maldShowDetail(id) {
  const m = maldicoesData.find(x => x.id === id);
  if (!m) return;
  malState.maldicaoId = id;
  _maldShowView('detail');
  const container = $('mald-detail-inner');
  if (!container) return;
  const iconHtml = m.icone
    ? `<img class="mald-detail-icon" src="${m.icone}" alt="" />`
    : `<div class="mald-detail-icon-ph">&#9672;</div>`;
  const detectClass = m.detectavel ? 'mald-detect-yes' : 'mald-detect-no';
  const detectText  = m.detectavel ? 'DETECT\u00C1VEL' : 'N\u00C3O DETECT\u00C1VEL';
  const elemLabel   = ELEM_LABELS[m.elemento] || m.elemento;
  const tagsHtml    = (m.tags && m.tags.length)
    ? `<div class="mald-detail-tags">${m.tags.map(t => `<span class="mald-tag-pill elem-tag-${m.elemento}">${escHtml(t)}</span>`).join('')}</div>`
    : '';
  container.innerHTML = `
    <div class="mald-detail-top">
      ${iconHtml}
      <div class="mald-detail-info">
        <div class="mald-detail-name">${escHtml(m.nome)}</div>
        <div class="mald-detail-elem-row">
          <span class="mald-detail-elem-badge elem-${m.elemento}">${elemLabel}</span>
        </div>
        <div class="mald-detail-custo">${elemLabel} &#9675; ${m.custo || 0} COMPONENTES</div>
        <div class="mald-detect-badge ${detectClass}">${detectText}</div>
        ${tagsHtml}
      </div>
    </div>
    <div class="mald-detail-desc">${escHtml(m.descricao || '\u2014')}</div>
  `;
}

function maldBack(to) {
  if (to === 'elem') {
    _maldShowView('elem');
  } else if (to === 'grid' && malState.elemento) {
    maldSelectElement(malState.elemento);
  }
}

// GM ─────────────────────────────────────────────────────
async function renderGMMaldicoes() {
  await loadMaldicoes();
  const listEl = $('gm-mald-list');
  if (!listEl) return;
  if (!maldicoesData.length) {
    listEl.innerHTML = '<div class="gm-fitas-empty">Nenhuma maldi\u00e7\u00e3o cadastrada.</div>';
    return;
  }
  listEl.innerHTML = maldicoesData.map(m => {
    const thumbHtml = m.icone
      ? `<img class="gm-mald-thumb" src="${m.icone}" alt="" />`
      : `<div class="gm-mald-thumb-ph">&#9672;</div>`;
    return `<div class="gm-mald-item">
      ${thumbHtml}
      <div class="gm-mald-info">
        <div class="gm-mald-nome">${escHtml(m.nome)}</div>
        <div class="gm-mald-meta">${ELEM_LABELS[m.elemento] || m.elemento} &middot; CUSTO ${m.custo} &middot; ${m.detectavel ? 'DETECT.' : 'N.DETECT.'}</div>
      </div>
      <button class="gm-fita-del" onclick="App.gmRemoveMaldicao('${escHtml(m.id)}')">&#10005;</button>
    </div>`;
  }).join('');
}

function gmPreviewMaldIcon(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 256;
      const ar = img.width / img.height;
      canvas.width  = ar >= 1 ? MAX : Math.round(MAX * ar);
      canvas.height = ar >= 1 ? Math.round(MAX / ar) : MAX;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      _malIconBase64 = canvas.toDataURL('image/jpeg', 0.92);
      const prev = $('gm-mald-icone-preview');
      if (prev) { prev.src = _malIconBase64; prev.classList.remove('hidden'); }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function gmAddMaldicao() {
  const nome = ($('gm-mald-nome').value || '').trim();
  if (!nome) { showToast('Insira o nome da maldi\u00e7\u00e3o.', 'error'); return; }
  const elem       = $('gm-mald-elem').value;
  const custo      = parseInt($('gm-mald-custo').value) || 0;
  const detectavel = $('gm-mald-detect').checked;
  const descricao  = ($('gm-mald-desc').value || '').trim();
  const id = 'mald_' + Date.now();
  maldicoesData.push({ id, nome, elemento: elem, custo, detectavel, descricao, tags: [..._malTags], icone: _malIconBase64 || '' });
  try {
    await saveMaldicoes();
  } catch {
    maldicoesData.pop();
    return;
  }
  $('gm-mald-nome').value = '';
  $('gm-mald-custo').value = '';
  $('gm-mald-detect').checked = false;
  $('gm-mald-desc').value = '';
  $('gm-mald-tag-input').value = '';
  _malTags = [];
  _renderGMTagPills();
  _malIconBase64 = null;
  const prev = $('gm-mald-icone-preview');
  if (prev) { prev.src = ''; prev.classList.add('hidden'); }
  showToast('Maldiçao adicionada.', 'success');
  renderGMMaldicoes();
}

async function gmRemoveMaldicao(id) {
  maldicoesData = maldicoesData.filter(m => m.id !== id);
  await saveMaldicoes();
  showToast('Maldi\u00e7\u00e3o removida.', 'success', 1500);
  renderGMMaldicoes();
}

// ──────────────────────────────────────────────────────────
//  PUBLIC API (called from HTML onclick)
// ──────────────────────────────────────────────────────────
window.App = {
  selectRole,
  loginPlayer,
  loginGM,
  logout,
  editPhoto,
  handlePhotoUpload,
  toggleEdit,
  saveField,
  cycleAttr,
  openGradeModal,
  selectGrade,
  closeGradeModal,
  toggleIntegrity,
  switchTab,
  gmToggleCard,
  gmSetSecurity,
  gmSetIntegrity,
  gmSetStatus,
  playFita,
  fitaTogglePlay,
  fitaToggleLoop,
  fitaSkip,
  fitaSeek,
  gmUploadFita,
  gmRemoveFita,
  radioChangeFreq,
  radioSolicitar,
  radioCancelar,
  gmAddNpcPreset,
  gmRemoveNpcPreset,
  gmRadioAceitar,
  gmRadioRecusar,
  gmRadioDesconectar,
  maldSelectElement,
  maldShowDetail,
  maldBack,
  gmPreviewMaldIcon,
  gmAddMaldicao,
  gmRemoveMaldicao,
  gmAddMaldTag,
  gmRemoveMaldTag
};

// ──────────────────────────────────────────────────────────
//  KEYBOARD SHORTCUTS
// ──────────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Close any open modal or editing
    if (!$('grade-modal').classList.contains('hidden')) {
      $('grade-modal').classList.add('hidden');
    }
  }
  // Enter on login inputs
  if (e.key === 'Enter') {
    if (document.activeElement === $('input-codename')) loginPlayer();
    if (document.activeElement === $('input-gm-pass'))  loginGM();
  }
});

// ──────────────────────────────────────────────────────────
//  START
// ──────────────────────────────────────────────────────────
runBoot();
