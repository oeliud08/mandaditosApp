import { useState, useEffect, useCallback } from "react";
import { getClientOrders, createOrder, deleteOrder, updateOrder } from "../services/api";
import "./ClientDashboard.css";
import "../../src/views/Login.css";

const POLL_MS = 4000;

const STATUS_LABELS = {
  pending: "Buscando repartidor 🔍",
  assigned: "En camino 🛵",
  completed: "Entregado ✅",
};

const formatStatus = (status) => STATUS_LABELS[status] || STATUS_LABELS.pending;
// Sample orders for testing without backend
// const sampleOrders = [
//   {
//     id: 1,
//     description: "Despensa de Walmart",
//     repa: "Carlos M.",
//     repaRating: 4.9,
//     vehicle: "Moto FT125",
//     timeAgo: "Hace 10 min",
//     distance: "1.2 km",
//     reward: 65,
//     status: "assigned",
//     progress: 1,
//   },
//   {
//     id: 2,
//     description: "Recoger un paquete",
//     repa: null,
//     applications: 3,
//     timeAgo: "Hace 25 min",
//     place: "Paquetería del centro",
//     reward: 50,
//     status: "pending",
//   },
// ];

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

export default function ClientDashboard({ user, onLogout }) {
  //const [orders, setOrders] = useState([]); TODO Connect DB Step 5
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true); //Example without backend for now
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [description, setDescription] = useState("");
  const [comments, setComments] = useState("");
  const [reward, setReward] = useState("");
  const [editingOrder, setEditingOrder] = useState(null);

  // Only depends on the user id, so the polling interval is not reset on every update.
  const fetchOrders = useCallback(async () => {
    if (!user?.id) {
      setLoadError(
        "No se encontró tu sesión. Cierra sesión e inicia de nuevo.",
      );
      setLoading(false);
      return;
    }
    try {
      const list = await getClientOrders(user.id);
      setOrders(list);
      setLoadError("");
    } catch (error) {
      console.error("Error al obtener pedidos del cliente:", error);
      setLoadError("No se pudieron actualizar tus pedidos. Reintentando...");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const resetForm = () => {
    setPickup("");
    setDropoff("");
    setDescription("");
    setComments("");
    setReward("");
    setFormError("");
  };

  const closeModal = () => {
    if (submitting) return;
    setShowNewOrderModal(false);
  };
  
  // Handle Create order
const handleCreateOrder = async (e) => {
  e.preventDefault();
  if (submitting) return;

  const rewardNumber = parseFloat(reward);
  if (!(rewardNumber > 0)) {
    setFormError("La recompensa debe ser mayor a 0.");
    return;
  }

  setSubmitting(true);
  setFormError("");
  try {
    if (editingOrder) {
      // Estás editando: actualiza el pedido que ya existe
      await updateOrder(editingOrder.id, {
        pickup_location: pickup.trim(),
        delivery_location: dropoff.trim(),
        description: description.trim(),
        comments: comments.trim(),
        reward: rewardNumber,
      });
    } else {
      // Estás creando uno nuevo
      await createOrder({
        pickup_location: pickup.trim(),
        delivery_location: dropoff.trim(),
        description: description.trim(),
        comments: comments.trim(),
        reward: rewardNumber,
        client_id: user.id,
      });
    }
    resetForm();
    setEditingOrder(null); // Limpia el modo edición
    setShowNewOrderModal(false);
    await fetchOrders();
  } catch (error) {
    setFormError(error.message);
  } finally {
    setSubmitting(false);
  }
};

// Handle Edit order
const handleEdit = (order) => {
  setEditingOrder(order);
  setPickup(order.pickup_location);
  setDropoff(order.delivery_location);
  setDescription(order.description);
  setComments(order.comments || "");
  setReward(order.reward.toString());
  setShowNewOrderModal(true);
};
  
    
  //Handle Delete Order
  const handleDelete = async (order) => {
    console.log("Eliminar pedido", order.id);
    // TODO: llamar a deleteOrder(order.id) — después del endpoint en Python
    if (window.confirm("¿Estás seguro de eliminar este mandadito?")) {
      try {
        await deleteOrder(order.id);
        await fetchOrders();
      } catch (error) {
        console.error("Error al eliminar pedido:", error);
      }
    }
  };

  // Filter orders based on search input
  const filteredOrders = orders.filter((order) => {
    const query = search.trim().toLowerCase();
    if (!query) return true; // If search is empty, show all orders
    const description = (order.description || "").toLowerCase();
    const pickup = (order.pickup_location || "").toLowerCase();
    const dropoff = (order.delivery_location || "").toLowerCase();
    return (
      description.includes(query) ||
      pickup.includes(query) ||
      dropoff.includes(query)
    );
  });

  return (
    <div className="dashboard-container phone-frame">
      <header className="dashboard-header">
        <div className="header-brand">
          <h2 className="brand-title">
            Rider<span style={{ color: "#10B981" }}>Link</span>{" "}
            <span style={{ color: "#F59E0B" }}>MX</span>
          </h2>
          <span className="role-badge">🛍️ Cliente</span>
        </div>
        <div className="header-user">
          <span className="user-greeting">
            Hola, <strong>{user?.username || "Cliente"}</strong>
          </span>
          <button onClick={onLogout} className="logout-btn">
            Salir
          </button>
        </div>
      </header>
      <main className="dashboard-main">
        {/* Client home Top */}
        <section className="client-home-top">
          <div className="home-greeting-row">
            <div>
              <p className="home-location">📍 Real Castilla, Hidalgo</p>
              <h2 className="home-hello">
                Hola, {user?.username || "Cliente"}
              </h2>
              <p className="home-subtitle">
                ¿Qué mandadito necesitas hoy? Un repa de tu colonia lo hace, sin
                intermediarios.
              </p>
            </div>
            <div className="home-avatar">
              {(user?.username || "C").charAt(0).toUpperCase()}
            </div>
          </div>
        </section>
        {/* Buscador */}
        <div className="home-search">
          <span className="home-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar un repa, comida, farmacia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* Green Card */}
        <section className="home-publish-card">
          <h3>¿Necesitas un mandado?</h3>
          <p>
            Publícalo y los repas cercanos se postulan. Tú eliges a quién se lo
            das.
          </p>
          <button
            className="home-publish-btn"
            onClick={() => setShowNewOrderModal(true)}
          >
            + Pedir mandadito
          </button>
        </section>
        {/* Dashboard Action Bar */}
        <div className="dashboard-action-bar">
          <h3>Mis mandaditos</h3>
          <button className="history-link" type="button">
            Ver historial
          </button>
        </div>

        {/* Home stats */}
        <section className="home-stats">
          <div className="home-stat">
            <span className="home-stat-number">
              {orders.filter((o) => o.status !== "completed").length}
            </span>
            <span className="home-stat-label">Mandaditos activos</span>
          </div>
          <div className="home-stat">
            <span className="home-stat-number">
              {orders.filter((o) => o.status === "completed").length}
            </span>
            <span className="home-stat-label">Completados</span>
          </div>
          <div className="home-stat">
            <span className="home-stat-number">★ 4.9</span>
            <span className="home-stat-label">Como cliente</span>
          </div>
        </section>

        {loadError && <p className="form-error">{loadError}</p>}
        {/* Orders Map */}
        <div className="orders-grid">
          {orders.length === 0 ? (
            <p className="no-orders">No tienes mandaditos activos por ahora.</p>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-top">
                  <div className="order-avatar">
                    {order.repa
                      ? order.repa
                          .split(" ")
                          .map((w) => w.charAt(0))
                          .join("")
                      : "?"}
                  </div>
                  <div className="order-info">
                    <h4>{order.description}</h4>
                    <p>Origen: {order.pickup_location}</p>
                    <p>Destino: {order.delivery_location}</p>
                    {order.comments && <p>{order.comments}</p>}
                  </div>

                  <div className="order-price">
                    <span>${order.reward}</span>
                    <small>oferta</small>
                  </div>
                </div>

                <span className={`order-status ${order.status}`}>
                  {order.status === "assigned" ? "En curso" : "Pendiente"}
                </span>

                {order.status === "assigned" ? (
                  <>
                    <div className="order-progress">
                      {["Aceptado", "Comprando", "En camino", "Entregado"].map(
                        (step, i) => (
                          <div
                            key={step}
                            className={`progress-step ${i <= 0 ? "done" : ""}`}
                          >
                            <span className="progress-dot" />
                            {step}
                          </div>
                        ),
                      )}
                    </div>
                    <div className="order-actions">
                      <button className="whatsapp-btn" type="button">
                        WhatsApp al repa
                      </button>
                      <button className="detail-btn" type="button">
                        Ver detalle
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="order-note">
                      Sin repa todavía. Cuando un repa se postule, lo verás
                      aquí.
                    </p>
                    <button className="applications-btn" type="button">
                      Ver postulaciones
                    </button>
                    <div className="order-actions">
                      <button
                        className="edit-btn"
                        type="button"
                        onClick={() => handleEdit(order)}
                      >
                        Editar
                      </button>
                      <button
                        className="delete-btn"
                        type="button"
                        onClick={() => handleDelete(order)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {showNewOrderModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Solicitar Nuevo Mandadito</h3>
            <form onSubmit={handleCreateOrder}>
              <div className="input-group">
                <label>¿Dónde recogemos?</label>
                <input
                  type="text"
                  placeholder="Ej. Local o dirección de recolección"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>¿A dónde lo llevamos?</label>
                <input
                  type="text"
                  placeholder="Ej. Tu domicilio o destino"
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>¿Qué vas a encargar?</label>
                <input
                  type="text"
                  placeholder="Ej. 2 tacos al pastor y un refresco"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Instrucciones de entrega (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. Tocar dos veces el timbre, dejar con el vigilante"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>¿Cuánto ofreces por el mandadito? ($)</label>
                <input
                  type="number"
                  step="0.50"
                  min="1"
                  placeholder="Ej. 30.00"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  required
                />
              </div>

              {formError && <p className="form-error">{formError}</p>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={submitting}
                >
                  {submitting ? "Publicando..." : "Confirmar Pedido"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
