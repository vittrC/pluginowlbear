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
    abrirAba("personagem");
    
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

  // Inicializar perícias da ficha de personagem
  inicializarPericiasListeners();
  console.log("✓ Perícias inicializadas");
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
    
    // Usar ID consistente baseado em localStorage (persiste entre sessões)
    const FALLBACK_USER_KEY = "owlbear_demo_user_id";
    let demoUserId = localStorage.getItem(FALLBACK_USER_KEY);
    
    if (!demoUserId) {
      demoUserId = "demo_" + Math.random().toString(36).substr(2, 9);
      try {
        localStorage.setItem(FALLBACK_USER_KEY, demoUserId);
        console.log("🆕 Novo usuário demo criado (localStorage):", demoUserId);
      } catch (e) {
        console.error("❌ Erro ao salvar demo user ID em localStorage:", e);
      }
    } else {
      console.log("♻️ Usuário demo existente (localStorage):", demoUserId);
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
    // Use chave simples e consistente para localStorage
    const chaveLoja = "cyberpunk_hacks_rapidos_local";
    console.log("💾 Salvando hacks para localStorage com chave:", chaveLoja);
    
    // Salvar em localStorage (método primário - mais confiável)
    try {
      const dataStr = JSON.stringify(hacks);
      localStorage.setItem(chaveLoja, dataStr);
      
      // Verificar imediatamente se foi salvo
      const verificacao = localStorage.getItem(chaveLoja);
      if (verificacao) {
        console.log("✅ localStorage verificado - dados salvos com sucesso:", hacks.length, "hacks");
      } else {
        console.error("❌ localStorage falhou - dados NÃO foram salvos");
      }
    } catch (storageError) {
      console.error("❌ Erro ao salvar em localStorage:", storageError);
      return false;
    }
    
    // Também tentar salvar com chave do usuário em OBR.storage (opcional)
    if (USER_ID) {
      const chaveOBR = `${USER_ID}_${STORAGE_KEY}`;
      if (typeof OBR !== 'undefined' && OBR.storage && OBR.storage.setItems) {
        try {
          console.log("📡 Também sincronizando com OBR.storage:", chaveOBR);
          await OBR.storage.setItems([{
            key: chaveOBR,
            value: JSON.stringify(hacks)
          }]);
        } catch (obrError) {
          console.warn("⚠️ OBR.storage não disponível (pode ignorar):", obrError.message);
        }
      }
    }
    
    console.log("✓ Hacks salvos com sucesso");
    return true;
  } catch (error) {
    console.error("❌ Erro crítico ao salvar hacks:", error);
    return false;
  }
}

async function carregarHacksLocal() {
  try {
    // Use chave simples e consistente para localStorage
    const chaveLoja = "cyberpunk_hacks_rapidos_local";
    console.log("📂 Carregando hacks de localStorage com chave:", chaveLoja);
    
    let hacksData = null;
    
    // Tentar carregar de localStorage (método primário)
    try {
      hacksData = localStorage.getItem(chaveLoja);
      if (hacksData) {
        console.log("✓ Dados encontrados em localStorage");
      } else {
        console.warn("⚠️ Nenhum dado encontrado em localStorage, tentando OBR.storage...");
      }
    } catch (storageError) {
      console.warn("⚠️ Erro ao carregar de localStorage:", storageError);
    }
    
    // Se localStorage não encontrou, tentar OBR.storage
    if (!hacksData && USER_ID) {
      const chaveOBR = `${USER_ID}_${STORAGE_KEY}`;
      if (typeof OBR !== 'undefined' && OBR.storage && OBR.storage.getItems) {
        try {
          console.log("📡 Tentando carregar de OBR.storage:", chaveOBR);
          const dados = await OBR.storage.getItems([chaveOBR]);
          if (dados.length > 0) {
            hacksData = dados[0].value;
            console.log("✓ Dados carregados via OBR.storage");
          }
        } catch (obrError) {
          console.warn("⚠️ OBR.storage não disponível:", obrError.message);
        }
      }
    }
    
    const hacks = hacksData ? JSON.parse(hacksData) : [];
    console.log("✓ Hacks carregados:", hacks.length, "items");
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
    // Use chave simples e consistente para localStorage
    const chaveLoja = "cyberpunk_player_ram_local";
    console.log("💾 Salvando RAM para localStorage com chave:", chaveLoja);
    console.log("   Valor: RAM", ramAtual, "/", ramMaximo);
    
    // Salvar em localStorage (método primário)
    try {
      const dataStr = JSON.stringify({ ram: ramAtual, max: ramMaximo });
      localStorage.setItem(chaveLoja, dataStr);
      
      // Verificar imediatamente
      const verificacao = localStorage.getItem(chaveLoja);
      if (verificacao) {
        console.log("✅ localStorage verificado - RAM salvo com sucesso");
      } else {
        console.error("❌ localStorage falhou - RAM NÃO foi salvo");
      }
    } catch (storageError) {
      console.error("❌ Erro ao salvar RAM em localStorage:", storageError);
      return false;
    }
    
    // Também tentar salvar com chave do usuário em OBR.storage (opcional)
    if (USER_ID) {
      const chaveOBR = `${USER_ID}_${RAM_STORAGE_KEY}`;
      if (typeof OBR !== 'undefined' && OBR.storage && OBR.storage.setItems) {
        try {
          console.log("📡 Também sincronizando RAM com OBR.storage");
          await OBR.storage.setItems([{
            key: chaveOBR,
            value: JSON.stringify({ ram: ramAtual, max: ramMaximo })
          }]);
        } catch (obrError) {
          console.warn("⚠️ OBR.storage RAM não disponível (pode ignorar):", obrError.message);
        }
      }
    }
    
    console.log("✓ RAM salvo com sucesso");
    return true;
  } catch (error) {
    console.error("❌ Erro ao salvar RAM:", error);
    return false;
  }
}

async function carregarRAMLocal() {
  try {
    // Use chave simples e consistente para localStorage
    const chaveLoja = "cyberpunk_player_ram_local";
    console.log("📂 Carregando RAM de localStorage com chave:", chaveLoja);
    
    let ramData = null;
    
    // Tentar carregar de localStorage (método primário)
    try {
      const stored = localStorage.getItem(chaveLoja);
      if (stored) {
        ramData = JSON.parse(stored);
        console.log("✓ RAM encontrado em localStorage:", ramData.ram, "/", ramData.max);
      } else {
        console.warn("⚠️ Nenhum RAM encontrado em localStorage, tentando OBR.storage...");
      }
    } catch (storageError) {
      console.warn("⚠️ Erro ao carregar RAM de localStorage:", storageError);
    }
    
    // Se localStorage não encontrou, tentar OBR.storage
    if (!ramData && USER_ID) {
      const chaveOBR = `${USER_ID}_${RAM_STORAGE_KEY}`;
      if (typeof OBR !== 'undefined' && OBR.storage && OBR.storage.getItems) {
        try {
          console.log("📡 Tentando carregar RAM de OBR.storage");
          const dados = await OBR.storage.getItems([chaveOBR]);
          if (dados.length > 0) {
            ramData = JSON.parse(dados[0].value);
            console.log("✓ RAM carregado via OBR.storage");
          }
        } catch (obrError) {
          console.warn("⚠️ OBR.storage RAM não disponível:", obrError.message);
        }
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
    const tipoInfo = HACK_TYPES[hack.tipo] || HACK_TYPES.quickhacking;
    const badgeHTML = hack.tipo ? `<span class="hack-badge hack-badge-${hack.tipo}">${tipoInfo.icon} ${tipoInfo.nome}</span>` : "";
    
    hackElement.innerHTML = `
      <div class="hack-header">
        <div class="hack-info">
          <h4 class="hack-name">${sanitizar(hack.nome)}</h4>
          <div class="hack-meta">
            ${badgeHTML}
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
        <div class="hack-actions">
          <button class="btn btn-edit" onclick="abrirModalEdicao(${index})" title="Editar hack">
            📝
          </button>
          <button class="btn btn-delete" onclick="excluirHack(${index})" title="Excluir hack">
            <span>✕</span>
          </button>
        </div>
      </div>
      ${
        hack.descricao
          ? `<p class="hack-desc">${sanitizar(hack.descricao)}</p>`
          : ""
      }
      ${
        hack.notas
          ? `<p class="hack-notes"><strong>Notas:</strong> ${sanitizar(hack.notas)}</p>`
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
    mostrarToast("Plugin ainda está inicializando...", 'warning');
    return;
  }

  console.log("📝 Iniciando adição de novo hack...");
  
  const nomeInput = document.getElementById("hackName");
  const ramInput = document.getElementById("hackRam");
  const dvInput = document.getElementById("hackDv");
  const typeInput = document.getElementById("hackType");
  const effectInput = document.getElementById("hackEffect");
  const notesInput = document.getElementById("hackNotes");
  const form = event ? event.target : document.getElementById("hackForm");

  // Validar inputs
  if (!nomeInput || !ramInput || !dvInput || !typeInput) {
    mostrarToast("Erro ao acessar formulário", 'error');
    return;
  }

  const nome = nomeInput.value.trim();
  const ram = parseInt(ramInput.value);
  const dv = parseInt(dvInput.value);
  const tipo = typeInput.value.trim();
  const descricao = effectInput ? effectInput.value.trim() : "";
  const notas = notesInput ? notesInput.value.trim() : "";

  // Validações
  if (!nome) {
    mostrarToast("Nome do hack é obrigatório", 'error');
    return;
  }

  if (isNaN(ram) || ram < 1 || ram > 20) {
    mostrarToast("RAM deve ser entre 1 e 20", 'error');
    return;
  }

  if (isNaN(dv) || dv < 0 || dv > 20) {
    mostrarToast("DV deve ser entre 0 e 20", 'error');
    return;
  }

  if (!tipo || !HACK_TYPES[tipo]) {
    mostrarToast("Tipo de hack é obrigatório", 'error');
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
    notas: notas,
    criadoEm: new Date().toISOString()
  };

  // Salvar
  const hacks = await carregarHacksLocal();
  hacks.push(novoHack);
  
  if (await salvarHacksLocal(hacks)) {
    console.log("✓ Novo hack adicionado:", nome);
    form.reset();
    await renderizarHacks();
    mostrarToast(`✓ "${nome}" adicionado ao cyberdeck!`, 'success');
  } else {
    mostrarToast("Erro ao salvar hack", 'error');
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
    mostrarToast("❌ Hack não encontrado", "error");
    return;
  }

  // Carregar dados atuais
  const ramAtual = await carregarRAMLocal();
  
  // Validar se tem RAM suficiente
  if (ramAtual.ram < hackOriginal.custoRAM) {
    mostrarToast(`❌ RAM insuficiente! Precisa de ${hackOriginal.custoRAM}, tem ${ramAtual.ram}`, "error");
    return;
  }

  // Descontar a RAM
  const novaRAM = ramAtual.ram - hackOriginal.custoRAM;
  console.log(`💾 Usando hack "${hackOriginal.nome}" - Descontando ${hackOriginal.custoRAM} RAM (${ramAtual.ram} → ${novaRAM})`);
  
  await salvarRAMLocal(novaRAM, ramAtual.max);
  await renderizarRAM();
  
  mostrarToast(`✓ "${hackOriginal.nome}" usado! RAM: ${novaRAM}/${ramAtual.max}`, "success");
}

async function usarHackCyberdeck(custoRAM, nomeHack) {
  console.log("🎯 usarHackCyberdeck chamado:", nomeHack, "custo:", custoRAM);
  
  // Carregar dados atuais
  const ramAtual = await carregarRAMLocal();
  
  // Validar se tem RAM suficiente
  if (ramAtual.ram < custoRAM) {
    mostrarToast(`❌ RAM insuficiente! Precisa de ${custoRAM}, tem ${ramAtual.ram}`, "error");
    return;
  }

  // Descontar a RAM
  const novaRAM = ramAtual.ram - custoRAM;
  console.log(`💾 Usando hack "${nomeHack}" - Descontando ${custoRAM} RAM (${ramAtual.ram} → ${novaRAM})`);
  
  await salvarRAMLocal(novaRAM, ramAtual.max);
  await renderizarRAM();
  
  mostrarToast(`✓ "${nomeHack}" usado! RAM: ${novaRAM}/${ramAtual.max}`, "success");
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
    mostrarToast("❌ Hack não encontrado", "error");
    return;
  }

  const nomeDeletado = hacks[index].nome;
  hacks.splice(index, 1);

  if (await salvarHacksLocal(hacks)) {
    console.log("✓ Hack excluído:", nomeDeletado);
    mostrarToast(`"${nomeDeletado}" foi excluído`, "success");
    await renderizarHacks();
  } else {
    mostrarToast("❌ Erro ao excluir hack", "error");
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
// TOAST NOTIFICATIONS - Sistema de Confirmações Visuais
// ============================================

function mostrarToast(mensagem, tipo = 'success', duracao = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠'
  };

  toast.innerHTML = `
    <span class="toast-icon">${icons[tipo] || '●'}</span>
    <span class="toast-message">${sanitizar(mensagem)}</span>
  `;

  container.appendChild(toast);

  // Auto-remover após duracao
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, duracao);
}

// ============================================
// EDITAR HACK - Modal e Funções
// ============================================

function abrirModalEdicao(index) {
  carregarHacksLocal().then(hacks => {
    if (index < 0 || index >= hacks.length) {
      mostrarToast('Hack não encontrado', 'error');
      return;
    }

    const hack = hacks[index];
    
    // Preencher formulário de edição
    document.getElementById('editHackIndex').value = index;
    document.getElementById('editHackName').value = hack.nome;
    document.getElementById('editHackRam').value = hack.custoRAM;
    document.getElementById('editHackDv').value = hack.dv;
    document.getElementById('editHackType').value = hack.tipo || 'quickhacking';
    document.getElementById('editHackEffect').value = hack.descricao || '';
    document.getElementById('editHackNotes').value = hack.notas || '';

    // Mostrar modal
    const modal = document.getElementById('editModal');
    if (modal) {
      modal.classList.add('active');
    }
  });
}

function fecharModalEdicao() {
  const modal = document.getElementById('editModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

async function salvarEdicaoHack() {
  const index = parseInt(document.getElementById('editHackIndex').value);
  const nome = document.getElementById('editHackName').value.trim();
  const ram = parseInt(document.getElementById('editHackRam').value);
  const dv = parseInt(document.getElementById('editHackDv').value);
  const tipo = document.getElementById('editHackType').value;
  const descricao = document.getElementById('editHackEffect').value.trim();
  const notas = document.getElementById('editHackNotes').value.trim();

  // Validações
  if (!nome) {
    mostrarToast('Nome do hack é obrigatório', 'error');
    return;
  }

  if (isNaN(ram) || ram < 1 || ram > 20) {
    mostrarToast('RAM deve ser entre 1 e 20', 'error');
    return;
  }

  if (isNaN(dv) || dv < 0 || dv > 20) {
    mostrarToast('DV deve ser entre 0 e 20', 'error');
    return;
  }

  if (!tipo || !HACK_TYPES[tipo]) {
    mostrarToast('Tipo de hack é obrigatório', 'error');
    return;
  }

  const hacks = await carregarHacksLocal();
  
  if (index < 0 || index >= hacks.length) {
    mostrarToast('Hack não encontrado', 'error');
    return;
  }

  // Atualizar hack
  hacks[index].nome = nome;
  hacks[index].custoRAM = ram;
  hacks[index].dv = dv;
  hacks[index].tipo = tipo;
  hacks[index].descricao = descricao;
  hacks[index].notas = notas;

  if (await salvarHacksLocal(hacks)) {
    fecharModalEdicao();
    await renderizarHacks();
    mostrarToast(`✓ "${nome}" foi atualizado com sucesso!`, 'success');
    console.log('✓ Hack editado:', nome);
  } else {
    mostrarToast('Erro ao salvar alterações', 'error');
  }
}

// ============================================
// CODE BREAKER - Sistema de Desbloqueio
// ============================================

async function carregarCodigosDesbloqueados() {
  try {
    // Use chave simples e consistente para localStorage
    const chaveLoja = "cyberpunk_codebreaker_local";
    console.log("📂 Carregando códigos de localStorage com chave:", chaveLoja);
    
    let codigos = null;
    
    // Tentar carregar de localStorage (método primário)
    try {
      const stored = localStorage.getItem(chaveLoja);
      if (stored) {
        codigos = JSON.parse(stored);
        console.log("✓ Códigos encontrados em localStorage");
      } else {
        console.warn("⚠️ Nenhum código encontrado em localStorage, tentando OBR.storage...");
      }
    } catch (storageError) {
      console.warn("⚠️ Erro ao carregar códigos de localStorage:", storageError);
    }
    
    // Se localStorage não encontrou, tentar OBR.storage
    if (!codigos && USER_ID) {
      const chaveOBR = `${USER_ID}_${CODEBREAKER_STORAGE_KEY}`;
      if (typeof OBR !== 'undefined' && OBR.storage && OBR.storage.getItems) {
        try {
          console.log("📡 Tentando carregar códigos de OBR.storage");
          const dados = await OBR.storage.getItems([chaveOBR]);
          if (dados.length > 0) {
            codigos = JSON.parse(dados[0].value);
            console.log("✓ Códigos carregados via OBR.storage");
          }
        } catch (obrError) {
          console.warn("⚠️ OBR.storage códigos não disponível:", obrError.message);
        }
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
    // Use chave simples e consistente para localStorage
    const chaveLoja = "cyberpunk_codebreaker_local";
    console.log("💾 Salvando códigos para localStorage com chave:", chaveLoja);
    
    // Salvar em localStorage (método primário)
    try {
      const dataStr = JSON.stringify(codigos);
      localStorage.setItem(chaveLoja, dataStr);
      
      // Verificar imediatamente
      const verificacao = localStorage.getItem(chaveLoja);
      if (verificacao) {
        console.log("✅ localStorage verificado - códigos salvos com sucesso");
      } else {
        console.error("❌ localStorage falhou - códigos NÃO foram salvos");
      }
    } catch (storageError) {
      console.error("❌ Erro ao salvar códigos em localStorage:", storageError);
      return false;
    }
    
    // Também tentar salvar com chave do usuário em OBR.storage (opcional)
    if (USER_ID) {
      const chaveOBR = `${USER_ID}_${CODEBREAKER_STORAGE_KEY}`;
      if (typeof OBR !== 'undefined' && OBR.storage && OBR.storage.setItems) {
        try {
          console.log("📡 Também sincronizando códigos com OBR.storage");
          await OBR.storage.setItems([{
            key: chaveOBR,
            value: JSON.stringify(codigos)
          }]);
        } catch (obrError) {
          console.warn("⚠️ OBR.storage códigos não disponível (pode ignorar):", obrError.message);
        }
      }
    }
    
    console.log("✓ Códigos desbloqueados salvos com sucesso");
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
      const tipoInfo = HACK_TYPES[hack.tipo] || HACK_TYPES.quickhacking;
      const badgeHTML = hack.tipo ? `<span class="hack-badge hack-badge-${hack.tipo}">${tipoInfo.icon} ${tipoInfo.nome}</span>` : "";
      
      hackElement.innerHTML = `
        <div class="hack-header">
          <div class="hack-info">
            <h4 class="hack-name">🔓 ${sanitizar(hack.nome)}</h4>
            <div class="hack-meta">
              ${badgeHTML}
              <span class="hack-stat">
                <span class="stat-label">RAM:</span>
                <span class="stat-value">${hack.custoRAM}</span>
              </span>
              <span class="hack-stat">
                <span class="stat-label">DV:</span>
                <span class="stat-value">${hack.dv}</span>
              </span>
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

// ============================================
// CHARACTER SHEET FUNCTIONS
// ============================================

// Mapping de papéis e suas habilidades
const ROLE_ABILITIES = {
  solo: {
    name: "Solo",
    ability: "Percepção de Combate: Permite que o Solista aloque pontos em diferentes sub-habilidades de combate no início de um turno, como bônus em Iniciativa, Precisão (Ataque), Dano ou Esquiva. É o mestre da sobrevivência e letalidade."
  },
  "trilha-rede": {
    name: "Trilha-Rede",
    ability: "Interface: É a capacidade de projetar sua consciência em redes de computadores. Permite realizar ações no Cyberespaço, como usar programas para atacar, quebrar senhas e controlar sistemas de segurança (torretas, câmeras)."
  },
  tecnico: {
    name: "Técnico",
    ability: "Fabricar: Dividida em especialidades, permite que o Técnico conserte itens, modifique equipamentos (tornando armas melhores que as de fábrica) e até invente tecnologias novas que não existem no mercado."
  },
  medtech: {
    name: "Medtech",
    ability: "Medicina: Permite realizar cirurgias críticas (para curar ferimentos que primeiros socorros não resolvem), fabricar e aplicar drogas farmacêuticas personalizadas e instalar/reparar cibernéticos avançados."
  },
  roqueiro: {
    name: "Roqueiro (Rockerboy)",
    ability: "Impacto Carismático: Representa sua influência sobre os fãs. Em níveis baixos, pode conseguir pequenos favores (bebidas, informações); em níveis altos, pode incitar uma multidão a iniciar uma rebelião ou proteger o personagem."
  },
  midia: {
    name: "Mídia",
    ability: "Credibilidade: A capacidade de convencer o público da verdade. Um Mídia pode publicar histórias que destroem a reputação de corporações ou indivíduos poderosos, além de ter fontes que fornecem informações secretas."
  },
  executivo: {
    name: "Executivo",
    ability: "Trabalho em Equipe: O Executivo tem acesso a recursos corporativos. Ele começa com um terno e um apartamento pagos pela empresa, e pode recrutar uma equipe de subordinados (guarda-costas, motoristas ou técnicos) que o auxiliam diretamente."
  },
  fixer: {
    name: "Fixer",
    ability: "Operador: É o mestre do mercado negro. Permite localizar itens raros que não estão à venda comum, negociar preços melhores e ter contatos em todas as esferas da sociedade para resolver problemas."
  },
  nomade: {
    name: "Nômade",
    ability: "Moto: Dá acesso à frota de veículos da sua família nômade. Conforme sobe de nível, o personagem ganha veículos melhores ou pode adicionar modificações pesadas (como blindagem, armas e motores turbinados)."
  },
  policial: {
    name: "Policial",
    ability: "Reforço: Permite que o personagem use seu rádio para chamar apoio. Dependendo do seu nível, o reforço pode variar de dois policiais locais em uma viatura até uma equipe tática de elite em um veículo aéreo pesado."
  }
};

// Mapping de atributos para perícias
const SKILL_ATTRIBUTE_MAP = {
  // Perícias de Atenção
  "Concentração (COR)": "attrCor",
  "Ocultar/Revelar Objeto (INT)": "attrIntel",
  "Leitura Labial (INT)": "attrIntel",
  "Percepção (INT)": "attrIntel",
  "Rastrear (INT)": "attrIntel",
  
  // Perícias Corporais
  "Atletismo (COR)": "attrCor",
  "Contorcionismo (COR)": "attrCor",
  "Dançar (COR)": "attrCor",
  "Resistência (FOR)": "attrFor",
  "Resistência à Tortura/Drogas (FOR)": "attrFor",
  "Furtividade (COR)": "attrCor",
  
  // Perícias de Condução
  "Dirigir Veículo Terrestre (REF)": "attrRefl",
  "Pilotar Veículo Aéreo x2 (REF)": "attrRefl",
  "Pilotar Veículo Marítimo (REF)": "attrRefl",
  "Motocicleta (REF)": "attrRefl",
  
  // Perícias de Educação
  "Contabilidade (INT)": "attrIntel",
  "Lidar com Animais (INT)": "attrIntel",
  "Burocracia (INT)": "attrIntel",
  "Negócios (INT)": "attrIntel",
  "Composição (INT)": "attrIntel",
  "Criminologia (INT)": "attrIntel",
  "Criptografia (INT)": "attrIntel",
  "Dedução (INT)": "attrIntel",
  "Educação (INT)": "attrIntel",
  "Apostar (INT)": "attrIntel",
  
  // Perícias de Luta
  "Briga (COR)": "attrCor",
  "Evasão (COR)": "attrCor",
  "Artes Marciais x2 (COR)": "attrCor",
  "Armas Brancas (COR)": "attrCor",
  
  // Perícias de Armas
  "Arqueirismo (REF)": "attrRefl",
  "Automática x2 (REF)": "attrRefl",
  "Armas Curtas (REF)": "attrRefl",
  "Armas Pesadas x2 (REF)": "attrRefl",
  "Fuzil (REF)": "attrRefl",
  
  // Perícias Técnicas
  "Tecnologia de Veículos Aéreos (TEC)": "attrTec",
  "Tecnologia Básica (TEC)": "attrTec",
  "Cibertecnologia (TEC)": "attrTec",
  "Demolições x2 (TEC)": "attrTec",
  "Eletrônica/Tec. de Segurança x2 (TEC)": "attrTec",
  "Primeiros Socorros (TEC)": "attrTec",
  "Falsificação (TEC)": "attrTec",
  "Tecnologia de Veículo Terrestre (TEC)": "attrTec",
  "Pintar/Desenhar/Esculpir (TEC)": "attrTec",
  "Medicamentos x2 (TEC)": "attrTec",
  "Fotografia e Filmagem (TEC)": "attrTec",
  "Arrombamento (TEC)": "attrTec",
  "Furto (TEC)": "attrTec",
  "Tecnologia de Veículo Marítimo (TEC)": "attrTec",
  "Tecnologia de Armas/Armeiro (TEC)": "attrTec"
};

// Salvar dados do personagem
function salvarPersonagem() {
  const armorSelect = document.getElementById("charArmor").value;
  let armorValue = parseInt(armorSelect) || 0;
  
  // Se for customizada, pega o valor do input customizado
  if (armorSelect === "custom") {
    armorValue = parseInt(document.getElementById("charArmorCustom").value) || 0;
  }
  
  const personagem = {
    nome: document.getElementById("charName").value,
    nivel: parseInt(document.getElementById("charLevel").value) || 1,
    saude: parseInt(document.getElementById("charHealth").value) || 10,
    papel: document.getElementById("charRole").value,
    habilidadePapel: document.getElementById("charRoleAbility").value,
    humanidade: parseInt(document.getElementById("charHumanity").value) || 100,
    armadura: armorValue,
    atributos: {
      intel: parseInt(document.getElementById("attrIntel").value) || 3,
      refl: parseInt(document.getElementById("attrRefl").value) || 3,
      tec: parseInt(document.getElementById("attrTec").value) || 3,
      emp: parseInt(document.getElementById("attrEmp").value) || 3,
      sor: parseInt(document.getElementById("attrSor").value) || 3,
      for: parseInt(document.getElementById("attrFor").value) || 3,
      cor: parseInt(document.getElementById("attrCor").value) || 3,
      man: parseInt(document.getElementById("attrMan").value) || 3
    },
    pericias: {}
  };

  // Coletar dados das perícias
  document.querySelectorAll(".skill-item").forEach(skillItem => {
    const label = skillItem.querySelector("label").textContent;
    const levelInput = skillItem.querySelector(".skill-level");
    const level = parseInt(levelInput.value) || 0;
    
    if (level > 0) {
      personagem.pericias[label] = level;
    }
  });

  // Salvar no localStorage
  try {
    const chavePersonagem = obterChaveUsuario("cyberpunk_character");
    localStorage.setItem(chavePersonagem, JSON.stringify(personagem));
    console.log("✓ Personagem salvo:", personagem);
  } catch (error) {
    console.error("❌ Erro ao salvar personagem:", error);
    mostrarNotificacao("❌ Erro ao salvar personagem", "error");
  }
}

// Carregar dados do personagem
function carregarPersonagem() {
  try {
    const chavePersonagem = obterChaveUsuario("cyberpunk_character");
    const dados = localStorage.getItem(chavePersonagem);
    
    if (dados) {
      const personagem = JSON.parse(dados);
      
      // Preencher dados básicos
      document.getElementById("charName").value = personagem.nome || "";
      document.getElementById("charLevel").value = personagem.nivel || 1;
      document.getElementById("charHealth").value = personagem.saude || 10;
      document.getElementById("charRole").value = personagem.papel || "";
      document.getElementById("charRoleAbility").value = personagem.habilidadePapel || "";
      document.getElementById("charHumanity").value = personagem.humanidade || 100;
      
      // Restaurar armadura - verificar se é um preset ou customizada
      const armorValue = personagem.armadura || 0;
      const armorSelect = document.getElementById("charArmor");
      
      if (armorValue === 0) {
        armorSelect.value = "0";
      } else if (armorValue === 5) {
        armorSelect.value = "5";
      } else if (armorValue === 10) {
        armorSelect.value = "10";
      } else {
        armorSelect.value = "custom";
        document.getElementById("charArmorCustom").value = armorValue;
        document.getElementById("charArmorCustom").style.display = "block";
      }
      
      // Preencher atributos
      if (personagem.atributos) {
        document.getElementById("attrIntel").value = personagem.atributos.intel || 3;
        document.getElementById("attrRefl").value = personagem.atributos.refl || 3;
        document.getElementById("attrTec").value = personagem.atributos.tec || 3;
        document.getElementById("attrEmp").value = personagem.atributos.emp || 3;
        document.getElementById("attrSor").value = personagem.atributos.sor || 3;
        document.getElementById("attrFor").value = personagem.atributos.for || 3;
        document.getElementById("attrCor").value = personagem.atributos.cor || 3;
        document.getElementById("attrMan").value = personagem.atributos.man || 3;
      }
      
      // Preencher perícias
      if (personagem.pericias) {
        document.querySelectorAll(".skill-item").forEach(skillItem => {
          const label = skillItem.querySelector("label").textContent;
          const levelInput = skillItem.querySelector(".skill-level");
          
          if (personagem.pericias[label]) {
            levelInput.value = personagem.pericias[label];
          }
        });
      }
      
      atualizarPericiasAtributo();
      console.log("✓ Personagem carregado");
    }
  } catch (error) {
    console.error("❌ Erro ao carregar personagem:", error);
  }
}

// Atualizar cálculos das perícias
function atualizarPericiasAtributo() {
  document.querySelectorAll(".skill-item").forEach(skillItem => {
    const levelInput = skillItem.querySelector(".skill-level");
    const attrInput = skillItem.querySelector(".skill-attr");
    const baseInput = skillItem.querySelector(".skill-base");
    const attrId = levelInput.getAttribute("data-attr");
    
    const attrValue = parseInt(document.getElementById(attrId).value) || 0;
    const levelValue = parseInt(levelInput.value) || 0;
    const baseValue = attrValue + levelValue;
    
    attrInput.value = attrValue;
    baseInput.value = baseValue > 0 ? baseValue : "";
  });
  
  // Atualizar contadores de perícias
  atualizarContadoresPericia();
}

// Aumentar valor do atributo
function incrementarAtributo(attrId) {
  const input = document.getElementById(attrId);
  if (!input) return;
  
  let value = parseInt(input.value) || 0;
  if (value < 20) {
    input.value = value + 1;
    atualizarPericiasAtributo();
    atualizarCorAtributo(attrId);
  }
}

// Diminuir valor do atributo
function decrementarAtributo(attrId) {
  const input = document.getElementById(attrId);
  if (!input) return;
  
  let value = parseInt(input.value) || 0;
  if (value > 0) {
    input.value = value - 1;
    atualizarPericiasAtributo();
    atualizarCorAtributo(attrId);
  }
}

// Zerar valor do atributo
function zerarAtributo(attrId) {
  const input = document.getElementById(attrId);
  if (!input) return;
  
  input.value = 0;
  atualizarPericiasAtributo();
  atualizarCorAtributo(attrId);
}

// Atualizar cor de feedback do atributo
function atualizarCorAtributo(attrId) {
  const input = document.getElementById(attrId);
  if (!input) return;
  
  const value = parseInt(input.value) || 0;
  
  // Remover todas as classes de cor
  input.classList.remove("attr-low", "attr-medium", "attr-high", "attr-max");
  
  // Adicionar a cor apropriada
  if (value <= 2) {
    input.classList.add("attr-low");
  } else if (value <= 8) {
    input.classList.add("attr-medium");
  } else if (value <= 15) {
    input.classList.add("attr-high");
  } else {
    input.classList.add("attr-max");
  }
}

// Atualizar contadores de perícias por categoria
function atualizarContadoresPericia() {
  const categorias = {
    "atencao": 5,
    "corporais": 6,
    "conducao": 4,
    "educacao": 10,
    "luta": 4,
    "armas": 5,
    "tecnicas": 15
  };
  
  for (const [categoria, total] of Object.entries(categorias)) {
    const counter = document.querySelector(`.skill-category-count[data-category="${categoria}"]`);
    
    if (counter) {
      // Encontrar a categoria pai
      const categorySection = counter.closest(".skill-category");
      
      if (categorySection) {
        // Contar perícias preenchidas nesta categoria
        const skills = categorySection.querySelectorAll(".skill-item .skill-level");
        let preenchidas = 0;
        
        skills.forEach(levelInput => {
          const levelValue = parseInt(levelInput.value) || 0;
          if (levelValue > 0) {
            preenchidas++;
          }
        });
        
        // Atualizar o contador
        counter.textContent = `${preenchidas}/${total}`;
        
        // Adicionar classe 'active' se há perícias preenchidas
        if (preenchidas > 0) {
          counter.classList.add("active");
        } else {
          counter.classList.remove("active");
        }
      }
    }
  }
}

// Atualizar habilidade do papel quando o papel é selecionado
function atualizarHabilidadePapel(roleValue) {
  const habilidadeField = document.getElementById("charRoleAbility");
  
  if (roleValue && ROLE_ABILITIES[roleValue]) {
    const roleData = ROLE_ABILITIES[roleValue];
    habilidadeField.value = roleData.ability;
  } else {
    habilidadeField.value = "";
  }
}

// Atualizar valor de armadura quando selecionado preset
function atualizarValorArmadura(value) {
  const armorCustomInput = document.getElementById("charArmorCustom");
  
  if (value === "custom") {
    armorCustomInput.style.display = "block";
    // Não altera o valor de charArmor ainda, apenas mostra o input customizado
  } else {
    armorCustomInput.style.display = "none";
    // Select será preenchido com o valor selecionado
  }
}

// Filtrar perícias por busca
function filtrarPericia(termo) {
  const termoLower = termo.toLowerCase();
  const skillItems = document.querySelectorAll(".skill-item");
  const skillCategories = document.querySelectorAll(".skill-category");
  let totalResults = 0;
  let totalVisible = 0;
  
  // Primeiro, mostrar/esconder items baseado na busca
  skillItems.forEach(item => {
    const label = item.querySelector("label").textContent.toLowerCase();
    const matches = termo === "" || label.includes(termoLower);
    
    if (matches) {
      item.classList.remove("hidden");
      totalVisible++;
    } else {
      item.classList.add("hidden");
    }
  });
  
  // Depois, mostrar/esconder categorias que não têm items visíveis
  skillCategories.forEach(category => {
    const visibleItems = category.querySelectorAll(".skill-item:not(.hidden)");
    
    if (visibleItems.length > 0) {
      category.classList.remove("all-hidden");
      totalResults += visibleItems.length;
    } else {
      category.classList.add("all-hidden");
    }
  });
  
  // Atualizar contador de resultados
  const resultSpan = document.getElementById("skillSearchResult");
  if (termo === "") {
    resultSpan.textContent = "";
  } else {
    resultSpan.textContent = `${totalResults} resultado${totalResults !== 1 ? "s" : ""}`;
  }
}

// Limpar busca ao carregar personagem
function limparBuscaPericia() {
  const searchInput = document.getElementById("skillSearchInput");
  if (searchInput) {
    searchInput.value = "";
    filtrarPericia("");
  }
}

// Inicializar listeners para perícias
function inicializarPericiasListeners() {
  // Listeners para mudanças no nível de perícias
  document.querySelectorAll(".skill-level").forEach(input => {
    input.addEventListener("change", atualizarPericiasAtributo);
  });
  
  // Listeners para atributos
  document.querySelectorAll(".attr-value input").forEach(input => {
    input.addEventListener("change", () => {
      const attrId = input.id;
      atualizarPericiasAtributo();
      atualizarCorAtributo(attrId);
    });
  });
  
  // Carrega dados salvos
  carregarPersonagem();
  
  // Limpar busca ao carregar
  limparBuscaPericia();
  
  // Atualizar cores iniciais dos atributos
  document.querySelectorAll("[id^='attr']").forEach(input => {
    atualizarCorAtributo(input.id);
  });
  
  // Atualizar contadores de perícias
  atualizarContadoresPericia();
}

// Mostrar notificação (usa sistema de toast existente)
function mostrarNotificacao(mensagem, tipo = "success") {
  mostrarToast(mensagem, tipo);
}

// Atualizar visualização de saúde com barra e círculos de salvação
function atualizarVisualizacaoSaude() {
  const healthInput = document.getElementById("charHealth");
  const healthMaxInput = document.getElementById("charHealthMax");
  const healthValue = parseInt(healthInput.value) || 0;
  const maxHealth = parseInt(healthMaxInput.value) || 20;
  
  // Atualizar max do input de saúde atual
  healthInput.max = maxHealth;
  
  const healthPercent = Math.max(0, Math.min(100, (healthValue / maxHealth) * 100));
  
  // Atualizar barra de progresso
  const healthBarFill = document.getElementById("healthBarFill");
  const healthValueSpan = document.getElementById("healthValue");
  const salvationCircles = document.getElementById("salvationCircles");
  const btnRestore = document.querySelector(".btn-restore");
  
  healthBarFill.style.width = healthPercent + "%";
  healthValueSpan.textContent = `${healthValue}/${maxHealth}`;
  
  // Atualizar cores baseado no nível de saúde
  healthBarFill.classList.remove("critical", "warning", "good");
  healthValueSpan.classList.remove("critical-text");
  
  if (healthValue <= 0) {
    // Mostrar círculos de salvação e botão de restaurar
    healthBarFill.classList.add("critical");
    healthValueSpan.classList.add("critical-text");
    healthValueSpan.textContent = "MORTE ⚰️";
    salvationCircles.style.display = "flex";
    if (btnRestore) btnRestore.style.display = "block";
  } else if (healthValue <= Math.ceil(maxHealth * 0.25)) {
    healthBarFill.classList.add("critical");
    healthValueSpan.classList.add("critical-text");
    salvationCircles.style.display = "none";
    if (btnRestore) btnRestore.style.display = "none";
  } else if (healthValue <= Math.ceil(maxHealth * 0.5)) {
    healthBarFill.classList.add("warning");
    salvationCircles.style.display = "none";
    if (btnRestore) btnRestore.style.display = "none";
  } else {
    healthBarFill.classList.add("good");
    salvationCircles.style.display = "none";
    if (btnRestore) btnRestore.style.display = "none";
  }
  
  // Salvar automaticamente
  salvarPersonagem();
}

// Restaurar vida +1 ponto
function restaurarVida() {
  const healthInput = document.getElementById("charHealth");
  const healthValue = parseInt(healthInput.value) || 0;
  
  if (healthValue < 20) {
    healthInput.value = Math.min(20, healthValue + 1);
    atualizarVisualizacaoSaude();
  } else if (healthValue === 0) {
    // Se estiver morto, ressuscita com 1 ponto
    healthInput.value = 1;
    atualizarVisualizacaoSaude();
  }
}

// Clique nos círculos de salvação para usá-los
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    setupSalvationCircles();
  }, 100);
});

function setupSalvationCircles() {
  const salvationCircles = document.querySelectorAll(".salvation-circle");
  salvationCircles.forEach((circle, index) => {
    circle.addEventListener("click", () => {
      // Apenas apagar o círculo (marcar como usado)
      if (!circle.classList.contains("used")) {
        circle.classList.add("used");
        
        // Verificar se todos os círculos foram usados
        const allUsed = document.querySelectorAll(".salvation-circle.used").length === 3;
        
        if (allUsed) {
          // Todos os círculos apagaram - personagem morre
          const healthInput = document.getElementById("charHealth");
          healthInput.value = 0;
          atualizarVisualizacaoSaude();
        }
      }
    });
  });
}
