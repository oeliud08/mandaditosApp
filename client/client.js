const API_URL = "https://mandaditosapp.onrender.com";

// 1. Validar sesión y rol del cliente al cargar
const username = localStorage.getItem("username");
const role = localStorage.getItem("role");
const clientId = localStorage.getItem("userId") || localStorage.getItem("id");

if (!username || role !== "client" || !clientId) {
    window.location.href = "../index.html"; // Ajusta la ruta a tu login principal si es necesario
} else {
    document.getElementById("clientWelcome").innerText = `¡Bienvenido, ${username}! 👤`;
    loadClientOrders();
}

// Función global de cierre de sesión
function logout() {
    localStorage.clear();
    window.location.href = "../index.html";
}

// 2. Cargar los pedidos activos del cliente
async function loadClientOrders() {
    try {
        const response = await fetch(`${API_URL}/orders/client/${clientId}`);
        const data = await response.json();
        const container = document.getElementById("clientOrdersList");
        
        const ordersList = data.orders || data.data || [];
        
        if (ordersList.length === 0) {
            container.innerHTML = "<p class='empty-state' style='color: #64748b; font-style: italic;'>No tienes pedidos activos en este momento.</p>";
            return;
        }

        container.innerHTML = "";
        
        ordersList.forEach(order => {
            const card = document.createElement("div");
            card.className = "order-card";
            card.style.cssText = "background: #fff; padding: 15px; margin-bottom: 12px; border-radius: 8px; border-left: 5px solid #3b82f6; box-shadow: 0 2px 4px rgba(0,0,0,0.05);";
            
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong>Pedido #${order.id}</strong> 
                    <span style="background: #eff6ff; color: #2563eb; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; font-size: 11px; font-weight: bold;">
                        ${order.status || 'Pendiente'}
                    </span>
                </div>
                <p><strong>Qué:</strong> ${order.description}</p>
                <p><strong>📍 Recolección:</strong> ${order.pickup_location || order.pickupLocation || 'No especificada'}</p>
                <p><strong>🏁 Entrega en:</strong> ${order.delivery_location || order.deliveryLocation}</p>
                <p style="color: #10b981; font-weight: bold; margin-top: 6px;">Recompensa: $${Number(order.reward).toFixed(2)}</p>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error("Error cargando pedidos:", error);
        document.getElementById("clientOrdersList").innerHTML = "<p style='color: red;'>Error al cargar tus pedidos.</p>";
    }
}

// 3. Manejar la creación del nuevo pedido mediante el formulario
const orderForm = document.getElementById("orderForm");
if (orderForm) {
    orderForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const newOrder = {
            client_id: parseInt(clientId),
            description: document.getElementById("description").value.trim(),
            pickup_location: document.getElementById("pickup_location").value.trim(),
            delivery_location: document.getElementById("delivery_location").value.trim(),
            reward: parseFloat(document.getElementById("reward").value)
        };

        // Validación extra de seguridad en frontend
        if (!newOrder.description || !newOrder.pickup_location || !newOrder.delivery_location || isNaN(newOrder.reward)) {
            alert("Por favor completa todos los campos correctamente.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/orders/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newOrder)
            });

            const result = await response.json();

            if (response.ok) {
                alert("¡Mandadito publicado con éxito! 🚀 Buscando repartidor...");
                document.getElementById("orderForm").reset();
                loadClientOrders(); // Refrescar lista de pedidos al instante
            } else {
                alert(result.detail || "Error al crear el pedido.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("No se pudo conectar con el servidor.");
        }
    });
}