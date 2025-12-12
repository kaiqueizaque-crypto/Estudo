/* ============================================================
   /js/ui.js
   Interface completa do aplicativo (matérias, accordion, notas)
============================================================ */

import {
  state,
  MATERIAS,
  CONCURSOS,
  calculateMateriaPercent,
  calculateConcursoPercent,
  calculateGlobalPercent,
  saveLocal
} from "./state.js";

/* ------------------------------------------------------------
   Elementos em cache
------------------------------------------------------------ */
let activeContest = "pc_ba";

const el = {
  contestList: null,
  pageContainer: null,

  percentText: null,
  sidePercent: null,
  globalPercent: null,

  progressCircle: null,
  ringNum: null,
  ringLabel: null,

  modalBackdrop: null,
  modalTitle: null,
  noteArea: null,
  closeModal: null,
  deleteNote: null,
  saveNote: null
};

let currentMateria = null;

/* ============================================================
   Inicialização da interface
============================================================ */
export function initLayout() {
  el.contestList = document.getElementById("contestList");
  el.pageContainer = document.getElementById("pageContainer");

  el.modalBackdrop = document.getElementById("modalBackdrop");
  el.modalTitle = document.getElementById("modalTitle");
  el.noteArea = document.getElementById("noteArea");
  el.closeModal = document.getElementById("closeModal");
  el.deleteNote = document.getElementById("deleteNote");
  el.saveNote = document.getElementById("saveNote");

  setupModalEvents();
  renderContestList();
  renderActiveContest();
}

/* ============================================================
   Renderizar lista de concursos
============================================================ */
function renderContestList() {
  el.contestList.innerHTML = "";

  Object.keys(CONCURSOS).forEach(key => {
    const div = document.createElement("div");
    div.className = "contest-item" + (key === activeContest ? " active" : "");
    div.dataset.key = key;
    div.textContent = CONCURSOS[key];

    div.addEventListener("click", () => {
      activeContest = key;
      state.selectedContest = key;
      saveLocal();
      renderActiveContest();
    });

    el.contestList.appendChild(div);
  });
}

/* ============================================================
   Renderizar página principal do concurso
============================================================ */
export function renderActiveContest() {
  highlightActiveContest();

  const title = CONCURSOS[activeContest];

  el.pageContainer.innerHTML = `
    <div class="header">
      <div>
        <div class="title">${title}</div>
        <div class="meta">Clique na matéria para abrir os assuntos.</div>
      </div>

      <div class="card" style="display:flex;gap:12px;align-items:center;">
        <div style="text-align:right">
          <div id="percentText" style="font-weight:700">0%</div>
          <div class="meta" style="font-size:12px">Progresso</div>
        </div>

        <div class="rings">
          <svg class="ring-outer" id="progressRingSvg" viewBox="0 0 120 120">
            <g transform="translate(60,60)">
              <circle r="52" fill="none" stroke="#e6eef8" stroke-width="12"></circle>
              <circle r="52" fill="none" stroke="var(--primary)" stroke-width="12"
                stroke-linecap="round"
                stroke-dasharray="326.7256"
                stroke-dashoffset="326.7256"
                transform="rotate(-90)">
              </circle>
              <text id="ringNum" x="0" y="6" font-size="16" text-anchor="middle"
                fill="#0b2540" font-weight="700">0%</text>
            </g>
          </svg>
          <div class="ring-label" id="ringLabel">${activeContest}</div>
        </div>
      </div>
    </div>

    <div class="card contest-card">
      <div>
        <div style="display:flex;justify-content:space-between;margin-bottom:10px">
          <strong>Matérias</strong>
          <div class="meta">Clique para expandir</div>
        </div>

        <div class="subject-list" id="subjectList"></div>
      </div>

      <aside>
        <div class="card" style="text-align:center">
          <div id="sidePercent" style="font-weight:700;font-size:16px">0%</div>
          <div class="meta">Progresso do concurso</div>
          <div style="height:12px"></div>
          <div style="font-size:14px;font-weight:600">Progresso Geral</div>
          <div style="height:12px"></div>
          <div id="globalPercent" style="font-size:20px;font-weight:700">0%</div>
        </div>
      </aside>
    </div>
  `;

  el.percentText = document.getElementById("percentText");
  el.sidePercent = document.getElementById("sidePercent");
  el.globalPercent = document.getElementById("globalPercent");
  el.progressCircle = document.querySelector('#progressRingSvg circle:nth-child(2)');
  el.ringNum = document.getElementById("ringNum");
  el.ringLabel = document.getElementById("ringLabel");

  renderMateriaAccordion();
  updateProgressUI();
}

/* ============================================================
   Destaque do concurso ativo
============================================================ */
function highlightActiveContest() {
  document.querySelectorAll(".contest-item").forEach(div => {
    div.classList.toggle("active", div.dataset.key === activeContest);
  });
}

/* ============================================================
   Accordion de matérias
============================================================ */
function renderMateriaAccordion() {
  const container = document.getElementById("subjectList");
  container.innerHTML = "";

  Object.keys(MATERIAS).forEach(materia => {
    const pct = calculateMateriaPercent(materia);

    const card = document.createElement("div");
    card.className = "materia";

    card.innerHTML = `
      <div class="materia-head" data-mat="${materia}">
        <div style="display:flex;gap:12px;align-items:center">
          <div style="width:10px;height:40px;border-radius:6px;background:var(--primary)"></div>
          <div>
            <div class="materia-title">${materia}</div>
            <div class="materia-meta">${MATERIAS[materia].length} assuntos • Progresso: <strong>${pct}%</strong></div>
          </div>
        </div>

        <div style="display:flex;gap:10px;align-items:center">
          <div class="materia-head-percent" style="font-weight:700">${pct}%</div>
          <button class="note-btn small" data-note="${materia}">📝 Nota</button>
        </div>
      </div>

      <div class="assuntos" data-mat="${materia}">
        ${MATERIAS[materia].map(a => `
          <div class="assunto">
            <div class="state-btn" data-sub="${a}"></div>
            <div>${a}</div>
          </div>
        `).join("")}
      </div>
    `;

    const head = card.querySelector(".materia-head");
    const assuntosEl = card.querySelector(".assuntos");

    head.addEventListener("click", e => {
      if (e.target.matches(".note-btn")) return;
      assuntosEl.style.display = assuntosEl.style.display === "flex" ? "none" : "flex";
    });

    head.querySelector(".note-btn").addEventListener("click", e => {
      e.stopPropagation();
      openNoteModal(materia);
    });

    card.querySelectorAll(".state-btn").forEach(btn => {
      const assunto = btn.dataset.sub;

      updateStateBtn(btn, state.materias[materia][assunto]);

      btn.addEventListener("click", e => {
        e.stopPropagation();

        let val = state.materias[materia][assunto] || 0;
        val = val === 0 ? 0.5 : val === 0.5 ? 1 : 0;

        state.materias[materia][assunto] = val;

        updateStateBtn(btn, val);
        saveLocal();           // salvamento local
        renderActiveContest(); // atualizar UI
      });
    });

    container.appendChild(card);
  });
}

function updateStateBtn(btn, value) {
  btn.innerHTML =
    value === 1 ? "✓" :
    value === 0.5 ? "●" : "";

  btn.style.background = value === 1 ? "var(--primary)" : "transparent";
  btn.style.color = value === 1 ? "white" : "var(--muted)";
}

/* ============================================================
   Atualizar progresso
============================================================ */
function updateProgressUI() {
  const pct = calculateConcursoPercent(state.selectedContest);
  const global = calculateGlobalPercent();

  el.percentText.textContent = pct + "%";
  el.sidePercent.textContent = pct + "%";
  el.globalPercent.textContent = global + "%";

  animateRing(pct);
}

function animateRing(percent) {
  const c = 2 * Math.PI * 52;
  const offset = c * (1 - percent / 100);
  el.progressCircle.style.transition = "stroke-dashoffset .6s ease";
  el.progressCircle.style.strokeDashoffset = offset;
  el.ringNum.textContent = percent + "%";
}

/* ============================================================
   Modal de notas
============================================================ */
function setupModalEvents() {
  el.closeModal.addEventListener("click", () => {
    el.modalBackdrop.style.display = "none";
    currentMateria = null;
  });

  el.saveNote.addEventListener("click", () => {
    if (currentMateria) {
      state.notes[currentMateria] = el.noteArea.value;
      saveLocal();
    }
    el.modalBackdrop.style.display = "none";
  });

  el.deleteNote.addEventListener("click", () => {
    if (currentMateria) {
      delete state.notes[currentMateria];
      saveLocal();
    }
    el.noteArea.value = "";
  });
}

export function openNoteModal(materia) {
  currentMateria = materia;
  el.modalTitle.textContent = "Notas: " + materia;
  el.noteArea.value = state.notes[materia] || "";
  el.modalBackdrop.style.display = "flex";
}
