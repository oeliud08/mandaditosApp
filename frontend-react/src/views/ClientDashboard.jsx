import { useState, useEffect, useCallback } from 'react';
import './ClientDashboard.css';

const API_BASE_URL = 'https://mandaditosapp.onrender.com';

export default function ClientDashboard({ user, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [description, setDescription] = useState('');
  const [comments, setComments] = useState('');
  const [reward, setReward] = useState('');

  // 1. Obtener pedidos desde la base de datos
  const fetchOrders = useCallback(async () => {
    try {
      // Si existe un endpoint específico por cliente se usa /orders/client/:id, de lo contrario /orders
      const endpoint = user?.id ? `${API_BASE_URL}/orders/client/${user.id}` : `${API_BASE_URL}/orders`;
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        // Fallback al endpoint general si no existe la ruta específica
        const fallbackResponse = await fetch(`${API_BASE_URL}/orders`);
        if (!fallbackResponse.ok) throw new Error('Error al conectar con la base de datos');
        const fallbackData = await fallbackResponse.json();
        const list = Array.isArray(fallbackData) ? fallbackData : (fallbackData.orders || []);
        setOrders(list);
      } else {
        const data = await response.json();
        const list = Array.isArray(data) ? data : (data.orders || []);
        setOrders(list);
      }

      // 🔍 LÍNEA DE VERIFICACIÓN EN CONSOLA
      console.log(`[${new Date().toLocaleTimeString()}] 🔄 Client Dashboard sincronizado | Mis pedidos: ${orders.length}`);

    } catch (error) {
      console.error('Error al obtener pedidos del cliente:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, orders.length]);

  // Consultar al cargar y actualizar cada 4 segundos
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // 2. Mapeo para mostrar estados amigables
  const formatStatus = (status) => {
    switch (status) {
      case 'pending':
      case 'Disponible':
        return 'Buscando repartidor 🔍';
      case 'assigned':
      case 'En camino':
        return 'En camino 🛵';
      case 'completed':
      case 'Entregado':
        return 'Entregado ✅';
      default:
        return status || 'Buscando repartidor 🔍';
    }
  };

  // 3. Crear nuevo mandadito guardándolo en SQLite (FastAPI)
  const handleCreateOrder = async (e) => {
    e.preventDefault();

    const newOrderPayload = {
      pickup_location: pickup,
      delivery_location: dropoff,
      description: description,
      comments: comments,
      reward: parseFloat(reward) || 0.0,
      client_id: user?.id || null,
      client: user?.username || user?.name || 'Cliente'
    };

    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrderPayload)
      });

      if (response.ok) {
        setPickup('');
        setDropoff('');
        setDescription('');
        setComments('');
        setReward('');
        setShowNewOrderModal(false);
        await fetchOrders();
      } else {
        const errData = await response.json();
        alert(errData.detail || 'No se pudo crear el pedido.');
      }
    } catch (error) {
      console.error('Error al crear el pedido:', error);
      alert('Error de conexión con el servidor.');
    }
  };

  if (loading) {
    return <div className="dashboard-container"><p className="no-orders">Cargando tus mandaditos...</p></div>;
  }

  return (
    <div className="dashboard-container">
      {/* Barra superior minimalista */}
      <header className="dashboard-header">
        <div className="header-brand">
          <h2>Mandaditos <span>Comunitarios</span></h2>
        </div>
        <div className="header-user">
          <span className="user-greeting">Hola, <strong>{user?.username || user?.name || 'Cliente'}</strong></span>
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
                  <span className="order-status">{formatStatus(order.status)}</span>
                </div>
                <div className="order-body">
                  <p><strong>Descripción:</strong> {order.description}</p>
                  <p><strong>Origen:</strong> {order.pickup || order.pickup_location}</p>
                  <p><strong>Destino:</strong> {order.dropoff || order.delivery_location || order.address}</p>
                  {order.comments && (
                    <p><strong>Instrucciones:</strong> {order.comments}</p>
                  )}
                  <p><strong>Ofrecido:</strong> ${order.reward ? Number(order.reward).toFixed(2) : (order.payout ? Number(order.payout).toFixed(2) : '0.00')}</p>
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
                  placeholder="Ej. 30.00" 
                  value={reward} 
                  onChange={(e) => setReward(e.target.value)} 
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