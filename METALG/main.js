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
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
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
//  Para gerar um novo hash via PowerShell:
//    [System.BitConverter]::ToString([System.Security.Cryptography.SHA256]::Create()
//      .ComputeHash([System.Text.Encoding]::UTF8.GetBytes("NOVA_SENHA")))
//      .Replace('-','').ToLower()
// ──────────────────────────────────────────────────────────
const GM_PASSWORD_HASH = "f6615ac3944228857e9c800def9a606874baaf3d1cf9425707c1c1d640f24d5e";

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

// ──────────────────────────────────────────────────────────
//  DOCUMENTS CONFIG — adicione novos documentos aqui
// ──────────────────────────────────────────────────────────
const DOCUMENTS = [
  {
    id:      'doc_placeholder',
    title:   'Papel Estranho',
    image:   'documentos/documento01.jpg',
    uvImage: 'documentos/documento01_uv.jpg'   // versão UV real — null = usa filtro CSS apenas
  },
  {
    id:      'doc_02',             
    title:   'PROJETO [CENSURADO] — RELATÓRIO DE TESTES',
    image:   'documentos/documento02.jpg',
    uvImage: 'documentos/documento02_uv.jpg'  // ou null se não tiver versão UV
  }
];

const DEFAULT_CHAR = () => ({
  codename:   "",
  nome:       "",
  origem:     "[CONFIDENCIAL]",
  photo:      "",
  statusAtivo:"ativo",    // ativo | inativo | morto
  security:   "seguro",   // seguro | alerta | perigo | comprometido
  integrity:  5,
  patente:    1,
  armas:      [null, null],
  bolsa:        { items: [], staged: [] },
  camuflagem:   null,
  attrs: {
    fisico:      "D",
    intelecto:   "D",
    reflexos:    "D",
    resiliencia: "D",
    presenca:    "D"
  },
  aparencia: {
    cor:        'vermelho',
    fotoFiltro: 'padrao',
    carimbo:    'nenhum'
  },
  updatedAt: null
});

// ──────────────────────────────────────────────────────────
//  FIREBASE INIT
// ──────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────
//  DICAS DE CAMPO — presets
// ──────────────────────────────────────────────────────────
const DICAS_PRESETS = [
  {
    id:     'campo_visao',
    titulo: 'CAMPO DE VIS\u00c3O / ALERTA',
    texto:  'Quando um inimigo entra em ALERTA.',
    imagem: 'dicas/campo_visao_alerta.png'
  },
  {
    id:     'campo_visao1',
    titulo: 'CAMPO DE VIS\u00c3O / NORMAL',
    texto:  'Quando um inimigo não suspeita de nada.',
    imagem: 'dicas/campo_visao_normal.png'
  }
];

const ARMA_TIPOS = {
  pistola:    { label: 'PISTOLA',    img: 'icones/pistola.png' },
  espingarda: { label: 'ESPINGARDA', img: 'icones/espingarda.png' },
  sniper:     { label: 'SNIPER',     img: '' },
  revolver:   { label: 'REVOLVER',   img: '' },
  outro:      { label: 'OUTRO',      img: '' },
  // Consumíveis
  kit_medico:  { label: 'KIT MÉDICO',     img: '', consumivel: true, ico: '✚' },
  municao:     { label: 'MUNIÇÃO',         img: '', consumivel: true, ico: '◈' },
  granada:     { label: 'GRANADA',         img: '', consumivel: true, ico: '⊛' },
  racao:       { label: 'RAÇÃO DE CAMPO',  img: '', consumivel: true, ico: '▣' },
  curativo:    { label: 'CURATIVO',        img: '', consumivel: true, ico: '✦' },
  estimulante: { label: 'ESTIMULANTE',     img: '', consumivel: true, ico: '◉' },
};

// Inventory sizes (cols × rows) for each weapon / consumable type
const ARMA_SIZES = {
  pistola:    { w: 1, h: 2 },
  revolver:   { w: 1, h: 2 },
  espingarda: { w: 2, h: 3 },
  sniper:     { w: 2, h: 4 },
  outro:      { w: 1, h: 2 },
  // Consumíveis — 1×1
  kit_medico:  { w: 1, h: 1 },
  municao:     { w: 1, h: 1 },
  granada:     { w: 1, h: 1 },
  racao:       { w: 1, h: 1 },
  curativo:    { w: 1, h: 1 },
  estimulante: { w: 1, h: 1 },
};

// Default uses per consumable type
const CONSUMIVEL_USOS = { kit_medico: 3, municao: 6, granada: 1, racao: 4, curativo: 3, estimulante: 2 };

// Weapon attachment slot definitions
const ARMA_MODS = {
  supressor:  { label: 'SUPRESSOR',   ico: '▣', desc: 'Suprime assinatura de disparo.' },
  mira:       { label: 'MIRA TÁTICA', ico: '⊕', desc: 'Aumenta precisão a longa distância.' },
  carregador: { label: 'CARREGADOR+', ico: '▥', desc: 'Capacidade de munição estendida.' },
};

// Accent color per consumable type
const CONSUMIVEL_COR = {
  kit_medico:  '#dd4444',
  municao:     '#4488cc',
  granada:     '#cc6622',
  racao:       '#aa8833',
  curativo:    '#44bb66',
  estimulante: '#9944cc',
};

const BOLSA_COLS  = 7;
const BOLSA_ROWS  = 5;
const BOLSA_STEP  = 47; // cell px (46) + gap (1)
// Available bolsa rows per patente level (Etapa 2 — capacity limit)
const BOLSA_ROWS_BY_PATENTE = { 1: 3, 2: 4, 3: 5 };

const PATENTES = {
  1: { nome: 'VENOM', desc: 'Recruta de campo. Preparado para missões de alta periculosidade.' },
  2: { nome: 'SNAKE', desc: 'Operador especializado. Seu nome é mais conhecido.' },
  3: { nome: 'VYPER', desc: 'Um Vyper de verdade. Identidade apagada. Existe apenas a missão. Seu nome causa medo' },
};

const CAMUFLAGENS = [
  {
    id: 'florestal',
    nome: 'FLORESTAL',
    ambiente: 'MATA DENSA',
    camo: 72,
    cor: '#1a3010',
    acento: '#5aaa2a',
    iconeChar: 'FL',
    efeito: '+2 em furtividade em mata fechada e florestas',
    sabor: 'O padrão clássico. Sombras e folhas se tornam seu escudo. Operadores veteranos ainda confiam nele em todo engajamento na selva.',
    equipText: 'Você desaparece entre as sombras verdes.\nA floresta te aceita como um dos seus.'
  },
  {
    id: 'urban_ops',
    nome: 'URBAN OPS',
    ambiente: 'AMBIENTE URBANO',
    camo: 65,
    cor: '#2a2a2a',
    acento: '#aaaaaa',
    iconeChar: 'UO',
    efeito: '+2 em furtividade em zonas urbanas e instalações',
    sabor: 'Concreto, asfalto, grades de aço. Você vira parte da estrutura urbana. Mais um civil no caos da cidade.',
    equipText: 'Você se torna a paisagem.\nAnônimo. Invisível. Mais um rosto sem nome.'
  },
  {
    id: 'arcturo',
    nome: '~ARCTURO',
    ambiente: 'NEVE / GELO',
    camo: 78,
    cor: '#1a2a3a',
    acento: '#88ccee',
    iconeChar: 'AR',
    efeito: '+3 em furtividade em terreno nevado e ártico',
    sabor: 'Branco absoluto. Na neve você é um fantasma que nunca existiu. O frio apaga rastros melhor do que qualquer treinamento.',
    equipText: 'O frio te abraça.\nVocê se torna a neve em si.'
  },
  {
    id: 'digital',
    nome: 'DIGITAL GRID',
    ambiente: 'INSTALAÇÕES TECH',
    camo: 62,
    cor: '#081420',
    acento: '#00aaff',
    iconeChar: 'DG',
    efeito: 'Reduz detecção por câmeras e sensores eletrônicos em -15',
    sabor: 'Padrão quadriculado que distorce reconhecimento de forma em sistemas de câmera. Não funciona para olhos humanos — só para sensores.',
    equipText: 'Sistemas de vigilância registram seu movimento\ncomo ruído estático. Você é só glitch.'
  },
  {
    id: 'fantasma',
    nome: 'FANTASMA',
    ambiente: 'OPERAÇÕES NOTURNAS',
    camo: 55,
    cor: '#080808',
    acento: '#5555aa',
    iconeChar: 'FA',
    efeito: '+4 em furtividade à noite. -2 durante o dia.',
    sabor: 'Preto absoluto. Não foi feito para ser visto. Nunca. De dia é um risco, mas na escuridão você deixa de existir.',
    equipText: 'Você some na escuridão.\nNem sua sombra é visível.'
  },
  {
    id: 'serpente',
    nome: '!PADRÃO !SERPENTE',
    ambiente: 'CAMPO ABERTO',
    camo: 85,
    cor: '#1a0e04',
    acento: '#e0a020',
    gradient: 'linear-gradient(135deg, #c8860a 0%, #f0c040 40%, #ffd700 60%, #b07010 100%)',
    iconeChar: 'SN',
    efeito: 'Alto índice em qualquer ambiente. Pertenceu a uma lenda. +4 resistencia a dano',
    sabor: 'Alguém o deixou para trás. Representa um tempo que se foi, e agora, seu legado está em suas mãos.',
    equipText: '...\nVocê sente o peso de quem usou isso antes de você.'
  },
  {
    id: 'biomimet',
    nome: '@BIOMIMÉTICO',
    ambiente: 'ADAPTÁVEL',
    camo: 82,
    cor: '#0e201a',
    acento: '#33cc88',
    iconeChar: 'BM',
    efeito: 'Índice de camuflagem se adapta ao ambiente detectado pelo operador',
    sabor: 'Tecido vivo infundido com proteínas de cefalópodo. Muda de textura e cor, mas só um pouco. O suficiente.',
    equipText: 'Sua pele formiga. O tecido pulsa.\nDepois: silêncio perfeito.'
  },
  {
    id: 'arido',
    nome: 'ÁRIDO',
    ambiente: 'DESERTO / RUÍNAS',
    camo: 68,
    cor: '#1e1408',
    acento: '#cc9944',
    iconeChar: 'ÁR',
    efeito: '+2 em furtividade em terreno árido, deserto e ruínas',
    sabor: 'Pedra, areia, silêncio. Os desertos escondem muita coisa. Agora, inclusive você.',
    equipText: 'Você se torna pedra. Areia.\nCalor distante no horizonte.'
  },
  {
    id: 'fluvial',
    nome: 'FLUVIAL',
    ambiente: 'RIOS / PÂNTANOS',
    camo: 70,
    cor: '#081422',
    acento: '#3388aa',
    iconeChar: 'FV',
    efeito: '+3 em furtividade em terreno aquático, pântanos e chuva',
    sabor: 'Lama, musgo, reflexo na água. Para quem luta no lodo sem reclamar.',
    equipText: 'O pântano te reconhece como um dos seus.\nA lama cobre seus rastros.'
  },
  {
    id: 'termico',
    nome: '*TÉRMICO*',
    ambiente: 'CONTRA-VIGILÂNCIA',
    camo: 75,
    cor: '#0a0018',
    acento: '#8844cc',
    iconeChar: 'TC',
    efeito: 'Oculta assinatura térmica. Invisível para câmeras infravermelho.',
    sabor: 'Bloqueia o calor corporal por até 90 minutos de uso contínuo. Depois disso, você começa a sobreaquece.',
    equipText: 'Você some dos sensores de calor.\nPara os scanners, você não existe.'
  },
  {
    id: 'frondosa',
    nome: 'FRONDOSA',
    ambiente: 'MATA CERRADA',
    camo: 80,
    cor: '#122210',
    acento: '#88cc44',
    iconeChar: 'FR',
    efeito: 'Índice máximo em vegetação densa. Penalidade em espaços abertos.',
    sabor: 'Folhas costuradas à mão, uma a uma. Leva dias para construir. Um segundo para reconhecer que você vale o esforço.',
    equipText: 'Você não está na floresta.\nVocê é a floresta.'
  },
  {
    id: 'ecrasm',
    nome: 'ECRÃ',
    ambiente: '[CLASSIFICADO]',
    camo: 94,
    cor: '#04040e',
    acento: '#00ffcc',
    iconeChar: '◈',
    efeito: '[CLASSIFICADO] Camuflagem óptica adaptativa de última geração.',
    sabor: '[ACESSO RESTRITO — NÍVEL VYPER] Projeto ECRÃ. Desenvolvido em cooperação com [REDACTED]. Protótipo. Instável acima de 40 minutos de uso contínuo.',
    equipText: 'use com moderação.'
  },
  {
    id: 'bandana',
    nome: '!BANDANA',
    ambiente: '◪ ITEM - ESPECIAL ◪',
    camo: 99,
    cor: '#1a0e04',
    acento: '#e0a020',
    gradient: 'linear-gradient(135deg, #c8860a 0%, #f0c040 40%, #ffd700 60%, #b07010 100%)',
    iconeChar: 'お',
    efeito: 'Faça parte da lenda',
    sabor: 'Não te oferece nenhum bônus, apenas um estilo inconfundível. Dizem que foi usada pelo próprio !Vyper durante a operação *FUMAÇA* *VERMELHA*.',
    equipText: 'essa é a sensação, de ser um !VYPER de verdade.'
  }
];

let db         = null;
let auth       = null;
let firebaseOk = false;
let authOk     = false;  // true depois que signInAnonymously resolver com sucesso
let docsReleasedState = [];   // IDs de documentos liberados pelo GM
let docsUnsub = null;         // listener firestore de docs
let camoReleasedState = [];   // IDs de camuflagens liberadas pelo GM
let camoUnsub = null;         // listener firestore de camos
let docsReadSet   = new Set(); // IDs de docs já abertos pelo jogador
let _newDocAlertId = null;     // docId pendente no alerta de novo arquivo
let missaoText  = '';          // texto de missão atual (GM)
let missaoUnsub = null;        // listener firestore de missão
let _lootPool    = [];         // itens montados pelo GM para distribuição
let _gmCharsList = [];         // cache de chars para ferramentas do GM
let _gmDeleteArmed = null;     // codename aguardando confirmação de deleção
let bolsaSelected    = null;   // index into bolsa.items currently selected
let bolsaDiscardArmed = false; // true after first discard click (confirm step)
let _bolsaKeyHandler  = null;  // ref to the keydown listener
let _camoSelected     = null;  // id da camo expandida no painel

// ──────────────────────────────────────────────────────────
//  AUDIO
// ──────────────────────────────────────────────────────────
const SFX_SRCS = {
  open:   'codecopen.wav',
  close:  'codecover.wav',
  select: 'select.wav',
};
const SFX_VOL = { open: 0.55, close: 0.55, select: 0.45 };

function sfx(name) {
  const src = SFX_SRCS[name];
  if (!src) return;
  try {
    const a = new Audio(src);
    a.volume = SFX_VOL[name] ?? 0.5;
    a.play().catch(() => {});
  } catch (_) {}
}

try {
  const app  = initializeApp(firebaseConfig);
  db         = getFirestore(app);
  auth       = getAuth(app);
  signInAnonymously(auth)
    .then(() => { authOk = true; })
    .catch(e  => console.warn('Auth anônimo falhou (ative em Firebase Console > Authentication > Sign-in methods > Anônimo):', e));
  firebaseOk = true;
} catch (e) {
  console.warn("Firebase não configurado. Usando modo local (localStorage).", e);
}

// Aguarda o Firebase Auth ter um usuário pronto (resolve em até 5s)
function waitForAuth() {
  if (!auth) return Promise.resolve(null);
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  return new Promise(resolve => {
    const unsub = auth.onAuthStateChanged(user => {
      unsub();
      resolve(user);
    });
    setTimeout(() => { unsub(); resolve(null); }, 5000);
  });
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
  },
  removeChar(codename) {
    localStorage.removeItem(LS_PREFIX + codename.toUpperCase());
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
  t.innerHTML = fmtCamo(msg);
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
    const currentUser = await waitForAuth();

    // Se a autenticação anônima não está habilitada no Firebase Console,
    // currentUser será null — cai em modo local para não bloquear o jogador.
    if (!currentUser) {
      const charLocal = LocalDB.getChar(codename);
      charData = charLocal || DEFAULT_CHAR();
      if (!charLocal) { charData.codename = codename; LocalDB.setChar(codename, charData); }
      showToast('⚠ Auth Firebase indisponível — modo local ativo. Ative "Anônimo" no Firebase Console.', 'error', 7000);
      state.role = 'player'; state.codename = codename; state.character = charData;
      renderSheet(charData); showScreen('screen-sheet');
      await loadDocsState();
      await loadCamoState();
      return;
    }

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

  // Load docs released state then render
  await loadDocsState();
  await loadCamoState();

  // Realtime listener — character
  if (firebaseOk) {
    if (state.unsubscribe) state.unsubscribe();
    state.unsubscribe = onSnapshot(doc(db, 'characters', codename), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const old  = state.character;
      // Merge: keep local bolsa if Firestore doc doesn't have it yet
      state.character = data;
      if (!state.character.bolsa) {
        state.character.bolsa = old?.bolsa || { items: [], staged: [] };
      }

      // Update only GM-controlled fields to avoid disrupting player edits
      updateSecurityDisplay(data.security);
      updateIntegrityDisplay(data.integrity);
      updateStatusAtivoDisplay(data.statusAtivo);
      updateArmaDisplay(data.armas);
      applyAparencia(data);

      // Notify player if status changed
      if (old && old.security !== data.security) {
        triggerStatusChangeEffect(data.security);
      }

      // Detect new dica sent by GM
      const oldDicaTs = old?.radio?.dicaAtual?.ts;
      const newDicaTs = data.radio?.dicaAtual?.ts;
      if (newDicaTs && newDicaTs !== oldDicaTs) showDicaPopup(data.radio.dicaAtual.id);

      // Detect new item sent to bolsa by GM
      const oldBolsaCount = (old?.bolsa?.items?.length || 0) + (old?.bolsa?.staged?.length || 0);
      const newBolsaCount = (data.bolsa?.items?.length || 0) + (data.bolsa?.staged?.length || 0);
      if (newBolsaCount > oldBolsaCount) {
        const inGrid = data.bolsa?.items?.length || 0;
        const inQueue = data.bolsa?.staged?.length || 0;
        if (inQueue > (old?.bolsa?.staged?.length || 0)) {
          showToast('\u25c8 Item recebido — bolsa cheia, aguardando espaço.', 'error', 3500);
        } else {
          showToast('\u25c8 Novo item recebido na bolsa!', 'success', 2500);
        }
      }

      // Refresh fitas tab if open
      if (state.currentTab === 'fitas') renderFitasTab();
      // Refresh radio tab if open
      if (state.currentTab === 'radio') renderRadioTab();
      // Refresh bolsa tab if open
      if (state.currentTab === 'bolsa') renderBolsa();
    });

    // Realtime listener — docs released state
    if (docsUnsub) docsUnsub();
    const _prevReleased = [...docsReleasedState];
    docsUnsub = onSnapshot(doc(db, 'gameState', 'docs'), (snap) => {
      const newReleased = snap.exists() ? (snap.data().released || []) : [];
      // Detect newly released docs (not in previous state)
      const justReleased = newReleased.filter(id => !docsReleasedState.includes(id));
      docsReleasedState = newReleased;
      if (justReleased.length > 0) showNewDocAlert(justReleased[0]);
      if (state.currentTab === 'docs') renderDocsTab();
    });

    // Realtime listener — camo released state
    if (camoUnsub) camoUnsub();
    camoUnsub = onSnapshot(doc(db, 'gameState', 'camos'), (snap) => {
      const prev = [...camoReleasedState];
      camoReleasedState = snap.exists() ? (snap.data().released || []) : [];
      const justReleased = camoReleasedState.filter(id => !prev.includes(id));
      if (justReleased.length > 0) showToast('\u25c8 Nova camuflagem desbloqueada!', 'success', 2500);
      if (state.currentTab === 'bolsa') renderCamuflagem();
    });

    // Realtime listener — mission current text
    if (missaoUnsub) missaoUnsub();
    missaoUnsub = onSnapshot(doc(db, 'gameState', 'mission'), (snap) => {
      missaoText = snap.exists() ? (snap.data().text || '') : '';
      if (state.currentTab === 'equip') renderMissaoAtualText();
    });
  }
}

// ──────────────────────────────────────────────────────────
//  GM LOGIN
// ──────────────────────────────────────────────────────────
async function hashStr(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function loginGM() {
  const pass = $('input-gm-pass').value.trim();
  const inputHash = await hashStr(pass);
  if (inputHash !== GM_PASSWORD_HASH) {
    showError('login-error-gm', 'Código de acesso inválido.');
    $('input-gm-pass').value = '';
    $('input-gm-pass').focus();
    return;
  }

  // Registra UID desta sessão como GM no Firestore (usado pelas Security Rules)
  if (firebaseOk) {
    const currentUser = await waitForAuth();
    if (currentUser) {
      try {
        await setDoc(doc(db, 'meta', 'config'), { gmUid: currentUser.uid });
      } catch (e) {
        console.warn('Não foi possível registrar gmUid:', e);
      }
    }
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
  if (docsUnsub)            { docsUnsub(); docsUnsub = null; }
  if (camoUnsub)            { camoUnsub(); camoUnsub = null; }
  if (missaoUnsub)          { missaoUnsub(); missaoUnsub = null; }
  docsReleasedState = [];
  camoReleasedState = [];
  docsReadSet = new Set();
  _newDocAlertId = null;
  missaoText = '';
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
// ──────────────────────────────────────────────────────────
//  APARÊNCIA DO OPERADOR (aplicada pelo GM)
// ──────────────────────────────────────────────────────────
function applyAparencia(data) {
  const apar  = data.aparencia || {};
  const sheet = $('screen-sheet');
  if (!sheet) return;

  // Cor de destaque
  const CORES = ['azul','verde','roxo','dourado','ciano'];
  CORES.forEach(c => sheet.classList.remove('theme-' + c));
  if (apar.cor && apar.cor !== 'vermelho') sheet.classList.add('theme-' + apar.cor);

  // Estilo de foto
  const frame = $('photo-frame');
  if (frame) {
    ['fantasma','corrupto','operativo'].forEach(s => frame.classList.remove('photo-style-' + s));
    if (apar.fotoFiltro && apar.fotoFiltro !== 'padrao')
      frame.classList.add('photo-style-' + apar.fotoFiltro);
  }

  // Carimbo
  const photoInner = document.querySelector('#photo-frame .photo-inner');
  if (photoInner) {
    let stamp = photoInner.querySelector('.photo-stamp');
    if (!stamp) {
      stamp = document.createElement('div');
      photoInner.appendChild(stamp);
    }
    const STAMP_LABELS = {
      confidencial: 'CONFIDENCIAL', operativo: 'OPERATIVO', desaparecido: 'DESAPARECIDO',
      eliminado:    'ELIMINADO',    foragido:    'FORAGIDO',    renegado:     'RENEGADO',
      elite:        'ELITE',        corrompido:  'CORROMPIDO',  prioritario:  'PRIORITÁRIO',
      neutralizado: 'NEUTRALIZADO'
    };
    if (apar.carimbo && apar.carimbo !== 'nenhum' && STAMP_LABELS[apar.carimbo]) {
      stamp.className  = 'photo-stamp photo-stamp-' + apar.carimbo;
      stamp.textContent = STAMP_LABELS[apar.carimbo];
    } else {
      stamp.className  = '';
      stamp.textContent = '';
    }
  }
}

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

  // Patente
  updatePatenteDisplay(data.patente ?? 1);

  // Integrity (called inside updatePatenteDisplay)

  // Armas
  updateArmaDisplay(data.armas);

  // Security
  updateSecurityDisplay(data.security || 'seguro');

  // Aparência
  applyAparencia(data);

  // Ensure bolsa field exists on character
  if (!state.character.bolsa) state.character.bolsa = { items: [], staged: [] };

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
  const labels = { seguro: 'SEGURO', alerta: 'ALERTA', perigo: 'PERIGO', comprometido: 'COMPROMETIDO', inativo: 'INATIVO' };
  text.textContent = labels[security] || 'SEGURO';
}

function updateIntegrityDisplay(integrity) {
  const patente  = state.character?.patente ?? 1;
  const maxBars  = 4 + patente; // Venom=5, Snake=6, Vyper=7
  const val      = typeof integrity === 'number' ? Math.min(integrity, maxBars) : maxBars;
  const bars     = document.querySelectorAll('#integrity-bars .integrity-bar');
  const countEl  = $('integrity-count');
  const section  = document.getElementById('integrity-bars');

  bars.forEach((bar, i) => {
    if (i >= maxBars) {
      bar.classList.add('bar-hidden');
      bar.classList.remove('active');
    } else {
      bar.classList.remove('bar-hidden');
      bar.classList.toggle('active', i < val);
    }
  });
  if (countEl) countEl.textContent = val + '/' + maxBars;

  // Visual warning levels
  if (section) {
    section.classList.remove('warn-low', 'warn-crit');
    if (val <= 1) section.classList.add('warn-crit');
    else if (val <= 2) section.classList.add('warn-low');
  }
}

// ──────────────────────────────────────────────────────────
//  DICAS — player popup
// ──────────────────────────────────────────────────────────
function showDicaPopup(dicaId) {
  const dica = DICAS_PRESETS.find(d => d.id === dicaId);
  if (!dica) return;
  const popup = $('dica-popup');
  if (!popup) return;
  $('dica-popup-titulo').textContent = dica.titulo;
  $('dica-popup-texto').textContent  = dica.texto;
  const img = $('dica-popup-img');
  if (dica.imagem) { img.src = dica.imagem; img.style.display = ''; }
  else             { img.style.display = 'none'; }
  popup.classList.remove('hidden');
  sfx('open');
}

function closeDicaPopup() {
  const popup = $('dica-popup');
  if (popup) popup.classList.add('hidden');
  sfx('close');
}

function updatePatenteDisplay(patente) {
  const p = Math.max(1, Math.min(3, patente || 1));
  for (let i = 1; i <= 3; i++) {
    const item = $('patente-item-' + i);
    if (!item) continue;
    item.classList.toggle('patente-active', i === p);
    item.classList.toggle('patente-locked', i !== p);
  }
  const descEl = $('patente-desc');
  if (descEl) descEl.textContent = PATENTES[p]?.desc || '';

  // Update integrity display with new max
  const currentIntegrity = state.character?.integrity ?? (4 + p);
  updateIntegrityDisplay(currentIntegrity);
}

async function setPatente(level) {
  if (state.role !== 'player' || !state.character) return;
  const p = Math.max(1, Math.min(3, level));
  state.character.patente = p;
  updatePatenteDisplay(p);
  sfx('select');
  await persistChar({ patente: p });
}

// ──────────────────────────────────────────────────────────
//  ARMAS — player display & inspect
// ──────────────────────────────────────────────────────────
function updateArmaDisplay(armas) {
  armas = armas || [null, null];
  for (let i = 0; i < 2; i++) {
    const arma  = armas[i] || null;
    const slot  = $('arma-slot-' + i);
    const ico   = $('arma-ico-' + i);
    const empt  = $('arma-empty-' + i);
    const nome  = $('arma-nome-' + i);
    const stats = $('arma-stats-' + i);
    const inspB = $('arma-insp-btn-' + i);
    const letal = $('arma-letal-' + i);
    if (!slot) continue;
    if (arma && arma.tipo) {
      const tipo = ARMA_TIPOS[arma.tipo] || ARMA_TIPOS.outro;
      if (tipo.img) {
        ico.src = tipo.img;
        ico.classList.remove('hidden');
        empt.style.display = 'none';
      } else {
        ico.classList.add('hidden');
        empt.style.display = '';
        empt.textContent = '\u25c8';
      }
      nome.textContent = arma.nome || tipo.label;
      const parts = [];
      if (arma.dano)    parts.push('DMG: ' + arma.dano);
      if (arma.alcance) parts.push('ALC: ' + arma.alcance);
      stats.textContent = parts.join(' \u00b7 ');
      // Lethality badge
      if (letal) {
        if (arma.tipoDano === 'mortal') {
          letal.textContent = 'DMG';
          letal.className = 'arma-letal-badge arma-letal-mortal';
        } else if (arma.tipoDano === 'neutralizador') {
          letal.textContent = 'ZZZ';
          letal.className = 'arma-letal-badge arma-letal-neu';
        } else {
          letal.textContent = '';
          letal.className = 'arma-letal-badge hidden';
        }
      }
      inspB.classList.remove('hidden');
      slot.classList.add('arma-equipada');
      // Mod strip
      const modsEl = $('arma-mods-' + i);
      if (modsEl) {
        const mods = arma.mods || {};
        const anyMod = Object.keys(ARMA_MODS).some(k => mods[k]);
        if (anyMod) {
          modsEl.innerHTML = Object.entries(ARMA_MODS).map(([k, m]) =>
            `<span class="arma-mod-dot${mods[k] ? ' arma-mod-dot-on' : ''}" title="${m.label}">${m.ico}</span>`
          ).join('');
          modsEl.classList.remove('hidden');
        } else {
          modsEl.innerHTML = ''; modsEl.classList.add('hidden');
        }
      }
    } else {
      ico.classList.add('hidden');
      empt.style.display = '';
      empt.textContent = '\u2014';
      nome.textContent = i === 0 ? 'ESPAÇO I' : 'ESPAÇO II';
      stats.textContent = '';
      if (letal) { letal.textContent = ''; letal.className = 'arma-letal-badge hidden'; }
      inspB.classList.add('hidden');
      slot.classList.remove('arma-equipada');
      const modsElE = $('arma-mods-' + i);
      if (modsElE) { modsElE.innerHTML = ''; modsElE.classList.add('hidden'); }
    }
    const bolsaBtn = $('arma-bolsa-btn-' + i);
    if (bolsaBtn) bolsaBtn.classList.toggle('hidden', !(arma && arma.tipo));
  }
}

function inspecionarArma(slot) {
  const arma = state.character?.armas?.[slot];
  if (!arma || !arma.tipo) return;
  const tipo = ARMA_TIPOS[arma.tipo] || ARMA_TIPOS.outro;
  $('arma-inspect-nome').textContent = arma.nome || tipo.label;
  const img = $('arma-inspect-img');
  if (tipo.img) { img.src = tipo.img; img.style.display = ''; }
  else          { img.style.display = 'none'; }
  const mods = (arma.modificadores || []).join(', ') || '\u2014';
  $('arma-inspect-stats').innerHTML = [
    ['TIPO',           tipo.label],
    ['DANO',           arma.dano     || '\u2014'],
    ['ALCANCE',        arma.alcance  || '\u2014'],
    ['TIPO DE DANO',   arma.tipoDano === 'mortal' ? 'MORTAL' : 'NEUTRALIZADOR'],
    ['MODIFICADORES',  mods],
  ].map(([k, v]) =>
    `<div class="arma-stat-row"><span class="arma-stat-key">${k}</span><span class="arma-stat-val">${escHtml(String(v))}</span></div>`
  ).join('');
  const desc = $('arma-inspect-descricao');
  desc.textContent = arma.descricao || '';
  desc.style.display = arma.descricao ? '' : 'none';
  $('arma-inspect-popup').classList.remove('hidden');
  sfx('open');
}

function fecharArmaInspect() {
  $('arma-inspect-popup').classList.add('hidden');
  sfx('close');
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
    perigo:       '🟠 PERIGO — contato hostil confirmado!',
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

  const patente  = state.character?.patente ?? 1;
  const maxBars  = 4 + patente;
  const current  = state.character?.integrity ?? maxBars;
  // Clicking a bar sets integrity to index+1 if it was off, or index if it was on (last active)
  let newVal;
  if (index < current) {
    // Clicking an active bar — set integrity to index (turn off from here down)
    newVal = index;
  } else {
    // Clicking an inactive bar — set integrity to index+1
    newVal = index + 1;
  }
  newVal = Math.max(0, Math.min(maxBars, newVal));

  if (state.character) state.character.integrity = newVal;
  updateIntegrityDisplay(newVal);

  await persistChar({ integrity: newVal });
}

// ──────────────────────────────────────────────────────────
//  BOLSA — helpers
// ──────────────────────────────────────────────────────────
function isConsumivel(tipo) {
  return !!(ARMA_TIPOS[tipo]?.consumivel);
}

function bolsaGetMaxRows() {
  const p = state.character?.patente ?? 1;
  return BOLSA_ROWS_BY_PATENTE[p] ?? BOLSA_ROWS;
}

// ──────────────────────────────────────────────────────────
//  BOLSA — Resident Evil-style 7×5 inventory grid
// ──────────────────────────────────────────────────────────
function bolsaGetSize(item) {
  const base = ARMA_SIZES[item.tipo] || { w: 1, h: 2 };
  return item.rotated ? { w: base.h, h: base.w } : { w: base.w, h: base.h };
}

function bolsaCanPlace(items, col, row, w, h, excludeIdx = -1, rowLimit = BOLSA_ROWS) {
  if (col < 0 || row < 0 || col + w > BOLSA_COLS || row + h > rowLimit) return false;
  for (let i = 0; i < items.length; i++) {
    if (i === excludeIdx) continue;
    const s = bolsaGetSize(items[i]);
    if (col < items[i].col + s.w && col + w > items[i].col &&
        row < items[i].row + s.h && row + h > items[i].row) return false;
  }
  return true;
}

function bolsaAutoPlace(items, w, h, rowLimit = BOLSA_ROWS) {
  for (let r = 0; r <= rowLimit - h; r++)
    for (let c = 0; c <= BOLSA_COLS - w; c++)
      if (bolsaCanPlace(items, c, r, w, h, -1, rowLimit)) return { col: c, row: r };
  return null;
}

function renderBolsa() {
  const bolsa  = state.character?.bolsa || { items: [], staged: [] };
  const items  = bolsa.items  || [];
  const staged = bolsa.staged || [];
  const container = document.getElementById('bolsa-grid-container');
  const grid      = document.getElementById('bolsa-grid');
  if (!grid) return;

  // move-mode: items become click-through so the container captures clicks
  container?.classList.toggle('bolsa-move-mode', bolsaSelected !== null);

  // rebuild grid: background cells first, items on top (absolute)
  const maxRows = bolsaGetMaxRows();
  grid.innerHTML = '';
  for (let r = 0; r < BOLSA_ROWS; r++)
    for (let c = 0; c < BOLSA_COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'bolsa-gcell' + (r >= maxRows ? ' bolsa-gcell-locked' : '');
      grid.appendChild(cell);
    }

  // Ghost preview element (hidden by default)
  const ghost = document.createElement('div');
  ghost.id = 'bolsa-ghost';
  ghost.className = 'bolsa-ghost bolsa-ghost-hidden';
  grid.appendChild(ghost);

  items.forEach((item, idx) => {
    const s  = bolsaGetSize(item);
    const el = document.createElement('div');
    const isSel = idx === bolsaSelected;
    el.className   = 'bolsa-item' + (isSel ? ' bolsa-selected' : '') +
                     (item.tipoDano === 'neutralizador' ? ' bolsa-item-neutr' : '') +
                     (item.rotated ? ' bolsa-item-rotated' : '') +
                     (isConsumivel(item.tipo) ? ` bic-${item.tipo}` : '');
    el.dataset.idx = idx;
    el.style.left   = (item.col * BOLSA_STEP) + 'px';
    el.style.top    = (item.row * BOLSA_STEP) + 'px';
    el.style.width  = (s.w * BOLSA_STEP - 1) + 'px';
    el.style.height = (s.h * BOLSA_STEP - 1) + 'px';
    const tipo    = ARMA_TIPOS[item.tipo] || ARMA_TIPOS.outro;
    const icoColor = CONSUMIVEL_COR[item.tipo] || '';
    const imgHtml = tipo.img
      ? `<img src="${tipo.img}" class="bolsa-item-img" alt="" />`
      : `<span class="bolsa-item-icon" ${icoColor ? `style="color:${icoColor}"` : ''}>${tipo.ico || '◈'}</span>`;
    const rotBadge  = item.rotated ? '<div class="bolsa-rot-badge">↻</div>' : '';
    // Mini usage bar for consumables
    const hasUsos  = item.usos !== undefined;
    const usoMax   = item.usoMax || item.usos || 1;
    const usoPct   = hasUsos ? Math.max(0, Math.round((item.usos / usoMax) * 100)) : 100;
    const usoBgCol = usoPct > 60 ? '#00cc66' : usoPct > 25 ? '#ccaa00' : '#cc3333';
    const usosBadge = hasUsos
      ? `<div class="bolsa-uso-bar-wrap"><div class="bolsa-uso-bar-fill" style="width:${usoPct}%;background:${usoBgCol}"></div></div><div class="bolsa-uso-badge${item.usos === 0 ? ' bolsa-uso-zero' : ''}">${item.usos}</div>`
      : '';
    el.innerHTML = `<div class="bolsa-item-inner">${imgHtml}<div class="bolsa-item-label">${escHtml(item.nome || tipo.label)}</div>${rotBadge}${usosBadge}</div>`;
    if (bolsaSelected === null) {
      el.addEventListener('click',    e => { e.stopPropagation(); bolsaItemClick(idx); });
      el.addEventListener('dblclick', e => {
        e.stopPropagation(); bolsaSelected = idx;
        if (isConsumivel(item.tipo)) bolsaUsarItem(idx); else bolsaEquipar(0);
      });
      el.addEventListener('mouseenter', () => bolsaShowTooltip(item, el.getBoundingClientRect()));
      el.addEventListener('mouseleave', bolsaHideTooltip);
    }
    grid.appendChild(el);
  });

  // space counter
  const spaceEl = document.getElementById('bolsa-space-info');
  if (spaceEl) {
    const used     = items.reduce((acc, it) => { const s = bolsaGetSize(it); return acc + s.w * s.h; }, 0);
    const maxCells = BOLSA_COLS * maxRows;
    const patNome  = PATENTES[state.character?.patente ?? 1]?.nome || 'NIV.1';
    spaceEl.textContent = (maxCells - used) + '/' + maxCells + ' LIVRES · ' + patNome;
  }

  renderBolsaActions();

  const stagedEl = document.getElementById('bolsa-staged-list');
  if (stagedEl) {
    if (staged.length === 0) {
      stagedEl.innerHTML = '<div class="bolsa-staged-empty">— VAZIO —</div>';
    } else {
      stagedEl.innerHTML = staged.map((item, idx) => {
        const tipo = ARMA_TIPOS[item.tipo] || ARMA_TIPOS.outro;
        const s    = ARMA_SIZES[item.tipo] || { w: 1, h: 2 };
        return `<div class="bolsa-staged-item" onclick="App.bolsaTentarColocar(${idx})">
          <span class="bolsa-staged-nome">${escHtml(item.nome || tipo.label)}</span>
          <span class="bolsa-staged-tag">${s.w}&#215;${s.h}</span>
          <span class="bolsa-staged-hint">&#9658; COLOCAR</span>
        </div>`;
      }).join('');
    }
  }

  // Sync camo header badge (without re-rendering the full panel)
  const camoBadge = document.getElementById('bolsa-camo-eq-badge');
  if (camoBadge) {
    const equipadoId = state.character?.camuflagem || null;
    const eq = equipadoId ? CAMUFLAGENS.find(c => c.id === equipadoId) : null;
    camoBadge.textContent = eq ? eq.nome : 'NENHUMA';
  }
}

function renderBolsaActions() {
  const panel = document.getElementById('bolsa-actions');
  if (!panel) return;
  if (bolsaSelected === null) {
    bolsaDiscardArmed = false;
    panel.innerHTML = '<div class="bolsa-hint">&#9658; Clique para selecionar &nbsp;&middot;&nbsp; 2x usar/equipar &nbsp;&middot;&nbsp; ESC cancela</div>';
    return;
  }
  const bolsa = state.character?.bolsa || { items: [], staged: [] };
  const item  = bolsa.items[bolsaSelected];
  if (!item) { bolsaSelected = null; bolsaDiscardArmed = false; panel.innerHTML = ''; return; }
  const tipo    = ARMA_TIPOS[item.tipo] || ARMA_TIPOS.outro;
  const s       = bolsaGetSize(item);
  const isCons  = isConsumivel(item.tipo);
  const consCor = CONSUMIVEL_COR[item.tipo] || '#44aa55';
  const dropLabel = bolsaDiscardArmed ? '&#10003; CONFIRMAR' : '&#10005; DESCARTAR';
  const dropClass = bolsaDiscardArmed ? 'bolsa-btn-drop-confirm' : 'bolsa-btn-drop';

  let mainSection = '';
  if (isCons) {
    const hasUsos = item.usos !== undefined;
    const usoMax  = item.usoMax || item.usos || 1;
    const usoPct  = hasUsos ? Math.max(0, Math.round((item.usos / usoMax) * 100)) : 100;
    const usoBg   = usoPct > 60 ? '#00cc66' : usoPct > 25 ? '#ccaa00' : '#cc3333';
    const esgotado = hasUsos && item.usos <= 0;
    mainSection = `
      <div class="bolsa-uso-panel">
        <div class="bolsa-uso-panel-top">
          <span class="bolsa-uso-ico" style="color:${consCor}">${tipo.ico || '&#9672;'}</span>
          <div class="bolsa-uso-info">
            <div class="bolsa-uso-nome" style="color:${consCor}">${escHtml(item.nome || tipo.label)}</div>
            ${hasUsos ? `<div class="bolsa-uso-count">${item.usos} <span class="bolsa-uso-slash">/</span> ${usoMax} USOS</div>` : ''}
          </div>
        </div>
        ${item.descricao ? `<div class="bolsa-uso-desc">${escHtml(item.descricao)}</div>` : ''}
        ${hasUsos ? `<div class="bolsa-uso-bar-large"><div class="bolsa-uso-bar-large-fill" style="width:${usoPct}%;background:${usoBg}"></div></div>` : ''}
        <button class="bolsa-btn bolsa-btn-usar-big" style="border-color:${esgotado ? '#333' : consCor};color:${esgotado ? '#444' : consCor}"
                onclick="App.bolsaUsarItem(${bolsaSelected})" ${esgotado ? 'disabled' : ''}>
          ${esgotado ? '&#10005; ESGOTADO' : '&#9654; USAR'}
        </button>
      </div>`;
  } else {
    const slotA = state.character?.armas?.[0];
    const slotB = state.character?.armas?.[1];
    const slotALabel = slotA ? escHtml(slotA.nome || (ARMA_TIPOS[slotA.tipo]?.label) || 'EQUIPADO') : 'VAZIO';
    const slotBLabel = slotB ? escHtml(slotB.nome || (ARMA_TIPOS[slotB.tipo]?.label) || 'EQUIPADO') : 'VAZIO';
    const tdBadge = item.tipoDano === 'neutralizador'
      ? '<span class="bolsa-badge bolsa-badge-neutr">NEUTR.</span>'
      : '<span class="bolsa-badge bolsa-badge-mortal">MORTAL</span>';
    const rotLabel = item.rotated ? '&#8635; NORMAL' : '&#8635; GIRAR';
    const modsHtml = Object.entries(ARMA_MODS).map(([k, m]) => {
      const on = !!(item.mods?.[k]);
      return `<div class="bolsa-mod-slot${on ? ' bolsa-mod-filled' : ''}">
        <span class="bolsa-mod-ico">${on ? m.ico : '&#9633;'}</span>
        <span class="bolsa-mod-name">${m.label}</span>
        ${on ? '<span class="bolsa-mod-on">ON</span>' : ''}
      </div>`;
    }).join('');
    mainSection = `
      <div class="bolsa-sel-header">
        <div class="bolsa-sel-name">${escHtml(item.nome || tipo.label)}</div>
        <div class="bolsa-sel-badges">${tdBadge}<span class="bolsa-badge bolsa-badge-size">${s.w}&#215;${s.h}</span></div>
      </div>
      <div class="bolsa-sel-stats">
        ${item.dano    ? `<span><span class="bolsa-stat-k">DANO</span> ${escHtml(item.dano)}</span>` : ''}
        ${item.alcance ? `<span><span class="bolsa-stat-k">ALC.</span> ${escHtml(item.alcance)}</span>` : ''}
        ${item.descricao ? `<span class="bolsa-sel-desc">${escHtml(item.descricao)}</span>` : ''}
      </div>
      <div class="bolsa-mods-panel">
        <div class="bolsa-mods-title">&#9635; MODIFICA&#199;&#213;ES</div>
        <div class="bolsa-mods-slots">${modsHtml}</div>
      </div>
      <div class="bolsa-sel-btns">
        <button class="bolsa-btn bolsa-btn-equip" onclick="App.bolsaEquipar(0)">
          <span class="bolsa-btn-slot-label">I</span> ${slotALabel === 'VAZIO' ? 'EQUIPAR' : slotALabel}
        </button>
        <button class="bolsa-btn bolsa-btn-equip" onclick="App.bolsaEquipar(1)">
          <span class="bolsa-btn-slot-label">II</span> ${slotBLabel === 'VAZIO' ? 'EQUIPAR' : slotBLabel}
        </button>
        <button class="bolsa-btn bolsa-btn-rotate" onclick="App.bolsaGirar()">${rotLabel} <span class="bolsa-kbd">R</span></button>
      </div>`;
  }

  panel.innerHTML = `
    ${mainSection}
    <div class="bolsa-sel-btns bolsa-btns-bottom">
      <button class="bolsa-btn bolsa-btn-transfer" onclick="App.bolsaAbrirTransferencia()">&#8644; TRANSFERIR</button>
      <button class="bolsa-btn ${dropClass}" onclick="App.bolsaJogarFora()">${dropLabel}</button>
      <button class="bolsa-btn bolsa-btn-cancel" onclick="App.bolsaDeselecionar()">CANCELAR <span class="bolsa-kbd">ESC</span></button>
    </div>
    ${!isCons ? '<div class="bolsa-move-hint">&#9660; Clique no grid para mover</div>' : ''}
  `;
}
function bolsaItemClick(idx) {
  bolsaSelected = (bolsaSelected === idx) ? null : idx;
  renderBolsa();
}

function bolsaDeselecionar() {
  bolsaSelected     = null;
  bolsaDiscardArmed = false;
  bolsaHideGhost();
  bolsaHideTooltip();
  renderBolsa();
}

function bolsaHideGhost() {
  const ghost = document.getElementById('bolsa-ghost');
  if (ghost) ghost.className = 'bolsa-ghost bolsa-ghost-hidden';
  const grid = document.getElementById('bolsa-grid');
  if (grid) grid.querySelectorAll('.bolsa-gcell').forEach(c => {
    c.classList.remove('bolsa-gcell-hi-ok', 'bolsa-gcell-hi-bad');
  });
}

function bolsaUpdateGhost(col, row) {
  const grid  = document.getElementById('bolsa-grid');
  const ghost = document.getElementById('bolsa-ghost');
  if (!grid || !ghost || bolsaSelected === null) return;
  const bolsa = state.character?.bolsa;
  if (!bolsa) return;
  const item = bolsa.items[bolsaSelected];
  if (!item) return;
  const s   = bolsaGetSize(item);
  const maxRows = bolsaGetMaxRows();
  const gc  = Math.max(0, Math.min(BOLSA_COLS - s.w, col));
  const gr  = Math.max(0, Math.min(maxRows - s.h, row));
  const ok  = bolsaCanPlace(bolsa.items, gc, gr, s.w, s.h, bolsaSelected, maxRows);
  ghost.style.left   = (gc * BOLSA_STEP) + 'px';
  ghost.style.top    = (gr * BOLSA_STEP) + 'px';
  ghost.style.width  = (s.w * BOLSA_STEP - 1) + 'px';
  ghost.style.height = (s.h * BOLSA_STEP - 1) + 'px';
  ghost.className    = 'bolsa-ghost ' + (ok ? 'bolsa-ghost-ok' : 'bolsa-ghost-bad');
  grid.querySelectorAll('.bolsa-gcell').forEach((cell, i) => {
    const r = Math.floor(i / BOLSA_COLS), c = i % BOLSA_COLS;
    const hit = c >= gc && c < gc + s.w && r >= gr && r < gr + s.h;
    cell.classList.toggle('bolsa-gcell-hi-ok',  hit && ok);
    cell.classList.toggle('bolsa-gcell-hi-bad', hit && !ok);
  });
}

function bolsaShowTooltip(item, rect) {
  let tt = document.getElementById('bolsa-tooltip');
  if (!tt) {
    tt = document.createElement('div');
    tt.id = 'bolsa-tooltip';
    tt.className = 'bolsa-tooltip';
    document.getElementById('tab-panel-bolsa')?.appendChild(tt);
  }
  const tipo = ARMA_TIPOS[item.tipo] || ARMA_TIPOS.outro;
  const s    = bolsaGetSize(item);
  const td   = item.tipoDano || 'mortal';
  const metaSuffix = isConsumivel(item.tipo) ? '' : ` &middot; <span class="btt-td-${td}">${td.toUpperCase()}</span>`;
  tt.innerHTML = `
    <div class="btt-name">${escHtml(item.nome || tipo.label)}</div>
    <div class="btt-meta">${tipo.label} &middot; ${s.w}&times;${s.h}${metaSuffix}</div>
    ${item.usos !== undefined ? `<div class="btt-row"><span class="btt-k">USOS</span><span class="btt-v">${item.usos}${item.usoMax ? '/' + item.usoMax : ''}</span></div>` : ''}
    ${item.dano    ? `<div class="btt-row"><span class="btt-k">DANO</span><span class="btt-v">${escHtml(item.dano)}</span></div>` : ''}
    ${item.alcance ? `<div class="btt-row"><span class="btt-k">ALC.</span><span class="btt-v">${escHtml(item.alcance)}</span></div>` : ''}
    ${item.descricao ? `<div class="btt-desc">${escHtml(item.descricao)}</div>` : ''}
  `;
  tt.classList.remove('bolsa-tooltip-hidden');
  const wrap = document.getElementById('tab-panel-bolsa');
  if (wrap) {
    const wRect = wrap.getBoundingClientRect();
    const ttH   = tt.offsetHeight || 80;
    let left = rect.left - wRect.left;
    let top  = rect.top  - wRect.top - ttH - 6;
    if (top < 4) top = rect.bottom - wRect.top + 6;
    tt.style.left = Math.max(2, Math.min(wRect.width - 160, left)) + 'px';
    tt.style.top  = top + 'px';
  }
}

function bolsaHideTooltip() {
  const tt = document.getElementById('bolsa-tooltip');
  if (tt) tt.classList.add('bolsa-tooltip-hidden');
}

function bolsaCellClick(col, row) {
  if (bolsaSelected === null) return;
  const bolsa = state.character?.bolsa;
  if (!bolsa) return;
  const items = [...bolsa.items];
  const item  = items[bolsaSelected];
  const s     = bolsaGetSize(item);
  if (bolsaCanPlace(items, col, row, s.w, s.h, bolsaSelected, bolsaGetMaxRows())) {
    items[bolsaSelected] = { ...item, col, row };
    state.character.bolsa.items = items;
    persistChar({ bolsa: state.character.bolsa });
    bolsaSelected     = null;
    bolsaDiscardArmed = false;
    sfx('select');
    bolsaHideGhost();
    renderBolsa();
    // try to place staged items that may now fit
    bolsaAutoPlaceStaged();
  } else {
    showToast('Sem espaço aqui.', 'error', 900);
    renderBolsa();
  }
}

function setupBolsaGrid() {
  const container = document.getElementById('bolsa-grid-container');
  if (!container || container._bolsaReady) return;
  container._bolsaReady = true;

  // Click: place item in move mode
  container.addEventListener('click', e => {
    if (bolsaSelected === null) return;
    const grid = document.getElementById('bolsa-grid');
    if (!grid) return;
    const rect = grid.getBoundingClientRect();
    const col  = Math.floor((e.clientX - rect.left) / BOLSA_STEP);
    const row  = Math.floor((e.clientY - rect.top)  / BOLSA_STEP);
    if (col >= 0 && col < BOLSA_COLS && row >= 0 && row < BOLSA_ROWS)
      bolsaCellClick(col, row);
  });

  // Mousemove: ghost preview
  container.addEventListener('mousemove', e => {
    if (bolsaSelected === null) return;
    const grid = document.getElementById('bolsa-grid');
    if (!grid) return;
    const rect = grid.getBoundingClientRect();
    bolsaUpdateGhost(
      Math.floor((e.clientX - rect.left) / BOLSA_STEP),
      Math.floor((e.clientY - rect.top)  / BOLSA_STEP)
    );
  });

  // Mouseleave: hide ghost
  container.addEventListener('mouseleave', bolsaHideGhost);

  // Keyboard shortcuts scoped to bolsa tab
  if (_bolsaKeyHandler) document.removeEventListener('keydown', _bolsaKeyHandler);
  _bolsaKeyHandler = e => {
    if (state.currentTab !== 'bolsa') return;
    if (e.key === 'Escape') { e.preventDefault(); bolsaDeselecionar(); }
    if ((e.key === 'r' || e.key === 'R') && bolsaSelected !== null) { e.preventDefault(); bolsaGirar(); }
  };
  document.addEventListener('keydown', _bolsaKeyHandler);
}

async function bolsaEquipar(slot) {
  if (bolsaSelected === null || !state.character?.bolsa) return;
  const bolsa = state.character.bolsa;
  const items = [...bolsa.items];
  const item  = items[bolsaSelected];
  if (!item) return;
  if (isConsumivel(item.tipo)) {
    showToast('Consumíveis não podem ser equipados.', 'error', 1500);
    bolsaSelected = null; renderBolsa(); return;
  }
  const armas = [...(state.character.armas || [null, null])];
  while (armas.length < 2) armas.push(null);

  // Weapon currently in the target slot — will be swapped back to bolsa
  const oldArma = (armas[slot] && armas[slot].tipo) ? armas[slot] : null;

  // Strip grid metadata, keep weapon props
  const { col: _c, row: _r, rotated: _rot, id: _id, ...weaponData } = item;
  armas[slot] = weaponData;

  // Remove selected item from bolsa (freeing its grid space)
  items.splice(bolsaSelected, 1);
  bolsaSelected = null;

  // If there was a weapon in the slot, put it back in the bolsa
  if (oldArma) {
    const base = ARMA_SIZES[oldArma.tipo] || { w: 1, h: 2 };
    const pos  = bolsaAutoPlace(items, base.w, base.h, bolsaGetMaxRows());
    if (pos) {
      items.push({ ...oldArma, col: pos.col, row: pos.row, rotated: false });
      showToast(`${oldArma.nome || 'Item'} devolvido à bolsa.`, 'info', 1800);
    } else {
      const staged = [...(bolsa.staged || [])]; staged.push(oldArma);
      state.character.bolsa.staged = staged;
      showToast(`Sem espaço! ${oldArma.nome || 'Item'} em espera.`, 'error', 2200);
    }
  }

  state.character.armas       = armas;
  state.character.bolsa.items = items;
  await persistChar({ bolsa: state.character.bolsa });
  if (firebaseOk && auth?.currentUser && state.codename) {
    try {
      await updateDoc(doc(db, 'characters', state.codename), { armas, updatedAt: serverTimestamp() });
    } catch (_) {}
  }
  updateArmaDisplay(armas);
  renderBolsa();
  sfx('select');
  showToast('Equipado no SLOT ' + (slot + 1) + '.', 'success', 1500);
}

async function bolsaGirar() {
  if (bolsaSelected === null || !state.character?.bolsa) return;
  const items  = [...state.character.bolsa.items];
  const item   = items[bolsaSelected];
  const newRot = !item.rotated;
  const base   = ARMA_SIZES[item.tipo] || { w: 1, h: 2 };
  const nw     = newRot ? base.h : base.w;
  const nh     = newRot ? base.w : base.h;
  if (bolsaCanPlace(items, item.col, item.row, nw, nh, bolsaSelected, bolsaGetMaxRows())) {
    items[bolsaSelected] = { ...item, rotated: newRot };
    state.character.bolsa.items = items;
    await persistChar({ bolsa: state.character.bolsa });
    sfx('select');
  } else {
    showToast('Sem espaço para girar.', 'error', 1500);
  }
  renderBolsa();
}

async function bolsaJogarFora() {
  if (bolsaSelected === null || !state.character?.bolsa) return;
  // Two-step confirm: first click arms, second fires
  if (!bolsaDiscardArmed) {
    bolsaDiscardArmed = true;
    renderBolsaActions();
    setTimeout(() => { bolsaDiscardArmed = false; renderBolsaActions(); }, 2500);
    return;
  }
  const items = [...state.character.bolsa.items];
  items.splice(bolsaSelected, 1);
  bolsaSelected     = null;
  bolsaDiscardArmed = false;
  state.character.bolsa.items = items;
  await persistChar({ bolsa: state.character.bolsa });
  renderBolsa();
  sfx('close');
  showToast('Item descartado.', 'success', 1500);
  bolsaAutoPlaceStaged();
}

async function bolsaUsarItem(idx) {
  if (!state.character?.bolsa) return;
  const items = [...state.character.bolsa.items];
  const item  = items[idx];
  if (!item || item.usos === undefined) return;
  if (item.usos <= 0) { showToast('Sem usos restantes.', 'error', 1500); return; }
  const newUsos = item.usos - 1;
  sfx('select');
  if (newUsos <= 0) {
    items.splice(idx, 1);
    bolsaSelected = null;
    showToast(`${item.nome || 'Item'} esgotado!`, 'success', 1800);
  } else {
    items[idx] = { ...item, usos: newUsos };
    showToast(`${item.nome || 'Item'} usado — ${newUsos} restante(s).`, 'success', 1800);
  }
  state.character.bolsa.items = items;
  await persistChar({ bolsa: state.character.bolsa });
  renderBolsa();
  bolsaAutoPlaceStaged();
}

async function bolsaAutoPlaceStaged() {
  if (!state.character?.bolsa) return;
  const staged = [...(state.character.bolsa.staged || [])];
  if (staged.length === 0) return;
  const items = [...(state.character.bolsa.items || [])];
  let changed = false;
  let i = 0;
  while (i < staged.length) {
    const item = staged[i];
    const base = ARMA_SIZES[item.tipo] || { w: 1, h: 2 };
    const pos  = bolsaAutoPlace(items, base.w, base.h, bolsaGetMaxRows());
    if (pos) {
      items.push({ ...item, col: pos.col, row: pos.row, rotated: false });
      staged.splice(i, 1);
      changed = true;
      showToast(`◈ ${item.nome || 'Item'} entrou na bolsa!`, 'success', 2000);
    } else {
      i++;
    }
  }
  if (changed) {
    state.character.bolsa.items  = items;
    state.character.bolsa.staged = staged;
    await persistChar({ bolsa: state.character.bolsa });
    renderBolsa();
  }
}

async function bolsaTentarColocar(stagedIdx) {
  if (!state.character?.bolsa) return;
  const bolsa  = state.character.bolsa;
  const staged = [...(bolsa.staged || [])];
  const item   = staged[stagedIdx];
  if (!item) return;
  const base = ARMA_SIZES[item.tipo] || { w: 1, h: 2 };
  const pos  = bolsaAutoPlace(bolsa.items || [], base.w, base.h, bolsaGetMaxRows());
  if (!pos) { showToast('Sem espaço na bolsa.', 'error', 2000); return; }
  const items = [...(bolsa.items || [])];
  items.push({ ...item, col: pos.col, row: pos.row, rotated: false });
  staged.splice(stagedIdx, 1);
  state.character.bolsa.items  = items;
  state.character.bolsa.staged = staged;
  await persistChar({ bolsa: state.character.bolsa });
  renderBolsa();
  sfx('select');
}

// Player: send equipped weapon from arma slot back to bolsa
async function armaParaBolsa(slot) {
  const arma = state.character?.armas?.[slot];
  if (!arma || !arma.tipo) return;
  const bolsa  = state.character.bolsa || { items: [], staged: [] };
  const items  = [...(bolsa.items  || [])];
  const staged = [...(bolsa.staged || [])];
  const base   = ARMA_SIZES[arma.tipo] || { w: 1, h: 2 };
  const pos    = bolsaAutoPlace(items, base.w, base.h, bolsaGetMaxRows());
  const armas  = [...(state.character.armas || [null, null])];
  while (armas.length < 2) armas.push(null);
  armas[slot]  = null;
  if (pos) {
    items.push({ ...arma, col: pos.col, row: pos.row, rotated: false });
    showToast(`${arma.nome || 'Item'} → bolsa.`, 'success', 1500);
  } else {
    staged.push(arma);
    showToast(`Sem espaço! ${arma.nome || 'Item'} em espera.`, 'error', 2000);
  }
  state.character.bolsa = { ...bolsa, items, staged };
  state.character.armas = armas;
  await persistChar({ bolsa: state.character.bolsa });
  if (firebaseOk && auth?.currentUser && state.codename) {
    try {
      await updateDoc(doc(db, 'characters', state.codename), { armas, updatedAt: serverTimestamp() });
    } catch (_) {}
  }
  updateArmaDisplay(armas);
  if (state.currentTab === 'bolsa') renderBolsa();
  sfx('select');
}

// GM: send weapon to a player's bolsa
async function gmEnviarParaBolsa(codename) {
  const g = id => document.getElementById(id);
  const tipo     = g(`gm-bolsa-tipo-${codename}`)?.value;
  const nome     = g(`gm-bolsa-nome-${codename}`)?.value.trim();
  const dano     = g(`gm-bolsa-dano-${codename}`)?.value.trim();
  const alcance  = g(`gm-bolsa-alcance-${codename}`)?.value.trim();
  const tipoDano = g(`gm-bolsa-tdano-${codename}`)?.value || 'mortal';
  const desc     = g(`gm-bolsa-desc-${codename}`)?.value.trim();
  const usosRaw  = g(`gm-bolsa-usos-${codename}`)?.value;
  const usos     = (usosRaw && isConsumivel(tipo)) ? Math.max(1, parseInt(usosRaw, 10) || 1) : undefined;
  if (!tipo) return;

  let currentBolsa = { items: [], staged: [] };
  if (firebaseOk) {
    try {
      const snap = await getDoc(doc(db, 'characters', codename));
      if (snap.exists()) currentBolsa = snap.data().bolsa || { items: [], staged: [] };
    } catch (_) {}
  } else {
    const ch = LocalDB.getChar(codename);
    if (ch) currentBolsa = ch.bolsa || { items: [], staged: [] };
  }
  const items  = [...(currentBolsa.items  || [])];
  const staged = [...(currentBolsa.staged || [])];
  const newItem = {
    id: Date.now().toString(36), tipo, nome, dano, alcance, tipoDano, descricao: desc,
    modificadores: [], rotated: false,
    ...(usos !== undefined ? { usos, usoMax: usos } : {})
  };
  const base = ARMA_SIZES[tipo] || { w: 1, h: 2 };
  const pos  = bolsaAutoPlace(items, base.w, base.h, BOLSA_ROWS); // GM bypasses patente limit
  if (pos) {
    items.push({ ...newItem, col: pos.col, row: pos.row });
    showToast(codename + ': item colocado na bolsa.', 'success', 1500);
  } else {
    staged.push(newItem);
    showToast(codename + ': bolsa cheia — item em fila.', 'error', 2500);
  }
  await gmUpdateChar(codename, { bolsa: { items, staged } });
  // clear form
  ['nome','dano','alcance','desc'].forEach(k => { const el = g(`gm-bolsa-${k}-${codename}`); if (el) el.value = ''; });
}

async function gmRemoverDaBolsa(codename, source, idx) {
  let currentBolsa = { items: [], staged: [] };
  if (firebaseOk) {
    try {
      const snap = await getDoc(doc(db, 'characters', codename));
      if (snap.exists()) currentBolsa = snap.data().bolsa || { items: [], staged: [] };
    } catch (_) {}
  } else {
    const ch = LocalDB.getChar(codename);
    if (ch) currentBolsa = ch.bolsa || { items: [], staged: [] };
  }
  const items  = [...(currentBolsa.items  || [])];
  const staged = [...(currentBolsa.staged || [])];
  if (source === 'grid') items.splice(idx, 1);
  else staged.splice(idx, 1);
  await gmUpdateChar(codename, { bolsa: { items, staged } });
  sfx('select');
}

function buildGMBolsaHtml(char) {
  const bolsa  = char.bolsa  || { items: [], staged: [] };
  const items  = bolsa.items  || [];
  const staged = bolsa.staged || [];
  const armaOpts = Object.entries(ARMA_TIPOS).filter(([,v]) => !v.consumivel).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join('');
  const consOpts = Object.entries(ARMA_TIPOS).filter(([,v]) =>  v.consumivel).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join('');
  const tipoOpts = `<optgroup label="Armamento">${armaOpts}</optgroup><optgroup label="Consumíveis">${consOpts}</optgroup>`;
  const allRows = [
    ...items.map((it, i)  => ({ ...it, _src: 'grid',   _idx: i })),
    ...staged.map((it, i) => ({ ...it, _src: 'staged', _idx: i }))
  ];
  const listHtml = allRows.length === 0
    ? '<div class="bolsa-staged-empty" style="padding:4px">Bolsa vazia.</div>'
    : allRows.map(it => {
        const tipo = ARMA_TIPOS[it.tipo] || ARMA_TIPOS.outro;
        return `<div class="gm-bolsa-row">
          <span class="gm-bolsa-nome">${escHtml(it.nome || tipo.label)}</span>
          <span class="gm-bolsa-loc">[${it._src === 'grid' ? 'GRID' : 'FILA'}]</span>
          <button class="gm-bolsa-rm" onclick="App.gmRemoverDaBolsa('${char.codename}','${it._src}',${it._idx})">&#10005;</button>
        </div>`;
      }).join('');
  return `
    <div class="gm-bolsa-list">${listHtml}</div>
    <div class="gm-bolsa-form">
      <div class="gm-bolsa-form-row">
        <select id="gm-bolsa-tipo-${char.codename}" class="gm-select">${tipoOpts}</select>
        <input  id="gm-bolsa-nome-${char.codename}" class="gm-text-input" placeholder="nome..." type="text" />
      </div>
      <div class="gm-bolsa-form-row">
        <input id="gm-bolsa-dano-${char.codename}"    class="gm-text-input" placeholder="dano..."    type="text" />
        <input id="gm-bolsa-alcance-${char.codename}" class="gm-text-input" placeholder="alcance..." type="text" />
      </div>
      <div class="gm-bolsa-form-row">
        <select id="gm-bolsa-tdano-${char.codename}" class="gm-select">
          <option value="mortal">MORTAL</option><option value="neutralizador">NEUTRALIZADOR</option>
        </select>
        <input id="gm-bolsa-desc-${char.codename}" class="gm-text-input" placeholder="descrição..." type="text" />
      </div>
      <div class="gm-bolsa-form-row">
        <input id="gm-bolsa-usos-${char.codename}" class="gm-text-input" placeholder="usos (consumíveis)" type="number" min="1" max="99" />
      </div>
      <button class="gm-bolsa-send" onclick="App.gmEnviarParaBolsa('${char.codename}')">&#43; ENVIAR PARA BOLSA</button>
    </div>`;
}

// ──────────────────────────────────────────────────────────
//  LOOT DE MISSÃO — ferramenta do GM
// ──────────────────────────────────────────────────────────
function renderGMLootList() {
  const el = document.getElementById('gm-loot-items');
  if (!el) return;
  if (_lootPool.length === 0) {
    el.innerHTML = '<div class="gm-fitas-empty">Nenhum item no loot.</div>';
    return;
  }
  const operOpts = _gmCharsList.length
    ? _gmCharsList.map(c => `<option value="${escHtml(c.codename)}">${escHtml(c.codename)}</option>`).join('')
    : '';
  el.innerHTML = _lootPool.map((it, idx) => {
    const tipo = ARMA_TIPOS[it.tipo] || ARMA_TIPOS.outro;
    const usosInfo = it.usos !== undefined ? ` (${it.usos})` : '';
    return `<div class="gm-loot-row">
      <span class="gm-loot-nome">${escHtml(it.nome || tipo.label)}${usosInfo}</span>
      <select class="gm-select gm-loot-target" id="gm-loot-target-${idx}" style="max-width:92px">
        <option value="">TODOS</option>${operOpts}
      </select>
      <button class="gm-bolsa-rm" onclick="App.gmLootRemoveItem(${idx})">&#10005;</button>
    </div>`;
  }).join('');
}

function gmLootAddItem() {
  const g = id => document.getElementById(id);
  const tipo     = g('gm-loot-tipo')?.value;
  const nome     = g('gm-loot-nome')?.value.trim();
  const dano     = g('gm-loot-dano')?.value.trim();
  const alcance  = g('gm-loot-alcance')?.value.trim();
  const tipoDano = g('gm-loot-tdano')?.value || 'mortal';
  const desc     = g('gm-loot-desc')?.value.trim();
  const usosRaw  = g('gm-loot-usos')?.value;
  const usos     = (usosRaw && isConsumivel(tipo)) ? Math.max(1, parseInt(usosRaw, 10) || 1) : undefined;
  if (!tipo) return;
  _lootPool.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    tipo, nome, dano, alcance, tipoDano, descricao: desc,
    modificadores: [], rotated: false,
    ...(usos !== undefined ? { usos, usoMax: usos } : {})
  });
  renderGMLootList();
  ['nome','dano','alcance','desc'].forEach(k => { const el = g('gm-loot-' + k); if (el) el.value = ''; });
  if (g('gm-loot-usos')) g('gm-loot-usos').value = '';
}

function gmLootRemoveItem(idx) {
  _lootPool.splice(idx, 1);
  renderGMLootList();
}

async function gmLootDistribuir() {
  if (_lootPool.length === 0) { showToast('Loot vazio.', 'error'); return; }
  // Collect targets from DOM before clearing
  const assignments = _lootPool.map((item, idx) => {
    const targetEl = document.getElementById('gm-loot-target-' + idx);
    return { item, target: targetEl ? targetEl.value.trim() : '' };
  });
  let sent = 0;
  for (const { item, target } of assignments) {
    const targets = target
      ? [target]
      : _gmCharsList.map(c => c.codename);
    if (targets.length === 0) { showToast('Sem operadores para distribuir.', 'error'); return; }
    for (const codename of targets) {
      let currentBolsa = { items: [], staged: [] };
      if (firebaseOk) {
        try {
          const snap = await getDoc(doc(db, 'characters', codename));
          if (snap.exists()) currentBolsa = snap.data().bolsa || { items: [], staged: [] };
        } catch (_) {}
      }
      const items  = [...(currentBolsa.items  || [])];
      const staged = [...(currentBolsa.staged || [])];
      const base   = ARMA_SIZES[item.tipo] || { w: 1, h: 2 };
      const pos    = bolsaAutoPlace(items, base.w, base.h, BOLSA_ROWS); // GM bypasses patente limit
      const newItem = { ...item, id: item.id + '_' + codename.slice(0,3) };
      if (pos) { items.push({ ...newItem, col: pos.col, row: pos.row }); }
      else      { staged.push(newItem); }
      await gmUpdateChar(codename, { bolsa: { items, staged } });
      sent++;
    }
  }
  _lootPool = [];
  renderGMLootList();
  sfx('select');
  showToast(`Loot distribuído — ${sent} envio(s).`, 'success', 2500);
}

// ──────────────────────────────────────────────────────────
//  TRANSFERÊNCIA P2P ENTRE BOLSAS
// ──────────────────────────────────────────────────────────
async function bolsaAbrirTransferencia() {
  if (bolsaSelected === null) return;
  const panel = document.getElementById('bolsa-actions');
  if (!panel) return;
  panel.innerHTML = '<div class="bolsa-hint">Carregando operadores...</div>';
  let chars = [];
  if (firebaseOk) {
    try {
      const snap = await getDocs(collection(db, 'characters'));
      snap.forEach(d => { const data = d.data(); if (data.codename && data.codename !== state.codename) chars.push(data); });
    } catch (e) {
      showToast('Erro ao carregar operadores.', 'error'); renderBolsaActions(); return;
    }
  }
  if (chars.length === 0) {
    panel.innerHTML = `<div class="bolsa-hint">Nenhum outro operador dispon\u00edvel.</div>
      <button class="bolsa-btn bolsa-btn-cancel" onclick="App.renderBolsaActionsPublic()">CANCELAR</button>`;
    return;
  }
  const listaHtml = chars.map(c =>
    `<div class="bolsa-transfer-row" onclick="App.bolsaTransferir('${escHtml(c.codename)}')">
      <span class="bolsa-transfer-nome">${escHtml(c.codename)}</span>
      <span class="bolsa-transfer-hint">&#9658; ENVIAR</span>
    </div>`
  ).join('');
  panel.innerHTML = `
    <div class="bolsa-sel-name" style="margin-bottom:6px">&#8644; ENVIAR PARA OPERADOR</div>
    <div class="bolsa-transfer-list">${listaHtml}</div>
    <button class="bolsa-btn bolsa-btn-cancel" onclick="App.renderBolsaActionsPublic()">CANCELAR <span class="bolsa-kbd">ESC</span></button>
  `;
}

// Public wrapper so HTML onclick can call it
function renderBolsaActionsPublic() { renderBolsaActions(); }

async function bolsaTransferir(targetCodename) {
  if (bolsaSelected === null || !state.character?.bolsa) return;
  if (!targetCodename) return;
  const items = [...state.character.bolsa.items];
  const item  = items[bolsaSelected];
  if (!item) return;

  // Fetch target's bolsa
  let targetBolsa = { items: [], staged: [] };
  if (firebaseOk) {
    try {
      const snap = await getDoc(doc(db, 'characters', targetCodename));
      if (snap.exists()) targetBolsa = snap.data().bolsa || { items: [], staged: [] };
    } catch (e) { showToast('Erro ao acessar bolsa do alvo.', 'error'); return; }
  }

  // Strip grid metadata, keep item data
  const { col: _c, row: _r, ...itemData } = item;
  const targetStaged = [...(targetBolsa.staged || [])];
  targetStaged.push({ ...itemData, rotated: false });

  // Remove from sender
  items.splice(bolsaSelected, 1);
  bolsaSelected = null;
  state.character.bolsa.items = items;
  await persistChar({ bolsa: state.character.bolsa });

  // Write to target
  if (firebaseOk) {
    try {
      await updateDoc(doc(db, 'characters', targetCodename), {
        bolsa: { ...targetBolsa, staged: targetStaged },
        updatedAt: serverTimestamp()
      });
    } catch (e) { showToast('Erro ao enviar item ao operador.', 'error'); return; }
  }
  renderBolsa();
  sfx('select');
  showToast(`Item transferido para ${targetCodename}.`, 'success', 2000);
}

// ──────────────────────────────────────────────────────────
//  CAMUFLAGEM
// ──────────────────────────────────────────────────────────

function bolsaCamoToggle() {
  const body    = document.getElementById('bolsa-camo-body');
  const chevron = document.getElementById('bolsa-camo-chevron');
  if (!body) return;
  const opening = body.classList.toggle('hidden');
  // classList.toggle returns true when classList has the class AFTER toggling
  // So 'opening' = false means we just removed hidden = opened it
  if (!opening) {
    chevron && (chevron.textContent = '▾');
    renderCamuflagem();
  } else {
    chevron && (chevron.textContent = '►');
    _camoSelected = null;
  }
}

function bolsaCamoSelect(id) {
  _camoSelected = (_camoSelected === id) ? null : id;
  renderCamuflagem();
}

function renderCamuflagem() {
  const el = document.getElementById('bolsa-camo-body');
  if (!el || el.classList.contains('hidden')) return;

  const equipadoId = state.character?.camuflagem || null;
  const equipado   = equipadoId ? CAMUFLAGENS.find(c => c.id === equipadoId) : null;

  // Update header badge
  const badge = document.getElementById('bolsa-camo-eq-badge');
  if (badge) badge.textContent = equipado ? equipado.nome : 'NENHUMA';

  // Equipped panel
  const eqHtml = equipado
    ? `<div class="bolsa-camo-equipped bolsa-camo-equip-show" id="bolsa-camo-eq-panel"
            style="--cc:${equipado.cor}; --ca:${equipado.acento}">
        <div class="bolsa-camo-eq-icon" style="background:${equipado.gradient || equipado.cor}; color:${equipado.gradient ? 'transparent' : equipado.acento}; -webkit-background-clip:${equipado.gradient ? 'text' : 'unset'}; background-clip:${equipado.gradient ? 'text' : 'unset'}; border:1px solid ${equipado.acento}44">
          <span style="background:${equipado.gradient || 'none'}; -webkit-background-clip:${equipado.gradient ? 'text' : 'unset'}; background-clip:${equipado.gradient ? 'text' : 'unset'}; color:${equipado.gradient ? 'transparent' : equipado.acento}; font-weight:bold">${escHtml(equipado.iconeChar)}</span>
        </div>
        <div class="bolsa-camo-eq-info">
          <div class="bolsa-camo-eq-nome">${fmtCamo(equipado.nome)}</div>
          <div class="bolsa-camo-eq-amb">${fmtCamo(equipado.ambiente)}</div>
          <div class="bolsa-camo-index-bar">
            <div class="bolsa-camo-bar-fill" style="width:${equipado.camo}%; background:${equipado.gradient || equipado.acento}"></div>
            <div class="bolsa-camo-bar-label" style="color:${equipado.acento}">${equipado.camo}%</div>
          </div>
          <div class="bolsa-camo-eq-efeito" style="color:${equipado.acento}">${fmtCamo(equipado.efeito)}</div>
        </div>
        <button class="bolsa-camo-remove-btn" onclick="App.equiparCamuflagem(null)">REMOVER</button>
      </div>`
    : `<div class="bolsa-camo-nenhuma" id="bolsa-camo-eq-panel">
        <span class="bolsa-camo-nenhuma-ico">&#9671;</span>
        NENHUMA CAMUFLAGEM EQUIPADA
      </div>`;

  // Camo list — split into unlocked and locked
  const unlockedHtml = [];
  const lockedHtml   = [];

  CAMUFLAGENS.forEach(c => {
    const isReleased = camoReleasedState.includes(c.id);
    const isEq  = c.id === equipadoId;
    const isSel = c.id === _camoSelected;
    const camoColor = camoIndexColor(c.camo);

    if (!isReleased) {
      // Locked entry — no expand, no equip
      lockedHtml.push(`<div class="bolsa-camo-card bolsa-camo-locked-card">
        <div class="bolsa-camo-card-row">
          <div class="bolsa-camo-card-icon bolsa-camo-icon-locked">&#128274;</div>
          <div class="bolsa-camo-card-info">
            <div class="bolsa-camo-card-nome bolsa-camo-nome-locked">[ACESSO RESTRITO]</div>
            <div class="bolsa-camo-card-amb bolsa-camo-amb-locked">BLOQUEADA PELO GM</div>
          </div>
          <div class="bolsa-camo-card-pct bolsa-camo-pct-locked">???%</div>
        </div>
      </div>`);
      return;
    }

    unlockedHtml.push(`<div class="bolsa-camo-card${isEq ? ' equipped' : ''}${isSel ? ' expanded' : ''}"
                 onclick="App.bolsaCamoSelect('${c.id}')">
      <div class="bolsa-camo-card-row">
        <div class="bolsa-camo-card-icon" style="background:${c.cor}; border-color:${c.acento}22; position:relative; overflow:hidden">
          ${c.gradient
            ? `<span style="background:${c.gradient}; -webkit-background-clip:text; background-clip:text; color:transparent; font-weight:bold; font-size:11px; letter-spacing:0.02em">${escHtml(c.iconeChar)}</span>`
            : `<span style="color:${c.acento}; font-weight:bold">${escHtml(c.iconeChar)}</span>`
          }
        </div>
        <div class="bolsa-camo-card-info">
          <div class="bolsa-camo-card-nome">${fmtCamo(c.nome)}${isEq ? ' <span class="bolsa-camo-eq-tag">EQUIPADA</span>' : ''}</div>
          <div class="bolsa-camo-card-amb">${fmtCamo(c.ambiente)}</div>
        </div>
        <div class="bolsa-camo-card-pct" style="color:${camoColor}">${c.camo}%</div>
      </div>
      ${isSel ? `
        <div class="bolsa-camo-card-detail" style="border-color:${c.acento}33">
          <div class="bolsa-camo-index-bar" style="margin-bottom:8px">
            <div class="bolsa-camo-bar-fill" style="width:${c.camo}%; background:${c.gradient || c.acento}"></div>
            <div class="bolsa-camo-bar-label" style="color:${camoColor}">${c.camo}% ÍNDICE</div>
          </div>
          <div class="bolsa-camo-detail-efeito" style="color:${c.acento}cc">${fmtCamo(c.efeito)}</div>
          <div class="bolsa-camo-detail-sabor">${fmtCamo(c.sabor)}</div>
          ${!isEq
            ? `<button class="bolsa-camo-equip-btn" style="border-color:${c.acento}; ${c.gradient ? `background:${c.gradient}; -webkit-background-clip:text; background-clip:text; color:transparent;` : `color:${c.acento};`}"
                       onclick="event.stopPropagation(); App.equiparCamuflagem('${c.id}')">
                 &#9658; EQUIPAR
               </button>`
            : `<button class="bolsa-camo-equip-btn bolsa-camo-equipped-btn"
                       onclick="event.stopPropagation(); App.equiparCamuflagem(null)">
                 &#9724; REMOVER
               </button>`
          }
        </div>` : ''}
    </div>`);
  });

  const allListHtml = unlockedHtml.join('') +
    (lockedHtml.length ? `<div class="bolsa-camo-locked-divider">&#128274; BLOQUEADAS (${lockedHtml.length})</div>` + lockedHtml.join('') : '');

  const unlockedCount = unlockedHtml.length;
  el.innerHTML = `
    <div class="bolsa-camo-eq-wrap">${eqHtml}</div>
    <div class="bolsa-camo-list-title">&#9658; CAMUFLAGENS DISPONÍVEIS <span class="bolsa-camo-count">${unlockedCount}/${CAMUFLAGENS.length}</span></div>
    <div class="bolsa-camo-list">${allListHtml}</div>
  `;
}

function camoIndexColor(pct) {
  if (pct >= 80) return '#44cc66';
  if (pct >= 65) return '#ccaa22';
  return '#cc4422';
}

async function equiparCamuflagem(id) {
  if (!state.character) return;
  const camo = id ? CAMUFLAGENS.find(c => c.id === id) : null;

  // Play equip experience
  if (camo) {
    // Flash the badge
    const badge = document.getElementById('bolsa-camo-eq-badge');
    if (badge) { badge.classList.add('bolsa-camo-badge-flash'); setTimeout(() => badge.classList.remove('bolsa-camo-badge-flash'), 800); }

    // Dramatic toast with equip text
    const lines = camo.equipText.split('\\n');
    showToast(lines[0], 'info', 2000);
    if (lines[1]) setTimeout(() => showToast(lines[1], 'info', 2500), 1800);
    if (lines[2]) setTimeout(() => showToast(lines[2], 'info', 2500), 3200);

    sfx('select');
  }

  state.character.camuflagem = id || null;
  await persistChar({ camuflagem: id || null });

  _camoSelected = null;
  renderCamuflagem();

  // Animate equipped panel after render
  if (camo) {
    requestAnimationFrame(() => {
      const panel = document.getElementById('bolsa-camo-eq-panel');
      if (panel) {
        panel.classList.add('bolsa-camo-equip-anim');
        setTimeout(() => panel.classList.remove('bolsa-camo-equip-anim'), 1200);
      }
    });
  }
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
    sfx('close');
    tabContent.classList.add('hidden');
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  } else {
    sfx('open');
    tabContent.classList.remove('hidden');
    document.querySelectorAll('.tab-panel').forEach(p => {
      p.classList.toggle('hidden', p.id !== 'tab-panel-' + tab);
    });
    if (tab === 'fitas') renderFitasTab();
    if (tab === 'radio') renderRadioTab();
    if (tab === 'mald')  { loadMaldicoes().then(renderMaldicoesTab); }
    if (tab === 'docs')  renderDocsTab();
    if (tab === 'equip') enterMissaoTab();
    if (tab === 'bolsa') {
      setupBolsaGrid();
      renderBolsa(); // render immediately with current state
      // Also fetch fresh data from Firestore (reads are open, no auth needed)
      if (firebaseOk && state.codename) {
        getDoc(doc(db, 'characters', state.codename)).then(snap => {
          if (snap.exists()) {
            const fresh = snap.data();
            if (fresh.bolsa) {
              state.character.bolsa = fresh.bolsa;
              renderBolsa(); // re-render with newest data
            }
          }
        }).catch(() => {});
      }
    }
    // Close mission detail when leaving
    if (tab !== 'equip') {
      const panel = $('missao-detail-panel');
      if (panel) panel.classList.remove('mdp-open', 'mdp-out');
    }
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

// Escapa HTML e aplica destaque em palavras prefixadas com !
function fmtCamo(s) {
  return escHtml(String(s))
    .replace(/\*([^\s&*]+)\*/g,  '<span class="txt-danger">$1</span>')   // *palavra* → vermelho perigo
    .replace(/\^([^\s&^]+)/g,   '<span class="txt-tech">$1</span>')     // ^palavra  → ciano tech
    .replace(/~([^\s&~]+)/g,    '<span class="txt-ghost">$1</span>')    // ~palavra  → fantasma
    .replace(/@([^\s&@]+)/g,    '<span class="txt-neon">$1</span>')     // @palavra  → verde neon
    .replace(/#([^\s&#]+)/g,    '<span class="txt-white">$1</span>')    // #palavra  → branco máximo
    .replace(/!([^\s&!]+)/g,    '<span class="txt-hl">$1</span>');      // !palavra  → dourado
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
//  ARMAS — GM CONTROLS
// ──────────────────────────────────────────────────────────
function buildGMArmasHtml(char) {
  const armas = char.armas || [null, null];
  const labels = ['PRIM\u00c1RIA I', 'PRIM\u00c1RIA II'];
  return [0, 1].map(i => {
    const arma = armas[i] || {};
    const tipoOpts = Object.entries(ARMA_TIPOS).filter(([,v]) => !v.consumivel).map(([k, v]) =>
      `<option value="${k}" ${arma.tipo === k ? 'selected' : ''}>${v.label}</option>`
    ).join('');
    const tipoDanoOpts = ['mortal','neutralizador'].map(t =>
      `<option value="${t}" ${(arma.tipoDano || 'mortal') === t ? 'selected' : ''}>${t.toUpperCase()}</option>`
    ).join('');
    const modsVal = (arma.modificadores || []).join(', ');
    const hasArma = !!arma.tipo;
    const title = hasArma
      ? `${labels[i]} \u2014 ${ARMA_TIPOS[arma.tipo]?.label || ''}${arma.nome ? ' ('+escHtml(arma.nome)+')' : ''}`
      : labels[i];
    return `
      <div class="gm-arma-form">
        <div class="gm-arma-form-title">${title}</div>
        <div class="gm-arma-row">
          <select class="gm-select" id="gm-arma-tipo-${char.codename}-${i}">${tipoOpts}</select>
          <input class="gm-text-input" id="gm-arma-nome-${char.codename}-${i}" placeholder="nome (opcional)" value="${escHtml(arma.nome || '')}" maxlength="30" />
        </div>
        <div class="gm-arma-row">
          <input class="gm-text-input" id="gm-arma-dano-${char.codename}-${i}" placeholder="dano (ex: 2d6)" value="${escHtml(arma.dano || '')}" maxlength="20" />
          <input class="gm-text-input" id="gm-arma-alcance-${char.codename}-${i}" placeholder="alcance" value="${escHtml(arma.alcance || '')}" maxlength="20" />
          <select class="gm-select" id="gm-arma-tdano-${char.codename}-${i}">${tipoDanoOpts}</select>
        </div>
        <div class="gm-arma-mods-row">
          ${Object.entries(ARMA_MODS).map(([k, m]) =>
            `<label class="gm-mod-check"><input type="checkbox" id="gm-arma-mod-${k}-${char.codename}-${i}" ${arma.mods?.[k] ? 'checked' : ''} /><span>${m.ico} ${m.label}</span></label>`
          ).join('')}
        </div>
        <textarea class="gm-text-input gm-arma-desc" id="gm-arma-desc-${char.codename}-${i}" placeholder="descri\u00e7\u00e3o..." rows="2">${escHtml(arma.descricao || '')}</textarea>
        <div class="gm-arma-btns">
          <button class="gm-toggle-btn active-ativo" onclick="App.gmSalvarArma('${char.codename}',${i})">SALVAR</button>
          <button class="gm-toggle-btn active-morto"  onclick="App.gmLimparArma('${char.codename}',${i})">LIMPAR</button>
        </div>
      </div>`;
  }).join('');
}

async function gmSalvarArma(codename, slot) {
  const get = id => document.getElementById(id);
  const tipo        = get(`gm-arma-tipo-${codename}-${slot}`)?.value;
  const nome        = get(`gm-arma-nome-${codename}-${slot}`)?.value.trim();
  const dano        = get(`gm-arma-dano-${codename}-${slot}`)?.value.trim();
  const alcance     = get(`gm-arma-alcance-${codename}-${slot}`)?.value.trim();
  const tipoDano    = get(`gm-arma-tdano-${codename}-${slot}`)?.value || 'mortal';
  const descricao   = get(`gm-arma-desc-${codename}-${slot}`)?.value.trim();
  const mods = Object.fromEntries(
    Object.keys(ARMA_MODS).map(k => [k, !!(get(`gm-arma-mod-${k}-${codename}-${slot}`)?.checked)])
  );
  const modificadores = Object.entries(ARMA_MODS).filter(([k]) => mods[k]).map(([,m]) => m.label);
  const arma = { tipo, nome, dano, alcance, tipoDano, mods, modificadores, descricao };

  let currentArmas = [null, null];
  if (firebaseOk) {
    try {
      const snap = await getDoc(doc(db, 'characters', codename));
      if (snap.exists()) currentArmas = snap.data().armas || [null, null];
    } catch (_) {}
  } else {
    const ch = LocalDB.getChar(codename);
    if (ch) currentArmas = ch.armas || [null, null];
  }
  const newArmas = [...currentArmas];
  while (newArmas.length < 2) newArmas.push(null);
  newArmas[slot] = arma;
  await gmUpdateChar(codename, { armas: newArmas });
  sfx('select');
  showToast(`Arma salva no slot ${slot + 1}.`, 'success', 1500);
}

async function gmLimparArma(codename, slot) {
  let currentArmas = [null, null];
  if (firebaseOk) {
    try {
      const snap = await getDoc(doc(db, 'characters', codename));
      if (snap.exists()) currentArmas = snap.data().armas || [null, null];
    } catch (_) {}
  } else {
    const ch = LocalDB.getChar(codename);
    if (ch) currentArmas = ch.armas || [null, null];
  }
  const newArmas = [...currentArmas];
  while (newArmas.length < 2) newArmas.push(null);
  newArmas[slot] = null;
  await gmUpdateChar(codename, { armas: newArmas });
  sfx('select');
  showToast(`Slot ${slot + 1} limpo.`, 'success', 1500);
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
    const dicaOpts = DICAS_PRESETS.map((d, i) =>
      `<option value="${i}">${escHtml(d.titulo)}</option>`).join('');
    html += `
      <div class="gm-radio-freq">FREQ: ${freq} &mdash; ${escHtml(radio.npcNome || '?')}</div>
      <button class="gm-toggle-btn active-morto" onclick="App.gmRadioDesconectar('${char.codename}')">DESCONECTAR</button>
      <div class="gm-dica-row">
        <select id="gm-dica-sel-${char.codename}" class="gm-select gm-dica-sel">${dicaOpts}</select>
        <button class="gm-toggle-btn active-ativo gm-dica-btn" onclick="App.gmEnviarDica('${char.codename}')">&#9658; DICA</button>
      </div>`;
  }
  return html;
}

async function gmEnviarDica(codename) {
  const sel = document.getElementById('gm-dica-sel-' + codename);
  const idx = sel ? parseInt(sel.value) : 0;
  const dica = DICAS_PRESETS[idx];
  if (!dica) return;
  await gmUpdateChar(codename, { 'radio.dicaAtual': { id: dica.id, ts: Date.now() } });
  sfx('select');
  showToast('Dica enviada: ' + dica.titulo, 'success', 2000);
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
    // Ensure auth is ready — if not, fall back to local mode silently
    const user = auth?.currentUser;
    if (!user) {
      if (state.character) LocalDB.setChar(codename, state.character);
      return;
    }
    const ref = doc(db, 'characters', codename);
    try {
      await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
    } catch (e) {
      if (e.code === 'not-found') {
        // Document doesn't exist yet — create it with full character data
        try {
          const full = { ...state.character, ...flatToNested(updates), updatedAt: serverTimestamp() };
          await setDoc(ref, full);
        } catch (e2) {
          console.error('persistChar error:', e2);
          showToast('Erro ao salvar. Verifique a conexão.', 'error');
        }
      } else {
        console.error('persistChar error:', e);
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
  loadDocsState().then(() => renderGMDocs());
  loadCamoState().then(() => renderGMCamuflagens());
  loadMissaoTextGM();
  restoreGMSectionStates();

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
  _gmCharsList = chars || [];
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
  const secLabel    = { seguro: 'SEGURO', alerta: 'ALERTA', perigo: 'PERIGO', comprometido: 'COMPROMETIDO' };
  const patente     = char.patente ?? 1;
  const maxBars     = 4 + patente; // Venom=5, Snake=6, Vyper=7
  const integ       = Math.min(char.integrity ?? maxBars, maxBars);

  const photoHtml = char.photo
    ? `<img class="gm-agent-photo-sm" src="${char.photo}" alt="foto" />`
    : `<div class="gm-agent-photo-placeholder">◈</div>`;

  const attrsHtml = ATTRS.map(a =>
    `<div class="gm-attr-mini-item">
      <div class="gm-attr-mini-grade">${(char.attrs && char.attrs[a]) || '—'}</div>
      <div class="gm-attr-mini-name">${ATTR_LABELS[a].slice(0,3)}</div>
    </div>`
  ).join('');

  const intBarsHtml = Array.from({length: maxBars}, (_,i) =>
    `<div class="gm-int-bar ${i < integ ? 'active' : ''}"
          onclick="App.gmSetIntegrity('${char.codename}', ${i+1 > integ ? i+1 : i})" ></div>`
  ).join('');

  const secBtns = ['seguro','alerta','perigo','comprometido'].map(s =>
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

  // Aparência
  const apar = char.aparencia || {};
  const corAtual     = apar.cor        || 'vermelho';
  const fotoAtual    = apar.fotoFiltro || 'padrao';
  const carimboAtual = apar.carimbo    || 'nenhum';
  const CORES_APAR = [
    { id: 'vermelho', css: '#cc0000', label: 'Vermelho' },
    { id: 'azul',     css: '#1177dd', label: 'Azul'     },
    { id: 'verde',    css: '#00bb44', label: 'Verde'    },
    { id: 'roxo',     css: '#9944cc', label: 'Roxo'     },
    { id: 'dourado',  css: '#cc9900', label: 'Dourado'  },
    { id: 'ciano',    css: '#00aacc', label: 'Ciano'    },
  ];
  const FOTO_ESTILOS = [
    { id: 'padrao',    label: 'PADRÃO'    },
    { id: 'fantasma',  label: 'FANTASMA'  },
    { id: 'corrupto',  label: 'CORRUPTO'  },
    { id: 'operativo', label: 'OPERATIVO' },
  ];
  const CARIMBOS = [
    { id: 'nenhum',       label: 'NENHUM'       },
    { id: 'confidencial', label: 'CONFIDENCIAL' },
    { id: 'operativo',    label: 'OPERATIVO'    },
    { id: 'desaparecido', label: 'DESAPARECIDO' },
    { id: 'eliminado',    label: 'ELIMINADO'    },
    { id: 'foragido',     label: 'FORAGIDO'     },
    { id: 'renegado',     label: 'RENEGADO'     },
    { id: 'elite',        label: 'ELITE'        },
    { id: 'corrompido',   label: 'CORROMPIDO'   },
    { id: 'prioritario',  label: 'PRIORITÁRIO'  },
    { id: 'neutralizado', label: 'NEUTRALIZADO' },
  ];
  const coresHtml = CORES_APAR.map(c =>
    `<button class="gm-cor-btn ${corAtual === c.id ? 'active' : ''}" style="background:${c.css}" title="${c.label}"
             onclick="App.gmSetAparencia('${char.codename}','cor','${c.id}')"></button>`
  ).join('');
  const fotosHtml = FOTO_ESTILOS.map(f =>
    `<button class="gm-apar-btn ${fotoAtual === f.id ? 'active' : ''}"
             onclick="App.gmSetAparencia('${char.codename}','fotoFiltro','${f.id}')">${f.label}</button>`
  ).join('');
  const carimbosHtml = CARIMBOS.map(s =>
    `<button class="gm-apar-btn ${carimboAtual === s.id ? 'active' : ''}"
             onclick="App.gmSetAparencia('${char.codename}','carimbo','${s.id}')">${s.label}</button>`
  ).join('');

  const patenteBtns = [1,2,3].map(lvl =>
    `<button class="gm-toggle-btn ${patente === lvl ? 'active-ativo' : ''}"
             onclick="App.gmSetPatente('${char.codename}',${lvl})">
       ${PATENTES[lvl].nome}
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
          <span>INT: ${integ}/${maxBars}</span>
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
        <div class="gm-ctrl-label">⬡ PATENTE</div>
        <div class="gm-active-toggle">${patenteBtns}</div>
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
        <div class="gm-ctrl-label">⬡ ARMAMENTO</div>
        ${buildGMArmasHtml(char)}
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
      <div class="gm-ctrl-group">
        <div class="gm-ctrl-label">⬡ APARÊNCIA DO OPERADOR</div>
        <div class="gm-apar-row">
          <div class="gm-apar-sublabel">COR DE DESTAQUE</div>
          <div class="gm-cor-grid">${coresHtml}</div>
        </div>
        <div class="gm-apar-row">
          <div class="gm-apar-sublabel">ESTILO DE FOTO</div>
          <div class="gm-apar-btns">${fotosHtml}</div>
        </div>
        <div class="gm-apar-row">
          <div class="gm-apar-sublabel">CARIMBO</div>
          <div class="gm-apar-btns">${carimbosHtml}</div>
        </div>
      </div>
      <div class="gm-ctrl-group">
        <div class="gm-ctrl-label">⬡ BOLSA DO OPERADOR</div>
        ${buildGMBolsaHtml(char)}
      </div>
      <div class="gm-ctrl-group gm-danger-zone">
        <div class="gm-ctrl-label">⬡ ZONA DE PERIGO</div>
        <button id="gm-delete-btn-${char.codename}" class="gm-delete-btn"
                onclick="App.gmDeleteOperador('${char.codename}')">✕ DELETAR PERFIL</button>
        <div class="gm-delete-hint">Clique uma vez para armar · Clique novamente para confirmar</div>
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
  let maxBars = 5; // default Venom
  if (firebaseOk) {
    try {
      const snap = await getDoc(doc(db, 'characters', codename));
      if (snap.exists()) maxBars = 4 + (snap.data().patente ?? 1);
    } catch (_) {}
  } else {
    const char = LocalDB.getChar(codename);
    if (char) maxBars = 4 + (char.patente ?? 1);
  }
  const newVal = Math.max(0, Math.min(maxBars, val));
  await gmUpdateChar(codename, { integrity: newVal });
}

async function gmSetStatus(codename, statusAtivo) {
  await gmUpdateChar(codename, { statusAtivo });
}

async function gmSetPatente(codename, level) {
  const p = Math.max(1, Math.min(3, level));
  await gmUpdateChar(codename, { patente: p });
}

async function gmDeleteOperador(codename) {
  if (_gmDeleteArmed !== codename) {
    // Primeira clique — armar confirmação
    _gmDeleteArmed = codename;
    const btn = document.getElementById('gm-delete-btn-' + codename);
    if (btn) {
      btn.textContent = '⚠ CONFIRMAR DELEÇÃO';
      btn.classList.add('armed');
    }
    // Auto-desarmar após 4 segundos
    setTimeout(() => {
      if (_gmDeleteArmed === codename) {
        _gmDeleteArmed = null;
        const b = document.getElementById('gm-delete-btn-' + codename);
        if (b) { b.textContent = '✕ DELETAR PERFIL'; b.classList.remove('armed'); }
      }
    }, 4000);
    return;
  }
  // Segunda clique — confirmar e deletar
  _gmDeleteArmed = null;
  if (firebaseOk) {
    try {
      await deleteDoc(doc(db, 'characters', codename));
      showToast(`${codename}: perfil deletado.`, 'success');
    } catch (e) {
      console.error('gmDeleteOperador error:', e);
      showToast('Erro ao deletar operador: ' + (e.code || e.message), 'error');
      return;
    }
  } else {
    LocalDB.removeChar(codename);
    showToast(`${codename}: perfil deletado (local).`, 'success');
  }
  // Remove card do DOM
  const card = document.getElementById('gm-card-' + codename);
  if (card) card.remove();
  // Atualiza cache
  _gmCharsList = _gmCharsList.filter(c => c.codename !== codename);
}

// ──────────────────────────────────────────────────────────
//  GM — APARÊNCIA POR OPERADOR
// ──────────────────────────────────────────────────────────
async function gmSetAparencia(codename, key, val) {
  if (firebaseOk) {
    await gmUpdateChar(codename, { [`aparencia.${key}`]: val });
  } else {
    const char = LocalDB.getChar(codename);
    if (char) {
      if (!char.aparencia) char.aparencia = {};
      char.aparencia[key] = val;
      LocalDB.setChar(codename, char);
      const chars = LocalDB.getAllChars();
      renderGMList(chars);
    }
  }
}

// ──────────────────────────────────────────────────────────
//  GM — SEÇÕES RETRÁTEIS
// ──────────────────────────────────────────────────────────
function gmToggleSection(sectionId) {
  const sec = document.getElementById('gmsec-' + sectionId);
  if (!sec) return;
  sec.classList.toggle('gm-section-collapsed');
  const states = JSON.parse(localStorage.getItem('vyper_gm_sections') || '{}');
  states[sectionId] = sec.classList.contains('gm-section-collapsed');
  localStorage.setItem('vyper_gm_sections', JSON.stringify(states));
}

function restoreGMSectionStates() {
  const states   = JSON.parse(localStorage.getItem('vyper_gm_sections') || '{}');
  const defaults = { npc: true, mald: true, missao: true, loot: true, docs: true, camuflagens: true, agents: false };
  ['npc','mald','missao','loot','docs','camuflagens','agents'].forEach(id => {
    const sec = document.getElementById('gmsec-' + id);
    if (!sec) return;
    const collapsed = id in states ? states[id] : defaults[id];
    sec.classList.toggle('gm-section-collapsed', collapsed);
  });
}

async function gmUpdateChar(codename, updates) {
  if (firebaseOk) {
    const user = auth?.currentUser;
    if (!user) {
      showToast('Sem autenticação. Recarregue a página.', 'error');
      return;
    }
    const ref = doc(db, 'characters', codename);
    try {
      await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
      showToast(`${codename}: atualizado.`, 'success', 1500);
    } catch (e) {
      if (e.code === 'not-found') {
        // Document doesn't exist yet — create minimal document and retry
        try {
          const base = { ...DEFAULT_CHAR(), codename, ...updates, updatedAt: serverTimestamp() };
          await setDoc(ref, base);
          showToast(`${codename}: criado e atualizado.`, 'success', 1500);
        } catch (e2) {
          console.error('gmUpdateChar setDoc error:', e2);
          showToast('Erro ao atualizar operador.', 'error');
        }
      } else {
        console.error('gmUpdateChar error:', e);
        showToast('Erro ao atualizar operador: ' + (e.code || e.message), 'error');
      }
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
  sfx('select');
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
  sfx('select');
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
  sfx('close');
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

// ══════════════════════════════════════════════════════════
//  DOCUMENTS SYSTEM
// ══════════════════════════════════════════════════════════

// ── Docs state (released list) ───────────────────────────
async function loadCamoState() {
  if (firebaseOk) {
    try {
      const snap = await getDoc(doc(db, 'gameState', 'camos'));
      camoReleasedState = snap.exists() ? (snap.data().released || []) : [];
    } catch (e) {
      console.error('loadCamoState:', e);
      camoReleasedState = [];
    }
  } else {
    const raw = localStorage.getItem('vyper_camos_released');
    camoReleasedState = raw ? JSON.parse(raw) : [];
  }
}

async function saveCamoState() {
  if (firebaseOk) {
    try {
      await setDoc(doc(db, 'gameState', 'camos'), { released: camoReleasedState });
    } catch (e) {
      console.error('saveCamoState:', e);
      showToast('Erro ao salvar estado das camuflagens.', 'error');
    }
  } else {
    localStorage.setItem('vyper_camos_released', JSON.stringify(camoReleasedState));
  }
}

function renderGMCamuflagens() {
  const listEl = $('gm-camos-list');
  if (!listEl) return;
  listEl.innerHTML = CAMUFLAGENS.map(c => {
    const released = camoReleasedState.includes(c.id);
    return `<div class="gm-camo-item">
      <div class="gm-camo-icon" style="background:${c.cor}; color:${c.acento}; border-color:${c.acento}33">${escHtml(c.iconeChar)}</div>
      <div class="gm-camo-info">
        <div class="gm-camo-nome">${escHtml(c.nome)}</div>
        <div class="gm-camo-amb">${escHtml(c.ambiente)}</div>
        <div class="gm-camo-status ${released ? 'gm-camo-released' : 'gm-camo-locked'}">
          ${released ? '&#9670; DESBLOQUEADA' : '&#128274; BLOQUEADA'}
        </div>
      </div>
      <button class="gm-camo-toggle-btn ${released ? 'gm-camo-btn-lock' : 'gm-camo-btn-release'}"
              onclick="App.gmToggleCamoRelease('${c.id}')">
        ${released ? 'BLOQUEAR' : 'LIBERAR'}
      </button>
    </div>`;
  }).join('');
}

async function gmToggleCamoRelease(camoId) {
  const idx = camoReleasedState.indexOf(camoId);
  if (idx === -1) camoReleasedState.push(camoId);
  else camoReleasedState.splice(idx, 1);
  await saveCamoState();
  renderGMCamuflagens();
  showToast(idx === -1 ? 'Camuflagem desbloqueada para os jogadores.' : 'Camuflagem bloqueada.', 'success', 2000);
}

async function loadDocsState() {
  if (firebaseOk) {
    try {
      const ref  = doc(db, 'gameState', 'docs');
      const snap = await getDoc(ref);
      docsReleasedState = snap.exists() ? (snap.data().released || []) : [];
    } catch (e) {
      console.error('loadDocsState:', e);
      docsReleasedState = [];
    }
  } else {
    const raw = localStorage.getItem('vyper_docs_released');
    docsReleasedState = raw ? JSON.parse(raw) : [];
  }
  // Load which docs this player has already opened
  if (state.codename) {
    const readRaw = localStorage.getItem('vyper_docs_read_' + state.codename);
    docsReadSet = new Set(readRaw ? JSON.parse(readRaw) : []);
  }
}

function markDocRead(docId) {
  if (!docId || docsReadSet.has(docId)) return;
  docsReadSet.add(docId);
  if (state.codename) {
    localStorage.setItem('vyper_docs_read_' + state.codename, JSON.stringify([...docsReadSet]));
  }
}

async function saveDocsState() {
  if (firebaseOk) {
    try {
      await setDoc(doc(db, 'gameState', 'docs'), { released: docsReleasedState });
    } catch (e) {
      console.error('saveDocsState:', e);
      showToast('Erro ao salvar estado dos documentos.', 'error');
    }
  } else {
    localStorage.setItem('vyper_docs_released', JSON.stringify(docsReleasedState));
  }
}

// ── Player Docs Tab ───────────────────────────────────────
function renderDocsTab() {
  const listEl = $('docs-list');
  if (!listEl) return;

  if (DOCUMENTS.length === 0) {
    listEl.innerHTML = '<div class="docs-empty">Nenhum documento cadastrado.</div>';
    return;
  }

  listEl.innerHTML = DOCUMENTS.map(d => {
    const released = docsReleasedState.includes(d.id);
    const isNew    = released && !docsReadSet.has(d.id);
    const ann      = ((state.character?.docAnnotations || {})[d.id] || '');
    const annPrev  = ann.length > 55 ? ann.substring(0, 55) + '…' : ann;

    return `<div class="doc-card ${released ? 'doc-released' : 'doc-locked'}" ${released ? `onclick="App.openDocViewer('${d.id}')"` : ''}>
      <div class="doc-card-thumb">
        ${released
          ? `<img class="doc-thumb-img" src="${d.image}" alt="" />`
          : `<div class="doc-thumb-locked">&#128274;</div>`}
        ${isNew ? '<div class="doc-new-badge">NOVO</div>' : ''}
      </div>
      <div class="doc-card-info">
        <div class="doc-card-title">${released ? escHtml(d.title) : '[???]'}</div>
        <div class="doc-card-status ${released ? 'doc-status-ok' : 'doc-status-lock'}">
          ${released ? '&#9670; LIBERADO' : '&#8212; ACESSO RESTRITO'}
        </div>
        ${annPrev ? `<div class="doc-card-ann-preview">${escHtml(annPrev)}</div>` : ''}
      </div>
      ${released ? `<div class="doc-card-arrow">&#9658;</div>` : ''}
    </div>`;
  }).join('');
}

// ── Doc Viewer ────────────────────────────────────────────
const docViewerState = {
  docId: null, uvMode: false,
  scale: 1, minScale: 1, maxScale: 5,
  panX: 0, panY: 0,
  isDragging: false, lastX: 0, lastY: 0,
  lastDist: 0
};

function openDocViewer(docId) {
  sfx('open');
  const docDef = DOCUMENTS.find(d => d.id === docId);
  if (!docDef) return;

  const isFirstOpen = !docsReadSet.has(docId);

  docViewerState.docId  = docId;
  docViewerState.uvMode = false;
  docViewerState.scale  = 1;
  docViewerState.panX   = 0;
  docViewerState.panY   = 0;

  // Normal image
  const img = $('doc-image');
  if (img) { img.src = docDef.image; img.style.filter = ''; }

  // UV image layer — pre-load source
  const uvImg = $('doc-image-uv');
  if (uvImg) {
    uvImg.src = docDef.uvImage || docDef.image;
    uvImg.classList.remove('uv-active');
    uvImg.style.cssText = '';
  }

  const titleEl = $('doc-viewer-title');
  if (titleEl) titleEl.textContent = docDef.title;

  const uvBtn   = $('doc-uv-btn');
  const uvLight = $('doc-uv-light');
  if (uvBtn)   uvBtn.classList.remove('active');
  if (uvLight) uvLight.classList.add('hidden');

  const annInput = $('doc-ann-input');
  if (annInput) annInput.value = (state.character?.docAnnotations || {})[docId] || '';

  applyDocTransform();
  $('doc-viewer').classList.remove('hidden');

  // Scanner animation
  const scanLine = $('doc-scan-line');
  if (scanLine) {
    scanLine.classList.remove('scanning');
    void scanLine.offsetWidth; // reflow
    scanLine.classList.add('scanning');
    setTimeout(() => scanLine.classList.remove('scanning'), 1000);
  }

  // CLASSIFICADO stamp on first open
  if (isFirstOpen) {
    const stampWrap = $('doc-classified-wrap');
    if (stampWrap) {
      stampWrap.classList.remove('hidden', 'stamp-fade');
      void stampWrap.offsetWidth;
      stampWrap.classList.add('stamp-show');
      setTimeout(() => {
        stampWrap.classList.add('stamp-fade');
        setTimeout(() => {
          stampWrap.classList.add('hidden');
          stampWrap.classList.remove('stamp-show', 'stamp-fade');
        }, 700);
      }, 1400);
    }
  }

  markDocRead(docId);
  renderDocsTab();
}

function closeDocViewer() {
  sfx('close');
  $('doc-viewer').classList.add('hidden');
  docViewerState.docId  = null;
  docViewerState.uvMode = false;
  docViewerState.scale  = 1;
  docViewerState.panX   = 0;
  docViewerState.panY   = 0;
  const uvImg = $('doc-image-uv');
  if (uvImg) { uvImg.classList.remove('uv-active'); uvImg.style.cssText = ''; }
  const uvLight = $('doc-uv-light');
  if (uvLight) uvLight.classList.add('hidden');
  const uvBtn = $('doc-uv-btn');
  if (uvBtn) uvBtn.classList.remove('active');
  const body = $('doc-viewer-body');
  if (body) body.classList.remove('uv-cursor');
}

function toggleDocUV() {
  docViewerState.uvMode = !docViewerState.uvMode;
  const uvBtn   = $('doc-uv-btn');
  const uvLight = $('doc-uv-light');
  const uvImg   = $('doc-image-uv');
  const body    = $('doc-viewer-body');
  const docDef  = DOCUMENTS.find(d => d.id === docViewerState.docId);

  if (docViewerState.uvMode) {
    // Apply filter if no dedicated UV image
    if (uvImg) {
      if (!docDef?.uvImage) {
        uvImg.style.filter = 'invert(1) hue-rotate(200deg) saturate(6) brightness(1.6) contrast(1.6)';
      } else {
        uvImg.style.filter = '';
      }
      // Start torch off-screen until cursor moves
      uvImg.style.setProperty('--tx', '-999px');
      uvImg.style.setProperty('--ty', '-999px');
      uvImg.style.setProperty('--tr', '100px');
      uvImg.classList.add('uv-active');
    }
    if (uvBtn)   uvBtn.classList.add('active');
    if (uvLight) uvLight.classList.remove('hidden');
    if (body)    body.classList.add('uv-cursor');
  } else {
    if (uvImg) { uvImg.classList.remove('uv-active'); uvImg.style.filter = ''; }
    if (uvBtn)   uvBtn.classList.remove('active');
    if (uvLight) uvLight.classList.add('hidden');
    if (body)    body.classList.remove('uv-cursor');
  }
}

async function saveDocAnnotation() {
  const ann    = ($('doc-ann-input')?.value || '').trim();
  const docId  = docViewerState.docId;
  if (!docId || !state.character) return;

  if (!state.character.docAnnotations) state.character.docAnnotations = {};
  state.character.docAnnotations[docId] = ann;

  await persistChar({ [`docAnnotations.${docId}`]: ann });
  showToast('Anotação salva.', 'success', 1800);
  renderDocsTab();
}

// ── Zoom & Pan ────────────────────────────────────────────
function applyDocTransform() {
  const container = $('doc-zoom-container');
  if (!container) return;
  const { scale, panX, panY } = docViewerState;
  container.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

function _uvTorchTrack(cx, cy) {
  if (!docViewerState.uvMode) return;
  const uvImg = $('doc-image-uv');
  if (!uvImg) return;
  const rect = uvImg.getBoundingClientRect();
  if (rect.width === 0) return;
  // Convert viewport coords to element local coords (pre-transform)
  const scaleX = uvImg.offsetWidth  ? rect.width  / uvImg.offsetWidth  : 1;
  const scaleY = uvImg.offsetHeight ? rect.height / uvImg.offsetHeight : 1;
  const lx = (cx - rect.left) / scaleX;
  const ly = (cy - rect.top)  / scaleY;
  const tr = Math.round(100 / Math.max(scaleX, 0.1)); // torch r in local px ~100px viewport
  uvImg.style.setProperty('--tx', lx + 'px');
  uvImg.style.setProperty('--ty', ly + 'px');
  uvImg.style.setProperty('--tr', tr + 'px');
}

function initDocViewerEvents() {
  const body = $('doc-viewer-body');
  if (!body) return;

  // Mouse wheel zoom
  body.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.18 : 0.18;
    const { minScale, maxScale } = docViewerState;
    docViewerState.scale = Math.max(minScale, Math.min(maxScale, docViewerState.scale + delta));
    if (docViewerState.scale <= minScale) { docViewerState.panX = 0; docViewerState.panY = 0; }
    applyDocTransform();
  }, { passive: false });

  // Mouse move — drag pan + UV torch
  body.addEventListener('mousemove', (e) => {
    _uvTorchTrack(e.clientX, e.clientY);
    if (!docViewerState.isDragging) return;
    docViewerState.panX += e.clientX - docViewerState.lastX;
    docViewerState.panY += e.clientY - docViewerState.lastY;
    docViewerState.lastX = e.clientX;
    docViewerState.lastY = e.clientY;
    applyDocTransform();
  });

  body.addEventListener('mouseleave', () => {
    // Park torch off-screen
    const uvImg = $('doc-image-uv');
    if (uvImg) { uvImg.style.setProperty('--tx', '-999px'); uvImg.style.setProperty('--ty', '-999px'); }
  });

  // Mouse drag pan
  body.addEventListener('mousedown', (e) => {
    if (docViewerState.scale <= 1) return;
    docViewerState.isDragging = true;
    docViewerState.lastX = e.clientX;
    docViewerState.lastY = e.clientY;
    body.style.cursor = 'grabbing';
  });
  const stopDrag = () => { docViewerState.isDragging = false; if (!docViewerState.uvMode) body.style.cursor = ''; };
  body.addEventListener('mouseup', stopDrag);

  // Touch pinch zoom + single-finger pan + UV torch
  body.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      docViewerState.lastDist = Math.hypot(dx, dy);
    } else if (e.touches.length === 1) {
      if (docViewerState.scale > 1) {
        docViewerState.isDragging = true;
      }
      docViewerState.lastX = e.touches[0].clientX;
      docViewerState.lastY = e.touches[0].clientY;
      _uvTorchTrack(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  body.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx   = e.touches[0].clientX - e.touches[1].clientX;
      const dy   = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      docViewerState.scale = Math.max(
        docViewerState.minScale,
        Math.min(docViewerState.maxScale, docViewerState.scale * (dist / docViewerState.lastDist))
      );
      docViewerState.lastDist = dist;
      if (docViewerState.scale <= docViewerState.minScale) { docViewerState.panX = 0; docViewerState.panY = 0; }
      applyDocTransform();
    } else if (e.touches.length === 1) {
      _uvTorchTrack(e.touches[0].clientX, e.touches[0].clientY);
      if (docViewerState.isDragging) {
        docViewerState.panX += e.touches[0].clientX - docViewerState.lastX;
        docViewerState.panY += e.touches[0].clientY - docViewerState.lastY;
        docViewerState.lastX = e.touches[0].clientX;
        docViewerState.lastY = e.touches[0].clientY;
        applyDocTransform();
      }
    }
  }, { passive: false });

  body.addEventListener('touchend', () => {
    docViewerState.isDragging = false;
    docViewerState.lastDist   = 0;
    const uvImg = $('doc-image-uv');
    if (uvImg) { uvImg.style.setProperty('--tx', '-999px'); uvImg.style.setProperty('--ty', '-999px'); }
  });
}

// ── New Doc Alert ─────────────────────────────────────────
function showNewDocAlert(docId) {
  const docDef = DOCUMENTS.find(d => d.id === docId);
  if (!docDef) return;
  _newDocAlertId = docId;
  const thumb  = $('doc-new-thumb');
  const name   = $('doc-new-docname');
  const alert  = $('doc-new-alert');
  if (thumb)  thumb.src = docDef.image;
  if (name)   name.textContent = docDef.title;
  if (alert) {
    alert.classList.remove('hidden', 'doc-new-dismiss-out');
    void alert.offsetWidth;
    alert.classList.add('doc-new-visible');
  }
}

function dismissNewDocAlert(openDoc = false) {
  const alert = $('doc-new-alert');
  if (!alert) return;
  alert.classList.remove('doc-new-visible');
  alert.classList.add('doc-new-dismiss-out');
  const pendingId = _newDocAlertId;
  _newDocAlertId = null;
  setTimeout(() => {
    alert.classList.add('hidden');
    alert.classList.remove('doc-new-dismiss-out');
    if (openDoc && pendingId && docsReleasedState.includes(pendingId)) {
      // Switch to docs tab and open the viewer
      if (state.currentTab !== 'docs') {
        window.App.switchTab('docs');
        setTimeout(() => openDocViewer(pendingId), 300);
      } else {
        openDocViewer(pendingId);
      }
    }
  }, 400);
}

// ── GM Docs Panel ─────────────────────────────────────────
// ──────────────────────────────────────────────────────────
//  MISSÃO TAB
// ──────────────────────────────────────────────────────────

const MISSAO_DETAILS = [
  {
    tag:      'OBJ. 01',
    action:   'NEUTRALIZAR',
    title:    'FILHOS DO ARCANJO',
    threat:   '◆◆◆◆◇',
    status:   'ATIVO',
    priority: 'ALPHA',
    summary:
      'Facção religiosa extremista operando nas sombras do submundo. ' +
      'Acredita-se que seus membros infiltraram estruturas de segurança e política local. ' +
      'São a espinha dorsal logística e ideológica da OPERAÇÃO HERESIA.\n\n' +
      '[ PLACEHOLDER — aguardando briefing completo do controle central. ]',
    intel:
      '— Liderança desconhecida. Possível figura religiosa de alto escalão.\n' +
      '— Estimativa: 40–80 operativos ativos na região.\n' +
      '— Utilizam locais de culto como pontos de encontro e armazenamento.\n\n' +
      '[ PLACEHOLDER — dados adicionais classificados. ]',
    notes:
      '[ Nenhuma nota de campo registrada. ]',
  },
  {
    tag:      'OBJ. 02',
    action:   'ELIMINAR',
    title:    'O HOMEM QUE VENDEU O MUNDO',
    threat:   '◆◆◆◆◆◆◆◆◆',
    status:   'LOCALIZADO',
    priority: 'ALPHA',
    summary:
      'Identidade real desconhecida. Codinome dado graças a sua fama como figura de relevancia militar. Trata-se do intermediário principal entre ' +
      'os Filhos do Arcanjo e forças externas ainda não identificadas.\n\n' +
      'O soldado lendário, é considerado um alvo de extremo perigo, toda cautela é necessária para sua abordagem e neutralização. ' +
      'Retornou a ativa após ser declarado morto em campo.\n'+
      'Eliminação autorizada, mas a captura para interrogatório é preferível caso as condições permitam.\n\n' +
      '[ — aguardando briefing completo do controle central. ]',
    intel:
      '— Última localização confirmada: setor industrial, zona norte.\n' +
      '— Possui escolta armada de alto nível de treinamento.\n' +
      '— Conhece a identidade de pelo menos dois agentes Vyper ativos.\n\n' +
      '[ — CLASSIFICADO. ]',
    notes:
      '[ Nenhuma nota de campo registrada. ]',
  },
  {
    tag:      'OBJ. 03',
    action:   'ELIMINAR',
    title:    'GENERAL HUSK',
    threat:   '◆◆◆◆◆◆◆',
    status:   'ATIVO',
    priority: 'OMEGA',
    summary:
      'Ex-oficial militar de alta patente, afastado por atividades não sancionadas. ' +
      'Atualmente lidera uma força paramilitar que presta serviços aos Filhos do Arcanjo. ' +
      'Considerado alvo de máxima periculosidade — eliminação autorizada em qualquer contexto.\n\n' +
      '[ PLACEHOLDER — aguardando briefing completo do controle central. ]',
    intel:
      '— Portador de implantes cibernéticos de combate — capacidades aumentadas.\n' +
      '— Histórico: 23 anos de serviço ativo, especialização em guerra urbana.\n' +
      '— Última aparição confirmada: 72 horas atrás, reunião com alvo OBJ. 02.\n\n' +
      '[ — dados adicionais classificados. ]',
    notes:
      '[ Seus implantes cibernéticos não foram identificados pela equipe de inteligencia, então não sabemos do potencial de sua cibernética. ]',
  },
];

function openMissaoDetail(idx) {
  sfx('open');
  const d = MISSAO_DETAILS[idx];
  if (!d) return;

  $('mdp-op-tag').textContent   = d.tag;
  $('mdp-action').textContent   = d.action;
  $('mdp-title').textContent    = d.title;
  $('mdp-threat').textContent   = d.threat;
  $('mdp-priority').textContent = d.priority;

  const statusEl = $('mdp-status');
  statusEl.textContent = d.status;
  statusEl.className   = 'mdp-meta-val';
  if (d.status === 'ATIVO' || d.status === 'LOCALIZADO') statusEl.classList.add('mdp-status-active');
  if (d.status === 'ELIMINADO' || d.status === 'NEUTRO')  statusEl.classList.add('mdp-status-done');

  // Render text with newlines as <br>
  const renderText = (id, text) => {
    const el = $(id);
    el.innerHTML = text.split('\n').map(l => l ? `<span>${l}</span>` : '<br>').join('<br>');
  };
  renderText('mdp-summary', d.summary);
  renderText('mdp-intel',   d.intel);
  renderText('mdp-notes',   d.notes);

  // Reset scroll and animate in
  const panel = $('missao-detail-panel');
  const body  = $('mdp-body');
  if (body) body.scrollTop = 0;
  panel.classList.remove('mdp-out');
  panel.classList.add('mdp-open');
}

function closeMissaoDetail() {
  sfx('close');
  const panel = $('missao-detail-panel');
  panel.classList.add('mdp-out');
  setTimeout(() => {
    panel.classList.remove('mdp-open', 'mdp-out');
  }, 340);
}


function _decodeText(elId, finalText, charDelay) {
  const el = $(elId);
  if (!el) return;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!%&';
  let revealed = 0;
  function step() {
    let display = '';
    for (let i = 0; i < finalText.length; i++) {
      if (i < revealed) {
        display += finalText[i];
      } else if (finalText[i] === ' ') {
        display += ' ';
      } else {
        display += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    el.textContent = display;
    if (revealed <= finalText.length) {
      revealed++;
      setTimeout(step, charDelay);
    } else {
      el.textContent = finalText;
    }
  }
  step();
}

function renderMissaoAtualText() {
  const el = $('missao-atual-text');
  if (!el) return;
  if (missaoText && missaoText.trim()) {
    el.innerHTML = '';
    // Split by newlines and render as paragraphs
    missaoText.trim().split('\n').forEach(line => {
      const p = document.createElement('p');
      p.style.margin = '0 0 6px';
      p.textContent = line;
      el.appendChild(p);
    });
  } else {
    el.innerHTML = '<span class="missao-awaiting">[ AGUARDANDO TRANSMISSÃO... ]</span>';
  }
}

function enterMissaoTab() {
  // Reset animation state
  const content = $('missao-content');
  const boot    = $('missao-boot');
  if (!content || !boot) return;

  // Hide content, reset objective visibility
  content.classList.remove('m-revealed');
  document.querySelectorAll('.missao-obj-item').forEach(el => el.classList.remove('m-obj-show'));
  const frame = $('missao-target-frame');
  if (frame) frame.classList.remove('m-img-show');
  const atual = $('missao-atual-wrap');
  if (atual) atual.classList.remove('m-atual-show');

  // Show boot overlay
  boot.classList.remove('hidden');
  boot.classList.add('m-boot-in');

  // Status messages sequence
  const statuses = [
    'VERIFICANDO CREDENCIAIS...',
    'ACESSANDO SERVIDOR VYPER...',
    'DESCRIPTOGRAFANDO DOSSIE...',
    'CARREGANDO BRIEFING...'
  ];
  const statusEl = $('m-boot-status');
  let idx = 0;
  const statusInterval = setInterval(() => {
    idx++;
    if (idx < statuses.length && statusEl) statusEl.textContent = statuses[idx];
    else clearInterval(statusInterval);
  }, 550);

  // After boot: fade out, reveal mission
  setTimeout(() => {
    boot.classList.add('m-boot-out');
    setTimeout(() => {
      clearInterval(statusInterval);
      boot.classList.add('hidden');
      boot.classList.remove('m-boot-in', 'm-boot-out');
      content.classList.add('m-revealed');
      // Decode title
      _decodeText('missao-op-title', 'HERESIA', 55);
      // Stagger objectives
      [0, 1, 2].forEach(i => {
        setTimeout(() => {
          const el = $('mobj-' + i);
          if (el) el.classList.add('m-obj-show');
        }, 500 + i * 340);
      });
      // Image reveal
      setTimeout(() => { if (frame) frame.classList.add('m-img-show'); }, 400);
      // MISSÃO ATUAL section
      setTimeout(() => {
        if (atual) atual.classList.add('m-atual-show');
        renderMissaoAtualText();
      }, 1500);
    }, 500);
  }, 2400);
}

async function loadMissaoTextGM() {
  if (!firebaseOk) return;
  try {
    const snap = await getDoc(doc(db, 'gameState', 'mission'));
    const text = snap.exists() ? (snap.data().text || '') : '';
    const inp = $('gm-missao-input');
    if (inp) inp.value = text;
  } catch (e) {
    console.error('loadMissaoTextGM:', e);
  }
}

async function gmSaveMissaoText() {
  const inp = $('gm-missao-input');
  if (!inp) return;
  const text = inp.value.trim();
  if (!firebaseOk) { showToast('Firebase offline.', 'error'); return; }
  try {
    await setDoc(doc(db, 'gameState', 'mission'), { text });
    showToast('Transmissão enviada.', 'ok');
  } catch (e) {
    console.error('gmSaveMissaoText:', e);
    showToast('Erro ao transmitir.', 'error');
  }
}

// ──────────────────────────────────────────────────────────
function renderGMDocs() {
  const listEl = $('gm-docs-list');
  if (!listEl) return;

  if (DOCUMENTS.length === 0) {
    listEl.innerHTML = '<div class="gm-fitas-empty">Nenhum documento cadastrado.</div>';
    return;
  }

  listEl.innerHTML = DOCUMENTS.map(d => {
    const released = docsReleasedState.includes(d.id);
    return `<div class="gm-doc-item">
      <div class="gm-doc-thumb">
        <img src="${d.image}" alt="" class="gm-doc-thumb-img" onerror="this.style.display='none'" />
      </div>
      <div class="gm-doc-info">
        <div class="gm-doc-title">${escHtml(d.title)}</div>
        <div class="gm-doc-status ${released ? 'gm-doc-released' : 'gm-doc-locked'}">
          ${released ? '&#9670; LIBERADO' : '&#128274; BLOQUEADO'}
        </div>
      </div>
      <button class="gm-doc-toggle-btn ${released ? 'gm-doc-btn-lock' : 'gm-doc-btn-release'}"
              onclick="App.gmToggleDocRelease('${d.id}')">
        ${released ? 'BLOQUEAR' : 'LIBERAR'}
      </button>
    </div>`;
  }).join('');
}

async function gmToggleDocRelease(docId) {
  const idx = docsReleasedState.indexOf(docId);
  if (idx === -1) {
    docsReleasedState.push(docId);
  } else {
    docsReleasedState.splice(idx, 1);
  }
  await saveDocsState();
  renderGMDocs();
  showToast(idx === -1 ? 'Documento liberado para os jogadores.' : 'Documento bloqueado.', 'success', 2000);
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
  gmSetPatente,
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
  gmRemoveMaldTag,
  openDocViewer,
  closeDocViewer,
  toggleDocUV,
  saveDocAnnotation,
  gmToggleDocRelease,
  dismissNewDocAlert,
  markDocRead,
  gmSaveMissaoText,
  openMissaoDetail,
  closeMissaoDetail,
  setPatente,
  inspecionarArma,
  fecharArmaInspect,
  gmSalvarArma,
  gmLimparArma,
  gmEnviarDica,
  closeDicaPopup,
  gmSetAparencia,
  gmToggleSection,
  bolsaItemClick,
  bolsaDeselecionar,
  bolsaEquipar,
  bolsaGirar,
  bolsaJogarFora,
  bolsaTentarColocar,
  bolsaUsarItem,
  bolsaAbrirTransferencia,
  bolsaTransferir,
  renderBolsaActionsPublic,
  bolsaAutoPlaceStaged,
  armaParaBolsa,
  gmEnviarParaBolsa,
  gmRemoverDaBolsa,
  gmLootAddItem,
  gmLootRemoveItem,
  gmLootDistribuir,
  gmDeleteOperador,
  bolsaCamoToggle,
  bolsaCamoSelect,
  equiparCamuflagem,
  gmToggleCamoRelease,
};

// ──────────────────────────────────────────────────────────
//  KEYBOARD SHORTCUTS
// ──────────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Dismiss new doc alert first
    const newAlert = $('doc-new-alert');
    if (newAlert && !newAlert.classList.contains('hidden')) {
      dismissNewDocAlert(false);
      return;
    }
    // Close doc viewer first
    const viewer = $('doc-viewer');
    if (viewer && !viewer.classList.contains('hidden')) {
      closeDocViewer();
      return;
    }
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
initDocViewerEvents();
runBoot();
