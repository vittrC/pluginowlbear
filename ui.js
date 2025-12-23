async function renderizarLista() {
  const hacks = await carregarHacks();
  const ul = document.getElementById("listaHacks");
  ul.innerHTML = "";

  hacks.forEach(hack => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${hack.nome}</strong><br>
      RAM: ${hack.custoRAM} | DV: ${hack.dv}<br>
      ${hack.descricao}
    `;
    ul.appendChild(li);
  });
}
