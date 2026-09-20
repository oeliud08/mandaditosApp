import sqlite3
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Configuración de CORS obligatoria
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicialización de Base de Datos
def init_db():
    with sqlite3.connect("mandaditos.db") as conn:
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
                status TEXT DEFAULT 'pending',
                driver_id INTEGER,
                FOREIGN KEY(client_id) REFERENCES users(id),
                FOREIGN KEY(driver_id) REFERENCES users(id)
            )
        """)
        conn.commit()

init_db()


# --- ESQUEMAS DE PYDANTIC PARA AUTENTICACIÓN ---
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


# --- AUTENTICACIÓN ---

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

@app.post("/google-login")
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


# --- ENDPOINTS DE PEDIDOS (Con alta flexibilidad para evitar errores 422) ---

# 1. Crear pedido (Usa 'dict' para aceptar cualquier nombre de variable del frontend)
@app.post("/orders")
@app.post("/orders/")
def create_order(order_data: dict):
    # Aseguramos de que el ID del cliente sea un número entero
    raw_client_id = order_data.get("client_id") or order_data.get("clientID")
    client_id = int(raw_client_id) if raw_client_id else 1

    description = order_data.get("description", "")
    pickup_location = order_data.get("pickup_location") or order_data.get("pickupLocation") or ""
    delivery_location = order_data.get("delivery_location") or order_data.get("deliveryLocation") or ""
    reward = float(order_data.get("reward", 0.0))

    with sqlite3.connect("mandaditos.db") as conn:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO orders (client_id, description, pickup_location, delivery_location, reward, status) 
               VALUES (?, ?, ?, ?, ?, 'pending')""",
            (client_id, description, pickup_location, delivery_location, reward)
        )
        conn.commit()
    return {"status": "success", "message": "Mandadito publicado con éxito"}

# 2. Ver los pedidos de un cliente
@app.get("/orders/client/{client_id}")
def get_client_orders(client_id: int):
    with sqlite3.connect("mandaditos.db") as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, description, pickup_location, delivery_location, reward, status FROM orders WHERE client_id = ?",
            (client_id,)
        )
        rows = cursor.fetchall()

    #Enviamos datos con guion bajo y camelCase para evitar fallos en JS
    orders = [{
        "id": row[0],
        "description": row[1],
        "pickup_location": row[2],
        "pickupLocation": row[2],
        "delivery_location": row[3],
        "deliveryLocation": row[3],
        "reward": row[4],
        "status": row[5]
    } for row in rows]
    
    return {"status": "success", "orders": orders}

# 3. Ver pedidos pendientes (Soporta /orders/pending y /orders/available)
@app.get("/orders/pending")
@app.get("/orders/available")
def get_available_orders():
    with sqlite3.connect("mandaditos.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, description, pickup_location, delivery_location, reward, client_id FROM orders WHERE status = 'pending'")
        rows = cursor.fetchall()
        
    orders = [{
        "id": row[0],
        "description": row[1],
        "pickup_location": row[2],
        "pickupLocation": row[2],
        "delivery_location": row[3],
        "deliveryLocation": row[3],
        "reward": row[4],
        "client_id": row[5],
        "clientID": row[5]
    } for row in rows]
    return {"status": "success", "orders": orders}

# 4. Aceptar un pedido
@app.post("/orders/{order_id}/accept")
def accept_order(order_id: int, data: AcceptOrderRequest):
    with sqlite3.connect("mandaditos.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT status FROM orders WHERE id = ?", (order_id,))
        order = cursor.fetchone()
        
        if not order:
            raise HTTPException(status_code=404, detail="El pedido ya no existe.")
            
        if order[0] != 'pending':
                raise HTTPException(status_code=400, detail="Lo sentimos! Otro repartidor tomo el pedido")
            
        cursor.execute(
            "UPDATE orders SET status = 'assigned', driver_id = ? WHERE id = ? AND status = 'pending'",
            (data.driver_id, order_id)
        )
        conn.commit()
            
    return {"status": "success", "message": "¡Pedido aceptado con éxito! Ve por él."}

# 5. Actualizar estado del pedido
@app.patch("/orders/{order_id}/status")
def update_order_status(order_id: int, status: str):
    with sqlite3.connect("mandaditos.db") as conn:
        cursor = conn.cursor()
        cursor.execute('UPDATE orders SET status = ? WHERE id = ?', (status, order_id))
        conn.commit()
        
    return {"status": "success", "message": f"El pedido {order_id} ahora está: {status}"}


# 6. Pedidos aceptados por el driver
@app.get("/orders/driver/{driver_id}")
def get_driver_orders(driver_id: int):
    with sqlite3.connect("mandaditos.db") as conn:
        cursor = conn.cursor()
        # Buscamos los pedidos asignados a un repa en especifico
        cursor.execute(
            "SELECT id, description, pickup_location, delivery_location, reward, status, client_id FROM orders WHERE driver_id = ? AND status = 'assigned'", 
            (driver_id,)
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
        "status": row[5],
        "client_id": row[6],
        "clientID": row[6]
     } for row in rows]

    return {"status": "success", "orders": orders}


@app.get("/")
def home():
    return {"message": "Bienvenido a la API de Mandaditos Comunitarios 🚀 YUJUUU!"}

def get_db():
  conn = sqlite3.connect("database.db")  # O el nombre de tu archivo .db
  conn.row_factory = sqlite3.Row
  try:
    yield conn
  finally:
    conn.close()

@app.get("/usuarios")
def obtener_usuarios(db=Depends(get_db)):
  cursor = db.cursor()
  cursor.execute("SELECT * FROM usuarios")  # Ajusta el nombre de tu tabla
  usuarios = cursor.fetchall()
  return [dict(row) for row in usuarios]