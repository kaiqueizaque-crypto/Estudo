/* ============================================================
   STATE.JS — Gerenciamento de estado local
============================================================ */

export const STORAGE_KEY = "progresso_estudos_v1";

export const MATERIAS = {
  "Língua Portuguesa": [
    "Interpretação de textos","Tipologia e gêneros textuais","Pontuação",
    "Concordância nominal e verbal","Regência","Crase",
    "Coesão e coerência","Semântica","Ortografia"
  ],
  
  "Direito Constitucional": [
    "Direitos e garantias fundamentais","Poderes do Estado",
    "Organização administrativa do Estado","Art. 144 - Segurança Pública",
    "Controle de constitucionalidade","Administração pública na Constituição"
  ],

  "Direito Administrativo": [
    "Administração direta e indireta","Atos administrativos",
    "Poderes administrativos","Serviços públicos",
    "Licitações e contratos (Lei 14.133/2021)",
    "Improbidade administrativa (Lei 8.429/92)",
    "Responsabilidade civil do Estado","Processo administrativo (Lei 9.784/99)"
  ],

  "Direito Penal": [
    "Crime, fato típico e ilícito","Dolo e culpa",
    "Tipicidade, antijuridicidade e culpabilidade","Concurso de pessoas",
    "Crimes contra a pessoa","Crimes contra o patrimônio",
    "Crimes contra a fé pública","Crimes contra a administração pública"
  ],

  "Raciocínio Lógico": [
    "Proposições e conectivos","Tabelas-verdade","Argumentos e inferências",
    "Problemas básicos","Porcentagem","Razões e proporções",
    "Equações simples","Probabilidade básica"
  ],

  "Direito Processual Penal": [
    "Inquérito policial","Ação penal","Prisões e liberdade provisória",
    "Flagrante","Provas","Competência","Medidas cautelares"
  ],

  "Informática": [
    "Sistemas operacionais (Windows)","Pacote Office","Internet e navegadores",
    "Segurança da informação","Armazenamento em nuvem","E-mail e protocolos"
  ],

  "Direitos Humanos": [
    "Direitos fundamentais","Tratados internacionais",
    "Sistema Interamericano","Princípios de dignidade",
    "Igualdade e não discriminação"
  ],

  "Legislação Penal Especial": [
    "Lei de Drogas","Lei Maria da Penha","ECA","Estatuto do Idoso",
    "Lei de Tortura","Lei de Organizações Criminosas",
    "Lei de Abuso de Autoridade","Estatuto do Desarmamento"
  ],

  "Criminologia": [
    "Conceitos e correntes","Crime, criminoso e vítima",
    "Políticas criminais","Teorias sociológicas"
  ],

  "Noções de Medicina Legal": [
    "Lesões corporais","Tanatologia","Identificação humana","Sexologia forense"
  ],

  "Atualidades": [
    "Cenário nacional e internacional","Economia e política",
    "Tecnologia e inovação","Sustentabilidade","Administração pública moderna"
  ],

  "Arquivologia": [
    "Conceitos de arquivo","Gestão de documentos",
    "Classificação e conservação","Protocolo"
  ],

  "Administração Geral": [
    "Funções administrativas","Gestão de pessoas",
    "Comunicação organizacional","Clima e cultura organizacional"
  ],

  "Administração Financeira e Orçamentária (AFO)": [
    "Orçamento público","Receita e despesa",
    "LOA, LDO, PPA","Execução orçamentária"
  ]
};

export const CONCURSOS = {
  pc_ba: [
    "Língua Portuguesa","Direito Constitucional","Direito Administrativo",
    "Direito Penal","Raciocínio Lógico","Direito Processual Penal",
    "Informática","Direitos Humanos","Legislação Penal Especial",
    "Criminologia","Noções de Medicina Legal"
  ],

  prf_adm: [
    "Língua Portuguesa","Direito Constitucional","Direito Administrativo",
    "Direito Penal","Raciocínio Lógico","Direito Processual Penal",
    "Informática","Direitos Humanos","Atualidades","Arquivologia",
    "Administração Geral","Administração Financeira e Orçamentária (AFO)"
  ]
};


/* ============================================================
   Estado inicial
============================================================ */

export let state = null;

export function defaultState() {
  const base = {
    updatedAt: 0,
    materias: {},
    notes: {}
  };

  for (const materia of Object.keys(MATERIAS)) {
    base.materias[materia] = {};
    for (const assunto of MATERIAS[materia]) {
      base.materias[materia][assunto] = 0;
    }
  }

  return base;
}


/* ============================================================
   Carregar / salvar local
============================================================ */

export function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return Object.assign(defaultState(), JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export function saveLocal() {
  state.updatedAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}


/* ============================================================
   Progresso
============================================================ */

export function calculateMateriaPercent(materia) {
  const assuntos = MATERIAS[materia] || [];
  if (!assuntos.length) return 0;

  let sum = 0;
  assuntos.forEach(a => sum += (state.materias[materia][a] || 0));

  return Math.round((sum / assuntos.length) * 100);
}

export function calculateConcursoPercent(concurso) {
  const materias = CONCURSOS[concurso] || [];
  let total = 0;
  materias.forEach(m => total += calculateMateriaPercent(m));
  return Math.round(total / materias.length);
}

export function calculateGlobalPercent() {
  return Math.round(
    (calculateConcursoPercent("pc_ba") +
     calculateConcursoPercent("prf_adm")) / 2
  );
}


/* ============================================================
   Inicialização
============================================================ */

export function initState() {
  state = loadLocal();
  return state;
}
