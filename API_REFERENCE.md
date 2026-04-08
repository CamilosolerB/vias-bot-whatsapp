# 📡 Referencia de API: VíasBot

Documentación técnica de los endpoints disponibles en VíasBot.

---

## 🔗 Base URL

```
https://tu-proyecto.manus.space/api
```

---

## 📊 Endpoints de Dashboard

### Obtener Estadísticas

**GET** `/trpc/dashboard.getStats`

Obtiene estadísticas generales del bot.

**Parámetros:**
```json
{
  "days": 1  // Opcional: número de días (default: 1)
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "totalQueries": 150,
    "successfulQueries": 145,
    "avgResponseTime": 2500,
    "successRate": 96
  }
}
```

---

### Obtener Consultas Recientes

**GET** `/trpc/dashboard.getRecentQueries`

Obtiene las consultas más recientes procesadas por el bot.

**Parámetros:**
```json
{
  "limit": 50  // Opcional: número máximo de registros (default: 50)
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "queryText": "¿Cómo está el tráfico en la Calle 5?",
      "queryType": "traffic",
      "location": "Calle 5",
      "latitude": "4.7110",
      "longitude": "-74.0721",
      "responseTime": 2500,
      "success": 1,
      "createdAt": "2026-04-08T20:30:00.000Z"
    }
  ]
}
```

---

### Obtener Logs de API

**GET** `/trpc/dashboard.getApiLogs`

Obtiene los logs de llamadas a APIs externas.

**Parámetros:**
```json
{
  "apiName": "tomtom",  // Opcional: filtrar por API
  "limit": 100          // Opcional: número máximo de registros
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "apiName": "tomtom",
      "endpoint": "flowSegmentData",
      "statusCode": 200,
      "responseTime": 450,
      "success": 1,
      "requestData": "{...}",
      "responseData": "{...}",
      "errorMessage": null,
      "createdAt": "2026-04-08T20:30:00.000Z"
    }
  ]
}
```

---

### Obtener Errores

**GET** `/trpc/dashboard.getErrors`

Obtiene los errores más recientes.

**Parámetros:**
```json
{
  "limit": 50  // Opcional: número máximo de registros
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "errorType": "telegram_message_error",
      "errorMessage": "Failed to process message",
      "stackTrace": "...",
      "context": "{...}",
      "severity": "error",
      "resolved": 0,
      "createdAt": "2026-04-08T20:30:00.000Z"
    }
  ]
}
```

---

### Obtener Errores No Resueltos

**GET** `/trpc/dashboard.getUnresolvedErrors`

Obtiene solo los errores que aún no han sido resueltos.

**Parámetros:**
```json
{
  "limit": 20  // Opcional: número máximo de registros
}
```

**Respuesta:** Similar a `getErrors`

---

### Obtener Analytics

**GET** `/trpc/dashboard.getAnalytics`

Obtiene datos de analytics de los últimos días.

**Parámetros:**
```json
{
  "days": 30  // Opcional: número de días (default: 30)
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "date": "2026-04-08",
      "totalQueries": 150,
      "trafficQueries": 80,
      "weatherQueries": 40,
      "incidentQueries": 20,
      "avgResponseTime": 2500,
      "successRate": 96,
      "createdAt": "2026-04-08T23:59:59.000Z"
    }
  ]
}
```

---

## 🛣️ Endpoints de Rutas

### Obtener Rutas Activas

**GET** `/trpc/routes.getActive`

Obtiene todas las rutas frecuentes activas.

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Ruta al trabajo",
      "startLocation": "Casa",
      "endLocation": "Oficina",
      "startLat": "4.7110",
      "startLng": "-74.0721",
      "endLat": "4.7200",
      "endLng": "-74.0800",
      "isActive": 1,
      "createdAt": "2026-04-01T10:00:00.000Z"
    }
  ]
}
```

---

### Obtener Ruta por ID

**GET** `/trpc/routes.getById`

Obtiene una ruta específica por su ID.

**Parámetros:**
```json
{
  "id": 1  // ID de la ruta
}
```

**Respuesta:** Similar a `getActive` (un solo objeto)

---

## 🤖 Endpoints del Bot

### Obtener Estado del Bot

**GET** `/trpc/bot.getStatus`

Obtiene el estado actual del bot.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "status": "online",
    "version": "1.0.0",
    "uptime": 3600,
    "timestamp": "2026-04-08T20:30:00.000Z"
  }
}
```

---

### Obtener Configuración del Bot

**GET** `/trpc/bot.getConfig`

Obtiene la configuración y características del bot.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "name": "VíasBot WhatsApp",
    "description": "Bot para consultar estado de vías en tiempo real",
    "features": [
      "Información de tráfico",
      "Datos de clima",
      "Reportes de incidentes",
      "Rutas frecuentes",
      "Analytics en tiempo real"
    ],
    "supportedLanguages": ["es", "en"],
    "apiProviders": [
      "Telegram Bot API",
      "TomTom Traffic API",
      "OpenWeatherMap API",
      "Google Sheets API"
    ]
  }
}
```

---

## 🔐 Autenticación

### Endpoints Públicos
Los siguientes endpoints son públicos y no requieren autenticación:
- `bot.getStatus`
- `routes.getActive`
- `routes.getById`

### Endpoints Protegidos
Los siguientes endpoints requieren autenticación:
- `dashboard.*` (requiere ser administrador)
- `bot.getConfig` (requiere ser administrador)

**Autenticación:**
```
Header: Authorization: Bearer <JWT_TOKEN>
```

---

## 🔄 Webhook de Telegram

### Recibir Mensajes

**POST** `/api/webhooks/telegram`

Telegram envía actualizaciones a este endpoint.

**Payload (ejemplo):**
```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 1,
    "date": 1712607000,
    "chat": {
      "id": 456789,
      "type": "private",
      "username": "usuario"
    },
    "from": {
      "id": 789123,
      "is_bot": false,
      "first_name": "Juan",
      "last_name": "Pérez",
      "username": "juanperez"
    },
    "text": "¿Cómo está el tráfico en la Calle 5?"
  }
}
```

**Respuesta:**
```json
{
  "ok": true
}
```

---

## 📊 Tipos de Datos

### Query Type
```typescript
type QueryType = 'traffic' | 'weather' | 'route' | 'incident' | 'help' | 'unknown'
```

### Congestion Level
```typescript
type CongestionLevel = 'free' | 'moderate' | 'heavy' | 'blocked'
```

### Incident Severity
```typescript
type IncidentSeverity = 'minor' | 'moderate' | 'major' | 'critical'
```

### Delivery Status
```typescript
type DeliveryStatus = 'sent' | 'delivered' | 'read' | 'failed'
```

---

## ⚠️ Códigos de Error

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 400 | Bad Request - Parámetros inválidos |
| 401 | Unauthorized - Autenticación requerida |
| 403 | Forbidden - Acceso denegado |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |
| 503 | Service Unavailable - Servicio no disponible |

---

## 🔗 Ejemplos de Uso

### JavaScript/Node.js

```javascript
// Obtener estadísticas
const response = await fetch('https://tu-proyecto.manus.space/api/trpc/dashboard.getStats', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer tu_token_jwt'
  }
});

const data = await response.json();
console.log(data);
```

### Python

```python
import requests

# Obtener rutas activas
response = requests.get(
    'https://tu-proyecto.manus.space/api/trpc/routes.getActive'
)

data = response.json()
print(data)
```

### cURL

```bash
# Obtener estado del bot
curl -X GET https://tu-proyecto.manus.space/api/trpc/bot.getStatus

# Obtener estadísticas (requiere autenticación)
curl -X GET https://tu-proyecto.manus.space/api/trpc/dashboard.getStats \
  -H "Authorization: Bearer tu_token_jwt"
```

---

## 📝 Rate Limiting

- **Límite de solicitudes**: 100 por minuto por IP
- **Límite de webhooks**: Sin límite (procesados en background)
- **Timeout**: 30 segundos por solicitud

---

## 🔄 Versionado de API

La API usa versionado semántico:
- **v1.0.0** - Versión actual
- Los cambios incompatibles incrementan la versión mayor
- Los cambios compatibles incrementan la versión menor

---

## 📞 Soporte

Para problemas con la API:
1. Revisa los **logs** en el dashboard
2. Verifica que los **parámetros** sean correctos
3. Asegúrate de tener **autenticación** válida
4. Contacta al **soporte**

---

**Última actualización:** Abril 2026
**Versión de API:** 1.0.0
