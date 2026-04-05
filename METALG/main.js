// ═══════════════════════════════════════════════════════════
//  VYPER PESSOAL AGENT SYSTEM — main.js
//  Firebase Firestore backend + full app logic
// ═══════════════════════════════════════════════════════════
//
//  ⚙️  CONFIGURAÇÃO NECESSÁRIA:
//  1. Crie um projeto em https://console.firebase.google.com
//  2. Ative o Firestore Database (modo de teste por enquanto)
//  3. Cole suas credenciais abaixo substituindo os valores
//  4. Mude GM_PASSWORD para a senha do mestre que preferir
//
// ═══════════════════════════════════════════════════════════

import { initializeApp }        from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ──────────────────────────────────────────────────────────
//  ⚙️  CONFIGURAÇÃO FIREBASE — substitua com seus valores
// ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyD5-uC4T9wbaIVZMMG14qU2Z5ad_vDUeDs",
  authDomain: "vypersys.firebaseapp.com",
  projectId: "vypersys",
  storageBucket: "vypersys.firebasestorage.app",
  messagingSenderId: "15989413477",
  appId: "1:15989413477:web:0cc2137f4c5964ceb6988c",
  measurementId: "G-H97W0F0759"
};

// ──────────────────────────────────────────────────────────
//  ⚙️  SENHA DO MESTRE — altere como quiser
//  Para gerar um novo hash via PowerShell:
//    [System.BitConverter]::ToString([System.Security.Cryptography.SHA256]::Create()
//      .ComputeHash([System.Text.Encoding]::UTF8.GetBytes("NOVA_SENHA")))
//      .Replace('-','').ToLower()
// ──────────────────────────────────────────────────────────
const GM_PASSWORD_HASH = "f6615ac3944228857e9c800def9a606874baaf3d1cf9425707c1c1d640f24d5e";

// ──────────────────────────────────────────────────────────
//  CONSTANTES DO SISTEMA
// ──────────────────────────────────────────────────────────
const GRADES = ["F", "E", "D", "D+", "C", "C+", "B", "B+", "A", "A+", "A++", "S", "S+"];

const GRADE_CLASS_MAP = {
  "F":   "grade-f",  "E":  "grade-e",  "D":  "grade-d",  "D+": "grade-dp",
  "C":   "grade-c",  "C+": "grade-cp", "B":  "grade-b",  "B+": "grade-bp",
  "A":   "grade-a",  "A+": "grade-ap", "A++":"grade-app","S":  "grade-s",
  "S+":  "grade-sp"
};

const ATTRS = ["fisico", "intelecto", "reflexos", "resiliencia", "presenca"];

const ATTR_LABELS = {
  fisico: "FÍSICO", intelecto: "INTELECTO",
  reflexos: "REFLEXOS", resiliencia: "RESILIÊNCIA", presenca: "PRESENÇA"
};

// ──────────────────────────────────────────────────────────
//  DOCUMENTS CONFIG — adicione novos documentos aqui
// ──────────────────────────────────────────────────────────
const DOCUMENTS = [
  {
    id:      'doc_placeholder',
    title:   'Papel Estranho',
    image:   'imagens/documentos/documento01.jpg',
    uvImage: 'imagens/documentos/documento01_uv.jpg'   // versão UV real — null = usa filtro CSS apenas
  },
  {
    id:      'doc_02',             
    title:   'Estátua de Bailarina',
    image:   'imagens/documentos/estatua1.png',
    uvImage: 'imagens/documentos/estatua2.png'  // ou null se não tiver versão UV
  },
  {
    id:      'doc_mapa_riveria',
    title:   'Mapa de Rivéria',
    image:   'imagens/documentos/mapariveria.png',
    uvImage: 'imagens/documentos/mapariveria_uv.png'
  }
];

const DEFAULT_CHAR = () => ({
  codename:   "",
  nome:       "",
  origem:     "[CONFIDENCIAL]",
  photo:      "",
  statusAtivo:"ativo",    // ativo | inativo | morto
  security:   "seguro",   // seguro | alerta | perigo | comprometido
  integrity:  5,
  patente:    1,
  xp:         0,
  armas:      [null, null],
  armaUnica:  null,
  bolsa:        { items: [], staged: [], unlockedRows: 2 },
  camuflagem:   null,
  attrs: {
    fisico:      "D",
    intelecto:   "D",
    reflexos:    "D",
    resiliencia: "D",
    presenca:    "D"
  },
  aparencia: {
    cor:        'vermelho',
    fotoFiltro: 'padrao',
    carimbo:    'nenhum'
  },
  psych: {
    insanidade: 0,      // 0-100
    medicado:   false,
    gatilhos:   []      // ids de efeitos ativos
  },
  statusNeg: [],        // ids de status negativos ativos
  mensagemCifrada: { texto: '', ts: 0 },
  paranormal: { nivel: 0 },   // 0-4: proximidade de entidade
  updatedAt: null
});

// ──────────────────────────────────────────────────────────
//  FIREBASE INIT
// ──────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────
//  DICAS DE CAMPO — presets
// ──────────────────────────────────────────────────────────
const DICAS_PRESETS = [
  {
    id:     'campo_visao',
    titulo: 'CAMPO DE VIS\u00c3O / ALERTA',
    texto:  'Quando um inimigo entra em ALERTA.',
    imagem: 'imagens/dicas/campo_visao_alerta.png'
  },
  {
    id:     'campo_visao1',
    titulo: 'CAMPO DE VIS\u00c3O / NORMAL',
    texto:  'Quando um inimigo não suspeita de nada.',
    imagem: 'imagens/dicas/campo_visao_normal.png'
  }
];

const ARMA_TIPOS = {
  pistola:    { label: 'PISTOLA',    img: 'icones/armas/pistola.png' },
  espingarda: { label: 'ESPINGARDA', img: 'icones/armas/espingarda.png' },
  sniper:     { label: 'SNIPER',     img: 'icones/armas/sniper.png' },
  revolver:   { label: 'REVOLVER',   img: 'icones/armas/revolver.png' },
  outro:      { label: 'OUTRO',      img: '' },
  // Consumíveis
  kit_medico:  { label: 'KIT MÉDICO',     img: 'icones/itens/kit.png',            consumivel: true, ico: '✚' },
  municao:     { label: 'MUNIÇÃO',         img: 'icones/itens/munição.png',        consumivel: true, ico: '◈' },
  granada:     { label: 'GRANADA',         img: 'icones/itens/granada.png',        consumivel: true, ico: '⊛' },
  racao:       { label: 'RAÇÃO DE CAMPO',  img: 'icones/itens/ração.png',          consumivel: true, ico: '▣' },
  curativo:       { label: 'CURATIVO',        img: '',                              consumivel: true, ico: '✦' },
  estimulante:    { label: 'ESTIMULANTE',     img: 'icones/itens/estimulante.png',  consumivel: true, ico: '◉' },
  // Craft system — ingredientes e fabricados
  erva:           { label: 'ERVA MEDICINAL', img: 'icones/itens/erva.png',          consumivel: true, ingrediente: true, ico: '⊕' },
  comp_quimico:   { label: 'COMP. QUIMICO',  img: 'icones/itens/compquimico.png',   consumivel: true, ingrediente: true, ico: '⊗' },
  atadura:        { label: 'ATADURA',         img: 'icones/itens/atadura.png',       consumivel: true, ico: '✛' },
  medicamento_ps: { label: 'MEDICAMENTO',     img: 'icones/itens/psimedicamento.png',consumivel: true, ico: '◎' },
  estabilizador:  { label: 'ESTABILIZADOR',   img: 'icones/itens/estabilizador.png', consumivel: true, ico: '◑' },
  // Armamento craft — ingredientes
  polvora:        { label: 'POLVORA',          img: 'icones/itens/polvora.png',        consumivel: true, ingrediente: true, ico: '✤' },
  comp_explosivo: { label: 'COMP. EXPLOSIVO',  img: 'icones/itens/compexplosivo.png',  consumivel: true, ingrediente: true, ico: '⊠' },
  cristal_anomalo:{ label: 'CRISTAL ANOMALO',  img: 'icones/itens/cristal.png',        consumivel: true, ingrediente: true, ico: '◆' },
  sedativo:       { label: 'SEDATIVO',         img: 'icones/itens/sedativo.png',       consumivel: true, ingrediente: true, ico: '◐' },
  // Armamento craft — fabricados
  granada_quimica:  { label: 'GRANADA QUIM.',    img: 'icones/itens/granadaquimica.png', consumivel: true, ico: '⊙' },
  granada_potente:  { label: 'GRANADA POTENTE',  img: 'icones/itens/granadapotente.png', consumivel: true, ico: '⊘' },
  granada_danca:    { label: 'GRANADA DE DANCA', img: 'icones/itens/granadadanca.png',   consumivel: true, ico: '⊚' },
  sonifero:         { label: 'SONIFERO POTENTE', img: 'icones/itens/sonifero.png',       consumivel: true, ico: '◍' },
  bomba_incendiaria:{ label: 'BOMBA INCEND.',    img: '', consumivel: true, ico: '⊞' },
  // Medicamento craft — fabricados avancados
  adrenalina:       { label: 'ADRENALINA',       img: '', consumivel: true, ico: '↑' },
  antidoto:         { label: 'ANTIDOTO',         img: '', consumivel: true, ico: '⊹' },
  // Armadilhas craft — ingredientes
  fio_detonador:    { label: 'FIO DETONADOR',    img: '', consumivel: true, ingrediente: true, ico: '⌇' },
  pano:             { label: 'PANO',             img: '', consumivel: true, ingrediente: true, ico: '▭' },
  // Armadilhas craft — fabricados (MGS-inspired)
  mina_claymore:    { label: 'CLAYMORE',         img: '', consumivel: true, ico: '◫' },
  cilada_sono:      { label: 'CILADA DE SONO',   img: '', consumivel: true, ico: '◌' },
  alarme_campo:     { label: 'ALARME DE CAMPO',  img: '', consumivel: true, ico: '◯' },
  mina_atordoante:  { label: 'MINA ATORDOANTE',  img: '', consumivel: true, ico: '◻' },
  distracao:        { label: 'DISTRACAO',          img: '', consumivel: true, ico: '♀' },
  // ── Armas Únicas ──
  lancachamas: { label: 'LANÇA-CHAMAS', img: 'icones/armas/lancachamas.svg', unica: true },
  motosserra:  { label: 'MOTOSSERRA',   img: 'icones/armas/motoserra.svg',   unica: true },
  bazuca:      { label: 'BAZUCA',       img: 'icones/armas/bazuca.svg',       unica: true },
};

// Inventory sizes (cols × rows) for each weapon / consumable type
const ARMA_SIZES = {
  pistola:    { w: 1, h: 2 },
  revolver:   { w: 1, h: 2 },
  espingarda: { w: 2, h: 3 },
  sniper:     { w: 2, h: 4 },
  outro:      { w: 1, h: 2 },
  // Consumíveis — 1×1
  kit_medico:  { w: 1, h: 2 },
  municao:     { w: 1, h: 1 },
  granada:     { w: 1, h: 1 },
  racao:       { w: 1, h: 1 },
  curativo:       { w: 1, h: 1 },
  estimulante:    { w: 1, h: 2 },
  erva:           { w: 1, h: 1 },
  comp_quimico:   { w: 1, h: 1 },
  atadura:        { w: 1, h: 1 },
  medicamento_ps: { w: 1, h: 1 },
  estabilizador:  { w: 1, h: 1 },
  polvora:        { w: 1, h: 1 },
  comp_explosivo: { w: 1, h: 1 },
  cristal_anomalo:{ w: 1, h: 1 },
  sedativo:       { w: 1, h: 1 },
  granada_quimica:  { w: 1, h: 1 },
  granada_potente:  { w: 1, h: 1 },
  granada_danca:    { w: 1, h: 1 },
  sonifero:         { w: 1, h: 2 },
  bomba_incendiaria:{ w: 1, h: 1 },
  adrenalina:       { w: 1, h: 1 },
  antidoto:         { w: 1, h: 1 },
  fio_detonador:    { w: 1, h: 1 },
  pano:             { w: 1, h: 1 },
  mina_claymore:    { w: 1, h: 1 },
  cilada_sono:      { w: 1, h: 1 },
  alarme_campo:     { w: 1, h: 1 },
  mina_atordoante:  { w: 1, h: 1 },
  distracao:        { w: 1, h: 2 },
};

// Default uses per consumable type
const CONSUMIVEL_USOS = { kit_medico: 3, municao: 6, granada: 1, racao: 4, curativo: 3, estimulante: 2,
  erva: 1, comp_quimico: 1, atadura: 2, medicamento_ps: 2, estabilizador: 2,
  polvora: 1, comp_explosivo: 1, cristal_anomalo: 1, sedativo: 1,
  granada_quimica: 1, granada_potente: 1, granada_danca: 1, sonifero: 2,
  bomba_incendiaria: 1, adrenalina: 1, antidoto: 1,
  fio_detonador: 1, pano: 1,
  mina_claymore: 1, cilada_sono: 1, alarme_campo: 2, mina_atordoante: 1, distracao: 2 };

// Weapon attachment slot definitions
const ARMA_MODS = {
  supressor:  { label: 'SUPRESSOR',   ico: '▣', desc: 'Suprime assinatura de disparo.' },
  mira:       { label: 'MIRA TÁTICA', ico: '⊕', desc: 'Aumenta precisão a longa distância.' },
  carregador: { label: 'CARREGADOR+', ico: '▥', desc: 'Capacidade de munição estendida.' },
};

// Accent color per consumable type
const CONSUMIVEL_COR = {
  kit_medico:     '#dd4444',
  municao:        '#4488cc',
  granada:        '#cc6622',
  racao:          '#aa8833',
  curativo:       '#44bb66',
  estimulante:    '#9944cc',
  erva:           '#33aa44',
  comp_quimico:   '#3388cc',
  atadura:        '#55cc77',
  medicamento_ps: '#bb44ee',
  estabilizador:  '#44aacc',
  polvora:        '#999999',
  comp_explosivo: '#cc7722',
  cristal_anomalo:'#aa55ff',
  sedativo:       '#5599aa',
  granada_quimica:'#44cc66',
  granada_potente:'#ff4422',
  granada_danca:  '#ff44cc',
  sonifero:          '#7755cc',
  bomba_incendiaria: '#ff5500',
  adrenalina:        '#ff8800',
  antidoto:          '#44ddaa',
  fio_detonador:     '#cc9933',
  pano:              '#886644',
  mina_claymore:     '#cc4400',
  cilada_sono:       '#7744bb',
  alarme_campo:      '#ccaa22',
  mina_atordoante:   '#5588cc',
  distracao:          '#ff6699',
};

const BOLSA_COLS  = 7;
const BOLSA_ROWS  = 5;
const BOLSA_STEP  = 47; // cell px (46) + gap (1)

// ──────────────────────────────────────────────────────────
//  ARMAS ÚNICAS — propriedades especiais
// ──────────────────────────────────────────────────────────
const ARMA_UNICA_PROPS = {
  lancachamas: {
    cor: '#ff6600',
    tag: 'INCENDIÁRIO',
    propriedades: [
      { id: 'area',      label: 'ÁREA (CONE)',        desc: 'Atinge todos os alvos em um cone frontal de 2 hexágonos.' },
      { id: 'incendio',  label: 'INCENDIÁRIO',        desc: 'Alvos atingidos continuam em chamas por 3 turnos. -1 integridade por turno.' },
      { id: 'recarga',   label: 'RECARGA: TANQUE',    desc: 'Usa tanque de combustível. Não usa munição convencional. 6 cargas por tanque.' },
      { id: 'barulho',   label: 'BARULHO MÁXIMO',     desc: 'Impossível usar furtivamente. Alerta todos inimigos no raio de 4 hexágonos.' },
    ],
    aviso: 'PERIGO DE FOGO AMIGO — não dispare em aliados próximos.',
  },
  motosserra: {
    cor: '#ffaa00',
    tag: 'BERSERKER',
    propriedades: [
      { id: 'cac',       label: 'CORPO-A-CORPO',      desc: 'Alcance 0. Requer contato direto. Ignora cobertura do alvo.' },
      { id: 'blindagem', label: 'IGNORA BLINDAGEM',   desc: 'Perfura qualquer armadura ou escudo. Aplica dano integral.' },
      { id: 'berserk',   label: 'MODO BERSERKER',     desc: 'Ao eliminar um alvo, pode atacar imediatamente um alvo adjacente sem custo de ação.' },
      { id: 'ruido',     label: 'BARULHO: ALTO',      desc: 'Ativa alerta de área. -2 em testes de furtividade enquanto empunhada.' },
    ],
    aviso: 'AVISO: SANGUE PROJETADO EM 360°. USE PROTEÇÃO OCULAR.',
  },
  bazuca: {
    cor: '#88cc44',
    tag: 'EXPLOSIVO',
    propriedades: [
      { id: 'explosao',  label: 'EXPLOSÃO EM ÁREA',   desc: 'Raio de 2 hexágonos. Todos os alvos na zona recebem dano integral.' },
      { id: 'antiblind', label: 'ANTI-BLINDAGEM',     desc: 'Projétil perfurante. Destrói cobertura dura e veículos levemente blindados.' },
      { id: 'recarga',   label: 'RECARGA: 1 TURNO',   desc: 'Requer 1 turno completo de recarga após cada disparo. Sem ação de movimento.' },
      { id: 'guiado',    label: 'PROJÉTIL GUIADO',    desc: 'Com 1 ação adicional de mira, o projétil segue o alvo mesmo se mover.' },
    ],
    aviso: 'ZONA DE PERIGO TRASEIRA: 3 HEXÁGONOS. NÃO DISPARE EM ESPAÇOS FECHADOS.',
  },
};
// Available bolsa rows per patente level (Etapa 2 — capacity limit)
const BOLSA_ROWS_BY_PATENTE = { 1: 3, 2: 4, 3: 5, 4: 6 };

// ──────────────────────────────────────────────────────────
//  CRAFT — Efeitos ao usar + receitas de combinacao
// ──────────────────────────────────────────────────────────
const CONSUMIVEL_EFEITO = {
  curativo:       { integrity: 1 },
  atadura:        { integrity: 2 },
  estimulante:    { integrity: 3 },
  kit_medico:     { integrity: 4 },
  racao:          { integrity: 1 },
  erva:           { integrity: 1 },
  medicamento_ps: { insanidade: -15 },
  estabilizador:  { integrity: 1, insanidade: -25 },
  adrenalina:     { integrity: 5 },
  antidoto:       { integrity: 2, insanidade: -10 },
};

const CRAFT_RECIPES = [
  // ── MEDICAMENTOS ──
  {
    ingredientes: ['erva', 'erva'],
    resultado: { tipo: 'atadura', nome: 'ATADURA', usos: 2, usoMax: 2 },
    desc: 'Atadura de campo. Restaura 2 barras de integridade por uso.',
    categoria: 'medicamentos',
  },
  {
    ingredientes: ['erva', 'comp_quimico'],
    resultado: { tipo: 'estimulante', nome: 'ESTIMULANTE', usos: 2, usoMax: 2 },
    desc: 'Estimulante tatico. Restaura 3 barras de integridade por uso.',
    categoria: 'medicamentos',
  },
  {
    ingredientes: ['erva', 'erva', 'comp_quimico'],
    resultado: { tipo: 'kit_medico', nome: 'KIT MEDICO', usos: 3, usoMax: 3 },
    desc: 'Kit medico completo. Restaura 4 barras de integridade por uso.',
    categoria: 'medicamentos',
  },
  {
    ingredientes: ['comp_quimico', 'comp_quimico'],
    resultado: { tipo: 'medicamento_ps', nome: 'MEDICAMENTO', usos: 2, usoMax: 2 },
    desc: 'Medicamento psiquiatrico. Reduz insanidade em 15 por uso.',
    categoria: 'medicamentos',
  },
  {
    ingredientes: ['erva', 'comp_quimico', 'comp_quimico'],
    resultado: { tipo: 'estabilizador', nome: 'ESTABILIZADOR', usos: 2, usoMax: 2 },
    desc: 'Estabilizador psiquico. Restaura 1 barra de integridade e reduz insanidade em 25 por uso.',
    categoria: 'medicamentos',
  },
  {
    ingredientes: ['estimulante', 'comp_quimico'],
    resultado: { tipo: 'adrenalina', nome: 'ADRENALINA', usos: 1, usoMax: 1 },
    desc: 'Injecao de adrenalina sintetica. Recupera 5 barras de integridade instantaneamente.',
    categoria: 'medicamentos',
  },
  {
    ingredientes: ['comp_quimico', 'erva', 'erva'],
    resultado: { tipo: 'antidoto', nome: 'ANTIDOTO', usos: 1, usoMax: 1 },
    desc: 'Antidoto de amplo espectro. Neutraliza venenos e toxinas. Restaura 2 de integridade.',
    categoria: 'medicamentos',
  },
  // ── ARMAMENTOS ──
  {
    ingredientes: ['polvora', 'polvora'],
    resultado: { tipo: 'municao', nome: 'MUNICAO', usos: 6, usoMax: 6 },
    desc: 'Municao artesanal. 6 cargas por lote fabricado.',
    categoria: 'armamentos',
  },
  {
    ingredientes: ['comp_explosivo', 'polvora'],
    resultado: { tipo: 'granada', nome: 'GRANADA', usos: 1, usoMax: 1 },
    desc: 'Granada de fragmentacao. Explosao e dano em area.',
    categoria: 'armamentos',
  },
  {
    ingredientes: ['comp_quimico', 'comp_explosivo'],
    resultado: { tipo: 'granada_quimica', nome: 'GRANADA QUIM.', usos: 1, usoMax: 1 },
    desc: 'Libera gas corrosivo em area. Eficaz contra alvos sem protecao respiratoria.',
    categoria: 'armamentos',
  },
  {
    ingredientes: ['comp_explosivo', 'comp_explosivo', 'polvora'],
    resultado: { tipo: 'granada_potente', nome: 'GRANADA POTENTE', usos: 1, usoMax: 1 },
    desc: 'Detonacao de alta potencia. Raio de explosao e dano triplicados.',
    categoria: 'armamentos',
  },
  {
    ingredientes: ['cristal_anomalo', 'comp_explosivo'],
    resultado: { tipo: 'granada_danca', nome: 'GRANADA DE DANCA', usos: 1, usoMax: 1 },
    desc: 'Ao detonar, forca alvos proximos a dancar involuntariamente por tempo indeterminado.',
    categoria: 'armamentos',
  },
  {
    ingredientes: ['erva', 'erva', 'sedativo'],
    resultado: { tipo: 'sonifero', nome: 'SONIFERO POTENTE', usos: 2, usoMax: 2 },
    desc: 'Composto sedativo concentrado. Induz sono profundo imediato. Util para neutralizacoes silenciosas.',
    categoria: 'armamentos',
  },
  {
    ingredientes: ['comp_explosivo', 'comp_quimico', 'polvora'],
    resultado: { tipo: 'bomba_incendiaria', nome: 'BOMBA INCEND.', usos: 1, usoMax: 1 },
    desc: 'Dispositivo incendiario. Arremessada, cria area em chamas persistente onde detona.',
    categoria: 'armamentos',
  },
  // ── ARMADILHAS ──
  {
    ingredientes: ['comp_explosivo', 'fio_detonador', 'polvora'],
    resultado: { tipo: 'mina_claymore', nome: 'CLAYMORE', usos: 1, usoMax: 1 },
    desc: 'Mina direcional artesanal. Enterrada ou fixada e detonada por fio-gatilho. Dano em cone frontal.',
    categoria: 'armadilhas',
  },
  {
    ingredientes: ['sedativo', 'sedativo', 'fio_detonador'],
    resultado: { tipo: 'cilada_sono', nome: 'CILADA DE SONO', usos: 1, usoMax: 1 },
    desc: 'Armadilha de gas sedativo pressurizado. Qualquer alvo que entrar no raio e imediatamente incapacitado.',
    categoria: 'armadilhas',
  },
  {
    ingredientes: ['fio_detonador', 'pano'],
    resultado: { tipo: 'alarme_campo', nome: 'ALARME DE CAMPO', usos: 2, usoMax: 2 },
    desc: 'Linha de alarme esticada na passagem. Ao ser cortada ou rompida, emite sinal audivel ou luminoso.',
    categoria: 'armadilhas',
  },
  {
    ingredientes: ['comp_explosivo', 'sedativo', 'fio_detonador'],
    resultado: { tipo: 'mina_atordoante', nome: 'MINA ATORDOANTE', usos: 1, usoMax: 1 },
    desc: 'Mina nao-letal. Libera onda de choque e gas atordoante ao ser acionada. Nao causa morte.',
    categoria: 'armadilhas',
  },
  {
    ingredientes: ['pano', 'pano'],
    resultado: { tipo: 'distracao', nome: 'DISTRACAO', usos: 2, usoMax: 2 },
    desc: 'Um papelao dobrado com foto de mulher de biquini colada. Colocado no caminho inimigo, chama atencao e desvia patrulha por tempo indeterminado. Classico.',
    categoria: 'armadilhas',
  },
];

const PATENTES = {
  1: { nome: 'VENOM',   corDest: '#00dd88', desc: 'Recruta de campo. Preparado para missões de alta periculosidade. INT máx: 5 · Bolsa: 3 linhas.' },
  2: { nome: 'SNAKE',   corDest: '#00ffaa', desc: 'Operador especializado. Seu nome circula nas redes de campo. INT máx: 6 · Bolsa: 4 linhas.' },
  3: { nome: 'VYPER',   corDest: '#ffcc00', desc: 'Um Vyper de verdade. Identidade apagada. Existe apenas a missão. INT máx: 7 · Bolsa: 5 linhas.' },
  4: { nome: 'BOSS', corDest: '#ffe566', desc: 'O ápice. Lenda de campo. Você é o The Boss. INT máx: 8 · Bolsa: 6 linhas.' },
};

// ── XP / MARCO SYSTEM ────────────────────────────────────────────────────────
const XP_MARCOS = [
  // ── VENOM ──────────────────────────────────────────────────────────────────
  { patente: 1, marco: 1, xpReq: 15,  titulo: 'MARCO I',   beneficios: ['+1 ponto de atributo', 'Escolha de inventário inicial'] },
  { patente: 1, marco: 2, xpReq: 30,  titulo: 'MARCO II',  beneficios: ['+4 pontos para perícias', 'Acesso a armas de categoria I'] },
  { patente: 1, marco: 3, xpReq: 50,  titulo: 'MARCO III', beneficios: ['Novas camuflagens desbloqueadas', '-1 componente necessário em rituais'], evolution: true },
  // ── SNAKE ──────────────────────────────────────────────────────────────────
  { patente: 2, marco: 1, xpReq: 70,  titulo: 'MARCO I',   beneficios: ['+2 pontos de atributo', 'Missões secundárias liberadas'] },
  { patente: 2, marco: 2, xpReq: 90,  titulo: 'MARCO II',  beneficios: ['Armas de categoria II e operacionais I', 'Armamento especial liberado'] },
  { patente: 2, marco: 3, xpReq: 120, titulo: 'MARCO III', beneficios: ['Novas camuflagens desbloqueadas', '+3 pontos para perícias'], evolution: true },
  // ── VYPER ──────────────────────────────────────────────────────────────────
  { patente: 3, marco: 1, xpReq: 140, titulo: 'MARCO I',   beneficios: ['+3 pontos de atributo', '-20 de visibilidade base'] },
  { patente: 3, marco: 2, xpReq: 180, titulo: 'MARCO II',  beneficios: ['Armas de categoria III e operacionais II', '-1 componente necessário em rituais'] },
  { patente: 3, marco: 3, xpReq: 200, titulo: 'MARCO III',      beneficios: ['[CLASSIFICADO — FIM DO CAMINHO]'], evolution: true },
];

function getPatenteFromXp(xp) {
  if (xp >= 200) return 4;
  if (xp >= 120) return 3;
  if (xp >= 50)  return 2;
  return 1;
}

const CAMUFLAGENS = [
  {
    id: 'florestal',
    nome: 'FLORESTAL',
    ambiente: 'MATA DENSA',
    camo: 72,
    cor: '#1a3010',
    acento: '#5aaa2a',
    iconeChar: 'FL',
    efeito: '+2 em furtividade em mata fechada e florestas',
    sabor: 'O padrão clássico. Sombras e folhas se tornam seu escudo. Operadores veteranos ainda confiam nele em todo engajamento na selva.',
    equipText: 'Você desaparece entre as sombras verdes.\nA floresta te aceita como um dos seus.'
  },
  {
    id: 'urban_ops',
    nome: 'URBAN OPS',
    ambiente: 'AMBIENTE URBANO',
    camo: 65,
    cor: '#2a2a2a',
    acento: '#aaaaaa',
    iconeChar: 'UO',
    efeito: '+2 em furtividade em zonas urbanas e instalações',
    sabor: 'Concreto, asfalto, grades de aço. Você vira parte da estrutura urbana. Mais um civil no caos da cidade.',
    equipText: 'Você se torna a paisagem.\nAnônimo. Invisível. Mais um rosto sem nome.'
  },
  {
    id: 'arcturo',
    nome: '~ARCTURO',
    ambiente: 'NEVE / GELO',
    camo: 78,
    cor: '#1a2a3a',
    acento: '#88ccee',
    iconeChar: 'AR',
    efeito: '+3 em furtividade em terreno nevado e ártico',
    sabor: 'Branco absoluto. Na neve você é um fantasma que nunca existiu. O frio apaga rastros melhor do que qualquer treinamento.',
    equipText: 'O frio te abraça.\nVocê se torna a neve em si.'
  },
  {
    id: 'digital',
    nome: 'DIGITAL GRID',
    ambiente: 'INSTALAÇÕES TECH',
    camo: 62,
    cor: '#081420',
    acento: '#00aaff',
    iconeChar: 'DG',
    efeito: 'Reduz detecção por câmeras e sensores eletrônicos em -15',
    sabor: 'Padrão quadriculado que distorce reconhecimento de forma em sistemas de câmera. Não funciona para olhos humanos — só para sensores.',
    equipText: 'Sistemas de vigilância registram seu movimento\ncomo ruído estático. Você é só glitch.'
  },
  {
    id: 'fantasma',
    nome: 'FANTASMA',
    ambiente: 'OPERAÇÕES NOTURNAS',
    camo: 55,
    cor: '#080808',
    acento: '#5555aa',
    iconeChar: 'FA',
    efeito: '+4 em furtividade à noite. -2 durante o dia.',
    sabor: 'Preto absoluto. Não foi feito para ser visto. Nunca. De dia é um risco, mas na escuridão você deixa de existir.',
    equipText: 'Você some na escuridão.\nNem sua sombra é visível.'
  },
  {
    id: 'serpente',
    nome: '!PADRÃO !SERPENTE',
    ambiente: 'CAMPO ABERTO',
    camo: 85,
    cor: '#1a0e04',
    acento: '#e0a020',
    gradient: 'linear-gradient(135deg, #c8860a 0%, #f0c040 40%, #ffd700 60%, #b07010 100%)',
    iconeChar: 'SN',
    efeito: 'Alto índice em qualquer ambiente. Pertenceu a uma lenda. +4 resistencia a dano',
    sabor: 'Alguém o deixou para trás. Representa um tempo que se foi, e agora, seu legado está em suas mãos.',
    equipText: '...\nVocê sente o peso de quem usou isso antes de você.'
  },
  {
    id: 'biomimet',
    nome: '@BIOMIMÉTICO',
    ambiente: 'ADAPTÁVEL',
    camo: 82,
    cor: '#0e201a',
    acento: '#33cc88',
    iconeChar: 'BM',
    efeito: 'Índice de camuflagem se adapta ao ambiente detectado pelo operador',
    sabor: 'Tecido vivo infundido com proteínas de cefalópodo. Muda de textura e cor, mas só um pouco. O suficiente.',
    equipText: 'Sua pele formiga. O tecido pulsa.\nDepois: silêncio perfeito.'
  },
  {
    id: 'arido',
    nome: 'ÁRIDO',
    ambiente: 'DESERTO / RUÍNAS',
    camo: 68,
    cor: '#1e1408',
    acento: '#cc9944',
    iconeChar: 'ÁR',
    efeito: '+2 em furtividade em terreno árido, deserto e ruínas',
    sabor: 'Pedra, areia, silêncio. Os desertos escondem muita coisa. Agora, inclusive você.',
    equipText: 'Você se torna pedra. Areia.\nCalor distante no horizonte.'
  },
  {
    id: 'fluvial',
    nome: 'FLUVIAL',
    ambiente: 'RIOS / PÂNTANOS',
    camo: 70,
    cor: '#081422',
    acento: '#3388aa',
    iconeChar: 'FV',
    efeito: '+3 em furtividade em terreno aquático, pântanos e chuva',
    sabor: 'Lama, musgo, reflexo na água. Para quem luta no lodo sem reclamar.',
    equipText: 'O pântano te reconhece como um dos seus.\nA lama cobre seus rastros.'
  },
  {
    id: 'termico',
    nome: '*TÉRMICO*',
    ambiente: 'CONTRA-VIGILÂNCIA',
    camo: 75,
    cor: '#0a0018',
    acento: '#8844cc',
    iconeChar: 'TC',
    efeito: 'Oculta assinatura térmica. Invisível para câmeras infravermelho.',
    sabor: 'Bloqueia o calor corporal por até 90 minutos de uso contínuo. Depois disso, você começa a sobreaquece.',
    equipText: 'Você some dos sensores de calor.\nPara os scanners, você não existe.'
  },
  {
    id: 'frondosa',
    nome: 'FRONDOSA',
    ambiente: 'MATA CERRADA',
    camo: 80,
    cor: '#122210',
    acento: '#88cc44',
    iconeChar: 'FR',
    efeito: 'Índice máximo em vegetação densa. Penalidade em espaços abertos.',
    sabor: 'Folhas costuradas à mão, uma a uma. Leva dias para construir. Um segundo para reconhecer que você vale o esforço.',
    equipText: 'Você não está na floresta.\nVocê é a floresta.'
  },
  {
    id: 'ecrasm',
    nome: 'ECRÃ',
    ambiente: '[CLASSIFICADO]',
    camo: 94,
    cor: '#04040e',
    acento: '#00ffcc',
    iconeChar: '◈',
    efeito: '[CLASSIFICADO] Camuflagem óptica adaptativa de última geração.',
    sabor: '[ACESSO RESTRITO — NÍVEL VYPER] Projeto ECRÃ. Desenvolvido em cooperação com [REDACTED]. Protótipo. Instável acima de 40 minutos de uso contínuo.',
    equipText: 'use com moderação.'
  },
  {
    id: 'bandana',
    nome: '!BANDANA',
    ambiente: '◪ ITEM - ESPECIAL ◪',
    camo: 99,
    cor: '#1a0e04',
    acento: '#e0a020',
    gradient: 'linear-gradient(135deg, #c8860a 0%, #f0c040 40%, #ffd700 60%, #b07010 100%)',
    iconeChar: 'お',
    efeito: 'Faça parte da lenda',
    sabor: 'Não te oferece nenhum bônus, apenas um estilo inconfundível. Dizem que foi usada pelo próprio !Vyper durante a operação *FUMAÇA* *VERMELHA*.',
    equipText: 'essa é a sensação, de ser um !VYPER de verdade.'
  }
];

let db         = null;
let auth       = null;
let firebaseOk = false;
let authOk     = false;  // true depois que signInAnonymously resolver com sucesso
let docsReleasedState = [];   // IDs de documentos liberados pelo GM
let docsUnsub = null;         // listener firestore de docs
let docInteractUnsub = null;  // listener de zonas de interação
let docInteractionsState = {}; // {[docId]: [{id,x,y,w,h,label,result}]}
let _docInteractMode = false;
let _docMouseDownPos = null;  // para distinguir clique de arrasto
let _gmZoneDocId = null;
let _gmZoneSel   = { active: false, startX:0, startY:0, endX:0, endY:0 };
let docCiphersState = {};    // { docId: { text, key } } — cifras definidas pelo GM
let docCiphersUnsub = null;  // listener firestore de cifras
let _gmCipherDocId  = null;  // docId sendo editado no modal de cifra
let videoTransState  = { videos: [] };   // transmissões de vídeo
let videoTransUnsub  = null;             // listener Firestore
let _videoAlertId    = null;             // vId pendente no alerta
let _videoSeenSet    = new Set();        // IDs já vistos por este jogador
let _videoFirstLoad  = true;             // silencia alerta no carregamento inicial
let evidenceBoardState = { items: [], connections: [] }; // quadro de evidências
let evidenceBoardUnsub = null;           // listener Firestore
let _ebConnectMode    = false;           // modo de criação de fio
let _ebConnectFrom    = null;            // id do card selecionado
let _ebSelectedColor  = 'red';           // cor do fio atual
let _ebDragging       = null;            // estado de arrasto de card
let _ebConnectPos     = null;            // posição do mouse para borracha viva
let _ebSaveTimer      = null;            // debounce de save de posições
let _ebPresenceUnsub  = null;            // listener de cursores
let _ebPresenceState  = {};              // {codename: {x,y,ts}}
let _ebLiveDragUnsub  = null;            // listener de drag ao vivo
let _ebLiveDragState  = {};              // {itemId: {x,y,by,ts}}
let _ebCursorThrottle = 0;               // timestamp último broadcast de cursor
let _ebDragThrottle   = 0;               // timestamp último broadcast de drag
let _ebZoom           = 1;               // fator de zoom atual
let _ebPan            = { x: 0, y: 0 };  // deslocamento de pan em px
let _ebPanning        = null;            // estado de pan (botao-meio ou space+drag)
let _ebPastaState     = {};              // {itemId: {open,page}} — estado de flip das pastas
let _ebCursorTargets  = {};              // {codename: {tx,ty,cx,cy,rafId,el}}
let _gmPastaPages     = [{title:'PÁGINA 1', text:''}]; // páginas em edição no form de pasta
let camoReleasedState = [];   // IDs de camuflagens liberadas pelo GM
let camoUnsub = null;         // listener firestore de camos
let docsReadSet   = new Set(); // IDs de docs já abertos pelo jogador
let _newDocAlertId = null;     // docId pendente no alerta de novo arquivo
let missaoText  = '';          // texto de missão atual (GM)
let missaoUnsub = null;        // listener firestore de missão
let maldicoesUnsub = null;     // listener firestore de maldições
let _missaoBootDone = false;   // true após primeira exibição do boot da missão
let _lootPool    = [];         // itens montados pelo GM para distribuição
let _gmCharsList = [];         // cache de chars para ferramentas do GM
let _fitasLibrary = [];        // cache de fitas da biblioteca compartilhada
let _gmDeleteArmed = null;     // codename aguardando confirmação de deleção
let _fitasSeenCount = 0;             // count de fitas visto pelo jogador (badge)
let bolsaSelected    = null;   // index into bolsa.items currently selected
let bolsaDiscardArmed = false; // true after first discard click (confirm step)
let _bolsaKeyHandler  = null;  // ref to the keydown listener
let _camoSelected     = null;  // id da camo expandida no painel
let craftSlots = [null, null, null]; // ingredientes selecionados para fabricar
let craftMode  = false;              // se o painel de craft esta ativo
let _craftTutTab = 'medicamentos';   // aba ativa do tutorial
let _playerPrefs  = {};              // preferências visuais locais do jogador (localStorage)

// ──────────────────────────────────────────────────────────
//  AUDIO
// ──────────────────────────────────────────────────────────
const SFX_SRCS = {
  open:   'audio/codecopen.wav',
  close:  'audio/codecover.wav',
  select: 'audio/select.wav',
};
const SFX_VOL = { open: 0.55, close: 0.55, select: 0.45 };

function sfx(name) {
  if (_playerPrefs.sfx === false) return;  // mudo
  const src = SFX_SRCS[name];
  if (!src) return;
  try {
    const a = new Audio(src);
    a.volume = SFX_VOL[name] ?? 0.5;
    a.play().catch(() => {});
  } catch (_) {}
}

try {
  const app  = initializeApp(firebaseConfig);
  db         = getFirestore(app);
  auth       = getAuth(app);
  signInAnonymously(auth)
    .then(() => { authOk = true; })
    .catch(e  => console.warn('Auth anônimo falhou (ative em Firebase Console > Authentication > Sign-in methods > Anônimo):', e));
  firebaseOk = true;
} catch (e) {
  console.warn("Firebase não configurado. Usando modo local (localStorage).", e);
}

// Aguarda o Firebase Auth ter um usuário pronto (resolve em até 5s)
function waitForAuth() {
  if (!auth) return Promise.resolve(null);
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  return new Promise(resolve => {
    const unsub = auth.onAuthStateChanged(user => {
      unsub();
      resolve(user);
    });
    setTimeout(() => { unsub(); resolve(null); }, 5000);
  });
}

// ──────────────────────────────────────────────────────────
//  LOCAL STORAGE FALLBACK
// ──────────────────────────────────────────────────────────
const LS_PREFIX = "vyper_";

const LocalDB = {
  getChar(codename) {
    const raw = localStorage.getItem(LS_PREFIX + codename.toUpperCase());
    return raw ? JSON.parse(raw) : null;
  },
  setChar(codename, data) {
    localStorage.setItem(LS_PREFIX + codename.toUpperCase(), JSON.stringify(data));
  },
  getAllChars() {
    const chars = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(LS_PREFIX)) {
        try { chars.push(JSON.parse(localStorage.getItem(key))); } catch {}
      }
    }
    return chars;
  },
  removeChar(codename) {
    localStorage.removeItem(LS_PREFIX + codename.toUpperCase());
  }
};

// ──────────────────────────────────────────────────────────
//  APP STATE
// ──────────────────────────────────────────────────────────
let state = {
  role: null,           // 'player' | 'gm'
  codename: null,
  character: null,
  unsubscribe: null,    // Firestore listener cleanup
  currentTab: 'main',
  editingAttr: null,
  gmCharsUnsub: null
};

// ──────────────────────────────────────────────────────────
//  UI HELPERS
// ──────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.add('hidden');
    s.classList.remove('active');
  });
  const screen = $(id);
  screen.classList.remove('hidden');
  screen.classList.add('active');
}

function showToast(msg, type = 'info', duration = 2500) {
  const t = $('toast');
  t.innerHTML = fmtCamo(msg);
  t.className = 'toast ' + type;
  t.classList.remove('hidden');
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => t.classList.add('hidden'), duration);
}

function showError(elemId, msg) {
  const el = $(elemId);
  el.textContent = '⚠ ' + msg;
  el.classList.remove('hidden');
  el.style.animation = 'none';
  requestAnimationFrame(() => { el.style.animation = ''; });
  setTimeout(() => el.classList.add('hidden'), 4000);
}

// ──────────────────────────────────────────────────────────
//  BOOT SEQUENCE
// ──────────────────────────────────────────────────────────
const bootMessages = [
  { text: "CARREGANDO KERNEL DE SEGURANÇA...",        ms: 200, ok: true },
  { text: "INICIALIZANDO PROTOCOLO DE CRIPTOGRAFIA...",ms: 400, ok: true },
  { text: "VERIFICANDO ASSINATURA DE ACESSO...",       ms: 350, ok: true },
  { text: "AUTENTICANDO CERTIFICADO VYPER...",          ms: 500, ok: true },
  { text: "MONTANDO SISTEMA DE ARQUIVOS PROTEGIDOS...", ms: 300, ok: true },
  { text: "CARREGANDO BANCO DE DADOS DE AGENTES...",    ms: 600, ok: true },
  { text: "CONEXÃO COM SERVIDOR CENTRAL ESTABELECIDA.",ms: 200, ok: true },
  { text: "PRONTO.",                                    ms: 100, ok: true }
];

async function runBoot() {
  const linesEl = $('boot-lines');
  const barEl   = $('boot-bar');
  linesEl.innerHTML = '';

  let elapsed = 0;
  const totalMs = bootMessages.reduce((s, m) => s + m.ms, 0);

  for (let i = 0; i < bootMessages.length; i++) {
    const m = bootMessages[i];
    await sleep(m.ms);
    elapsed += m.ms;

    const line = document.createElement('div');
    line.className = 'boot-line' + (m.ok ? ' ok' : ' error');
    line.textContent = (m.ok ? '[ OK ] ' : '[ERR] ') + m.text;
    linesEl.appendChild(line);
    linesEl.scrollTop = linesEl.scrollHeight;

    barEl.style.width = Math.round((elapsed / totalMs) * 100) + '%';
  }

  await sleep(400);
  showScreen('screen-login');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ──────────────────────────────────────────────────────────
//  ROLE SELECTION
// ──────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────
//  PERSONALIZAÇÃO DO JOGADOR (localStorage)
// ──────────────────────────────────────────────────────────
const _PREFS_CORES = [
  { id: 'vermelho',  color: '#cc0000' },
  { id: 'azul',      color: '#1177dd' },
  { id: 'verde',     color: '#00bb44' },
  { id: 'roxo',      color: '#9944cc' },
  { id: 'dourado',   color: '#cc9900' },
  { id: 'ciano',     color: '#00aacc' },
  { id: 'laranja',   color: '#dd6600' },
  { id: 'rosa',      color: '#cc1166' },
  { id: 'turquesa',  color: '#00cc88' },
  { id: 'indigo',    color: '#5533dd' },
  { id: 'vinho',     color: '#990033' },
  { id: 'prata',     color: '#aaaaaa' },
];

function _loadPlayerPrefs() {
  const key = 'vyper_ui_' + (state.codename || '').toUpperCase();
  try {
    const raw = localStorage.getItem(key);
    _playerPrefs = raw ? JSON.parse(raw) : {};
  } catch (_) { _playerPrefs = {}; }
  // Sync color from character data (Firestore is the source of truth)
  if (state.character?.aparencia?.cor) {
    _playerPrefs.cor = state.character.aparencia.cor;
  }
  _applyPlayerPrefs();
}

function _savePlayerPrefs() {
  const key = 'vyper_ui_' + (state.codename || '').toUpperCase();
  try { localStorage.setItem(key, JSON.stringify(_playerPrefs)); } catch (_) {}
}

function _applyPlayerPrefs() {
  const p = _playerPrefs;
  const body = document.body;

  // Accent color: body class, CSS handles :not([class*="theme-"]) so GM overrides
  _PREFS_CORES.forEach(c => body.classList.remove('player-theme-' + c.id));
  const cor = p.cor || 'vermelho';
  body.classList.add('player-theme-' + cor);

  // Scanlines
  body.classList.toggle('prefs-no-scanlines', p.scanlines === false);

  // Vinheta
  body.classList.toggle('prefs-no-vinheta', p.vinheta === false);

  // Brilho
  body.classList.toggle('prefs-brilho-escuro',    p.brilho === 'escuro');
  body.classList.toggle('prefs-brilho-brilhante', p.brilho === 'brilhante');
}

function openPlayerPrefs() {
  const panel = $('player-prefs-panel');
  if (!panel) return;
  _renderPlayerPrefsPanel();
  panel.classList.remove('hidden');
  sfx('open');
}

function closePlayerPrefs() {
  const panel = $('player-prefs-panel');
  if (panel) panel.classList.add('hidden');
  sfx('close');
}

function _renderPlayerPrefsPanel() {
  const p = _playerPrefs;
  // Source of truth for accent color is the character's aparencia.cor (Firestore)
  const corAtual = state.character?.aparencia?.cor || p.cor || 'vermelho';

  // Color swatches
  const grid = $('prefs-cor-grid');
  if (grid) {
    grid.innerHTML = _PREFS_CORES.map(c =>
      `<button class="prefs-cor-btn${corAtual === c.id ? ' active' : ''}"
              style="background:${c.color}"
              onclick="App.setPlayerPref('cor','${c.id}')"
              title="${c.id.toUpperCase()}"></button>`
    ).join('');
  }

  // Hide override notice (player now controls their own color directly)
  const overrideEl = $('prefs-gm-override');
  if (overrideEl) overrideEl.classList.add('hidden');

  // Toggles
  _syncPrefToggle('prefs-scanlines-btn', p.scanlines !== false);
  _syncPrefToggle('prefs-vinheta-btn',   p.vinheta   !== false);
  _syncPrefToggle('prefs-sfx-btn',       p.sfx       !== false);

  // Brilho
  ['escuro', 'normal', 'brilhante'].forEach(b => {
    const btn = $('prefs-brilho-' + b);
    if (btn) btn.classList.toggle('active', (p.brilho || 'normal') === b);
  });
}

function _syncPrefToggle(id, active) {
  const btn = $(id);
  if (!btn) return;
  btn.classList.toggle('active', active);
  btn.textContent = active ? 'ATIVO' : 'DESLIGADO';
}

function setPlayerPref(key, value) {
  _playerPrefs[key] = value;
  _savePlayerPrefs();

  if (key === 'cor' && state.character) {
    // Persist accent color to Firestore so it applies on any device
    if (!state.character.aparencia) state.character.aparencia = {};
    state.character.aparencia.cor = value;
    applyAparencia(state.character);
    _applyPlayerPrefs(); // clear any stale body.player-theme-* class (important for vermelho)
    persistChar({ 'aparencia.cor': value }).catch(() => {});
  } else {
    _applyPlayerPrefs();
  }

  _renderPlayerPrefsPanel();
}

function togglePlayerPref(key) {
  if (key === 'scanlines') _playerPrefs.scanlines = !(_playerPrefs.scanlines !== false);
  else if (key === 'vinheta') _playerPrefs.vinheta = !(_playerPrefs.vinheta !== false);
  else if (key === 'sfx')  _playerPrefs.sfx  = !(_playerPrefs.sfx  !== false);
  _savePlayerPrefs();
  _applyPlayerPrefs();
  _renderPlayerPrefsPanel();
}

function selectRole(role) {
  // Visual selection
  $('btn-player').classList.toggle('selected', role === 'player');
  $('btn-gm').classList.toggle('selected', role === 'gm');

  $('login-player').classList.add('hidden');
  $('login-gm').classList.add('hidden');
  $('login-error-player').classList.add('hidden');
  $('login-error-gm').classList.add('hidden');

  if (role === 'player') {
    $('login-player').classList.remove('hidden');
    setTimeout(() => $('input-codename').focus(), 100);
  } else {
    $('login-gm').classList.remove('hidden');
    setTimeout(() => $('input-gm-pass').focus(), 100);
  }
}

// ──────────────────────────────────────────────────────────
//  PLAYER LOGIN
// ──────────────────────────────────────────────────────────
async function loginPlayer() {
  const codename = $('input-codename').value.trim().toUpperCase();
  if (!codename || codename.length < 2) {
    showError('login-error-player', 'Insira um codinome válido (mínimo 2 caracteres).');
    return;
  }

  let charData;

  if (firebaseOk) {
    const currentUser = await waitForAuth();

    // Se a autenticação anônima não está habilitada no Firebase Console,
    // currentUser será null — cai em modo local para não bloquear o jogador.
    if (!currentUser) {
      const charLocal = LocalDB.getChar(codename);
      charData = charLocal || DEFAULT_CHAR();
      if (!charLocal) { charData.codename = codename; LocalDB.setChar(codename, charData); }
      showToast('⚠ Auth Firebase indisponível — modo local ativo. Ative "Anônimo" no Firebase Console.', 'error', 7000);
      state.role = 'player'; state.codename = codename; state.character = charData;
      renderSheet(charData); showScreen('screen-sheet');
      await loadDocsState();
      await loadCamoState();
      return;
    }

    try {
      const ref = doc(db, 'characters', codename);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        charData = snap.data();
      } else {
        // Create new character
        charData = DEFAULT_CHAR();
        charData.codename = codename;
        charData.updatedAt = serverTimestamp();
        await setDoc(ref, charData);
        charData.updatedAt = new Date();
      }
    } catch (e) {
      console.error(e);
      showError('login-error-player', 'Erro ao conectar. Verifique o Firebase e tente novamente.');
      return;
    }
  } else {
    // Local mode
    charData = LocalDB.getChar(codename);
    if (!charData) {
      charData = DEFAULT_CHAR();
      charData.codename = codename;
      LocalDB.setChar(codename, charData);
    }
    showToast('⚠ MODO LOCAL — sem sincronização em tempo real', 'error', 5000);
  }

  state.role     = 'player';
  state.codename = codename;
  state.character = charData;

  renderSheet(charData);
  showScreen('screen-sheet');

  // Load docs released state then render
  await loadDocsState();
  await loadCamoState();

  // Inicializa contagem de fitas para badge
  _fitasSeenCount = charData.tapes?.length ?? 0;

  // Restore last active tab
  const _lastTab = localStorage.getItem('vyper_last_tab');
  if (_lastTab && _lastTab !== 'main') switchTab(_lastTab);

  // Realtime listener — character
  if (firebaseOk) {
    if (state.unsubscribe) state.unsubscribe();
    state.unsubscribe = onSnapshot(doc(db, 'characters', codename), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const old  = state.character;
      // Merge: keep local bolsa if Firestore doc doesn't have it yet
      state.character = data;
      if (!state.character.bolsa) {
        state.character.bolsa = old?.bolsa || { items: [], staged: [] };
      }

      // Update only GM-controlled fields to avoid disrupting player edits
      updateSecurityDisplay(data.security);
      updateIntegrityDisplay(data.integrity);
      updateStatusAtivoDisplay(data.statusAtivo);
      updateArmaDisplay(data.armas);
      updateArmaUnicaDisplay(data.armaUnica);
      applyAparencia(data);

      // Notify player if status changed
      if (old && old.security !== data.security) {
        triggerStatusChangeEffect(data.security);
      }

      // Detect XP changes and update patente
      const oldXp = old?.xp ?? 0;
      const newXp = data.xp ?? 0;
      if (newXp !== oldXp || data.patente !== old?.patente) {
        const newPatente = getPatenteFromXp(newXp);
        if (state.character) state.character.patente = newPatente;
        updatePatenteDisplay(newPatente, newXp);
        if (old && getPatenteFromXp(oldXp) < newPatente) {
          showPatenteUnlockAnim(newPatente, getPatenteFromXp(oldXp));
          // Avisa sobre o aumento de capacidade da bolsa
          const newRows = BOLSA_ROWS_BY_PATENTE[newPatente];
          if (newRows) {
            setTimeout(() => showToast(`⊞ BOLSA EXPANDIDA — ${newRows} linhas disponíveis`, 'success', 4000), 2800);
          }
        }
        // Refresh caminho overlay if open
        if ($('caminho-overlay') && !$('caminho-overlay').classList.contains('hidden')) {
          renderCaminhoOverlay();
        }
      }

      // Detect new dica sent by GM
      const oldDicaTs = old?.radio?.dicaAtual?.ts;
      const newDicaTs = data.radio?.dicaAtual?.ts;
      if (newDicaTs && newDicaTs !== oldDicaTs) showDicaPopup(data.radio.dicaAtual.id);

      // Detect new item sent to bolsa by GM
      const oldBolsaCount = (old?.bolsa?.items?.length || 0) + (old?.bolsa?.staged?.length || 0);
      const newBolsaCount = (data.bolsa?.items?.length || 0) + (data.bolsa?.staged?.length || 0);
      if (newBolsaCount > oldBolsaCount) {
        const inGrid = data.bolsa?.items?.length || 0;
        const inQueue = data.bolsa?.staged?.length || 0;
        if (inQueue > (old?.bolsa?.staged?.length || 0)) {
          showToast('\u25c8 Item recebido — bolsa cheia, aguardando espaço.', 'error', 3500);
        } else {
          showToast('\u25c8 Novo item recebido na bolsa!', 'success', 2500);
        }
      }

      // Refresh fitas tab if open
      if (state.currentTab === 'fitas') renderFitasTab();
      else {
        // Badge de fitas: detecta nova fita adicionada
        const newTapeCount = data.tapes?.length ?? 0;
        if (newTapeCount > _fitasSeenCount) updateNavBadges();
      }
      // Refresh radio tab if open
      if (state.currentTab === 'radio') renderRadioTab();
      // Refresh bolsa tab if open
      if (state.currentTab === 'bolsa') renderBolsa();

      // Apply psychological effects
      applyPsychEffects(data.psych);

      // Apply negative status effects
      applyStatusNeg(data.statusNeg);

      // Detect new mensagem cifrada
      const oldCifradaTs = old?.mensagemCifrada?.ts;
      const newCifradaTs = data.mensagemCifrada?.ts;
      if (newCifradaTs && newCifradaTs !== oldCifradaTs && data.mensagemCifrada?.texto) {
        showMensagemCifrada(data.mensagemCifrada.texto);
      }

      // Paranormal radar
      const oldNivel = old?.paranormal?.nivel ?? 0;
      const newNivel = data.paranormal?.nivel ?? 0;
      if (newNivel !== oldNivel) {
        applyParanormalRadar(newNivel);
        sfxBeepPnl(newNivel);
        showPnlAlertFlash(newNivel);
        const pnlCfg = PARANORMAL_NIVEIS[newNivel];
        if (newNivel > oldNivel && newNivel > 0) {
          showToast('⧭ PARANORMAL: ' + pnlCfg.label, newNivel >= 3 ? 'error' : 'info', 3500);
        } else if (newNivel < oldNivel) {
          showToast('⧭ PARANORMAL: ' + pnlCfg.label, 'info', 2500);
        }
      }
    });

    // Realtime listener — docs released state
    if (docsUnsub) docsUnsub();
    const _prevReleased = [...docsReleasedState];
    docsUnsub = onSnapshot(doc(db, 'gameState', 'docs'), (snap) => {
      const newReleased = snap.exists() ? (snap.data().released || []) : [];
      // Detect newly released docs (not in previous state)
      const justReleased = newReleased.filter(id => !docsReleasedState.includes(id));
      docsReleasedState = newReleased;
      if (justReleased.length > 0) showNewDocAlert(justReleased[0]);
      updateNavBadges();
      if (state.currentTab === 'docs') renderDocsTab();
    });

    // Realtime listener — camo released state
    if (camoUnsub) camoUnsub();
    camoUnsub = onSnapshot(doc(db, 'gameState', 'camos'), (snap) => {
      const prev = [...camoReleasedState];
      camoReleasedState = snap.exists() ? (snap.data().released || []) : [];
      const justReleased = camoReleasedState.filter(id => !prev.includes(id));
      if (justReleased.length > 0) showToast('\u25c8 Nova camuflagem desbloqueada!', 'success', 2500);
      if (state.currentTab === 'bolsa') renderCamuflagem();
    });

    // Realtime listener — mission current text
    if (missaoUnsub) missaoUnsub();
    missaoUnsub = onSnapshot(doc(db, 'gameState', 'mission'), (snap) => {
      missaoText = snap.exists() ? (snap.data().text || '') : '';
      if (state.currentTab === 'equip') renderMissaoAtualText();
    });

    // Realtime listener — maldicoes (atualiza em tempo real quando GM adiciona novas)
    if (maldicoesUnsub) maldicoesUnsub();
    maldicoesUnsub = onSnapshot(doc(db, 'meta', 'maldicoes'), (snap) => {
      maldicoesData = snap.exists() ? (snap.data().maldicoes || []) : [];
      if (state.currentTab === 'mald') renderMaldicoesTab();
    });
  }
}

// ──────────────────────────────────────────────────────────
//  GM LOGIN
// ──────────────────────────────────────────────────────────
async function hashStr(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function loginGM() {
  const pass = $('input-gm-pass').value.trim();
  const inputHash = await hashStr(pass);
  if (inputHash !== GM_PASSWORD_HASH) {
    showError('login-error-gm', 'Código de acesso inválido.');
    $('input-gm-pass').value = '';
    $('input-gm-pass').focus();
    return;
  }

  // Registra UID desta sessão como GM no Firestore (usado pelas Security Rules)
  if (firebaseOk) {
    const currentUser = await waitForAuth();
    if (currentUser) {
      try {
        await setDoc(doc(db, 'meta', 'config'), { gmUid: currentUser.uid });
      } catch (e) {
        console.warn('Não foi possível registrar gmUid:', e);
      }
    }
  }

  state.role = 'gm';
  showScreen('screen-gm');
  loadGMDashboard();
}

// ──────────────────────────────────────────────────────────
//  LOGOUT
// ──────────────────────────────────────────────────────────
function logout() {
  if (state.unsubscribe)    state.unsubscribe();
  if (state.gmCharsUnsub)   state.gmCharsUnsub();
  if (docsUnsub)            { docsUnsub(); docsUnsub = null; }
  if (camoUnsub)            { camoUnsub(); camoUnsub = null; }
  if (missaoUnsub)          { missaoUnsub(); missaoUnsub = null; }
  if (docInteractUnsub)     { docInteractUnsub(); docInteractUnsub = null; }
  if (docCiphersUnsub)      { docCiphersUnsub(); docCiphersUnsub = null; }
  docInteractionsState = {}; _docInteractMode = false;
  docCiphersState = {};
  docsReleasedState = [];
  camoReleasedState = [];
  docsReadSet = new Set();
  _newDocAlertId = null;
  missaoText = '';
  state = {
    role: null, codename: null, character: null,
    unsubscribe: null, currentTab: 'main',
    editingAttr: null, gmCharsUnsub: null
  };
  // Reset login form
  $('input-codename').value = '';
  $('input-gm-pass').value  = '';
  $('login-player').classList.add('hidden');
  $('login-gm').classList.add('hidden');
  $('btn-player').classList.remove('selected');
  $('btn-gm').classList.remove('selected');
  showScreen('screen-login');
}

// ──────────────────────────────────────────────────────────
//  CHARACTER SHEET RENDER
// ──────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────
//  APARÊNCIA DO OPERADOR (aplicada pelo GM)
// ──────────────────────────────────────────────────────────
function applyAparencia(data) {
  const apar  = data.aparencia || {};
  const sheet = $('screen-sheet');
  if (!sheet) return;

  // Cor de destaque
  const CORES = ['azul','verde','roxo','dourado','ciano','laranja','rosa','turquesa','indigo','vinho','prata'];
  CORES.forEach(c => sheet.classList.remove('theme-' + c));
  if (apar.cor && apar.cor !== 'vermelho') sheet.classList.add('theme-' + apar.cor);

  // Estilo de foto
  const frame = $('photo-frame');
  if (frame) {
    ['fantasma','corrupto','operativo'].forEach(s => frame.classList.remove('photo-style-' + s));
    if (apar.fotoFiltro && apar.fotoFiltro !== 'padrao')
      frame.classList.add('photo-style-' + apar.fotoFiltro);
  }

  // Carimbo
  const photoInner = document.querySelector('#photo-frame .photo-inner');
  if (photoInner) {
    let stamp = photoInner.querySelector('.photo-stamp');
    if (!stamp) {
      stamp = document.createElement('div');
      photoInner.appendChild(stamp);
    }
    const STAMP_LABELS = {
      confidencial: 'CONFIDENCIAL', operativo: 'OPERATIVO', desaparecido: 'DESAPARECIDO',
      eliminado:    'ELIMINADO',    foragido:    'FORAGIDO',    renegado:     'RENEGADO',
      elite:        'ELITE',        corrompido:  'CORROMPIDO',  prioritario:  'PRIORITÁRIO',
      neutralizado: 'NEUTRALIZADO'
    };
    if (apar.carimbo && apar.carimbo !== 'nenhum' && STAMP_LABELS[apar.carimbo]) {
      stamp.className  = 'photo-stamp photo-stamp-' + apar.carimbo;
      stamp.textContent = STAMP_LABELS[apar.carimbo];
    } else {
      stamp.className  = '';
      stamp.textContent = '';
    }
  }
}

function renderSheet(data) {
  // Photo
  const photoEl = $('agent-photo');
  if (data.photo) {
    photoEl.src = data.photo;
    const ph1 = $('photo-frame').querySelector('.photo-ph'); if (ph1) ph1.style.display = 'none';
  } else {
    photoEl.src = '';
  }

  // Registro
  setDisplayValue('nome',   data.nome   || data.codename);
  setDisplayValue('origem', data.origem || '[CONFIDENCIAL]');
  updateStatusAtivoDisplay(data.statusAtivo || 'ativo');

  // Attributes
  ATTRS.forEach(a => {
    const grade = (data.attrs && data.attrs[a]) ? data.attrs[a] : 'D';
    setAttrGrade(a, grade);
  });

  // Patente / XP
  updatePatenteDisplay(data.patente ?? 1, data.xp ?? 0);

  // Integrity (called inside updatePatenteDisplay)

  // Armas
  updateArmaDisplay(data.armas);
  updateArmaUnicaDisplay(data.armaUnica);

  // Security
  updateSecurityDisplay(data.security || 'seguro');

  // Aparência
  applyAparencia(data);

  // Status negativos (on initial load)
  applyStatusNeg(data.statusNeg);

  // Paranormal radar (on initial load)
  applyParanormalRadar(data.paranormal?.nivel ?? 0);

  // Perícias
  renderPericias(data.pericias || {});

  // Ensure bolsa field exists on character
  if (!state.character.bolsa) state.character.bolsa = { items: [], staged: [] };

  // Reset to main tab
  switchTab('main');
  // Apply player prefs (stored locally per codename)
  _loadPlayerPrefs();
}

function setDisplayValue(field, val) {
  const el = $('display-' + field);
  if (el) el.textContent = val || '—';
}

function setAttrGrade(attr, grade) {
  const gradeEl = $('grade-' + attr);
  if (!gradeEl) return;
  gradeEl.textContent = grade;
  // Remove all grade classes then add correct one
  gradeEl.className = 'attr-grade';
  const cls = GRADE_CLASS_MAP[grade];
  if (cls) gradeEl.classList.add(cls);
}

function updateSecurityDisplay(security) {
  const badge = $('security-display');
  const text  = $('security-text');
  badge.className = 'sec-badge ' + (security || 'seguro');
  const labels = { seguro: 'SEGURO', alerta: 'ALERTA', perigo: 'PERIGO', comprometido: 'COMPROMETIDO', inativo: 'INATIVO' };
  text.textContent = labels[security] || 'SEGURO';
}

function updateIntegrityDisplay(integrity) {
  const patente  = state.character?.patente ?? getPatenteFromXp(state.character?.xp ?? 0);
  const maxBars  = 4 + patente; // Venom=5, Snake=6, Vyper=7, Boss=8
  const val      = typeof integrity === 'number' ? Math.min(integrity, maxBars) : maxBars;
  const bars     = document.querySelectorAll('#integrity-bars .integrity-bar');
  const countEl  = $('integrity-count');
  const section  = document.getElementById('integrity-bars');
  const wrap     = section?.closest('.integ-wrap');
  const tagEl    = $('integ-status-tag');

  bars.forEach((bar, i) => {
    if (i >= maxBars) {
      bar.classList.add('bar-hidden');
      bar.classList.remove('active');
    } else {
      bar.classList.remove('bar-hidden');
      bar.classList.toggle('active', i < val);
    }
  });
  if (countEl) countEl.textContent = val + '/' + maxBars;

  // Visual warning levels
  const warnLow  = val <= 2 && val > 1;
  const warnCrit = val <= 1;
  if (section) {
    section.classList.toggle('warn-low',  warnLow);
    section.classList.toggle('warn-crit', warnCrit);
  }
  if (wrap) {
    wrap.classList.toggle('warn-low',  warnLow);
    wrap.classList.toggle('warn-crit', warnCrit);
  }
  if (tagEl) {
    if (warnCrit) tagEl.textContent = 'CRÍTICO';
    else if (warnLow) tagEl.textContent = 'BAIXA';
    else if (val === maxBars) tagEl.textContent = 'ESTÁVEL';
    else tagEl.textContent = 'REDUZIDA';
  }
}

// ──────────────────────────────────────────────────────────
//  DICAS — player popup
// ──────────────────────────────────────────────────────────
function showDicaPopup(dicaId) {
  const dica = DICAS_PRESETS.find(d => d.id === dicaId);
  if (!dica) return;
  const popup = $('dica-popup');
  if (!popup) return;
  $('dica-popup-titulo').textContent = dica.titulo;
  $('dica-popup-texto').textContent  = dica.texto;
  const img = $('dica-popup-img');
  if (dica.imagem) { img.src = dica.imagem; img.style.display = ''; }
  else             { img.style.display = 'none'; }
  popup.classList.remove('hidden');
  sfx('open');
}

function closeDicaPopup() {
  const popup = $('dica-popup');
  if (popup) popup.classList.add('hidden');
  sfx('close');
  // Limpa dicaAtual do Firestore para não acumular estado stale
  if (firebaseOk && state.codename) {
    updateDoc(doc(db, 'characters', state.codename), { 'radio.dicaAtual': null }).catch(() => {});
  }
}

function updatePatenteDisplay(patente, xp) {
  xp = (xp !== undefined) ? xp : (state.character?.xp ?? 0);
  const p = getPatenteFromXp(xp);
  // Sync stored patente to XP-derived value
  if (state.character && state.character.patente !== p) state.character.patente = p;

  for (let i = 1; i <= 4; i++) {
    const item = $('patente-item-' + i);
    if (!item) continue;
    item.classList.toggle('patente-active',    i === p);
    item.classList.toggle('patente-completed', i < p);
    item.classList.toggle('patente-locked',    i > p);
  }
  const descEl = $('patente-desc');
  if (descEl) descEl.textContent = PATENTES[p]?.desc || '';
  // Show/hide patente 4 identity
  const name4el = document.querySelector('#patente-item-4 .patente-name');
  if (name4el) name4el.textContent = (p >= 4) ? 'BOSS' : '???';
  const star4el = document.querySelector('#patente-item-4 .patente-gold-star');
  if (star4el) star4el.innerHTML = (p >= 4) ? '\u2605' : '?';

  // Update XP bar in the patente section
  _updatePatenteXpBar(xp, p);

  // Update integrity display with new max
  const currentIntegrity = state.character?.integrity ?? (4 + p);
  updateIntegrityDisplay(currentIntegrity);
}

function _updatePatenteXpBar(xp, currentPatente) {
  const labelEl = $('patente-xp-label');
  const fillEl  = $('patente-xp-fill');
  const nextEl  = $('patente-xp-next');
  if (!labelEl) return;
  labelEl.textContent = xp + ' XP';
  const nextMarco = XP_MARCOS.find(m => m.xpReq > xp);
  if (!nextMarco) {
    if (fillEl) fillEl.style.width = '100%';
    if (nextEl) nextEl.textContent = '\u25b2 ÁPICE ATINGIDO';
    return;
  }
  const prevMarcos = XP_MARCOS.filter(m => m.xpReq <= xp);
  const prevXp = prevMarcos.length > 0 ? prevMarcos[prevMarcos.length - 1].xpReq : 0;
  const pct = Math.min(100, Math.round(((xp - prevXp) / (nextMarco.xpReq - prevXp)) * 100));
  if (fillEl) fillEl.style.width = pct + '%';
  const remaining = nextMarco.xpReq - xp;
  const pName = (nextMarco.patente === 4 && currentPatente < 4) ? '???' : (PATENTES[nextMarco.patente]?.nome || '');
  if (nextEl) nextEl.textContent = `${nextMarco.titulo} \u00b7 ${pName} \u00b7 faltam ${remaining} XP`;
}

async function setPatente(level) {
  // Patente is now auto-derived from XP — manual setting disabled for players
  if (state.role !== 'player' || !state.character) return;
  // No-op: use XP system via GM dashboard
}

// ──────────────────────────────────────────────────────────
//  PATENTE UNLOCK ANIMATION
// ──────────────────────────────────────────────────────────

function showPatenteUnlockAnim(newPatente, oldPatente) {
  const pat    = PATENTES[newPatente];
  const oldPat = PATENTES[oldPatente];
  const color  = pat?.corDest || '#00ff88';
  // Keep identity of patente 4 hidden until animation reveals it dramatically
  const name   = pat?.nome || '';

  const existing = document.getElementById('patente-unlock-anim');
  if (existing) existing.remove();

  const shards = Array.from({length: 16}, (_, i) =>
    `<div class="pu-shard" style="--angle:${i * 22.5}deg;--delay:${(i % 4) * 0.05}s"></div>`
  ).join('');
  const sparks = Array.from({length: 8}, (_, i) =>
    `<div class="pu-spark" style="--a:${i * 45}deg;--d:${80 + i * 15}px"></div>`
  ).join('');

  const div = document.createElement('div');
  div.className = 'pu-overlay';
  div.id = 'patente-unlock-anim';
  div.style.setProperty('--pu-color', color);
  div.innerHTML = `
    <div class="pu-backdrop"></div>
    <div class="pu-shards">${shards}</div>
    <div class="pu-sparks">${sparks}</div>
    <div class="pu-card">
      <div class="pu-scan"></div>
      <div class="pu-ring pu-ring-1"></div>
      <div class="pu-ring pu-ring-2"></div>
      <div class="pu-eyeline"></div>
      <div class="pu-label">\u25b2 PATENTE DESBLOQUEADA</div>
      <div class="pu-rank-icon">${newPatente === 4 ? '\u2605' : newPatente === 3 ? '\u25c6' : '\u25a0'}</div>
      <div class="pu-rank-name">${name}</div>
      <div class="pu-divider"></div>
      <div class="pu-sub">${oldPat?.nome || ''} \u2192 ${name}</div>
      <div class="pu-close-hint">[ clique para fechar ]</div>
    </div>`;
  div.addEventListener('click', () => {
    div.style.animation = 'pu-dismiss 0.3s ease forwards';
    setTimeout(() => div.remove(), 300);
  });
  document.body.appendChild(div);
  setTimeout(() => {
    if (div.parentNode) {
      div.style.animation = 'pu-dismiss 0.5s ease forwards';
      setTimeout(() => div.remove(), 500);
    }
  }, 5500);
  sfx('open');
}

// ──────────────────────────────────────────────────────────
//  CAMINHO DE PROGRESSO — overlay
// ──────────────────────────────────────────────────────────
function openCaminhoOverlay() {
  const overlay = $('caminho-overlay');
  if (!overlay) return;
  renderCaminhoOverlay();
  overlay.classList.remove('hidden');
  sfx('open');
}

function closeCaminhoOverlay() {
  const overlay = $('caminho-overlay');
  if (overlay) overlay.classList.add('hidden');
  sfx('close');
}

function renderCaminhoOverlay() {
  const xp = state.character?.xp ?? 0;
  const currentPatente = getPatenteFromXp(xp);

  // Header XP value
  const xpBigEl = $('caminho-xp-big');
  if (xpBigEl) xpBigEl.textContent = xp;

  // Global bar
  const barFillEl  = $('caminho-global-bar-fill');
  const barLabelEl = $('caminho-global-bar-label');
  if (barFillEl) barFillEl.style.width = Math.min(100, Math.round((xp / 200) * 100)) + '%';
  if (barLabelEl) barLabelEl.textContent = `${xp} / 200 XP`;

  // GM controls
  const gmCtrl = $('caminho-gm-ctrl');
  if (gmCtrl) gmCtrl.style.display = (state.role === 'gm') ? 'flex' : 'none';

  // Render path
  const pathEl = $('caminho-path');
  if (!pathEl) return;

  const isApex = xp >= 200;
  let html = '';

  // Apex card (top of path)
  html += `<div class="cp-apex ${isApex ? 'cp-apex-reached' : 'cp-apex-locked'}">
    <div class="cp-apex-inner">
      <div class="cp-apex-sparkles">${isApex ? '▓▓▓▓▓▓▓▓▓▓' : ''}</div>
      <div class="cp-apex-icon">${isApex ? '\u2605' : '\u25c7'}</div>
      <div class="cp-apex-name">${isApex ? 'BOSS' : '???'}</div>
      <div class="cp-apex-req">200 XP \u2014 \u00c1PICE</div>
      <div class="cp-apex-sub">${isApex ? '\u25b2 LENDA DE CAMPO CONFIRMADA' : 'INT m\u00e1x: 8 \u00b7 Bolsa: 6 linhas'}</div>
    </div>
  </div>`;

  // Rank cards: render 3 → 1 (CSS column-reverse will show bottom-up visually)
  for (let pi = 3; pi >= 1; pi--) {
    const pat         = PATENTES[pi];
    const rankMarcos  = XP_MARCOS.filter(m => m.patente === pi);
    const rankXpMin   = pi === 1 ? 0   : pi === 2 ? 50  : 120;
    const rankXpMax   = pi === 1 ? 50  : pi === 2 ? 120 : 200;
    const isCurrentRank   = (currentPatente === pi);
    const isCompletedRank = (currentPatente > pi);
    const isLockedRank    = (currentPatente < pi);

    let rankPct = 0;
    if (isCompletedRank) rankPct = 100;
    else if (isCurrentRank) rankPct = Math.min(100, Math.round(((xp - rankXpMin) / (rankXpMax - rankXpMin)) * 100));

    const marcosHtml = rankMarcos.map((marco, idx) => {
      const globalIdx = XP_MARCOS.indexOf(marco);
      const unlocked = xp >= marco.xpReq;
      const prevReq  = idx === 0 ? rankXpMin : rankMarcos[idx - 1].xpReq;
      const isNext   = !unlocked && xp >= prevReq;
      const cls = unlocked ? 'cp-marco-done' : isNext ? 'cp-marco-next' : 'cp-marco-locked';
      const dot = unlocked ? '\u25cf' : isNext ? '\u25ce' : '\u25cb';
      return `<button class="cp-marco ${cls}" onclick="App.showMarcoDetail(${globalIdx})" title="${marco.titulo}">
        <div class="cp-marco-node"><span class="cp-marco-dot">${dot}</span><div class="cp-marco-ring"></div></div>
        <div class="cp-marco-info"><div class="cp-marco-num">M${marco.marco}</div><div class="cp-marco-xp">${marco.xpReq}</div></div>
      </button>${idx < rankMarcos.length - 1 ? `<div class="cp-connector ${unlocked ? 'cp-conn-done' : ''}"></div>` : ''}`;
    }).join('');

    const evLabel   = pi === 3 ? '\u25b2 ÁPICE' : '\u25b2 EVOLUÇÃO';
    const imgNum    = Math.min(pi, 3);
    const rankStateClass = isCurrentRank ? 'cp-rank-current' : isCompletedRank ? 'cp-rank-completed' : 'cp-rank-locked';

    html += `<div class="cp-evolution-link ${isLockedRank ? 'ev-locked' : 'ev-active'}">
      <div class="ev-pipe"></div>
      <div class="ev-arrow-label">${evLabel}</div>
    </div>
    <div class="cp-rank ${rankStateClass}">
      <div class="cp-rank-header">
        <div class="cp-rank-id">
          <img src="icones/patente${imgNum}.png" class="cp-rank-img" onerror="this.style.display='none'" />
          <span class="cp-rank-name" style="color:${pat.corDest}">${pat.nome}</span>
        </div>
        <div class="cp-rank-badges">
          ${isCurrentRank   ? '<span class="cp-badge cp-badge-current">ATUAL</span>' : ''}
          ${isCompletedRank ? '<span class="cp-badge cp-badge-done">\u2713 COMPLETO</span>' : ''}
          ${isLockedRank    ? '<span class="cp-badge cp-badge-locked">BLOQUEADO</span>' : ''}
        </div>
      </div>
      <div class="cp-rank-pills">
        <span class="cp-pill">\u26a1 INT: ${4 + pi}</span>
        <span class="cp-pill">\ud83c\udf92 BOLSA: ${BOLSA_ROWS_BY_PATENTE[pi]} linhas</span>
        <span class="cp-pill">\ud83d\udccd ${rankXpMin}\u2013${rankXpMax} XP</span>
      </div>
      <div class="cp-rank-bar-track"><div class="cp-rank-bar-fill" style="width:${rankPct}%"></div></div>
      <div class="cp-marcos-row">${marcosHtml}</div>
    </div>`;
  }

  pathEl.innerHTML = html;

  // Restore selected marco detail if any
  const detail = $('caminho-detail');
  if (detail && detail.dataset.lastIdx !== undefined) {
    showMarcoDetail(parseInt(detail.dataset.lastIdx));
  }
}

function showMarcoDetail(globalIdx) {
  const marco = XP_MARCOS[globalIdx];
  if (!marco) return;
  const xp       = state.character?.xp ?? 0;
  const unlocked = xp >= marco.xpReq;
  const pat      = PATENTES[marco.patente];
  const detail   = $('caminho-detail');
  if (!detail) return;
  detail.dataset.lastIdx = globalIdx;

  // Highlight selected node
  document.querySelectorAll('.cp-marco').forEach(el => el.classList.remove('cp-marco-selected'));
  const nodes = document.querySelectorAll('.cp-marco');
  if (nodes[globalIdx]) nodes[globalIdx].classList.add('cp-marco-selected');

  const prevReq  = globalIdx === 0 ? 0 : (XP_MARCOS[globalIdx - 1]?.xpReq ?? 0);
  const isNext   = !unlocked && xp >= prevReq && getPatenteFromXp(xp) === marco.patente;
  const statusHtml = unlocked
    ? `<span class="cp-det-badge cp-det-badge-done">\u25cf OBTIDO</span>`
    : isNext
      ? `<span class="cp-det-badge cp-det-badge-next">\u25ce PR\u00d3XIMO</span>`
      : `<span class="cp-det-badge cp-det-badge-locked">\u25cb BLOQUEADO</span>`;

  detail.innerHTML = `
    <div class="cp-detail-card ${unlocked ? 'det-done' : 'det-locked'}">
      <div class="cp-det-header">
        <div class="cp-det-title">${marco.titulo} <span class="cp-det-rank" style="color:${pat.corDest}">${pat.nome}</span></div>
        <div class="cp-det-req">${marco.xpReq} XP necess\u00e1rios</div>
        <div class="cp-det-status">${statusHtml}</div>
      </div>
      <div class="cp-det-benefits">
        ${marco.beneficios.map(b => `<div class="cp-det-benefit"><span class="cp-det-ico">\u25b8</span>${b}</div>`).join('')}
        ${marco.evolution ? `<div class="cp-det-benefit cp-det-evolution"><span class="cp-det-ico">\u2605</span>Evolução de patente desbloqueada</div>` : ''}
      </div>
      ${!unlocked ? `<div class="cp-det-xp-needed"><span class="cp-det-xp-remain">${marco.xpReq - xp}</span> XP para desbloquear</div>` : ''}
    </div>`;
  sfx('select');
}

// GM: ajusta XP do personagem sendo visualizado no overlay (sheet do player aberta com login GM)
async function caminhoGmAjustar(delta) {
  if (!state.character) return;
  const newXp = Math.max(0, (state.character.xp ?? 0) + delta);
  const newPatente = getPatenteFromXp(newXp);
  state.character.xp = newXp;
  state.character.patente = newPatente;
  updatePatenteDisplay(newPatente, newXp);
  renderCaminhoOverlay();
  await persistChar({ xp: newXp, patente: newPatente });
  showToast(`XP: ${newXp} (${delta >= 0 ? '+' : ''}${delta})`, 'success', 2000);
}

async function caminhoGmSetExato() {
  const inputEl = $('caminho-gm-xp-input');
  if (!inputEl) return;
  const val = parseInt(inputEl.value);
  if (isNaN(val) || val < 0) { showToast('Valor inv\u00e1lido.', 'error'); return; }
  const newPatente = getPatenteFromXp(val);
  if (state.character) { state.character.xp = val; state.character.patente = newPatente; }
  updatePatenteDisplay(newPatente, val);
  renderCaminhoOverlay();
  await persistChar({ xp: val, patente: newPatente });
  inputEl.value = '';
  showToast(`XP definido: ${val}`, 'success', 2000);
}

// ──────────────────────────────────────────────────────────
//  ARMAS — player display & inspect
// ──────────────────────────────────────────────────────────
function updateArmaDisplay(armas) {
  armas = armas || [null, null];
  for (let i = 0; i < 2; i++) {
    const arma  = armas[i] || null;
    const slot  = $('arma-slot-' + i);
    const ico   = $('arma-ico-' + i);
    const empt  = $('arma-empty-' + i);
    const nome  = $('arma-nome-' + i);
    const stats = $('arma-stats-' + i);
    const inspB = $('arma-insp-btn-' + i);
    const letal = $('arma-letal-' + i);
    if (!slot) continue;
    if (arma && arma.tipo) {
      const tipo = ARMA_TIPOS[arma.tipo] || ARMA_TIPOS.outro;
      if (tipo.img) {
        ico.src = tipo.img;
        ico.classList.remove('hidden');
        empt.style.display = 'none';
      } else {
        ico.classList.add('hidden');
        empt.style.display = '';
        empt.textContent = '\u25c8';
      }
      nome.textContent = arma.nome || tipo.label;
      const parts = [];
      if (arma.dano)    parts.push('DMG: ' + arma.dano);
      if (arma.alcance) parts.push('ALC: ' + arma.alcance);
      stats.textContent = parts.join(' \u00b7 ');
      // Lethality badge
      if (letal) {
        if (arma.tipoDano === 'mortal') {
          letal.textContent = 'DMG';
          letal.className = 'arma-letal-badge arma-letal-mortal';
        } else if (arma.tipoDano === 'neutralizador') {
          letal.textContent = 'ZZZ';
          letal.className = 'arma-letal-badge arma-letal-neu';
        } else {
          letal.textContent = '';
          letal.className = 'arma-letal-badge hidden';
        }
      }
      inspB.classList.remove('hidden');
      slot.classList.add('arma-equipada');
      // Mod strip
      const modsEl = $('arma-mods-' + i);
      if (modsEl) {
        const mods = arma.mods || {};
        const anyMod = Object.keys(ARMA_MODS).some(k => mods[k]);
        if (anyMod) {
          modsEl.innerHTML = Object.entries(ARMA_MODS).map(([k, m]) =>
            `<span class="arma-mod-dot${mods[k] ? ' arma-mod-dot-on' : ''}" title="${m.label}">${m.ico}</span>`
          ).join('');
          modsEl.classList.remove('hidden');
        } else {
          modsEl.innerHTML = ''; modsEl.classList.add('hidden');
        }
      }
    } else {
      ico.classList.add('hidden');
      empt.style.display = '';
      empt.textContent = '\u2014';
      nome.textContent = i === 0 ? 'ESPAÇO I' : 'ESPAÇO II';
      stats.textContent = '';
      if (letal) { letal.textContent = ''; letal.className = 'arma-letal-badge hidden'; }
      inspB.classList.add('hidden');
      slot.classList.remove('arma-equipada');
      const modsElE = $('arma-mods-' + i);
      if (modsElE) { modsElE.innerHTML = ''; modsElE.classList.add('hidden'); }
    }
    const bolsaBtn = $('arma-bolsa-btn-' + i);
    if (bolsaBtn) bolsaBtn.classList.toggle('hidden', !(arma && arma.tipo));
  }
}

function inspecionarArma(slot) {
  const arma = state.character?.armas?.[slot];
  if (!arma || !arma.tipo) return;
  const tipo = ARMA_TIPOS[arma.tipo] || ARMA_TIPOS.outro;
  $('arma-inspect-nome').textContent = arma.nome || tipo.label;
  const img = $('arma-inspect-img');
  if (tipo.img) { img.src = tipo.img; img.style.display = ''; }
  else          { img.style.display = 'none'; }
  const mods = (arma.modificadores || []).join(', ') || '\u2014';
  $('arma-inspect-stats').innerHTML = [
    ['TIPO',           tipo.label],
    ['DANO',           arma.dano     || '\u2014'],
    ['ALCANCE',        arma.alcance  || '\u2014'],
    ['TIPO DE DANO',   arma.tipoDano === 'mortal' ? 'MORTAL' : 'NEUTRALIZADOR'],
    ['MODIFICADORES',  mods],
  ].map(([k, v]) =>
    `<div class="arma-stat-row"><span class="arma-stat-key">${k}</span><span class="arma-stat-val">${escHtml(String(v))}</span></div>`
  ).join('');
  const desc = $('arma-inspect-descricao');
  desc.textContent = arma.descricao || '';
  desc.style.display = arma.descricao ? '' : 'none';
  $('arma-inspect-popup').classList.remove('hidden');
  sfx('open');
}

function fecharArmaInspect() {
  $('arma-inspect-popup').classList.add('hidden');
  sfx('close');
}

// ──────────────────────────────────────────────────────────
//  ARMAS ÚNICAS — display & inspect
// ──────────────────────────────────────────────────────────
function updateArmaUnicaDisplay(armaUnica) {
  const slot   = $('arma-unica-slot');
  const ico    = $('arma-unica-ico-img');
  const empt   = $('arma-unica-empty');
  const nome   = $('arma-unica-nome');
  const badge  = $('arma-unica-badge');
  const stats  = $('arma-unica-stats');
  const props  = $('arma-unica-props');
  const inspB  = $('arma-unica-insp-btn');
  if (!slot) return;

  if (armaUnica && armaUnica.tipo && ARMA_TIPOS[armaUnica.tipo]?.unica) {
    const tipo  = ARMA_TIPOS[armaUnica.tipo];
    const uData = ARMA_UNICA_PROPS[armaUnica.tipo];
    // Icon
    ico.src = tipo.img;
    ico.classList.remove('hidden');
    empt.style.display = 'none';
    // Name & badge
    nome.textContent = armaUnica.nome || tipo.label;
    if (badge) { badge.style.display = ''; badge.style.setProperty('--unica-cor', uData?.cor || '#ff8800'); }
    // Stats line
    const parts = [];
    if (armaUnica.dano) parts.push('DMG: ' + armaUnica.dano);
    stats.textContent = parts.join(' · ');
    // Property chips
    if (props && uData) {
      props.innerHTML = uData.propriedades.map(p =>
        `<span class="arma-unica-prop-chip" style="--chip-cor:${uData.cor}">${p.label}</span>`
      ).join('');
    }
    if (inspB) inspB.classList.remove('hidden');
    slot.classList.add('arma-unica-equipada');
    slot.style.setProperty('--unica-cor', uData?.cor || '#ff8800');
  } else {
    ico.classList.add('hidden');
    empt.style.display = '';
    nome.textContent = 'NENHUMA';
    if (badge) badge.style.display = 'none';
    stats.textContent = '';
    if (props) props.innerHTML = '';
    if (inspB) inspB.classList.add('hidden');
    slot.classList.remove('arma-unica-equipada');
    slot.style.removeProperty('--unica-cor');
  }
  const section = $('armas-unicas-section');
  if (section) section.classList.toggle('arma-unica-ativa', !!(armaUnica && armaUnica.tipo && ARMA_TIPOS[armaUnica.tipo]?.unica));
}

function inspecionarArmaUnica() {
  const armaUnica = state.character?.armaUnica;
  if (!armaUnica || !armaUnica.tipo || !ARMA_TIPOS[armaUnica.tipo]?.unica) return;
  const tipo  = ARMA_TIPOS[armaUnica.tipo];
  const uData = ARMA_UNICA_PROPS[armaUnica.tipo];
  const popup = $('arma-unica-inspect-popup');
  if (!popup) return;

  $('arma-unica-inspect-nome').textContent = armaUnica.nome || tipo.label;
  const img = $('arma-unica-inspect-img');
  if (tipo.img) { img.src = tipo.img; img.style.display = ''; }
  else          { img.style.display = 'none'; }

  // Set color theme
  popup.style.setProperty('--unica-cor', uData?.cor || '#ff8800');

  // Stats
  $('arma-unica-inspect-stats').innerHTML = [
    ['CLASSIFICAÇÃO', 'ARMAMENTO ÚNICO'],
    ['DANO',          armaUnica.dano    || '—'],
    ['ALCANCE',       armaUnica.alcance || '—'],
  ].map(([k, v]) =>
    `<div class="arma-stat-row"><span class="arma-stat-key">${k}</span><span class="arma-stat-val arma-unica-val">${escHtml(String(v))}</span></div>`
  ).join('');

  // Special properties
  const propsEl = $('arma-unica-inspect-props');
  if (propsEl && uData) {
    propsEl.innerHTML = uData.propriedades.map(p =>
      `<div class="arma-unica-prop-entry">
        <div class="arma-unica-prop-head"><span class="arma-unica-prop-ico">◈</span><span class="arma-unica-prop-name">${p.label}</span></div>
        <div class="arma-unica-prop-desc">${escHtml(p.desc)}</div>
      </div>`
    ).join('');
  }

  // Aviso / warning
  const avisoEl = $('arma-unica-inspect-aviso');
  if (avisoEl && uData?.aviso) {
    avisoEl.textContent = uData.aviso;
    avisoEl.style.display = '';
  } else if (avisoEl) avisoEl.style.display = 'none';

  // Description
  const descEl = $('arma-unica-inspect-descricao');
  if (descEl) {
    descEl.textContent = armaUnica.descricao || '';
    descEl.style.display = armaUnica.descricao ? '' : 'none';
  }

  popup.classList.remove('hidden');
  sfx('open');
}

function fecharArmaUnicaInspect() {
  $('arma-unica-inspect-popup').classList.add('hidden');
  sfx('close');
}

function updateStatusAtivoDisplay(status) {
  const el   = $('display-status-ativo');
  const labels = { ativo: 'ATIVO', inativo: 'INATIVO', morto: 'K.I.A.' };
  const colors = { ativo: '#00e040', inativo: '#888', morto: '#cc0000' };
  if (el) {
    el.textContent = labels[status] || 'ATIVO';
    el.style.color = colors[status] || '#e0e0e0';
  }
}

function triggerStatusChangeEffect(newSecurity) {
  const badge = $('security-display');
  badge.classList.remove('status-changed');
  requestAnimationFrame(() => badge.classList.add('status-changed'));

  const alerts = {
    seguro:       '🟢 STATUS: SEGURO',
    alerta:       '⚠ ALERTA — possível ameaça detectada!',
    perigo:       '🟠 PERIGO — contato hostil confirmado!',
    comprometido: '🔴 COMPROMETIDO — identidade exposta!'
  };
  showToast(alerts[newSecurity] || '', newSecurity === 'seguro' ? 'success' : 'error', 4000);
}

// ──────────────────────────────────────────────────────────
//  PLAYER EDIT FUNCTIONS
// ──────────────────────────────────────────────────────────
function toggleEdit(field) {
  const display = $('display-' + field);
  const input   = $('edit-'    + field);
  if (!display || !input) return;

  const isEditing = !input.classList.contains('hidden');
  if (isEditing) {
    saveField(field);
    return;
  }
  input.value = state.character ? (state.character[field] || '') : '';
  display.classList.add('hidden');
  input.classList.remove('hidden');
  input.focus();
  input.select();
}

async function saveField(field) {
  const display = $('display-' + field);
  const input   = $('edit-'    + field);
  if (!display || !input) return;

  const val = input.value.trim();
  display.textContent = val || '—';
  display.classList.remove('hidden');
  input.classList.add('hidden');

  if (!state.character) return;
  state.character[field] = val;

  await persistChar({ [field]: val });
}

function cycleAttr(attr) {
  // Instead of cycling, show the modal selector
  openGradeModal(attr);
}

function openGradeModal(attr) {
  state.editingAttr = attr;
  const title = $('grade-modal-title');
  const opts  = $('grade-modal-options');

  title.textContent = '► ' + (ATTR_LABELS[attr] || attr.toUpperCase());
  opts.innerHTML = '';

  const current = state.character?.attrs?.[attr] || 'D';

  GRADES.forEach(grade => {
    const btn = document.createElement('button');
    btn.className = 'grade-opt-btn' + (grade === current ? ' current' : '');
    btn.textContent = grade;
    btn.onclick = () => selectGrade(attr, grade);
    opts.appendChild(btn);
  });

  $('grade-modal').classList.remove('hidden');
}

async function selectGrade(attr, grade) {
  closeGradeModal();
  setAttrGrade(attr, grade);

  if (!state.character) return;
  if (!state.character.attrs) state.character.attrs = {};
  state.character.attrs[attr] = grade;

  await persistChar({ [`attrs.${attr}`]: grade });
}

function closeGradeModal(event) {
  if (event && event.target !== $('grade-modal')) return;
  $('grade-modal').classList.add('hidden');
  state.editingAttr = null;
}

async function toggleIntegrity(index) {
  if (!state.character && state.role !== 'player') return;

  const patente  = state.character?.patente ?? getPatenteFromXp(state.character?.xp ?? 0);
  const maxBars  = 4 + patente;
  const current  = state.character?.integrity ?? maxBars;
  // Clicking a bar sets integrity to index+1 if it was off, or index if it was on (last active)
  let newVal;
  if (index < current) {
    // Clicking an active bar — set integrity to index (turn off from here down)
    newVal = index;
  } else {
    // Clicking an inactive bar — set integrity to index+1
    newVal = index + 1;
  }
  newVal = Math.max(0, Math.min(maxBars, newVal));

  if (state.character) state.character.integrity = newVal;
  updateIntegrityDisplay(newVal);

  await persistChar({ integrity: newVal });
}

// ──────────────────────────────────────────────────────────
//  PERÍCIAS
// ──────────────────────────────────────────────────────────
const PERICIAS_LIST = [
  'acrobacia','adestramento','artes','atletismo','atualidades',
  'ciencias','crime','diplomacia','enganacao','fortitude',
  'furtividade','iniciativa','intimidacao','intuicao','investigacao',
  'luta','medicina','ocultismo','percepcao','pilotagem',
  'pontaria','profissao','reflexos','religiao','sobrevivencia',
  'tatica','tecnologia','vontade'
];

function _applyPericiaEl(el, num) {
  el.value = num > 0 ? '+' + num : String(num);
  el.classList.toggle('pb-pos',  num > 0);
  el.classList.toggle('pb-neg',  num < 0);
  el.classList.toggle('pb-zero', num === 0);
}

function renderPericias(pericias) {
  PERICIAS_LIST.forEach(key => {
    const el = document.getElementById('pb-' + key);
    if (!el) return;
    const num = (pericias && typeof pericias[key] === 'number') ? pericias[key] : 0;
    _applyPericiaEl(el, num);
  });
}

async function savePericiaBonus(key, inputEl) {
  if (!inputEl) inputEl = document.getElementById('pb-' + key);
  if (!inputEl) return;
  let raw = inputEl.value.trim().replace(/^\+/, '');
  let num = parseInt(raw, 10);
  if (isNaN(num)) num = 0;
  num = Math.max(-20, Math.min(20, num));
  _applyPericiaEl(inputEl, num);
  if (!state.character) return;
  if (!state.character.pericias) state.character.pericias = {};
  state.character.pericias[key] = num;
  await persistChar({ [`pericias.${key}`]: num });
}

// ──────────────────────────────────────────────────────────
//  BOLSA — helpers
// ──────────────────────────────────────────────────────────
function isConsumivel(tipo) {
  return !!(ARMA_TIPOS[tipo]?.consumivel);
}

function bolsaGetMaxRows() {
  const xp = state.character?.xp ?? 0;
  const p  = getPatenteFromXp(xp);
  return BOLSA_ROWS_BY_PATENTE[p] ?? BOLSA_ROWS;
}

// ──────────────────────────────────────────────────────────
//  BOLSA — Resident Evil-style 7×5 inventory grid
// ──────────────────────────────────────────────────────────
function bolsaGetSize(item) {
  const base = ARMA_SIZES[item.tipo] || { w: 1, h: 2 };
  return item.rotated ? { w: base.h, h: base.w } : { w: base.w, h: base.h };
}

function bolsaCanPlace(items, col, row, w, h, excludeIdx = -1, rowLimit = BOLSA_ROWS) {
  if (col < 0 || row < 0 || col + w > BOLSA_COLS || row + h > rowLimit) return false;
  for (let i = 0; i < items.length; i++) {
    if (i === excludeIdx) continue;
    const s = bolsaGetSize(items[i]);
    if (col < items[i].col + s.w && col + w > items[i].col &&
        row < items[i].row + s.h && row + h > items[i].row) return false;
  }
  return true;
}

function bolsaAutoPlace(items, w, h, rowLimit = BOLSA_ROWS) {
  for (let r = 0; r <= rowLimit - h; r++)
    for (let c = 0; c <= BOLSA_COLS - w; c++)
      if (bolsaCanPlace(items, c, r, w, h, -1, rowLimit)) return { col: c, row: r };
  return null;
}

function renderBolsa() {
  const bolsa  = state.character?.bolsa || { items: [], staged: [] };
  const items  = bolsa.items  || [];
  const staged = bolsa.staged || [];
  const container = document.getElementById('bolsa-grid-container');
  const grid      = document.getElementById('bolsa-grid');
  if (!grid) return;

  // move-mode: items become click-through so the container captures clicks
  container?.classList.toggle('bolsa-move-mode', bolsaSelected !== null);

  // rebuild grid: background cells first, items on top (absolute)
  const maxRows = bolsaGetMaxRows();
  grid.innerHTML = '';
  grid.style.gridTemplateRows = `repeat(${maxRows}, 46px)`;
  for (let r = 0; r < maxRows; r++)
    for (let c = 0; c < BOLSA_COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'bolsa-gcell' + (r >= maxRows ? ' bolsa-gcell-locked' : '');
      grid.appendChild(cell);
    }

  // Ghost preview element (hidden by default)
  const ghost = document.createElement('div');
  ghost.id = 'bolsa-ghost';
  ghost.className = 'bolsa-ghost bolsa-ghost-hidden';
  grid.appendChild(ghost);

  items.forEach((item, idx) => {
    const s  = bolsaGetSize(item);
    const el = document.createElement('div');
    const isSel      = idx === bolsaSelected;
    const isCraftSel = craftMode && craftSlots.includes(idx);
    el.className   = 'bolsa-item' + (isSel ? ' bolsa-selected' : '') + (isCraftSel ? ' bolsa-craft-sel' : '') +
                     (item.tipoDano === 'neutralizador' ? ' bolsa-item-neutr' : '') +
                     (item.rotated ? ' bolsa-item-rotated' : '') +
                     (isConsumivel(item.tipo) ? ` bic-${item.tipo}` : '');
    el.dataset.idx = idx;
    el.style.left   = (item.col * BOLSA_STEP) + 'px';
    el.style.top    = (item.row * BOLSA_STEP) + 'px';
    el.style.width  = (s.w * BOLSA_STEP - 1) + 'px';
    el.style.height = (s.h * BOLSA_STEP - 1) + 'px';
    const tipo    = ARMA_TIPOS[item.tipo] || ARMA_TIPOS.outro;
    const icoColor = CONSUMIVEL_COR[item.tipo] || '';
    const imgHtml = tipo.img
      ? `<img src="${tipo.img}" class="bolsa-item-img" alt="" />`
      : `<span class="bolsa-item-icon" ${icoColor ? `style="color:${icoColor}"` : ''}>${tipo.ico || '◈'}</span>`;
    const rotBadge  = item.rotated ? '<div class="bolsa-rot-badge">↻</div>' : '';
    // Mini usage bar for consumables
    const hasUsos  = item.usos !== undefined;
    const usoMax   = item.usoMax || item.usos || 1;
    const usoPct   = hasUsos ? Math.max(0, Math.round((item.usos / usoMax) * 100)) : 100;
    const usoBgCol = usoPct > 60 ? '#00cc66' : usoPct > 25 ? '#ccaa00' : '#cc3333';
    const usosBadge = hasUsos
      ? `<div class="bolsa-uso-bar-wrap"><div class="bolsa-uso-bar-fill" style="width:${usoPct}%;background:${usoBgCol}"></div></div><div class="bolsa-uso-badge${item.usos === 0 ? ' bolsa-uso-zero' : ''}">${item.usos}</div>`
      : '';
    el.innerHTML = `<div class="bolsa-item-inner">${imgHtml}<div class="bolsa-item-label">${escHtml(item.nome || tipo.label)}</div>${rotBadge}${usosBadge}</div>`;
    if (bolsaSelected === null) {
      el.addEventListener('click',    e => { e.stopPropagation(); bolsaItemClick(idx); });
      el.addEventListener('dblclick', e => {
        e.stopPropagation(); bolsaSelected = idx;
        if (isConsumivel(item.tipo)) bolsaUsarItem(idx); else bolsaEquipar(0);
      });
      el.addEventListener('mouseenter', () => bolsaShowTooltip(item, el.getBoundingClientRect()));
      el.addEventListener('mouseleave', bolsaHideTooltip);
    }
    grid.appendChild(el);
  });

  // space counter
  const spaceEl = document.getElementById('bolsa-space-info');
  if (spaceEl) {
    const used     = items.reduce((acc, it) => { const s = bolsaGetSize(it); return acc + s.w * s.h; }, 0);
    const maxCells = BOLSA_COLS * maxRows;
    const patNome  = PATENTES[state.character?.patente ?? 1]?.nome || 'NIV.1';
    spaceEl.textContent = (maxCells - used) + '/' + maxCells + ' LIVRES · ' + patNome;
  }

  renderBolsaActions();
  renderCraftPanel();
  renderCraftTutorial();

  const stagedEl = document.getElementById('bolsa-staged-list');
  if (stagedEl) {
    if (staged.length === 0) {
      stagedEl.innerHTML = '<div class="bolsa-staged-empty">— VAZIO —</div>';
    } else {
      stagedEl.innerHTML = staged.map((item, idx) => {
        const tipo = ARMA_TIPOS[item.tipo] || ARMA_TIPOS.outro;
        const s    = ARMA_SIZES[item.tipo] || { w: 1, h: 2 };
        return `<div class="bolsa-staged-item" onclick="App.bolsaTentarColocar(${idx})">
          <span class="bolsa-staged-nome">${escHtml(item.nome || tipo.label)}</span>
          <span class="bolsa-staged-tag">${s.w}&#215;${s.h}</span>
          <span class="bolsa-staged-hint">&#9658; COLOCAR</span>
        </div>`;
      }).join('');
    }
  }

  // Sync camo header badge (without re-rendering the full panel)
  const camoBadge = document.getElementById('bolsa-camo-eq-badge');
  if (camoBadge) {
    const equipadoId = state.character?.camuflagem || null;
    const eq = equipadoId ? CAMUFLAGENS.find(c => c.id === equipadoId) : null;
    camoBadge.textContent = eq ? eq.nome : 'NENHUMA';
  }
}

function renderBolsaActions() {
  const panel = document.getElementById('bolsa-actions');
  if (!panel) return;
  if (bolsaSelected === null) {
    bolsaDiscardArmed = false;
    panel.innerHTML = '<div class="bolsa-hint">&#9658; Clique para selecionar &nbsp;&middot;&nbsp; 2x usar/equipar &nbsp;&middot;&nbsp; ESC cancela</div>';
    return;
  }
  const bolsa = state.character?.bolsa || { items: [], staged: [] };
  const item  = bolsa.items[bolsaSelected];
  if (!item) { bolsaSelected = null; bolsaDiscardArmed = false; panel.innerHTML = ''; return; }
  const tipo    = ARMA_TIPOS[item.tipo] || ARMA_TIPOS.outro;
  const s       = bolsaGetSize(item);
  const isCons  = isConsumivel(item.tipo);
  const isIngr  = !!(ARMA_TIPOS[item.tipo]?.ingrediente);
  const consCor = CONSUMIVEL_COR[item.tipo] || '#44aa55';
  const dropLabel = bolsaDiscardArmed ? '&#10003; CONFIRMAR' : '&#10005; DESCARTAR';
  const dropClass = bolsaDiscardArmed ? 'bolsa-btn-drop-confirm' : 'bolsa-btn-drop';

  let mainSection = '';
  if (isCons && isIngr) {
    // Ingrediente de craft — exibe info mas não permite usar
    mainSection = `
      <div class="bolsa-uso-panel">
        <div class="bolsa-uso-panel-top">
          <span class="bolsa-uso-ico" style="color:${consCor}">${tipo.ico || '&#9672;'}</span>
          <div class="bolsa-uso-info">
            <div class="bolsa-uso-nome" style="color:${consCor}">${escHtml(item.nome || tipo.label)}</div>
            <div class="bolsa-uso-count" style="color:#556677">INGREDIENTE DE CRAFT</div>
          </div>
        </div>
        ${item.descricao ? `<div class="bolsa-uso-desc">${escHtml(item.descricao)}</div>` : ''}
        <div class="bolsa-ingrediente-hint">&#9874; Ative o modo COMBINAR para usar este ingrediente.</div>
      </div>`;
  } else if (isCons) {
    const hasUsos = item.usos !== undefined;
    const usoMax  = item.usoMax || item.usos || 1;
    const usoPct  = hasUsos ? Math.max(0, Math.round((item.usos / usoMax) * 100)) : 100;
    const usoBg   = usoPct > 60 ? '#00cc66' : usoPct > 25 ? '#ccaa00' : '#cc3333';
    const esgotado = hasUsos && item.usos <= 0;
    mainSection = `
      <div class="bolsa-uso-panel">
        <div class="bolsa-uso-panel-top">
          <span class="bolsa-uso-ico" style="color:${consCor}">${tipo.ico || '&#9672;'}</span>
          <div class="bolsa-uso-info">
            <div class="bolsa-uso-nome" style="color:${consCor}">${escHtml(item.nome || tipo.label)}</div>
            ${hasUsos ? `<div class="bolsa-uso-count">${item.usos} <span class="bolsa-uso-slash">/</span> ${usoMax} USOS</div>` : ''}
          </div>
        </div>
        ${item.descricao ? `<div class="bolsa-uso-desc">${escHtml(item.descricao)}</div>` : ''}
        ${hasUsos ? `<div class="bolsa-uso-bar-large"><div class="bolsa-uso-bar-large-fill" style="width:${usoPct}%;background:${usoBg}"></div></div>` : ''}
        <button class="bolsa-btn bolsa-btn-usar-big" style="border-color:${esgotado ? '#333' : consCor};color:${esgotado ? '#444' : consCor}"
                onclick="App.bolsaUsarItem(${bolsaSelected})" ${esgotado ? 'disabled' : ''}>
          ${esgotado ? '&#10005; ESGOTADO' : '&#9654; USAR'}
        </button>
      </div>`;
  } else {
    const slotA = state.character?.armas?.[0];
    const slotB = state.character?.armas?.[1];
    const slotALabel = slotA ? escHtml(slotA.nome || (ARMA_TIPOS[slotA.tipo]?.label) || 'EQUIPADO') : 'VAZIO';
    const slotBLabel = slotB ? escHtml(slotB.nome || (ARMA_TIPOS[slotB.tipo]?.label) || 'EQUIPADO') : 'VAZIO';
    const tdBadge = item.tipoDano === 'neutralizador'
      ? '<span class="bolsa-badge bolsa-badge-neutr">NEUTR.</span>'
      : '<span class="bolsa-badge bolsa-badge-mortal">MORTAL</span>';
    const rotLabel = item.rotated ? '&#8635; NORMAL' : '&#8635; GIRAR';
    const modsHtml = Object.entries(ARMA_MODS).map(([k, m]) => {
      const on = !!(item.mods?.[k]);
      return `<div class="bolsa-mod-slot${on ? ' bolsa-mod-filled' : ''}">
        <span class="bolsa-mod-ico">${on ? m.ico : '&#9633;'}</span>
        <span class="bolsa-mod-name">${m.label}</span>
        ${on ? '<span class="bolsa-mod-on">ON</span>' : ''}
      </div>`;
    }).join('');
    mainSection = `
      <div class="bolsa-sel-header">
        <div class="bolsa-sel-name">${escHtml(item.nome || tipo.label)}</div>
        <div class="bolsa-sel-badges">${tdBadge}<span class="bolsa-badge bolsa-badge-size">${s.w}&#215;${s.h}</span></div>
      </div>
      <div class="bolsa-sel-stats">
        ${item.dano    ? `<span><span class="bolsa-stat-k">DANO</span> ${escHtml(item.dano)}</span>` : ''}
        ${item.alcance ? `<span><span class="bolsa-stat-k">ALC.</span> ${escHtml(item.alcance)}</span>` : ''}
        ${item.descricao ? `<span class="bolsa-sel-desc">${escHtml(item.descricao)}</span>` : ''}
      </div>
      <div class="bolsa-mods-panel">
        <div class="bolsa-mods-title">&#9635; MODIFICA&#199;&#213;ES</div>
        <div class="bolsa-mods-slots">${modsHtml}</div>
      </div>
      <div class="bolsa-sel-btns">
        <button class="bolsa-btn bolsa-btn-equip" onclick="App.bolsaEquipar(0)">
          <span class="bolsa-btn-slot-label">I</span> ${slotALabel === 'VAZIO' ? 'EQUIPAR' : slotALabel}
        </button>
        <button class="bolsa-btn bolsa-btn-equip" onclick="App.bolsaEquipar(1)">
          <span class="bolsa-btn-slot-label">II</span> ${slotBLabel === 'VAZIO' ? 'EQUIPAR' : slotBLabel}
        </button>
        <button class="bolsa-btn bolsa-btn-rotate" onclick="App.bolsaGirar()">${rotLabel} <span class="bolsa-kbd">R</span></button>
      </div>`;
  }

  panel.innerHTML = `
    ${mainSection}
    <div class="bolsa-sel-btns bolsa-btns-bottom">
      <button class="bolsa-btn bolsa-btn-transfer" onclick="App.bolsaAbrirTransferencia()">&#8644; TRANSFERIR</button>
      <button class="bolsa-btn ${dropClass}" onclick="App.bolsaJogarFora()">${dropLabel}</button>
      <button class="bolsa-btn bolsa-btn-cancel" onclick="App.bolsaDeselecionar()">CANCELAR <span class="bolsa-kbd">ESC</span></button>
    </div>
    ${!isCons ? '<div class="bolsa-move-hint">&#9660; Clique no grid para mover</div>' : ''}
  `;
}
function bolsaItemClick(idx) {
  if (craftMode) { bolsaCraftToggleSlot(idx); return; }
  bolsaSelected = (bolsaSelected === idx) ? null : idx;
  renderBolsa();
}

function bolsaDeselecionar() {
  bolsaSelected     = null;
  bolsaDiscardArmed = false;
  bolsaHideGhost();
  bolsaHideTooltip();
  renderBolsa();
}

function bolsaHideGhost() {
  const ghost = document.getElementById('bolsa-ghost');
  if (ghost) ghost.className = 'bolsa-ghost bolsa-ghost-hidden';
  const grid = document.getElementById('bolsa-grid');
  if (grid) grid.querySelectorAll('.bolsa-gcell').forEach(c => {
    c.classList.remove('bolsa-gcell-hi-ok', 'bolsa-gcell-hi-bad');
  });
}

function bolsaUpdateGhost(col, row) {
  const grid  = document.getElementById('bolsa-grid');
  const ghost = document.getElementById('bolsa-ghost');
  if (!grid || !ghost || bolsaSelected === null) return;
  const bolsa = state.character?.bolsa;
  if (!bolsa) return;
  const item = bolsa.items[bolsaSelected];
  if (!item) return;
  const s   = bolsaGetSize(item);
  const maxRows = bolsaGetMaxRows();
  const gc  = Math.max(0, Math.min(BOLSA_COLS - s.w, col));
  const gr  = Math.max(0, Math.min(maxRows - s.h, row));
  const ok  = bolsaCanPlace(bolsa.items, gc, gr, s.w, s.h, bolsaSelected, maxRows);
  ghost.style.left   = (gc * BOLSA_STEP) + 'px';
  ghost.style.top    = (gr * BOLSA_STEP) + 'px';
  ghost.style.width  = (s.w * BOLSA_STEP - 1) + 'px';
  ghost.style.height = (s.h * BOLSA_STEP - 1) + 'px';
  ghost.className    = 'bolsa-ghost ' + (ok ? 'bolsa-ghost-ok' : 'bolsa-ghost-bad');
  grid.querySelectorAll('.bolsa-gcell').forEach((cell, i) => {
    const r = Math.floor(i / BOLSA_COLS), c = i % BOLSA_COLS;
    const hit = c >= gc && c < gc + s.w && r >= gr && r < gr + s.h;
    cell.classList.toggle('bolsa-gcell-hi-ok',  hit && ok);
    cell.classList.toggle('bolsa-gcell-hi-bad', hit && !ok);
  });
}

function bolsaShowTooltip(item, rect) {
  let tt = document.getElementById('bolsa-tooltip');
  if (!tt) {
    tt = document.createElement('div');
    tt.id = 'bolsa-tooltip';
    tt.className = 'bolsa-tooltip';
    document.getElementById('tab-panel-bolsa')?.appendChild(tt);
  }
  const tipo = ARMA_TIPOS[item.tipo] || ARMA_TIPOS.outro;
  const s    = bolsaGetSize(item);
  const td   = item.tipoDano || 'mortal';
  const metaSuffix = isConsumivel(item.tipo) ? '' : ` &middot; <span class="btt-td-${td}">${td.toUpperCase()}</span>`;
  tt.innerHTML = `
    <div class="btt-name">${escHtml(item.nome || tipo.label)}</div>
    <div class="btt-meta">${tipo.label} &middot; ${s.w}&times;${s.h}${metaSuffix}</div>
    ${item.usos !== undefined ? `<div class="btt-row"><span class="btt-k">USOS</span><span class="btt-v">${item.usos}${item.usoMax ? '/' + item.usoMax : ''}</span></div>` : ''}
    ${item.dano    ? `<div class="btt-row"><span class="btt-k">DANO</span><span class="btt-v">${escHtml(item.dano)}</span></div>` : ''}
    ${item.alcance ? `<div class="btt-row"><span class="btt-k">ALC.</span><span class="btt-v">${escHtml(item.alcance)}</span></div>` : ''}
    ${item.descricao ? `<div class="btt-desc">${escHtml(item.descricao)}</div>` : ''}
  `;
  tt.classList.remove('bolsa-tooltip-hidden');
  const wrap = document.getElementById('tab-panel-bolsa');
  if (wrap) {
    const wRect = wrap.getBoundingClientRect();
    const ttH   = tt.offsetHeight || 80;
    let left = rect.left - wRect.left;
    let top  = rect.top  - wRect.top - ttH - 6;
    if (top < 4) top = rect.bottom - wRect.top + 6;
    tt.style.left = Math.max(2, Math.min(wRect.width - 160, left)) + 'px';
    tt.style.top  = top + 'px';
  }
}

function bolsaHideTooltip() {
  const tt = document.getElementById('bolsa-tooltip');
  if (tt) tt.classList.add('bolsa-tooltip-hidden');
}

function bolsaCellClick(col, row) {
  if (bolsaSelected === null) return;
  const bolsa = state.character?.bolsa;
  if (!bolsa) return;
  const items = [...bolsa.items];
  const item  = items[bolsaSelected];
  const s     = bolsaGetSize(item);
  if (bolsaCanPlace(items, col, row, s.w, s.h, bolsaSelected, bolsaGetMaxRows())) {
    items[bolsaSelected] = { ...item, col, row };
    state.character.bolsa.items = items;
    persistChar({ bolsa: state.character.bolsa });
    bolsaSelected     = null;
    bolsaDiscardArmed = false;
    sfx('select');
    bolsaHideGhost();
    renderBolsa();
    // try to place staged items that may now fit
    bolsaAutoPlaceStaged();
  } else {
    showToast('Sem espaço aqui.', 'error', 900);
    renderBolsa();
  }
}

function setupBolsaGrid() {
  const container = document.getElementById('bolsa-grid-container');
  if (!container || container._bolsaReady) return;
  container._bolsaReady = true;

  // Click: place item in move mode
  container.addEventListener('click', e => {
    if (bolsaSelected === null) return;
    const grid = document.getElementById('bolsa-grid');
    if (!grid) return;
    const rect = grid.getBoundingClientRect();
    const col  = Math.floor((e.clientX - rect.left) / BOLSA_STEP);
    const row  = Math.floor((e.clientY - rect.top)  / BOLSA_STEP);
    if (col >= 0 && col < BOLSA_COLS && row >= 0 && row < BOLSA_ROWS)
      bolsaCellClick(col, row);
  });

  // Mousemove: ghost preview
  container.addEventListener('mousemove', e => {
    if (bolsaSelected === null) return;
    const grid = document.getElementById('bolsa-grid');
    if (!grid) return;
    const rect = grid.getBoundingClientRect();
    bolsaUpdateGhost(
      Math.floor((e.clientX - rect.left) / BOLSA_STEP),
      Math.floor((e.clientY - rect.top)  / BOLSA_STEP)
    );
  });

  // Mouseleave: hide ghost
  container.addEventListener('mouseleave', bolsaHideGhost);

  // Keyboard shortcuts scoped to bolsa tab
  if (_bolsaKeyHandler) document.removeEventListener('keydown', _bolsaKeyHandler);
  _bolsaKeyHandler = e => {
    if (state.currentTab !== 'bolsa') return;
    if (e.key === 'Escape') { e.preventDefault(); bolsaDeselecionar(); }
    if ((e.key === 'r' || e.key === 'R') && bolsaSelected !== null) { e.preventDefault(); bolsaGirar(); }
  };
  document.addEventListener('keydown', _bolsaKeyHandler);
}

async function bolsaEquipar(slot) {
  if (bolsaSelected === null || !state.character?.bolsa) return;
  const bolsa = state.character.bolsa;
  const items = [...bolsa.items];
  const item  = items[bolsaSelected];
  if (!item) return;
  if (isConsumivel(item.tipo)) {
    showToast('Consumíveis não podem ser equipados.', 'error', 1500);
    bolsaSelected = null; renderBolsa(); return;
  }
  const armas = [...(state.character.armas || [null, null])];
  while (armas.length < 2) armas.push(null);

  // Weapon currently in the target slot — will be swapped back to bolsa
  const oldArma = (armas[slot] && armas[slot].tipo) ? armas[slot] : null;

  // Strip grid metadata, keep weapon props
  const { col: _c, row: _r, rotated: _rot, id: _id, ...weaponData } = item;
  armas[slot] = weaponData;

  // Remove selected item from bolsa (freeing its grid space)
  items.splice(bolsaSelected, 1);
  bolsaSelected = null;

  // If there was a weapon in the slot, put it back in the bolsa
  if (oldArma) {
    const base = ARMA_SIZES[oldArma.tipo] || { w: 1, h: 2 };
    const pos  = bolsaAutoPlace(items, base.w, base.h, bolsaGetMaxRows());
    if (pos) {
      items.push({ ...oldArma, col: pos.col, row: pos.row, rotated: false });
      showToast(`${oldArma.nome || 'Item'} devolvido à bolsa.`, 'info', 1800);
    } else {
      const staged = [...(bolsa.staged || [])]; staged.push(oldArma);
      state.character.bolsa.staged = staged;
      showToast(`Sem espaço! ${oldArma.nome || 'Item'} em espera.`, 'error', 2200);
    }
  }

  state.character.armas       = armas;
  state.character.bolsa.items = items;
  await persistChar({ bolsa: state.character.bolsa });
  if (firebaseOk && auth?.currentUser && state.codename) {
    try {
      await updateDoc(doc(db, 'characters', state.codename), { armas, updatedAt: serverTimestamp() });
    } catch (_) {}
  }
  updateArmaDisplay(armas);
  renderBolsa();
  sfx('select');
  showToast('Equipado no SLOT ' + (slot + 1) + '.', 'success', 1500);
}

async function bolsaGirar() {
  if (bolsaSelected === null || !state.character?.bolsa) return;
  const items  = [...state.character.bolsa.items];
  const item   = items[bolsaSelected];
  const newRot = !item.rotated;
  const base   = ARMA_SIZES[item.tipo] || { w: 1, h: 2 };
  const nw     = newRot ? base.h : base.w;
  const nh     = newRot ? base.w : base.h;
  if (bolsaCanPlace(items, item.col, item.row, nw, nh, bolsaSelected, bolsaGetMaxRows())) {
    items[bolsaSelected] = { ...item, rotated: newRot };
    state.character.bolsa.items = items;
    await persistChar({ bolsa: state.character.bolsa });
    sfx('select');
  } else {
    showToast('Sem espaço para girar.', 'error', 1500);
  }
  renderBolsa();
}

async function bolsaJogarFora() {
  if (bolsaSelected === null || !state.character?.bolsa) return;
  // Two-step confirm: first click arms, second fires
  if (!bolsaDiscardArmed) {
    bolsaDiscardArmed = true;
    renderBolsaActions();
    setTimeout(() => { bolsaDiscardArmed = false; renderBolsaActions(); }, 2500);
    return;
  }
  const items = [...state.character.bolsa.items];
  items.splice(bolsaSelected, 1);
  bolsaSelected     = null;
  bolsaDiscardArmed = false;
  state.character.bolsa.items = items;
  await persistChar({ bolsa: state.character.bolsa });
  renderBolsa();
  sfx('close');
  showToast('Item descartado.', 'success', 1500);
  bolsaAutoPlaceStaged();
}

async function bolsaUsarItem(idx) {
  if (!state.character?.bolsa) return;
  const items = [...state.character.bolsa.items];
  const item  = items[idx];
  if (!item) return;

  // Ingredientes de craft não podem ser usados diretamente
  if (ARMA_TIPOS[item.tipo]?.ingrediente) {
    showToast('Este item é um ingrediente de craft — use o modo COMBINAR.', 'error', 2500);
    return;
  }
  let curUsos = item.usos;
  if (curUsos === undefined) {
    if (!isConsumivel(item.tipo)) return; // arma sem usos é equipável, não usável
    curUsos = CONSUMIVEL_USOS[item.tipo] ?? 1;
  }
  if (curUsos <= 0) { showToast('Sem usos restantes.', 'error', 1500); return; }
  const newUsos = curUsos - 1;
  sfx('select');

  // Apply item effects (healing / psych)
  const efeito = CONSUMIVEL_EFEITO[item.tipo];
  const efeitoMsgs = [];
  if (efeito) {
    if (efeito.integrity) {
      const pat  = state.character?.patente ?? 1;
      const max  = 4 + pat;
      const cur  = typeof state.character?.integrity === 'number' ? state.character.integrity : max;
      const novo = Math.min(max, cur + efeito.integrity);
      state.character.integrity = novo;
      await persistChar({ integrity: novo });
      updateIntegrityDisplay(novo);
      efeitoMsgs.push(`+${efeito.integrity} integridade`);
    }
    if (efeito.insanidade) {
      const psych = state.character?.psych || { insanidade: 0, medicado: false, gatilhos: [] };
      const novo  = Math.max(0, Math.min(100, (psych.insanidade || 0) + efeito.insanidade));
      state.character.psych = { ...psych, insanidade: novo };
      await persistChar({ psych: state.character.psych });
      applyPsychEffects(state.character.psych);
      const delta = efeito.insanidade < 0 ? efeito.insanidade : '+' + efeito.insanidade;
      efeitoMsgs.push(`insanidade ${delta} (${novo})`);
    }
  }

  const efeitoStr = efeitoMsgs.length ? ' · ' + efeitoMsgs.join(' · ') : '';
  if (newUsos <= 0) {
    items.splice(idx, 1);
    bolsaSelected = null;
    showToast(`${item.nome || 'Item'} esgotado!${efeitoStr}`, 'success', 2400);
  } else {
    const usoMaxVal = item.usoMax ?? CONSUMIVEL_USOS[item.tipo] ?? curUsos;
    items[idx] = { ...item, usos: newUsos, usoMax: usoMaxVal };
    showToast(`${item.nome || 'Item'} usado — ${newUsos} restante(s).${efeitoStr}`, 'success', 2400);
  }
  state.character.bolsa.items = items;
  await persistChar({ bolsa: state.character.bolsa });
  renderBolsa();
  bolsaAutoPlaceStaged();
}

async function bolsaAutoPlaceStaged() {
  if (!state.character?.bolsa) return;
  const staged = [...(state.character.bolsa.staged || [])];
  if (staged.length === 0) return;
  const items = [...(state.character.bolsa.items || [])];
  let changed = false;
  let i = 0;
  while (i < staged.length) {
    const item = staged[i];
    const base = ARMA_SIZES[item.tipo] || { w: 1, h: 2 };
    const pos  = bolsaAutoPlace(items, base.w, base.h, bolsaGetMaxRows());
    if (pos) {
      items.push({ ...item, col: pos.col, row: pos.row, rotated: false });
      staged.splice(i, 1);
      changed = true;
      showToast(`◈ ${item.nome || 'Item'} entrou na bolsa!`, 'success', 2000);
    } else {
      i++;
    }
  }
  if (changed) {
    state.character.bolsa.items  = items;
    state.character.bolsa.staged = staged;
    await persistChar({ bolsa: state.character.bolsa });
    renderBolsa();
  }
}

async function bolsaTentarColocar(stagedIdx) {
  if (!state.character?.bolsa) return;
  const bolsa  = state.character.bolsa;
  const staged = [...(bolsa.staged || [])];
  const item   = staged[stagedIdx];
  if (!item) return;
  const base = ARMA_SIZES[item.tipo] || { w: 1, h: 2 };
  const pos  = bolsaAutoPlace(bolsa.items || [], base.w, base.h, bolsaGetMaxRows());
  if (!pos) { showToast('Sem espaço na bolsa.', 'error', 2000); return; }
  const items = [...(bolsa.items || [])];
  items.push({ ...item, col: pos.col, row: pos.row, rotated: false });
  staged.splice(stagedIdx, 1);
  state.character.bolsa.items  = items;
  state.character.bolsa.staged = staged;
  await persistChar({ bolsa: state.character.bolsa });
  renderBolsa();
  sfx('select');
}

// ──────────────────────────────────────────────────────────
//  CRAFT — Fabricacao de medicinais / psicologicos
// ──────────────────────────────────────────────────────────
function bolsaToggleCraftMode() {
  craftMode = !craftMode;
  if (!craftMode) craftSlots = [null, null, null];
  bolsaSelected = null;
  renderBolsa();
}

function bolsaCraftToggleSlot(bolsaIdx) {
  const existing = craftSlots.indexOf(bolsaIdx);
  if (existing !== -1) {
    craftSlots[existing] = null;
    renderCraftPanel();
    return;
  }
  const empty = craftSlots.indexOf(null);
  if (empty !== -1) craftSlots[empty] = bolsaIdx;
  renderCraftPanel();
}

function bolsaCraftFindRecipe() {
  const items  = state.character?.bolsa?.items || [];
  const filled = craftSlots.filter(s => s !== null);
  if (filled.length < 2) return null;
  const selectedTypes = filled.map(idx => items[idx]?.tipo).filter(Boolean).sort();
  for (const r of CRAFT_RECIPES) {
    const required = [...r.ingredientes].sort();
    if (selectedTypes.length === required.length && selectedTypes.every((t, i) => t === required[i])) return r;
  }
  return null;
}

async function bolsaCombinar() {
  const recipe = bolsaCraftFindRecipe();
  if (!recipe) return;
  const items   = [...(state.character.bolsa?.items || [])];
  const filled  = craftSlots.filter(s => s !== null);
  if (!filled.every(idx => items[idx])) return;

  // Consume one use from each ingredient (remove if last use)
  const toRemove = [];
  for (const idx of filled) {
    const item = items[idx];
    if (item.usos !== undefined && item.usos > 1) {
      items[idx] = { ...item, usos: item.usos - 1 };
    } else {
      toRemove.push(idx);
    }
  }
  // Remove exhausted ingredients in descending index order to preserve indices
  for (const idx of [...new Set(toRemove)].sort((a, b) => b - a)) items.splice(idx, 1);

  // Auto-place crafted result
  const res  = recipe.resultado;
  const base = ARMA_SIZES[res.tipo] || { w: 1, h: 1 };
  const pos  = bolsaAutoPlace(items, base.w, base.h, bolsaGetMaxRows());
  if (pos) {
    items.push({ ...res, col: pos.col, row: pos.row, rotated: false });
    showToast('\u25c8 ' + res.nome + ' fabricado!', 'success', 2500);
  } else {
    const staged = [...(state.character.bolsa.staged || [])];
    staged.push(res);
    state.character.bolsa.staged = staged;
    showToast(res.nome + ' fabricado \u2014 bolsa cheia, aguardando espaco.', 'info', 3000);
  }

  craftSlots = [null, null, null];
  craftMode  = false;
  state.character.bolsa.items = items;
  await persistChar({ bolsa: state.character.bolsa });
  renderBolsa();
  sfx('select');
}

function craftTutSetTab(tab) {
  _craftTutTab = tab;
  const el = document.getElementById('bolsa-tut-list');
  if (el) el.dataset.built = '';
  renderCraftTutorial();
}

function _craftIco(tipoKey, cor, size) {
  const tipo = ARMA_TIPOS[tipoKey] || {};
  const sz   = size || 16;
  if (tipo.img) return `<img src="${tipo.img}" class="craft-ico-img" style="width:${sz}px;height:${sz}px" alt="" />`;
  return `<span style="color:${cor || '#aaa'}">${tipo.ico || '\u25c8'}</span>`;
}

function renderCraftTutorial() {
  const el = document.getElementById('bolsa-tut-list');
  if (!el) return;
  if (el.dataset.built === _craftTutTab) return;
  el.dataset.built = _craftTutTab;

  const categorias = [
    { id: 'medicamentos', label: 'MEDICAMENTOS' },
    { id: 'armamentos',   label: 'ARMAMENTOS'   },
    { id: 'armadilhas',   label: 'ARMADILHAS'   },
  ];
  const tabsHtml = categorias.map(c =>
    `<button class="craft-tut-tab${_craftTutTab === c.id ? ' craft-tut-tab-active' : ''}" onclick="App.craftTutSetTab('${c.id}')">${c.label}</button>`
  ).join('');

  const recipes = CRAFT_RECIPES.filter(r => r.categoria === _craftTutTab);
  const listHtml = recipes.map(r => {
    const resCor  = CONSUMIVEL_COR[r.resultado.tipo] || '#aaa';
    const ingHtml = r.ingredientes.map(t => {
      const cor  = CONSUMIVEL_COR[t] || '#888';
      const tipo = ARMA_TIPOS[t] || {};
      return `<span class="craft-tut-ing" style="color:${cor}">${_craftIco(t, cor, 14)} ${tipo.label || t}</span>`;
    }).join('<span class="craft-tut-plus">+</span>');
    return `<div class="craft-tut-entry">
      <div class="craft-tut-formula">${ingHtml}<span class="craft-tut-arrow">&#10145;</span><span class="craft-tut-res" style="color:${resCor}">${_craftIco(r.resultado.tipo, resCor, 14)} ${r.resultado.nome}</span></div>
      <div class="craft-tut-desc">${r.desc}</div>
    </div>`;
  }).join('');

  el.innerHTML = `<div class="craft-tut-tabs">${tabsHtml}</div><div class="craft-tut-entries">${listHtml}</div>`;
}

function renderCraftPanel() {
  const panel = document.getElementById('bolsa-craft-panel');
  const badge = document.getElementById('craft-mode-badge');
  if (!panel) return;
  if (badge) {
    badge.textContent = craftMode ? 'ATIVO' : 'INATIVO';
    badge.className   = 'craft-mode-badge' + (craftMode ? ' craft-mode-on' : '');
  }
  if (!craftMode) {
    panel.innerHTML = '<div class="craft-hint-idle">&#9658; Ative para combinar ingredientes da bolsa</div>';
    return;
  }
  const items      = state.character?.bolsa?.items || [];
  const recipe     = bolsaCraftFindRecipe();
  const filledCnt  = craftSlots.filter(s => s !== null).length;

  const slotsHtml = [0, 1, 2].map(i => {
    const idx  = craftSlots[i];
    const item = idx !== null ? items[idx] : null;
    if (item) {
      const tipo = ARMA_TIPOS[item.tipo] || ARMA_TIPOS.outro;
      const cor  = CONSUMIVEL_COR[item.tipo] || '#888';
      return `<div class="craft-slot craft-slot-filled" onclick="App.bolsaCraftToggleSlot(${idx})" style="border-color:${cor};color:${cor}">
        <span class="craft-slot-ico">${_craftIco(item.tipo, cor, 22)}</span>
        <span class="craft-slot-lbl">${escHtml(item.nome || tipo.label)}</span>
        <span class="craft-slot-x">&#10005;</span>
      </div>`;
    }
    return `<div class="craft-slot craft-slot-empty"><span class="craft-slot-ph">+ INGREDIENTE</span></div>`;
  }).join('');

  let matchHtml = '';
  if (recipe) {
    const resCor  = CONSUMIVEL_COR[recipe.resultado.tipo] || '#aaa';
    const resType = ARMA_TIPOS[recipe.resultado.tipo] || {};
    matchHtml = `<div class="craft-match">
      <span class="craft-match-ico" style="color:${resCor}">${_craftIco(recipe.resultado.tipo, resCor, 28)}</span>
      <div class="craft-match-info">
        <div class="craft-match-name" style="color:${resCor}">${recipe.resultado.nome}</div>
        <div class="craft-match-desc">${recipe.desc}</div>
      </div>
    </div>`;
  } else if (filledCnt >= 2) {
    matchHtml = '<div class="craft-no-match">&#8212; SEM RECEITA &#8212;</div>';
  }

  panel.innerHTML = `
    <div class="craft-hint-active">&#9658; Clique nos itens da bolsa para selecionar ingredientes</div>
    <div class="craft-slots-wrap">${slotsHtml}</div>
    ${matchHtml}
    ${recipe ? `<button class="craft-btn-combinar" onclick="App.bolsaCombinar()">&#9654; COMBINAR</button>` : ''}
  `;
}

// Player: send equipped weapon from arma slot back to bolsa
async function armaParaBolsa(slot) {
  const arma = state.character?.armas?.[slot];
  if (!arma || !arma.tipo) return;
  const bolsa  = state.character.bolsa || { items: [], staged: [] };
  const items  = [...(bolsa.items  || [])];
  const staged = [...(bolsa.staged || [])];
  const base   = ARMA_SIZES[arma.tipo] || { w: 1, h: 2 };
  const pos    = bolsaAutoPlace(items, base.w, base.h, bolsaGetMaxRows());
  const armas  = [...(state.character.armas || [null, null])];
  while (armas.length < 2) armas.push(null);
  armas[slot]  = null;
  if (pos) {
    items.push({ ...arma, col: pos.col, row: pos.row, rotated: false });
    showToast(`${arma.nome || 'Item'} → bolsa.`, 'success', 1500);
  } else {
    staged.push(arma);
    showToast(`Sem espaço! ${arma.nome || 'Item'} em espera.`, 'error', 2000);
  }
  state.character.bolsa = { ...bolsa, items, staged };
  state.character.armas = armas;
  await persistChar({ bolsa: state.character.bolsa });
  if (firebaseOk && auth?.currentUser && state.codename) {
    try {
      await updateDoc(doc(db, 'characters', state.codename), { armas, updatedAt: serverTimestamp() });
    } catch (_) {}
  }
  updateArmaDisplay(armas);
  if (state.currentTab === 'bolsa') renderBolsa();
  sfx('select');
}

// GM: send weapon to a player's bolsa
async function gmEnviarParaBolsa(codename) {
  const g = id => document.getElementById(id);
  const tipo     = g(`gm-bolsa-tipo-${codename}`)?.value;
  const nome     = g(`gm-bolsa-nome-${codename}`)?.value.trim();
  const dano     = g(`gm-bolsa-dano-${codename}`)?.value.trim();
  const alcance  = g(`gm-bolsa-alcance-${codename}`)?.value.trim();
  const tipoDano = g(`gm-bolsa-tdano-${codename}`)?.value || 'mortal';
  const desc     = g(`gm-bolsa-desc-${codename}`)?.value.trim();
  const usosRaw  = g(`gm-bolsa-usos-${codename}`)?.value;
  const usosDefault = isConsumivel(tipo) ? (CONSUMIVEL_USOS[tipo] ?? 1) : undefined;
  const usos = isConsumivel(tipo)
    ? Math.max(1, parseInt(usosRaw, 10) || usosDefault)
    : undefined;
  if (!tipo) return;

  let currentBolsa = { items: [], staged: [] };
  if (firebaseOk) {
    try {
      const snap = await getDoc(doc(db, 'characters', codename));
      if (snap.exists()) currentBolsa = snap.data().bolsa || { items: [], staged: [] };
    } catch (_) {}
  } else {
    const ch = LocalDB.getChar(codename);
    if (ch) currentBolsa = ch.bolsa || { items: [], staged: [] };
  }
  const items  = [...(currentBolsa.items  || [])];
  const staged = [...(currentBolsa.staged || [])];
  const newItem = {
    id: Date.now().toString(36), tipo, nome, dano, alcance, tipoDano, descricao: desc,
    modificadores: [], rotated: false,
    ...(usos !== undefined ? { usos, usoMax: usos } : {})
  };
  const base = ARMA_SIZES[tipo] || { w: 1, h: 2 };
  const pos  = bolsaAutoPlace(items, base.w, base.h, BOLSA_ROWS); // GM bypasses patente limit
  if (pos) {
    items.push({ ...newItem, col: pos.col, row: pos.row });
    showToast(codename + ': item colocado na bolsa.', 'success', 1500);
  } else {
    staged.push(newItem);
    showToast(codename + ': bolsa cheia — item em fila.', 'error', 2500);
  }
  await gmUpdateChar(codename, { bolsa: { items, staged } });
  // clear form
  ['nome','dano','alcance','desc'].forEach(k => { const el = g(`gm-bolsa-${k}-${codename}`); if (el) el.value = ''; });
}

async function gmRemoverDaBolsa(codename, source, idx) {
  let currentBolsa = { items: [], staged: [] };
  if (firebaseOk) {
    try {
      const snap = await getDoc(doc(db, 'characters', codename));
      if (snap.exists()) currentBolsa = snap.data().bolsa || { items: [], staged: [] };
    } catch (_) {}
  } else {
    const ch = LocalDB.getChar(codename);
    if (ch) currentBolsa = ch.bolsa || { items: [], staged: [] };
  }
  const items  = [...(currentBolsa.items  || [])];
  const staged = [...(currentBolsa.staged || [])];
  if (source === 'grid') items.splice(idx, 1);
  else staged.splice(idx, 1);
  await gmUpdateChar(codename, { bolsa: { items, staged } });
  sfx('select');
}

function buildGMBolsaHtml(char) {
  const bolsa  = char.bolsa  || { items: [], staged: [] };
  const items  = bolsa.items  || [];
  const staged = bolsa.staged || [];
  const armaOpts = Object.entries(ARMA_TIPOS).filter(([,v]) => !v.consumivel).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join('');
  const consOpts = Object.entries(ARMA_TIPOS).filter(([,v]) =>  v.consumivel).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join('');
  const tipoOpts = `<optgroup label="Armamento">${armaOpts}</optgroup><optgroup label="Consumíveis">${consOpts}</optgroup>`;
  const allRows = [
    ...items.map((it, i)  => ({ ...it, _src: 'grid',   _idx: i })),
    ...staged.map((it, i) => ({ ...it, _src: 'staged', _idx: i }))
  ];
  const listHtml = allRows.length === 0
    ? '<div class="bolsa-staged-empty" style="padding:4px">Bolsa vazia.</div>'
    : allRows.map(it => {
        const tipo = ARMA_TIPOS[it.tipo] || ARMA_TIPOS.outro;
        return `<div class="gm-bolsa-row">
          <span class="gm-bolsa-nome">${escHtml(it.nome || tipo.label)}</span>
          <span class="gm-bolsa-loc">[${it._src === 'grid' ? 'GRID' : 'FILA'}]</span>
          <button class="gm-bolsa-rm" onclick="App.gmRemoverDaBolsa('${char.codename}','${it._src}',${it._idx})">&#10005;</button>
        </div>`;
      }).join('');
  return `
    <div class="gm-bolsa-list">${listHtml}</div>
    <div class="gm-bolsa-form">
      <div class="gm-bolsa-form-row">
        <select id="gm-bolsa-tipo-${char.codename}" class="gm-select">${tipoOpts}</select>
        <input  id="gm-bolsa-nome-${char.codename}" class="gm-text-input" placeholder="nome..." type="text" />
      </div>
      <div class="gm-bolsa-form-row">
        <input id="gm-bolsa-dano-${char.codename}"    class="gm-text-input" placeholder="dano..."    type="text" />
        <input id="gm-bolsa-alcance-${char.codename}" class="gm-text-input" placeholder="alcance..." type="text" />
      </div>
      <div class="gm-bolsa-form-row">
        <select id="gm-bolsa-tdano-${char.codename}" class="gm-select">
          <option value="mortal">MORTAL</option><option value="neutralizador">NEUTRALIZADOR</option>
        </select>
        <input id="gm-bolsa-desc-${char.codename}" class="gm-text-input" placeholder="descrição..." type="text" />
      </div>
      <div class="gm-bolsa-form-row">
        <input id="gm-bolsa-usos-${char.codename}" class="gm-text-input" placeholder="usos (consumíveis)" type="number" min="1" max="99" />
      </div>
      <button class="gm-bolsa-send" onclick="App.gmEnviarParaBolsa('${char.codename}')">&#43; ENVIAR PARA BOLSA</button>
    </div>`;
}

// ──────────────────────────────────────────────────────────
//  LOOT DE MISSÃO — ferramenta do GM
// ──────────────────────────────────────────────────────────
function renderGMLootList() {
  const el = document.getElementById('gm-loot-items');
  if (!el) return;
  if (_lootPool.length === 0) {
    el.innerHTML = '<div class="gm-fitas-empty">Nenhum item no loot.</div>';
    return;
  }
  const operOpts = _gmCharsList.length
    ? _gmCharsList.map(c => `<option value="${escHtml(c.codename)}">${escHtml(c.codename)}</option>`).join('')
    : '';
  el.innerHTML = _lootPool.map((it, idx) => {
    const tipo = ARMA_TIPOS[it.tipo] || ARMA_TIPOS.outro;
    const usosInfo = it.usos !== undefined ? ` (${it.usos})` : '';
    return `<div class="gm-loot-row">
      <span class="gm-loot-nome">${escHtml(it.nome || tipo.label)}${usosInfo}</span>
      <select class="gm-select gm-loot-target" id="gm-loot-target-${idx}" style="max-width:92px">
        <option value="">TODOS</option>${operOpts}
      </select>
      <button class="gm-bolsa-rm" onclick="App.gmLootRemoveItem(${idx})">&#10005;</button>
    </div>`;
  }).join('');
}

function gmLootAddItem() {
  const g = id => document.getElementById(id);
  const tipo     = g('gm-loot-tipo')?.value;
  const nome     = g('gm-loot-nome')?.value.trim();
  const dano     = g('gm-loot-dano')?.value.trim();
  const alcance  = g('gm-loot-alcance')?.value.trim();
  const tipoDano = g('gm-loot-tdano')?.value || 'mortal';
  const desc     = g('gm-loot-desc')?.value.trim();
  const usosRaw  = g('gm-loot-usos')?.value;
  const usosDefault = isConsumivel(tipo) ? (CONSUMIVEL_USOS[tipo] ?? 1) : undefined;
  const usos = isConsumivel(tipo)
    ? Math.max(1, parseInt(usosRaw, 10) || usosDefault)
    : undefined;
  if (!tipo) return;
  _lootPool.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    tipo, nome, dano, alcance, tipoDano, descricao: desc,
    modificadores: [], rotated: false,
    ...(usos !== undefined ? { usos, usoMax: usos } : {})
  });
  renderGMLootList();
  _saveLootState();
  ['nome','dano','alcance','desc'].forEach(k => { const el = g('gm-loot-' + k); if (el) el.value = ''; });
  if (g('gm-loot-usos')) g('gm-loot-usos').value = '';
}

function gmLootRemoveItem(idx) {
  _lootPool.splice(idx, 1);
  renderGMLootList();
  _saveLootState();
}

async function loadLootState() {
  if (!firebaseOk) return;
  try {
    const snap = await getDoc(doc(db, 'gameState', 'loot'));
    if (snap.exists()) { _lootPool = snap.data().items || []; renderGMLootList(); }
  } catch (e) { console.error('loot load:', e); }
}

function _saveLootState() {
  if (!firebaseOk) return;
  setDoc(doc(db, 'gameState', 'loot'), { items: _lootPool }).catch(e => console.error('loot save:', e));
}

async function gmLootDistribuir() {
  if (_lootPool.length === 0) { showToast('Loot vazio.', 'error'); return; }
  // Collect targets from DOM before clearing
  const assignments = _lootPool.map((item, idx) => {
    const targetEl = document.getElementById('gm-loot-target-' + idx);
    return { item, target: targetEl ? targetEl.value.trim() : '' };
  });
  let sent = 0;
  for (const { item, target } of assignments) {
    const targets = target
      ? [target]
      : _gmCharsList.map(c => c.codename);
    if (targets.length === 0) { showToast('Sem operadores para distribuir.', 'error'); return; }
    for (const codename of targets) {
      let currentBolsa = { items: [], staged: [] };
      if (firebaseOk) {
        try {
          const snap = await getDoc(doc(db, 'characters', codename));
          if (snap.exists()) currentBolsa = snap.data().bolsa || { items: [], staged: [] };
        } catch (_) {}
      }
      const items  = [...(currentBolsa.items  || [])];
      const staged = [...(currentBolsa.staged || [])];
      const base   = ARMA_SIZES[item.tipo] || { w: 1, h: 2 };
      const pos    = bolsaAutoPlace(items, base.w, base.h, BOLSA_ROWS); // GM bypasses patente limit
      const newItem = { ...item, id: item.id + '_' + codename.slice(0,3) };
      if (pos) { items.push({ ...newItem, col: pos.col, row: pos.row }); }
      else      { staged.push(newItem); }
      await gmUpdateChar(codename, { bolsa: { items, staged } });
      sent++;
    }
  }
  _lootPool = [];
  renderGMLootList();
  _saveLootState();
  sfx('select');
  showToast(`Loot distribuído — ${sent} envio(s).`, 'success', 2500);
}

// ──────────────────────────────────────────────────────────
//  TRANSFERÊNCIA P2P ENTRE BOLSAS
// ──────────────────────────────────────────────────────────
async function bolsaAbrirTransferencia() {
  if (bolsaSelected === null) return;
  const panel = document.getElementById('bolsa-actions');
  if (!panel) return;
  panel.innerHTML = '<div class="bolsa-hint">Carregando operadores...</div>';
  let chars = [];
  if (firebaseOk) {
    try {
      const snap = await getDocs(collection(db, 'characters'));
      snap.forEach(d => { const data = d.data(); if (data.codename && data.codename !== state.codename) chars.push(data); });
    } catch (e) {
      showToast('Erro ao carregar operadores.', 'error'); renderBolsaActions(); return;
    }
  }
  if (chars.length === 0) {
    panel.innerHTML = `<div class="bolsa-hint">Nenhum outro operador dispon\u00edvel.</div>
      <button class="bolsa-btn bolsa-btn-cancel" onclick="App.renderBolsaActionsPublic()">CANCELAR</button>`;
    return;
  }
  const listaHtml = chars.map(c =>
    `<div class="bolsa-transfer-row" onclick="App.bolsaTransferir('${escHtml(c.codename)}')">
      <span class="bolsa-transfer-nome">${escHtml(c.codename)}</span>
      <span class="bolsa-transfer-hint">&#9658; ENVIAR</span>
    </div>`
  ).join('');
  panel.innerHTML = `
    <div class="bolsa-sel-name" style="margin-bottom:6px">&#8644; ENVIAR PARA OPERADOR</div>
    <div class="bolsa-transfer-list">${listaHtml}</div>
    <button class="bolsa-btn bolsa-btn-cancel" onclick="App.renderBolsaActionsPublic()">CANCELAR <span class="bolsa-kbd">ESC</span></button>
  `;
}

// Public wrapper so HTML onclick can call it
function renderBolsaActionsPublic() { renderBolsaActions(); }

async function bolsaTransferir(targetCodename) {
  if (bolsaSelected === null || !state.character?.bolsa) return;
  if (!targetCodename) return;
  const items = [...state.character.bolsa.items];
  const item  = items[bolsaSelected];
  if (!item) return;

  // Fetch target's bolsa
  let targetBolsa = { items: [], staged: [] };
  if (firebaseOk) {
    try {
      const snap = await getDoc(doc(db, 'characters', targetCodename));
      if (snap.exists()) targetBolsa = snap.data().bolsa || { items: [], staged: [] };
    } catch (e) { showToast('Erro ao acessar bolsa do alvo.', 'error'); return; }
  }

  // Strip grid metadata, keep item data
  const { col: _c, row: _r, ...itemData } = item;
  const targetStaged = [...(targetBolsa.staged || [])];
  targetStaged.push({ ...itemData, rotated: false });

  // Remove from sender
  items.splice(bolsaSelected, 1);
  bolsaSelected = null;
  state.character.bolsa.items = items;
  await persistChar({ bolsa: state.character.bolsa });

  // Write to target
  if (firebaseOk) {
    try {
      await updateDoc(doc(db, 'characters', targetCodename), {
        bolsa: { ...targetBolsa, staged: targetStaged },
        updatedAt: serverTimestamp()
      });
    } catch (e) { showToast('Erro ao enviar item ao operador.', 'error'); return; }
  }
  renderBolsa();
  sfx('select');
  showToast(`Item transferido para ${targetCodename}.`, 'success', 2000);
}

// ──────────────────────────────────────────────────────────
//  CAMUFLAGEM
// ──────────────────────────────────────────────────────────

function bolsaCamoToggle() {
  const body    = document.getElementById('bolsa-camo-body');
  const chevron = document.getElementById('bolsa-camo-chevron');
  if (!body) return;
  const opening = body.classList.toggle('hidden');
  // classList.toggle returns true when classList has the class AFTER toggling
  // So 'opening' = false means we just removed hidden = opened it
  if (!opening) {
    chevron && (chevron.textContent = '▾');
    renderCamuflagem();
  } else {
    chevron && (chevron.textContent = '►');
    _camoSelected = null;
  }
}

function bolsaCamoSelect(id) {
  _camoSelected = (_camoSelected === id) ? null : id;
  renderCamuflagem();
}

function renderCamuflagem() {
  const el = document.getElementById('bolsa-camo-body');
  if (!el || el.classList.contains('hidden')) return;

  const equipadoId = state.character?.camuflagem || null;
  const equipado   = equipadoId ? CAMUFLAGENS.find(c => c.id === equipadoId) : null;

  // Update header badge
  const badge = document.getElementById('bolsa-camo-eq-badge');
  if (badge) badge.textContent = equipado ? equipado.nome : 'NENHUMA';

  // Equipped panel
  const eqHtml = equipado
    ? `<div class="bolsa-camo-equipped bolsa-camo-equip-show" id="bolsa-camo-eq-panel"
            style="--cc:${equipado.cor}; --ca:${equipado.acento}">
        <div class="bolsa-camo-eq-icon" style="background:${equipado.gradient || equipado.cor}; color:${equipado.gradient ? 'transparent' : equipado.acento}; -webkit-background-clip:${equipado.gradient ? 'text' : 'unset'}; background-clip:${equipado.gradient ? 'text' : 'unset'}; border:1px solid ${equipado.acento}44">
          <span style="background:${equipado.gradient || 'none'}; -webkit-background-clip:${equipado.gradient ? 'text' : 'unset'}; background-clip:${equipado.gradient ? 'text' : 'unset'}; color:${equipado.gradient ? 'transparent' : equipado.acento}; font-weight:bold">${escHtml(equipado.iconeChar)}</span>
        </div>
        <div class="bolsa-camo-eq-info">
          <div class="bolsa-camo-eq-nome">${fmtCamo(equipado.nome)}</div>
          <div class="bolsa-camo-eq-amb">${fmtCamo(equipado.ambiente)}</div>
          <div class="bolsa-camo-index-bar">
            <div class="bolsa-camo-bar-fill" style="width:${equipado.camo}%; background:${equipado.gradient || equipado.acento}"></div>
            <div class="bolsa-camo-bar-label" style="color:${equipado.acento}">${equipado.camo}%</div>
          </div>
          <div class="bolsa-camo-eq-efeito" style="color:${equipado.acento}">${fmtCamo(equipado.efeito)}</div>
        </div>
        <button class="bolsa-camo-remove-btn" onclick="App.equiparCamuflagem(null)">REMOVER</button>
      </div>`
    : `<div class="bolsa-camo-nenhuma" id="bolsa-camo-eq-panel">
        <span class="bolsa-camo-nenhuma-ico">&#9671;</span>
        NENHUMA CAMUFLAGEM EQUIPADA
      </div>`;

  // Camo list — split into unlocked and locked
  const unlockedHtml = [];
  const lockedHtml   = [];

  CAMUFLAGENS.forEach(c => {
    const isReleased = camoReleasedState.includes(c.id);
    const isEq  = c.id === equipadoId;
    const isSel = c.id === _camoSelected;
    const camoColor = camoIndexColor(c.camo);

    if (!isReleased) {
      // Locked entry — no expand, no equip
      lockedHtml.push(`<div class="bolsa-camo-card bolsa-camo-locked-card">
        <div class="bolsa-camo-card-row">
          <div class="bolsa-camo-card-icon bolsa-camo-icon-locked">&#128274;</div>
          <div class="bolsa-camo-card-info">
            <div class="bolsa-camo-card-nome bolsa-camo-nome-locked">[ACESSO RESTRITO]</div>
            <div class="bolsa-camo-card-amb bolsa-camo-amb-locked">BLOQUEADA PELO GM</div>
          </div>
          <div class="bolsa-camo-card-pct bolsa-camo-pct-locked">???%</div>
        </div>
      </div>`);
      return;
    }

    unlockedHtml.push(`<div class="bolsa-camo-card${isEq ? ' equipped' : ''}${isSel ? ' expanded' : ''}"
                 onclick="App.bolsaCamoSelect('${c.id}')">
      <div class="bolsa-camo-card-row">
        <div class="bolsa-camo-card-icon" style="background:${c.cor}; border-color:${c.acento}22; position:relative; overflow:hidden">
          ${c.gradient
            ? `<span style="background:${c.gradient}; -webkit-background-clip:text; background-clip:text; color:transparent; font-weight:bold; font-size:11px; letter-spacing:0.02em">${escHtml(c.iconeChar)}</span>`
            : `<span style="color:${c.acento}; font-weight:bold">${escHtml(c.iconeChar)}</span>`
          }
        </div>
        <div class="bolsa-camo-card-info">
          <div class="bolsa-camo-card-nome">${fmtCamo(c.nome)}${isEq ? ' <span class="bolsa-camo-eq-tag">EQUIPADA</span>' : ''}</div>
          <div class="bolsa-camo-card-amb">${fmtCamo(c.ambiente)}</div>
        </div>
        <div class="bolsa-camo-card-pct" style="color:${camoColor}">${c.camo}%</div>
      </div>
      ${isSel ? `
        <div class="bolsa-camo-card-detail" style="border-color:${c.acento}33">
          <div class="bolsa-camo-index-bar" style="margin-bottom:8px">
            <div class="bolsa-camo-bar-fill" style="width:${c.camo}%; background:${c.gradient || c.acento}"></div>
            <div class="bolsa-camo-bar-label" style="color:${camoColor}">${c.camo}% ÍNDICE</div>
          </div>
          <div class="bolsa-camo-detail-efeito" style="color:${c.acento}cc">${fmtCamo(c.efeito)}</div>
          <div class="bolsa-camo-detail-sabor">${fmtCamo(c.sabor)}</div>
          ${!isEq
            ? `<button class="bolsa-camo-equip-btn" style="border-color:${c.acento}; ${c.gradient ? `background:${c.gradient}; -webkit-background-clip:text; background-clip:text; color:transparent;` : `color:${c.acento};`}"
                       onclick="event.stopPropagation(); App.equiparCamuflagem('${c.id}')">
                 &#9658; EQUIPAR
               </button>`
            : `<button class="bolsa-camo-equip-btn bolsa-camo-equipped-btn"
                       onclick="event.stopPropagation(); App.equiparCamuflagem(null)">
                 &#9724; REMOVER
               </button>`
          }
        </div>` : ''}
    </div>`);
  });

  const allListHtml = unlockedHtml.join('') +
    (lockedHtml.length ? `<div class="bolsa-camo-locked-divider">&#128274; BLOQUEADAS (${lockedHtml.length})</div>` + lockedHtml.join('') : '');

  const unlockedCount = unlockedHtml.length;
  el.innerHTML = `
    <div class="bolsa-camo-eq-wrap">${eqHtml}</div>
    <div class="bolsa-camo-list-title">&#9658; CAMUFLAGENS DISPONÍVEIS <span class="bolsa-camo-count">${unlockedCount}/${CAMUFLAGENS.length}</span></div>
    <div class="bolsa-camo-list">${allListHtml}</div>
  `;
}

function camoIndexColor(pct) {
  if (pct >= 80) return '#44cc66';
  if (pct >= 65) return '#ccaa22';
  return '#cc4422';
}

async function equiparCamuflagem(id) {
  if (!state.character) return;
  const camo = id ? CAMUFLAGENS.find(c => c.id === id) : null;

  // Play equip experience
  if (camo) {
    // Flash the badge
    const badge = document.getElementById('bolsa-camo-eq-badge');
    if (badge) { badge.classList.add('bolsa-camo-badge-flash'); setTimeout(() => badge.classList.remove('bolsa-camo-badge-flash'), 800); }

    // Dramatic toast with equip text
    const lines = camo.equipText.split('\\n');
    showToast(lines[0], 'info', 2000);
    if (lines[1]) setTimeout(() => showToast(lines[1], 'info', 2500), 1800);
    if (lines[2]) setTimeout(() => showToast(lines[2], 'info', 2500), 3200);

    sfx('select');
  }

  state.character.camuflagem = id || null;
  await persistChar({ camuflagem: id || null });

  _camoSelected = null;
  renderCamuflagem();

  // Animate equipped panel after render
  if (camo) {
    requestAnimationFrame(() => {
      const panel = document.getElementById('bolsa-camo-eq-panel');
      if (panel) {
        panel.classList.add('bolsa-camo-equip-anim');
        setTimeout(() => panel.classList.remove('bolsa-camo-equip-anim'), 1200);
      }
    });
  }
}

// ──────────────────────────────────────────────────────────
//  PHOTO UPLOAD
// ──────────────────────────────────────────────────────────
function editPhoto() {
  $('photo-input').click();
}

function handlePhotoUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = async () => {
      // Compress: resize to max 240x240, JPEG quality 0.65
      const canvas = document.createElement('canvas');
      const MAX = 240;
      let w = img.width, h = img.height;
      if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
      else        { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const base64 = canvas.toDataURL('image/jpeg', 0.65);

      // Display
      const photoEl = $('agent-photo');
      photoEl.src = base64;
      const ph2 = $('photo-frame').querySelector('.photo-ph'); if (ph2) ph2.style.display = 'none';

      if (state.character) state.character.photo = base64;
      await persistChar({ photo: base64 });
      showToast('Foto do agente atualizada.', 'success');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}

// ──────────────────────────────────────────────────────────
//  TAB NAVIGATION
// ──────────────────────────────────────────────────────────
function switchTab(tab) {
  // Quadro agora é sub-aba de docs
  if (tab === 'quadro') {
    switchTab('docs');
    docsSubtab('quadro');
    return;
  }

  state.currentTab = tab;
  if (tab !== 'main') localStorage.setItem('vyper_last_tab', tab);

  // Limpa badge da tab que acabou de ser aberta
  if (tab === 'docs')  { const d = $('nav-dot-docs');  if (d) d.classList.add('hidden'); }
  if (tab === 'fitas') { const d = $('nav-dot-fitas'); if (d) d.classList.add('hidden'); _fitasSeenCount = state.character?.tapes?.length ?? 0; }

  // Update nav indicators
  document.querySelectorAll('.nav-tab').forEach(el => {
    el.classList.toggle('active', el.id === 'nav-' + tab);
  });

  const tabContent = $('tab-content');

  if (tab === 'main') {
    sfx('close');
    tabContent.classList.add('hidden');
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  } else {
    sfx('open');
    tabContent.classList.remove('hidden');
    document.querySelectorAll('.tab-panel').forEach(p => {
      p.classList.toggle('hidden', p.id !== 'tab-panel-' + tab);
    });
    // Ao sair da bolsa: limpa seleção e estado de discard para evitar acidentes
    if (tab !== 'bolsa') { bolsaSelected = null; bolsaDiscardArmed = false; }

    if (tab === 'fitas') renderFitasTab();
    if (tab === 'radio') renderRadioTab();
    if (tab === 'radar') renderParanormalRadar(state.character?.paranormal?.nivel ?? 0);
    if (tab === 'mald')  { if (maldicoesUnsub) renderMaldicoesTab(); else loadMaldicoes().then(renderMaldicoesTab); }
    if (tab === 'docs')  renderDocsTab();
    if (tab === 'equip') enterMissaoTab();
    if (tab === 'bolsa') {
      setupBolsaGrid();
      renderBolsa(); // render immediately with current state
      // Also fetch fresh data from Firestore (reads are open, no auth needed)
      if (firebaseOk && state.codename) {
        getDoc(doc(db, 'characters', state.codename)).then(snap => {
          if (snap.exists()) {
            const fresh = snap.data();
            if (fresh.bolsa) {
              state.character.bolsa = fresh.bolsa;
              renderBolsa(); // re-render with newest data
            }
          }
        }).catch(() => {});
      }
    }
    // Close mission detail when leaving
    if (tab !== 'equip') {
      const panel = $('missao-detail-panel');
      if (panel) panel.classList.remove('mdp-open', 'mdp-out');
    }
  }
}

function switchCenterTab(name) {
  ['stats', 'combate'].forEach(t => {
    const btn   = document.getElementById('ctab-' + t);
    const panel = document.getElementById('cpanel-' + t);
    if (btn)   btn.classList.toggle('active', t === name);
    if (panel) panel.classList.toggle('active', t === name);
  });
}

// ──────────────────────────────────────────────────────────
//  BADGES DE NOTIFICAÇÃO NAS TABS
// ──────────────────────────────────────────────────────────
function updateNavBadges() {
  // Docs badge: há documentos liberados que o jogador ainda não abriu
  const dotDocs  = $('nav-dot-docs');
  if (dotDocs) {
    const hasUnread = docsReleasedState.some(id => !docsReadSet.has(id));
    dotDocs.classList.toggle('hidden', !hasUnread || state.currentTab === 'docs');
  }
  // Fitas badge: novas fitas adicionadas desde a última visita
  const dotFitas = $('nav-dot-fitas');
  if (dotFitas) {
    const currentCount = state.character?.tapes?.length ?? 0;
    const hasNew = currentCount > _fitasSeenCount;
    dotFitas.classList.toggle('hidden', !hasNew || state.currentTab === 'fitas');
  }
}

// ──────────────────────────────────────────────────────────
//  FEED DE NOTÍCIAS
// ──────────────────────────────────────────────────────────
function toggleFeedBar() {
  const bar = $('feed-url-bar');
  const inp = $('feed-url-input');
  if (!bar) return;
  const opening = !bar.classList.contains('feed-open');
  bar.classList.toggle('feed-open', opening);
  if (opening) setTimeout(() => inp?.focus(), 30);
  else if (inp) inp.value = '';
}

function openFeedUrl() {
  const inp = $('feed-url-input');
  if (!inp) return;
  const slug = inp.value.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase();
  if (!slug) return;
  window.open('feed.html?s=' + encodeURIComponent(slug), '_blank');
}

// ──────────────────────────────────────────────────────────
//  RÁDIO — PLAYER
// ──────────────────────────────────────────────────────────
const RADIO_FREQS = ['00.221', '00.425', '00.614', '00.733', '00.881', '00.963'];

// ══════════════════════════════════════════════════════════════
//  RADAR PARANORMAL — constantes
// ══════════════════════════════════════════════════════════════
const PARANORMAL_NIVEIS = [
  { label: 'INATIVO',   cor: '#1e3020', desc: 'Sem leituras detectadas.' },
  { label: 'TRAÇOS',    cor: '#22aa55', desc: 'Anomalia distante — possível presença.' },
  { label: 'PRÓXIMO',   cor: '#aaaa22', desc: 'Sinal detectado — entidade se aproximando.' },
  { label: 'IMINENTE',  cor: '#cc6622', desc: 'Contato iminente — ameaça confirmada.' },
  { label: 'CONTATO',   cor: '#cc1111', desc: 'CONTATO DIRETO — perigo extremo.' },
];
const _PNL_BLIP_RINGS = [0.82, 0.60, 0.38, 0.18]; // raios para cada anel (lv1→lv4)

function renderRadioTab() {
  const char = state.character;
  if (!char) return;
  const radio  = char.radio || {};
  const status = radio.status || 'idle';
  const freq   = radio.frequencia || RADIO_FREQS[0];

  // Player photo
  const pPhoto = $('radio-player-photo');
  const pPh    = $('radio-player-ph');
  if (char.photo) { pPhoto.src = char.photo; pPhoto.classList.remove('hidden'); pPh.style.display = 'none'; }
  else            { pPhoto.src = ''; pPhoto.classList.add('hidden'); pPh.style.display = ''; pPh.textContent = '?'; }
  $('radio-player-name').textContent = '\u25b6 ' + (char.codename || '—');

  // Frequency display
  $('radio-freq-val').textContent = freq;

  // NPC photo
  const nPhoto = $('radio-npc-photo');
  const nPh    = $('radio-npc-ph');
  if (status === 'conectado' && radio.npcFoto) {
    nPhoto.src = radio.npcFoto; nPhoto.classList.remove('hidden'); nPh.style.display = 'none';
  } else {
    nPhoto.src = ''; nPhoto.classList.add('hidden'); nPh.style.display = '';
    nPh.textContent = status === 'aguardando' ? '...' : '?';
  }
  $('radio-npc-name').textContent = status === 'conectado' ? '\u25b6 ' + (radio.npcNome || '—') : '—';

  // Waveform
  const waveSvg = $('radio-wave-svg');
  if (waveSvg) waveSvg.classList.toggle('radio-wave-active', status === 'conectado');

  // Status badge
  const badge = $('radio-status-badge');
  const labels = { idle: 'OCIOSO', aguardando: 'AGUARDANDO', conectado: 'CONECTADO', recusado: 'RECUSADO' };
  badge.textContent = labels[status] || 'OCIOSO';
  badge.className   = 'radio-status-badge radio-status-' + status;

  // Action buttons
  const acts = $('radio-actions');
  if (status === 'idle' || status === 'recusado') {
    acts.innerHTML = '<button class="radio-btn" onclick="App.radioSolicitar()">SOLICITAR CONEXÃO</button>';
  } else if (status === 'aguardando') {
    acts.innerHTML = '<button class="radio-btn radio-btn-cancel" onclick="App.radioCancelar()">CANCELAR</button>';
  } else if (status === 'conectado') {
    acts.innerHTML = '<button class="radio-btn radio-btn-cancel" onclick="App.radioCancelar()">ENCERRAR</button>';
  }

}

function renderParanormalRadar(nivel) {
  const el = document.getElementById('paranormal-radar-section');
  if (!el) return;
  const n   = Math.max(0, Math.min(4, nivel || 0));
  const cfg = PARANORMAL_NIVEIS[n];
  const sweepMs = [0, 4000, 2800, 1600, 800][n];
  let blipHtml = '';
  for (let i = 0; i < n; i++) {
    const r     = _PNL_BLIP_RINGS[i];
    const angle = Math.random() * Math.PI * 2;
    const x     = 50 + r * 50 * Math.cos(angle);
    const y     = 50 + r * 50 * Math.sin(angle);
    blipHtml += `<div class="pnl-blip pnl-blip-lv${n}" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%"></div>`;
  }
  el.innerHTML = `
    <div class="pnl-radar-wrap pnl-radar-lv${n}">
      <div class="pnl-radar-header">
        <span class="pnl-radar-title">⧭ RASTREADOR PARANORMAL</span>
        <span class="pnl-radar-freq">FREQ P-00.333</span>
      </div>
      <div class="pnl-radar-body">
        <div class="pnl-radar-disc" style="${n > 0 ? `box-shadow:0 0 14px ${cfg.cor}44` : ''}">
          <div class="pnl-ring pnl-ring-1"></div>
          <div class="pnl-ring pnl-ring-2"></div>
          <div class="pnl-ring pnl-ring-3"></div>
          <div class="pnl-ring pnl-ring-4"></div>
          <div class="pnl-cross-h"></div>
          <div class="pnl-cross-v"></div>
          ${n > 0 ? `<div class="pnl-sweep" style="animation-duration:${sweepMs}ms;--sweep-col:${cfg.cor}88"></div>` : ''}
          ${blipHtml}
        </div>
        <div class="pnl-radar-info">
          <div class="pnl-radar-status-lbl" style="color:${cfg.cor}">${cfg.label}</div>
          <div class="pnl-radar-desc">${cfg.desc}</div>
          <div class="pnl-level-dots">
            ${[1,2,3,4].map(i => `<div class="pnl-dot${i <= n ? ' pnl-dot-on' : ''}" style="${i <= n ? `background:${cfg.cor}` : ''}"></div>`).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function applyParanormalRadar(nivel) {
  const n = Math.max(0, Math.min(4, nivel || 0));
  [1,2,3,4].forEach(i => document.body.classList.remove('pnl-body-lv' + i));
  const ov = document.getElementById('paranormal-overlay');
  if (ov) { [0,1,2,3,4].forEach(i => ov.classList.remove('pnl-ov-lv' + i)); ov.classList.add('pnl-ov-lv' + n); }
  if (n > 0) document.body.classList.add('pnl-body-lv' + n);
  renderParanormalRadar(n);
}

// Beep per paranormal level using Web Audio API
function sfxBeepPnl(nivel) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const freqs  = [0, 480, 660, 880, 1100];
    const counts = [0,   1,   2,   3,    4];
    const n = Math.max(0, Math.min(4, nivel || 0));
    if (n === 0) return;
    const freq = freqs[n];
    const count = counts[n];
    const dur = 0.13;
    const gap = 0.08;
    for (let i = 0; i < count; i++) {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = n >= 3 ? 'square' : 'sine';
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + i * (dur + gap);
      gain.gain.setValueAtTime(n >= 4 ? 0.4 : 0.25, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.start(t0);
      osc.stop(t0 + dur + 0.01);
    }
  } catch (_) {}
}

// Full-screen color flash on paranormal level change
function showPnlAlertFlash(nivel) {
  const COLORS = ['', '#22aa5533', '#aaaa2244', '#cc662266', '#cc111188'];
  const n = Math.max(0, Math.min(4, nivel || 0));
  if (n === 0) return;
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:9997;background:${COLORS[n]};animation:pnl-flash-in 0.9s ease-out forwards;`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 950);
}

async function gmSetParanormalNivel(codename, nivel) {
  await gmUpdateChar(codename, { 'paranormal.nivel': nivel });
  sfx('select');
}

function buildGMParanormalHtml(char) {
  const nivel = char.paranormal?.nivel ?? 0;
  return `<div class="gm-pnl-btns">${PARANORMAL_NIVEIS.map((cfg, n) =>
    `<button class="gm-pnl-btn${nivel === n ? ' gm-pnl-btn-on' : ''}"
             style="${nivel === n ? `border-color:${cfg.cor};color:${cfg.cor}` : ''}"
             onclick="App.gmSetParanormalNivel('${char.codename}',${n})">${cfg.label}</button>`
  ).join('')}</div>`;
}

function radioChangeFreq(dir) {
  const char = state.character;
  if (!char) return;
  const radio  = char.radio || {};
  if ((radio.status || 'idle') === 'conectado') return;
  let idx = RADIO_FREQS.indexOf(radio.frequencia || RADIO_FREQS[0]);
  if (idx === -1) idx = 0;
  idx = (idx + dir + RADIO_FREQS.length) % RADIO_FREQS.length;
  const freq = RADIO_FREQS[idx];
  if (!char.radio) char.radio = {};
  char.radio.frequencia = freq;
  if ($('radio-freq-val')) $('radio-freq-val').textContent = freq;
  persistChar({ 'radio.frequencia': freq });
}

const radioCodecAudio = new Audio('audio/codec.mp3');

async function radioSolicitar() {
  const char = state.character;
  if (!char) return;
  radioCodecAudio.currentTime = 0;
  radioCodecAudio.play().catch(() => {});
  if (!char.radio) char.radio = {};
  char.radio.status = 'aguardando';
  await persistChar({ 'radio.status': 'aguardando' });
  renderRadioTab();
}

async function radioCancelar() {
  const char = state.character;
  if (!char) return;
  if (!char.radio) char.radio = {};
  Object.assign(char.radio, { status: 'idle', npcNome: '', npcFoto: '' });
  await persistChar({ 'radio.status': 'idle', 'radio.npcNome': '', 'radio.npcFoto': '' });
  renderRadioTab();
}

// ──────────────────────────────────────────────────────────
//  RÁDIO — GM CONTROLS
// ──────────────────────────────────────────────────────────
let npcPresets = [];

async function loadNpcPresets() {
  if (firebaseOk) {
    try {
      const snap = await getDoc(doc(db, 'meta', 'npcs'));
      npcPresets = snap.exists() ? (snap.data().presets || []) : [];
    } catch (e) { npcPresets = []; }
  } else {
    const raw = localStorage.getItem('vyper_npc_presets');
    npcPresets = raw ? JSON.parse(raw) : [];
  }
  renderGMNpcPresets();
}

async function saveNpcPresets() {
  if (firebaseOk) {
    await setDoc(doc(db, 'meta', 'npcs'), { presets: npcPresets });
  } else {
    localStorage.setItem('vyper_npc_presets', JSON.stringify(npcPresets));
  }
}

function renderGMNpcPresets() {
  const el = $('gm-npc-list');
  if (!el) return;
  if (!npcPresets.length) { el.innerHTML = '<div class="gm-fitas-empty">Nenhum preset.</div>'; return; }
  el.innerHTML = npcPresets.map((p, i) =>
    `<div class="gm-npc-item">
      ${p.foto ? `<img class="gm-npc-thumb" src="${p.foto}" />` : '<div class="gm-npc-thumb-ph">?</div>'}
      <span class="gm-npc-nome">${escHtml(p.nome)}</span>
      <button class="gm-fita-del" onclick="App.gmRemoveNpcPreset(${i})">&#10005;</button>
    </div>`
  ).join('');
}

async function gmAddNpcPreset(fileInput) {
  const file      = fileInput.files?.[0];
  const nomeInput = $('gm-npc-nome-input');
  const nome      = nomeInput?.value?.trim();
  if (!nome) { showToast('Digite o nome do NPC.', 'error'); fileInput.value = ''; return; }
  if (!file) { showToast('Selecione uma foto.', 'error'); return; }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const MAX = 200; let w = img.width, h = img.height;
      if (w > h) { if (w > MAX) { h = Math.round(h*MAX/w); w = MAX; } }
      else       { if (h > MAX) { w = Math.round(w*MAX/h); h = MAX; } }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const foto = canvas.toDataURL('image/jpeg', 0.7);
      npcPresets.push({ nome, foto });
      await saveNpcPresets();
      nomeInput.value = ''; fileInput.value = '';
      renderGMNpcPresets();
      showToast(`NPC "${nome}" adicionado.`, 'success');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function gmRemoveNpcPreset(index) {
  npcPresets.splice(index, 1);
  await saveNpcPresets();
  renderGMNpcPresets();
}

async function gmRadioAceitar(codename) {
  const sel = document.getElementById('gm-radio-npc-sel-' + codename);
  const idx = sel ? parseInt(sel.value) : -1;
  if (isNaN(idx) || idx < 0 || !npcPresets[idx]) { showToast('Selecione um NPC.', 'error'); return; }
  const npc = npcPresets[idx];
  await gmUpdateChar(codename, { 'radio.status': 'conectado', 'radio.npcNome': npc.nome, 'radio.npcFoto': npc.foto });
}

async function gmRadioRecusar(codename) {
  await gmUpdateChar(codename, { 'radio.status': 'recusado' });
  setTimeout(() => gmUpdateChar(codename, { 'radio.status': 'idle' }), 3000);
}

async function gmRadioDesconectar(codename) {
  await gmUpdateChar(codename, { 'radio.status': 'idle', 'radio.npcNome': '', 'radio.npcFoto': '' });
}

// ──────────────────────────────────────────────────────────
//  FITAS — PLAYER
// ──────────────────────────────────────────────────────────
const fitaPlayer = { audio: null, tapeId: null, tapeName: null, loop: false };

function escHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

// Escapa HTML e aplica destaque em palavras prefixadas com !
function fmtCamo(s) {
  return escHtml(String(s))
    .replace(/\*([^\s&*]+)\*/g,  '<span class="txt-danger">$1</span>')   // *palavra* → vermelho perigo
    .replace(/\^([^\s&^]+)/g,   '<span class="txt-tech">$1</span>')     // ^palavra  → ciano tech
    .replace(/~([^\s&~]+)/g,    '<span class="txt-ghost">$1</span>')    // ~palavra  → fantasma
    .replace(/@([^\s&@]+)/g,    '<span class="txt-neon">$1</span>')     // @palavra  → verde neon
    .replace(/#([^\s&#]+)/g,    '<span class="txt-white">$1</span>')    // #palavra  → branco máximo
    .replace(/!([^\s&!]+)/g,    '<span class="txt-hl">$1</span>');      // !palavra  → dourado
}

function formatFitaTime(s) {
  if (!s || isNaN(s)) return '0:00';
  return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
}

function renderFitasTab() {
  const tapes = (state.character && state.character.tapes) || [];
  const tree = $('fitas-tree');
  if (!tree) return;

  if (!tapes.length) {
    tree.innerHTML = '<div class="fitas-empty">Nenhuma fita alocada.</div>';
    return;
  }

  const cats = [['historia','HISTÓRIA'],['musica','MUSICAS'],['outro','OUTROS']];
  const grouped = { historia: [], musica: [], outro: [] };
  tapes.forEach(t => (grouped[t.categoria] || grouped.outro).push(t));

  let html = '';
  for (const [key, label] of cats) {
    if (!grouped[key].length) continue;
    html += `<div class="fita-cat"><div class="fita-cat-header">&#9658; ${label}</div>`;
    grouped[key].forEach(t => {
      const active = fitaPlayer.tapeId === t.id ? 'fita-item-active' : '';
      html += `<div class="fita-item ${active}" onclick="App.playFita('${t.id}','${escHtml(t.nome)}')"><span class="fita-tree-line">&#9492;&#9472;&#9472;</span><span class="fita-item-name">${escHtml(t.nome)}</span></div>`;
    });
    html += `</div>`;
  }
  tree.innerHTML = html;
}

async function playFita(tapeId, tapeName) {
  // Stop existing
  if (fitaPlayer.audio) {
    fitaPlayer.audio.pause();
    fitaPlayer.audio.src = '';
    fitaPlayer.audio = null;
  }
  fitaPlayer.tapeId  = tapeId;
  fitaPlayer.tapeName = tapeName;

  const np  = $('fitas-now-playing');
  const btn = $('fitas-btn-play');
  if (np)  np.textContent  = '▶ CARREGANDO: ' + tapeName;
  if (btn) btn.textContent = '⏸';

  let audioSrc = null;
  if (firebaseOk) {
    try {
      const metaSnap = await getDoc(doc(db, 'tapes', tapeId));
      if (!metaSnap.exists()) { showToast('Fita não encontrada.', 'error'); return; }
      const meta = metaSnap.data();
      if (meta.chunks && meta.chunks > 0) {
        if (np) np.textContent = '▶ CARREGANDO (' + meta.chunks + ' partes)...';
        const chunkDocs = await Promise.all(
          Array.from({ length: meta.chunks }, (_, i) =>
            getDoc(doc(db, 'tapes', `${tapeId}_chunk_${i}`))
          )
        );
        audioSrc = chunkDocs.map(d => d.data().chunk).join('');
      } else {
        audioSrc = meta.data || null; // legado
      }
    } catch (e) { console.error(e); showToast('Erro ao carregar fita.', 'error'); return; }
  } else {
    audioSrc = localStorage.getItem('fita_data_' + tapeId);
  }

  if (!audioSrc) { showToast('Dados da fita não encontrados.', 'error'); return; }

  const audio = new Audio(audioSrc);
  audio.loop  = fitaPlayer.loop;
  fitaPlayer.audio = audio;

  audio.addEventListener('loadedmetadata', () => {
    const dur = $('fitas-time-dur');
    if (dur) dur.textContent = formatFitaTime(audio.duration);
  });
  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct  = audio.currentTime / audio.duration;
    const fill = $('fitas-prog-fill'), knob = $('fitas-prog-knob'), cur = $('fitas-time-cur');
    if (fill) fill.style.width = (pct * 100) + '%';
    if (knob) knob.style.left  = (pct * 100) + '%';
    if (cur)  cur.textContent  = formatFitaTime(audio.currentTime);
  });
  audio.addEventListener('ended', () => {
    if (!fitaPlayer.loop) {
      if (btn) btn.textContent = '▶';
      if (np)  np.textContent  = '■ FIM: ' + tapeName;
    }
  });

  try {
    await audio.play();
  } catch (err) {
    console.error('play() bloqueado:', err);
    showToast('Toque na fita novamente para iniciar.', 'error');
    if (btn) btn.textContent = '▶';
    return;
  }
  if (np)  np.textContent  = '▶ TOCANDO: ' + tapeName;
  renderFitasTab();
}

function fitaTogglePlay() {
  const audio = fitaPlayer.audio;
  if (!audio) return;
  const btn = $('fitas-btn-play');
  if (audio.paused) { audio.play();  if (btn) btn.textContent = '⏸'; }
  else              { audio.pause(); if (btn) btn.textContent = '▶'; }
}

function fitaToggleLoop() {
  fitaPlayer.loop = !fitaPlayer.loop;
  if (fitaPlayer.audio) fitaPlayer.audio.loop = fitaPlayer.loop;
  const btn = $('fitas-btn-loop');
  if (btn) btn.classList.toggle('fita-btn-active', fitaPlayer.loop);
}

function fitaSkip(seconds) {
  const audio = fitaPlayer.audio;
  if (!audio) return;
  audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + seconds);
}

function fitaSeek(event) {
  const audio = fitaPlayer.audio;
  if (!audio || !audio.duration) return;
  const bar  = $('fitas-prog-bar');
  const rect = bar.getBoundingClientRect();
  audio.currentTime = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * audio.duration;
}

// ──────────────────────────────────────────────────────────
//  ARMAS — GM CONTROLS
// ──────────────────────────────────────────────────────────
function buildGMArmasHtml(char) {
  const armas = char.armas || [null, null];
  const labels = ['PRIM\u00c1RIA I', 'PRIM\u00c1RIA II'];
  const slotsHtml = [0, 1].map(i => {
    const arma = armas[i] || {};
    const tipoOpts = Object.entries(ARMA_TIPOS).filter(([,v]) => !v.consumivel && !v.unica).map(([k, v]) =>
      `<option value="${k}" ${arma.tipo === k ? 'selected' : ''}>${v.label}</option>`
    ).join('');
    const tipoDanoOpts = ['mortal','neutralizador'].map(t =>
      `<option value="${t}" ${(arma.tipoDano || 'mortal') === t ? 'selected' : ''}>${t.toUpperCase()}</option>`
    ).join('');
    const hasArma = !!arma.tipo;
    const title = hasArma
      ? `${labels[i]} \u2014 ${ARMA_TIPOS[arma.tipo]?.label || ''}${arma.nome ? ' ('+escHtml(arma.nome)+')' : ''}`
      : labels[i];
    return `
      <div class="gm-arma-form">
        <div class="gm-arma-form-title">${title}</div>
        <div class="gm-arma-row">
          <select class="gm-select" id="gm-arma-tipo-${char.codename}-${i}">${tipoOpts}</select>
          <input class="gm-text-input" id="gm-arma-nome-${char.codename}-${i}" placeholder="nome (opcional)" value="${escHtml(arma.nome || '')}" maxlength="30" />
        </div>
        <div class="gm-arma-row">
          <input class="gm-text-input" id="gm-arma-dano-${char.codename}-${i}" placeholder="dano (ex: 2d6)" value="${escHtml(arma.dano || '')}" maxlength="20" />
          <input class="gm-text-input" id="gm-arma-alcance-${char.codename}-${i}" placeholder="alcance" value="${escHtml(arma.alcance || '')}" maxlength="20" />
          <select class="gm-select" id="gm-arma-tdano-${char.codename}-${i}">${tipoDanoOpts}</select>
        </div>
        <div class="gm-arma-mods-row">
          ${Object.entries(ARMA_MODS).map(([k, m]) =>
            `<label class="gm-mod-check"><input type="checkbox" id="gm-arma-mod-${k}-${char.codename}-${i}" ${arma.mods?.[k] ? 'checked' : ''} /><span>${m.ico} ${m.label}</span></label>`
          ).join('')}
        </div>
        <textarea class="gm-text-input gm-arma-desc" id="gm-arma-desc-${char.codename}-${i}" placeholder="descri\u00e7\u00e3o..." rows="2">${escHtml(arma.descricao || '')}</textarea>
        <div class="gm-arma-btns">
          <button class="gm-toggle-btn active-ativo" onclick="App.gmSalvarArma('${char.codename}',${i})">SALVAR</button>
          <button class="gm-toggle-btn active-morto"  onclick="App.gmLimparArma('${char.codename}',${i})">LIMPAR</button>
        </div>
      </div>`;
  }).join('');

  // Unique weapon section
  const u     = char.armaUnica || {};
  const uTipoOpts = Object.entries(ARMA_TIPOS).filter(([,v]) => v.unica).map(([k, v]) =>
    `<option value="${k}" ${u.tipo === k ? 'selected' : ''}>${v.label}</option>`
  ).join('');
  const uHasArma = !!(u.tipo && ARMA_TIPOS[u.tipo]?.unica);
  const uTitle   = uHasArma
    ? `ÚNICA \u2014 ${ARMA_TIPOS[u.tipo]?.label}${u.nome ? ' ('+escHtml(u.nome)+')' : ''}`
    : 'ARMAMENTO ESPECIAL / ÚNICA';
  const unicaHtml = `
    <div class="gm-arma-form gm-arma-form-unica">
      <div class="gm-arma-form-title gm-arma-unica-title">⬡ ${uTitle}</div>
      <div class="gm-arma-row">
        <select class="gm-select" id="gm-arma-unica-tipo-${char.codename}">
          <option value="">— NENHUMA —</option>${uTipoOpts}
        </select>
        <input class="gm-text-input" id="gm-arma-unica-nome-${char.codename}" placeholder="apelido (opcional)" value="${escHtml(u.nome || '')}" maxlength="30" />
      </div>
      <div class="gm-arma-row">
        <input class="gm-text-input" id="gm-arma-unica-dano-${char.codename}" placeholder="dano (ex: 4d8)" value="${escHtml(u.dano || '')}" maxlength="20" />
        <input class="gm-text-input" id="gm-arma-unica-alcance-${char.codename}" placeholder="alcance" value="${escHtml(u.alcance || '')}" maxlength="20" />
      </div>
      <textarea class="gm-text-input gm-arma-desc" id="gm-arma-unica-desc-${char.codename}" placeholder="descri\u00e7\u00e3o adicional..." rows="2">${escHtml(u.descricao || '')}</textarea>
      <div class="gm-arma-btns">
        <button class="gm-toggle-btn active-ativo" onclick="App.gmSalvarArmaUnica('${char.codename}')">SALVAR</button>
        <button class="gm-toggle-btn active-morto"  onclick="App.gmLimparArmaUnica('${char.codename}')">LIMPAR</button>
      </div>
    </div>`;

  return slotsHtml + unicaHtml;
}

async function gmSalvarArma(codename, slot) {
  const get = id => document.getElementById(id);
  const tipo        = get(`gm-arma-tipo-${codename}-${slot}`)?.value;
  const nome        = get(`gm-arma-nome-${codename}-${slot}`)?.value.trim();
  const dano        = get(`gm-arma-dano-${codename}-${slot}`)?.value.trim();
  const alcance     = get(`gm-arma-alcance-${codename}-${slot}`)?.value.trim();
  const tipoDano    = get(`gm-arma-tdano-${codename}-${slot}`)?.value || 'mortal';
  const descricao   = get(`gm-arma-desc-${codename}-${slot}`)?.value.trim();
  const mods = Object.fromEntries(
    Object.keys(ARMA_MODS).map(k => [k, !!(get(`gm-arma-mod-${k}-${codename}-${slot}`)?.checked)])
  );
  const modificadores = Object.entries(ARMA_MODS).filter(([k]) => mods[k]).map(([,m]) => m.label);
  const arma = { tipo, nome, dano, alcance, tipoDano, mods, modificadores, descricao };

  let currentArmas = [null, null];
  if (firebaseOk) {
    try {
      const snap = await getDoc(doc(db, 'characters', codename));
      if (snap.exists()) currentArmas = snap.data().armas || [null, null];
    } catch (_) {}
  } else {
    const ch = LocalDB.getChar(codename);
    if (ch) currentArmas = ch.armas || [null, null];
  }
  const newArmas = [...currentArmas];
  while (newArmas.length < 2) newArmas.push(null);
  newArmas[slot] = arma;
  await gmUpdateChar(codename, { armas: newArmas });
  sfx('select');
  showToast(`Arma salva no slot ${slot + 1}.`, 'success', 1500);
}

async function gmLimparArma(codename, slot) {
  let currentArmas = [null, null];
  if (firebaseOk) {
    try {
      const snap = await getDoc(doc(db, 'characters', codename));
      if (snap.exists()) currentArmas = snap.data().armas || [null, null];
    } catch (_) {}
  } else {
    const ch = LocalDB.getChar(codename);
    if (ch) currentArmas = ch.armas || [null, null];
  }
  const newArmas = [...currentArmas];
  while (newArmas.length < 2) newArmas.push(null);
  newArmas[slot] = null;
  await gmUpdateChar(codename, { armas: newArmas });
  sfx('select');
  showToast(`Slot ${slot + 1} limpo.`, 'success', 1500);
}

async function gmSalvarArmaUnica(codename) {
  const get  = id => document.getElementById(id);
  const tipo = get(`gm-arma-unica-tipo-${codename}`)?.value;
  if (!tipo || !ARMA_TIPOS[tipo]?.unica) {
    await gmUpdateChar(codename, { armaUnica: null });
    sfx('select');
    showToast('Arma única removida.', 'success', 1500);
    return;
  }
  const armaUnica = {
    tipo,
    nome:      get(`gm-arma-unica-nome-${codename}`)?.value.trim()    || '',
    dano:      get(`gm-arma-unica-dano-${codename}`)?.value.trim()    || '',
    alcance:   get(`gm-arma-unica-alcance-${codename}`)?.value.trim() || '',
    descricao: get(`gm-arma-unica-desc-${codename}`)?.value.trim()    || '',
  };
  await gmUpdateChar(codename, { armaUnica });
  sfx('select');
  showToast(`${ARMA_TIPOS[tipo].label} atribuída.`, 'success', 1500);
}

async function gmLimparArmaUnica(codename) {
  await gmUpdateChar(codename, { armaUnica: null });
  sfx('select');
  showToast('Arma única removida.', 'success', 1500);
}

// ──────────────────────────────────────────────────────────
//  FITAS — GM CONTROLS
// ──────────────────────────────────────────────────────────
function buildGMRadioHtml(char) {
  const radio     = char.radio || {};
  const status    = radio.status || 'idle';
  const freq      = radio.frequencia || '—';
  const labels    = { idle: 'OCIOSO', aguardando: 'AGUARDANDO', conectado: 'CONECTADO', recusado: 'RECUSADO' };
  let html = `<div class="gm-radio-status gm-radio-${status}">${labels[status] || 'OCIOSO'}</div>`;

  if (status === 'aguardando') {
    const opts = npcPresets.length
      ? npcPresets.map((p, i) => `<option value="${i}">${escHtml(p.nome)}</option>`).join('')
      : '<option value="">Nenhum preset</option>';
    html += `
      <div class="gm-radio-freq">FREQ: ${freq}</div>
      <select id="gm-radio-npc-sel-${char.codename}" class="gm-select">${opts}</select>
      <div class="gm-radio-btns">
        <button class="gm-toggle-btn active-ativo" onclick="App.gmRadioAceitar('${char.codename}')">ACEITAR</button>
        <button class="gm-toggle-btn active-morto" onclick="App.gmRadioRecusar('${char.codename}')">RECUSAR</button>
      </div>`;
  } else if (status === 'conectado') {
    const dicaOpts = DICAS_PRESETS.map((d, i) =>
      `<option value="${i}">${escHtml(d.titulo)}</option>`).join('');
    html += `
      <div class="gm-radio-freq">FREQ: ${freq} &mdash; ${escHtml(radio.npcNome || '?')}</div>
      <button class="gm-toggle-btn active-morto" onclick="App.gmRadioDesconectar('${char.codename}')">DESCONECTAR</button>
      <div class="gm-dica-row">
        <select id="gm-dica-sel-${char.codename}" class="gm-select gm-dica-sel">${dicaOpts}</select>
        <button class="gm-toggle-btn active-ativo gm-dica-btn" onclick="App.gmEnviarDica('${char.codename}')">&#9658; DICA</button>
      </div>`;
  }
  return html;
}

async function gmEnviarDica(codename) {
  const sel = document.getElementById('gm-dica-sel-' + codename);
  const idx = sel ? parseInt(sel.value) : 0;
  const dica = DICAS_PRESETS[idx];
  if (!dica) return;
  await gmUpdateChar(codename, { 'radio.dicaAtual': { id: dica.id, ts: Date.now() } });
  sfx('select');
  showToast('Dica enviada: ' + dica.titulo, 'success', 2000);
}

function buildGMFitasListHtml(codename, tapes) {
  if (!tapes || !tapes.length) return '<div class="gm-fitas-empty">Nenhuma fita.</div>';
  const ico = { musica: '&#9835;', historia: '&#9658;', outro: '&#9672;' };
  return tapes.map(t =>
    `<div class="gm-fita-item">
      <span class="gm-fita-cat-tag">${ico[t.categoria] || '&#9672;'}</span>
      <span class="gm-fita-name">${escHtml(t.nome)}</span>
      <button class="gm-fita-del" onclick="App.gmDesalocarFita('${codename}','${t.id}')" title="Desalocar fita">&#10005;</button>
    </div>`
  ).join('');
}

// tamanho de cada chunk base64 (~700KB por doc Firestore)
const CHUNK_SIZE = 700_000;

async function gmUploadFita(codename, fileInput) {
  const file = fileInput.files?.[0];
  if (!file) return;
  const nomeFld   = document.getElementById('gm-fita-nome-' + codename);
  const catFld    = document.getElementById('gm-fita-cat-'  + codename);
  const nome      = nomeFld?.value?.trim();
  const categoria = catFld?.value || 'musica';
  if (!nome) { showToast('Digite o nome da fita.', 'error'); fileInput.value = ''; return; }

  const id = 'fita_' + Date.now();

  showToast('Lendo arquivo...', 'info');
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result; // data:audio/...;base64,...

    if (firebaseOk) {
      // Divide em chunks e salva cada um como doc separado no Firestore
      const parts = [];
      for (let i = 0; i < base64.length; i += CHUNK_SIZE)
        parts.push(base64.slice(i, i + CHUNK_SIZE));

      showToast(`Enviando fita (${parts.length} partes)...`, 'info');
      try {
        await Promise.all(parts.map((chunk, i) =>
          setDoc(doc(db, 'tapes', `${id}_chunk_${i}`), { chunk, index: i })
        ));
        await setDoc(doc(db, 'tapes', id), { id, nome, categoria, chunks: parts.length });
        const charRef  = doc(db, 'characters', codename);
        const charSnap = await getDoc(charRef);
        const tapes    = [...(charSnap.data()?.tapes || []), { id, nome, categoria }];
        await updateDoc(charRef, { tapes });
        const cached = _gmCharsList.find(c => c.codename === codename);
        if (cached) cached.tapes = tapes;
        nomeFld.value = ''; fileInput.value = '';
        document.getElementById('gm-fitas-list-' + codename).innerHTML = buildGMFitasListHtml(codename, tapes);
        await renderGMFitaLibrary();
        showToast(`"${nome}" enviada e alocada.`, 'success');
      } catch (err) { console.error(err); showToast('Erro ao enviar fita: ' + err.message, 'error'); }
    } else {
      // Modo local — base64 direto no localStorage
      localStorage.setItem('fita_data_' + id, base64);
      const char  = LocalDB.getChar(codename) || {};
      const tapes = [...(char.tapes || []), { id, nome, categoria }];
      char.tapes  = tapes; LocalDB.setChar(codename, char);
      nomeFld.value = ''; fileInput.value = '';
      document.getElementById('gm-fitas-list-' + codename).innerHTML = buildGMFitasListHtml(codename, tapes);
      showToast(`"${nome}" alocada (local).`, 'success');
    }
  };
  reader.readAsDataURL(file);
}

// Remove apenas a alocação da fita de um operador (não apaga os dados do Firestore)
async function gmDesalocarFita(codename, tapeId) {
  if (firebaseOk) {
    try {
      const charRef  = doc(db, 'characters', codename);
      const charSnap = await getDoc(charRef);
      const tapes    = (charSnap.data()?.tapes || []).filter(t => t.id !== tapeId);
      await updateDoc(charRef, { tapes });
      const cached = _gmCharsList.find(c => c.codename === codename);
      if (cached) cached.tapes = tapes;
      document.getElementById('gm-fitas-list-' + codename).innerHTML = buildGMFitasListHtml(codename, tapes);
      gmRefreshAssignDropdowns();
      showToast('Fita desalocada.', 'success');
    } catch (e) { showToast('Erro ao desalocar fita.', 'error'); }
  } else {
    const char  = LocalDB.getChar(codename) || {};
    const tapes = (char.tapes || []).filter(t => t.id !== tapeId);
    char.tapes  = tapes; LocalDB.setChar(codename, char);
    document.getElementById('gm-fitas-list-' + codename).innerHTML = buildGMFitasListHtml(codename, tapes);
    showToast('Fita desalocada (local).', 'success');
  }
}

// Exclui permanentemente a fita da biblioteca e desaloca de todos os operadores
async function gmDeleteFitaFromLibrary(tapeId) {
  if (!confirm('Excluir esta fita da biblioteca? Ela será removida de todos os operadores.')) return;
  if (firebaseOk) {
    try {
      const metaSnap   = await getDoc(doc(db, 'tapes', tapeId));
      const chunkCount = metaSnap.exists() ? (metaSnap.data().chunks || 0) : 0;
      await Promise.all([
        ...Array.from({ length: chunkCount }, (_, i) => deleteDoc(doc(db, 'tapes', `${tapeId}_chunk_${i}`))),
        deleteDoc(doc(db, 'tapes', tapeId))
      ]);
      // Remove de todos os operadores no Firestore
      const snap = await getDocs(collection(db, 'characters'));
      await Promise.all(snap.docs.map(charDoc => {
        const currentTapes = charDoc.data().tapes || [];
        if (!currentTapes.some(t => t.id === tapeId)) return null;
        return updateDoc(charDoc.ref, { tapes: currentTapes.filter(t => t.id !== tapeId) });
      }).filter(Boolean));
      // Atualiza cache e UI dos cards abertos
      _gmCharsList.forEach(c => {
        if (!(c.tapes || []).some(t => t.id === tapeId)) return;
        c.tapes = (c.tapes || []).filter(t => t.id !== tapeId);
        const el = document.getElementById('gm-fitas-list-' + c.codename);
        if (el) el.innerHTML = buildGMFitasListHtml(c.codename, c.tapes);
      });
      await renderGMFitaLibrary();
      showToast('Fita excluída da biblioteca.', 'success');
    } catch (e) { console.error(e); showToast('Erro ao excluir fita.', 'error'); }
  } else {
    localStorage.removeItem('fita_data_' + tapeId);
    showToast('Fita excluída (local).', 'success');
  }
}

// Aloca uma fita já existente na biblioteca para um operador
async function gmAssignFitaFromLibrary(codename) {
  const sel    = document.getElementById('gm-fita-assign-sel-' + codename);
  const tapeId = sel?.value;
  if (!tapeId) { showToast('Selecione uma fita da biblioteca.', 'error'); return; }
  const tape = _fitasLibrary.find(t => t.id === tapeId);
  if (!tape)  { showToast('Fita não encontrada na biblioteca.', 'error'); return; }

  if (firebaseOk) {
    try {
      const charRef      = doc(db, 'characters', codename);
      const charSnap     = await getDoc(charRef);
      const currentTapes = charSnap.data()?.tapes || [];
      if (currentTapes.some(t => t.id === tapeId)) { showToast('Fita já alocada.', 'error'); return; }
      const tapes = [...currentTapes, { id: tape.id, nome: tape.nome, categoria: tape.categoria }];
      await updateDoc(charRef, { tapes });
      const cached = _gmCharsList.find(c => c.codename === codename);
      if (cached) cached.tapes = tapes;
      sel.value = '';
      document.getElementById('gm-fitas-list-' + codename).innerHTML = buildGMFitasListHtml(codename, tapes);
      gmRefreshAssignDropdowns();
      showToast(`"${tape.nome}" alocada para ${codename}.`, 'success');
    } catch (e) { showToast('Erro ao alocar fita.', 'error'); }
  } else {
    const char         = LocalDB.getChar(codename) || {};
    const currentTapes = char.tapes || [];
    if (currentTapes.some(t => t.id === tapeId)) { showToast('Fita já alocada.', 'error'); return; }
    const tapes = [...currentTapes, { id: tape.id, nome: tape.nome, categoria: tape.categoria }];
    char.tapes = tapes; LocalDB.setChar(codename, char);
    sel.value = '';
    document.getElementById('gm-fitas-list-' + codename).innerHTML = buildGMFitasListHtml(codename, tapes);
    showToast(`"${tape.nome}" alocada (local).`, 'success');
  }
}

// Carrega todas as fitas da biblioteca e atualiza o painel do GM
async function renderGMFitaLibrary() {
  const el = document.getElementById('gm-fitas-library');
  if (!el) return;
  if (!firebaseOk) {
    el.innerHTML = '<div class="gm-fitas-empty">Biblioteca indisponível no modo local.</div>';
    return;
  }
  try {
    const snap = await getDocs(collection(db, 'tapes'));
    // Filtra apenas docs de metadados (têm campo 'nome'); docs de chunk não têm
    _fitasLibrary = snap.docs
      .filter(d => d.data().nome)
      .map(d => ({ id: d.id, nome: d.data().nome, categoria: d.data().categoria || 'outro' }))
      .sort((a, b) => a.nome.localeCompare(b.nome));

    const ico = { musica: '&#9835;', historia: '&#9658;', outro: '&#9672;' };
    if (!_fitasLibrary.length) {
      el.innerHTML = '<div class="gm-fitas-empty">Nenhuma fita na biblioteca.</div>';
    } else {
      el.innerHTML = _fitasLibrary.map(t =>
        `<div class="gm-fita-item">
          <span class="gm-fita-cat-tag">${ico[t.categoria] || '&#9672;'}</span>
          <span class="gm-fita-name">${escHtml(t.nome)}</span>
          <button class="gm-fita-del" onclick="App.gmDeleteFitaFromLibrary('${t.id}')" title="Excluir da biblioteca">&#x1F5D1;</button>
        </div>`
      ).join('');
    }
    gmRefreshAssignDropdowns();
  } catch (e) {
    el.innerHTML = '<div class="gm-fitas-empty">Erro ao carregar biblioteca.</div>';
  }
}

// Atualiza todos os dropdowns de alocação nos cards de operadores
function gmRefreshAssignDropdowns() {
  document.querySelectorAll('.gm-fita-assign-sel').forEach(sel => {
    const codename  = sel.id.replace('gm-fita-assign-sel-', '');
    const char      = _gmCharsList.find(c => c.codename === codename);
    const assigned  = new Set((char?.tapes || []).map(t => t.id));
    const available = _fitasLibrary.filter(t => !assigned.has(t.id));
    const prev      = sel.value;
    sel.innerHTML   = '<option value="">alocar da biblioteca...</option>' +
      available.map(t => `<option value="${t.id}">${escHtml(t.nome)}</option>`).join('');
    if (prev && available.some(t => t.id === prev)) sel.value = prev;
  });
}

// ──────────────────────────────────────────────────────────
//  PERSIST DATA
// ──────────────────────────────────────────────────────────
async function persistChar(updates) {
  const codename = state.codename;
  if (!codename) return;

  if (firebaseOk) {
    // Ensure auth is ready — if not, fall back to local mode silently
    const user = auth?.currentUser;
    if (!user) {
      if (state.character) LocalDB.setChar(codename, state.character);
      return;
    }
    const ref = doc(db, 'characters', codename);
    try {
      await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
    } catch (e) {
      if (e.code === 'not-found') {
        // Document doesn't exist yet — create it with full character data
        try {
          const full = { ...state.character, ...flatToNested(updates), updatedAt: serverTimestamp() };
          await setDoc(ref, full);
        } catch (e2) {
          console.error('persistChar error:', e2);
          showToast('Erro ao salvar. Verifique a conexão.', 'error');
        }
      } else {
        console.error('persistChar error:', e);
        showToast('Erro ao salvar. Verifique a conexão.', 'error');
      }
    }
  } else {
    // Local mode
    if (state.character) {
      LocalDB.setChar(codename, state.character);
    }
  }
}

// Convert dotted paths like "attrs.fisico" to nested objects
function flatToNested(obj) {
  const result = {};
  for (const key in obj) {
    if (key.includes('.')) {
      const parts = key.split('.');
      let cur = result;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!cur[parts[i]]) cur[parts[i]] = {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = obj[key];
    } else {
      result[key] = obj[key];
    }
  }
  return result;
}

// ──────────────────────────────────────────────────────────
//  GM DASHBOARD
// ──────────────────────────────────────────────────────────
function loadGMDashboard() {
  const listEl = $('gm-agent-list');
  listEl.innerHTML = '<div class="gm-empty">Carregando operadores...</div>';
  loadNpcPresets();
  renderGMMaldicoes();
  loadDocsState().then(() => renderGMDocs());
  loadCamoState().then(() => renderGMCamuflagens());
  loadMissaoTextGM();
  loadLootState();
  renderGMFitaLibrary();
  restoreGMSectionStates();

  if (firebaseOk) {
    if (state.gmCharsUnsub) state.gmCharsUnsub();
    const q = query(collection(db, 'characters'));
    state.gmCharsUnsub = onSnapshot(q, (snap) => {
      const chars = [];
      snap.forEach(d => chars.push(d.data()));
      renderGMList(chars.sort((a,b) => (a.codename || '').localeCompare(b.codename || '')));
    });
  } else {
    // Local mode
    const chars = LocalDB.getAllChars();
    renderGMList(chars);
    showToast('⚠ MODO LOCAL — atualizações não sincronizadas', 'error', 5000);
  }
}

function renderGMList(chars) {
  _gmCharsList = chars || [];
  const listEl = $('gm-agent-list');
  if (!chars || chars.length === 0) {
    listEl.innerHTML = '<div class="gm-empty">Nenhum operador registrado.</div>';
    return;
  }
  // Preserva quais cards estavam abertos antes de re-renderizar
  const expanded = new Set(
    Array.from(listEl.querySelectorAll('.gm-agent-card.expanded'))
         .map(el => el.id.replace('gm-card-', ''))
  );
  listEl.innerHTML = '';
  chars.forEach(char => {
    const card = buildGMCard(char);
    if (expanded.has(char.codename)) card.classList.add('expanded');
    listEl.appendChild(card);
  });
}

function buildGMCard(char) {
  const card = document.createElement('div');
  card.className = 'gm-agent-card';
  card.id = 'gm-card-' + char.codename;

  const statusLabel = { ativo: 'ATIVO', inativo: 'INATIVO', morto: 'K.I.A.' };
  const secLabel    = { seguro: 'SEGURO', alerta: 'ALERTA', perigo: 'PERIGO', comprometido: 'COMPROMETIDO' };
  const xpChar      = char.xp ?? 0;
  const patente     = getPatenteFromXp(xpChar);
  const maxBars     = 4 + patente; // Venom=5, Snake=6, Vyper=7, Boss=8
  const integ       = Math.min(char.integrity ?? maxBars, maxBars);

  const photoHtml = char.photo
    ? `<img class="gm-agent-photo-sm" src="${char.photo}" alt="foto" />`
    : `<div class="gm-agent-photo-placeholder">◈</div>`;

  const attrsHtml = ATTRS.map(a =>
    `<div class="gm-attr-mini-item">
      <div class="gm-attr-mini-grade">${(char.attrs && char.attrs[a]) || '—'}</div>
      <div class="gm-attr-mini-name">${ATTR_LABELS[a].slice(0,3)}</div>
    </div>`
  ).join('');

  const intBarsHtml = Array.from({length: maxBars}, (_,i) =>
    `<div class="gm-int-bar ${i < integ ? 'active' : ''}"
          onclick="App.gmSetIntegrity('${char.codename}', ${i+1 > integ ? i+1 : i})" ></div>`
  ).join('');

  const secBtns = ['seguro','alerta','perigo','comprometido'].map(s =>
    `<button class="gm-sec-btn ${char.security === s ? 'active-'+s : ''}"
             onclick="App.gmSetSecurity('${char.codename}','${s}')">
       ${secLabel[s]}
     </button>`
  ).join('');

  const statusBtns = ['ativo','inativo','morto'].map(s =>
    `<button class="gm-toggle-btn ${char.statusAtivo === s ? 'active-'+s : ''}"
             onclick="App.gmSetStatus('${char.codename}','${s}')">
       ${statusLabel[s]}
     </button>`
  ).join('');

  // Aparência
  const apar = char.aparencia || {};
  const corAtual     = apar.cor        || 'vermelho';
  const fotoAtual    = apar.fotoFiltro || 'padrao';
  const carimboAtual = apar.carimbo    || 'nenhum';
  const CORES_APAR = [
    { id: 'vermelho', css: '#cc0000', label: 'Vermelho' },
    { id: 'azul',     css: '#1177dd', label: 'Azul'     },
    { id: 'verde',    css: '#00bb44', label: 'Verde'    },
    { id: 'roxo',     css: '#9944cc', label: 'Roxo'     },
    { id: 'dourado',  css: '#cc9900', label: 'Dourado'  },
    { id: 'ciano',    css: '#00aacc', label: 'Ciano'    },
  ];
  const FOTO_ESTILOS = [
    { id: 'padrao',    label: 'PADRÃO'    },
    { id: 'fantasma',  label: 'FANTASMA'  },
    { id: 'corrupto',  label: 'CORRUPTO'  },
    { id: 'operativo', label: 'OPERATIVO' },
  ];
  const CARIMBOS = [
    { id: 'nenhum',       label: 'NENHUM'       },
    { id: 'confidencial', label: 'CONFIDENCIAL' },
    { id: 'operativo',    label: 'OPERATIVO'    },
    { id: 'desaparecido', label: 'DESAPARECIDO' },
    { id: 'eliminado',    label: 'ELIMINADO'    },
    { id: 'foragido',     label: 'FORAGIDO'     },
    { id: 'renegado',     label: 'RENEGADO'     },
    { id: 'elite',        label: 'ELITE'        },
    { id: 'corrompido',   label: 'CORROMPIDO'   },
    { id: 'prioritario',  label: 'PRIORITÁRIO'  },
    { id: 'neutralizado', label: 'NEUTRALIZADO' },
  ];
  const coresHtml = CORES_APAR.map(c =>
    `<button class="gm-cor-btn ${corAtual === c.id ? 'active' : ''}" style="background:${c.css}" title="${c.label}"
             onclick="App.gmSetAparencia('${char.codename}','cor','${c.id}')"></button>`
  ).join('');
  const fotosHtml = FOTO_ESTILOS.map(f =>
    `<button class="gm-apar-btn ${fotoAtual === f.id ? 'active' : ''}"
             onclick="App.gmSetAparencia('${char.codename}','fotoFiltro','${f.id}')">${f.label}</button>`
  ).join('');
  const carimbosHtml = CARIMBOS.map(s =>
    `<button class="gm-apar-btn ${carimboAtual === s.id ? 'active' : ''}"
             onclick="App.gmSetAparencia('${char.codename}','carimbo','${s.id}')">${s.label}</button>`
  ).join('');

  const xpHtml = `
    <div class="gm-xp-row">
      <div class="gm-xp-display">
        <span class="gm-xp-val">${xpChar} XP</span>
        <span class="gm-xp-patente-tag">${PATENTES[patente].nome}</span>
      </div>
      <div class="gm-xp-btns">
        <button class="gm-xp-btn gm-xp-minus" onclick="App.gmAjustarXp('${char.codename}',-10)">−10</button>
        <button class="gm-xp-btn gm-xp-minus" onclick="App.gmAjustarXp('${char.codename}',-5)">−5</button>
        <button class="gm-xp-btn gm-xp-minus" onclick="App.gmAjustarXp('${char.codename}',-1)">−1</button>
        <button class="gm-xp-btn gm-xp-plus" onclick="App.gmAjustarXp('${char.codename}',+1)">+1</button>
        <button class="gm-xp-btn gm-xp-plus" onclick="App.gmAjustarXp('${char.codename}',+5)">+5</button>
        <button class="gm-xp-btn gm-xp-plus" onclick="App.gmAjustarXp('${char.codename}',+10)">+10</button>
      </div>
      <div class="gm-xp-custom">
        <input type="number" id="gm-xp-input-${char.codename}" min="0" max="999" placeholder="valor exato..." class="gm-xp-input" />
        <button class="gm-xp-set" onclick="App.gmSetXpExact('${char.codename}')">DEFINIR</button>
      </div>
    </div>`;

  card.innerHTML = `
    <div class="gm-card-header" onclick="App.gmToggleCard('${char.codename}')">
      ${photoHtml}
      <div class="gm-card-info">
        <div class="gm-card-codename">${char.codename}</div>
        <div class="gm-card-meta">
          <span>${char.nome || '—'}</span>
          <span>${statusLabel[char.statusAtivo] || 'ATIVO'}</span>
          <span>INT: ${integ}/${maxBars}</span>
        </div>
      </div>
      <div class="gm-status-dot ${char.security || 'seguro'}"></div>
      <div class="gm-card-chevron">▾</div>
    </div>
    <div class="gm-controls">
      <div class="gm-ctrl-group">
        <div class="gm-ctrl-label">⬡ ATRIBUTOS</div>
        <div class="gm-attr-mini">${attrsHtml}</div>
      </div>
      <div class="gm-ctrl-group">
        <div class="gm-ctrl-label">⬡ INTEGRIDADE FÍSICA</div>
        <div class="gm-integrity-control">
          <div class="gm-integrity-bars">${intBarsHtml}</div>
          <div class="gm-integrity-val">${integ}</div>
        </div>
      </div>
      <div class="gm-ctrl-group">
        <div class="gm-ctrl-label">&#x29E1; PATENTE / XP</div>
        ${xpHtml}
      </div>
      <div class="gm-ctrl-group">
        <div class="gm-ctrl-label">⬡ STATUS DE SEGURANÇA</div>
        <div class="gm-security-btns">${secBtns}</div>
      </div>
      <div class="gm-ctrl-group">
        <div class="gm-ctrl-label">⬡ STATUS DO OPERADOR</div>
        <div class="gm-active-toggle">${statusBtns}</div>
      </div>
      <div class="gm-ctrl-group">
        <div class="gm-ctrl-label">⬡ ARMAMENTO</div>
        ${buildGMArmasHtml(char)}
      </div>
      <div class="gm-ctrl-group">
        <div class="gm-ctrl-label">⬡ RÁDIO</div>
        <div id="gm-radio-panel-${char.codename}">${buildGMRadioHtml(char)}</div>
      </div>
      <div class="gm-ctrl-group">
        <div class="gm-ctrl-label">⬡ FITAS ALOCADAS</div>
        <div class="gm-fitas-list" id="gm-fitas-list-${char.codename}">${buildGMFitasListHtml(char.codename, char.tapes || [])}</div>
        <div class="gm-fitas-add" style="margin-top:4px">
          <select id="gm-fita-assign-sel-${char.codename}" class="gm-select gm-fita-assign-sel" style="flex:1;min-width:0">
            <option value="">alocar da biblioteca...</option>
          </select>
          <button class="gm-fita-upload-btn" onclick="App.gmAssignFitaFromLibrary('${char.codename}')">+ ALOCAR</button>
        </div>
        <div class="gm-fitas-add" style="margin-top:3px">
          <input type="text" id="gm-fita-nome-${char.codename}" placeholder="nome da fita..." class="gm-text-input" />
          <select id="gm-fita-cat-${char.codename}" class="gm-select">
            <option value="musica">MÚSICA</option>
            <option value="historia">HISTÓRIA</option>
            <option value="outro">OUTRO</option>
          </select>
          <label class="gm-fita-upload-btn">+ MP3
            <input type="file" accept=".mp3,audio/*" class="hidden" onchange="App.gmUploadFita('${char.codename}', this)" />
          </label>
        </div>
      </div>
      <div class="gm-ctrl-group">
        <div class="gm-ctrl-label">⬡ APARÊNCIA DO OPERADOR</div>
        <div class="gm-apar-row">
          <div class="gm-apar-sublabel">COR DE DESTAQUE</div>
          <div class="gm-cor-grid">${coresHtml}</div>
        </div>
        <div class="gm-apar-row">
          <div class="gm-apar-sublabel">ESTILO DE FOTO</div>
          <div class="gm-apar-btns">${fotosHtml}</div>
        </div>
        <div class="gm-apar-row">
          <div class="gm-apar-sublabel">CARIMBO</div>
          <div class="gm-apar-btns">${carimbosHtml}</div>
        </div>
      </div>
      <div class="gm-ctrl-group">
        <div class="gm-ctrl-label">⬡ BOLSA DO OPERADOR</div>
        ${buildGMBolsaHtml(char)}
      </div>
      <div class="gm-ctrl-group">
        <div class="gm-ctrl-label">⬡ ARQUIVO PSICOLÓGICO</div>
        ${buildGMPsychHtml(char)}
      </div>
      <div class="gm-ctrl-group">
        <div class="gm-ctrl-label">⬡ RADAR PARANORMAL</div>
        ${buildGMParanormalHtml(char)}
      </div>
      <div class="gm-ctrl-group">
        <div class="gm-ctrl-label">⬡ STATUS NEGATIVOS</div>
        ${buildGMStatusNegHtml(char)}
      </div>
      <div class="gm-ctrl-group">
        <div class="gm-ctrl-label">⬡ MENSAGEM CIFRADA</div>
        <div class="gm-cifrada-form">
          <input id="gm-cifrada-input-${char.codename}" class="gm-text-input gm-cifrada-input"
                 type="text" maxlength="200" placeholder="Mensagem secreta ao operador..." />
          <button class="gm-cifrada-send" onclick="App.gmEnviarMensagemCifrada('${char.codename}')">&#9658; CIFRAR &amp; ENVIAR</button>
        </div>
      </div>
      <div class="gm-ctrl-group gm-danger-zone">
        <div class="gm-ctrl-label">⬡ ZONA DE PERIGO</div>
        <button id="gm-delete-btn-${char.codename}" class="gm-delete-btn"
                onclick="App.gmDeleteOperador('${char.codename}')">✕ DELETAR PERFIL</button>
        <div class="gm-delete-hint">Clique uma vez para armar · Clique novamente para confirmar</div>
      </div>
    </div>
  `;
  return card;
}

function gmToggleCard(codename) {
  const card = $('gm-card-' + codename);
  if (card) card.classList.toggle('expanded');
}

async function gmSetSecurity(codename, security) {
  await gmUpdateChar(codename, { security });
}

async function gmSetIntegrity(codename, val) {
  let maxBars = 5; // default Venom
  if (firebaseOk) {
    try {
      const snap = await getDoc(doc(db, 'characters', codename));
      if (snap.exists()) {
        const d = snap.data();
        maxBars = 4 + getPatenteFromXp(d.xp ?? 0);
      }
    } catch (_) {}
  } else {
    const char = LocalDB.getChar(codename);
    if (char) maxBars = 4 + getPatenteFromXp(char.xp ?? 0);
  }
  const newVal = Math.max(0, Math.min(maxBars, val));
  await gmUpdateChar(codename, { integrity: newVal });
}

async function gmSetStatus(codename, statusAtivo) {
  await gmUpdateChar(codename, { statusAtivo });
}

async function gmSetPatente(codename, level) {
  const p = Math.max(1, Math.min(4, level));
  await gmUpdateChar(codename, { patente: p });
}

async function gmAjustarXp(codename, delta) {
  let currentXp = 0;
  if (firebaseOk) {
    try {
      const snap = await getDoc(doc(db, 'characters', codename));
      if (snap.exists()) currentXp = snap.data().xp ?? 0;
    } catch (_) {}
  } else {
    const char = LocalDB.getChar(codename);
    if (char) currentXp = char.xp ?? 0;
  }
  const newXp = Math.max(0, currentXp + delta);
  const newPatente = getPatenteFromXp(newXp);
  await gmUpdateChar(codename, { xp: newXp, patente: newPatente });
  showToast(`XP de ${codename}: ${newXp} (${delta >= 0 ? '+' : ''}${delta})`, 'success', 2200);
  loadGMDashboard();
}

async function gmSetXpExact(codename) {
  const inputEl = $('gm-xp-input-' + codename);
  if (!inputEl) return;
  const val = parseInt(inputEl.value);
  if (isNaN(val) || val < 0) { showToast('Valor inv\u00e1lido.', 'error'); return; }
  const newPatente = getPatenteFromXp(val);
  await gmUpdateChar(codename, { xp: val, patente: newPatente });
  showToast(`XP de ${codename}: ${val}`, 'success', 2200);
  inputEl.value = '';
  loadGMDashboard();
}


// ══════════════════════════════════════════════════════════════
//  ARQUIVO PSICOLÓGICO — constants & render
// ══════════════════════════════════════════════════════════════
const PSYCH_GATILHOS = [
  { id: 'paranoia',       label: 'PARANOIA',         desc: 'Sente que está sendo observado.',       ico: '👁' },
  { id: 'alucinacao',     label: 'ALUCINAÇÃO',        desc: 'Percebe coisas que não existem.',       ico: '◈' },
  { id: 'dissociacao',    label: 'DISSOCIAÇÃO',       desc: 'Desconexão da realidade circundante.',  ico: '◌' },
  { id: 'flashback',      label: 'FLASHBACK',         desc: 'Memórias intrusivas de trauma.',        ico: '▶' },
  { id: 'fobia_escuridao',label: 'FOBIA: ESCURIDÃO', desc: 'Terror irracional em ambientes escuros.',ico: '▪' },
  { id: 'fobia_abandono', label: 'FOBIA: ABANDONO',  desc: 'Medo patológico de ser deixado sozinho.',ico: '◯' },
  { id: 'mania_controle', label: 'MANIA DE CONTROLE',desc: 'Necessidade compulsiva de controla tudo.',ico: '⊞' },
  // ── Elementos de Ordem Paranormal ──────────────────────────────
  { id: 'elem_sangue',       label: 'SANGUE',        desc: 'O elemento do sangue corrompe a mente.', ico: '🩸' },
  { id: 'elem_morte',        label: 'MORTE',         desc: 'A morte sussurra de perto.',             ico: '💀' },
  { id: 'elem_energia',      label: 'ENERGIA',       desc: 'A energia do Outro Lado invade a psique.',ico: '⚡' },
  { id: 'elem_conhecimento', label: 'CONHECIMENTO',  desc: 'Saber demais tem um custo.',             ico: '📖' },
];

// ══════════════════════════════════════════════════════════════
//  STATUS NEGATIVOS — constantes
// ══════════════════════════════════════════════════════════════
const STATUS_NEG = {
  envenenado: { label: 'ENVENENADO', ico: '⊗', cor: '#44cc66', cssClass: 'status-envenenado' },
  sangrando:  { label: 'SANGRANDO',  ico: '✦', cor: '#cc2233', cssClass: 'status-sangrando'  },
  atordoado:  { label: 'ATORDOADO',  ico: '◎', cor: '#ccaa00', cssClass: 'status-atordoado'  },
  exausto:    { label: 'EXAUSTO',    ico: '◑', cor: '#778899', cssClass: 'status-exausto'    },
  queimado:   { label: 'QUEIMADO',   ico: '⊕', cor: '#ff6600', cssClass: 'status-queimado'   },
};

const PSYCH_LEVELS = [
  { min: 0,  max: 20,  id: 'estavel',    label: 'ESTÁVEL',       color: '#44aa55' },
  { min: 21, max: 40,  id: 'perturbado', label: 'PERTURBADO',    color: '#aaaa33' },
  { min: 41, max: 60,  id: 'instavel',   label: 'INSTÁVEL',      color: '#cc8822' },
  { min: 61, max: 80,  id: 'fragmentado',label: 'FRAGMENTADO',   color: '#cc4422' },
  { min: 81, max: 100, id: 'colapso',    label: 'COLAPSO TOTAL', color: '#cc0000' },
];

function getPsychLevel(insanidade) {
  return PSYCH_LEVELS.find(l => insanidade >= l.min && insanidade <= l.max) || PSYCH_LEVELS[0];
}

function buildGMPsychHtml(char) {
  const psych      = char.psych || { insanidade: 0, medicado: false, gatilhos: [] };
  const insanidade = psych.insanidade ?? 0;
  const medicado   = psych.medicado ?? false;
  const gatilhos   = psych.gatilhos || [];
  const lvl        = getPsychLevel(insanidade);

  const gatilhosHtml = PSYCH_GATILHOS.map(g => {
    const on = gatilhos.includes(g.id);
    return `<label class="gm-gatilho-item${on ? ' active' : ''}${medicado ? ' med-off' : ''}" title="${g.desc}">
      <input type="checkbox" ${on ? 'checked' : ''} ${medicado ? 'disabled' : ''}
             onchange="App.gmToggleGatilho('${char.codename}','${g.id}',this.checked)" />
      <span class="gatilho-ico">${g.ico}</span>
      <span class="gatilho-lbl">${g.label}</span>
    </label>`;
  }).join('');

  return `
    <div class="gm-psych-panel">
      <div class="gm-psych-top">
        <div class="gm-psych-lv-badge" style="color:${lvl.color};border-color:${lvl.color}44">${lvl.label}</div>
        <label class="gm-med-toggle${medicado ? ' active' : ''}">
          <input type="checkbox" ${medicado ? 'checked' : ''}
                 onchange="App.gmSetMedicado('${char.codename}',this.checked)" />
          <span>💊 MEDICADO</span>
        </label>
      </div>
      <div class="gm-psych-slider-wrap">
        <div class="gm-psych-slider-labels">
          <span>0</span><span>INSANIDADE</span><span>100</span>
        </div>
        <input type="range" min="0" max="100" value="${insanidade}"
               class="gm-psych-slider" id="gm-psych-slider-${char.codename}"
               style="--psych-color:${lvl.color}"
               oninput="App.gmPsychSliderInput('${char.codename}',this.value)"
               onchange="App.gmSavePsych('${char.codename}')" />
        <div class="gm-psych-bar-preview">
          <div class="gm-psych-bar-fill" id="gm-psych-bar-${char.codename}"
               style="width:${insanidade}%;background:${lvl.color}"></div>
          <span class="gm-psych-val" id="gm-psych-val-${char.codename}">${insanidade}</span>
        </div>
      </div>
      <div class="gm-ctrl-label" style="margin-top:8px;margin-bottom:4px">GATILHOS ATIVOS</div>
      <div class="gm-gatilhos-grid">${gatilhosHtml}</div>
    </div>`;
}

// ── GM actions ──────────────────────────────────────────────────
function gmPsychSliderInput(codename, val) {
  const intVal = parseInt(val);
  const lvl    = getPsychLevel(intVal);
  const bar    = document.getElementById('gm-psych-bar-' + codename);
  const valEl  = document.getElementById('gm-psych-val-' + codename);
  const slider = document.getElementById('gm-psych-slider-' + codename);
  const badge  = slider?.closest('.gm-psych-panel')?.querySelector('.gm-psych-lv-badge');
  if (bar)   { bar.style.width = intVal + '%'; bar.style.background = lvl.color; }
  if (valEl) valEl.textContent = intVal;
  if (badge) { badge.textContent = lvl.label; badge.style.color = lvl.color; badge.style.borderColor = lvl.color + '44'; }
  if (slider) slider.style.setProperty('--psych-color', lvl.color);
}

async function gmSavePsych(codename) {
  const slider = document.getElementById('gm-psych-slider-' + codename);
  if (!slider) return;
  const insanidade = parseInt(slider.value);
  let cur = {};
  if (firebaseOk) {
    try { const s = await getDoc(doc(db,'characters',codename)); if (s.exists()) cur = s.data().psych || {}; } catch(_) {}
  } else {
    const ch = LocalDB.getChar(codename); if (ch) cur = ch.psych || {};
  }
  await gmUpdateChar(codename, { psych: { ...cur, insanidade } });
  sfx('select');
}

async function gmToggleGatilho(codename, gatilhoId, on) {
  let cur = { insanidade: 0, medicado: false, gatilhos: [] };
  if (firebaseOk) {
    try { const s = await getDoc(doc(db,'characters',codename)); if (s.exists()) cur = s.data().psych || cur; } catch(_) {}
  } else {
    const ch = LocalDB.getChar(codename); if (ch) cur = ch.psych || cur;
  }
  const gatilhos = [...(cur.gatilhos || [])];
  if (on && !gatilhos.includes(gatilhoId)) gatilhos.push(gatilhoId);
  if (!on) { const i = gatilhos.indexOf(gatilhoId); if (i !== -1) gatilhos.splice(i, 1); }
  await gmUpdateChar(codename, { psych: { ...cur, gatilhos } });
}

async function gmSetMedicado(codename, medicado) {
  let cur = { insanidade: 0, medicado: false, gatilhos: [] };
  if (firebaseOk) {
    try { const s = await getDoc(doc(db,'characters',codename)); if (s.exists()) cur = s.data().psych || cur; } catch(_) {}
  } else {
    const ch = LocalDB.getChar(codename); if (ch) cur = ch.psych || cur;
  }
  await gmUpdateChar(codename, { psych: { ...cur, medicado } });
  sfx('select');
  showToast(medicado ? '💊 Medicação ativada — efeitos suprimidos.' : '⚠ Medicação removida.', medicado ? 'success' : 'error', 2500);
}

// ── Player: apply effects ────────────────────────────────────────
// ══════════════════════════════════════════════════════════════
//  ELEMENTOS PARANORMAIS — text spawner (Sigilos do Outro Lado)
// ══════════════════════════════════════════════════════════════
const _ELEM_MSGS = {
  // SANGUE: curto, brutal, sem floreio
  elem_sangue: [
    'SANGUE', 'SANGUE', 'SANGUE',   // peso maior
    'CORTE', 'RASGUE', 'DERRAME', 'MATE',
    'SEU SANGUE NOS PERTENCE',
    'A CARNE CLAMA',
    'O PACTO EXIGE SANGUE',
    'A DIVIDA E DE SANGUE',
    'SANGUE SANGUE SANGUE',
    'OFERECA',
  ],
  // MORTE: sussurros lentos, inevitaveis
  elem_morte: [
    'INEVITAVEL',
    'ELE ESPERA',
    'VENHA',
    'TUDO ACABA',
    'A ESPIRAL TE AGUARDA',
    'HA PAZ NA MORTE',
    'VOCE JA ESTA MORTO',
    'NAO HA ESCAPATORIA',
    'SEU FIM SE APROXIMA',
    'OS MORTOS TE CHAMAM',
    'NAO EXISTE RETORNO',
  ],
  // ENERGIA: caos puro, incoerencia proposital
  elem_energia: [
    'XZQRTM!!!',
    '%%%ERRO%%%',
    'NAO EXISTE', 'EXISTE', 'NAO EXISTE',
    'VOCE NAO E REAL',
    'TUDO E FALSO',
    'HA HA HA HA HA',
    'O VEU SE ROMPE',
    'CAOS CAOS CAOS',
    'FREQUENCIA INSTAVEL',
    '#@!#@!#@!',
    'SIM NAO SIM NAO',
    'O OUTRO LADO PULSA',
    'CONDUTOR DE CAOS',
    '.......',
  ],
  // CONHECIMENTO: soberbo, dourado, definitivo
  elem_conhecimento: [
    'SABER TUDO E PERDER TUDO',
    'SABER TUDO E PERDER TUDO',     // aumenta frequencia
    'SABER TUDO E PERDER TUDO',     // aumenta frequencia
    'SOBERANO',
    'O PRECO DO SABER',
    'VOCE CARREGA DEMAIS',
    'VOCE VIU DEMAIS',
    'O CONHECIMENTO TE DESTROI',
    'HA VERDADES PROIBIDAS',
    'NAO SE PODE DESAPRENDER',
    'ELES SABEM QUE VOCE SABE',
    'O SEGREDO TE CONSOME',
  ],
};

const _ELEM_CFG = {
  // SANGUE: brutal — curto, rápido, sem aviso
  elem_sangue: {
    cls: 'psych-ptext-sangue', anim: 'psych-ptext-sangue', timingFn: 'linear',
    minDelay: 250, maxDelay: 2800, minDur: 0.6, maxDur: 1.5,
    minSize: 30, maxSize: 64,
  },
  // MORTE: perturbadoramente lento
  elem_morte: {
    cls: 'psych-ptext-morte', anim: 'psych-ptext-morte', timingFn: 'ease-in-out',
    minDelay: 5000, maxDelay: 11000, minDur: 11.0, maxDur: 18.0,
    minSize: 22, maxSize: 40,
  },
  // ENERGIA: intervalo caótico, anything goes
  elem_energia: {
    cls: 'psych-ptext-energia', anim: 'psych-ptext-energia', timingFn: 'linear',
    minDelay: 80, maxDelay: 1500, minDur: 0.35, maxDur: 3.0,
    minSize: 12, maxSize: 76, burst: true,
  },
  // CONHECIMENTO: solene, deliberado
  elem_conhecimento: {
    cls: 'psych-ptext-conhecimento', anim: 'psych-ptext-conhecimento', timingFn: 'ease-in-out',
    minDelay: 3500, maxDelay: 8000, minDur: 5.5, maxDur: 10.0,
    minSize: 32, maxSize: 54,
  },
};

let _elemTextTimeouts = {};

// Morte: persistent spiral
let _morteSpiral = null;
let _morteAudio   = null;

function _playElemSfx(gatilhoId) {
  const _sfxMap = {
    elem_sangue:       'imagens/elementos/sangue.m4a',
    elem_energia:      'imagens/elementos/energia.mp3',
    elem_conhecimento: 'imagens/elementos/conhecimento.mp3',
  };
  const src = _sfxMap[gatilhoId];
  if (!src) return;
  try { const a = new Audio(src); a.volume = 0.7; a.play().catch(() => {}); } catch(_) {}
}

function startMorteAudio() {
  stopMorteAudio();
  try {
    _morteAudio = new Audio('imagens/elementos/morte.mp3');
    _morteAudio.loop = true;
    _morteAudio.volume = 0.5;
    _morteAudio.play().catch(() => {});
  } catch(_) {}
}

function stopMorteAudio() {
  if (_morteAudio) {
    try { _morteAudio.pause(); _morteAudio.currentTime = 0; } catch(_) {}
    _morteAudio = null;
  }
}

function startMorteSpiral() {
  stopMorteSpiral();
  const ov = document.getElementById('psych-overlay');
  if (!ov) return;
  const el = document.createElement('img');
  el.className = 'psych-morte-espirais';
  el.src = 'imagens/elementos/espiraismorte.jpg';
  el.alt = '';
  ov.appendChild(el);
  _morteSpiral = el;
  startMorteAudio();
}

function stopMorteSpiral() {
  if (_morteSpiral) { try { _morteSpiral.remove(); } catch(_) {} _morteSpiral = null; }
  document.querySelectorAll('.psych-morte-espirais').forEach(e => e.remove());
  stopMorteAudio();
}

// Sangue: olho que aparece inesperadamente
let _sangueOlhoTimeout = null;

function startSangueOlho() {
  stopSangueOlho();
  function spawnOlho() {
    const ov = document.getElementById('psych-overlay');
    if (!ov || !ov.classList.contains('psych-g-elem_sangue')) { stopSangueOlho(); return; }
    const el = document.createElement('img');
    el.className = 'psych-sangue-olho';
    el.src = 'imagens/elementos/olhosangue.png';
    el.alt = '';
    el.style.left = (5 + Math.random() * 80) + '%';
    el.style.top  = (5 + Math.random() * 80) + '%';
    const dur = 1.2 + Math.random() * 2.2;
    el.style.animationDuration = dur + 's';
    ov.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
    // Delay imprevisível: entre 0.8s e 9s
    _sangueOlhoTimeout = setTimeout(spawnOlho, 800 + Math.random() * 8200);
  }
  spawnOlho();
}

function stopSangueOlho() {
  if (_sangueOlhoTimeout) { clearTimeout(_sangueOlhoTimeout); _sangueOlhoTimeout = null; }
  document.querySelectorAll('.psych-sangue-olho').forEach(e => e.remove());
}

function _spawnElemToken(ov, gatilhoId) {
  const msgs = _ELEM_MSGS[gatilhoId];
  const cfg  = _ELEM_CFG[gatilhoId];
  if (!msgs || !cfg || !ov) return;
  const el = document.createElement('span');
  el.className = 'psych-paranormal-text ' + cfg.cls;
  el.textContent = msgs[Math.floor(Math.random() * msgs.length)];
  el.style.left = (6 + Math.random() * 82) + '%';
  el.style.top  = (6 + Math.random() * 82) + '%';
  const dur  = cfg.minDur  + Math.random() * (cfg.maxDur  - cfg.minDur);
  const size = cfg.minSize + Math.floor(Math.random() * (cfg.maxSize - cfg.minSize));
  el.style.animationDuration       = dur + 's';
  el.style.animationName           = cfg.anim      || 'psych-ptext-appear';
  el.style.animationTimingFunction = cfg.timingFn  || 'ease-in-out';
  el.style.animationFillMode       = 'forwards';
  el.style.fontSize = size + 'px';
  // Energia: random rotation & skew chaos
  if (gatilhoId === 'elem_energia') {
    const rot  = (Math.random() - 0.5) * 40;
    el.style.transform = `translate(-50%,-50%) rotate(${rot}deg)`;
  }
  ov.appendChild(el);
  _playElemSfx(gatilhoId);
  el.addEventListener('animationend', () => el.remove());
}

function startElemText(gatilhoId) {
  stopElemText(gatilhoId);
  if (gatilhoId === 'elem_morte')  startMorteSpiral();
  if (gatilhoId === 'elem_sangue') startSangueOlho();
  const cfg = _ELEM_CFG[gatilhoId];
  if (!cfg) return;
  function spawn() {
    const ov = document.getElementById('psych-overlay');
    if (!ov || !ov.classList.contains('psych-g-' + gatilhoId)) { stopElemText(gatilhoId); return; }
    _spawnElemToken(ov, gatilhoId);
    // Energia burst: sometimes spawn 1-2 extras simultaneously
    if (cfg.burst && Math.random() < 0.45) {
      const extras = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < extras; i++) {
        setTimeout(() => {
          const ov2 = document.getElementById('psych-overlay');
          if (ov2 && ov2.classList.contains('psych-g-' + gatilhoId)) _spawnElemToken(ov2, gatilhoId);
        }, 40 + Math.random() * 220);
      }
    }
    const delay = cfg.minDelay + Math.random() * (cfg.maxDelay - cfg.minDelay);
    _elemTextTimeouts[gatilhoId] = setTimeout(spawn, delay);
  }
  spawn();
}

function stopElemText(gatilhoId) {
  if (_elemTextTimeouts[gatilhoId]) { clearTimeout(_elemTextTimeouts[gatilhoId]); delete _elemTextTimeouts[gatilhoId]; }
  if (gatilhoId === 'elem_morte')  stopMorteSpiral();
  if (gatilhoId === 'elem_sangue') stopSangueOlho();
  const suffix = gatilhoId.replace('elem_', '');
  document.querySelectorAll('.psych-ptext-' + suffix).forEach(e => e.remove());
}

// ── Paranoia eye spawner ─────────────────────────────────────
let _paranoiaEyeTimeout = null;

const _EYE_GLYPHS = ['\u{1F441}','👁','👁','👁','👁'];

function startParanoiaEyes(overlay) {
  stopParanoiaEyes();
  function spawnEye() {
    const ov = document.getElementById('psych-overlay');
    if (!ov || !ov.classList.contains('psych-g-paranoia')) { stopParanoiaEyes(); return; }
    const eye = document.createElement('span');
    eye.className = 'psych-eye';
    eye.textContent = _EYE_GLYPHS[Math.floor(Math.random() * _EYE_GLYPHS.length)];
    eye.style.left = (4 + Math.random() * 90) + '%';
    eye.style.top  = (4 + Math.random() * 90) + '%';
    const dur = 1.8 + Math.random() * 2.4;
    eye.style.animationDuration = dur + 's';
    ov.appendChild(eye);
    eye.addEventListener('animationend', () => eye.remove());
    _paranoiaEyeTimeout = setTimeout(spawnEye, 600 + Math.random() * 2800);
  }
  spawnEye();
}

function stopParanoiaEyes() {
  if (_paranoiaEyeTimeout) { clearTimeout(_paranoiaEyeTimeout); _paranoiaEyeTimeout = null; }
  document.querySelectorAll('.psych-eye').forEach(e => e.remove());
}

function applyPsychEffects(psych) {
  const body     = document.body;
  const overlay  = document.getElementById('psych-overlay');
  const insanidade = psych?.insanidade ?? 0;
  const medicado   = psych?.medicado   ?? false;
  const gatilhos   = psych?.gatilhos   ?? [];

  // Remove all psych classes
  ['psych-lv1','psych-lv2','psych-lv3','psych-lv4','psych-medicado'].forEach(c => body.classList.remove(c));
  if (overlay) overlay.className = 'psych-overlay';

  if (medicado) {
    body.classList.add('psych-medicado');
    return;
  }

  const lvl = getPsychLevel(insanidade);
  if      (lvl.id === 'perturbado')  { body.classList.add('psych-lv1'); if (overlay) overlay.classList.add('psych-overlay-lv1'); }
  else if (lvl.id === 'instavel')    { body.classList.add('psych-lv2'); if (overlay) overlay.classList.add('psych-overlay-lv2'); }
  else if (lvl.id === 'fragmentado') { body.classList.add('psych-lv3'); if (overlay) overlay.classList.add('psych-overlay-lv3'); }
  else if (lvl.id === 'colapso')     { body.classList.add('psych-lv4'); if (overlay) overlay.classList.add('psych-overlay-lv4'); }

  // Gatilhos: add special body classes
  if (overlay) {
    gatilhos.forEach(g => overlay.classList.add('psych-g-' + g));
  }

  // Paranoia: spawn/stop roaming eyes
  if (!medicado && gatilhos.includes('paranoia') && overlay) {
    startParanoiaEyes(overlay);
  } else {
    stopParanoiaEyes();
  }

  // Paranormal elements: spawn/stop text
  ['elem_sangue','elem_morte','elem_energia','elem_conhecimento'].forEach(id => {
    if (!medicado && gatilhos.includes(id) && overlay) startElemText(id);
    else stopElemText(id);
  });
}

// ══════════════════════════════════════════════════════════════
//  STATUS NEGATIVOS — player display
// ══════════════════════════════════════════════════════════════
function applyStatusNeg(statusNeg) {
  const active = statusNeg || [];
  Object.values(STATUS_NEG).forEach(s => document.body.classList.remove(s.cssClass));
  active.forEach(id => {
    if (STATUS_NEG[id]) document.body.classList.add(STATUS_NEG[id].cssClass);
  });
  renderStatusNegBadges(active);
}

function renderStatusNegBadges(active) {
  const el = document.getElementById('status-neg-strip');
  if (!el) return;
  if (!active || active.length === 0) { el.innerHTML = ''; return; }
  el.innerHTML = active.map(id => {
    const s = STATUS_NEG[id];
    if (!s) return '';
    return `<div class="status-neg-badge" style="color:${s.cor};border-color:${s.cor}44" title="${s.label}">
      <span class="status-neg-ico">${s.ico}</span>
      <span class="status-neg-lbl">${s.label}</span>
    </div>`;
  }).join('');
}

async function gmToggleStatusNeg(codename, statusId) {
  let char = null;
  if (firebaseOk) {
    const snap = await getDoc(doc(db, 'characters', codename));
    if (snap.exists()) char = snap.data();
  } else {
    char = LocalDB.getChar(codename);
  }
  if (!char) return;
  const current = char.statusNeg || [];
  const newStatus = current.includes(statusId)
    ? current.filter(s => s !== statusId)
    : [...current, statusId];
  await gmUpdateChar(codename, { statusNeg: newStatus });
}

function buildGMStatusNegHtml(char) {
  const active = char.statusNeg || [];
  const btns = Object.entries(STATUS_NEG).map(([id, s]) => {
    const on = active.includes(id);
    return `<button class="gm-sneg-btn${on ? ' gm-sneg-on' : ''}"
                    style="${on ? `background:${s.cor}22;border-color:${s.cor};color:${s.cor}` : ''}"
                    onclick="App.gmToggleStatusNeg('${char.codename}','${id}')">
      <span>${s.ico}</span> ${s.label}
    </button>`;
  }).join('');
  return `<div class="gm-sneg-grid">${btns}</div>`;
}

// ══════════════════════════════════════════════════════════════
//  MENSAGENS CIFRADAS — GM send / player receive
// ══════════════════════════════════════════════════════════════
async function gmEnviarMensagemCifrada(codename) {
  const input = document.getElementById('gm-cifrada-input-' + codename);
  const texto = input?.value.trim();
  if (!texto) { showToast('Digite uma mensagem.', 'error'); return; }
  await gmUpdateChar(codename, { mensagemCifrada: { texto, ts: Date.now() } });
  if (input) input.value = '';
  showToast(codename + ': mensagem cifrada enviada.', 'success', 1800);
}

function showMensagemCifrada(texto) {
  const overlay = document.getElementById('cifrada-overlay');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  sfx('open');  // alerta de chegada
  const textEl   = document.getElementById('cifrada-text');
  const labelEl  = document.getElementById('cifrada-label');
  if (!textEl) return;
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>[]{}!?';
  let progress = 0;
  const total  = texto.length;
  if (labelEl) labelEl.textContent = 'DECODIFICANDO...';
  const interval = setInterval(() => {
    progress = Math.min(progress + 1, total);
    const decoded = texto.slice(0, progress);
    const noise   = Array.from({ length: total - progress }, () =>
      CHARS[Math.floor(Math.random() * CHARS.length)]
    ).join('');
    textEl.textContent = decoded + noise;
    if (progress >= total) {
      clearInterval(interval);
      if (labelEl) labelEl.textContent = '— MENSAGEM —';
      sfx('select');
    }
  }, 55);
}

function fecharMensagemCifrada() {
  const overlay = document.getElementById('cifrada-overlay');
  if (overlay) overlay.classList.add('hidden');
  sfx('close');
}

async function gmDeleteOperador(codename) {
  if (_gmDeleteArmed !== codename) {
    // Primeira clique — armar confirmação com contagem regressiva
    _gmDeleteArmed = codename;
    const btn = document.getElementById('gm-delete-btn-' + codename);
    let secsLeft = 4;
    if (btn) {
      btn.textContent = `⚠ CONFIRMAR DELEÇÃO (${secsLeft}s)`;
      btn.classList.add('armed');
      const countdown = setInterval(() => {
        secsLeft--;
        const b = document.getElementById('gm-delete-btn-' + codename);
        if (!b || _gmDeleteArmed !== codename) { clearInterval(countdown); return; }
        if (secsLeft <= 0) { clearInterval(countdown); return; }
        b.textContent = `⚠ CONFIRMAR DELEÇÃO (${secsLeft}s)`;
      }, 1000);
    }
    // Auto-desarmar após 4 segundos
    setTimeout(() => {
      if (_gmDeleteArmed === codename) {
        _gmDeleteArmed = null;
        const b = document.getElementById('gm-delete-btn-' + codename);
        if (b) { b.textContent = '✕ DELETAR PERFIL'; b.classList.remove('armed'); }
      }
    }, 4000);
    return;
  }
  // Segunda clique — confirmar e deletar
  _gmDeleteArmed = null;
  if (firebaseOk) {
    try {
      await deleteDoc(doc(db, 'characters', codename));
      showToast(`${codename}: perfil deletado.`, 'success');
    } catch (e) {
      console.error('gmDeleteOperador error:', e);
      showToast('Erro ao deletar operador: ' + (e.code || e.message), 'error');
      return;
    }
  } else {
    LocalDB.removeChar(codename);
    showToast(`${codename}: perfil deletado (local).`, 'success');
  }
  // Remove card do DOM
  const card = document.getElementById('gm-card-' + codename);
  if (card) card.remove();
  // Atualiza cache
  _gmCharsList = _gmCharsList.filter(c => c.codename !== codename);
}

// ──────────────────────────────────────────────────────────
//  GM — APARÊNCIA POR OPERADOR
// ──────────────────────────────────────────────────────────
async function gmSetAparencia(codename, key, val) {
  if (firebaseOk) {
    await gmUpdateChar(codename, { [`aparencia.${key}`]: val });
  } else {
    const char = LocalDB.getChar(codename);
    if (char) {
      if (!char.aparencia) char.aparencia = {};
      char.aparencia[key] = val;
      LocalDB.setChar(codename, char);
      const chars = LocalDB.getAllChars();
      renderGMList(chars);
    }
  }
}

// ──────────────────────────────────────────────────────────
//  GM — SEÇÕES RETRÁTEIS
// ──────────────────────────────────────────────────────────
function gmToggleSection(sectionId) {
  const sec = document.getElementById('gmsec-' + sectionId);
  if (!sec) return;
  sec.classList.toggle('gm-section-collapsed');
  const states = JSON.parse(localStorage.getItem('vyper_gm_sections') || '{}');
  states[sectionId] = sec.classList.contains('gm-section-collapsed');
  localStorage.setItem('vyper_gm_sections', JSON.stringify(states));
}

function restoreGMSectionStates() {
  const states   = JSON.parse(localStorage.getItem('vyper_gm_sections') || '{}');
  const defaults = { npc: true, mald: true, missao: true, loot: true, docs: true, camuflagens: true, videos: true, quadro: true, fitas: true, agents: false };
  ['npc','mald','missao','loot','docs','camuflagens','videos','quadro','fitas','agents'].forEach(id => {
    const sec = document.getElementById('gmsec-' + id);
    if (!sec) return;
    const collapsed = id in states ? states[id] : defaults[id];
    sec.classList.toggle('gm-section-collapsed', collapsed);
  });
}

async function gmUpdateChar(codename, updates) {
  if (firebaseOk) {
    const user = auth?.currentUser;
    if (!user) {
      showToast('Sem autenticação. Recarregue a página.', 'error');
      return;
    }
    const ref = doc(db, 'characters', codename);
    try {
      await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
      showToast(`${codename}: atualizado.`, 'success', 1500);
    } catch (e) {
      if (e.code === 'not-found') {
        // Document doesn't exist yet — create minimal document and retry
        try {
          const base = { ...DEFAULT_CHAR(), codename, ...updates, updatedAt: serverTimestamp() };
          await setDoc(ref, base);
          showToast(`${codename}: criado e atualizado.`, 'success', 1500);
        } catch (e2) {
          console.error('gmUpdateChar setDoc error:', e2);
          showToast('Erro ao atualizar operador.', 'error');
        }
      } else {
        console.error('gmUpdateChar error:', e);
        showToast('Erro ao atualizar operador: ' + (e.code || e.message), 'error');
      }
    }
  } else {
    // Local mode
    const char = LocalDB.getChar(codename);
    if (char) {
      Object.assign(char, updates);
      LocalDB.setChar(codename, char);
      // Re-render
      const chars = LocalDB.getAllChars();
      renderGMList(chars);
    }
  }
}

// ──────────────────────────────────────────────────────────
//  MALDIÇÕES
// ──────────────────────────────────────────────────────────
let maldicoesData = [];
let malState = { view: 'elem', elemento: null, maldicaoId: null };
let _malIconBase64 = null;
let _malTags = [];

function gmAddMaldTag() {
  const input = $('gm-mald-tag-input');
  if (!input) return;
  const tag = input.value.trim().toUpperCase();
  if (!tag || _malTags.includes(tag)) { input.value = ''; return; }
  _malTags.push(tag);
  input.value = '';
  _renderGMTagPills();
}

function gmRemoveMaldTag(i) {
  _malTags.splice(i, 1);
  _renderGMTagPills();
}

function _renderGMTagPills() {
  const el = $('gm-mald-tags-list');
  if (!el) return;
  el.innerHTML = _malTags.map((t, i) =>
    `<span class="mald-tag-pill gm-tag-pill">${escHtml(t)}<button onclick="App.gmRemoveMaldTag(${i})">&#10005;</button></span>`
  ).join('');
}

const ELEM_LABELS = {
  sangue: 'SANGUE', morte: 'MORTE',
  energia: 'ENERGIA', conhecimento: 'CONHECIMENTO'
};

async function loadMaldicoes() {
  if (!firebaseOk) return;
  try {
    const snap = await getDoc(doc(db, 'meta', 'maldicoes'));
    maldicoesData = snap.exists() ? (snap.data().maldicoes || []) : [];
  } catch (e) {
    console.error('loadMaldicoes:', e);
    maldicoesData = [];
  }
}

async function saveMaldicoes() {
  if (!firebaseOk) return;
  try {
    await setDoc(doc(db, 'meta', 'maldicoes'), { maldicoes: maldicoesData });
  } catch (e) {
    console.error('saveMaldicoes:', e);
    showToast('Erro ao salvar: documento muito grande. Reduza o tamanho dos ícones.', 'error', 5000);
    throw e;
  }
}

function _maldShowView(view) {
  malState.view = view;
  ['elem', 'grid', 'detail'].forEach(v => {
    const el = $('mald-view-' + v);
    if (el) el.classList.toggle('hidden', v !== view);
  });
}

function renderMaldicoesTab() {
  _maldShowView('elem');
}

function maldSelectElement(elem) {
  sfx('select');
  malState.elemento = elem;
  _maldShowView('grid');
  const titleEl   = $('mald-grid-title');
  const lblEl     = $('mald-grid-elem-lbl');
  const accentEl  = $('mald-grid-accent');
  const viewEl    = $('mald-view-grid');
  const gridEl    = $('mald-slots-grid');
  if (titleEl)  titleEl.textContent = 'MALDI\u00C7\u00D5ES';
  if (lblEl)    lblEl.textContent   = '\u25BA ' + (ELEM_LABELS[elem] || elem).toUpperCase();
  if (accentEl) { accentEl.className = 'mald-grid-accent accent-' + elem; }
  if (viewEl)   { viewEl.className = viewEl.className.replace(/elem-bg-\w+/g,'').trim() + ' elem-bg-' + elem; }
  if (gridEl)   { gridEl.className = 'mald-slots-grid mald-slots-elem-' + elem; }
  _renderMaldSlots(elem);
}

function _renderMaldSlots(elem) {
  const grid = $('mald-slots-grid');
  if (!grid) return;
  const filtered = maldicoesData.filter(m => m.elemento === elem);
  const TOTAL_SLOTS = 16;
  let html = '';
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const m = filtered[i];
    const num = String(i + 1).padStart(2, '0');
    if (m) {
      const iconHtml = m.icone
        ? `<img class="mald-slot-img" src="${m.icone}" alt="" />`
        : `<span style="font-size:26px;color:var(--dim)">&#9672;</span>`;
      html += `<div class="mald-slot" onclick="App.maldShowDetail('${escHtml(m.id)}')">
        <div class="mald-slot-idx">${num}</div>
        <div class="mald-slot-icon-wrap">${iconHtml}</div>
        <div class="mald-slot-name">${escHtml(m.nome)}</div>
        <div class="mald-slot-cut"></div>
      </div>`;
    } else {
      html += `<div class="mald-slot mald-slot-empty">
        <div class="mald-slot-empty-num">${num}</div>
      </div>`;
    }
  }
  grid.innerHTML = html;
}

function maldShowDetail(id) {
  sfx('select');
  const m = maldicoesData.find(x => x.id === id);
  if (!m) return;
  malState.maldicaoId = id;
  _maldShowView('detail');
  const container = $('mald-detail-inner');
  if (!container) return;
  const iconHtml = m.icone
    ? `<img class="mald-detail-icon" src="${m.icone}" alt="" />`
    : `<div class="mald-detail-icon-ph">&#9672;</div>`;
  const detectClass = m.detectavel ? 'mald-detect-yes' : 'mald-detect-no';
  const detectText  = m.detectavel ? 'DETECT\u00C1VEL' : 'N\u00C3O DETECT\u00C1VEL';
  const elemLabel   = ELEM_LABELS[m.elemento] || m.elemento;
  const tagsHtml    = (m.tags && m.tags.length)
    ? `<div class="mald-detail-tags">${m.tags.map(t => `<span class="mald-tag-pill elem-tag-${m.elemento}">${escHtml(t)}</span>`).join('')}</div>`
    : '';
  container.innerHTML = `
    <div class="mald-detail-top">
      ${iconHtml}
      <div class="mald-detail-info">
        <div class="mald-detail-name">${escHtml(m.nome)}</div>
        <div class="mald-detail-elem-row">
          <span class="mald-detail-elem-badge elem-${m.elemento}">${elemLabel}</span>
        </div>
        <div class="mald-detail-custo">${elemLabel} &#9675; ${m.custo || 0} COMPONENTES</div>
        <div class="mald-detect-badge ${detectClass}">${detectText}</div>
        ${tagsHtml}
      </div>
    </div>
    <div class="mald-detail-desc">${escHtml(m.descricao || '\u2014')}</div>
  `;
}

function maldBack(to) {
  sfx('close');
  if (to === 'elem') {
    _maldShowView('elem');
  } else if (to === 'grid' && malState.elemento) {
    maldSelectElement(malState.elemento);
  }
}

// GM ─────────────────────────────────────────────────────
async function renderGMMaldicoes() {
  await loadMaldicoes();
  const listEl = $('gm-mald-list');
  if (!listEl) return;
  if (!maldicoesData.length) {
    listEl.innerHTML = '<div class="gm-fitas-empty">Nenhuma maldi\u00e7\u00e3o cadastrada.</div>';
    return;
  }
  listEl.innerHTML = maldicoesData.map(m => {
    const thumbHtml = m.icone
      ? `<img class="gm-mald-thumb" src="${m.icone}" alt="" />`
      : `<div class="gm-mald-thumb-ph">&#9672;</div>`;
    return `<div class="gm-mald-item">
      ${thumbHtml}
      <div class="gm-mald-info">
        <div class="gm-mald-nome">${escHtml(m.nome)}</div>
        <div class="gm-mald-meta">${ELEM_LABELS[m.elemento] || m.elemento} &middot; CUSTO ${m.custo} &middot; ${m.detectavel ? 'DETECT.' : 'N.DETECT.'}</div>
      </div>
      <button class="gm-fita-del" onclick="App.gmRemoveMaldicao('${escHtml(m.id)}')">&#10005;</button>
    </div>`;
  }).join('');
}

function gmPreviewMaldIcon(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 256;
      const ar = img.width / img.height;
      canvas.width  = ar >= 1 ? MAX : Math.round(MAX * ar);
      canvas.height = ar >= 1 ? Math.round(MAX / ar) : MAX;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      _malIconBase64 = canvas.toDataURL('image/jpeg', 0.92);
      const prev = $('gm-mald-icone-preview');
      if (prev) { prev.src = _malIconBase64; prev.classList.remove('hidden'); }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function gmAddMaldicao() {
  const nome = ($('gm-mald-nome').value || '').trim();
  if (!nome) { showToast('Insira o nome da maldi\u00e7\u00e3o.', 'error'); return; }
  const elem       = $('gm-mald-elem').value;
  const custo      = parseInt($('gm-mald-custo').value) || 0;
  const detectavel = $('gm-mald-detect').checked;
  const descricao  = ($('gm-mald-desc').value || '').trim();
  const id = 'mald_' + Date.now();
  maldicoesData.push({ id, nome, elemento: elem, custo, detectavel, descricao, tags: [..._malTags], icone: _malIconBase64 || '' });
  try {
    await saveMaldicoes();
  } catch {
    maldicoesData.pop();
    return;
  }
  $('gm-mald-nome').value = '';
  $('gm-mald-custo').value = '';
  $('gm-mald-detect').checked = false;
  $('gm-mald-desc').value = '';
  $('gm-mald-tag-input').value = '';
  _malTags = [];
  _renderGMTagPills();
  _malIconBase64 = null;
  const prev = $('gm-mald-icone-preview');
  if (prev) { prev.src = ''; prev.classList.add('hidden'); }
  showToast('Maldiçao adicionada.', 'success');
  renderGMMaldicoes();
}

async function gmRemoveMaldicao(id) {
  maldicoesData = maldicoesData.filter(m => m.id !== id);
  await saveMaldicoes();
  showToast('Maldi\u00e7\u00e3o removida.', 'success', 1500);
  renderGMMaldicoes();
}

// ══════════════════════════════════════════════════════════
//  DOCUMENTS SYSTEM
// ══════════════════════════════════════════════════════════

// ── Docs state (released list) ───────────────────────────
async function loadCamoState() {
  if (firebaseOk) {
    try {
      const snap = await getDoc(doc(db, 'gameState', 'camos'));
      camoReleasedState = snap.exists() ? (snap.data().released || []) : [];
    } catch (e) {
      console.error('loadCamoState:', e);
      camoReleasedState = [];
    }
  } else {
    const raw = localStorage.getItem('vyper_camos_released');
    camoReleasedState = raw ? JSON.parse(raw) : [];
  }
}

async function saveCamoState() {
  if (firebaseOk) {
    try {
      await setDoc(doc(db, 'gameState', 'camos'), { released: camoReleasedState });
    } catch (e) {
      console.error('saveCamoState:', e);
      showToast('Erro ao salvar estado das camuflagens.', 'error');
    }
  } else {
    localStorage.setItem('vyper_camos_released', JSON.stringify(camoReleasedState));
  }
}

function renderGMCamuflagens() {
  const listEl = $('gm-camos-list');
  if (!listEl) return;
  listEl.innerHTML = CAMUFLAGENS.map(c => {
    const released = camoReleasedState.includes(c.id);
    return `<div class="gm-camo-item">
      <div class="gm-camo-icon" style="background:${c.cor}; color:${c.acento}; border-color:${c.acento}33">${escHtml(c.iconeChar)}</div>
      <div class="gm-camo-info">
        <div class="gm-camo-nome">${escHtml(c.nome)}</div>
        <div class="gm-camo-amb">${escHtml(c.ambiente)}</div>
        <div class="gm-camo-status ${released ? 'gm-camo-released' : 'gm-camo-locked'}">
          ${released ? '&#9670; DESBLOQUEADA' : '&#128274; BLOQUEADA'}
        </div>
      </div>
      <button class="gm-camo-toggle-btn ${released ? 'gm-camo-btn-lock' : 'gm-camo-btn-release'}"
              onclick="App.gmToggleCamoRelease('${c.id}')">
        ${released ? 'BLOQUEAR' : 'LIBERAR'}
      </button>
    </div>`;
  }).join('');
}

async function gmToggleCamoRelease(camoId) {
  const idx = camoReleasedState.indexOf(camoId);
  if (idx === -1) camoReleasedState.push(camoId);
  else camoReleasedState.splice(idx, 1);
  await saveCamoState();
  renderGMCamuflagens();
  showToast(idx === -1 ? 'Camuflagem desbloqueada para os jogadores.' : 'Camuflagem bloqueada.', 'success', 2000);
}

async function loadDocsState() {
  if (firebaseOk) {
    try {
      const ref  = doc(db, 'gameState', 'docs');
      const snap = await getDoc(ref);
      docsReleasedState = snap.exists() ? (snap.data().released || []) : [];
    } catch (e) {
      console.error('loadDocsState:', e);
      docsReleasedState = [];
    }
  } else {
    const raw = localStorage.getItem('vyper_docs_released');
    docsReleasedState = raw ? JSON.parse(raw) : [];
  }
  // Load which docs this player has already opened
  if (state.codename) {
    const readRaw = localStorage.getItem('vyper_docs_read_' + state.codename);
    docsReadSet = new Set(readRaw ? JSON.parse(readRaw) : []);
  }
  await loadDocInteractions();
  await loadDocCiphers();
  loadVideoTrans();
  loadEvidenceBoard();
}

function markDocRead(docId) {
  if (!docId || docsReadSet.has(docId)) return;
  docsReadSet.add(docId);
  if (state.codename) {
    localStorage.setItem('vyper_docs_read_' + state.codename, JSON.stringify([...docsReadSet]));
  }
}

async function saveDocsState() {
  if (firebaseOk) {
    try {
      await setDoc(doc(db, 'gameState', 'docs'), { released: docsReleasedState });
    } catch (e) {
      console.error('saveDocsState:', e);
      showToast('Erro ao salvar estado dos documentos.', 'error');
    }
  } else {
    localStorage.setItem('vyper_docs_released', JSON.stringify(docsReleasedState));
  }
}

// ── Player Docs Tab ───────────────────────────────────────
function renderDocsTab() {
  const listEl = $('docs-list');
  if (!listEl) return;

  if (DOCUMENTS.length === 0) {
    listEl.innerHTML = '<div class="docs-empty">Nenhum documento cadastrado.</div>';
    return;
  }

  listEl.innerHTML = DOCUMENTS.map(d => {
    const released = docsReleasedState.includes(d.id);
    const isNew    = released && !docsReadSet.has(d.id);
    const ann      = ((state.character?.docAnnotations || {})[d.id] || '');
    const annPrev  = ann.length > 55 ? ann.substring(0, 55) + '…' : ann;

    return `<div class="doc-card ${released ? 'doc-released' : 'doc-locked'}" ${released ? `onclick="App.openDocViewer('${d.id}')"` : ''}>
      <div class="doc-card-thumb">
        ${released
          ? `<img class="doc-thumb-img" src="${d.image}" alt="" />`
          : `<div class="doc-thumb-locked">&#128274;</div>`}
        ${isNew ? '<div class="doc-new-badge">NOVO</div>' : ''}
      </div>
      <div class="doc-card-info">
        <div class="doc-card-title">${released ? escHtml(d.title) : '[???]'}</div>
        <div class="doc-card-status ${released ? 'doc-status-ok' : 'doc-status-lock'}">
          ${released ? '&#9670; LIBERADO' : '&#8212; ACESSO RESTRITO'}
        </div>
        ${annPrev ? `<div class="doc-card-ann-preview">${escHtml(annPrev)}</div>` : ''}
      </div>
      ${released ? `<div class="doc-card-arrow">&#9658;</div>` : ''}
    </div>`;
  }).join('');
}

// ── Doc Viewer ────────────────────────────────────────────
const docViewerState = {
  docId: null, uvMode: false,
  scale: 1, minScale: 1, maxScale: 5,
  panX: 0, panY: 0,
  isDragging: false, lastX: 0, lastY: 0,
  lastDist: 0
};

function openDocViewer(docId) {
  sfx('open');
  const docDef = DOCUMENTS.find(d => d.id === docId);
  if (!docDef) return;

  const isFirstOpen = !docsReadSet.has(docId);

  docViewerState.docId  = docId;
  docViewerState.uvMode = false;
  docViewerState.scale  = 1;
  docViewerState.panX   = 0;
  docViewerState.panY   = 0;

  // Normal image
  const img = $('doc-image');
  if (img) { img.src = docDef.image; img.style.filter = ''; }

  // UV image layer — pre-load source
  const uvImg = $('doc-image-uv');
  if (uvImg) {
    uvImg.src = docDef.uvImage || docDef.image;
    uvImg.classList.remove('uv-active');
    uvImg.style.cssText = '';
  }

  const titleEl = $('doc-viewer-title');
  if (titleEl) titleEl.textContent = docDef.title;

  const uvBtn   = $('doc-uv-btn');
  const uvLight = $('doc-uv-light');
  if (uvBtn)   uvBtn.classList.remove('active');
  if (uvLight) uvLight.classList.add('hidden');

  const annInput = $('doc-ann-input');
  if (annInput) annInput.value = (state.character?.docAnnotations || {})[docId] || '';

  applyDocTransform();
  $('doc-viewer').classList.remove('hidden');
  closeDocInteractMode();
  hideDocCtxMenu();

  // Scanner animation
  const scanLine = $('doc-scan-line');
  if (scanLine) {
    scanLine.classList.remove('scanning');
    void scanLine.offsetWidth; // reflow
    scanLine.classList.add('scanning');
    setTimeout(() => scanLine.classList.remove('scanning'), 1000);
  }

  // CLASSIFICADO stamp on first open
  if (isFirstOpen) {
    const stampWrap = $('doc-classified-wrap');
    if (stampWrap) {
      stampWrap.classList.remove('hidden', 'stamp-fade');
      void stampWrap.offsetWidth;
      stampWrap.classList.add('stamp-show');
      setTimeout(() => {
        stampWrap.classList.add('stamp-fade');
        setTimeout(() => {
          stampWrap.classList.add('hidden');
          stampWrap.classList.remove('stamp-show', 'stamp-fade');
        }, 700);
      }, 1400);
    }
  }

  markDocRead(docId);
  _renderCipherPanel(docId);
  renderDocsTab();
}

function closeDocViewer() {
  sfx('close');
  $('doc-viewer').classList.add('hidden');
  closeDocInteractMode();
  hideDocCtxMenu();
  $('doc-interact-result')?.classList.add('hidden');
  docViewerState.docId  = null;
  docViewerState.uvMode = false;
  docViewerState.scale  = 1;
  docViewerState.panX   = 0;
  docViewerState.panY   = 0;
  const uvImg = $('doc-image-uv');
  if (uvImg) { uvImg.classList.remove('uv-active'); uvImg.style.cssText = ''; }
  const uvLight = $('doc-uv-light');
  if (uvLight) uvLight.classList.add('hidden');
  const uvBtn = $('doc-uv-btn');
  if (uvBtn) uvBtn.classList.remove('active');
  const body = $('doc-viewer-body');
  if (body) body.classList.remove('uv-cursor');
}

function toggleDocUV() {
  docViewerState.uvMode = !docViewerState.uvMode;
  const uvBtn   = $('doc-uv-btn');
  const uvLight = $('doc-uv-light');
  const uvImg   = $('doc-image-uv');
  const body    = $('doc-viewer-body');
  const docDef  = DOCUMENTS.find(d => d.id === docViewerState.docId);

  if (docViewerState.uvMode) {
    // Apply filter if no dedicated UV image
    if (uvImg) {
      if (!docDef?.uvImage) {
        uvImg.style.filter = 'invert(1) hue-rotate(200deg) saturate(6) brightness(1.6) contrast(1.6)';
      } else {
        uvImg.style.filter = '';
      }
      // Start torch off-screen until cursor moves
      uvImg.style.setProperty('--tx', '-999px');
      uvImg.style.setProperty('--ty', '-999px');
      uvImg.style.setProperty('--tr', '100px');
      uvImg.classList.add('uv-active');
    }
    if (uvBtn)   uvBtn.classList.add('active');
    if (uvLight) uvLight.classList.remove('hidden');
    if (body)    body.classList.add('uv-cursor');
  } else {
    if (uvImg) { uvImg.classList.remove('uv-active'); uvImg.style.filter = ''; }
    if (uvBtn)   uvBtn.classList.remove('active');
    if (uvLight) uvLight.classList.add('hidden');
    if (body)    body.classList.remove('uv-cursor');
  }
}

async function saveDocAnnotation() {
  const ann    = ($('doc-ann-input')?.value || '').trim();
  const docId  = docViewerState.docId;
  if (!docId || !state.character) return;

  if (!state.character.docAnnotations) state.character.docAnnotations = {};
  state.character.docAnnotations[docId] = ann;

  await persistChar({ [`docAnnotations.${docId}`]: ann });
  showToast('Anotação salva.', 'success', 1800);
  renderDocsTab();
}

// ── Zoom & Pan ────────────────────────────────────────────
function applyDocTransform() {
  const container = $('doc-zoom-container');
  if (!container) return;
  const { scale, panX, panY } = docViewerState;
  container.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

function _uvTorchTrack(cx, cy) {
  if (!docViewerState.uvMode) return;
  const uvImg = $('doc-image-uv');
  if (!uvImg) return;
  const rect = uvImg.getBoundingClientRect();
  if (rect.width === 0) return;
  // Convert viewport coords to element local coords (pre-transform)
  const scaleX = uvImg.offsetWidth  ? rect.width  / uvImg.offsetWidth  : 1;
  const scaleY = uvImg.offsetHeight ? rect.height / uvImg.offsetHeight : 1;
  const lx = (cx - rect.left) / scaleX;
  const ly = (cy - rect.top)  / scaleY;
  const tr = Math.round(100 / Math.max(scaleX, 0.1)); // torch r in local px ~100px viewport
  uvImg.style.setProperty('--tx', lx + 'px');
  uvImg.style.setProperty('--ty', ly + 'px');
  uvImg.style.setProperty('--tr', tr + 'px');
}

function initDocViewerEvents() {
  const body = $('doc-viewer-body');
  if (!body) return;

  // Mouse wheel zoom
  body.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.18 : 0.18;
    const { minScale, maxScale } = docViewerState;
    docViewerState.scale = Math.max(minScale, Math.min(maxScale, docViewerState.scale + delta));
    if (docViewerState.scale <= minScale) { docViewerState.panX = 0; docViewerState.panY = 0; }
    applyDocTransform();
  }, { passive: false });

  // Mouse move — drag pan + UV torch
  body.addEventListener('mousemove', (e) => {
    _uvTorchTrack(e.clientX, e.clientY);
    if (!docViewerState.isDragging) return;
    docViewerState.panX += e.clientX - docViewerState.lastX;
    docViewerState.panY += e.clientY - docViewerState.lastY;
    docViewerState.lastX = e.clientX;
    docViewerState.lastY = e.clientY;
    applyDocTransform();
  });

  body.addEventListener('mouseleave', () => {
    // Park torch off-screen
    const uvImg = $('doc-image-uv');
    if (uvImg) { uvImg.style.setProperty('--tx', '-999px'); uvImg.style.setProperty('--ty', '-999px'); }
  });

  // Mouse drag pan
  body.addEventListener('mousedown', (e) => {
    if (docViewerState.scale <= 1) return;
    docViewerState.isDragging = true;
    docViewerState.lastX = e.clientX;
    docViewerState.lastY = e.clientY;
    body.style.cursor = 'grabbing';
  });
  const stopDrag = () => { docViewerState.isDragging = false; if (!docViewerState.uvMode) body.style.cursor = ''; };
  body.addEventListener('mouseup', stopDrag);

  // Touch pinch zoom + single-finger pan + UV torch
  body.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      docViewerState.lastDist = Math.hypot(dx, dy);
    } else if (e.touches.length === 1) {
      if (docViewerState.scale > 1) {
        docViewerState.isDragging = true;
      }
      docViewerState.lastX = e.touches[0].clientX;
      docViewerState.lastY = e.touches[0].clientY;
      _uvTorchTrack(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  body.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx   = e.touches[0].clientX - e.touches[1].clientX;
      const dy   = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      docViewerState.scale = Math.max(
        docViewerState.minScale,
        Math.min(docViewerState.maxScale, docViewerState.scale * (dist / docViewerState.lastDist))
      );
      docViewerState.lastDist = dist;
      if (docViewerState.scale <= docViewerState.minScale) { docViewerState.panX = 0; docViewerState.panY = 0; }
      applyDocTransform();
    } else if (e.touches.length === 1) {
      _uvTorchTrack(e.touches[0].clientX, e.touches[0].clientY);
      if (docViewerState.isDragging) {
        docViewerState.panX += e.touches[0].clientX - docViewerState.lastX;
        docViewerState.panY += e.touches[0].clientY - docViewerState.lastY;
        docViewerState.lastX = e.touches[0].clientX;
        docViewerState.lastY = e.touches[0].clientY;
        applyDocTransform();
      }
    }
  }, { passive: false });

  body.addEventListener('touchend', () => {
    docViewerState.isDragging = false;
    docViewerState.lastDist   = 0;
    const uvImg = $('doc-image-uv');
    if (uvImg) { uvImg.style.setProperty('--tx', '-999px'); uvImg.style.setProperty('--ty', '-999px'); }
  });

  // Track mousedown position for click-vs-drag detection
  body.addEventListener('mousedown', (e) => {
    _docMouseDownPos = { x: e.clientX, y: e.clientY };
  });

  // Context menu on right-click
  body.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const viewer = $('doc-viewer');
    if (!viewer || viewer.classList.contains('hidden')) return;
    const vRect = viewer.getBoundingClientRect();
    const menu  = $('doc-ctx-menu');
    if (!menu) return;
    let mx = e.clientX - vRect.left;
    let my = e.clientY - vRect.top;
    menu.style.left = mx + 'px';
    menu.style.top  = my + 'px';
    menu.classList.remove('hidden');
  });

  // Click handler — hide menu + interact mode
  body.addEventListener('click', (e) => {
    hideDocCtxMenu();
    if (!_docInteractMode) return;
    if (_docMouseDownPos) {
      const dist = Math.hypot(e.clientX - _docMouseDownPos.x, e.clientY - _docMouseDownPos.y);
      if (dist > 10) return; // was a drag, not a click
    }
    handleDocInteractClick(e);
  });
}

// ── New Doc Alert ─────────────────────────────────────────
function showNewDocAlert(docId) {
  const docDef = DOCUMENTS.find(d => d.id === docId);
  if (!docDef) return;
  _newDocAlertId = docId;
  const thumb  = $('doc-new-thumb');
  const name   = $('doc-new-docname');
  const alert  = $('doc-new-alert');
  if (thumb)  thumb.src = docDef.image;
  if (name)   name.textContent = docDef.title;
  if (alert) {
    alert.classList.remove('hidden', 'doc-new-dismiss-out');
    void alert.offsetWidth;
    alert.classList.add('doc-new-visible');
  }
}

function dismissNewDocAlert(openDoc = false) {
  const alert = $('doc-new-alert');
  if (!alert) return;
  alert.classList.remove('doc-new-visible');
  alert.classList.add('doc-new-dismiss-out');
  const pendingId = _newDocAlertId;
  _newDocAlertId = null;
  setTimeout(() => {
    alert.classList.add('hidden');
    alert.classList.remove('doc-new-dismiss-out');
    if (openDoc && pendingId && docsReleasedState.includes(pendingId)) {
      // Switch to docs tab and open the viewer
      if (state.currentTab !== 'docs') {
        window.App.switchTab('docs');
        setTimeout(() => openDocViewer(pendingId), 300);
      } else {
        openDocViewer(pendingId);
      }
    }
  }, 400);
}

// ══════════════════════════════════════════════════════════
//  DOCUMENTOS — FOTOGRAFAR, FOTOS & INTERAGIR
// ══════════════════════════════════════════════════════════

// ── Sub-tabs de Documentos ────────────────────────────────
function docsSubtab(tab) {
  $('docs-panel-docs')?.classList.toggle('hidden', tab !== 'docs');
  $('docs-panel-fotos')?.classList.toggle('hidden', tab !== 'fotos');
  $('docs-panel-videos')?.classList.toggle('hidden', tab !== 'videos');
  $('docs-panel-quadro')?.classList.toggle('hidden', tab !== 'quadro');
  document.querySelectorAll('.docs-subtab-btn').forEach(b =>
    b.classList.toggle('docs-subtab-active', b.dataset.subtab === tab));
  if (tab === 'fotos') renderFotosGrid();
  if (tab === 'videos') renderVideoTransTab();
  if (tab === 'quadro') { _ebSetupBoardEvents(); setTimeout(renderEvidenceBoard, 60); }
}

// ── Fotos (Firestore subcollection + localStorage fallback) ─
const FOTOS_LS_KEY = () => `vyper_fotos_${state.codename || ''}`;
const MAX_FOTOS = 20;

async function _loadDocFotos() {
  if (firebaseOk && state.codename) {
    try {
      const snap = await getDocs(collection(db, 'characters', state.codename, 'fotos'));
      return snap.docs.map(d => d.data()).sort((a, b) => (a.ts || 0) - (b.ts || 0));
    } catch { /* fallback abaixo */ }
  }
  try { const r = localStorage.getItem(FOTOS_LS_KEY()); return r ? JSON.parse(r) : []; }
  catch { return []; }
}

async function renderFotosGrid() {
  const el = $('fotos-grid');
  if (!el) return;
  el.innerHTML = '<div class="docs-empty">Carregando fotos...</div>';
  const fotos = await _loadDocFotos();
  if (fotos.length === 0) {
    el.innerHTML = '<div class="docs-empty">Nenhuma foto tirada ainda.</div>';
    return;
  }
  el.innerHTML = fotos.slice().reverse().map(f => `
    <div class="foto-card">
      <img class="foto-thumb" src="${f.dataUrl}" alt="" />
      <div class="foto-info">
        <div class="foto-doc">${escHtml(f.docTitle || '?')}</div>
        <div class="foto-ts">${new Date(f.ts).toLocaleString('pt-BR',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'})}</div>
      </div>
      <button class="foto-del" onclick="App.deleteDocFoto('${f.id}')">&#10005;</button>
    </div>
  `).join('');
}

async function deleteDocFoto(id) {
  if (firebaseOk && state.codename) {
    try {
      await deleteDoc(doc(db, 'characters', state.codename, 'fotos', id));
      renderFotosGrid();
      return;
    } catch { /* fallback */ }
  }
  try {
    const r = localStorage.getItem(FOTOS_LS_KEY());
    const fotos = r ? JSON.parse(r) : [];
    localStorage.setItem(FOTOS_LS_KEY(), JSON.stringify(fotos.filter(f => f.id !== id)));
  } catch {}
  renderFotosGrid();
}

// ── Context menu ──────────────────────────────────────────
function hideDocCtxMenu() {
  $('doc-ctx-menu')?.classList.add('hidden');
}

// ── FOTOGRAFAR ────────────────────────────────────────────
function docCtxFotografar() {
  hideDocCtxMenu();
  const body   = $('doc-viewer-body');
  const canvas = $('doc-select-canvas');
  if (!body || !canvas) return;

  const bRect = body.getBoundingClientRect();
  canvas.width  = Math.round(bRect.width);
  canvas.height = Math.round(bRect.height);
  canvas.classList.remove('hidden');
  showToast('Arraste para selecionar a \u00e1rea (ESC = cancelar)', 'info', 5000);

  let sel = { active: false, sx: 0, sy: 0, ex: 0, ey: 0 };
  const ctx = canvas.getContext('2d');

  function drawRect() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,0.40)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const rx = Math.min(sel.sx, sel.ex), ry = Math.min(sel.sy, sel.ey);
    const rw = Math.abs(sel.ex - sel.sx), rh = Math.abs(sel.ey - sel.sy);
    if (rw < 2 || rh < 2) return;
    ctx.clearRect(rx, ry, rw, rh);
    ctx.strokeStyle = '#22aa55'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
    ctx.strokeRect(rx + 0.5, ry + 0.5, rw, rh);
    ctx.setLineDash([]); ctx.lineWidth = 2;
    const ml = 10;
    [[rx, ry], [rx+rw, ry], [rx, ry+rh], [rx+rw, ry+rh]].forEach(([cx, cy]) => {
      const dx = cx === rx ? 1 : -1, dy = cy === ry ? 1 : -1;
      ctx.beginPath(); ctx.moveTo(cx, cy + dy*ml); ctx.lineTo(cx, cy); ctx.lineTo(cx + dx*ml, cy);
      ctx.stroke();
    });
  }

  const onDown = (e) => { const r = canvas.getBoundingClientRect(); sel = { active:true, sx:e.clientX-r.left, sy:e.clientY-r.top, ex:e.clientX-r.left, ey:e.clientY-r.top }; };
  const onMove = (e) => { if (!sel.active) return; const r = canvas.getBoundingClientRect(); sel.ex=e.clientX-r.left; sel.ey=e.clientY-r.top; drawRect(); };
  const onUp = (e) => {
    if (!sel.active) return;
    sel.active = false;
    const r = canvas.getBoundingClientRect(); sel.ex=e.clientX-r.left; sel.ey=e.clientY-r.top;
    cleanup();
    const rx=Math.min(sel.sx,sel.ex), ry=Math.min(sel.sy,sel.ey),
          rw=Math.abs(sel.ex-sel.sx), rh=Math.abs(sel.ey-sel.sy);
    if (rw > 10 && rh > 10) _captureDocArea(rx, ry, rw, rh, bRect);
  };
  const onKey = (e) => { if (e.key === 'Escape') cleanup(); };

  function cleanup() {
    canvas.classList.add('hidden'); ctx.clearRect(0,0,canvas.width,canvas.height);
    canvas.removeEventListener('mousedown', onDown);
    canvas.removeEventListener('mousemove', onMove);
    canvas.removeEventListener('mouseup', onUp);
    document.removeEventListener('keydown', onKey);
  }

  canvas.addEventListener('mousedown', onDown);
  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseup', onUp);
  document.addEventListener('keydown', onKey);
}

function _captureDocArea(rx, ry, rw, rh, bodyRect) {
  const imgEl = $('doc-image');
  if (!imgEl || !imgEl.src) { showToast('Erro ao fotografar.', 'error', 2000); return; }

  const imgRect = imgEl.getBoundingClientRect();
  // Selection is in body-local coords; convert to viewport
  const vx = rx + bodyRect.left, vy = ry + bodyRect.top;
  // Clamp to image bounds
  const ix = Math.max(0, vx - imgRect.left);
  const iy = Math.max(0, vy - imgRect.top);
  const iw = Math.min(imgRect.width  - ix, rw - Math.max(0, imgRect.left - vx));
  const ih = Math.min(imgRect.height - iy, rh - Math.max(0, imgRect.top  - vy));
  if (iw <= 5 || ih <= 5) { showToast('Selecione uma \u00e1rea sobre o documento.', 'info', 2500); return; }

  // Map to natural image pixels
  const scaleX = imgEl.naturalWidth  / imgRect.width;
  const scaleY = imgEl.naturalHeight / imgRect.height;
  const out = document.createElement('canvas');
  out.width  = Math.round(iw * scaleX);
  out.height = Math.round(ih * scaleY);
  const ctx = out.getContext('2d');
  ctx.drawImage(imgEl, ix*scaleX, iy*scaleY, out.width, out.height, 0, 0, out.width, out.height);
  // Subtle scan-line tint
  ctx.fillStyle = 'rgba(0,255,100,0.04)';
  for (let y2 = 0; y2 < out.height; y2 += 4) ctx.fillRect(0, y2, out.width, 2);

  const dataUrl = out.toDataURL('image/jpeg', 0.88);
  const fotoId = 'foto_' + Date.now();
  const docDef = DOCUMENTS.find(d => d.id === docViewerState.docId);
  const foto = { id: fotoId, docId: docViewerState.docId, docTitle: docDef?.title || '?', dataUrl, ts: Date.now() };
  if (firebaseOk && state.codename) {
    setDoc(doc(db, 'characters', state.codename, 'fotos', fotoId), foto).catch(
      e => console.error('foto save:', e)
    );
  } else {
    try {
      const r = localStorage.getItem(FOTOS_LS_KEY());
      const fotos = r ? JSON.parse(r) : [];
      if (fotos.length >= MAX_FOTOS) fotos.shift();
      fotos.push(foto);
      localStorage.setItem(FOTOS_LS_KEY(), JSON.stringify(fotos));
    } catch {}
  }
  showToast('\uD83D\uDCF7 Foto salva na aba FOTOS!', 'success', 2200);
  sfx('select');
}

// ── INTERAGIR ─────────────────────────────────────────────
function docCtxInteragir() {
  hideDocCtxMenu();
  _docInteractMode = true;
  const body = $('doc-viewer-body');
  if (body) body.style.cursor = 'crosshair';
  showToast('\u00c9 poss\u00edvel interagir com partes do documento. Clique em uma \u00e1rea de interesse. (ESC = cancelar)', 'info', 6000);
}

function closeDocInteractMode() {
  _docInteractMode = false;
  const body = $('doc-viewer-body');
  if (body && !docViewerState.uvMode) body.style.cursor = '';
}

function handleDocInteractClick(e) {
  const imgEl = $('doc-image');
  if (!imgEl) return;
  closeDocInteractMode();
  const imgRect = imgEl.getBoundingClientRect();
  const fx = (e.clientX - imgRect.left) / imgRect.width;
  const fy = (e.clientY - imgRect.top)  / imgRect.height;
  // Must be within image bounds
  if (fx < 0 || fx > 1 || fy < 0 || fy > 1) { showToast('Nada de not\u00e1vel aqui.', 'info', 2000); return; }
  const zones = docInteractionsState[docViewerState.docId] || [];
  const hit   = zones.find(z => fx >= z.x && fx <= z.x+z.w && fy >= z.y && fy <= z.y+z.h);
  if (hit) {
    const lbl  = $('doc-interact-label');
    const txt  = $('doc-interact-text');
    const mod  = $('doc-interact-result');
    if (lbl) lbl.textContent = '\u29ed ' + (hit.label  || 'INTERA\u00c7\u00c3O');
    if (txt) txt.textContent = hit.result || '...';
    if (mod) mod.classList.remove('hidden');
    sfx('open');
  } else {
    showToast('Nada de not\u00e1vel aqui.', 'info', 2000);
  }
}

function closeDocInteract() {
  $('doc-interact-result')?.classList.add('hidden');
}

// ── Load/save doc interactions from Firestore ────────────
async function loadDocInteractions() {
  if (firebaseOk) {
    try {
      const snap = await getDoc(doc(db, 'gameState', 'docInteractions'));
      docInteractionsState = snap.exists() ? (snap.data().zones || {}) : {};
    } catch { docInteractionsState = {}; }
    // Live updates
    if (docInteractUnsub) docInteractUnsub();
    docInteractUnsub = onSnapshot(doc(db, 'gameState', 'docInteractions'), (snap) => {
      docInteractionsState = snap.exists() ? (snap.data().zones || {}) : {};
    });
  } else {
    try { const r = localStorage.getItem('vyper_doc_interactions'); docInteractionsState = r ? JSON.parse(r) : {}; }
    catch { docInteractionsState = {}; }
  }
}

// ── GM: Zone Editor ───────────────────────────────────────
function gmOpenZoneEditor(docId) {
  _gmZoneDocId = docId;
  const docDef = DOCUMENTS.find(d => d.id === docId);
  if (!docDef) return;
  $('gm-zone-modal-title').textContent = docDef.title + ' \u2014 ZONAS DE INTERA\u00c7\u00c3O';
  const imgEl = $('gm-zone-img');
  if (imgEl) {
    imgEl.onload = () => _gmSetupZoneCanvas();
    imgEl.src = docDef.image;
  }
  $('gm-zone-form-label').value  = '';
  $('gm-zone-form-result').value = '';
  _gmRenderZoneList();
  $('gm-zone-modal').classList.remove('hidden');
}

function _gmSetupZoneCanvas() {
  const canvas = $('gm-zone-canvas');
  const imgEl  = $('gm-zone-img');
  if (!canvas || !imgEl) return;
  const r = imgEl.getBoundingClientRect();
  canvas.width  = Math.round(r.width);
  canvas.height = Math.round(r.height);
  _gmClearZoneCanvas();
  _gmDrawZones();

  canvas.onmousedown = (e) => {
    const cr = canvas.getBoundingClientRect();
    _gmZoneSel = { active:true, startX:e.clientX-cr.left, startY:e.clientY-cr.top, endX:e.clientX-cr.left, endY:e.clientY-cr.top };
  };
  canvas.onmousemove = (e) => {
    if (!_gmZoneSel.active) return;
    const cr = canvas.getBoundingClientRect();
    _gmZoneSel.endX=e.clientX-cr.left; _gmZoneSel.endY=e.clientY-cr.top;
    _gmClearZoneCanvas(); _gmDrawZones(); _gmDrawSelRect();
  };
  canvas.onmouseup = (e) => {
    if (!_gmZoneSel.active) return;
    _gmZoneSel.active=false;
    const cr = canvas.getBoundingClientRect();
    _gmZoneSel.endX=e.clientX-cr.left; _gmZoneSel.endY=e.clientY-cr.top;
    _gmClearZoneCanvas(); _gmDrawZones(); _gmDrawSelRect();
    $('gm-zone-form-label')?.focus();
  };
}

function _gmClearZoneCanvas() {
  const c = $('gm-zone-canvas'); if (!c) return;
  c.getContext('2d').clearRect(0, 0, c.width, c.height);
}

function _gmDrawZones() {
  const c = $('gm-zone-canvas'); if (!c) return;
  const ctx = c.getContext('2d');
  (docInteractionsState[_gmZoneDocId] || []).forEach(z => {
    const px=z.x*c.width, py=z.y*c.height, pw=z.w*c.width, ph=z.h*c.height;
    ctx.fillStyle='rgba(34,170,85,0.14)'; ctx.fillRect(px,py,pw,ph);
    ctx.strokeStyle='#22aa55cc'; ctx.lineWidth=1.5; ctx.setLineDash([4,3]);
    ctx.strokeRect(px+0.5,py+0.5,pw,ph); ctx.setLineDash([]);
    ctx.fillStyle='#22aa55'; ctx.font='10px monospace';
    ctx.fillText(z.label, px+3, py+12);
  });
}

function _gmDrawSelRect() {
  const c = $('gm-zone-canvas'); if (!c) return;
  const {startX:sx,startY:sy,endX:ex,endY:ey} = _gmZoneSel;
  const rx=Math.min(sx,ex), ry=Math.min(sy,ey), rw=Math.abs(ex-sx), rh=Math.abs(ey-sy);
  if (rw<5||rh<5) return;
  const ctx=c.getContext('2d');
  ctx.fillStyle='rgba(255,180,0,0.16)'; ctx.fillRect(rx,ry,rw,rh);
  ctx.strokeStyle='#ffbb00cc'; ctx.lineWidth=1.5; ctx.setLineDash([5,3]);
  ctx.strokeRect(rx+0.5,ry+0.5,rw,rh); ctx.setLineDash([]);
}

function _gmRenderZoneList() {
  const el = $('gm-zone-list'); if (!el) return;
  const zones = docInteractionsState[_gmZoneDocId] || [];
  if (!zones.length) { el.innerHTML='<div class="gm-zone-empty">Nenhuma zona definida.</div>'; return; }
  el.innerHTML = zones.map(z => `
    <div class="gm-zone-item">
      <span class="gm-zone-lbl">\u29ed ${escHtml(z.label)}</span>
      <span class="gm-zone-pos">[${Math.round(z.x*100)}%,${Math.round(z.y*100)}% \u00d7 ${Math.round(z.w*100)}%,${Math.round(z.h*100)}%]</span>
      <button class="gm-zone-del" onclick="App.gmRemoveDocZone('${z.id}')">&#10005;</button>
    </div>
  `).join('');
}

async function gmAddDocZone() {
  const label  = ($('gm-zone-form-label')?.value  || '').trim();
  const result = ($('gm-zone-form-result')?.value || '').trim();
  if (!label || !result) { showToast('Preencha o r\u00f3tulo e o resultado.', 'error', 2000); return; }
  const c = $('gm-zone-canvas');
  const {startX:sx,startY:sy,endX:ex,endY:ey} = _gmZoneSel;
  const rx=Math.min(sx,ex), ry=Math.min(sy,ey), rw=Math.abs(ex-sx), rh=Math.abs(ey-sy);
  if (!c || rw < 8 || rh < 8) { showToast('Desenhe um ret\u00e2ngulo no documento primeiro.', 'error', 2500); return; }
  const zone = { id:'zone_'+Date.now(), label, result, x:rx/c.width, y:ry/c.height, w:rw/c.width, h:rh/c.height };
  if (!docInteractionsState[_gmZoneDocId]) docInteractionsState[_gmZoneDocId] = [];
  docInteractionsState[_gmZoneDocId].push(zone);
  await _gmSaveDocInteractions();
  $('gm-zone-form-label').value=''; $('gm-zone-form-result').value='';
  _gmZoneSel={ active:false, startX:0, startY:0, endX:0, endY:0 };
  _gmClearZoneCanvas(); _gmDrawZones(); _gmRenderZoneList();
  showToast('Zona adicionada!', 'success', 1800);
}

async function gmRemoveDocZone(zoneId) {
  if (!_gmZoneDocId || !docInteractionsState[_gmZoneDocId]) return;
  docInteractionsState[_gmZoneDocId] = docInteractionsState[_gmZoneDocId].filter(z => z.id !== zoneId);
  await _gmSaveDocInteractions();
  _gmClearZoneCanvas(); _gmDrawZones(); _gmRenderZoneList();
}

async function _gmSaveDocInteractions() {
  if (firebaseOk) {
    await setDoc(doc(db, 'gameState', 'docInteractions'), { zones: docInteractionsState });
  } else {
    localStorage.setItem('vyper_doc_interactions', JSON.stringify(docInteractionsState));
  }
}

function gmCloseZoneModal() {
  $('gm-zone-modal')?.classList.add('hidden');
  _gmZoneDocId = null;
  _gmZoneSel = { active:false, startX:0, startY:0, endX:0, endY:0 };
}

// ──────────────────────────────────────────────────────────
//  DOC CIPHER SYSTEM
// ──────────────────────────────────────────────────────────

// Vigenère cipher — letras A-Z, preserva espaços/números/pontuação
function _vigProcess(text, key, encode) {
  const K = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (!K.length) return text.toUpperCase();
  let ki = 0;
  return text.toUpperCase().split('').map(ch => {
    if (ch >= 'A' && ch <= 'Z') {
      const shift = K.charCodeAt(ki % K.length) - 65;
      ki++;
      let c = ch.charCodeAt(0) - 65;
      c = encode ? (c + shift) % 26 : (c - shift + 26) % 26;
      return String.fromCharCode(c + 65);
    }
    return ch;
  }).join('');
}

function _getCipherDeciphered() {
  try { return JSON.parse(localStorage.getItem('vyper_deciphered_' + (state.codename || '')) || '{}'); }
  catch { return {}; }
}
function _setCipherDeciphered(obj) {
  localStorage.setItem('vyper_deciphered_' + (state.codename || ''), JSON.stringify(obj));
}

async function loadDocCiphers() {
  if (firebaseOk) {
    try {
      const snap = await getDoc(doc(db, 'gameState', 'docCiphers'));
      docCiphersState = snap.exists() ? (snap.data().ciphers || {}) : {};
    } catch { docCiphersState = {}; }
    if (docCiphersUnsub) docCiphersUnsub();
    docCiphersUnsub = onSnapshot(doc(db, 'gameState', 'docCiphers'), (snap) => {
      docCiphersState = snap.exists() ? (snap.data().ciphers || {}) : {};
      if (docViewerState.docId) _renderCipherPanel(docViewerState.docId);
      if (state.role === 'gm') renderGMDocs();
    });
  } else {
    try { const r = localStorage.getItem('vyper_doc_ciphers'); docCiphersState = r ? JSON.parse(r) : {}; }
    catch { docCiphersState = {}; }
  }
}

function _renderCipherPanel(docId) {
  const panel = $('doc-cipher-panel');
  if (!panel) return;
  const cipher = docCiphersState[docId];
  if (!cipher || !cipher.text || !cipher.key) {
    panel.classList.add('hidden');
    return;
  }
  panel.classList.remove('hidden');
  const ciphertextEl = $('doc-cipher-ciphertext');
  const plaintextEl  = $('doc-cipher-plaintext');
  const inputRow     = $('doc-cipher-input-row');
  const badge        = $('doc-cipher-badge');
  const feedback     = $('doc-cipher-feedback');
  if (ciphertextEl) ciphertextEl.textContent = _vigProcess(cipher.text, cipher.key, true);
  if (feedback) feedback.textContent = '';
  const alreadyDone = !!_getCipherDeciphered()[docId];
  if (alreadyDone) {
    if (ciphertextEl) ciphertextEl.classList.add('hidden');
    if (plaintextEl)  { plaintextEl.textContent = cipher.text; plaintextEl.classList.remove('hidden'); }
    if (inputRow)     inputRow.classList.add('hidden');
    if (badge)        badge.classList.remove('hidden');
  } else {
    if (ciphertextEl) ciphertextEl.classList.remove('hidden');
    if (plaintextEl)  plaintextEl.classList.add('hidden');
    if (inputRow)     inputRow.classList.remove('hidden');
    if (badge)        badge.classList.add('hidden');
    const inp = $('doc-cipher-key-input');
    if (inp) { inp.value = ''; inp.disabled = false; }
  }
}

function docTryDecipher() {
  const docId  = docViewerState.docId;
  const cipher = docCiphersState[docId];
  if (!cipher) return;
  const inp      = $('doc-cipher-key-input');
  const feedback = $('doc-cipher-feedback');
  const attempt  = (inp?.value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const correct  = (cipher.key || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!attempt) {
    if (feedback) { feedback.textContent = '[ INSIRA A CHAVE ]'; feedback.className = 'doc-cipher-feedback doc-cipher-fail'; }
    return;
  }
  if (attempt !== correct) {
    if (feedback) { feedback.textContent = '[ CHAVE INCORRETA ]'; feedback.className = 'doc-cipher-feedback doc-cipher-fail'; }
    if (inp) { inp.classList.add('cipher-shake'); setTimeout(() => inp.classList.remove('cipher-shake'), 400); }
    return;
  }
  // Chave correta — animar decifragem
  if (feedback) { feedback.textContent = '[ DECIFRAÇÃO BEM-SUCEDIDA ]'; feedback.className = 'doc-cipher-feedback doc-cipher-ok'; }
  if (inp) inp.disabled = true;
  const ciphertextEl = $('doc-cipher-ciphertext');
  const plaintextEl  = $('doc-cipher-plaintext');
  const inputRow     = $('doc-cipher-input-row');
  const badge        = $('doc-cipher-badge');
  const finalText = cipher.text.toUpperCase();
  const animDuration = Math.min(finalText.length * 30 + 600, 4000);
  _decodeText('doc-cipher-ciphertext', finalText, 28);
  setTimeout(() => {
    if (plaintextEl)  { plaintextEl.textContent = cipher.text; plaintextEl.classList.remove('hidden'); }
    if (ciphertextEl) ciphertextEl.classList.add('hidden');
    if (inputRow)     inputRow.classList.add('hidden');
    if (badge)        badge.classList.remove('hidden');
    const dec = _getCipherDeciphered();
    dec[docId] = true;
    _setCipherDeciphered(dec);
    sfx('select');
  }, animDuration);
}

function gmOpenCipherEditor(docId) {
  _gmCipherDocId = docId;
  const docDef = DOCUMENTS.find(d => d.id === docId);
  const modal  = $('gm-cipher-modal');
  if (!modal) return;
  const title  = $('gm-cipher-modal-title');
  if (title) title.textContent = 'CIFRA — ' + (docDef?.title || docId);
  const existing = docCiphersState[docId];
  const textEl = $('gm-cipher-text');
  const keyEl  = $('gm-cipher-key');
  if (textEl) textEl.value = existing?.text || '';
  if (keyEl)  keyEl.value  = existing?.key  || '';
  gmCipherPreviewUpdate();
  modal.classList.remove('hidden');
}

function gmCloseCipherEditor() {
  $('gm-cipher-modal')?.classList.add('hidden');
  _gmCipherDocId = null;
}

function gmCipherPreviewUpdate() {
  const text = ($('gm-cipher-text')?.value || '').trim();
  const key  = ($('gm-cipher-key')?.value  || '').trim();
  const prev = $('gm-cipher-preview');
  if (!prev) return;
  prev.textContent = (text && key) ? _vigProcess(text, key, true) : '—';
}

async function gmSaveCipher() {
  if (!_gmCipherDocId) return;
  const text = ($('gm-cipher-text')?.value || '').trim();
  const key  = ($('gm-cipher-key')?.value  || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!text || !key) { showToast('Preencha a mensagem e a chave.', 'error'); return; }
  docCiphersState[_gmCipherDocId] = { text, key };
  await _gmSaveDocCiphers();
  showToast('Cifra salva.', 'success', 1800);
  gmCloseCipherEditor();
  renderGMDocs();
}

async function gmClearCipher() {
  if (!_gmCipherDocId) return;
  delete docCiphersState[_gmCipherDocId];
  await _gmSaveDocCiphers();
  showToast('Cifra removida.', 'ok', 1800);
  gmCloseCipherEditor();
  renderGMDocs();
}

async function _gmSaveDocCiphers() {
  if (firebaseOk) {
    await setDoc(doc(db, 'gameState', 'docCiphers'), { ciphers: docCiphersState });
  } else {
    localStorage.setItem('vyper_doc_ciphers', JSON.stringify(docCiphersState));
  }
}

// ── GM Docs Panel ─────────────────────────────────────────
function renderGMDocs() {
  const listEl = $('gm-docs-list');
  if (!listEl) return;
  listEl.innerHTML = DOCUMENTS.map(d => {
    const released  = docsReleasedState.includes(d.id);
    const zoneCount = docInteractionsState[d.id]?.length || 0;
    const hasCipher = !!docCiphersState[d.id];
    return `<div class="gm-camo-item">
      <div class="gm-camo-info">
        <div class="gm-camo-nome">${escHtml(d.title)}</div>
        <div class="gm-camo-status ${released ? 'gm-camo-released' : 'gm-camo-locked'}">
          ${released ? '&#9670; LIBERADO' : '&#128274; BLOQUEADO'}
        </div>
      </div>
      <button class="gm-doc-zones-btn"
              onclick="App.gmOpenZoneEditor('${d.id}')">&#x2B21; ZONAS${zoneCount > 0 ? ' (' + zoneCount + ')' : ''}</button>
      <button class="gm-doc-cipher-btn${hasCipher ? ' gm-doc-cipher-active' : ''}"
              onclick="App.gmOpenCipherEditor('${d.id}')">&#9619; CIFRA${hasCipher ? ' &#10003;' : ''}</button>
      <button class="gm-camo-toggle-btn ${released ? 'gm-camo-btn-lock' : 'gm-camo-btn-release'}"
              onclick="App.gmToggleDocRelease('${d.id}')">
        ${released ? 'BLOQUEAR' : 'LIBERAR'}
      </button>
    </div>`;
  }).join('');
}

const MISSAO_DETAILS = [
  {
    tag:      'OBJ. 01',
    action:   'NEUTRALIZAR',
    title:    'FILHOS DO ARCANJO',
    threat:   '◆◆◆◆◇',
    status:   'ATIVO',
    priority: 'ALPHA',
    summary:
      'Facção religiosa extremista operando nas sombras do submundo. ' +
      'Acredita-se que seus membros infiltraram estruturas de segurança e política local. ' +
      'São a espinha dorsal logística e ideológica da OPERAÇÃO HERESIA.\n\n' +
      '[ PLACEHOLDER — aguardando briefing completo do controle central. ]',
    intel:
      '— Liderança desconhecida. Possível figura religiosa de alto escalão.\n' +
      '— Estimativa: 40–80 operativos ativos na região.\n' +
      '— Utilizam locais de culto como pontos de encontro e armazenamento.\n\n' +
      '[ PLACEHOLDER — dados adicionais classificados. ]',
    notes:
      '[ Nenhuma nota de campo registrada. ]',
  },
  {
    tag:      'OBJ. 02',
    action:   'ELIMINAR',
    title:    'O HOMEM QUE VENDEU O MUNDO',
    threat:   '◆◆◆◆◆◆◆◆◆',
    status:   'LOCALIZADO',
    priority: 'ALPHA',
    summary:
      'Identidade real desconhecida. Codinome dado graças a sua fama como figura de relevancia militar. Trata-se do intermediário principal entre ' +
      'os Filhos do Arcanjo e forças externas ainda não identificadas.\n\n' +
      'O soldado lendário, é considerado um alvo de extremo perigo, toda cautela é necessária para sua abordagem e neutralização. ' +
      'Retornou a ativa após ser declarado morto em campo.\n'+
      'Eliminação autorizada, mas a captura para interrogatório é preferível caso as condições permitam.\n\n' +
      '[ — aguardando briefing completo do controle central. ]',
    intel:
      '— Última localização confirmada: setor industrial, zona norte.\n' +
      '— Possui escolta armada de alto nível de treinamento.\n' +
      '— Conhece a identidade de pelo menos dois agentes Vyper ativos.\n\n' +
      '[ — CLASSIFICADO. ]',
    notes:
      '[ Nenhuma nota de campo registrada. ]',
  },
  {
    tag:      'OBJ. 03',
    action:   'ELIMINAR',
    title:    'GENERAL HUSK',
    threat:   '◆◆◆◆◆◆◆',
    status:   'ATIVO',
    priority: 'OMEGA',
    summary:
      'Ex-oficial militar de alta patente, afastado por atividades não sancionadas. ' +
      'Atualmente lidera uma força paramilitar que presta serviços aos Filhos do Arcanjo. ' +
      'Considerado alvo de máxima periculosidade — eliminação autorizada em qualquer contexto.\n\n' +
      '[ PLACEHOLDER — aguardando briefing completo do controle central. ]',
    intel:
      '— Portador de implantes cibernéticos de combate — capacidades aumentadas.\n' +
      '— Histórico: 23 anos de serviço ativo, especialização em guerra urbana.\n' +
      '— Última aparição confirmada: 72 horas atrás, reunião com alvo OBJ. 02.\n\n' +
      '[ — dados adicionais classificados. ]',
    notes:
      '[ Seus implantes cibernéticos não foram identificados pela equipe de inteligencia, então não sabemos do potencial de sua cibernética. ]',
  },
];

function openMissaoDetail(idx) {
  sfx('open');
  const d = MISSAO_DETAILS[idx];
  if (!d) return;

  $('mdp-op-tag').textContent   = d.tag;
  $('mdp-action').textContent   = d.action;
  $('mdp-title').textContent    = d.title;
  $('mdp-threat').textContent   = d.threat;
  $('mdp-priority').textContent = d.priority;

  const statusEl = $('mdp-status');
  statusEl.textContent = d.status;
  statusEl.className   = 'mdp-meta-val';
  if (d.status === 'ATIVO' || d.status === 'LOCALIZADO') statusEl.classList.add('mdp-status-active');
  if (d.status === 'ELIMINADO' || d.status === 'NEUTRO')  statusEl.classList.add('mdp-status-done');

  // Render text with newlines as <br>
  const renderText = (id, text) => {
    const el = $(id);
    el.innerHTML = text.split('\n').map(l => l ? `<span>${l}</span>` : '<br>').join('<br>');
  };
  renderText('mdp-summary', d.summary);
  renderText('mdp-intel',   d.intel);
  renderText('mdp-notes',   d.notes);

  // Reset scroll and animate in
  const panel = $('missao-detail-panel');
  const body  = $('mdp-body');
  if (body) body.scrollTop = 0;
  panel.classList.remove('mdp-out');
  panel.classList.add('mdp-open');
}

function closeMissaoDetail() {
  sfx('close');
  const panel = $('missao-detail-panel');
  panel.classList.add('mdp-out');
  setTimeout(() => {
    panel.classList.remove('mdp-open', 'mdp-out');
  }, 340);
}


function _decodeText(elId, finalText, charDelay) {
  const el = $(elId);
  if (!el) return;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!%&';
  let revealed = 0;
  function step() {
    let display = '';
    for (let i = 0; i < finalText.length; i++) {
      if (i < revealed) {
        display += finalText[i];
      } else if (finalText[i] === ' ') {
        display += ' ';
      } else {
        display += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    el.textContent = display;
    if (revealed <= finalText.length) {
      revealed++;
      setTimeout(step, charDelay);
    } else {
      el.textContent = finalText;
    }
  }
  step();
}

function renderMissaoAtualText() {
  const el = $('missao-atual-text');
  if (!el) return;
  if (missaoText && missaoText.trim()) {
    el.innerHTML = '';
    // Split by newlines and render as paragraphs
    missaoText.trim().split('\n').forEach(line => {
      const p = document.createElement('p');
      p.style.margin = '0 0 6px';
      p.textContent = line;
      el.appendChild(p);
    });
  } else {
    el.innerHTML = '<span class="missao-awaiting">[ AGUARDANDO TRANSMISSÃO... ]</span>';
  }
}

function enterMissaoTab() {
  const content = $('missao-content');
  const boot    = $('missao-boot');
  if (!content || !boot) return;

  // Após a primeira visita na sessão: pula a animação de boot
  if (_missaoBootDone) {
    content.classList.add('m-revealed');
    document.querySelectorAll('.missao-obj-item').forEach(el => el.classList.add('m-obj-show'));
    const frame = $('missao-target-frame');
    if (frame) frame.classList.add('m-img-show');
    const atual = $('missao-atual-wrap');
    if (atual) atual.classList.add('m-atual-show');
    renderMissaoAtualText();
    return;
  }
  _missaoBootDone = true;

  // Reset animation state
  content.classList.remove('m-revealed');
  document.querySelectorAll('.missao-obj-item').forEach(el => el.classList.remove('m-obj-show'));
  const frame = $('missao-target-frame');
  if (frame) frame.classList.remove('m-img-show');
  const atual = $('missao-atual-wrap');
  if (atual) atual.classList.remove('m-atual-show');

  // Show boot overlay
  boot.classList.remove('hidden');
  boot.classList.add('m-boot-in');

  // Status messages sequence
  const statuses = [
    'VERIFICANDO CREDENCIAIS...',
    'ACESSANDO SERVIDOR VYPER...',
    'DESCRIPTOGRAFANDO DOSSIE...',
    'CARREGANDO BRIEFING...'
  ];
  const statusEl = $('m-boot-status');
  let idx = 0;
  const statusInterval = setInterval(() => {
    idx++;
    if (idx < statuses.length && statusEl) statusEl.textContent = statuses[idx];
    else clearInterval(statusInterval);
  }, 550);

  // After boot: fade out, reveal mission
  setTimeout(() => {
    boot.classList.add('m-boot-out');
    setTimeout(() => {
      clearInterval(statusInterval);
      boot.classList.add('hidden');
      boot.classList.remove('m-boot-in', 'm-boot-out');
      content.classList.add('m-revealed');
      // Decode title
      _decodeText('missao-op-title', 'HERESIA', 55);
      // Stagger objectives
      [0, 1, 2].forEach(i => {
        setTimeout(() => {
          const el = $('mobj-' + i);
          if (el) el.classList.add('m-obj-show');
        }, 500 + i * 340);
      });
      // Image reveal
      setTimeout(() => { if (frame) frame.classList.add('m-img-show'); }, 400);
      // MISSÃO ATUAL section
      setTimeout(() => {
        if (atual) atual.classList.add('m-atual-show');
        renderMissaoAtualText();
      }, 1500);
    }, 500);
  }, 2400);
}

async function loadMissaoTextGM() {
  if (!firebaseOk) return;
  try {
    const snap = await getDoc(doc(db, 'gameState', 'mission'));
    const text = snap.exists() ? (snap.data().text || '') : '';
    const inp = $('gm-missao-input');
    if (inp) inp.value = text;
  } catch (e) {
    console.error('loadMissaoTextGM:', e);
  }
}

async function gmSaveMissaoText() {
  const inp = $('gm-missao-input');
  if (!inp) return;
  const text = inp.value.trim();
  if (!firebaseOk) { showToast('Firebase offline.', 'error'); return; }
  try {
    await setDoc(doc(db, 'gameState', 'mission'), { text });
    showToast('Transmissão enviada.', 'ok');
  } catch (e) {
    console.error('gmSaveMissaoText:', e);
    showToast('Erro ao transmitir.', 'error');
  }
}

// ──────────────────────────────────────────────────────────
//  MISSÃO TAB
// ──────────────────────────────────────────────────────────

async function gmToggleDocRelease(docId) {
  const idx = docsReleasedState.indexOf(docId);
  if (idx === -1) {
    docsReleasedState.push(docId);
  } else {
    docsReleasedState.splice(idx, 1);
  }
  await saveDocsState();
  renderGMDocs();
  showToast(idx === -1 ? 'Documento liberado para os jogadores.' : 'Documento bloqueado.', 'success', 2000);
}

// ══════════════════════════════════════════════════════════
//  QUADRO DE EVIDÊNCIAS
// ══════════════════════════════════════════════════════════

function loadEvidenceBoard() {
  if (!firebaseOk) return;
  if (evidenceBoardUnsub) evidenceBoardUnsub();
  evidenceBoardUnsub = onSnapshot(doc(db, 'gameState', 'evidenceBoard'), (snap) => {
    evidenceBoardState = snap.exists() ? snap.data() : { items: [], connections: [] };
    if (!Array.isArray(evidenceBoardState.items))       evidenceBoardState.items = [];
    if (!Array.isArray(evidenceBoardState.connections)) evidenceBoardState.connections = [];
    // Migração: corrige imageUrls antigos que não tinham o prefixo 'imagens/'
    evidenceBoardState.items.forEach(item => {
      if (item.imageUrl && item.imageUrl.startsWith('documentos/')) {
        item.imageUrl = 'imagens/' + item.imageUrl;
      }
    });
    if (_ebDragging) {
      // não recria DOM durante arrasto local — apenas atualiza conexões
      _ebRenderConnections();
    } else {
      renderEvidenceBoard();
      if (state.role === 'gm') gmRenderEBList();
    }
  });
  _ebLoadLiveDrag();
  _ebLoadPresence();
}

function renderEvidenceBoard() {
  const board    = $('evidence-board');
  const svg      = $('evidence-svg');
  const itemsEl  = $('evidence-items');
  if (!board || !svg || !itemsEl) return;

  // ensure content wrapper exists and transform is applied
  let content = $('eb-content');
  if (!content) {
    content = document.createElement('div');
    content.id = 'eb-content'; content.className = 'eb-content';
    board.insertBefore(content, board.firstChild);
    // move svg and items into content
    content.appendChild(svg);
    content.appendChild(itemsEl);
  }
  _ebApplyTransform();

  _ebSetupBoardEvents();
  itemsEl.innerHTML = '';

  const PIN_COLORS = { document: '#993300', nota: '#cc9900', suspeito: '#2244aa', foto: '#cc2222' };

  evidenceBoardState.items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'eb-card eb-card-' + item.type;
    el.id = 'eb-card-' + item.id;
    el.style.left      = item.x + '%';
    el.style.top       = item.y + '%';
    el.style.transform = `rotate(${item.rotation || 0}deg)`;
    el.dataset.id = item.id;
    if (_ebConnectMode && _ebConnectFrom === item.id) el.classList.add('eb-card-source');

    const pinColor = item.pinColor || PIN_COLORS[item.type] || '#cc3333';

    if (item.type === 'foto' && item.imageUrl) {
      el.innerHTML = `
        <div class="eb-pin" style="background:${pinColor}"></div>
        <img class="eb-card-img" src="${escHtml(item.imageUrl)}" alt="" draggable="false" />
        <div class="eb-card-caption">${escHtml(item.title)}</div>`;
    } else if (item.type === 'document') {
      el.innerHTML = `
        <div class="eb-pin" style="background:${pinColor}"></div>
        <div class="eb-card-doc-stamp">DOC</div>
        <div class="eb-card-title">${escHtml(item.title)}</div>
        ${item.imageUrl ? `<img class="eb-card-doc-thumb" src="${escHtml(item.imageUrl)}" alt="" draggable="false" />` : ''}
        ${item.docId ? `<button class="eb-card-open-btn" onclick="App.ebOpenDoc('${escHtml(item.docId)}')">ABRIR &#9658;</button>` : ''}`;
    } else if (item.type === 'nota') {
      el.innerHTML = `
        <div class="eb-pin" style="background:${pinColor}"></div>
        <div class="eb-nota-lines"></div>
        <div class="eb-card-nota-title">${escHtml(item.title)}</div>
        ${item.content ? `<div class="eb-card-nota-text">${escHtml(item.content)}</div>` : ''}`;
    } else if (item.type === 'suspeito') {
      el.innerHTML = `
        <div class="eb-pin" style="background:${pinColor}"></div>
        <div class="eb-card-suspect-header">SUSPEITO</div>
        ${item.imageUrl
          ? `<div class="eb-card-suspect-photo"><img src="${escHtml(item.imageUrl)}" alt="" draggable="false" /></div>`
          : `<div class="eb-card-suspect-photo eb-suspect-no-photo">?</div>`}
        <div class="eb-card-suspect-name">${escHtml(item.title)}</div>
        ${item.content ? `<div class="eb-card-suspect-role">${escHtml(item.content)}</div>` : ''}`;
    } else if (item.type === 'pasta') {
      const ps = _ebPastaState[item.id] || { open: false, page: 0 };
      const pages = Array.isArray(item.pages) && item.pages.length ? item.pages : [{title:'SEM CONTEÚDE', text:''}];
      const curPage = pages[Math.min(ps.page, pages.length - 1)];
      if (ps.open) el.classList.add('eb-pasta-open');
      el.innerHTML = `
        <div class="eb-pin" style="background:${pinColor}"></div>
        <div class="eb-pasta-inner">
          <div class="eb-pasta-front">
            <div class="eb-pasta-classified">CLASSIFICADO</div>
            <div class="eb-pasta-title">${escHtml(item.title)}</div>
            <div class="eb-pasta-dots"></div>
            ${item.content ? `<div class="eb-pasta-code">${escHtml(item.content)}</div><div class="eb-pasta-dots"></div>` : ''}
            <div class="eb-pasta-hint">► abrir</div>
          </div>
          <div class="eb-pasta-back">
            <div class="eb-pasta-back-header">${escHtml(curPage.title || '')}</div>
            <div class="eb-pasta-back-text">${escHtml(curPage.text || '')}</div>
            ${pages.length > 1 ? `
            <div class="eb-pasta-nav">
              <button class="eb-pasta-nav-btn" onmousedown="event.stopPropagation()" onclick="App.ebPastaPage('${escHtml(item.id)}',-1,event)">◄</button>
              <span class="eb-pasta-page-num">${Math.min(ps.page, pages.length-1)+1} / ${pages.length}</span>
              <button class="eb-pasta-nav-btn" onmousedown="event.stopPropagation()" onclick="App.ebPastaPage('${escHtml(item.id)}',1,event)">►</button>
            </div>` : '<div class="eb-pasta-close-hint">▾ fechar</div>'}
          </div>
        </div>`;
    }

    el.addEventListener('mousedown', (e) => ebMouseDown(e, item.id));
    itemsEl.appendChild(el);
  });

  _ebRenderConnections();
  _ebApplyLiveDragPositions();
  _ebRenderCursors();
}

function _ebApplyTransform() {
  const content = $('eb-content');
  if (!content) return;
  content.style.transform = `translate(${_ebPan.x}px,${_ebPan.y}px) scale(${_ebZoom})`;
  content.style.transformOrigin = '0 0';
}

function ebZoomIn()    { _ebChangeZoom( 0.15); }
function ebZoomOut()   { _ebChangeZoom(-0.15); }
function ebZoomReset() { _ebZoom = 1; _ebPan = {x:0,y:0}; _ebApplyTransform(); _ebUpdateZoomLabel(); }

function _ebChangeZoom(delta) {
  const MIN = 0.35, MAX = 2.2;
  const board = $('evidence-board');
  if (!board) return;
  const br      = board.getBoundingClientRect();
  const cx      = br.width  / 2;
  const cy      = br.height / 2;
  const newZoom = Math.min(MAX, Math.max(MIN, _ebZoom + delta));
  // keep center point stable
  _ebPan.x = cx - (cx - _ebPan.x) * (newZoom / _ebZoom);
  _ebPan.y = cy - (cy - _ebPan.y) * (newZoom / _ebZoom);
  _ebZoom  = newZoom;
  _ebApplyTransform();
  _ebUpdateZoomLabel();
}

function _ebUpdateZoomLabel() {
  const el = $('eb-zoom-label');
  if (el) el.textContent = Math.round(_ebZoom * 100) + '%';
}

function _ebScreenToBoard(sx, sy) {
  const board = $('evidence-board');
  if (!board) return {x:0, y:0};
  const br = board.getBoundingClientRect();
  return {
    x: ((sx - br.left - _ebPan.x) / _ebZoom / br.width)  * 100,
    y: ((sy - br.top  - _ebPan.y) / _ebZoom / br.height) * 100
  };
}

function _ebApplyLiveDragPositions() {
  const now = Date.now();
  Object.values(_ebLiveDragState).forEach(entry => {
    if (!entry || (now - (entry.ts || 0)) > 8000) return;
    if (entry.by === state.codename) return;
    const el = $('eb-card-' + entry.id);
    if (!el) return;
    el.style.left = entry.x + '%';
    el.style.top  = entry.y + '%';
    const item = evidenceBoardState.items.find(i => i.id === entry.id);
    if (item) { item.x = entry.x; item.y = entry.y; }
  });
}

function _ebRenderConnections() {
  const svg   = $('evidence-svg');
  const board = $('evidence-board');
  if (!svg || !board) return;

  svg.innerHTML = '';
  const bw = board.offsetWidth;
  const bh = board.offsetHeight;
  if (!bw || !bh) return;

  const COLOR = { red: '#cc2200', yellow: '#ddaa00', white: '#d8d8d0', green: '#226622', blue: '#2255aa' };

  function cardCenter(item) {
    const el = $('eb-card-' + item.id);
    if (el) {
      const fr = el.getBoundingClientRect();
      const br = board.getBoundingClientRect();
      // convert from screen-space (includes zoom+pan) back to content/SVG space
      const sx = fr.left + fr.width  / 2 - br.left;
      const sy = fr.top  + fr.height / 2 - br.top;
      return { x: (sx - _ebPan.x) / _ebZoom, y: (sy - _ebPan.y) / _ebZoom };
    }
    return { x: item.x / 100 * bw, y: item.y / 100 * bh };
  }

  // Draw existing connections
  evidenceBoardState.connections.forEach(conn => {
    const fi = evidenceBoardState.items.find(i => i.id === conn.from);
    const ti = evidenceBoardState.items.find(i => i.id === conn.to);
    if (!fi || !ti) return;
    const { x: x1, y: y1 } = cardCenter(fi);
    const { x: x2, y: y2 } = cardCenter(ti);
    const sag = Math.min(40, Math.hypot(x2 - x1, y2 - y1) * 0.09);
    const mx  = (x1 + x2) / 2;
    const my  = (y1 + y2) / 2 + sag;
    const stroke = COLOR[conn.color] || '#cc2200';
    // Shadow pass
    const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    shadow.setAttribute('d', `M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`);
    shadow.setAttribute('stroke', 'rgba(0,0,0,0.45)'); shadow.setAttribute('stroke-width', '3');
    shadow.setAttribute('fill', 'none'); shadow.setAttribute('stroke-linecap', 'round');
    svg.appendChild(shadow);
    // Color stroke
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`);
    path.setAttribute('stroke', stroke); path.setAttribute('stroke-width', '1.8');
    path.setAttribute('fill', 'none'); path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('opacity', '0.88'); path.style.cursor = 'pointer';
    path.title = 'Clique para remover';
    path.addEventListener('click', () => ebRemoveConnection(conn.id));
    svg.appendChild(path);
    // Endpoint dots
    [{ x: x1, y: y1 }, { x: x2, y: y2 }].forEach(pt => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y);
      c.setAttribute('r', '2.8'); c.setAttribute('fill', stroke); c.setAttribute('opacity', '0.7');
      svg.appendChild(c);
    });
  });

  // Rubber-band line while connecting
  if (_ebConnectMode && _ebConnectFrom && _ebConnectPos) {
    const fi = evidenceBoardState.items.find(i => i.id === _ebConnectFrom);
    if (fi) {
      const { x: x1, y: y1 } = cardCenter(fi);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1); line.setAttribute('y1', y1);
      line.setAttribute('x2', _ebConnectPos.x); line.setAttribute('y2', _ebConnectPos.y);
      line.setAttribute('stroke', COLOR[_ebSelectedColor] || '#cc2200');
      line.setAttribute('stroke-width', '1.5');
      line.setAttribute('stroke-dasharray', '7 5');
      line.setAttribute('opacity', '0.7');
      svg.appendChild(line);
    }
  }
}

function _ebSetupBoardEvents() {
  const board = $('evidence-board');
  if (!board || board.dataset.ebReady) return;
  board.dataset.ebReady = '1';

  // ── Wheel zoom ────────────────────────────────────
  board.addEventListener('wheel', (e) => {
    e.preventDefault();
    const MIN = 0.35, MAX = 2.2;
    const br      = board.getBoundingClientRect();
    const mx      = e.clientX - br.left;
    const my      = e.clientY - br.top;
    const delta   = e.deltaY < 0 ? 0.1 : -0.1;
    const newZoom = Math.min(MAX, Math.max(MIN, _ebZoom + delta));
    _ebPan.x = mx - (mx - _ebPan.x) * (newZoom / _ebZoom);
    _ebPan.y = my - (my - _ebPan.y) * (newZoom / _ebZoom);
    _ebZoom  = newZoom;
    _ebApplyTransform();
    _ebUpdateZoomLabel();
  }, { passive: false });

  // ── Middle-mouse / Space+drag pan ─────────────────
  let _spaceDown = false;
  document.addEventListener('keydown', (e) => { if (e.code === 'Space' && state.currentTab === 'quadro') { _spaceDown = true; board.style.cursor = 'grab'; } });
  document.addEventListener('keyup',   (e) => { if (e.code === 'Space') { _spaceDown = false; board.style.cursor = ''; } });

  board.addEventListener('mousedown', (e) => {
    // middle mouse OR space+drag OR left click on board background (not on a card)
    const onBackground = e.target === board || e.target.classList.contains('eb-content') ||
                         e.target === $('evidence-items') || e.target === $('evidence-svg');
    if (e.button === 1 || (e.button === 0 && (_spaceDown || onBackground))) {
      e.preventDefault();
      _ebPanning = { startX: e.clientX, startY: e.clientY, origX: _ebPan.x, origY: _ebPan.y };
      board.style.cursor = 'grabbing';
    }
  });

  // cursor presence: track mouse on the board element itself
  board.addEventListener('mousemove', (e) => {
    if (_ebPanning) {
      _ebPan.x = _ebPanning.origX + (e.clientX - _ebPanning.startX);
      _ebPan.y = _ebPanning.origY + (e.clientY - _ebPanning.startY);
      _ebApplyTransform();
      return;
    }
    // convert screen pos to board % for cursor broadcast
    const br = board.getBoundingClientRect();
    const bx = ((e.clientX - br.left - _ebPan.x) / _ebZoom / br.width)  * 100;
    const by = ((e.clientY - br.top  - _ebPan.y) / _ebZoom / br.height) * 100;
    _ebBroadcastCursor(bx, by);
  });
  board.addEventListener('mouseleave', () => { _ebClearCursor(); });

  document.addEventListener('mousemove', (e) => {
    // end pan if no button held
    if (_ebPanning && !(e.buttons & 5) && !(e.buttons & 4)) {
      _ebPanning = null; board.style.cursor = '';
    }
    if (_ebConnectMode && _ebConnectFrom) {
      const br = board.getBoundingClientRect();
      // rubber-band in SVG space (account for zoom/pan)
      _ebConnectPos = {
        x: (e.clientX - br.left - _ebPan.x) / _ebZoom,
        y: (e.clientY - br.top  - _ebPan.y) / _ebZoom
      };
      _ebRenderConnections();
      return;
    }
    if (!_ebDragging) return;
    const br = board.getBoundingClientRect();
    const { startX, startY, origX, origY } = _ebDragging;
    // deltas in board % (account for zoom)
    const dx = ((e.clientX - startX) / _ebZoom / br.width)  * 100;
    const dy = ((e.clientY - startY) / _ebZoom / br.height) * 100;
    const nx = Math.max(0, Math.min(96, origX + dx));
    const ny = Math.max(0, Math.min(96, origY + dy));
    const item = evidenceBoardState.items.find(i => i.id === _ebDragging.id);
    if (item) { item.x = nx; item.y = ny; }
    const el = $('eb-card-' + _ebDragging.id);
    if (el) { el.style.left = nx + '%'; el.style.top = ny + '%'; }
    _ebRenderConnections();
    _ebBroadcastDrag(_ebDragging.id, nx, ny);
  });

  document.addEventListener('mouseup', (e) => {
    if (_ebPanning && (e.button === 1 || e.button === 0)) {
      _ebPanning = null; board.style.cursor = '';
    }
    if (!_ebDragging) return;
    const { id: prevId, startX, startY } = _ebDragging;
    const el = $('eb-card-' + _ebDragging.id);
    if (el) el.classList.remove('eb-card-drag');
    const movedFar = Math.abs(e.clientX - startX) > 4 || Math.abs(e.clientY - startY) > 4;
    _ebDragging = null;
    _ebSave();
    setTimeout(() => _ebClearLiveDrag(prevId), 400);
    // clique limpo numa pasta → flip
    const clickedItem = evidenceBoardState.items.find(i => i.id === prevId);
    if (!movedFar && !_ebConnectMode && clickedItem?.type === 'pasta') {
      ebPastaToggle(prevId);
    }
  });
}

function _ebLoadLiveDrag() {
  if (!firebaseOk) return;
  if (_ebLiveDragUnsub) _ebLiveDragUnsub();
  _ebLiveDragUnsub = onSnapshot(doc(db, 'gameState', 'ebLiveDrag'), (snap) => {
    _ebLiveDragState = snap.exists() ? (snap.data() || {}) : {};
    const now = Date.now();
    Object.values(_ebLiveDragState).forEach(entry => {
      if (!entry || entry.by === state.codename) return;
      if ((now - (entry.ts || 0)) > 8000) return;
      const el = $('eb-card-' + entry.id);
      if (!el) return;
      el.style.left = entry.x + '%';
      el.style.top  = entry.y + '%';
      const item = evidenceBoardState.items.find(i => i.id === entry.id);
      if (item) { item.x = entry.x; item.y = entry.y; }
    });
    _ebRenderConnections();
  });
}

function _ebLoadPresence() {
  if (!firebaseOk) return;
  if (_ebPresenceUnsub) _ebPresenceUnsub();
  _ebPresenceUnsub = onSnapshot(doc(db, 'gameState', 'ebPresence'), (snap) => {
    _ebPresenceState = snap.exists() ? (snap.data() || {}) : {};
    _ebRenderCursors();
  });
}

function _ebBroadcastDrag(id, x, y) {
  if (!firebaseOk || !state.codename) return;
  const now = Date.now();
  if (now - _ebDragThrottle < 80) return;
  _ebDragThrottle = now;
  setDoc(doc(db, 'gameState', 'ebLiveDrag'),
    { [id]: { id, x, y, by: state.codename, ts: now } },
    { merge: true }
  ).catch(() => {});
}

function _ebClearLiveDrag(id) {
  if (!firebaseOk) return;
  setDoc(doc(db, 'gameState', 'ebLiveDrag'),
    { [id]: { id, x: 0, y: 0, by: state.codename, ts: 0 } },
    { merge: true }
  ).catch(() => {});
}

function _ebBroadcastCursor(bx, by) {
  if (!firebaseOk || !state.codename) return;
  const now = Date.now();
  if (now - _ebCursorThrottle < 40) return; // 40ms ≈ 25fps de broadcast
  _ebCursorThrottle = now;
  setDoc(doc(db, 'gameState', 'ebPresence'),
    { [state.codename]: { x: bx, y: by, ts: now, codename: state.codename } },
    { merge: true }
  ).catch(() => {});
}

function _ebClearCursor() {
  if (!firebaseOk || !state.codename) return;
  setDoc(doc(db, 'gameState', 'ebPresence'),
    { [state.codename]: { x: -999, y: -999, ts: 0, codename: state.codename } },
    { merge: true }
  ).catch(() => {});
}

function _ebRenderCursors() {
  const board   = $('evidence-board');
  const content = $('eb-content');
  if (!board) return;
  const parent = content || board;
  let container = $('eb-cursors');
  if (!container) {
    container = document.createElement('div');
    container.id = 'eb-cursors'; container.className = 'eb-cursors';
    parent.appendChild(container);
  } else if (content && container.parentElement !== content) {
    content.appendChild(container);
  }
  const now = Date.now();

  // sync targets from presence state
  Object.values(_ebPresenceState).forEach(entry => {
    if (!entry?.codename || entry.codename === state.codename) return;
    const cn  = entry.codename;
    const stale = (now - (entry.ts || 0)) > 5000;
    const offBoard = entry.x < 0 || entry.x > 100 || entry.y < 0 || entry.y > 100;

    if (stale || offBoard) {
      // fade out e remove do DOM após a transição
      const el = document.getElementById('eb-cursor-' + cn);
      if (el) {
        el.style.opacity = '0';
        setTimeout(() => { if (el.parentElement) el.remove(); }, 400);
      }
      const tgt = _ebCursorTargets[cn];
      if (tgt?.rafId) { cancelAnimationFrame(tgt.rafId); tgt.rafId = null; }
      delete _ebCursorTargets[cn];
      return;
    }

    // get or create DOM element
    let el = document.getElementById('eb-cursor-' + cn);
    if (!el) {
      el = document.createElement('div');
      el.id = 'eb-cursor-' + cn; el.className = 'eb-cursor';
      el.innerHTML = `
        <svg class="eb-cursor-arrow" viewBox="0 0 12 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1 L11 8 L6 9.5 L3.5 17 Z" fill="white" stroke="#111" stroke-width="1.2" stroke-linejoin="round"/>
        </svg>
        <div class="eb-cursor-label">${escHtml(cn)}</div>`;
      container.appendChild(el);
      // teleport to initial position (no lerp on first appearance)
      el.style.left = entry.x + '%'; el.style.top = entry.y + '%'; el.style.opacity = '1';
      _ebCursorTargets[cn] = { tx: entry.x, ty: entry.y, cx: entry.x, cy: entry.y, rafId: null, el };
      return;
    }

    // update target
    const tgt = _ebCursorTargets[cn];
    if (!tgt) {
      el.style.left = entry.x + '%'; el.style.top = entry.y + '%'; el.style.opacity = '1';
      _ebCursorTargets[cn] = { tx: entry.x, ty: entry.y, cx: entry.x, cy: entry.y, rafId: null, el };
      return;
    }
    tgt.tx = entry.x; tgt.ty = entry.y; tgt.el = el;
    el.style.opacity = '1';
    if (!tgt.rafId) _ebAnimateCursor(cn);
  });
}

function _ebAnimateCursor(cn) {
  const tgt = _ebCursorTargets[cn];
  if (!tgt) return;
  const LERP = 0.22; // smoothing factor — higher = snappier, lower = more lag
  function step() {
    const t = _ebCursorTargets[cn];
    if (!t || !t.el) return;
    const dx = t.tx - t.cx;
    const dy = t.ty - t.cy;
    if (Math.abs(dx) < 0.004 && Math.abs(dy) < 0.004) {
      t.cx = t.tx; t.cy = t.ty;
      t.el.style.left = t.cx + '%';
      t.el.style.top  = t.cy + '%';
      t.rafId = null;
      return;
    }
    t.cx += dx * LERP;
    t.cy += dy * LERP;
    t.el.style.left = t.cx + '%';
    t.el.style.top  = t.cy + '%';
    t.rafId = requestAnimationFrame(step);
  }
  tgt.rafId = requestAnimationFrame(step);
}

function ebMouseDown(e, itemId) {
  if (e.button !== 0) return;
  if (_ebConnectMode) { ebItemClick(itemId); return; }
  e.preventDefault();
  const board = $('evidence-board');
  if (!board) return;
  const br   = board.getBoundingClientRect();
  const item = evidenceBoardState.items.find(i => i.id === itemId);
  if (!item) return;
  _ebDragging = { id: itemId, startX: e.clientX, startY: e.clientY,
                  origX: item.x, origY: item.y };
  const el = $('eb-card-' + itemId);
  if (el) el.classList.add('eb-card-drag');
}

function ebItemClick(itemId) {
  if (!_ebConnectMode) return;
  if (!_ebConnectFrom) {
    _ebConnectFrom = itemId;
    _ebConnectPos  = null;
    renderEvidenceBoard();
    _ebUpdateToolbarHint('Agora clique no segundo card para conectar. ESC para cancelar.');
    return;
  }
  if (_ebConnectFrom === itemId) { ebCancelConnect(); return; }
  ebAddConnection(_ebConnectFrom, itemId);
  _ebConnectFrom = null; _ebConnectPos = null;
  _ebUpdateToolbarHint('Selecione o primeiro card.');
}

function ebToggleConnectMode() {
  _ebConnectMode = !_ebConnectMode;
  _ebConnectFrom = null; _ebConnectPos = null;
  const btn = $('eb-connect-btn');
  if (btn) btn.classList.toggle('eb-btn-active', _ebConnectMode);
  const board = $('evidence-board');
  if (board) board.classList.toggle('eb-connect-cursor', _ebConnectMode);
  _ebUpdateToolbarHint(_ebConnectMode ? 'Selecione o primeiro card.' : '');
  renderEvidenceBoard();
}

function ebCancelConnect() {
  _ebConnectMode = false; _ebConnectFrom = null; _ebConnectPos = null;
  const btn = $('eb-connect-btn');
  if (btn) btn.classList.remove('eb-btn-active');
  const board = $('evidence-board');
  if (board) board.classList.remove('eb-connect-cursor');
  _ebUpdateToolbarHint('');
  renderEvidenceBoard();
}

function ebSetColor(color) {
  _ebSelectedColor = color;
  document.querySelectorAll('.eb-color-swatch').forEach(s =>
    s.classList.toggle('eb-swatch-active', s.dataset.color === color));
}

function _ebUpdateToolbarHint(msg) {
  const el = $('eb-toolbar-hint');
  if (el) { el.textContent = msg; el.style.opacity = msg ? '1' : '0'; }
}

async function ebAddConnection(fromId, toId) {
  const exists = evidenceBoardState.connections.some(
    c => (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId)
  );
  if (exists) { renderEvidenceBoard(); return; }
  evidenceBoardState.connections.push({
    id: 'conn_' + Date.now(), from: fromId, to: toId, color: _ebSelectedColor
  });
  renderEvidenceBoard();
  await _ebSave();
}

async function ebRemoveConnection(connId) {
  evidenceBoardState.connections = evidenceBoardState.connections.filter(c => c.id !== connId);
  renderEvidenceBoard();
  await _ebSave();
}

function ebPastaToggle(itemId) {
  if (!_ebPastaState[itemId]) _ebPastaState[itemId] = { open: false, page: 0 };
  _ebPastaState[itemId].open = !_ebPastaState[itemId].open;
  const el = $('eb-card-' + itemId);
  if (el) el.classList.toggle('eb-pasta-open', _ebPastaState[itemId].open);
}

function ebPastaPage(itemId, dir, e) {
  if (e) e.stopPropagation();
  const item = evidenceBoardState.items.find(i => i.id === itemId);
  if (!item) return;
  const pages = Array.isArray(item.pages) && item.pages.length ? item.pages : [{title:'', text:''}];
  if (!_ebPastaState[itemId]) _ebPastaState[itemId] = { open: true, page: 0 };
  const s = _ebPastaState[itemId];
  s.page = Math.max(0, Math.min(pages.length - 1, s.page + dir));
  const card = $('eb-card-' + itemId);
  if (!card) return;
  const curPage = pages[s.page];
  const headerEl  = card.querySelector('.eb-pasta-back-header');
  const textEl    = card.querySelector('.eb-pasta-back-text');
  const numEl     = card.querySelector('.eb-pasta-page-num');
  if (headerEl) headerEl.textContent = curPage.title || '';
  if (textEl)   textEl.textContent   = curPage.text  || '';
  if (numEl)    numEl.textContent    = (s.page + 1) + ' / ' + pages.length;
}

function ebOpenDoc(docId) {
  switchTab('docs');
  setTimeout(() => openDocViewer(docId), 100);
}

async function _ebSave() {
  if (!firebaseOk) return;
  try {
    await setDoc(doc(db, 'gameState', 'evidenceBoard'),
      { items: evidenceBoardState.items, connections: evidenceBoardState.connections });
  } catch(e) { console.error('_ebSave:', e); }
}

// ─ GM ────────────────────────────────────────────────────────────
function gmRenderEBList() {
  const container = $('gm-eb-list');
  if (!container) return;
  const items = evidenceBoardState.items || [];
  if (!items.length) {
    container.innerHTML = '<div class="gm-fitas-empty">Quadro vazio.</div>';
    return;
  }
  const PIN = { document: '#993300', nota: '#cc9900', suspeito: '#2244aa', foto: '#cc2222', pasta: '#556644' };
  container.innerHTML = items.map(item => `
    <div class="gm-eb-item">
      <div class="gm-eb-pin" style="background:${PIN[item.type]||'#cc3333'}"></div>
      <div class="gm-eb-info">
        <div class="gm-eb-type">${item.type.toUpperCase()}</div>
        <div class="gm-eb-title">${escHtml(item.title)}</div>
      </div>
      <button class="gm-eb-remove" onclick="App.gmRemoveEBItem('${escHtml(item.id)}')">&#10005;</button>
    </div>`).join('');
}

function gmEBTypeChange() {
  const typeEl    = $('gm-eb-add-type');
  const docWrap   = $('gm-eb-doc-wrap');
  const imgWrap   = $('gm-eb-img-wrap');
  const pastaWrap = $('gm-eb-pasta-wrap');
  const contentEl = $('gm-eb-add-content');
  if (!typeEl) return;
  const t = typeEl.value;
  if (docWrap)   docWrap.classList.toggle('hidden',   t !== 'document');
  if (imgWrap)   imgWrap.classList.toggle('hidden',   t !== 'suspeito');
  if (pastaWrap) pastaWrap.classList.toggle('hidden', t !== 'pasta');
  if (contentEl) {
    contentEl.placeholder = t === 'pasta'
      ? 'Código / número (ex: LP 554301)...'
      : 'Conteúdo / cargo / relação com o caso...';
  }
  if (t === 'pasta') _renderGMPastaPages();
  // Populate document select
  if (t === 'document') {
    const docEl = $('gm-eb-add-doc');
    if (docEl && DOCUMENTS.length) {
      docEl.innerHTML = DOCUMENTS.map(d => `<option value="${d.id}">${escHtml(d.title)}</option>`).join('');
    }
  }
}

function gmEBAddPastaPage() {
  if (_gmPastaPages.length >= 4) { showToast('Máximo 4 páginas.', 'error'); return; }
  _gmPastaPages.push({ title: 'PÁGINA ' + (_gmPastaPages.length + 1), text: '' });
  _renderGMPastaPages();
}

function gmEBRemovePastaPage(i) {
  if (_gmPastaPages.length <= 1) return;
  _gmPastaPages.splice(i, 1);
  _renderGMPastaPages();
}

function gmEBUpdatePastaPage(i, field, value) {
  if (_gmPastaPages[i]) _gmPastaPages[i][field] = value;
}

function _renderGMPastaPages() {
  const el = $('gm-eb-pasta-pages-list');
  if (!el) return;
  el.innerHTML = _gmPastaPages.map((p, i) => `
    <div class="gm-pasta-page-entry">
      <div class="gm-pasta-page-num">PÁGINA ${i + 1}
        ${_gmPastaPages.length > 1 ? `<button class="gm-eb-remove" style="float:right" onclick="App.gmEBRemovePastaPage(${i})">&#10005;</button>` : ''}
      </div>
      <input class="gm-text-input" placeholder="Título da página..." maxlength="50"
             value="${escHtml(p.title)}" oninput="App.gmEBUpdatePastaPage(${i},'title',this.value)" />
      <textarea class="gm-text-input" rows="2" placeholder="Conteúdo da página..."
             oninput="App.gmEBUpdatePastaPage(${i},'text',this.value)">${escHtml(p.text)}</textarea>
    </div>`).join('');
}

let _gmEBSuspectImg = '';
function gmEBPreviewSuspect(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    _gmEBSuspectImg = e.target.result;
    const prev = $('gm-eb-suspect-prev');
    if (prev) { prev.src = _gmEBSuspectImg; prev.classList.remove('hidden'); }
  };
  reader.readAsDataURL(file);
}

async function gmAddEBItem() {
  const typeEl    = $('gm-eb-add-type');
  const titleEl   = $('gm-eb-add-title');
  const contentEl = $('gm-eb-add-content');
  const docEl     = $('gm-eb-add-doc');
  if (!typeEl || !titleEl) return;
  const type    = typeEl.value;
  const title   = titleEl.value.trim();
  const content = contentEl ? contentEl.value.trim() : '';
  if (!title) { showToast('Insira um título.', 'error'); return; }

  const PIN_COLORS = { document: '#993300', nota: '#cc9900', suspeito: '#2244aa', foto: '#cc2222', pasta: '#556644' };
  const newItem = {
    id: 'eb_' + Date.now(), type, title, content,
    docId: (type === 'document' && docEl) ? docEl.value : null,
    imageUrl: type === 'suspeito' ? _gmEBSuspectImg : '',
    pages: type === 'pasta' ? _gmPastaPages.map(p => ({title: p.title, text: p.text})) : null,
    x: 8 + Math.random() * 55, y: 8 + Math.random() * 55,
    rotation: parseFloat(((Math.random() - 0.5) * 9).toFixed(2)),
    pinColor: PIN_COLORS[type] || '#cc3333'
  };
  if (type === 'document' && newItem.docId) {
    const d = DOCUMENTS.find(dd => dd.id === newItem.docId);
    if (d) { newItem.imageUrl = d.image; if (!newItem.title) newItem.title = d.title; }
  }
  _gmEBSuspectImg = '';
  const prev = $('gm-eb-suspect-prev');
  if (prev) { prev.src = ''; prev.classList.add('hidden'); }
  if (type === 'pasta') {
    _gmPastaPages = [{title: 'PÁGINA 1', text: ''}];
    _renderGMPastaPages();
  }
  evidenceBoardState.items.push(newItem);
  await _ebSave();
  titleEl.value = ''; if (contentEl) contentEl.value = '';
  showToast('Item fixado no quadro.', 'success', 1800);
}

async function gmRemoveEBItem(itemId) {
  evidenceBoardState.items = evidenceBoardState.items.filter(i => i.id !== itemId);
  evidenceBoardState.connections = evidenceBoardState.connections.filter(
    c => c.from !== itemId && c.to !== itemId);
  await _ebSave();
  showToast('Item removido.', 'ok', 1600);
}

// ══════════════════════════════════════════════════════════
//  TRANSMISSÕES DE VÍDEO
// ══════════════════════════════════════════════════════════

function _persistVideoSeenSet() {
  localStorage.setItem('vyper_videos_seen_' + (state.codename || ''), JSON.stringify([..._videoSeenSet]));
}

function loadVideoTrans() {
  if (!firebaseOk) return;
  if (videoTransUnsub) videoTransUnsub();
  const seenRaw = localStorage.getItem('vyper_videos_seen_' + (state.codename || ''));
  _videoSeenSet = new Set(seenRaw ? JSON.parse(seenRaw) : []);
  _videoFirstLoad = true;
  videoTransUnsub = onSnapshot(doc(db, 'gameState', 'videoTransmissions'), (snap) => {
    videoTransState = snap.exists() ? snap.data() : { videos: [] };
    if (!Array.isArray(videoTransState.videos)) videoTransState.videos = [];
    if (_videoFirstLoad) {
      // carregamento inicial: silenciosamente marcar vídeos já liberados como vistos
      _videoFirstLoad = false;
      videoTransState.videos.forEach(v => { if (v.released) _videoSeenSet.add(v.id); });
      _persistVideoSeenSet();
    } else {
      // detectar novos lançamentos
      videoTransState.videos.forEach(v => {
        if (v.released && !_videoSeenSet.has(v.id)) showVideoTransAlert(v.id);
      });
    }
    renderVideoTransTab();
    if (state.role === 'gm') gmRenderVideoTrans();
  });
}

function renderVideoTransTab() {
  const container = $('video-trans-list');
  if (!container) return;
  const released = videoTransState.videos.filter(v => v.released);
  if (!released.length) {
    container.innerHTML = '<div class="docs-empty">Nenhuma transmissão de vídeo disponível.</div>';
    return;
  }
  container.innerHTML = released.map(v => `
    <div class="video-trans-card" onclick="App.openVideoPlayer('${escHtml(v.id)}')">
      <div class="video-trans-thumb">
        <div class="video-trans-play-icon">&#9654;</div>
        <div class="video-trans-noise"></div>
        <div class="video-trans-thumb-scan"></div>
      </div>
      <div class="video-trans-info">
        <div class="video-trans-title">${escHtml(v.title)}</div>
        <div class="video-trans-meta">&#9679; VHS &nbsp;&middot;&nbsp; ${v.releasedAt ? new Date(v.releasedAt).toLocaleDateString('pt-BR') : '&mdash;'}</div>
      </div>
      <div class="video-trans-arrow">&#9658;</div>
    </div>
  `).join('');
}

function openVideoPlayer(vId) {
  const vid = videoTransState.videos.find(v => v.id === vId);
  if (!vid) return;
  const overlay = $('vhs-player-overlay');
  const title   = $('vhs-player-title');
  const screen  = $('vhs-player-screen');
  const tsEl    = $('vhs-timestamp');
  if (!overlay || !screen) return;
  if (title) title.textContent = vid.title;
  if (tsEl) {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    tsEl.textContent = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }
  screen.innerHTML = '';
  const ytUrl = _ytEmbedUrl(vid.url);
  if (ytUrl) {
    const iframe = document.createElement('iframe');
    iframe.src = ytUrl;
    iframe.frameBorder = '0';
    iframe.allow = 'autoplay; encrypted-media; fullscreen';
    iframe.allowFullscreen = true;
    iframe.className = 'vhs-iframe';
    screen.appendChild(iframe);
  } else if (_isDirectVideoUrl(vid.url)) {
    const video = document.createElement('video');
    video.src = vid.url;
    video.controls = true;
    video.autoplay = true;
    video.className = 'vhs-video';
    screen.appendChild(video);
  } else {
    const iframe = document.createElement('iframe');
    iframe.src = vid.url;
    iframe.frameBorder = '0';
    iframe.allow = 'autoplay; encrypted-media; fullscreen';
    iframe.allowFullscreen = true;
    iframe.className = 'vhs-iframe';
    screen.appendChild(iframe);
  }
  overlay.classList.remove('hidden');
  void overlay.offsetWidth;
  overlay.classList.add('vhs-active');
}

function closeVideoPlayer() {
  const overlay = $('vhs-player-overlay');
  if (!overlay) return;
  overlay.classList.remove('vhs-active');
  setTimeout(() => {
    overlay.classList.add('hidden');
    const screen = $('vhs-player-screen');
    if (screen) screen.innerHTML = '';
  }, 320);
}

function showVideoTransAlert(vId) {
  const vid = videoTransState.videos.find(v => v.id === vId);
  if (!vid || _videoSeenSet.has(vId)) return;
  _videoAlertId = vId;
  _videoSeenSet.add(vId);
  _persistVideoSeenSet();
  const nameEl  = $('video-alert-title');
  const alertEl = $('video-trans-alert');
  if (nameEl) nameEl.textContent = vid.title;
  if (alertEl) {
    alertEl.classList.remove('hidden', 'doc-new-dismiss-out');
    void alertEl.offsetWidth;
    alertEl.classList.add('doc-new-visible');
  }
}

function dismissVideoAlert(openVideo = false) {
  const alertEl = $('video-trans-alert');
  if (!alertEl) return;
  alertEl.classList.remove('doc-new-visible');
  alertEl.classList.add('doc-new-dismiss-out');
  const vId = _videoAlertId;
  _videoAlertId = null;
  setTimeout(() => {
    alertEl.classList.add('hidden');
    alertEl.classList.remove('doc-new-dismiss-out');
    if (openVideo && vId) {
      switchTab('docs');
      docsSubtab('videos');
      setTimeout(() => openVideoPlayer(vId), 200);
    }
  }, 600);
}

function _ytEmbedUrl(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1&controls=1&rel=0&modestbranding=1`;
  return null;
}

function _isDirectVideoUrl(url) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

function gmRenderVideoTrans() {
  const container = $('gm-video-list');
  if (!container) return;
  const videos = videoTransState.videos || [];
  if (!videos.length) {
    container.innerHTML = '<div class="gm-fitas-empty">Nenhuma transmissão cadastrada.</div>';
    return;
  }
  container.innerHTML = videos.map(v => `
    <div class="gm-video-item">
      <div class="gm-video-info">
        <div class="gm-video-title">${escHtml(v.title)}</div>
        <div class="gm-video-url" title="${escHtml(v.url)}">${v.url.length > 38 ? escHtml(v.url.slice(0,38)) + '\u2026' : escHtml(v.url)}</div>
      </div>
      <div class="gm-video-actions">
        <button class="gm-video-release-btn${v.released ? ' gm-video-released' : ''}"
                onclick="App.gmToggleVideoRelease('${escHtml(v.id)}')">
          ${v.released ? '&#9679;&nbsp;BLOQ.' : '&#9675;&nbsp;LIB.'}
        </button>
        <button class="gm-video-preview-btn" title="Visualizar" onclick="App.openVideoPlayer('${escHtml(v.id)}')">&#9654;</button>
        <button class="gm-video-del-btn" title="Remover" onclick="App.gmRemoveVideoTrans('${escHtml(v.id)}')">&#10005;</button>
      </div>
    </div>
  `).join('');
}

async function gmAddVideoTrans() {
  const titleEl = $('gm-video-add-title');
  const urlEl   = $('gm-video-add-url');
  if (!titleEl || !urlEl) return;
  const title = titleEl.value.trim();
  const url   = urlEl.value.trim();
  if (!title) { showToast('Insira um título.', 'error'); return; }
  if (!url || !url.startsWith('http')) { showToast('URL inválida.', 'error'); return; }
  const newVid = { id: 'vid_' + Date.now(), title, url, released: false, releasedAt: null };
  videoTransState.videos.push(newVid);
  await _gmSaveVideoTrans();
  titleEl.value = '';
  urlEl.value = '';
  showToast('Transmissão adicionada.', 'success', 1800);
}

async function gmRemoveVideoTrans(vId) {
  videoTransState.videos = videoTransState.videos.filter(v => v.id !== vId);
  await _gmSaveVideoTrans();
  showToast('Transmissão removida.', 'ok', 1800);
}

async function gmToggleVideoRelease(vId) {
  const vid = videoTransState.videos.find(v => v.id === vId);
  if (!vid) return;
  vid.released = !vid.released;
  vid.releasedAt = vid.released ? Date.now() : null;
  await _gmSaveVideoTrans();
  showToast(vid.released ? 'Transmissão liberada para os agentes.' : 'Transmissão bloqueada.', 'success', 2000);
}

async function _gmSaveVideoTrans() {
  try {
    await setDoc(doc(db, 'gameState', 'videoTransmissions'), { videos: videoTransState.videos });
  } catch (e) {
    console.error('_gmSaveVideoTrans:', e);
    showToast('Erro ao salvar transmissão.', 'error');
  }
}

// ──────────────────────────────────────────────────────────
//  UX HELPERS
// ──────────────────────────────────────────────────────────
function toggleAtributos() {
  const box = $('attr-box');
  if (!box) return;
  box.classList.toggle('collapsed');
  try { localStorage.setItem('vyper_attr_collapsed', box.classList.contains('collapsed') ? '1' : '0'); } catch (_) {}
}

function togglePericias() {
  const wrap = $('pericias-wrap');
  if (!wrap) return;
  wrap.classList.toggle('collapsed');
  try { localStorage.setItem('vyper_pericias_collapsed', wrap.classList.contains('collapsed') ? '1' : '0'); } catch (_) {}
}

function initPopupBackdrops() {
  // Click on the dark overlay area (outside the inner panel) closes the popup
  [
    ['arma-inspect-popup',       fecharArmaInspect],
    ['arma-unica-inspect-popup', fecharArmaUnicaInspect],
    ['dica-popup',               closeDicaPopup],
  ].forEach(([id, fn]) => {
    const el = $(id);
    if (el) el.addEventListener('click', e => { if (e.target === el) fn(); });
  });

  // Restore collapsed state
  try {
    if (localStorage.getItem('vyper_attr_collapsed') === '1') {
      $('attr-box')?.classList.add('collapsed');
    }
  } catch (_) {}
}

// ──────────────────────────────────────────────────────────
//  PUBLIC API (called from HTML onclick)
// ──────────────────────────────────────────────────────────
window.App = {
  selectRole,
  loginPlayer,
  loginGM,
  logout,
  editPhoto,
  handlePhotoUpload,
  toggleEdit,
  saveField,
  cycleAttr,
  openGradeModal,
  selectGrade,
  closeGradeModal,
  toggleIntegrity,
  switchTab,
  switchCenterTab,
  savePericiaBonus,
  togglePericias,
  gmToggleCard,
  gmSetSecurity,
  gmSetIntegrity,
  gmSetStatus,
  gmSetPatente,
  gmAjustarXp,
  gmSetXpExact,
  openCaminhoOverlay,
  closeCaminhoOverlay,
  showMarcoDetail,
  caminhoGmAjustar,
  caminhoGmSetExato,
  playFita,
  fitaTogglePlay,
  fitaToggleLoop,
  fitaSkip,
  fitaSeek,
  gmUploadFita,
  gmDesalocarFita,
  gmDeleteFitaFromLibrary,
  gmAssignFitaFromLibrary,
  radioChangeFreq,
  radioSolicitar,
  radioCancelar,
  gmAddNpcPreset,
  gmRemoveNpcPreset,
  gmRadioAceitar,
  gmRadioRecusar,
  gmRadioDesconectar,
  maldSelectElement,
  maldShowDetail,
  maldBack,
  gmPreviewMaldIcon,
  gmAddMaldicao,
  gmRemoveMaldicao,
  gmAddMaldTag,
  gmRemoveMaldTag,
  openDocViewer,
  closeDocViewer,
  toggleDocUV,
  saveDocAnnotation,
  gmToggleDocRelease,
  gmOpenZoneEditor, gmCloseZoneModal, gmAddDocZone, gmRemoveDocZone,
  gmOpenCipherEditor, gmCloseCipherEditor, gmSaveCipher, gmClearCipher, gmCipherPreviewUpdate,
  docsSubtab, deleteDocFoto,
  docCtxFotografar, docCtxInteragir, closeDocInteract, hideDocCtxMenu,
  docTryDecipher,
  dismissNewDocAlert,
  markDocRead,
  // ── VIDEO TRANS ──
  openVideoPlayer, closeVideoPlayer,
  renderVideoTransTab, dismissVideoAlert,
  gmRenderVideoTrans, gmAddVideoTrans, gmRemoveVideoTrans, gmToggleVideoRelease,
  // ── QUADRO DE EVIDÊNCIAS ──
  renderEvidenceBoard, ebToggleConnectMode, ebCancelConnect, ebSetColor,
  ebRemoveConnection, ebOpenDoc, ebMouseDown,
  ebZoomIn, ebZoomOut, ebZoomReset,
  ebPastaPage,
  gmRenderEBList, gmAddEBItem, gmRemoveEBItem, gmEBTypeChange, gmEBPreviewSuspect,
  gmEBAddPastaPage, gmEBRemovePastaPage, gmEBUpdatePastaPage,
  _ebRenderCursors,
  // ── OTHER ──
  gmSaveMissaoText,
  openPlayerPrefs,
  closePlayerPrefs,
  setPlayerPref,
  togglePlayerPref,
  openFeedUrl,
  toggleFeedBar,
  openMissaoDetail,
  closeMissaoDetail,
  setPatente,
  inspecionarArma,
  fecharArmaInspect,
  inspecionarArmaUnica,
  fecharArmaUnicaInspect,
  gmSalvarArma,
  gmLimparArma,
  gmSalvarArmaUnica,
  gmLimparArmaUnica,
  gmEnviarDica,
  closeDicaPopup,
  gmSetAparencia,
  gmToggleSection,
  bolsaItemClick,
  bolsaDeselecionar,
  bolsaEquipar,
  bolsaGirar,
  bolsaJogarFora,
  bolsaTentarColocar,
  bolsaUsarItem,
  bolsaAbrirTransferencia,
  bolsaTransferir,
  renderBolsaActionsPublic,
  bolsaAutoPlaceStaged,
  bolsaToggleCraftMode,
  bolsaCraftToggleSlot,
  bolsaCombinar,
  craftTutSetTab,
  armaParaBolsa,
  gmEnviarParaBolsa,
  gmRemoverDaBolsa,
  gmLootAddItem,
  gmLootRemoveItem,
  gmLootDistribuir,
  gmDeleteOperador,
  gmSavePsych, gmToggleGatilho, gmSetMedicado, gmPsychSliderInput,
  gmToggleStatusNeg,
  gmEnviarMensagemCifrada, fecharMensagemCifrada,
  gmSetParanormalNivel,
  bolsaCamoToggle,
  bolsaCamoSelect,
  equiparCamuflagem,
  gmToggleCamoRelease,
  toggleAtributos,
};

// ──────────────────────────────────────────────────────────
//  KEYBOARD SHORTCUTS
// ──────────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Dismiss video alert
    const videoAlert = $('video-trans-alert');
    if (videoAlert && !videoAlert.classList.contains('hidden')) {
      dismissVideoAlert(false);
      return;
    }
    // Close VHS player
    const vhsOverlay = $('vhs-player-overlay');
    if (vhsOverlay && !vhsOverlay.classList.contains('hidden')) {
      closeVideoPlayer();
      return;
    }
    // Dismiss new doc alert first
    const newAlert = $('doc-new-alert');
    if (newAlert && !newAlert.classList.contains('hidden')) {
      dismissNewDocAlert(false);
      return;
    }
    // Close doc viewer first
    const viewer = $('doc-viewer');
    if (viewer && !viewer.classList.contains('hidden')) {
      closeDocViewer();
      return;
    }
    // Close any open modal or editing
    if (!$('grade-modal').classList.contains('hidden')) {
      $('grade-modal').classList.add('hidden'); return;
    }
    if (!$('arma-inspect-popup').classList.contains('hidden')) {
      fecharArmaInspect(); return;
    }
    if (!$('arma-unica-inspect-popup').classList.contains('hidden')) {
      fecharArmaUnicaInspect(); return;
    }
    if (!$('dica-popup').classList.contains('hidden')) {
      closeDicaPopup(); return;
    }
  }
  // Enter on login inputs
  if (e.key === 'Enter') {
    if (document.activeElement === $('input-codename')) loginPlayer();
    if (document.activeElement === $('input-gm-pass'))  loginGM();
  }
});

// ──────────────────────────────────────────────────────────
//  START
// ──────────────────────────────────────────────────────────
initDocViewerEvents();
initPopupBackdrops();
runBoot(); 
