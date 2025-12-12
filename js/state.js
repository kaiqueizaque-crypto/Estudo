/* ============================================================
   STATE.JS — Estado central do aplicativo
============================================================ */

/*  
   ESTRUTURA:
   - CONCURSOS: lista de concursos e suas matérias
   - MATERIAS: assuntos de cada matéria
   - state: estrutura principal usada em toda a aplicação
   - Funções para carregar, salvar e calcular progresso
*/

/* ============================================================
   LISTA DE CONCURSOS
============================================================ */

export const CONCURSOS = {
  pc_ba: "Polícia Civil - PC-BA",
  prf_adm: "PRF Administrativo"
};

/* ============================================================
   LISTA DE MATÉRIAS E ASSUNTOS
============================================================ */

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
   ESTADO PRINCIPAL
============================================================ */

export let state = {
  selectedContest: "pc_ba",
  materias: {},   // cada matéria → { assunto: 0 | 0.5 | 1 }
  notes: {},      // notas por matéria
  updatedAt: 0
};

/* Criar estrutura inicial */
function createDefaultMaterias() {
  const obj = {};
  Object.keys(MATERIAS).forEach(mat => {
    obj[mat] = {};
    MATERIAS[mat].forEach(a => obj[mat][a] = 0);
  });
  return obj;
}

/* ============================================================
   CARREGAR ESTADO LOCAL
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
   SALVAR ESTADO LOCAL
============================================================ */

export function saveLocal() {
  state.updatedAt = Date.now();
  localStorage.setItem("progresso_estudos_v2", JSON.stringify(state));
}

/* ============================================================
   CÁLCULO DE PROGRESSO
============================================================ */

export function calculateMateriaPercent(materia) {
  const assuntos = state.materias[materia];
  const total = Object.keys(assuntos).length;

  if (total === 0) return 0;

  const soma = Object.values(assuntos).reduce((a, b) => a + b, 0);

  // 0 = 0%, 0.5 = 50%, 1 = 100%
  return Math.round((soma / total) * 100);
}

export function calculateConcursoPercent(contest) {
  let somatorio = 0;
  let qtd = 0;

  Object.keys(MATERIAS).forEach(mat => {
    somatorio += calculateMateriaPercent(mat);
    qtd++;
  });

  return Math.round(somatorio / qtd);
}

export function calculateGlobalPercent() {
  return calculateConcursoPercent(state.selectedContest);
}

