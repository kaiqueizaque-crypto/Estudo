/* ============================================================
   /js/state.js
   Estado central do aplicativo — versão consolidada e compatível
   Exporta:
     - CONCURSOS, MATERIAS
     - defaultState
     - state (mutable)
     - loadLocal(), saveLocal()
     - calculateMateriaPercent(), calculateConcursoPercent(), calculateGlobalPercent()
   Observações:
     - Chave localStorage: "progresso_estudos_v2"
     - saveLocal() atualiza state.updatedAt automaticamente
============================================================ */

export const CONCURSOS = {
  pc_ba: "Polícia Civil - PC-BA",
  prf_adm: "PRF Administrativo"
};

export const MATERIAS = {
  "Língua Portuguesa": [
    "Interpretação de texto",
    "Ortografia",
    "Morfologia",
    "Sintaxe",
    "Pontuação",
    "Concordância"
  ],
  "Raciocínio Lógico": [
    "Proposições",
    "Tabelas verdade",
    "Probabilidade",
    "Análise combinatória",
    "Raciocínios básicos"
  ],
  "Direito Penal": [
    "Parte Geral",
    "Crimes em espécie",
    "Teoria do Crime",
    "Penas"
  ],
  "Direito Processual Penal": [
    "Inquérito policial",
    "Ação penal",
    "Provas",
    "Medidas cautelares"
  ],
  "Direitos Humanos": [
    "Constituição",
    "Tratados internacionais",
    "Sistema interamericano"
  ],
  "Informática": [
    "Windows",
    "Pacote Office",
    "Navegadores",
    "Segurança da informação"
  ],
  "Administração": [
    "Administração geral",
    "Gestão de pessoas",
    "Noções de planejamento"
  ],
  "Ética": [
    "Código de ética",
    "Deveres do servidor"
  ],
  "Legislação de Trânsito": [
    "CTB",
    "Infrações",
    "Sinalização"
  ]
};

/* Estado padrão (exportado para uso em sync.js) */
export const defaultState = {
  selectedContest: "pc_ba",
  materias: {},   // preenchido por createDefaultMaterias()
  notes: {},      // notas por matéria
  updatedAt: 0
};

/* Chave de armazenamento local */
const STORAGE_KEY = "progresso_estudos_v2";

/* Estado em memória (mutável) */
export let state = JSON.parse(JSON.stringify(defaultState));

/* -----------------------------------------------------------
   Helpers internos
----------------------------------------------------------- */
function createDefaultMateriasStructure() {
  const out = {};
  Object.keys(MATERIAS).forEach(mat => {
    out[mat] = {};
    MATERIAS[mat].forEach(assunto => (out[mat][assunto] = 0));
  });
  return out;
}

/* -----------------------------------------------------------
   Carregar do localStorage
   - Se não existir, inicializa com default + materias
----------------------------------------------------------- */
export function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // inicializa
      state = JSON.parse(JSON.stringify(defaultState));
      state.materias = createDefaultMateriasStructure();
      state.notes = {};
      saveLocal();
      return state;
    }
    const parsed = JSON.parse(raw);

    // normaliza estrutura
    state = {
      ...JSON.parse(JSON.stringify(defaultState)),
      ...parsed,
      materias: parsed.materias || createDefaultMateriasStructure(),
      notes: parsed.notes || {}
    };

    return state;
  } catch (e) {
    console.error("loadLocal error:", e);
    // fallback para default
    state = JSON.parse(JSON.stringify(defaultState));
    state.materias = createDefaultMateriasStructure();
    state.notes = {};
    saveLocal();
    return state;
  }
}

/* -----------------------------------------------------------
   Salvar no localStorage (atualiza updatedAt)
   - Se passado um objeto, sobrescreve state
----------------------------------------------------------- */
export function saveLocal(newState = null) {
  if (newState) state = newState;
  state.updatedAt = Date.now();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("saveLocal error:", e);
  }
}

/* -----------------------------------------------------------
   Cálculos de progresso
   - Cada assunto guarda 0 | 0.5 | 1 (conforme UI)
   - calculateMateriaPercent -> retorna inteiro 0..100
----------------------------------------------------------- */
export function calculateMateriaPercent(materia) {
  if (!state.materias || !state.materias[materia]) return 0;
  const assuntos = state.materias[materia];
  const keys = Object.keys(assuntos);
  if (keys.length === 0) return 0;
  let sum = 0;
  keys.forEach(k => {
    const v = Number(assuntos[k]) || 0;
    sum += v;
  });
  // valores 0, 0.5, 1. Convertendo média para porcentagem:
  const avg = sum / keys.length; // entre 0 e 1
  return Math.round(avg * 100);
}

export function calculateConcursoPercent(contestKey = "pc_ba") {
  // contestKey currently not used to choose materias set,
  // we compute global average across MATERIAS defined.
  const mats = Object.keys(MATERIAS);
  if (mats.length === 0) return 0;
  let sum = 0;
  mats.forEach(mat => {
    sum += calculateMateriaPercent(mat);
  });
  return Math.round(sum / mats.length);
}

export function calculateGlobalPercent() {
  return calculateConcursoPercent(state.selectedContest);
}

/* -----------------------------------------------------------
   Inicializa estado (conveniência para boot)
   - loadLocal() e retorna state
----------------------------------------------------------- */
export function initState() {
  return loadLocal();
}

/* -----------------------------------------------------------
   Export summary helpers (opcionais)
----------------------------------------------------------- */
export function exportStateJSON() {
  return JSON.parse(JSON.stringify(state));
}
