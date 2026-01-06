/**
 * Hacks Rápidos - Cyberpunk RED
 * Sistema completo de gerenciamento de hacks
 */

console.log("🚀 Script main.js carregado!");

// ============================================
// MAPEAMENTO DE TIPOS DE HACKS
// ============================================

const HACK_TYPES = {
  quickhacking: { icon: "⚡", nome: "Quickhacking", color: "#00d946" },
  intrusion: { icon: "🔓", nome: "Infiltração", color: "#e91e8c" },
  stealth: { icon: "🥷", nome: "Furtividade", color: "#64c8ff" },
  combat: { icon: "⚔️", nome: "Combate", color: "#ff3d5c" },
  control: { icon: "🎮", nome: "Controle", color: "#ffb800" },
  utility: { icon: "🔧", nome: "Utilitário", color: "#64ffc8" },
  reconnaissance: { icon: "🔍", nome: "Reconhecimento", color: "#c896ff" },
  damage: { icon: "💥", nome: "Dano", color: "#ff6432" }
};

// ============================================
// SISTEMA DE TRADUÇÃO MULTILÍNGUE COMPLETO
// ============================================

const LANGUAGE_STRINGS = {
  "pt-BR": {
    // Header
    hacksRapidos: "Hacks Rápidos",
    gerenciadorHacks: "Gerenciador de Hacks - Cyberpunk RED",
    
    // RAM Section
    suaRAM: "SUA RAM",
    maxRAM: "Max RAM",
    diminuirRAM: "Diminuir 1 RAM",
    resetarRAM: "Resetar RAM",
    aumentarRAM: "Aumentar 1 RAM",
    definirMaxRAM: "Defina seu máximo de RAM (1-100)",
    
    // Novo Hack Form
    novoHack: "Novo Hack",
    nomeHack: "Nome do Hack",
    exQuickhacking: "Ex: Quickhacking",
    custoRAM: "Custo de RAM",
    costRAMRange: "1-20",
    dv: "DV",
    dvRange: "0-20",
    tipo: "Tipo de Hack",
    selecioneTipo: "Selecione um tipo...",
    efeito: "Efeito do Hack",
    efetoDesc: "Descreva o efeito e as mecânicas do hack...",
    maxChar500: "Máximo 500 caracteres",
    notas: "Notas Personalizadas",
    notasDesc: "Anotações do mestre, customizações, histórico...",
    adicionarHack: "Adicionar Hack",
    
    // Abas
    tabPersonagem: "Personagem",
    tabCyberdeck: "Seu Cyberdeck",
    tabMarket: "Pesquisa de Hacks",
    tabCodebreaker: "Code Breaker",
    tabSettings: "Preferências",
    
    // Tipos de Hack
    quickhacking: "Quickhacking",
    infiltracao: "Infiltração",
    furtividade: "Furtividade",
    combate: "Combate",
    controle: "Controle",
    utilitario: "Utilitário",
    reconhecimento: "Reconhecimento",
    dano: "Dano",
    
    // Ficha de Personagem
    fichaPersonagem: "Ficha de Personagem",
    nomePersonagem: "Nome do Personagem",
    digitarNomePersonagem: "Digite o nome do seu personagem",
    nivel: "Nível",
    papel: "Papel",
    selecionePapel: "Selecione um papel...",
    saudeMaxima: "Saúde Máxima",
    saudeAtual: "Saúde Atual",
    armadura: "Armadura",
    nenhuma: "Nenhuma",
    leve: "Leve",
    pesada: "Pesada",
    customizada: "Customizada",
    valorCustomizado: "Valor customizado",
    humanidade: "Humanidade",
    habilidadePapel: "Habilidade de Papel",
    descreverHabilidade: "Descreva a habilidade especial de seu papel",
    salvarPersonagem: "Salvar Personagem",
    
    // Papéis
    solo: "Solo",
    trilhaRede: "Trilha-Rede",
    tecnico: "Técnico",
    medtech: "Medtech",
    roqueiro: "Roqueiro (Rockerboy)",
    midia: "Mídia",
    executivo: "Executivo",
    fixer: "Fixer",
    nomade: "Nômade",
    policial: "Policial",
    
    // Atributos
    atributos: "Atributos",
    inteligencia: "Inteligência",
    reflexos: "Reflexos",
    tecnicoAttr: "Técnico",
    empatia: "Empatia",
    sorte: "Sorte",
    forca: "Força",
    destreza: "Destreza",
    corpo: "Corpo",
    manuseio: "Manuseio",
    
    // Perícias
    pericias: "Perícias",
    buscarPericia: "Buscar perícia (nome ou atributo)...",
    resultado: "resultado",
    resultados: "resultados",
    pericias_atencao: "Perícias de Atenção",
    pericias_corporais: "Perícias Corporais",
    pericias_conducao: "Perícias de Condução",
    pericias_educacao: "Perícias de Educação",
    pericias_luta: "Perícias de Luta",
    pericias_armas: "Perícias de Armas",
    pericias_tecnicas: "Perícias Técnicas",
    
    // Nomes das Perícias de Atenção
    concentracao: "Concentração",
    ocultarRevelar: "Ocultar/Revelar Objeto",
    leituraLabial: "Leitura Labial",
    percepcao: "Percepção",
    rastrear: "Rastrear",
    
    // Nomes das Perícias Corporais
    atletismo: "Atletismo",
    contorcionismo: "Contorcionismo",
    dancar: "Dançar",
    resistencia: "Resistência",
    resistenciaTortura: "Resistência à Tortura/Drogas",
    furtividade: "Furtividade",
    
    // Nomes das Perícias de Condução
    dirigirTerrestre: "Dirigir Veículo Terrestre",
    pilotarAereo: "Pilotar Veículo Aéreo x2",
    pilotarMaritimo: "Pilotar Veículo Marítimo",
    motocicleta: "Motocicleta",
    
    // Nomes das Perícias de Educação
    contabilidade: "Contabilidade",
    lidarAnimais: "Lidar com Animais",
    burocracia: "Burocracia",
    negocios: "Negócios",
    composicao: "Composição",
    criminologia: "Criminologia",
    criptografia: "Criptografia",
    deducao: "Dedução",
    educacao: "Educação",
    apostar: "Apostar",
    
    // Nomes das Perícias de Luta
    briga: "Briga",
    evasao: "Evasão",
    artesMarciais: "Artes Marciais x2",
    armasBrancas: "Armas Brancas",
    
    // Nomes das Perícias de Armas
    arqueirismo: "Arqueirismo",
    automatica: "Automática x2",
    armasCurtas: "Armas Curtas",
    armasPesadas: "Armas Pesadas x2",
    fuzil: "Fuzil",
    
    // Nomes das Perícias Técnicas
    vehiculosAereos: "Tecnologia de Veículos Aéreos",
    tecnologiaBasica: "Tecnologia Básica",
    cibertecnologia: "Cibertecnologia",
    demolicoes: "Demolições x2",
    eletronica: "Eletrônica/Tec. de Segurança x2",
    primeirosSocorros: "Primeiros Socorros",
    falsificacao: "Falsificação",
    vehiculosTerrestre: "Tecnologia de Veículo Terrestre",
    pintar: "Pintar/Desenhar/Esculpir",
    medicamentos: "Medicamentos x2",
    fotografia: "Fotografia e Filmagem",
    arrombamento: "Arrombamento",
    furto: "Furto",
    vehiculosMaritimo: "Tecnologia de Veículo Marítimo",
    tecnologiaArmas: "Tecnologia de Armas/Armeiro",
    
    // Tabela de Skills
    pericia: "Perícia",
    nivel: "Nível",
    atrib: "Atrib.",
    base: "Base",
    
    // Cyberdeck
    seoCyberdeck: "Seu Cyberdeck",
    ciberdeckVazio: "Seu cyberdeck está vazio",
    criarPrimeiroHack: "Crie seu primeiro hack preenchendo o formulário acima",
    
    // Market
    hacksDisponiveis: "Hacks Disponíveis",
    buscarHacks: "Buscar hacks do sistema...",
    
    // Code Breaker
    codeBreaker: "Code Breaker",
    codigoDescricao: "Digite um código de 12 caracteres para desbloquear hacks especiais",
    inserirCodigo: "Insira o código (12 caracteres)...",
    
    // Settings
    preferencias: "Preferências",
    idioma: "Idioma / Language",
    escolherIdioma: "Escolha o idioma da interface",
    portugueseBR: "Português (BR)",
    englishUS: "English (US)",
    
    // Modal de Edição
    editarHack: "Editar Hack",
    fechar: "✕",
    
    // Botões gerais
    salvar: "Salvar",
    cancelar: "Cancelar",
    editar: "Editar",
    deletar: "Deletar",
    buscar: "Buscar",
    desbloquear: "Desbloquear",
    restaurarVida: "Restaurar +1 ponto de vida"
  },
  "en-US": {
    // Header
    hacksRapidos: "Quick Hacks",
    gerenciadorHacks: "Hack Manager - Cyberpunk RED",
    
    // RAM Section
    suaRAM: "YOUR RAM",
    maxRAM: "Max RAM",
    diminuirRAM: "Decrease 1 RAM",
    resetarRAM: "Reset RAM",
    aumentarRAM: "Increase 1 RAM",
    definirMaxRAM: "Set your maximum RAM (1-100)",
    
    // Novo Hack Form
    novoHack: "New Hack",
    nomeHack: "Hack Name",
    exQuickhacking: "Ex: Quickhacking",
    custoRAM: "RAM Cost",
    costRAMRange: "1-20",
    dv: "DV",
    dvRange: "0-20",
    tipo: "Hack Type",
    selecioneTipo: "Select a type...",
    efeito: "Hack Effect",
    efetoDesc: "Describe the effect and mechanics of the hack...",
    maxChar500: "Maximum 500 characters",
    notas: "Custom Notes",
    notasDesc: "GM notes, customizations, history...",
    adicionarHack: "Add Hack",
    
    // Tabs
    tabPersonagem: "Character",
    tabCyberdeck: "Your Cyberdeck",
    tabMarket: "Hacks Research",
    tabCodebreaker: "Code Breaker",
    tabSettings: "Preferences",
    
    // Hack Types
    quickhacking: "Quickhacking",
    infiltracao: "Infiltration",
    furtividade: "Stealth",
    combate: "Combat",
    controle: "Control",
    utilitario: "Utility",
    reconhecimento: "Reconnaissance",
    dano: "Damage",
    
    // Character Sheet
    fichaPersonagem: "Character Sheet",
    nomePersonagem: "Character Name",
    digitarNomePersonagem: "Enter your character name",
    nivel: "Level",
    papel: "Role",
    selecionePapel: "Select a role...",
    saudeMaxima: "Max Health",
    saudeAtual: "Current Health",
    armadura: "Armor",
    nenhuma: "None",
    leve: "Light",
    pesada: "Heavy",
    customizada: "Custom",
    valorCustomizado: "Custom value",
    humanidade: "Humanity",
    habilidadePapel: "Role Ability",
    descreverHabilidade: "Describe your role's special ability",
    salvarPersonagem: "Save Character",
    
    // Roles
    solo: "Solo",
    trilhaRede: "Netrunner",
    tecnico: "Technician",
    medtech: "Medtech",
    roqueiro: "Rockerboy",
    midia: "Media",
    executivo: "Executive",
    fixer: "Fixer",
    nomade: "Nomad",
    policial: "Cop",
    
    // Attributes
    atributos: "Attributes",
    inteligencia: "Intelligence",
    reflexos: "Reflexes",
    tecnicoAttr: "Technical",
    empatia: "Empathy",
    sorte: "Luck",
    forca: "Strength",
    destreza: "Dexterity",
    corpo: "Body",
    manuseio: "Handling",
    
    // Skills
    pericias: "Skills",
    buscarPericia: "Search skill (name or attribute)...",
    resultado: "result",
    resultados: "results",
    pericias_atencao: "Attention Skills",
    pericias_corporais: "Body Skills",
    pericias_conducao: "Driving Skills",
    pericias_educacao: "Education Skills",
    pericias_luta: "Combat Skills",
    pericias_armas: "Weapons Skills",
    pericias_tecnicas: "Technical Skills",
    
    // Attention Skills
    concentracao: "Concentration",
    ocultarRevelar: "Hide/Reveal Object",
    leituraLabial: "Lip Reading",
    percepcao: "Perception",
    rastrear: "Track",
    
    // Body Skills
    atletismo: "Athletics",
    contorcionismo: "Contortionism",
    dancar: "Dance",
    resistencia: "Endurance",
    resistenciaTortura: "Torture/Drug Resistance",
    furtividade: "Stealth",
    
    // Driving Skills
    dirigirTerrestre: "Drive Land Vehicle",
    pilotarAereo: "Pilot Aerial Vehicle x2",
    pilotarMaritimo: "Pilot Marine Vehicle",
    motocicleta: "Motorcycle",
    
    // Education Skills
    contabilidade: "Accounting",
    lidarAnimais: "Animal Handling",
    burocracia: "Bureaucracy",
    negocios: "Business",
    composicao: "Composition",
    criminologia: "Criminology",
    criptografia: "Cryptography",
    deducao: "Deduction",
    educacao: "Education",
    apostar: "Gambling",
    
    // Combat Skills
    briga: "Brawling",
    evasao: "Evasion",
    artesMarciais: "Martial Arts x2",
    armasBrancas: "Melee Weapons",
    
    // Weapons Skills
    arqueirismo: "Archery",
    automatica: "Automatic x2",
    armasCurtas: "Handguns",
    armasPesadas: "Heavy Weapons x2",
    fuzil: "Rifle",
    
    // Technical Skills
    vehiculosAereos: "Aerial Vehicle Tech",
    tecnologiaBasica: "Basic Tech",
    cibertecnologia: "Cybertech",
    demolicoes: "Demolitions x2",
    eletronica: "Electronics/Security Tech x2",
    primeirosSocorros: "First Aid",
    falsificacao: "Forgery",
    vehiculosTerrestre: "Land Vehicle Tech",
    pintar: "Painting/Drawing/Sculpting",
    medicamentos: "Pharmaceuticals x2",
    fotografia: "Photography & Filming",
    arrombamento: "Lockpicking",
    furto: "Theft",
    vehiculosMaritimo: "Marine Vehicle Tech",
    tecnologiaArmas: "Weapons Tech/Gunsmithing",
    
    // Skills Table
    pericia: "Skill",
    nivel: "Level",
    atrib: "Attr.",
    base: "Base",
    
    // Cyberdeck
    seoCyberdeck: "Your Cyberdeck",
    ciberdeckVazio: "Your cyberdeck is empty",
    criarPrimeiroHack: "Create your first hack by filling out the form above",
    
    // Market
    hacksDisponiveis: "Available Hacks",
    buscarHacks: "Search hacks from system...",
    
    // Code Breaker
    codeBreaker: "Code Breaker",
    codigoDescricao: "Enter a 12-character code to unlock special hacks",
    inserirCodigo: "Enter the code (12 characters)...",
    
    // Settings
    preferencias: "Preferences",
    idioma: "Language",
    escolherIdioma: "Choose your interface language",
    portugueseBR: "Portuguese (BR)",
    englishUS: "English (US)",
    
    // Edit Modal
    editarHack: "Edit Hack",
    fechar: "✕",
    
    // General Buttons
    salvar: "Save",
    cancelar: "Cancel",
    editar: "Edit",
    deletar: "Delete",
    buscar: "Search",
    desbloquear: "Unlock",
    restaurarVida: "Restore +1 health point"
  }
};

// Idioma atual
let CURRENT_LANGUAGE = "pt-BR";

// Função para obter strings traduzidas
function t(key) {
  if (!LANGUAGE_STRINGS[CURRENT_LANGUAGE]) {
    CURRENT_LANGUAGE = "pt-BR";
  }
  return LANGUAGE_STRINGS[CURRENT_LANGUAGE][key] || LANGUAGE_STRINGS["pt-BR"][key] || key;
}

// Função para alterar idioma
function alterarIdioma(idioma) {
  if (idioma !== "pt-BR" && idioma !== "en-US") return;
  
  CURRENT_LANGUAGE = idioma;
  localStorage.setItem("user_language", idioma);
  
  // Atualizar botões de idioma
  document.getElementById("langPT").classList.toggle("btn-language-active", idioma === "pt-BR");
  document.getElementById("langEN").classList.toggle("btn-language-active", idioma === "en-US");
  
  // Recarregar a interface
  atualizarInterfaceIdioma();
  
  // Re-renderizar mercado e hacks desbloqueados com o novo idioma
  renderizarMercado();
  renderizarHacksDesbloqueados();
  
  console.log("✓ Idioma alterado para:", idioma);
}

// Função para atualizar a interface com o novo idioma
function atualizarInterfaceIdioma() {
  try {
    // Atualizar header (com verificação de existência)
    const headerTitle = document.querySelector(".header-title");
    if (headerTitle) headerTitle.textContent = "⚡ " + t("hacksRapidos");
    
    const headerSubtitle = document.querySelector(".header-subtitle");
    if (headerSubtitle) headerSubtitle.textContent = t("gerenciadorHacks");
    
    // Atualizar RAM section
    const ramText = document.querySelector(".ram-text");
    if (ramText) ramText.textContent = t("suaRAM");
    
    const btnMinus = document.querySelector(".ram-section [title='Diminuir 1 RAM']");
    if (btnMinus) btnMinus.title = t("diminuirRAM");
    
    const btnReset = document.querySelector(".ram-section [title='Resetar RAM']");
    if (btnReset) btnReset.title = t("resetarRAM");
    
    const btnPlus = document.querySelector(".ram-section [title='Aumentar 1 RAM']");
    if (btnPlus) btnPlus.title = t("aumentarRAM");
    
    const inputMax = document.querySelector(".ram-section [title*='máximo']");
    if (inputMax) inputMax.title = t("definirMaxRAM");
    
    // Atualizar formulário de novo hack
    const formTitle = document.querySelector(".form-wrapper .section-title");
    if (formTitle) formTitle.textContent = t("novoHack");
    
    // Labels do formulário
    const labels = document.querySelectorAll(".form-wrapper label");
    labels.forEach(label => {
      const text = label.textContent.trim();
      if (text.includes("Nome do Hack") || text.includes("Hack Name")) label.textContent = t("nomeHack");
      else if (text.includes("Custo de RAM") || text.includes("RAM Cost")) label.textContent = t("custoRAM");
      else if (text.includes("Tipo de Hack") || text.includes("Hack Type")) label.textContent = t("tipo");
      else if (text.includes("Efeito do Hack") || text.includes("Hack Effect")) label.textContent = t("efeito");
    else if (text.includes("Notas Personalizadas") || text.includes("Custom Notes")) label.textContent = t("notas");
  });
  
  // Placeholders
  const inputs = document.querySelectorAll("input, textarea, select");
  inputs.forEach(input => {
    // Verificar se o elemento tem placeholder antes de tentar acessá-lo
    if (!input.placeholder) return;
    
    if (input.placeholder.includes("Ex:") || input.placeholder.includes("Example")) {
      input.placeholder = t("exQuickhacking");
    } else if (input.placeholder.includes("Descreva") || input.placeholder.includes("Describe")) {
      input.placeholder = t("efetoDesc");
    } else if (input.placeholder.includes("Anotações") || input.placeholder.includes("notes")) {
      input.placeholder = t("notasDesc");
    } else if (input.placeholder.includes("Buscar hacks") || input.placeholder.includes("Search hacks")) {
      input.placeholder = t("buscarHacks");
    } else if (input.placeholder.includes("Buscar perícia") || input.placeholder.includes("Search skill")) {
      input.placeholder = "🔍 " + t("buscarPericia");
    } else if (input.placeholder.includes("Digite") || input.placeholder.includes("Enter") && input.placeholder.includes("nome")) {
      input.placeholder = t("digitarNomePersonagem");
    } else if (input.placeholder.includes("Insira o código") || input.placeholder.includes("Enter the code")) {
      input.placeholder = t("inserirCodigo");
    }
  });
  
  // Atualizar opções de selects
  const selectOptions = document.querySelectorAll("select option");
  selectOptions.forEach(option => {
    const value = option.value;
    
    // Tipos de hack
    if (value === "quickhacking") option.textContent = "⚡ " + t("quickhacking");
    else if (value === "intrusion") option.textContent = "🔓 " + t("infiltracao");
    else if (value === "stealth") option.textContent = "🥷 " + t("furtividade");
    else if (value === "combat") option.textContent = "⚔️ " + t("combate");
    else if (value === "control") option.textContent = "🎮 " + t("controle");
    else if (value === "utility") option.textContent = "🔧 " + t("utilitario");
    else if (value === "reconnaissance") option.textContent = "🔍 " + t("reconhecimento");
    else if (value === "damage") option.textContent = "💥 " + t("dano");
    
    // Papéis
    else if (value === "solo") option.textContent = t("solo");
    else if (value === "trilha-rede") option.textContent = t("trilhaRede");
    else if (value === "tecnico") option.textContent = t("tecnico");
    else if (value === "medtech") option.textContent = t("medtech");
    else if (value === "roqueiro") option.textContent = t("roqueiro");
    else if (value === "midia") option.textContent = t("midia");
    else if (value === "executivo") option.textContent = t("executivo");
    else if (value === "fixer") option.textContent = t("fixer");
    else if (value === "nomade") option.textContent = t("nomade");
    else if (value === "policial") option.textContent = t("policial");
    
    // Armadura
    else if (value === "0") option.textContent = t("nenhuma") + " (0)";
    else if (value === "5") option.textContent = t("leve") + " (5)";
    else if (value === "10") option.textContent = t("pesada") + " (10)";
    else if (value === "custom") option.textContent = t("customizada");
  });
  
  // Atualizar abas
  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach(btn => {
    const tabId = btn.getAttribute("data-tab");
    const textNode = btn.childNodes[btn.childNodes.length - 1];
    
    if (tabId === "personagem") btn.innerHTML = `<span class="tab-icon">👤</span> ${t("tabPersonagem")}`;
    else if (tabId === "cyberdeck") btn.innerHTML = `<span class="tab-icon">💾</span> ${t("tabCyberdeck")}`;
    else if (tabId === "market") btn.innerHTML = `<span class="tab-icon">🔍</span> ${t("tabMarket")}`;
    else if (tabId === "codebreaker") btn.innerHTML = `<span class="tab-icon">🔐</span> ${t("tabCodebreaker")}`;
    else if (tabId === "settings") btn.innerHTML = `<span class="tab-icon">⚙️</span> ${t("tabSettings")}`;
  });
  
  // Atualizar titles das abas de personagem
  const charLabels = document.querySelectorAll("#tab-personagem label");
  charLabels.forEach(label => {
    const text = label.textContent.trim();
    if (text.includes("Nome do Personagem") || text.includes("Character Name")) label.textContent = t("nomePersonagem");
    else if (text.includes("Nível")) label.textContent = t("nivel");
    else if (text.includes("Papel")) label.textContent = t("papel");
    else if (text.includes("Saúde Máxima") || text.includes("Max Health")) label.textContent = t("saudeMaxima");
    else if (text.includes("Saúde Atual") || text.includes("Current Health")) label.textContent = t("saudeAtual");
    else if (text.includes("Armadura")) label.textContent = t("armadura");
    else if (text.includes("Humanidade")) label.textContent = t("humanidade");
    else if (text.includes("Habilidade de Papel") || text.includes("Role Ability")) label.textContent = t("habilidadePapel");
  });
  
  // Atualizar títulos de seções
  const subsections = document.querySelectorAll(".subsection-title");
  subsections.forEach(el => {
    if (el.textContent.includes("Atributo")) el.textContent = t("atributos");
    else if (el.textContent.includes("Perícia") || el.textContent.includes("Skill")) el.textContent = t("pericias");
  });
  
  // Atualizar atributos (INT, REF, TEC, etc)
  document.querySelectorAll(".attribute-input label").forEach(label => {
    const small = label.querySelector("small");
    const shortName = label.textContent.split("(")[0].trim();
    
    if (shortName === "INT") small.textContent = "(" + t("inteligencia") + ")";
    else if (shortName === "REF") small.textContent = "(" + t("reflexos") + ")";
    else if (shortName === "TEC") small.textContent = "(" + t("tecnicoAttr") + ")";
    else if (shortName === "EMP") small.textContent = "(" + t("empatia") + ")";
    else if (shortName === "SOR") small.textContent = "(" + t("sorte") + ")";
    else if (shortName === "FOR") small.textContent = "(" + t("forca") + ")";
    else if (shortName === "DES") small.textContent = "(" + t("destreza") + ")";
    else if (shortName === "COR") small.textContent = "(" + t("corpo") + ")";
    else if (shortName === "MAN") small.textContent = "(" + t("manuseio") + ")";
  });
  
  // Atualizar categorias de perícias
  const skillCategories = document.querySelectorAll(".skill-category-title");
  skillCategories.forEach(el => {
    const text = el.textContent.trim();
    if (text.includes("Atenção")) el.textContent = t("pericias_atencao");
    else if (text.includes("Corporais")) el.textContent = t("pericias_corporais");
    else if (text.includes("Condução") || text.includes("Driving")) el.textContent = t("pericias_conducao");
    else if (text.includes("Educação") || text.includes("Education")) el.textContent = t("pericias_educacao");
    else if (text.includes("Luta") || text.includes("Combat")) el.textContent = t("pericias_luta");
    else if (text.includes("Armas") || text.includes("Weapons")) el.textContent = t("pericias_armas");
    else if (text.includes("Técnicas") || text.includes("Technical")) el.textContent = t("pericias_tecnicas");
  });
  
  // Atualizar nomes das perícias
  const skillLabels = document.querySelectorAll(".skill-item label");
  skillLabels.forEach(label => {
    const text = label.textContent.trim();
    
    // Período de Atenção
    if (text.includes("Concentração")) label.textContent = t("concentracao") + " (COR)";
    else if (text.includes("Ocultar/Revelar")) label.textContent = t("ocultarRevelar") + " (INT)";
    else if (text.includes("Leitura Labial")) label.textContent = t("leituraLabial") + " (INT)";
    else if (text.includes("Percepção") || text.includes("Perception")) label.textContent = t("percepcao") + " (INT)";
    else if (text.includes("Rastrear") || text.includes("Track")) label.textContent = t("rastrear") + " (INT)";
    
    // Perícias Corporais
    else if (text.includes("Atletismo")) label.textContent = t("atletismo") + " (COR)";
    else if (text.includes("Contorcionismo")) label.textContent = t("contorcionismo") + " (COR)";
    else if (text.includes("Dançar") || text.includes("Dance")) label.textContent = t("dancar") + " (COR)";
    else if (text.includes("Resistência") && !text.includes("Tortura")) label.textContent = t("resistencia") + " (FOR)";
    else if (text.includes("Resistência à Tortura")) label.textContent = t("resistenciaTortura") + " (FOR)";
    
    // Perícias de Condução
    else if (text.includes("Dirigir Veículo Terrestre") || text.includes("Drive Land")) label.textContent = t("dirigirTerrestre") + " (REF)";
    else if (text.includes("Pilotar Veículo Aéreo")) label.textContent = t("pilotarAereo") + " (REF)";
    else if (text.includes("Pilotar Veículo Marítimo")) label.textContent = t("pilotarMaritimo") + " (REF)";
    else if (text.includes("Motocicleta")) label.textContent = t("motocicleta") + " (REF)";
    
    // Perícias de Educação
    else if (text.includes("Contabilidade")) label.textContent = t("contabilidade") + " (INT)";
    else if (text.includes("Lidar com Animais")) label.textContent = t("lidarAnimais") + " (INT)";
    else if (text.includes("Burocracia")) label.textContent = t("burocracia") + " (INT)";
    else if (text.includes("Negócios") || text.includes("Business")) label.textContent = t("negocios") + " (INT)";
    else if (text.includes("Composição") || text.includes("Composition")) label.textContent = t("composicao") + " (INT)";
    else if (text.includes("Criminologia")) label.textContent = t("criminologia") + " (INT)";
    else if (text.includes("Criptografia")) label.textContent = t("criptografia") + " (INT)";
    else if (text.includes("Dedução") || text.includes("Deduction")) label.textContent = t("deducao") + " (INT)";
    else if (text.includes("Educação") && !text.includes("Skills")) label.textContent = t("educacao") + " (INT)";
    else if (text.includes("Apostar") || text.includes("Gambling")) label.textContent = t("apostar") + " (INT)";
    
    // Perícias de Luta
    else if (text.includes("Briga")) label.textContent = t("briga") + " (COR)";
    else if (text.includes("Evasão")) label.textContent = t("evasao") + " (COR)";
    else if (text.includes("Artes Marciais")) label.textContent = t("artesMarciais") + " (COR)";
    else if (text.includes("Armas Brancas") || text.includes("Melee Weapons")) label.textContent = t("armasBrancas") + " (COR)";
    
    // Perícias de Armas
    else if (text.includes("Arqueirismo")) label.textContent = t("arqueirismo") + " (REF)";
    else if (text.includes("Automática")) label.textContent = t("automatica") + " (REF)";
    else if (text.includes("Armas Curtas") || text.includes("Handguns")) label.textContent = t("armasCurtas") + " (REF)";
    else if (text.includes("Armas Pesadas")) label.textContent = t("armasPesadas") + " (REF)";
    else if (text.includes("Fuzil") || text.includes("Rifle")) label.textContent = t("fuzil") + " (REF)";
    
    // Perícias Técnicas
    else if (text.includes("Tecnologia de Veículos Aéreos") || text.includes("Aerial Vehicle")) label.textContent = t("vehiculosAereos") + " (TEC)";
    else if (text.includes("Tecnologia Básica") || text.includes("Basic Tech")) label.textContent = t("tecnologiaBasica") + " (TEC)";
    else if (text.includes("Cibertecnologia") || text.includes("Cybertech")) label.textContent = t("cibertecnologia") + " (TEC)";
    else if (text.includes("Demolições")) label.textContent = t("demolicoes") + " (TEC)";
    else if (text.includes("Eletrônica") || text.includes("Electronics")) label.textContent = t("eletronica") + " (TEC)";
    else if (text.includes("Primeiros Socorros") || text.includes("First Aid")) label.textContent = t("primeirosSocorros") + " (TEC)";
    else if (text.includes("Falsificação") || text.includes("Forgery")) label.textContent = t("falsificacao") + " (TEC)";
    else if (text.includes("Tecnologia de Veículo Terrestre") || text.includes("Land Vehicle")) label.textContent = t("vehiculosTerrestre") + " (TEC)";
    else if (text.includes("Pintar/Desenhar") || text.includes("Painting")) label.textContent = t("pintar") + " (TEC)";
    else if (text.includes("Medicamentos")) label.textContent = t("medicamentos") + " (TEC)";
    else if (text.includes("Fotografia") || text.includes("Photography")) label.textContent = t("fotografia") + " (TEC)";
    else if (text.includes("Arrombamento") || text.includes("Lockpicking")) label.textContent = t("arrombamento") + " (TEC)";
    else if (text.includes("Furto") || text.includes("Theft")) label.textContent = t("furto") + " (TEC)";
    else if (text.includes("Tecnologia de Veículo Marítimo") || text.includes("Marine Vehicle")) label.textContent = t("vehiculosMaritimo") + " (TEC)";
    else if (text.includes("Tecnologia de Armas") || text.includes("Weapons Tech")) label.textContent = t("tecnologiaArmas") + " (TEC)";
  });
  
  // Atualizar headers de tabelas
  const skillHeaders = document.querySelectorAll(".skill-header-label");
  skillHeaders.forEach(el => {
    const text = el.textContent.trim();
    if (text === "Perícia" || text === "Skill") el.textContent = t("pericia");
    else if (text === "Nível" || text === "Level") el.textContent = t("nivel");
    else if (text === "Atrib." || text === "Attr.") el.textContent = t("atrib");
    else if (text === "Base") el.textContent = t("base");
  });
  
  // Atualizar seção de Cyberdeck
  const ciberdeckTitle = document.querySelector("#tab-cyberdeck .section-title");
  if (ciberdeckTitle) ciberdeckTitle.textContent = t("seoCyberdeck");
  
  const emptyState = document.querySelector(".empty-state p");
  if (emptyState) emptyState.textContent = t("ciberdeckVazio");
  
  const emptySmall = document.querySelector(".empty-state small");
  if (emptySmall) emptySmall.textContent = t("criarPrimeiroHack");
  
  // Atualizar seção de Market
  const marketTitle = document.querySelector("#tab-market .section-title");
  if (marketTitle) marketTitle.textContent = t("hacksDisponiveis");
  
  // Atualizar seção de Code Breaker
  const codeTitle = document.querySelector("#tab-codebreaker .section-title");
  if (codeTitle) codeTitle.textContent = t("codeBreaker");
  
  const codeDesc = document.querySelector(".codebreaker-description");
  if (codeDesc) codeDesc.textContent = t("codigoDescricao");
  
  // Atualizar seção de Settings
  const settingsTitle = document.querySelector("#tab-settings .section-title");
  if (settingsTitle) settingsTitle.textContent = t("preferencias");
  
  const settingsSubtitle = document.querySelector(".settings-subtitle");
  if (settingsSubtitle) settingsSubtitle.textContent = t("idioma");
  
  const settingsDesc = document.querySelector(".settings-description");
  if (settingsDesc) settingsDesc.textContent = t("escolherIdioma");
  
  // Atualizar modal de edição
  const modalTitle = document.querySelector(".modal-title");
  if (modalTitle) modalTitle.textContent = t("editarHack");
  
  const editLabels = document.querySelectorAll("#editForm label");
  editLabels.forEach(label => {
    const text = label.textContent.trim();
    if (text.includes("Nome")) label.textContent = t("nomeHack");
    else if (text.includes("Custo")) label.textContent = t("custoRAM");
    else if (text.includes("Tipo")) label.textContent = t("tipo");
    else if (text.includes("Efeito")) label.textContent = t("efeito");
    else if (text.includes("Notas")) label.textContent = t("notas");
  });
  
  // Atualizar botões de formulário
  const formButtons = document.querySelectorAll(".btn, .form-hint");
  formButtons.forEach(btn => {
    const text = btn.textContent.trim();
    if (text.includes("Adicionar") || text.includes("Add")) {
      btn.innerHTML = `<span class="btn-icon">+</span> ${t("adicionarHack")}`;
    } else if (text.includes("Máximo")) {
      btn.textContent = t("maxChar500");
    } else if (text.includes("Salvar Personagem")) {
      btn.innerHTML = `💾 ${t("salvarPersonagem")}`;
    }
  });
  } catch (error) {
    console.error("❌ Erro ao atualizar interface de idioma:", error);
    console.warn("⚠️ Continuando sem atualização de idioma");
  }
}

// Carregar idioma salvo na inicialização
function carregarIdiomaUsuario() {
  const savedLanguage = localStorage.getItem("user_language");
  if (savedLanguage && (savedLanguage === "pt-BR" || savedLanguage === "en-US")) {
    CURRENT_LANGUAGE = savedLanguage;
  }
  
  // Atualizar botões de idioma
  const langPT = document.getElementById("langPT");
  const langEN = document.getElementById("langEN");
  if (langPT && langEN) {
    langPT.classList.toggle("btn-language-active", CURRENT_LANGUAGE === "pt-BR");
    langEN.classList.toggle("btn-language-active", CURRENT_LANGUAGE === "en-US");
  }
}


const STORAGE_KEY = "cyberpunk_hacks_rapidos";
const RAM_STORAGE_KEY = "cyberpunk_player_ram";
const CODEBREAKER_STORAGE_KEY = "cyberpunk_codebreaker";
let MAX_RAM = 25;
let USER_ID = null;
let PLUGIN_READY = false;  // Flag para indicar que o plugin está pronto
let draggedIndex = null;  // Variável para rastrear o hack sendo arrastado

function obterChaveUsuario(chave) {
  // Se USER_ID não está definido, usar chave simples
  // Isso garante que localStorage funcione mesmo sem USER_ID
  if (!USER_ID) {
    console.warn("⚠️ USER_ID não definido, usando chave simples:", chave);
    return chave;
  }
  return `${USER_ID}_${chave}`;
}

// ============================================
// INICIALIZAÇÃO - Aguardar OBR pronto
// ============================================

async function iniciarPluginCompleto() {
  try {
    console.log("🚀 Iniciando plugin completo...");
    
    // Obter ID único do usuário
    const party = await OBR.party.getParty();
    USER_ID = party.playerId;
    console.log("✓ Usuário conectado:", USER_ID);
    
    // Carregar e renderizar tudo
    console.log("📋 Carregando dados do usuário...");
    await renderizarHacks();
    await renderizarRAM();
    
    // Configurar interface (inclui carregamento de idioma)
    console.log("🎨 Configurando interface...");
    configurarInterface();
    
    // Renderizar dados iniciais
    renderizarMercado();
    renderizarHacksDesbloqueados();
    
    // Abrir aba padrão
    abrirAba("personagem");
    
    // Marcar plugin como pronto
    PLUGIN_READY = true;
    console.log("✓ Plugin iniciado com sucesso!");
  } catch (error) {
    console.error("❌ Erro crítico ao iniciar plugin:", error);
    console.error("Stack:", error.stack);
  }
}

function configurarInterface() {
  // Carregar e aplicar idioma
  carregarIdiomaUsuario();
  atualizarInterfaceIdioma();
  
  // Configurar formulário
  const form = document.getElementById("hackForm");
  if (form) {
    form.addEventListener("submit", adicionarHack);
    console.log("✓ Formulário configurado");
  } else {
    console.warn("⚠️ Formulário não encontrado");
  }

  // Configurar abas
  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      abrirAba(tabId);
    });
  });
  console.log("✓ Abas configuradas:", tabButtons.length);

  // Configurar busca
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      renderizarMercado(e.target.value);
    });
    console.log("✓ Busca configurada");
  }

  // Configurar controles de RAM
  const ramMaxInput = document.getElementById("ramMaxInput");
  if (ramMaxInput) {
    ramMaxInput.addEventListener("change", (e) => {
      definirMaxRAM(e.target.value);
    });
    console.log("✓ Input de RAM máxima configurado");
  }

  const ramBtnPlus = document.getElementById("ramBtnPlus");
  if (ramBtnPlus) {
    ramBtnPlus.addEventListener("click", aumentarRAM);
    console.log("✓ Botão + RAM configurado");
  }

  const ramBtnMinus = document.getElementById("ramBtnMinus");
  if (ramBtnMinus) {
    ramBtnMinus.addEventListener("click", diminuirRAM);
    console.log("✓ Botão - RAM configurado");
  }

  const ramBtnReset = document.getElementById("ramBtnReset");
  if (ramBtnReset) {
    ramBtnReset.addEventListener("click", resetarRAM);
    console.log("✓ Botão reset RAM configurado");
  }

  // Inicializar perícias da ficha de personagem
  inicializarPericiasListeners();
  console.log("✓ Perícias inicializadas");
}

// Registrar callback quando OBR estiver pronto - ESPERAR DOM estar pronto
function registrarCallback() {
  if (typeof OBR !== 'undefined' && OBR.onReady) {
    console.log("📋 OBR SDK disponível - registrando callback...");
    OBR.onReady(iniciarPluginCompleto);
  } else {
    console.warn("⚠️ OBR SDK não disponível - ativando modo de demonstração");
    // Modo fallback para testes sem OBR (GitHub Pages)
    iniciarPluginFallback();
  }
}

// Função de inicialização para modo fallback (sem OBR)
async function iniciarPluginFallback() {
  try {
    console.log("🚀 Iniciando em modo FALLBACK (sem OBR)...");
    
    // Usar ID consistente baseado em localStorage (persiste entre sessões)
    const FALLBACK_USER_KEY = "owlbear_demo_user_id";
    let demoUserId = localStorage.getItem(FALLBACK_USER_KEY);
    
    if (!demoUserId) {
      demoUserId = "demo_" + Math.random().toString(36).substr(2, 9);
      try {
        localStorage.setItem(FALLBACK_USER_KEY, demoUserId);
        console.log("🆕 Novo usuário demo criado (localStorage):", demoUserId);
      } catch (e) {
        console.error("❌ Erro ao salvar demo user ID em localStorage:", e);
      }
    } else {
      console.log("♻️ Usuário demo existente (localStorage):", demoUserId);
    }
    
    USER_ID = demoUserId;
    console.log("✓ Usuário demo:", USER_ID);
    
    // Usar localStorage em vez de OBR.storage
    console.log("📋 Carregando dados de demonstração...");
    await renderizarHacks();
    await renderizarRAM();
    
    // Configurar interface
    console.log("🎨 Configurando interface...");
    configurarInterface();
    
    // Renderizar dados iniciais
    renderizarMercado();
    await renderizarHacksDesbloqueados();
    
    // Abrir aba padrão
    abrirAba("cyberdeck");
    
    // Marcar plugin como pronto
    PLUGIN_READY = true;
    console.log("✓ Plugin em modo FALLBACK iniciado com sucesso!");
    console.log("💡 Este é o modo de demonstração. Para uso completo, abra em Owlbear Rodeo.");
  } catch (error) {
    console.error("❌ Erro ao iniciar modo fallback:", error);
    console.error("Stack:", error.stack);
  }
}

// Aguardar DOM estar pronto antes de registrar callback
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', registrarCallback);
} else {
  // DOM já está pronto
  registrarCallback();
}

// ============================================
// SISTEMA DE HACKS (Banco de Dados)
// ============================================

// Traduções dos hacks do sistema
const HACKS_TRANSLATIONS = {
  "pt-BR": {
    special_moonblessing: {
      nome: "Hack Rápido - Benção da Lua",
      descricao: "Uma vez por dia você pode ter visão da lua para te auxiliar a encontrar lugares, objetos.. etc. lhe dando +10 no próximo teste das perícias de Atenção.",
      categoria: "Visão Especial"
    },
    special_phantom: {
      nome: "Hack Rápido - Corrente Fantasma",
      descricao: "Você apaga temporariamente sua assinatura digital do campo. Nenhum efeito pode rastrear o netrunner e contra-hacks contra você falham automaticamente. Dura até o fim da cena ou até você executar outro hack. Falha: RAM é gasta normalmente e você é marcado.",
      categoria: "Ofuscação"
    },
    special_redqueen: {
      nome: "Hack Rápido - Protocolo Redqueen",
      descricao: "Uma explosão de ruído eletromagnético digital se espalha. Todos em um raio curto sofrem -4 em todos os testes, perdem -6 de RAM atual e aparelhos sofrem interferência. Dura 1d6 turnos.",
      categoria: "Área de Efeito"
    },
    sys_quickhack_1: {
      nome: "Hack Rápido - Shut Down",
      descricao: "Força o alvo a desligar todos os sistemas por 1 rodada. O alvo não pode agir durante este tempo.",
      categoria: "Desativação"
    },
    sys_quickhack_2: {
      nome: "Hack Rápido - Distrair Inimigos",
      descricao: "Cria ruído nos sensores do alvo, aplicando -2 de REF na próxima ação. Efeito dura 1 rodada.",
      categoria: "Perturbação"
    },
    sys_quickhack_3: {
      nome: "Hack Rápido - Protocolo de Invasão",
      descricao: "Abre acesso avançado ao sistema neural do alvo, permitindo um segundo hacking na próxima rodada sem custo de RAM.",
      categoria: "Infiltração"
    },
    sys_zap: {
      nome: "Hack Rápido - Zap",
      descricao: "Causa 1d8 de dano cerebral e remove ações no próximo turno.",
      categoria: "Dano Cerebral"
    },
    sys_ping: {
      nome: "Hack Rápido - Ping",
      descricao: "Revela todos os dispositivos conectados na rede local.",
      categoria: "Reconhecimento"
    },
    sys_overheat: {
      nome: "Hack Rápido - Overheat",
      descricao: "Deixa o alvo queimando por 2d4 rodadas, pode espalhar o efeito para alvos próximos.",
      categoria: "Dano Contínuo"
    },
    sys_crash: {
      nome: "Hack Rápido - Crash",
      descricao: "Derruba um drone ou veículo remoto.",
      categoria: "Desativação"
    },
    sys_spike: {
      nome: "Hack Rápido - Spike",
      descricao: "Toma controle de um sistema ou câmera por 2 turnos.",
      categoria: "Controle"
    },
    sys_eyeburn: {
      nome: "Hack Rápido - Eye Burn",
      descricao: "Causa ofuscamento temporário. Alvo sofre -6 em ataques à distância por 1 turno.",
      categoria: "Incapacidade"
    },
    sys_flicker: {
      nome: "Hack Rápido - Flicker",
      descricao: "Alvo perde o próximo movimento.",
      categoria: "Incapacidade"
    },
    sys_davyjones: {
      nome: "Hack Rápido - W3sKer",
      descricao: "Quando acertado um crítico, um homem misterioso apenas conhecido como W3sKer aparece atirando no seu ultimo alvo, causando 4d6 de dano",
      categoria: "Controle"
    }
  },
  "en-US": {
    special_moonblessing: {
      nome: "Quick Hack - Moon Blessing",
      descricao: "Once per day you can have moon vision to help you find places, objects, etc., giving you +10 on your next Awareness skill test.",
      categoria: "Special Vision"
    },
    special_phantom: {
      nome: "Quick Hack - Phantom Chain",
      descricao: "You temporarily erase your digital signature from the field. No effect can track the netrunner and counter-hacks against you automatically fail. Lasts until the end of the scene or until you execute another hack. Failure: RAM is spent normally and you are marked.",
      categoria: "Obfuscation"
    },
    special_redqueen: {
      nome: "Quick Hack - Redqueen Protocol",
      descricao: "A burst of digital electromagnetic noise spreads out. Everyone within short range suffers -4 on all tests, loses -6 current RAM, and devices experience interference. Lasts 1d6 turns.",
      categoria: "Area of Effect"
    },
    sys_quickhack_1: {
      nome: "Quick Hack - Shut Down",
      descricao: "Forces the target to shut down all systems for 1 round. The target cannot act during this time.",
      categoria: "Disable"
    },
    sys_quickhack_2: {
      nome: "Quick Hack - Distract Enemies",
      descricao: "Creates noise in the target's sensors, applying -2 REF on the next action. Effect lasts 1 round.",
      categoria: "Disturbance"
    },
    sys_quickhack_3: {
      nome: "Quick Hack - Invasion Protocol",
      descricao: "Opens advanced access to the target's neural system, allowing a second hack next round with no RAM cost.",
      categoria: "Intrusion"
    },
    sys_zap: {
      nome: "Quick Hack - Zap",
      descricao: "Deals 1d8 brain damage and removes actions next turn.",
      categoria: "Brain Damage"
    },
    sys_ping: {
      nome: "Quick Hack - Ping",
      descricao: "Reveals all connected devices on the local network.",
      categoria: "Reconnaissance"
    },
    sys_overheat: {
      nome: "Quick Hack - Overheat",
      descricao: "Leaves the target burning for 2d4 rounds, can spread the effect to nearby targets.",
      categoria: "Continuous Damage"
    },
    sys_crash: {
      nome: "Quick Hack - Crash",
      descricao: "Crashes a drone or remote vehicle.",
      categoria: "Disable"
    },
    sys_spike: {
      nome: "Quick Hack - Spike",
      descricao: "Takes control of a system or camera for 2 turns.",
      categoria: "Control"
    },
    sys_eyeburn: {
      nome: "Quick Hack - Eye Burn",
      descricao: "Causes temporary blindness. Target suffers -6 on ranged attacks for 1 turn.",
      categoria: "Incapacity"
    },
    sys_flicker: {
      nome: "Quick Hack - Flicker",
      descricao: "Target loses their next movement.",
      categoria: "Incapacity"
    }
  }
};

// Função helper para obter tradução do hack
function getHackTranslation(hackId, lang = CURRENT_LANGUAGE) {
  const translations = HACKS_TRANSLATIONS[lang];
  if (translations && translations[hackId]) {
    return translations[hackId];
  }
  // Fallback para português
  return HACKS_TRANSLATIONS["pt-BR"][hackId] || null;
}

const HACKS_ESPECIAIS = [
  {
    id: "special_moonblessing",
    nome: "Hack Rápido - Benção da Lua",
    custoRAM: 4,
    dv: 15,
    tipo: "utility",
    descricao: "Uma vez por dia você pode ter visão da lua para te auxiliar a encontrar lugares, objetos.. etc. lhe dando +10 no próximo teste das perícias de Atenção.",
    categoria: "Visão Especial",
    codigo: "bençãodalua0"
  },
  {
    id: "special_phantom",
    nome: "Hack Rápido - Corrente Fantasma",
    custoRAM: 5,
    dv: 14,
    tipo: "stealth",
    descricao: "Você apaga temporariamente sua assinatura digital do campo. Nenhum efeito pode rastrear o netrunner e contra-hacks contra você falham automaticamente. Dura até o fim da cena ou até você executar outro hack. Falha: RAM é gasta normalmente e você é marcado.",
    categoria: "Ofuscação",
    codigo: "fantasma4040"
  },
  {
    id: "special_redqueen",
    nome: "Hack Rápido - Protocolo Redqueen",
    custoRAM: 7,
    dv: 16,
    tipo: "damage",
    descricao: "Uma explosão de ruído eletromagnético digital se espalha. Todos em um raio curto sofrem -4 em todos os testes, perdem -6 de RAM atual e aparelhos sofrem interferência. Dura 1d6 turnos.",
    categoria: "Área de Efeito",
    codigo: "redqueen1122"
  }
];

// ============================================
// SISTEMA DE HACKS (Banco de Dados)
// ============================================

const HACKS_SISTEMA = [
  {
    id: "sys_quickhack_1",
    nome: "Hack Rápido - Shut Down",
    custoRAM: 4,
    dv: 12,
    tipo: "combat",
    descricao: "Força o alvo a desligar todos os sistemas por 1 rodada. O alvo não pode agir durante este tempo.",
    categoria: "Desativação"
  },
  {
    id: "sys_quickhack_2",
    nome: "Hack Rápido - Distrair Inimigos",
    custoRAM: 3,
    dv: 10,
    tipo: "control",
    descricao: "Cria ruído nos sensores do alvo, aplicando -2 de REF na próxima ação. Efeito dura 1 rodada.",
    categoria: "Perturbação"
  },
  {
    id: "sys_quickhack_3",
    nome: "Hack Rápido - Protocolo de Invasão",
    custoRAM: 5,
    dv: 14,
    tipo: "intrusion",
    descricao: "Abre acesso avançado ao sistema neural do alvo, permitindo um segundo hacking na próxima rodada sem custo de RAM.",
    categoria: "Infiltração"
  },
  {
    id: "sys_zap",
    nome: "Hack Rápido - Zap",
    custoRAM: 3,
    dv: 13,
    tipo: "damage",
    descricao: "Causa 1d8 de dano cerebral e remove ações no próximo turno.",
    categoria: "Dano Cerebral"
  },
  {
    id: "sys_ping",
    nome: "Hack Rápido - Ping",
    custoRAM: 1,
    dv: 10,
    tipo: "reconnaissance",
    descricao: "Revela todos os dispositivos conectados na rede local.",
    categoria: "Reconhecimento"
  },
  {
    id: "sys_overheat",
    nome: "Hack Rápido - Overheat",
    custoRAM: 6,
    dv: 15,
    tipo: "damage",
    descricao: "Deixa o alvo queimando por 2d4 rodadas, pode espalhar o efeito para alvos próximos.",
    categoria: "Dano Contínuo"
  },
  {
    id: "sys_crash",
    nome: "Hack Rápido - Crash",
    custoRAM: 2,
    dv: 12,
    tipo: "combat",
    descricao: "Derruba um drone ou veículo remoto.",
    categoria: "Desativação"
  },
  {
    id: "sys_spike",
    nome: "Hack Rápido - Spike",
    custoRAM: 4,
    dv: 14,
    tipo: "control",
    descricao: "Toma controle de um sistema ou câmera por 2 turnos.",
    categoria: "Controle"
  },
  {
    id: "sys_eyeburn",
    nome: "Hack Rápido - Eye Burn",
    custoRAM: 5,
    dv: 14,
    tipo: "stealth",
    descricao: "Causa ofuscamento temporário. Alvo sofre -6 em ataques à distância por 1 turno.",
    categoria: "Incapacidade"
  },
  {
    id: "sys_flicker",
    nome: "Hack Rápido - Flicker",
    custoRAM: 3,
    dv: 14,
    tipo: "stealth",
    descricao: "Alvo perde o próximo movimento.",
    categoria: "Incapacidade"
  },
  {
    id: "sys_davyjones",
    nome: "Hack Rápido - W3sKer",
    custoRAM: 6,
    dv: 14,
    tipo: "combat",
    descricao: "Quando acertado um crítico, um homem misterioso apenas conhecido como W3sKer aparece atirando no seu ultimo alvo, causando 4d6 de dano",
    categoria: "controle"
  }
];

// ============================================
// STORAGE - Gerenciar dados com Owlbear Rodeo
// ============================================

async function salvarHacksLocal(hacks) {
  try {
    // Use chave simples e consistente para localStorage
    const chaveLoja = "cyberpunk_hacks_rapidos_local";
    console.log("💾 Salvando hacks para localStorage com chave:", chaveLoja);
    
    // Salvar em localStorage (método primário - mais confiável)
    try {
      const dataStr = JSON.stringify(hacks);
      localStorage.setItem(chaveLoja, dataStr);
      
      // Verificar imediatamente se foi salvo
      const verificacao = localStorage.getItem(chaveLoja);
      if (verificacao) {
        console.log("✅ localStorage verificado - dados salvos com sucesso:", hacks.length, "hacks");
      } else {
        console.error("❌ localStorage falhou - dados NÃO foram salvos");
      }
    } catch (storageError) {
      console.error("❌ Erro ao salvar em localStorage:", storageError);
      return false;
    }
    
    // Também tentar salvar com chave do usuário em OBR.storage (opcional)
    if (USER_ID) {
      const chaveOBR = `${USER_ID}_${STORAGE_KEY}`;
      if (typeof OBR !== 'undefined' && OBR.storage && OBR.storage.setItems) {
        try {
          console.log("📡 Também sincronizando com OBR.storage:", chaveOBR);
          await OBR.storage.setItems([{
            key: chaveOBR,
            value: JSON.stringify(hacks)
          }]);
        } catch (obrError) {
          console.warn("⚠️ OBR.storage não disponível (pode ignorar):", obrError.message);
        }
      }
    }
    
    console.log("✓ Hacks salvos com sucesso");
    return true;
  } catch (error) {
    console.error("❌ Erro crítico ao salvar hacks:", error);
    return false;
  }
}

async function carregarHacksLocal() {
  try {
    // Use chave simples e consistente para localStorage
    const chaveLoja = "cyberpunk_hacks_rapidos_local";
    console.log("📂 Carregando hacks de localStorage com chave:", chaveLoja);
    
    let hacksData = null;
    
    // Tentar carregar de localStorage (método primário)
    try {
      hacksData = localStorage.getItem(chaveLoja);
      if (hacksData) {
        console.log("✓ Dados encontrados em localStorage");
      } else {
        console.warn("⚠️ Nenhum dado encontrado em localStorage, tentando OBR.storage...");
      }
    } catch (storageError) {
      console.warn("⚠️ Erro ao carregar de localStorage:", storageError);
    }
    
    // Se localStorage não encontrou, tentar OBR.storage
    if (!hacksData && USER_ID) {
      const chaveOBR = `${USER_ID}_${STORAGE_KEY}`;
      if (typeof OBR !== 'undefined' && OBR.storage && OBR.storage.getItems) {
        try {
          console.log("📡 Tentando carregar de OBR.storage:", chaveOBR);
          const dados = await OBR.storage.getItems([chaveOBR]);
          if (dados.length > 0) {
            hacksData = dados[0].value;
            console.log("✓ Dados carregados via OBR.storage");
          }
        } catch (obrError) {
          console.warn("⚠️ OBR.storage não disponível:", obrError.message);
        }
      }
    }
    
    const hacks = hacksData ? JSON.parse(hacksData) : [];
    console.log("✓ Hacks carregados:", hacks.length, "items");
    return Array.isArray(hacks) ? hacks : [];
  } catch (error) {
    console.error("❌ Erro ao carregar hacks:", error);
    return [];
  }
}

// ============================================
// SISTEMA DE RAM DO JOGADOR
// ============================================

async function salvarRAMLocal(ramAtual, ramMaximo = MAX_RAM) {
  try {
    // Use chave simples e consistente para localStorage
    const chaveLoja = "cyberpunk_player_ram_local";
    console.log("💾 Salvando RAM para localStorage com chave:", chaveLoja);
    console.log("   Valor: RAM", ramAtual, "/", ramMaximo);
    
    // Salvar em localStorage (método primário)
    try {
      const dataStr = JSON.stringify({ ram: ramAtual, max: ramMaximo });
      localStorage.setItem(chaveLoja, dataStr);
      
      // Verificar imediatamente
      const verificacao = localStorage.getItem(chaveLoja);
      if (verificacao) {
        console.log("✅ localStorage verificado - RAM salvo com sucesso");
      } else {
        console.error("❌ localStorage falhou - RAM NÃO foi salvo");
      }
    } catch (storageError) {
      console.error("❌ Erro ao salvar RAM em localStorage:", storageError);
      return false;
    }
    
    // Também tentar salvar com chave do usuário em OBR.storage (opcional)
    if (USER_ID) {
      const chaveOBR = `${USER_ID}_${RAM_STORAGE_KEY}`;
      if (typeof OBR !== 'undefined' && OBR.storage && OBR.storage.setItems) {
        try {
          console.log("📡 Também sincronizando RAM com OBR.storage");
          await OBR.storage.setItems([{
            key: chaveOBR,
            value: JSON.stringify({ ram: ramAtual, max: ramMaximo })
          }]);
        } catch (obrError) {
          console.warn("⚠️ OBR.storage RAM não disponível (pode ignorar):", obrError.message);
        }
      }
    }
    
    console.log("✓ RAM salvo com sucesso");
    return true;
  } catch (error) {
    console.error("❌ Erro ao salvar RAM:", error);
    return false;
  }
}

async function carregarRAMLocal() {
  try {
    // Use chave simples e consistente para localStorage
    const chaveLoja = "cyberpunk_player_ram_local";
    console.log("📂 Carregando RAM de localStorage com chave:", chaveLoja);
    
    let ramData = null;
    
    // Tentar carregar de localStorage (método primário)
    try {
      const stored = localStorage.getItem(chaveLoja);
      if (stored) {
        ramData = JSON.parse(stored);
        console.log("✓ RAM encontrado em localStorage:", ramData.ram, "/", ramData.max);
      } else {
        console.warn("⚠️ Nenhum RAM encontrado em localStorage, tentando OBR.storage...");
      }
    } catch (storageError) {
      console.warn("⚠️ Erro ao carregar RAM de localStorage:", storageError);
    }
    
    // Se localStorage não encontrou, tentar OBR.storage
    if (!ramData && USER_ID) {
      const chaveOBR = `${USER_ID}_${RAM_STORAGE_KEY}`;
      if (typeof OBR !== 'undefined' && OBR.storage && OBR.storage.getItems) {
        try {
          console.log("📡 Tentando carregar RAM de OBR.storage");
          const dados = await OBR.storage.getItems([chaveOBR]);
          if (dados.length > 0) {
            ramData = JSON.parse(dados[0].value);
            console.log("✓ RAM carregado via OBR.storage");
          }
        } catch (obrError) {
          console.warn("⚠️ OBR.storage RAM não disponível:", obrError.message);
        }
      }
    }
    
    // Usar valores padrão se nada foi encontrado
    ramData = ramData || { ram: 0, max: 25 };
    
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
  console.log("🎯 definirMaxRAM chamado com:", novoMax, "PLUGIN_READY:", PLUGIN_READY);
  
  if (!USER_ID) {
    console.warn("⚠️ USER_ID não definido ainda - aguardando inicialização");
    // Aguardar um pouco e tentar novamente
    setTimeout(() => definirMaxRAM(novoMax), 100);
    return;
  }
  novoMax = Math.max(1, Math.min(parseInt(novoMax) || 25, 100));
  MAX_RAM = novoMax;
  console.log("📝 Novo MAX_RAM:", novoMax);
  
  // Garantir que RAM atual não exceda o novo máximo
  carregarRAMLocal().then(ramData => {
    let ramAtual = Math.min(ramData.ram, novoMax);
    console.log("💾 Salvando RAM:", ramAtual, "/", novoMax);
    salvarRAMLocal(ramAtual, novoMax).then(() => {
      renderizarRAM();
      console.log("✓ MAX_RAM definido para:", novoMax);
    });
  });
}

function aumentarRAM() {
  console.log("🎯 aumentarRAM chamado, PLUGIN_READY:", PLUGIN_READY);
  
  if (!USER_ID) {
    console.warn("⚠️ USER_ID não definido ainda - aguardando inicialização");
    setTimeout(aumentarRAM, 100);
    return;
  }
  carregarRAMLocal().then(ramData => {
    if (ramData.ram < MAX_RAM) {
      ramData.ram++;
      console.log("📝 Aumentando RAM para:", ramData.ram);
      salvarRAMLocal(ramData.ram, MAX_RAM).then(() => {
        renderizarRAM();
      });
    }
  });
}

function diminuirRAM() {
  console.log("🎯 diminuirRAM chamado, PLUGIN_READY:", PLUGIN_READY);
  
  if (!USER_ID) {
    console.warn("⚠️ USER_ID não definido ainda - aguardando inicialização");
    setTimeout(diminuirRAM, 100);
    return;
  }
  carregarRAMLocal().then(ramData => {
    if (ramData.ram > 0) {
      ramData.ram--;
      salvarRAMLocal(ramData.ram, MAX_RAM).then(() => {
        renderizarRAM();
      });
    }
  });
}

function resetarRAM() {
  if (!USER_ID) {
    console.warn("⚠️ USER_ID não definido ainda - aguardando inicialização");
    setTimeout(resetarRAM, 100);
    return;
  }
  salvarRAMLocal(MAX_RAM, MAX_RAM).then(() => {
    renderizarRAM();
  });
}

async function renderizarRAM() {
  const ramData = await carregarRAMLocal();
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
  console.log("🎯 abrirAba chamado com:", abaId);
  
  try {
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

    console.log("Painel encontrado:", painel ? "✓" : "✗");
    console.log("Botão encontrado:", botao ? "✓" : "✗");

    if (painel) painel.classList.add("tab-panel-active");
    if (botao) botao.classList.add("tab-btn-active");
    
    // Atualizar tradução quando abre a aba
    if (PLUGIN_READY) {
      atualizarInterfaceIdioma();
    }

    console.log(`✓ Aba aberta: ${abaId}`);
  } catch (error) {
    console.error("❌ Erro ao abrir aba:", error);
  }
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
    hacksExibidos = HACKS_SISTEMA.filter(hack => {
      // Obter tradução
      const translation = getHackTranslation(hack.id);
      const nomeExibicao = translation ? translation.nome : hack.nome;
      const descExibicao = translation ? translation.descricao : hack.descricao;
      const catExibicao = translation ? translation.categoria : hack.categoria;
      
      return nomeExibicao.toLowerCase().includes(filtroLower) ||
             descExibicao.toLowerCase().includes(filtroLower) ||
             catExibicao.toLowerCase().includes(filtroLower);
    });
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
    // Obter tradução do hack
    const translation = getHackTranslation(hack.id);
    const nomeExibicao = translation ? translation.nome : hack.nome;
    const descExibicao = translation ? translation.descricao : hack.descricao;
    const catExibicao = translation ? translation.categoria : hack.categoria;
    
    const hackElement = document.createElement("div");
    hackElement.className = "hack-item hack-item-market";
    const tipoInfo = HACK_TYPES[hack.tipo] || HACK_TYPES.quickhacking;
    const badgeHTML = hack.tipo ? `<span class="hack-badge hack-badge-${hack.tipo}">${tipoInfo.icon} ${tipoInfo.nome}</span>` : "";
    
    hackElement.innerHTML = `
      <div class="hack-header">
        <div class="hack-info">
          <h4 class="hack-name">${sanitizar(nomeExibicao)}</h4>
          <div class="hack-meta">
            ${badgeHTML}
            <span class="hack-stat">
              <span class="stat-label">RAM:</span>
              <span class="stat-value">${hack.custoRAM}</span>
            </span>
            <span class="hack-stat">
              <span class="stat-label">DV:</span>
              <span class="stat-value">${hack.dv}</span>
              <button class="btn btn-use-hack" onclick="usarHack('${hack.id}')" title="Usar este hack (desconta RAM)">
                ⚡
              </button>
            </span>
          </div>
        </div>
        <button class="btn btn-install" onclick="importarHack('${hack.id}')" title="Adicionar ao Cyberdeck">
          <span>+</span>
        </button>
      </div>
      ${
        descExibicao
          ? `<p class="hack-desc">${sanitizar(descExibicao)}</p>`
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

async function renderizarHacks() {
  const hacks = await carregarHacksLocal();
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
    const isEspecial = hack.origem === "especial";
    const tipoInfo = HACK_TYPES[hack.tipo] || HACK_TYPES.quickhacking;
    
    hackElement.className = `hack-item ${isEspecial ? "hack-special" : ""}`;
    hackElement.draggable = true;
    hackElement.setAttribute("data-hack-index", index);
    
    const badgeHTML = hack.tipo ? `<span class="hack-badge hack-badge-${hack.tipo}">${tipoInfo.icon} ${tipoInfo.nome}</span>` : "";
    
    hackElement.innerHTML = `
      <div class="hack-header">
        <div class="hack-info">
          <h4 class="hack-name">${isEspecial ? "🔓 " : ""}${sanitizar(hack.nome)}</h4>
          <div class="hack-meta">
            ${badgeHTML}
            <span class="hack-stat">
              <span class="stat-label">RAM:</span>
              <span class="stat-value">${hack.custoRAM}</span>
            </span>
            <span class="hack-stat">
              <span class="stat-label">DV:</span>
              <span class="stat-value">${hack.dv}</span>
              <button class="btn btn-use-hack" onclick="usarHackCyberdeck(${hack.custoRAM}, '${sanitizar(hack.nome)}')" title="Usar este hack (desconta RAM)">
                ⚡
              </button>
            </span>
          </div>
        </div>
        <div class="hack-actions">
          <button class="btn btn-edit" onclick="abrirModalEdicao(${index})" title="Editar hack">
            📝
          </button>
          <button class="btn btn-delete" onclick="excluirHack(${index})" title="Excluir hack">
            <span>✕</span>
          </button>
        </div>
      </div>
      ${
        hack.descricao
          ? `<p class="hack-desc">${sanitizar(hack.descricao)}</p>`
          : ""
      }
      ${
        hack.notas
          ? `<p class="hack-notes"><strong>Notas:</strong> ${sanitizar(hack.notas)}</p>`
          : ""
      }
    `;
    
    // Adicionar event listeners para drag-and-drop
    hackElement.addEventListener("dragstart", (e) => {
      draggedIndex = index;
      hackElement.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });
    
    hackElement.addEventListener("dragend", (e) => {
      hackElement.classList.remove("dragging");
      document.querySelectorAll(".hack-item").forEach(item => {
        item.classList.remove("drag-over");
      });
    });
    
    hackElement.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (draggedIndex !== null && draggedIndex !== index) {
        hackElement.classList.add("drag-over");
      }
    });
    
    hackElement.addEventListener("dragleave", (e) => {
      hackElement.classList.remove("drag-over");
    });
    
    hackElement.addEventListener("drop", async (e) => {
      e.preventDefault();
      if (draggedIndex !== null && draggedIndex !== index) {
        await reordenarHacks(draggedIndex, index);
      }
      hackElement.classList.remove("drag-over");
      draggedIndex = null;
    });
    
    container.appendChild(hackElement);
  });
}

// ============================================
// AÇÕES - Adicionar e excluir hacks
// ============================================

async function adicionarHack(event) {
  console.log("🎯 adicionarHack chamado, PLUGIN_READY:", PLUGIN_READY);
  
  if (event) {
    event.preventDefault();
  }

  if (!USER_ID) {
    console.warn("⚠️ USER_ID não definido ainda - aguardando inicialização");
    mostrarToast("Plugin ainda está inicializando...", 'warning');
    setTimeout(() => adicionarHack(event), 100);
    return;
  }

  console.log("📝 Iniciando adição de novo hack...");
  
  const nomeInput = document.getElementById("hackName");
  const ramInput = document.getElementById("hackRam");
  const dvInput = document.getElementById("hackDv");
  const typeInput = document.getElementById("hackType");
  const effectInput = document.getElementById("hackEffect");
  const notesInput = document.getElementById("hackNotes");
  const form = event ? event.target : document.getElementById("hackForm");

  // Validar inputs
  if (!nomeInput || !ramInput || !dvInput || !typeInput) {
    mostrarToast("Erro ao acessar formulário", 'error');
    return;
  }

  const nome = nomeInput.value.trim();
  const ram = parseInt(ramInput.value);
  const dv = parseInt(dvInput.value);
  const tipo = typeInput.value.trim();
  const descricao = effectInput ? effectInput.value.trim() : "";
  const notas = notesInput ? notesInput.value.trim() : "";

  // Validações
  if (!nome) {
    mostrarToast("Nome do hack é obrigatório", 'error');
    return;
  }

  if (isNaN(ram) || ram < 1 || ram > 20) {
    mostrarToast("RAM deve ser entre 1 e 20", 'error');
    return;
  }

  if (isNaN(dv) || dv < 0 || dv > 20) {
    mostrarToast("DV deve ser entre 0 e 20", 'error');
    return;
  }

  if (!tipo || !HACK_TYPES[tipo]) {
    mostrarToast("Tipo de hack é obrigatório", 'error');
    return;
  }

  // Criar hack
  const novoHack = {
    id: Date.now().toString(),
    nome: nome,
    custoRAM: ram,
    dv: dv,
    tipo: tipo,
    descricao: descricao,
    notas: notas,
    criadoEm: new Date().toISOString()
  };

  // Salvar
  const hacks = await carregarHacksLocal();
  hacks.push(novoHack);
  
  if (await salvarHacksLocal(hacks)) {
    console.log("✓ Novo hack adicionado:", nome);
    form.reset();
    await renderizarHacks();
    mostrarToast(`✓ "${nome}" adicionado ao cyberdeck!`, 'success');
  } else {
    mostrarToast("Erro ao salvar hack", 'error');
  }
}

async function importarHack(hackId) {
  // Primeiro verificar se é um hack especial
  const hackEspecial = HACKS_ESPECIAIS.find(h => h.id === hackId);
  if (hackEspecial) {
    return await importarHackEspecial(hackId);
  }

  // Procurar no banco de hacks do sistema
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
    tipo: hackOriginal.tipo || "quickhacking",
    descricao: hackOriginal.descricao,
    origem: "sistema",
    criadoEm: new Date().toISOString()
  };

  const hacks = await carregarHacksLocal();
  hacks.push(novoHack);
  
  if (await salvarHacksLocal(hacks)) {
    console.log("✓ Hack importado:", hackOriginal.nome);
    await renderizarHacks();
    abrirAba("cyberdeck");
    alert(`✓ "${hackOriginal.nome}" adicionado ao seu cyberdeck!`);
  } else {
    alert("❌ Erro ao importar hack");
  }
}

async function usarHack(hackId) {
  console.log("🎯 usarHack chamado com ID:", hackId);
  
  // Procurar o hack no sistema
  const hackOriginal = HACKS_SISTEMA.find(h => h.id === hackId);
  if (!hackOriginal) {
    mostrarToast("❌ Hack não encontrado", "error");
    return;
  }

  // Carregar dados atuais
  const ramAtual = await carregarRAMLocal();
  
  // Validar se tem RAM suficiente
  if (ramAtual.ram < hackOriginal.custoRAM) {
    mostrarToast(`❌ RAM insuficiente! Precisa de ${hackOriginal.custoRAM}, tem ${ramAtual.ram}`, "error");
    return;
  }

  // Descontar a RAM
  const novaRAM = ramAtual.ram - hackOriginal.custoRAM;
  console.log(`💾 Usando hack "${hackOriginal.nome}" - Descontando ${hackOriginal.custoRAM} RAM (${ramAtual.ram} → ${novaRAM})`);
  
  await salvarRAMLocal(novaRAM, ramAtual.max);
  await renderizarRAM();
  
  mostrarToast(`✓ "${hackOriginal.nome}" usado! RAM: ${novaRAM}/${ramAtual.max}`, "success");
}

async function usarHackCyberdeck(custoRAM, nomeHack) {
  console.log("🎯 usarHackCyberdeck chamado:", nomeHack, "custo:", custoRAM);
  
  // Carregar dados atuais
  const ramAtual = await carregarRAMLocal();
  
  // Validar se tem RAM suficiente
  if (ramAtual.ram < custoRAM) {
    mostrarToast(`❌ RAM insuficiente! Precisa de ${custoRAM}, tem ${ramAtual.ram}`, "error");
    return;
  }

  // Descontar a RAM
  const novaRAM = ramAtual.ram - custoRAM;
  console.log(`💾 Usando hack "${nomeHack}" - Descontando ${custoRAM} RAM (${ramAtual.ram} → ${novaRAM})`);
  
  await salvarRAMLocal(novaRAM, ramAtual.max);
  await renderizarRAM();
  
  mostrarToast(`✓ "${nomeHack}" usado! RAM: ${novaRAM}/${ramAtual.max}`, "success");
}

async function reordenarHacks(indexDe, indexPara) {
  console.log(`🔄 Reordenando hacks: ${indexDe} → ${indexPara}`);
  
  const hacks = await carregarHacksLocal();
  
  // Validar índices
  if (indexDe < 0 || indexDe >= hacks.length || indexPara < 0 || indexPara >= hacks.length) {
    console.error("❌ Índices inválidos para reordenação");
    return;
  }
  
  // Remover hack do índice original
  const hackMovido = hacks.splice(indexDe, 1)[0];
  
  // Inserir hack no novo índice
  hacks.splice(indexPara, 0, hackMovido);
  
  // Salvar nova ordem
  if (await salvarHacksLocal(hacks)) {
    console.log("✓ Hacks reordenados com sucesso");
    await renderizarHacks();
  } else {
    console.error("❌ Erro ao salvar reordenação");
  }
}

async function excluirHack(index) {
  if (!confirm("Tem certeza que deseja excluir este hack?")) {
    return;
  }

  const hacks = await carregarHacksLocal();
  
  if (index < 0 || index >= hacks.length) {
    mostrarToast("❌ Hack não encontrado", "error");
    return;
  }

  const nomeDeletado = hacks[index].nome;
  hacks.splice(index, 1);

  if (await salvarHacksLocal(hacks)) {
    console.log("✓ Hack excluído:", nomeDeletado);
    mostrarToast(`"${nomeDeletado}" foi excluído`, "success");
    await renderizarHacks();
  } else {
    mostrarToast("❌ Erro ao excluir hack", "error");
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
// TOAST NOTIFICATIONS - Sistema de Confirmações Visuais
// ============================================

function mostrarToast(mensagem, tipo = 'success', duracao = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠'
  };

  toast.innerHTML = `
    <span class="toast-icon">${icons[tipo] || '●'}</span>
    <span class="toast-message">${sanitizar(mensagem)}</span>
  `;

  container.appendChild(toast);

  // Auto-remover após duracao
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, duracao);
}

// ============================================
// EDITAR HACK - Modal e Funções
// ============================================

function abrirModalEdicao(index) {
  carregarHacksLocal().then(hacks => {
    if (index < 0 || index >= hacks.length) {
      mostrarToast('Hack não encontrado', 'error');
      return;
    }

    const hack = hacks[index];
    
    // Preencher formulário de edição
    document.getElementById('editHackIndex').value = index;
    document.getElementById('editHackName').value = hack.nome;
    document.getElementById('editHackRam').value = hack.custoRAM;
    document.getElementById('editHackDv').value = hack.dv;
    document.getElementById('editHackType').value = hack.tipo || 'quickhacking';
    document.getElementById('editHackEffect').value = hack.descricao || '';
    document.getElementById('editHackNotes').value = hack.notas || '';

    // Mostrar modal
    const modal = document.getElementById('editModal');
    if (modal) {
      modal.classList.add('active');
    }
  });
}

function fecharModalEdicao() {
  const modal = document.getElementById('editModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

async function salvarEdicaoHack() {
  const index = parseInt(document.getElementById('editHackIndex').value);
  const nome = document.getElementById('editHackName').value.trim();
  const ram = parseInt(document.getElementById('editHackRam').value);
  const dv = parseInt(document.getElementById('editHackDv').value);
  const tipo = document.getElementById('editHackType').value;
  const descricao = document.getElementById('editHackEffect').value.trim();
  const notas = document.getElementById('editHackNotes').value.trim();

  // Validações
  if (!nome) {
    mostrarToast('Nome do hack é obrigatório', 'error');
    return;
  }

  if (isNaN(ram) || ram < 1 || ram > 20) {
    mostrarToast('RAM deve ser entre 1 e 20', 'error');
    return;
  }

  if (isNaN(dv) || dv < 0 || dv > 20) {
    mostrarToast('DV deve ser entre 0 e 20', 'error');
    return;
  }

  if (!tipo || !HACK_TYPES[tipo]) {
    mostrarToast('Tipo de hack é obrigatório', 'error');
    return;
  }

  const hacks = await carregarHacksLocal();
  
  if (index < 0 || index >= hacks.length) {
    mostrarToast('Hack não encontrado', 'error');
    return;
  }

  // Atualizar hack
  hacks[index].nome = nome;
  hacks[index].custoRAM = ram;
  hacks[index].dv = dv;
  hacks[index].tipo = tipo;
  hacks[index].descricao = descricao;
  hacks[index].notas = notas;

  if (await salvarHacksLocal(hacks)) {
    fecharModalEdicao();
    await renderizarHacks();
    mostrarToast(`✓ "${nome}" foi atualizado com sucesso!`, 'success');
    console.log('✓ Hack editado:', nome);
  } else {
    mostrarToast('Erro ao salvar alterações', 'error');
  }
}

// ============================================
// CODE BREAKER - Sistema de Desbloqueio
// ============================================

async function carregarCodigosDesbloqueados() {
  try {
    // Use chave simples e consistente para localStorage
    const chaveLoja = "cyberpunk_codebreaker_local";
    console.log("📂 Carregando códigos de localStorage com chave:", chaveLoja);
    
    let codigos = null;
    
    // Tentar carregar de localStorage (método primário)
    try {
      const stored = localStorage.getItem(chaveLoja);
      if (stored) {
        codigos = JSON.parse(stored);
        console.log("✓ Códigos encontrados em localStorage");
      } else {
        console.warn("⚠️ Nenhum código encontrado em localStorage, tentando OBR.storage...");
      }
    } catch (storageError) {
      console.warn("⚠️ Erro ao carregar códigos de localStorage:", storageError);
    }
    
    // Se localStorage não encontrou, tentar OBR.storage
    if (!codigos && USER_ID) {
      const chaveOBR = `${USER_ID}_${CODEBREAKER_STORAGE_KEY}`;
      if (typeof OBR !== 'undefined' && OBR.storage && OBR.storage.getItems) {
        try {
          console.log("📡 Tentando carregar códigos de OBR.storage");
          const dados = await OBR.storage.getItems([chaveOBR]);
          if (dados.length > 0) {
            codigos = JSON.parse(dados[0].value);
            console.log("✓ Códigos carregados via OBR.storage");
          }
        } catch (obrError) {
          console.warn("⚠️ OBR.storage códigos não disponível:", obrError.message);
        }
      }
    }
    
    codigos = codigos || [];
    return Array.isArray(codigos) ? codigos : [];
  } catch (error) {
    console.error("❌ Erro ao carregar códigos desbloqueados:", error);
    return [];
  }
}

async function salvarCodigosDesbloqueados(codigos) {
  try {
    // Use chave simples e consistente para localStorage
    const chaveLoja = "cyberpunk_codebreaker_local";
    console.log("💾 Salvando códigos para localStorage com chave:", chaveLoja);
    
    // Salvar em localStorage (método primário)
    try {
      const dataStr = JSON.stringify(codigos);
      localStorage.setItem(chaveLoja, dataStr);
      
      // Verificar imediatamente
      const verificacao = localStorage.getItem(chaveLoja);
      if (verificacao) {
        console.log("✅ localStorage verificado - códigos salvos com sucesso");
      } else {
        console.error("❌ localStorage falhou - códigos NÃO foram salvos");
      }
    } catch (storageError) {
      console.error("❌ Erro ao salvar códigos em localStorage:", storageError);
      return false;
    }
    
    // Também tentar salvar com chave do usuário em OBR.storage (opcional)
    if (USER_ID) {
      const chaveOBR = `${USER_ID}_${CODEBREAKER_STORAGE_KEY}`;
      if (typeof OBR !== 'undefined' && OBR.storage && OBR.storage.setItems) {
        try {
          console.log("📡 Também sincronizando códigos com OBR.storage");
          await OBR.storage.setItems([{
            key: chaveOBR,
            value: JSON.stringify(codigos)
          }]);
        } catch (obrError) {
          console.warn("⚠️ OBR.storage códigos não disponível (pode ignorar):", obrError.message);
        }
      }
    }
    
    console.log("✓ Códigos desbloqueados salvos com sucesso");
    return true;
  } catch (error) {
    console.error("❌ Erro ao salvar códigos:", error);
    return false;
  }
}

function tentarDesbloqueio() {
  if (!USER_ID) {
    console.warn("⚠️ USER_ID não definido ainda - aguardando inicialização");
    alert("⚠️ Plugin ainda está inicializando...");
    setTimeout(tentarDesbloqueio, 100);
    return;
  }
  const codeInput = document.getElementById("codeInput");
  const codeMessage = document.getElementById("codeMessage");
  
  if (!codeInput) {
    console.error("❌ Input de código não encontrado");
    return;
  }

  const codigo = codeInput.value.trim();

  if (codigo.length !== 12) {
    codeMessage.textContent = "⚠️ O código deve ter exatamente 12 caracteres!";
    codeMessage.className = "codebreaker-message error";
    return;
  }

  // Procurar o hack especial com este código
  const hackEspecial = HACKS_ESPECIAIS.find(h => h.codigo.toLowerCase() === codigo.toLowerCase());

  if (!hackEspecial) {
    codeMessage.textContent = "❌ Código inválido! Tente novamente.";
    codeMessage.className = "codebreaker-message error";
    console.log("❌ Código inválido:", codigo);
    return;
  }

  // Verificar se já foi desbloqueado
  carregarCodigosDesbloqueados().then(codigosDesbloqueados => {
    if (codigosDesbloqueados.includes(hackEspecial.id)) {
      codeMessage.textContent = "✓ Este hack já foi desbloqueado!";
      codeMessage.className = "codebreaker-message success";
      codeInput.value = "";
      return;
    }

    // Desbloquear o hack
    codigosDesbloqueados.push(hackEspecial.id);
    salvarCodigosDesbloqueados(codigosDesbloqueados).then(() => {
      codeMessage.textContent = `✓ Hack desbloqueado com sucesso: "${hackEspecial.nome}"!`;
      codeMessage.className = "codebreaker-message success";
      codeInput.value = "";

      // Atualizar a exibição de hacks desbloqueados
      renderizarHacksDesbloqueados();

      console.log("✓ Hack especial desbloqueado:", hackEspecial.nome);
    }).catch(error => {
      console.error("❌ Erro ao desbloquear hack:", error);
      codeMessage.textContent = "❌ Erro ao desbloquear hack!";
      codeMessage.className = "codebreaker-message error";
    });
  }).catch(error => {
    console.error("❌ Erro ao carregar códigos:", error);
    codeMessage.textContent = "❌ Erro ao processar código!";
    codeMessage.className = "codebreaker-message error";
  });
}

function renderizarHacksDesbloqueados() {
  if (!USER_ID) {
    console.warn("⚠️ USER_ID não definido ainda");
    return;
  }
  
  carregarCodigosDesbloqueados().then(codigosDesbloqueados => {
    const container = document.getElementById("codebredHacksList");

    if (!container) {
      console.warn("⚠️ Container de hacks desbloqueados não encontrado");
      return;
    }

    container.innerHTML = "";

    // Encontrar os hacks desbloqueados
    const hacksParaExibir = HACKS_ESPECIAIS.filter(h => codigosDesbloqueados.includes(h.id));

    if (hacksParaExibir.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔒</div>
          <p>Nenhum hack desbloqueado</p>
          <small>Digite um código válido para desbloquear hacks especiais</small>
        </div>
      `;
      return;
    }

    // Renderizar hacks desbloqueados
    hacksParaExibir.forEach((hack) => {
      // Obter tradução
      const translation = getHackTranslation(hack.id);
      const nomeExibicao = translation ? translation.nome : hack.nome;
      const descExibicao = translation ? translation.descricao : hack.descricao;
      
      const hackElement = document.createElement("div");
      hackElement.className = "hack-item hack-item-market hack-special";
      const tipoInfo = HACK_TYPES[hack.tipo] || HACK_TYPES.quickhacking;
      const badgeHTML = hack.tipo ? `<span class="hack-badge hack-badge-${hack.tipo}">${tipoInfo.icon} ${tipoInfo.nome}</span>` : "";
      
      hackElement.innerHTML = `
        <div class="hack-header">
          <div class="hack-info">
            <h4 class="hack-name">🔓 ${sanitizar(nomeExibicao)}</h4>
            <div class="hack-meta">
              ${badgeHTML}
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
          <button class="btn btn-install" onclick="importarHack('${hack.id}')" title="Adicionar ao Cyberdeck">
            <span>+</span>
          </button>
        </div>
        ${descExibicao ? `<p class="hack-desc">${sanitizar(descExibicao)}</p>` : ""}
      `;
      container.appendChild(hackElement);
    });

    console.log("✓ Hacks desbloqueados renderizados:", hacksParaExibir.length);
  });
}

// Modificar a função importarHack para suportar hacks especiais
async function importarHackEspecial(hackId) {
  const hackOriginal = HACKS_ESPECIAIS.find(h => h.id === hackId);
  if (!hackOriginal) {
    alert("❌ Hack não encontrado");
    return;
  }

  const novoHack = {
    id: Date.now().toString(),
    nome: hackOriginal.nome,
    custoRAM: hackOriginal.custoRAM,
    dv: hackOriginal.dv,
    tipo: hackOriginal.tipo || "quickhacking",
    descricao: hackOriginal.descricao,
    origem: "especial",
    criadoEm: new Date().toISOString()
  };

  const hacks = await carregarHacksLocal();
  hacks.push(novoHack);

  if (await salvarHacksLocal(hacks)) {
    console.log("✓ Hack especial importado:", hackOriginal.nome);
    await renderizarHacks();
    abrirAba("cyberdeck");
    alert(`✓ "${hackOriginal.nome}" adicionado ao seu cyberdeck!`);
  } else {
    alert("❌ Erro ao importar hack");
  }
}

// ============================================
// CHARACTER SHEET FUNCTIONS
// ============================================

// Mapping de papéis e suas habilidades
const ROLE_ABILITIES = {
  solo: {
    name: "Solo",
    ability: "Percepção de Combate: Permite que o Solista aloque pontos em diferentes sub-habilidades de combate no início de um turno, como bônus em Iniciativa, Precisão (Ataque), Dano ou Esquiva. É o mestre da sobrevivência e letalidade."
  },
  "trilha-rede": {
    name: "Trilha-Rede",
    ability: "Interface: É a capacidade de projetar sua consciência em redes de computadores. Permite realizar ações no Cyberespaço, como usar programas para atacar, quebrar senhas e controlar sistemas de segurança (torretas, câmeras)."
  },
  tecnico: {
    name: "Técnico",
    ability: "Fabricar: Dividida em especialidades, permite que o Técnico conserte itens, modifique equipamentos (tornando armas melhores que as de fábrica) e até invente tecnologias novas que não existem no mercado."
  },
  medtech: {
    name: "Medtech",
    ability: "Medicina: Permite realizar cirurgias críticas (para curar ferimentos que primeiros socorros não resolvem), fabricar e aplicar drogas farmacêuticas personalizadas e instalar/reparar cibernéticos avançados."
  },
  roqueiro: {
    name: "Roqueiro (Rockerboy)",
    ability: "Impacto Carismático: Representa sua influência sobre os fãs. Em níveis baixos, pode conseguir pequenos favores (bebidas, informações); em níveis altos, pode incitar uma multidão a iniciar uma rebelião ou proteger o personagem."
  },
  midia: {
    name: "Mídia",
    ability: "Credibilidade: A capacidade de convencer o público da verdade. Um Mídia pode publicar histórias que destroem a reputação de corporações ou indivíduos poderosos, além de ter fontes que fornecem informações secretas."
  },
  executivo: {
    name: "Executivo",
    ability: "Trabalho em Equipe: O Executivo tem acesso a recursos corporativos. Ele começa com um terno e um apartamento pagos pela empresa, e pode recrutar uma equipe de subordinados (guarda-costas, motoristas ou técnicos) que o auxiliam diretamente."
  },
  fixer: {
    name: "Fixer",
    ability: "Operador: É o mestre do mercado negro. Permite localizar itens raros que não estão à venda comum, negociar preços melhores e ter contatos em todas as esferas da sociedade para resolver problemas."
  },
  nomade: {
    name: "Nômade",
    ability: "Moto: Dá acesso à frota de veículos da sua família nômade. Conforme sobe de nível, o personagem ganha veículos melhores ou pode adicionar modificações pesadas (como blindagem, armas e motores turbinados)."
  },
  policial: {
    name: "Policial",
    ability: "Reforço: Permite que o personagem use seu rádio para chamar apoio. Dependendo do seu nível, o reforço pode variar de dois policiais locais em uma viatura até uma equipe tática de elite em um veículo aéreo pesado."
  }
};

// Mapping de atributos para perícias
const SKILL_ATTRIBUTE_MAP = {
  // Perícias de Atenção
  "Concentração (COR)": "attrCor",
  "Ocultar/Revelar Objeto (INT)": "attrIntel",
  "Leitura Labial (INT)": "attrIntel",
  "Percepção (INT)": "attrIntel",
  "Rastrear (INT)": "attrIntel",
  
  // Perícias Corporais
  "Atletismo (COR)": "attrCor",
  "Contorcionismo (COR)": "attrCor",
  "Dançar (COR)": "attrCor",
  "Resistência (FOR)": "attrFor",
  "Resistência à Tortura/Drogas (FOR)": "attrFor",
  "Furtividade (COR)": "attrCor",
  
  // Perícias de Condução
  "Dirigir Veículo Terrestre (REF)": "attrRefl",
  "Pilotar Veículo Aéreo x2 (REF)": "attrRefl",
  "Pilotar Veículo Marítimo (REF)": "attrRefl",
  "Motocicleta (REF)": "attrRefl",
  
  // Perícias de Educação
  "Contabilidade (INT)": "attrIntel",
  "Lidar com Animais (INT)": "attrIntel",
  "Burocracia (INT)": "attrIntel",
  "Negócios (INT)": "attrIntel",
  "Composição (INT)": "attrIntel",
  "Criminologia (INT)": "attrIntel",
  "Criptografia (INT)": "attrIntel",
  "Dedução (INT)": "attrIntel",
  "Educação (INT)": "attrIntel",
  "Apostar (INT)": "attrIntel",
  
  // Perícias de Luta
  "Briga (COR)": "attrCor",
  "Evasão (COR)": "attrCor",
  "Artes Marciais x2 (COR)": "attrCor",
  "Armas Brancas (COR)": "attrCor",
  
  // Perícias de Armas
  "Arqueirismo (REF)": "attrRefl",
  "Automática x2 (REF)": "attrRefl",
  "Armas Curtas (REF)": "attrRefl",
  "Armas Pesadas x2 (REF)": "attrRefl",
  "Fuzil (REF)": "attrRefl",
  
  // Perícias Técnicas
  "Tecnologia de Veículos Aéreos (TEC)": "attrTec",
  "Tecnologia Básica (TEC)": "attrTec",
  "Cibertecnologia (TEC)": "attrTec",
  "Demolições x2 (TEC)": "attrTec",
  "Eletrônica/Tec. de Segurança x2 (TEC)": "attrTec",
  "Primeiros Socorros (TEC)": "attrTec",
  "Falsificação (TEC)": "attrTec",
  "Tecnologia de Veículo Terrestre (TEC)": "attrTec",
  "Pintar/Desenhar/Esculpir (TEC)": "attrTec",
  "Medicamentos x2 (TEC)": "attrTec",
  "Fotografia e Filmagem (TEC)": "attrTec",
  "Arrombamento (TEC)": "attrTec",
  "Furto (TEC)": "attrTec",
  "Tecnologia de Veículo Marítimo (TEC)": "attrTec",
  "Tecnologia de Armas/Armeiro (TEC)": "attrTec"
};

// Salvar dados do personagem
function salvarPersonagem() {
  const armorSelect = document.getElementById("charArmor").value;
  let armorValue = parseInt(armorSelect) || 0;
  
  // Se for customizada, pega o valor do input customizado
  if (armorSelect === "custom") {
    armorValue = parseInt(document.getElementById("charArmorCustom").value) || 0;
  }
  
  const personagem = {
    nome: document.getElementById("charName").value,
    nivel: parseInt(document.getElementById("charLevel").value) || 1,
    saude: parseInt(document.getElementById("charHealth").value) || 10,
    papel: document.getElementById("charRole").value,
    habilidadePapel: document.getElementById("charRoleAbility").value,
    humanidade: parseInt(document.getElementById("charHumanity").value) || 100,
    armadura: armorValue,
    atributos: {
      intel: parseInt(document.getElementById("attrIntel").value) || 3,
      refl: parseInt(document.getElementById("attrRefl").value) || 3,
      tec: parseInt(document.getElementById("attrTec").value) || 3,
      emp: parseInt(document.getElementById("attrEmp").value) || 3,
      sor: parseInt(document.getElementById("attrSor").value) || 3,
      for: parseInt(document.getElementById("attrFor").value) || 3,
      cor: parseInt(document.getElementById("attrCor").value) || 3,
      man: parseInt(document.getElementById("attrMan").value) || 3
    },
    pericias: {}
  };

  // Coletar dados das perícias
  document.querySelectorAll(".skill-item").forEach(skillItem => {
    const label = skillItem.querySelector("label").textContent;
    const levelInput = skillItem.querySelector(".skill-level");
    const level = parseInt(levelInput.value) || 0;
    
    if (level > 0) {
      personagem.pericias[label] = level;
    }
  });

  // Salvar no localStorage
  try {
    const chavePersonagem = obterChaveUsuario("cyberpunk_character");
    localStorage.setItem(chavePersonagem, JSON.stringify(personagem));
    console.log("✓ Personagem salvo:", personagem);
  } catch (error) {
    console.error("❌ Erro ao salvar personagem:", error);
    mostrarNotificacao("❌ Erro ao salvar personagem", "error");
  }
}

// Carregar dados do personagem
function carregarPersonagem() {
  try {
    const chavePersonagem = obterChaveUsuario("cyberpunk_character");
    const dados = localStorage.getItem(chavePersonagem);
    
    if (dados) {
      const personagem = JSON.parse(dados);
      
      // Preencher dados básicos
      document.getElementById("charName").value = personagem.nome || "";
      document.getElementById("charLevel").value = personagem.nivel || 1;
      document.getElementById("charHealth").value = personagem.saude || 10;
      document.getElementById("charRole").value = personagem.papel || "";
      document.getElementById("charRoleAbility").value = personagem.habilidadePapel || "";
      document.getElementById("charHumanity").value = personagem.humanidade || 100;
      
      // Restaurar armadura - verificar se é um preset ou customizada
      const armorValue = personagem.armadura || 0;
      const armorSelect = document.getElementById("charArmor");
      
      if (armorValue === 0) {
        armorSelect.value = "0";
      } else if (armorValue === 5) {
        armorSelect.value = "5";
      } else if (armorValue === 10) {
        armorSelect.value = "10";
      } else {
        armorSelect.value = "custom";
        document.getElementById("charArmorCustom").value = armorValue;
        document.getElementById("charArmorCustom").style.display = "block";
      }
      
      // Preencher atributos
      if (personagem.atributos) {
        document.getElementById("attrIntel").value = personagem.atributos.intel || 3;
        document.getElementById("attrRefl").value = personagem.atributos.refl || 3;
        document.getElementById("attrTec").value = personagem.atributos.tec || 3;
        document.getElementById("attrEmp").value = personagem.atributos.emp || 3;
        document.getElementById("attrSor").value = personagem.atributos.sor || 3;
        document.getElementById("attrFor").value = personagem.atributos.for || 3;
        document.getElementById("attrCor").value = personagem.atributos.cor || 3;
        document.getElementById("attrMan").value = personagem.atributos.man || 3;
      }
      
      // Preencher perícias
      if (personagem.pericias) {
        document.querySelectorAll(".skill-item").forEach(skillItem => {
          const label = skillItem.querySelector("label").textContent;
          const levelInput = skillItem.querySelector(".skill-level");
          
          if (personagem.pericias[label]) {
            levelInput.value = personagem.pericias[label];
          }
        });
      }
      
      atualizarPericiasAtributo();
      console.log("✓ Personagem carregado");
    }
  } catch (error) {
    console.error("❌ Erro ao carregar personagem:", error);
  }
}

// Atualizar cálculos das perícias
function atualizarPericiasAtributo() {
  document.querySelectorAll(".skill-item").forEach(skillItem => {
    const levelInput = skillItem.querySelector(".skill-level");
    const attrInput = skillItem.querySelector(".skill-attr");
    const baseInput = skillItem.querySelector(".skill-base");
    const attrId = levelInput.getAttribute("data-attr");
    
    const attrValue = parseInt(document.getElementById(attrId).value) || 0;
    const levelValue = parseInt(levelInput.value) || 0;
    const baseValue = attrValue + levelValue;
    
    attrInput.value = attrValue;
    baseInput.value = baseValue > 0 ? baseValue : "";
  });
  
  // Atualizar contadores de perícias
  atualizarContadoresPericia();
}

// Aumentar valor do atributo
function incrementarAtributo(attrId) {
  const input = document.getElementById(attrId);
  if (!input) return;
  
  let value = parseInt(input.value) || 0;
  if (value < 20) {
    input.value = value + 1;
    atualizarPericiasAtributo();
    atualizarCorAtributo(attrId);
  }
}

// Diminuir valor do atributo
function decrementarAtributo(attrId) {
  const input = document.getElementById(attrId);
  if (!input) return;
  
  let value = parseInt(input.value) || 0;
  if (value > 0) {
    input.value = value - 1;
    atualizarPericiasAtributo();
    atualizarCorAtributo(attrId);
  }
}

// Zerar valor do atributo
function zerarAtributo(attrId) {
  const input = document.getElementById(attrId);
  if (!input) return;
  
  input.value = 0;
  atualizarPericiasAtributo();
  atualizarCorAtributo(attrId);
}

// Atualizar cor de feedback do atributo
function atualizarCorAtributo(attrId) {
  const input = document.getElementById(attrId);
  if (!input) return;
  
  const value = parseInt(input.value) || 0;
  
  // Remover todas as classes de cor
  input.classList.remove("attr-low", "attr-medium", "attr-high", "attr-max");
  
  // Adicionar a cor apropriada
  if (value <= 2) {
    input.classList.add("attr-low");
  } else if (value <= 8) {
    input.classList.add("attr-medium");
  } else if (value <= 15) {
    input.classList.add("attr-high");
  } else {
    input.classList.add("attr-max");
  }
}

// Atualizar contadores de perícias por categoria
function atualizarContadoresPericia() {
  const categorias = {
    "atencao": 5,
    "corporais": 6,
    "conducao": 4,
    "educacao": 10,
    "luta": 4,
    "armas": 5,
    "tecnicas": 15
  };
  
  for (const [categoria, total] of Object.entries(categorias)) {
    const counter = document.querySelector(`.skill-category-count[data-category="${categoria}"]`);
    
    if (counter) {
      // Encontrar a categoria pai
      const categorySection = counter.closest(".skill-category");
      
      if (categorySection) {
        // Contar perícias preenchidas nesta categoria
        const skills = categorySection.querySelectorAll(".skill-item .skill-level");
        let preenchidas = 0;
        
        skills.forEach(levelInput => {
          const levelValue = parseInt(levelInput.value) || 0;
          if (levelValue > 0) {
            preenchidas++;
          }
        });
        
        // Atualizar o contador
        counter.textContent = `${preenchidas}/${total}`;
        
        // Adicionar classe 'active' se há perícias preenchidas
        if (preenchidas > 0) {
          counter.classList.add("active");
        } else {
          counter.classList.remove("active");
        }
      }
    }
  }
}

// Atualizar habilidade do papel quando o papel é selecionado
function atualizarHabilidadePapel(roleValue) {
  const habilidadeField = document.getElementById("charRoleAbility");
  
  if (roleValue && ROLE_ABILITIES[roleValue]) {
    const roleData = ROLE_ABILITIES[roleValue];
    habilidadeField.value = roleData.ability;
  } else {
    habilidadeField.value = "";
  }
}

// Atualizar valor de armadura quando selecionado preset
function atualizarValorArmadura(value) {
  const armorCustomInput = document.getElementById("charArmorCustom");
  
  if (value === "custom") {
    armorCustomInput.style.display = "block";
    // Não altera o valor de charArmor ainda, apenas mostra o input customizado
  } else {
    armorCustomInput.style.display = "none";
    // Select será preenchido com o valor selecionado
  }
}

// Filtrar perícias por busca
function filtrarPericia(termo) {
  const termoLower = termo.toLowerCase();
  const skillItems = document.querySelectorAll(".skill-item");
  const skillCategories = document.querySelectorAll(".skill-category");
  let totalResults = 0;
  let totalVisible = 0;
  
  // Primeiro, mostrar/esconder items baseado na busca
  skillItems.forEach(item => {
    const label = item.querySelector("label").textContent.toLowerCase();
    const matches = termo === "" || label.includes(termoLower);
    
    if (matches) {
      item.classList.remove("hidden");
      totalVisible++;
    } else {
      item.classList.add("hidden");
    }
  });
  
  // Depois, mostrar/esconder categorias que não têm items visíveis
  skillCategories.forEach(category => {
    const visibleItems = category.querySelectorAll(".skill-item:not(.hidden)");
    
    if (visibleItems.length > 0) {
      category.classList.remove("all-hidden");
      totalResults += visibleItems.length;
    } else {
      category.classList.add("all-hidden");
    }
  });
  
  // Atualizar contador de resultados
  const resultSpan = document.getElementById("skillSearchResult");
  if (termo === "") {
    resultSpan.textContent = "";
  } else {
    resultSpan.textContent = `${totalResults} resultado${totalResults !== 1 ? "s" : ""}`;
  }
}

// Limpar busca ao carregar personagem
function limparBuscaPericia() {
  const searchInput = document.getElementById("skillSearchInput");
  if (searchInput) {
    searchInput.value = "";
    filtrarPericia("");
  }
}

// Inicializar listeners para perícias
function inicializarPericiasListeners() {
  // Listeners para mudanças no nível de perícias
  document.querySelectorAll(".skill-level").forEach(input => {
    input.addEventListener("change", atualizarPericiasAtributo);
  });
  
  // Listeners para atributos
  document.querySelectorAll(".attr-value input").forEach(input => {
    input.addEventListener("change", () => {
      const attrId = input.id;
      atualizarPericiasAtributo();
      atualizarCorAtributo(attrId);
    });
  });
  
  // Carrega dados salvos
  carregarPersonagem();
  
  // Limpar busca ao carregar
  limparBuscaPericia();
  
  // Atualizar cores iniciais dos atributos
  document.querySelectorAll("[id^='attr']").forEach(input => {
    atualizarCorAtributo(input.id);
  });
  
  // Atualizar contadores de perícias
  atualizarContadoresPericia();
}

// Mostrar notificação (usa sistema de toast existente)
function mostrarNotificacao(mensagem, tipo = "success") {
  mostrarToast(mensagem, tipo);
}

// Atualizar visualização de saúde com barra e círculos de salvação
function atualizarVisualizacaoSaude() {
  const healthInput = document.getElementById("charHealth");
  const healthMaxInput = document.getElementById("charHealthMax");
  const healthValue = parseInt(healthInput.value) || 0;
  const maxHealth = parseInt(healthMaxInput.value) || 20;
  
  // Atualizar max do input de saúde atual
  healthInput.max = maxHealth;
  
  const healthPercent = Math.max(0, Math.min(100, (healthValue / maxHealth) * 100));
  
  // Atualizar barra de progresso
  const healthBarFill = document.getElementById("healthBarFill");
  const healthValueSpan = document.getElementById("healthValue");
  const salvationCircles = document.getElementById("salvationCircles");
  const btnRestore = document.querySelector(".btn-restore");
  
  healthBarFill.style.width = healthPercent + "%";
  healthValueSpan.textContent = `${healthValue}/${maxHealth}`;
  
  // Atualizar cores baseado no nível de saúde
  healthBarFill.classList.remove("critical", "warning", "good");
  healthValueSpan.classList.remove("critical-text");
  
  if (healthValue <= 0) {
    // Mostrar círculos de salvação e botão de restaurar
    healthBarFill.classList.add("critical");
    healthValueSpan.classList.add("critical-text");
    healthValueSpan.textContent = "MORTE ⚰️";
    salvationCircles.style.display = "flex";
    if (btnRestore) btnRestore.style.display = "block";
  } else if (healthValue <= Math.ceil(maxHealth * 0.25)) {
    healthBarFill.classList.add("critical");
    healthValueSpan.classList.add("critical-text");
    salvationCircles.style.display = "none";
    if (btnRestore) btnRestore.style.display = "none";
  } else if (healthValue <= Math.ceil(maxHealth * 0.5)) {
    healthBarFill.classList.add("warning");
    salvationCircles.style.display = "none";
    if (btnRestore) btnRestore.style.display = "none";
  } else {
    healthBarFill.classList.add("good");
    salvationCircles.style.display = "none";
    if (btnRestore) btnRestore.style.display = "none";
  }
  
  // Salvar automaticamente
  salvarPersonagem();
}

// Restaurar vida +1 ponto
function restaurarVida() {
  const healthInput = document.getElementById("charHealth");
  const healthValue = parseInt(healthInput.value) || 0;
  
  if (healthValue < 20) {
    healthInput.value = Math.min(20, healthValue + 1);
    atualizarVisualizacaoSaude();
  } else if (healthValue === 0) {
    // Se estiver morto, ressuscita com 1 ponto
    healthInput.value = 1;
    atualizarVisualizacaoSaude();
  }
}

// Clique nos círculos de salvação para usá-los
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    setupSalvationCircles();
  }, 100);
});

function setupSalvationCircles() {
  const salvationCircles = document.querySelectorAll(".salvation-circle");
  salvationCircles.forEach((circle, index) => {
    circle.addEventListener("click", () => {
      // Apenas apagar o círculo (marcar como usado)
      if (!circle.classList.contains("used")) {
        circle.classList.add("used");
        
        // Verificar se todos os círculos foram usados
        const allUsed = document.querySelectorAll(".salvation-circle.used").length === 3;
        
        if (allUsed) {
          // Todos os círculos apagaram - personagem morre
          const healthInput = document.getElementById("charHealth");
          healthInput.value = 0;
          atualizarVisualizacaoSaude();
        }
      }
    });
  });
}

// ============================================
// EXPOSIÇÃO GLOBAL DE FUNÇÕES (para uso inline no HTML)
// ============================================
window.abrirAba = abrirAba;
window.definirMaxRAM = definirMaxRAM;
window.aumentarRAM = aumentarRAM;
window.diminuirRAM = diminuirRAM;
window.resetarRAM = resetarRAM;
window.adicionarHack = adicionarHack;
window.tentarDesbloqueio = tentarDesbloqueio;
window.alterarIdioma = alterarIdioma;
window.salvarPersonagem = salvarPersonagem;
window.atualizarVisualizacaoSaude = atualizarVisualizacaoSaude;
window.atualizarHabilidadePapel = atualizarHabilidadePapel;
window.atualizarValorArmadura = atualizarValorArmadura;
window.restaurarVida = restaurarVida;
window.incrementarAtributo = incrementarAtributo;
window.decrementarAtributo = decrementarAtributo;
window.atualizarPericiasAtributo = atualizarPericiasAtributo;
window.atualizarCorAtributo = atualizarCorAtributo;
window.fecharModalEdicao = fecharModalEdicao;
window.salvarEdicaoHack = salvarEdicaoHack;

console.log("✓ Funções globais expostas no objeto window");
