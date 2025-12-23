/**
 * Hacks Rápidos - Cyberpunk RED
 * Sistema completo de gerenciamento de hacks
 */

const STORAGE_KEY = "cyberpunk_hacks_rapidos";

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

  // Obter formulário
  const form = document.getElementById("hackForm");
  if (!form) {
    console.error("❌ Formulário não encontrado no DOM");
    return;
  }

  // Adicionar listener do formulário
  form.addEventListener("submit", adicionarHack);

  // Renderizar hacks salvos
  renderizarHacks();

  console.log("✓ Plugin pronto!");
});
