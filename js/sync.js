/* ============================================================
   /js/sync.js
   Sincronização com Google Drive (AppDataFolder)
============================================================ */

import {
  loadSavedToken,
  findAppDataFile,
  createAppDataFile,
  updateAppDataFile,
  downloadAppDataFile
} from "./auth.js";

import {
  state,
  saveLocal,
  defaultState
} from "./state.js";

/* --------------------------- */
/* Elemento de status visual   */
/* --------------------------- */
function setSyncStatus(txt) {
  const el = document.getElementById("syncStatus");
  if (el) el.textContent = "Status: " + txt;
}

/* ============================================================
   MERGE Inteligente (local x remoto)
============================================================ */
function mergeStates(local, remote) {
  const merged = JSON.parse(JSON.stringify(defaultState));

  merged.updatedAt = Math.max(local.updatedAt || 0, remote.updatedAt || 0);

  /* Mesclar matérias */
  merged.materias = {};
  const materiasLocal = local.materias || {};
  const materiasRemote = remote.materias || {};

  const allMaterias = new Set([
    ...Object.keys(materiasLocal),
    ...Object.keys(materiasRemote)
  ]);

  allMaterias.forEach(m => {
    merged.materias[m] = {};
    const aLocal = materiasLocal[m] || {};
    const aRemote = materiasRemote[m] || {};
    const allAssuntos = new Set([...Object.keys(aLocal), ...Object.keys(aRemote)]);

    allAssuntos.forEach(a => {
      const vLocal = aLocal[a] ?? 0;
      const vRemote = aRemote[a] ?? 0;
      merged.materias[m][a] = Math.max(vLocal, vRemote);
    });
  });

  /* Mesclar notas */
  merged.notes = {};
  const notesLocal = local.notes || {};
  const notesRemote = remote.notes || {};
  const allNotes = new Set([...Object.keys(notesLocal), ...Object.keys(notesRemote)]);

  allNotes.forEach(mat => {
    const nl = notesLocal[mat];
    const nr = notesRemote[mat];
    if (!nl) merged.notes[mat] = nr;
    else if (!nr) merged.notes[mat] = nl;
    else merged.notes[mat] = nl.length >= nr.length ? nl : nr;
  });

  return merged;
}

/* ============================================================
   SINCRONIZAÇÃO PRINCIPAL
============================================================ */

export async function syncNow() {
  setSyncStatus("sincronizando...");

  // 1. Garantir usuário autenticado
  const token = loadSavedToken();
  if (!token) {
    setSyncStatus("não autenticado");
    return;
  }

  try {
    // 2. Procurar arquivo no Drive
    const file = await findAppDataFile();

    if (!file) {
      // 2A. Arquivo não existe → criar novo
      await createAppDataFile(state.export());
      setSyncStatus("criado no Drive");
      return;
    }

    let remote = null;

    try {
      // 3. Tentar baixar arquivo remoto
      remote = await downloadAppDataFile(file.id);
    } catch (err) {
      console.warn("Falha ao baixar arquivo remoto. Criando arquivo novo.", err);

      await createAppDataFile(state.export());
      setSyncStatus("criado novo arquivo");
      return;
    }

    // 4. Fazer merge local + remoto
    const merged = mergeStates(state.export(), remote);

    // 5. Salvar localmente
    saveLocal(merged);

    // 6. Tentar atualizar arquivo remoto
    try {
      await updateAppDataFile(file.id, merged);
      setSyncStatus("sincronizado");
    } catch (err) {
      console.warn("Falha ao atualizar (403). Criando novo arquivo remoto.", err);

      // PERMISSÃO NEGADA → RECRIAR ARQUIVO (CORREÇÃO DO 403)
      await createAppDataFile(merged);
      setSyncStatus("arquivo recriado");
    }

  } catch (err) {
    console.error("Erro na sincronização:", err);
    setSyncStatus("erro");
  }
}

