import { useState, useEffect, useCallback } from "react";
import { getClientOrders, createOrder } from "../services/api";
import "./ClientDashboard.css";
import "../../src/views/Login.css";

const POLL_MS = 4000;

const STATUS_LABELS = {
  pending: "Buscando repartidor 🔍",
  assigned: "En camino 🛵",
  completed: "Entregado ✅",
};

const formatStatus = (status) => STATUS_LABELS[status] || STATUS_LABELS.pending;
const sampleOrders = [
  {
    id: 1,
    description: "2 tacos al pastor y un refresco",
    pickup_location: "Tacos 'El Guero'",
    delivery_location: "Calle Real Castilla 123",
    reward: 90,
    status: "pending",
    client: "Dra. Sofía Morales",
  },
  {
    id: 2,
    description: "Medicinas de la farmacia",
    pickup_location: "Farmacia San Pablo",
    delivery_location: "Av. Hidalgo 45",
    reward: 120,
    status: "assigned",
    client: "Dra. Sofía Morales",
  },
];
const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

export default function ClientDashboard({ user, onLogout }) {
  //const [orders, setOrders] = useState([]); TODO Connect DB Step 5
  const [orders, setOrders] = useState(sampleOrders);
  const [loading, setLoading] = useState(false); //Example without backend for now
  const [loadError, setLoadError] = useState("");

  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [description, setDescription] = useState("");
  const [comments, setComments] = useState("");
  const [reward, setReward] = useState("");

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

  // Poll for updates / TODO Connect DB Step 5
  // useEffect(() => {
  //   fetchOrders();
  //   const interval = setInterval(fetchOrders, POLL_MS);
  //   return () => clearInterval(interval);
  // }, [fetchOrders]);

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
      await createOrder({
        pickup_location: pickup.trim(),
        delivery_location: dropoff.trim(),
        description: description.trim(),
        comments: comments.trim(),
        reward: rewardNumber,
        client_id: user.id,
      });
      resetForm();
      setShowNewOrderModal(false);
      await fetchOrders();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <p className="no-orders">Cargando tus mandaditos...</p>
      </div>
    );
  }

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
        <div className="dashboard-action-bar">
          <div className="section-title">
            <h3>Mis Mandaditos</h3>
            <p>Gestiona y rastrea tus pedidos en tiempo real.</p>
          </div>
          <button
            className="primary-btn"
            onClick={() => setShowNewOrderModal(true)}
          >
            + Pedir Mandadito
          </button>
        </div>

        {loadError && <p className="form-error">{loadError}</p>}

        <div className="orders-grid">
          {orders.length === 0 ? (
            <p className="no-orders">No tienes mandaditos activos por ahora.</p>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <span className="order-id">#{order.id}</span>
                  <span className="order-status">
                    {formatStatus(order.status)}
                  </span>
                </div>
                <div className="order-body">
                  <p>
                    <strong>Descripción:</strong> {order.description}
                  </p>
                  <p>
                    <strong>Origen:</strong> {order.pickup_location}
                  </p>
                  <p>
                    <strong>Destino:</strong> {order.delivery_location}
                  </p>
                  {order.comments && (
                    <p>
                      <strong>Instrucciones:</strong> {order.comments}
                    </p>
                  )}
                  <p>
                    <strong>Ofrecido:</strong> {formatMoney(order.reward)}
                  </p>
                </div>
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
