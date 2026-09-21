import sqlite3
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os #Debugging purposes

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mandaditoswebapp.netlify.app",
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB initialization

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "mandaditos.db")

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        #1. Create users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT,
                role TEXT NOT NULL
            )
        """)

        #2. Create orders table
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

        #3. Default driver (ID: 1)
        cursor.execute("""
            INSERT OR IGNORE INTO users (id, username, email, password, role) 
            VALUES (1, 'default_driver', 'driver@test.com', '123456', 'driver')
        """)

        #4. Default client (ID: 2)
        cursor.execute("""
            INSERT OR IGNORE INTO users (id, username, email, password, role) 
            VALUES (2, 'default_client', 'client@test.com', '123456', 'client')
        """)

        conn.commit()

init_db()


# --- ESQUEMAS DE PYDANTIC ---
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


# --- autentication ---

@app.post("/register")
def register_user(user: UserRegister):
    try:
        with sqlite3.connect("mandaditos.db") as conn:
            cursor = conn.cursor()
            email_clean = user.email.strip().lower()
            cursor.execute(
                "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
                (user.username, email_clean, user.password, user.role)
            )
            conn.commit()
        return {"status": "success", "message": "Usuario registrado con éxito"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="El nombre de usuario o correo ya está en uso.")

@app.post("/login")
def login(data: UserLogin):
    with sqlite3.connect("mandaditos.db") as conn:
        cursor = conn.cursor()
        email_clean = data.email.strip().lower()
        cursor.execute("SELECT id, username, password, role FROM users WHERE email = ?", (email_clean,))
        user = cursor.fetchone()
    
    if not user or user[2] != data.password:
        raise HTTPException(status_code=400, detail="Correo o contraseña incorrectos")

    if user[3] != data.role:
        raise HTTPException(status_code=400, detail=f"Esta cuenta no está registrada como {data.role}.")

    return {
        "status": "success",
        "id": user[0],
        "username": user[1],
        "role": user[3]
    }

@app.post("/google-login") # -- not working yet--
def google_login(data: GoogleAuth):
    with sqlite3.connect("mandaditos.db") as conn:
        cursor = conn.cursor()
        email_clean = data.email.strip().lower()
        cursor.execute("SELECT id, username, role FROM users WHERE email = ?", (email_clean,))
        db_user = cursor.fetchone()
        
        if db_user:
            user_id, username, role = db_user
        else:
            cursor.execute(
                "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
                (data.username, email_clean, "GOOGLE_AUTH_USER", data.role)
            )
            conn.commit()
            user_id = cursor.lastrowid
            username = data.username
            role = data.role
            
    return {
        "status": "success",
        "id": user_id,
        "username": username,
        "role": role
    }


# --- ENDPOINTS DE PEDIDOS ---

# 1. Cretate a new order
@app.post("/orders")
@app.post("/orders/")
def create_order(order_data: dict):
    raw_client_id = order_data.get("client_id") or order_data.get("clientID")
    client_id = int(raw_client_id) if raw_client_id else 1

    description = order_data.get("description", "")
    pickup_location = order_data.get("pickup_location") or order_data.get("pickupLocation") or ""
    delivery_location = order_data.get("delivery_location") or order_data.get("deliveryLocation") or ""
    reward = float(order_data.get("reward", 0.0))
    comments = order_data.get("comments", "")

    with sqlite3.connect("mandaditos.db") as conn:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO orders (client_id, description, pickup_location, delivery_location, reward, comments, status) 
               VALUES (?, ?, ?, ?, ?, ?, 'pending')""",
            (client_id, description, pickup_location, delivery_location, reward, comments)
        )
        conn.commit()
    return {"status": "success", "message": "Mandadito publicado con éxito"}

# 2. Show all orders for a specific client
@app.get("/orders/client/{client_id}")
def get_client_orders(client_id: int):
    with sqlite3.connect("mandaditos.db") as conn:
        cursor = conn.cursor()
        cursor.execute(
            """SELECT id, description, pickup_location, delivery_location, reward, comments, status, driver_id 
               FROM orders WHERE client_id = ?""",
            (client_id,)
        )
        rows = cursor.fetchall()

    orders = [{
        "id": row[0],
        "description": row[1],
        "pickup_location": row[2],
        "pickupLocation": row[2],
        "delivery_location": row[3],
        "deliveryLocation": row[3],
        "reward": row[4],
        "comments": row[5],
        "status": row[6],
        "driver_id": row[7]
    } for row in rows]
    
    return {"status": "success", "orders": orders}

# 3. Show all available orders (pending) for drivers
@app.get("/orders/pending")
@app.get("/orders/available")
def get_available_orders():
    with sqlite3.connect("mandaditos.db") as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT o.id, o.description, o.pickup_location, o.delivery_location, o.reward, o.comments, o.client_id, u.username
            FROM orders o
            LEFT JOIN users u ON o.client_id = u.id
            WHERE o.status = 'pending'
        """)
        rows = cursor.fetchall()

        # print registered orders for debugging
        print("Pedidos registrados en la base de datos:")
        print("\n== [BD] Filas obtenidas de la base de datos ==")
        print(rows)
    orders = [{
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
        "client_id": row[6],
        "clientID": row[6],
        "client": row[7] or f"Cliente #{row[6]}"
    } for row in rows]
    
    return {"status": "success", "orders": orders}

# 4. Aceptar pedido
@app.post("/orders/{order_id}/accept")
def accept_order(order_id: int, data: AcceptOrderRequest):
    with sqlite3.connect("mandaditos.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT status FROM orders WHERE id = ?", (order_id,))
        order = cursor.fetchone()
        
        if not order:
            raise HTTPException(status_code=404, detail="El pedido ya no existe.")
            
        if order[0] != 'pending':
            raise HTTPException(status_code=400, detail="¡Lo sentimos! Otro repartidor tomó este pedido.")
            
        cursor.execute(
            "UPDATE orders SET status = 'assigned', driver_id = ? WHERE id = ? AND status = 'pending'",
            (data.driver_id, order_id)
        )
        conn.commit()
            
    return {"status": "success", "message": "¡Pedido aceptado con éxito!"}

# 5. Actualizar estado del pedido (Soporta JSON Body o Query Param)
@app.patch("/orders/{order_id}/status")
def update_order_status(order_id: int, payload: UpdateStatusRequest):
    with sqlite3.connect("mandaditos.db") as conn:
        cursor = conn.cursor()
        cursor.execute('UPDATE orders SET status = ? WHERE id = ?', (payload.status, order_id))
        conn.commit()
        
    return {"status": "success", "message": f"El pedido {order_id} ahora está: {payload.status}"}

# 6. Ver pedidos asignados o en historial del repartidor
@app.get("/orders/driver/{driver_id}")
def get_driver_orders(driver_id: int, status: Optional[str] = None):
    with sqlite3.connect("mandaditos.db") as conn:
        cursor = conn.cursor()
        
        if status:
            cursor.execute("""
                SELECT o.id, o.description, o.pickup_location, o.delivery_location, o.reward, o.comments, o.status, o.client_id, u.username
                FROM orders o
                LEFT JOIN users u ON o.client_id = u.id
                WHERE o.driver_id = ? AND o.status = ?
            """, (driver_id, status))
        else:
            cursor.execute("""
                SELECT o.id, o.description, o.pickup_location, o.delivery_location, o.reward, o.comments, o.status, o.client_id, u.username
                FROM orders o
                LEFT JOIN users u ON o.client_id = u.id
                WHERE o.driver_id = ?
            """, (driver_id,))
            
        rows = cursor.fetchall()
                
    orders = [{
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
        "client_id": row[7],
        "clientID": row[7],
        "client": row[8] or f"Cliente #{row[7]}"
    } for row in rows]

    return {"status": "success", "orders": orders}

@app.get("/")
def home():
    return {"message": "Bienvenido a la API de Mandaditos Comunitarios 🚀"}


# --- CONEXIÓN DE APOYO PARA DEPENDENCIAS ---
def get_db():
    conn = sqlite3.connect("mandaditos.db")
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

@app.get("/usuarios")
def obtener_usuarios(db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT id, username, email, role FROM users")
    usuarios = cursor.fetchall()
    return [dict(row) for row in usuarios]

# Obtener todos los pedidos (para soporte con GET /orders)
@app.get("/orders")
@app.get("/orders/")
def get_all_orders():
    with sqlite3.connect("mandaditos.db") as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT o.id, o.description, o.pickup_location, o.delivery_location, o.reward, o.comments, o.status, o.client_id, u.username
            FROM orders o
            LEFT JOIN users u ON o.client_id = u.id
        """)
        rows = cursor.fetchall()
        
    orders = [{
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
        "client_id": row[7],
        "clientID": row[7],
        "client": row[8] or f"Cliente #{row[7]}"
    } for row in rows]
    
    return {"status": "success", "orders": orders}