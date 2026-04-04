
import pathlib

# ─────────────────────────────────────────────────────────────────
# main.js patches
# ─────────────────────────────────────────────────────────────────
js_path = pathlib.Path('METALG/main.js')
src = js_path.read_text(encoding='utf-8')

# ── 1. Add 4 new gatilhos to PSYCH_GATILHOS ──────────────────────
OLD_GATILHOS = """  { id: 'mania_controle', label: 'MANIA DE CONTROLE',desc: 'Necessidade compulsiva de controla tudo.',ico: '⊞' },
];"""

NEW_GATILHOS = """  { id: 'mania_controle', label: 'MANIA DE CONTROLE',desc: 'Necessidade compulsiva de controla tudo.',ico: '⊞' },
  // ── Elementos de Ordem Paranormal ──────────────────────────────
  { id: 'elem_sangue',       label: 'SANGUE',        desc: 'O elemento do sangue corrompe a mente.', ico: '🩸' },
  { id: 'elem_morte',        label: 'MORTE',         desc: 'A morte sussurra de perto.',             ico: '💀' },
  { id: 'elem_energia',      label: 'ENERGIA',       desc: 'A energia do Outro Lado invade a psique.',ico: '⚡' },
  { id: 'elem_conhecimento', label: 'CONHECIMENTO',  desc: 'Saber demais tem um custo.',             ico: '📖' },
];"""

src = src.replace(OLD_GATILHOS, NEW_GATILHOS, 1)
print('PSYCH_GATILHOS:', 'OK' if OLD_GATILHOS not in src else 'FAIL')

# ── 2. Insert element text spawner code before paranoia eye spawner
ELEM_CODE = r"""// ══════════════════════════════════════════════════════════════
//  ELEMENTOS PARANORMAIS — text spawner (Sigilos do Outro Lado)
// ══════════════════════════════════════════════════════════════
const _ELEM_MSGS = {
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
};

let _elemTextTimeouts = {};

function startElemText(gatilhoId) {
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
}

"""

INSERT_BEFORE = '// ── Paranoia eye spawner ────'
idx = src.find(INSERT_BEFORE)
if idx == -1:
    print('FAIL: paranoia eye spawner anchor not found')
else:
    src = src[:idx] + ELEM_CODE + src[idx:]
    print('Elem text spawner: OK')

# ── 3. Hook into applyPsychEffects ────────────────────────────────
OLD_HOOK = """  // Paranoia: spawn/stop roaming eyes
  if (!medicado && gatilhos.includes('paranoia') && overlay) {
    startParanoiaEyes(overlay);
  } else {
    stopParanoiaEyes();
  }
}"""

NEW_HOOK = """  // Paranoia: spawn/stop roaming eyes
  if (!medicado && gatilhos.includes('paranoia') && overlay) {
    startParanoiaEyes(overlay);
  } else {
    stopParanoiaEyes();
  }

  // Paranormal elements: spawn/stop text
  ['elem_sangue','elem_morte','elem_energia','elem_conhecimento'].forEach(id => {
    if (!medicado && gatilhos.includes(id) && overlay) startElemText(id);
    else stopElemText(id);
  });
}"""

src = src.replace(OLD_HOOK, NEW_HOOK, 1)
print('applyPsychEffects hook:', 'OK' if OLD_HOOK not in src else 'FAIL')

js_path.write_text(src, encoding='utf-8')
print('JS done.')

# ─────────────────────────────────────────────────────────────────
# style.css patches
# ─────────────────────────────────────────────────────────────────
css_path = pathlib.Path('METALG/style.css')
css = css_path.read_text(encoding='utf-8')

CSS_ADD = """
/* ══════════════════════════════════════════════════════════════
   ELEMENTOS PARANORMAIS — font, overlay effects, text tokens
   ══════════════════════════════════════════════════════════════ */

@font-face {
  font-family: 'SigilosOP';
  src: url('fontes/SigilosDoOutroLado-Regular.ttf') format('truetype');
  font-display: swap;
}

/* ── Paranormal text base (spawned by startElemText) ─────────── */
.psych-paranormal-text {
  position: absolute;
  pointer-events: none;
  font-family: 'SigilosOP', monospace;
  font-weight: normal;
  line-height: 1.3;
  text-align: center;
  white-space: nowrap;
  transform: translate(-50%, -50%);
  animation: psych-ptext-appear 4s ease-in-out forwards;
  z-index: 10000;
  will-change: opacity, filter;
  letter-spacing: 0.06em;
}

/* ── Per-element color variants ──────────────────────────────── */
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
}

/* ── Overlay tints per element ───────────────────────────────── */
.psych-overlay.psych-g-elem_sangue {
  animation: psych-sangue-ov 5s ease-in-out infinite;
}
.psych-overlay.psych-g-elem_morte {
  animation: psych-morte-ov 7s ease-in-out infinite;
}
.psych-overlay.psych-g-elem_energia {
  animation: psych-energia-ov 0.9s steps(1) infinite;
}
.psych-overlay.psych-g-elem_conhecimento {
  animation: psych-conhecimento-ov 8s ease-in-out infinite;
}

@keyframes psych-sangue-ov {
  0%,100% { background: rgba(0,0,0,0); }
  40%,60% { background: rgba(80, 0, 0, 0.38); }
}

@keyframes psych-morte-ov {
  0%,100% {
    background: rgba(0,0,0,0);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
  40%,60% {
    background: rgba(5, 5, 15, 0.5);
    -webkit-backdrop-filter: saturate(0.05) brightness(0.65) grayscale(1);
    backdrop-filter: saturate(0.05) brightness(0.65) grayscale(1);
  }
}

@keyframes psych-energia-ov {
  0%,80%,100% { box-shadow: none;  background: transparent; }
  81%  { box-shadow: inset 0 0 50px rgba(100,200,255,0.55); background: rgba(15,50,90,0.14); }
  82%  { box-shadow: none;  background: transparent; }
  88%  { box-shadow: inset 0 0 90px rgba(140,80,255,0.45);  background: rgba(35,10,75,0.16); }
  89%  { box-shadow: none;  background: transparent; }
  94%  { box-shadow: inset 0 0 35px rgba(60,220,255,0.35);  background: rgba(0,35,60,0.10); }
  95%  { box-shadow: none;  background: transparent; }
}

@keyframes psych-conhecimento-ov {
  0%,100% {
    background: rgba(0,0,0,0);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
  40%,60% {
    background: rgba(30, 20, 0, 0.28);
    -webkit-backdrop-filter: sepia(0.5) brightness(0.85);
    backdrop-filter: sepia(0.5) brightness(0.85);
  }
}
"""

if 'ELEMENTOS PARANORMAIS' not in css:
    css_path.write_text(css + CSS_ADD, encoding='utf-8')
    print('CSS appended OK')
else:
    print('CSS already present — skipped')
