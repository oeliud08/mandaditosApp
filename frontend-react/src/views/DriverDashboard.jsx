import { useState, useEffect, useCallback } from 'react';
import { getAvailableOrders, getDriverOrders, acceptOrder, updateOrderStatus } from '../services/api';
import './DriverDashboard.css';

const POLL_MS = 4000;

const mapsUrl = (query) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || '')}`;

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

export default function DriverDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('available');
  const [availableOrders, setAvailableOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [syncError, setSyncError] = useState('');

  const fetchOrders = useCallback(async () => {
    if (!user?.id) {
      setSyncError('No se encontró tu sesión. Cierra sesión e inicia de nuevo.');
      setLoading(false);
      return;
    }
    try {
      const [available, mine] = await Promise.all([
        getAvailableOrders(),
        getDriverOrders(user.id),
      ]);

      setAvailableOrders(available);
      setCurrentOrder(mine.find((o) => o.status === 'assigned') || null);
      setHistoryOrders(mine.filter((o) => o.status === 'completed'));
      setSyncError('');
    } catch (error) {
      console.error('Error al sincronizar con el servidor:', error);
      setSyncError('Sin conexión con el servidor. Reintentando...');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleAcceptOrder = async (order) => {
    if (busy) return;
    setBusy(true);
    try {
      await acceptOrder(order.id);
    } catch (error) {
      alert(error.message);
    } finally {
      await fetchOrders();
      setBusy(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!currentOrder || busy) return;
    setBusy(true);
    try {
      await updateOrderStatus(currentOrder.id, 'completed');
      await fetchOrders();
    } catch (error) {
      alert(error.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="driver-mobile-container">
        <p className="no-orders">Cargando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="driver-mobile-container">
      <header className="driver-header">
        <div className="driver-info">
          <h2>🛵 Hola, {user?.username || 'Repartidor'}</h2>
          <span className="status-badge online">● En línea</span>
        </div>
        <button onClick={onLogout} className="logout-btn-sm">Salir</button>
      </header>

      {syncError && <p className="sync-error">{syncError}</p>}

      {currentOrder ? (
        <div className="active-delivery-card">
          <span className="badge-urgent">En camino 🛵</span>
          <h3>{currentOrder.pickup_location}</h3>
          <p><strong>Cliente:</strong> {currentOrder.client}</p>
          <p><strong>Descripción:</strong> {currentOrder.description}</p>
          <p><strong>Destino:</strong> {currentOrder.delivery_location}</p>
          <p><strong>Ganancia:</strong> {formatMoney(currentOrder.reward)}</p>

          <div className="map-links">
            <a href={mapsUrl(currentOrder.pickup_location)} target="_blank" rel="noopener noreferrer" className="map-link pickup">
              🗺️ Ruta al negocio
            </a>
            <a href={mapsUrl(currentOrder.delivery_location)} target="_blank" rel="noopener noreferrer" className="map-link delivery">
              🧭 Ruta de entrega
            </a>
          </div>

          {currentOrder.comments && (
            <div className="order-comments-box">
              <p><strong>📝 Instrucciones de entrega:</strong> {currentOrder.comments}</p>
            </div>
          )}

          <button onClick={handleCompleteOrder} className="action-btn success" disabled={busy}>
            {busy ? 'Guardando...' : 'Marcar como Entregado'}
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
                availableOrders.map((order) => (
                  <div key={order.id} className="order-card-mobile">
                    <div className="order-card-header">
                      <h4>{order.pickup_location}</h4>
                      <span className="payout-tag">Ganancia: {formatMoney(order.reward)}</span>
                    </div>
                    <p className="order-desc">🛍️ {order.description}</p>
                    <p className="order-dest">📍 Destino: {order.delivery_location}</p>
                    <p className="order-client">Cliente: {order.client}</p>

                    <button
                      onClick={() => handleAcceptOrder(order)}
                      className="action-btn primary"
                      disabled={busy}
                    >
                      Aceptar Mandadito
                    </button>
                  </div>
                ))
              )
            ) : historyOrders.length === 0 ? (
              <p className="no-orders">Aún no tienes mandaditos completados.</p>
            ) : (
              historyOrders.map((order) => (
                <div key={order.id} className="order-card-mobile history-card">
                  <div className="order-card-header">
                    <h4>{order.pickup_location}</h4>
                    <span className="order-status-badge">Entregado ✅</span>
                  </div>
                  <p className="order-desc">🛍️ {order.description}</p>
                  <p className="order-dest">📍 {order.delivery_location}</p>
                  <p className="order-client">Cliente: {order.client}</p>
                  <span className="payout-tag success-tag">Ganado: {formatMoney(order.reward)}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
