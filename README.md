# 🚗 VíasBot

Bot de Telegram para consultar el estado del tráfico, clima y rutas en tiempo real. Integra las APIs de **TomTom** (tráfico y routing) y **OpenWeatherMap** (clima), con un dashboard web para monitoreo y analíticas.

---

## ✨ Características

- 🗺️ **Tráfico por zona** — Velocidad actual, nivel de congestión e incidentes cercanos
- 🛣️ **Ruta A → B** — Tiempo real de viaje entre dos lugares (con y sin tráfico) usando la Routing API de TomTom
- 🌤️ **Clima** — Temperatura, condición, viento, visibilidad y lluvia
- ⚠️ **Incidentes** — Accidentes, obras y cierres en el área consultada
- 📊 **Dashboard web** — Estadísticas de consultas, logs de APIs y errores en tiempo real
- 🤖 **Lenguaje natural** — El bot entiende preguntas en español de forma conversacional

---

## 🗣️ Cómo usar el bot

Escribe en Telegram de forma natural:

| Tipo | Ejemplo |
|------|---------|
| Tráfico en una zona | `tráfico en la Calle 5` |
| Tráfico en una zona | `vías en el centro` |
| **Ruta A → B** | `de la Calle 5 a la Carrera 7` |
| **Ruta A → B** | `desde el centro hasta el aeropuerto` |
| Clima | `clima en el norte` |
| Incidente | `accidente en la autopista` |
| Ayuda | `ayuda` / `/start` / `/ayuda` |

> **Tip:** Para saber cuánto tardas en llegar, escribe `"de [origen] a [destino]"` y el bot calculará el tiempo real con el tráfico actual.

---

## 🏗️ Arquitectura

```
vias-bot-whatsapp/
├── server/
│   ├── _core/               # Núcleo del servidor Express + tRPC
│   │   ├── index.ts         # Entry point (Express + middlewares)
│   │   ├── env.ts           # Variables de entorno tipadas
│   │   └── trpc.ts          # Configuración de tRPC
│   ├── services/
│   │   ├── messageProcessor.ts      # Procesamiento de texto y extracción de intención
│   │   ├── telegramService.ts       # Cliente de la Telegram Bot API
│   │   ├── trafficWeatherService.ts # TomTom Traffic + Routing + OpenWeatherMap
│   │   └── geocodingService.ts      # Geocodificación con TomTom Search API
│   ├── webhooks/
│   │   └── telegramWebhook.ts       # Receptor y orquestador de mensajes de Telegram
│   ├── routers.ts           # Rutas tRPC del dashboard (queries, logs, rutas)
│   └── db.ts                # Acceso a la base de datos (MySQL + Drizzle ORM)
├── client/                  # Dashboard React (tRPC + Recharts)
├── drizzle/                 # Migraciones de base de datos
├── docker-compose.yml
└── Dockerfile
```

### Flujo de un mensaje

```
Usuario → Telegram → Webhook POST /webhook/telegram
                          │
                    messageProcessor.ts
                    (detecta intención y extrae ubicaciones)
                          │
              ┌───────────┴───────────┐
         Ruta A→B               Zona / punto
              │                      │
    geocodeAddress(origen)     geocodeAddress(zona)
    geocodeAddress(destino)          │
              │                 getTrafficFlow()
    getRouteTime() ─────────── getWeatherData()
    getTrafficFlow()           getTrafficIncidents()
    getWeatherData()
    getTrafficIncidents()
              │
        formatTrafficResponse()
              │
        sendMessage() → Telegram → Usuario
```

---

## 🔧 Instalación y configuración

### 1. Requisitos

- Node.js 22+
- pnpm
- MySQL 8+ (o acceso a una instancia remota)

### 2. Clonar e instalar dependencias

```bash
git clone https://github.com/tu-usuario/vias-bot-whatsapp.git
cd vias-bot-whatsapp
pnpm install
```

### 3. Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Base de datos MySQL
DATABASE_URL=mysql://usuario:contraseña@localhost:3306/vias_bot

# Telegram Bot Token (obtenido desde @BotFather)
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ

# TomTom API Key (tráfico, routing y geocodificación)
# Regístrate en: https://developer.tomtom.com
TOMTOM_API_KEY=tu_clave_tomtom

# OpenWeatherMap API Key (clima)
# Regístrate en: https://openweathermap.org/api
OPENWEATHER_API_KEY=tu_clave_openweather

# (Opcional) Google Sheets para logs adicionales
GOOGLE_SHEETS_API_KEY=
GOOGLE_SHEETS_SHEET_ID=
```

### 4. Crear la base de datos

```bash
pnpm db:push
```

### 5. Registrar el webhook de Telegram

El bot recibe mensajes a través de un webhook. Necesitas una URL pública (puedes usar [ngrok](https://ngrok.com) en desarrollo):

```bash
# Con ngrok:
ngrok http 3000

# Luego registra el webhook:
curl -X POST "https://api.telegram.org/bot<TU_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://tu-dominio.com/webhook/telegram"}'
```

---

## 🚀 Ejecución

### Desarrollo

```bash
pnpm dev
```

El servidor corre en `http://localhost:3000` con hot-reload.

### Producción

```bash
pnpm build
pnpm start
```

### Docker

```bash
# Construir imagen
docker build -t vias-bot .

# Ejecutar con variables de entorno
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://..." \
  -e TELEGRAM_BOT_TOKEN="..." \
  -e TOMTOM_API_KEY="..." \
  -e OPENWEATHER_API_KEY="..." \
  vias-bot
```

O usando Docker Compose (incluye MySQL):

```bash
docker-compose up -d
```

---

## 🌐 APIs externas utilizadas

| API | Uso | Documentación |
|-----|-----|---------------|
| **Telegram Bot API** | Recibir y enviar mensajes | [core.telegram.org](https://core.telegram.org/bots/api) |
| **TomTom Flow Segment** | Velocidad y congestión en un punto | [developer.tomtom.com](https://developer.tomtom.com/traffic-api/documentation/traffic-flow/flow-segment-data) |
| **TomTom Calculate Route** | Tiempo de viaje real A→B con tráfico | [developer.tomtom.com](https://developer.tomtom.com/routing-api/documentation/routing/calculate-route) |
| **TomTom Traffic Incidents** | Accidentes y cierres en un área | [developer.tomtom.com](https://developer.tomtom.com/traffic-api/documentation/incident-details/incident-details) |
| **TomTom Geocoding** | Convertir dirección → coordenadas | [developer.tomtom.com](https://developer.tomtom.com/geocoding-api/documentation/geocode) |
| **OpenWeatherMap** | Temperatura, clima y lluvia | [openweathermap.org](https://openweathermap.org/api/one-call-3) |

---

## 🛠️ Scripts disponibles

```bash
pnpm dev          # Servidor de desarrollo con hot-reload
pnpm build        # Compila el cliente (Vite) y el servidor (esbuild)
pnpm start        # Inicia el servidor en producción
pnpm check        # Verificación de tipos TypeScript
pnpm test         # Ejecuta las pruebas (Vitest)
pnpm format       # Formatea el código (Prettier)
pnpm db:push      # Genera y aplica migraciones de base de datos
```

---

## 📋 Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js 22 + TypeScript |
| Servidor | Express.js |
| API interna | tRPC v11 |
| Frontend | React 19 + TailwindCSS |
| ORM | Drizzle ORM |
| Base de datos | MySQL 8 |
| Build | Vite (cliente) + esbuild (servidor) |
| Gestor de paquetes | pnpm |

---

## 📝 Licencia

MIT — libre de usar, modificar y distribuir.
