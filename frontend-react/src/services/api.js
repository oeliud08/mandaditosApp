// src/services/api.js
// 127.0.0.1 avoids IPv6 (localhost) resolution problems on Windows.
// Set VITE_API_URL in .env to switch between local and production.
export const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// --- SESSION (the logged-in user, including the login token, lives in localStorage) ---

const STORAGE_KEY = "mandaditos_user";

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const user = raw ? JSON.parse(raw) : null;
    const valid = user && user.id && user.token && (user.role === "client" || user.role === "driver");
    return valid ? user : null;
  } catch {
    return null;
  }
}

export function storeUser(user) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Storage may be unavailable (private mode); the session just won't persist.
  }
}

export function clearStoredUser() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

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

async function request(path, options = {}, fallbackError) {
  const token = getStoredUser()?.token;
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error("No se pudo conectar con el servidor.");
  }

  // Expired or invalid token on a protected call: drop the session and go back to login.
  // (Login itself also returns 400, not 401, for wrong credentials, so this is safe.)
  if (response.status === 401 && token) {
    clearStoredUser();
    window.location.reload();
    throw new Error("Tu sesión expiró. Inicia sesión de nuevo.");
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

export function acceptOrder(orderId) {
  // The server knows who the driver is from the login token.
  return request(`/orders/${orderId}/accept`, { method: "POST" }, "No se pudo aceptar el pedido");
}

export function updateOrderStatus(orderId, status) {
  return request(`/orders/${orderId}/status`, jsonOptions("PATCH", { status }), "Error al actualizar estado del pedido");
}
