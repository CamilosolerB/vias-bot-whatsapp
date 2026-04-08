# 🚀 Guía de Configuración: VíasBot Telegram

Esta guía te ayudará a configurar y poner en funcionamiento el bot de Telegram para consultar el estado de las vías en tiempo real.

---

## 📋 Requisitos Previos

Antes de comenzar, necesitarás:

1. **Cuenta de Telegram**: Descarga la app desde [telegram.org](https://telegram.org)
2. **Credenciales de API**:
   - Token del Bot de Telegram
   - Clave de API de TomTom
   - Clave de API de OpenWeatherMap
3. **Servidor o hosting**: Para ejecutar el bot (Manus, Railway, Render, etc.)

---

## 🔑 Paso 1: Obtener Credenciales de API

### 1.1 Token del Bot de Telegram

1. Abre Telegram y busca **@BotFather**
2. Envía el comando `/newbot`
3. Sigue las instrucciones:
   - Nombre del bot: `VíasBot` (o el que prefieras)
   - Usuario del bot: `vias_bot` (debe ser único y terminar en `_bot`)
4. Copia el **token** que te proporciona (ejemplo: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

**Guarda este token en un lugar seguro.**

### 1.2 Clave de API de TomTom

1. Ve a [developer.tomtom.com](https://developer.tomtom.com)
2. Crea una cuenta o inicia sesión
3. Ve a **My Account** → **API Keys**
4. Crea una nueva API Key
5. Copia la clave (ejemplo: `klwPRVA5cAEJdIMWUr9Higr9G7IoW7cX`)

**Asegúrate de habilitar:**
- Traffic API
- Geocoding API

### 1.3 Clave de API de OpenWeatherMap

1. Ve a [openweathermap.org](https://openweathermap.org)
2. Crea una cuenta o inicia sesión
3. Ve a **API Keys** en tu perfil
4. Copia tu **API Key** (ejemplo: `63372553ce4dcb158b7c525b2171056c`)

**Nota:** Si usas el plan gratuito, espera 10-15 minutos para que la clave se active.

---

## 🔧 Paso 2: Configurar Variables de Entorno

### En Manus (Recomendado)

1. Ve al panel de **Settings** → **Secrets**
2. Agrega las siguientes variables:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `TELEGRAM_BOT_TOKEN` | Tu token de BotFather | Token del bot de Telegram |
| `TOMTOM_API_KEY` | Tu clave de TomTom | Clave de API de TomTom |
| `OPENWEATHER_API_KEY` | Tu clave de OpenWeather | Clave de API de OpenWeatherMap |

3. Guarda los cambios

### En Servidor Local (Desarrollo)

1. Crea un archivo `.env` en la raíz del proyecto:

```bash
TELEGRAM_BOT_TOKEN=tu_token_aqui
TOMTOM_API_KEY=tu_clave_tomtom_aqui
OPENWEATHER_API_KEY=tu_clave_openweather_aqui
```

2. Nunca commits este archivo a Git (ya está en `.gitignore`)

---

## 🌐 Paso 3: Configurar el Webhook

El webhook es la URL donde Telegram envía los mensajes de los usuarios.

### 3.1 Obtener la URL del Webhook

Si usas **Manus**, tu URL será:
```
https://tu-proyecto.manus.space/api/webhooks/telegram
```

Si usas otro hosting, será similar:
```
https://tu-dominio.com/api/webhooks/telegram
```

### 3.2 Registrar el Webhook en Telegram

Ejecuta este comando en tu terminal (reemplaza los valores):

```bash
curl -X POST https://api.telegram.org/bot<TU_TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://tu-proyecto.manus.space/api/webhooks/telegram"}'
```

**Respuesta esperada:**
```json
{"ok": true, "result": true, "description": "Webhook was set"}
```

### 3.3 Verificar el Webhook

```bash
curl https://api.telegram.org/bot<TU_TOKEN>/getWebhookInfo
```

**Respuesta esperada:**
```json
{
  "ok": true,
  "result": {
    "url": "https://tu-proyecto.manus.space/api/webhooks/telegram",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "ip_address": "...",
    "last_error_date": 0,
    "last_error_message": "",
    "last_synchronization_unix_time": 1234567890
  }
}
```

---

## ✅ Paso 4: Verificar que Todo Funciona

### 4.1 Probar el Bot

1. Abre Telegram
2. Busca tu bot por su usuario (ej: `@vias_bot`)
3. Envía un mensaje de prueba:
   ```
   /ayuda
   ```

4. Deberías recibir una respuesta con las opciones disponibles

### 4.2 Probar Consultas

Intenta estas consultas:

```
¿Cómo está el tráfico en la Calle 5?
Clima en Bogotá
Hay un accidente en la Carrera 7
```

---

## 📊 Paso 5: Monitorear el Bot

### Ver Logs

En Manus, ve a **Dashboard** para ver:
- Consultas recientes
- Errores
- Estadísticas de uso
- Logs de API

### Comandos Útiles

**Ver información del bot:**
```bash
curl https://api.telegram.org/bot<TU_TOKEN>/getMe
```

**Ver estadísticas de webhook:**
```bash
curl https://api.telegram.org/bot<TU_TOKEN>/getWebhookInfo
```

**Eliminar webhook (si necesitas cambiar):**
```bash
curl -X POST https://api.telegram.org/bot<TU_TOKEN>/deleteWebhook
```

---

## 🐛 Solución de Problemas

### El bot no responde

**Problema:** Envío un mensaje pero el bot no responde

**Soluciones:**
1. Verifica que el webhook esté registrado correctamente
2. Revisa los logs en el dashboard
3. Asegúrate de que las credenciales de API sean válidas
4. Espera 5-10 segundos (el bot procesa en background)

### Error: "Webhook was not set"

**Problema:** Al registrar el webhook, recibo un error

**Soluciones:**
1. Verifica que el token sea correcto
2. Asegúrate de que la URL sea accesible desde internet
3. Comprueba que el servidor esté ejecutándose
4. Intenta con `curl` para verificar la URL

### Error: "Invalid API Key"

**Problema:** Las consultas de tráfico/clima fallan

**Soluciones:**
1. Verifica que las claves de API sean correctas
2. Asegúrate de que las claves estén activas (espera 10-15 min después de crearlas)
3. Comprueba que tengas cuota disponible en las APIs
4. Revisa los logs para ver el error exacto

### El bot responde lentamente

**Problema:** Las respuestas tardan más de 10 segundos

**Soluciones:**
1. Verifica la velocidad de internet
2. Comprueba que las APIs externas estén funcionando
3. Revisa los logs para ver dónde se consume más tiempo
4. Considera usar caché para ubicaciones frecuentes

---

## 🔒 Seguridad

### Mejores Prácticas

1. **Nunca compartas tu token** de bot
2. **Usa variables de entorno** para credenciales
3. **Habilita HTTPS** en tu servidor
4. **Valida** todos los mensajes entrantes
5. **Implementa rate limiting** para evitar abuso

### Revocar un Token Comprometido

Si tu token se ve comprometido:

1. Abre BotFather en Telegram
2. Envía `/mybots`
3. Selecciona tu bot
4. Envía `/revoke`
5. Crea un nuevo bot con `/newbot`

---

## 📈 Próximos Pasos

Una vez que el bot esté funcionando:

1. **Agregar rutas frecuentes**: Configura rutas que usas regularmente
2. **Personalizar respuestas**: Ajusta el formato de las respuestas
3. **Implementar notificaciones**: Recibe alertas de tráfico
4. **Agregar más funciones**: Historial, favoritos, etc.

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los **logs** en el dashboard
2. Consulta la **documentación** de las APIs
3. Verifica que todas las **credenciales** sean correctas
4. Contacta al **soporte** de Manus o tu proveedor de hosting

---

## 🎉 ¡Listo!

Tu bot de Telegram está configurado y funcionando. 

**Próximo paso:** Lee el [TUTORIAL.md](./TUTORIAL.md) para aprender cómo usar el bot.

---

**Última actualización:** Abril 2026
**Versión:** 1.0.0
