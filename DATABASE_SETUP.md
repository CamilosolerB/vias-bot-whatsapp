# 🗄️ Configuración de Base de Datos: Railway & Clever Cloud

Guía paso a paso para crear la estructura de base de datos en Railway o Clever Cloud.

---

## 📋 Archivo SQL

El archivo `DATABASE_SCHEMA.sql` contiene:
- ✅ 8 tablas principales
- ✅ Índices para optimización
- ✅ 2 vistas útiles
- ✅ 2 procedimientos almacenados
- ✅ Datos de ejemplo

---

## 🚀 Opción 1: Railway

### Paso 1: Acceder a la Base de Datos

1. Ve a [railway.app](https://railway.app)
2. Abre tu proyecto **vias-bot-whatsapp**
3. Haz clic en el servicio **MySQL** en el panel izquierdo
4. Ve a la pestaña **Connect**

### Paso 2: Obtener Credenciales

Copia la información:
```
Host: xxx.railway.app
Port: xxxxx
Database: railway
Username: root
Password: xxxxxxxx
```

### Paso 3: Ejecutar SQL (Opción A - SQL Editor)

1. En Railway, ve a la pestaña **Data**
2. Haz clic en **SQL Editor**
3. Abre el archivo `DATABASE_SCHEMA.sql` en tu editor de texto
4. Copia TODO el contenido
5. Pega en el SQL Editor de Railway
6. Haz clic en **Execute** o presiona `Ctrl+Enter`
7. ¡Listo! Las tablas se crearán automáticamente

### Paso 4: Ejecutar SQL (Opción B - CLI)

Si prefieres usar la línea de comandos:

```bash
# Instalar cliente MySQL (si no lo tienes)
# macOS
brew install mysql-client

# Ubuntu/Debian
sudo apt-get install mysql-client

# Windows
# Descarga desde https://dev.mysql.com/downloads/mysql/

# Conectar y ejecutar
mysql -h xxx.railway.app -P xxxxx -u root -p railway < DATABASE_SCHEMA.sql

# Cuando pida contraseña, pega la que copiaste
```

### Paso 5: Verificar

En el SQL Editor de Railway, ejecuta:

```sql
SHOW TABLES;
```

Deberías ver:
```
analytics_summary
api_logs
error_logs
frequent_routes
queries
query_responses
telegram_users
users
```

---

## 🐱 Opción 2: Clever Cloud

### Paso 1: Acceder a la Base de Datos

1. Ve a [console.clever-cloud.com](https://console.clever-cloud.com)
2. Abre tu aplicación
3. Ve a **Services** → **MySQL**
4. Haz clic en el servicio MySQL

### Paso 2: Obtener Credenciales

En la pestaña **Connection**, copia:
```
Host: xxxx.mysql.clever-cloud.com
Port: 3306
Database: xxxxx
Username: xxxxxx
Password: xxxxxxxx
```

### Paso 3: Ejecutar SQL (Opción A - Phpmyadmin)

1. En Clever Cloud, ve a **Administration**
2. Haz clic en **PhpMyAdmin**
3. Inicia sesión con las credenciales
4. Ve a la pestaña **SQL**
5. Copia TODO el contenido de `DATABASE_SCHEMA.sql`
6. Pega en el editor SQL
7. Haz clic en **Execute** (botón azul)
8. ¡Listo!

### Paso 4: Ejecutar SQL (Opción B - CLI)

```bash
# Conectar y ejecutar
mysql -h xxxx.mysql.clever-cloud.com -P 3306 -u xxxxxx -p < DATABASE_SCHEMA.sql

# Cuando pida contraseña, pega la que copiaste
```

### Paso 5: Verificar

En PhpMyAdmin o CLI, ejecuta:

```sql
SHOW TABLES;
```

---

## 🔧 Paso 6: Actualizar DATABASE_URL en Railway

Una vez creada la base de datos, actualiza la variable de entorno:

### En Railway:

1. Ve a tu proyecto **vias-bot-whatsapp**
2. Haz clic en **Variables**
3. Busca `DATABASE_URL`
4. Actualiza con el formato:

```
mysql://root:contraseña@host:puerto/railway
```

Ejemplo:
```
mysql://root:abc123@xxx.railway.app:5432/railway
```

---

## 📊 Estructura de Tablas

### `users` - Usuarios autenticados
```
id (PK)
openId (UNIQUE)
name
email
loginMethod
role (user/admin)
createdAt
updatedAt
lastSignedIn
```

### `telegram_users` - Usuarios del bot
```
id (PK)
telegram_id (UNIQUE)
username
first_name
last_name
last_message_at
message_count
is_blocked
created_at
updated_at
```

### `queries` - Historial de consultas
```
id (PK)
telegram_user_id (FK)
query_text
query_type (traffic/weather/route/incident/help)
location
latitude
longitude
response_time
success
error_message
created_at
```

### `query_responses` - Respuestas enviadas
```
id (PK)
query_id (FK)
telegram_user_id (FK)
response_text
traffic_data (JSON)
weather_data (JSON)
incident_data (JSON)
message_id
delivery_status
created_at
updated_at
```

### `frequent_routes` - Rutas guardadas
```
id (PK)
name
description
start_location
end_location
start_lat
start_lng
end_lat
end_lng
is_active
created_at
updated_at
```

### `api_logs` - Logs de APIs
```
id (PK)
api_name (tomtom/openweather)
endpoint
status_code
response_time
success
error_message
request_data (JSON)
response_data (JSON)
created_at
```

### `error_logs` - Logs de errores
```
id (PK)
error_type
error_message
stack_trace
context (JSON)
severity (info/warning/error/critical)
resolved
created_at
```

### `analytics_summary` - Estadísticas diarias
```
id (PK)
date (YYYY-MM-DD)
total_queries
total_users
avg_response_time
success_rate
top_query_type
top_location
created_at
```

---

## 🎯 Vistas Disponibles

### `v_user_stats` - Estadísticas por usuario

```sql
SELECT * FROM v_user_stats;
```

Devuelve:
- ID del usuario
- Nombre de usuario
- Total de consultas
- Tiempo promedio de respuesta
- Consultas exitosas
- Fecha de creación

### `v_recent_queries` - Consultas recientes

```sql
SELECT * FROM v_recent_queries;
```

Devuelve:
- Información del usuario
- Texto de la consulta
- Tipo de consulta
- Ubicación
- Respuesta enviada
- Estado de entrega

---

## ⚙️ Procedimientos Almacenados

### `sp_upsert_telegram_user` - Insertar/actualizar usuario

```sql
CALL sp_upsert_telegram_user(
  '123456789',      -- telegram_id
  'username',       -- username
  'John',           -- first_name
  'Doe'             -- last_name
);
```

### `sp_log_query` - Registrar consulta

```sql
CALL sp_log_query(
  1,                                    -- telegram_user_id
  '¿Cómo está el tráfico?',            -- query_text
  'traffic',                            -- query_type
  'Calle 5',                            -- location
  '4.7110',                             -- latitude
  '-74.0721',                           -- longitude
  2500,                                 -- response_time (ms)
  1,                                    -- success (1=true, 0=false)
  NULL                                  -- error_message
);
```

---

## 🔍 Consultas Útiles

### Ver todos los usuarios

```sql
SELECT * FROM telegram_users ORDER BY created_at DESC;
```

### Ver consultas de hoy

```sql
SELECT * FROM queries 
WHERE DATE(created_at) = CURDATE()
ORDER BY created_at DESC;
```

### Ver tasa de éxito

```sql
SELECT 
  COUNT(*) as total_queries,
  SUM(success) as successful_queries,
  ROUND(SUM(success) / COUNT(*) * 100, 2) as success_rate
FROM queries;
```

### Ver API más usada

```sql
SELECT api_name, COUNT(*) as total_calls, AVG(response_time) as avg_response_time
FROM api_logs
GROUP BY api_name
ORDER BY total_calls DESC;
```

### Ver errores no resueltos

```sql
SELECT * FROM error_logs
WHERE resolved = 0
ORDER BY created_at DESC;
```

---

## 🆘 Troubleshooting

### Error: "Access denied for user"

**Problema:** Las credenciales son incorrectas

**Solución:**
1. Verifica que copiaste correctamente el usuario y contraseña
2. Asegúrate de que no hay espacios en blanco
3. Intenta nuevamente

### Error: "Unknown database"

**Problema:** La base de datos no existe

**Solución:**
1. En Railway: La base de datos se crea automáticamente
2. En Clever Cloud: Verifica que el nombre sea correcto

### Error: "Table already exists"

**Problema:** Las tablas ya fueron creadas

**Solución:**
1. Esto es normal si ejecutas el script dos veces
2. Usa `DROP TABLE IF EXISTS` para limpiar primero:

```sql
DROP TABLE IF EXISTS query_responses;
DROP TABLE IF EXISTS queries;
DROP TABLE IF EXISTS api_logs;
DROP TABLE IF EXISTS error_logs;
DROP TABLE IF EXISTS analytics_summary;
DROP TABLE IF EXISTS frequent_routes;
DROP TABLE IF EXISTS telegram_users;
DROP TABLE IF EXISTS users;
```

Luego ejecuta el script nuevamente.

---

## 📞 Soporte

- **Railway**: [docs.railway.app](https://docs.railway.app)
- **Clever Cloud**: [doc.clever-cloud.com](https://doc.clever-cloud.com)
- **MySQL**: [dev.mysql.com/doc](https://dev.mysql.com/doc)

---

**Última actualización:** Abril 2026
**Versión:** 1.0.0
