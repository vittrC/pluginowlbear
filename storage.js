// Chave para armazenamento persistente no OBR
const HACKS_STORAGE_KEY = "cyberpunk.red.hacks.rapidos";

/**
 * Carrega todos os hacks armazenados
 * @returns {Promise<Array>} Array de hacks
 */
async function carregarHacks() {
  try {
    const data = await OBR.storage.getMetadata(HACKS_STORAGE_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Erro ao carregar hacks:", error);
    return [];
  }
}

/**
 * Salva hacks no armazenamento
 * @param {Array} hacks - Array de hacks a salvar
 */
async function salvarHacks(hacks) {
  try {
    if (!Array.isArray(hacks)) {
      throw new Error("hacks deve ser um array");
    }
    await OBR.storage.setMetadata(HACKS_STORAGE_KEY, hacks);
  } catch (error) {
    console.error("Erro ao salvar hacks:", error);
    alert("Erro ao salvar hack. Tente novamente.");
  }
}
