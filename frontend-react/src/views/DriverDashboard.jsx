import { useState, useEffect, useCallback } from 'react';
import './DriverDashboard.css';

// Usamos 127.0.0.1 para evitar problemas de resolución IPv6 (localhost)
//const API_BASE_URL = 'http://127.0.0.1:8000';
const API_BASE_URL = 'https://mandaditosapp.onrender.com';

export default function DriverDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('available');
  const [availableOrders, setAvailableOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar y sincronizar pedidos desde la base de datos
  // Cargar y sincronizar pedidos desde la base de datos
  const fetchOrders = useCallback(async () => {
    try {
      const responseAvailable = await fetch(`${API_BASE_URL}/orders/available`);
      if (!responseAvailable.ok) throw new Error('Error al conectar con el servidor');
      const dataAvailable = await responseAvailable.json();

      const availableList = Array.isArray(dataAvailable)
        ? dataAvailable
        : (dataAvailable.orders || []);

      setAvailableOrders(availableList);

      // Declarar variables aquí para que existan en toda la función
      let inProgress = null;
      let history = [];

      if (user?.id) {
        const responseDriver = await fetch(`${API_BASE_URL}/orders/driver/${user.id}`);
        if (responseDriver.ok) {
          const dataDriver = await responseDriver.json();
          const driverOrders = Array.isArray(dataDriver)
            ? dataDriver
            : (dataDriver.orders || []);

          inProgress = driverOrders.find(o => o.status === 'assigned') || null;
          history = driverOrders.filter(o => o.status === 'completed');
        }
      }

      setCurrentOrder(inProgress);
      setHistoryOrders(history);

      // 🔍 Ahora sí puede leer inProgress y history sin error
      console.log(
        `[${new Date().toLocaleTimeString()}] 🔄 Sincronizado | Disponibles: ${availableList.length} | En curso: ${inProgress ? 1 : 0} | Historial: ${history.length}`
      );

    } catch (error) {
      console.error('Error al sincronizar con la base de datos:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Consultar la base de datos al cargar y actualizar automáticamente cada 4 segundos
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Aceptar mandadito -> POST /orders/{id}/accept
  const handleAcceptOrder = async (order) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${order.id}/accept`, {
        method: 'POST', // Coincide con @app.post en FastAPI
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver_id: user?.id })
      });

      if (response.ok) {
        await fetchOrders();
      } else {
        const errData = await response.json();
        alert(errData.detail || 'Este pedido ya fue tomado por otro repartidor.');
        fetchOrders();
      }
    } catch (error) {
      console.error('Error de red al aceptar:', error);
      alert('Error de conexión con el servidor.');
    }
  };

  // Completar mandadito -> PATCH /orders/{id}/status con {"status": "completed"}
  const handleCompleteOrder = async () => {
    if (!currentOrder) return;

    try {
      const response = await fetch(`${API_BASE_URL}/orders/${currentOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });

      if (response.ok) {
        alert('¡Mandadito completado con éxito!');
        await fetchOrders();
      } else {
        alert('No se pudo actualizar el estado del pedido.');
      }
    } catch (error) {
      console.error('Error al completar pedido:', error);
      alert('Error de conexión con el servidor.');
    }
  };

  if (loading) {
    return <div className="driver-mobile-container"><p className="no-orders">Cargando pedidos...</p></div>;
  }

  return (
    <div className="driver-mobile-container">
      <header className="driver-header">
        <div className="driver-info">
          <h2>🛵 Hola, {user?.username || user?.name || 'Repartidor'}</h2>
          <span className="status-badge online">● En línea</span>
        </div>
        <button onClick={onLogout} className="logout-btn-sm">Salir</button>
      </header>

      {currentOrder ? (
        // Sección para el pedido que el repartidor está entregando
        <div className="active-delivery-card">
          <span className="badge-urgent">En camino 🛵</span>
          <h3>{currentOrder.store || currentOrder.pickup_location}</h3>
          <p><strong>Cliente:</strong> {currentOrder.client}</p>
          <p><strong>Destino:</strong> {currentOrder.address || currentOrder.delivery_location}</p>
          <p><strong>Descripción:</strong> {currentOrder.description}</p>
          <p><strong>Ganancia:</strong> {currentOrder.payout || `$${currentOrder.reward}`}</p>

          {currentOrder.comments && (
            <div className="order-comments-box">
              <p><strong>📝 Instrucciones de entrega:</strong> {currentOrder.comments}</p>
            </div>
          )}

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
              availableOrders.length === 0 ? (
                <p className="no-orders">No hay mandaditos disponibles por ahora.</p>
              ) : (
                availableOrders.map(order => (
                  <div key={order.id} className="order-card-mobile">
                    <div className="order-card-header">
                      <h4>{order.store || order.pickup_location}</h4>
                      <span className="payout-tag">Ganancia: {order.payout || `$${order.reward}`}</span>
                    </div>
                    <p className="order-desc">🛍️ {order.description}</p>
                    <p className="order-dest">📍 Destino: {order.address || order.delivery_location}</p>
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
              historyOrders.length === 0 ? (
                <p className="no-orders">Aún no tienes mandaditos completados hoy.</p>
              ) : (
                historyOrders.map(order => (
                  <div key={order.id} className="order-card-mobile history-card">
                    <div className="order-card-header">
                      <h4>{order.store || order.pickup_location}</h4>
                      <span className="order-status-badge">Entregado ✅</span>
                    </div>
                    <p className="order-desc">🛍️ {order.description}</p>
                    <p className="order-dest">📍 {order.address || order.delivery_location}</p>
                    <p className="order-client">Cliente: {order.client}</p>
                    <span className="payout-tag success-tag">Ganado: {order.payout || `$${order.reward}`}</span>
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