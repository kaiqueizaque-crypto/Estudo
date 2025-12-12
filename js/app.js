/* ============================================================
   app.js — controlador principal (eventos e boot)
   Integra: state.js, ui.js, sync.js, auth.js
============================================================ */

import { state, loadState, saveState } from "./state.js";
import { mergeStates } from "./util.js";
import { renderUI } from "./ui.js";
import { syncDrive } from "./sync.js";
import { loadSavedToken, logout } from "../auth.js";

/* ---------- Helpers ---------- */

function el(id) { return document.getElementById(id); }

function downloadObjectAsJson(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ---------- Export / Import Handlers ---------- */

function handleExport() {
  downloadObjectAsJson(State.state, "progresso_estudos.json");
}

function handleImport() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.addEventListener("change", async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const txt = await f.text();
      const parsed = JSON.parse(txt);
      // merge lightly: prefer imported content but keep missing fields
      const base = State.defaultState();
      const merged = Object.assign(base, parsed);
      // Overwrite State.state and persist
      State.state = merged;
      State.saveLocal();
      UI.renderActiveContest();
      // schedule remote sync (merge)
      Sync.scheduleSave();
      alert("Import concluído");
    } catch (err) {
      console.error("Import error:", err);
      alert("Arquivo inválido");
    }
  });
  input.click();
}

/* ---------- Clear caches / service worker ---------- */

async function handleClearCaches() {
  try {
    if (navigator.serviceWorker) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) await r.unregister();
    }
    if (window.caches) {
      const keys = await caches.keys();
      for (const k of keys) await caches.delete(k);
    }
    alert("Service worker e caches removidos. Recarregue a página (Ctrl+F5).");
  } catch (e) {
    console.warn("clear caches fail", e);
    alert("Falha ao limpar caches. Veja console.");
  }
}

/* ---------- Forçar download do Drive (utilitário de debug) ---------- */

async function handleForceDownloadFromDrive() {
  try {
    document.getElementById("syncStatus").textContent = "Forçando download do Drive...";
    await Sync.initialSync(); // initialSync executa merge e salva local
    UI.renderActiveContest();
    document.getElementById("syncStatus").textContent = "Download forçado concluído";
  } catch (e) {
    console.error("force download failed", e);
    document.getElementById("syncStatus").textContent = "Erro ao forçar download";
  }
}

/* ---------- Montar área de autenticação (logout) ---------- */

function renderAuthArea() {
  const authArea = el("authArea");
  if (!authArea) return;
  authArea.innerHTML = "";
  const btn = document.createElement("button");
  btn.className = "small btn-ghost";
  btn.textContent = "Sair";
  btn.addEventListener("click", () => {
    logout();
  });
  authArea.appendChild(btn);
}

/* ---------- Setup dos eventos do app (exportado) ---------- */

export function setupAppEvents() {
  // Garantir que o state esteja inicializado
  if (!State.state) State.initState();

  // Inicializar UI
  UI.initLayout();

  // Atachar botões (existem no DOM)
  const exportBtn = el("exportBtn");
  const importBtn = el("importBtn");
  const syncBtn = el("syncBtn");
  const clearCachesBtn = el("clearCaches");

  if (exportBtn) exportBtn.addEventListener("click", handleExport);
  if (importBtn) importBtn.addEventListener("click", handleImport);
  if (syncBtn) syncBtn.addEventListener("click", () => {
    document.getElementById("syncStatus").textContent = "Sincronizando (manual)...";
    Sync.saveToDriveNow();
  });
  if (clearCachesBtn) clearCachesBtn.addEventListener("click", handleClearCaches);

  // adicionar item opcional: forçar download remoto ao clicar com Shift+Click no botão Sync
  if (syncBtn) {
    syncBtn.addEventListener("click", (ev) => {
      if (ev.shiftKey) handleForceDownloadFromDrive();
    });
  }

  // Render auth area (logout)
  renderAuthArea();

  // Se o usuário não estiver autenticado → redireciona (segurança extra)
  if (!loadSavedToken()) {
    window.location.href = "./login.html";
    return;
  }

  // inicializar uma sincronização ao boot (não bloqueante)
  Sync.initialSync().then(() => {
    // atualizar UI após o sync
    UI.renderActiveContest();
  }).catch((e) => {
    console.warn("initialSync error", e);
    UI.renderActiveContest();
  });

  // salvar antes de fechar (precaução)
  window.addEventListener("beforeunload", () => {
    try { State.saveLocal(); } catch {}
  });
}

/* ---------- Export util for debugging ---------- */
window.__STUDY_APP = {
  getState: () => State.state,
  saveNow: () => Sync.saveToDriveNow(),
  initialSync: () => Sync.initialSync()

};
