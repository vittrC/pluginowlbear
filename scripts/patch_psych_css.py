import pathlib

CSS_BLOCK = """

/* ══════════════════════════════════════════════════════════════
   ARQUIVO PSICOLÓGICO — insanity system
   ══════════════════════════════════════════════════════════════ */

/* ── Psych overlay (full-screen effect layer) ───────────────── */
.psych-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9998;
  transition: opacity 1.2s;
}

/* ── Level 1: PERTURBADO (21-40) — dark vignette ──────────────*/
.psych-lv1 .psych-overlay {
  box-shadow: inset 0 0 120px rgba(0,0,0,0.55);
}
.psych-lv1 #screen-main {
  animation: psych-subtle-flicker 14s infinite;
}

/* ── Level 2: INSTÁVEL (41-60) — vignette + desaturation ──────*/
.psych-lv2 .psych-overlay {
  box-shadow: inset 0 0 180px rgba(0,0,0,0.75);
  background: radial-gradient(ellipse at center,
    transparent 30%,
    rgba(10,0,0,0.35) 80%,
    rgba(0,0,0,0.65) 100%
  );
}
.psych-lv2 #screen-main {
  filter: saturate(0.4) brightness(0.88);
  animation: psych-subtle-flicker 7s infinite, psych-drift 18s ease-in-out infinite;
}

/* ── Level 3: FRAGMENTADO (61-80) — red tint + scanlines ──────*/
.psych-lv3 .psych-overlay {
  background:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 3px,
      rgba(180,0,0,0.06) 3px,
      rgba(180,0,0,0.06) 4px
    ),
    radial-gradient(ellipse at center,
      transparent 20%,
      rgba(80,0,0,0.4) 75%,
      rgba(20,0,0,0.8) 100%
    );
  box-shadow: inset 0 0 200px rgba(100,0,0,0.5);
  animation: psych-scanlines 0.08s steps(1) infinite;
}
.psych-lv3 #screen-main {
  filter: saturate(0.2) sepia(0.3) brightness(0.78) hue-rotate(-12deg);
  animation:
    psych-subtle-flicker 4s infinite,
    psych-drift 10s ease-in-out infinite,
    psych-glitch-shift 9s infinite;
}
.psych-lv3 .panel-label,
.psych-lv3 .attr-label,
.psych-lv3 .gm-ctrl-label {
  animation: psych-text-corrupt 6s infinite;
}

/* ── Level 4: COLAPSO TOTAL (81-100) — full chaos ─────────────*/
.psych-lv4 .psych-overlay {
  background:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(200,20,20,0.12) 2px,
      rgba(200,20,20,0.12) 3px
    ),
    radial-gradient(ellipse at center,
      rgba(30,0,0,0.3) 0%,
      rgba(80,0,0,0.6) 60%,
      rgba(10,0,0,0.95) 100%
    );
  animation: psych-heavy-scanlines 0.06s steps(1) infinite, psych-rgbsplit 0.15s infinite;
  box-shadow:
    inset 0 0 250px rgba(150,0,0,0.7),
    inset 0 0 80px rgba(0,200,0,0.08);
}
.psych-lv4 #screen-main {
  filter: saturate(0) sepia(0.6) brightness(0.65) hue-rotate(-20deg);
  animation:
    psych-subtle-flicker 1.8s infinite,
    psych-shake 0.12s infinite,
    psych-drift 6s ease-in-out infinite,
    psych-glitch-shift 3s infinite;
}
.psych-lv4 .panel-label,
.psych-lv4 .attr-label,
.psych-lv4 .tab-label,
.psych-lv4 .gm-ctrl-label {
  animation: psych-text-corrupt 2.5s infinite;
}
.psych-lv4 .char-bar-fill,
.psych-lv4 .integrity-fill {
  animation: psych-bar-flicker 0.4s infinite;
}

/* ── Medicado: soft green aura on body ─────────────────────── */
.psych-medicado #screen-main {
  filter: none;
  animation: none;
}
.psych-medicado .psych-overlay {
  box-shadow: inset 0 0 60px rgba(0,50,20,0.25);
}

/* Gatilho: paranoia — pulsing edges */
.psych-overlay.psych-g-paranoia {
  animation: psych-paranoia-pulse 3.5s ease-in-out infinite;
}
/* Gatilho: alucinação — color ghost flicker */
.psych-overlay.psych-g-alucinacao {
  animation: psych-alucinacao 4s steps(1) infinite;
}
/* Gatilho: dissociação — slow zoom drift */
.psych-lv2.psych-overlay.psych-g-dissociacao #screen-main,
.psych-lv3 .psych-overlay.psych-g-dissociacao ~ #screen-main,
.psych-lv4 .psych-overlay.psych-g-dissociacao ~ #screen-main {
  animation: psych-dissociacao 12s ease-in-out infinite,
             psych-shake 0.3s infinite !important;
}

/* ── Keyframes ────────────────────────────────────────────────── */
@keyframes psych-subtle-flicker {
  0%,96%        { opacity: 1; }
  97%           { opacity: 0.85; }
  98%           { opacity: 1; }
  99%           { opacity: 0.9; }
  100%          { opacity: 1; }
}

@keyframes psych-drift {
  0%,100% { transform: translate(0,0) rotate(0deg); }
  25%     { transform: translate(0.5px,-0.5px) rotate(0.03deg); }
  50%     { transform: translate(-0.5px,1px) rotate(-0.04deg); }
  75%     { transform: translate(1px,0.5px) rotate(0.02deg); }
}

@keyframes psych-glitch-shift {
  0%,90%,100% { transform: none; }
  91%         { transform: translateX(-3px) skewX(-0.5deg); filter: hue-rotate(30deg); }
  92%         { transform: translateX(4px) skewX(0.5deg); }
  93%         { transform: none; filter: none; }
  96%         { transform: translateX(-2px); clip-path: inset(20% 0 60% 0); }
  97%         { transform: translateX(3px); clip-path: inset(0 0 0 0); }
}

@keyframes psych-shake {
  0%,100% { transform: translate(0,0); }
  10%     { transform: translate(-1px, 1px); }
  20%     { transform: translate(1px, -1px); }
  30%     { transform: translate(-2px, 0); }
  40%     { transform: translate(2px, 1px); }
  50%     { transform: translate(0, -1px); }
  60%     { transform: translate(-1px, 2px); }
  70%     { transform: translate(1px, 0); }
  80%     { transform: translate(-2px, -1px); }
  90%     { transform: translate(0, 2px); }
}

@keyframes psych-text-corrupt {
  0%,85%,100% { letter-spacing: inherit; opacity: 1; }
  86%         { letter-spacing: 0.25em; opacity: 0.7; }
  87%         { letter-spacing: inherit; opacity: 1; }
  92%         { opacity: 0.5; filter: blur(1px); }
  93%         { opacity: 1; filter: none; }
}

@keyframes psych-bar-flicker {
  0%,40%,100% { opacity: 1; }
  41%         { opacity: 0.4; }
  42%         { opacity: 1; }
}

@keyframes psych-scanlines {
  0%  { background-position: 0 0; }
  100%{ background-position: 0 4px; }
}
@keyframes psych-heavy-scanlines {
  0%  { background-position: 0 0; }
  100%{ background-position: 0 3px; }
}

@keyframes psych-rgbsplit {
  0%,90%,100% { box-shadow: inset 0 0 250px rgba(150,0,0,0.7), inset 0 0 80px rgba(0,200,0,0.08); }
  92%         { box-shadow: inset 0 0 250px rgba(150,0,0,0.7), inset 0 0 80px rgba(0,200,0,0.08), inset 2px 0 rgba(0,255,0,0.2), inset -3px 0 rgba(220,0,0,0.3); }
}

@keyframes psych-paranoia-pulse {
  0%,100% { box-shadow: inset 0 0 120px rgba(100,0,100,0.3); }
  50%     { box-shadow: inset 0 0 220px rgba(120,0,120,0.55); }
}

@keyframes psych-alucinacao {
  0%,92%,100% { background: transparent; }
  93%         { background: rgba(0,80,30,0.15); }
  94%         { background: transparent; }
  97%         { background: rgba(60,0,80,0.12); }
  98%         { background: transparent; }
}

@keyframes psych-dissociacao {
  0%,100% { transform: scale(1); }
  30%     { transform: scale(1.015) translateY(-3px); }
  60%     { transform: scale(0.985) translateY(3px); }
}

/* ══ GM: Arquivo Psicológico panel ═══════════════════════════ */
.gm-psych-panel {
  background: rgba(10,5,15,0.7);
  border: 1px solid #2a1a4a;
  border-radius: 4px;
  padding: 8px;
}

.gm-psych-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.gm-psych-lv-badge {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  padding: 2px 8px;
  border: 1px solid;
  border-radius: 2px;
  background: rgba(0,0,0,0.4);
}

.gm-med-toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 9px;
  letter-spacing: 0.1em;
  color: #667;
  cursor: pointer;
  padding: 3px 7px;
  border: 1px solid #2a2a3a;
  border-radius: 3px;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
  user-select: none;
}
.gm-med-toggle input { display: none; }
.gm-med-toggle.active {
  color: #55ee99;
  border-color: #1a5a35;
  background: rgba(0,40,20,0.4);
}
.gm-med-toggle:hover { border-color: #3a4a5a; color: #aab; }

.gm-psych-slider-wrap { margin-bottom: 6px; }

.gm-psych-slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 7px;
  letter-spacing: 0.1em;
  color: #445;
  margin-bottom: 3px;
}

.gm-psych-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(to right, var(--psych-color, #44aa55) 0%, var(--psych-color, #44aa55) var(--val, 0%), #1a1a2a calc(var(--val, 0%) + 0.1%), #1a1a2a 100%);
  outline: none;
  cursor: pointer;
  margin-bottom: 4px;
}
.gm-psych-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px; height: 12px;
  border-radius: 50%;
  background: var(--psych-color, #44aa55);
  border: 2px solid #0a0a14;
  cursor: pointer;
  box-shadow: 0 0 6px var(--psych-color, #44aa55);
}

.gm-psych-bar-preview {
  position: relative;
  height: 6px;
  background: #0a0a14;
  border-radius: 3px;
  overflow: visible;
}
.gm-psych-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.2s, background 0.2s;
  min-width: 0;
}
.gm-psych-val {
  position: absolute;
  right: 0;
  top: -14px;
  font-size: 9px;
  letter-spacing: 0.05em;
  color: #888;
}

.gm-gatilhos-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.gm-gatilho-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 8px;
  letter-spacing: 0.09em;
  color: #556;
  cursor: pointer;
  padding: 3px 6px;
  border: 1px solid #1e1e2e;
  border-radius: 3px;
  background: rgba(0,0,0,0.3);
  transition: color 0.15s, border-color 0.15s, background 0.15s;
  user-select: none;
}
.gm-gatilho-item input { display: none; }
.gm-gatilho-item .gatilho-ico { font-size: 10px; }
.gm-gatilho-item .gatilho-lbl { }

.gm-gatilho-item.active {
  color: #cc6622;
  border-color: #5a2a0a;
  background: rgba(30,10,0,0.5);
}
.gm-gatilho-item.med-off {
  opacity: 0.35;
  cursor: not-allowed;
}
.gm-gatilho-item:not(.med-off):hover {
  border-color: #3a3a5a;
  color: #99a;
}
"""

css_path = pathlib.Path('METALG/style.css')
content = css_path.read_text(encoding='utf-8')
if 'ARQUIVO PSICOLÓGICO' not in content:
    css_path.write_text(content + CSS_BLOCK, encoding='utf-8')
    print('CSS appended OK')
else:
    print('CSS already present - skipping')
