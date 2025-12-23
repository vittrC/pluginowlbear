// Aguarda inicialização do OBR SDK
async function inicializarPlugin() {
  try {
    // Inicializar storage
    await inicializarStorage();

    // Renderizar hacks ao carregar
    await renderizarHacks();

    // Event listener para formulário
    const form = document.getElementById("hackForm");
    if (!form) {
      console.error("❌ Formulário não encontrado");
      return;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Obter elementos de forma segura
      const nomeElement = document.getElementById("hackName");
      const ramElement = document.getElementById("hackRam");
      const dvElement = document.getElementById("hackDv");
      const effectElement = document.getElementById("hackEffect");

      if (!nomeElement || !ramElement || !dvElement) {
        console.error("❌ Elementos do formulário não encontrados");
        alert("Erro ao acessar formulário. Recarregue a página.");
        return;
      }

      const hack = {
        id: Date.now().toString(),
        nome: nomeElement.value.trim(),
        custoRAM: parseInt(ramElement.value),
        dv: parseInt(dvElement.value),
        descricao: effectElement.value.trim(),
        criadoEm: new Date().toISOString()
      };

      // Validação básica
      if (!hack.nome || hack.custoRAM < 1 || hack.dv < 0) {
        alert("⚠ Preencha todos os campos corretamente");
        return;
      }

      try {
        const hacks = await carregarHacks();
        hacks.push(hack);
        await salvarHacks(hacks);

        console.log("✓ Hack adicionado:", hack.nome);

        // Limpar formulário e atualizar lista
        form.reset();
        await renderizarHacks();
      } catch (error) {
        console.error("❌ Erro ao salvar hack:", error);
        alert("Erro ao salvar. Tente novamente.");
      }
    });

    console.log("✓ Plugin inicializado com sucesso");
  } catch (error) {
    console.error("❌ Erro ao inicializar plugin:", error);
  }
}

async function renderizarHacks() {
  try {
    const hacks = await carregarHacks();
    const container = document.getElementById("hackList");
    const emptyState = document.getElementById("emptyState");
    const counter = document.getElementById("hackCount");

    if (!container || !emptyState) {
      console.error("❌ Elementos de lista não encontrados");
      return;
    }

    container.innerHTML = "";

    // Atualizar contador
    if (counter) {
      counter.textContent = hacks.length;
    }

    if (hacks.length === 0) {
      emptyState.style.display = "flex";
      return;
    }

    emptyState.style.display = "none";

    hacks.forEach((hack, index) => {
      const hackElement = document.createElement("div");
      hackElement.className = "hack-item";
      hackElement.innerHTML = `
        <div class="hack-header">
          <div class="hack-info">
            <h4 class="hack-name">${escapeHtml(hack.nome)}</h4>
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
            ? `<p class="hack-desc">${escapeHtml(hack.descricao)}</p>`
            : ""
        }
      `;
      container.appendChild(hackElement);
    });
  } catch (error) {
    console.error("❌ Erro ao renderizar hacks:", error);
  }
}

async function excluirHack(index) {
  if (confirm("Tem certeza que deseja excluir este hack?")) {
    try {
      const hacks = await carregarHacks();
      const hackExcluido = hacks[index];
      hacks.splice(index, 1);
      await salvarHacks(hacks);
      console.log("✓ Hack excluído:", hackExcluido.nome);
      await renderizarHacks();
    } catch (error) {
      console.error("❌ Erro ao excluir hack:", error);
      alert("Erro ao excluir. Tente novamente.");
    }
  }
}

// Função auxiliar para escapar HTML e evitar XSS
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Inicializar plugin
console.log("📋 Carregando plugin Hacks Rápidos...");

// Aguardar que o DOM esteja pronto
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    console.log("✓ DOM carregado");
    inicializarPlugin();
  });
} else {
  console.log("✓ DOM já estava pronto");
  inicializarPlugin();
}

// Se OBR estiver disponível, também usar onReady como fallback
if (typeof window.OBR !== "undefined" && window.OBR.onReady) {
  console.log("✓ OBR SDK detectado, aguardando onReady...");
  window.OBR.onReady(async () => {
    console.log("✓ OBR.onReady disparado");
    await renderizarHacks();
  });
}
