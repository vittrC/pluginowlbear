import pathlib

# ─────────────────────────────────────────────────────────────────
# main.js
# ─────────────────────────────────────────────────────────────────
js_path = pathlib.Path('METALG/main.js')
src = js_path.read_text(encoding='utf-8')

# ── 1. Messages & cfg ────────────────────────────────────────────
OLD_MSGS_CFG = """const _ELEM_MSGS = {
  elem_sangue: [
    'SEU SANGUE NOS PERTENCE',
    'SANGUE',
    'A CARNE CLAMA',
    'OFEREÇA O SACRIFÍCIO',
    'SANGUE SANGUE SANGUE',
    'O PACTO EXIGE',
    'DERRAME',
    'A DÍVIDA É DE SANGUE',
  ],
  elem_morte: [
    'VOCÊ JÁ ESTÁ MORTO',
    'ELE ESPERA',
    'VENHA',
    'NÃO HÁ ESCAPATÓRIA',
    'SEU FIM SE APROXIMA',
    'OS MORTOS TE CHAMAM',
    'NÃO EXISTE RETORNO',
    'A MORTE É O COMEÇO',
  ],
  elem_energia: [
    'O OUTRO LADO PULSA',
    'SINTO VOCÊ',
    'A ENERGIA TE CONSOME',
    'DEIXE FLUIR',
    'NÃO RESISTA',
    'O VÉU SE ROMPE',
    'VOCÊ É O CANAL',
    'CONDUTOR',
  ],
  elem_conhecimento: [
    'VOCÊ NÃO DEVERIA SABER',
    'O CONHECIMENTO TE DESTRÓI',
    'LEMBRE-SE',
    'ELES SABEM QUE VOCÊ SABE',
    'O SEGREDO TE CONSOME',
    'HÁ VERDADES PROIBIDAS',
    'VOCÊ VIU DEMAIS',
    'NÃO SE PODE DESAPRENDER',
  ],
};

const _ELEM_CFG = {
  elem_sangue:       { cls: 'psych-ptext-sangue',       minDelay: 700,  maxDelay: 3200, minDur: 2.5, maxDur: 4.5 },
  elem_morte:        { cls: 'psych-ptext-morte',        minDelay: 1400, maxDelay: 5000, minDur: 3.5, maxDur: 6.5 },
  elem_energia:      { cls: 'psych-ptext-energia',      minDelay: 350,  maxDelay: 2000, minDur: 1.6, maxDur: 3.2 },
  elem_conhecimento: { cls: 'psych-ptext-conhecimento', minDelay: 1800, maxDelay: 6000, minDur: 4.0, maxDur: 8.0 },
};"""

NEW_MSGS_CFG = """const _ELEM_MSGS = {
  // SANGUE: curto, brutal, sem floreio
  elem_sangue: [
    'SANGUE', 'SANGUE', 'SANGUE',   // peso maior
    'CORTE', 'RASGUE', 'DERRAME', 'MATE',
    'SEU SANGUE NOS PERTENCE',
    'A CARNE CLAMA',
    'O PACTO EXIGE SANGUE',
    'A DÍVIDA É DE SANGUE',
    'SANGUE SANGUE SANGUE',
    'OFEREÇA',
  ],
  // MORTE: sussurros lentos, inevitáveis
  elem_morte: [
    'INEVITÁVEL',
    'ELE ESPERA',
    'VENHA',
    'TUDO ACABA',
    'A ESPIRAL TE AGUARDA',
    'HÁ PAZ NA MORTE',
    'VOCÊ JÁ ESTÁ MORTO',
    'NÃO HÁ ESCAPATÓRIA',
    'SEU FIM SE APROXIMA',
    'OS MORTOS TE CHAMAM',
    'NÃO EXISTE RETORNO',
  ],
  // ENERGIA: caos puro, incoerência proposital
  elem_energia: [
    'XZQRTM!!!',
    '%%%ERRO%%%',
    'NÃO EXISTE', 'EXISTE', 'NÃO EXISTE',
    'VOCÊ NÃO É REAL',
    'TUDO É FALSO',
    'HA HA HA HA HA',
    'O VÉU SE ROMPE',
    'CAOS CAOS CAOS',
    'FREQUÊNCIA INSTÁVEL',
    '#@!#@!#@!',
    'SIM NÃO SIM NÃO',
    'O OUTRO LADO PULSA',
    'CONDUTOR DE CAOS',
    '∴∴∴∴∴',
  ],
  // CONHECIMENTO: soberbo, dourado, definitivo
  elem_conhecimento: [
    'SABER TUDO É PERDER TUDO',
    'SABER TUDO É PERDER TUDO',     // aumenta frequência
    'SABER TUDO É PERDER TUDO',     // aumenta frequência
    'SOBERANO',
    'O PREÇO DO SABER',
    'VOCÊ CARREGA DEMAIS',
    'VOCÊ VIU DEMAIS',
    'O CONHECIMENTO TE DESTRÓI',
    'HÁ VERDADES PROIBIDAS',
    'NÃO SE PODE DESAPRENDER',
    'ELES SABEM QUE VOCÊ SABE',
    'O SEGREDO TE CONSOME',
  ],
};

const _ELEM_CFG = {
  // SANGUE: brutal — curto, rápido, sem aviso
  elem_sangue: {
    cls: 'psych-ptext-sangue', anim: 'psych-ptext-sangue', timingFn: 'linear',
    minDelay: 250, maxDelay: 1800, minDur: 0.6, maxDur: 1.5,
    minSize: 30, maxSize: 64,
  },
  // MORTE: perturbadoramente lento
  elem_morte: {
    cls: 'psych-ptext-morte', anim: 'psych-ptext-morte', timingFn: 'ease-in-out',
    minDelay: 5000, maxDelay: 11000, minDur: 11.0, maxDur: 18.0,
    minSize: 22, maxSize: 40,
  },
  // ENERGIA: intervalo caótico, anything goes
  elem_energia: {
    cls: 'psych-ptext-energia', anim: 'psych-ptext-energia', timingFn: 'linear',
    minDelay: 80, maxDelay: 2200, minDur: 0.35, maxDur: 3.0,
    minSize: 12, maxSize: 76, burst: true,
  },
  // CONHECIMENTO: solene, deliberado
  elem_conhecimento: {
    cls: 'psych-ptext-conhecimento', anim: 'psych-ptext-conhecimento', timingFn: 'ease-in-out',
    minDelay: 3500, maxDelay: 8000, minDur: 5.5, maxDur: 10.0,
    minSize: 32, maxSize: 54,
  },
};"""

src = src.replace(OLD_MSGS_CFG, NEW_MSGS_CFG, 1)
print('msgs+cfg:', 'OK' if OLD_MSGS_CFG not in src else 'FAIL')

# ── 2. startElemText — add per-element anim, energia burst, morte spiral ──
OLD_START = """function startElemText(gatilhoId) {
  stopElemText(gatilhoId);
  const msgs = _ELEM_MSGS[gatilhoId];
  const cfg  = _ELEM_CFG[gatilhoId];
  if (!msgs || !cfg) return;
  function spawn() {
    const ov = document.getElementById('psych-overlay');
    if (!ov || !ov.classList.contains('psych-g-' + gatilhoId)) { stopElemText(gatilhoId); return; }
    const el = document.createElement('span');
    el.className = 'psych-paranormal-text ' + cfg.cls;
    el.textContent = msgs[Math.floor(Math.random() * msgs.length)];
    el.style.left = (8 + Math.random() * 78) + '%';
    el.style.top  = (8 + Math.random() * 78) + '%';
    const dur  = cfg.minDur + Math.random() * (cfg.maxDur - cfg.minDur);
    const size = 22 + Math.floor(Math.random() * 36);
    el.style.animationDuration = dur + 's';
    el.style.fontSize = size + 'px';
    ov.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
    const delay = cfg.minDelay + Math.random() * (cfg.maxDelay - cfg.minDelay);
    _elemTextTimeouts[gatilhoId] = setTimeout(spawn, delay);
  }
  spawn();
}

function stopElemText(gatilhoId) {
  if (_elemTextTimeouts[gatilhoId]) { clearTimeout(_elemTextTimeouts[gatilhoId]); delete _elemTextTimeouts[gatilhoId]; }
  const suffix = gatilhoId.replace('elem_', '');
  document.querySelectorAll('.psych-ptext-' + suffix).forEach(e => e.remove());
}"""

NEW_START = """// Morte: persistent spiral
let _morteSpiral = null;

function startMorteSpiral() {
  stopMorteSpiral();
  const ov = document.getElementById('psych-overlay');
  if (!ov) return;
  const el = document.createElement('span');
  el.className = 'psych-morte-spiral';
  el.textContent = '🌀';
  ov.appendChild(el);
  _morteSpiral = el;
}

function stopMorteSpiral() {
  if (_morteSpiral) { try { _morteSpiral.remove(); } catch(_) {} _morteSpiral = null; }
  document.querySelectorAll('.psych-morte-spiral').forEach(e => e.remove());
}

function _spawnElemToken(ov, gatilhoId) {
  const msgs = _ELEM_MSGS[gatilhoId];
  const cfg  = _ELEM_CFG[gatilhoId];
  if (!msgs || !cfg || !ov) return;
  const el = document.createElement('span');
  el.className = 'psych-paranormal-text ' + cfg.cls;
  el.textContent = msgs[Math.floor(Math.random() * msgs.length)];
  el.style.left = (6 + Math.random() * 82) + '%';
  el.style.top  = (6 + Math.random() * 82) + '%';
  const dur  = cfg.minDur  + Math.random() * (cfg.maxDur  - cfg.minDur);
  const size = cfg.minSize + Math.floor(Math.random() * (cfg.maxSize - cfg.minSize));
  el.style.animationDuration       = dur + 's';
  el.style.animationName           = cfg.anim      || 'psych-ptext-appear';
  el.style.animationTimingFunction = cfg.timingFn  || 'ease-in-out';
  el.style.animationFillMode       = 'forwards';
  el.style.fontSize = size + 'px';
  // Energia: random rotation & skew chaos
  if (gatilhoId === 'elem_energia') {
    const rot  = (Math.random() - 0.5) * 40;
    el.style.transform = `translate(-50%,-50%) rotate(${rot}deg)`;
  }
  ov.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

function startElemText(gatilhoId) {
  stopElemText(gatilhoId);
  if (gatilhoId === 'elem_morte') startMorteSpiral();
  const cfg = _ELEM_CFG[gatilhoId];
  if (!cfg) return;
  function spawn() {
    const ov = document.getElementById('psych-overlay');
    if (!ov || !ov.classList.contains('psych-g-' + gatilhoId)) { stopElemText(gatilhoId); return; }
    _spawnElemToken(ov, gatilhoId);
    // Energia burst: sometimes spawn 1-2 extras simultaneously
    if (cfg.burst && Math.random() < 0.45) {
      const extras = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < extras; i++) {
        setTimeout(() => {
          const ov2 = document.getElementById('psych-overlay');
          if (ov2 && ov2.classList.contains('psych-g-' + gatilhoId)) _spawnElemToken(ov2, gatilhoId);
        }, 40 + Math.random() * 220);
      }
    }
    const delay = cfg.minDelay + Math.random() * (cfg.maxDelay - cfg.minDelay);
    _elemTextTimeouts[gatilhoId] = setTimeout(spawn, delay);
  }
  spawn();
}

function stopElemText(gatilhoId) {
  if (_elemTextTimeouts[gatilhoId]) { clearTimeout(_elemTextTimeouts[gatilhoId]); delete _elemTextTimeouts[gatilhoId]; }
  if (gatilhoId === 'elem_morte') stopMorteSpiral();
  const suffix = gatilhoId.replace('elem_', '');
  document.querySelectorAll('.psych-ptext-' + suffix).forEach(e => e.remove());
}"""

src = src.replace(OLD_START, NEW_START, 1)
print('spawner:', 'OK' if OLD_START not in src else 'FAIL')

js_path.write_text(src, encoding='utf-8')
print('JS done.')

# ─────────────────────────────────────────────────────────────────
# style.css
# ─────────────────────────────────────────────────────────────────
css_path = pathlib.Path('METALG/style.css')
css = css_path.read_text(encoding='utf-8')

OLD_PTEXT_SECTION = """/* ── Per-element color variants ──────────────────────────────── */
.psych-ptext-sangue {
  color: rgba(230, 10, 10, 0.93);
  text-shadow:
    0 0 8px  rgba(255,  0,  0, 1),
    0 0 22px rgba(180,  0,  0, 0.7),
    0 0 50px rgba(100,  0,  0, 0.4);
}
.psych-ptext-morte {
  color: rgba(175, 175, 185, 0.88);
  text-shadow:
    0 0 10px rgba(200, 200, 210, 0.8),
    0 0 28px rgba(80,  80, 110, 0.55),
    0 0 55px rgba(20,  20,  40, 0.4);
}
.psych-ptext-energia {
  color: rgba(80, 220, 255, 0.96);
  text-shadow:
    0 0  7px rgba(140, 240, 255, 1),
    0 0 20px rgba(60,  180, 255, 0.8),
    0 0 45px rgba( 0,  100, 200, 0.5),
    0 0 80px rgba( 80,  20, 255, 0.3);
}
.psych-ptext-conhecimento {
  color: rgba(210, 175, 55, 0.92);
  text-shadow:
    0 0  9px rgba(230, 185,  80, 0.9),
    0 0 24px rgba(160, 120,  20, 0.65),
    0 0 55px rgba( 80,  50,   0, 0.4);
}

@keyframes psych-ptext-appear {
  0%   { opacity: 0;    filter: blur(10px) brightness(2); }
  10%  { opacity: 1;    filter: blur(0)    brightness(1); }
  70%  { opacity: 0.9;  filter: blur(0)    brightness(1); }
  90%  { opacity: 0.25; filter: blur(4px)  brightness(0.6); }
  100% { opacity: 0;    filter: blur(10px) brightness(0); }
}"""

NEW_PTEXT_SECTION = """/* ── Per-element color + animation override ──────────────────── */

/* SANGUE — vermelho intenso, brutal: slam on / cut off */
.psych-ptext-sangue {
  color: rgba(255, 10, 10, 1);
  text-shadow:
    0 0 4px  rgba(255,   0,   0, 1),
    0 0 14px rgba(200,   0,   0, 0.9),
    0 0 35px rgba(140,   0,   0, 0.7),
    0 0 70px rgba( 80,   0,   0, 0.4);
  animation-timing-function: linear !important;
}

/* MORTE — cinza, fantasmagórico, quase invisível */
.psych-ptext-morte {
  color: rgba(160, 155, 165, 0.7);
  text-shadow:
    0 0 12px rgba(180, 175, 190, 0.5),
    0 0 30px rgba( 60,  55,  75, 0.3),
    0 0 60px rgba( 10,   8,  20, 0.2);
  filter: grayscale(0.9);
  animation-timing-function: ease-in-out !important;
}

/* ENERGIA — ciano elétrico, mas cores mudam no keyframe */
.psych-ptext-energia {
  color: rgba(80, 220, 255, 1);
  text-shadow:
    0 0  5px rgba(180, 255, 255, 1),
    0 0 18px rgba( 60, 180, 255, 0.9),
    0 0 40px rgba(  0, 100, 200, 0.6),
    0 0 80px rgba(100,  20, 255, 0.4);
  animation-timing-function: linear !important;
}

/* CONHECIMENTO — dourado soberano */
.psych-ptext-conhecimento {
  color: rgba(220, 185, 50, 1);
  text-shadow:
    0 0  6px rgba(255, 220,  80, 1),
    0 0 18px rgba(210, 165,  30, 0.9),
    0 0 40px rgba(150, 100,   0, 0.65),
    0 0 80px rgba( 90,  55,   0, 0.35);
  animation-timing-function: ease-in-out !important;
}

/* ── Fallback keyframe (used by elements without explicit anim) ── */
@keyframes psych-ptext-appear {
  0%   { opacity: 0;    filter: blur(10px) brightness(2); }
  10%  { opacity: 1;    filter: blur(0)    brightness(1); }
  70%  { opacity: 0.9;  filter: blur(0)    brightness(1); }
  90%  { opacity: 0.25; filter: blur(4px)  brightness(0.6); }
  100% { opacity: 0;    filter: blur(10px) brightness(0); }
}

/* ── SANGUE keyframe — abrupt slam, no easing, no mercy ─────── */
@keyframes psych-ptext-sangue {
  0%     { opacity: 0; }
  2%     { opacity: 1;   filter: brightness(3) blur(0); transform: translate(-50%,-50%) scale(1.18); }
  6%     { opacity: 1;   filter: brightness(1.4) blur(0); transform: translate(-50%,-50%) scale(1); }
  80%    { opacity: 1;   filter: brightness(1.1) blur(0); transform: translate(-50%,-50%) scale(1); }
  82%    { opacity: 1;   filter: brightness(2.5) blur(0); transform: translate(-50%,-50%) scale(1.1); }
  83%    { opacity: 0; }
  100%   { opacity: 0; }
}

/* ── MORTE keyframe — perturbadoramente lento, mal visível ───── */
@keyframes psych-ptext-morte {
  0%   { opacity: 0;    filter: blur(18px) brightness(0.15) grayscale(1); transform: translate(-50%,-50%) scale(0.9); }
  20%  { opacity: 0.12; filter: blur(10px) brightness(0.3)  grayscale(1); transform: translate(-50%,-50%) scale(0.94); }
  45%  { opacity: 0.38; filter: blur(3px)  brightness(0.5)  grayscale(1); transform: translate(-50%,-50%) scale(1); }
  60%  { opacity: 0.42; filter: blur(2px)  brightness(0.55) grayscale(1); transform: translate(-50%,-50%) scale(1); }
  80%  { opacity: 0.25; filter: blur(7px)  brightness(0.35) grayscale(1); transform: translate(-50%,-50%) scale(0.96); }
  95%  { opacity: 0.08; filter: blur(14px) brightness(0.15) grayscale(1); transform: translate(-50%,-50%) scale(0.91); }
  100% { opacity: 0;    filter: blur(20px) brightness(0)    grayscale(1); transform: translate(-50%,-50%) scale(0.87); }
}

/* ── ENERGIA keyframe — loucura pura, flicker e hue insano ───── */
@keyframes psych-ptext-energia {
  0%   { opacity: 0;    filter: blur(4px) hue-rotate(0deg)   brightness(2);   transform: translate(-50%,-50%) scale(0.8) skewX(0); }
  5%   { opacity: 1;    filter: blur(0)   hue-rotate(90deg)  brightness(2.5); transform: translate(-50%,-50%) scale(1.2) skewX(8deg); }
  12%  { opacity: 0.15; filter: blur(6px) hue-rotate(200deg) brightness(0.4); }
  18%  { opacity: 1;    filter: blur(0)   hue-rotate(280deg) brightness(2);   transform: translate(-50%,-50%) scale(0.85) skewX(-6deg); }
  30%  { opacity: 0.6;  filter: blur(3px) hue-rotate(50deg)  brightness(1.2); }
  42%  { opacity: 1;    filter: blur(0)   hue-rotate(170deg) brightness(2.8); transform: translate(-50%,-50%) scale(1.12) skewX(4deg); }
  55%  { opacity: 0.2;  filter: blur(7px) hue-rotate(330deg) brightness(0.3); }
  65%  { opacity: 1;    filter: blur(0)   hue-rotate(30deg)  brightness(2.2); transform: translate(-50%,-50%) scale(0.9) skewX(-3deg); }
  80%  { opacity: 0.1;  filter: blur(5px) hue-rotate(250deg) brightness(0.5); }
  90%  { opacity: 0.8;  filter: blur(0)   hue-rotate(120deg) brightness(1.5); }
  100% { opacity: 0;    filter: blur(12px) hue-rotate(360deg) brightness(0);  transform: translate(-50%,-50%) scale(0.5); }
}

/* ── CONHECIMENTO keyframe — soberbo, dourado, lento e majestoso */
@keyframes psych-ptext-conhecimento {
  0%   { opacity: 0;    filter: blur(14px) brightness(5) sepia(0.7);  transform: translate(-50%,-50%) scale(0.88); }
  10%  { opacity: 0.5;  filter: blur(5px)  brightness(2.5) sepia(0.4); transform: translate(-50%,-50%) scale(0.98); }
  22%  { opacity: 1;    filter: blur(0)    brightness(1.8) sepia(0.1); transform: translate(-50%,-50%) scale(1.02); }
  50%  { opacity: 1;    filter: blur(0)    brightness(2.0) sepia(0.05); }
  65%  { opacity: 1;    filter: blur(0)    brightness(1.6) sepia(0.1);  transform: translate(-50%,-50%) scale(1); }
  85%  { opacity: 0.55; filter: blur(3px)  brightness(1)   sepia(0.3); transform: translate(-50%,-50%) scale(0.97); }
  95%  { opacity: 0.15; filter: blur(9px)  brightness(0.5) sepia(0.6); transform: translate(-50%,-50%) scale(0.93); }
  100% { opacity: 0;    filter: blur(16px) brightness(0.1) sepia(0.8); transform: translate(-50%,-50%) scale(0.88); }
}

/* ── Morte: espiral da morte ─────────────────────────────────── */
.psych-morte-spiral {
  position: absolute;
  font-size: 220px;
  line-height: 1;
  left: 50%;
  top: 50%;
  pointer-events: none;
  z-index: 9999;
  filter: grayscale(1) brightness(0.28) contrast(0.7);
  transform-origin: center;
  animation: psych-morte-spiral-spin 55s linear infinite,
             psych-morte-spiral-pulse 14s ease-in-out infinite;
}

@keyframes psych-morte-spiral-spin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to   { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes psych-morte-spiral-pulse {
  0%,100% { opacity: 0.18; }
  50%     { opacity: 0.38; }
}"""

css = css.replace(OLD_PTEXT_SECTION, NEW_PTEXT_SECTION, 1)
print('CSS ptext section:', 'OK' if OLD_PTEXT_SECTION not in css else 'FAIL')

css_path.write_text(css, encoding='utf-8')
print('CSS done.')
