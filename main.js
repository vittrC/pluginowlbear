async function init() {
  await OBR.onReady();
  renderizarLista();
}

document.getElementById("btnNovo").onclick = async () => {
  const hacks = await carregarHacks();

  hacks.push({
    id: crypto.randomUUID(),
    nome: "Novo Hack",
    custoRAM: 1,
    dv: 12,
    tipo: "utilitário",
    descricao: "Edite este hack."
  });

  await salvarHacks(hacks);
  renderizarLista();
};

init();
