/* ============================================================
   SYNC.JS — Sincronização com Drive + MERGE avançado
============================================================ */

import { state, saveLocal, defaultState } from "./state.js";
import {
  findAppDataFile,
  createAppDataFile,
  updateAppDataFile,
  downloadAppDataFile
} from "../auth.js";

export const DRIVE_FILENAME = "progresso_estudos.json";

/* Elemento de status (opcional) */
function setSyncStatus(msg) {
  const el = document.getElementById("syncStatus");
  if (el) el.textContent = msg;
}


/* ============================================================
   MERGE inteligente — une local + remoto sem perder nada
============================================================ */
export function mergeStates(local, remote) {

  const merged = JSON.parse(JSON.stringify(local)); // deep clone

  /* --------------------------------------------
     1. Mesclar MATERIAS / ASSUNTOS
  -------------------------------------------- */
  for (const materia of Object.keys(remote.materias || {})) {

    if (!merged.materias[materia])
      merged.materias[materia] = {};

    for (const assunto of Object.keys(remote.materias[materia])) {

      const localValue = merged.materias[materia][assunto] ?? 0;
      const remoteValue = remote.materias[materia][assunto] ?? 0;

      // Mantém o maior progresso (0, 0.5 ou 1)
      merged.materias[materia][assunto] = Math.max(localValue, remoteValue);
    }
  }

  /* --------------------------------------------
     2. Mesclar NOTAS
  -------------------------------------------- */
  for (const materia of Object.keys(remote.notes || {})) {
    if (!merged.notes[materia]) {
      merged.notes[materia] = remote.notes[materia];
    } else {
      // Nota mais extensa = normalmente mais nova
      merged.notes[materia] =
        merged.notes[materia].length > remote.notes[materia].length
        ? merged.notes[materia]
        : remote.notes[materia];
    }
  }

  /* --------------------------------------------
     3. Timestamp atualizado para resolver conflitos futuros
  -------------------------------------------- */
  merged.updatedAt = Math.max(local.updatedAt || 0, remote.updatedAt || 0);

  return merged;
}


/* ============================================================
   Salvar no Drive usando merge seguro
============================================================ */
export async function saveToDriveNow() {
  try {
    setSyncStatus("Sincronizando...");

    const file = await findAppDataFile(DRIVE_FILENAME).catch(() => null);

    if (!file) {
      // Primeira vez no Drive
      await createAppDataFile(DRIVE_FILENAME, state);
      setSyncStatus("Criado no Drive");
      return;
    }

    // Baixar remoto
    const remote = await downloadAppDataFile(file.id).catch(() => null);

    if (!remote) {
      console.warn("Não foi possível baixar o arquivo remoto.");
      setSyncStatus("Drive indisponível");
      return;
    }

    // MERGE local + remoto
    const merged = mergeStates(state, remote);

    // Atualiza estado local
    Object.assign(state, merged);
    saveLocal(state);

    // Sobe o arquivo mesclado
    await updateAppDataFile(file.id, state);
    setSyncStatus("Sincronizado (merge)");

  } catch (e) {
    console.error("Erro de sync:", e);
    setSyncStatus("Erro ao sincronizar");
  }
}


/* ============================================================
   Debounce de sincronização
============================================================ */

let _saveTimer = null;

export function scheduleSave() {
  saveLocal(state); // salva imediatamente no local

  if (_saveTimer) clearTimeout(_saveTimer);

  _saveTimer = setTimeout(async () => {
    await saveToDriveNow();
  }, 700);
}


/* ============================================================
   Sincronização inicial ao abrir o app
============================================================ */
export async function initialSync() {

  try {
    setSyncStatus("Sincronizando...");

    const file = await findAppDataFile(DRIVE_FILENAME).catch(() => null);

    if (!file) {
      // Se não existe arquivo remoto → cria usando local
      await createAppDataFile(DRIVE_FILENAME, state);
      setSyncStatus("Criado no Drive");
      return;
    }

    const remote = await downloadAppDataFile(file.id).catch(() => null);

    if (!remote) {
      setSyncStatus("Erro ao baixar remoto");
      return;
    }

    // merge inicial
    const merged = mergeStates(state, remote);
    Object.assign(state, merged);
    saveLocal(state);

    setSyncStatus("Sincronizado");

  } catch (e) {
    console.error("Erro sync inicial:", e);
    setSyncStatus("Erro inicial");
  }
}
