 const API_URL = "http://127.0.0.1:8000";
        
        const username = localStorage.getItem("username");
        const role = localStorage.getItem("role");
        const clientId = localStorage.getItem("userId") || localStorage.getItem("id");

        if (!username || role !== "client" || !clientId) {
            window.location.href = "index.html"; 
        } else {
            document.getElementById("clientWelcome").innerText = `Bienvenido, ${username}`;
            loadClientOrders();
        }

        function logout() {
            localStorage.clear();
            window.location.href = "../../index.html";
        }

        async function loadClientOrders() {
            try {
                const response = await fetch(`${API_URL}/orders/client/${clientId}`);
                const data = await response.json();
                const container = document.getElementById("clientOrdersList");
                
                const ordersList = data.orders || data.data || [];
                
                // CORRECCIÓN AQUÍ: Usar ordersList en lugar de data.pending_orders
                if (ordersList.length === 0) {
                    container.innerHTML = "<p class='empty-state'>No tienes pedidos activos en este momento.</p>";
                    return;
                }

                container.innerHTML = "";
                // CORRECCIÓN AQUÍ: Usar ordersList en lugar de data.pending_orders
                ordersList.forEach(order => {
                    const card = document.createElement("div");
                    card.className = "order-card";
                    card.innerHTML = `
                        <strong>Pedido #${order.id}</strong> - <span style="color: #2563eb; text-transform: uppercase; font-size: 11px;">Estado: ${order.status}</span>
                        <p><strong>Qué:</strong> ${order.description}</p>
                        <p><strong>Recolección:</strong> ${order.pickup_location || order.pickupLocation || 'No especificada'}</p>
                        <p><strong>Entrega en:</strong> ${order.delivery_location || order.deliveryLocation}</p>
                        <p><strong>Recompensa:</strong> $${Number(order.reward).toFixed(2)}</p>
                    `;
                    container.appendChild(card);
                });
            } catch (error) {
                console.error("Error cargando pedidos:", error);
                document.getElementById("clientOrdersList").innerHTML = "<p style='color: red;'>Error al cargar tus pedidos.</p>";
            }
        }

        document.getElementById("orderForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const newOrder = {
                // CORRECCIÓN AQUÍ: Enviar client_id numérico en lugar de client_name
                client_id: parseInt(clientId),
                description: document.getElementById("description").value,
                pickup_location: document.getElementById("pickup_location").value,
                delivery_location: document.getElementById("delivery_location").value,
                reward: parseFloat(document.getElementById("reward").value)
            };

            try {
                const response = await fetch(`${API_URL}/orders/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newOrder)
                });

                if (response.ok) {
                    alert("¡Mandadito publicado con éxito!");
                    document.getElementById("orderForm").reset();
                    loadClientOrders();
                } else {
                    alert("Error al crear el pedido.");
                }
            } catch (error) {
                console.error("Error:", error);
                alert("No se pudo conectar con el servidor.");
            }
        });