/* ============================================================
   CONFIGURAÇÃO DO CLIENT OAUTH
   Substitua CLIENT_ID pelo seu ID real
============================================================ */
const CLIENT_ID = "553818652026-vjsmkokm1pibph3ehai36q3pmbp8js88.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.appdata";

/* ============================================================
   1 — SALVAR E LER TOKEN LOCAL
============================================================ */
export function saveToken(tokenObj) {
    localStorage.setItem("g_token", JSON.stringify(tokenObj));
}

export function loadSavedToken() {
    try {
        const raw = localStorage.getItem("g_token");
        if (!raw) return null;

        const token = JSON.parse(raw);

        // Token expirado?
        if (Date.now() > token.expires_at) {
            console.warn("Token expirado");
            return null;
        }

        return token.access_token;
    } catch (e) {
        return null;
    }
}

/* ============================================================
   2 — LOGOUT (REMOVER TOKEN)
============================================================ */
export function logout() {
    localStorage.removeItem("g_token");
    window.location.href = "./login.html";
}

/* ============================================================
   3 — LOGIN VIA GOOGLE 
   (Google Identity Services — Authorization Code Flow)
============================================================ */
export async function loginWithGoogle() {
    return new Promise((resolve, reject) => {

        google.accounts.oauth2.initCodeClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            ux_mode: "popup",

            callback: async (response) => {
                try {
                    // Troca código por token
                    const token = await exchangeCodeForToken(response.code);

                    saveToken(token);

                    resolve(token.access_token);

                } catch (err) {
                    reject(err);
                }
            }
        }).requestCode();
    });
}

/* ============================================================
   4 — TROCAR AUTH CODE POR TOKEN
   (utiliza o token server do Google — recomendado para SPAs)
============================================================ */
async function exchangeCodeForToken(code) {
    const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            code,
            client_id: CLIENT_ID,
            grant_type: "authorization_code",
            redirect_uri: "postmessage"
        })
    });

    const data = await res.json();

    if (!data.access_token) {
        console.error("Erro ao trocar code por token:", data);
        throw new Error("Falha ao obter token");
    }

    return {
        access_token: data.access_token,
        expires_at: Date.now() + (data.expires_in * 1000)
    };
}

/* ============================================================
   5 — CHAMADAS AO GOOGLE DRIVE (AppData)
============================================================ */

export async function driveRequest(method, path, body = null) {
    const token = loadSavedToken();
    if (!token) throw new Error("Token inválido");

    const res = await fetch(`https://www.googleapis.com/drive/v3${path}`, {
        method,
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        },
        body: body ? JSON.stringify(body) : null
    });

    return res.json();
}

/* ============================================================
   6 — PROCURAR ARQUIVO NO APPDATA
============================================================ */
export async function findAppDataFile(filename) {
    const token = loadSavedToken();
    if (!token) return null;

    const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${filename}'&spaces=appDataFolder`,
        { headers: { "Authorization": "Bearer " + token } }
    );

    const data = await res.json();

    return data.files && data.files.length > 0 ? data.files[0] : null;
}

/* ============================================================
   7 — CRIAR ARQUIVO NO APPDATA
============================================================ */
export async function createAppDataFile(filename, content) {
    const token = loadSavedToken();
    if (!token) throw new Error("Token inválido");

    const metadata = {
        name: filename,
        parents: ["appDataFolder"]
    };

    const boundary = "-------314159265358979323846";
    const body =
        `--${boundary}\r\n` +
        "Content-Type: application/json\r\n\r\n" +
        JSON.stringify(metadata) +
        `\r\n--${boundary}\r\n` +
        "Content-Type: application/json\r\n\r\n" +
        JSON.stringify(content) +
        `\r\n--${boundary}--`;

    const res = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": `multipart/related; boundary=${boundary}`
            },
            body
        }
    );

    return res.json();
}

/* ============================================================
   8 — ATUALIZAR ARQUIVO NO APPDATA
============================================================ */
export async function updateAppDataFile(fileId, content) {
    const token = loadSavedToken();

    const res = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
            method: "PATCH",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(content)
        }
    );

    return res.json();
}

/* ============================================================
   9 — BAIXAR ARQUIVO NO APPDATA
============================================================ */
export async function downloadAppDataFile(fileId) {
    const token = loadSavedToken();

    const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
            headers: { "Authorization": "Bearer " + token }
        }
    );

    return res.json();
}
