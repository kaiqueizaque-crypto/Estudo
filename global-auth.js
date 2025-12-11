// Função global exigida pelo Google
window.handleCredentialResponse = async function(response) {
    console.log("GIS CALLBACK → OK");

    const jwt = response.credential;
    localStorage.setItem("google_jwt", jwt);

    // Converter JWT em access_token
    const data = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt
        })
    }).then(r => r.json());

    if (!data.access_token) {
        console.error("Erro ao obter access token:", data);
        alert("Falha ao autenticar.");
        return;
    }

    console.log("TOKEN OK");

    localStorage.setItem("google_access_token", data.access_token);

    // Agora pode redirecionar
    window.location.href = "index.html";
};
