from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import sqlite3
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
# Configuración de CORS obligatoria para desarrollo frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite cualquier origen local
    allow_credentials=True,
    allow_methods=["*"],  # Permite GET, POST, etc.
    allow_headers=["*"],
)


# Función encargada de inicializar la base de datos local de SQLite
def init_db():
    # Nos conectamos (o creamos) el archivo de base de datos llamado "mandaditos.db"
    conn = sqlite3.connect("mandaditos.db")
    cursor = conn.cursor()
    
    # Creamos la tabla 'orders' si es que no existe todavía en el archivo
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Identificador único de cada pedido (autoincrementable)
            client_name TEXT,                      -- Nombre del vecino o cliente que hace el pedido
            description TEXT,                      -- Qué hay que comprar o recoger
            pickup_location TEXT,                  -- Dónde se debe realizar la recolección
            delivery_location TEXT,                -- A dónde se debe entregar
            reward REAL,                           -- Cuánto se pagará por el servicio (propina/ganancia)
            status TEXT DEFAULT 'pendiente'        -- Estado actual del pedido ('pendiente', 'en_camino', 'completado')
        )
    ''')
    
    # Guardamos (commit) los cambios en la base de datos y cerramos la conexión
    conn.commit()
    conn.close()

# Ejecutamos la función apenas arranca el script para asegurar que la tabla esté lista
init_db()

# Definimos la estructura de datos que esperamos recibir mediante Pydantic (Validación de tipos)
class Order(BaseModel):
    client_name: str
    description: str
    pickup_location: str
    delivery_location: str
    reward: float

# Endpoint (Ruta POST) para registrar un nuevo pedido en el sistema
@app.post("/orders/")
def create_order(order: Order):
    # Abrimos conexión con la base de datos
    conn = sqlite3.connect("mandaditos.db")
    cursor = conn.cursor()
    
    # Insertamos los datos recibidos del cliente asignando por defecto el estado 'pendiente'
    cursor.execute('''
        INSERT INTO orders (client_name, description, pickup_location, delivery_location, reward, status)
        VALUES (?, ?, ?, ?, ?, 'pendiente')
    ''', (order.client_name, order.description, order.pickup_location, order.delivery_location, order.reward))
    
    # Guardamos cambios y cerramos conexión
    conn.commit()
    conn.close()
    
    # Retornamos una respuesta JSON confirmando el registro exitoso
    return {"status": "success", "message": "Mandadito registrado con éxito, listo para tomarse."}

# Endpoint (Ruta GET) para consultar únicamente los pedidos que están pendientes
@app.get("/orders/pending")
def get_pending_orders():
    # Abrimos conexión con la base de datos
    conn = sqlite3.connect("mandaditos.db")
    cursor = conn.cursor()
    
    # Consultamos todos los campos de los pedidos cuyo estado sea exactamente 'pendiente'
    cursor.execute('SELECT id, client_name, description, pickup_location, delivery_location, reward FROM orders WHERE status = "pendiente"')
    rows = cursor.fetchall() # Obtenemos todas las filas encontradas
    
    # Cerramos la conexión a la base de datos ya que obtuvimos la información
    conn.close()
    
    # Iteramos sobre los resultados de la base de datos para transformarlos en una lista limpia de diccionarios (JSON)
    orders = []
    for row in rows:
        orders.append({
            "id": row[0],
            "client_name": row[1],
            "description": row[2],
            "pickup_location": row[3],
            "delivery_location": row[4],
            "reward": row[5]
        })
        
    # Retornamos la lista completa de pedidos pendientes
    return {"pending_orders": orders}

# Endpoint (Ruta PATCH) para actualizar el estado de un pedido (por ejemplo, cambiarlo a 'completado')
@app.patch("/orders/{order_id}/status")
def update_order_status(order_id: int, status: str):
    # Abrimos conexión con la base de datos
    conn = sqlite3.connect("mandaditos.db")
    cursor = conn.cursor()
    
    # Actualizamos el estado del pedido buscando por su ID único
    cursor.execute('UPDATE orders SET status = ? WHERE id = ?', (status, order_id))
    
    # Guardamos los cambios y cerramos la conexión
    conn.commit()
    conn.close()
    
    # Retornamos un mensaje confirmando el cambio de estado
    return {"status": "success", "message": f"El pedido {order_id} ahora está: {status}"}

@app.get("/")
def home():
    return {"message": "Bienvenido a la API de Mandaditos Comunitarios 🚀 YUJUUU!"}

def init_db():
    conn = sqlite3.connect("mandaditos.db")
    cursor = conn.cursor()
    
    # Tabla de usuarios con correo y rol
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT,
            role TEXT NOT NULL
        )
    ''')
    
    # Tabla de pedidos (mantenemos la que ya tienes)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_name TEXT NOT NULL,
            description TEXT NOT NULL,
            pickup_location TEXT NOT NULL,
            delivery_location TEXT NOT NULL,
            reward REAL NOT NULL,
            status TEXT DEFAULT 'pendiente'
        )
    ''')
    conn.commit()
    conn.close()

# Asegúrate de llamar a init_db() al arrancar
init_db()

'''
class UserRegister(BaseModel):
    username: str
    password: str
    role: str  # Puede ser "client" o "driver"
'''
class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    role: str

class GoogleAuth(BaseModel):
    email: str
    username: str
    role: str = "client" # Por defecto los de Google entran como clientes, o puedes elegirlo

@app.post("/google-login")
def google_login(data: GoogleAuth):
    conn = sqlite3.connect("mandaditos.db")
    cursor = conn.cursor()
    
    # Verificar si el correo ya está registrado
    cursor.execute("SELECT id, username, role FROM users WHERE email = ?", (data.email,))
    db_user = cursor.fetchone()
    
    if db_user:
        # El usuario ya existe, lo logueamos directamente
        user_id, username, role = db_user
    else:
        # Si no existe, lo creamos automáticamente con una contraseña vacía o temporal
        cursor.execute(
            "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
            (data.username, data.email, "GOOGLE_AUTH_USER", data.role)
        )
        conn.commit()
        user_id = cursor.lastrowid
        username = data.username
        role = data.role
        
    conn.close()
    return {
        "status": "success",
        "id": user_id,
        "username": username,
        "role": role
    }

@app.post("/register")
def register_user(user: UserRegister):
    try:
        # Usar 'with' asegura que la conexión se cierre siempre de forma automática
        with sqlite3.connect("mandaditos.db") as conn:
            cursor = conn.cursor()
            
            # Asegúrate de incluir el campo 'email' si tu tabla ya lo requiere
            cursor.execute(
                "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
                (user.username, user.email, user.password, user.role)
            )
            conn.commit()
            
        return {"status": "success", "message": "Usuario registrado con éxito"}
        
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="El nombre de usuario o correo ya está en uso.")

# Limpiamos el duplicado y dejamos uno solo
@app.post("/login")
def login(data: UserLogin):
    with sqlite3.connect("mandaditos.db") as conn:
        cursor = conn.cursor()
        
        email_clean = data.email.strip().lower()
        cursor.execute("SELECT id, username, password, role FROM users WHERE email = ?", (email_clean,))
        user = cursor.fetchone()
    
    if not user or user[2] != data.password:
        raise HTTPException(status_code=400, detail="Correo o contraseña incorrectos")
        
    return {
        "status": "success",
        "id": user[0],
        "username": user[1],
        "role": user[3]
    }