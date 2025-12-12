/* ============================================================
   AUTH.JS — Autenticação Google (GIS) + Token Management
   Mantido na raiz do projeto (./auth.js)
============================================================ */

/**
 * Salva token após login com Google Identity Services.
 * O token é um JWT que contém email e expiração.
 */
export async function saveTokenAfterLogin(credential) {
  if (!credential) {
    throw new Error("Credencial do Google inválida.");
  }

  const payload = decodeJwt(credential);

  const tokenData = {
    token: credential,
    email: payload.email,
    exp: payload.exp,
    savedAt: Date.now()
  };

  localStorage.setItem("g_token_data", JSON.stringify(tokenData));
  console.log("Token salvo:", tokenData);
}


/**
 * Carrega token local, valida expiração
 */
export function loadSavedToken() {
  const raw = localStorage.getItem("g_token_data");
  if (!raw) return null;

  try {
    const data = JSON.parse(raw);

    // Verificação de expiração
    const now = Math.floor(Date.now() / 1000);
    if (data.exp && now >= data.exp) {
      console.warn("Token expirado — removendo");
      logout();
      return null;
    }

    return data.token;
  } catch (e) {
    console.error("Erro ao ler token salvo:", e);
    return null;
  }
}


/**
 * Remove token local + recarrega aplicação
 */
export function logout() {
  localStorage.removeItem("g_token_data");
  window.location.href = "./login.html";
}


/**
 * Decodifica JWT (sem validar assinatura)
 */
function decodeJwt(token) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Token JWT inválido.");
  }

  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const decoded = atob(base64);
  return JSON.parse(decoded);
}


/* ============================================================
   Helpers para chamadas autenticadas ao Google Drive
============================================================ */

/**
 * GET genérico no Drive API
 */
export async function driveGet(path) {
  const token = loadSavedToken();
  if (!token) throw new Error("Token ausente. Usuário não autenticado.");

  const res = await fetch(`https://www.googleapis.com/drive/v3${path}`, {
    headers: { Authorization: "Bearer " + token }
  });

  if (!res.ok) {
    console.error("Erro Drive GET:", await res.text());
    throw new Error("Falha na requisição Drive GET");
  }

  return await res.json();
}

/**
 * POST / PATCH para envio de dados
 */
export async function driveSend(path, method, body, isMultipart = false) {
  const token = loadSavedToken();
  if (!token) throw new Error("Token ausente.");

  const headers = {
    Authorization: "Bearer " + token,
  };

  if (!isMultipart) headers["Content-Type"] = "application/json";

  const res = await fetch(`https://www.googleapis.com/upload/drive/v3${path}`, {
    method,
    headers,
    body: isMultipart ? body : JSON.stringify(body)
  });

  if (!res.ok) {
    console.error("Erro Drive SEND:", await res.text());
    throw new Error("Falha na requisição Drive SEND");
  }

  return await res.json();
}


/* ============================================================
   Funções para manipular arquivo no appDataFolder
============================================================ */

const DRIVE_FILENAME = "progresso_estudos.json";

/**
 * Procura arquivo no appDataFolder
 */
export async function findAppDataFile() {
  const result = await driveGet(
    `/files?spaces=appDataFolder&q=name='${DRIVE_FILENAME}'&fields=files(id,name,modifiedTime)`
  );

  return result.files && result.files.length ? result.files[0] : null;
}


/**
 * Cria novo arquivo no appDataFolder
 */
export async function createAppDataFile(content) {
  const metadata = {
    name: DRIVE_FILENAME,
    parents: ["appDataFolder"]
  };

  const boundary = "-------314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const close = `\r\n--${boundary}--`;

  const body =
    delimiter +
    "Content-Type: application/json\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    "Content-Type: application/json\r\n\r\n" +
    JSON.stringify(content) +
    close;

  return await driveSend(
    "/files?uploadType=multipart&fields=id,modifiedTime",
    "POST",
    body,
    true
  );
}


/**
 * Atualiza arquivo existente
 */
export async function updateAppDataFile(fileId, content) {
  return await driveSend(
    `/files/${fileId}?uploadType=media`,
    "PATCH",
    content
  );
}


/**
 * Baixa arquivo remoto
 */
export async function downloadAppDataFile(fileId) {
  const token = loadSavedToken();
  if (!token) throw new Error("Token ausente.");

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: "Bearer " + token } }
  );

  if (!res.ok) {
    console.error("Erro ao baixar arquivo:", await res.text());
    throw new Error("Falha no download do arquivo.");
  }

  return await res.json();
}
