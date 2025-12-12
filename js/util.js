/* ============================================================
   /js/util.js
   Funções utilitárias gerais usadas pelo app
   (pensado para manter o projeto organizado)
============================================================ */

/* ------------------------------------------------------------
   Formatar datas (opcional)
------------------------------------------------------------ */
export function formatDate(ts) {
  if (!ts) return "-";
  const d = new Date(ts);
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR");
}

/* ------------------------------------------------------------
   Debounce genérico (não usado no sync, mas útil no app)
------------------------------------------------------------ */
export function debounce(fn, delay = 300) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* ------------------------------------------------------------
   Criar elemento rápido com classes / HTML
------------------------------------------------------------ */
export function el(tag, className = "", html = "") {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (html) e.innerHTML = html;
  return e;
}

/* ------------------------------------------------------------
   Carregar arquivo JSON (para import manual)
------------------------------------------------------------ */
export function loadFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);

    reader.readAsText(file);
  });
}
