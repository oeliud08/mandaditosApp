import "./OrderCard.css";

export default function OrderCard({ order, onEdit, onDelete }) {
  return (
    <div className="order-card">
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

      {/* Order Status */}
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
            Sin repa todavía. Cuando un repa se postule, lo verás aquí.
          </p>
          <button className="applications-btn" type="button">
            Ver postulaciones
          </button>
          <div className="order-actions">
            <button
              className="edit-btn"
              type="button"
              onClick={() => onEdit(order)}
            >
              Editar
            </button>
            <button
              className="delete-btn"
              type="button"
              onClick={() => onDelete(order)}
            >
              Eliminar
            </button>
          </div>
        </>
      )}
    </div>
  );
}