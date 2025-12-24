/**
 * Hacks Rápidos - Cyberpunk RED
 * Sistema completo de gerenciamento de hacks
 */

// ============================================
// MAPEAMENTO DE TIPOS DE HACKS
// ============================================

const HACK_TYPES = {
  quickhacking: { icon: "⚡", nome: "Quickhacking", color: "#00d946" },
  intrusion: { icon: "🔓", nome: "Infiltração", color: "#e91e8c" },
  stealth: { icon: "🥷", nome: "Furtividade", color: "#64c8ff" },
  combat: { icon: "⚔️", nome: "Combate", color: "#ff3d5c" },
  control: { icon: "🎮", nome: "Controle", color: "#ffb800" },
  utility: { icon: "🔧", nome: "Utilitário", color: "#64ffc8" },
  reconnaissance: { icon: "🔍", nome: "Reconhecimento", color: "#c896ff" },
  damage: { icon: "💥", nome: "Dano", color: "#ff6432" }
};

const STORAGE_KEY = "cyberpunk_hacks_rapidos";
const RAM_STORAGE_KEY = "cyberpunk_player_ram";
const CODEBREAKER_STORAGE_KEY = "cyberpunk_codebreaker";
let MAX_RAM = 25;
let USER_ID = null;
let PLUGIN_READY = false;  // Flag para indicar que o plugin está pronto
let draggedIndex = null;  // Variável para rastrear o hack sendo arrastado

function obterChaveUsuario(chave) {
  // Se USER_ID não está definido, usar chave simples
  // Isso garante que localStorage funcione mesmo sem USER_ID
  if (!USER_ID) {
    console.warn("⚠️ USER_ID não definido, usando chave simples:", chave);
    return chave;
  }
  return `${USER_ID}_${chave}`;
}

// ============================================
// INICIALIZAÇÃO - Aguardar OBR pronto
// ============================================

async function iniciarPluginCompleto() {
  try {
    console.log("🚀 Iniciando plugin completo...");
    
    // Obter ID único do usuário
    const party = await OBR.party.getParty();
    USER_ID = party.playerId;
    console.log("✓ Usuário conectado:", USER_ID);
    
    // Carregar e renderizar tudo
    console.log("📋 Carregando dados do usuário...");
    await renderizarHacks();
    await renderizarRAM();
    
    // Configurar interface
    console.log("🎨 Configurando interface...");
    configurarInterface();
    
    // Renderizar dados iniciais
    renderizarMercado();
    renderizarHacksDesbloqueados();
    
    // Abrir aba padrão
    abrirAba("cyberdeck");
    
    // Marcar plugin como pronto
    PLUGIN_READY = true;
    console.log("✓ Plugin iniciado com sucesso!");
  } catch (error) {
    console.error("❌ Erro crítico ao iniciar plugin:", error);
    console.error("Stack:", error.stack);
  }
}

function configurarInterface() {
  // Configurar formulário
  const form = document.getElementById("hackForm");
  if (form) {
    form.addEventListener("submit", adicionarHack);
    console.log("✓ Formulário configurado");
  } else {
    console.warn("⚠️ Formulário não encontrado");
  }

  // Configurar abas
  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      abrirAba(tabId);
    });
  });
  console.log("✓ Abas configuradas:", tabButtons.length);

  // Configurar busca
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      renderizarMercado(e.target.value);
    });
    console.log("✓ Busca configurada");
  }
}

// Registrar callback quando OBR estiver pronto - ESPERAR DOM estar pronto
function registrarCallback() {
  if (typeof OBR !== 'undefined' && OBR.onReady) {
    console.log("📋 OBR SDK disponível - registrando callback...");
    OBR.onReady(iniciarPluginCompleto);
  } else {
    console.warn("⚠️ OBR SDK não disponível - ativando modo de demonstração");
    // Modo fallback para testes sem OBR (GitHub Pages)
    iniciarPluginFallback();
  }
}

// Função de inicialização para modo fallback (sem OBR)
async function iniciarPluginFallback() {
  try {
    console.log("🚀 Iniciando em modo FALLBACK (sem OBR)...");
    
    // Usar ID consistente baseado na sessão do navegador (sessionStorage isola por janela/conta)
    const FALLBACK_USER_KEY = "owlbear_demo_user_id";
    let demoUserId = sessionStorage.getItem(FALLBACK_USER_KEY);
    
    if (!demoUserId) {
      demoUserId = "demo_" + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem(FALLBACK_USER_KEY, demoUserId);
      console.log("🆕 Novo usuário demo criado (sessionStorage):", demoUserId);
    } else {
      console.log("♻️ Usuário demo existente (sessionStorage):", demoUserId);
    }
    
    USER_ID = demoUserId;
    console.log("✓ Usuário demo:", USER_ID);
    
    // Usar localStorage em vez de OBR.storage
    console.log("📋 Carregando dados de demonstração...");
    await renderizarHacks();
    await renderizarRAM();
    
    // Configurar interface
    console.log("🎨 Configurando interface...");
    configurarInterface();
    
    // Renderizar dados iniciais
    renderizarMercado();
    await renderizarHacksDesbloqueados();
    
    // Abrir aba padrão
    abrirAba("cyberdeck");
    
    // Marcar plugin como pronto
    PLUGIN_READY = true;
    console.log("✓ Plugin em modo FALLBACK iniciado com sucesso!");
    console.log("💡 Este é o modo de demonstração. Para uso completo, abra em Owlbear Rodeo.");
  } catch (error) {
    console.error("❌ Erro ao iniciar modo fallback:", error);
    console.error("Stack:", error.stack);
  }
}

// Aguardar DOM estar pronto antes de registrar callback
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', registrarCallback);
} else {
  // DOM já está pronto
  registrarCallback();
}

// ============================================
// SISTEMA DE HACKS (Banco de Dados)
// ============================================

const HACKS_ESPECIAIS = [
  {
    id: "special_moonblessing",
    nome: "Hack Rápido - Benção da Lua",
    custoRAM: 4,
    dv: 15,
    tipo: "utility",
    descricao: "Uma vez por dia você pode ter visão da lua para te auxiliar a encontrar lugares, objetos.. etc. lhe dando +10 no próximo teste das perícias de Atenção.",
    categoria: "Visão Especial",
    codigo: "bençãodalua0"
  },
  {
    id: "special_phantom",
    nome: "Hack Rápido - Corrente Fantasma",
    custoRAM: 5,
    dv: 14,
    tipo: "stealth",
    descricao: "Você apaga temporariamente sua assinatura digital do campo. Nenhum efeito pode rastrear o netrunner e contra-hacks contra você falham automaticamente. Dura até o fim da cena ou até você executar outro hack. Falha: RAM é gasta normalmente e você é marcado.",
    categoria: "Ofuscação",
    codigo: "fantasma4040"
  },
  {
    id: "special_redqueen",
    nome: "Hack Rápido - Protocolo Redqueen",
    custoRAM: 7,
    dv: 16,
    tipo: "damage",
    descricao: "Uma explosão de ruído eletromagnético digital se espalha. Todos em um raio curto sofrem -4 em todos os testes, perdem -6 de RAM atual e aparelhos sofrem interferência. Dura 1d6 turnos.",
    categoria: "Área de Efeito",
    codigo: "redqueen1122"
  }
];

// ============================================
// SISTEMA DE HACKS (Banco de Dados)
// ============================================

const HACKS_SISTEMA = [
  {
    id: "sys_quickhack_1",
    nome: "Hack Rápido - Shut Down",
    custoRAM: 4,
    dv: 12,
    tipo: "combat",
    descricao: "Força o alvo a desligar todos os sistemas por 1 rodada. O alvo não pode agir durante este tempo.",
    categoria: "Desativação"
  },
  {
    id: "sys_quickhack_2",
    nome: "Hack Rápido - Distrair Inimigos",
    custoRAM: 3,
    dv: 10,
    tipo: "control",
    descricao: "Cria ruído nos sensores do alvo, aplicando -2 de REF na próxima ação. Efeito dura 1 rodada.",
    categoria: "Perturbação"
  },
  {
    id: "sys_quickhack_3",
    nome: "Hack Rápido - Protocolo de Invasão",
    custoRAM: 5,
    dv: 14,
    tipo: "intrusion",
    descricao: "Abre acesso avançado ao sistema neural do alvo, permitindo um segundo hacking na próxima rodada sem custo de RAM.",
    categoria: "Infiltração"
  },
  {
    id: "sys_zap",
    nome: "Hack Rápido - Zap",
    custoRAM: 3,
    dv: 13,
    tipo: "damage",
    descricao: "Causa 1d8 de dano cerebral e remove ações no próximo turno.",
    categoria: "Dano Cerebral"
  },
  {
    id: "sys_ping",
    nome: "Hack Rápido - Ping",
    custoRAM: 1,
    dv: 10,
    tipo: "reconnaissance",
    descricao: "Revela todos os dispositivos conectados na rede local.",
    categoria: "Reconhecimento"
  },
  {
    id: "sys_overheat",
    nome: "Hack Rápido - Overheat",
    custoRAM: 6,
    dv: 15,
    tipo: "damage",
    descricao: "Deixa o alvo queimando por 2d4 rodadas, pode espalhar o efeito para alvos próximos.",
    categoria: "Dano Contínuo"
  },
  {
    id: "sys_crash",
    nome: "Hack Rápido - Crash",
    custoRAM: 2,
    dv: 12,
    tipo: "combat",
    descricao: "Derruba um drone ou veículo remoto.",
    categoria: "Desativação"
  },
  {
    id: "sys_spike",
    nome: "Hack Rápido - Spike",
    custoRAM: 4,
    dv: 14,
    tipo: "control",
    descricao: "Toma controle de um sistema ou câmera por 2 turnos.",
    categoria: "Controle"
  },
  {
    id: "sys_eyeburn",
    nome: "Hack Rápido - Eye Burn",
    custoRAM: 5,
    dv: 14,
    tipo: "stealth",
    descricao: "Causa ofuscamento temporário. Alvo sofre -6 em ataques à distância por 1 turno.",
    categoria: "Incapacidade"
  },
  {
    id: "sys_flicker",
    nome: "Hack Rápido - Flicker",
    custoRAM: 3,
    dv: 14,
    tipo: "stealth",
    descricao: "Alvo perde o próximo movimento.",
    categoria: "Incapacidade"
  }
];

// ============================================
// STORAGE - Gerenciar dados com Owlbear Rodeo
// ============================================

async function salvarHacksLocal(hacks) {
  try {
    const chave = obterChaveUsuario(STORAGE_KEY);
    console.log("💾 Salvando hacks com chave:", chave);
    
    // SEMPRE tentar salvar em localStorage como método primário
    try {
      console.log("💾 Salvando em localStorage");
      localStorage.setItem(chave, JSON.stringify(hacks));
      
      // Verificar se foi realmente salvo
      const verificacao = localStorage.getItem(chave);
      if (verificacao) {
        console.log("✅ localStorage confirmado - dados salvos com sucesso");
      } else {
        console.error("❌ localStorage falhou - dados NÃO foram salvos");
      }
    } catch (storageError) {
      console.error("❌ Erro ao salvar em localStorage:", storageError);
    }
    
    // TAMBÉM tentar salvar em OBR.storage se disponível (para sincronizar entre clientes)
    if (typeof OBR !== 'undefined' && OBR.storage && OBR.storage.setItems) {
      try {
        console.log("📡 Também salvando em OBR.storage");
        await OBR.storage.setItems([{
          key: chave,
          value: JSON.stringify(hacks)
        }]);
        console.log("📡 OBR.storage sincronizado");
      } catch (obrError) {
        console.warn("⚠️ OBR.storage não disponível (isto é normal):", obrError);
      }
    }
    
    console.log("✓ Hacks salvos com sucesso:", hacks.length, "hacks");
    return true;
  } catch (error) {
    console.error("❌ Erro crítico ao salvar hacks:", error);
    return false;
  }
}

async function carregarHacksLocal() {
  try {
    const chave = obterChaveUsuario(STORAGE_KEY);
    let hacksData = null;
    
    // Tentar carregar de localStorage PRIMEIRO (é o mais confiável)
    try {
      console.log("💾 Carregando de localStorage");
      hacksData = localStorage.getItem(chave);
      if (hacksData) {
        console.log("✓ Dados carregados via localStorage");
      }
    } catch (storageError) {
      console.warn("⚠️ localStorage não disponível:", storageError);
    }
    
    // Se localStorage não tinha dados, tentar OBR.storage
    if (!hacksData && typeof OBR !== 'undefined' && OBR.storage && OBR.storage.getItems) {
      try {
        console.log("📡 Carregando de OBR.storage");
        const dados = await OBR.storage.getItems([chave]);
        hacksData = dados.length > 0 ? dados[0].value : null;
        if (hacksData) {
          console.log("✓ Dados carregados via OBR.storage");
        }
      } catch (obrError) {
        console.warn("⚠️ OBR.storage não disponível:", obrError);
      }
    }
    
    const hacks = hacksData ? JSON.parse(hacksData) : [];
    console.log("✓ Hacks carregados:", hacks.length, "hacks");
    return Array.isArray(hacks) ? hacks : [];
  } catch (error) {
    console.error("❌ Erro ao carregar hacks:", error);
    return [];
  }
}

// ============================================
// SISTEMA DE RAM DO JOGADOR
// ============================================

async function salvarRAMLocal(ramAtual, ramMaximo = MAX_RAM) {
  try {
    const chave = obterChaveUsuario(RAM_STORAGE_KEY);
    console.log("💾 Salvando RAM com chave:", chave, "valor:", ramAtual, "/", ramMaximo);
    
    // SEMPRE tentar salvar em localStorage como método primário
    try {
      console.log("💾 Salvando RAM em localStorage");
      localStorage.setItem(chave, JSON.stringify({ ram: ramAtual, max: ramMaximo }));
      
      const verificacao = localStorage.getItem(chave);
      if (verificacao) {
        console.log("✅ localStorage confirmado - RAM salvo com sucesso");
      } else {
        console.error("❌ localStorage falhou - RAM NÃO foi salvo");
      }
    } catch (storageError) {
      console.error("❌ Erro ao salvar RAM em localStorage:", storageError);
    }
    
    // TAMBÉM tentar salvar em OBR.storage se disponível
    if (typeof OBR !== 'undefined' && OBR.storage && OBR.storage.setItems) {
      try {
        console.log("📡 Também salvando RAM em OBR.storage");
        await OBR.storage.setItems([{
          key: chave,
          value: JSON.stringify({ ram: ramAtual, max: ramMaximo })
        }]);
        console.log("📡 OBR.storage RAM sincronizado");
      } catch (obrError) {
        console.warn("⚠️ OBR.storage RAM não disponível (isto é normal):", obrError);
      }
    }
    
    console.log("✓ RAM salvo:", ramAtual, "/", ramMaximo);
    return true;
  } catch (error) {
    console.error("❌ Erro ao salvar RAM:", error);
    return false;
  }
}

async function carregarRAMLocal() {
  try {
    const chave = obterChaveUsuario(RAM_STORAGE_KEY);
    let ramData = null;
    
    // Tentar carregar de localStorage PRIMEIRO
    try {
      console.log("💾 Carregando RAM de localStorage");
      const stored = localStorage.getItem(chave);
      if (stored) {
        ramData = JSON.parse(stored);
        console.log("✓ RAM carregado via localStorage");
      }
    } catch (storageError) {
      console.warn("⚠️ localStorage não disponível:", storageError);
    }
    
    // Se localStorage não tinha dados, tentar OBR.storage
    if (!ramData && typeof OBR !== 'undefined' && OBR.storage && OBR.storage.getItems) {
      try {
        console.log("📡 Carregando RAM de OBR.storage");
        const dados = await OBR.storage.getItems([chave]);
        if (dados.length > 0) {
          ramData = JSON.parse(dados[0].value);
          console.log("✓ RAM carregado via OBR.storage");
        }
      } catch (obrError) {
        console.warn("⚠️ OBR.storage não disponível:", obrError);
      }
    }
    
    // Usar valores padrão se nada foi encontrado
    ramData = ramData || { ram: 0, max: 25 };
    
    // Atualizar MAX_RAM global
    MAX_RAM = Math.max(1, Math.min(ramData.max, 100));
    
    const ramAtual = Math.max(0, Math.min(ramData.ram, MAX_RAM));
    console.log("✓ RAM carregado:", ramAtual, "/", MAX_RAM);
    return { ram: ramAtual, max: MAX_RAM };
  } catch (error) {
    console.error("❌ Erro ao carregar RAM:", error);
    return { ram: 0, max: 25 };
  }
}

function definirMaxRAM(novoMax) {
  console.log("🎯 definirMaxRAM chamado com:", novoMax, "PLUGIN_READY:", PLUGIN_READY);
  
  if (!PLUGIN_READY) {
    console.warn("⚠️ Plugin ainda não está pronto");
    return;
  }
  if (!USER_ID) {
    console.warn("⚠️ USER_ID não definido");
    alert("⚠️ Plugin ainda está conectando ao Owlbear Rodeo...");
    return;
  }
  novoMax = Math.max(1, Math.min(parseInt(novoMax) || 25, 100));
  MAX_RAM = novoMax;
  console.log("📝 Novo MAX_RAM:", novoMax);
  
  // Garantir que RAM atual não exceda o novo máximo
  carregarRAMLocal().then(ramData => {
    let ramAtual = Math.min(ramData.ram, novoMax);
    console.log("💾 Salvando RAM:", ramAtual, "/", novoMax);
    salvarRAMLocal(ramAtual, novoMax).then(() => {
      renderizarRAM();
      console.log("✓ MAX_RAM definido para:", novoMax);
    });
  });
}

function aumentarRAM() {
  console.log("🎯 aumentarRAM chamado, PLUGIN_READY:", PLUGIN_READY);
  
  if (!PLUGIN_READY) {
    console.warn("⚠️ Plugin ainda não está pronto");
    return;
  }
  if (!USER_ID) {
    console.warn("⚠️ USER_ID não definido");
    alert("⚠️ Plugin ainda está conectando ao Owlbear Rodeo...");
    return;
  }
  carregarRAMLocal().then(ramData => {
    if (ramData.ram < MAX_RAM) {
      ramData.ram++;
      console.log("📝 Aumentando RAM para:", ramData.ram);
      salvarRAMLocal(ramData.ram, MAX_RAM).then(() => {
        renderizarRAM();
      });
    }
  });
}

function diminuirRAM() {
  console.log("🎯 diminuirRAM chamado, PLUGIN_READY:", PLUGIN_READY);
  
  if (!PLUGIN_READY) {
    console.warn("⚠️ Plugin ainda não está pronto");
    return;
  }
  if (!USER_ID) {
    alert("⚠️ Plugin ainda está conectando ao Owlbear Rodeo...");
    return;
  }
  carregarRAMLocal().then(ramData => {
    if (ramData.ram > 0) {
      ramData.ram--;
      salvarRAMLocal(ramData.ram, MAX_RAM).then(() => {
        renderizarRAM();
      });
    }
  });
}

function resetarRAM() {
  if (!PLUGIN_READY) {
    console.warn("⚠️ Plugin ainda não está pronto");
    return;
  }
  if (!USER_ID) {
    alert("⚠️ Plugin ainda está conectando ao Owlbear Rodeo...");
    return;
  }
  salvarRAMLocal(MAX_RAM, MAX_RAM).then(() => {
    renderizarRAM();
  });
}

async function renderizarRAM() {
  const ramData = await carregarRAMLocal();
  const ramAtual = ramData.ram;
  const ramMax = ramData.max;
  const container = document.getElementById("ramDisplay");
  
  if (!container) {
    console.warn("⚠️ Elemento ramDisplay não encontrado");
    return;
  }

  // Atualizar contador
  const ramValue = document.getElementById("ramValue");
  if (ramValue) {
    ramValue.textContent = ramAtual;
  }

  const ramMaxDisplay = document.getElementById("ramMax");
  if (ramMaxDisplay) {
    ramMaxDisplay.textContent = ramMax;
  }

  // Atualizar input de máximo
  const ramInput = document.getElementById("ramMaxInput");
  if (ramInput) {
    ramInput.value = ramMax;
  }

  // Atualizar visualizador de blocos
  const ramBlocks = document.getElementById("ramBlocks");
  if (ramBlocks) {
    ramBlocks.innerHTML = "";
    
    for (let i = 0; i < ramMax; i++) {
      const bloco = document.createElement("div");
      bloco.className = "ram-block";
      
      if (i < ramAtual) {
        bloco.classList.add("ram-active");
      }
      
      ramBlocks.appendChild(bloco);
    }
  }

  console.log("✓ RAM visualizado:", ramAtual, "/", ramMax);
}

// ============================================
// UI - ABAS
// ============================================

function abrirAba(abaId) {
  // Remover aba ativa de todos os painéis e botões
  document.querySelectorAll(".tab-panel").forEach(panel => {
    panel.classList.remove("tab-panel-active");
  });
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.remove("tab-btn-active");
  });

  // Ativar aba selecionada
  const painel = document.getElementById(`tab-${abaId}`);
  const botao = document.querySelector(`[data-tab="${abaId}"]`);

  if (painel) painel.classList.add("tab-panel-active");
  if (botao) botao.classList.add("tab-btn-active");

  console.log(`✓ Aba aberta: ${abaId}`);
}

// ============================================
// UI - Renderizar Mercado de Hacks
// ============================================

function renderizarMercado(filtro = "") {
  const container = document.getElementById("marketList");
  
  if (!container) {
    console.error("❌ Elemento marketList não encontrado no DOM");
    return;
  }

  console.log("📊 Renderizando mercado com filtro:", filtro);

  container.innerHTML = "";

  let hacksExibidos = HACKS_SISTEMA;

  // Aplicar filtro de busca
  if (filtro.trim()) {
    const filtroLower = filtro.toLowerCase();
    hacksExibidos = HACKS_SISTEMA.filter(hack =>
      hack.nome.toLowerCase().includes(filtroLower) ||
      hack.descricao.toLowerCase().includes(filtroLower) ||
      hack.categoria.toLowerCase().includes(filtroLower)
    );
    console.log("🔍 Hacks encontrados após filtro:", hacksExibidos.length);
  } else {
    console.log("📊 Exibindo todos os hacks:", hacksExibidos.length);
  }

  // Se nenhum hack encontrado
  if (hacksExibidos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">❌</div>
        <p>Nenhum hack encontrado</p>
        <small>Tente refinar sua busca</small>
      </div>
    `;
    return;
  }

  // Renderizar hacks do sistema
  hacksExibidos.forEach((hack) => {
    const hackElement = document.createElement("div");
    hackElement.className = "hack-item hack-item-market";
    hackElement.innerHTML = `
      <div class="hack-header">
        <div class="hack-info">
          <h4 class="hack-name">${sanitizar(hack.nome)}</h4>
          <div class="hack-meta">
            <span class="hack-stat">
              <span class="stat-label">RAM:</span>
              <span class="stat-value">${hack.custoRAM}</span>
            </span>
            <span class="hack-stat">
              <span class="stat-label">DV:</span>
              <span class="stat-value">${hack.dv}</span>
              <button class="btn btn-use-hack" onclick="usarHack('${hack.id}')" title="Usar este hack (desconta RAM)">
                ⚡
              </button>
            </span>
            <span class="hack-category">${sanitizar(hack.categoria)}</span>
          </div>
        </div>
        <button class="btn btn-install" onclick="importarHack('${hack.id}')" title="Adicionar ao Cyberdeck">
          <span>+</span>
        </button>
      </div>
      ${
        hack.descricao
          ? `<p class="hack-desc">${sanitizar(hack.descricao)}</p>`
          : ""
      }
    `;
    container.appendChild(hackElement);
  });
  
  console.log("✓ Mercado renderizado com", hacksExibidos.length, "hacks");
}

// ============================================
// UI - Renderizar lista de hacks
// ============================================

async function renderizarHacks() {
  const hacks = await carregarHacksLocal();
  const container = document.getElementById("hackList");
  const emptyState = document.getElementById("emptyState");
  const counter = document.getElementById("hackCount");

  if (!container || !emptyState) {
    console.error("❌ Elementos do DOM não encontrados");
    return;
  }

  // Limpar lista
  container.innerHTML = "";

  // Atualizar contador
  if (counter) {
    counter.textContent = hacks.length;
  }

  // Mostrar estado vazio
  if (hacks.length === 0) {
    emptyState.style.display = "flex";
    return;
  }

  emptyState.style.display = "none";

  // Renderizar cada hack
  hacks.forEach((hack, index) => {
    const hackElement = document.createElement("div");
    const isEspecial = hack.origem === "especial";
    const tipoInfo = HACK_TYPES[hack.tipo] || HACK_TYPES.quickhacking;
    
    hackElement.className = `hack-item ${isEspecial ? "hack-special" : ""}`;
    hackElement.draggable = true;
    hackElement.setAttribute("data-hack-index", index);
    
    const badgeHTML = hack.tipo ? `<span class="hack-badge hack-badge-${hack.tipo}">${tipoInfo.icon} ${tipoInfo.nome}</span>` : "";
    
    hackElement.innerHTML = `
      <div class="hack-header">
        <div class="hack-info">
          <h4 class="hack-name">${isEspecial ? "🔓 " : ""}${sanitizar(hack.nome)}</h4>
          <div class="hack-meta">
            ${badgeHTML}
            <span class="hack-stat">
              <span class="stat-label">RAM:</span>
              <span class="stat-value">${hack.custoRAM}</span>
            </span>
            <span class="hack-stat">
              <span class="stat-label">DV:</span>
              <span class="stat-value">${hack.dv}</span>
              <button class="btn btn-use-hack" onclick="usarHackCyberdeck(${hack.custoRAM}, '${sanitizar(hack.nome)}')" title="Usar este hack (desconta RAM)">
                ⚡
              </button>
            </span>
          </div>
        </div>
        <button class="btn btn-delete" onclick="excluirHack(${index})" title="Excluir hack">
          <span>✕</span>
        </button>
      </div>
      ${
        hack.descricao
          ? `<p class="hack-desc">${sanitizar(hack.descricao)}</p>`
          : ""
      }
    `;
    
    // Adicionar event listeners para drag-and-drop
    hackElement.addEventListener("dragstart", (e) => {
      draggedIndex = index;
      hackElement.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });
    
    hackElement.addEventListener("dragend", (e) => {
      hackElement.classList.remove("dragging");
      document.querySelectorAll(".hack-item").forEach(item => {
        item.classList.remove("drag-over");
      });
    });
    
    hackElement.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (draggedIndex !== null && draggedIndex !== index) {
        hackElement.classList.add("drag-over");
      }
    });
    
    hackElement.addEventListener("dragleave", (e) => {
      hackElement.classList.remove("drag-over");
    });
    
    hackElement.addEventListener("drop", async (e) => {
      e.preventDefault();
      if (draggedIndex !== null && draggedIndex !== index) {
        await reordenarHacks(draggedIndex, index);
      }
      hackElement.classList.remove("drag-over");
      draggedIndex = null;
    });
    
    container.appendChild(hackElement);
  });
}

// ============================================
// AÇÕES - Adicionar e excluir hacks
// ============================================

async function adicionarHack(event) {
  console.log("🎯 adicionarHack chamado, PLUGIN_READY:", PLUGIN_READY);
  
  if (event) {
    event.preventDefault();
  }

  if (!PLUGIN_READY) {
    console.warn("⚠️ Plugin ainda não está pronto");
    alert("⚠️ Plugin ainda está inicializando...");
    return;
  }

  console.log("📝 Iniciando adição de novo hack...");
  
  const nomeInput = document.getElementById("hackName");
  const ramInput = document.getElementById("hackRam");
  const dvInput = document.getElementById("hackDv");
  const typeInput = document.getElementById("hackType");
  const effectInput = document.getElementById("hackEffect");
  const form = event ? event.target : document.getElementById("hackForm");

  // Validar inputs
  if (!nomeInput || !ramInput || !dvInput || !typeInput) {
    alert("❌ Erro ao acessar formulário");
    return;
  }

  const nome = nomeInput.value.trim();
  const ram = parseInt(ramInput.value);
  const dv = parseInt(dvInput.value);
  const tipo = typeInput.value.trim();
  const descricao = effectInput ? effectInput.value.trim() : "";

  // Validações
  if (!nome) {
    alert("⚠ Nome do hack é obrigatório");
    return;
  }

  if (isNaN(ram) || ram < 1 || ram > 20) {
    alert("⚠ RAM deve ser entre 1 e 20");
    return;
  }

  if (isNaN(dv) || dv < 0 || dv > 20) {
    alert("⚠ DV deve ser entre 0 e 20");
    return;
  }

  if (!tipo || !HACK_TYPES[tipo]) {
    alert("⚠ Tipo de hack é obrigatório");
    return;
  }

  // Criar hack
  const novoHack = {
    id: Date.now().toString(),
    nome: nome,
    custoRAM: ram,
    dv: dv,
    tipo: tipo,
    descricao: descricao,
    criadoEm: new Date().toISOString()
  };

  // Salvar
  const hacks = await carregarHacksLocal();
  hacks.push(novoHack);
  
  if (await salvarHacksLocal(hacks)) {
    console.log("✓ Novo hack adicionado:", nome);
    form.reset();
    await renderizarHacks();
  } else {
    alert("❌ Erro ao salvar hack");
  }
}

async function importarHack(hackId) {
  // Primeiro verificar se é um hack especial
  const hackEspecial = HACKS_ESPECIAIS.find(h => h.id === hackId);
  if (hackEspecial) {
    return await importarHackEspecial(hackId);
  }

  // Procurar no banco de hacks do sistema
  const hackOriginal = HACKS_SISTEMA.find(h => h.id === hackId);
  if (!hackOriginal) {
    alert("❌ Hack não encontrado");
    return;
  }

  // Criar cópia do hack do sistema para o cyberdeck
  const novoHack = {
    id: Date.now().toString(),
    nome: hackOriginal.nome,
    custoRAM: hackOriginal.custoRAM,
    dv: hackOriginal.dv,
    tipo: hackOriginal.tipo || "quickhacking",
    descricao: hackOriginal.descricao,
    origem: "sistema",
    criadoEm: new Date().toISOString()
  };

  const hacks = await carregarHacksLocal();
  hacks.push(novoHack);
  
  if (await salvarHacksLocal(hacks)) {
    console.log("✓ Hack importado:", hackOriginal.nome);
    await renderizarHacks();
    abrirAba("cyberdeck");
    alert(`✓ "${hackOriginal.nome}" adicionado ao seu cyberdeck!`);
  } else {
    alert("❌ Erro ao importar hack");
  }
}

async function usarHack(hackId) {
  console.log("🎯 usarHack chamado com ID:", hackId);
  
  // Procurar o hack no sistema
  const hackOriginal = HACKS_SISTEMA.find(h => h.id === hackId);
  if (!hackOriginal) {
    alert("❌ Hack não encontrado");
    return;
  }

  // Carregar dados atuais
  const ramAtual = await carregarRAMLocal();
  
  // Validar se tem RAM suficiente
  if (ramAtual.ram < hackOriginal.custoRAM) {
    alert(`❌ RAM insuficiente!\nVocê precisa de ${hackOriginal.custoRAM} RAM, mas tem apenas ${ramAtual.ram}.`);
    return;
  }

  // Descontar a RAM
  const novaRAM = ramAtual.ram - hackOriginal.custoRAM;
  console.log(`💾 Usando hack "${hackOriginal.nome}" - Descontando ${hackOriginal.custoRAM} RAM (${ramAtual.ram} → ${novaRAM})`);
  
  await salvarRAMLocal(novaRAM, ramAtual.max);
  await renderizarRAM();
  
  alert(`✓ Hack "${hackOriginal.nome}" usado com sucesso!\n⚡ RAM descontada: ${hackOriginal.custoRAM}\n📊 RAM restante: ${novaRAM}/${ramAtual.max}`);
}

async function usarHackCyberdeck(custoRAM, nomeHack) {
  console.log("🎯 usarHackCyberdeck chamado:", nomeHack, "custo:", custoRAM);
  
  // Carregar dados atuais
  const ramAtual = await carregarRAMLocal();
  
  // Validar se tem RAM suficiente
  if (ramAtual.ram < custoRAM) {
    alert(`❌ RAM insuficiente!\nVocê precisa de ${custoRAM} RAM, mas tem apenas ${ramAtual.ram}.`);
    return;
  }

  // Descontar a RAM
  const novaRAM = ramAtual.ram - custoRAM;
  console.log(`💾 Usando hack "${nomeHack}" - Descontando ${custoRAM} RAM (${ramAtual.ram} → ${novaRAM})`);
  
  await salvarRAMLocal(novaRAM, ramAtual.max);
  await renderizarRAM();
  
  alert(`✓ Hack "${nomeHack}" usado com sucesso!\n⚡ RAM descontada: ${custoRAM}\n📊 RAM restante: ${novaRAM}/${ramAtual.max}`);
}

async function reordenarHacks(indexDe, indexPara) {
  console.log(`🔄 Reordenando hacks: ${indexDe} → ${indexPara}`);
  
  const hacks = await carregarHacksLocal();
  
  // Validar índices
  if (indexDe < 0 || indexDe >= hacks.length || indexPara < 0 || indexPara >= hacks.length) {
    console.error("❌ Índices inválidos para reordenação");
    return;
  }
  
  // Remover hack do índice original
  const hackMovido = hacks.splice(indexDe, 1)[0];
  
  // Inserir hack no novo índice
  hacks.splice(indexPara, 0, hackMovido);
  
  // Salvar nova ordem
  if (await salvarHacksLocal(hacks)) {
    console.log("✓ Hacks reordenados com sucesso");
    await renderizarHacks();
  } else {
    console.error("❌ Erro ao salvar reordenação");
  }
}

async function excluirHack(index) {
  if (!confirm("Tem certeza que deseja excluir este hack?")) {
    return;
  }

  const hacks = await carregarHacksLocal();
  
  if (index < 0 || index >= hacks.length) {
    alert("❌ Hack não encontrado");
    return;
  }

  const nomeDeletado = hacks[index].nome;
  hacks.splice(index, 1);

  if (await salvarHacksLocal(hacks)) {
    console.log("✓ Hack excluído:", nomeDeletado);
    await renderizarHacks();
  } else {
    alert("❌ Erro ao excluir hack");
  }
}

// ============================================
// UTILIDADES
// ============================================

function sanitizar(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

// ============================================
// CODE BREAKER - Sistema de Desbloqueio
// ============================================

async function carregarCodigosDesbloqueados() {
  try {
    const chave = obterChaveUsuario(CODEBREAKER_STORAGE_KEY);
    let codigos = null;
    
    // Tentar carregar de localStorage PRIMEIRO
    try {
      console.log("💾 Carregando códigos de localStorage");
      const stored = localStorage.getItem(chave);
      if (stored) {
        codigos = JSON.parse(stored);
        console.log("✓ Códigos carregados via localStorage");
      }
    } catch (storageError) {
      console.warn("⚠️ localStorage não disponível:", storageError);
    }
    
    // Se localStorage não tinha dados, tentar OBR.storage
    if (!codigos && typeof OBR !== 'undefined' && OBR.storage && OBR.storage.getItems) {
      try {
        console.log("📡 Carregando códigos de OBR.storage");
        const dados = await OBR.storage.getItems([chave]);
        if (dados.length > 0) {
          codigos = JSON.parse(dados[0].value);
          console.log("✓ Códigos carregados via OBR.storage");
        }
      } catch (obrError) {
        console.warn("⚠️ OBR.storage não disponível:", obrError);
      }
    }
    
    codigos = codigos || [];
    return Array.isArray(codigos) ? codigos : [];
  } catch (error) {
    console.error("❌ Erro ao carregar códigos desbloqueados:", error);
    return [];
  }
}

async function salvarCodigosDesbloqueados(codigos) {
  try {
    const chave = obterChaveUsuario(CODEBREAKER_STORAGE_KEY);
    
    // SEMPRE tentar salvar em localStorage como método primário
    try {
      console.log("💾 Salvando códigos em localStorage");
      localStorage.setItem(chave, JSON.stringify(codigos));
      
      const verificacao = localStorage.getItem(chave);
      if (verificacao) {
        console.log("✅ localStorage confirmado - códigos salvos");
      } else {
        console.error("❌ localStorage falhou");
      }
    } catch (storageError) {
      console.error("❌ Erro ao salvar códigos em localStorage:", storageError);
    }
    
    // TAMBÉM tentar salvar em OBR.storage se disponível
    if (typeof OBR !== 'undefined' && OBR.storage && OBR.storage.setItems) {
      try {
        console.log("📡 Também salvando códigos em OBR.storage");
        await OBR.storage.setItems([{
          key: chave,
          value: JSON.stringify(codigos)
        }]);
        console.log("📡 OBR.storage códigos sincronizado");
      } catch (obrError) {
        console.warn("⚠️ OBR.storage códigos não disponível (isto é normal):", obrError);
      }
    }
    
    console.log("✓ Códigos desbloqueados salvos");
    return true;
  } catch (error) {
    console.error("❌ Erro ao salvar códigos:", error);
    return false;
  }
}

function tentarDesbloqueio() {
  if (!PLUGIN_READY) {
    alert("⚠️ Plugin ainda está inicializando...");
    return;
  }
  if (!USER_ID) {
    alert("⚠️ Plugin ainda está conectando ao Owlbear Rodeo...");
    return;
  }
  const codeInput = document.getElementById("codeInput");
  const codeMessage = document.getElementById("codeMessage");
  
  if (!codeInput) {
    console.error("❌ Input de código não encontrado");
    return;
  }

  const codigo = codeInput.value.trim();

  if (codigo.length !== 12) {
    codeMessage.textContent = "⚠️ O código deve ter exatamente 12 caracteres!";
    codeMessage.className = "codebreaker-message error";
    return;
  }

  // Procurar o hack especial com este código
  const hackEspecial = HACKS_ESPECIAIS.find(h => h.codigo.toLowerCase() === codigo.toLowerCase());

  if (!hackEspecial) {
    codeMessage.textContent = "❌ Código inválido! Tente novamente.";
    codeMessage.className = "codebreaker-message error";
    console.log("❌ Código inválido:", codigo);
    return;
  }

  // Verificar se já foi desbloqueado
  carregarCodigosDesbloqueados().then(codigosDesbloqueados => {
    if (codigosDesbloqueados.includes(hackEspecial.id)) {
      codeMessage.textContent = "✓ Este hack já foi desbloqueado!";
      codeMessage.className = "codebreaker-message success";
      codeInput.value = "";
      return;
    }

    // Desbloquear o hack
    codigosDesbloqueados.push(hackEspecial.id);
    salvarCodigosDesbloqueados(codigosDesbloqueados).then(() => {
      codeMessage.textContent = `✓ Hack desbloqueado com sucesso: "${hackEspecial.nome}"!`;
      codeMessage.className = "codebreaker-message success";
      codeInput.value = "";

      // Atualizar a exibição de hacks desbloqueados
      renderizarHacksDesbloqueados();

      console.log("✓ Hack especial desbloqueado:", hackEspecial.nome);
    }).catch(error => {
      console.error("❌ Erro ao desbloquear hack:", error);
      codeMessage.textContent = "❌ Erro ao desbloquear hack!";
      codeMessage.className = "codebreaker-message error";
    });
  }).catch(error => {
    console.error("❌ Erro ao carregar códigos:", error);
    codeMessage.textContent = "❌ Erro ao processar código!";
    codeMessage.className = "codebreaker-message error";
  });
}

function renderizarHacksDesbloqueados() {
  if (!USER_ID) {
    console.warn("⚠️ USER_ID não definido ainda");
    return;
  }
  
  carregarCodigosDesbloqueados().then(codigosDesbloqueados => {
    const container = document.getElementById("codebredHacksList");

    if (!container) {
      console.warn("⚠️ Container de hacks desbloqueados não encontrado");
      return;
    }

    container.innerHTML = "";

    // Encontrar os hacks desbloqueados
    const hacksParaExibir = HACKS_ESPECIAIS.filter(h => codigosDesbloqueados.includes(h.id));

    if (hacksParaExibir.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔒</div>
          <p>Nenhum hack desbloqueado</p>
          <small>Digite um código válido para desbloquear hacks especiais</small>
        </div>
      `;
      return;
    }

    // Renderizar hacks desbloqueados
    hacksParaExibir.forEach((hack) => {
      const hackElement = document.createElement("div");
      hackElement.className = "hack-item hack-item-market hack-special";
      hackElement.innerHTML = `
        <div class="hack-header">
          <div class="hack-info">
            <h4 class="hack-name">🔓 ${sanitizar(hack.nome)}</h4>
            <div class="hack-meta">
              <span class="hack-stat">
                <span class="stat-label">RAM:</span>
                <span class="stat-value">${hack.custoRAM}</span>
              </span>
              <span class="hack-stat">
                <span class="stat-label">DV:</span>
                <span class="stat-value">${hack.dv}</span>
              </span>
              <span class="hack-category">${sanitizar(hack.categoria)}</span>
            </div>
          </div>
          <button class="btn btn-install" onclick="importarHack('${hack.id}')" title="Adicionar ao Cyberdeck">
            <span>+</span>
          </button>
        </div>
        ${hack.descricao ? `<p class="hack-desc">${sanitizar(hack.descricao)}</p>` : ""}
      `;
      container.appendChild(hackElement);
    });

    console.log("✓ Hacks desbloqueados renderizados:", hacksParaExibir.length);
  });
}

// Modificar a função importarHack para suportar hacks especiais
async function importarHackEspecial(hackId) {
  const hackOriginal = HACKS_ESPECIAIS.find(h => h.id === hackId);
  if (!hackOriginal) {
    alert("❌ Hack não encontrado");
    return;
  }

  const novoHack = {
    id: Date.now().toString(),
    nome: hackOriginal.nome,
    custoRAM: hackOriginal.custoRAM,
    dv: hackOriginal.dv,
    tipo: hackOriginal.tipo || "quickhacking",
    descricao: hackOriginal.descricao,
    origem: "especial",
    criadoEm: new Date().toISOString()
  };

  const hacks = await carregarHacksLocal();
  hacks.push(novoHack);

  if (await salvarHacksLocal(hacks)) {
    console.log("✓ Hack especial importado:", hackOriginal.nome);
    await renderizarHacks();
    abrirAba("cyberdeck");
    alert(`✓ "${hackOriginal.nome}" adicionado ao seu cyberdeck!`);
  } else {
    alert("❌ Erro ao importar hack");
  }
}

