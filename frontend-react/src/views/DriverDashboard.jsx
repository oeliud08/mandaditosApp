import { useState } from 'react';
import './DriverDashboard.css';

export default function DriverDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('available');
  const [availableOrders, setAvailableOrders] = useState([
    { id: 1, store: 'Tortillería El Pariente', client: 'María López', address: 'Calle Benito Juárez #42', total: '$85.00', payout: '$35.00' },
    { id: 2, store: 'Ferretería El Ancla', client: 'Carlos Ruiz', address: 'Av. Principal #108', total: '$210.00', payout: '$50.00' }
  ]);
  const [currentOrder, setCurrentOrder] = useState(null);
  
  // NUEVO: Estado para guardar los mandaditos completados
  const [historyOrders, setHistoryOrders] = useState([]);

  const handleAcceptOrder = (order) => {
    setCurrentOrder(order);
    setAvailableOrders(availableOrders.filter(o => o.id !== order.id));
  };

  const handleCompleteOrder = () => {
    // NUEVO: Movemos el pedido actual al historial antes de cerrarlo
    if (currentOrder) {
      setHistoryOrders([
        { ...currentOrder, completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, 
        ...historyOrders
      ]);
    }
    alert('¡Mandadito completado con éxito! Ganancia sumada.');
    setCurrentOrder(null);
  };

  return (
    <div className="driver-mobile-container">
      <header className="driver-header">
        <div className="driver-info">
          <h2>🛵 Hola, {user?.name || 'Repartidor'}</h2>
          <span className="status-badge online">● En línea</span>
        </div>
        <button onClick={onLogout} className="logout-btn-sm">Salir</button>
      </header>

      {currentOrder ? (
        <div className="active-delivery-card">
          <span className="badge-urgent">Pedido en Curso 🚀</span>
          <h3>{currentOrder.store}</h3>
          <p><strong>Cliente:</strong> {currentOrder.client}</p>
          <p><strong>Destino:</strong> {currentOrder.address}</p>
          <p><strong>Entrega estimada:</strong> {currentOrder.total}</p>
          
          <button onClick={handleCompleteOrder} className="action-btn success">
            Marcar como Entregado
          </button>
        </div>
      ) : (
        <>
          <div className="driver-tabs">
            <button 
              className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
              onClick={() => setActiveTab('available')}
            >
              Disponibles ({availableOrders.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Historial ({historyOrders.length})
            </button>
          </div>

          <div className="orders-list">
            {activeTab === 'available' ? (
              // Pestaña Disponibles
              availableOrders.length === 0 ? (
                <p className="no-orders">No hay mandaditos cercanos por ahora. Esperando nuevos pedidos...</p>
              ) : (
                availableOrders.map(order => (
                  <div key={order.id} className="order-card-mobile">
                    <div className="order-card-header">
                      <h4>{order.store}</h4>
                      <span className="payout-tag">Ganancia: {order.payout}</span>
                    </div>
                    <p className="order-dest">📍 {order.address}</p>
                    <p className="order-client">Cliente: {order.client}</p>
                    <button 
                      onClick={() => handleAcceptOrder(order)} 
                      className="action-btn primary"
                    >
                      Aceptar Mandadito
                    </button>
                  </div>
                ))
              )
            ) : (
              // NUEVO: Pestaña Historial
              historyOrders.length === 0 ? (
                <p className="no-orders">Aún no tienes mandaditos completados hoy.</p>
              ) : (
                historyOrders.map((order, index) => (
                  <div key={index} className="order-card-mobile history-card">
                    <div className="order-card-header">
                      <h4>{order.store}</h4>
                      <span className="payout-tag success-tag">Ganado: {order.payout}</span>
                    </div>
                    <p className="order-dest">📍 {order.address}</p>
                    <p className="order-client">Cliente: {order.client}</p>
                    <span className="history-time">Entregado a las {order.completedAt}</span>
                  </div>
                ))
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}