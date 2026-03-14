with open('METALG/main.js', 'r', encoding='utf-8') as f:
    src = f.read()

# ── 1. DEFAULT_CHAR: add psych field ────────────────────────────
OLD_DEFAULT = """  aparencia: {
    cor:        'vermelho',
    fotoFiltro: 'padrao',
    carimbo:    'nenhum'
  },
  updatedAt: null
});"""

NEW_DEFAULT = """  aparencia: {
    cor:        'vermelho',
    fotoFiltro: 'padrao',
    carimbo:    'nenhum'
  },
  psych: {
    insanidade: 0,      // 0-100
    medicado:   false,
    gatilhos:   []      // ids de efeitos ativos
  },
  updatedAt: null
});"""

src = src.replace(OLD_DEFAULT, NEW_DEFAULT, 1)
print('DEFAULT_CHAR:', 'OK' if OLD_DEFAULT not in src else 'FAIL')

# ── 2. onSnapshot listener: call applyPsychEffects on change ────
OLD_SNAP = """      // Refresh bolsa tab if open
      if (state.currentTab === 'bolsa') renderBolsa();
    });"""

NEW_SNAP = """      // Refresh bolsa tab if open
      if (state.currentTab === 'bolsa') renderBolsa();

      // Apply psychological effects
      applyPsychEffects(data.psych);
    });"""

src = src.replace(OLD_SNAP, NEW_SNAP, 1)
print('onSnapshot:', 'OK' if OLD_SNAP not in src else 'FAIL')

# ── 3. GM card: add psych section before zona de perigo ─────────
OLD_DANGER = """      <div class="gm-ctrl-group gm-danger-zone">
        <div class="gm-ctrl-label">⬡ ZONA DE PERIGO</div>
        <button id="gm-delete-btn-${char.codename}" class="gm-delete-btn"
                onclick="App.gmDeleteOperador('${char.codename}')">✕ DELETAR PERFIL</button>
        <div class="gm-delete-hint">Clique uma vez para armar · Clique novamente para confirmar</div>
      </div>"""

NEW_DANGER = r"""      <div class="gm-ctrl-group">
        <div class="gm-ctrl-label">⬡ ARQUIVO PSICOLÓGICO</div>
        ${buildGMPsychHtml(char)}
      </div>
      <div class="gm-ctrl-group gm-danger-zone">
        <div class="gm-ctrl-label">⬡ ZONA DE PERIGO</div>
        <button id="gm-delete-btn-${char.codename}" class="gm-delete-btn"
                onclick="App.gmDeleteOperador('${char.codename}')">✕ DELETAR PERFIL</button>
        <div class="gm-delete-hint">Clique uma vez para armar · Clique novamente para confirmar</div>
      </div>"""

src = src.replace(OLD_DANGER, NEW_DANGER, 1)
print('GM card psych section:', 'OK' if OLD_DANGER not in src else 'FAIL')

# ── 4. Insert psych functions after gmDeleteOperador ────────────
PSYCH_CODE = r"""
// ══════════════════════════════════════════════════════════════
//  ARQUIVO PSICOLÓGICO — constants & render
// ══════════════════════════════════════════════════════════════
const PSYCH_GATILHOS = [
  { id: 'paranoia',       label: 'PARANOIA',         desc: 'Sente que está sendo observado.',       ico: '👁' },
  { id: 'alucinacao',     label: 'ALUCINAÇÃO',        desc: 'Percebe coisas que não existem.',       ico: '◈' },
  { id: 'dissociacao',    label: 'DISSOCIAÇÃO',       desc: 'Desconexão da realidade circundante.',  ico: '◌' },
  { id: 'flashback',      label: 'FLASHBACK',         desc: 'Memórias intrusivas de trauma.',        ico: '▶' },
  { id: 'fobia_escuridao',label: 'FOBIA: ESCURIDÃO', desc: 'Terror irracional em ambientes escuros.',ico: '▪' },
  { id: 'fobia_abandono', label: 'FOBIA: ABANDONO',  desc: 'Medo patológico de ser deixado sozinho.',ico: '◯' },
  { id: 'mania_controle', label: 'MANIA DE CONTROLE',desc: 'Necessidade compulsiva de controla tudo.',ico: '⊞' },
];

const PSYCH_LEVELS = [
  { min: 0,  max: 20,  id: 'estavel',    label: 'ESTÁVEL',       color: '#44aa55' },
  { min: 21, max: 40,  id: 'perturbado', label: 'PERTURBADO',    color: '#aaaa33' },
  { min: 41, max: 60,  id: 'instavel',   label: 'INSTÁVEL',      color: '#cc8822' },
  { min: 61, max: 80,  id: 'fragmentado',label: 'FRAGMENTADO',   color: '#cc4422' },
  { min: 81, max: 100, id: 'colapso',    label: 'COLAPSO TOTAL', color: '#cc0000' },
];

function getPsychLevel(insanidade) {
  return PSYCH_LEVELS.find(l => insanidade >= l.min && insanidade <= l.max) || PSYCH_LEVELS[0];
}

function buildGMPsychHtml(char) {
  const psych      = char.psych || { insanidade: 0, medicado: false, gatilhos: [] };
  const insanidade = psych.insanidade ?? 0;
  const medicado   = psych.medicado ?? false;
  const gatilhos   = psych.gatilhos || [];
  const lvl        = getPsychLevel(insanidade);

  const gatilhosHtml = PSYCH_GATILHOS.map(g => {
    const on = gatilhos.includes(g.id);
    return `<label class="gm-gatilho-item${on ? ' active' : ''}${medicado ? ' med-off' : ''}" title="${g.desc}">
      <input type="checkbox" ${on ? 'checked' : ''} ${medicado ? 'disabled' : ''}
             onchange="App.gmToggleGatilho('${char.codename}','${g.id}',this.checked)" />
      <span class="gatilho-ico">${g.ico}</span>
      <span class="gatilho-lbl">${g.label}</span>
    </label>`;
  }).join('');

  return `
    <div class="gm-psych-panel">
      <div class="gm-psych-top">
        <div class="gm-psych-lv-badge" style="color:${lvl.color};border-color:${lvl.color}44">${lvl.label}</div>
        <label class="gm-med-toggle${medicado ? ' active' : ''}">
          <input type="checkbox" ${medicado ? 'checked' : ''}
                 onchange="App.gmSetMedicado('${char.codename}',this.checked)" />
          <span>💊 MEDICADO</span>
        </label>
      </div>
      <div class="gm-psych-slider-wrap">
        <div class="gm-psych-slider-labels">
          <span>0</span><span>INSANIDADE</span><span>100</span>
        </div>
        <input type="range" min="0" max="100" value="${insanidade}"
               class="gm-psych-slider" id="gm-psych-slider-${char.codename}"
               style="--psych-color:${lvl.color}"
               oninput="App.gmPsychSliderInput('${char.codename}',this.value)"
               onchange="App.gmSavePsych('${char.codename}')" />
        <div class="gm-psych-bar-preview">
          <div class="gm-psych-bar-fill" id="gm-psych-bar-${char.codename}"
               style="width:${insanidade}%;background:${lvl.color}"></div>
          <span class="gm-psych-val" id="gm-psych-val-${char.codename}">${insanidade}</span>
        </div>
      </div>
      <div class="gm-ctrl-label" style="margin-top:8px;margin-bottom:4px">GATILHOS ATIVOS</div>
      <div class="gm-gatilhos-grid">${gatilhosHtml}</div>
    </div>`;
}

// ── GM actions ──────────────────────────────────────────────────
function gmPsychSliderInput(codename, val) {
  const intVal = parseInt(val);
  const lvl    = getPsychLevel(intVal);
  const bar    = document.getElementById('gm-psych-bar-' + codename);
  const valEl  = document.getElementById('gm-psych-val-' + codename);
  const slider = document.getElementById('gm-psych-slider-' + codename);
  const badge  = slider?.closest('.gm-psych-panel')?.querySelector('.gm-psych-lv-badge');
  if (bar)   { bar.style.width = intVal + '%'; bar.style.background = lvl.color; }
  if (valEl) valEl.textContent = intVal;
  if (badge) { badge.textContent = lvl.label; badge.style.color = lvl.color; badge.style.borderColor = lvl.color + '44'; }
  if (slider) slider.style.setProperty('--psych-color', lvl.color);
}

async function gmSavePsych(codename) {
  const slider = document.getElementById('gm-psych-slider-' + codename);
  if (!slider) return;
  const insanidade = parseInt(slider.value);
  let cur = {};
  if (firebaseOk) {
    try { const s = await getDoc(doc(db,'characters',codename)); if (s.exists()) cur = s.data().psych || {}; } catch(_) {}
  } else {
    const ch = LocalDB.getChar(codename); if (ch) cur = ch.psych || {};
  }
  await gmUpdateChar(codename, { psych: { ...cur, insanidade } });
  sfx('select');
}

async function gmToggleGatilho(codename, gatilhoId, on) {
  let cur = { insanidade: 0, medicado: false, gatilhos: [] };
  if (firebaseOk) {
    try { const s = await getDoc(doc(db,'characters',codename)); if (s.exists()) cur = s.data().psych || cur; } catch(_) {}
  } else {
    const ch = LocalDB.getChar(codename); if (ch) cur = ch.psych || cur;
  }
  const gatilhos = [...(cur.gatilhos || [])];
  if (on && !gatilhos.includes(gatilhoId)) gatilhos.push(gatilhoId);
  if (!on) { const i = gatilhos.indexOf(gatilhoId); if (i !== -1) gatilhos.splice(i, 1); }
  await gmUpdateChar(codename, { psych: { ...cur, gatilhos } });
}

async function gmSetMedicado(codename, medicado) {
  let cur = { insanidade: 0, medicado: false, gatilhos: [] };
  if (firebaseOk) {
    try { const s = await getDoc(doc(db,'characters',codename)); if (s.exists()) cur = s.data().psych || cur; } catch(_) {}
  } else {
    const ch = LocalDB.getChar(codename); if (ch) cur = ch.psych || cur;
  }
  await gmUpdateChar(codename, { psych: { ...cur, medicado } });
  sfx('select');
  showToast(medicado ? '💊 Medicação ativada — efeitos suprimidos.' : '⚠ Medicação removida.', medicado ? 'success' : 'error', 2500);
}

// ── Player: apply effects ────────────────────────────────────────
function applyPsychEffects(psych) {
  const body     = document.body;
  const overlay  = document.getElementById('psych-overlay');
  const insanidade = psych?.insanidade ?? 0;
  const medicado   = psych?.medicado   ?? false;
  const gatilhos   = psych?.gatilhos   ?? [];

  // Remove all psych classes
  ['psych-lv1','psych-lv2','psych-lv3','psych-lv4','psych-medicado'].forEach(c => body.classList.remove(c));
  if (overlay) overlay.className = 'psych-overlay';

  if (medicado) {
    body.classList.add('psych-medicado');
    return;
  }

  const lvl = getPsychLevel(insanidade);
  if      (lvl.id === 'perturbado')  { body.classList.add('psych-lv1'); if (overlay) overlay.classList.add('psych-overlay-lv1'); }
  else if (lvl.id === 'instavel')    { body.classList.add('psych-lv2'); if (overlay) overlay.classList.add('psych-overlay-lv2'); }
  else if (lvl.id === 'fragmentado') { body.classList.add('psych-lv3'); if (overlay) overlay.classList.add('psych-overlay-lv3'); }
  else if (lvl.id === 'colapso')     { body.classList.add('psych-lv4'); if (overlay) overlay.classList.add('psych-overlay-lv4'); }

  // Gatilhos: add special body classes
  if (overlay) {
    gatilhos.forEach(g => overlay.classList.add('psych-g-' + g));
  }
}

"""

# Insert before gmDeleteOperador or near end of GM functions
INSERT_BEFORE = 'async function gmDeleteOperador(codename) {'
idx = src.find(INSERT_BEFORE)
if idx == -1:
    print('FAIL: gmDeleteOperador not found')
else:
    src = src[:idx] + PSYCH_CODE + src[idx:]
    print('Psych functions: OK')

# ── 5. Export to window.App ──────────────────────────────────────
OLD_EXPORTS = '  gmDeleteOperador,'
NEW_EXPORTS = """  gmDeleteOperador,
  gmSavePsych, gmToggleGatilho, gmSetMedicado, gmPsychSliderInput,"""

src = src.replace(OLD_EXPORTS, NEW_EXPORTS, 1)
print('Exports:', 'OK' if OLD_EXPORTS not in src else 'FAIL')

with open('METALG/main.js', 'w', encoding='utf-8') as f:
    f.write(src)
print('JS done.')
