// 1. Verificamos que el archivo JavaScript cargue correctamente en el navegador
console.log("🟢 Archivo driver.js cargado con éxito");

const API_URL = "https://mandaditosapp.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    console.log("🟢 DOM completamente cargado. Inicializando panel de repartidor...");
    
    // Ejecutamos las funciones al cargar la página
    loadDriverWelcome();
    loadAvailableOrders();
    loadDriverOrders();
});

// Función para mostrar el saludo con el nombre del usuario
function loadDriverWelcome() {
    const username = localStorage.getItem("username") || "Repartidor";
    const welcomeEl = document.getElementById("driverWelcome");
    if (welcomeEl) {
        welcomeEl.textContent = `¡Bienvenido de vuelta, ${username}! 🛵`;
    }
}

// Función para cargar los viajes que ya tomaste (Viaje en curso)
async function loadDriverOrders() {
    console.log("🟢 Iniciando loadDriverOrders()..."); 

    const driverId = localStorage.getItem("userId") || localStorage.getItem("id");
    const container = document.getElementById("activeOrderContainer");
    
    console.log("🔍 Driver ID detectado en localStorage:", driverId);
    console.log("🔍 Contenedor HTML 'activeOrderContainer':", container);

    if (!container) {
        console.error("🚨 Error crítico: El contenedor 'activeOrderContainer' NO existe en el HTML.");
        return;
    }

    if (!driverId) {
        console.warn("⚠️ Advertencia: No hay un ID de usuario guardado en el localStorage. Redirigiendo o mostrando vacío.");
        container.innerHTML = "<p class='empty-state'>Inicia sesión como repartidor para ver tus viajes.</p>";
        return;
    }

    try {
        console.log(`🌐 Haciendo petición GET a: ${API_URL}/orders/driver/${driverId}`);
        const response = await fetch(`${API_URL}/orders/driver/${driverId}`);
        const data = await response.json();
        console.log("📦 Respuesta completa recibida del backend:", data);

        const ordersList = data.orders || [];

        if (ordersList.length === 0) {
            console.log("ℹ️ No hay viajes activos para este repartidor.");
            container.innerHTML = "<p class='empty-state'>No tienes ningún viaje activo. ¡Toma un mandadito!</p>";
            return;
        }

        console.log(`✅ Se encontraron ${ordersList.length} viaje(s) en curso. Dibujando en pantalla...`);
        container.innerHTML = "";
        
        ordersList.forEach(order => {
            const card = document.createElement("div");
            card.style.borderLeft = "5px solid #10b981"; 
            card.className = "order-card active-order"; 
            
            // Creamos enlaces dinámicos para Google Maps usando las direcciones
            const pickupUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.pickup_location || order.pickupLocation)}`;
            const deliveryUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_location || order.deliveryLocation)}`;

            card.innerHTML = `
                <div class="order-info">
                    <strong>Mandadito #${order.id} - EN CURSO 🚀</strong>
                    <p><strong>Qué:</strong> ${order.description}</p>
                    
                    <p><strong>📍 Ir a recolectar:</strong> ${order.pickup_location || order.pickupLocation}</p>
                    <a href="${pickupUrl}" target="_blank" class="btn-map" style="display: inline-block; background: #3b82f6; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; margin-bottom: 10px; font-size: 14px;">
                        🗺️ Abrir ruta al negocio (Google Maps)
                    </a>

                    <p><strong>🏁 Entregar en:</strong> ${order.delivery_location || order.deliveryLocation}</p>
                    <a href="${deliveryUrl}" target="_blank" class="btn-map" style="display: inline-block; background: #8b5cf6; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; margin-bottom: 15px; font-size: 14px;">
                        🧭 Abrir ruta de entrega (Google Maps)
                    </a>

                    <p style="color: #10b981; font-weight: bold; font-size: 1.1em;">Ganancia: $${order.reward}</p>
                </div>
                <button onclick="completeOrder(${order.id})" class="btn-primary" style="background-color: #10b981; margin-top: 10px; width: 100%;">
                    ✅ Marcar como Entregado
                </button>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error("❌ Error de red o código al cargar el viaje en curso:", error);
    }
}

// Función para cargar los pedidos disponibles en la bolsa
async function loadAvailableOrders() {
    console.log("🟢 Iniciando loadAvailableOrders()...");
    const ordersContainer = document.getElementById("ordersContainer");
    
    if (!ordersContainer) {
        console.log("ℹ️ El contenedor 'ordersContainer' no está en esta vista.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/orders/pending`);
        const data = await response.json();
        console.log("📦 Pedidos disponibles recibidos:", data);

        const orders = data.orders || [];

        if (orders.length === 0) {
            ordersContainer.innerHTML = "<p class='empty-state'>No hay mandaditos disponibles por ahora.</p>";
            return;
        }

        ordersContainer.innerHTML = "";
        orders.forEach(order => {
            const card = document.createElement("div");
            card.className = "order-card";
            card.innerHTML = `
                <div class="order-info">
                    <strong>Mandadito #${order.id}</strong>
                    <p><strong>Descripción:</strong> ${order.description}</p>
                    <p><strong>Recoger en:</strong> ${order.pickupLocation || order.pickup_location}</p>
                    <p><strong>Entregar en:</strong> ${order.deliveryLocation || order.delivery_location}</p>
                    <p><strong>Recompensa:</strong> $${order.reward}</p>
                </div>
                <button class="btn-primary" onclick="acceptOrder(${order.id})">Aceptar Mandadito</button>
            `;
            ordersContainer.appendChild(card);
        });
    } catch (error) {
        console.error("❌ Error al cargar pedidos disponibles:", error);
        ordersContainer.innerHTML = "<p class='empty-state' style='color: red;'>Error al conectar con el servidor.</p>";
    }
}

// Función para aceptar un pedido
async function acceptOrder(orderId) {
    const driverId = localStorage.getItem("userId") || localStorage.getItem("id");
    
    if (!driverId) {
        alert("Error: No se encontró el ID del repartidor. Inicia sesión nuevamente.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/accept`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ driver_id: parseInt(driverId) })
        });

        const result = await response.json();

        if (response.ok) {
            alert("¡Mandadito aceptado con éxito!");
            // Recargamos ambas listas para actualizar la interfaz
            loadAvailableOrders();
            loadDriverOrders();
        } else {
            alert(result.detail || "No se pudo aceptar el pedido.");
        }
    } catch (error) {
        console.error("❌ Error al aceptar el pedido:", error);
        alert("Error de conexión al intentar aceptar el pedido.");
    }
}
// Función para marcar el pedido como completado
async function completeOrder(orderId) {
    if (!confirm("¿Estás seguro de que entregaste el pedido con éxito? 🏁")) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/status?status=completed`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" }
        });

        const result = await response.json();

        if (response.ok) {
            alert("¡Excelente trabajo! Pedido completado con éxito. 🎉");
            // Recargamos el panel de viajes en curso (quedará vacío listo para otro)
            loadDriverOrders();
        } else {
            alert(result.detail || "No se pudo actualizar el estado del pedido.");
        }
    } catch (error) {
        console.error("Error al completar el pedido:", error);
        alert("Error de red al intentar completar el pedido.");
    }
}


// Botón de Cerrar Sesión
document.addEventListener("click", (e) => {
    if (e.target && e.target.id === "logoutBtn") {
        localStorage.clear();
        window.location.href = "../index.html"; // Ajusta la ruta de salida si es necesario
    }
});