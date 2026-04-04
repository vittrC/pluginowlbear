#!/usr/bin/env python3
"""Patch patentes section in index.html and add caminho overlay."""
import re

# ── index.html ─────────────────────────────────────────────────────────────
with open('METALG/index.html', 'r', encoding='utf-8') as f:
    src = f.read()

OLD_PATENTE = """      <!-- PATENTE -->
      <div class="patente-wrap">
        <div class="patente-section-title">&#9658; PATENTE</div>
        <div class="patente-grid">
          <div class="patente-item patente-active" id="patente-item-1" onclick="App.setPatente(1)">
            <img src="icones/patente1.png" class="patente-img" />
            <div class="patente-name">VENOM</div>
          </div>
          <div class="patente-item patente-locked" id="patente-item-2" onclick="App.setPatente(2)">
            <img src="icones/patente2.png" class="patente-img" />
            <div class="patente-name">SNAKE</div>
          </div>
          <div class="patente-item patente-locked" id="patente-item-3" onclick="App.setPatente(3)">
            <img src="icones/patente3.png" class="patente-img" />
            <div class="patente-name">VYPER</div>
          </div>
        </div>
        <div class="patente-desc" id="patente-desc">Recruta de campo. Preparado para miss\u00f5es de alta periculosidade.</div>
      </div>"""

NEW_PATENTE = """      <!-- PATENTE -->
      <div class="patente-wrap">
        <div class="patente-section-title">&#9658; PATENTE <button class="patente-caminho-btn" onclick="App.openCaminhoOverlay()">CAMINHO &#9658;</button></div>
        <div class="patente-grid">
          <div class="patente-item patente-active" id="patente-item-1">
            <img src="icones/patente1.png" class="patente-img" />
            <div class="patente-name">VENOM</div>
          </div>
          <div class="patente-item patente-locked" id="patente-item-2">
            <img src="icones/patente2.png" class="patente-img" />
            <div class="patente-name">SNAKE</div>
          </div>
          <div class="patente-item patente-locked" id="patente-item-3">
            <img src="icones/patente3.png" class="patente-img" />
            <div class="patente-name">VYPER</div>
          </div>
          <div class="patente-item patente-locked" id="patente-item-4">
            <div class="patente-img patente-gold-star">&#9733;</div>
            <div class="patente-name">VYPER &#9733;</div>
          </div>
        </div>
        <div class="patente-xp-row">
          <span class="patente-xp-label" id="patente-xp-label">0 XP</span>
          <div class="patente-xp-track"><div id="patente-xp-fill" class="patente-xp-fill"></div></div>
        </div>
        <div class="patente-xp-next" id="patente-xp-next"></div>
        <div class="patente-desc" id="patente-desc">Recruta de campo. Preparado para miss\u00f5es de alta periculosidade.</div>
      </div>"""

assert OLD_PATENTE in src, "OLD_PATENTE not found in index.html"
src = src.replace(OLD_PATENTE, NEW_PATENTE, 1)

# ── Add caminho overlay before </body> ──────────────────────────────────────
CAMINHO_OVERLAY = """
  <!-- ══ CAMINHO DE PROGRESSO — overlay ══════════════════════════════════ -->
  <div id="caminho-overlay" class="caminho-overlay hidden">
    <div class="caminho-backdrop" onclick="App.closeCaminhoOverlay()"></div>
    <div class="caminho-panel">

      <!-- Header -->
      <div class="caminho-header">
        <div class="caminho-header-left">
          <span class="caminho-header-ico">&#9670;</span>
          <span class="caminho-header-title">CAMINHO DO OPERADOR</span>
        </div>
        <div class="caminho-xp-box">
          <span class="caminho-xp-big" id="caminho-xp-big">0</span>
          <span class="caminho-xp-unit">XP</span>
        </div>
        <button class="caminho-close-btn" onclick="App.closeCaminhoOverlay()">&#10005;</button>
      </div>

      <!-- Global progress bar -->
      <div class="caminho-global-bar-wrap">
        <div class="caminho-global-bar-track">
          <div class="caminho-global-bar-fill" id="caminho-global-bar-fill"></div>
          <div class="caminho-global-bar-markers">
            <span class="cgb-marker" style="left:7.5%">15</span>
            <span class="cgb-marker" style="left:15%">30</span>
            <span class="cgb-marker" style="left:25%">50</span>
            <span class="cgb-marker" style="left:35%">70</span>
            <span class="cgb-marker" style="left:45%">90</span>
            <span class="cgb-marker" style="left:60%">120</span>
            <span class="cgb-marker" style="left:70%">140</span>
            <span class="cgb-marker" style="left:90%">180</span>
            <span class="cgb-marker" style="left:100%">200</span>
          </div>
        </div>
        <div class="caminho-global-bar-label" id="caminho-global-bar-label">0 / 200 XP</div>
      </div>

      <!-- GM XP controls (only visible if role=gm) -->
      <div class="caminho-gm-ctrl" id="caminho-gm-ctrl" style="display:none">
        <div class="caminho-gm-label">&#9881; CONTROLE DE XP (MESTRE)</div>
        <div class="caminho-gm-btns">
          <button class="cgm-btn cgm-minus" onclick="App.caminhoGmAjustar(-10)">&#8722;10</button>
          <button class="cgm-btn cgm-minus" onclick="App.caminhoGmAjustar(-5)">&#8722;5</button>
          <button class="cgm-btn cgm-minus" onclick="App.caminhoGmAjustar(-1)">&#8722;1</button>
          <button class="cgm-btn cgm-plus"  onclick="App.caminhoGmAjustar(+1)">+1</button>
          <button class="cgm-btn cgm-plus"  onclick="App.caminhoGmAjustar(+5)">+5</button>
          <button class="cgm-btn cgm-plus"  onclick="App.caminhoGmAjustar(+10)">+10</button>
        </div>
        <div class="caminho-gm-custom">
          <input type="number" id="caminho-gm-xp-input" class="cgm-input" min="0" max="999" placeholder="valor exato..." />
          <button class="cgm-btn cgm-set" onclick="App.caminhoGmSetExato()">DEFINIR</button>
        </div>
      </div>

      <!-- Two-column body: path + detail -->
      <div class="caminho-body">

        <!-- Left: vertical path -->
        <div class="caminho-path-col">
          <div class="caminho-path" id="caminho-path">
            <!-- Rendered dynamically by renderCaminhoOverlay() -->
          </div>
        </div>

        <!-- Right: marco detail -->
        <div class="caminho-detail-col">
          <div class="caminho-detail" id="caminho-detail">
            <div class="cp-detail-hint">
              <span class="cp-hint-ico">&#9658;</span>
              Clique em um marco para ver os detalhes
            </div>
          </div>
        </div>

      </div><!-- /caminho-body -->
    </div><!-- /caminho-panel -->
  </div><!-- /caminho-overlay -->
"""

assert "</body>" in src, "</body> not found"
src = src.replace("</body>", CAMINHO_OVERLAY + "\n</body>", 1)

with open('METALG/index.html', 'w', encoding='utf-8') as f:
    f.write(src)

print("index.html patched successfully.")
