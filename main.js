/**
 * Hacks Rápidos - Cyberpunk RED
 * Sistema completo de gerenciamento de hacks
 */

const STORAGE_KEY = "cyberpunk_hacks_rapidos";
const RAM_STORAGE_KEY = "cyberpunk_player_ram";
let MAX_RAM = 25;  // Dinâmico, será definido pelo usuário

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
    nome: "Quickhack - Distract Enemies",
    custoRAM: 3,
    dv: 10,
    descricao: "Cria ruído nos sensores do alvo, aplicando -2 na próxima ação. Efeito dura 1 rodada.",
    categoria: "Perturbação"
  },
  {
    id: "sys_quickhack_3",
    nome: "Quickhack - Breach Protocol",
    custoRAM: 5,
    dv: 14,
    descricao: "Abre acesso avançado ao sistema neural do alvo, permitindo um segundo hacking na próxima rodada sem custo de RAM.",
    categoria: "Infiltração"
  }
];

// ============================================
// STORAGE - Gerenciar dados localmente
// ============================================

function salvarHacksLocal(hacks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hacks));
    console.log("✓ Hacks salvos com sucesso:", hacks.length, "hacks");
    return true;
  } catch (error) {
    console.error("❌ Erro ao salvar hacks:", error);
    return false;
  }
}

function carregarHacksLocal() {
  try {
    const dados = localStorage.getItem(STORAGE_KEY);
    const hacks = dados ? JSON.parse(dados) : [];
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

function salvarRAMLocal(ramAtual, ramMaximo = MAX_RAM) {
  try {
    localStorage.setItem(RAM_STORAGE_KEY, JSON.stringify({ ram: ramAtual, max: ramMaximo }));
    console.log("✓ RAM salvo:", ramAtual, "/", ramMaximo);
    return true;
  } catch (error) {
    console.error("❌ Erro ao salvar RAM:", error);
    return false;
  }
}

function carregarRAMLocal() {
  try {
    const dados = localStorage.getItem(RAM_STORAGE_KEY);
    const ramData = dados ? JSON.parse(dados) : { ram: 0, max: 25 };
    
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
  let ramData = carregarRAMLocal();
  let ramAtual = Math.min(ramData.ram, novoMax);
  
  salvarRAMLocal(ramAtual, novoMax);
  renderizarRAM();
  console.log("✓ MAX_RAM definido para:", novoMax);
}

function aumentarRAM() {
  let ramData = carregarRAMLocal();
  if (ramData.ram < MAX_RAM) {
    ramData.ram++;
    salvarRAMLocal(ramData.ram, MAX_RAM);
    renderizarRAM();
  }
}

function diminuirRAM() {
  let ramData = carregarRAMLocal();
  if (ramData.ram > 0) {
    ramData.ram--;
    salvarRAMLocal(ramData.ram, MAX_RAM);
    renderizarRAM();
  }
}

function resetarRAM() {
  salvarRAMLocal(0, MAX_RAM);
  renderizarRAM();
}

function renderizarRAM() {
  let ramData = carregarRAMLocal();
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

function renderizarHacks() {
  const hacks = carregarHacksLocal();
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
    hackElement.className = "hack-item";
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

function adicionarHack(event) {
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
  const hacks = carregarHacksLocal();
  hacks.push(novoHack);
  
  if (salvarHacksLocal(hacks)) {
    console.log("✓ Novo hack adicionado:", nome);
    form.reset();
    renderizarHacks();
  } else {
    alert("❌ Erro ao salvar hack");
  }
}

function importarHack(hackId) {
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

  const hacks = carregarHacksLocal();
  hacks.push(novoHack);
  
  if (salvarHacksLocal(hacks)) {
    console.log("✓ Hack importado:", hackOriginal.nome);
    renderizarHacks();
    abrirAba("cyberdeck");
    alert(`✓ "${hackOriginal.nome}" adicionado ao seu cyberdeck!`);
  } else {
    alert("❌ Erro ao importar hack");
  }
}

function excluirHack(index) {
  if (!confirm("Tem certeza que deseja excluir este hack?")) {
    return;
  }

  const hacks = carregarHacksLocal();
  
  if (index < 0 || index >= hacks.length) {
    alert("❌ Hack não encontrado");
    return;
  }

  const nomeDeletado = hacks[index].nome;
  hacks.splice(index, 1);

  if (salvarHacksLocal(hacks)) {
    console.log("✓ Hack excluído:", nomeDeletado);
    renderizarHacks();
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

document.addEventListener("DOMContentLoaded", function () {
  console.log("📋 Inicializando Hacks Rápidos...");

  // Aguardar um pouco para garantir que o DOM está totalmente pronto
  setTimeout(() => {
    // Carregar MAX_RAM do localStorage
    let ramData = carregarRAMLocal();
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
    renderizarHacks();

    // Renderizar mercado inicial
    console.log("✓ Renderizando mercado inicial...");
    renderizarMercado();

    // Renderizar RAM inicial
    console.log("✓ Renderizando RAM...");
    renderizarRAM();

    console.log("✓ Plugin pronto!");
  }, 100);
});
