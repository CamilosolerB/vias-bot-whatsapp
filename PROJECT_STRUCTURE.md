# 📁 Estructura del Proyecto VíasBot

Guía completa de la estructura del proyecto y dónde encontrar cada cosa.

---

## 🎯 Resumen Ejecutivo

```
vias-bot-whatsapp/
├── 📱 Frontend (React + Vite)
├── 🖥️ Backend (Express + tRPC)
├── 🗄️ Base de Datos (MySQL)
├── 📚 Documentación
└── 🚀 Configuración de Despliegue
```

---

## 📂 Estructura Detallada

### 📱 Frontend - `/client`

```
client/
├── public/                          # Archivos estáticos
│   ├── favicon.ico
│   ├── robots.txt
│   └── manifest.json
│
├── src/
│   ├── pages/                       # Páginas principales
│   │   ├── Home.tsx                 # Página de inicio
│   │   ├── Dashboard.tsx            # Dashboard del bot
│   │   ├── Analytics.tsx            # Gráficos de analytics
│   │   ├── Settings.tsx             # Configuración
│   │   └── NotFound.tsx             # Página 404
│   │
│   ├── components/                  # Componentes reutilizables
│   │   ├── DashboardLayout.tsx      # Layout del dashboard
│   │   ├── Map.tsx                  # Mapa interactivo
│   │   ├── QueryCard.tsx            # Tarjeta de consulta
│   │   ├── StatCard.tsx             # Tarjeta de estadística
│   │   └── ErrorBoundary.tsx        # Manejo de errores
│   │
│   ├── contexts/                    # React Contexts
│   │   └── ThemeContext.tsx         # Contexto de tema
│   │
│   ├── hooks/                       # Custom Hooks
│   │   ├── useAuth.ts               # Hook de autenticación
│   │   └── useQuery.ts              # Hook para queries
│   │
│   ├── lib/
│   │   └── trpc.ts                  # Cliente tRPC
│   │
│   ├── App.tsx                      # Componente raíz
│   ├── main.tsx                     # Punto de entrada
│   └── index.css                    # Estilos globales
│
├── index.html                       # HTML principal
├── vite.config.ts                   # Configuración Vite
└── tsconfig.json                    # Configuración TypeScript
```

**¿Qué modificar?**
- Agregar nuevas páginas en `pages/`
- Crear componentes en `components/`
- Agregar estilos en `index.css`
- Cambiar rutas en `App.tsx`

---

### 🖥️ Backend - `/server`

```
server/
├── _core/                           # Infraestructura del servidor
│   ├── index.ts                     # Servidor Express principal
│   ├── context.ts                   # Contexto de tRPC
│   ├── trpc.ts                      # Configuración tRPC
│   ├── env.ts                       # Variables de entorno
│   ├── oauth.ts                     # Autenticación OAuth
│   ├── cookies.ts                   # Manejo de cookies
│   ├── llm.ts                       # Integración con LLM
│   ├── voiceTranscription.ts        # Transcripción de audio
│   ├── imageGeneration.ts           # Generación de imágenes
│   ├── map.ts                       # Integración de mapas
│   ├── notification.ts              # Notificaciones
│   └── vite.ts                      # Integración Vite
│
├── services/                        # Lógica de negocio
│   ├── telegramService.ts           # Integración Telegram Bot API
│   │   ├── sendMessage()            # Enviar mensajes
│   │   ├── sendChatAction()         # Acciones (typing, etc)
│   │   ├── getMe()                  # Información del bot
│   │   ├── extractMessageText()     # Extraer texto
│   │   └── extractUserInfo()        # Extraer info del usuario
│   │
│   ├── trafficWeatherService.ts     # Datos de tráfico y clima
│   │   ├── getTrafficData()         # Consultar TomTom
│   │   ├── getWeatherData()         # Consultar OpenWeatherMap
│   │   ├── formatTrafficResponse()  # Formatear respuesta
│   │   └── formatWeatherResponse()  # Formatear respuesta
│   │
│   ├── messageProcessor.ts          # Procesamiento de mensajes
│   │   ├── extractQueryType()       # Detectar tipo de consulta
│   │   ├── extractLocation()        # Extraer ubicación
│   │   ├── processMessage()         # Procesar mensaje completo
│   │   └── generateResponse()       # Generar respuesta
│   │
│   ├── geocodingService.ts          # Geocodificación
│   │   ├── addressToCoordinates()   # Dirección → Coordenadas
│   │   └── coordinatesToAddress()   # Coordenadas → Dirección
│   │
│   └── *.test.ts                    # Tests unitarios
│
├── webhooks/
│   └── telegramWebhook.ts           # Endpoint POST /api/webhooks/telegram
│       ├── Recibe actualizaciones de Telegram
│       ├── Valida mensajes
│       └── Procesa y responde
│
├── db.ts                            # Helpers de base de datos
│   ├── upsertTelegramUser()         # Guardar/actualizar usuario
│   ├── saveQuery()                  # Guardar consulta
│   ├── saveQueryResponse()          # Guardar respuesta
│   ├── getFrequentRoutes()          # Obtener rutas frecuentes
│   └── getAnalytics()               # Obtener analytics
│
├── routers.ts                       # Procedimientos tRPC
│   ├── auth.me                      # Obtener usuario actual
│   ├── auth.logout                  # Cerrar sesión
│   ├── dashboard.getStats           # Estadísticas
│   ├── dashboard.getRecentQueries   # Consultas recientes
│   ├── routes.getActive             # Rutas activas
│   └── bot.getStatus                # Estado del bot
│
└── auth.logout.test.ts              # Test de logout
```

**¿Qué modificar?**
- Agregar nuevos servicios en `services/`
- Crear nuevos procedimientos en `routers.ts`
- Agregar lógica de negocio en `services/`
- Agregar tests en `*.test.ts`

---

### 🗄️ Base de Datos - `/drizzle`

```
drizzle/
├── schema.ts                        # Definición de tablas
│   ├── users                        # Usuarios autenticados
│   ├── telegramUsers                # Usuarios de Telegram
│   ├── frequentRoutes               # Rutas frecuentes
│   ├── queries                      # Historial de consultas
│   ├── queryResponses               # Respuestas enviadas
│   ├── apiLogs                      # Logs de APIs externas
│   ├── errorLogs                    # Logs de errores
│   └── analyticsSummary             # Estadísticas diarias
│
└── *.sql                            # Migraciones generadas
    ├── 0001_*.sql                   # Migración inicial
    └── 0002_*.sql                   # Migraciones posteriores
```

**¿Qué modificar?**
- Agregar nuevas tablas en `schema.ts`
- Ejecutar `pnpm drizzle-kit generate` para generar migraciones
- Ejecutar `pnpm db:push` para aplicar migraciones

---

### 📚 Documentación

```
/
├── README.md                        # Descripción del proyecto
├── QUICKSTART.md                    # Inicio rápido (5 pasos)
├── SETUP_GUIDE.md                   # Guía de configuración detallada
├── TUTORIAL.md                      # Tutorial de uso del bot
├── API_REFERENCE.md                 # Referencia de endpoints
├── ARCHITECTURE.md                  # Arquitectura técnica
├── DEPLOYMENT.md                    # Guía de despliegue completa
├── DEPLOY_QUICK.md                  # Despliegue rápido (10 min)
└── PROJECT_STRUCTURE.md             # Este archivo
```

---

### 🚀 Configuración de Despliegue

```
/
├── Dockerfile                       # Imagen Docker
├── docker-compose.yml               # Orquestación Docker
├── .env.example                     # Ejemplo de variables
├── .env                             # Variables (NO COMMITEAR)
├── .gitignore                       # Archivos ignorados
├── package.json                     # Dependencias
├── pnpm-lock.yaml                   # Lock de dependencias
├── tsconfig.json                    # Configuración TypeScript
├── vite.config.ts                   # Configuración Vite
├── vitest.config.ts                 # Configuración Vitest
└── drizzle.config.ts                # Configuración Drizzle
```

---

### 📦 Carpetas Especiales

```
/
├── dist/                            # Build de producción (generado)
│   ├── index.js                     # Servidor compilado
│   └── client/                      # Frontend compilado
│
├── node_modules/                    # Dependencias (NO COMMITEAR)
│
├── shared/                          # Código compartido
│   ├── const.ts                     # Constantes
│   └── types.ts                     # Tipos compartidos
│
└── storage/                         # Helpers S3
    └── index.ts                     # Funciones de almacenamiento
```

---

## 🔄 Flujo de Datos

### 1. Usuario envía mensaje en Telegram

```
Telegram User
    ↓
Telegram Bot API
    ↓
POST /api/webhooks/telegram
    ↓
telegramWebhook.ts
    ↓
messageProcessor.ts (procesa mensaje)
    ↓
trafficWeatherService.ts (obtiene datos)
    ↓
telegramService.ts (envía respuesta)
    ↓
Base de datos (guarda logs)
    ↓
Telegram User (recibe respuesta)
```

### 2. Admin consulta dashboard

```
Admin abre dashboard
    ↓
React frontend
    ↓
tRPC client
    ↓
POST /api/trpc/dashboard.getStats
    ↓
routers.ts (dashboard.getStats)
    ↓
db.ts (consulta base de datos)
    ↓
Respuesta JSON
    ↓
Dashboard muestra gráficos
```

---

## 📊 Relaciones de Base de Datos

```
users (Manus OAuth)
    ↓
telegramUsers (Usuarios del bot)
    ├→ queries (Consultas realizadas)
    │   └→ queryResponses (Respuestas enviadas)
    └→ frequentRoutes (Rutas guardadas)

apiLogs (Logs de APIs externas)
errorLogs (Logs de errores)
analyticsSummary (Estadísticas diarias)
```

---

## 🛠️ Tecnologías Usadas

| Capa | Tecnología | Propósito |
|------|-----------|----------|
| **Frontend** | React 19 | UI interactiva |
| **Styling** | Tailwind CSS 4 | Estilos |
| **Backend** | Express 4 | Servidor HTTP |
| **API** | tRPC 11 | Llamadas tipadas |
| **ORM** | Drizzle | Base de datos |
| **BD** | MySQL/TiDB | Persistencia |
| **Build** | Vite 7 | Empaquetado |
| **Testing** | Vitest 2 | Tests unitarios |
| **Auth** | Manus OAuth | Autenticación |
| **Bot** | Telegram Bot API | Mensajería |
| **Mapas** | TomTom API | Tráfico |
| **Clima** | OpenWeatherMap | Datos climáticos |

---

## 🔑 Archivos Importantes

| Archivo | Propósito |
|---------|----------|
| `server/_core/index.ts` | Servidor Express principal |
| `server/routers.ts` | Todos los procedimientos tRPC |
| `server/webhooks/telegramWebhook.ts` | Endpoint del webhook |
| `server/services/telegramService.ts` | Integración Telegram |
| `drizzle/schema.ts` | Esquema de base de datos |
| `client/App.tsx` | Rutas del frontend |
| `client/src/pages/Dashboard.tsx` | Dashboard principal |
| `package.json` | Dependencias y scripts |

---

## 📋 Scripts Útiles

```bash
# Desarrollo
pnpm dev                    # Iniciar servidor de desarrollo

# Build
pnpm build                  # Compilar para producción

# Testing
pnpm test                   # Ejecutar tests
pnpm test:watch            # Tests en modo watch

# Base de datos
pnpm drizzle-kit generate  # Generar migraciones
pnpm db:push               # Aplicar migraciones

# Formato
pnpm format                # Formatear código

# Type checking
pnpm check                 # Verificar tipos TypeScript
```

---

## 🚀 Cómo Agregar una Nueva Funcionalidad

### Ejemplo: Agregar comando `/estadísticas`

#### 1. Agregar tabla en `drizzle/schema.ts`

```typescript
export const userStats = mysqlTable("user_stats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  totalQueries: int("total_queries").default(0),
  // ...
});
```

#### 2. Generar migración

```bash
pnpm drizzle-kit generate
pnpm db:push
```

#### 3. Agregar helper en `server/db.ts`

```typescript
export async function getUserStats(userId: number) {
  const db = await getDb();
  return db.select().from(userStats).where(eq(userStats.userId, userId));
}
```

#### 4. Agregar servicio en `server/services/`

```typescript
export async function getFormattedStats(userId: number) {
  const stats = await getUserStats(userId);
  return formatStatsResponse(stats);
}
```

#### 5. Agregar procedimiento en `server/routers.ts`

```typescript
stats: protectedProcedure.query(async ({ ctx }) => {
  return getFormattedStats(ctx.user.id);
}),
```

#### 6. Usar en frontend `client/src/pages/`

```typescript
const { data: stats } = trpc.stats.useQuery();
```

#### 7. Agregar test en `server/services/*.test.ts`

```typescript
it("should get user stats", async () => {
  const stats = await getUserStats(1);
  expect(stats).toBeDefined();
});
```

---

## 📞 Dónde Encontrar Cosas

| Necesito... | Buscar en... |
|------------|-------------|
| Cambiar respuesta del bot | `server/services/messageProcessor.ts` |
| Agregar nueva página | `client/src/pages/` |
| Agregar nueva tabla | `drizzle/schema.ts` |
| Agregar nuevo endpoint | `server/routers.ts` |
| Cambiar estilos | `client/src/index.css` |
| Agregar nueva API | `server/services/` |
| Ver logs de errores | `server/services/errorLogs` |
| Configurar variables | `.env` o plataforma de hosting |

---

## ✅ Checklist para Nuevas Funcionalidades

- [ ] Agregar tabla en `schema.ts` (si necesita BD)
- [ ] Generar migración: `pnpm drizzle-kit generate`
- [ ] Aplicar migración: `pnpm db:push`
- [ ] Agregar helper en `db.ts`
- [ ] Agregar servicio en `services/`
- [ ] Agregar procedimiento en `routers.ts`
- [ ] Agregar test en `*.test.ts`
- [ ] Ejecutar tests: `pnpm test`
- [ ] Agregar página/componente en frontend
- [ ] Probar localmente: `pnpm dev`
- [ ] Hacer commit: `git add . && git commit -m "feat: nueva funcionalidad"`

---

**Última actualización:** Abril 2026
**Versión:** 1.0.0
