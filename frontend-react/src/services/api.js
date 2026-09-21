// src/services/api.js
// Usamos 127.0.0.1 por defecto para evitar problemas con la resolución de IPv6 (localhost) en Windows
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// --- AUTENTICACIÓN ---

export async function loginUser(credentials) {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al iniciar sesión");
  }

  return response.json();
}

export async function registerUser(userData) {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al registrarse");
  }

  return response.json();
}

export async function googleLogin(googleData) {
  const response = await fetch(`${API_URL}/google-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(googleData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error en inicio de sesión con Google");
  }

  return response.json();
}

// --- GESTIÓN DE PEDIDOS ---

// 1. Obtener pedidos disponibles/pendientes para repartidores
export async function getAvailableOrders() {
  const response = await fetch(`${API_URL}/orders/available`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al obtener pedidos disponibles");
  }

  const data = await response.json();
  return data.orders || []; // Extrae el arreglo 'orders' del backend
}

// 2. Obtener pedidos asignados a un repartidor (o por estado)
export async function getDriverOrders(driverId, status = null) {
  const url = status 
    ? `${API_URL}/orders/driver/${driverId}?status=${status}`
    : `${API_URL}/orders/driver/${driverId}`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al obtener pedidos del repartidor");
  }

  const data = await response.json();
  return data.orders || [];
}

// 3. Obtener pedidos creados por un cliente
export async function getClientOrders(clientId) {
  const response = await fetch(`${API_URL}/orders/client/${clientId}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al obtener pedidos del cliente");
  }

  const data = await response.json();
  return data.orders || [];
}

// 4. Crear un nuevo pedido (Cliente)
export async function createOrder(orderData) {
  const response = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al publicar el pedido");
  }

  return response.json();
}

// 5. Aceptar un pedido (Repartidor)
export async function acceptOrder(orderId, driverId) {
  const response = await fetch(`${API_URL}/orders/${orderId}/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ driver_id: driverId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "No se pudo aceptar el pedido");
  }

  return response.json();
}

// 6. Actualizar el estado de un pedido (ejemplo: 'completed')
export async function updateOrderStatus(orderId, status) {
  const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al actualizar estado del pedido");
  }

  return response.json();
}