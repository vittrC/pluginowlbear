/**
 * Hacks Rápidos - Cyberpunk RED
 * Sistema completo de gerenciamento de hacks
 */

const STORAGE_KEY = "cyberpunk_hacks_rapidos";
const RAM_STORAGE_KEY = "cyberpunk_player_ram";
const CODEBREAKER_STORAGE_KEY = "cyberpunk_codebreaker";
let MAX_RAM = 25;
let USER_ID = null;

// Aguardar SDK do Owlbear estar pronto
OBR.onReady(async () => {
  // Obter ID único do usuário
  const party = await OBR.party.getParty();
  USER_ID = party.playerId;
  console.log("✓ Usuário conectado:", USER_ID);
  
  // Inicializar plugin
  inicializarPlugin();
});

function obterChaveUsuario(chave) {
  return `${USER_ID}_${chave}`;
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
    descricao: "Uma vez por dia você pode ter visão da lua para te auxiliar a encontrar lugares, objetos.. etc. lhe dando +10 no próximo teste das perícias de Atenção.",
    categoria: "Visão Especial",
    codigo: "bençãodalua0"
  },
  {
    id: "special_phantom",
    nome: "Hack Rápido - Corrente Fantasma",
    custoRAM: 5,
    dv: 14,
    descricao: "Você apaga temporariamente sua assinatura digital do campo. Nenhum efeito pode rastrear o netrunner e contra-hacks contra você falham automaticamente. Dura até o fim da cena ou até você executar outro hack. Falha: RAM é gasta normalmente e você é marcado.",
    categoria: "Ofuscação",
    codigo: "fantasma4040"
  },
  {
    id: "special_redqueen",
    nome: "Hack Rápido - Protocolo Redqueen",
    custoRAM: 7,
    dv: 16,
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
    descricao: "Força o alvo a desligar todos os sistemas por 1 rodada. O alvo não pode agir durante este tempo.",
    categoria: "Desativação"
  },
  {
    id: "sys_quickhack_2",
    nome: "Hack Rápido - Distrair Inimigos",
    custoRAM: 3,
    dv: 10,
    descricao: "Cria ruído nos sensores do alvo, aplicando -2 de REF na próxima ação. Efeito dura 1 rodada.",
    categoria: "Perturbação"
  },
  {
    id: "sys_quickhack_3",
    nome: "Hack Rápido - Protocolo de Invasão",
    custoRAM: 5,
    dv: 14,
    descricao: "Abre acesso avançado ao sistema neural do alvo, permitindo um segundo hacking na próxima rodada sem custo de RAM.",
    categoria: "Infiltração"
  },
  {
    id: "sys_zap",
    nome: "Hack Rápido - Zap",
    custoRAM: 3,
    dv: 13,
    descricao: "Causa 1d8 de dano cerebral e remove ações no próximo turno.",
    categoria: "Dano Cerebral"
  },
  {
    id: "sys_ping",
    nome: "Hack Rápido - Ping",
    custoRAM: 1,
    dv: 10,
    descricao: "Revela todos os dispositivos conectados na rede local.",
    categoria: "Reconhecimento"
  },
  {
    id: "sys_overheat",
    nome: "Hack Rápido - Overheat",
    custoRAM: 6,
    dv: 15,
    descricao: "Deixa o alvo queimando por 2d4 rodadas, pode espalhar o efeito para alvos próximos.",
    categoria: "Dano Contínuo"
  },
  {
    id: "sys_crash",
    nome: "Hack Rápido - Crash",
    custoRAM: 2,
    dv: 12,
    descricao: "Derruba um drone ou veículo remoto.",
    categoria: "Desativação"
  },
  {
    id: "sys_spike",
    nome: "Hack Rápido - Spike",
    custoRAM: 4,
    dv: 14,
    descricao: "Toma controle de um sistema ou câmera por 2 turnos.",
    categoria: "Controle"
  },
  {
    id: "sys_eyeburn",
    nome: "Hack Rápido - Eye Burn",
    custoRAM: 5,
    dv: 14,
    descricao: "Causa ofuscamento temporário. Alvo sofre -6 em ataques à distância por 1 turno.",
    categoria: "Incapacidade"
  },
  {
    id: "sys_flicker",
    nome: "Hack Rápido - Flicker",
    custoRAM: 3,
    dv: 14,
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
    await OBR.storage.setItems([{
      key: chave,
      value: JSON.stringify(hacks)
    }]);
    console.log("✓ Hacks salvos com sucesso:", hacks.length, "hacks");
    return true;
  } catch (error) {
    console.error("❌ Erro ao salvar hacks:", error);
    return false;
  }
}

async function carregarHacksLocal() {
  try {
    const chave = obterChaveUsuario(STORAGE_KEY);
    const dados = await OBR.storage.getItems([chave]);
    const hacksData = dados.length > 0 ? dados[0].value : null;
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
    await OBR.storage.setItems([{
      key: chave,
      value: JSON.stringify({ ram: ramAtual, max: ramMaximo })
    }]);
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
    const dados = await OBR.storage.getItems([chave]);
    const ramData = dados.length > 0 ? JSON.parse(dados[0].value) : { ram: 0, max: 25 };
    
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
  novoMax = Math.max(1, Math.min(parseInt(novoMax) || 25, 100));
  MAX_RAM = novoMax;
  
  // Garantir que RAM atual não exceda o novo máximo
  carregarRAMLocal().then(ramData => {
    let ramAtual = Math.min(ramData.ram, novoMax);
    salvarRAMLocal(ramAtual, novoMax).then(() => {
      renderizarRAM();
      console.log("✓ MAX_RAM definido para:", novoMax);
    });
  });
}

function aumentarRAM() {
  carregarRAMLocal().then(ramData => {
    if (ramData.ram < MAX_RAM) {
      ramData.ram++;
      salvarRAMLocal(ramData.ram, MAX_RAM).then(() => {
        renderizarRAM();
      });
    }
  });
}

function diminuirRAM() {
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
    hackElement.className = `hack-item ${isEspecial ? "hack-special" : ""}`;
    hackElement.innerHTML = `
      <div class="hack-header">
        <div class="hack-info">
          <h4 class="hack-name">${isEspecial ? "🔓 " : ""}${sanitizar(hack.nome)}</h4>
          <div class="hack-meta">
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
    container.appendChild(hackElement);
  });
}

// ============================================
// AÇÕES - Adicionar e excluir hacks
// ============================================

async function adicionarHack(event) {
  event.preventDefault();

  const nomeInput = document.getElementById("hackName");
  const ramInput = document.getElementById("hackRam");
  const dvInput = document.getElementById("hackDv");
  const effectInput = document.getElementById("hackEffect");
  const form = event.target;

  // Validar inputs
  if (!nomeInput || !ramInput || !dvInput) {
    alert("❌ Erro ao acessar formulário");
    return;
  }

  const nome = nomeInput.value.trim();
  const ram = parseInt(ramInput.value);
  const dv = parseInt(dvInput.value);
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

  // Criar hack
  const novoHack = {
    id: Date.now().toString(),
    nome: nome,
    custoRAM: ram,
    dv: dv,
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
// INICIALIZAÇÃO
// ============================================

async function inicializarPlugin() {
  console.log("📋 Inicializando Hacks Rápidos...");

  try {
    // Carregar dados do usuário
    const ramData = await carregarRAMLocal();
    MAX_RAM = ramData.max;
    console.log("✓ MAX_RAM carregado:", MAX_RAM);

    // Obter formulário
    const form = document.getElementById("hackForm");
    if (!form) {
      console.error("❌ Formulário não encontrado no DOM");
      return;
    }

    // Adicionar listener do formulário
    form.addEventListener("submit", adicionarHack);

    // Configurar abas
    const tabButtons = document.querySelectorAll(".tab-btn");
    console.log("✓ Botões de abas encontrados:", tabButtons.length);
    
    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const tabId = btn.getAttribute("data-tab");
        console.log("✓ Clicado na aba:", tabId);
        abrirAba(tabId);
      });
    });

    // Configurar busca de mercado
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      console.log("✓ Campo de busca encontrado");
      searchInput.addEventListener("input", (e) => {
        console.log("✓ Buscando:", e.target.value);
        renderizarMercado(e.target.value);
      });
    } else {
      console.warn("⚠️ Campo de busca não encontrado");
    }

    // Renderizar hacks salvos
    console.log("✓ Renderizando hacks salvos...");
    await renderizarHacks();

    // Renderizar mercado inicial
    console.log("✓ Renderizando mercado inicial...");
    renderizarMercado();

    // Renderizar RAM inicial
    console.log("✓ Renderizando RAM...");
    await renderizarRAM();

    // Renderizar hacks desbloqueados do Code Breaker
    console.log("✓ Renderizando hacks desbloqueados...");
    renderizarHacksDesbloqueados();

    console.log("✓ Plugin pronto!");
  } catch (error) {
    console.error("❌ Erro ao inicializar plugin:", error);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("📋 Aguardando conexão com Owlbear Rodeo...");
});

// ============================================
// CODE BREAKER - Sistema de Desbloqueio
// ============================================

async function carregarCodigosDesbloqueados() {
  try {
    const chave = obterChaveUsuario(CODEBREAKER_STORAGE_KEY);
    const dados = await OBR.storage.getItems([chave]);
    return dados.length > 0 ? JSON.parse(dados[0].value) : [];
  } catch (error) {
    console.error("❌ Erro ao carregar códigos desbloqueados:", error);
    return [];
  }
}

async function salvarCodigosDesbloqueados(codigos) {
  try {
    const chave = obterChaveUsuario(CODEBREAKER_STORAGE_KEY);
    await OBR.storage.setItems([{
      key: chave,
      value: JSON.stringify(codigos)
    }]);
    console.log("✓ Códigos desbloqueados salvos");
    return true;
  } catch (error) {
    console.error("❌ Erro ao salvar códigos:", error);
    return false;
  }
}

function tentarDesbloqueio() {
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
    salvarCodigosDesbloqueados(codigosDesbloqueados);

    codeMessage.textContent = `✓ Hack desbloqueado com sucesso: "${hackEspecial.nome}"!`;
    codeMessage.className = "codebreaker-message success";
    codeInput.value = "";

    // Atualizar a exibição de hacks desbloqueados
    renderizarHacksDesbloqueados();

    console.log("✓ Hack especial desbloqueado:", hackEspecial.nome);
  });
}

function renderizarHacksDesbloqueados() {
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

