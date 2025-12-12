// ======================================================
// sync.js — Sincronização com Google Drive (AppData)
// ======================================================

import { state, saveState, loadState } from "./state.js";
import { mergeStates } from "./util.js";
import {
    findAppDataFile,
    createAppDataFile,
    updateAppDataFile,
    downloadAppDataFile
} from "../auth.js";

// Nome fixo do arquivo no Drive
const DRIVE_FILENAME = "progresso_estudos.json";

// ------------------------------------------------------
// Sincronização Completa (com merge inteligente)
// ------------------------------------------------------
export async function syncDrive() {
    const localState = loadState();
    const status = document.getElementById("syncStatus");
    status.textContent = "Sincronizando...";

    try {
        const file = await findAppDataFile(DRIVE_FILENAME);

        // ========== (1) Primeiro uso — cria arquivo remoto ==========
        if (!file) {
            await createAppDataFile(DRIVE_FILENAME, localState);
            status.textContent = "Sincronizado (criado)";
            return;
        }

        // ========== (2) Baixa remoto ==========
        const remote = await downloadAppDataFile(file.id);

        // ========== (3) Realiza merge inteligente ==========
        const merged = mergeStates(localState, remote);

        // atualiza local
        saveState(merged);

        // atualiza remoto
        await updateAppDataFile(file.id, merged);

        status.textContent = "Sincronizado (merge OK)";

    } catch (e) {
        console.error("Erro ao sincronizar:", e);
        status.textContent = "Erro ao sincronizar";
    }
}
