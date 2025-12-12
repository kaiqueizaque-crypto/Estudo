/* ============================================================
   SYNC.JS — Sincronização com Google Drive
   - Faz download/upload do progresso
   - Faz merge automático entre dispositivos
   - Usa state.js como fonte master
============================================================ */

import {
  state,
  saveLocal,
  defaultState   // agora EXISTE
} from "./state.js";

import {
  loadSavedToken,
  findAppDataFile,
  createAppDataFile,
  updateAppDataFile,
  downloadAppDataFile
} from "../auth.js";


/* ============================================================
   Controle de debounce para evitar uploads excessivos
============================================================ */

let saveTimer = null;

export function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(syncToDrive, 1200);
}


/* ============================================================
   Função de MERGE inteligente
============================================================ */

export function mergeStates(local, remote) {

  const merged = {
    materias: {},
    notes: {},
    updatedAt: Math.max(local.updatedAt, remote.updatedAt)
  };

  // Mesclar matérias (assuntos)
  const materias = new Set([
    ...Object.keys(local.materias),
    ...Object.keys(remote.materias)
  ]);

  materias.forEach(mat => {
    merged.materias[mat] = {};
    const assuntos = new Set([
      ...Object.keys(local.materias[mat] || {}),
      ...Object.keys(remote.materias[mat] || {})
    ]);

    assuntos.forEach(a => {
      const lv = local.materias[mat]?.[a] ?? 0;
      const rv = remote.materias[mat]?.[a] ?? 0;

      // Regras:
      // - Se um marcou e o outro não → pega o maior valor
      // - Se ambos marcaram diferentes → pega o maior valor
      // - Se ambos 0 → fica 0
      merged.materias[mat][a] = Math.max(lv, rv);
    });
  });

  // Mesclar notas
  merged.notes = { ...remote.notes, ...local.notes };

  return merged;
}



/* ============================================================
   Upload do estado local → Drive
============================================================ */

async function syncToDrive() {
  const token = loadSavedToken();
  if (!token) return;

  try {
    const file = await findAppDataFile("progresso_estudos.json");

    if (!file) {
      await createAppDataFile("progresso_estudos.json", state);
      console.log("Drive: arquivo criado.");
      return;
    }

    await updateAppDataFile(file.id, state);
    console.log("Drive: progresso enviado.");

  } catch (e) {
    console.error("Erro ao sincronizar com Drive:", e);
  }
}



/* ============================================================
   Sincronização completa (download + merge + upload)
============================================================ */

export async function fullSync() {

  const token = loadSavedToken();
  if (!token) {
    console.warn("Sem token — ignorando sync.");
    return;
  }

  try {

    document.getElementById("syncStatus").textContent = "Sincronizando...";

    const file = await findAppDataFile("progresso_estudos.json");

    if (!file) {
      // Primeiro uso → criar arquivo remoto
      await createAppDataFile("progresso_estudos.json", state);
      document.getElementById("syncStatus").textContent = "Arquivo criado no Drive";
      return;
    }

    const remote = await downloadAppDataFile(file.id);

    // MERGE ENTRE ESTADOS
    const merged = mergeStates(state, remote);

    // Salvar localmente
    saveLocal(merged);

    // Atualizar objeto state usado pela UI
    state.materias = merged.materias;
    state.notes = merged.notes;
    state.updatedAt = merged.updatedAt;

    // Mandar estado final para Drive
    await updateAppDataFile(file.id, merged);

    document.getElementById("syncStatus").textContent = "Sincronizado!";

  } catch (e) {
    console.error("Erro no sync:", e);
    document.getElementById("syncStatus").textContent = "Erro ao sincronizar";
  }
}

