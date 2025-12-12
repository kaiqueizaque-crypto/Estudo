/* ============================================================
   SERVICE WORKER — Plano de Estudos
   Versão leve, segura e compatível com GitHub Pages
============================================================ */

const CACHE_NAME = "estudos-cache-v2";

/* Liste aqui somente arquivos essenciais para carregar o app */
const APP_SHELL = [
  "./",
  "./index.html",
  "./login.html",
  "./manifest.json",

  "./css/style.css",

  "./auth.js",
  "./js/app.js",
  "./js/state.js",
  "./js/sync.js",
  "./js/ui.js",
  "./js/util.js",

  "./logo.png",
  "./logo2.png"
];

/* ============================================================
   INSTALL — cria o cache inicial
============================================================ */
self.addEventListener("install", event => {
  console.log("[SW] Install…");

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("[SW] Cache criado");
      return cache.addAll(APP_SHELL);
    })
  );

  self.skipWaiting(); // força ativação imediata
});

/* ============================================================
   ACTIVATE — limpa versões antigas do cache
============================================================ */
self.addEventListener("activate", event => {
  console.log("[SW] Activate…");

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key =>
          key !== CACHE_NAME ? caches.delete(key) : null
        )
      )
    )
  );

  self.clients.claim();
});

/* ============================================================
   FETCH — responde offline SEM interferir no Google APIs
============================================================ */
self.addEventListener("fetch", event => {
  const url = event.request.url;

  // Nunca interceptar APIs do Google (Drive / Login)
  if (url.includes("googleapis.com") ||
      url.includes("gstatic.com") ||
      url.includes("accounts.google.com")) {
    return; // deixa a requisição seguir direto
  }

  // Cache-first seguro para conteúdo estático
  event.respondWith(
    caches.match(event.request).then(cached => {
      return (
        cached ||
        fetch(event.request).catch(() => {
          // fallback opcional
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        })
      );
    })
  );
});
