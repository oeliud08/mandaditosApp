const API_URL = "http://127.0.0.1:8000";

// Al cargar la vista del repartidor
document.addEventListener("DOMContentLoaded", () => {
    const role = localStorage.getItem("role");
    const driverId = localStorage.getItem("userId");

    // Seguridad de ruta: verificar que sea un repartidor logueado
    if (!driverId || role !== "driver") {
        alert("Acceso no autorizado. Por favor, inicia sesión como repartidor.");
        window.location.href = "../index.html";
        return;
    }

    // Cargar los pedidos disponibles al abrir la página
    loadAvailableOrders();

    // Refrescar automáticamente la lista cada 10 segundos para buscar nuevos pedidos
    setInterval(loadAvailableOrders, 10000);
});

// Función para obtener y renderizar los pedidos pendientes
async function loadAvailableOrders() {
    try {
        const response = await fetch(`${API_URL}/orders/available`);
        const data = await response.json();
        
        const container = document.getElementById("ordersContainer");
        if (!container){
            console.error("No se encontro el div con 'ordersContainer' en el HTML")
        }
        
        container.innerHTML = ""; // Limpiar contenedor

        if (!data.orders || data.orders.length === 0) {
            container.innerHTML = `<p class="no-orders">No hay mandaditos disponibles en este momento. Esperando nuevos pedidos...</p>`;
            return;
        }

        data.orders.forEach(order => {
            const card = document.createElement("div");
            card.className = "order-card";
            card.innerHTML = `
                <div class="order-info">
                    <strong>Mandadito #${order.id}</strong>
                    <p>Mandadito: ${order.description}</p>
                    <p>Recolectar: ${order.pickup_location || order.pickupLocation} </p>
                    <p>Entregar en: ${order.delivery_location || order.deliveryLocation} </p>
                    <p style="color: green; font-weight: bold;">Pago $$: ${order.reward} </p>
                </div>
                <button onclick="acceptOrder(${order.id})" class="btn-accept">Aceptar Pedido</button>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error("Error de red al buscar pedidos:", error);
    }
}



//Funcion para mostrar los pedidos en curso
// Función para aceptar el pedido
async function acceptOrder(orderId) {
    // Obtenemos el ID del repartidor desde el navegador
    const driverId = localStorage.getItem("userId") || localStorage.getItem("id");
    
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/accept`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ driver_id: parseInt(driverId) })
        });

        if (response.ok) {
            alert("¡Mandadito aceptado! Ve por él. 💨");
            loadAvailableOrders(); // Refrescamos la lista de disponibles
            loadDriverOrders();    // Cargamos el pedido en "Mi Viaje en Curso"
        } else {
            const data = await response.json();
            alert(data.detail || "Error al aceptar el pedido.");
        }
    } catch (error) {
        console.error("Error al aceptar:", error);
    }
}

// Función para cargar los viajes que ya tomaste
async function loadDriverOrders() {
    const driverId = localStorage.getItem("userId") || localStorage.getItem("id");
    const container = document.getElementById("activeOrderContainer");
    
    if (!container) return;

    try {
        console.log("Haciendo petición a:", `${API_URL}/orders/driver/${driverId}`);
        const response = await fetch(`${API_URL}/orders/driver/${driverId}`);
        const data = await response.json();
        console.log("Respuesta del backend:", data); // ¡Esto te dirá exactamente qué llega!
    // ... resto del código
        //const response = await fetch(`${API_URL}/orders/driver/${driverId}`);
        //const data = await response.json();
        const ordersList = data.orders || [];

        if (ordersList.length === 0) {
            container.innerHTML = "<p class='empty-state'>No tienes ningún viaje activo. ¡Toma un mandadito!</p>";
            return;
        }

        container.innerHTML = "";
        ordersList.forEach(order => {
            const card = document.createElement("div");
            // Le añadimos un estilo visual distinto para destacar que es el viaje actual
            card.style.borderLeft = "5px solid #10b981"; 
            card.className = "order-card active-order"; 
            
            card.innerHTML = `
                <div class="order-info">
                    <strong>Mandadito #${order.id} - EN CURSO 🚀</strong>
                    <p><strong>Qué:</strong> ${order.description}</p>
                    <p><strong>📍 Ir a:</strong> ${order.pickupLocation || order.pickup_location}</p>
                    <p><strong>🏁 Entregar a:</strong> ${order.deliveryLocation || order.delivery_location}</p>
                    <p style="color: #10b981; font-weight: bold; font-size: 1.1em;">Ganancia: $${order.reward}</p>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error("Error al cargar viaje en curso:", error);
    }
}
 
//Aqui nos quedamos


// Manejador del botón de cerrar sesión
document.getElementById("logoutBtn").addEventListener("click", () => {
    // Limpiamos todo el almacenamiento local de la sesión
    localStorage.clear();
    
    // Redirigimos al usuario al login
    alert("Has cerrado sesión correctamente.");
    window.location.href = "../index.html";
});