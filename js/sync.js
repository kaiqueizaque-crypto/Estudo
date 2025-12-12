/* ============================================================
   /js/sync.js
   Sincronização com Google Drive (AppDataFolder)
   Depende de:
     - auth.js → loadSavedToken, findAppDataFile, createAppDataFile,
                 updateAppDataFile, downloadAppDataFile
     - state.js → state, saveLocal, defaultState
============================================================ */

import {
  loadSavedToken,
  findAppDataFile,
  createAppDataFile,
  updateAppDataFile,
  downloadAppDataFile
} from "../auth.js";

import {
  state,
  saveLocal,
  defaultState
} from "./state.js";

/* Nome do arquivo remoto */
const DRIVE_FILENAME = "progresso_estudos.json";

/* Elemento de status */
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
   ↓↓↓ Função principal de sincronização ↓↓↓
============================================================ */
export async function syncNow() {
  setSyncStatus("sincronizando...");

  // 1. Verificar token
  const token = loadSavedToken();
  if (!token) {
    setSyncStatus("não autenticado");
    return;
  }

  try {
    // 2. Procurar arquivo remoto
    const file = await findAppDataFile(DRIVE_FILENAME);

    await createAppDataFile(data);

    // 3. Baixar remoto
    const remote = await downloadAppDataFile(file.id);

    if (!remote) {
      setSyncStatus("erro ao baixar");
      return;
    }

    // 4. Merge
    const merged = mergeStates(state, remote);

    // Decidir se precisa subir ou baixar
    if (merged.updatedAt === (remote.updatedAt || 0)) {
      // remoto mais novo → salvar local
      saveLocal(merged);
      setSyncStatus("sincronizado (baixado)");
    } else {
      // local mais novo → subir
      saveLocal(merged);
      await updateAppDataFile(file.id, merged);
      setSyncStatus("sincronizado (enviado)");
    }

  } catch (e) {
    console.error("Erro na sincronização:", e);
    setSyncStatus("erro");
  }
}

/* ============================================================
   Debounced auto-save → agenda upload automático ao Drive
============================================================ */
let _saveTimer = null;

export function scheduleSave() {
  saveLocal(); // sempre salva local

  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    const token = loadSavedToken();
    if (!token) {
      setSyncStatus("offline (local)");
      return;
    }
    syncNow();
  }, 900);
}

