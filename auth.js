/* ============================================================
   AUTH.JS – Google Identity Services + Drive AppData
   ============================================================ */

const CLIENT_ID = "553818652026-vjsmkokm1pibph3ehai36q3pmbp8js88.apps.googleusercontent.com";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";

let googleAccessToken = null;

/* ------------------------------------------------------------
   1. Inicializa GIS (Popup Login)
------------------------------------------------------------ */

window.handleCredentialResponse = async (response) => {
    try {
        const jwt = response.credential;
        localStorage.setItem("google_jwt", jwt);

        // Trocar o JWT por um access_token válido
        await exchangeJwtForAccessToken(jwt);

        // Redirecionar para aplicação
        window.location.href = "index.html";
    } catch (err) {
        console.error("Erro no login:", err);
        alert("Falha ao autenticar. Verifique console.");
    }
};

/* ------------------------------------------------------------
   2. Trocar JWT por Access Token (OAuth token endpoint)
------------------------------------------------------------ */

async function exchangeJwtForAccessToken(jwt) {
    const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt
        })
    });

    const data = await res.json();

    if (data.access_token) {
        googleAccessToken = data.access_token;
        localStorage.setItem("google_access_token", googleAccessToken);
        console.log("Access token salvo!");
    } else {
        console.error("Erro ao obter access_token:", data);
        throw new Error("Falha ao obter access token");
    }
}

/* ------------------------------------------------------------
   3. Carregar token salvo ao abrir app
------------------------------------------------------------ */

export function loadSavedToken() {
    googleAccessToken = localStorage.getItem("google_access_token");
    return googleAccessToken;
}

/* ------------------------------------------------------------
   4. Funções de Drive AppData
------------------------------------------------------------ */

async function driveRequest(path, method = "GET", params = {}, body = null) {
    if (!googleAccessToken) throw new Error("Usuário não autenticado");

    const url = new URL(`https://www.googleapis.com/drive/v3/${path}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));

    const res = await fetch(url, {
        method,
        headers: {
            Authorization: `Bearer ${googleAccessToken}`,
            "Content-Type": "application/json"
        },
        body: body ? JSON.stringify(body) : null
    });

    return await res.json();
}

export async function findAppDataFile(filename) {
    const result = await driveRequest("files", "GET", {
        spaces: "appDataFolder",
        q: `name='${filename}'`,
        fields: "files(id,name,modifiedTime)"
    });

    return result.files?.[0] || null;
}

export async function createAppDataFile(filename, content) {
    const metadata = {
        name: filename,
        parents: ["appDataFolder"]
    };

    const boundary = "-------APPDATAUPLOADBOUNDARY";
    const delimiter = `\r\n--${boundary}\r\n`;
    const closing = `\r\n--${boundary}--`;

    const body =
        delimiter +
        `Content-Type: application/json\r\n\r\n` +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: application/json\r\n\r\n` +
        JSON.stringify(content) +
        closing;

    const res = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${googleAccessToken}`,
                "Content-Type": `multipart/related; boundary=${boundary}`
            },
            body
        }
    );

    return await res.json();
}

export async function updateAppDataFile(fileId, content) {
    return await driveRequest(`files/${fileId}`, "PATCH", { uploadType: "media" }, content);
}

export async function downloadAppDataFile(fileId) {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${googleAccessToken}` }
    });
    return await res.json();
}

/* ------------------------------------------------------------
   5. Logout
------------------------------------------------------------ */

export function logout() {
    localStorage.removeItem("google_access_token");
    localStorage.removeItem("google_jwt");
    googleAccessToken = null;
    window.location.href = "login.html";
}
