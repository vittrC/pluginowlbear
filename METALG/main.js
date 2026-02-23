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
  }
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
  gmRemoveFita
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
