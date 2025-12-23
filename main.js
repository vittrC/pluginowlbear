// Aguarda inicialização do OBR SDK
OBR.onReady(async () => {
  // Inicializar quando plugin carrega
  await renderizarHacks();

  // Event listener para formulário
  document.getElementById("hackForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const hack = {
      id: Date.now().toString(), // ID único para cada hack
      nome: document.getElementById("hackName").value.trim(),
      custoRAM: parseInt(document.getElementById("hackRam").value),
      dv: parseInt(document.getElementById("hackDv").value),
      descricao: document.getElementById("hackEffect").value.trim(),
      criadoEm: new Date().toISOString()
    };

    // Validação básica
    if (!hack.nome || hack.custoRAM < 1 || hack.dv < 0) {
      alert("Preencha todos os campos corretamente");
      return;
    }

    const hacks = await carregarHacks();
    hacks.push(hack);
    await salvarHacks(hacks);

    // Limpar formulário e atualizar lista
    e.target.reset();
    await renderizarHacks();
  });
});

async function renderizarHacks() {
  const hacks = await carregarHacks();
  const container = document.getElementById("hackList");
  const emptyState = document.getElementById("emptyState");

  container.innerHTML = "";

  if (hacks.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  hacks.forEach((hack, index) => {
    const hackElement = document.createElement("div");
    hackElement.className = "hack-item";
    hackElement.innerHTML = `
      <div class="hack-header">
        <h3>${hack.nome}</h3>
        <button class="btn-delete" onclick="excluirHack(${index})" title="Excluir">✕</button>
      </div>
      <div class="hack-stats">
        <span class="stat">RAM: <strong>${hack.custoRAM}</strong></span>
        <span class="stat">DV: <strong>${hack.dv}</strong></span>
      </div>
      ${hack.descricao ? `<p class="hack-desc">${hack.descricao}</p>` : ""}
    `;
    container.appendChild(hackElement);
  });
}

async function excluirHack(index) {
  if (confirm("Tem certeza que deseja excluir este hack?")) {
    const hacks = await carregarHacks();
    hacks.splice(index, 1);
    await salvarHacks(hacks);
    await renderizarHacks();
  }
}
