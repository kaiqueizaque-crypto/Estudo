/* ============================================================
   /js/app.js
   Inicialização principal do aplicativo
============================================================ */

import { loadSavedToken, logout } from "./auth.js";
import { state, saveLocal } from "./state.js";
import { syncNow } from "./sync.js";
import { renderMaterias } from "./ui.js";

/* -------------------------
   BOTÕES E ELEMENTOS
-------------------------- */
const btnLogout = document.getElementById("btnLogout");
const btnExport = document.getElementById("btnExport");
const btnImport = document.getElementById("btnImport");
const btnSync   = document.getElementById("btnSync");
const btnPwa    = document.getElementById("btnPwa");

/* -------------------------
   EXPORTAR JSON
-------------------------- */
function exportJSON() {
  const data = state.export();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "progresso_estudos.json";
  a.click();
}

/* -------------------------
   IMPORTAR JSON
-------------------------- */
function importJSON() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";

  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        saveLocal(data);
        renderMaterias();
        alert("Importado com sucesso!");
      } catch (e) {
        alert("Arquivo JSON inválido.");
      }
    };

    reader.readAsText(file);
  };

  input.click();
}

/* -------------------------
   Limpar cache PWA
-------------------------- */
async function clearPwaCache() {
  if (!("caches" in window)) {
    alert("O navegador não suporta Cache API.");
    return;
  }

  const list = await caches.keys();
  for (const key of list) {
    await caches.delete(key);
  }

  alert("Cache PWA limpo! Recarregue o app.");
}

/* ============================================================
   BOOT PRINCIPAL
============================================================ */

async function boot() {
  console.log("Iniciando aplicação...");

  // 1. Verificar login
  const token = loadSavedToken();
  if (!token) {
    console.warn("Usuário não logado — redirecionando");
    window.location.href = "./login.html";
    return;
  }

  console.log("Usuário autenticado");

  // 2. Renderizar UI inicial
  renderMaterias();

  // 3. Sincronização automática ao abrir
  try {
    await syncNow();
  } catch (err) {
    console.error("Erro na sincronização inicial:", err);
  }

  console.log("APP iniciado com sucesso!");
}

/* ============================================================
   EVENTOS
============================================================ */

btnLogout?.addEventListener("click", logout);
btnExport?.addEventListener("click", exportJSON);
btnImport?.addEventListener("click", importJSON);
btnSync?.addEventListener("click", syncNow);
btnPwa?.addEventListener("click", clearPwaCache);

/* ============================================================
   INICIAR APLICAÇÃO
============================================================ */
boot();
