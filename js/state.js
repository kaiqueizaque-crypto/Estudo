// state.js
// ----------------------------
// ESTADO PADRÃO DO APLICATIVO
// ----------------------------

// Lista de concursos disponíveis:
export const CONCURSOS = {
    "pc_ba": {
        nome: "Polícia Civil - PC-BA",
        materias: [
            "Língua Portuguesa",
            "Raciocínio Lógico",
            "Direito Penal",
            "Direito Processual Penal",
            "Direitos Humanos",
            "Informática"
        ]
    },

    "prf_adm": {
        nome: "PRF Administrativo",
        materias: [
            "Língua Portuguesa",
            "Raciocínio Lógico",
            "Informática",
            "Administração",
            "Ética",
            "Legislação de Trânsito"
        ]
    }
};

// Estado inicial salvo localmente
export const defaultState = {
    selectedContest: "pc_ba",

    materias: {},  
    notes: {},      

    updatedAt: 0
};

// Carrega estado salvo do navegador
export function loadState() {
    const raw = localStorage.getItem("progresso_estudos_v1");
    return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(defaultState));
}

// Salva estado local
export function saveState(state) {
    state.updatedAt = Date.now();
    localStorage.setItem("progresso_estudos_v1", JSON.stringify(state));
}
