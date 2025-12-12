/* ============================================================
   util.js — Funções auxiliares usadas por toda a aplicação
============================================================ */

/* --------------------------------------------
   Seleção rápida
-------------------------------------------- */
export function el(id) {
  return document.getElementById(id);
}

export function qs(selector) {
  return document.querySelector(selector);
}

export function qsa(selector) {
  return Array.from(document.querySelectorAll(selector));
}


/* --------------------------------------------
   Deep clone universal (seguro)
-------------------------------------------- */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}


/* --------------------------------------------
   Debounce universal
-------------------------------------------- */
export function debounce(fn, delay = 500) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}


/* --------------------------------------------
   Salvar e carregar JSON do LocalStorage
-------------------------------------------- */
export function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadJSON(key, fallback = null) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.warn("Erro ao ler JSON:", key, e);
    return fallback;
  }
}


/* --------------------------------------------
   Função auxiliar para downloads de JSON
-------------------------------------------- */
export function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}


/* --------------------------------------------
   Detectar se está rodando em GitHub Pages
-------------------------------------------- */
export function isGithubPages() {
  return location.hostname.includes("github.io");
}


/* --------------------------------------------
   Criar atraso (await sleep)
-------------------------------------------- */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


/* --------------------------------------------
   Log amigável
-------------------------------------------- */
export function log(...msg) {
  console.log("%c[EstudoApp]", "color:#0b5ea8;font-weight:bold;", ...msg);
}
