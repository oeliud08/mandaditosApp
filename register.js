const API_URL = "http://127.0.0.1:8000";

function processAndValidateEmail(rawEmail) {
    const normalizedEmail = rawEmail.trim().toLowerCase();

    if (/\s/.test(normalizedEmail)) {
        alert("⚠️ Error: El correo electrónico no debe contener espacios en blanco.");
        return null;
    }

    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailRegex.test(normalizedEmail)) {
        alert("⚠️ Error: Por favor, introduce un formato de correo electrónico válido (ej. tu.correo@dominio.com).");
        return null;
    }

    return normalizedEmail;
}

document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const usernameInput = document.getElementById("regUsername");
    const emailInput = document.getElementById("regEmail");
    const passwordInput = document.getElementById("regPassword");
    const roleInput = document.getElementById("regRole");

    if (!usernameInput || !emailInput || !passwordInput || !roleInput) {
        console.error("Error crítico: No se encontraron todos los campos del formulario en el DOM.");
        return;
    }

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const role = roleInput.value;
    const rawEmail = emailInput.value;

    const email = processAndValidateEmail(rawEmail);
    if (!email) return;

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password, role })
        });

        const data = await response.json();

        if (response.ok) {
            alert("¡Registro exitoso! Correo normalizado y guardado correctamente.");
            window.location.href = "index.html";
        } else {
            alert(data.detail || "Error al registrar usuario.");
        }
    } catch (error) {
        console.error("Error de red:", error);
        alert("No se pudo conectar con el servidor.");
    }
});