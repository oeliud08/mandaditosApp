// src/views/ClientDashboard.jsx
import { useState } from 'react';
import './ClientDashboard.css';

export default function ClientDashboard({ user, onLogout }) {
  const [orders, setOrders] = useState([
    { id: 1, pickup: 'Calle Morelos #12', dropoff: 'Av. Juárez #45', status: 'En camino 🛵', description: 'Comida corrida' },
    { id: 2, pickup: 'Farmacia del Ahorro', dropoff: 'Real Castilla Manzana 4', status: 'Entregado ✅', description: 'Medicamentos' }
  ]);

  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateOrder = (e) => {
    e.preventDefault();
    const newOrder = {
      id: orders.length + 1,
      pickup,
      dropoff,
      description,
      status: 'Buscando repartidor 🔍'
    };
    setOrders([newOrder, ...orders]);
    setPickup('');
    setDropoff('');
    setDescription('');
    setShowNewOrderModal(false);
  };

  return (
    <div className="dashboard-container">
      {/* Barra superior minimalista */}
      <header className="dashboard-header">
        <div className="header-brand">
          <h2>Mandaditos <span>Comunitarios</span></h2>
        </div>
        <div className="header-user">
          <span className="user-greeting">Hola, <strong>{user?.username || 'Cliente'}</strong></span>
          <button onClick={onLogout} className="logout-btn">Cerrar Sesión</button>
        </div>
      </header>

      {/* Contenido Principal */}
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

        {/* Listado de pedidos minimalist cards */}
        <div className="orders-grid">
          {orders.length === 0 ? (
            <p className="no-orders">No tienes mandaditos activos por ahora.</p>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <span className="order-id">#{order.id}</span>
                  <span className="order-status">{order.status}</span>
                </div>
                <div className="order-body">
                  <p><strong>Descripción:</strong> {order.description}</p>
                  <p><strong>Origen:</strong> {order.pickup}</p>
                  <p><strong>Destino:</strong> {order.dropoff}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal Minimalista para Nuevo Mandadito */}
      {showNewOrderModal && (
        <div className="modal-overlay">
          <div className="modal-card">
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

              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowNewOrderModal(false)}>Cancelar</button>
                <button type="submit" className="primary-btn">Confirmar Pedido</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}