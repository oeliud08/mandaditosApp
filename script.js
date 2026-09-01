const API_URL = "http://127.0.0.1:8000";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const rawEmail = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    // Normalizar el correo antes de enviarlo
    const email = rawEmail.trim().toLowerCase();

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert(`¡Bienvenido de nuevo, ${data.username}!`);
            
            // Guardar datos básicos en localStorage si lo necesitas para la sesión
            localStorage.setItem("userId", data.id);
            localStorage.setItem("username", data.username);
            localStorage.setItem("role", data.role);

            // Redirigir según su rol
            if (data.role === "client") {
                window.location.href = "client.html";
            } else if (data.role === "driver") {
                window.location.href = "driver.html";
            }
        } else {
            alert(data.detail || "Credenciales incorrectas.");
        }
    } catch (error) {
        console.error("Error de red:", error);
        alert("No se pudo conectar con el servidor.");
    }
});