import base64
import hashlib
import hmac
import os
import secrets
import sqlite3
from contextlib import contextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
ALLOWED_ORIGINS = [
    "https://mandaditoswebapp.netlify.app",
    "http://localhost:3000",
    "http://localhost:5173",
]
# Extra origins can be added without touching code: EXTRA_ORIGINS="https://a.com,https://b.com"
ALLOWED_ORIGINS += [o.strip() for o in os.environ.get("EXTRA_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Database
#
# DB_PATH can be set as an environment variable. On Render, attach a persistent
# disk (e.g. mounted at /var/data) and set DB_PATH=/var/data/mandaditos.db,
# otherwise the SQLite file is wiped on every deploy/restart.
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get("DB_PATH", os.path.join(BASE_DIR, "mandaditos.db"))

VALID_ROLES = {"client", "driver"}
VALID_STATUSES = {"pending", "assigned", "completed"}


@contextmanager
def get_conn():
    """Open a connection, commit on success, rollback on error, always close."""
    conn = sqlite3.connect(DB_PATH)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Password hashing (PBKDF2 from the standard library, no extra dependency)
# ---------------------------------------------------------------------------
PBKDF2_ITERATIONS = 200_000


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ITERATIONS)
    return "pbkdf2${}${}${}".format(
        PBKDF2_ITERATIONS,
        base64.b64encode(salt).decode(),
        base64.b64encode(digest).decode(),
    )


def verify_password(password: str, stored: Optional[str]) -> bool:
    if not stored or stored == "GOOGLE_AUTH_USER":
        return False
    if stored.startswith("pbkdf2$"):
        try:
            _, iterations, salt_b64, digest_b64 = stored.split("$")
            salt = base64.b64decode(salt_b64)
            expected = base64.b64decode(digest_b64)
            candidate = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, int(iterations))
            return hmac.compare_digest(candidate, expected)
        except Exception:
            return False
    # Legacy plain-text password (accounts created before hashing was added).
    return hmac.compare_digest(password.encode(), stored.encode())


def is_hashed(stored: Optional[str]) -> bool:
    return bool(stored) and stored.startswith("pbkdf2$")


# ---------------------------------------------------------------------------
# DB initialization
# ---------------------------------------------------------------------------
def init_db():
    with get_conn() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT,
                role TEXT NOT NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER,
                description TEXT NOT NULL,
                pickup_location TEXT NOT NULL,
                delivery_location TEXT NOT NULL,
                reward REAL NOT NULL,
                comments TEXT,
                status TEXT DEFAULT 'pending',
                driver_id INTEGER,
                FOREIGN KEY(client_id) REFERENCES users(id),
                FOREIGN KEY(driver_id) REFERENCES users(id)
            )
        """)

        # Demo accounts are only created when explicitly requested, so they never
        # exist in production with a known password.
        if os.environ.get("SEED_DEMO_USERS") == "1":
            cursor.execute(
                "INSERT OR IGNORE INTO users (id, username, email, password, role) VALUES (1, 'default_driver', 'driver@test.com', ?, 'driver')",
                (hash_password("123456"),),
            )
            cursor.execute(
                "INSERT OR IGNORE INTO users (id, username, email, password, role) VALUES (2, 'default_client', 'client@test.com', ?, 'client')",
                (hash_password("123456"),),
            )


init_db()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    role: str


class UserLogin(BaseModel):
    email: str
    password: str
    role: str


class GoogleAuth(BaseModel):
    email: str
    username: str
    role: str = "client"


class AcceptOrderRequest(BaseModel):
    driver_id: int


class UpdateStatusRequest(BaseModel):
    status: str


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------
@app.post("/register")
def register_user(user: UserRegister):
    username = user.username.strip()
    email_clean = user.email.strip().lower()

    if not username or not email_clean or not user.password:
        raise HTTPException(status_code=400, detail="Todos los campos son obligatorios.")
    if user.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="Rol inválido.")
    if len(user.password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres.")

    try:
        with get_conn() as conn:
            conn.execute(
                "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
                (username, email_clean, hash_password(user.password), user.role),
            )
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="El correo ya está registrado.")

    return {"status": "success", "message": "Usuario registrado con éxito"}


@app.post("/login")
def login(data: UserLogin):
    email_clean = data.email.strip().lower()

    with get_conn() as conn:
        user = conn.execute(
            "SELECT id, username, password, role FROM users WHERE email = ?",
            (email_clean,),
        ).fetchone()

        if not user or not verify_password(data.password, user[2]):
            raise HTTPException(status_code=400, detail="Correo o contraseña incorrectos")

        # Transparently upgrade legacy plain-text passwords to hashed ones.
        if not is_hashed(user[2]):
            conn.execute(
                "UPDATE users SET password = ? WHERE id = ?",
                (hash_password(data.password), user[0]),
            )

    if user[3] != data.role:
        raise HTTPException(status_code=400, detail=f"Esta cuenta no está registrada como {data.role}.")

    return {"status": "success", "id": user[0], "username": user[1], "role": user[3]}


@app.post("/google-login")
def google_login(data: GoogleAuth):
    # NOTE: this endpoint trusts the email sent by the client. Before using it for
    # real, verify the Google ID token server-side (google-auth library).
    # It is disabled unless ENABLE_GOOGLE_LOGIN=1 so it can't be abused to log in
    # as someone else.
    if os.environ.get("ENABLE_GOOGLE_LOGIN") != "1":
        raise HTTPException(status_code=501, detail="Inicio de sesión con Google no disponible.")

    if data.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="Rol inválido.")

    email_clean = data.email.strip().lower()
    with get_conn() as conn:
        db_user = conn.execute(
            "SELECT id, username, role FROM users WHERE email = ?", (email_clean,)
        ).fetchone()

        if db_user:
            user_id, username, role = db_user
        else:
            cursor = conn.execute(
                "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
                (data.username, email_clean, "GOOGLE_AUTH_USER", data.role),
            )
            user_id, username, role = cursor.lastrowid, data.username, data.role

    return {"status": "success", "id": user_id, "username": username, "role": role}


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------
def serialize_order(row, include_client=True):
    """row: id, description, pickup, delivery, reward, comments, status, client_id, client_name"""
    order = {
        "id": row[0],
        "description": row[1],
        "pickup_location": row[2],
        "pickupLocation": row[2],
        "store": row[2],
        "delivery_location": row[3],
        "deliveryLocation": row[3],
        "address": row[3],
        "reward": row[4],
        "payout": f"${row[4]:.2f}",
        "comments": row[5],
        "status": row[6],
    }
    if include_client:
        order.update({
            "client_id": row[7],
            "clientID": row[7],
            "client": row[8] or f"Cliente #{row[7]}",
        })
    return order


ORDER_SELECT = """
    SELECT o.id, o.description, o.pickup_location, o.delivery_location,
           o.reward, o.comments, o.status, o.client_id, u.username
    FROM orders o
    LEFT JOIN users u ON o.client_id = u.id
"""


def _require_text(value, field):
    text = (value or "").strip() if isinstance(value, str) else ""
    if not text:
        raise HTTPException(status_code=400, detail=f"El campo '{field}' es obligatorio.")
    return text


@app.post("/orders")
@app.post("/orders/")
def create_order(order_data: dict):
    raw_client_id = order_data.get("client_id") or order_data.get("clientID")
    try:
        client_id = int(raw_client_id)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Falta el cliente que crea el pedido.")

    description = _require_text(order_data.get("description"), "descripción")
    pickup_location = _require_text(
        order_data.get("pickup_location") or order_data.get("pickupLocation"), "lugar de recolección"
    )
    delivery_location = _require_text(
        order_data.get("delivery_location") or order_data.get("deliveryLocation"), "lugar de entrega"
    )
    comments = (order_data.get("comments") or "").strip()

    try:
        reward = float(order_data.get("reward"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="La recompensa debe ser un número.")
    if reward <= 0:
        raise HTTPException(status_code=400, detail="La recompensa debe ser mayor a 0.")

    with get_conn() as conn:
        client = conn.execute("SELECT role FROM users WHERE id = ?", (client_id,)).fetchone()
        if not client or client[0] != "client":
            raise HTTPException(status_code=400, detail="Cliente no válido.")

        conn.execute(
            """INSERT INTO orders (client_id, description, pickup_location, delivery_location, reward, comments, status)
               VALUES (?, ?, ?, ?, ?, ?, 'pending')""",
            (client_id, description, pickup_location, delivery_location, reward, comments),
        )

    return {"status": "success", "message": "Mandadito publicado con éxito"}


@app.get("/orders/client/{client_id}")
def get_client_orders(client_id: int):
    with get_conn() as conn:
        rows = conn.execute(ORDER_SELECT + " WHERE o.client_id = ? ORDER BY o.id DESC", (client_id,)).fetchall()

    return {"status": "success", "orders": [serialize_order(r) for r in rows]}


@app.get("/orders/pending")
@app.get("/orders/available")
def get_available_orders():
    with get_conn() as conn:
        rows = conn.execute(ORDER_SELECT + " WHERE o.status = 'pending' ORDER BY o.id DESC").fetchall()

    return {"status": "success", "orders": [serialize_order(r) for r in rows]}


@app.post("/orders/{order_id}/accept")
def accept_order(order_id: int, data: AcceptOrderRequest):
    with get_conn() as conn:
        driver = conn.execute("SELECT role FROM users WHERE id = ?", (data.driver_id,)).fetchone()
        if not driver or driver[0] != "driver":
            raise HTTPException(status_code=400, detail="Repartidor no válido.")

        # Single atomic statement: only one driver can win the race.
        cursor = conn.execute(
            "UPDATE orders SET status = 'assigned', driver_id = ? WHERE id = ? AND status = 'pending'",
            (data.driver_id, order_id),
        )
        if cursor.rowcount == 0:
            exists = conn.execute("SELECT 1 FROM orders WHERE id = ?", (order_id,)).fetchone()
            if not exists:
                raise HTTPException(status_code=404, detail="El pedido ya no existe.")
            raise HTTPException(status_code=400, detail="¡Lo sentimos! Otro repartidor tomó este pedido.")

    return {"status": "success", "message": "¡Pedido aceptado con éxito!"}


@app.patch("/orders/{order_id}/status")
def update_order_status(order_id: int, payload: UpdateStatusRequest):
    if payload.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Estado inválido.")

    with get_conn() as conn:
        cursor = conn.execute(
            "UPDATE orders SET status = ? WHERE id = ?", (payload.status, order_id)
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="El pedido no existe.")

    return {"status": "success", "message": f"El pedido {order_id} ahora está: {payload.status}"}


@app.get("/orders/driver/{driver_id}")
def get_driver_orders(driver_id: int, status: Optional[str] = None):
    query = ORDER_SELECT + " WHERE o.driver_id = ?"
    params = [driver_id]
    if status:
        query += " AND o.status = ?"
        params.append(status)
    query += " ORDER BY o.id DESC"

    with get_conn() as conn:
        rows = conn.execute(query, params).fetchall()

    return {"status": "success", "orders": [serialize_order(r) for r in rows]}


@app.get("/")
def home():
    return {"message": "Bienvenido a la API de Mandaditos Comunitarios 🚀"}
