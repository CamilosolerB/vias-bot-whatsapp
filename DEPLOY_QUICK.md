# ⚡ Guía Rápida de Despliegue: VíasBot

**Desplegar en 10 minutos. Elige tu plataforma favorita.**

---

## 🎯 Opción 1: Manus (MÁS FÁCIL - RECOMENDADO)

### Paso 1: Preparar (2 min)

```bash
# En tu proyecto local
pnpm build
pnpm test
```

### Paso 2: Configurar Secretos (3 min)

En el panel de Manus → **Settings → Secrets**, agrega:

```
TELEGRAM_BOT_TOKEN = 8758321769:AAFbcyq3V7DLec-fCgOAayPEnRMqgYYYYUo
TOMTOM_API_KEY = klwPRVA5cAEJdIMWUr9Higr9G7IoW7cX
OPENWEATHER_API_KEY = 63372553ce4dcb158b7c525b2171056c
```

### Paso 3: Registrar Webhook (3 min)

En tu terminal:

```bash
TELEGRAM_TOKEN="8758321769:AAFbcyq3V7DLec-fCgOAayPEnRMqgYYYYUo"
WEBHOOK_URL="https://tu-proyecto.manus.space/api/webhooks/telegram"

curl -X POST https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${WEBHOOK_URL}\"}"
```

### Paso 4: Publicar (2 min)

En el panel de Manus:
1. Haz clic en **Publish** (esquina superior derecha)
2. ¡Listo! ✅

---

## 🐳 Opción 2: Docker Local

### Paso 1: Crear .env (1 min)

```bash
cp docker-compose.yml .env.local
```

Edita `.env.local`:
```
TELEGRAM_BOT_TOKEN=tu_token
TOMTOM_API_KEY=tu_clave
OPENWEATHER_API_KEY=tu_clave
MYSQL_ROOT_PASSWORD=tu_contraseña
JWT_SECRET=tu_secreto_32_caracteres
```

### Paso 2: Ejecutar (2 min)

```bash
docker-compose up -d
```

### Paso 3: Verificar (1 min)

```bash
# Ver logs
docker-compose logs -f app

# Probar
curl http://localhost:3000/health
```

### Paso 4: Registrar Webhook (2 min)

```bash
TELEGRAM_TOKEN="tu_token"
WEBHOOK_URL="https://tu-dominio.com/api/webhooks/telegram"

curl -X POST https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${WEBHOOK_URL}\"}"
```

---

## 🚀 Opción 3: Railway (5 min)

### Paso 1: Conectar GitHub (2 min)

1. Ve a [railway.app](https://railway.app)
2. Haz clic en **New Project**
3. Selecciona **Deploy from GitHub**
4. Conecta tu repositorio

### Paso 2: Agregar Base de Datos (1 min)

1. Haz clic en **Add Service**
2. Selecciona **MySQL**
3. Copia la URL de conexión

### Paso 3: Configurar Variables (2 min)

En **Variables**, agrega:

```
TELEGRAM_BOT_TOKEN=tu_token
TOMTOM_API_KEY=tu_clave
OPENWEATHER_API_KEY=tu_clave
JWT_SECRET=tu_secreto
DATABASE_URL=la_url_de_mysql
```

### Paso 4: Registrar Webhook (1 min)

Obtén tu URL de Railway (ej: `https://tu-proyecto.up.railway.app`)

```bash
curl -X POST https://api.telegram.org/bot<TU_TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://tu-proyecto.up.railway.app/api/webhooks/telegram"}'
```

---

## 🌐 Opción 4: Render (5 min)

### Paso 1: Conectar GitHub (2 min)

1. Ve a [render.com](https://render.com)
2. Haz clic en **New +**
3. Selecciona **Web Service**
4. Conecta tu repositorio

### Paso 2: Configurar Servicio (1 min)

```
Name: vias-bot
Environment: Node
Build Command: pnpm install && pnpm build
Start Command: node dist/index.js
```

### Paso 3: Agregar Base de Datos (1 min)

1. Crea servicio MySQL en Render
2. Copia la URL de conexión

### Paso 4: Configurar Variables (1 min)

En **Environment**, agrega todas las variables necesarias

---

## ✅ Verificar que Funciona

### 1. Probar Webhook

```bash
curl https://api.telegram.org/bot<TU_TOKEN>/getWebhookInfo
```

Deberías ver:
```json
{
  "ok": true,
  "result": {
    "url": "https://tu-dominio.com/api/webhooks/telegram",
    "pending_update_count": 0
  }
}
```

### 2. Probar Bot en Telegram

1. Abre Telegram
2. Busca tu bot
3. Envía: `/ayuda`
4. ¡Deberías recibir una respuesta!

### 3. Probar Consulta

```
¿Cómo está el tráfico en la Calle 5?
```

---

## 🆘 Si Algo No Funciona

| Problema | Solución |
|----------|----------|
| Bot no responde | Verifica webhook: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo` |
| Error de API | Verifica que las claves sean válidas |
| Base de datos no conecta | Verifica `DATABASE_URL` |
| Respuesta lenta | Espera 5-10 segundos, el bot procesa en background |

---

## 📊 Estructura de Despliegue

```
Tu Dominio (HTTPS)
    ↓
Webhook: /api/webhooks/telegram
    ↓
Express Server (Node.js)
    ↓
Telegram Bot API ← → TomTom API
                 ← → OpenWeatherMap API
                 ← → Base de Datos MySQL
```

---

## 🔒 Seguridad Mínima

- ✅ Usa HTTPS (obligatorio)
- ✅ Guarda credenciales en variables de entorno
- ✅ No commitees `.env` a Git
- ✅ Usa contraseñas fuertes
- ✅ Rota secretos regularmente

---

## 📞 Soporte

- **Manus**: Panel de control integrado
- **Docker**: `docker-compose logs -f`
- **Railway**: Logs en dashboard
- **Render**: Logs en dashboard

---

## 🎉 ¡Listo!

Tu bot está en producción. Ahora puedes:

✅ Consultar tráfico en tiempo real
✅ Ver clima actualizado
✅ Reportar incidentes
✅ Monitorear en dashboard

**¡Disfruta usando VíasBot!** 🚀
