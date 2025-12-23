const storageKey = "hacksRapidos";

async function loadHacks() {
  return (await OBR.storage.local.get(storageKey)) || [];
}

async function saveHacks(hacks) {
  await OBR.storage.local.set({ [storageKey]: hacks });
}

async function renderHacks() {
  const list = document.getElementById("hackList");
  list.innerHTML = "";

  const hacks = await loadHacks();

  hacks.forEach((hack, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${hack.name}</strong><br>
      RAM: ${hack.ram} | DV: ${hack.dv}<br>
      <em>${hack.effect}</em><br>
      <button onclick="deleteHack(${index})">Excluir</button>
    `;
    list.appendChild(li);
  });
}

async function deleteHack(index) {
  const hacks = await loadHacks();
  hacks.splice(index, 1);
  await saveHacks(hacks);
  renderHacks();
}

document.getElementById("hackForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const hack = {
    name: name.value,
    ram: ram.value,
    dv: dv.value,
    effect: effect.value
  };

  const hacks = await loadHacks();
  hacks.push(hack);
  await saveHacks(hacks);

  e.target.reset();
  renderHacks();
});

renderHacks();
