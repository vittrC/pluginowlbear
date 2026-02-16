/**
 * ORDEM PARANORMAL - Artes Paranormais
 * Plugin para Owlbear Rodeo
 */

console.log("🔮 Ordem Paranormal - Artes Paranormais carregado!");

// ============================================
// SISTEMA DE ÁUDIO
// ============================================

let audioMascaras = null;
let audioTranscender = null;

function inicializarAudio() {
  // Sempre criar novas instâncias para evitar cache
  audioMascaras = new Audio('./assets/audio/mascara.mp3?v=' + Date.now());
  audioMascaras.volume = 0.6;
  
  audioTranscender = new Audio('./assets/audio/transcender.mp3?v=' + Date.now());
  audioTranscender.volume = 0.6;
}

// Som para adicionar/remover arte
function tocarSomAdicionar() {
  inicializarAudio();
  if (audioMascaras) {
    audioMascaras.currentTime = 0;
    audioMascaras.play().catch(err => console.warn("⚠️ Erro ao tocar som mascara:", err));
  }
}

// Som para remover arte (usa o mesmo som de máscaras)
function tocarSomRemover() {
  tocarSomAdicionar();
}

// Som ritual para o símbolo principal
function tocarSomSimbolo() {
  inicializarAudio();
  if (audioTranscender) {
    audioTranscender.currentTime = 0;
    audioTranscender.play().catch(err => console.warn("⚠️ Erro ao tocar som:", err));
  }
  console.log("🔊 Som ritual do símbolo");
}

// ============================================
// ESTADO GLOBAL
// ============================================

let estadoArtes = {};
let espacoAtual = null;

// ============================================
// BANCO DE DADOS DE SÍMBOLOS E ARTES
// ============================================

const SIMBOLOS = [
  {
    id: 'insurgencia',
    nome: 'INSURGÊNCIA',
    imagem: 'assets/images/membro-sombrio.webp',
    descricao: 'A rebeldia contra a própria realidade, sem mais correntes.',
    titulo: 'INSURGÊNCIA',
    espacos: [
      { id: 1, label: 'ESPAÇO 1', posicao: 'esquerda' },
      { id: 2, label: 'ESPAÇO 2', posicao: 'direita' }
    ]
  },
  {
    id: 'sinestesia',
    nome: 'SINESTESIA',
    imagem: 'assets/images/sinestesia.webp',
    descricao: 'A capacidade de perceber e manipular os sentidos além dos limites normais da realidade.',
    titulo: 'SINESTESIA',
    espacos: [
      { id: 1, label: 'ESPAÇO 1', posicao: 'topo' },
      { id: 2, label: 'CENTRO', posicao: 'centro' },
      { id: 3, label: 'ESPAÇO 2', posicao: 'baixo' }
    ]
  }
];

const ARTES = [
  {
    id: 'arte-1',
    nome: 'Arte Teste 1',
    descricao: 'Descrição da primeira arte paranormal.',
    imagem: 'assets/images/placeholder.png'
  },
  {
    id: 'arte-2',
    nome: 'Arte Teste 2',
    descricao: 'Descrição da segunda arte paranormal.',
    imagem: 'assets/images/placeholder.png'
  },
  {
    id: 'arte-3',
    nome: 'Arte Teste 3',
    descricao: 'Descrição da terceira arte paranormal.',
    imagem: 'assets/images/placeholder.png'
  },
  {
    id: 'arte-4',
    nome: 'Arte Teste 4',
    descricao: 'Descrição da quarta arte paranormal.',
    imagem: 'assets/images/placeholder.png'
  }
];

const ARTES_BLOQUEADAS = [
  {
    id: 'arte-eclipse',
    nome: 'Eclipse',
    descricao: 'Uma arte sombria que eclipsa a luz da realidade, permitindo manipular as trevas paranormais do terror booo booo fantasmass.',
    imagem: 'assets/images/placeholder.png',
    senha: 'ECLIPSE',
    desbloqueada: false
  }
];

let simboloAtual = SIMBOLOS[0];
let senhaAtual = [];

// ============================================
// SISTEMA DE CRIAÇÃO DE ARTE
// ============================================

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function abrirCriarArte() {
  const modal = document.getElementById('criarArteModal');
  if (!modal) return;
  
  renderizarCirculoSimbolos();
  limparSenha();
  
  modal.classList.add('active');
  modal.addEventListener('click', fecharModalExterno);
}

function renderizarCirculoSimbolos() {
  const circulo = document.getElementById('circuloSimbolos');
  if (!circulo) return;
  
  // Limpar apenas os símbolos, preservando as linhas
  const simbolosExistentes = circulo.querySelectorAll('.simbolo-letra');
  simbolosExistentes.forEach(s => s.remove());
  
  const totalSimbolos = ALFABETO.length;
  const raio = 180;
  
  ALFABETO.forEach((letra, index) => {
    const angulo = (index / totalSimbolos) * 2 * Math.PI - Math.PI / 2;
    const x = raio * Math.cos(angulo);
    const y = raio * Math.sin(angulo);
    
    const simbolo = document.createElement('div');
    simbolo.className = 'simbolo-letra';
    simbolo.textContent = letra;
    simbolo.style.left = `calc(50% + ${x}px)`;
    simbolo.style.top = `calc(50% + ${y}px)`;
    simbolo.onclick = () => adicionarLetra(letra);
    
    circulo.appendChild(simbolo);
  });
}

function adicionarLetra(letra) {
  if (senhaAtual.length >= 20) return;
  
  tocarSomAdicionar();
  senhaAtual.push(letra);
  atualizarTextoSenha();
}

function atualizarTextoSenha() {
  const textoSenha = document.getElementById('textoSenha');
  if (!textoSenha) return;
  
  textoSenha.innerHTML = '';
  
  senhaAtual.forEach(letra => {
    const span = document.createElement('span');
    span.className = 'simbolo-digitado';
    span.textContent = letra;
    textoSenha.appendChild(span);
  });
}

function limparSenha() {
  senhaAtual = [];
  atualizarTextoSenha();
}

function verificarSenha() {
  const senhaDigitada = senhaAtual.join('');
  
  for (let arte of ARTES_BLOQUEADAS) {
    if (senhaDigitada === arte.senha && !arte.desbloqueada) {
      arte.desbloqueada = true;
      ARTES.push(arte);
      
      tocarSomSimbolo();
      fecharModal();
      
      // Mostrar notificação de sucesso
      mostrarNotificacaoArte(`✨ Arte "${arte.nome}" desbloqueada!`);
      
      salvarEstado();
      return;
    } else if (senhaDigitada === arte.senha && arte.desbloqueada) {
      mostrarNotificacaoArte(`⚠️ Arte "${arte.nome}" já foi desbloqueada!`);
      return;
    }
  }
  
  tocarSomRemover();
  mostrarNotificacaoArte('❌ Símbolos incorretos. Tente novamente.');
  limparSenha();
}

function mostrarNotificacaoArte(mensagem) {
  const notif = document.createElement('div');
  notif.textContent = mensagem;
  notif.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #8b0000 0%, #1a0000 100%);
    color: white;
    padding: 30px 50px;
    border: 2px solid #ff0000;
    font-size: 1.2rem;
    font-weight: 600;
    box-shadow: 0 0 40px rgba(255, 0, 0, 0.8);
    z-index: 10001;
    animation: fadeInScale 0.3s ease;
    font-family: 'Hebrew', serif;
    text-align: center;
  `;
  
  document.body.appendChild(notif);
  
  setTimeout(() => {
    notif.style.animation = 'fadeOutScale 0.3s ease';
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

const styleAnimations = document.createElement('style');
styleAnimations.textContent = `
  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.8);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
  
  @keyframes fadeOutScale {
    from {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    to {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.8);
    }
  }
`;
document.head.appendChild(styleAnimations);

// ============================================
// INICIALIZAÇÃO
// ============================================

async function inicializarPlugin() {
  try {
    if (typeof OBR !== 'undefined') {
      await OBR.onReady();
      console.log("✅ Conectado ao Owlbear Rodeo");
      await carregarEstado();
    } else {
      console.log("⚠️ Modo de teste local");
      carregarEstadoLocal();
    }
    
    inicializarEstadoArtes();
    renderizarListaSimbolos();
    renderizarLayoutSimbolo();
    atualizarInterface();
    
    console.log("✅ Plugin inicializado!");
    
  } catch (erro) {
    console.error("❌ Erro ao inicializar:", erro);
  }
}

function inicializarEstadoArtes() {
  estadoArtes = {};
  simboloAtual.espacos.forEach(espaco => {
    estadoArtes[espaco.id] = null;
  });
}

// ============================================
// GERENCIAMENTO DE ESTADO
// ============================================

async function carregarEstado() {
  try {
    if (typeof OBR !== 'undefined' && OBR.player) {
      const metadata = await OBR.player.getMetadata();
      if (metadata['ordem.artes']) {
        Object.assign(estadoArtes, metadata['ordem.artes']);
      }
      if (metadata['ordem.simbolo']) {
        const simboloSalvo = SIMBOLOS.find(s => s.id === metadata['ordem.simbolo']);
        if (simboloSalvo) simboloAtual = simboloSalvo;
      }
    }
  } catch (erro) {
    console.warn("⚠️ Erro ao carregar estado:", erro);
  }
}

function carregarEstadoLocal() {
  try {
    const savedArtes = localStorage.getItem('ordem.artes');
    const savedSimbolo = localStorage.getItem('ordem.simbolo');
    const savedDesbloqueadas = localStorage.getItem('ordem.desbloqueadas');
    
    if (savedArtes) Object.assign(estadoArtes, JSON.parse(savedArtes));
    if (savedSimbolo) {
      const simboloSalvo = SIMBOLOS.find(s => s.id === savedSimbolo);
      if (simboloSalvo) simboloAtual = simboloSalvo;
    }
    if (savedDesbloqueadas) {
      const desbloqueadas = JSON.parse(savedDesbloqueadas);
      ARTES_BLOQUEADAS.forEach(arte => {
        if (desbloqueadas.includes(arte.id)) {
          arte.desbloqueada = true;
          if (!ARTES.find(a => a.id === arte.id)) {
            ARTES.push(arte);
          }
        }
      });
    }
  } catch (erro) {
    console.warn("⚠️ Erro ao carregar estado local:", erro);
  }
}

async function salvarEstado() {
  try {
    const artesDesbloqueadas = ARTES_BLOQUEADAS
      .filter(a => a.desbloqueada)
      .map(a => a.id);
    
    if (typeof OBR !== 'undefined' && OBR.player) {
      await OBR.player.setMetadata({
        'ordem.artes': estadoArtes,
        'ordem.simbolo': simboloAtual.id,
        'ordem.desbloqueadas': artesDesbloqueadas
      });
      console.log("💾 Estado salvo no Owlbear!");
    } else {
      localStorage.setItem('ordem.artes', JSON.stringify(estadoArtes));
      localStorage.setItem('ordem.simbolo', simboloAtual.id);
      localStorage.setItem('ordem.desbloqueadas', JSON.stringify(artesDesbloqueadas));
      console.log("💾 Estado salvo localmente!");
    }
  } catch (erro) {
    console.warn("⚠️ Erro ao salvar estado:", erro);
  }
}

// ============================================
// RENDERIZAÇÃO DE LAYOUT
// ============================================

function renderizarLayoutSimbolo() {
  const section = document.getElementById('symbolSection');
  if (!section) return;
  
  const espacos = simboloAtual.espacos;
  
  if (espacos.length === 2) {
    // Layout horizontal (Insurgência)
    section.innerHTML = `
      <div class="espaco-lateral espaco-1">
        <div class="espaco-label">${espacos[0].label}</div>
        <div class="espaco-circle" id="espaco${espacos[0].id}" onclick="abrirMenuArte(${espacos[0].id})">
          <img src="" alt="" class="espaco-image" id="espaco${espacos[0].id}Img" style="display: none;" />
        </div>
      </div>

      <div class="symbol-container" onclick="tocarSomSimbolo()">
        <img 
          src="${simboloAtual.imagem}" 
          alt="Símbolo da Ordem" 
          class="symbol-image"
          id="mainSymbol"
        />
      </div>

      <div class="espaco-lateral espaco-2">
        <div class="espaco-label">${espacos[1].label}</div>
        <div class="espaco-circle" id="espaco${espacos[1].id}" onclick="abrirMenuArte(${espacos[1].id})">
          <img src="" alt="" class="espaco-image" id="espaco${espacos[1].id}Img" style="display: none;" />
        </div>
      </div>
    `;
  } else if (espacos.length === 3) {
    // Layout vertical (Sinestesia)
    section.innerHTML = `
      <div class="layout-sinestesia">
        <div class="symbol-container-wrapper">
          <div class="symbol-container" onclick="tocarSomSimbolo()">
            <img 
              src="${simboloAtual.imagem}" 
              alt="Símbolo da Ordem" 
              class="symbol-image"
              id="mainSymbol"
            />
            
            <!-- Espaço 1 - Topo -->
            <div class="espaco-absolute espaco-topo-abs">
              <div class="espaco-label">${espacos[0].label}</div>
              <div class="espaco-circle" id="espaco${espacos[0].id}" onclick="event.stopPropagation(); abrirMenuArte(${espacos[0].id})">
                <img src="" alt="" class="espaco-image" id="espaco${espacos[0].id}Img" style="display: none;" />
              </div>
            </div>
            
            <!-- Centro -->
            <div class="espaco-centro-overlay">
              <div class="espaco-circle espaco-centro" id="espaco${espacos[1].id}" onclick="event.stopPropagation(); abrirMenuArte(${espacos[1].id})">
                <img src="" alt="" class="espaco-image" id="espaco${espacos[1].id}Img" style="display: none;" />
              </div>
            </div>
            
            <!-- Espaço 2 - Baixo -->
            <div class="espaco-absolute espaco-baixo-abs">
              <div class="espaco-circle" id="espaco${espacos[2].id}" onclick="event.stopPropagation(); abrirMenuArte(${espacos[2].id})">
                <img src="" alt="" class="espaco-image" id="espaco${espacos[2].id}Img" style="display: none;" />
              </div>
              <div class="espaco-label">${espacos[2].label}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// ============================================
// INTERFACE - ATUALIZAÇÃO
// ============================================

function atualizarInterface() {
  // Atualiza símbolo principal
  const mainSymbol = document.getElementById('mainSymbol');
  if (mainSymbol) {
    mainSymbol.src = simboloAtual.imagem;
  }
  
  // Atualiza espaços dinamicamente
  simboloAtual.espacos.forEach(espaco => {
    const arte = estadoArtes[espaco.id];
    const espacoImg = document.getElementById(`espaco${espaco.id}Img`);
    
    if (arte && espacoImg) {
      espacoImg.src = arte.imagem;
      espacoImg.style.display = 'block';
    } else if (espacoImg) {
      espacoImg.style.display = 'none';
    }
  });
  
  // Atualiza grid de artes equipadas
  atualizarGridArtes();
}

function atualizarGridArtes() {
  const artesGrid = document.getElementById('artesGrid');
  if (!artesGrid) return;
  
  artesGrid.innerHTML = '';
  
  simboloAtual.espacos.forEach(espaco => {
    const arte = estadoArtes[espaco.id];
    
    const arteSlot = document.createElement('div');
    arteSlot.className = 'arte-slot';
    arteSlot.id = `arteSlot${espaco.id}`;
    
    if (arte) {
      arteSlot.innerHTML = `<img src="${arte.imagem}" alt="${arte.nome}" class="arte-icon" />`;
    }
    
    const arteInfo = document.createElement('div');
    arteInfo.className = 'arte-info';
    arteInfo.id = `arteInfo${espaco.id}`;
    
    if (arte) {
      arteInfo.innerHTML = `
        <div class="arte-nome">${espaco.label}: ${arte.nome}</div>
        <div class="arte-descricao">${arte.descricao}</div>
      `;
    } else {
      arteInfo.innerHTML = `<div class="arte-nome">${espaco.label}: VAZIO</div>`;
    }
    
    artesGrid.appendChild(arteSlot);
    artesGrid.appendChild(arteInfo);
  });
}

// ============================================
// MODAIS
// ============================================

function abrirMenuSimbolos() {
  const modal = document.getElementById('symbolListModal');
  if (modal) {
    modal.classList.add('active');
    modal.addEventListener('click', fecharModalExterno);
  }
}

function abrirDescricaoSimbolo() {
  fecharModal();
  const modal = document.getElementById('arteModal');
  const modalSymbol = modal.querySelector('.modal-symbol-img');
  const modalSubtitle = document.getElementById('modalSubtitle');
  const modalDescription = document.getElementById('modalDescription');
  
  if (modalSymbol) modalSymbol.src = simboloAtual.imagem;
  if (modalSubtitle) modalSubtitle.textContent = simboloAtual.titulo;
  if (modalDescription) {
    modalDescription.innerHTML = `<p>${simboloAtual.descricao}</p>`;
  }
  
  if (modal) {
    modal.classList.add('active');
    modal.addEventListener('click', fecharModalExterno);
  }
}

function abrirMenuArte(espaco) {
  espacoAtual = espaco;
  
  // Criar modal temporário para seleção de arte
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.id = 'arteSelectionModal';
  
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <button class="btn-modal-tab active">SELECIONAR ARTE - ESPAÇO ${espaco}</button>
      </div>
      <div class="modal-body">
        <div class="symbol-list">
          ${ARTES.map(arte => `
            <button class="symbol-list-item" onclick="selecionarArte('${arte.id}')">
              ${arte.nome}
            </button>
          `).join('')}
          ${estadoArtes[espaco] ? `
            <button class="symbol-list-item" onclick="removerArte()" style="color: #ff0000; border-color: #ff0000;">
              REMOVER ARTE
            </button>
          ` : ''}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-modal-close" onclick="fecharModal()">FECHAR</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.addEventListener('click', fecharModalExterno);
}

function voltarDescricao() {
  fecharModal();
  abrirDescricaoSimbolo();
}

function fecharModal() {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.classList.remove('active');
    modal.removeEventListener('click', fecharModalExterno);
    if (modal.id === 'arteSelectionModal') {
      modal.remove();
    }
  });
}

function fecharModalExterno(e) {
  if (e.target.classList.contains('modal')) {
    fecharModal();
  }
}

// ============================================
// AÇÕES
// ============================================

function renderizarListaSimbolos() {
  const symbolList = document.getElementById('symbolList');
  if (!symbolList) return;
  
  symbolList.innerHTML = SIMBOLOS.map(simbolo => `
    <button class="symbol-list-item" onclick="selecionarSimbolo('${simbolo.id}')">
      ${simbolo.nome}
    </button>
  `).join('');
}

function selecionarSimbolo(simboloId) {
  const simbolo = SIMBOLOS.find(s => s.id === simboloId);
  if (!simbolo) return;
  
  simboloAtual = simbolo;
  inicializarEstadoArtes();
  renderizarLayoutSimbolo();
  salvarEstado();
  atualizarInterface();
  fecharModal();
  
  console.log(`✅ Símbolo alterado para: ${simbolo.nome}`);
}

function selecionarArte(arteId) {
  if (espacoAtual === null) return;
  
  const arte = ARTES.find(a => a.id === arteId);
  if (!arte) return;
  
  tocarSomAdicionar();
  estadoArtes[espacoAtual] = arte;
  salvarEstado();
  atualizarInterface();
  fecharModal();
  
  console.log(`✅ Arte ${arte.nome} adicionada ao Espaço ${espacoAtual}`);
}

function removerArte() {
  if (espacoAtual === null) return;
  
  tocarSomRemover();
  estadoArtes[espacoAtual] = null;
  salvarEstado();
  atualizarInterface();
  fecharModal();
  
  console.log(`✅ Arte removida do Espaço ${espacoAtual}`);
}

// ============================================
// INICIALIZAÇÃO
// ============================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarPlugin);
} else {
  inicializarPlugin();
}
