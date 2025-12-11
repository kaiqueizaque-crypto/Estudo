<script>
// ======================================
// CONFIG
// ======================================
const CLIENT_ID = "553818652026-vjsmkokm1pibph3ehai36q3pmbp8js88.apps.googleusercontent.com";
const APP_REDIRECT = "https://kaiqueizaque-crypto.github.io/Estudo/index.html";

// Salvar token após login
function saveToken(token) {
    localStorage.setItem("g_token", token);
}

// Ler token no index.html
function getToken() {
    return localStorage.getItem("g_token");
}

// ======================================
// GIS - CALLBACK DO LOGIN
// ======================================
function handleCredentialResponse(response) {
    if (!response || !response.credential) {
        alert("Falha ao autenticar.");
        return;
    }

    // Aqui recebemos o JWT do Google
    saveToken(response.credential);

    // Redirecionar para index.html
    window.location.href = APP_REDIRECT;
}

// ======================================
// Inicializar Botão do Google
// ======================================
window.onload = function () {
    google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse
    });

    google.accounts.id.renderButton(
        document.getElementById("googleLoginBtn"),
        { theme: "filled_blue", size: "large" }
    );

    google.accounts.id.prompt(); // opcional
};
</script>
