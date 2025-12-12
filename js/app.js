/* ============================================================
   app.js — Ação principal do aplicativo
============================================================ */

import { loadSavedToken, logout } from "./auth.js";
import { state, saveLocal } from "./state.js";
import { syncNow } from "./sync.js";
import { initLayout, renderActiveContest } from "./ui.js"; // <- REMOVIDO renderMaterias

/* ------------------------------------------------------------
   ELEMENTOS
------------------------------------------------------------ */
const btnLogout = document.getElementById("btnLogout");
const btnSync = document.getElementById("btnSync");
const syncStatus = document.getElementById("syncStatus");

/* ------------------------------------------------------------
   BOOT DO APLICATIVO
------------------------------------------------------------ */
window.addEventListener("load", async () => {
  const token = loadSavedToken();

  if (!token) {
    syncStatus.textContent = "Status: não autenticado";
    return;
  }

  initLayout();
  syncStatus.textContent = "Status: aguardando";

  console.log("APP iniciado com sucesso!");
});

/* ------------------------------------------------------------
   BOTÃO — Sincronizar Drive
------------------------------------------------------------ */
btnSync.addEventListener("click", async () => {
  syncStatus.textContent = "Status: sincronizando...";
  try {
    await syncNow();
    syncStatus.textContent = "Status: sincronizado!";
  } catch (err) {
    console.error(err);
    syncStatus.textContent = "Status: erro";
  }
});

/* ------------------------------------------------------------
   BOTÃO — Sair
------------------------------------------------------------ */
btnLogout.addEventListener("click", () => {
  logout();
});
