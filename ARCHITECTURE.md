# VíasBot WhatsApp - Arquitectura del Sistema

## Visión General

**VíasBot** es un bot de WhatsApp elegante y profesional que proporciona información en tiempo real sobre el estado de las vías, incluyendo condiciones de tráfico, clima, accidentes e incidentes. El sistema integra múltiples APIs externas (WhatsApp Cloud API, TomTom Traffic API, OpenWeatherMap) con una base de datos robusta y un dashboard administrativo intuitivo.

## Componentes Principales

### 1. Capa de Comunicación - WhatsApp Cloud API

El bot se comunica exclusivamente a través de la **WhatsApp Cloud API** de Meta, que proporciona dos canales principales:

**Webhook Entrante** (`POST /api/webhooks/whatsapp`): Recibe mensajes de usuarios en formato JSON. Cada webhook contiene metadatos del usuario, contenido del mensaje y timestamp. El sistema verifica la autenticidad del webhook mediante validación de firma (`X-Hub-Signature`) antes de procesarlo.

**API de Envío de Mensajes**: Utiliza tokens de acceso permanentes para enviar respuestas formateadas a través de la API REST de Meta. Las respuestas pueden ser texto simple, mensajes con plantilla o mensajes interactivos con botones.

### 2. Capa de Procesamiento - Backend Node.js

El backend implementa un flujo de procesamiento de tres etapas:

**Etapa 1: Extracción y Normalización**. El procesador de mensajes recibe el webhook, extrae la ubicación o ruta solicitada del usuario, y normaliza la entrada. Utiliza técnicas de procesamiento de lenguaje natural para interpretar consultas en lenguaje natural (ej: "¿Cómo está el tráfico en la Calle 5?").

**Etapa 2: Enriquecimiento de Datos**. El sistema consulta simultáneamente las APIs externas:
- **TomTom Traffic API**: Obtiene flujo de tráfico en tiempo real, incidentes, congestión
- **OpenWeatherMap API**: Obtiene condiciones climáticas actuales y alertas de ruta
- **Google Sheets API**: Lee configuración de rutas frecuentes y respuestas automáticas

**Etapa 3: Formación de Respuesta**. Los datos se formatean en una respuesta elegante y profesional, estructurada con emojis relevantes, información clara y jerarquizada, y llamadas a la acción cuando sea apropiado.

### 3. Capa de Datos - Base de Datos MySQL

La base de datos almacena:

| Tabla | Propósito |
|-------|-----------|
| `users` | Usuarios del sistema, roles, información de contacto |
| `whatsapp_contacts` | Contactos de WhatsApp que han interactuado con el bot |
| `frequent_routes` | Rutas frecuentes configuradas por administradores |
| `queries` | Historial de consultas de usuarios (para analytics) |
| `query_responses` | Respuestas enviadas (para auditoría y análisis) |
| `api_logs` | Logs de llamadas a APIs externas (para debugging) |
| `error_logs` | Errores del sistema para monitoreo |
| `analytics_summary` | Datos agregados de uso (actualizado diariamente) |

### 4. Integración con Google Sheets

Google Sheets actúa como sistema de configuración y logging complementario:

**Configuración**: Una hoja contiene rutas frecuentes, respuestas automáticas personalizadas, horarios de disponibilidad del bot, y configuración de alertas.

**Logging**: Las consultas importantes se registran automáticamente en una hoja de "Logs" con timestamp, usuario, consulta, respuesta y tiempo de procesamiento. Esto permite auditoría y análisis sin depender únicamente de la base de datos.

### 5. Frontend - Dashboard de Administración

El dashboard proporciona una interfaz elegante y profesional para:

- **Monitoreo en Tiempo Real**: Visualización de consultas entrantes, respuestas enviadas, y estado del bot
- **Analytics**: Gráficos de consultas populares, horarios de pico, rutas más consultadas, tiempo promedio de respuesta
- **Configuración**: Gestión de rutas frecuentes, respuestas automáticas, integraciones con APIs
- **Logs**: Visor de logs con filtros, búsqueda y exportación
- **Gestión de Usuarios**: Control de acceso y roles

## Flujo de Procesamiento de Consulta

```
Usuario envía mensaje a WhatsApp
    ↓
Meta envía webhook a /api/webhooks/whatsapp
    ↓
Backend verifica firma del webhook
    ↓
Extrae ubicación/ruta del mensaje (NLP)
    ↓
Consulta APIs en paralelo:
  ├─ TomTom Traffic API
  ├─ OpenWeatherMap API
  └─ Google Sheets (configuración)
    ↓
Formatea respuesta elegante
    ↓
Envía respuesta a través de WhatsApp API
    ↓
Registra consulta en DB y Google Sheets
    ↓
Actualiza analytics
```

## Seguridad

**Autenticación de Webhooks**: Cada webhook incluye un header `X-Hub-Signature` que el backend verifica usando HMAC-SHA256 con el app secret de Meta. Esto garantiza que solo Meta puede enviar webhooks válidos.

**Tokens de API**: Los tokens para WhatsApp, TomTom y OpenWeatherMap se almacenan en variables de entorno y nunca se exponen en el código o logs.

**Rate Limiting**: El sistema implementa rate limiting por usuario para evitar abuso. Las APIs externas también tienen límites de cuota que se monitorean.

**Validación de Entrada**: Todas las ubicaciones y rutas se validan antes de consultar APIs externas para evitar inyección de datos maliciosos.

## Escalabilidad

**Procesamiento Asincrónico**: Las consultas se procesan de forma asincrónica, permitiendo que el webhook responda rápidamente a Meta mientras se procesan los datos en background.

**Caché de Datos**: Los datos de tráfico y clima se cachean por ubicación durante 5 minutos para reducir llamadas a APIs externas.

**Colas de Mensajes**: Para volúmenes altos, se puede implementar una cola de mensajes (Redis, RabbitMQ) entre el webhook y el procesador.

## Monitoreo y Alertas

El sistema registra:
- Latencia de respuesta a usuarios
- Tasa de éxito/error de APIs externas
- Errores de procesamiento
- Cuota de APIs consumida
- Disponibilidad del bot

Los administradores reciben alertas cuando:
- La tasa de error supera un umbral
- Se agota la cuota de una API
- El tiempo de respuesta excede 5 segundos
- El webhook no responde correctamente

## Tecnología Stack

| Componente | Tecnología |
|-----------|-----------|
| Backend | Node.js + Express + tRPC |
| Frontend | React 19 + Tailwind CSS 4 |
| Base de Datos | MySQL / TiDB |
| APIs Externas | WhatsApp Cloud API, TomTom, OpenWeatherMap, Google Sheets |
| Autenticación | Manus OAuth |
| Hosting | Manus Platform |

## Próximas Fases

1. Implementación del backend con webhooks y procesamiento
2. Integración con APIs externas
3. Desarrollo del dashboard frontend
4. Sistema de analytics y logs
5. Testing y optimización
6. Documentación completa
