/* ============================================================
   AUTH.JS — Autenticação Google (GIS) + OAuth2 + Drive Token
============================================================ */

/**
 * Salva token (id_token) após login Google Identity Services.
 * Esse token identifica o usuário, mas NÃO é usado no Drive.
 */
export async function saveTokenAfterLogin(credential) {
  if (!credential) throw new Error("Credencial do Google inválida.");

  const payload = decodeJwt(credential);

  const tokenData = {
    token: credential,
    email: payload.email,
    exp: payload.exp,
    savedAt: Date.now()
  };

  localStorage.setItem("g_token_data", JSON.stringify(tokenData));
  console.log("Token salvo (id_token):", tokenData);
}

/**
 * Carrega id_token salvo (usado apenas pela UI, NÃO Drive)
 */
export function loadSavedToken() {
  const raw = localStorage.getItem("g_token_data");
  if (!raw) return null;

  try {
    const data = JSON.parse(raw);

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
 * Remove tudo e volta ao login
 */
export function logout() {
  localStorage.removeItem("g_token_data");
  localStorage.removeItem("g_access_token");
  window.location.href = "./login.html";
}

/**
 * Decodifica JWT sem validar assinatura
 */
function decodeJwt(token) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Token JWT inválido.");

  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const decoded = atob(base64);
  return JSON.parse(decoded);
}

/* ============================================================
   OAUTH2 — OBTENÇÃO DO ACCESS_TOKEN PARA O GOOGLE DRIVE
============================================================ */

const CLIENT_ID = "553818652026-vjsmkokm1pibph3ehai36q3pmbp8js88.apps.googleusercontent.com";
const SCOPE = "https://www.googleapis.com/auth/drive.appdata";

/**
 * Solicita access_token OAuth2 (necessário para o Drive)
 */
export function requestAccessToken() {
  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (resp) => {
        if (resp.error) return reject(resp);

        localStorage.setItem("g_access_token", resp.access_token);
        console.log("Access token obtido:", resp.access_token);
        resolve(resp.access_token);
      }
    });

    client.requestAccessToken();
  });
}

/**
 * Retorna access_token para chamadas Drive
 */
export function loadAccessToken() {
  return localStorage.getItem("g_access_token") || null;
}

/* ============================================================
   Helpers para chamadas autenticadas ao Google Drive
============================================================ */

/**
 * GET — Drive API v3
 */
export async function driveGet(path) {
  const token = loadAccessToken();
  if (!token) throw new Error("Access token ausente.");

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
 * POST / PATCH — Uploads no Drive
 */
export async function driveSend(path, method, body, isMultipart = false) {
  const token = loadAccessToken();
  if (!token) throw new Error("Access token ausente.");

  const headers = { Authorization: "Bearer " + token };
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
   Operações do arquivo appDataFolder
============================================================ */

const DRIVE_FILENAME = "progresso_estudos.json";

/**
 * Procura arquivo remoto
 */
export async function findAppDataFile() {
  const result = await driveGet(
    `/files?spaces=appDataFolder&q=name='${DRIVE_FILENAME}'&fields=files(id,name,modifiedTime)`
  );

  return result.files && result.files.length ? result.files[0] : null;
}

/**
 * Cria arquivo novo no appDataFolder
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
 * Atualiza arquivo remoto existente
 */
export async function updateAppDataFile(fileId, content) {
  return await driveSend(
    `/files/${fileId}?uploadType=media`,
    "PATCH",
    content
  );
}

/**
 * Baixa arquivo do appDataFolder
 */
export async function downloadAppDataFile(fileId) {
  const token = loadAccessToken();
  if (!token) throw new Error("Access token ausente.");

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

