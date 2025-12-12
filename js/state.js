/* ============================================================
   STATE.JS — Estado central do aplicativo
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
    "Sintaxe"
  ],
  "Raciocínio Lógico": [
    "Proposições",
    "Tabelas verdade",
    "Probabilidade",
    "Análise combinatória"
  ],
  "Direito Penal": [
    "Parte Geral",
    "Crimes em espécie",
    "Teoria do Crime"
  ],
  "Direito Processual Penal": [
    "Inquérito policial",
    "Ação penal",
    "Provas"
  ],
  "Direitos Humanos": [
    "Constituição",
    "Tratados internacionais",
    "Sistemas protetivos"
  ],
  "Informática": [
    "Windows",
    "Pacote Office",
    "Navegadores",
    "Segurança"
  ],
  "Administração": [
    "Administração geral",
    "Processos",
    "Qualidade"
  ],
  "Ética": [
    "Código de ética",
    "Serviço público"
  ],
  "Legislação de Trânsito": [
    "CTB",
    "Infrações",
    "Direção defensiva"
  ]
};

/* ============================================================
   DEFAULT STATE (necessário para sync.js)
============================================================ */

export const defaultState = {
  selectedContest: "pc_ba",
  materias: {},
  notes: {},
  updatedAt: 0
};

function createDefaultMaterias() {
  const obj = {};
  Object.keys(MATERIAS).forEach(mat => {
    obj[mat] = {};
    MATERIAS[mat].forEach(a => obj[mat][a] = 0);
  });
  return obj;
}

/* ============================================================
   ESTADO ATUAL
============================================================ */

export let state = JSON.parse(JSON.stringify(defaultState));

/* ============================================================
   Carregar estado local
============================================================ */

export function loadState() {
  const raw = localStorage.getItem("progresso_estudos_v2");

  if (!raw) {
    state.materias = createDefaultMaterias();
    saveLocal();
    return state;
  }

  const parsed = JSON.parse(raw);

  state = {
    ...state,
    ...parsed,
    materias: parsed.materias || createDefaultMaterias(),
    notes: parsed.notes || {},
  };

  return state;
}

/* ============================================================
   Salvar estado local
============================================================ */

export function saveLocal(updatedState = null) {
  if (updatedState) state = updatedState;
  state.updatedAt = Date.now();

  localStorage.setItem("progresso_estudos_v2", JSON.stringify(state));
}

/* ============================================================
   Cálculos de progresso
============================================================ */

export function calculateMateriaPercent(materia) {
  const assuntos = state.materias[materia];
  const total = Object.keys(assuntos).length;

  if (total === 0) return 0;

  const soma = Object.values(assuntos).reduce((a, b) => a + b, 0);
  return Math.round((soma / total) * 100);
}

export function calculateConcursoPercent() {
  let soma = 0, qtd = 0;

  for (const mat of Object.keys(MATERIAS)) {
    soma += calculateMateriaPercent(mat);
    qtd++;
  }

  return Math.round(soma / qtd);
}

export function calculateGlobalPercent() {
  return calculateConcursoPercent();
}
