// ===============================
// AUTH.JS — Google Identity + Drive AppData
// ===============================

// Salva o JWT do Google Identity
export function saveTokenAfterLogin(credential) {
    if (!credential) {
        throw new Error("Credencial vazia do Google Identity!");
    }

    localStorage.setItem("g_token", credential);
}

// Retorna o token salvo
export function loadSavedToken() {
    return localStorage.getItem("g_token");
}

// Remove o token (logout)
export function logout() {
    localStorage.removeItem("g_token");
    window.location.href = "./login.html";
}


// ===============================================
// FUNÇÕES UTILITÁRIAS PARA DRIVE APPDATA
// ===============================================

async function driveRequest(path, method = "GET", body = null) {
    const token = loadSavedToken();
    if (!token) throw new Error("Token ausente!");

    const res = await fetch("https://www.googleapis.com/drive/v3" + path, {
        method,
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        },
        body: body ? JSON.stringify(body) : null
    });

    return res.json();
}

// Procura arquivo AppData
export async function findAppDataFile(filename) {
    const q = encodeURIComponent(`name='${filename}' and mimeType='application/json'`);
    const res = await driveRequest(`/files?q=${q}&spaces=appDataFolder&fields=files(id,name)`);

    return res.files?.[0] || null;
}

// Cria arquivo AppData
export async function createAppDataFile(filename, content) {
    const metadata = {
        name: filename,
        parents: ["appDataFolder"],
        mimeType: "application/json"
    };

    const token = loadSavedToken();

    const boundary = "END_OF_PART";
    const body =
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        JSON.stringify(metadata) + "\r\n" +
        `--${boundary}\r\n` +
        `Content-Type: application/json\r\n\r\n` +
        JSON.stringify(content) + "\r\n" +
        `--${boundary}--`;

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

// Atualiza arquivo AppData
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

// Baixa arquivo AppData
export async function downloadAppDataFile(fileId) {
    const res = await driveRequest(`/files/${fileId}?alt=media`, "GET");
    return res;
}
