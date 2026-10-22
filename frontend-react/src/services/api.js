// src/services/api.js
// 127.0.0.1 avoids IPv6 (localhost) resolution problems on Windows.
// Set VITE_API_URL in .env to switch between local and production.
export const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// Turns whatever the backend returned into a readable message.
// FastAPI validation errors (422) send `detail` as an array of objects.
async function extractError(response, fallback) {
  try {
    const data = await response.json();
    const detail = data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map((d) => d.msg || JSON.stringify(d)).join(". ");
    }
  } catch {
    // Response was not JSON (e.g. a 502 from the host while the server wakes up)
  }
  return fallback;
}

async function request(path, options, fallbackError) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error("No se pudo conectar con el servidor.");
  }
  if (!response.ok) {
    throw new Error(await extractError(response, fallbackError));
  }
  return response.json();
}

function jsonOptions(method, body) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

// --- AUTH ---

export function loginUser(credentials) {
  return request("/login", jsonOptions("POST", credentials), "Error al iniciar sesión");
}

export function registerUser(userData) {
  return request("/register", jsonOptions("POST", userData), "Error al registrarse");
}

export function googleLogin(googleData) {
  return request("/google-login", jsonOptions("POST", googleData), "Error en inicio de sesión con Google");
}

// --- ORDERS ---

export async function getAvailableOrders() {
  const data = await request("/orders/available", undefined, "Error al obtener pedidos disponibles");
  return data.orders || [];
}

export async function getDriverOrders(driverId, status = null) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const data = await request(`/orders/driver/${driverId}${query}`, undefined, "Error al obtener pedidos del repartidor");
  return data.orders || [];
}

export async function getClientOrders(clientId) {
  const data = await request(`/orders/client/${clientId}`, undefined, "Error al obtener pedidos del cliente");
  return data.orders || [];
}

export function createOrder(orderData) {
  return request("/orders", jsonOptions("POST", orderData), "Error al publicar el pedido");
}

export function acceptOrder(orderId, driverId) {
  return request(`/orders/${orderId}/accept`, jsonOptions("POST", { driver_id: driverId }), "No se pudo aceptar el pedido");
}

export function updateOrderStatus(orderId, status) {
  return request(`/orders/${orderId}/status`, jsonOptions("PATCH", { status }), "Error al actualizar estado del pedido");
}
