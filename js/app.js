/* ============================================================
   /js/app.js
   Boot principal do aplicativo
============================================================ */

import { loadSavedToken, logout } from "../auth.js";
import { initState, saveLocal, state } from "./state.js";
import { initLayout, renderActiveContest } from "./ui.js";
import { syncNow } from "./sync.js";
import { loadFileAsText } from "./util.js";

/* ============================================================
   FUNÇÃO DE INICIALIZAÇÃO
============================================================ */
async function boot() {

  /* 1) Verificar token de login */
  const token = loadSavedToken();
  if (!token) {
    console.warn("Token ausente → redirecionando para login...");
    window.location.href = "./login.html";
    return;
  }

  /* 2) Carregar estado local */
  initState();

  /* 3) Montar interface */
  initLayout();

  /* 4) Mostrar app */
  document.getElementById("app").style.display = "grid";

  /* 5) Sincronizar imediatamente após login */
  await syncNow();

  /* 6) Configurar botões da Sidebar */
  setupButtons();

  console.log("APP iniciado com sucesso!");
}

/* ============================================================
   CONFIGURAÇÃO DOS BOTÕES
============================================================ */
function setupButtons() {

  /* BOTÃO → Exportar JSON */
  document.getElementById("exportBtn").onclick = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "progresso_estudos.json";
    a.click();

    URL.revokeObjectURL(url);
  };

  /* BOTÃO → Importar JSON */
  document.getElementById("importBtn").onclick = () => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "application/json";

    inp.onchange = async (ev) => {
      const file = ev.target.files[0];
      if (!file) return;

      try {
        const txt = await loadFileAsText(file);
        const parsed = JSON.parse(txt);

        Object.assign(state, parsed);
        saveLocal(state);
        renderActiveContest();

        alert("Importado com sucesso!");

      } catch (e) {
        alert("Arquivo JSON inválido.");
        console.error(e);
      }
    };

    inp.click();
  };

  /* BOTÃO → Sincronizar manualmente */
  document.getElementById("syncBtn").onclick = () => {
    syncNow();
  };

  /* BOTÃO → Logout */
  document.getElementById("authArea").innerHTML = `
    <button id="logoutBtn" class="small btn-ghost">Sair da conta</button>
  `;
  document.getElementById("logoutBtn").onclick = () => logout();

  /* BOTÃO → Limpar cache PWA */
  const clearBtn = document.getElementById("clearCaches");
  if (clearBtn) {
    clearBtn.onclick = async () => {
      if (navigator.serviceWorker) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) await r.unregister();
      }
      if (window.caches) {
        const keys = await caches.keys();
        for (const k of keys) await caches.delete(k);
      }
      alert("Cache PWA limpo. Recarregue (Ctrl + F5).");
    };
  }
}

/* ============================================================
   Iniciar aplicação
============================================================ */
boot();
