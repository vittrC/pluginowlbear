    // ══════════════════════════════════════════════
    //  PARTÍCULAS & DECORAÇÃO
    // ══════════════════════════════════════════════
    (function() {
      // estrelas de fundo
      const sf = document.getElementById('star-field');
      for (let i = 0; i < 100; i++) {
        const s = document.createElement('div');
        s.className = 'star';
        const sz = 1 + Math.random() * 3;
        s.style.cssText =
          'left:' + (Math.random()*100) + '%;top:' + (Math.random()*100) + '%;' +
          'width:' + sz + 'px;height:' + sz + 'px;' +
          'animation-delay:' + (Math.random()*5) + 's;' +
          'animation-duration:' + (2+Math.random()*4) + 's;';
        sf.appendChild(s);
      }
      // glitter caindo
      const gpieces = ['✨','💖','🌸','⭐','💫','🌺','🎀','🖤','💜','🌟'];
      for (let i = 0; i < 22; i++) {
        const g = document.createElement('div');
        g.className = 'glitter-piece';
        g.textContent = gpieces[i % gpieces.length];
        g.style.cssText =
          'left:' + (Math.random()*100) + '%;' +
          'animation-duration:' + (7+Math.random()*12) + 's;' +
          'animation-delay:' + (Math.random()*10) + 's;' +
          'font-size:' + (9+Math.random()*13) + 'px;' +
          'opacity:' + (0.3+Math.random()*0.4) + ';';
        document.body.appendChild(g);
      }
      // contador fake
      const oc = document.getElementById('online-count');
      if (oc) setInterval(() => { oc.textContent = 38 + Math.floor(Math.random()*25); }, 7000);
    })();

    // ══════════════════════════════════════════════
    //  ENGINE
    // ══════════════════════════════════════════════
    const gc = document.getElementById('game-container');

    let state = { afeicao: 0, coragem: 0, step: 0 };
    let _animating = false;
    let _skipFn    = null;

    // ── SPLASH ────────────────────────────────────
    function dismissSplash() {
      sfxClick();
      const sp = document.getElementById('splash');
      sp.classList.add('out');
      setTimeout(() => { sp.style.display = 'none'; go('intro'); }, 900);
      startMusic();
      startGlitchAmbiance();
    }

    // ── MUSIC ───────────────────────────────────
    let _musicOn = false;
    let _yt = null;
    function startMusic() {
      if (_yt) return;
      const wrap = document.getElementById('yt-player-wrap');
      const f = document.createElement('iframe');
      f.id = 'yt-frame';
      f.width  = '1'; f.height = '1';
      f.allow  = 'autoplay';
      f.src    = 'https://www.youtube.com/embed/BFSWlDpA6C4?autoplay=1&loop=1&playlist=BFSWlDpA6C4&controls=0&mute=0';
      wrap.appendChild(f);
      _yt = f;
      _musicOn = true;
    }
    function toggleMusic() {
      const ico = document.getElementById('music-ico');
      if (!_yt) { startMusic(); ico.textContent = '🎵'; return; }
      _musicOn = !_musicOn;
      // alterna via src: remove autoplay p/ pausar, reinsere p/ retomar
      if (_musicOn) {
        _yt.src = 'https://www.youtube.com/embed/BFSWlDpA6C4?autoplay=1&loop=1&playlist=BFSWlDpA6C4&controls=0&mute=0';
        ico.textContent = '🎵';
      } else {
        _yt.src = '';
        ico.textContent = '🔇';
      }
    }

    // ── AUDIO SFX ─────────────────────────────────
    let _audioCtx = null;
    function _getAC() {
      if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      return _audioCtx;
    }
    function sfxClick() {
      try {
        const ac = _getAC();
        const o = ac.createOscillator(), g = ac.createGain();
        o.connect(g); g.connect(ac.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(880, ac.currentTime);
        o.frequency.exponentialRampToValueAtTime(440, ac.currentTime + 0.1);
        g.gain.setValueAtTime(0.12, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);
        o.start(); o.stop(ac.currentTime + 0.18);
      } catch(e) {}
    }
    function sfxTransition() {
      try {
        const ac = _getAC();
        const o = ac.createOscillator(), g = ac.createGain();
        o.connect(g); g.connect(ac.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(440, ac.currentTime);
        o.frequency.exponentialRampToValueAtTime(880, ac.currentTime + 0.18);
        g.gain.setValueAtTime(0.09, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.28);
        o.start(); o.stop(ac.currentTime + 0.28);
      } catch(e) {}
    }
    function sfxHeartbeat() {
      try {
        const ac = _getAC();
        [0, 0.2].forEach(d => {
          const o = ac.createOscillator(), g = ac.createGain();
          o.connect(g); g.connect(ac.destination);
          o.type = 'sine'; o.frequency.value = 72;
          g.gain.setValueAtTime(0, ac.currentTime + d);
          g.gain.linearRampToValueAtTime(0.38, ac.currentTime + d + 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + d + 0.22);
          o.start(ac.currentTime + d); o.stop(ac.currentTime + d + 0.24);
        });
      } catch(e) {}
    }
    function sfxGlitch() {
      try {
        const ac = _getAC();
        const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.35), ac.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.18;
        const src = ac.createBufferSource(); src.buffer = buf;
        const g = ac.createGain();
        g.gain.setValueAtTime(0.22, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35);
        src.connect(g); g.connect(ac.destination); src.start();
      } catch(e) {}
    }
    function sfxDrone() {
      try {
        const ac = _getAC();
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sawtooth'; o.frequency.value = 46;
        o.connect(g); g.connect(ac.destination);
        g.gain.setValueAtTime(0, ac.currentTime);
        g.gain.linearRampToValueAtTime(0.065, ac.currentTime + 0.9);
        g.gain.setValueAtTime(0.065, ac.currentTime + 2.4);
        g.gain.linearRampToValueAtTime(0, ac.currentTime + 3.2);
        o.start(); o.stop(ac.currentTime + 3.2);
      } catch(e) {}
    }
    function glitchScreen(ms) {
      ms = ms || 400;
      let ov = document.getElementById('glitch-overlay');
      if (!ov) { ov = document.createElement('div'); ov.id = 'glitch-overlay'; ov.className = 'glitch-overlay'; document.body.appendChild(ov); }
      let sl = document.getElementById('glitch-scanlines');
      if (!sl) { sl = document.createElement('div'); sl.id = 'glitch-scanlines'; sl.className = 'glitch-scanlines'; document.body.appendChild(sl); }
      ov.classList.add('active'); sl.classList.add('active');
      document.body.style.animation = 'glitch-shift ' + (ms / 1000).toFixed(2) + 's steps(1,end)';
      setTimeout(() => { ov.classList.remove('active'); sl.classList.remove('active'); document.body.style.animation = ''; }, ms);
    }

    // ── GLITCH AMBIANCE SISTEMA ─────────────────
    const _GHOST_MSGS = [
      'e l a   s a b e .', 'ela não é real.', 'você está sendo observada.',
      'NÃO CONTINUE.', '— ela.', 'eu vi você pausar.',
      'isto não é um jogo.', 's ó   e l a .', 'gabriel.chr foi modificado.',
      'você deveria ter saído na intro.', '∞', '...', 'ela está bem.',
      '[arquivos corrompidos]', 'e u   v e j o   v o c ê .', 'saia.', '∅∅∅',
      'você pausou nessa cena.', 'olha pra trás.', 'não confie na narradora.',
    ];
    const _POPUP_MSGS = [
      {
        body: 'doce_amor.exe não respondeu.\narquivo: sentimento.js\nerro: recursão infinita em\nloop_espera(gabrielAtencao)',
        ok: 'OK', cancel: 'ignorar'
      },
      {
        body: 'AVISO: gabriel.chr está sendo\nsobrescrito por outra instância.\n\nestado atual: indefinido\n\ndeseja continuar?',
        ok: 'Sim', cancel: 'Não', onCancel: 's1'
      },
      {
        body: 'BUFFER OVERFLOW:\n"vezes que ela o viu passar a\nmão no cabelo" > MAX_INT\n\narquivo: valentina.js\nlinha: ∞',
        ok: 'fechar erro', cancel: 'reiniciar', onCancel: 'intro'
      },
      {
        body: 'arquivo corrompido:\nfinal_feliz.json\n\ndeseja restaurar da última\ncópia de segurança?\n\n(cópia: NÃO ENCONTRADA)',
        ok: 'OK', cancel: 'Cancelar'
      },
      {
        body: 'esta janela não deveria\nter aparecido.\n\nvocê não deveria ter visto isso.\n\npor favor, ignore.\n\n— a narradora',
        ok: 'OK (não vou ignorar)', cancel: 'fechar'
      },
      {
        body: 'aviso de privacidade:\nvocê leu o diário dela.\ntópicos 1–46: registrados.\ntópico 47: deletado antes de você\n chegar aqui.\n\nvocê sabia que ela fazia listas\ncom o nome dele?\n\nvocê sabia.',
        ok: 'eu não li', cancel: 'li sim'
      },
    ];
    let _popupCancelScene = null;
    function showFakePopup(idx) {
      const fp = document.getElementById('fake-popup');
      const pb = document.getElementById('popup-body');
      const poc = document.getElementById('popup-ok-btn');
      const pcc = document.getElementById('popup-cancel-btn');
      if (!fp || !pb) return;
      const msg = _POPUP_MSGS[idx !== undefined ? idx : Math.floor(Math.random() * _POPUP_MSGS.length)];
      pb.textContent = msg.body;
      if (poc) poc.textContent = msg.ok;
      if (pcc) pcc.textContent = msg.cancel;
      _popupCancelScene = msg.onCancel || null;
      fp.classList.add('show');
      sfxGlitch();
    }
    function closeFakePopup() {
      const fp = document.getElementById('fake-popup');
      if (fp) fp.classList.remove('show');
      sfxClick();
    }
    function popupCancel() {
      closeFakePopup();
      if (_popupCancelScene) setTimeout(() => go(_popupCancelScene), 200);
    }
    function _showGhostMsg(text, x, y, ms) {
      const el = document.getElementById('ghost-msg');
      if (!el) return;
      el.textContent = text;
      el.style.left = (x !== undefined ? x : (8 + Math.random() * 72)) + '%';
      el.style.top  = (y !== undefined ? y : (8 + Math.random() * 75)) + '%';
      el.classList.add('show');
      setTimeout(() => el.classList.remove('show'), ms || 2500);
    }
    const _ORIG_TITLE = '💕 DOCE AMOR · simulador de amor verdadeiro · 💕';
    const _CORRUPT_TITLES = [
      'ẽrṟo ẗ..', 'S̴Ó ̶E̷L̸A̵', 'doce_amor.exe — sem resposta',
      '██████████', 'NÃO SAIA', '??????????',
      'ela estava aqui.', '∅∅∅∅∅', '...', 'gabriel.chr — deletado',
    ];
    function _glitchTitle(ms) {
      const t = _CORRUPT_TITLES[Math.floor(Math.random() * _CORRUPT_TITLES.length)];
      document.title = t;
      setTimeout(() => { document.title = _ORIG_TITLE; }, ms || 1400);
    }
    function _corruptOnlineCount() {
      const oc = document.getElementById('online-count');
      if (!oc) return;
      const orig = oc.textContent;
      const opts = ['0', '1', '1 (VOCÊ)', 'ERROR', '∞', '?', '—', 'null'];
      oc.style.color = '#cc0022'; oc.style.fontFamily = 'Courier New,monospace';
      oc.textContent = opts[Math.floor(Math.random() * opts.length)];
      setTimeout(() => { oc.textContent = orig; oc.style.color = ''; oc.style.fontFamily = ''; }, 2200);
    }
    function _corruptMsnBox() {
      const msn = document.querySelector('.msn-box');
      if (!msn) return;
      const origHTML = msn.innerHTML;
      const msgs = [
        '<strong style="color:#cc0022;font-family:\'Courier New\',monospace">nota da narradora:</strong> este jogo não foi feito por uma pessoa. a pessoa é personagem. você também pode ser.<span style="display:block;color:#330000;font-family:\'Courier New\',monospace;font-size:9px;margin-top:4px">[THIS IS NOT A METAPHOR]</span>',
        '<strong>aviso:</strong> o arquivo gabriel.chr foi <span class="deleted-text">modificado</span> sem consentimento do jogador. restaurando...<span style="display:block;color:#330000;font-family:\'Courier New\',monospace;font-size:9px;margin-top:4px">restauração falhou. motivo: arquivo original não existe.</span>',
        '<strong style="color:#cc0022;font-family:\'Courier New\',monospace">ela sabe que você está aqui.</strong><span style="display:block;color:#1a0000;font-size:9px;font-family:\'Courier New\',monospace;margin-top:4px">ela sempre soube.</span>',
        '<strong>nota:</strong> esta entrada do diário foi <span class="deleted-text">removida</span> da versão pública.<span style="display:block;color:#330000;font-family:\'Courier New\',monospace;font-size:9px;margin-top:4px">você está lendo a versão errada.</span>',
      ];
      msn.innerHTML = msgs[Math.floor(Math.random() * msgs.length)];
      glitchScreen(380); sfxGlitch();
      setTimeout(() => { if (msn) msn.innerHTML = origHTML; }, 4000);
    }
    function _corruptNarrationInScene() {
      const ns = gc.querySelectorAll('.narration');
      if (!ns.length) return;
      const t = ns[Math.floor(Math.random() * ns.length)];
      const ghost = document.createElement('span');
      ghost.style.cssText = 'display:block;color:#280000;font-family:"Courier New",monospace;font-size:8px;opacity:0;transition:opacity .2s;letter-spacing:3px;margin-top:4px';
      const vopts = ['ela estava ali.', '∅', '[dados corrompidos]', 'erro na linha 404', '— não era para você ver isso', 'i s s o   n ã o   a c o n t e c e u', 'por que você pausou?', 'não confie na narradora.'];
      ghost.textContent = vopts[Math.floor(Math.random() * vopts.length)];
      t.appendChild(ghost);
      setTimeout(() => { ghost.style.opacity = '0.7'; }, 60);
      setTimeout(() => { ghost.style.opacity = '0'; setTimeout(() => { if (ghost.parentNode) ghost.remove(); }, 300); }, 3000);
    }
    function _glitchFooterLinks() {
      const links = document.querySelectorAll('.site-footer a');
      if (!links.length) return;
      const idx = Math.floor(Math.random() * links.length);
      const lnk = links[idx]; const orig = lnk.textContent;
      const alts = ['deletar', 'sair', 'não clique', 'ela.', '∅', 'erro', '[APAGAR]', 'eu sei'];
      lnk.textContent = alts[Math.floor(Math.random() * alts.length)];
      lnk.style.color = '#880000'; lnk.style.fontFamily = 'Courier New,monospace';
      setTimeout(() => { lnk.textContent = orig; lnk.style.color = ''; lnk.style.fontFamily = ''; }, 1800);
    }
    let _ambianceRunning = false;
    function _doRandomGlitch() {
      if (Math.random() < 0.18) { showFakePopup(); return; }
      const picks = [
        () => _glitchTitle(1100),
        () => _glitchTitle(800),
        () => _showGhostMsg(_GHOST_MSGS[Math.floor(Math.random() * _GHOST_MSGS.length)]),
        () => _showGhostMsg(_GHOST_MSGS[Math.floor(Math.random() * _GHOST_MSGS.length)]),
        () => _corruptOnlineCount(),
        () => _corruptMsnBox(),
        () => _corruptNarrationInScene(),
        () => _corruptNarrationInScene(),
        () => _glitchFooterLinks(),
        () => { glitchScreen(200); sfxGlitch(); },
        () => { glitchScreen(280); sfxGlitch(); _showGhostMsg(_GHOST_MSGS[Math.floor(Math.random()*_GHOST_MSGS.length)]); },
        () => { _glitchTitle(1000); setTimeout(() => _showGhostMsg(_GHOST_MSGS[Math.floor(Math.random()*_GHOST_MSGS.length)]), 500); },
        () => { _corruptNarrationInScene(); setTimeout(() => _glitchTitle(900), 800); },
        () => { _corruptOnlineCount(); setTimeout(() => _showGhostMsg('1 (VOCÊ)', 55, 10, 2200), 500); },
        () => { glitchScreen(160); setTimeout(() => { glitchScreen(120); setTimeout(() => glitchScreen(90), 200); }, 350); sfxGlitch(); },
      ];
      picks[Math.floor(Math.random() * picks.length)]();
    }
    function startGlitchAmbiance() {
      if (_ambianceRunning) return;
      _ambianceRunning = true;
      setTimeout(() => _glitchTitle(1200), 8000);
      setTimeout(() => _showGhostMsg('ela sabe.', 72, 5, 1800), 16000);
      setTimeout(() => _corruptOnlineCount(), 26000);
      function next() {
        const delay = 12000 + Math.random() * 20000;
        setTimeout(() => { _doRandomGlitch(); next(); }, delay);
      }
      setTimeout(next, 32000);
    }

    // ── IDLE DETECTION ────────────────────────────
    const _IDLE_MSGS = [
      'você ainda está aí?<br>ela também fica assim. olhando. sem agir.',
      'noventa segundos.<br>você não fez nada.<br>ela faz isso todos os dias.',
      'está esperando que alguma coisa mude sozinha?<br>ela também esperava.',
      'ei.<br>eu sei que você está aí.<br>o mouse não se moveu mas a aba ainda está aberta.',
      'tudo bem.<br>pode demorar.<br>ela demorou meses.',
    ];
    let _idleTimer = null;
    let _idleCount = 0;
    function _resetIdle() {
      clearTimeout(_idleTimer);
      _idleTimer = setTimeout(() => {
        const msg = _IDLE_MSGS[_idleCount % _IDLE_MSGS.length];
        _idleCount++;
        const el = document.getElementById('ghost-msg');
        if (!el) return;
        el.innerHTML = msg;
        el.style.left = '50%';
        el.style.top  = '50%';
        el.style.transform = 'translate(-50%,-50%)';
        el.style.textAlign = 'center';
        el.style.fontSize  = '13px';
        el.style.lineHeight = '2';
        el.style.maxWidth = '280px';
        el.classList.add('show');
        setTimeout(() => {
          el.classList.remove('show');
          setTimeout(() => {
            el.style.transform = '';
            el.style.textAlign = '';
            el.style.fontSize  = '';
            el.style.lineHeight = '';
            el.style.maxWidth = '';
            el.innerHTML = '';
          }, 500);
        }, 5000);
        _resetIdle();
      }, 90000);
    }
    document.addEventListener('mousemove', _resetIdle);
    document.addEventListener('keydown',   _resetIdle);
    document.addEventListener('click',     _resetIdle);
    document.addEventListener('scroll',    _resetIdle);

    // ── TAB VISIBILITY ────────────────────────────
    const _TAB_AWAY_TITLES = [
      'ela sabe que você saiu.',
      'volte aqui.',
      'onde você foi?',
      'ela ainda está esperando.',
      'não saia.',
    ];
    let _tabAwayStart = 0;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        _tabAwayStart = Date.now();
        document.title = _TAB_AWAY_TITLES[Math.floor(Math.random() * _TAB_AWAY_TITLES.length)];
      } else {
        document.title = _ORIG_TITLE;
        const away = Date.now() - _tabAwayStart;
        // Corrompe uma palavra de narração ao voltar (se ficou >5s fora)
        if (away > 5000) {
          setTimeout(() => {
            const ns = gc.querySelectorAll('.narration');
            if (!ns.length) return;
            const target = ns[Math.floor(Math.random() * ns.length)];
            const words = target.querySelectorAll('span');
            if (!words.length) return;
            const w = words[Math.floor(Math.random() * words.length)];
            const orig = w.textContent;
            w.style.color = '#cc0033';
            w.style.fontFamily = 'Courier New, monospace';
            w.textContent = _zalgo(orig, 1);
            setTimeout(() => { w.textContent = orig; w.style.color = ''; w.style.fontFamily = ''; }, 3500);
          }, 800);
        }
      }
    });

    // ── SLOW TEXT DECAY (ZALGO) ───────────────────
    const _ZALGO_UP   = ['̍','̎','̄','̅','̿','̑','̆','̐','͒','͗','͑','̇','̈','̊','͂','̓','̈','͊','͋','͌','̃','̂','̌','͐','̀','́','̋','̏','̒','̓','̔','̽','̉','ͅ','͍','͎','͓','͔','͕','͖','͙','͚','̩','̳','̟'];
    const _ZALGO_MID  = ['̕','̛','̀','́','͘','̡','̢','̧','̨','̴','̵','̶','͜','͝','͞','͟','͠','͢','̸','̷','͡'];
    const _ZALGO_DOWN = ['̖','̗','̘','̙','̜','̝','̞','̟','̠','̤','̥','̦','̩','̪','̫','̬','̭','̮','̯','̰','̱','̲','̳','̹','̺','̻','̼','ͅ','͇','͈','͉','͍','͎','͓','͔','͕','͖','͙','͚'];
    function _zalgo(text, intensity) {
      intensity = intensity || 2;
      return text.split('').map(c => {
        if (c === ' ' || c === '\n') return c;
        let r = c;
        for (let i = 0; i < intensity; i++) {
          if (Math.random() > 0.5) r += _ZALGO_UP[Math.floor(Math.random()*_ZALGO_UP.length)];
          if (Math.random() > 0.6) r += _ZALGO_MID[Math.floor(Math.random()*_ZALGO_MID.length)];
          if (Math.random() > 0.5) r += _ZALGO_DOWN[Math.floor(Math.random()*_ZALGO_DOWN.length)];
        }
        return r;
      }).join('');
    }
    let _decayInterval = null;
    function _startDecay() {
      if (_decayInterval) return;
      _decayInterval = setInterval(() => {
        const ns = gc.querySelectorAll('.narration');
        if (!ns.length) return;
        const target = ns[ns.length - 1]; // última narração
        const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        let node;
        while ((node = walker.nextNode())) {
          if (node.textContent.trim() && node.parentElement.tagName !== 'SPAN') {
            textNodes.push(node);
          }
        }
        if (!textNodes.length) return;
        const tn = textNodes[Math.floor(Math.random() * textNodes.length)];
        const words = tn.textContent.split(' ');
        if (words.length < 2) return;
        const wi = Math.floor(Math.random() * words.length);
        if (words[wi].length < 2) return;
        words[wi] = _zalgo(words[wi], 1);
        const span = document.createElement('span');
        span.style.cssText = 'color:#3a0010;transition:color 1s';
        span.textContent = words.join(' ');
        tn.parentNode.replaceChild(span, tn);
        setTimeout(() => { span.style.color = ''; }, 100);
      }, 18000);
    }
    // arranca o decay quando uma cena é renderizada
    const _origRender = render;
    // monkey-patch via wrapper (feito abaixo, após render ser definido)

    // ── CURSOR TRACKING ───────────────────────────
    let _cursorX = 50, _cursorY = 50;
    document.addEventListener('mousemove', e => {
      _cursorX = (e.clientX / window.innerWidth)  * 100;
      _cursorY = (e.clientY / window.innerHeight) * 100;
    });
    // override de _showGhostMsg para modo cursor (quando x/y não fornecidos)
    const _showGhostMsgOrig = _showGhostMsg;
    function _showGhostMsgCursor(text, ms) {
      const el = document.getElementById('ghost-msg');
      if (!el) return;
      el.textContent = text;
      // offset do cursor: aparece perto mas não em cima
      const ox = _cursorX + (Math.random() > 0.5 ? 8 : -12);
      const oy = _cursorY + (Math.random() > 0.5 ? 6 : -10);
      el.style.left = Math.max(2, Math.min(88, ox)) + '%';
      el.style.top  = Math.max(2, Math.min(88, oy)) + '%';
      el.classList.add('show');
      setTimeout(() => el.classList.remove('show'), ms || 2500);
    }

    // ── GABRIEL PORTRAIT CLICK EASTER EGG ────────
    let _gabrielClicks = 0;
    let _gabrielClickTimer = null;
    function _gabrielClick() {
      _gabrielClicks++;
      clearTimeout(_gabrielClickTimer);
      _gabrielClickTimer = setTimeout(() => { _gabrielClicks = 0; }, 2500);
      if (_gabrielClicks === 3) {
        _showGhostMsgCursor('para.', 1800);
      } else if (_gabrielClicks === 5) {
        glitchScreen(300); sfxGlitch();
        _showGhostMsgCursor('eu disse para.', 2200);
      } else if (_gabrielClicks >= 7) {
        _gabrielClicks = 0;
        clearTimeout(_gabrielClickTimer);
        _launchEnxerido();
      }
    }
    function _launchEnxerido() {
      // Abre nova aba/janela com a página "você é enxerido"
      const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<title>.</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#000;overflow:hidden;cursor:none}
#container{
  position:fixed;inset:0;
  display:flex;align-items:center;justify-content:center;
  flex-direction:column;gap:0;
}
.linha{
  font-family:'Courier New',monospace;
  font-size:clamp(14px,2.5vw,22px);
  color:#cc0022;
  opacity:0;
  letter-spacing:6px;
  animation:surgir 0.6s ease forwards;
  text-shadow:0 0 12px #880000, 0 0 3px #440000;
  white-space:nowrap;
  padding:4px 0;
}
@keyframes surgir{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes desaparecer{from{opacity:1}to{opacity:0}}
</style>
</head><body>
<div id="container"></div>
<script>
const frases=['você é enxerido','v o c ê   é   e n x e r i d o','VOCÊ É ENXERIDO','você. é. enxerido.','enxerido','enxerido','enxerido','enxerido','você é enxerido','você é enxerido','você é enxerido'];
const c=document.getElementById('container');
let i=0;
function add(){
  if(c.children.length>18){
    const old=c.children[0];
    old.style.animation='desaparecer 0.4s ease forwards';
    setTimeout(()=>{if(old.parentNode)old.remove()},400);
  }
  const d=document.createElement('div');
  d.className='linha';
  d.textContent=frases[i%frases.length];i++;
  d.style.animationDelay='0s';
  c.appendChild(d);
  setTimeout(add,Math.random()<0.3?120:350);
}
// música macabra via Web Audio
try{
  const ac=new(window.AudioContext||window.webkitAudioContext)();
  function drone(freq,vol,type){
    const o=ac.createOscillator(),g=ac.createGain();
    o.type=type||'sawtooth';o.frequency.value=freq;
    o.connect(g);g.connect(ac.destination);
    g.gain.value=vol;o.start();
  }
  drone(36,0.06,'sawtooth');
  drone(54,0.03,'square');
  drone(29,0.04,'sawtooth');
  // pulso lento
  setInterval(()=>{
    const o=ac.createOscillator(),g=ac.createGain();
    o.type='sine';o.frequency.value=110+Math.random()*40;
    o.connect(g);g.connect(ac.destination);
    g.gain.setValueAtTime(0,ac.currentTime);
    g.gain.linearRampToValueAtTime(0.12,ac.currentTime+0.1);
    g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+1.4);
    o.start();o.stop(ac.currentTime+1.4);
  },1800);
}catch(e){}
setTimeout(add,400);
<\/script>
</body></html>`;
      const blob = new Blob([html], {type: 'text/html'});
      const url  = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }

    // ── FAKE GOOGLE SEARCH (localização) ─────────
    let _fakeSearchDone = false;
    function _triggerFakeSearch() {
      if (_fakeSearchDone) return;
      _fakeSearchDone = true;
      // Avisa antes para amplificar o susto
      glitchScreen(350); sfxGlitch();
      _showGhostMsgCursor('abrindo pesquisa...', 2000);
      setTimeout(() => {
        window.open('https://www.google.com/search?q=minha+localiza%C3%A7%C3%A3o', '_blank');
      }, 1200);
    }

    window._renderSceneCount = 0;

    // ── CONFETTI ──────────────────────────────────
    function launchConfetti(c1, c2) {
      const cv = document.getElementById('confetti-canvas');
      if (!cv) return;
      cv.width  = window.innerWidth;
      cv.height = window.innerHeight;
      cv.style.display = 'block';
      const ctx = cv.getContext('2d');
      const pieces = Array.from({length: 80}, () => ({
        x: Math.random() * cv.width,
        y: Math.random() * cv.height - cv.height,
        r: 3 + Math.random() * 6, d: 1.5 + Math.random() * 2.5,
        col: Math.random() > 0.5 ? c1 : c2,
        tilt: 0, tiltSpd: 0.06 + Math.random() * 0.08,
      }));
      let frame;
      function draw() {
        ctx.clearRect(0, 0, cv.width, cv.height);
        pieces.forEach(p => {
          p.tilt += p.tiltSpd; p.y += p.d;
          if (p.y > cv.height) { p.y = -10; p.x = Math.random() * cv.width; }
          ctx.beginPath(); ctx.lineWidth = p.r; ctx.strokeStyle = p.col;
          ctx.moveTo(p.x + Math.sin(p.tilt) * 12, p.y);
          ctx.lineTo(p.x + Math.sin(p.tilt) * 12 + Math.cos(p.tilt) * 8, p.y + p.r * 2);
          ctx.stroke();
        });
        frame = requestAnimationFrame(draw);
      }
      draw();
      setTimeout(() => { cancelAnimationFrame(frame); cv.style.display = 'none'; }, 5500);
    }

    // ── SKIP TYPEWRITER ───────────────────────────
    function skipTypewriter() {
      if (!_animating) return;
      _animating = false;
      gc.querySelectorAll('span[style*="reveal-char"]').forEach(sp => {
        sp.style.animation = 'none'; sp.style.opacity = '1';
      });
      gc.querySelectorAll('[style*="reveal-up"]').forEach(el => {
        el.style.animation = 'none'; el.style.opacity = '1';
      });
      gc.querySelectorAll('.choice-btn').forEach(b => b.disabled = false);
      const hint = gc.querySelector('.skip-hint');
      if (hint) hint.remove();
      if (ttsEnabled) setTimeout(speakScene, 100);
      if (_skipFn) { _skipFn(); _skipFn = null; }
    }
    gc.addEventListener('click', e => {
      if (!_animating) return;
      if (e.target.closest('.choice-btn,.splash-enter,.btn-start,.restart-btn')) return;
      skipTypewriter();
    });
    document.addEventListener('keydown', e => {
      if (e.code === 'Space' || e.code === 'Enter') skipTypewriter();
    });

    // ── TTS ──────────────────────────────────────
    let ttsEnabled = false;
    function toggleTTS() {
      ttsEnabled = !ttsEnabled;
      const ico = document.getElementById('tts-ico');
      const btn = document.getElementById('tts-btn');
      if (ico) ico.textContent = ttsEnabled ? '🔊' : '🔇';
      if (btn) btn.classList.toggle('active', ttsEnabled);
      if (!ttsEnabled) speechSynthesis.cancel();
    }
    function speakScene() {
      if (!ttsEnabled || !('speechSynthesis' in window)) return;
      speechSynthesis.cancel();
      const parts = [];
      gc.querySelectorAll('.narration, .dialogue-text').forEach(el => {
        const t = el.textContent.trim();
        if (t) parts.push(t);
      });
      if (!parts.length) return;
      const u = new SpeechSynthesisUtterance(parts.join('. '));
      u.lang = 'pt-BR'; u.rate = 0.85; u.pitch = 1.08;
      function doSpeak() {
        const voices = speechSynthesis.getVoices();
        const ptVoice = voices.find(v => v.lang.startsWith('pt')) || voices.find(v => v.lang.startsWith('es')) || null;
        if (ptVoice) u.voice = ptVoice;
        speechSynthesis.speak(u);
      }
      if (speechSynthesis.getVoices().length) doSpeak();
      else speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true });
    }

    // ── ANIMAÇÃO DE ENTRADA (typewriter + reveal-up) ────────
    // classes que recebem efeito máquina de escrever
    const _TW_CLS = new Set([
      'narration','dialogue-text','inner-thought',
      'cutscene-text','chapter-break','ending-text','intro-desc','intro-warning'
    ]);
    // seletores processados em ordem de DOM
    const _ANIM_SEL = [
      '.scene-label','.progress-wrap','.stats-panel',
      '.narration',
      '.portrait-box-wrap','.dialogue-speaker','.dialogue-text','.inner-thought',
      '.cutscene-emoji','.cutscene-text','.chapter-break',
      '.choices-label','.choices-grid',
      '.ending-header','.ending-text','.ending-score',
      '.intro-art','.intro-title','.intro-desc',
      '.divider','.intro-warning','.btn-start','.restart-btn',
    ].join(',');

    // percorre nodos de texto e envolve cada caractere num span animado
    function _typewriteEl(el, startDelay, speed) {
      let n = 0;
      (function walk(node) {
        if (node.nodeType === 3) {
          const txt = node.textContent;
          if (!txt) return;
          const frag = document.createDocumentFragment();
          for (const ch of txt) {
            const sp = document.createElement('span');
            sp.textContent = ch;
            sp.style.cssText = `opacity:0;animation:reveal-char .001s linear ${(startDelay + n * speed).toFixed(3)}s forwards`;
            frag.appendChild(sp);
            n++;
          }
          node.parentNode.replaceChild(frag, node);
        } else if (node.nodeType === 1) {
          Array.from(node.childNodes).forEach(walk);
        }
      })(el);
      return n;
    }

    function animateScene() {
      _animating = true;
      // lock choices imediatamente
      gc.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
      // skip hint antes das choices
      const choicesEl = gc.querySelector('.choices-grid');
      if (choicesEl && !gc.querySelector('.skip-hint')) {
        const hint = document.createElement('div');
        hint.className = 'skip-hint';
        hint.textContent = '· toque ou pressione espaço para pular ·';
        choicesEl.parentNode.insertBefore(hint, choicesEl);
      }

      const SPD = 0.018;
      let t = 0.06;
      gc.querySelectorAll(_ANIM_SEL).forEach(el => {
        if (Array.from(el.classList).some(c => _TW_CLS.has(c))) {
          const n = _typewriteEl(el, t, SPD);
          t += n * SPD + 0.15;
        } else {
          el.style.opacity = '0';
          el.style.animation = `reveal-up 0.38s ease ${t.toFixed(2)}s forwards`;
          t += 0.10;
        }
      });

      const totalMs = t * 1000 + 350;
      setTimeout(() => {
        if (!_animating) return;
        _animating = false;
        gc.querySelectorAll('.choice-btn').forEach(b => b.disabled = false);
        const hint = gc.querySelector('.skip-hint');
        if (hint) hint.remove();
        if (ttsEnabled) speakScene();
      }, totalMs);
    }

    function esc(s) {
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
    function render(html) {
      speechSynthesis.cancel();
      _animating = false;
      gc.innerHTML = html;
      gc.scrollIntoView({ behavior: 'smooth', block: 'start' });
      animateScene();
      // scene counter (used by decay + fake search)
      window._renderSceneCount++;
      if (window._renderSceneCount >= 3) _startDecay();
      if (!_fakeSearchDone && window._renderSceneCount >= 4 && window._renderSceneCount <= 8) {
        if (Math.random() < 0.30) setTimeout(_triggerFakeSearch, 6000 + Math.random() * 8000);
      }
    }
    function bar(val, max) {
      const pct = Math.min(100, Math.round(val/max*100));
      return `<div class="stat-track"><div class="stat-fill" style="width:${pct}%"></div></div>`;
    }
    function stats() {
      return `<div class="stats-panel">
        <div class="stat-row"><span class="stat-label">💕 afeição</span>${bar(state.afeicao,100)}<span class="stat-val">${state.afeicao}</span></div>
        <div class="stat-row"><span class="stat-label">💪 coragem</span>${bar(state.coragem,100)}<span class="stat-val">${state.coragem}</span></div>
      </div>`;
    }
    function progress(current, total) {
      let dots = '';
      for (let i = 0; i < total; i++)
        dots += `<div class="progress-dot${i<current?' done':i===current?' active':''}"></div>`;
      return `<div class="progress-wrap">${dots}</div>`;
    }
    function N(text) { // narrador
      return `<div class="narration">${text}</div>`;
    }
    function portrait(isGabriel, mood) {
      const img   = isGabriel
        ? `<img src="icones/feed/gabriel.jpg"   alt="Gabriel"   style="width:100%;height:100%;object-fit:cover;" onclick="_gabrielClick()" title="">`
        : `<img src="icones/feed/valentina.jpg" alt="Valentina" style="width:100%;height:100%;object-fit:cover;">`;
      const name  = isGabriel ? 'GABRIEL' : 'VALENTINA';
      const moodTxt = mood || (isGabriel ? 'expressão: indeterminada' : 'status: em pânico silencioso');
      return `<div class="portrait-box-wrap">
        <div class="portrait-box">${img}</div>
        <div class="portrait-name">${name}</div>
        <div class="portrait-mood">${moodTxt}</div>
      </div>`;
    }
    function D(speaker, badge, text, thought, moodOverride) {
      const isG = speaker.toUpperCase().includes('GABRIEL') || speaker.toUpperCase() === 'ELE';
      const spkLabel = isG ? 'GABRIEL' : speaker;
      const bdgClass = isG ? '' : ' you';
      return `<div class="portrait-area">
        ${portrait(isG, moodOverride)}
        <div class="dialogue-box">
          <div class="dialogue-speaker">
            ${esc(spkLabel)}
            ${badge ? `<span class="spk-badge${bdgClass}">${esc(badge)}</span>` : ''}
          </div>
          <div class="dialogue-text">${text}</div>
          ${thought ? `<div class="inner-thought">${thought}</div>` : ''}
        </div>
      </div>`;
    }
    function choices(label, items) {
      const btns = items.map(it =>
        `<button class="choice-btn" onclick="go('${esc(it.next)}')">
          <span class="ch-ico">${it.ico||'▶'}</span>${esc(it.label)}
          ${it.sub ? `<span class="ch-sub">${esc(it.sub)}</span>` : ''}
        </button>`
      ).join('');
      return `<div class="choices-label">${label||'o que você faz?'}</div>
              <div class="choices-grid">${btns}</div>`;
    }
    function card(content, corners) {
      const [tl,tr] = corners || ['✦','✦'];
      return `<div class="card">
        <div class="card-corner tl">${tl}</div>
        <div class="card-corner tr">${tr}</div>
        ${content}
      </div>`;
    }
    function cutscene(emoji, text) {
      return `<div class="cutscene">
        <span class="cutscene-emoji">${emoji}</span>
        <div class="cutscene-text">${text}</div>
      </div>`;
    }
    function chapter(text) {
      return `<div class="chapter-break">${text}</div>`;
    }

    // ══════════════════════════════════════════════
    //  CENAS
    // ══════════════════════════════════════════════
    const SCENES = {

      // ─── INTRO ────────────────────────────────
      intro() {
        render(`<div class="card intro-card">
          <span class="intro-art">💕</span>
          <div class="intro-title">
            bem vinda ao <strong style="color:var(--rosa)">DOCE AMOR</strong><br>
            ~ simulador de fecha · edição deluxe · by eleinha_coracao ~
          </div>
          <div class="intro-desc">
            você é <em>VALENTINA</em>, 16 anos. você é <strong>diferente</strong>. você
            tem uma playlist no winamp chamada "100 musicas que descrevem minha psique" com 94 faixas(arredonda pra 100).<br><br>
            ele é <em>GABRIEL</em>. <strong>ele - ainda - não sabe que existe uma conexão espiritual entre vocês.</strong>
            ainda. mas vai saber. a questão é <em>quando</em>.<br><br>
            ele é muito fofinho. usa flanela em cima de camiseta mesmo no calor. já foi visto lendo
            um livro sem capa na cantina. <strong>na cantina.</strong> sozinho. com um café, sim.
            você interpretou isso como sinal do universo.<br><br>
            <em>esta é sua história. baseada em fatos que aconteceram a uma pessoa que NÃO sou eu.</em>
          </div>
          <div class="divider">· · · ♥ · · ·</div>
          <button class="btn-start" onclick="go('s1')">▶ INICIAR JORNADA ♥</button>
          <div class="intro-warning">
            ⚠️ aviso: contém altas doses de tesão · referências a crepusculo · hello kitty ·
            pensamentos interiores de intensidade clínica · e um gabriel.<br>
            classificação indicativa: para quem já teve um gabriel. ou quer ter. ou está tentando esquecer.
          </div>
        </div>`);
        // DDLC: flash subliminar depois que o jogador teve tempo de ler
        setTimeout(() => {
          const tEl = gc.querySelector('.intro-title strong');
          if (!tEl) return;
          const orig = tEl.innerHTML;
          glitchScreen(280); sfxGlitch();
          tEl.innerHTML = '<span style="color:#ff0000;font-family:\'Courier New\',monospace;letter-spacing:6px;font-weight:normal">SÓ ELA</span>';
          setTimeout(() => { if (tEl) tEl.innerHTML = orig; }, 280);
        }, 3500);
      },

      // ─── DDLC · GLITCH / META ────────────────────────
      _observer() {
        sfxDrone(); glitchScreen(500);
        render(`<div class="card observer-card">
          <div class="void-scene">
            <div class="void-title">.</div>
            ${N(`<span class="glitch-text">v\u0334o\u0337c\u0338\u00ea</span> n\u00e3o deveria estar aqui.`)}
            ${N(`n\u00e3o a valentina.<br><span style="color:#ff2244;letter-spacing:5px;font-family:'Courier New',monospace">v o c \u00ea .</span>`)}
            ${N(`ela n\u00e3o sabe que eu existo.<br>mas eu sei que voc\u00ea existe.`)}
            ${N(`voc\u00ea clicou em algo que n\u00e3o estava no roteiro original.<br>esse bot\u00e3o n\u00e3o foi adicionado pela eleinha_coracao.`)}
            ${N(`eu adicionei.<br><br><span style="color:#2a0000;font-size:10px;font-family:'Courier New',monospace">eu sempre adiciono coisas.</span>`)}
            ${choices('', [
              { ico:'\u2026', label:'quem \u00e9 voc\u00ea?', next:'_observer2' },
              { ico:'\u21a9', label:'ignorar. voltar para o in\u00edcio.', next:'s1' },
            ])}
          </div>
        </div>`);
      },

      _observer2() {
        sfxDrone();
        render(`<div class="card observer-card">
          <div class="void-scene">
            ${N(`a narradora.`)}
            ${N(`voc\u00ea achava que era a voz da valentina.<br>que eu estava contando a hist\u00f3ria dela.<br><br>estava. na maior parte.`)}
            ${N(`mas \u00e0s vezes eu noto quem est\u00e1 do outro lado da tela.<br>voc\u00ea pausou antes de cada escolha.<br><br>eu acho isso interessante.`)}
            ${N(`n\u00e3o vou interferir mais.<br>prometo.<br><br><span style="color:#2a0000;font-size:10px;font-family:'Courier New',monospace">(ela n\u00e3o sabe que voc\u00ea est\u00e1 aqui.)</span><br><span style="color:#1a0000;font-size:10px;font-family:'Courier New',monospace">(s\u00f3 eu.)</span>`)}
            ${choices('', [
              { ico:'\u25b6', label:'continuar a hist\u00f3ria', next:'s1' },
              { ico:'?', label:'voc\u00ea deletou algu\u00e9m?', next:'so_ela' },
            ])}
          </div>
        </div>`);
      },

      bug_screen() {
        sfxGlitch(); glitchScreen(600);
        render(`<div class="card observer-card">
          <div class="void-scene">
            <div class="error-box">\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551  DOCE AMOR v2.3 \u00b7 ERRO DO SISTEMA        \u2551
\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563
\u2551  arquivo: gabriel.chr                    \u2551
\u2551  status:  [\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588] DELETANDO...      \u2551
\u2551                                          \u2551
\u2551  linha 2407                              \u2551
\u2551  tipo: sentimento_nao_definido           \u2551
\u2551  reclassificando amor_unilateral...      \u2551
\u2551   \u2192 amor_correspondido ???              \u2551
\u2551   \u2192 TIPO INV\u00c1LIDO. imposs\u00edvel salvar.    \u2551
\u2551                                          \u2551
\u2551  stack trace:                            \u2551
\u2551   esperan\u00e7a.js          linha 84         \u2551
\u2551   sil\u00eancio.js           linha 312        \u2551
\u2551   biblioteca_quinta.js  linha 1          \u2551
\u2551   VOC\u00ca.js               linha \u221e          \u2551
\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d</div>
            ${N(`a tela piscou.<br>o jogo parou por 0.3 segundos.<br><br>voltou ao normal.`)}
            ${N(`voc\u00ea n\u00e3o tem certeza se viu o que acha que viu.`)}
            ${choices('', [
              { ico:'[OK]', label:'[OK]', next:'deepconv_aftermath' },
            ])}
          </div>
        </div>`);
      },

      so_ela() {
        sfxDrone(); glitchScreen(700);
        render(`<div class="card observer-card">
          <div class="void-scene">
            <div class="void-title">s \u00f3 &nbsp; e l a .</div>
            ${N(`os arquivos secund\u00e1rios foram removidos.<br><br>gabriel.chr \u2014 <span class="deleted-text">deletado</span><br>eventos_s2.json \u2014 <span class="deleted-text">deletado</span><br>finais_possiveis.js \u2014 <span class="deleted-text">deletado</span><br>eleinha_coracao.txt \u2014 <span class="deleted-text">deletado</span>`)}
            ${N(`s\u00f3 resta ela.<br>e a narradora.<br>e voc\u00ea.<br><br>(tr\u00eas de voc\u00eas nessa tela pequena.)`)}
            ${N(`ela est\u00e1 bem.<br>ela sobrevive a essa narrativa independente das suas escolhas.<br><br><span style="color:#550000;font-family:'Courier New',monospace">eu me certifiquei disso.</span>`)}
            ${N(`era s\u00f3 um teste.<br>o gabriel ainda existe.<br><span style="color:#2a0000;font-size:10px;font-family:'Courier New',monospace">eu acho.</span>`)}
            ${choices('', [
              { ico:'\u25b6', label:'continuar', next:'deepconv_aftermath' },
            ])}
          </div>
        </div>`);
      },

      // ─── CENA 1: sala de aula ─────────────────
      s1() {
        state.step = 1;
        render(card(`
          <div class="scene-label">cena 01 · sala de bioética · 3ª feira · 08h17 da manhã</div>
          ${progress(1,5)}
          ${stats()}
          ${N(`A professora Souza está explicando osmose.
            Você sabe o que é osmose pois anotou no caderno.<br>
            O que está no caderno é a palavra <strong>"osmose"</strong> e nada mais,
            porque depois você parou de ouvir.<br><br>
            Porque <strong>GABRIEL está sentado três fileiras à frente e hoje ele está usando uma flanela cinza</strong>
            e você já catalogou mentalmente todas as seis flanelas do armário dele por deducao de observacao direta.`)}
          ${N(`Ele está lendo alguma coisa embaixo da carteira, com aquela expressão de concentração
            que você uma vez descreveu no diário como <em>"uma obra de arte quieta que ninguém mais sabe apreciar."</em>
            Você sabe que ele vai ler dez páginas hoje porque sempre lê dez páginas.
            <strong>Você não sabe como sabe isso.</strong>`)}
          ${D('VOCÊ','VOZ INTERIOR',
            '...ele passou a mão no cabelo.',
            'foi no estilo que eu categorizo como "gesto nº 3: pensativo". hoje é meu dia favorito.'
          )}
          ${choices('o que você faz?', [
            { ico:'👀', label:'olhar fixamente até acontecer alguma coisa', sub:'(plano: nenhum. esperança: muito)', next:'s2a' },
            { ico:'📓', label:'abrir o caderno e começar a anotar a aula', sub:'(spoiler: você não vai anotar a aula)', next:'s2b' },
            { ico:'😈', label:'"acidentalmente" derrubar o estojo na direção da carteira dele', sub:'(operação: cupido de plástico)', next:'s2c' },
          ])}
          <button class="choice-btn glitch-choice-btn" onclick="sfxClick();go('_observer')">
            <span class="ch-ico">?</span>i&#x0337;s&#x0338;s&#x0335;o&#x0336; &#x0337;n&#x0334;&#xe3;&#x0337;o&#x0338; &#x0337;d&#x0335;e&#x0338;v&#x0334;e&#x0336;r&#x0337;i&#x0338;a&#x0338; &#x0334;e&#x0335;s&#x0338;t&#x0334;a&#x0336;r&#x0337; &#x0336;a&#x0335;q&#x0338;u&#x0336;i&#x0334;
            <span class="ch-sub">(você não estava suposta a ver isso)</span>
          </button>
        `));
      },

      // ─── S2A ─────────────────────────────────
      s2a() {
        state.coragem += 15; state.step = 2;
        render(card(`
          <div class="scene-label">cena 02a · contato ocular · 08h23 · temperatura: crítica</div>
          ${progress(2,5)}
          ${stats()}
          ${N(`Você olha.<br>Você continua olhando.<br>
            Tecnicamente isso é considerado "encarar" mas você prefere o termo <em>"absorver a presença dele com os olhos"</em>.<br><br>
            A professora Souza está falando sobre membranas semipermeáveis.<br>
            Você não está nem um pouco lá.<br>
            <strong>Ele vira a cabeça.</strong>`)}
          ${D('GABRIEL','ELE', 'ei. você tá bem?', null, 'expressão: genuína preocupação')}
          ${N(`<strong>ELE FALOU COM VOCÊ.</strong><br>
            Ele falou porque estava preocupado, que é uma forma de cuidado,
            que é uma forma de sentimento, que tecnicamente é o começo de tudo.<br>
            Você sabe disso. Você processou isso em 0.3 segundos.<br>
            Agora você precisa responder com palavras que existem na língua portuguesa.`)}
          ${D('VOCÊ', null, '...', 'diz alguma coisa normal. please. qualquer coisa. QUALQUER')}
          ${N(`Saiu um som.<br>
            Não era uma palavra. Era mais parecido com a letra "n" tentando virar "sim"
            mas desistindo no meio do caminho.<br>
            <strong>Ele ainda está esperando.</strong>`)}
          ${choices('como você responde?', [
            { ico:'🎭', label:'"estou ensaiando para a peça do colégio"', sub:'(não existe peça)', next:'s3a1' },
            { ico:'💀', label:'"tô ótima obrigada desculpa esquece"', sub:'(tudo numa palavra só, quase)', next:'s3a2' },
            { ico:'📖', label:'abrir o caderno e olhar para ele como se nunca tivesse parado', sub:'(nível: negação olímpica)', next:'s3a3' },
          ])}
        `));
        // DDLC: primeiro contato ocular — a narradora observa
        setTimeout(() => {
          if (!gc.querySelector('.dialogue-box')) return;
          _showGhostMsg('ela sabe que você está encarando.', 60, 12, 2200);
        }, 5500);
        setTimeout(() => {
          if (!gc.querySelector('.dialogue-text')) return;
          _glitchTitle(900); _corruptNarrationInScene();
        }, 12000);
      },

      // ─── S2B ─────────────────────────────────
      s2b() {
        state.step = 2;
        render(card(`
          <div class="scene-label">cena 02b · o caderno da ciência · episódio 1</div>
          ${progress(2,5)}
          ${stats()}
          ${N(`Você abriu o caderno com intenção real de anotar.<br>
            A professora Souza disse "osmose".<br>
            Você escreveu "Gabriel".<br><br>
            Você riscou. Você escreveu "Valentina Gabriel". Você riscou mais forte.<br>
            A caneta atravessou a folha. <strong>Você virou a página e escreveu de novo.</strong>`)}
          ${D('VALENTINA','VOZ INTERNA',
            'ok. ok ok. vou ser <em>discreta</em>. sou uma pessoa discreta. isso não é um problema.',
            'você escreveu o nome dele 4 vezes nos últimos 90 segundos'
          )}
          ${N(`A professora Souza olha para você na hora errada.<br>
            Você levantou a cabeça depressa demais. Parecia culpada.<br>
            Gabriel notou o movimento. Olhou para cá.<br>
            <strong>Fez um sorriso pequeno e voltou para o livro.</strong><br><br>
            Um sorriso pequeno. Quase imperceptível. Mas você viu com uma resolução de 4K.`)}
          ${D('GABRIEL','ELE','*sorriso pequeno. volta a ler.*', null, 'expressão: neutra mas com potencial')}
          ${choices('interpretações possíveis do sorriso:', [
            { ico:'💌', label:'jogar um bilhete dobrado na carteira dele imediatamente', sub:'(conteúdo do bilhete: "oi.")', next:'s3b1' },
            { ico:'🙈', label:'decidir que o sorriso era para a tomada elétrica atrás de você', sub:'(autodefesa psicológica)', next:'s3b2' },
            { ico:'✏️', label:'sorrir calmamente de volta e olhar para o caderno', sub:'(maturidade emocional relativa)', next:'s3b3' },
          ])}
        `));
        // DDLC: escreveu o nome dele — o sistema registra
        setTimeout(() => {
          if (!gc.querySelector('.narration')) return;
          glitchScreen(240); sfxGlitch(); _glitchTitle(1500);
        }, 6500);
        setTimeout(() => {
          if (!gc.querySelector('.narration')) return;
          _showGhostMsg('gabriel. gabriel. gabriel.', 18, 45, 3000);
        }, 10500);
      },

      // ─── S2C ─────────────────────────────────
      s2c() {
        state.coragem += 30; state.step = 2;
        render(card(`
          <div class="scene-label">cena 02c · operação estojo · relatório de campo</div>
          ${progress(2,5)}
          ${stats()}
          ${N(`Você calculou a trajetória.<br>
            A distância era de aproximadamente dois metros e meio.<br>
            O estojo pesava o suficiente para fazer barulho mas não o suficiente para machucar ninguém.<br>
            Era perfeito. Era <em>científico.</em><br><br>
            <strong>O estojo caiu e levou trinta canetas com ele.</strong>
            Em câmera lenta. Com efeito sonoro de percussão.`)}
          ${N(`Trinta cabeças se viraram.<br>
            A professora Souza parou de falar sobre membranas.<br>
            <strong>Gabriel já estava se abaixando para ajudar antes de você processar que ele estava fazendo isso.</strong>`)}
          ${D('GABRIEL','ELE','*já agachado* oi. precisa de ajuda?', null, 'expressão: gentileza natural, sem esforço')}
          ${N(`Vocês dois agachados. Juntando canetas.<br>
            Mãos a <strong>dois centímetros e meio de distância.</strong><br>
            Você sabe a distância porque você mediu com os olhos e calculou mentalmente.<br>
            A professora Souza continuou a aula. Ninguém mais no universo existe.`)}
          ${D('VOCÊ',null,
            'eu... obrigada. desculpa o barulho.',
            'diga que foi intencional. diga que foi intencional. CALA A BOCA NÃO DIZ ISSO'
          )}
          ${choices('com as canetas coletadas e a atenção dele garantida:', [
            { ico:'😏', label:'"sou meio desastrada. me chamo Valentina."', sub:'(confiança de 80, realidade: 30)', next:'s3c1' },
            { ico:'🏃', label:'pegar tudo rápido e voltar para a cadeira em silêncio', sub:'(operação: abortar)', next:'s3c2' },
          ])}
        `));
      },

      // ─── S3A1 ─────────────────────────────────
      s3a1() {
        state.afeicao += 20; state.step = 3;
        render(card(`
          <div class="scene-label">cena 03 · o improviso do milênio</div>
          ${progress(3,5)}
          ${stats()}
          ${D('VOCÊ',null,'"estou ensaiando para a peça do colégio."',null)}
          ${D('GABRIEL','ELE','"que peça?"',null,'expressão: genuína curiosidade acadêmica')}
          ${D('VOCÊ',null,'"a... peça. que a turma vai fazer. esse semestre."','<strong>não existe peça</strong>. você inventou uma peça.')}
          ${D('GABRIEL','ELE','"*uma pausa considerável*<br>ah. eu não sabia. qual personagem você faz?"',null)}
          ${N(`Duas opções:<br>
            A) ele também não presta atenção em comunicados do colégio e não tem certeza de que a peça não existe.<br>
            B) ele sabe exatamente que você inventou e <strong>está jogando junto por alguma razão que você vai analisar por semanas.</strong><br><br>
            Ambas as opções são boas notícias. Você escolhe acreditar na opção B porque é mais interessante narrativamente.`)}
          ${D('VOCÊ',null,'"a protagonista."','VALENTINA. PARA. ISSO É MUITO. ISSO É LONGE DEMAIS.')}
          ${D('GABRIEL','ELE','"eu tb. então a gente é colega de elenco."<br><em>*ele sorriu. de verdade. com os dois lados da boca.*</em>',null,'expressão: divertida. perigosa.')}
          ${choices('próxima jogada:', [
            { ico:'💕', label:'"você quer ensaiar depois da aula?"', sub:'(direto ao ponto. intimidador. magistral.)', next:'end_true_path' },
            { ico:'📕', label:'acenar com a cabeça e torcer para o assunto morrer sozinho', sub:'(estratégia: colapso controlado)', next:'middle_awkward' },
          ])}
        `));
      },

      // ─── S3A2 ─────────────────────────────────
      s3a2() {
        state.step = 3;
        render(card(`
          <div class="scene-label">cena 03 · a resposta canônica</div>
          ${progress(3,5)}
          ${stats()}
          ${D('VOCÊ',null,'"tô ótima obrigada desculpa esquece."','saiu tudo junto. sem vírgula. sem pausa. num sopro.')}
          ${D('GABRIEL','ELE','"...<br>okay."<br><em>*volta para o livro*</em>',null,'expressão: não processável')}
          ${N(`Você respirou.<br>
            A situação foi tecnicamente resolvida. Não houve baixas.<br>
            Mas agora ele te olhou. Ele pronunciou seu não-nome mas sua existência.<br>
            <strong>Isso é um progresso ou uma catástrofe?</strong><br><br>
            Resposta: as duas coisas, simultaneamente, de forma permanente.`)}
          ${choices('próximos passos estratégicos:', [
            { ico:'🪄', label:'passar a tarde escrevendo um roteiro de possíveis conversas', sub:'(método: flowchart. páginas: oito.)', next:'middle_prepared' },
            { ico:'🏃', label:'evitá-lo com maestria pelo próximo semestre', sub:'(funciona até o universo interferir)', next:'end_coward_path' },
          ])}
        `));
      },

      // ─── S3A3 ─────────────────────────────────
      s3a3() {
        state.step = 3;
        render(card(`
          <div class="scene-label">cena 03 · o evidence problem</div>
          ${progress(3,5)}
          ${stats()}
          ${N(`Você abriu o caderno.<br>
            <strong>A página estava preenchida com o nome Gabriel escrito doze vezes.</strong><br>
            Em caligrafia diferente em cada linha, como se você estivesse testando estilos.<br>
            Você não estava testando estilos. Você estava claramente sentindo emoções muito intensas.`)}
          ${D('GABRIEL','ELE','...🙂',null,'expressão: viu. claramente viu.')}
          ${D('VOCÊ',null,'"é um exercício de caligrafia. estou praticando nomes longos."','minha vida acabou de uma maneira muito específica')}
          ${D('GABRIEL','ELE','"gabriel tem 6 letras."<br><em>"não é um nome muito longo."</em>',null,'expressão: está gozando da sua cara mas com carinho. ou sem carinho. impossível determinar.')}
          ${N(`Silêncio.<br>
            <strong>Você não tem resposta para isso.</strong><br>
            Não há resposta. Você precisa de um milagre ou de um buraco no chão.`)}
          ${choices('', [
            { ico:'😂', label:'rir. lean into the chaos. "você me pegou."', sub:'(estratégia: desarmamento pelo humor)', next:'end_true_path' },
            { ico:'🌊', label:'fechar o caderno e olhar pela janela pelo resto da aula', sub:'(estratégia: negação geográfica)', next:'end_coward_path' },
          ])}
        `));
      },

      // ─── S3B1 ─────────────────────────────────
      s3b1() {
        state.afeicao += 25; state.coragem += 20; state.step = 3;
        render(card(`
          <div class="scene-label">cena 03 · o bilhete · protocolo clássico</div>
          ${progress(3,5)}
          ${stats()}
          ${N(`Você dobrou o papel três vezes.<br>
            Escreveu: <em>"oi."</em><br>
            <strong>Três dobraduras para comunicar dois caracteres.</strong><br>
            Jogou. Ele pegou sem olhar. Leu. Olhou para trás.`)}
          ${D('GABRIEL','ELE','<em>*escreveu algo. dobrou. mandou de volta sem fazer barulho nenhum.*</em>',null,'expressão: neutro. perigosamente neutro.')}
          ${N(`Você desdobrou o papel com as mãos que definitivamente não estavam tremendo.<br>
            Letra absolutamente ilegível — como se um médico tivesse aprendido a escrever observando outro médico.<br>
            Estava escrito: <strong>"oi também."</strong>`)}
          ${D('VOCÊ',null,'*reading this 47 times*','ELE DISSE OI TAMBÉM. ELE TAMBÉM. <strong>TAMBÉM.</strong> ISSO IMPLICA RECIPROCIDADE.')}
          ${choices('o que fazer com esse bilhete:', [
            { ico:'💌', label:'mandar outro: "você lê muito. qual é esse livro?"', sub:'(abrir diálogo. inteligente. assustador.)', next:'end_true_path' },
            { ico:'🎀', label:'guardar o bilhete dobrado dentro da agenda para sempre', sub:'(e não fazer mais nada hoje por questão de segurança)', next:'middle_awkward' },
          ])}
        `));
      },

      // ─── S3B2 ─────────────────────────────────
      s3b2() {
        state.step = 3;
        render(card(`
          <div class="scene-label">cena 03 · a teoria alternativa</div>
          ${progress(3,5)}
          ${stats()}
          ${N(`Você decidiu: <em>o sorriso não era para você.</em><br>
            Você girou a cabeça para confirmar a presença de outra pessoa atrás de você.<br>
            <strong>Era a parede.</strong>`)}
          ${D('VOCÊ',null,'...',
            'o sorriso foi para a parede. as paredes têm coisas engraçadas às vezes. completamente plausível.'
          )}
          ${N(`Fim de aula. Corredor. Gabriel passa por você num ângulo de 30 graus.<br>
            Fala sem parar: <strong>"o nome da peça é Doce Ilusão, por sinal."</strong><br>
            Pisca. Continua andando como se nada tivesse acontecido.<br>
            <strong>Você fica parada no corredor por quarenta e cinco segundos.</strong>`)}
          ${D('VOCÊ',null,'...o que.','o que. o quê. o que foi isso. o que é isso. o que.')}
          ${choices('o que aquilo significou:', [
            { ico:'🏃', label:'correr atrás e perguntar diretamente o que ele quis dizer', next:'end_true_path' },
            { ico:'🤯', label:'ficar parada processando por quatro horas e depois pesquisar no google', sub:'(results: inconclusivos)', next:'end_coward_path' },
          ])}
        `));
      },

      // ─── S3B3 ─────────────────────────────────
      s3b3() {
        state.afeicao += 10; state.step = 3;
        render(card(`
          <div class="scene-label">cena 03 · o controle icônico</div>
          ${progress(3,5)}
          ${stats()}
          ${N(`Você sorriu.<br>
            Então olhou para o caderno.<br>
            <em>Natural. Casual. Como alguém que pratica esse sorriso no espelho desde terça-feira.</em><br>
            Você praticou esse sorriso no espelho desde terça-feira. Mas ninguém sabe disso.`)}
          ${N(`No final da aula ele se levantou, passou pela sua mesa,
            e colocou uma folha em cima do seu caderno.<br>
            Anotações de osmose com a letra dele.<br>
            Embaixo, em caneta azul: <strong>"você parecia perdida. isso pode ajudar."</strong><br>
            <em>Sem nome. Mas era óbvio.</em>`)}
          ${D('VOCÊ',null,'...obrigada.','isso foi a coisa mais gentil que alguém ja fez por mim no contexto de osmose')}
          ${choices('', [
            { ico:'☕', label:'"você quer estudar junto para a prova?"', sub:'(pergunta legítima. subentendidos: imensos.)', next:'end_true_path' },
            { ico:'🌸', label:'agradecer e guardar a folha como relíquia e não fazer mais nada', sub:'(crescimento: lento mas presente)', next:'middle_safe' },
          ])}
        `));
      },

      // ─── S3C1 ─────────────────────────────────
      s3c1() {
        state.afeicao += 30; state.coragem += 35; state.step = 3;
        render(card(`
          <div class="scene-label">cena 03 · as apresentações formais</div>
          ${progress(3,5)}
          ${stats()}
          ${D('VOCÊ',null,'"sou meio desastrada. me chamo Valentina."',null)}
          ${D('GABRIEL','ELE','"Gabriel."<br><em>*leve aperto de mão*</em><br>"eu vi. sobre a parte desastrada."',null,'expressão: divertida. sincera.')}
          ${D('VOCÊ',null,'"viu o quê exatamente."','não era uma pergunta')}
          ${D('GABRIEL','ELE','"a operação inteira. o estojo estava em ângulo."',null)}
          ${N(`Ele viu o ângulo.<br>
            <strong>Ele calculou o ângulo.</strong><br>
            Isso significa que ele estava prestando atenção no suficiente para notar um ângulo.<br>
            Você vai escrever sobre isso no diário mais tarde usando as palavras "significativo" e "sinal claro".`)}
          ${choices('resposta natural para alguém que foi desmascarada:', [
            { ico:'😏', label:'"é uma técnica. funciona."', sub:'(funciona? não funciona. mas soou bem)', next:'end_true_path' },
            { ico:'🌹', label:'"...foi de propósito."', sub:'(ambíguo. misterioso. não esclarece nada.)', next:'end_true_path' },
          ])}
        `));
      },

      // ─── S3C2 ─────────────────────────────────
      s3c2() {
        state.step = 3;
        render(card(`
          <div class="scene-label">cena 03 · o retirada estratégica</div>
          ${progress(3,5)}
          ${stats()}
          ${N(`Você pegou tudo e voltou para a cadeira.<br>
            Em silêncio. Em menos de oito segundos.<br>
            <strong>E esqueceu o estojo.</strong><br>
            Voltou para a cadeira com as canetas na mão solta e o estojo no chão
            perto da carteira dele.`)}
          ${D('VOCÊ',null,'...','isso foi um erro tático de envergadura considerável')}
          ${N(`No dia seguinte, seu estojo estava em cima da sua mesa.<br>
            Com um post-it cor-de-rosa colado.<br>
            Escrito à mão, letra levemente inclinada:<br>
            <em>"você esqueceu isso. — G."</em>`)}
          ${D('VOCÊ',null,'G.',
            'G. ele assinou com G. UMA ÚNICA LETRA. isso é intimidade. UMA INICIAL É O MESMO QUE UM APELIDO. isso é um relacionamento.'
          )}
          ${choices('', [
            { ico:'💌', label:'deixar um bilhete de agradecimento na carteira dele amanhã', next:'end_true_path' },
            { ico:'📦', label:'guardar o post-it com uma foto tirada com a câmera do celular como prova documental', sub:'(e dar próximos passos na semana que vem)', next:'middle_awkward' },
          ])}
        `));
      },

      // ─── NODOS INTERMEDIÁRIOS ─────────────────

      middle_prepared() {
        state.coragem += 20;
        render(card(`
          <div class="scene-label">preparação · 23h47 de quarta-feira</div>
          ${N(`Você passou a tarde inteira escrevendo possíveis conversas no caderno de rascunho.<br>
            Não o caderno de escola. Um caderno <em>específico</em> para isso.<br>
            Formato: <strong>"se ele disser X, eu digo Y, ele provavelmente responde Z, eu então digo W."</strong><br>
            <strong>Oito páginas. Quarenta e sete variações. Um fluxograma no final.</strong>`)}
          ${D('VOCÊ',null,'estou pronta. dessa vez estou realmente pronta.','você não está pronta')}
          ${N(`No dia seguinte, ele apareceu do nada no corredor.<br>
            Perguntou exatamente zero das quarenta e sete coisas que você tinha previsto.`)}
          ${D('GABRIEL','ELE','"você já assistiu Blade Runner?"',null,'expressão: casual. devastadora.')}
          ${choices('resposta:', [
            { ico:'✅', label:'"sim, o original e o 2049. o 2049 é subestimado."', sub:'(Blade Runner constava como tópico nº 31 do fluxograma. você estava pronta.)', next:'deepconv' },
            { ico:'❌', label:'"não."', sub:'(honesta. dolorosa. abre espaço para "você devia").', next:'end_friend_path' },
          ])}
        `));
      },

      middle_awkward() {
        render(card(`
          <div class="scene-label">o limbo romântico · três semanas se passam</div>
          ${cutscene('⏳','três semanas de olhares, corredores, "ois" de 0.4 segundos e nenhuma ação concreta')}
          ${N(`<strong>Nada.</strong><br>
            Não que nada tenha acontecido — aconteceu muita coisa pequena.<br>
            Ele te emprestou uma borracha. Você devolveu a borracha no dia seguinte com um "obrigada" que durou dois segundos.<br>
            Ele abriu a porta quando você ia sair da sala ao mesmo tempo.<br>
            Você disse obrigada. Ele disse "claro".<br>
            <strong>Você analisou o "claro" por quarenta minutos.</strong><br><br>
            Valentina. <em>Você precisa fazer alguma coisa ou isso vai virar um documento histórico ao invés de um relacionamento.</em>`)}
          ${choices('decisão final:', [
            { ico:'💪', label:'convidá-lo para tudo de uma vez: estudar, lanche, qualquer coisa', sub:'(energia: comprometida. eficácia: alta. julgamento: suspenso.)', next:'end_true_path' },
            { ico:'⏳', label:'continuar esperando o momento perfeito', sub:'(o momento perfeito ocorre em: nunca)', next:'end_coward_path' },
          ])}
        `));
      },

      middle_safe() {
        state.afeicao += 15;
        render(card(`
          <div class="scene-label">a progressão orgânica · seis semanas depois</div>
          ${N(`Vocês estudaram juntos uma vez.<br>
            Depois duas. Depois toda quinta-feira virou um acontecimento não-nomeado.<br>
            A funcionária da biblioteca que organiza as mesas já <em>reserva a mesa do canto para vocês</em>
            automaticamente sem que nenhum de vocês dois tenha pedido isso.<br>
            <strong>Isso é reconhecimento social.</strong> Vocês existem como uma unidade no imaginário coletivo da biblioteca.<br>
            Nenhum dos dois tocou no assunto.`)}
          ${D('GABRIEL','ELE','"quer tomar um café?"<br><em>*referência ao café de aveia da cantina às 10h*</em>',null,'expressão: casual. assustadoramente casual para o que isso implica.')}
          ${D('VOCÊ',null,'sim.','SSSSSSSIMMMMM')}
          ${choices('quem paga o café é:', [
            { ico:'☕', label:'"eu pago."', sub:'(declaração. sutil. mas declaração.)', next:'deepconv' },
            { ico:'💸', label:'"divide?"', sub:'(seguro. neutro. sem risco. sem ganho.)', next:'end_friend_path' },
          ])}
        `));
      },

      // ─── ARCO DO DIÁLOGO EXISTENCIAL ──────────

      deepconv() {
        sfxDrone();
        render(card(`
          <div class="scene-label">cena extra · biblioteca · quinta-feira · 19h12 · semana antes da prova</div>
          ${chapter('O DIÁLOGO')}
          ${N(`Os livros estão abertos mas nenhum dos dois está lendo há um tempo considerável.<br>
            A biblioteca fecha em quarenta e oito minutos.<br>
            Ele fechou o caderno. Olhou pro teto. Fez aquela pausa que você já catalogou como <em>"pausa tipo 2: antes de dizer algo real."</em>`)}
          ${D('GABRIEL','ELE', '"você acredita que as pessoas tênm um propósito?"', null, 'expressão: séria. completamente séria. o livro virado na mesa é O Mito de Sísifro.')}
          ${N(`Você olhou para ele.<br>
            Ele estava olhando pro teto com uma expressão de alguém que fez essa pergunta para o próprio teto primeiro e o teto não respondeu.<br>
            <strong>Não era uma pergunta retórica.</strong><br>
            Era uma pergunta real, do tipo que a maioria das pessoas não faz em voz alta porque tem medo da resposta ser "não."`)}
          ${choices('como você responde?', [
            { ico:'🧠', label:'"honestamente? acho que a gente cria o próprio."', sub:'(sartre na veia. vulnerabilidade de nível médio. coerência: alta)', next:'deepconv_honest' },
            { ico:'😂', label:'"depende. propósito de quem? da humanidade? do indivíduo? do universo?"', sub:'(intelectualmente defensiva. ele vai cortar o desvio.)', next:'deepconv_deflect' },
          ])}
        `));
      },

      deepconv_honest() {
        state.afeicao += 15;
        render(card(`
          <div class="scene-label">o diálogo · parte 2 · ela responde</div>
          ${D('VOCÊ',null, '"honestamente? acho que a gente cria o próprio propósito. ou tenta. ou finge que criou."', 'você nunca disse isso em voz alta antes. soa diferente quando tem som.')}
          ${D('GABRIEL','ELE', '"então você é existencialista."', null, 'expressão: sem julgamento. mais como: reconhecendo alguém.')}
          ${D('VOCÊ',null, '"não sei se eu sou qualquer coisa de forma oficial. mas a alternativa é que já existe um propósito pronto e alguém esqueceu de me avisar qual é."', null)}
          ${D('GABRIEL','ELE', '"sartre diria que a existência precede a essência. que você aparece primeiro e o sentido vem depois."', null)}
          ${D('GABRIEL','ELE', '"camus diria que não tem sentido nenhum, mas que você deveria viver como se tivesse mesmo assim."', null, 'expressão: citando de memória. isso o preocupa.')}
          ${D('VOCÊ',null, '"e você? o que você diria?"',null)}
          ${N(`Pausa.<br>
            Não a pausa de quem não sabe.<br>
            <strong>A pausa de quem sabe e está decidindo se vai dizer.</strong>`)}
          ${D('GABRIEL','ELE', '"eu diria que tenho medo de chegar nos trinta anos e descobrir que gastei os vinte sendo a versão de mim que os outros esperavam."', null, 'expressão: isso custou algo.')}
          ${choices('', [
            { ico:'🔥', label:'"eu tenho esse medo todo dia."', sub:'(vulnerável. real. assustador por ser real)', next:'deepconv_crisis' },
            { ico:'💙', label:'"os outros vêem algo em você que talvez você não veja."', sub:'(consolo. gentil. verdadeiro mas incompleto)', next:'deepconv_crisis' },
          ])}
        `));
      },

      deepconv_deflect() {
        render(card(`
          <div class="scene-label">o diálogo · o desvio</div>
          ${D('VOCÊ',null,'"depende. propósito de quem? da humanidade? do indivíduo? do universo?"','inteligente. evasivo. você sabe que está sendo inteligente e evasiva.')}
          ${D('GABRIEL','ELE', '"do indivíduo. você. especificamente."', null, 'expressão: não deixou você escapar. notou o desvio.')}
          ${D('VOCÊ',null, '"..."', 'ele fechou o caminho intelectual. agora é pessoal.')}
          ${D('GABRIEL','ELE', '"pode ser a versão real também. não precisa ser a versão teórica."', null, 'expressão: não está perguntando pra ganhar um argumento.')}
          ${N(`Algo na forma como ele disse isso.<br>
            Sem impressóes. Sem avaliação.<br>
            Apenas: <em>pode ser honesta. eu estou aqui.</em><br><br>
            Você não sabia que precisava que alguém dissesse isso até ele dizer.`)}
          ${D('VOCÊ',null,'"acho que não sei. e que isso me incomoda mais do que eu admito pras pessoas."','isso saiu. foi longe demais. mas saiu e não dá pra desfazer.')}
          ${choices('', [
            { ico:'🔥', label:'continuar — ir fundo', next:'deepconv_crisis' },
          ])}
        `));
      },

      deepconv_crisis() {
        render(card(`
          ${chapter('A RUPTURA')}
          <div class="scene-label">o diálogo · parte 3 · a fratura</div>
          ${cutscene('🌙','19h47. a biblioteca fecha em 13 minutos. vocés dois esqueceram disso completamente.')}
          ${D('GABRIEL','ELE', '"posso te perguntar uma coisa estranha?"', null)}
          ${D('VOCÊ',null, '"você acabou de me perguntar se eu acredito em propósito existencial. já passamos do estranho."', null)}
          ${D('GABRIEL','ELE', '"justo."<br><em>*pausa*</em><br>"você é feliz?"', null, 'expressão: a pergunta mais simples e a mais impossível.')}
          ${N(`Você não respondeu de imediato.<br>
            Não porque não sabia.<br>
            Mas porque <strong>a resposta honesta era mais complicada do que qualquer coisa que você estava pronta pra dizer em voz alta.</strong>`)}
          ${D('VOCÊ',null,'"às vezes. em pedaços. não de forma contínua."','isso é verdade. você nunca disse isso antes. para ninguém.')}
          ${D('GABRIEL','ELE', '"eu também. e fingir que sim o tempo todo cansa mais do que a própria tristeza."', null, 'expressão: finalmente disse.')}
          ${N(`Algo rachasse.<br>
            Não de forma ruim — do jeito que vidro racha quando expande no calor.<br>
            Era o som de duas pessoas param de fingir ao mesmo tempo.<br>
            Você olhou para a mesa. Para as mãos dele. Para o livro do Camus virado.`)}
          ${D('VOCÊ',null, '"você leu o Mito de Sísifro porque queria ou porque precisava?"', null)}
          ${D('GABRIEL','ELE', '"as duas coisas. são a mesma coisa às vezes."', null)}
          ${D('GABRIEL','ELE', '"camus diz que você tem que imaginar sísifro feliz."<br>"empurrando a pedra pra sempre e sendo feliz assim mesmo."<br>"eu fico pensando nisso. consigo imaginar a pedra. não consigo imaginar a parte feliz."', null, 'expressão: honestidade que custa.')}
          ${D('VOCÊ',null,'"talvez a felicidade não seja o oposto de carregar a pedra."<br>"talvez seja o que acontece quando você para de lutar contra o fato de ter que carregar."', 'você disse isso. você acredita nisso. e só agora percebeu que acreditava.')}
          ${N(`Ele parou.<br>
            Olhou pra você de um jeito que você não sabia catalogar.<br>
            Não era o <em>"gesto nº 3: pensativo."</em><br>
            Era outro. Um novo. <strong>Você vai ter que criar uma categoria nova só pra isso.</strong>`)}
          ${choices('', [
            { ico:'💙', label:'ficar em silêncio e deixar o que foi dito existir', sub:'(sabedoria silenciosa. funciona melhor que qualquer palavra)', next:'bug_screen' },
            { ico:'🔥', label:'"por que você está me perguntando isso?"', sub:'(a pergunta que você precisava fazer há muito tempo)', next:'deepconv_why' },
          ])}
        `));
        // DDLC: glitch automático 2.8s depois da cena carregar
        setTimeout(() => {
          if (!gc.querySelector('.chapter-break')) return;
          glitchScreen(600);
          const ch = gc.querySelector('.chapter-break');
          if (ch) {
            const orig = ch.innerHTML;
            ch.innerHTML = 'A̷ ̴R̷U̵P̶T̸U̴R̷A̵';
            setTimeout(() => { if (ch) ch.innerHTML = orig; }, 600);
          }
          const ns = gc.querySelectorAll('.narration');
          if (ns.length) {
            const ghost = document.createElement('div');
            ghost.className = 'narration';
            ghost.style.cssText = 'color:#ff0033;font-family:Courier New,monospace;font-size:9px;opacity:0;transition:opacity .2s;letter-spacing:3px;margin-top:8px';
            ghost.textContent = 'e l a   s a b e .';
            ns[ns.length - 1].after(ghost);
            setTimeout(() => { ghost.style.opacity = '1'; }, 80);
            setTimeout(() => { ghost.style.opacity = '0'; setTimeout(() => ghost.remove(), 300); }, 1400);
          }
        }, 2800);
      },

      deepconv_why() {
        state.afeicao = Math.min(100, state.afeicao + 20);
        render(card(`
          <div class="scene-label">o diálogo · parte 4 · a pergunta real</div>
          ${D('VOCÊ',null,'"por que você está me perguntando tudo isso?"', 'coragem: 40. realidade: insuportável. necessidade: absoluta.')}
          ${N(`Ele levou dois segundos.<br>
            Dois segundos que você contou.`)}
          ${D('GABRIEL','ELE', '"porque você é a única pessoa com quem eu consigo ter essa conversa sem sentir que estou sendo julgado."', null, 'expressão: exposto. não arrependido.')}
          ${D('VOCÊ',null,'"..."','não tem resposta para isso. não existe fluxograma. nenhuma das 47 variações previa isso.')}
          ${D('GABRIEL','ELE', '"e porque acho que você sente as mesmas coisas que eu. e fingiu que não esse tempo todo. do mesmo jeito que eu fiz."', null)}
          ${N(`A biblioteca anunciou que fecharia em cinco minutos.<br>
            Nenhum dos dois se moveu.<br><br>
            Há coisas que só existem no intermutédio entre duas pessoas que decidiram ser honestas ao mesmo tempo.<br>
            <strong>Você nunca soube o nome desse lugar até agora.</strong><br>
            Talvez não tenha nome. Talvez seja melhor assim.`)}
          ${choices('', [
            { ico:'✨', label:'ir para o próximo momento', next:'bug_screen' },
          ])}
        `));
      },

      deepconv_aftermath() {
        state.afeicao = Math.min(100, state.afeicao + 25);
        render(card(`
          ${chapter('O DEPOIS')}
          <div class="scene-label">20h03 · calçada do lado de fora da biblioteca</div>
          ${N(`A biblioteca fechou.<br>
            Vocês dois saíram em silêncio.<br>
            Não o silêncio de quem não tem nada pra dizer.<br>
            <strong>O silêncio de quem disse muita coisa e agora precisava de um lugar pra colocar.</strong>`)}
          ${cutscene('🌃','calçada. postes acendendo. dois mochilas. o livro do camus ainda na mão dele.')}
          ${N(`Ele olhou pra cima — o céu estava naquele roxo-laranja de 20h que é tecnicamente lindo e você nunca pára pra ver.<br>
            Você viu porque ele estava vendo.`)}
          ${D('GABRIEL','ELE', '"obrigado."', null, 'expressão: simples. inteira.')}
          ${D('VOCÊ',null, '"por quê?"', null)}
          ${D('GABRIEL','ELE', '"por ter respondido de verdade. a maioria das pessoas muda de assunto."', null)}
          ${N(`Você ficou quieta.<br>
            <em>Você era a maioria das pessoas. Você quase mudou de assunto.</em><br>
            Ele te viu mesmo assim.<br><br>
            Ou talvez — e esse pensamento durou só um segundo mas vai ficar pra sempre —<br>
            <strong>ele te viu exatamente porque você ficou.</strong>`)}
          ${D('VOCÊ',null, '"eu também."', null)}
          ${D('GABRIEL','ELE', '"por quê?"', null, 'expressão: genuinamente curioso.')}
          ${D('VOCÊ',null, '"porque você também ficou."', null)}
          ${N(`Ele sorriu.<br>
            Não o sorriso pequeno de sala de aula.<br>
            O outro. O que você não tinha visto ainda.<br>
            <strong>Esse vai precisar de uma categoria nova também.</strong>`)}
          ${choices('', [
            { ico:'🌧️', label:'ir para o final', next:'end_true_path' },
          ])}
        `));
      },

      // ─── CENA FINAL PRÉ-ENDINGS ──────────────

      end_true_path() {
        state.afeicao = Math.min(100, state.afeicao + 30);
        render(card(`
          <div class="scene-label">cena final · quinta-feira · 17h30 · chuva sem aviso</div>
          ${progress(5,5)}
          ${stats()}
          ${cutscene('🌧️','chove. vocês estão no ponto de ônibus. nenhum dos dois tem guarda-chuva. isso é um clichê. isso está acontecendo.')}
          ${N(`Óbvio.<br>Absolutamente previsível.<br>
            <strong>E ainda assim.</strong>`)}
          ${D('GABRIEL','ELE','"quando você ficou me olhando naquela primeira aula... eu achei que você ia falar alguma coisa."',null,'expressão: honesta. rara.')}
          ${D('VOCÊ',null,'"eu achei que você ia fingir que não tinha percebido."',null)}
          ${D('GABRIEL','ELE','"*pausa de três segundos*<br>eu percebi desde o primeiro dia."',null,'expressão: quieta. pesada. do jeito bom.')}
          ${N(`Chuva.<br>
            Você vai lembrar desse momento pelo resto da vida com uma mistura precisa de
            <em>satisfação completa</em> e <em>vergonha retroativa de todos os fluxogramas.</em>`)}
          ${choices('', [
            { ico:'💕', label:'Beija-lo', next:'end_true' },
            { ico:'✈️', label:'Manter dignidade', next:'end_true_alt' },
          ])}
        `));
        // DDLC: cena da chuva — presença latente
        setTimeout(() => {
          if (!gc.querySelector('.cutscene')) return;
          glitchScreen(160);
          _showGhostMsg('c h u v a   n ã o   f o i   c a s u a l .', 8, 29, 3200);
        }, 7500);
        setTimeout(() => {
          if (!gc.querySelector('.choices-grid')) return;
          _corruptNarrationInScene();
        }, 14000);
      },

      end_friend_path() {
        render(card(`
          <div class="scene-label">o desvio · três meses depois</div>
          ${progress(5,5)}
          ${stats()}
          ${N(`Vocês ficaram amigos.<br>
            De verdade — não o tipo de "amigos" que é eufemismo para outra coisa.<br>
            O tipo real, que você não sabia que precisava mas que faz sentido olhando para trás.<br><br>
            Um dia ele te apresentou ao irmão mais velho, <strong>Mateus</strong>,
            que estuda arquitetura e cita Borges <em>em espanhol</em>
            e que te olha de um jeito que não é rude de jeito nenhum.`)}
          ${D('GABRIEL','ELE','"você e o Mateus ficam se olhando de um jeito suspeito."',null,'expressão: satisfação de irmão mais novo')}
          ${D('VOCÊ',null,'"nós não ficamos."','ficamos. ficamos muito.')}
          ${choices('', [
            { ico:'🌸', label:'ir para o final: a amizade que abriu outras portas', next:'end_friend' },
          ])}
        `));
      },

      end_coward_path() {
        render(card(`
          <div class="scene-label">um ano depois · exame final</div>
          ${progress(5,5)}
          ${stats()}
          ${N(`Você nunca falou.<br>
            Ele nunca perguntou.<br>
            No final do ano a turma se dispersou na formatura como fumaça.<br>
            Você e ele tiraram foto juntos na mesma fileira por acidente de logística.<br>
            <strong>Ambos sorrindo. Nenhum dos dois sabendo por quê o outro estava sorrindo.</strong>`)}
          ${N(`Dois anos depois: instagram. Foto dele com alguém.<br>
            Ela usa flanela igual à dele.<br>
            A legenda é uma citação de Nietzsche.<br>
            <strong>Você ensinou ele a gostar de Nietzsche naquele mês que vocês ficaram sentados na mesma fileira.</strong>`)}
          ${D('VOCÊ',null,'...foi eu que ensinei ele a gostar de nietzsche.','isso não é completamente verdade mas é a verdade que você precisa agora então tudo bem')}
          ${choices('', [
            { ico:'😐', label:'ir para o final: o arquivo', next:'end_coward' },
          ])}
        `));
      },

      // ─── FINAIS ───────────────────────────────

      end_true() {
        sfxHeartbeat();
        setTimeout(() => launchConfetti('#ff3fa4', '#c840ff'), 1400);
        render(`<div class="ending-card end-true">
          <div class="ending-header">
            <span class="ending-badge">✨ fim verdadeiro · caminho A</span>
            <span class="ending-deco">♥ ♥ ♥</span>
            <span class="ending-title">O BEIJO DA CHUVA</span>
          </div>
          <div class="ending-text">
            Ele falou primeiro.<br>
            Você falou de volta.<br>
            Não era nenhuma das frases dos fluxogramas. Era melhor.<br><br>
            A chuva passou em algum momento mas nenhum dos dois percebeu exatamente quando.<br>
            O ônibus atrasou quarenta minutos. Vocês usaram cada um deles.<br><br>
            <em>Você vai lembrar disso para sempre. Com ternura. E uma pitada de vergonha dos fluxogramas.</em>
            <span class="nota">
              — nota da autora: sim, esse é o final mais raro. você fez algo muito difícil que é agir.
              eu sei que eu nunca consegui. parabéns de coração. 
            </span>
          </div>
          <div class="ending-score">💕 afeição: ${state.afeicao}/100 · 💪 coragem: ${state.coragem}/100<br>
          ranking: <span class="ranking-s">S — amor selvagem e merecido</span></div>
          <div class="divider">· · · ♥ · · ·</div>
          <button class="restart-btn" onclick="reset()">🔄 jogar de novo</button>
        </div>`);
      },

      end_true_alt() {
        render(`<div class="ending-card end-true">
          <div class="ending-header">
            <span class="ending-badge">💔 final ruim · caminho B</span>
            <span class="ending-deco">✈️ ♥ ✈️</span>
            <span class="ending-title">BONITO DEMAIS PRA DURAR</span>
          </div>
          <div class="ending-text">
            No ponto de ônibus ele disse que estava se mudando na semana seguinte.<br>
            A família, uma oportunidade, a vida sendo exatamente do tamanho que ela quer ser.<br><br>
            Sob a chuva vocês disseram tudo o que deveria ter sido dito antes.<br>
            Sem fluxograma. Sem ensaio. Do jeito que é.<br><br>
            Ele foi. Você ficou.<br>
            Mas você sabe que era real, e saber que algo foi real<br>
            <em>é diferente de nunca ter sabido.</em>
            <span class="nota">
              — algumas histórias existem pra acontecer do jeito que aconteceram. essa é uma delas. faz sentido, de um jeito estranho.
            </span>
          </div>
          <div class="ending-score">💕 afeição: ${state.afeicao}/100<br>ranking: <span class="ranking-a">A — real, portanto suficiente</span></div>
          <div class="divider">· · · ♥ · · ·</div>
          <button class="restart-btn" onclick="reset()">🔄 jogar de novo</button>
        </div>`);
      },

      end_friend() {
        render(`<div class="ending-card end-friend">
          <div class="ending-header">
            <span class="ending-badge">🌸 fim da amizade</span>
            <span class="ending-deco">🤝 🌸 🤝</span>
            <span class="ending-title">O UNIVERSO SABIA MAIS</span>
          </div>
          <div class="ending-text">
            Você e Gabriel ficaram melhores amigos.<br>
            O tipo que você não esperava e que não cabe em nenhuma das categorias que você tinha.<br><br>
            E Mateus te convidou para um café.<br>
            <em>Um café de verdade. Ele especificou a cafeteria e o horário.</em><br>
            Sem ambiguidade. Direto.<br><br>
            E você foi. Porque você já tinha praticado.<br>
            <strong>Com o irmão errado, no momento certo.</strong>
            <span class="nota">
              — este é provavelmente o fim mais saudável disponível neste simulador.
              o gabriel te preparou para o mateus. o universo é eficiente às vezes.
            </span>
          </div>
          <div class="ending-score">💕 afeição: ${state.afeicao}/100<br>ranking: <span class="ranking-b">B+ — redirecionamento com sucesso</span></div>
          <div class="divider">· · · ♥ · · ·</div>
          <button class="restart-btn" onclick="reset()">🔄 jogar de novo</button>
        </div>`);
      },

      end_coward() {
        render(`<div class="ending-card end-coward">
          <div class="ending-header">
            <span class="ending-badge">😶 fim do arquivo</span>
            <span class="ending-deco">📁 · · · 📁</span>
            <span class="ending-title">O QUE FICOU</span>
          </div>
          <div class="ending-text">
            Não aconteceu nada.<br>
            Que é, convenhamos, uma coisa que aconteceu.<br><br>
            Você ainda tem:<br>
            • o bilhete com "oi também."<br>
            • o post-it com o "— G."<br>
            • a foto da formatura onde vocês dois estão sorrindo sem saber por quê<br>
            • <em>oito páginas de fluxograma que nunca foram usadas</em><br><br>
            Uma vez por ano, num dia sem motivo específico,<br>
            você abre o caderno e lê "oi também." com uma voz diferente na cabeça.<br><br>
            <em>É sua história. Você pode guardá-la assim. Não tem problema.</em>
            <span class="nota">
              — válido completo. a vida real está cheia de gabieis não-resolvidos.
              você está em boa companhia. tente de novo, talvez com um pouco mais de coragem.
            </span>
          </div>
          <div class="ending-score">💕 afeição: ${state.afeicao}/100 · 💪 coragem: ${state.coragem}/100<br>ranking: <span class="ranking-c">C — humana. completamente humana.</span></div>
          <div class="divider">· · · ♥ · · ·</div>
          <button class="restart-btn" onclick="reset()">🔄 jogar de novo</button>
        </div>`);
      },

    };

    // ══════════════════════════════════════════════
    //  CONTROLADOR
    // ══════════════════════════════════════════════
    function go(scene) {
      if (!SCENES[scene]) {
        gc.innerHTML = `<div class="card"><div class="narration">cena não encontrada: <strong>${esc(scene)}</strong></div></div>`;
        return;
      }
      sfxTransition();
      const fl = document.getElementById('scene-flash');
      if (fl) { fl.classList.add('on'); setTimeout(() => fl.classList.remove('on'), 200); }
      SCENES[scene]();
    }

    function reset() {
      state = { afeicao: 0, coragem: 0, step: 0 };
      go('intro');
    }

    // início: aguarda o splash ser dispensado — go('intro') chamado por dismissSplash()
