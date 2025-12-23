const HACKS_KEY = "cyberpunk.hacksRapidos";

async function carregarHacks() {
  const metadata = await OBR.room.getMetadata();
  return metadata[HACKS_KEY] || [];
}

async function salvarHacks(hacks) {
  await OBR.room.setMetadata({
    [HACKS_KEY]: hacks
  });
}
