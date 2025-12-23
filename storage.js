// Chave para armazenamento persistente
const HACKS_STORAGE_KEY = "cyberpunk.red.hacks.rapidos";
let useLocalStorage = false;

/**
 * Verifica e inicializa o sistema de storage
 */
async function inicializarStorage() {
  try {
    // Verificar se OBR está disponível
    if (typeof window.OBR !== "undefined" && window.OBR.storage) {
      console.log("✓ OBR SDK disponível, usando armazenamento do OBR");
      useLocalStorage = false;
      return true;
    } else {
      console.warn(
        "⚠ OBR SDK não disponível, usando localStorage como fallback"
      );
      useLocalStorage = true;
      return true;
    }
  } catch (error) {
    console.warn("⚠ Erro ao verificar OBR, usando localStorage:", error);
    useLocalStorage = true;
    return true;
  }
}

/**
 * Carrega todos os hacks armazenados
 * @returns {Promise<Array>} Array de hacks
 */
async function carregarHacks() {
  try {
    let data;

    if (!useLocalStorage && typeof window.OBR !== "undefined") {
      // Tentar usar OBR storage
      try {
        data = await window.OBR.storage.getMetadata(HACKS_STORAGE_KEY);
      } catch (obrError) {
        console.warn("Erro ao ler do OBR, usando localStorage:", obrError);
        useLocalStorage = true;
      }
    }

    if (useLocalStorage) {
      // Fallback para localStorage
      const stored = localStorage.getItem(HACKS_STORAGE_KEY);
      data = stored ? JSON.parse(stored) : null;
    }

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

    if (!useLocalStorage && typeof window.OBR !== "undefined") {
      // Tentar usar OBR storage
      try {
        await window.OBR.storage.setMetadata(HACKS_STORAGE_KEY, hacks);
        console.log("✓ Hacks salvos no OBR");
        return;
      } catch (obrError) {
        console.warn("Erro ao salvar no OBR, usando localStorage:", obrError);
        useLocalStorage = true;
      }
    }

    // Fallback para localStorage
    localStorage.setItem(HACKS_STORAGE_KEY, JSON.stringify(hacks));
    console.log("✓ Hacks salvos no localStorage");
  } catch (error) {
    console.error("Erro ao salvar hacks:", error);
    throw error;
  }
}
