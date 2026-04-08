# 🚀 Guía de Despliegue: VíasBot Telegram

Guía completa para desplegar VíasBot en producción en diferentes plataformas.

---

## 📁 Estructura del Proyecto

```
vias-bot-whatsapp/
├── client/                          # Frontend React
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── robots.txt
│   │   └── manifest.json
│   ├── src/
│   │   ├── pages/                   # Páginas del dashboard
│   │   │   ├── Home.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Analytics.tsx
│   │   │   └── NotFound.tsx
│   │   ├── components/              # Componentes reutilizables
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── Map.tsx
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   └── trpc.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   └── vite.config.ts
│
├── server/                          # Backend Express + tRPC
│   ├── _core/
│   │   ├── index.ts                 # Servidor principal
│   │   ├── context.ts               # Contexto de tRPC
│   │   ├── trpc.ts                  # Configuración tRPC
│   │   ├── env.ts                   # Variables de entorno
│   │   ├── oauth.ts                 # Autenticación OAuth
│   │   ├── cookies.ts
│   │   ├── llm.ts                   # Integración LLM
│   │   ├── voiceTranscription.ts
│   │   ├── imageGeneration.ts
│   │   ├── map.ts
│   │   ├── notification.ts
│   │   └── vite.ts
│   ├── services/                    # Servicios de negocio
│   │   ├── telegramService.ts       # Integración Telegram
│   │   ├── trafficWeatherService.ts # APIs de tráfico/clima
│   │   ├── messageProcessor.ts      # Procesamiento NLP
│   │   ├── geocodingService.ts      # Geocodificación
│   │   └── *.test.ts                # Tests unitarios
│   ├── webhooks/
│   │   └── telegramWebhook.ts       # Endpoint webhook
│   ├── db.ts                        # Helpers de base de datos
│   ├── routers.ts                   # Procedimientos tRPC
│   └── auth.logout.test.ts
│
├── drizzle/                         # ORM y migraciones
│   ├── schema.ts                    # Definición de tablas
│   └── *.sql                        # Migraciones generadas
│
├── storage/                         # Helpers S3
│   └── index.ts
│
├── shared/                          # Código compartido
│   ├── const.ts
│   └── types.ts
│
├── dist/                            # Build de producción (generado)
│   ├── index.js                     # Servidor compilado
│   └── client/                      # Frontend compilado
│
├── .env.example                     # Ejemplo de variables
├── .env                             # Variables (NO COMMITEAR)
├── .gitignore
├── drizzle.config.ts
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
│
├── QUICKSTART.md                    # Guía rápida
├── SETUP_GUIDE.md                   # Guía de configuración
├── TUTORIAL.md                      # Tutorial de uso
├── API_REFERENCE.md                 # Referencia de API
├── ARCHITECTURE.md                  # Arquitectura técnica
└── DEPLOYMENT.md                    # Este archivo
```

---

## 🔧 Requisitos Previos

Antes de desplegar, asegúrate de tener:

### Credenciales Necesarias
- ✅ `TELEGRAM_BOT_TOKEN` - Token de BotFather
- ✅ `TOMTOM_API_KEY` - Clave de TomTom
- ✅ `OPENWEATHER_API_KEY` - Clave de OpenWeatherMap
- ✅ `DATABASE_URL` - Conexión a base de datos MySQL/TiDB
- ✅ `JWT_SECRET` - Secreto para sesiones
- ✅ `VITE_APP_ID` - ID de aplicación Manus
- ✅ `OAUTH_SERVER_URL` - URL del servidor OAuth

### Infraestructura
- Base de datos MySQL/TiDB
- Servidor Node.js (v18+)
- Dominio personalizado (opcional)
- SSL/HTTPS habilitado

---

## 📦 Opción 1: Desplegar en Manus (RECOMENDADO)

### Paso 1: Preparar el Proyecto

```bash
# Instalar dependencias
pnpm install

# Generar migraciones
pnpm drizzle-kit generate

# Ejecutar tests
pnpm test

# Build
pnpm build
```

### Paso 2: Configurar Variables de Entorno

En **Settings → Secrets**, agrega:

```
TELEGRAM_BOT_TOKEN=8758321769:AAFbcyq3V7DLec-fCgOAayPEnRMqgYYYYUo
TOMTOM_API_KEY=klwPRVA5cAEJdIMWUr9Higr9G7IoW7cX
OPENWEATHER_API_KEY=63372553ce4dcb158b7c525b2171056c
DATABASE_URL=mysql://usuario:contraseña@host:puerto/base_datos
JWT_SECRET=tu_secreto_seguro_aqui
```

### Paso 3: Registrar Webhook

En tu terminal local:

```bash
# Obtener tu URL de Manus
# Formato: https://tu-proyecto.manus.space

# Registrar webhook
curl -X POST https://api.telegram.org/bot<TU_TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://tu-proyecto.manus.space/api/webhooks/telegram"}'

# Verificar
curl https://api.telegram.org/bot<TU_TOKEN>/getWebhookInfo
```

### Paso 4: Publicar

1. Ve a **Dashboard**
2. Haz clic en **Publish** (botón en la esquina superior derecha)
3. ¡Listo! Tu bot está en producción

**Ventajas de Manus:**
- ✅ Base de datos incluida
- ✅ HTTPS automático
- ✅ Escalado automático
- ✅ Backups automáticos
- ✅ Monitoreo incluido

---

## 🐳 Opción 2: Desplegar con Docker

### Paso 1: Crear Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar archivos
COPY package.json pnpm-lock.yaml ./
COPY drizzle ./drizzle
COPY server ./server
COPY client ./client
COPY shared ./shared
COPY storage ./storage
COPY tsconfig.json vite.config.ts vitest.config.ts drizzle.config.ts ./

# Instalar dependencias
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm build

# Exponer puerto
EXPOSE 3000

# Variables de entorno
ENV NODE_ENV=production

# Ejecutar
CMD ["node", "dist/index.js"]
```

### Paso 2: Crear docker-compose.yml

```yaml
version: '3.8'

services:
  # Base de datos
  mysql:
    image: mysql:8.0
    container_name: vias-bot-mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - vias-bot-network

  # Aplicación
  app:
    build: .
    container_name: vias-bot-app
    environment:
      NODE_ENV: production
      DATABASE_URL: mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@mysql:3306/${MYSQL_DATABASE}
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
      TOMTOM_API_KEY: ${TOMTOM_API_KEY}
      OPENWEATHER_API_KEY: ${OPENWEATHER_API_KEY}
      JWT_SECRET: ${JWT_SECRET}
      VITE_APP_ID: ${VITE_APP_ID}
      OAUTH_SERVER_URL: ${OAUTH_SERVER_URL}
    ports:
      - "3000:3000"
    depends_on:
      - mysql
    networks:
      - vias-bot-network
    restart: unless-stopped

volumes:
  mysql_data:

networks:
  vias-bot-network:
    driver: bridge
```

### Paso 3: Crear .env.production

```bash
# Base de datos
MYSQL_ROOT_PASSWORD=tu_contraseña_root
MYSQL_DATABASE=vias_bot
MYSQL_USER=vias_bot_user
MYSQL_PASSWORD=tu_contraseña_usuario

# APIs
TELEGRAM_BOT_TOKEN=tu_token
TOMTOM_API_KEY=tu_clave
OPENWEATHER_API_KEY=tu_clave

# Seguridad
JWT_SECRET=tu_secreto_seguro_minimo_32_caracteres

# Manus
VITE_APP_ID=tu_app_id
OAUTH_SERVER_URL=https://api.manus.im
```

### Paso 4: Ejecutar

```bash
# Construir y ejecutar
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Detener
docker-compose down
```

---

## 🚀 Opción 3: Desplegar en Railway

### Paso 1: Conectar GitHub

1. Ve a [railway.app](https://railway.app)
2. Crea una nueva cuenta o inicia sesión
3. Haz clic en **New Project**
4. Selecciona **Deploy from GitHub**
5. Conecta tu repositorio

### Paso 2: Crear Variables de Entorno

En **Variables**, agrega:

```
NODE_ENV=production
TELEGRAM_BOT_TOKEN=tu_token
TOMTOM_API_KEY=tu_clave
OPENWEATHER_API_KEY=tu_clave
JWT_SECRET=tu_secreto
VITE_APP_ID=tu_app_id
OAUTH_SERVER_URL=https://api.manus.im
```

### Paso 3: Agregar Base de Datos

1. Haz clic en **Add Service**
2. Selecciona **MySQL**
3. Copia la URL de conexión
4. Agrega como variable `DATABASE_URL`

### Paso 4: Configurar Webhook

```bash
# Obtener URL de Railway
# Formato: https://tu-proyecto.up.railway.app

curl -X POST https://api.telegram.org/bot<TU_TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://tu-proyecto.up.railway.app/api/webhooks/telegram"}'
```

---

## 🌐 Opción 4: Desplegar en Render

### Paso 1: Conectar GitHub

1. Ve a [render.com](https://render.com)
2. Haz clic en **New +**
3. Selecciona **Web Service**
4. Conecta tu repositorio

### Paso 2: Configurar Servicio

```
Name: vias-bot
Environment: Node
Build Command: pnpm install && pnpm build
Start Command: node dist/index.js
```

### Paso 3: Agregar Variables

En **Environment**, agrega todas las variables necesarias

### Paso 4: Agregar Base de Datos

1. Crea un servicio MySQL en Render
2. Copia la URL de conexión
3. Agrega como `DATABASE_URL`

---

## ✅ Checklist de Despliegue

Antes de desplegar, verifica:

- [ ] Todas las variables de entorno configuradas
- [ ] Base de datos creada y accesible
- [ ] Migraciones ejecutadas (`pnpm db:push`)
- [ ] Tests pasando (`pnpm test`)
- [ ] Build sin errores (`pnpm build`)
- [ ] Webhook registrado en Telegram
- [ ] Dominio personalizado configurado (si aplica)
- [ ] SSL/HTTPS habilitado
- [ ] Backups de base de datos configurados

---

## 🔍 Verificar Despliegue

### 1. Probar Webhook

```bash
curl https://api.telegram.org/bot<TU_TOKEN>/getWebhookInfo
```

Respuesta esperada:
```json
{
  "ok": true,
  "result": {
    "url": "https://tu-dominio.com/api/webhooks/telegram",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "last_synchronization_unix_time": 1712607000
  }
}
```

### 2. Probar Bot en Telegram

1. Abre Telegram
2. Busca tu bot
3. Envía: `/ayuda`
4. Deberías recibir una respuesta

### 3. Probar Consultas

```
¿Cómo está el tráfico en la Calle 5?
Clima en Bogotá
```

### 4. Ver Logs

En tu plataforma de hosting:
- Manus: **Dashboard → Logs**
- Docker: `docker-compose logs -f app`
- Railway: **Deployments → View Logs**
- Render: **Logs**

---

## 🔒 Seguridad en Producción

### 1. Variables de Entorno

✅ **Nunca** commitees `.env` a Git
✅ Usa variables de entorno en tu plataforma
✅ Rota secretos regularmente

### 2. Base de Datos

✅ Usa contraseñas fuertes
✅ Habilita SSL en conexión
✅ Configura backups automáticos
✅ Limita acceso por IP

### 3. Webhook

✅ Valida que las solicitudes vengan de Telegram
✅ Usa HTTPS (obligatorio)
✅ Implementa rate limiting

### 4. Monitoreo

✅ Configura alertas de errores
✅ Monitorea uso de API
✅ Revisa logs regularmente

---

## 📊 Monitoreo en Producción

### Métricas Importantes

```
- Tiempo promedio de respuesta (< 5s)
- Tasa de éxito (> 95%)
- Uso de API (no exceder cuota)
- Errores por hora (< 5)
- Usuarios activos
- Consultas por día
```

### Alertas Recomendadas

```
- Webhook no responde
- Tasa de éxito < 90%
- Tiempo de respuesta > 10s
- Errores críticos
- Base de datos no accesible
```

---

## 🆘 Troubleshooting

### Bot no responde

1. Verifica webhook: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
2. Revisa logs del servidor
3. Verifica que la URL sea accesible desde internet
4. Comprueba variables de entorno

### Error de base de datos

1. Verifica conexión: `mysql -u usuario -p -h host`
2. Revisa migraciones: `pnpm db:push`
3. Comprueba `DATABASE_URL`
4. Verifica credenciales

### APIs lentas

1. Revisa logs de API
2. Comprueba cuota de APIs
3. Implementa caché
4. Considera upgrade de plan

### Errores de memoria

1. Aumenta RAM del servidor
2. Implementa garbage collection
3. Revisa memory leaks
4. Optimiza queries de base de datos

---

## 📈 Escalado

### Cuando necesites escalar:

1. **Aumentar servidor**: Más CPU/RAM
2. **Caché**: Redis para datos frecuentes
3. **Base de datos**: Replicación, sharding
4. **CDN**: Para assets estáticos
5. **Load balancer**: Múltiples instancias

---

## 🔄 Actualizar en Producción

```bash
# 1. Hacer cambios locales
git add .
git commit -m "feat: nueva funcionalidad"

# 2. Push a GitHub
git push origin main

# 3. Plataforma redeploy automáticamente
# (Si tienes CI/CD configurado)

# 4. O manual:
# - Manus: Click Publish
# - Docker: docker-compose up -d --build
# - Railway: Auto redeploy
# - Render: Auto redeploy
```

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los **logs**
2. Verifica **variables de entorno**
3. Comprueba **conectividad de APIs**
4. Contacta a **soporte de tu plataforma**

---

**Última actualización:** Abril 2026
**Versión:** 1.0.0
