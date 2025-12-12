// ======================================================
// state.js — Gerencia o estado local do aplicativo
// ======================================================

// Nome da chave usada no LocalStorage
const STORAGE_KEY = "progresso_estudos_v2";

// Estado padrão
export let state = {
    materias: {},
    notes: {},
    updatedAt: 0
};

// ------------------------------------------------------
// Carrega o estado salvo no browser
// ------------------------------------------------------
export function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return state;

        const parsed = JSON.parse(raw);

        // Mantém estrutura mínima garantida
        state = {
            materias: parsed.materias || {},
            notes: parsed.notes || {},
            updatedAt: parsed.updatedAt || 0
        };

        return state;
    } catch (e) {
        console.error("Erro ao carregar state:", e);
        return state;
    }
}

// ------------------------------------------------------
// Salva alterações localmente
// ------------------------------------------------------
export function saveState(newState = null) {
    if (newState) state = newState;
    state.updatedAt = Date.now();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ------------------------------------------------------
// Atualiza apenas um campo específico
// ------------------------------------------------------
export function updateState(path, value) {
    let obj = state;

    // path = "materias.pc_ba.progresso"
    const parts = path.split(".");

    while (parts.length > 1) {
        const part = parts.shift();
        obj[part] = obj[part] || {};
        obj = obj[part];
    }

    obj[parts[0]] = value;

    saveState(state);
}
