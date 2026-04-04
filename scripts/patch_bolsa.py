import re

with open('METALG/main.js', 'r', encoding='utf-8') as f:
    src = f.read()

# ── renderBolsaActions replacement ──────────────────────────────────────────
NEW_FN = r"""function renderBolsaActions() {
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
}"""

start_marker = 'function renderBolsaActions() {'
end_marker   = '\nfunction bolsaItemClick(idx) {'

start = src.find(start_marker)
end   = src.find(end_marker)
if start == -1 or end == -1:
    print(f'ERROR: markers not found: start={start}, end={end}')
else:
    new_src = src[:start] + NEW_FN + src[end:]
    with open('METALG/main.js', 'w', encoding='utf-8') as f:
        f.write(new_src)
    print(f'OK: replaced {end-start} chars with {len(NEW_FN)} chars')

# ── GM armas: add mod checkboxes, filter consumables from weapon type select ─
with open('METALG/main.js', 'r', encoding='utf-8') as f:
    src = f.read()

OLD_TIPO_OPTS = "    const tipoOpts = Object.entries(ARMA_TIPOS).map(([k, v]) =>\n      `<option value=\"${k}\" ${arma.tipo === k ? 'selected' : ''}>${v.label}</option>`\n    ).join('');"
NEW_TIPO_OPTS = "    const tipoOpts = Object.entries(ARMA_TIPOS).filter(([,v]) => !v.consumivel).map(([k, v]) =>\n      `<option value=\"${k}\" ${arma.tipo === k ? 'selected' : ''}>${v.label}</option>`\n    ).join('');"

OLD_MODS_INPUT = "        <input class=\"gm-text-input\" id=\"gm-arma-mods-${char.codename}-${i}\" placeholder=\"modificadores (sep. por vírgulas)\" value=\"${escHtml(modsVal)}\" maxlength=\"120\" />"
NEW_MODS_INPUT = """        <div class="gm-arma-mods-row">
          ${Object.entries(ARMA_MODS).map(([k, m]) =>
            `<label class="gm-mod-check"><input type="checkbox" id="gm-arma-mod-${k}-${char.codename}-${i}" ${arma.mods?.[k] ? 'checked' : ''} /><span>${m.ico} ${m.label}</span></label>`
          ).join('')}
        </div>"""

src2 = src.replace(OLD_TIPO_OPTS, NEW_TIPO_OPTS, 1)
if src2 == src:
    print('WARNING: tipoOpts replacement not found')
else:
    print('OK: tipoOpts filtered')
src = src2

src2 = src.replace(OLD_MODS_INPUT, NEW_MODS_INPUT, 1)
if src2 == src:
    print('WARNING: mods input replacement not found — trying substr search')
    idx = src.find('gm-arma-mods-${char.codename}')
    print(f'  found at: {idx}')
    print(repr(src[idx-10:idx+120]))
else:
    print('OK: mods checkboxes')
src = src2

# ── gmSalvarArma: read checkboxes, build mods object ─────────────────────────
OLD_MODS_READ = """  const modsRaw     = get(`gm-arma-mods-${codename}-${slot}`)?.value || '';
  const descricao   = get(`gm-arma-desc-${codename}-${slot}`)?.value.trim();
  const modificadores = modsRaw.split(',').map(s => s.trim()).filter(Boolean);
  const arma = { tipo, nome, dano, alcance, tipoDano, modificadores, descricao };"""

NEW_MODS_READ = """  const descricao   = get(`gm-arma-desc-${codename}-${slot}`)?.value.trim();
  const mods = Object.fromEntries(
    Object.keys(ARMA_MODS).map(k => [k, !!(get(`gm-arma-mod-${k}-${codename}-${slot}`)?.checked)])
  );
  const modificadores = Object.entries(ARMA_MODS).filter(([k]) => mods[k]).map(([,m]) => m.label);
  const arma = { tipo, nome, dano, alcance, tipoDano, mods, modificadores, descricao };"""

src2 = src.replace(OLD_MODS_READ, NEW_MODS_READ, 1)
if src2 == src:
    print('WARNING: gmSalvarArma mods read not found')
    idx = src.find('modsRaw')
    print(f'  modsRaw at: {idx}')
    if idx != -1: print(repr(src[idx-5:idx+120]))
else:
    print('OK: gmSalvarArma updated')
src = src2

# ── updateArmaDisplay: add mod strip ─────────────────────────────────────────
OLD_INSP = "      inspB.classList.remove('hidden');\n      slot.classList.add('arma-equipada');\n    } else {"
NEW_INSP = """      inspB.classList.remove('hidden');
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
    } else {"""

src2 = src.replace(OLD_INSP, NEW_INSP, 1)
if src2 == src:
    print('WARNING: updateArmaDisplay mod strip not found')
    idx = src.find("inspB.classList.remove('hidden')")
    print(f'  inspB at: {idx}')
    if idx != -1: print(repr(src[idx:idx+80]))
else:
    print('OK: updateArmaDisplay mod strip added')
src = src2

# ── updateArmaDisplay: hide mod strip on empty slot ───────────────────────────
OLD_EMPTY = "      if (letal) { letal.textContent = ''; letal.className = 'arma-letal-badge hidden'; }\n      inspB.classList.add('hidden');\n      slot.classList.remove('arma-equipada');"
NEW_EMPTY = """      if (letal) { letal.textContent = ''; letal.className = 'arma-letal-badge hidden'; }
      inspB.classList.add('hidden');
      slot.classList.remove('arma-equipada');
      const modsElE = $('arma-mods-' + i);
      if (modsElE) { modsElE.innerHTML = ''; modsElE.classList.add('hidden'); }"""

src2 = src.replace(OLD_EMPTY, NEW_EMPTY, 1)
if src2 == src:
    print('WARNING: empty slot mod clear not found')
else:
    print('OK: empty slot mod strip cleared')
src = src2

with open('METALG/main.js', 'w', encoding='utf-8') as f:
    f.write(src)
print('ALL DONE')
